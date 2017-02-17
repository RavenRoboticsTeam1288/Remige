import json
from websocket_server import WebsocketServer # pip package, in python 3.5 you may have to do `pip install -U websocket-server`
import http_server
import networktables_client


with open("config.json", "r") as config_file:
    config = json.load(config_file)

shared_dict = {
    "robot_status": "disconnected",
    "form": {}
}

http_server.setup(config["http_port"])

# Create a WS Server, this allows push/pull between the web-browsers (interfaces)

# Called for every client connecting (after handshake)
def new_client(client, server):
    print("New client connected and was given id %d" % client['id'])
    server.send_message(client, json.dumps(shared_dict))

# Called when a client sends a message
def message_received(client, server, message):
    if message != "PING":
        print("Client(%d) said: %s" % (client['id'], message))
        shared_dict["form"] = json.loads(message)
        server.send_message_to_all(json.dumps(shared_dict))

        for key, value in shared_dict["form"].items():
            networktable.putValue(key, value)

ws_server = WebsocketServer(config['ws_port'])
ws_server.set_fn_new_client(new_client)
ws_server.set_fn_message_received(message_received)

def ConnectionListener(isConnected, info):
    if isConnected:
        print("NetworksTables connected to", networktable)
        shared_dict["robot_status"] = "connected"
        ws_server.send_message_to_all(json.dumps(shared_dict))
    
        # we may have form data to send to the table while we were disconnected, so update it
        for key, value in shared_dict["form"].items():
            networktable.putValue(key, value)
            print(key, value)
    else:
    
        print("NetworkTabes disconnected from", networktable)
        shared_dict["robot_status"] = "disconnected"
        ws_server.send_message_to_all(json.dumps(shared_dict))


networktable = networktables_client.setup(config["robot_ip"], config["networktable"], ConnectionListener)

ws_server.run_forever() # we could throw this off to a seperate thread too, but then the main thread would have nothing to do

print("Exiting")
