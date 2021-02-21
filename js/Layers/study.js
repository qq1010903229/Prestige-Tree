function createCard(title, description = "", onDraw = null, modifyNextCard = null) {
	return { title, description, onDraw, modifyNextCard };
}

const cardLevel = (card) => {
	return (getBuyableAmount("study", card) || new Decimal(0)).add(player.study.deep);
};

const cards = {
	nothing: createCard("His job is not to wield power but to draw attention away from it.", "Do nothing."),
	gainPoints: createCard("Don't Panic.", level => `Successfully study ${format(getResetGain("study").times(level.add(1)))} properties.`, level => addPoints("study", getResetGain("study").times(level.add(1)))),
	gainBigPoints: createCard("In his experience the Universe simply didn't work like that.", level => `Successfully study ${format(getResetGain("study").times(level.add(1)).pow(1.2))} properties. Destroy this card.`, (level, canDestroy = true) => {
		addPoints("study", getResetGain("study").times(level.add(1)).pow(1.2));
		if (canDestroy) {
			const index = player.study.cards.indexOf("gainBigPoints");
			if (index >= 0) {
				player.study.cards.splice(index, 1);
			}
		}
	}),
	gainInsight: createCard("And it shall be called... the Earth.", level => level == 0 ? "Gain a key insight." : `Gain ${formatWhole(level.add(1))} key insights.`, level => {
		player.study.insights = player.study.insights.add(level).add(1);
		player.study.xp = player.study.xp.add(level.add(1).times(10));
	}),
	gainBigInsight: createCard("Yes! I shall design this computer for you.", level => `Gain ${new Decimal(player.study.cards.length).times(level.add(1)).sqrt().floor()} key insights.<br/>(based on number of cards in the deck)`, level => {
		const amount = new Decimal(player.study.cards.length).times(level.add(1)).sqrt().floor();
		player.study.insights = player.study.insights.add(amount);
		player.study.xp = player.study.xp.add(amount.times(10));
	}),
	playTwice: createCard("Oh no, not again.", level => level == 0 ? "Play the next card twice." : `Play the next card twice, with the effect boosted by ${level.div(4)} levels.`, null, (nextCard, level) => {
		if (nextCard in cards && cards[nextCard].onDraw) {
			cards[nextCard].onDraw(cardLevel(nextCard).add(level.div(4)));
			cards[nextCard].onDraw(cardLevel(nextCard).add(level.div(4)), false);
		}
	}),
	increasePointsGain: createCard("Have another drink, enjoy yourself.", level => {
		const effect = softcap(player.study.increasePointsGain, new Decimal(100).times(level.add(1))).times(10);
		let text = `Permanently increase studied properties gain by 10%.<br/><br/>Currently: +${formatWhole(effect)}%`;
		if (player.study.increasePointsGain.gt(new Decimal(100).times(level.add(1)))) {
			text = text + "<br/>(softcapped)";
		}
		return text;
	}, () => player.study.increasePointsGain = player.study.increasePointsGain.add(1)),
	multiplyPointsGain: createCard("Reality is frequently inaccurate.", level => {
		const effect = new Decimal(1.02).pow(softcap(player.study.multiplyPointsGain, new Decimal(100).times(level.div(4).add(1)), .2));
		let text = `Permanently multiply studied properties gain by x1.02<br/><br/>Currently: x${format(effect)}`;
		if (player.study.multiplyPointsGain.gt(new Decimal(100).times(level.div(4).add(1)))) {
			text = text + "<br/>(softcapped)";
		}
		return text;
	}, () => player.study.multiplyPointsGain = player.study.multiplyPointsGain.add(1)),
	sellDiscount: createCard("It doesn't grow on trees you know.", level => {
		const effect = new Decimal(0.98).pow(softcap(player.study.sellDiscount, new Decimal(100).times(level.div(2).add(1)), .5));
		let text = `Permanently multiply sell cost by 0.98<br/><br/>Currently: x${format(effect)}`;
		if (player.study.sellDiscount.gt(new Decimal(100).times(level.div(2).add(1)))) {
			text = text + "<br/>(softcapped)";
		}
		return text;
	}, () => player.study.sellDiscount = player.study.sellDiscount.add(1)),
	soldOut: createCard("Out of Stock!"),
	gainXp: createCard("A billion times over ... and no one learns anything.", level => `Gain xp equal to ${level == 0 ? "" : `${format(level.div(4).add(1))}x times `}your number of properties.`, level => player.study.xp = player.study.xp.add(player.study.points.times(level.div(4).add(1))))
};

const shopCards = [
	{ card: "gainPoints", price: 1 },
	{ card: "gainInsight", price: 2 },
	{ card: "gainBigPoints", price: 8 },
	{ card: "gainBigInsight", price: 13 },
	{ card: "playTwice", price: 16 },
	{ card: "increasePointsGain", price: 6 },
	{ card: "multiplyPointsGain", price: 18 },
	{ card: "sellDiscount", price: 14 },
	{ card: "gainXp", price: 25 },
];

const baseCards = () => {
	return [ "nothing", "nothing", "nothing", "nothing", "gainPoints", "gainPoints", "gainPoints", "gainPoints", "gainInsight", "gainInsight" ];
};

const getShop = (numCards = 3) => {
	return new Array(numCards).fill(1).map(() => shopCards[Math.floor(Math.random() * shopCards.length)]);
};

const cardFormat = (card, id = "", className = "", onclick = "", overrideLevel = "", width = "200px", height = "300px") => {
	return card == null ? null : ["display-text", `
		<div id="${id}" class="card ${className}" style="width: ${width}; height: ${height};" onclick="${onclick}">
			<span style="border-bottom: 1px solid white; margin: 0; max-height: calc(50% - 30px); padding-bottom: 10px;">
				<h3>${isFunction(cards[card].title) ? cards[card].title(overrideLevel || cardLevel(card)) : cards[card].title}</h3>
			</span>
			<span style="flex-basis: 0%;"><span>${isFunction(cards[card].description) ? cards[card].description(overrideLevel || cardLevel(card)) : cards[card].description}</span></span>
			<span style="flex-shrink: 1"></span>
			<img src="images/Time2wait.svg"/>
		</div>`];
};

function getCardUpgradeBuyable(id) {
	const cost = x => {
		const amount = x || getBuyableAmount("study", id);
		return new Decimal(100).pow(amount.add(1));
	};
	return {
		title: "Upgrade card<br/>",
		style: {
			width: "150px",
			height: "150px"
		},
		display() {
			return `Currently: Level ${formatWhole(cardLevel(id))}<br/><br/>Cost: ${format(cost())} insights`;
		},
		canAfford() {
			return player.study.insights.gte(cost());
		},
		buy() {
			player.study.insights = player.study.insights.sub(cost());
			setBuyableAmount("study", id, getBuyableAmount("study", id).add(1));
		},
		unlocked: true
	};
}

function purchaseCard(index) {
	const { card, price } = player.study.shop[index];
	if (card && player.study.insights.gte(price)) {
		player.study.insights = player.study.insights.sub(price);
		player.study.shop[index] = { card: null, price: "" };
		player.study.cards.push(card);
	}
}

function toggleSelectCard(index) {
	if (player.study.selected === index) {
		player.study.selected = -1;
	} else {
		player.study.selected = index;
	}
}

function getDrawDuration() {
	let drawSpeed = new Decimal(10);
	drawSpeed = drawSpeed.div(new Decimal(1.1).pow(getJobLevel("study")));
	drawSpeed = drawSpeed.times(new Decimal(2).pow(player.study.deep));
	if (player.generators.studyActive) {
		drawSpeed = drawSpeed.times(10);
	}
	return drawSpeed;
}

function getRefreshPeriod() {
	let refreshPeriod = new Decimal(120);
	if (player.generators.studyActive) {
		refreshPeriod = refreshPeriod.times(10);
	}
	return refreshPeriod;
}

addLayer("study", {
	name: "study",
	resource: "properties studied",
	image: "images/orchid_sketch.jpg",
	color: studyColor,
	jobName: "Study flowers",
	showJobDelay: 0.5,
	layerShown: () => hasMilestone("distill", 2),
	startData() {
		return {
			unlocked: true,
			points: new Decimal(0),
			insights: new Decimal(0),
			total: new Decimal(0),
			xp: new Decimal(0),
			lastLevel: new Decimal(0),
			timeLoopActive: false,
			drawProgress: 0,
			refreshProgress: 0,
			cards: baseCards(),
			lastCard: null,
			shop: getShop(),
			increasePointsGain: new Decimal(0),
			multiplyPointsGain: new Decimal(0),
			sellDiscount: new Decimal(0),
			cardsSold: new Decimal(0),
			selected: -1,
			deep: new Decimal(0)
		};
	},
	getResetGain() {
		if (!tmp[this.layer].layerShown || (player.tab !== this.layer && !player[this.layer].timeLoopActive)) {
			return new Decimal(0);
		}
		let gain = new Decimal(10);
		gain = gain.times(softcap(player.study.increasePointsGain, new Decimal(100).times(cardLevel("increasePointsGain").add(1))).times(0.1).add(1));
		gain = gain.times(new Decimal(1.02).pow(softcap(player.study.multiplyPointsGain, new Decimal(100).times(cardLevel("multiplyPointsGain").div(4).add(1)), .2)));
		if (player.generators.studyActive) {
			gain = gain.sqrt().div(10);
		}
		return gain;
	},
	tabFormat: {
		"Main": {
			content: () => [
				["display-text", `<span>You have <h2 style="color: ${studyColor}; text-shadow: ${studyColor} 0 0 10px">${formatWhole(player.study.points)}</h2> properties studied,<br/>and <h2 style="color: darkcyan; text-shadow: darkcyan 0 0 10px">${formatWhole(player.study.insights)}</h2> key insights</span>`],
				"blank",
				["display-text", (() => {
					if (!hasMilestone("study", 0)) {
						return "Discover new ways to harness the power of the cards at level 2";
					}
					if (!hasMilestone("study", 1)) {
						return "Discover new ways to harness the power of the cards at level 4";
					}
					if (!hasMilestone("study", 3)) {
						return "Discover new ways to harness the power of the cards at level 6";
					}
					if (!hasMilestone("study", 4)) {
						return "Discover new ways to harness the power of the cards at level 8";
					}
					return "";
				})()],
				"blank",
				["display-text", `Next draw in ${new Decimal(getDrawDuration() - player.study.drawProgress).clampMax(getDrawDuration() - 0.01).toFixed(2)} seconds`],
				"blank",
				cardFormat(player.study.lastCard, "mainCard", "flipCard"),
				"blank",
				["milestones-filtered", [2, 5, 6]]
			]
		},
		"Deck": {
			content: () => [["row", player.study.cards.map(cardFormat)]]
		},
		"Buy Cards": {
			content: () => [
				["display-text", `<span>You have <h2 style="color: darkcyan; text-shadow: darkcyan 0 0 10px">${formatWhole(player.study.insights)}</h2> key insights</span>`],
				"blank",
				["display-text", `Cards refresh in ${new Decimal(getRefreshPeriod() - player.study.refreshProgress).clampMax(getRefreshPeriod() - 0.01).toFixed(2)} seconds`],
				"blank",
				["row", player.study.shop.map(({ card, price }, i) =>
					["column", [
						card == null ? cardFormat("soldOut") : cardFormat(card, "", "shopCard flipCard", `purchaseCard(${i})`),
						"blank",
						["display-text", `<h2 style="color: darkcyan; text-shadow: darkcyan 0 0 10px">${price ? formatWhole(price) : "​" /*zero width space*/}</h2>`]
					], { margin: "auto 10px 20px", cursor: "pointer", opacity: card != null && player.study.insights.gte(price) ? 1 : 0.5 }]), { width: "100%" }]
			],
			unlocked: () => hasMilestone("study", 0)
		},
		"Destroy Cards": {
			content: () => [
				["display-text", `<span>You have <h2 style="color: ${studyColor}; text-shadow: ${studyColor} 0 0 10px">${formatWhole(player.study.points)}</h2> properties studied`],
				"blank",
				["clickable", "sell"],
				"blank",
				["row", player.study.cards.map((card, i) => cardFormat(card, "", player.study.selected === i ? "selectedCard cursor" : "cursor", `toggleSelectCard(${i})`)), { width: "100%" }]
			],
			unlocked: () => hasMilestone("study", 1)
		},
		"Upgrade Cards": {
			content: () => [
				hasMilestone("study", 4) ? ["column", [
					["display-text", `Deep Thought is currently giving <span style="text-shadow: white 0 0 10px">${formatWhole(player.study.deep)}</span> bonus levels to every card,<br/>but makes each draw take <span style="text-shadow: white 0 0 10px">${formatWhole(new Decimal(2).pow(player.study.deep))}x</span> longer due to processing time.<br/><br/>You cannot add more bonus levels than your level at this job.`],
					"blank",
					["row", [
						["clickable", "deep0"],
						"blank",
						["clickable", "deep-"],
						"blank",
						["clickable", "deep+"],
						"blank",
						["clickable", "deepMax"]
					]],
					"blank"
				]] : null,
				["column", Object.keys(cards).filter(card => player.study.cards.includes(card) && card in layers.study.buyables).map(card => ["row", [
					cardFormat(card),
					["display-text", "〉〉", { fontSize: "36px", margin: "10px" }],
					["buyable", card],
					["display-text", "〉〉", { fontSize: "36px", margin: "10px" }],
					cardFormat(card, "", "", "", cardLevel(card).add(1))
				]])]
			],
			unlocked: () => hasMilestone("study", 3)
		}
	},
	update(diff) {
		if (player.tab === this.layer || player[this.layer].timeLoopActive) {
			player[this.layer].drawProgress += diff;
			// TODO draws/sec
			if (player[this.layer].drawProgress > getDrawDuration()) {
				player[this.layer].drawProgress = 0;
				const newCard = player[this.layer].cards[Math.floor(Math.random() * player.study.cards.length)];
				if (player[this.layer].lastCard && player[this.layer].lastCard in cards && cards[player[this.layer].lastCard].modifyNextCard) {
					cards[player[this.layer].lastCard].modifyNextCard(newCard, cardLevel(newCard));
				} else if (cards[newCard].onDraw) {
					cards[newCard].onDraw(cardLevel(newCard));
				}
				player[this.layer].lastCard = newCard;
				const card = document.getElementById("mainCard");
				if (card != null) {
					card.classList.remove("flipCard");
					void card.offsetWidth;
					card.classList.add("flipCard");
				}
			}
			if (hasMilestone("study", 0)) {
				player[this.layer].refreshProgress += diff;
			}
			if (player[this.layer].refreshProgress > getRefreshPeriod()) {
				player[this.layer].refreshProgress = 0;
				player[this.layer].shop = getShop();
				for (let card of document.getElementsByClassName("shopCard")) {
					if (card != null) {
						card.classList.remove("flipCard");
						void card.offsetWidth;
						card.classList.add("flipCard");
					}
				}
			}
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
			done: () => player.study.xp.gte(10)
		},
		1: {
			requirementDescription: "Level 4",
			done: () => player.study.xp.gte(1e3)
		},
		2: {
			title: "And all dared to brave unknown terrors, to do mighty deeds,",
			requirementDescription: "Level 5",
			"effectDescription": "Unlock a time loop",
			done: () => player.study.xp.gte(1e4),
			onComplete: () => {
				player.timeSlots = player.timeSlots.add(1);
			}
		},
		3: {
			requirementDescription: "Level 6",
			done: () => player.study.xp.gte(1e5)
		},
		4: {
			requirementDescription: "Level 8",
			done: () => player.study.xp.gte(1e7)
		},
		5: {
			title: "to boldly split infinitives that no man had split before—",
			requirementDescription: "Level 10",
			"effectDescription": "Unlock generators job",
			done: () => player.study.xp.gte(1e9),
			unlocked: () => hasMilestone("study", 2)
		},
		6: {
			title: "and thus was the Empire forged.",
			requirementDescription: "Level 25",
			"effectDescription": "Unlock ???",
			done: () => player.study.xp.gte(1e24) && player.chapter > 2,
			unlocked: () => hasMilestone("study", 5) && player.chapter > 2
		}
	},
	clickables: {
		sell: {
			title: "They obstinately persisted in their absence.<br/>",
			style: {
				width: "200px",
				height: "200px"
			},
			display() {
				return `Remove a card from your deck. Cost multiplies by 100 for each card destroyed.<br/><br/>Cost: ${formatWhole(this.cost())} properties studied`;
			},
			cost(x) {
				let cost = new Decimal(500).times(new Decimal(10).pow(player[this.layer].cardsSold));
				cost = cost.times(new Decimal(0.98).pow(softcap(player.study.sellDiscount, new Decimal(100).times(cardLevel("multiplyPointsGain").div(4).add(1)), .5)));
				return cost;
			},
			canClick() {
				if (player[this.layer].cards.length <= 1) {
					return false;
				}
				if (player[this.layer].selected < 0 || player[this.layer].selected >= player[this.layer].cards.length) {
					return false;
				}
				return player[this.layer].points.gte(this.cost());
			},
			onClick() {
				player[this.layer].points = player[this.layer].points.sub(this.cost());
				player[this.layer].cardsSold = player[this.layer].cardsSold.add(1);
				player[this.layer].cards.splice(player[this.layer].selected, 1);
				player[this.layer].selected = -1;
			},
			unlocked: () => hasMilestone("study", 1),
			layer: "study"
		},
		"deep0": {
			title: "0",
			style: {
				width: "100px",
				height: "100px"
			},
			canClick: () => player.study.deep.neq(0),
			onClick: () => {
				player.study.deep = new Decimal(0);
			}
		},
		"deep-": {
			title: "- 1",
			style: {
				width: "100px",
				height: "100px"
			},
			canClick: () => player.study.deep.gt(0),
			onClick: () => {
				player.study.deep = player.study.deep.sub(1);
			}
		},
		"deep+": {
			title: "+ 1",
			style: {
				width: "100px",
				height: "100px"
			},
			canClick: () => player.study.deep.lt(getJobLevel("study")),
			onClick: () => {
				player.study.deep = player.study.deep.add(1);
			}
		},
		"deepMax": {
			title: () => formatWhole(getJobLevel("study")),
			style: {
				width: "100px",
				height: "100px"
			},
			canClick: () => player.study.deep.neq(getJobLevel("study")),
			onClick: () => {
				player.study.deep = getJobLevel("study");
			}
		}
	},
	buyables: {
		gainPoints: getCardUpgradeBuyable("gainPoints"),
		gainBigPoints: getCardUpgradeBuyable("gainBigPoints"),
		gainInsight: getCardUpgradeBuyable("gainInsight"),
		gainBigInsight: getCardUpgradeBuyable("gainBigInsight"),
		playTwice: getCardUpgradeBuyable("playTwice"),
		increasePointsGain: getCardUpgradeBuyable("increasePointsGain"),
		multiplyPointsGain: getCardUpgradeBuyable("multiplyPointsGain"),
		sellDiscount: getCardUpgradeBuyable("sellDiscount"),
		gainXp: getCardUpgradeBuyable("gainXp")
	}
});

// Names references:
// https://www.shmoop.com/study-guides/literature/hitchhikers-guide-to-the-galaxy/quotes
// https://en.wikiquote.org/wiki/The_Hitchhiker's_Guide_to_the_Galaxy
