var layoutInfo = {
	startTab: "none",
	showTree: true,
	treeLayout: ""
};

Vue.component("job", {
	props: ["layer", "data"],
	template: `
	<span class="upgRow" v-bind:style="{ opacity: 0, animation: 'showJob .5s ' + layers[data].showJobDelay + 's forwards', marginBottom: '20px' }" v-if="tmp[data].layerShown">
		<tree-node :layer='data' :abb='tmp[data].symbol' style="background-size: cover; background-position: center;" v-bind:class="data === 'flowers' && player[data].xp.lte(1) && player[data].resetTime > 20 ? 'tutorial' : ''"></tree-node>
		<div class="job-details" v-bind:style="[player.tab === data ? { '--shadowColor': layers[data].color } : {}, player[data].timeLoopActive ? { '--innerShadowColor': layers[data].color } : {}, {'textAlign': 'left'}]">
			<h2>{{layers[data].jobName}}</h2>
			<span>Lv. {{formatWhole(getJobLevel(data))}}</span>
			<bar :layer='layer' :data='data' style="margin-top: 5px;"></bar>
			<span v-if="player.chapter > 1">
				Time Loop
				<button class="smallUpg can" v-bind:style="{'background-color': tmp[data].color,margin: '10px'}" v-on:click="toggleTimeLoop(data)">{{player[data].timeLoopActive?"ON":"OFF"}}</button>
			</span>
		</div>
	</span>`
});

function getJobLevel(job) {
	if (player[job].xp.eq(0)) {
		return new Decimal(0);
	}
	return player[job].xp.clampMin(1).log10().floor().add(1);
}

function getJobProgressBar(job) {
	return {
		direction: RIGHT,
		width: 400,
		height: 20,
		progress: () => {
			let level = getJobLevel(job);
			if (level.eq(0)) {
				return 0;
			}
			let previousLevelRequirement = level.sub(1).pow10();
			let progress = player[job].xp.clampMin(1).sub(previousLevelRequirement).div(level.pow10().sub(previousLevelRequirement));
			return progress;
		},
		fillStyle: { backgroundColor: layers[job].color },
		borderStyle: { borderColor: layers[job].color }
	};
}

function toggleTimeLoop(layer) {
	if (player[layer].timeLoopActive) {
		player[layer].timeLoopActive = false;
		player.usedTimeSlots = player.usedTimeSlots.sub(1).clampMin(0);
	} else if (player.timeSlots.sub(player.usedTimeSlots).gte(1)) {
		player[layer].timeLoopActive = true;
		player.usedTimeSlots = player.usedTimeSlots.add(1);
	}
}

addLayer("tree-tab", {
	bars: {
		flowers: getJobProgressBar("flowers"),
		study: getJobProgressBar("study"),
		sands: getJobProgressBar("sands")
	},
	tabFormat: () => player.chapter < 3 ?
		[
			// TODO babble buds stage?
			["infobox", "genesis", { "--lore-color": "white" }],
			player.chapter === 2 ? ["infobox", "discovery", { "--lore-color": "orange" }] : null,
			"blank",
			"blank",
			player.chapter === 2 ? ["display-text", `You have <span style="color: white; text-shadow: white 0 0 10px">${formatWhole(player.timeSlots.sub(player.usedTimeSlots))}</span> free time slots`] : null,
			player.chapter === 2 ? "blank" : null,
			["job", "flowers"],
			["job", "study"],
			["job", "sands"]
		] :
		{
			"Main": {
				content: [
					// TODO babble buds stage?
					["infobox", "genesis", { "--lore-color": "white" }],
					["infobox", "discovery", { "--lore-color": "orange" }],
					"blank",
					"blank",
					["job", "flowers"],
					["job", "study"],
					["job", "sands"]
				]
			}
		},
	infoboxes: {
		genesis: {
			title: "Chapter 1: Genesis",
			body: `[WIP, needs feedback from Hudson]<br/>Finally, I've found the <span style="color: ${flowersColor}">flowers</span>! The legends were true, I was able to confirm they're the real deal by reverting some scratches I received on the trek here.<br/><br/>I just can't believe I actually found them! I'm going to get started collecting them right away. This field is plenty large enough, so I can start harnessing the <span style="color: ${flowersColor}">flowers</span> to speed up the harvesting process.`
		},
		discovery: {
			title: "Chapter 2: Discovery",
			body: `[WIP, needs feedback from Hudson]<br/>The field is completely barren... Fortunately, I've collected enough <span style="color: ${flowersColor}">flowers</span> that I can finally create a time loop. Not only will this allow me to revert the field whenever it empties, it'll now open me up to close myself in the loop, effectively allowing it to run while the real me continues with my next task: <span style="color: ${studyColor}">Studying</span> the <span style="color: ${flowersColor}">flowers</span>, and eventually experimenting with how to further take advantage of the time altering properties of these <span style="color: ${flowersColor}">flowers</span>.<br/><br/>It'll be prudent of me not to forget about collecting <span style="color: ${flowersColor}">flowers</span>, as I'll still need them as I move forward.`
		}
	}
});
