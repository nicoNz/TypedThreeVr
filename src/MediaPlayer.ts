export class VideoPlayer {
	player: HTMLVideoElement;
	src: string;
	volume: number;
	constructor(src: string){
		let player = document.createElement('video');
		player.src = src;

	}
	setSrc(src: string) {
		this.src = src;
		this.player.src = src;
	}
	setVolume(v) {
		this.volume = v;
	}
	setReadRange:(from: number, to: number) {
		//modify tghe url
	}
	fadeIn( onIn?: ()=>void ) {
		setTimeout(() => {
			if(this.volume < 1) {
				this.setVolume(this.volume + .04);	
				this.fadeIn(onIn?onIn: null);	
			} else {
				this.volume = 1;
				onIn();
			}
		}, .04);
	}
	fadeOut(onOut?: ()=>void ) {
		setTimeout(() => {
			if(this.volume > 0) {
				this.setVolume(this.volume - .04);	
				this.fadeOut(onOut?onOut: null);	
			} else {
				this.volume = 0;
				onOut();
			}
		}, .04);
	}

}

export class AudioPlayer {
	player: HTMLVideoElement;
	src: string;
	volume: number;
	constructor(src: string){
		let player = document.createElement('video');
		player.src = src;
	}
	setSrc(src: string) {
		this.src = src;
		this.player.src = src;
	}
	setVolume(v) {
		this.volume = v;
	}
	fadeIn() {
		setTimeout(() => {
			if(this.volume < 1) {
				this.setVolume(this.volume + .04);	
				this.fadeIn();	
			} else {
				this.volume = 1;
			}
		}, .04);
	}
	fadeOut() {
		setTimeout(() => {
			if(this.volume > 0) {
				this.setVolume(this.volume - .04);	
				this.fadeOut();	
			} else {
				this.volume = 0;
			}
		}, .04);
	}
}
