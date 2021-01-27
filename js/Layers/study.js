function createCard(title, description, onDraw) {
	return { title, description, onDraw };
}

const nothingCard = () => createCard("His job is not to wield power but to draw attention away from it.", "Do nothing.", () => {});
const gainPointsCard = () => createCard("Don't Panic.", "Successfully study some properties", () => addPoints("study", getResetGain("study")));

const baseCards = () => {
	return [ nothingCard(), nothingCard(), nothingCard(), nothingCard(), nothingCard(), nothingCard(), gainPointsCard(), gainPointsCard(), gainPointsCard() ];
};

const cardFormat = (card, id = "", width = "200px", height = "300px") => {
	// TODO observe/science symbol
	return ["display-text", `<div id="${id}" class="card ${id && "flipCard"}" style="width: ${width}; height: ${height};">
			<span style="border-bottom: 1px solid white; margin: 0; max-height: calc(50% - 30px); padding-bottom: 10px;">
				<h3>${card.title}</h3>
			</span>
			<span style="flex-basis: 0%;"><span>${card.description}</span></span>
			<span style="flex-shrink: 1"></span>
			<img src="images/Time2wait.svg"/>
	</div>`];
};

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
			total: new Decimal(0),
			xp: new Decimal(0),
			lastLevel: new Decimal(0),
			realTime: 0,
			timeLoopActive: false,
			drawPeriod: 10,
			drawProgress: 0,
			cards: baseCards(),
			lastCard: null
		};
	},
	getResetGain() {
		if (!tmp[this.layer].layerShown || (player.tab !== this.layer && !player[this.layer].timeLoopActive)) {
			return new Decimal(0);
		}
		let gain = new Decimal(10);
		gain = gain.times(new Decimal(1.1).pow(getJobLevel(this.layer)));
		return gain;
	},
	tabFormat: {
		"Main": {
			content: () => [
				"main-display",
				["display-text", `Next draw in ${new Decimal(player.study.drawPeriod - player.study.drawProgress).clampMax(9.99).toFixed(2)} seconds`],
				"blank",
				player.study.lastCard == null ? null : cardFormat(player.study.lastCard, "mainCard")
				// TODO add milestones to buy new cards (2), remove cards(4), random encounters(6), and upgrade cards(8)
			]
		},
		"Deck": {
			content: () => [["row", player.study.cards.map(card => cardFormat(card))]]
		}
	},
	update(diff) {
		if (player.tab === this.layer || player[this.layer].timeLoopActive) {
			player[this.layer].realTime += diff;
			player[this.layer].drawProgress += diff;
			if (player[this.layer].drawProgress > player[this.layer].drawPeriod) {
				player[this.layer].drawProgress = 0;
				const newCard = player[this.layer].cards[Math.floor(Math.random() * player.study.cards.length)];
				// TODO proc lastCard
				newCard.onDraw();
				player[this.layer].lastCard = newCard;
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
	},
});
