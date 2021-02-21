function getInstrument(instrument, requiredLevel, symbol, label = instrument.charAt(0).toUpperCase() + instrument.slice(1)) {
	if (getJobLevel("distill").lt(requiredLevel)) {
		return null;
	}
	return ["row", [
		["column", [
			["buyable", instrument],
			["display-text", `<button class="smallUpg${layers.distill.buyables[instrument].canAfford() ? " can" : " locked"}" style="width: 175px; background: ${layers.distill.buyables[instrument].canAfford() ? distillColor : "#bf8f8f"}; border-radius: 20px; color: black;" onClick="layers.distill.buyables.${instrument}.buyMax()">Buy Max</button>`]
		]],
		"blank",
		["display-text", `<div class="instrument" style="--instrument-progress: ${player.distill.anims ? Decimal.times(player.distill[`${instrument}Progress`], buyableEffect("distill", instrument)).times(100).toFixed(2) : 0}%">
			<span>${label}</span><br/>
			<span class="instrumentLogo">${symbol}</span><br/>
			<span>x${format(player.distill[`${instrument}Completions`].div(100).add(1))}</span>
		</div>`]
	]];
}

function getInstrumentBuyable(id, title, baseSpeed, baseCost, costExponent) {
	return {
		title: `${title}<br/>`,
		style: {
			width: "175px",
			height: "175px"
		},
		display() {
			return `Make retort finish ${format(baseSpeed, 3)} more times/sec.<br/>(Capped at ${format(baseSpeed.times(100))})${getBuyableAmount("distill", id).lt(100) ? `<br/><br/>Currently: ${format(this.effect())}<br/><br/>Cost: ${format(this.cost())} essentia` : ""}`;
		},
		cost(x) {
			const amount = x || getBuyableAmount("distill", id);
			return new Decimal(baseCost).times(new Decimal(costExponent).pow(amount));
		},
		buyMax() {
			const amount = getBuyableAmount("distill", id);
			const amountAffordable = player.distill.points.times(costExponent.sub(1)).div(new Decimal(baseCost).times(Decimal.pow(costExponent, amount))).add(1).log(costExponent).floor().clamp(0, Decimal.sub(100, amount));
			const cost = baseCost.times(costExponent.pow(amount).times(costExponent.pow(amountAffordable).sub(1))).div(costExponent.sub(1));
			player.distill.points = player.distill.points.sub(cost);
			setBuyableAmount("distill", id, amount.add(amountAffordable));
		},
		effect() {
			let speed = new Decimal(baseSpeed);
			speed = speed.times(getBuyableAmount("distill", id));
			return speed;
		},
		canAfford() {
			return player.distill.points.gte(this.cost()) && getBuyableAmount("distill", id).lt(100);
		},
		buy() {
			player.distill.points = player.distill.points.sub(this.cost());
			setBuyableAmount("distill", id, getBuyableAmount("distill", id).add(1));
		},
		unlocked: true
	};
}

function updateInstrument(instrument, requiredLevel, diff) {
	if (getJobLevel("distill").lt(requiredLevel) || buyableEffect("distill", instrument).eq(0)) {
		return;
	}
	player.distill[`${instrument}Progress`] = player.distill[`${instrument}Progress`].add(diff);
	const completionDuration = Decimal.div(1, buyableEffect("distill", instrument));
	const completions = player.distill[`${instrument}Progress`].div(completionDuration).floor();
	if (completions.gt(0)) {
		player.distill[`${instrument}Progress`] = player.distill[`${instrument}Progress`].sub(completionDuration.times(completions));
		player.distill[`${instrument}Completions`] = player.distill[`${instrument}Completions`].add(completions);
		addPoints("distill", completions.times(getEssentiaMult()));
	}
}

function getEssentiaMult() {
	let gain = new Decimal(1);
	gain = gain.times(player.distill.retortCompletions.div(100).add(1));
	gain = gain.times(player.distill.alembicCompletions.div(100).add(1));
	gain = gain.times(player.distill.crucibleCompletions.div(100).add(1));
	gain = gain.times(player.distill.bainMarieCompletions.div(100).add(1));
	gain = gain.times(player.distill.vapoursCompletions.div(100).add(1));
	if (player.generators.distillActive) {
		gain = gain.sqrt();
	}
	return gain;
}

addLayer("distill", {
	name: "distill",
	resource: "essentia",
	image: "images/PIXNIO-252785-4924x3283.jpg",
	color: distillColor,
	jobName: "Distill flowers",
	showJobDelay: 0.25,
	layerShown: () => player.chapter > 1 && hasMilestone("flowers", 4),
	startData() {
		return {
			unlocked: true,
			points: new Decimal(0),
			total: new Decimal(0),
			xp: new Decimal(0),
			lastLevel: new Decimal(0),
			anims: true,
			timeLoopActive: false,
			retortProgress: new Decimal(0),
			retortCompletions: new Decimal(0),
			alembicProgress: new Decimal(0),
			alembicCompletions: new Decimal(0),
			crucibleProgress: new Decimal(0),
			crucibleCompletions: new Decimal(0),
			bainMarieProgress: new Decimal(0),
			bainMarieCompletions: new Decimal(0),
			vapoursProgress: new Decimal(0),
			vapoursCompletions: new Decimal(0)
		};
	},
	tabFormat: () => [
		"main-display",
		["display-text", `You are getting ${format(getEssentiaMult())} essentia every time an instrument finishes.`],
		"blank",
		["display-text", (() => {
			if (!hasMilestone("distill", 0)) {
				return "Discover new ways to harness the power of the flower essence at level 2";
			}
			if (!hasMilestone("distill", 1)) {
				return "Discover new ways to harness the power of the flower essence at level 4";
			}
			if (!hasMilestone("distill", 3)) {
				return "Discover new ways to harness the power of the flower essence at level 6";
			}
			if (!hasMilestone("distill", 4)) {
				return "Discover new ways to harness the power of the flower essence at level 8";
			}
			return "";
		})()],
		"blank",
		["row", [
			["display-text", "Animations"],
			"blank",
			["toggle", ["distill", "anims"]]
		]],
		"blank",
		getInstrument("retort", 0, "🝭"),
		"blank",
		getInstrument("alembic", 2, "🝪"),
		"blank",
		getInstrument("crucible", 4, "🝧"),
		"blank",
		getInstrument("bainMarie", 6, "🝫", "Bain-Marie"),
		"blank",
		getInstrument("vapours", 8, "🝬", "Bath of Vapours"),
		"blank",
		["milestones-filtered", [2, 5, 6]]
	],
	update(diff) {
		if (player.tab === this.layer || player[this.layer].timeLoopActive) {
			if (player.generators.distillActive) {
				diff = new Decimal(diff).div(10);
			}
			updateInstrument("retort", 0, diff);
			updateInstrument("alembic", 2, diff);
			updateInstrument("crucible", 4, diff);
			updateInstrument("bainMarie", 6, diff);
			updateInstrument("vapours", 8, diff);
		}
		let jobLevel = new Decimal(getJobLevel(this.layer));
		if (jobLevel.neq(player[this.layer].lastLevel)) {
			doPopup("none", `Level ${jobLevel}`, "Level Up!", 3, layers[this.layer].color);
			player[this.layer].lastLevel = jobLevel;
		}
	},
	onAddPoints(gain) {
		let xpGain = gain;
		player[this.layer].xp = player[this.layer].xp.add(xpGain);
	},
	milestones: {
		0: {
			requirementDescription: "Level 2",
			done: () => player.distill.xp.gte(10)
		},
		1: {
			requirementDescription: "Level 4",
			done: () => player.distill.xp.gte(1e3)
		},
		2: {
			title: "\"The only true wisdom consists in knowing that you know nothing.\"",
			requirementDescription: "Level 5",
			"effectDescription": "Unlock studying job",
			done: () => player.distill.xp.gte(1e4)
		},
		3: {
			requirementDescription: "Level 6",
			done: () => player.distill.xp.gte(1e5)
		},
		4: {
			requirementDescription: "Level 8",
			done: () => player.distill.xp.gte(1e7)
		},
		5: {
			title: "That's us, dude!",
			requirementDescription: "Level 10",
			"effectDescription": "Unlock time experiments job",
			done: () => player.distill.xp.gte(1e9),
			unlocked: () => hasMilestone("distill", 2)
		},
		6: {
			title: "Oh, yeah!",
			requirementDescription: "Level 25",
			"effectDescription": "Unlock ???",
			done: () => player.distill.xp.gte(1e24) && player.chapter > 2,
			unlocked: () => hasMilestone("distill", 5) && player.chapter > 2
		}
	},
	buyables: {
		retort: getInstrumentBuyable("retort", "Be excellent to each other.", new Decimal(0.06), new Decimal(10), new Decimal(1.05)),
		alembic: getInstrumentBuyable("alembic", "EXCELLENT!", new Decimal(0.03), new Decimal(100), new Decimal(1.1)),
		crucible: getInstrumentBuyable("crucible", "Party on dudes!", new Decimal(0.02), new Decimal(1000), new Decimal(1.15)),
		bainMarie: getInstrumentBuyable("bainMarie", "Greetings, my excellent friends.", new Decimal(0.015), new Decimal(10000), new Decimal(1.2)),
		vapours: getInstrumentBuyable("vapours", "Most outstanding, Rufus! Let's jam!", new Decimal(0.012), new Decimal(100000), new Decimal(1.25))
	}
});
