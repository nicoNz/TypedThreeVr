import THREE = require('three');
import dat = require('dat.gui');
import {WEBVR} from './WebVR';
import {dataLeft} from './dataLeft';
import {dataRight} from './dataRight';
import {dataCenter} from './dataCenter';
import {Artwork, loadTextures} from './Artwork';
import {Spot} from './Spot';
import {settings} from './settings';
import {VideoBufferView} from './videoBufferView';

var container;
var camera, scene, renderer;
var isUserInteracting = false;
var mouse = new THREE.Vector2();
var lookAt;
var isMouseDown = false;
var crosshair;

var lon = 0, onMouseDownLon = 0;
var lat = 0, onMouseDownLat = 0;
var phi = 0, theta = 0;
var distance = 50;
var isVR = true;
var raycaster = new THREE.Raycaster();
var onMouseDownMouseX = 0, onMouseDownMouseY = 0;
var onPointerDownPointerX = 0;
var onPointerDownPointerY = 0;
var onPointerDownLon = 0;
var onPointerDownLat = 0;
var isDisplayingImage = false;
var spotsInitialData;
var gui;

var performance = false;
var showBuffers = false;



interface Data {
	picture  : THREE.Mesh,
	artworks : Artwork[],
	spots : Spot[],
	spot : Spot,
	highlightedArtwork 	: Artwork,
	highlightedSpot		: Spot,
	selectedArtwork 	: Artwork,
	selectedSpot		: Spot,
	videoControls: {
		video : HTMLVideoElement,
		mesh : THREE.Mesh
	}[],
	videoBufferView : VideoBufferView,
	switchModeButton: HTMLButtonElement,
	cursor: THREE.Mesh,

}

let data: Data = {

	picture : null,
	artworks 	  : [],
	spots  		  : [],
	spot : null,

	highlightedArtwork 	: null,
	highlightedSpot		: null,

	selectedArtwork 	: null,
	selectedSpot		: null,
	videoControls : null,
	videoBufferView : null,
	switchModeButton : null,
	cursor: null,
};




function init() {
	container = document.createElement( 'div' );
	document.body.appendChild( container );

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0x505050 );

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1100 );
	camera.layers.enable( 1 );
	scene.add( camera );

	if(settings.withVR) {
		crosshair = new THREE.Mesh(
			new THREE.RingGeometry( 0.02, 0.04, 32 ),
			new THREE.MeshBasicMaterial( {
				color: 0xffffff,
				opacity: 0.5,
				transparent: true
			} )
		);
		crosshair.position.z = - 2;
		camera.add( crosshair );
		data.cursor = crosshair;
	}

	createImage();

	Artwork.onArtworkSelected = (texRef: THREE.Texture) => {
		data.picture.material['map'] = texRef;
		data.picture.material['needsUpdate'] = true;
		data.picture.visible = true;
		data.cursor.visible = false;
		console.log('image : ');
		console.log(data.picture);

	};
	Artwork.onLeave = () => {
		data.picture.material['map'] = null;
		data.picture.visible = false;
		data.cursor.visible = true;
	};

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.vr.enabled = true;
	container.appendChild( renderer.domElement );

	renderer.domElement.addEventListener( 'mousedown', onMouseDown, false );
	renderer.domElement.addEventListener( 'mouseup', onMouseUp, false );
	renderer.domElement.addEventListener( 'mousemove', onMouseMove, false );
	renderer.domElement.addEventListener( 'touchstart', onMouseDown, false );
	renderer.domElement.addEventListener( 'touchend', onMouseUp, false );

	window.addEventListener( 'resize', onWindowResize, false );
	window.addEventListener( 'vrdisplaypointerrestricted', onPointerRestricted, false );
	window.addEventListener( 'vrdisplaypointerunrestricted', onPointerUnrestricted, false );

	var button =  WEBVR.createButton( renderer , (b) => { isVR = b });
	document.body.appendChild( button );
	if(showBuffers) {
		data.videoBufferView = new VideoBufferView();
	}
	let b = document.createElement('button');
	_stylizeElement(b);

	b.onclick = ( e: MouseEvent ) => {
		if(settings.fullMode) {
			data.spots.forEach(s=>{
				var playPromise = s.videoSphere.video.play();
				if (playPromise !== undefined) {
	  				playPromise
	  				.then(function() {
	    				console.log('started to play');
	  				})
	  				.catch(function(error) {
	  					console.warn('fail to play');
	  				});
				}
			});
			console.log('full');
		} else {
			console.log('on switch perf click');
			switchMode();
		}
	}
	document.body.appendChild( b );
	data.switchModeButton = b;

	spotsInitialData = [
		dataLeft,
		dataCenter,
		dataRight
	];

	data.spots = [];
	let spots = data.spots;
	spotsInitialData.forEach( spotInitialData => {
		spots.push(new Spot(spotInitialData, scene));
	});

	spots[0].artworks.forEach(a => {
		a.material['color'] = a.outColor;
	});
	spots[1].artworks.forEach(a => {
		a.material['color'] = a.outColor;
	});
	spots[2].artworks.forEach(a => {
		a.material['color'] = a.outColor;
	});

	Spot.onSpotSelected = (selection: Spot) => {
		if (data.spot != null) {
			data.spot.onLeaveSpot();
		} else {
			console.log('data is still null');
		}
		data.spot = selection;
		console.log('selection');
		console.log(selection);
		camera.position.copy(selection.camPosition);
		updateCamera();
		data.spots.forEach(s=>{
			console.log('position');
			console.log(s.position);
		});
	}

	spots[0].onLeaveSpot();
	spots[1].moveSpot();
	spots[2].onLeaveSpot();
	
	let videos = [];
	spots.forEach((s: Spot) => {
		videos.push(s.videoSphere.video);
	});
	// data.videoControls = [];
	videos.forEach((v: Spot) => {
		if(showBuffers) {		
			if(v != null) {
				v.addEventListener('progress',  () => {
					data.videoBufferView.drawBuffers(videos);
				});
			}
		}
	});

	camera.position.copy(data.spot.camPosition);

	document.onkeypress = (k) => {
		if(k.charCode === 32) {
			console.log('orientation');
			console.log(VRPose['orientation']);
		}
	}
	gui = setupGui();
	let playPromise = data.spots[0].videoSphere.video.play();
	if (playPromise !== undefined) {
		playPromise
		.then(function() {
			console.log('started to play');
		})
		.catch(function(error) {
			console.log('fail to play');
		})
	}
} 

let isPlaying = true;
let cursor = 0;


function switchMode() {

	performance = !performance;
	console.log('performance : ' + performance);


	let s = data.spots[0];
	if (performance) {
		data.switchModeButton.textContent = 'SWITCH TO EXHIBITION'
		s.moveSpot();
		s.setVideoMode();
		s.videoSphere.video.currentTime = 4*60+35;
		let playPromise = s.videoSphere.video.play();
		if (playPromise !== undefined) {
			playPromise
			.then(function() {
   				console.log('started to play');
  			})
  			.catch(function(error) {
    			console.log('started to play');
  			})
  		}
	 	data.spots[1].onLeaveSpot();
		data.spots[2].onLeaveSpot();
  		data.spots[1].visible = false;
  		data.spots[2].visible = false;
  	}
	else {
		s.setImageMode();
		data.switchModeButton.textContent = 'LAUNCH PERFORMANCE';

		data.spots[2].visible = true;
  		data.spots[1].visible = true;
	}
}

function play() {
	console.log('PLAY');
	isPlaying = true;
	data.spots.forEach(s => {
		let v = s.videoSphere.video;
		v.currentTime = cursor;
		v.play();
	});
}

function pause() {
	console.log('PAUSE');
	isPlaying = false;
	data.spots.forEach(s => {
		s.videoSphere.video.pause();
		s.videoSphere.video.currentTime = cursor;
	});
}

function onMouseMove( event ) {

	if ( isUserInteracting === true ) {
		//console.log('move');
		lon = ( onPointerDownPointerX - event.clientX ) * 0.1 + onPointerDownLon;
		lat = ( event.clientY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;
	}
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function onMouseDown(event) {
	if (event.clientX > window.innerWidth) return;
	event.preventDefault();
	isUserInteracting = true;
	isMouseDown = true;

	onPointerDownPointerX = event.clientX as number;
	onPointerDownPointerY = event.clientY as number;

	onPointerDownLon = lon;
	onPointerDownLat = lat;
}
function onArtworkSelected(artwork) {
}

function onMouseUp() {
	isMouseDown = false;
	isUserInteracting = false;
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}


function updateCamera() {
	lat = Math.max( - 85, Math.min( 85, lat ) );
	phi = THREE.Math.degToRad( 90 - lat );
	theta = THREE.Math.degToRad( lon );

	var p = {
		x : distance * Math.sin( phi ) * Math.cos( theta ),
		y : distance * Math.cos( phi ),
		z : distance * Math.sin( phi ) * Math.sin( theta )
	};
	try{
		camera.lookAt(p.x, p.y, p.z);
	}
	catch(e){
		console.log(e);
	}	
}

function animate() {
	renderer.animate( render );
}

function rayCast() {

	raycaster.setFromCamera( settings.withVR ?  { x: 0, y: 0 } : mouse , camera );

	if(!performance) {	
		var intersectsSpots = raycaster.intersectObjects( data.spots );
		if( intersectsSpots.length == 0 ) {
			if (data.highlightedSpot != null) {
				data.highlightedSpot.onLeave();
				data.highlightedSpot = null;
			}
		} else {	
			let collidee = intersectsSpots[0].object as Spot;
			collidee.onStartCursorOver();
			data.highlightedSpot = collidee;
		}
	}


	if(data.spot != null) {
		var intersectsArtworks = raycaster.intersectObjects( data.spot.artworks );
		if( intersectsArtworks.length == 0 ) {
			if( data.highlightedArtwork != null ) {
				data.highlightedArtwork.onLeave();
				data.highlightedArtwork = null;
			}	
		} else {	
			let collidee = intersectsArtworks[0].object as Artwork;
			collidee.onStartCursorOver();
			data.highlightedArtwork = collidee;
		}
	}
}

function getZoom() {
	if(data.highlightedArtwork != null) {
		return 1 + 1.8*(data.highlightedArtwork.loadState / data.highlightedArtwork.maxLoadState)	
	} else {
		return camera.zoom > 1 ? camera.zoom - .05 : 1;

	}
}

var zoomDir = 0;
function render() {
	camera.zoom = getZoom() ;
	updateCamera();
	camera.updateProjectionMatrix();
	rayCast();
	renderer.render( scene, camera );
}

//__________________________________________________________//
//-------------------object creation------------------------//

function createImage() {
	var geometry = new THREE.PlaneBufferGeometry(1, 1, 1);
	var material   = new THREE.MeshBasicMaterial(  { color : '#ffffff'}  );
	material.side = THREE.DoubleSide;
	var mesh = new THREE.Mesh( geometry, material );

	var gMask = new THREE.PlaneBufferGeometry(1, 1, 1);
	var gMaterial   = new THREE.MeshBasicMaterial( { color : '#444444'} );
	gMaterial.transparent = true;
	gMaterial.opacity = 1.;
	gMaterial.side = THREE.DoubleSide;
	var gMesh = new THREE.Mesh( gMask, gMaterial );
	gMesh.scale.copy(new THREE.Vector3(2, -2, 2));
	gMesh.position.z = -2;
	mesh.position.z = -2;

	camera.add(mesh);
	mesh['layer'] = 1;
	mesh.visible = false;
	data.picture = mesh;
}

//_________________________Collisions________________________//
//-----------------------------------------------------------//

var enterZoom = false;
var leaveZoom = false;
var zoomLevel = 1.;
var selectionElapse = 0;

//_______________________________________________________________//
//---------------------------------------------------------------//

function setupGui() {
	
 	var gui = new dat.gui.GUI();
 	data.spots.forEach( spot => {
 		var spotFolder = gui.addFolder(spot.name);
 		spot.artworks.forEach( a => {
 			var artworkFolder = spotFolder.addFolder(a.name);
 			artworkFolder.addVector('position', a.position, (v) => {data.spots});
 			artworkFolder.addVector('scale'   , a.scale   );
 			artworkFolder.add(a, 'orientation').onChange(v => {a.rotation.copy( new THREE.Euler(0, Math.PI * .5 * v, 0))});//.onChange((v) => {o.orientation = v; updateArtwork(o, v)});
 		});
 	});
    return gui;
}


dat.gui.GUI.prototype.addVector = function(name, o, cb) {
	if(cb == undefined) {
		cb=(v)=>{console.log(v)};
	}
	var folder = this.addFolder(name);
	folder.add(o, 'x').onChange( v => {o.x = v; cb(o);} );
	folder.add(o, 'y').onChange( v => {o.y = v; cb(o);} );
	folder.add(o, 'z').onChange( v => {o.z = v; cb(o);} );
	return this;
}



var info = document.getElementById('ctInfo');
function onPointerRestricted() {
	var pointerLockElement = renderer.domElement;
	if ( pointerLockElement && typeof(pointerLockElement.requestPointerLock) === 'function' ) {
		pointerLockElement.requestPointerLock();
	}
}

function onPointerUnrestricted() {
	var currentPointerLockElement = document.pointerLockElement;
	var expectedPointerLockElement = renderer.domElement;
	if ( currentPointerLockElement && currentPointerLockElement === expectedPointerLockElement && typeof(document.exitPointerLock) === 'function' ) {
		document.exitPointerLock();
	}
}



function _stylizeElement( element : HTMLButtonElement) {
	element.style.position = 'absolute';
	element.style.top = '60px';
	element.style.padding = '12px 6px';
	element.style.border = '1px solid #fff';
	element.style.borderRadius = '4px';
	element.style.background = 'transparent';
	element.style.color = '#fff';
	element.style.font = 'normal 13px sans-serif';
	element.style.textAlign = 'center';
	element.style.zIndex = '999';
	element.textContent = 'LAUNCH PERFORMANCE'
}


init();
animate();
