import * as THREE from '../node_modules/three/build/three.module.js';
import { TrackballControls } from '../node_modules/three/examples/jsm/controls/TrackballControls.js';

class Position {
    constructor(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
  
    describe() {
      console.log(`Position: (${this.x}, ${this.y}, ${this.z})`);
    }
}

class PackedObject3D {
    constructor(width, height, depth, pos) {
      this.width = width;
      this.height = height;
      this.depth = depth;
      this.pos = pos;
    }

	get position() {
		return [this.pos.x + this.width / 2, this.pos.z + this.height / 2, this.pos.y + this.depth / 2];
	}

    describe() {
      console.log(`Object dimensions: ${this.width} x ${this.height} x ${this.depth}`);
      this.position.describe();
    }
}


var objectsList = []
const pos = new Position(1,0,0);
const object = new PackedObject3D(2,3,2, pos);
objectsList.push(object)


var x = document.createElement("INPUT");
x.setAttribute("type", "number");
x.setAttribute("value", object.pos.x);
document.getElementById("editContainer").appendChild(x)
x.addEventListener("change", (event) => {
  console.log(x.getAttribute("value"))
  objectsList[0].pos.x = Number(x.value)
  console.log(objectsList[0])
  rendering();
});


// Scene
const scene = new THREE.Scene();
scene.rotation.z = 5 * Math.PI / 4;
const rotAxis = new THREE.Vector3(1,0, 0);
scene.rotateOnWorldAxis(rotAxis, 6.5 * Math.PI / 4);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.6, 1200);
camera.position.z = 20; // Set camera position
// Renderer
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setClearColor("#FFFFFF"); // Set background colour
renderer.setSize(window.innerWidth/2, window.innerHeight / 2);
document.getElementById("plotContainer").appendChild(renderer.domElement); // Add renderer to HTML as a canvas element

// Add ambient light
const light = new THREE.AmbientLight( 0xFFFFFF ); // soft white light
scene.add( light );

/*
// Add axes helper
const axesHelper = new THREE.AxesHelper( 10 );
scene.add( axesHelper );

// Add grid helper
const size = 10;
const divisions = 10;
const gridHelper = new THREE.GridHelper( size, divisions );
scene.add( gridHelper );
*/ 
//Trackball Controls for Camera 
const controls = new TrackballControls(camera, renderer.domElement); 
controls.rotateSpeed = 2;
controls.dynamicDampingFactor = 0.15;

// Make Canvas Responsive
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth / 2, window.innerHeight / 2); // Update size
    camera.aspect = window.innerWidth / window.innerHeight; // Update aspect ratio
    camera.updateProjectionMatrix(); // Apply changes
})

// Load texture for palett
const image = new Image()
const texture = new THREE.Texture(image)
image.addEventListener('load', () =>
{
    texture.needsUpdate = true
})
image.src = '../static/textures/wood.jpg'

// Create palett
const palettDimension = [8, 12, 0.5]
const palettGeometry = new THREE.BoxGeometry(palettDimension[0], palettDimension[1],palettDimension[2]); // Define geometry
const palettMaterial = new THREE.MeshLambertMaterial({color: 0xe3e2ca, map: texture}); // Define material
const palettMesh = new THREE.Mesh(palettGeometry, palettMaterial); // Build box
palettMesh.position.set(palettDimension[0]/2, palettDimension[1]/2, -palettDimension[2]/2);
scene.add(palettMesh); // Add box to canvas

var obj = objectsList[0]
var objMaterial = new THREE.ShaderMaterial({
  uniforms: {
    thickness: {
    	value: 1.5
    }
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader
});
const objGeometry = new THREE.BoxGeometry(obj.width,obj.height, obj.depth); // Define geometry
const objMesh = new THREE.Mesh(objGeometry, objMaterial); // Build box
console.log(obj.position)
objMesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
scene.add(objMesh); // Add box to canvas


const rendering = function() {
    // Rerender every time the page refreshes (pause when on another tab)
    requestAnimationFrame(rendering);
	// Update trackball controls
    controls.update();
	// Constantly rotate box
    // scene.rotation.z -= 0.005;
	// scene.rotation.x -= 0.01;
  
  var obj = objectsList[0]
  objMesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
	renderer.render(scene, camera);
}
rendering();