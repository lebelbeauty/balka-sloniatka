#!/usr/bin/env python3
"""
Simple HTTP server with proper UTF-8 encoding for the elephant site.
"""
import http.server
import socketserver
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class UTF8Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def guess_type(self, path):
        """Override to ensure UTF-8 charset for text files."""
        mimetype = super().guess_type(path)
        if mimetype and mimetype.startswith('text/'):
            return mimetype + '; charset=utf-8'
        if path.endswith('.js'):
            return 'application/javascript; charset=utf-8'
        if path.endswith('.svg'):
            return 'image/svg+xml; charset=utf-8'
        return mimetype

    def log_message(self, format, *args):
        # Cleaner logging
        print(f"{self.address_string()} - {format % args}")

if __name__ == "__main__":
    os.chdir(DIRECTORY)
    with socketserver.TCPServer(("", PORT), UTF8Handler) as httpd:
        print(f"Mир Слонов сервер запущен на http://localhost:{PORT}")
        print("Нажмите Ctrl+C для остановки")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nСервер остановлен")