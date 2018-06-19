import {Vector2, Mesh} 	 from 'three';
import {Artwork} 		 from './Artwork';
import {Spot} 			 from './Spot';
import {VideoBufferView} from './videoBufferView';
import {MediaPlayer, VideoPlayer, AudioPlayer} from './MediaPlayer';

export let settings = {
	camHeight : 2.,
	colors : {
		mouseOver : 0x666666,
		standard : 0xaaaacc,
		defaultSpot :  0x555555
	},
	withVR : true,
	fullMode : false, //if use 3 players at the same time

	showBuffers: true,
}

export let applicationSettings = {
	withVR : true 	as boolean,
	showBuffers : true as boolean,
	leftVideoStartTime: 4*60+30,
	leftVideoEndTime: 5*60+10,
	
}

//show and modify elements in the scene for fine tuning
export let sceneInspector = {
	camHeight : 2.,
	picture  : null as Mesh,
	artworks : [] 	as Artwork[],
	spots 	 : [] 	as Spot[],
	spot 	 : null as Spot,
	highlightedArtwork 	: null as Artwork,
	highlightedSpot		: null as Spot,
	selectedArtwork 	: null as Artwork,
	selectedSpot		: null as Spot,
	videoBufferView		: null as VideoBufferView,
	switchModeButton 	: null as HTMLButtonElement,
	cursor				: null as Mesh,
}



export let states = {
	mouse : null	as Vector2,
	onMouseDownMouseX : 0, 
	onMouseDownMouseY : 0,
	onPointerDownPointerX : 0,
	onPointerDownPointerY : 0,
	onPointerDownLon : 0,
	onPointerDownLat : 0,
	lon : 0, onMouseDownLon : 0,
	lat : 0, onMouseDownLat : 0,
	phi : 0, theta : 0,
	isMouseDown : false,
	isDisplayingImage : false,
	leftVideo : null as VideoPlayer,
	audioPlayer : null as AudioPlayer,
}

export let debugSettings = {
	displayBufferViewer : false,
}

export const buildtimeSettings = {

}