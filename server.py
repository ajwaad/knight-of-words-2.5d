import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8085

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and caching headers for local testing
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def run_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    global PORT
    
    # Find available port if 8085 is in use
    for p in range(PORT, PORT + 20):
        try:
            with socketserver.TCPServer(("", p), Handler) as httpd:
                PORT = p
                url = f"http://localhost:{PORT}"
                print("==================================================================")
                print(f"  KNIGHT OF WORDS: 2.5D KSSR YEAR 3 ENGLISH TRIAL")
                print(f"  Serving locally at: {url}")
                print("  Opening game in your browser...")
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
