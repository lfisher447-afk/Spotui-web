import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Handling
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const targetUrl = req.query.url as string;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing ?url= query parameter" });
  }

  try {
    let finalUrl = targetUrl.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }

    const parsedUrl = new URL(finalUrl);

    // Spoofed browser TLS and client headers (Chrome 122 Windows x64 profile)
    const spoofHeaders: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Language": "en-US,en;q=0.9",
      "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"Windows"',
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1",
      Referer: parsedUrl.origin + "/",
      Origin: parsedUrl.origin,
    };

    // Forward range headers for media streaming
    if (req.headers.range) {
      spoofHeaders["Range"] = req.headers.range as string;
    }

    const response = await fetch(finalUrl, {
      method: req.method || "GET",
      headers: spoofHeaders,
      redirect: "follow",
    });

    const contentType = response.headers.get("content-type") || "text/html";

    // Strip restrictive headers blocking framing and cross-origin access
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("X-Vercel-Proxy-Engine", "WSM-Stealth-Edge");
    res.setHeader("X-Spoofed-Fingerprint", "TLS-JA3-Chrome122-Win64");

    const contentRange = response.headers.get("content-range");
    if (contentRange) res.setHeader("Content-Range", contentRange);

    const acceptRanges = response.headers.get("accept-ranges");
    if (acceptRanges) res.setHeader("Accept-Ranges", acceptRanges);

    if (contentType.includes("text/html")) {
      let html = await response.text();

      // Deobfuscate & neutralize framebusters
      html = html.replace(/if\s*\(top\s*!==\s*self\)[^}]+}/gi, "/* framebuster neutralized */");
      html = html.replace(/top\.location\s*=\s*self\.location/gi, "/* bypassed */");
      html = html.replace(/window\.top\.location/gi, "window.self.location");

      // Inject base tag for relative links
      html = html.replace("<head>", `<head><base href="${parsedUrl.origin}/">`);

      // Inject client spoofing runtime
      const clientSpoofScript = `
        <script>
          (function() {
            try {
              window.__SPOTUI_VERCEL_PROXY__ = true;
              window.__WSM_ACTIVE__ = true;
              Object.defineProperty(window, 'top', { get: function() { return window.self; } });
              Object.defineProperty(window, 'parent', { get: function() { return window.self; } });
            } catch(e) {}
          })();
        </script>
      `;
      res.status(response.status).send(clientSpoofScript + html);
    } else {
      const buffer = await response.arrayBuffer();
      res.status(response.status).send(Buffer.from(buffer));
    }
  } catch (err: any) {
    res.status(502).json({
      error: "Vercel Edge Proxy Routing Error",
      message: err.message,
      targetUrl,
    });
  }
}
