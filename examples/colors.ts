const green = "\u001b[42m \u001b[0m";
const red = "\u001b[41m \u001b[0m";

import ProgressBar from "../";

const bar = new ProgressBar("  [:bar]", {
	complete: green,
	incomplete: red,
	total: 20
});

const id = setInterval(() => {
	bar.tick();
	if (bar.complete) {
		clearInterval(id);
	}
}, 100);
