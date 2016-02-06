from networktables import NetworkTable # pip install pynetworktables

# Creates a networktables client to send data we get from http clients (we act as the HTTP server in this case)

def setup(robot_ip, table_id, connection_listener_class=None):
    print("Connecting to NetworkTable '{}' on Robot at '{}'".format(table_id, robot_ip))
    NetworkTable.setIPAddress(robot_ip)
    NetworkTable.setClientMode()
    NetworkTable.initialize()

    table = NetworkTable.getTable(table_id)

    if connection_listener_class:
        table.addConnectionListener(connection_listener_class())

    return table
