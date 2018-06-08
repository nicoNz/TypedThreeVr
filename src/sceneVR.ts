import THREE = require('three');
import dat = require('dat.gui');
import {WEBVR} from './WebVR';
import {dataLeft} from './dataLeft';
import {dataRight} from './dataRight';
import {dataCenter} from './dataCenter';

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
var rayCaster = new THREE.Raycaster();
var onMouseDownMouseX = 0, onMouseDownMouseY = 0;
var onPointerDownPointerX = 0;
var onPointerDownPointerY = 0;
var onPointerDownLon = 0;
var onPointerDownLat = 0;
var isDisplayingImage = false;
var spotsInitialData;
var gui;

var colors = {
	mouseOver : '#666666',
	default : "aaaacc",
	defaultSpot :  '#555555'
};

var settings = {
	withVR : true
}

var camHeight = 2;

var data = {
	material : null,
	room 	: null,
	picture : null,

	cubeTransform : {},
	artWorks 	  : [],
	refs 		  : [],
	spots  		  : [],
	spot : null,

	highlightedArtwork 	: null,
	highlightedSpot		: null,

	selectedArtwork 	: null,
	selectedSpot		: null,

	camera : {
		lookAtDir : {
			x : 0, y:0, z : 0
		},
		position : 'ref of spot'
	},
	textures : []
};

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
	}
	//nz add image to make in front of the user

	

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


	loadTextures();
	spotsInitialData = [
		dataLeft,
		dataCenter,
		dataRight
	];

	data.spots = [];
	var spots = data.spots;
	spotsInitialData.forEach( spotInitialData => {
		spots.push(createSpot(spotInitialData));
	});


	data.spots[0].camera = null;
	data.spots[1].camera = camera;
	data.spots[0].camera = null;

	camera.position.copy( data.spots[1].camPosition );
	
	data.spot = data.spots[1];
	onSpotSelected();

	createImage();	 
	console.log('init');

	scene.add(camera);

	data.picture.visible = false;
	document.onkeypress = (k) => {
		
		if(k.charCode === 32) {
			console.log('orientation');
			console.log(VRPose['orientation']);

		}
	}
	 gui = setupGui();
}



function onMouseMove( event ) {

	if ( isUserInteracting === true ) {
		console.log('move');
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

	onPointerDownPointerX = event.clientX;
	onPointerDownPointerY = event.clientY;

	onPointerDownLon = lon;
	onPointerDownLat = lat;
	if(data.selectedArtwork == null) {

/*
		if(data.highlightedSpot != null) {
			data.spot = data.highlightedSpot;
			onSpotSelected();
		}
*/
		if(data.highlightedArtwork != null) {
			console.log('is artwork highlight');
			//data.selectedArtwork = data.highlightedArtwork;
			console.log( data.selectedArtwork);
			
			data.picture.material.map = data.selectedArtwork.image;
			data.picture.material.needsUpdate = true;
			console.log(data.picture);
			//onArtworkSelected();
			data.picture.visible = true;
			data.spot.artworks.forEach(a=>{
 				a.visible = false;
 			});
		}

	} else {
		//data.selectedArtwork = null;
		data.picture.visible = false;
					data.spot.artworks.forEach(a=>{
 				a.visible = true;
 			});
	}	

}
function onArtworkSelected(artwork) {
}

function onMouseUp() {

	isMouseDown = false;
	isUserInteracting = false;


}

// function onPointerRestricted() {
// 	var pointerLockElement = renderer.domElement;
// 	if ( pointerLockElement && typeof(pointerLockElement.requestPointerLock) === 'function' ) {
// 		pointerLockElement.requestPointerLock();

// 	}
// }

// function onPointerUnrestricted() {
// 	var currentPointerLockElement = document.pointerLockElement;
// 	var expectedPointerLockElement = renderer.domElement;
// 	if ( currentPointerLockElement && currentPointerLockElement === expectedPointerLockElement && typeof(document.exitPointerLock) === 'function' ) {
// 		document.exitPointerLock();
// 	}
// }

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}


function updateCamera() {

	//var camera = data.spot.camera;
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



var zoomDir = 0;
function render() {
	camera.zoom = zoomLevel;
	updateCamera();
	camera.updateProjectionMatrix();
	renderer.render( scene, camera );
	//raycaster.setFromCamera( settings.withVR ?  { x: 0, y: 0 } : mouse , camera );

	if(data.highlightedArtwork != null) {
		if(zoomLevel < 2) {
			zoomLevel += .06;	
			
		} else {
			setTimeout( () => zoomDir = 0 , 600);
		}
		zoomDir = 1;
	}
	else {
		if(zoomDir == 1) {
			if(zoomLevel < 2) {
				zoomLevel += .06;			
			} else {
				setTimeout( () => zoomDir = 0 , 600);
			}
		}
		else {

			if(zoomLevel > 1) {
				
				if(zoomDir == 1) {
					setTimeout( () => zoomDir = 0 , 600);
				}
				else {	
					zoomLevel -= .06;
					zoomDir = -1;	
				}
			}
		}
	 }
	 if (zoomLevel >= 2 &&  data.highlightedArtwork != null) {
	 	data.picture.material.map = data.highlightedArtwork.image;
	 	if (data.picture.visible == false || data.picture.material.needsUpdate == false) {
		 	data.picture.visible = true;
			data.picture.material.needsUpdate = true;
			console.log(data.picture);

	 	}
	 	data.spot.artworks.forEach(a=>{
 			a.material.opacity = 0.;
 		});
	 }
	 else {
	 	data.picture.visible = false;
	 	data.spot.artworks.forEach(a=>{
 			a.material.opacity = .1;
 		});

	 }
	// if(data.highlightedArtwork != null) {

	// 	//data.highlightedArtwork.material.opacity = (zoomLevel - 1)*.5;
	// 	console.log('alpha' + (zoomLevel - 1)*.5);
	// } else if (zoomLevel <= 1.5) {
	// 	data.spots.forEach(s=>{

	// 	})
	// }


	

	

	if(data.selectedArtwork == null) {
		checkSpotCollision();
		checkArtworkCollision();
	}
	if(window['VRPose'] != undefined) {
		var o = VRPose['orientation'];
		if (o =! null) {
			info.innerHTML = o[0] + ' ' + o[1] + ' ' + o[2] + ' ' + o[3] + ' ';
		}
		else {
			info.innerHTML = "has orientation";
		}
	}
	else {
		info.innerHTML = "no orientation";
	}
	 
}


//__________________________________________________________//
//-------------------object creation------------------------//


function createVideoTexture(url) {
	var video = document.createElement( 'video' );
	//video.crossOrigin = 'anonymous';
	video.width = 640;
	video.height = 360;
	if(url === './assets/p3.mp4') {
		video.src = url;
		console.log('on');
	}
	else {
		console.log('off');
	}
	video.loop = true;
	video.muted = true;
	video.crossOrigin = 'anonymous';
	//video.autoplay = true;
	video.play();
	//video.progress = e => {console.log('progress'); console.log(e);}
	//video.canplay = e => {console.log('canplay'); console.log(e);}
	video.setAttribute( 'webkit-playsinline', 'webkit-playsinline' );

				let texture = new THREE.Texture( video );
				texture.generateMipmaps = false;
				texture.minFilter = THREE.NearestFilter;
				texture.magFilter = THREE.NearestFilter;
				texture.format = THREE.RGBFormat;

	setInterval( function () {

		if ( video.readyState >= video.HAVE_CURRENT_DATA ) {

			texture.needsUpdate = true;

		}

	}, 1000 / 24 );

	return texture;
}

function createImage() {
	var geometry = new THREE.PlaneBufferGeometry(1, 1, 1);
	var material   = new THREE.MeshBasicMaterial(  { color : '#ffffff'}  );
	material.side = THREE.DoubleSide;
	var mesh = new THREE.Mesh( geometry, material );
	data.material = material;

	mesh.scale.copy(new THREE.Vector3(.5, .5, .5));

	var gMask = new THREE.PlaneBufferGeometry(1, 1, 1);
	var gMaterial   = new THREE.MeshBasicMaterial( { color : '#444444'} );
	gMaterial.transparent = true;
	gMaterial.opacity = 1.;
	gMaterial.side = THREE.DoubleSide;
	var gMesh = new THREE.Mesh( gMask, gMaterial );
	gMesh.scale.copy(new THREE.Vector3(2, -2, 2));
	gMesh.position.z = -2;
	mesh.position.z = -2;
	//mesh.layer = 1;
	//gMesh.layer = 0;

	//camera.add(gMesh);
	camera.add(mesh);
	mesh['layer'] = 1;
	data.picture = mesh;
}

function createCircle(p) {
	var circleGeometry = new THREE.CircleBufferGeometry( 1, 128 );	
	var circleMaterial = new THREE.MeshBasicMaterial( { color: 0x0000ff , side : THREE.DoubleSide} );
	circleMaterial.side = THREE.DoubleSide;

	var circle = new THREE.Mesh( circleGeometry, circleMaterial );
	console.log(p);
	circle.rotateX(Math.PI * .5);
	circle.position.x = p.x;
	circle.position.y = p.y;
	circle.position.z = p.z;

	return circle;
}

function createVideoSphere(p, uri) {
	var sphereGeometry = new THREE.SphereGeometry( 800, 60, 40 );
	
	sphereGeometry.scale( -1, 1, 1 );
	console.log('x : ' + p.x,'y : ' +  p.y, 'z : ' + p.y);
	sphereGeometry.translate(p.x, p.y, p.y);
	var videoTexture = createVideoTexture(uri);
	videoTexture.minFilter = THREE.LinearFilter;
	videoTexture.format = THREE.RGBFormat;

	var sphereMaterial = new THREE.MeshBasicMaterial( { map : videoTexture } );
	sphereMaterial.transparent = false;
	//sphereMaterial.side = THREE.DoubleSide;
	//sphereMaterial.depthTest=false;
	//sphereMaterial.depthWrite=false;
	//sphereMaterial.wireframe = true;

	var spĥereMesh = new THREE.Mesh( sphereGeometry, sphereMaterial );
	scene.add( spĥereMesh );

	return spĥereMesh;
}

function createArtwork(o) {
	var geometry = new THREE.PlaneBufferGeometry(1, 1, 1);
	var material = new THREE.MeshLambertMaterial({transparent : true});
	material.depthTest=false;
	//material.depthWrite=false;
	material.side = THREE.DoubleSide;
	// material.transparent = true;
	//material.wireframe = true;
	material.opacity = 0.1;
	var mesh = new THREE.Mesh(geometry, material);
	mesh.name = o.name;
	mesh.rotateY(o.orientation*Math.PI * .5	);
	mesh.scale.copy(o.scale);
	mesh.position.copy(o.position);
	mesh['orientation'] = o.orientation;
	mesh.material['opacity'] = 0.1;
	mesh['image'] = data.textures[o.name];
	mesh.layers.set(1);

	scene.add(mesh);
	return mesh;
}


function createSpot(o) {	
	let eyePosition = new THREE.Vector3(o.position.x, camHeight, o.position.z);
	var mesh = createCircle(o.position);
	mesh.name = o.name;
	scene.add(mesh);
	mesh['artworks'] = [];
	o.artworks.forEach( artwork => {
		mesh['artworks'].push(createArtwork(artwork));
	});
	mesh['videoSphere'] = createVideoSphere(eyePosition, o.videoUri); 
	mesh['camPosition'] = eyePosition;
	return mesh;
}


function loadTextures() {
	var textures = [
		{name : 'awAne', 	   url : './assets/awAne.png'				},
		{name : 'awCameleon',  url : './assets/awCameleon.png' 			},
		{name : 'awGiraf', 	   url : './assets/awGiraf.png'	 			},
		{name : 'awKangourou', url : './assets/awKangourou.png'	}, 
		{name : 'awOie', 	   url : './assets/awOie.png'				},
		{name : 'awPerroquet', url : './assets/awPerroquet.png'			}
	];
	textures.forEach( t => {
		try{
			var texture = new THREE.TextureLoader().load( t.url );
			texture.minFilter = THREE.LinearFilter;
			texture.format = THREE.RGBFormat;
			data.textures[t.name] = texture;
		}
		catch (e) {
			console.log(e);
		}
	});
}


function onSpotSelected() {
	
	camera.position.copy(data.spot.camPosition);
	console.log(data.spots);
	console.log(data.spot);
	data.spots.forEach(o=>{
		if(o.name != data.spot.name) {
			
			o.videoSphere.material.opacity = .0;
			o.videoSphere.material.transparent = true;
			o.videoSphere.visible = false;

			o.artworks.forEach( a => {
				a.visible = false;
			});
		}
		else {

			o.videoSphere.material.transparent = true;
			o.videoSphere.material.opacity = 1;
			o.videoSphere.visible = true;
			o.artworks.forEach( a => {
				//a.material.transparent = false;
				//a.material.opacity = 1;
				a.visible = true;
			});
		}
	});





	console.log('on camera change');
}

//_________________________Collisions________________________//
//-----------------------------------------------------------//

function checkSpotCollision() {
	rayCaster.setFromCamera( settings.withVR ?  { x: 0, y: 0 } : mouse  , camera );
	var intersects = rayCaster.intersectObjects( data.spots );
	if(intersects.length == 0) {
	 	if(data.highlightedSpot != null) {
			unsetMaterialToHighlighted(data.highlightedSpot);
			data.highlightedSpot = null;

		}
	}
	else {	
		var collidee = intersects[0];
		onSpotCollided(collidee.object);
	}	
}

var enterZoom = false;
var leaveZoom = false;
var zoomLevel = 1.;

var selectionElapse = 0;

function checkArtworkCollision() {
	rayCaster.setFromCamera( settings.withVR ?  { x: 0, y: 0 } : mouse , camera );
	var intersects = rayCaster.intersectObjects( data.spot.artworks );
	if(intersects.length == 0) {
		selectionElapse = 0;
	 	if(data.highlightedArtwork != null) {
			unsetMaterialToHighlighted(data.highlightedArtwork);
			data.highlightedArtwork = null;
		}
	}
	else {	
		var collidee = intersects[0];
		onArtworkCollided(collidee.object);
	}
}

var spotStaring = 0;
function onSpotCollided(spot) {
	if(data.highlightedSpot == null) {
		spotStaring = 0;
		data.highlightedSpot = spot;
		setMaterialToHighlighted(data.highlightedSpot);
	}
	else if (spot.name != data.highlightedSpot.name) {
		unsetMaterialToHighlighted(data.highlightedSpot);
		data.highlightedSpot = spot;
		setMaterialToHighlighted(data.highlightedSpot);
		spotStaring += 1;
	}
	else {
		spotStaring += 1;
	}
	if(spotStaring > 25) {
		data.spot = data.highlightedSpot;
		onSpotSelected();
	}
}

function onArtworkCollided(o) {
	selectionElapse += 1;
	if(data.highlightedArtwork == null) {
		data.highlightedArtwork = o;
		setMaterialToHighlighted(o);
		//data.picture.visible = true;
	}
	else if (o.name != data.highlightedArtwork.name) {

		unsetMaterialToHighlighted(data.highlightedArtwork);
		data.highlightedArtwork = o;
		setMaterialToHighlighted(data.highlightedArtwork);
		//data.picture.visible = true;
	}
	/*
	if(selectionElapse > 60) {
		data.selectedArtwork = o;
		data.picture.visible = true;
					data.picture.material.map = data.selectedArtwork.image;
			data.picture.material.needsUpdate = true;
	}
	*/
}

function setMaterialToHighlighted(o) {
	o.material.color.set( 0xff0000 );
	o.material.opacity = .35;
}
function unsetMaterialToHighlighted(o) {
	o.material.color.set( 0x0000ff );
	//
	o.material.opacity = .1;
}




init();
animate();

//_______________________________________________________________//
//---------------------------------------------------------------//