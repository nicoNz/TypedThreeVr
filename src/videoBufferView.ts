import {MediaPlayer} from './MediaPlayer';
export class VideoBufferView {
	canvas : HTMLCanvasElement;
	ctx : CanvasRenderingContext2D;
	mediaList: MediaPlayer[] = [];
	constructor() {
		let canvas = document.createElement('canvas');
		canvas.style.position = 'absolute';
		canvas.style.right = '20px';
		canvas.style.top = '50px';
		canvas.style.zIndex = '999';
		canvas.style.border = '1px solid #fff';
		canvas.height = 200;
		canvas.width = 500;
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		document.body.appendChild(canvas);
	}

	drawBuffers(vids: HTMLVideoElement[]) {
	}

	addMedia(m: MediaPlayer) {
		this.mediaList.push(m)
	}
	update() {
		console.log('bufferview update');
		window.requestAnimationFrame(() => {

			let ctx= this.ctx;
			ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			
			let h = this.canvas.height / this.mediaList.length;
			let iWidth = 1./this.canvas.width;
			let y = 0;
			for(let m of this.mediaList) {
				let v = m.player;
				ctx.fillStyle="#FF0000";
				let d = v.duration;
				let t = v.currentTime;
				let prg =  t/d ;
				let rng = v.buffered;

				for (let i = 0 ; i < rng.length ; i++) {
					let b = this.canvas.width*rng.start(i)/d;
					let e = this.canvas.width*rng.end  (i)/d;
					ctx.fillRect(b, y*h, e-b, h);
					console.log(e);
				}
				ctx.fillStyle="#00FF00";
				ctx.fillRect(this.canvas.width*prg, y*h, 1.5, h);
				y++;
			}

		});

	}
		

}


