// /api/transform.js  (Node runtime)

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  try {
    const {
      imageBase64,
      style,
      extra = "",
      steps = 15,
      guidance = 7,
      img_guidance = 1.5,
      seed = -1,
    } = req.body || {};

    if (!imageBase64 || !style) {
      return res.status(400).json({ error: "missing_inputs" });
    }

    // Your Space base URL — make sure this is EXACT:
    const SPACE_URL = process.env.HF_SPACE_URL || "https://xiaoxiao12123-sketch-to-style.hf.space";

    // HF token only if the Space is private
    const headers = { "Content-Type": "application/json" };
    if (process.env.HF_TOKEN) headers.Authorization = `Bearer ${process.env.HF_TOKEN}`;

    // Gradio expects a data URL for images
    const dataUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/png;base64,${imageBase64}`;

    const payload = {
      data: [dataUrl, style, extra, steps, guidance, img_guidance, seed],
    };

    // Warm up Space (ignore errors)
    try { await fetch(SPACE_URL); } catch {}

    async function callPredict(path) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 55_000);
      try {
        const resp = await fetch(`${SPACE_URL}${path}`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        const text = await resp.text().catch(() => "");
        let json;
        try { json = JSON.parse(text); } catch {}
        return { ok: resp.ok, status: resp.status, text, json };
      } finally {
        clearTimeout(timer);
      }
    }

    // Try /run/predict then /api/predict/
    const paths = ["/run/predict", "/api/predict/"];
    let last = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      for (const p of paths) {
        const r = await callPredict(p);
        last = r;
        if (r.ok) {
          const out = r.json?.data?.[0];
          const image =
            typeof out === "string" && out.startsWith("data:image")
              ? out
              : `data:image/png;base64,${out || ""}`;
          return res.status(200).json({ image });
        }
        // If 404 Not Found, try the next path immediately
        if (r.status === 404) continue;
      }
      // backoff for cold start
      await new Promise(r => setTimeout(r, attempt * 3000));
    }

    return res.status(502).json({
      error: "hf_failed",
      detail: last?.text || "Unknown error"
    });

  } catch (e) {
    return res.status(500).json({ error: "server_error", detail: String(e) });
  }
}
