// /api/transform.js  (Node runtime)

export default async function handler(req, res) {
  // CORS (optional, helps if you embed elsewhere)
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

    // Convert raw base64 -> data URL (what Gradio expects)
    const dataUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/png;base64,${imageBase64}`;

    // Space URL (configurable via env var if you want)
    const SPACE_URL = process.env.HF_SPACE_URL || "https://xiaoxiao12123-sketch-to-style.hf.space";
    const ENDPOINT = `${SPACE_URL}/run/predict`;

    // If your Space is PRIVATE, add an Access Token in Vercel env: HF_TOKEN
    const headers = { "Content-Type": "application/json" };
    if (process.env.HF_TOKEN) headers.Authorization = `Bearer ${process.env.HF_TOKEN}`;

    // Warm up the Space (helps cold-starts)
    // Ignore errors — it's just a ping
    try { await fetch(SPACE_URL, { method: "GET" }); } catch {}

    const payload = {
      data: [dataUrl, style, extra, steps, guidance, img_guidance, seed],
    };

    // Retry loop with backoff + longer per-attempt timeout
    const maxAttempts = 3;
    let lastErrorText = "";

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      // 55s per attempt (Vercel Node functions permit longer than Edge)
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 55_000);

      try {
        const resp = await fetch(ENDPOINT, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (resp.ok) {
          const json = await resp.json();
          const out = json?.data?.[0];
          const image =
            typeof out === "string" && out.startsWith("data:image")
              ? out
              : `data:image/png;base64,${out || ""}`;
          return res.status(200).json({ image });
        } else {
          lastErrorText = await resp.text().catch(() => "");
        }
      } catch (err) {
        clearTimeout(timer);
        lastErrorText = String(err);
      }

      // Backoff: 3s, then 6s
      await new Promise((r) => setTimeout(r, attempt * 3000));
    }

    return res.status(502).json({ error: "hf_failed", detail: lastErrorText || "Unknown error" });
  } catch (e) {
    return res.status(500).json({ error: "server_error", detail: String(e) });
  }
}

