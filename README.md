# Remige
A website control system for interfacing with an FRC Robot's NetworkTables

## Requirements

You will need Python **3** Installed, and the pip packages `pynetworktables` and `websocket-server`. That's all you need to run this program locally. You will be expected to have an FRC Robot running a NetworkTables server, as that's what this webinterface is supposed to be modifying.

If you do not have a robot to access, for demonstration purposes we've included a fake robot NetworkTables server via `robot_sim.py`.

## How to Run

In a terminal run:

`
python3 server.py
`

Then, open a webbrowser on the same computer, and access [localhost:1288](http://localhost:1288/). This should open a simple web interface with two text boxes, and some connection information.

Any time you change a value in the text box, then click off it (blur), the web interface will talk to the server and tell it what the new value(s) are. The server then sends that robot's NetworkTable, so to robot can do whatever you want with

## How your team can use this

In `index.html` you will find a `<form>` element. In that, *any* `<input>`s will be connected to, and when their value's change it goes through all our fancy code to your robot. So feel free to add new forms. Each input's `name` attribute will be treated as the networktable's key. In addition, you can easily change the ports and robot IP's that this system connects to/through via the `config.json` file. Just form this repo and make your changes. Enjoy!
