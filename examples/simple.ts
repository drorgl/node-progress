import ProgressBar from "../";
const bar = new ProgressBar("  [:bar]", 10);

const id = setInterval(() => {
	bar.tick();
	if (bar.complete) {
		clearInterval(id);
	}
}, 100);
