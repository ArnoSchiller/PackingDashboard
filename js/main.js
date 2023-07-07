import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as THREE from '../node_modules/three/build/three.module.js';

const MAX_PALETTS = 2
const PALETT = {
    "width": 800,
    "length": 1200,
    "height": 1000
}
var objectsList = []
var current_bin = 0 

const BOTTOM_PADDING = 100

const baseUrl = "localhost:8000"

const contentDiv = document.getElementById('content-container');
const infoDiv = document.getElementById('info-container')

function loadData(jsonData) {
    objectsList = []
    var articles = {}
    for(let i = 0; i<jsonData["articles"].length; i++) {
        
        var article = jsonData["articles"][i] 
        articles[article["id"]] = {
            "width": article["width"], 
            "length": article["length"], 
            "height": article["height"]
        }
    }
    let variant = jsonData["packing_variants"][0]
    console.log(variant)
    for(let i = 0; i < variant.length; i++){
        let colli = variant[i]
        for(let j = 0; j < colli.positions.length; j++) {
            let pos = colli.positions[j]
            console.log(pos)
            
            let name = pos["article_id"]
            let w = articles[name]["width"]
            let l = articles[name]["length"]
            let h = articles[name]["height"]

            let object = new PackedObject3D(name, w, l, h)
            object.bin = colli["colli"] - 1
            object.pos.x = pos["centerpoint_x"]
            object.pos.y = pos["centerpoint_y"]
            object.pos.z = pos["centerpoint_z"]
            objectsList.push(object)
        }
    }
}

function showInfo(infoText, infoType="info") {
    infoDiv.innerText = infoText;
    infoDiv.style.display = 'flex';
    
    var hideButton = document.createElement('button');
    hideButton.style.marginLeft = "30px"
    hideButton.innerText = "OK"
    hideButton.addEventListener('click', function(event){
        hideInfo()
    })
    infoDiv.appendChild(hideButton)
} 
function hideInfo() {
    infoDiv.style.display = 'none';
}

function showErrorView(message, callback) {
    contentDiv.innerHTML = ""
    var container = document.createElement("div")
    container.setAttribute('class', 'errorContainer')
    
    const messageDiv = document.createElement("div") 
    messageDiv.setAttribute('class', 'errorMessage')
    messageDiv.innerText = message
    container.appendChild(messageDiv)

    if(callback !== null) {
        const retryButton = document.createElement('retry')
        retryButton.setAttribute('id', 'retry')
        retryButton.setAttribute('class', 'retryButton')
        // Set button content
        retryButton.textContent = 'Erneut versuchen';
        retryButton.addEventListener('click', function() {
            console.log('Button clicked!')
            callback()
        });
        container.appendChild(retryButton)
    }
    contentDiv.appendChild(container)
}

function showDataView(data) {
    if(data == null) {
        showErrorView("Keine Daten vorhanden.", null)
    } else {
        try {
            loadData(data)
            showInfo("Loading done")
            drawThreeJs(contentDiv)
        } catch (e) {
            console.log(e)
        showErrorView("Darstellen der Daten fehlgeschlagen.", null)
        }
    }
    
}

function connectToServer() {
    showInfo("Verbindung zum Server wird hergestellt ...")
    var url = "http://" + baseUrl + "/order/test_order"
    console.log(url)
    fetch(url, {
        method: "POST",
        body: JSON.stringify({
            userId: 1,
            title: "Fix my bugs",
            completed: false
        }),
        headers: {
            "content-type": "application/json; charset=UTF-8"
        }
    })
    .then((response) => response.json())
    .then((json) => {
        console.log(json)
        if (json.token !== null && json.url !== null) {

            connectToWebsocket(json.url, json.token)
        }
    })   
    .catch(failed => {
        console.log("POST - Failed to connect to server: " + failed)
        showErrorView("Eine Verbindung zum Server konnte nicht hergestellt werden.", connectToServer)

    })
}

function connectToWebsocket(url, token) {
    var wsUrl = "ws://" + baseUrl + url + "?token=" + token
    console.log(wsUrl)
    //`ws://localhost:8000/ws/order/test_order?token=test_token`
    var webSocket = new WebSocket(wsUrl)
    webSocket.onopen = function(event) {
        showInfo("Verbindung zum Server hergestellt.")
        showDataView(null)
    }
    webSocket.onclose = function(event) {
        showErrorView("Verbindung zum Server verloren.", function(){
            connectToWebsocket(url, token)
        })
    }
    webSocket.onerror = function(event) {
        showInfo("Bei der Verbindung mit dem Server ist ein Fehler aufgetreten.", "error")
    }
    webSocket.onmessage = function(event) {
        console.log(event)
        if(isJsonString(event.data)) {
            handleResponse(event.data)
        } else {
            console.log("Received: " +event.data)
        }
    }
}

function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function handleResponse(response) {

    response = JSON.parse(response)

    var infoType = "info"
    try {     
        if ("status" in response &&  ["error", "sucess"].includes(response["status"])){
            infoType = response["status"].toLowerCase()
        }
                
        if ("data" in response){
            showDataView(response["data"])
        } else {
            showDataView(null)
        }
                        
    } catch (error) {
        showErrorView("Antwort vom Server fehlerhaft.", null)
        console.error(error);
    }
}

connectToServer()

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
        this.bin = -1

		this.pos = new Position(0, 0, PALETT["height"] + 200) 
		this.visible = true
		this.colorString = "#" + Math.floor((0.1 + Math.random())*16777215).toString(16) 
        this.color =  new THREE.Color(this.colorString)
	}
	
	get position() {		
		return [
			this.pos.x, 
			this.pos.y, 
			this.pos.z - PALETT["height"] / 2 + this.height / 2
		] 
	}

	toString() {
		return `${this.name} (${this.width} x ${this.length} x ${this.height})` 
	}
}

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

    const generalEdit = document.createElement('table') 
    wrapper.appendChild(generalEdit)
    const generalEditRow = generalEdit.insertRow() 
    // visibility checkbox
    let tdCheckbox = generalEditRow.insertCell() 
    var checkbox = document.createElement('input')
    checkbox.setAttribute("type", "checkbox") 
    checkbox.innerHTML = 'ausblenden' 
    checkbox.addEventListener('change', function() {
        objectsList[index].visible = !this.checked
        rendering() 
    })
    tdCheckbox.appendChild(checkbox)
    let tdCheckboxLabel = generalEditRow.insertCell() 
    var checkboxLabel = document.createTextNode("ausblenden")
    tdCheckboxLabel.appendChild(checkboxLabel)

    // bin selector
    let tdBinLabel = generalEditRow.insertCell() 
    var binLabel = document.createTextNode("Bin:")
    tdBinLabel.style.paddingLeft = "60px"
    tdBinLabel.appendChild(binLabel)

    let tdBinEdit = generalEditRow.insertCell() 
    var binEditInput = document.createElement("INPUT") 
    binEditInput.setAttribute("type", "number") 
    binEditInput.setAttribute("value", objectsList[index].bin) 
    binEditInput.style.width = "40px" 
    tdBinEdit.appendChild(binEditInput) 
    binEditInput.addEventListener("change", (event) => {
        var value = Number(binEditInput.value)
        let max = MAX_PALETTS
        if(value > max) { value = max; binEditInput.value = value }
        if(value < 0) { value = 0; binEditInput.value = value }

        objectsList[index].bin = value
        rendering() 
    }) 
    tdBinEdit.appendChild(binEditInput)

    // edit table
    const tbl = document.createElement('table') 
    const tr = tbl.insertRow() 
    let edit_texts =  ["position x", "position y", "position z"] 
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
        let min = -PALETT["width"] / 2 +  objectsList[index].width / 2
        let max = PALETT["width"] / 2 - objectsList[index].width / 2
        if(value > max) { value = max; inputX.value = value }
        if(value < min) { value = min; inputX.value = value }

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
        // lengthwise overhang allowed
        let min = -PALETT["length"] 
        let max = PALETT["length"] 
        if(value > max) { value = max; inputY.value = value }
        if(value < min) { value = min; inputY.value = value }

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
        let max =  PALETT["height"] - objectsList[index].height
        if(value > max) { value = max; inputZ.value = value }
        if(value < 0) { value = 0; inputZ.value = value }

        objectsList[index].pos.z = value
        rendering() 
    }) 
    /*
    const tr3 = tbl.insertRow()

    const tdCX = tr3.insertCell() 
    let centerXBtn = document.createElement("button") 
    centerXBtn.innerHTML = "center" 
    centerXBtn.onclick = function () {
        inputX.value = (MAX_X - objectsList[index].width) / 2
        objectsList[index].pos.x = (MAX_X - objectsList[index].width) / 2
        rendering()
    } 
    tdCX.appendChild(centerXBtn) 
    
    const tdCY = tr3.insertCell() 
    let centerYBtn = document.createElement("button") 
    centerYBtn.innerHTML = "center" 
    centerYBtn.onclick = function () {
        inputY.value = (MAX_Y - objectsList[index].length) / 2
        objectsList[index].pos.y = (MAX_Y - objectsList[index].length) / 2
        rendering()
    } 
    tdCY.appendChild(centerYBtn) 
    */
    wrapper.appendChild(tbl) 

    container.appendChild(wrapper) 
}

function createEditPanel() {

    const leftContainer = document.getElementById("editContainer") 
    leftContainer.style.height = `${windowHeight-BOTTOM_PADDING}px`

    const rightContainer = document.getElementById("plotContainer") 
    // bin select
    const binSelectTable = document.createElement('table') 
    rightContainer.appendChild(binSelectTable)
    const binSelectRow = binSelectTable.insertRow() 
    
    let binSelectTd = binSelectRow.insertCell() 
    let textnode = document.createTextNode("Bin:") 
    binSelectTd.appendChild(textnode); 

    let tdBinEdit = binSelectRow.insertCell() 
    var binEditInput = document.createElement("INPUT") 
    binEditInput.setAttribute("type", "number") 
    binEditInput.setAttribute("value", current_bin) 
    binEditInput.style.width = "40px" 
    tdBinEdit.appendChild(binEditInput) 
    binEditInput.addEventListener("change", (event) => {
        var value = Number(binEditInput.value)
        let max = MAX_PALETTS
        if(value > max) { value = max; binEditInput.value = value }
        if(value < 0) { value = 0; binEditInput.value = value }

        current_bin = value
        rendering() 
    }) 

    let tdEditSave = binSelectRow.insertCell() 
    var editSaveButton = document.createElement("button") 
    editSaveButton.innerHTML = "save packing"
    editSaveButton.style.marginLeft = "100px"
    tdEditSave.appendChild(editSaveButton) 
    editSaveButton.onclick = function () {
        saveProductsToJson()
    }
    tdBinEdit.appendChild(editSaveButton)

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

/* 
#################################################################################
#                               three.js                                        #
#################################################################################
*/
function drawThreeJs(container) {
    container.innerHTML = ""
    container.appendChild(renderer.domElement) 
    
    rendering() 
}
// Scene
const scene = new THREE.Scene() 
scene.rotation.z = 5 * Math.PI / 4 
const rotAxis = new THREE.Vector3(1,0, 0) 
scene.rotateOnWorldAxis(rotAxis, 6.5 * Math.PI / 4) 

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / (window.innerHeight - BOTTOM_PADDING), 0.6, 10000) 
camera.position.z = 2000 

// Renderer
const renderer = new THREE.WebGLRenderer({antialias: true}) 
renderer.setClearColor("#FFFFFF") 
renderer.setSize(window.innerWidth, window.innerHeight - BOTTOM_PADDING) 

// Make Canvas Responsive
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight - BOTTOM_PADDING)  
    camera.aspect = window.innerWidth / (window.innerHeight - BOTTOM_PADDING)  // Update aspect ratio
    camera.updateProjectionMatrix()  // Apply changes
})

// Add ambient light
const light = new THREE.AmbientLight( 0xFFFFFF ) 
scene.add( light ) 

//Trackball Controls for Camera 
const controls = new OrbitControls(camera, renderer.domElement)  
controls.maxDistance = 5000 
controls.minDistance = 1000 

drawPalett(scene)
    

const rendering = function() {
    // Rerender every time the page refreshes (pause when on another tab)
    requestAnimationFrame(rendering) 
      // Update trackball controls
    controls.update() 
        for (let i = 0;  i < objectsList.length;  i++) {
            let obj = objectsList[i] 
            var object = scene.getObjectByName(`object_${i}`) 
            if (object == null && obj.visible && obj.bin == current_bin) {
                const objGeometry = new THREE.BoxGeometry(obj.width, obj.length, obj.height)
                var objMaterial = new THREE.MeshStandardMaterial({color: obj.color}); 
                const objMesh = new THREE.Mesh(objGeometry, objMaterial)  
                objMesh.position.set(obj.position[0], obj.position[1], obj.position[2]) 
                objMesh.name = `object_${i}` 
                scene.add(objMesh) 
            } else {
                if(obj.visible && obj.bin == current_bin) {
                    object.position.set(obj.position[0], obj.position[1], obj.position[2]) 
                } else {
                    scene.remove(object)
                }
            }
        }
        renderer.render(scene, camera) 
  }
function drawPalett(scene) {
    
    // Load texture for palett
    const image = new Image()
    const texture = new THREE.Texture(image)
    image.addEventListener('load', () =>
    {
        texture.needsUpdate = true
    })
    image.src = '../static/textures/wood.jpg'

    // Create palett
    let MAX_X = PALETT["width"], MAX_Y = PALETT["length"], MAX_Z = PALETT["height"]
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
}



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
/* 
#################################################################################
#                            three.js rendering                                 #
#################################################################################
*/


function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

function saveProductsToJson() {
    let data = null
    saveJsonFile(data, function(){
        alert("Not implemented yet.")  
    });
}

function saveJsonFile(data, callback) {
    callback()
}