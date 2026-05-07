import type { Application, Graphics } from "pixi.js";
import type { Pseudo3DCamera } from "../Pseudo3DCamera";

export type TilePosition = {
	x: number;
	y: number;
	z?: number;
};

export type WorldTile = TilePosition & {
	color: number;
};

type TileGenerator = (position: TilePosition) => WorldTile;

function tileKey(x: number, y: number, z: number) {
	return `${x},${y},${z}`;
}

export class World {
	private readonly tiles = new Map<string, WorldTile>();
	private readonly generateTile: TileGenerator;

	constructor(generateTile: TileGenerator) {
		this.generateTile = generateTile;
	}

	setTile(tile: WorldTile) {
		const z = tile.z ?? 0;

		this.tiles.set(tileKey(tile.x, tile.y, z), { ...tile, z });
	}

	getTile(x: number, y: number, z = 0) {
		const key = tileKey(x, y, z);
		const existingTile = this.tiles.get(key);

		if (existingTile) return existingTile;

		const generatedTile = this.generateTile({ x, y, z });
		this.setTile(generatedTile);

		return generatedTile;
	}

	entries() {
		return this.tiles.values();
	}

	getTilesInRadius(centerX: number, centerY: number, radius: number, z = 0) {
		const tiles: WorldTile[] = [];
		const radiusSquared = radius * radius;

		for (let y = centerY - radius; y <= centerY + radius; y += 1) {
			for (let x = centerX - radius; x <= centerX + radius; x += 1) {
				const dx = x - centerX;
				const dy = y - centerY;

				if (dx * dx + dy * dy > radiusSquared) continue;

				const tile = this.getTile(x, y, z);

				if (!tile) continue;

				tiles.push(tile);
			}
		}

		return tiles;
	}

	drawWorldTiles(
		graphics: Graphics,
		app: Application,
		camera: Pseudo3DCamera,
		world: World,
		queryCenterX: number,
		queryCenterY: number,
		fadeCenterX: number,
		fadeCenterY: number,
		screenOffsetY: number,
		renderRadius: number,
	) {
		graphics.clear();

		graphics.rect(0, 0, app.screen.width, app.screen.height);
		graphics.fill({ color: 0x102033 });

		const visibleTiles = world.getTilesInRadius(
			queryCenterX,
			queryCenterY,
			renderRadius,
		);

		for (const tile of visibleTiles) {
			const half = 0.5;
			const dx = tile.x - fadeCenterX;
			const dy = tile.y - fadeCenterY;
			const distance = Math.sqrt(dx * dx + dy * dy);
			const fadeStart = renderRadius * 0.7;
			const fadeRange = Math.max(0.0001, renderRadius - fadeStart);
			const alpha =
				distance <= fadeStart
					? 1
					: Math.max(0, 1 - (distance - fadeStart) / fadeRange);

			const topLeft = camera.project(
				{ x: tile.x - half, y: tile.y - half, z: tile.z ?? 0 },
				app.screen.width,
				app.screen.height,
			);
			const topRight = camera.project(
				{ x: tile.x + half, y: tile.y - half, z: tile.z ?? 0 },
				app.screen.width,
				app.screen.height,
			);
			const bottomRight = camera.project(
				{ x: tile.x + half, y: tile.y + half, z: tile.z ?? 0 },
				app.screen.width,
				app.screen.height,
			);
			const bottomLeft = camera.project(
				{ x: tile.x - half, y: tile.y + half, z: tile.z ?? 0 },
				app.screen.width,
				app.screen.height,
			);

			graphics.moveTo(topLeft.x, topLeft.y + screenOffsetY);
			graphics.lineTo(topRight.x, topRight.y + screenOffsetY);
			graphics.lineTo(bottomRight.x, bottomRight.y + screenOffsetY);
			graphics.lineTo(bottomLeft.x, bottomLeft.y + screenOffsetY);
			graphics.closePath();
			graphics.fill({ color: tile.color, alpha });
		}
	}
}
