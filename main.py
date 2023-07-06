import os
from typing import Annotated
import uuid
from fastapi import (
    Cookie,
    Depends,
    FastAPI,
    Query,
    WebSocket,
    WebSocketDisconnect,
    WebSocketException,
    status,
)
from fastapi.responses import Response, HTMLResponse
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

root = os.path.dirname(os.path.abspath(__file__))


app.mount("/js", StaticFiles(directory=os.path.join(root, 'js')), name="js")
app.mount("/css", StaticFiles(directory=os.path.join(root, 'css')), name="css")


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    async def refuse_connection(self, websocket: WebSocket):
        await websocket.accept()

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def send_personal_data(self, data: dict, websocket: WebSocket):
        await websocket.send_json(data)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

    async def broadcast_data(self, data: dict):
        for connection in self.active_connections:
            await connection.send_json(data)


known_tokens = {"test_order": "test_token"}
manager = ConnectionManager()


@app.get("/")
async def main():
    with open(os.path.join(root, 'html/index.html')) as fh:
        data = fh.read()
    return Response(content=data, media_type="text/html")


@app.post("/order/{order_id}")
async def post_order(
        order_id: str
):
    print("POST", order_id)
    token = str(uuid.uuid4())

    # if order_id not in known_tokens:
    #    known_tokens[order_id] = []
    # known_tokens[order_id].append(token)
    return {
        "url": "/ws/order/test_order",
        "token": "test_token"
    }


async def get_cookie_or_token(
    websocket: WebSocket,
    session: Annotated[str | None, Cookie()] = None,
    token: Annotated[str | None, Query()] = None,
):
    if session is None and token is None:
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
    return session or token


@app.websocket("/ws/order/{order_id}")
async def websocket_endpoint(
    *,
    websocket: WebSocket,
    order_id: str,
    q: int | None = None,
        token: Annotated[str, Depends(get_cookie_or_token)],):

    if token not in known_tokens[order_id]:
        pass  # return

    await manager.connect(websocket)

    try:
        await manager.send_personal_data({"status": "connected"}, websocket)

        while True:
            data = await websocket.receive_json()
            print(data)
            await manager.broadcast_data(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"Client #{order_id} left the chat")
