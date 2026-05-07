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

		if (existingTile) {
			return existingTile;
		}

		const generatedTile = this.generateTile({ x, y, z });
		this.setTile(generatedTile);

		return generatedTile;
	}

	entries() {
		return this.tiles.values();
	}

	getTilesInRadius(centerX: number, centerY: number, radius: number, z = 0) {
		const tiles: WorldTile[] = [];

		for (let y = centerY - radius; y <= centerY + radius; y += 1) {
			for (let x = centerX - radius; x <= centerX + radius; x += 1) {
				const tile = this.getTile(x, y, z);

				if (!tile) {
					continue;
				}

				tiles.push(tile);
			}
		}

		return tiles;
	}
}
