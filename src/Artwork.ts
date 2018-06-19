import {Mesh, PlaneBufferGeometry, MeshBasicMaterial, Texture, Vector3, TextureLoader, LinearFilter, RGBFormat, Scene, Color} from 'three'

type TexCollection = {[key: string]:Texture;};

let is4K = true;
let filVersion = !is4K ? '.png' : '800.jpg';
export function loadTextures(): TexCollection {
	var textures = [
		{name : 'awAne', 	   url : './assets/awAne'	  +filVersion			},
		{name : 'awCameleon',  url : './assets/awCameleon'+filVersion 			},
		{name : 'awGiraf', 	   url : './assets/awGiraf'	+filVersion	 			},
		{name : 'awKangourou', url : './assets/awKangourou'+filVersion			}, 
		{name : 'awOie', 	   url : './assets/awOie'+filVersion				},
		{name : 'awPerroquet', url : './assets/awPerroquet'+filVersion			},

		{name : 'awChouette',  url : './assets/awChouette'+filVersion			},
		{name : 'awPaon', 	   url : './assets/awPaon'+filVersion				},
		{name : 'awPelican',   url : './assets/awPellican'+filVersion			},
		{name : 'awPingouin',  url : './assets/awPingouin'+filVersion			},
		{name : 'awZebre',     url : './assets/awZebre'+filVersion				},
		{name : 'awGrue',      url : './assets/awGrue'+filVersion				},
		{name : 'awPegase',    url : './assets/awPegase'+filVersion				},
		{name : 'awColombe',   url : './assets/awColombe'+filVersion			},
	];

	let textureRefs: TexCollection = {};

	textures.forEach( t => {
		try{
			var texture = new TextureLoader().load( t.url );
			texture.minFilter = LinearFilter;
			texture.format = RGBFormat;
			textureRefs[t.name] = texture;
		}
		catch (e) {
			console.log(e);
		}
	});
	return textureRefs;
}


let showZone = false;

console.log('artwork file');
let textureRefs: TexCollection = loadTextures();


export class Artwork extends Mesh{

	inColor: Color = new Color(0x444466);
	outColor: Color = new Color(0xaaaacc);

	isCursorOver 	: boolean = false;
	isLoaded		: boolean = false;
	loadState 		: number = 0;
	readonly maxLoadState : number = 40;

	textureRef : Texture = null;
	public static onArtworkSelected: (texture: Texture | void) => void = () => {console.warn('onArtworkSelected not implemented yet !')};
	public static onLeave: () => void = () => {console.warn('onArtworkSelected not implemented yet !')};
	orientation: number;

	static readonly geometry: PlaneBufferGeometry = new PlaneBufferGeometry(1, 1, 1, 1);
	constructor (o, scene: Scene) {
		super( Artwork.geometry, new MeshBasicMaterial({color : 0xaaaacc, opacity : 0.1, transparent : true}));
		this.position.copy(new Vector3(o.position.x, o.position.y, o.position.z));
		this.scale	 .copy(new Vector3(o.scale.x   , o.scale.y	 , o.scale.z   ));
		this.rotateY(o.orientation*Math.PI * .5	);
		this.name = o.name;
		this.textureRef = textureRefs[o.name];
		this.orientation = o.orientation;
		scene.add(this);

		this.onBeforeRender = this.update;
		this.visible = showZone;
	
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
		Artwork.onLeave();
	}

	update() {
		if(this.isCursorOver) {
			this.whileCursorOver();
		} else if (this.loadState > 0) {
			if (this.loadState-- <= 0) {
				this.loadState == 0 ;
			}
		}
	}

	whileCursorOver() {
		if (!this.isLoaded) {			
			if (this.loadState < this.maxLoadState) {
				this.loadState += 1;
			} else {
				this.loadState = this.maxLoadState;
				this.isLoaded = true;
				this.displayArtworkPicture();
			}
		}
	}
	displayArtworkPicture() {
		Artwork.onArtworkSelected(this.textureRef);
	}
}