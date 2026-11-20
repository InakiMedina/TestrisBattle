import { Scene, GameObjects } from 'phaser';

export class CustomeButton extends GameObjects.Container {
	background: GameObjects.Rectangle;
	buttonBorder: GameObjects.Rectangle;
	buttonText: GameObjects.Text;

	constructor(scene: Scene, 
			x: number, 
			y: number, 
			w: number,
			h: number,
			label: string, 
			callback: () => void) {

		const buttonColor = Number.parseInt(
			getComputedStyle(document.documentElement)
				.getPropertyValue('--app-deep-background')
				.trim()
				.slice(1),
			16
		)

		const hoverColor = Number.parseInt(
			getComputedStyle(document.documentElement)
				.getPropertyValue('--app-accent-color')
				.trim()
				.slice(1),
			16
		);

		const margin = 10;

        super(scene, x, y);

		this.background = scene.add.rectangle(0, 0, w, h, buttonColor)
			.setInteractive({ useHandCursor: true })
			.setRounded(10)

		this.buttonBorder = scene.add.rectangle(0, 0, w + margin*2, h + margin*2)
			.setStrokeStyle(1, 0xffffff)
			.setRounded(20)

		this.buttonText = scene.add.text(0, 0, label, {
			fontFamily: 'Arial',
			fontSize: '18px',
			color: '#ffffff',
			align: 'center'
		}).setOrigin(0.5)

		this.add([this.background, this.buttonText, this.buttonBorder])

		scene.add.existing(this)

		this.background.on('pointerdown', callback);
		this.background.on('pointerover', () => { 
			this.background.setFillStyle(hoverColor);
			this.buttonText.setColor('#000000')
			this.buttonBorder.setStrokeStyle(1, hoverColor)
		})
		this.background.on('pointerout', () => {
			this.background.setFillStyle(buttonColor)
			this.buttonText.setColor('#ffffff')
			this.buttonBorder.setStrokeStyle(1, 0xffffff)
		})
	}
}