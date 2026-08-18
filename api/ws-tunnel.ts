import type { VercelRequest, VercelResponse } from "@vercel/node";

// In-memory tunnel buffer for Vercel serverless proxy requests
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Handle SSE streaming or POST packet dispatch
  if (req.method === "POST") {
    const { type, id, ...payload } = req.body || {};

    // 1. YouTube Search via Tunnel
    if (type === "yt_search") {
      const mockItems = [
        {
          id: "kJQP7kiw5Fk",
          title: `${payload.query || "Music"} (Vercel Fast Stream)`,
          artist: "Innertube Edge Node",
          duration: 215,
          durationText: "3:35",
          thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
          views: "2.4M views",
        },
        {
          id: "synth_01",
          title: "Resonance - Stealth Tunnel",
          artist: "HOME",
          duration: 212,
          durationText: "3:32",
          thumbnail: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80",
          views: "890K views",
        },
      ];
      return res.json({ id, payload: mockItems, wsmTunnel: true });
    }

    // 2. Spotify Sync via Tunnel
    if (type === "spotify_sync_playlists") {
      const mockPlaylists = [
        {
          id: "sp_vercel_hits",
          name: "Spotify: Global Top 50 (Vercel Edge)",
          source: "spotify",
          tracks: [
            { id: "sp_01", title: "Starboy", artist: "The Weeknd ft. Daft Punk", album: "Starboy", duration: 230, thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80", source: "spotify" },
            { id: "sp_02", title: "Midnight City", artist: "M83", album: "Hurry Up", duration: 243, thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80", source: "spotify" },
          ],
        },
      ];
      return res.json({ id, payload: mockPlaylists, wsmTunnel: true });
    }

    // 3. YouTube Sync via Tunnel
    if (type === "yt_sync_playlists") {
      const mockYtPlaylists = [
        {
          id: "yt_vercel_top",
          name: "YouTube Music: Trending Global (Vercel)",
          source: "youtube",
          tracks: [
            { id: "kJQP7kiw5Fk", title: "Despacito", artist: "Luis Fonsi ft. Daddy Yankee", album: "VIDA", duration: 228, thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80" },
            { id: "OPf0YbXqDm0", title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", album: "Uptown Special", duration: 270, thumbnail: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80" },
          ],
        },
      ];
      return res.json({ id, payload: mockYtPlaylists, wsmTunnel: true });
    }

    // 4. Shazam Recognition via Tunnel
    if (type === "shazam_recognize") {
      const match = {
        title: payload.trackTitle || "Resonance",
        artist: payload.trackArtist || "HOME",
        album: "Odyssey",
        genre: "Synthwave / Electronic",
        confidence: 0.99,
        artwork: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80",
        key: "F# Minor",
        bpm: 105,
      };
      return res.json({ id, payload: { match }, wsmTunnel: true });
    }

    return res.json({ id, status: "ok", wsmTunnel: true });
  }

  res.json({ status: "ws-tunnel-ready", transport: "http-sse-longpoll" });
}
