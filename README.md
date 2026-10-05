# TikLiveTools

Aplicație locală pentru automatizări TikTok LIVE, compatibilă cu TikTok LIVE Studio și OBS.

## Pornire locală

1. Pornește MySQL/MariaDB din XAMPP. Apache nu este necesar, deoarece interfața și API-ul sunt servite de aplicația Node. În instalarea actuală, XAMPP este la `D:\xamppp`, iar MariaDB folosește portul `3306`.
2. Copiază `.env.example` în `.env` și verifică datele MySQL.
3. Rulează:

```powershell
npm install
npm start
```

4. Deschide `http://localhost:3000`. La prima pornire aplicația creează automat baza `tik_live_tools` și tabelele lipsă; importul manual în phpMyAdmin nu mai este necesar.

Pentru conectarea TikTok complet locală: autentifică-te în TikTok în browser, copiază valoarea cookie-ului `sessionid` al contului tău și introdu-o în Setup, apoi username-ul contului live. Valoarea rămâne doar în baza locală MariaDB și nu este trimisă către un signer terț; nu o publica în GitHub sau în capturi de ecran.

Overlay-urile sunt disponibile la adrese de tipul:

```text
http://localhost:3000/overlay/top-likes
http://localhost:3000/overlay/top-coins
http://localhost:3000/overlay/coin-jar
```

Profilul personal este configurat cu planul local `premium`, astfel încât funcțiile avansate să nu fie blocate de limite comerciale. Fiecare profil poate păstra username-ul și `sessionid`-ul local al contului său. Integrarea Discord rămâne opțională: aplicația poate trimite notificări și poate folosi roluri, dar nu este necesară pentru rularea locală.

## Overlay-uri

Galeria locală include categorii pentru goals, countdowns, follower/gift counts, Last X, graphics, OBS docks, Gift Browser, Top Likes, Top Coins, Coin Jar, Gift Battle, Wheel, Likeathon și alte widgeturi. Preview-urile folosesc animații CSS și WebSocket pentru a reacționa la evenimente; linkurile `/overlay/<slug>` pot fi introduse ca Link Source în TikTok LIVE Studio sau Browser Source în OBS.

Arhiva personală de 966 modele de cadouri este disponibilă în `public/assets/gifts`, iar pagina Gift Browser oferă căutare și previzualizare.

Integrarea TikTok folosește un conector open-source local, fără cont Euler Stream, server de semnare sau API key extern. Pentru a evita orice signer extern, conexiunea folosește cookie-ul local `sessionid` al contului TikTok, configurat în Setup sau `TIKTOK_SESSION_ID`. TikTok poate schimba protocolul de live fără notificare, de aceea conectorul este izolat în `src/tiktok.js`, iar aplicația nu afișează „conectat” până când handshake-ul real nu reușește.

## Funcții implementate local

- Pipeline de evenimente TikTok și evenimente de test: stocare în MariaDB, viewer points/levels, clasamente, goals și sesiuni de joc.
- Reguli Actions & Events cu filtre, cooldown, TTS, sunet, schimbare de scenă OBS și webhook.
- Comenzi de chat locale cu răspuns TTS, sound alerts cu upload audio local și WebSocket.
- Galerie de overlay-uri cu previzualizare animată, linkuri reutilizabile și Gift Browser cu 966 modele; valorile în coins se sincronizează din catalogul TikTok când contul este conectat.
- OBS WebSocket, profiluri, settings, import/export și coadă locală pentru song requests.
- Panoul de configurare expune acțiuni TTS, sunet, overlay, scenă OBS și webhook, plus cooldown/rol pentru comenzi și costuri points pentru song requests.
- Webhook Discord opțional și points configurabile pentru follow/join, salvate în MariaDB.
- Sound Alerts acceptă fișiere audio locale încărcate din interfață și le redă în browser/overlay la evenimentul configurat. Song Requests includ integrare Spotify OAuth opțională: setează `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` și `SPOTIFY_REDIRECT_URI` în `.env`, apoi adaugă exact redirect-ul în Spotify Developer Dashboard. Căutarea și adăugarea în playback queue cer cont Spotify Premium și permisiunea `user-modify-playback-state`.
- Bridge de hotkeys Windows: `Ctrl+Alt+F1` Timer, `Ctrl+Alt+F2` Wheel Spin, `Ctrl+Alt+F3` Next Song, `Ctrl+Alt+F4` Next OBS Scene. Acestea declanșează acțiuni locale chiar când OBS/LIVE Studio este activ; aceleași combinații pot fi configurate în LIVE Studio pentru acțiuni proprii.
- Song requests au endpoint separat de cerere cu `pointsCost`; dacă utilizatorul are points insuficiente, cererea este respinsă atomic.

Pentru verificare rapidă fără live real, folosește butoanele `Test gift`, `Test like`, `Test follow` din galerie. Acestea trec prin același pipeline de DB, goals, rules, sunete și WebSocket ca evenimentele primite de la TikTok.

## Overlay-uri publice prin GitHub Pages

Aplicația poate rămâne locală, iar overlay-urile pot fi publicate separat. Workflow-ul `Publish public overlays` construiește automat rutele statice din `public/overlays` în GitHub Pages. Backend-ul, MariaDB, TikTok LIVE și OBS rămân pe calculatorul local.

Pentru ca un overlay public să primească evenimente live, adaugă URL-ul HTTPS al backend-ului disponibil printr-un tunel securizat:

```text
https://<cont>.github.io/<repository>/overlay/firework/?backend=https://<backend-public>/
```

Parametrul `backend` este opțional pentru rularea locală. Nu pune niciodată `sessionid`, parole OBS, fișiere `.env` sau datele MariaDB în repository; acestea rămân în configurația locală.

Interfața completă este publicată la:

```text
https://live.panel-pro.ro/
```

Pentru a folosi interfața publică împreună cu serverul local, deschide:

```text
https://live.panel-pro.ro/?backend=https://adresa-publica-a-backendului/
```

Backend-ul trebuie să fie disponibil prin HTTPS și WebSocket (`wss://`). Serverul local permite CORS pentru `https://live.panel-pro.ro`; conexiunea TikTok, XAMPP, OBS și secretele rămân pe calculatorul personal.
