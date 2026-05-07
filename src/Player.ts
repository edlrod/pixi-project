import type { WorldObject } from "./WorldObject";
import type { WorldRenderer } from "./WorldRenderer";

export class Player implements WorldObject {
	x: number;
	y: number;
	z: number;
	direction: number;
	moveSpeed: number;
	turnSpeed: number;
	width: number;
	height: number;
	color: number;

	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
		this.z = 0;
		this.direction = 0;
		this.moveSpeed = 0.08;
		this.turnSpeed = 0.03;
		this.width = 0.45;
		this.height = 0.9;
		this.color = 0xe03131;
	}

	moveForward(amount: number) {
		this.x -= Math.sin(this.direction) * amount;
		this.y -= Math.cos(this.direction) * amount;
	}

	turn(amount: number) {
		this.direction += amount;
	}

	render(renderer: WorldRenderer) {
		renderer.drawProjectedEllipse(
			this.x,
			this.y,
			this.z,
			this.width * 0.5,
			0x000000,
			0.22,
		);
		renderer.drawBillboard({
			x: this.x,
			y: this.y,
			z: this.z,
			width: this.width,
			height: this.height,
			color: this.color,
			strokeColor: 0xff8787,
		});
	}
}
