import http.server
import socketserver
import urllib.parse
import webbrowser
import os
import sys

PORT = 8085
PROJ_ROOT = os.path.dirname(os.path.abspath(__file__))
EXTERNAL_SPRITE_DIRS = [
    r"C:\Users\AMAL\Downloads\sprites",
    os.path.expanduser("~/Downloads/sprites"),
    os.path.join( os.path.dirname(PROJ_ROOT), "sprites" ),
]

class Handler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Decode URL-encoded spaces, ampersands, and %23 (#)
        parsed = urllib.parse.unquote(path.split('?', 1)[0].split('#', 1)[0])
        rel = parsed.lstrip('/')
        local_candidate = os.path.join(PROJ_ROOT, rel.replace('/', os.sep))

        # If requesting an asset in assets/..., prefer the user's full sprite dump if present
        if rel.startswith("assets/"):
            for ext_root in EXTERNAL_SPRITE_DIRS:
                ext_candidate = os.path.join(ext_root, rel.replace('/', os.sep))
                if os.path.isfile(ext_candidate):
                    return ext_candidate
        if os.path.exists(local_candidate):
            return local_candidate
        return super().translate_path(path)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def run_server():
    os.chdir(PROJ_ROOT)
    global PORT
    for p in range(PORT, PORT + 20):
        try:
            with socketserver.TCPServer(("", p), Handler) as httpd:
                PORT = p
                url = f"http://localhost:{PORT}"
                print("==================================================================")
                print("  KNIGHT OF WORDS: 2.5D KSSR YEAR 3 ENGLISH TRIAL")
                print(f"  Serving locally at: {url}")
                print("  All assets mapped directly to manifest.txt paths.")
                print("  Press Ctrl+C to stop the local server.")
                print("==================================================================")
                webbrowser.open(url)
                httpd.serve_forever()
                break
        except OSError:
            continue

if __name__ == '__main__':
    try:
        run_server()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)
