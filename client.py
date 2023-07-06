# pip install websocket-client
import json
import random
from websocket import create_connection


error_data = {
    "status": "error",
    "message": "Internal error stuff"
}

success_data = {
    "status": "success",
    "message": "Data fully loaded!",
    "data": {"test": "value"}
}

data = random.choice([error_data, success_data])


token = "test_token"
ws = create_connection(
    f"ws://localhost:8000/ws/order/test_order?token={token}")
# print(ws.recv())
print("Sending:", data)
ws.send(json.dumps(data))
print("Sent")
print("Receiving...")
result = ws.recv()
print("Received '%s'" % result)
ws.close()
