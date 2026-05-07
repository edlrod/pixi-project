export type WorldPoint = {
  x: number;
  y: number;
  z?: number;
};

export type ProjectedPoint = {
  x: number;
  y: number;
  scale: number;
  depth: number;
};

type CameraOptions = {
  x?: number;
  y?: number;
  yaw?: number;
  pitch?: number;
  tileSize?: number;
  distance?: number;
  focalLength?: number;
  zScale?: number;
  horizonRatio?: number;
  followScreenY?: number;
};

export class Pseudo3DCamera {
  x: number;
  y: number;
  yaw: number;
  pitch: number;
  tileSize: number;
  distance: number;
  focalLength: number;
  zScale: number;
  horizonRatio: number;
  followScreenY: number;

  constructor(options: CameraOptions = {}) {
    this.x = options.x ?? 0;
    this.y = options.y ?? 0;
    this.yaw = options.yaw ?? 0;
    this.pitch = options.pitch ?? 0.3;
    this.tileSize = options.tileSize ?? 48;
    this.distance = options.distance ?? 864;
    this.focalLength = options.focalLength ?? 768;
    this.zScale = options.zScale ?? 1;
    this.horizonRatio = options.horizonRatio ?? 0.22;
    this.followScreenY = options.followScreenY ?? 0.5;
  }

  project(
    point: WorldPoint,
    screenWidth: number,
    screenHeight: number,
  ): ProjectedPoint {
    const z = point.z ?? 0;
    const dx = (point.x - this.x) * this.tileSize;
    const dy = (point.y - this.y) * this.tileSize;
    const scaledZ = z * this.tileSize;
    const cosYaw = Math.cos(this.yaw);
    const sinYaw = Math.sin(this.yaw);
    const rotatedX = dx * cosYaw - dy * sinYaw;
    const rotatedY = dx * sinYaw + dy * cosYaw;
    const pitchScale = Math.sin(this.pitch);
    const depth = Math.max(32, this.distance - rotatedY);
    const perspective = this.focalLength / depth;
    const horizonY = screenHeight * this.horizonRatio;

    return {
      x: screenWidth * 0.5 + rotatedX * perspective,
      y: horizonY + rotatedY * pitchScale * perspective - scaledZ * this.zScale * perspective,
      scale: perspective,
      depth,
    };
  }

  moveRelative(localX: number, localY: number) {
    const cosYaw = Math.cos(this.yaw);
    const sinYaw = Math.sin(this.yaw);

    this.x += localX * cosYaw + localY * sinYaw;
    this.y += -localX * sinYaw + localY * cosYaw;
  }

  movePointRelative(point: WorldPoint, localX: number, localY: number) {
    const cosYaw = Math.cos(this.yaw);
    const sinYaw = Math.sin(this.yaw);

    point.x += localX * cosYaw + localY * sinYaw;
    point.y += -localX * sinYaw + localY * cosYaw;
  }

  follow(point: WorldPoint, followSpeed = 1) {
    this.x += (point.x - this.x) * followSpeed;
    this.y += (point.y - this.y) * followSpeed;
  }

  getFollowOffset(targetScreenY: number, currentScreenY: number) {
    return targetScreenY - currentScreenY;
  }

  rotateYaw(delta: number) {
    this.yaw += delta;
  }
}
