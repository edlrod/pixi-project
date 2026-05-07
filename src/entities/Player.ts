import type { Input } from "../core/Input";
import type { WorldRenderer } from "../WorldRenderer";
import type { WorldObject } from "../world/WorldObject";

export class Player implements WorldObject {
	private static readonly GROUND_CONTACT_CYCLE = Math.PI;

	x: number;
	y: number;
	z: number;
	direction: number;
	moveSpeed: number;
	turnSpeed: number;
	walkPhase: number;
	walkCycleSpeed: number;
	walkBounceHeight: number;
	walkRotationAmount: number;
	isWalkAnimating: boolean;
	walkStopPhase: number | null;
	walkBlend: number;
	walkBlendInSpeed: number;
	walkBlendOutSpeed: number;
	width: number;
	height: number;
	color: number;
	private readonly input: Input;

	constructor(input: Input, x = 0, y = 0) {
		this.input = input;
		this.x = x;
		this.y = y;
		this.z = 0;
		this.direction = 0;
		this.moveSpeed = 0.08;
		this.turnSpeed = 0.03;
		this.walkPhase = 0;
		this.walkCycleSpeed = 0.18;
		this.walkBounceHeight = 0.25;
		this.walkRotationAmount = 0.18;
		this.isWalkAnimating = false;
		this.walkStopPhase = null;
		this.walkBlend = 0;
		this.walkBlendInSpeed = 0.12;
		this.walkBlendOutSpeed = 0.08;
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
		const swing = this.isWalkAnimating
			? Math.sin(this.walkPhase) * this.walkBlend
			: 0;
		const bob = this.isWalkAnimating
			? (1 - Math.cos(this.walkPhase * 2)) *
				0.5 *
				this.walkBounceHeight *
				this.walkBlend
			: 0;
		const rotation = swing * this.walkRotationAmount;

		renderer.drawProjectedEllipse(
			this.x,
			this.y,
			this.z,
			this.width * 0.5,
			0x000000,
			0.22,
		);
		renderer.drawBillboardQuad({
			x: this.x,
			y: this.y,
			z: this.z,
			width: this.width,
			height: this.height,
			color: this.color,
			strokeColor: 0xff8787,
			rotation,
			offsetYRatio: bob,
		});
	}

	update(deltaTime: number): void {
		const moveStep = this.moveSpeed * deltaTime;
		const turnStep = this.turnSpeed * deltaTime;
		let wantsToMove = false;

		if (this.input.isHeld("KeyW")) {
			this.moveForward(moveStep);
			wantsToMove = true;
		}

		if (this.input.isHeld("KeyS")) {
			this.moveForward(-moveStep);
			wantsToMove = true;
		}

		if (this.input.isHeld("KeyA")) {
			this.turn(turnStep);
		}

		if (this.input.isHeld("KeyD")) {
			this.turn(-turnStep);
		}

		this.updateAnimation(deltaTime, wantsToMove);
	}

	updateAnimation(deltaTime: number, wantsToMove: boolean) {
		if (wantsToMove && !this.isWalkAnimating) {
			this.walkPhase = 0;
			this.isWalkAnimating = true;
		}

		if (wantsToMove) {
			this.walkStopPhase = null;
			this.walkBlend = Math.min(
				1,
				this.walkBlend + this.walkBlendInSpeed * deltaTime,
			);
		} else if (this.isWalkAnimating && this.walkStopPhase === null) {
			this.walkStopPhase =
				Math.floor(this.walkPhase / Player.GROUND_CONTACT_CYCLE) *
					Player.GROUND_CONTACT_CYCLE +
				Player.GROUND_CONTACT_CYCLE;
		}

		if (!this.isWalkAnimating) return;

		this.walkPhase += this.walkCycleSpeed * deltaTime;

		if (wantsToMove) {
			if (this.walkPhase >= Player.GROUND_CONTACT_CYCLE * 2) {
				this.walkPhase %= Player.GROUND_CONTACT_CYCLE * 2;
			}
			return;
		}

		if (this.walkStopPhase !== null && this.walkPhase >= this.walkStopPhase) {
			this.walkPhase = 0;
			this.isWalkAnimating = false;
			this.walkStopPhase = null;
			this.walkBlend = Math.max(
				0,
				this.walkBlend - this.walkBlendOutSpeed * deltaTime,
			);
			if (this.walkBlend < 0.001) this.walkBlend = 0;
			return;
		}

		this.walkBlend = Math.max(
			0,
			this.walkBlend - this.walkBlendOutSpeed * deltaTime,
		);
	}
}
