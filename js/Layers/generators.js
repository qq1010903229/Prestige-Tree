addLayer("generators", {
	name: "generators",
	resource: "joules",
	image: "images/PIXNIO-1742428-5028x2828.jpg",
	color: electricColor,
	jobName: "Run Generators",
	showJobDelay: 1,
	layerShown: () => hasMilestone("study", 5),
	startData() {
		return {
			unlocked: true,
			points: new Decimal(0),
			xp: new Decimal(0),
			lastLevel: new Decimal(0),
			timeLoopActive: false,
			flowerActive: false,
			studyActive: false,
			sandsActive: false
		};
	},
	getResetGain() {
		if (!tmp[this.layer].layerShown || (player.tab !== this.layer && !player[this.layer].timeLoopActive)) {
			return new Decimal(0);
		}
		let gain = new Decimal(0);
		if (player.generators.flowerActive) {
			gain = gain.add(getJobLevel("flowers").div(10));
		}
		if (player.generators.studyActive) {
			gain = gain.add(getJobLevel("study").div(10));
		}
		if (player.generators.sandsActive) {
			gain = gain.add(getJobLevel("sands").div(10));
		}
		gain = gain.times(new Decimal(1.1).pow(getJobLevel(this.layer)));
		return gain;
	},
	passiveGeneration: new Decimal(1),
	tabFormat: {
		"Main": {
			content: () => [
				"main-display",
				["display-text", `You are collecting <span style="color: ${electricColor}; text-shadow: ${electricColor} 0 0 10px">${format(tmp.generators.getResetGain)}</span> joules per second`],
				"blank",
				["display-text", (() => {
					if (!hasMilestone("generators", 0)) {
						return "Discover new ways to harness the electric power at level 2";
					}
					if (!hasMilestone("generators", 1)) {
						return "Discover new ways to harness the electric power at level 4";
					}
					if (!hasMilestone("generators", 2)) {
						return "Discover new ways to harness the electric power at level 6";
					}
					if (!hasMilestone("generators", 3)) {
						return "Discover new ways to harness the electric power at level 8";
					}
					if (!hasMilestone("generators", 4)) {
						return "Discover new ways to harness the electric power at level 10";
					}
					return "";
				})()],
				"blank",
				"blank",
				["row", [["clickable", "flowersGenerator"], "blank", ["clickable", "studyGenerator"], "blank", ["clickable", "sandsGenerator"]]],
				"blank",
				"blank",
				["milestones-filtered", [2, 5, 6]]
			]
		}
	},
	update(diff) {
		if (player.tab === this.layer || player[this.layer].timeLoopActive) {
		}
		let jobLevel = new Decimal(getJobLevel(this.layer));
		if (jobLevel.neq(player[this.layer].lastLevel) && player[this.layer].lastLevel.lte(100)) {
			doPopup("none", `Level ${formatWhole(jobLevel)}`, "Level Up!", 3, layers[this.layer].color);
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
			done: () => player.generators.xp.gte(10)
		},
		1: {
			requirementDescription: "Level 4",
			done: () => player.generators.xp.gte(1e3)
		},
		2: {
			title: "Silence Earthling!",
			requirementDescription: "Level 5",
			"effectDescription": "Unlock a new feature in collecting job",
			done: () => player.generators.xp.gte(1e4)
		},
		3: {
			requirementDescription: "Level 6",
			done: () => player.generators.xp.gte(1e5)
		},
		4: {
			requirementDescription: "Level 8",
			done: () => player.generators.xp.gte(1e7)
		},
		5: {
			title: "My name is Darth Vader.",
			requirementDescription: "Level 10",
			"effectDescription": "Unlock a new feature in ??? job",
			done: () => player.generators.xp.gte(1e9),
			unlocked: () => hasMilestone("generators", 2)
		},
		6: {
			title: "I am an extraterrestrial",
			requirementDescription: "Level 25",
			"effectDescription": "Unlock ???",
			done: () => player.generators.xp.gte(1e24) && player.chapter > 2,
			unlocked: () => player.chapter > 3
		}
	},
	clickables: {
		flowersGenerator: {
			title: "I hate manure!<br/>",
			display: () => `Generate electricity based on gather level.<br/><br/>Flowers gain is softcapped immediately and the job runs 10x slower.<br/><br/>Currently: <b>${player.generators.flowerActive ? "ACTIVE" : "INACTIVE"}</b>`,
			class: () => ({ "gradient-border": player.generators.flowerActive }),
			style: {
				width: "200px",
				height: "200px"
			},
			onClick() {
				player.generators.flowerActive = !player.generators.flowerActive;
			}
		},
		studyGenerator: {
			title: "Great Scott!<br/>",
			display: () => `Generate electricity based on study level.<br/><br/>Properties gain is softcapped immediately and the job runs 10x slower.<br/><br/>Currently: <b>${player.generators.studyActive ? "ACTIVE" : "INACTIVE"}</b>`,
			class: () => ({ "gradient-border": player.generators.studyActive }),
			style: {
				width: "200px",
				height: "200px"
			},
			onClick() {
				player.generators.studyActive = !player.generators.studyActive;
			}
		},
		sandsGenerator: {
			title: "This is heavy!<br/>",
			display: () => `Generate electricity based on experiment level.<br/><br/>Potentia gain is softcapped immediately and the job runs 10x slower.<br/><br/>Currently: <b>${player.generators.sandsActive ? "ACTIVE" : "INACTIVE"}</b>`,
			class: () => ({ "gradient-border": player.generators.sandsActive }),
			style: {
				width: "200px",
				height: "200px"
			},
			onClick() {
				player.generators.sandsActive = !player.generators.sandsActive;
			}
		},
		// TODO ??? generator
		// "Nobody Calls Me Chicken."
		// "Wait A Minute, Doc."
		// "When the hell are they."
	},
	buyables: {
		rows: 1,
		cols: 4,
		11: {
			title: "1.21 Gigawatts!?!<br/>"
		},
		12: {
			title: "88 Miles Per Hour<br/>"
		},
		13: {
			title: "Where We’re Going, We Don’t Need Roads.<br/>"
		},
		14: {
			title: "I finally invent something that works!<br/>"
		}
	}
});
