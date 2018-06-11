import {Mesh, CircleBufferGeometry, MeshBasicMaterial, 
	    Vector3, SphereBufferGeometry, LinearFilter, RGBFormat, Texture, 
	    NearestFilter, Scene, Color, DoubleSide} from 'three';
import {Artwork} from './Artwork';

let autoplay = false;
let play = false;


const camHeight = 2.;
class VideoSphereMesh extends Mesh {
	static sphereBufferGeometry: SphereBufferGeometry = (() => {
		let sphereBufferGeometry = new SphereBufferGeometry( 800, 60, 40 );
		sphereBufferGeometry.scale( -1, 1, 1 );
		return sphereBufferGeometry;
	})() ;
	video: HTMLVideoElement = null;

	constructor(p: Vector3, uri: string) {
		super(VideoSphereMesh.sphereBufferGeometry, new MeshBasicMaterial({ color: new Color(0xffffff) }));
		this.position.copy(new Vector3 (p.x, p.y, p.y));
		this.material['map'] = this.createVideoTexture(uri);
		console.log(this);
	}
	createVideoTexture(uri) {
		let video = document.createElement( 'video' ) as HTMLVideoElement;
		video.width = 3840;
		video.height = 2160;

		video.loop = true;
		video.muted = false;
		video.src = uri;

		video.crossOrigin = 'anonymous';
		video.autoplay = autoplay;
		if(play) {video.play();}
		//video.pause();
		
		//video.canplay = e => {console.log('canplay'); console.log(e);}
		video.setAttribute( 'webkit-playsinline', 'webkit-playsinline' );
		this.video = video

		let texture = new Texture( video );
		texture.generateMipmaps = false;
		texture.minFilter =LinearFilter;// NearestFilter;
		texture.magFilter =LinearFilter; //NearestFilter;
		texture.format 	  = RGBFormat;
		texture.minFilter = LinearFilter;
		texture.format = RGBFormat;
		setInterval( function () {
			if ( video.readyState >= video.HAVE_CURRENT_DATA ) {
				texture.needsUpdate = true;
			}
		}, 1000 / 24 );

		return texture;
	}
}

export class Spot extends Mesh {
	static readonly geometry: CircleBufferGeometry = new CircleBufferGeometry(.5, 64);
	
	isCursorOver 	: boolean = false;
	isLoaded		: boolean = false;
	loadState 		: number  = 0;
	readonly maxLoadState : number = 40;
	public static onSpotSelected: (spot: Spot | void) => void = () => {console.warn('onSpot selected not implemented yet !');};
	artworks : Artwork[] = [];
	videoSphere : VideoSphereMesh;
	camPosition : Vector3 = new Vector3(0, 2, 0);

	inColor = new Color(0xaaaadd);
	outColor = new Color(0x333355);

	constructor(o, scene: Scene) {
		super(Spot.geometry, new MeshBasicMaterial({color : 0x333355, opacity : 0.5, transparent : true}));
		this.material['side'] = DoubleSide;
		let eyePosition = new Vector3(o.position.x, camHeight, o.position.z); 
		this.position.copy(new Vector3(o.position.x, o.position.y, o.position.z));
		this.scale	 .copy(new Vector3(o.scale.x   , o.scale.y	 , o.scale.z   ));
		this.rotateY(Math.PI * .5);
		console.log('hello spot');
		this.name = o.name;

		o.artworks.forEach( artwork => {
			this.artworks.push(new Artwork(artwork, scene));
		});

		this.videoSphere = new VideoSphereMesh(eyePosition, o.videoUri); 
		scene.add(this.videoSphere);
		this.camPosition = eyePosition;
		console.log(this.name);
		console.log(this.camPosition);
		console.log(this.position);
		//this.visible = true;
		this.onBeforeRender = this.update;
		scene.add(this);
	}

	onStartCursorOver() {
		if ( !this.isCursorOver ) {
			this.isCursorOver = true;
			this.loadState = 0;
			this.isLoaded = false;
			this.material['color'] = this.inColor;
			console.log(this.name + ' out');
		}
	}

	onLeave() {
		console.log(this.name + ' leave');
		this.isLoaded = false;
		this.isCursorOver = false;
		this.material['color'] =this.outColor;

	}

	update() {
		if(this.isCursorOver) {
			this.whileCursorOver();
		} else if (this.loadState > 0) {
			if (this.loadState-- <= 0) {
				this.loadState == 0 ;
			}
			console.log(this.name + ' ' + this.loadState);
		}
	}

	whileCursorOver() {
		if (!this.isLoaded) {			
			if (this.loadState < this.maxLoadState) {
				this.loadState += 1;
			} else {
				this.loadState = this.maxLoadState;
				this.isLoaded = true;
				this.moveSpot();				
			}
			console.log(this.name + ' ' + this.loadState);
		}
	}
	moveSpot() {
		this.videoSphere.visible = true;
		this.videoSphere.video.muted = false;

		Spot.onSpotSelected(this);
		console.log('movespot', this.position.x);
		this.artworks.forEach(a => {
			a.visible = true;
		})
	}


	onLeaveSpot() {
		this.videoSphere.visible = false;
		this.videoSphere.video.muted = true;
		console.log('leave', this.position.x);
		this.artworks.forEach(a => {
			a.visible = false;
		})
	}
}