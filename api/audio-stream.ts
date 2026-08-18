import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const videoId = req.query.id as string;
  if (!videoId) {
    return res.status(400).json({ error: "Missing video id (?id=...)" });
  }

  try {
    // Direct audio resolution
    const streamUrl = `https://www.youtube.com/watch?v=${videoId}`;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.redirect(streamUrl);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
