import type { Graphics } from "pixi.js";
import type {
	ProjectedPoint,
	Pseudo3DCamera,
	WorldPoint,
} from "./Pseudo3DCamera";

const ELLIPSE_KAPPA = 0.5522847498307936;

type BillboardOptions = {
	x: number;
	y: number;
	z: number;
	width: number;
	height: number;
	color: number;
	strokeColor?: number;
	strokeWidth?: number;
};

type BillboardQuadOptions = {
	x: number;
	y: number;
	z: number;
	width: number;
	height: number;
	color: number;
	strokeColor?: number;
	strokeWidth?: number;
	rotation?: number;
	offsetYRatio?: number;
};

export class WorldRenderer {
	constructor(
		private readonly graphics: Graphics,
		private readonly camera: Pseudo3DCamera,
		private readonly screenWidth: number,
		private readonly screenHeight: number,
		private readonly screenOffsetY: number,
	) {}

	project(point: WorldPoint): ProjectedPoint {
		return this.camera.project(point, this.screenWidth, this.screenHeight);
	}

	getDepth(x: number, y: number, z = 0) {
		return this.project({ x, y, z }).depth;
	}

	drawProjectedEllipse(
		x: number,
		y: number,
		z: number,
		radius: number,
		color: number,
		alpha = 1,
	) {
		const center = this.project({ x, y, z });
		const axisX = this.project({ x: x + radius, y, z });
		const axisY = this.project({ x, y: y + radius, z });
		const basisX = {
			x: axisX.x - center.x,
			y: axisX.y - center.y,
		};
		const basisY = {
			x: axisY.x - center.x,
			y: axisY.y - center.y,
		};
		const ellipsePoint = (ax: number, ay: number) => ({
			x: center.x + basisX.x * ax + basisY.x * ay,
			y: center.y + basisX.y * ax + basisY.y * ay + this.screenOffsetY,
		});
		const p0 = ellipsePoint(1, 0);
		const p1 = ellipsePoint(1, ELLIPSE_KAPPA);
		const p2 = ellipsePoint(ELLIPSE_KAPPA, 1);
		const p3 = ellipsePoint(0, 1);
		const p4 = ellipsePoint(-ELLIPSE_KAPPA, 1);
		const p5 = ellipsePoint(-1, ELLIPSE_KAPPA);
		const p6 = ellipsePoint(-1, 0);
		const p7 = ellipsePoint(-1, -ELLIPSE_KAPPA);
		const p8 = ellipsePoint(-ELLIPSE_KAPPA, -1);
		const p9 = ellipsePoint(0, -1);
		const p10 = ellipsePoint(ELLIPSE_KAPPA, -1);
		const p11 = ellipsePoint(1, -ELLIPSE_KAPPA);

		this.graphics.moveTo(p0.x, p0.y);
		this.graphics.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
		this.graphics.bezierCurveTo(p4.x, p4.y, p5.x, p5.y, p6.x, p6.y);
		this.graphics.bezierCurveTo(p7.x, p7.y, p8.x, p8.y, p9.x, p9.y);
		this.graphics.bezierCurveTo(p10.x, p10.y, p11.x, p11.y, p0.x, p0.y);
		this.graphics.fill({ color, alpha });
	}

	drawBillboard(options: BillboardOptions) {
		const feet = this.project({ x: options.x, y: options.y, z: options.z });
		const head = this.project({
			x: options.x,
			y: options.y,
			z: options.z + options.height,
		});
		const spriteWidth = this.camera.tileSize * options.width * feet.scale;
		const spriteHeight = Math.abs(feet.y - head.y);

		this.graphics.rect(
			feet.x - spriteWidth * 0.5,
			feet.y - spriteHeight + this.screenOffsetY,
			spriteWidth,
			spriteHeight,
		);
		this.graphics.fill({ color: options.color });
		this.graphics.stroke({
			color: options.strokeColor ?? 0xffffff,
			width: options.strokeWidth ?? Math.max(1, 2 * feet.scale),
		});
	}

	drawBillboardQuad(options: BillboardQuadOptions) {
		const feet = this.project({ x: options.x, y: options.y, z: options.z });
		const head = this.project({
			x: options.x,
			y: options.y,
			z: options.z + options.height,
		});
		const spriteWidth = this.camera.tileSize * options.width * feet.scale;
		const spriteHeight = Math.abs(feet.y - head.y);
		const halfWidth = spriteWidth * 0.5;
		const offsetY = (options.offsetYRatio ?? 0) * spriteHeight;
		const rotation = options.rotation ?? 0;
		const cos = Math.cos(rotation);
		const sin = Math.sin(rotation);
		const pivotX = feet.x;
		const pivotY = feet.y + this.screenOffsetY - offsetY;
		const rotatePoint = (localX: number, localY: number) => ({
			x: pivotX + localX * cos - localY * sin,
			y: pivotY + localX * sin + localY * cos,
		});
		const topLeft = rotatePoint(-halfWidth, -spriteHeight);
		const topRight = rotatePoint(halfWidth, -spriteHeight);
		const bottomRight = rotatePoint(halfWidth, 0);
		const bottomLeft = rotatePoint(-halfWidth, 0);

		this.graphics.moveTo(topLeft.x, topLeft.y);
		this.graphics.lineTo(topRight.x, topRight.y);
		this.graphics.lineTo(bottomRight.x, bottomRight.y);
		this.graphics.lineTo(bottomLeft.x, bottomLeft.y);
		this.graphics.closePath();
		this.graphics.fill({ color: options.color });
		this.graphics.stroke({
			color: options.strokeColor ?? 0xffffff,
			width: options.strokeWidth ?? Math.max(1, 2 * feet.scale),
		});
	}
}
