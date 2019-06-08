import ProgressBar from "../";
const bar = new ProgressBar("  [:bar] :rate/s :elapseds elapsed, eta :etas", 0);

let limit = 100;

const id = setInterval(() => {
	bar.tick();
	if (limit < 0) {
		clearInterval(id);
	}
	limit--;
}, 100);
