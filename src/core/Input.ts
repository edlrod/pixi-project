export class Input {
	private readonly heldKeys = new Set<string>();

	constructor(target: Window) {
		target.addEventListener("keydown", this.onKeyDown);
		target.addEventListener("keyup", this.onKeyUp);
		target.addEventListener("blur", this.onBlur);
	}

	isHeld(code: string) {
		return this.heldKeys.has(code);
	}

	private readonly onKeyDown = (event: KeyboardEvent) => {
		this.heldKeys.add(event.code);
	};

	private readonly onKeyUp = (event: KeyboardEvent) => {
		this.heldKeys.delete(event.code);
	};

	private readonly onBlur = () => {
		this.heldKeys.clear();
	};
}
