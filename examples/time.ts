import ProgressBar from "../";
const bar = new ProgressBar("  [:bar] ELAPSED: :elapsed :elapsedShort :elapsedFull ETA: :eta :etaShort :etaFull", {
	width: 50,
	total: 10000000
});

const id = setInterval(() => {
	bar.tick();
	if (bar.complete) {
		clearInterval(id);
	}
	if (bar.curr > 100) {
		process.exit(0);
	}
}, 1000);
