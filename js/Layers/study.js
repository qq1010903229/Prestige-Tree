function createCard(title, description = "", onDraw = null, modifyNextCard = null) {
	return { title, description, onDraw, modifyNextCard };
}

const cards = {
	nothing: createCard("His job is not to wield power but to draw attention away from it.", "Do nothing."),
	gainPoints: createCard("Don't Panic.", "Successfully study some properties.", () => addPoints("study", getResetGain("study"))),
	gainBigPoints: createCard("In his experience the Universe simply didn't work like that.", "Successfully study a very large amount of properties. Destroy this card.", (canDestroy = true) => {
		addPoints("study", getResetGain("study").pow(1.5));
		if (canDestroy) {
			const index = player.study.cards.findIndex(el => el[0] === "gainBigPoints");
			if (index >= 0) {
				player.study.cards.splice(index, 1);
			}
		}
	}),
	gainInsight: createCard("And it shall be called... the Earth.", "Gain a key insight.", () => player.study.insights = player.study.insights.add(1)),
	gainBigInsight: createCard("Yes! I shall design this computer for you.", "Gain key insights based on the number of cards in the deck.", () => player.study.insights = player.study.insights.add(new Decimal(player.study.cards.length).sqrt().floor())),
	playTwice: createCard("Oh no, not again.", "Play the next card twice.", null, nextCard => {
		if (nextCard[0] in cards && cards[nextCard[0]].onDraw) {
			cards[nextCard[0]].onDraw();
			cards[nextCard[0]].onDraw(false);
		}
	}),
	increasePointsGain: createCard("Have another drink, enjoy yourself.", () => `Permanently increase studied properties gain by 10%.<br/><br/>Currently: +${formatWhole(player.study.increasePointsGain.times(10))}%`, () => player.study.increasePointsGain = player.study.increasePointsGain.add(1)),
	multiplyPointsGain: createCard("Reality is frequently inaccurate.", () => `Permanently multiply studied properties gain by x1.01<br/><br/>Currently: x${format(new Decimal(1.01).pow(player.study.multiplyPointsGain))}`, () => player.study.multiplyPointsGain = player.study.multiplyPointsGain.add(1)),
	sellDiscount: createCard("It doesn't grow on trees you know.", () => `Permanently multiply sell cost by 0.9<br/><br/>Currently: x${format(new Decimal(0.9).pow(player.study.sellDiscount))}`, () => player.study.sellDiscount = player.study.sellDiscount.add(1)),
	soldOut: createCard("Out of Stock!")
};

const shopCards = [
	{ card: "gainPoints", price: 3 },
	{ card: "gainInsight", price: 5 },
	{ card: "gainBigPoints", price: 23 },
	{ card: "gainBigInsight", price: 42 },
	{ card: "playTwice", price: 50 },
	{ card: "increasePointsGain", price: 10 },
	{ card: "multiplyPointsGain", price: 25 },
	{ card: "sellDiscount", price: 80 },
];

const baseCards = () => {
	return [ ["nothing", 0], ["nothing", 0], ["nothing", 0], ["nothing", 0], ["gainPoints", 0], ["gainPoints", 0], ["gainPoints", 0], ["gainPoints", 0], ["gainInsight", 0], ["gainInsight", 0] ];
};

const getShop = (numCards = 3) => {
	return new Array(numCards).fill(1).map(() => shopCards[Math.floor(Math.random() * shopCards.length)]);
};

const cardFormat = (card, id = "", className = "", onclick = "", width = "200px", height = "300px") => {
	return card == null ? null : ["display-text", `
		<div id="${id}" class="card ${className}" style="width: ${width}; height: ${height};" onclick="${onclick}">
			<span style="border-bottom: 1px solid white; margin: 0; max-height: calc(50% - 30px); padding-bottom: 10px;">
				<h3>${cards[card].title}</h3>
			</span>
			<span style="flex-basis: 0%;"><span>${isFunction(cards[card].description) ? cards[card].description() : cards[card].description}</span></span>
			<span style="flex-shrink: 1"></span>
			<img src="images/Time2wait.svg"/>
		</div>`];
};

function purchaseCard(index) {
	const { card, price } = player.study.shop[index];
	if (card && player.study.insights.gte(price)) {
		player.study.insights = player.study.insights.sub(price);
		player.study.shop[index] = { card: null, price: "" };
		player.study.cards.push([card, 0]);
	}
}

const DRAW_PERIOD = 10;
const REFRESH_PERIOD = 300;

addLayer("study", {
	name: "study",
	resource: "properties studied",
	image: "images/orchid_sketch.jpg",
	color: studyColor,
	jobName: "Study flowers",
	showJobDelay: 0.25,
	layerShown: () => player.chapter > 1 && hasMilestone("flowers", 4),
	startData() {
		return {
			unlocked: true,
			points: new Decimal(0),
			insights: new Decimal(0),
			total: new Decimal(0),
			xp: new Decimal(0),
			lastLevel: new Decimal(0),
			realTime: 0,
			timeLoopActive: false,
			drawProgress: 0,
			refreshProgress: 0,
			cards: baseCards(),
			lastCard: null,
			shop: getShop(),
			increasePointsGain: new Decimal(0),
			multiplyPointsGain: new Decimal(0),
			sellDiscount: new Decimal(0)
		};
	},
	getResetGain() {
		if (!tmp[this.layer].layerShown || (player.tab !== this.layer && !player[this.layer].timeLoopActive)) {
			return new Decimal(0);
		}
		let gain = new Decimal(10);
		gain = gain.times(new Decimal(1.1).pow(getJobLevel(this.layer)));
		gain = gain.times(player.study.increasePointsGain.times(0.1).add(1));
		gain = gain.times(new Decimal(1.01).pow(player.study.multiplyPointsGain));
		return gain;
	},
	tabFormat: {
		"Main": {
			content: () => [
				["display-text", `<span>You have <h2 style="color: ${studyColor}; text-shadow: ${studyColor} 0 0 10px">${formatWhole(player.study.points)}</h2> properties studied,<br/>and <h2 style="color: darkcyan; text-shadow: darkcyan 0 0 10px">${formatWhole(player.study.insights)}</h2> key insights</span>`],
				"blank",
				["display-text", (() => {
					if (!hasMilestone("study", 0)) {
						return "Discover new ways to study at level 2";
					}
					if (!hasMilestone("study", 1)) {
						return "Discover new ways to study at level 4";
					}
					if (!hasMilestone("study", 3)) {
						return "Discover new ways to study at level 6";
					}
					if (!hasMilestone("study", 4)) {
						return "Discover new ways to study at level 8";
					}
					return "";
				})()],
				"blank",
				["display-text", `Next draw in ${new Decimal(DRAW_PERIOD - player.study.drawProgress).clampMax(DRAW_PERIOD - 0.01).toFixed(2)} seconds`],
				"blank",
				cardFormat(player.study.lastCard[0], "mainCard", "flipCard"),
				"blank",
				["milestones-filtered", [2, 5, 6]]
			]
		},
		"Deck": {
			content: () => [["row", player.study.cards.map(card => cardFormat(card[0]))]]
		},
		"Buy Cards": {
			content: () => [
				["display-text", `<span>You have <h2 style="color: darkcyan; text-shadow: darkcyan 0 0 10px">${formatWhole(player.study.insights)}</h2> key insights</span>`],
				"blank",
				["display-text", `Cards refresh in ${new Decimal(REFRESH_PERIOD - player.study.refreshProgress).clampMax(REFRESH_PERIOD - 0.01).toFixed(2)} seconds`],
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
		"Sell Cards": {
			content: () => [
				["display-text", `<span>You have <h2 style="color: ${studyColor}; text-shadow: ${studyColor} 0 0 10px">${formatWhole(player.study.points)}</h2> properties studied`],
				"blank",
				["clickable", 11],
				"blank",
			],
			unlocked: () => hasMilestone("study", 1)
		}
	},
	update(diff) {
		if (player.tab === this.layer || player[this.layer].timeLoopActive) {
			player[this.layer].realTime += diff;
			player[this.layer].drawProgress += diff;
			if (player[this.layer].drawProgress > DRAW_PERIOD) {
				player[this.layer].drawProgress = 0;
				const newCard = player[this.layer].cards[Math.floor(Math.random() * player.study.cards.length)];
				if (player[this.layer].lastCard[0] in cards && cards[player[this.layer].lastCard[0]].modifyNextCard) {
					cards[player[this.layer].lastCard[0]].modifyNextCard(newCard);
				} else if (cards[newCard[0]].onDraw) {
					cards[newCard[0]].onDraw();
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
			if (player[this.layer].refreshProgress > REFRESH_PERIOD) {
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
			"effectDescription": "Unlock ??? job",
			done: () => player.study.xp.gte(1e4)
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
			"effectDescription": "Unlock ??? job",
			done: () => player.study.xp.gte(1e9),
			unlocked: () => hasMilestone("study", 2)
		},
		6: {
			title: "and thus was the Empire forged.",
			requirementDescription: "Level 25",
			"effectDescription": "Unlock ???",
			done: () => player.study.xp.gte(1e24),
			unlocked: () => hasMilestone("study", 5)
		}
	},
	clickables: {
		rows: 1,
		cols: 1,
		11: {
			title: "They obstinately persisted in their absence.<br/>",
			style: {
				width: "200px",
				height: "200px"
			},
			display() {
				return `Remove a card from your deck. Cost multiplies by 100 for each card sold.<br/><br/>Cost: ${formatWhole(this.cost())} properties studied`;
			},
			cost(x) {
				let cost = new Decimal(1e3).times(new Decimal(100).pow(player[this.layer].cardsSold));
				cost = cost.times(new Decimal(0.9).pow(player[this.layer].sellDiscount));
				return cost;
			},
			canClick() {
				if (player[this.layer].cards.length <= 1) {
					return false;
				}
				return false;
				return player[this.layer].points.gte(this.cost());
			},
			onClick() {
				player[this.layer].points = player[this.layer].points.sub(this.cost());
				setBuyableAmount(this.layer, this.id, getBuyableAmount(this.layer, this.id).add(1));
			},
			unlocked: () => hasMilestone("study", 1)
		}
	}
});
