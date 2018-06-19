import {Vector2, Mesh} 	 from 'three';
import {Artwork} 		 from './Artwork';
import {Spot} 			 from './Spot';
import {VideoBufferView} from './videoBufferView';

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

export let applicationSettings = {
	withVR : true 	as boolean,
	mouse : null	as Vector2,



}

export let debugSettings = {
	displayBufferViewer : false,
}

export const buildtimeSettings = {

}