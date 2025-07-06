export const backoffStrategies = {
	none: () => 0,
	fixed: (ms: number) => () => ms,
	linear:
		(base: number, max = 5000) =>
		(overuse: number) =>
			Math.min(max, base * overuse),
	exponential:
		(base: number, max = 5000) =>
		(overuse: number) =>
			Math.min(max, base * Math.pow(2, overuse)),
};
