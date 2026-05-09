type RadialFadeOptions = {
	centerX: number;
	centerY: number;
	radius: number;
	fadeStartRatio?: number;
};

export function getRadialFadeAlpha(
	x: number,
	y: number,
	options: RadialFadeOptions,
) {
	const dx = x - options.centerX;
	const dy = y - options.centerY;
	const distance = Math.sqrt(dx * dx + dy * dy);
	const fadeStart = options.radius * (options.fadeStartRatio ?? 0.7);
	const fadeRange = Math.max(0.0001, options.radius - fadeStart);

	if (distance <= fadeStart) return 1;

	return Math.max(0, 1 - (distance - fadeStart) / fadeRange);
}
