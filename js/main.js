import * as THREE from '../node_modules/three/build/three.module.js'
import { TrackballControls } from '../node_modules/three/examples/jsm/controls/TrackballControls.js'

const MAX_X = 8, MAX_Y = 12, MAX_Z = 10

const BOTTOM_PADDING = 100

const objColors = ["#537188", "#CBB279", "#E1D4BB"]

const edit_texts = ["position x", "position y", "position z"] 

class Position {
    constructor(x, y, z) {
      this.x = x 
      this.y = y 
      this.z = z 
    }
}

class PackedObject3D {
	constructor(name, width, length, height) {
		this.name = name 
		this.width = width 
    this.length = length
		this.height = height 

		this.pos = new Position(0, 0, MAX_Z + 2) 
		this.visible = true
		let col = objColors[Math.round(Math.random() * (objColors.length-1))]
		this.colorString = "#" + Math.floor(Math.random()*16777215).toString(16) //LightenColor(col, Math.random() * 50)
        this.color =  new THREE.Color(this.colorString)
	}
	
	get position() {		
		return [
			this.pos.x + this.width / 2 - MAX_X / 2, 
			this.pos.y + this.length / 2 - MAX_Y / 2, 
			this.pos.z + this.height / 2 - MAX_Z / 2
		] 
	}

	toString() {
    console.log(this)
		return `${this.name} (${this.width} x ${this.length} x ${this.height})` 
	}
}

const objects = [
  	new PackedObject3D("Zaunelement", 4, 8, 1, null),
  	new PackedObject3D("Zeunpfosten", 1, 5, 1, null)
]

var objectsList = []

var body = document.body, html = document.documentElement 
var windowHeight = Math.max( 
  body.scrollHeight, body.offsetHeight, 
  html.clientHeight, html.scrollHeight, html.offsetHeight 
) 

/* 
#################################################################################
#                              edit panel                                       #
#################################################################################
*/

function createEditPanelForObject(container, index) {
  var wrapper = document.createElement('div') 
  wrapper.style.border = '1px solid' 
  wrapper.style.borderRadius = '10px' 
  wrapper.style.margin = '0.2em' 
  wrapper.style.padding = '0.5em' 
  
  // header
  const header = document.createElement('table') 
  wrapper.appendChild(header)
  const titleRow = header.insertRow() 

  let bold = document.createElement('strong'),
  textnode = document.createTextNode(objectsList[index].toString()) 
  bold.appendChild(textnode); 
  let tdTitle = titleRow.insertCell() 
  tdTitle.style.width = "90%"
  tdTitle.appendChild(bold) 
  
  let colorDiv = document.createElement('div')
  colorDiv.style.width = "20px"
  colorDiv.style.height = "20px"
  colorDiv.style.backgroundColor = objectsList[index].colorString
  let tdColor = titleRow.insertCell() 
  tdColor.style.width = "10%"
  tdColor.appendChild(colorDiv)  

  // visibility checkbox
  const visibility = document.createElement('table') 
  wrapper.appendChild(visibility)
  const visibilityRow = visibility.insertRow() 
  let tdCheckbox = visibilityRow.insertCell() 
  var checkbox = document.createElement('input')
  checkbox.setAttribute("type", "checkbox") 
  checkbox.innerHTML = 'ausblenden' 
  checkbox.addEventListener('change', function() {
    objectsList[index].visible = !this.checked
    rendering() 
  })
  tdCheckbox.appendChild(checkbox)
  let tdCheckboxLabel = visibilityRow.insertCell() 
  var checkboxLabel = document.createTextNode("ausblenden")
  tdCheckboxLabel.appendChild(checkboxLabel)


  // edit table
  const tbl = document.createElement('table') 
  const tr = tbl.insertRow() 
  for (let j = 0; j < 3; j++) {
    const td = tr.insertCell() 
    td.appendChild(document.createTextNode(edit_texts[j])) 
  }
  
  const tr2 = tbl.insertRow() 

  const tdX = tr2.insertCell() 
  var inputX = document.createElement("INPUT") 
  inputX.setAttribute("type", "number") 
  inputX.setAttribute("value", objectsList[index].pos.x) 
  inputX.style.width = "70px" 
  tdX.appendChild(inputX) 
  inputX.addEventListener("change", (event) => {
    var value = Number(inputX.value)
    let max = MAX_X - objectsList[index].width
    if(value > max) { value = max; inputX.value = value }
    if(value < 0) { value = 0; inputX.value = value }

    objectsList[index].pos.x = value
    rendering() 
  }) 

  const tdY = tr2.insertCell() 
  var inputY = document.createElement("INPUT") 
  inputY.setAttribute("type", "number") 
  inputY.setAttribute("value", objectsList[index].pos.y) 
  inputY.style.width = "70px" 
  tdY.appendChild(inputY) 
  inputY.addEventListener("change", (event) => {
    var value = Number(inputY.value)
    let max = MAX_Y - objectsList[index].length
    if(value > max) { value = max; inputY.value = value }
    if(value < 0) { value = 0; inputY.value = value }
    
    objectsList[index].pos.y = value
    rendering() 
  }) 

  const tdZ = tr2.insertCell() 
  var inputZ = document.createElement("INPUT") 
  inputZ.setAttribute("type", "number") 
  inputZ.setAttribute("value", objectsList[index].pos.z) 
  inputZ.style.width = "70px" 
  tdZ.appendChild(inputZ) 
  inputZ.addEventListener("change", (event) => {
    var value = Number(inputZ.value)
    let max = MAX_Z - objectsList[index].height
    if(value > max) { value = max; inputZ.value = value }
    if(value < 0) { value = 0; inputZ.value = value }

    objectsList[index].pos.z = value
    rendering() 
  }) 

  wrapper.appendChild(tbl) 
  container.appendChild(wrapper) 
}

function createEditPanel() {

  const leftContainer = document.getElementById("editContainer") 
  leftContainer.style.height = `${windowHeight-BOTTOM_PADDING}px`

  let editContainer = document.createElement("div") 
  editContainer.style.height = "100%" 
  editContainer.style.overflowY = "scroll" 
  leftContainer.appendChild(editContainer) 
  
  
  let newObjectSelect = document.createElement("select") 
  newObjectSelect.style.margin = "10px" 
  newObjectSelect.style.padding = "10px" 
  for (let i = 0; i < objects.length; i++) {
    const option = document.createElement("option") 
    option.value = i 
    option.text = objects[i].toString() 
    newObjectSelect.add(option, null)
  }
  leftContainer.appendChild(newObjectSelect) 

  // button to add new object
  let newObjectBtn = document.createElement("button") 
  newObjectBtn.innerHTML = "Add new" 
  newObjectBtn.style.margin = "10px" 
  newObjectBtn.style.padding = "10px" 
  newObjectBtn.onclick = function () {
	let obj = objects[newObjectSelect.value]
	const object = new PackedObject3D(obj.name, obj.width, obj.length, obj.height)
    objectsList.push(object)
    createEditPanelForObject(editContainer, objectsList.length-1) 
    rendering()
  } 
  leftContainer.appendChild(newObjectBtn) 
  
  for (let i = 0; i < objectsList.length; i++) {
    createEditPanelForObject(editContainer, i) 
  }
}
createEditPanel()
/* 
#################################################################################
#                               three.js                                        #
#################################################################################
*/
// Scene
const scene = new THREE.Scene() 
scene.rotation.z = 5 * Math.PI / 4 
const rotAxis = new THREE.Vector3(1,0, 0) 
scene.rotateOnWorldAxis(rotAxis, 6.5 * Math.PI / 4) 

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / 2 / (window.innerHeight - BOTTOM_PADDING), 0.6, 1200) 
camera.position.z = 30  // Set camera position
// Renderer
const renderer = new THREE.WebGLRenderer({antialias: true}) 
renderer.setClearColor("#FFFFFF")  // Set background colour
renderer.setSize(window.innerWidth/2, window.innerHeight - BOTTOM_PADDING) 
document.getElementById("plotContainer").appendChild(renderer.domElement)  // Add renderer to HTML as a canvas element

// Add ambient light
const light = new THREE.AmbientLight( 0xFFFFFF )  // soft white light
scene.add( light ) 

/*
// Add axes helper
const axesHelper = new THREE.AxesHelper( 10 ) 
scene.add( axesHelper ) 

// Add grid helper
const size = 10 
const divisions = 10 
const gridHelper = new THREE.GridHelper( size, divisions ) 
scene.add( gridHelper ) 
*/ 
//Trackball Controls for Camera 
const controls = new TrackballControls(camera, renderer.domElement)  
controls.maxDistance = 40 
controls.minDistance = 10 

// Make Canvas Responsive
window.addEventListener('resize', () => {
	renderer.setSize(window.innerWidth/2, window.innerHeight - BOTTOM_PADDING)  
    camera.aspect = window.innerWidth / 2 / (window.innerHeight - BOTTOM_PADDING)  // Update aspect ratio
    camera.updateProjectionMatrix()  // Apply changes
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
const palettGeometry = new THREE.BoxGeometry(MAX_X, MAX_Y, 0.5)  
const palettMaterial = new THREE.MeshLambertMaterial({color: 0xe3e2ca, map: texture})  // Define material
const palettMesh = new THREE.Mesh(palettGeometry, palettMaterial)  
palettMesh.position.z = - MAX_Z / 2 -0.25
scene.add(palettMesh)  

const points = [];
points.push( new THREE.Vector3( -MAX_X/2, -MAX_Y/2, -MAX_Z/2 ) );
points.push( new THREE.Vector3( -MAX_X/2, -MAX_Y/2, MAX_Z/2) );
points.push( new THREE.Vector3( -MAX_X/2, MAX_Y/2, MAX_Z/2 ) );
points.push( new THREE.Vector3( -MAX_X/2, MAX_Y/2, -MAX_Z/2 ) );

points.push( new THREE.Vector3( -MAX_X/2, MAX_Y/2, MAX_Z/2 ) );
points.push( new THREE.Vector3( MAX_X/2, MAX_Y/2, MAX_Z/2 ) );
points.push( new THREE.Vector3( MAX_X/2, MAX_Y/2, -MAX_Z/2 ) );

points.push( new THREE.Vector3( MAX_X/2, MAX_Y/2, MAX_Z/2 ) );
points.push( new THREE.Vector3( MAX_X/2, -MAX_Y/2, MAX_Z/2 ) );
points.push( new THREE.Vector3( MAX_X/2, -MAX_Y/2, -MAX_Z/2 ) );

points.push( new THREE.Vector3( MAX_X/2, -MAX_Y/2, MAX_Z/2 ) );
points.push( new THREE.Vector3( -MAX_X/2, -MAX_Y/2, MAX_Z/2 ) );

const material = new THREE.LineBasicMaterial( { color: 0xaaaaaa } );
const geometry = new THREE.BufferGeometry().setFromPoints( points );
const line = new THREE.Line( geometry, material );
scene.add( line );

/* 
#################################################################################
#                            three.js rendering                                 #
#################################################################################
*/
const rendering = function() {
  // Rerender every time the page refreshes (pause when on another tab)
  requestAnimationFrame(rendering) 
	// Update trackball controls
  controls.update() 
  
	for (let i = 0;  i < objectsList.length;  i++) {
		let obj = objectsList[i] 
		var object = scene.getObjectByName(`object_${i}`) 
		if (object == null && obj.visible) {
			const objGeometry = new THREE.BoxGeometry(obj.width, obj.length, obj.height)  // Define geometry
			var objMaterial = new THREE.MeshStandardMaterial({color: obj.color}); 
			const objMesh = new THREE.Mesh(objGeometry, objMaterial)  // Build box
			objMesh.position.set(
				obj.position[0], 
				obj.position[1], 
				obj.position[2]
				) 
			objMesh.name = `object_${i}` 
			scene.add(objMesh)  // Add box to canvas
		} else {
			if(obj.visible) {
				object.position.set(
					obj.position[0], 
					obj.position[1], 
					obj.position[2]
				) 
			} else {
				scene.remove(object)
			}
		}
	}
	renderer.render(scene, camera) 
}
rendering() 


function LightenColor(color, percent) {
	var num = parseInt(color.replace("#",""),16),
	amt = Math.round(percent),
	R = (num >> 16) + amt,
	B = (num >> 8 & 0x00FF) + amt,
	G = (num & 0x0000FF) + amt;
	return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (B<255?B<1?0:B:255)*0x100 + (G<255?G<1?0:G:255)).toString(16).slice(1);
};