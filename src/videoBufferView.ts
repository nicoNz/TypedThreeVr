export class VideoBufferView {
	canvas : HTMLCanvasElement;
	ctx : CanvasRenderingContext2D;
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
		window.requestAnimationFrame(() => {

			let ctx= this.ctx;
			ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			ctx.fillStyle="#FF0000";
			let h = this.canvas.height / vids.length;
			let iWidth = 1/this.canvas.width;
			let y = 0;
			for(let v of vids) {
				
				let d = v.duration;
				let t = v.currentTime;
				let prg =  d/t ;
				let rng = v.buffered;

				for (let i = 0 ; i < rng.length ; i++) {
					let b = this.canvas.width*rng.start(i)/d;
					let e = this.canvas.width*rng.end(i)/d;
					ctx.fillRect(b, y*h, e-b, h);
					console.log(e);
				}
				y++;
			}

		});
	}
		

}


