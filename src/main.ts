import { Application, Container, Graphics, Text } from "pixi.js";
import { Input } from "./Input";
import { Pseudo3DCamera } from "./Pseudo3DCamera";
import { Player } from "./Player";
import { World } from "./World";

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
  centerX: number,
  centerY: number,
  screenOffsetY: number,
) {
  graphics.clear();

  graphics.rect(0, 0, app.screen.width, app.screen.height);
  graphics.fill({ color: 0x102033 });

  const visibleTiles = world.getTilesInRadius(centerX, centerY, RENDER_RADIUS);

  for (const tile of visibleTiles) {
    const half = 0.5;

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
    graphics.fill({ color: tile.color });
  }
}

function drawPlayer(
  graphics: Graphics,
  app: Application,
  camera: Pseudo3DCamera,
  player: Player,
  screenOffsetY: number,
) {
  const screenWidth = app.screen.width;
  const screenHeight = app.screen.height;
  const feet = camera.project(
    { x: player.x, y: player.y, z: player.z },
    screenWidth,
    screenHeight,
  );
  const head = camera.project(
    { x: player.x, y: player.y, z: player.z + player.height },
    screenWidth,
    screenHeight,
  );
  const spriteWidth = camera.tileSize * player.width * feet.scale;
  const spriteHeight = Math.abs(feet.y - head.y);
  const shadowRadius = player.width * 0.35;
  const shadowCenter = camera.project(
    { x: player.x, y: player.y, z: player.z },
    screenWidth,
    screenHeight,
  );
  const shadowAxisX = camera.project(
    { x: player.x + shadowRadius, y: player.y, z: player.z },
    screenWidth,
    screenHeight,
  );
  const shadowAxisY = camera.project(
    { x: player.x, y: player.y + shadowRadius, z: player.z },
    screenWidth,
    screenHeight,
  );
  const basisX = {
    x: shadowAxisX.x - shadowCenter.x,
    y: shadowAxisX.y - shadowCenter.y,
  };
  const basisY = {
    x: shadowAxisY.x - shadowCenter.x,
    y: shadowAxisY.y - shadowCenter.y,
  };
  const ellipseKappa = 0.5522847498307936;
  const offsetY = screenOffsetY;
  const ellipsePoint = (ax: number, ay: number) => ({
    x: shadowCenter.x + basisX.x * ax + basisY.x * ay,
    y: shadowCenter.y + basisX.y * ax + basisY.y * ay + offsetY,
  });
  const p0 = ellipsePoint(1, 0);
  const p1 = ellipsePoint(1, ellipseKappa);
  const p2 = ellipsePoint(ellipseKappa, 1);
  const p3 = ellipsePoint(0, 1);
  const p4 = ellipsePoint(-ellipseKappa, 1);
  const p5 = ellipsePoint(-1, ellipseKappa);
  const p6 = ellipsePoint(-1, 0);
  const p7 = ellipsePoint(-1, -ellipseKappa);
  const p8 = ellipsePoint(-ellipseKappa, -1);
  const p9 = ellipsePoint(0, -1);
  const p10 = ellipsePoint(ellipseKappa, -1);
  const p11 = ellipsePoint(1, -ellipseKappa);

  graphics.moveTo(p0.x, p0.y);
  graphics.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  graphics.bezierCurveTo(p4.x, p4.y, p5.x, p5.y, p6.x, p6.y);
  graphics.bezierCurveTo(p7.x, p7.y, p8.x, p8.y, p9.x, p9.y);
  graphics.bezierCurveTo(p10.x, p10.y, p11.x, p11.y, p0.x, p0.y);
  graphics.fill({ color: 0x000000, alpha: 0.22 });

  graphics.rect(
    feet.x - spriteWidth * 0.5,
    feet.y - spriteHeight + screenOffsetY,
    spriteWidth,
    spriteHeight,
  );
  graphics.fill({ color: player.color });
  graphics.stroke({ color: 0xff8787, width: Math.max(1, 2 * feet.scale) });
}

(async () => {
  const app = new Application();

  await app.init({
    background: "#08131f",
    resizeTo: window,
    antialias: true,
  });

  document.getElementById("pixi-container")!.appendChild(app.canvas);

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

    drawWorldTiles(scene, app, camera, world, tileX, tileY, screenOffsetY);
    drawPlayer(scene, app, camera, player, screenOffsetY);

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
