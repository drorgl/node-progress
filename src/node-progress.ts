/*!
 * node-progress
 * Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Expose `ProgressBar`.
 */

import readline from "readline";

export interface ITokens {
	[key: string]: string | number;
}

/**
 * ProgressBar Options
 *
 * @export
 * @interface IProgressBarOptions
 */
export interface IProgressBarOptions {
	/**
	 * current completed index
	 *
	 * @type {number}
	 * @memberof IProgressBarOptions
	 */
	curr?: number;

	/**
	 * total number of ticks to complete
	 *
	 * @type {number}
	 * @memberof IProgressBarOptions
	 */
	total?: number;

	/**
	 * the displayed width of the progress bar defaulting to total
	 *
	 * @type {number}
	 * @memberof IProgressBarOptions
	 */
	width?: number;

	/**
	 * the output stream defaulting to stderr
	 *
	 * @type {NodeJS.WriteStream}
	 * @memberof IProgressBarOptions
	 */
	stream?: NodeJS.WriteStream;

	/**
	 * head character defaulting to complete character
	 *
	 * @type {string}
	 * @memberof IProgressBarOptions
	 */
	head?: string;

	/**
	 * completion character defaulting to "="
	 *
	 * @type {string}
	 * @memberof IProgressBarOptions
	 */
	complete?: string;

	/**
	 * incomplete character defaulting to "-"
	 *
	 * @type {string}
	 * @memberof IProgressBarOptions
	 */
	incomplete?: string;

	/**
	 * minimum time between updates in milliseconds defaulting to 16
	 *
	 * @type {number}
	 * @memberof IProgressBarOptions
	 */
	renderThrottle?: number;

	/**
	 * optional function to call when the progress bar completes
	 *
	 * @memberof IProgressBarOptions
	 */
	callback?: (pb: ProgressBar) => void;

	/**
	 * will clear the progress bar upon termination
	 *
	 * @type {boolean}
	 * @memberof IProgressBarOptions
	 */
	clear?: boolean;
}

/**
 * Initialize a `ProgressBar` with the given `fmt` string and `options` or
 * `total`.
 *
 * Tokens:
 *
 *   - `:bar` the progress bar itself
 *   - `:current` current tick number
 *   - `:currentKMG` current tick number in KMG format
 *   - `:currentBKMG` current tick number in KMG bytes format
 *   - `:total` total ticks
 * 	 - `:totalKMG` total ticks in KMG format
 * 	 - `:totalBKMG` total ticks in KMG bytes format
 *   - `:elapsed` time elapsed in seconds
 *   - `:elapsedShort` time elapsed in short dhms format
 *   - `:elapsedFull` time elapsed in long dhms format
 *   - `:percent` completion percentage
 *   - `:eta` eta in seconds
 *   - `:etaShort` eta in short dhms format
 *   - `:etaFull` eta in long dhms format
 *   - `:rate` rate of ticks per second
 *   - `:rateKMG` rate of ticks per second in KMG format
 *   - `:rateBKMG` rate of ticks per second in KMG bytes format
 *
 * @param {string} fmt
 * @param {object|number} options or total
 * @api public
 */
export default class ProgressBar {
	public stream: NodeJS.WriteStream;
	public fmt: string;
	public curr: number;
	public total: number;
	public width: number;
	public clear: boolean;
	public renderThrottle: number;
	public lastRender: number;
	public callback: (pb: ProgressBar) => void;
	public tokens: ITokens;
	public lastDraw: string;
	public chars: { complete: string; incomplete: string; head: string; };
	public start: Date;
	public complete: boolean;
	constructor(fmt: string, options: number | IProgressBarOptions) {
		this.stream = (options as IProgressBarOptions).stream || process.stderr;

		if (typeof (options) === "number") {
			const total = options;
			options = {};
			options.total = total;
		} else {
			options = options || {};
			if ("string" !== typeof fmt) {
				throw new Error("format required");
			}
			if ("number" !== typeof options.total) {
				throw new Error("total required");
			}
		}

		this.fmt = fmt;
		this.curr = options.curr || 0;
		this.total = options.total;
		this.width = options.width || this.total;
		this.clear = options.clear;
		this.chars = {
			complete: options.complete || "=",
			incomplete: options.incomplete || "-",
			head: options.head || (options.complete || "=")
		};
		this.renderThrottle = options.renderThrottle !== 0 ? (options.renderThrottle || 16) : 0;
		this.lastRender = -Infinity;
		this.callback = options.callback || (() => {
			// nop
		});
		this.tokens = {};
		this.lastDraw = "";
	}

	/**
	 * "tick" the progress bar with optional `len` and optional `tokens`.
	 *
	 * @param {number|object} len or tokens
	 * @param {object} tokens
	 * @api public
	 */

	public tick(len?: number | ITokens, tokens?: ITokens) {
		if (len !== 0) {
			len = len || 1;
		}

		// swap tokens
		if ("object" === typeof len) { tokens = len, len = 1; }
		if (tokens) { this.tokens = tokens; }

		// start time for eta
		if (0 === this.curr) { this.start = new Date(); }

		this.curr += len;

		// try to render
		this.render();

		// progress complete
		if (this.curr >= this.total) {
			this.render(undefined, true);
			this.complete = true;
			this.terminate();
			this.callback(this);
			return;
		}
	}

	/**
	 * Method to render the progress bar with optional `tokens` to place in the
	 * progress bar's `fmt` field.
	 *
	 * @param {object} tokens
	 * @api public
	 */

	public render(tokens?: ITokens, force?: boolean) {
		force = force !== undefined ? force : false;
		if (tokens) { this.tokens = tokens; }

		if (!this.stream.isTTY) { return; }

		const now = Date.now();
		const delta = now - this.lastRender;
		if (!force && (delta < this.renderThrottle)) {
			return;
		} else {
			this.lastRender = now;
		}

		let ratio = this.curr / this.total;
		ratio = Math.min(Math.max(ratio, 0), 1);

		const percent = Math.floor(ratio * 100);
		const elapsed = +new Date() - +this.start;
		const eta = (percent === 100) ? 0 : elapsed * (this.total / this.curr - 1);
		const rate = this.curr / (elapsed / 1000);

		/* populate the bar template with percentages and timestamps */
		let str = this.fmt
			.replace(":current", this.curr.toString())
			.replace(":currentKMG", this.formatKMGTPEZY(this.curr, 1000, 2))
			.replace(":currentBKMG", this.formatKMGTPEZY(this.curr, 1024, 2))
			.replace(":total", this.total.toString())
			.replace(":totalKMG", this.formatKMGTPEZY(this.total, 1000, 2))
			.replace(":totalBKMG", this.formatKMGTPEZY(this.total, 1024, 2))
			.replace(":elapsed", isNaN(elapsed) ? "0.0" : (elapsed / 1000).toFixed(1))
			.replace(":elapsedShort", isNaN(elapsed) ? "00:00:00" : this.dhmsFormatShort(this.secondsToDhms(elapsed / 1000)))
			.replace(":elapsedFull", isNaN(elapsed) ? "" : this.dhmsFormatLong(this.secondsToDhms(elapsed / 1000)))
			.replace(":eta", (isNaN(eta) || !isFinite(eta)) ? "0.0" : (eta / 1000)
				.toFixed(1))
			.replace(":etaShort", isNaN(elapsed) ? "00:00:00" : this.dhmsFormatShort(this.secondsToDhms((eta / 1000))))
			.replace(":etaFull", isNaN(elapsed) ? "" : this.dhmsFormatLong(this.secondsToDhms((eta / 1000))))
			.replace(":percent", percent.toFixed(0) + "%")
			.replace(":rate", Math.round(rate).toString())
			.replace(":rateKMG", this.formatKMGTPEZY(Math.round(rate), 1000, 2))
			.replace(":rateBKMG", this.formatKMGTPEZY(Math.round(rate), 1024, 2));

		/* compute the available space (non-zero) for the bar */
		let availableSpace = Math.max(0, this.stream.columns - str.replace(":bar", "").length);
		if (availableSpace && process.platform === "win32") {
			availableSpace = availableSpace - 1;
		}

		const width = Math.min(this.width, availableSpace);

		/* TODO: the following assumes the user has one ':bar' token */
		const completeLength = Math.round(width * ratio);
		let complete = Array(Math.max(0, completeLength + 1)).join(this.chars.complete);
		const incomplete = Array(Math.max(0, width - completeLength + 1)).join(this.chars.incomplete);

		/* add head to the complete string */
		if (completeLength > 0) {
			complete = complete.slice(0, -1) + this.chars.head;
		}

		/* fill in the actual progress bar */
		str = str.replace(":bar", complete + incomplete);

		/* replace the extra tokens */
		if (this.tokens) {
			for (const key of Object.keys(this.tokens)) {
				str = str.replace(":" + key, this.tokens[key].toString());
			}
		}

		if (this.lastDraw !== str) {
			readline.cursorTo(this.stream, 0);
			this.stream.write(str);
			readline.clearLine(this.stream, 1);
			this.lastDraw = str;
		}
	}

	/**
	 * "update" the progress bar to represent an exact percentage.
	 * The ratio (between 0 and 1) specified will be multiplied by `total` and
	 * floored, representing the closest available "tick." For example, if a
	 * progress bar has a length of 3 and `update(0.5)` is called, the progress
	 * will be set to 1.
	 *
	 * A ratio of 0.5 will attempt to set the progress to halfway.
	 *
	 * @param {number} ratio The ratio (between 0 and 1 inclusive) to set the
	 *   overall completion to.
	 * @api public
	 */

	public update(ratio: number, tokens?: ITokens) {
		const goal = Math.floor(ratio * this.total);
		const delta = goal - this.curr;

		this.tick(delta, tokens);
	}

	/**
	 * "interrupt" the progress bar and write a message above it.
	 * @param {string} message The message to write.
	 * @api public
	 */

	public interrupt(message: string) {
		// clear the current line
		readline.clearLine(this.stream, 0);
		// move the cursor to the start of the line
		readline.cursorTo(this.stream, 0);
		// write the message text
		this.stream.write(message);
		// terminate the line after writing the message
		this.stream.write("\n");
		// re-display the progress bar with its lastDraw
		this.stream.write(this.lastDraw);
	}

	/**
	 * Terminates a progress bar.
	 *
	 * @api public
	 */

	public terminate() {
		if (this.clear) {
			readline.clearLine(this.stream, 0);
			readline.cursorTo(this.stream, 0);
		} else {
			this.stream.write("\n");
		}
	}

	private formatKMGTPEZY(bytes: number, k: number = 1024, decimals: number = 2) {
		if (bytes === 0) { return "0"; }

		const dm = decimals < 0 ? 0 : decimals;
		const sizes = ["", "K", "M", "G", "T", "P", "E", "Z", "Y"];

		const i = Math.floor(Math.log(bytes) / Math.log(k));

		return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
	}

	private secondsToDhms(seconds: number) {
		seconds = Number(seconds);
		const d = Math.floor(seconds / (3600 * 24));
		const h = Math.floor(seconds % (3600 * 24) / 3600);
		const m = Math.floor(seconds % 3600 / 60);
		const s = Math.floor(seconds % 60);
		return {
			d,
			h,
			m,
			s
		};
	}

	private dhmsFormatLong(dhms: {d: number, h: number, m: number, s: number}) {
		const {d, h, m, s} =    dhms;
		const dDisplay = d > 0 ? d + (d === 1 ? " day, " : " days, ") : "";
		const hDisplay = h > 0 ? h + (h === 1 ? " hour, " : " hours, ") : "";
		const mDisplay = m > 0 ? m + (m === 1 ? " minute, " : " minutes, ") : "";
		const sDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : "";
		return dDisplay + hDisplay + mDisplay + sDisplay;
	}

	private dhmsFormatShort(dhms: {d: number, h: number, m: number, s: number}) {
		const {d, h, m, s} =    dhms;
		const format = (val: number) => {
			const stringified = Math.floor(val).toString();
			if (stringified.length >= 2) {
				return stringified;
			}
			const padded = `0${stringified}`;
			return padded.slice(-2);
		};

		let parts = [d, h, m, s];
		parts = parts.slice(parts.findIndex((p) => p > 0));

		return parts.map(format).join(":");
	}

}
