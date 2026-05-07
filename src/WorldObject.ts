import type { WorldRenderer } from "./WorldRenderer";

export interface WorldObject {
	x: number;
	y: number;
	z: number;
	render(renderer: WorldRenderer): void;
}
