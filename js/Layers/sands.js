function nextStoneCost() {
	return new Decimal(100).times(new Decimal(1.1).pow(player.sands.stonesChipped));
}

addLayer("sands", {
	name: "sands",
	resource: "potentia",
	image: "images/pexels-photo-1095601.jpeg",
	color: sandsColor,
	jobName: "Experiments with time",
	showJobDelay: 0.5,
	layerShown: () => player.chapter > 1 && hasMilestone("study", 2),
	startData() {
		return {
			unlocked: false,
			points: new Decimal(1),
			xp: new Decimal(1),
			lastLevel: new Decimal(1),
			timeLoopActive: false,
			grainsRemaining: new Decimal(0),
			grainsFallen: new Decimal(0),
			shrunkAmount: new Decimal(0),
			chipping: false,
			flipping: false,
			stonesChipped: new Decimal(0),
			fallTime: new Decimal(0),
			flipTime: new Decimal(0)
		};
	},
	getResetGain() {
		if (!tmp[this.layer].layerShown || (player.tab !== this.layer && !player[this.layer].timeLoopActive)) {
			return new Decimal(0);
		}
		let gain = new Decimal(1);
		gain = gain.times(new Decimal(1.1).pow(getJobLevel(this.layer)));
		return gain;
	},
	tabFormat: {
		"Main": {
			content: () => {
				const percentChipped = new Decimal(1).sub(player.sands.shrunkAmount.div(nextStoneCost())).times(10000);
				return [
					"main-display",
					"blank",
					["display-text", (() => {
						if (!hasMilestone("sands", 0)) {
							return "Discover new ways to experiment at level 2";
						}
						if (!hasMilestone("sands", 1)) {
							return "Discover new ways to experiment at level 4";
						}
						if (!hasMilestone("sands", 3)) {
							return "Discover new ways to experiment at level 6";
						}
						if (!hasMilestone("sands", 4)) {
							return "Discover new ways to experiment at level 8";
						}
						return "";
					})()],
					"blank",
					["display-text", `Zoom Level: 1 / ${format(nextStoneCost().div(100))}x`],
					"blank",
					["display-text", `<div class="chipping-container">${new Array(100).fill(1).reduce((acc,_,i) => {
						const singleSquarePercentChipped = percentChipped.sub(i * 100).clamp(0, 100);
						const rowHeight = singleSquarePercentChipped.div(10).floor().times(10);
						return acc + `<div class="chipping">
								<div class="chipping-fill" style="height: ${rowHeight.toNumber()}%"></div>
								<div class="chipping-fill" style="float: left; height: 10%; width: ${singleSquarePercentChipped.sub(rowHeight).times(10).toNumber()}%"></div>
							</div>`;
					}, "")}</div>`],
					"blank",
					["clickable", "chip"],
					"blank",
					"blank",
					["display-text", formatWhole(player.sands.grainsRemaining)],
					["display-text", `<div style="
							--fill-duration: ${player.sands.flipping || player.sands.grainsRemaining.eq(0) ? 1 : player.sands.grainsRemaining.add(player.sands.grainsFallen).times(4).div(player.devSpeed).toNumber() + 0.05}s;
							--fill-delay: -${player.sands.flipping || player.sands.grainsRemaining.eq(0) ? .999 : player.sands.grainsFallen.times(4).div(player.devSpeed).toNumber()}s;
							--fill-state: ${player.sands.grainsRemaining.eq(0) || player.sands.flipping ? "paused" : "running"};
							--flip-duration: ${new Decimal(5).div(player.devSpeed).toNumber() + 0.05}s;
							--flip-state: ${player.sands.flipping ? "running" : "paused"};
						"><div class="hourglass"></div></div>`],
					["display-text", formatWhole(player.sands.grainsFallen)],
					"blank",
					["clickable", "flip"],
					"blank",
					"blank",
					["milestones-filtered", [2, 5, 6]]
				];
			}
		},
		"Upgrades": {
			content: () => [
				"main-display",
				"blank",
			],
			unlocked: () => hasMilestone("sands", 0)
		}
	},
	update(diff) {
		if (player.tab === this.layer || player[this.layer].timeLoopActive) {
			if (player[this.layer].chipping) {
				let shrinkGain = new Decimal(diff);
				player[this.layer].shrunkAmount = player[this.layer].shrunkAmount.add(shrinkGain);
			}

			// https://gameanalytics.com/blog/idle-game-mathematics/
			// b = 100
			// r = 1.1
			let grainsGain = player[this.layer].shrunkAmount.times(new Decimal(1.1).sub(1)).div(nextStoneCost()).add(1).log(1.1).floor();
			if (grainsGain.gt(0)) {
				player[this.layer].shrunkAmount = player[this.layer].shrunkAmount.sub(nextStoneCost().times(new Decimal(1.1).pow(grainsGain).sub(1)).div(new Decimal(1.1).sub(1)));
				player[this.layer].stonesChipped = player[this.layer].stonesChipped.add(grainsGain);

				// TODO grains gain modifiers go here. Make function to calculate so it can also be used when flipping
				player[this.layer].grainsRemaining = player[this.layer].grainsRemaining.add(grainsGain);
			}

			if (player[this.layer].flipping) {
				player[this.layer].fallTime = new Decimal(0);
				player[this.layer].flipTime = player[this.layer].flipTime.add(diff);
				const flipDuration = new Decimal(5);
				if (player[this.layer].flipTime.gt(flipDuration)) {
					player[this.layer].flipping = false;
					player[this.layer].flipTime = new Decimal(0);
					// TODO re-calculate number of grains from upgrades
					player[this.layer].grainsRemaining = player[this.layer].grainsRemaining.add(player[this.layer].grainsFallen);
					player[this.layer].grainsFallen = new Decimal(0);
				}
			} else {
				player[this.layer].flipTime = new Decimal(0);
				if (player[this.layer].grainsRemaining.gt(0)) {
					player[this.layer].fallTime = player[this.layer].fallTime.add(diff);
					const fallDuration = new Decimal(4);
					const fallenGrains = player[this.layer].fallTime.div(fallDuration).floor().clampMax(player[this.layer].grainsRemaining);
					if (fallenGrains.gt(0)) {
						addPoints(this.layer, fallenGrains);
						player[this.layer].grainsRemaining = player[this.layer].grainsRemaining.sub(fallenGrains);
						player[this.layer].grainsFallen = player[this.layer].grainsFallen.add(fallenGrains);
						if (fallenGrains.eq(player[this.layer].grainsRemaining)) {
							player[this.layer].fallTime = new Decimal(0);
						} else {
							player[this.layer].fallTime = player[this.layer].fallTime.sub(fallenGrains.times(fallDuration));
						}
					}
				} else {
					player[this.layer].fallTime = new Decimal(0);
				}
			}
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
			done: () => player.sands.xp.gte(10)
		},
		1: {
			requirementDescription: "Level 4",
			done: () => player.sands.xp.gte(1e3)
		},
		2: {
			title: "I don't even know what I'm doing.",
			requirementDescription: "Level 5",
			"effectDescription": "Unlock a new time slot",
			done: () => player.sands.xp.gte(1e4),
			onComplete: () => {
				player.timeSlots = player.timeSlots.add(1);
			}
		},
		3: {
			requirementDescription: "Level 6",
			done: () => player.sands.xp.gte(1e5)
		},
		4: {
			requirementDescription: "Level 8",
			done: () => player.sands.xp.gte(1e7)
		},
		5: {
			title: "I mean, this stuff is way too advanced for me.",
			requirementDescription: "Level 10",
			"effectDescription": "Unlock ??? job",
			done: () => player.sands.xp.gte(1e9),
			unlocked: () => hasMilestone("sands", 2)
		},
		6: {
			title: "And what if I can't fix this? What are we gonna do?",
			requirementDescription: "Level 25",
			"effectDescription": "Unlock ???",
			done: () => player.sands.xp.gte(1e24),
			unlocked: () => hasMilestone("sands", 5)
		}
	},
	clickables: {
		chip: {
			title: "Keep Moving Forward<br/>",
			display: "Hold down the mouse to chip away at the stone until its the size of a grain of sand.",
			touchstart: () => {
				player.sands.chipping = true;
			},
			touchend: () => {
				player.sands.chipping = false;
			}
		},
		flip: {
			title: "But he doesn't give up!",
			display: "Flip the hourglass",
			canClick: () => player.sands.grainsFallen.gt(0) && !player.sands.flipping,
			onClick: () => {
				player.sands.flipping = true;
			}
		}
	}
});
