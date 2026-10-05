from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import asyncio
import json
import tempfile

import edge_tts

VOICE_CATALOG = [
    {"id":"ro-RO-AlinaNeural","name":"Alina","language":"Română","locale":"ro-RO","gender":"female","multilingual":False},
    {"id":"ro-RO-EmilNeural","name":"Emil","language":"Română","locale":"ro-RO","gender":"male","multilingual":False},
    {"id":"en-US-AvaMultilingualNeural","name":"Ava","language":"English","locale":"en-US","gender":"female","multilingual":True},
    {"id":"en-US-AndrewMultilingualNeural","name":"Andrew","language":"English","locale":"en-US","gender":"male","multilingual":True},
    {"id":"en-US-EmmaMultilingualNeural","name":"Emma","language":"English","locale":"en-US","gender":"female","multilingual":True},
    {"id":"en-US-BrianMultilingualNeural","name":"Brian","language":"English","locale":"en-US","gender":"male","multilingual":True},
    {"id":"en-US-JennyNeural","name":"Jenny","language":"English","locale":"en-US","gender":"female","multilingual":False},
    {"id":"en-US-GuyNeural","name":"Guy","language":"English","locale":"en-US","gender":"male","multilingual":False},
    {"id":"en-US-AriaNeural","name":"Aria","language":"English","locale":"en-US","gender":"female","multilingual":False},
    {"id":"en-US-ChristopherNeural","name":"Christopher","language":"English","locale":"en-US","gender":"male","multilingual":False},
    {"id":"en-GB-SoniaNeural","name":"Sonia","language":"English","locale":"en-GB","gender":"female","multilingual":False},
    {"id":"en-AU-WilliamMultilingualNeural","name":"William","language":"English","locale":"en-AU","gender":"male","multilingual":True},
    {"id":"fr-FR-DeniseNeural","name":"Denise","language":"Français","locale":"fr-FR","gender":"female","multilingual":False},
    {"id":"fr-FR-VivienneMultilingualNeural","name":"Vivienne","language":"Français","locale":"fr-FR","gender":"female","multilingual":True},
    {"id":"fr-FR-RemyMultilingualNeural","name":"Rémy","language":"Français","locale":"fr-FR","gender":"male","multilingual":True},
    {"id":"de-DE-KatjaNeural","name":"Katja","language":"Deutsch","locale":"de-DE","gender":"female","multilingual":False},
    {"id":"de-DE-SeraphinaMultilingualNeural","name":"Seraphina","language":"Deutsch","locale":"de-DE","gender":"female","multilingual":True},
    {"id":"de-DE-FlorianMultilingualNeural","name":"Florian","language":"Deutsch","locale":"de-DE","gender":"male","multilingual":True},
    {"id":"es-ES-ElviraNeural","name":"Elvira","language":"Español","locale":"es-ES","gender":"female","multilingual":False},
    {"id":"it-IT-ElsaNeural","name":"Elsa","language":"Italiano","locale":"it-IT","gender":"female","multilingual":False},
    {"id":"it-IT-GiuseppeMultilingualNeural","name":"Giuseppe","language":"Italiano","locale":"it-IT","gender":"male","multilingual":True},
    {"id":"pt-BR-ThalitaMultilingualNeural","name":"Thalita","language":"Português","locale":"pt-BR","gender":"female","multilingual":True},
    {"id":"ko-KR-HyunsuMultilingualNeural","name":"Hyunsu","language":"한국어","locale":"ko-KR","gender":"male","multilingual":True},
]

class Handler(BaseHTTPRequestHandler):
    def reply(self, code, body, content_type='application/json'):
        if isinstance(body, str): body = body.encode('utf-8')
        self.send_response(code)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self): self.reply(204, b'')

    def do_GET(self):
        if self.path == '/voices':
            self.reply(200, json.dumps(VOICE_CATALOG, ensure_ascii=False))
        else:
            self.reply(404, '{}')

    def do_POST(self):
        if self.path != '/tts': self.reply(404, '{}'); return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            options = json.loads(self.rfile.read(length).decode('utf-8'))
            text = str(options.get('text', '')).strip()[:5000]
            voice = str(options.get('voice', 'ro-RO-AlinaNeural'))
            def signed_option(value, unit, default):
                if value is None: return default
                text = str(value).strip()
                if text and text[0] not in '+-' and text[-1:] in ('%', 'H', 'h', 'z', 'Z'):
                    text = '+' + text
                return text or default
            rate = signed_option(options.get('rate'), '%', '+0%')
            pitch = signed_option(options.get('pitch'), 'Hz', '+0Hz')
            volume = signed_option(options.get('volume'), '%', '+0%')
            if not text: self.reply(400, json.dumps({'error':'Textul TTS este gol'})); return
            with tempfile.TemporaryDirectory() as folder:
                target = Path(folder) / 'voice.mp3'
                asyncio.run(edge_tts.Communicate(text, voice, rate=rate, pitch=pitch, volume=volume).save(str(target)))
                self.reply(200, target.read_bytes(), 'audio/mpeg')
        except Exception as error:
            self.reply(500, json.dumps({'error': str(error)}, ensure_ascii=False))

    def log_message(self, *_): pass

if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', 8770), Handler).serve_forever()
