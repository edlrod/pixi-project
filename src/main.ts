import { Application, Container, Graphics, Text } from "pixi.js";
import { Input } from "./Input";
import { Player } from "./Player";
import { Pseudo3DCamera } from "./Pseudo3DCamera";
import { World } from "./World";
import type { WorldObject } from "./WorldObject";
import { WorldRenderer } from "./WorldRenderer";

const RENDER_RADIUS = 16;
const TILE_SIZE = 48;

(async () => {
	const app = new Application();

	await app.init({
		background: "#b8d9fd",
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
	const world = new World(({ x, y, z }) => ({
		x,
		y,
		z,
		color: (x + y) % 2 === 0 ? 0x4c8f4a : 0x5ca857,
	}));
	const input = new Input(window);
	const player = new Player(input, 0, 0);
	const worldObjects: WorldObject[] = [player];

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

		world.drawWorldTiles(
			scene,
			app,
			camera,
			world,
			tileX,
			tileY,
			player.x,
			player.y,
			screenOffsetY,
			RENDER_RADIUS,
		);

		worldObjects.sort(
			(left, right) =>
				worldRenderer.getDepth(right.x, right.y, right.z) -
				worldRenderer.getDepth(left.x, left.y, left.z),
		);
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
		worldObjects.forEach((obj) => {
			obj.update(ticker.deltaTime);
		});
		renderScene();
	});
})();
