import { Application, Container, Graphics, Text } from "pixi.js";
import { Input } from "./Input";
import { Player } from "./Player";
import { Pseudo3DCamera } from "./Pseudo3DCamera";
import { World } from "./World";
import type { WorldObject } from "./WorldObject";
import { WorldRenderer } from "./WorldRenderer";

const RENDER_RADIUS = 16;
const TILE_SIZE = 48;

function createWorld() {
	return new World(({ x, y, z }) => ({
		x,
		y,
		z,
		color: (x + y) % 2 === 0 ? 0x4c8f4a : 0x5ca857,
	}));
}

function drawWorldTiles(
	graphics: Graphics,
	app: Application,
	camera: Pseudo3DCamera,
	world: World,
	queryCenterX: number,
	queryCenterY: number,
	fadeCenterX: number,
	fadeCenterY: number,
	screenOffsetY: number,
) {
	graphics.clear();

	graphics.rect(0, 0, app.screen.width, app.screen.height);
	graphics.fill({ color: 0x102033 });

	const visibleTiles = world.getTilesInRadius(queryCenterX, queryCenterY, RENDER_RADIUS);

	for (const tile of visibleTiles) {
		const half = 0.5;
		const dx = tile.x - fadeCenterX;
		const dy = tile.y - fadeCenterY;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const fadeStart = RENDER_RADIUS * 0.7;
		const fadeRange = Math.max(0.0001, RENDER_RADIUS - fadeStart);
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

(async () => {
	const app = new Application();

	await app.init({
		background: "#08131f",
		resizeTo: window,
		antialias: true,
	});

	const pixiContainer = document.getElementById("pixi-container");
	if (!pixiContainer) throw new Error("Failed to find pixi-container element");
	pixiContainer.appendChild(app.canvas);

	const worldLayer = new Container();
	const scene = new Graphics();
	const label = new Text({
		text: "",
		style: {
			fill: 0xe6f1ff,
			fontFamily: "monospace",
			fontSize: 14,
		},
	});
	const world = createWorld();
	const player = new Player(0, 0);
	const input = new Input(window);

	const camera = new Pseudo3DCamera({
		tileSize: TILE_SIZE,
		pitch: 0.3,
		distance: 624,
		focalLength: 1872,
		followScreenY: 0.5,
	});
	camera.follow(player);

	worldLayer.addChild(scene, label);
	app.stage.addChild(worldLayer);

	const renderScene = () => {
		camera.follow(player, 0.05);
		camera.yaw += (player.direction - camera.yaw) * 0.1;

		const tileX = Math.round(player.x);
		const tileY = Math.round(player.y);
		const playerFeet = camera.project(
			{ x: player.x, y: player.y, z: player.z },
			app.screen.width,
			app.screen.height,
		);
		const targetScreenY = app.screen.height * camera.followScreenY;
		const screenOffsetY = camera.getFollowOffset(targetScreenY, playerFeet.y);
		const worldRenderer = new WorldRenderer(
			scene,
			camera,
			app.screen.width,
			app.screen.height,
			screenOffsetY,
		);
		const worldObjects: WorldObject[] = [player];
		worldObjects.sort(
			(left, right) => worldRenderer.getDepth(right.x, right.y, right.z) - worldRenderer.getDepth(left.x, left.y, left.z),
		);

		drawWorldTiles(scene, app, camera, world, tileX, tileY, player.x, player.y, screenOffsetY);

		for (const worldObject of worldObjects) {
			worldObject.render(worldRenderer);
		}

		label.text = [
			"W/S move player | A/D turn player",
			"camera follows player position and direction",
			`rendering tiles in radius ${RENDER_RADIUS} around (${tileX}, ${tileY})`,
			`player: x=${player.x.toFixed(2)} y=${player.y.toFixed(2)} direction=${player.direction.toFixed(2)}`,
			`camera: x=${camera.x.toFixed(2)} y=${camera.y.toFixed(2)} yaw=${camera.yaw.toFixed(2)} pitch=${camera.pitch.toFixed(2)} tileSize=${camera.tileSize}`,
			`projection: distance=${camera.distance.toFixed(0)} focalLength=${camera.focalLength.toFixed(0)} followScreenY=${camera.followScreenY.toFixed(2)}`,
		].join("\n");
		label.position.set(16, 16);
	};

	app.ticker.add((ticker) => {
		const moveStep = player.moveSpeed * ticker.deltaTime;
		const turnStep = player.turnSpeed * ticker.deltaTime;

		if (input.isHeld("KeyW")) {
			player.moveForward(moveStep);
		}

		if (input.isHeld("KeyS")) {
			player.moveForward(-moveStep);
		}

		if (input.isHeld("KeyA")) {
			player.turn(turnStep);
		}

		if (input.isHeld("KeyD")) {
			player.turn(-turnStep);
		}

		renderScene();
	});
})();
