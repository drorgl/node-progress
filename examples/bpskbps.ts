import ProgressBar from "../";
const bar = new ProgressBar("  [:bar] CURRENT: :current :currentKMG :currentBKMG TOTAL: :total :totalKMG :totalBKMG RATE: :rate :rateKMG :rateBKMG", {
	width: 50,
	total: 100000000
});

for (let i = 0; i < 100000000; i++) {
	bar.tick();
}
