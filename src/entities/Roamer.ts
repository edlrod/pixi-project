import type { WorldRenderer } from "../WorldRenderer";
import type { WorldObject } from "../world/WorldObject";

function normalizeAngle(angle: number) {
	while (angle > Math.PI) angle -= Math.PI * 2;
	while (angle < -Math.PI) angle += Math.PI * 2;
	return angle;
}

export class Roamer implements WorldObject {
	private static readonly GROUND_CONTACT_CYCLE = Math.PI;

	x: number;
	y: number;
	z: number;
	direction: number;
	moveSpeed: number;
	turnSpeed: number;
	width: number;
	height: number;
	color: number;

	walkPhase: number;
	walkCycleSpeed: number;
	walkBounceHeight: number;
	walkRotationAmount: number;
	isWalkAnimating: boolean;
	walkStopPhase: number | null;
	walkBlend: number;
	walkBlendInSpeed: number;
	walkBlendOutSpeed: number;

	private desiredDirection: number;
	private wantsToMove: boolean;
	private behaviorTimer: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
		this.z = 0;
		this.direction = Math.random() * Math.PI * 2;
		this.desiredDirection = this.direction;
		this.wantsToMove = true;
		this.behaviorTimer = 0;
		this.moveSpeed = 0.045;
		this.turnSpeed = 0.02;
		this.width = 0.85;
		this.height = 0.6;
		this.color = 0x3b82f6;

		this.walkPhase = Math.random() * Math.PI * 2;
		this.walkCycleSpeed = 0.14;
		this.walkBounceHeight = 0.12;
		this.walkRotationAmount = 0.1;
		this.isWalkAnimating = true;
		this.walkStopPhase = null;
		this.walkBlend = 1;
		this.walkBlendInSpeed = 0.12;
		this.walkBlendOutSpeed = 0.08;
	}

	private moveForward(amount: number) {
		this.x -= Math.sin(this.direction) * amount;
		this.y -= Math.cos(this.direction) * amount;
	}

	private turnToward(deltaTime: number) {
		const delta = normalizeAngle(this.desiredDirection - this.direction);
		const maxStep = this.turnSpeed * deltaTime;

		if (Math.abs(delta) <= maxStep) {
			this.direction = this.desiredDirection;
			return;
		}

		this.direction += Math.sign(delta) * maxStep;
	}

	private chooseNextBehavior() {
		this.wantsToMove = Math.random() > 0.6;
		this.behaviorTimer = this.wantsToMove
			? 20 + Math.random() * 35
			: 90 + Math.random() * 140;
		this.desiredDirection += (Math.random() - 0.5) * (Math.PI * 0.5);
		this.desiredDirection = normalizeAngle(this.desiredDirection);
	}

	private updateAnimation(deltaTime: number, wantsToMove: boolean) {
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
				Math.floor(this.walkPhase / Roamer.GROUND_CONTACT_CYCLE) *
					Roamer.GROUND_CONTACT_CYCLE +
				Roamer.GROUND_CONTACT_CYCLE;
		}

		if (!this.isWalkAnimating) return;

		this.walkPhase += this.walkCycleSpeed * deltaTime;

		if (wantsToMove) {
			if (this.walkPhase >= Roamer.GROUND_CONTACT_CYCLE * 2) {
				this.walkPhase %= Roamer.GROUND_CONTACT_CYCLE * 2;
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

	update(deltaTime: number): void {
		this.behaviorTimer -= deltaTime;

		if (this.behaviorTimer <= 0) {
			this.chooseNextBehavior();
		}

		this.turnToward(deltaTime);

		if (this.wantsToMove) {
			this.moveForward(this.moveSpeed * deltaTime);
		}

		this.updateAnimation(deltaTime, this.wantsToMove);
	}

	render(renderer: WorldRenderer): void {
		const alpha = renderer.getFadeAlpha(this.x, this.y);
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
			this.width * 0.45,
			0x000000,
			0.18 * alpha,
		);
		renderer.drawBillboardQuad({
			x: this.x,
			y: this.y,
			z: this.z,
			width: this.width,
			height: this.height,
			color: this.color,
			strokeColor: 0x93c5fd,
			rotation,
			offsetYRatio: bob,
			alpha,
		});
	}
}
