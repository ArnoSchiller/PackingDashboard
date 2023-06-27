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
      this.pos.describe();
    }
}
const edit_texts = ["position x", "position y", "position z"];

var objectsList = []

var body = document.body,
    html = document.documentElement;
var height = Math.max( body.scrollHeight, body.offsetHeight, 
                       html.clientHeight, html.scrollHeight, html.offsetHeight );
const leftContainer = document.getElementById("editContainer");
leftContainer.style.height = `${height-100}px`
let editContainer = document.createElement("div");
editContainer.style.height = "100%";
editContainer.style.overflowY = "scroll";

leftContainer.appendChild(editContainer);

let newObjectBtn = document.createElement("button");
newObjectBtn.innerHTML = "Add new";
newObjectBtn.style.margin = "10px";
newObjectBtn.style.padding = "10px";
newObjectBtn.onclick = function () {
  const pos = new Position(1,0,0);
  const object = new PackedObject3D(2,3,2, pos);
  objectsList.push(object)
  createEditPanel(objectsList.length-1);
  rendering()
};
leftContainer.appendChild(newObjectBtn);

function createEditPanel(index) {
  var wrapper = document.createElement('div');
  wrapper.style.border = '1px solid';
  wrapper.style.margin = '0.2em';
  wrapper.style.padding = '0.2em';

  const header = document.createTextNode(`Item ${index+1}`);
  wrapper.appendChild(header);

  const tbl = document.createElement('table');

  const tr = tbl.insertRow();
  for (let j = 0; j < 3; j++) {
    const td = tr.insertCell();
    td.appendChild(document.createTextNode(edit_texts[j]));
  }
  
  const tr2 = tbl.insertRow();

  const tdX = tr2.insertCell();
  var inputX = document.createElement("INPUT");
  inputX.setAttribute("type", "number");
  inputX.setAttribute("value", objectsList[index].pos.x);
  tdX.appendChild(inputX);
  inputX.addEventListener("change", (event) => {
    objectsList[index].pos.x = Number(inputX.value)
    objectsList[index].describe()
    rendering();
  });

  const tdY = tr2.insertCell();
  var inputY = document.createElement("INPUT");
  inputY.setAttribute("type", "number");
  inputY.setAttribute("value", objectsList[index].pos.y);
  tdY.appendChild(inputY);
  inputY.addEventListener("change", (event) => {
    objectsList[index].pos.y = Number(inputY.value)
    objectsList[index].describe()
    rendering();
  });

  const tdZ = tr2.insertCell();
  var inputZ = document.createElement("INPUT");
  inputZ.setAttribute("type", "number");
  inputZ.setAttribute("value", objectsList[index].pos.z);
  tdZ.appendChild(inputZ);
  inputZ.addEventListener("change", (event) => {
    objectsList[index].pos.z = Number(inputZ.value)
    objectsList[index].describe()
    rendering();
  });

  wrapper.appendChild(tbl);
  editContainer.appendChild(wrapper);
}

for (let i = 0; i < objectsList.length; i++) {
  createEditPanel(i);
}

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

var objMaterial = new THREE.ShaderMaterial({
  uniforms: {
    thickness: {
    	value: 1.5
    }
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader
});


const rendering = function() {
  // Rerender every time the page refreshes (pause when on another tab)
  requestAnimationFrame(rendering);
	// Update trackball controls
  controls.update();
  
  for (let i = 0; i < objectsList.length; i++) {
    let obj = objectsList[i];
    var object = scene.getObjectByName(`object_${i}`);
    if (object == null) {
      const objGeometry = new THREE.BoxGeometry(obj.width,obj.height, obj.depth); // Define geometry
      const objMesh = new THREE.Mesh(objGeometry, objMaterial); // Build box
      objMesh.position.set(obj.position[0], obj.position[1], obj.position[2]);
      objMesh.name = `object_${i}`;
      scene.add(objMesh); // Add box to canvas
    }
    object.position.set(obj.position[0], obj.position[1], obj.position[2]);
  }
	renderer.render(scene, camera);
}
rendering();