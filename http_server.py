from http.server import BaseHTTPRequestHandler
from socketserver import ThreadingMixIn, TCPServer # ThreadingMixIn must come first
import threading
import os.path
import urllib.parse
import mimetypes
mimetypes.init()

"""
Creates a threaded http server for web browsers to send data to

Note: by default, all files (except .py) in this same directory are just spit out to HTTP GETs, with {path}index.html being served if they ask for just {path}.
"""
class RequestHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super(BaseHTTPRequestHandler, self).__init__(*args, **kwargs)

    def log_message(self, format, *args):
        return # be quite!

    def do_GET(self):
        local_path = self.path[1:]
        if local_path.endswith("/") or len(local_path) == 0:
            local_path = local_path + "index.html"

        response_code = 200 # OK
        if not os.path.isfile(local_path) and not local_path.endswith(".py"):
            response_code = 404
            local_path = "404.html"

        self.send_response(response_code) # HTTP OK
        filename, file_extension = os.path.splitext(local_path)
        if file_extension in mimetypes.types_map:
            self.send_header("Content-type", mimetypes.types_map[file_extension])
        self.end_headers()
        with open(local_path, "rb") as f:
            self.wfile.write(f.read())

    def do_POST(self):
        length = int(self.headers['Content-Length'])
        post_data = urllib.parse.parse_qs(self.rfile.read(length).decode('utf-8'))
        for key, value in post_data.items():
            print("{}={}".format(key, value))

        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"success": true}')

class ThreadedHTTPServer(ThreadingMixIn, TCPServer):
    """Handle requests in a separate thread."""

def setup(port):
    def thread_http():
        http_server = TCPServer(("0.0.0.0", port), RequestHandler)
        print("HTTP Server listening on port {}".format(port))
        http_server.serve_forever()

    threaded_http = threading.Thread(target=thread_http)
    threaded_http.daemon = True
    threaded_http.start() # we throw the HTTP server off to a seperate thread.
