// Get references to the div elements
const fullScreenDiv = document.getElementById('fullScreenDiv');
const infoDiv = document.getElementById('info-container')
infoDiv.onclick = function () {
    console.log("TEST")
    this.style.display = 'none';
} 
// order_id = "test_order"
// document.getElementById("ws-id").textContent = order_id
/*
function connectToWebSocket() {
    var ws = new WebSocket(`ws://localhost:8000/ws/order/test_order?token=test_token`);
    ws.onmessage = function(event) {{
        handleDataResponse(event.data)
    }};
    ws.send('test')
    event.preventDefault()         
}

function handleDataResponse(data) {
    container = document.getElementById("content-container")
    container.innerHTML = data

    try {
        const obj = JSON.parse(data);
        connection_container = document.createTextNode(obj.status)
        container.appendChild(connection_container)
         
    } catch (error) {
        container.innerHTML = "Inhalt fehlerhaft."
        console.error(error);
    }
}

function reConnect() {
    connectToWebSocket()
}

connectToWebSocket()
*/