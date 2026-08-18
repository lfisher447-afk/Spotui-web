# Spotui Web (Signal Room)

> A high-performance, local-first browser music workspace, multi-engine proxy platform, and audio vault featuring Web Audio DSP acceleration, compatible **NovaAc Web Passphrase** archive support, ShazamKit audio recognition, real `.wsm` WebAssembly stream modules, and hardened DRM protection.

**Live website:** [spotui-web.vercel.app](https://spotui-web.vercel.app/)  
**Android project:** [lfisher447-afk/SpotUi-Offical](https://github.com/lfisher447-afk/SpotUi-Offical)  
**Web repository:** [lfisher447-afk/Spotui-web](https://github.com/lfisher447-afk/Spotui-web)

---

## What Spotui Web is

Spotui Web is the browser-facing ecosystem companion for Spotui. Built for modern browsers using **React 19, TypeScript, Tailwind CSS, Web Audio API, WebAssembly, and IndexedDB**, it delivers an uncompromising desktop-class music playback environment, local encrypted vault storage, real-time unblocked web proxy browsing, and zero-knowledge archive decompression.

The Android client and the web project operate as distinct, specialized implementations:
- **Spotui Android** utilizes native Android Media3 services, background ExoPlayer pipelines, device audio routing, and hardware-backed Android Keystore cryptography.
- **Spotui Web** utilizes browser-native Web Audio DSP chains, WebAssembly binary stream processors (`.wsm`), Web Crypto API (PBKDF2 / AES-GCM), Web Workers, Service Worker proxy request mutators, and IndexedDB persistent vaults.

> **Important:** Spotui Web is an independent open-source project and is not affiliated with, endorsed by, or sponsored by Spotify AB or Google LLC. Spotify and YouTube Music are trademarks of their respective owners. Use this platform exclusively with authorized content, personal credentials, and legal media sources.

---

## Core Architecture & Feature Matrix

| Subsystem | Technology | Capabilities |
| :--- | :--- | :--- |
| **Playback & DSP Matrix** | Web Audio API / AudioContext | 10-Band Parametric Equalizer (32Hzâ€“16kHz), Spatial Reverb convolution, dynamic bass booster, high-ratio compression limiter, crossfade, and pitch tuning. |
| **NovaAc Archive Importer** | Web Crypto / TypedArray Streams | Bounded-memory streaming decompression for v7 and v8 framed **Web Passphrase** archives with real-time PBKDF2 / AES-GCM verification. |
| **Real `.wsm` Binary Proxy** | WebAssembly / Web Workers | Compiled `.wsm` binary modules (`proxy-engine.wsm`, `tunnel-core.wsm`, `stealth-crypto.wsm`) executing byte-level packet scrambling, header spoofing, and TLS emulation. |
| **Multi-Engine Web Gateway** | Vercel Edge & Express Middleware | Multi-tab unblocked browsing supporting **Vercel Edge Global Mesh**, **Signal Webroot Gateway**, **Insidious Fast-Node Alpha**, and **MrBean Stealth Tunnel Beta**. |
| **Service Worker Interception** | `sw-proxy.js` / Service Worker API | Client-side CSP header stripping, `X-Frame-Options` removal, and framebuster neutralization for embedded web applications. |
| **WebSocket Proxy Bridge** | Web Workers / `/api/ws-tunnel` | Off-thread WebSocket proxy with automatic failover to bidirectional Vercel serverless HTTP/SSE tunnels. |
| **ShazamKit Recognition** | Web Audio / Micro-fingerprinting | Live microphone acoustic recognition and spectral matching for ambient track identification. |
| **Spotify & YT Music Sync** | OAuth 2.0 PKCE / Web Portals | Web-based authentication exchange, playlist synchronization, and remote metadata integration. |
| **Hardened DRM & Anti-Capture** | Low-level DOM & API Hooks | 1000x hardened defense against extensions (Loom, Screencastify), OBS / WebRTC screen recorders, Canvas scrapers (`html2canvas`), and OS screenshot tools. |
| **Stealth Cloaking** | `about:blank` / `blob:` sandboxes | Tab disguise presets (Google Classroom, Google Drive, Wikipedia, Canvas LMS) and isolated sandbox popups. |
| **Local Vault Storage** | IndexedDB / Web Storage API | Client-side encrypted persistent track storage, playlist metadata caches, and JSON snapshot backups. |

---

## Real `.wsm` (WebAssembly Stream Module) Infrastructure

Spotui Web introduces real compiled `.wsm` (WebAssembly Stream Module) binaries for ultra-fast, zero-overhead stream manipulation directly in the browser's WASM linear memory:

```
[ Incoming Stream / Proxy Packet ]
                â”‚
                â–¼
      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
      â”‚  sw-proxy.js     â”‚  â—„â”€â”€ Client-side Service Worker request interceptor
      â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                â”‚
                â–¼
      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
      â”‚  wsm-loader.ts   â”‚  â—„â”€â”€ Dynamic WebAssembly binary compiler & memory allocator
      â””â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                â”‚
       â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
       â–¼                 â–¼                 â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ proxy-engine â”‚ â”‚ tunnel-core  â”‚ â”‚ stealth-crypto  â”‚
â”‚    .wsm      â”‚ â”‚    .wsm      â”‚ â”‚      .wsm       â”‚
â”‚ Packet & CSP â”‚ â”‚ WS Framing   â”‚ â”‚ TLS JA3 Spoofer â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

1. **`proxy-engine.wsm`**: WebAssembly packet scrambler, request header mutator, and CORS de-restriction core.
2. **`tunnel-core.wsm`**: Multiplexed WebSocket protocol framing, payload packing, and TCP keepalive heartbeat manager.
3. **`stealth-crypto.wsm`**: Zero-knowledge payload encryption and dynamic TLS JA3 fingerprint emulator.

---

## 1000x Hardened Anti-Screenshot & Screen Capture Defense

To protect user sessions and private audio workspaces against screen recording software and malicious browser extensions, Spotui Web deploys a multi-layered hardware-accelerated security perimeter:

- **Extension Scraper Purge (`MutationObserver`)**: Continuously monitors `document.documentElement` for injected content scripts, shadow roots, and overlay recorders (Loom, Screencastify, Lightshot, GoFullPage, Chrome extension scrapers) and instantly purges them from the DOM.
- **WebRTC Screen Recording Decoy (`getDisplayMedia` & `getUserMedia`)**: Monkey-patches screen-capture APIs to feed a 60fps pitch-black canvas stream with embedded cryptographic DRM watermarks to OBS, Discord screen share, and browser tab recorders.
- **`MediaRecorder` Interception**: Wraps `window.MediaRecorder` to block unauthorized canvas or stream serialization.
- **DOM Serialization & Canvas Neutralizer**: Hooks `HTMLCanvasElement.prototype.toDataURL`, `toBlob`, and `CanvasRenderingContext2D.prototype.getImageData` to defeat JavaScript DOM scrapers (`html2canvas`, SVG `foreignObject`).
- **OS Screenshot & Chromebook Capture Interception**:
  - Intercepts **Windows Snipping Tool** (`Win + Shift + S`), **Game Bar** (`Win + Alt + R`), **Chromebook screen capture** (`Ctrl + F5`, `Search + Shift + S`, `Snapshot`), and **macOS** (`Cmd + Shift + 3/4/5/6`).
  - Instantly sanitizes clipboard memory (`navigator.clipboard.writeText('')`).
  - Displays a full-screen GPU-accelerated blackout curtain (`z-index: 2147483647`).
- **Anti-Print & PDF Export Protection**: Injects `@media print` style sheets and hooks `window.print()` to render blank pages on print capture attempts.

---

## NovaAc Archive Compatibility Matrix

NovaAc is Spotuiâ€™s custom structured audio archive format. Spotui Web is engineered specifically for **framed Web Passphrase** specifications:

| Archive Format | Browser Support | Cryptographic Specification |
| :--- | :--- | :--- |
| **Web Passphrase (Framed v7)** | Supported | PBKDF2-HMAC-SHA256 key derivation with independently authenticated AES-GCM payload frames. |
| **Web Passphrase (Framed v8)** | Supported | Authenticated frame headers, chunk indices, and streaming decompression. |
| **Android Device-Secure (Keystore)** | *Browser-Incompatible by Design* | Tied to hardware-backed Android Keystore key slots; cannot be derived in web runtimes. |
| **Legacy Monolithic Archives** | Not Recommended | Requires single-allocation decrypt buffers that exceed browser memory limits. |

---

## Quick Start & Local Development

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Package Manager**: `npm`, `pnpm`, or `yarn`

### Setup Steps

```bash
# 1. Clone the repository
git clone https://github.com/lfisher447-afk/Spotui-web.git
cd Spotui-web

# 2. Install dependencies
npm install

# 3. Compile real .wsm binary stream modules
node scripts/build-wsm.js

# 4. Launch the local development server (binds to http://localhost:3000)
npm run dev

# 5. Build for production (compiles Vite frontend & bundle server)
npm run build
```

---

## Vercel Serverless Deployment

Spotui Web is fully configured for zero-configuration deployment to **Vercel Serverless & Edge Runtimes**:

1. Fork or import the repository to GitHub.
2. Link the repository in the **Vercel Dashboard**.
3. Set the Framework Preset to **Vite**.
4. The repository includes `vercel.json` and a complete suite of serverless functions in `/api`:
   - `/api/proxy.ts`: High-throughput HTTPS stealth proxy with TLS JA3 emulation.
   - `/api/audio-stream.ts`: Chunked audio streaming and HTTP byte-range resolver.
   - `/api/ws-tunnel.ts`: Serverless WebSocket & SSE tunnel endpoint.
   - `/api/nodes-status.ts`: Edge gateway health and latency benchmarks.
   - `/api/auth-spotify-url.ts` & `/api/auth-spotify-token.ts`: Spotify OAuth 2.0 PKCE authentication flow.
5. Deploy. The application will be accessible at your custom domain or `*.vercel.app`.

---

## Security & Privacy Guidelines

- **Zero Remote Credential Storage**: Passphrases and encryption keys are processed strictly in ephemeral browser memory using Web Crypto.
- **Client-Side Media Isolation**: Local audio files selected via browser file pickers stay entirely within the client container and are never uploaded to remote servers.
- **IndexedDB Quota Management**: Track and playlist data stored in IndexedDB remain isolated to the user's browser profile and can be backed up or wiped at any time in the **System Deck**.
- **No DRM Circumvention**: Spotui Web does not bypass digital rights management on proprietary commercial streams.

---

## Related Repositories

- **Android Client Application:** [SpotUi-Offical](https://github.com/lfisher447-afk/SpotUi-Offical)
- **Web Client Repository:** [Spotui-web](https://github.com/lfisher447-afk/Spotui-web)
- **Live Production Deployment:** [spotui-web.vercel.app](https://spotui-web.vercel.app/)

---

## License

This project is distributed under the terms of the MIT License. Third-party brand names, trademarks, and services referenced belong to their respective copyright holders
