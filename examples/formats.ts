
/**
 * Module dependencies.
 */

import ProgressBar from "../";

function bar1() {
	const bar = new ProgressBar("  :bar :title", { total: 10 });

	const id = setInterval(() => {
		const randomTitle = ["some", "random", "title"][Math.random() * 3 | 0];
		bar.tick({ title: randomTitle });
		if (bar.complete) {
			clearInterval(id);
			bar2();
		}
	}, 100);
}

function bar2() {
	const bar = new ProgressBar("  processing: [:bar]", {
		total: 15
		, complete: "*"
		, incomplete: " "
	});

	const id = setInterval(() => {
		bar.tick();
		if (bar.complete) {
			clearInterval(id);
			bar3();
		}
	}, 100);
}

function bar3() {
	const bar = new ProgressBar("  download |:bar| :percent", {
		complete: "="
		, incomplete: " "
		, width: 40
		, total: 20
	});

	const id = setInterval(() => {
		bar.tick();
		if (bar.complete) {
			clearInterval(id);
			bar4();
		}
	}, 100);
}

function bar4() {
	const bar = new ProgressBar("  :current of :total :percent", {
		total: 20
	});

	const id = setInterval(() => {
		bar.tick();
		if (bar.complete) {
			clearInterval(id);
			bar5();
		}
	}, 100);
}

function bar5() {
	const bar = new ProgressBar("  [:bar] :elapseds elapsed, eta :etas", {
		width: 8
		, total: 50
	});

	const id = setInterval(() => {
		bar.tick();
		if (bar.complete) {
			clearInterval(id);
		}
	}, 300);
}

bar1();
