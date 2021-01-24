var layoutInfo = {
	startTab: "none",
	showTree: true,
	treeLayout: ""
};

Vue.component("job", {
	props: ["layer", "data"],
	template: `
	<span class="upgRow">
		<tree-node :layer='data' :abb='tmp[data].symbol' style="background-size: cover; background-position: center;" v-bind:class="data === 'flowers' && player[data].xp.lte(1) && player[data].resetTime > 20 ? 'tutorial' : ''"></tree-node>
		<div class="job-details" v-bind:style="[player.tab === data ? { '--shadowColor': layers[data].color } : {}, {'textAlign': 'left'}]">
			<h2>{{layers[data].jobName}}</h2>
			<span>Lv. {{formatWhole(getJobLevel(data))}}</span>
			<bar :layer='layer' :data='data' style="margin-top: 5px;"></bar>
		</div>
	</span>`
});

function getJobLevel(job) {
	return player[job].xp.clampMin(1).log10().floor().add(1);
}

function getJobProgressBar(job) {
	return {
		direction: RIGHT,
		width: 400,
		height: 20,
		progress: () => {
			let level = getJobLevel(job);
			let previousLevelRequirement = level.sub(1).pow10();
			let progress = player[job].xp.clampMin(1).sub(previousLevelRequirement).div(level.pow10().sub(previousLevelRequirement));
			return progress;
		},
		unlocked: true,
		fillStyle: { backgroundColor: layers[job].color },
		borderStyle: { borderColor: layers[job].color }
	};
}

addLayer("tree-tab", {
	bars: {
		flowers: getJobProgressBar("flowers")
	},
	tabFormat: () => player.chapter === 1 ?
		[
			// TODO babble buds stage?
			["infobox", "genesis", { "--lore-color": "white" }],
			"blank",
			"blank",
			["job", "flowers"]
		] :
		{
			"Main": {
				content: [
					// TODO babble buds stage?
					["infobox", "genesis", { "--lore-color": "white" }],
					"blank",
					"blank",
					["job", "flowers"]
				]
			}
		},
	infoboxes: {
		genesis: {
			title: "Chapter 1: Genesis",
			body: `[WIP, needs feedback from Hudson]<br/>Finally, I've found the <span style="color: ${flowersColor}">flowers</span>! The legends were true, I was able to confirm they're the real deal by reverting some scratches I received on the trek here.<br/><br/>I just can't believe I actually found them! I'm going to get started collecting them right away. This field is plenty large enough, so I can start harnessing the <span style="color: ${flowersColor}">flowers</span> to speed up the harvesting process.`
		}
	}
});
