/**
 * A simple progressbar with synchronous calls to tick()
 * (i.e. no setTimeout/setInterval)
 */

import ProgressBar from "../";

const len = 10000000; // Adjust to your machine's speed
const bar = new ProgressBar("[:bar]", { total: len, renderThrottle: 100 });

for (let i = 0; i <= len; i++) {
	bar.tick();
}
