import { sayHello } from "./greet";
import THREE = require('three');

function hello(compiler: string) {
    console.log(`Hello from ${compiler}`);
}
hello("TypeScript");


console.log(sayHello("TypeScript"));

function showHello(divName: string, name: string) {
    const elt = document.getElementById(divName);
    elt.innerText = sayHello(name);
}

function initgl() {
	let cube = new THREE.CubeGeometry(2, 3, 4);
}

showHello("greeting", "TypeScript");
initgl();