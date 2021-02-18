addLayer("flowers", {
	name: "flowers",
	resource: "flowers",
	image: "images/white-orchid-1974498_1920.jpg",
	color: flowersColor,
	jobName: "Collecting flowers",
	showJobDelay: 0,
	layerShown: true,
	startData() {
		return {
			unlocked: true,
			points: new Decimal(1),
			xp: new Decimal(1),
			lastLevel: new Decimal(1),
			realTime: 0,
			timeLoopActive: false
		};
	},
	getResetGain() {
		if (!tmp[this.layer].layerShown || (player.tab !== this.layer && !player[this.layer].timeLoopActive)) {
			return new Decimal(0);
		}
		if (player.chapter === 1 && hasMilestone("flowers", "4")) {
			return new Decimal(0);
		}
		let gain = new Decimal(1);
		gain = gain.times(new Decimal(1.1).pow(getJobLevel(this.layer)));
		if (hasUpgrade("flowers", 11)) {
			gain = gain.times(upgradeEffect("flowers", 11));
		}
		if (hasUpgrade("flowers", 12)) {
			gain = gain.times(upgradeEffect("flowers", 12));
		}
		if (hasUpgrade("flowers", 14)) {
			gain = gain.times(upgradeEffect("flowers", 14));
		}
		gain = gain.times(buyableEffect("flowers", 11));
		gain = gain.pow(buyableEffect("flowers", 13));
		return gain;
	},
	passiveGeneration: new Decimal(1),
	tabFormat: [
		"main-display",
		["display-text", () => `You are collecting <span style="color: ${flowersColor}; text-shadow: ${flowersColor} 0 0 10px">${format(tmp.flowers.getResetGain)}</span> flowers per second`],
		"blank",
		["display-text", () => {
			if (player.flowers.xp.lte(1e3)) {
				return "There's a very large field of flowers";
			}
			if (player.flowers.xp.lte(1e5)) {
				return "A small patch is missing from the field of flowers";
			}
			if (player.flowers.xp.lte(1e7)) {
				return "A medium patch is missing from the field of flowers";
			}
			if (player.flowers.xp.lte(4e8)) {
				return "A large patch is missing from the field of flowers";
			}
			if (player.flowers.xp.lte(9e8)) {
				return "The field of flowers looks about half way picked";
			}
			if (player.flowers.xp.lte(1e9)) {
				return "There are very few flowers left";
			}
			if (player.flowers.xp.gte(1e9) && player.chapter === 1) {
				return "The field is barren";
			}
			return "";
		}],
		"blank",
		["display-text", () => {
			if (!hasMilestone("flowers", 0)) {
				return "Discover new ways to harness the flower's power at level 2";
			}
			if (!hasMilestone("flowers", 1)) {
				return "Discover new ways to harness the flower's power at level 4";
			}
			if (!hasMilestone("flowers", 2)) {
				return "Discover new ways to harness the flower's power at level 6";
			}
			if (!hasMilestone("flowers", 3)) {
				return "Discover new ways to harness the flower's power at level 8";
			}
			if (!hasMilestone("flowers", 4)) {
				return "Discover new ways to harness the flower's power at level 10";
			}
			return "";
		}],
		() => player.chapter === 1 && hasMilestone("flowers", "4") ? ["upgrade", "nextChapter"] : null,
		"blank",
		"buyables",
		"blank",
		"upgrades",
		"blank",
		["milestones-filtered", [4, 5]]
	],
	update(diff) {
		if (player.tab === this.layer || player[this.layer].timeLoopActive) {
			player[this.layer].realTime += diff;
		}
		let jobLevel = new Decimal(getJobLevel(this.layer));
		if (jobLevel.neq(player[this.layer].lastLevel) && player[this.layer].lastLevel.lte(100)) {
			doPopup("none", `Level ${formatWhole(jobLevel)}`, "Level Up!", 3, layers[this.layer].color);
			player[this.layer].lastLevel = jobLevel;
		}
	},
	onAddPoints(gain) {
		let xpGain = gain;
		if (hasUpgrade(this.layer, 13)) {
			xpGain = xpGain.times(upgradeEffect(this.layer, 13));
		}
		xpGain = xpGain.times(buyableEffect("flowers", 12));
		player[this.layer].xp = player[this.layer].xp.add(xpGain);
	},
	milestones: {
		0: {
			requirementDescription: "Level 2",
			done: () => player.flowers.xp.gte(10)
		},
		1: {
			requirementDescription: "Level 4",
			done: () => player.flowers.xp.gte(1e3)
		},
		2: {
			requirementDescription: "Level 6",
			done: () => player.flowers.xp.gte(1e5)
		},
		3: {
			requirementDescription: "Level 8",
			done: () => player.flowers.xp.gte(1e7)
		},
		4: {
			title: "The story was so fantastic and incredible,",
			requirementDescription: "Level 10",
			"effectDescription": "Unlock study flowers job",
			done: () => player.flowers.xp.gte(1e9),
			unlocked: () => player.chapter > 1
		},
		5: {
			title: "the telling so credible and sober",
			requirementDescription: "Level 25",
			"effectDescription": "Unlock ???",
			done: () => player.flowers.xp.gte(1e24),
			unlocked: () => player.chapter > 2
		}
	},
	buyables: {
		rows: 1,
		cols: 3,
		11: {
			title: "I tried to look at the thing in a scientific spirit<br/>",
			display() {
				return `Each casting of this spell increases its cost, and makes collecting flowers 50% faster.<br/><br/>Currently: x${format(this.effect())}<br/><br/>Cost: ${format(this.cost())} flowers`;
			},
			cost(x) {
				const amount = x || getBuyableAmount(this.layer, this.id);
				if (amount.gte(10)) {
					// goes up 10x instead of 3x after 10 levels
					return new Decimal(1000).times(new Decimal(3).pow(10)).add(Decimal.pow(10, amount.sub(10)));
				}
				return new Decimal(1000).times(new Decimal(3).pow(amount));
			},
			effect() {
				return new Decimal(1.5).pow(getBuyableAmount(this.layer, this.id));
			},
			canAfford() {
				return player[this.layer].points.gte(this.cost());
			},
			buy() {
				player[this.layer].points = player[this.layer].points.sub(this.cost());
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1));
			},
			unlocked: () => hasMilestone("flowers", 1)
		},
		12: {
			title: "Why should I trouble myself?<br/>",
			display() {
				return `Each casting of this spell increases its cost, and doubles experience gain.<br/><br/>Currently: x${format(this.effect())}<br/><br/>Cost: ${format(this.cost())} flowers`;
			},
			cost(x) {
				return new Decimal(10000).times(new Decimal(4).pow(x || getBuyableAmount(this.layer, this.id)));
			},
			effect() {
				return new Decimal(2).pow(getBuyableAmount(this.layer, this.id));
			},
			canAfford() {
				return player[this.layer].points.gte(this.cost());
			},
			buy() {
				player[this.layer].points = player[this.layer].points.sub(this.cost());
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1));
			},
			unlocked: () => hasMilestone("flowers", 2)
		},
		13: {
			title: "And there was Weena dancing at my side!<br/>",
			display() {
				return `Each casting of this spell increases its cost, and raises flower collection rate to an additive +.05 power (softcapped immediately).<br/><br/>Currently: ^${format(this.effect())}<br/><br/>Cost: ${format(this.cost())} flowers`;
			},
			cost(x) {
				return new Decimal(250000).times(new Decimal(10).pow(x || getBuyableAmount(this.layer, this.id)));
			},
			effect() {
				return new Decimal(.05).times(getBuyableAmount(this.layer, this.id).pow(.6)).add(1);
			},
			canAfford() {
				return player[this.layer].points.gte(this.cost());
			},
			buy() {
				player[this.layer].points = player[this.layer].points.sub(this.cost());
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1));
			},
			unlocked: () => hasMilestone("flowers", 3)
		}
	},
	upgrades: {
		rows: 1,
		cols: 4,
		nextChapter: {
			title: "And those that carry us forward, are dreams.<br/>",
			description: "Close the time loop.",
			unlocked: true,
			onPurchase() {
				showTab("none");
				player.chapter = 2;
				player.timeSlots = new Decimal(1);
			}
		},
		11: {
			title: "A chain of beautiful flowers<br>",
			description: "Increase collection speed based on how many flowers you have<br>",
			cost: new Decimal(10),
			effect: () => player.flowers.points.clampMin(1).pow(0.1).add(1),
			unlocked: () => hasMilestone("flowers", 0),
			effectDisplay() {
				return `x${format(this.effect())}`;
			}
		},
		12: {
			title: "A big garland of flowers<br>",
			description: "Increase collection speed based on your collecting flowers level",
			cost: new Decimal(100),
			effect: () => new Decimal(getJobLevel("flowers")).pow(2).div(10).add(1),
			unlocked: () => hasMilestone("flowers", 0),
			effectDisplay() {
				return `x${format(this.effect())}`;
			}
		},
		13: {
			title: "Weena's Gift<br>",
			description: "Increase experience gain based on real time spent collecting flowers",
			cost: new Decimal(250),
			effect: () => new Decimal(player.flowers.realTime).div(100).add(1),
			unlocked: () => hasMilestone("flowers", 0),
			effectDisplay() {
				return `x${format(this.effect())}`;
			}
		},
		14: {
			title: "White Sphinx<br>",
			description: "Increase flower collection based on the number of upgrades bought",
			cost: new Decimal(500),
			effect: () => Decimal.pow(1.5, player.flowers.upgrades.length),
			unlocked: () => hasMilestone("flowers", 0),
			effectDisplay() {
				return `x${format(this.effect())}`;
			}
		}
	}
});

// Names to use
// - https://www.shmoop.com/study-guides/literature/time-machine-hg-wells/quotes
//
// - delicate flowers
// - waste garden
// - subjugation of nature
//
// - common sense of the morning
//
// - pain and necessity
// - languor and decay
// - abominable desolation
//
// - Time is only a kind of Space
// - Futility of all ambition
