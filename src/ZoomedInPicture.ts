import { PlaneBufferGeometry, Mesh, MeshBasicMaterial, Vector3, DoubleSide } from 'three';

export class ZoomedInPicture extends Mesh {
	static geometry = new PlaneBufferGeometry(1, 1, 1);
	constructor(camera) {
		super( ZoomedInPicture.geometry,  new MeshBasicMaterial(  { color : '#ffffff', side : DoubleSide} ));
		this.position.z = -2;
		this['layer'] = 1;
		this.visible = false;
		camera.add(this);
	}
}


// was in constructor
