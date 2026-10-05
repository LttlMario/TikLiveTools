# TikLiveTools

Aplicație locală pentru automatizări TikTok LIVE, compatibilă cu TikTok LIVE Studio și OBS.

## Pornire locală

1. Pornește Apache și MySQL din XAMPP.
2. Deschide phpMyAdmin și importă `sql/schema.sql`.
3. Copiază `.env.example` în `.env` și verifică datele MySQL.
4. Rulează:

```powershell
npm install
npm start
```

5. Deschide `http://localhost:3000`.

Overlay-urile sunt disponibile la adrese de tipul:

```text
http://localhost:3000/overlay/top-likes
http://localhost:3000/overlay/top-coins
http://localhost:3000/overlay/coin-jar
```

Integrarea TikTok folosește un conector open-source neoficial. TikTok poate schimba protocolul de live fără notificare, de aceea conectorul este izolat în `src/tiktok.js`.

## Stare

Fundația funcțională este instalată: server local, WebSocket, conectare la evenimente TikTok, MySQL/MariaDB, stocarea evenimentelor și endpoint-uri de overlay. Editorul complet de reguli, clasamentele calculate și integrarea OBS vor fi adăugate în următoarele etape.
