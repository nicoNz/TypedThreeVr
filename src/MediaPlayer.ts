export abstract class MediaPlayer {
	player : HTMLAudioElement | HTMLVideoElement;
	fadeMode: boolean = true;
	src: string;
	volume: number;
	constructor(src: string, min?: number, max?: number){
		this.player = this.createMediaElement();
		this.setSrc(src);
		//this.player.crossOrigin = 'anonymous';
		this.setReadRange(min, max);
		this.player.preload = 'auto';
		this.player.loop = true;


	}

	abstract createMediaElement (): HTMLVideoElement | HTMLAudioElement;

	setSrc(src: string) {
		this.src = src;
		this.player.src = src;
	}
	setVolume(v) {
		this.volume = v;
	}
	setReadRange(min: number, max: number) {
		let src = this.src;
		this.player.src = src + '#t='+min+','+max;
	}
	fadeIn(onIn?: ()=>void ) {
		setTimeout(() => {
			if(this.volume < 1) {
				this.setVolume(this.volume + .04);	
				this.fadeIn(onIn?onIn: null);	
			} else {
				this.volume = 1;
				if(onIn != undefined){
					onIn();
				}
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
				if(onOut != undefined) {
					onOut();
				}
			}
		}, .04);
	}
	loop(b: boolean) {
		if (b == undefined) {
			b = true;
		}
		this.player.loop = b;
	}
	play() {
		if(this.fadeMode) {
			this.fadeIn();
		}
		let playPromise = this.player.play();
		if (playPromise !== undefined) {
			playPromise
			.then(function() {
				console.log('started to play');
			})
			.catch(function(error) {
				console.log('fail to play');
				console.warn(error);
			})
		}
	}
	pause() {
		if(this.fadeMode) {
			this.fadeOut();
		}
		this.player.pause();
	}
	stop() {
		this.pause();
		this.player.currentTime = 0;
	}
}
//_________________________________________________________________
//-----------------------------------------------------------------
export class VideoPlayer extends MediaPlayer {
	constructor(src: string, min: number, max: number){
		super(src, min, max);
		let player = this.player as HTMLVideoElement;
		player.width = 3840;
		player.height = 2160;
		player.setAttribute( 'webkit-playsinline', 'webkit-playsinline' );
		player.setAttribute('type', "video/youtube")
	}
	createMediaElement(): HTMLVideoElement | HTMLAudioElement {
		return document.createElement('video');
	}
}

export class AudioPlayer extends MediaPlayer {
	constructor(src: string, min: number, max: number){
		super(src, min, max);
	}
	createMediaElement(): HTMLVideoElement | HTMLAudioElement {
		return document.createElement('audio');
	}
}

