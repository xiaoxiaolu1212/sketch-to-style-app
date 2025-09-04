// /api/transform.js  — Vercel Node function (not Edge)
// Accepts JSON: { imageBase64, style, extra?, steps?, guidance?, img_guidance?, seed? }
// Returns JSON: { image: "<data:image/png;base64,...>" }

export default async function handler(req, res) {
  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  try {
    // Vercel gives parsed body when Content-Type: application/json
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const {
      imageBase64,
      style,
      extra = "",
      steps = 15,
      guidance = 7,
      img_guidance = 1.5,
      seed = -1,
    } = body;

    if (!imageBase64 || !style) {
      return res.status(400).json({ error: "missing_inputs" });
    }

    // ---- Configure your Space URL here (or via env) ----
    // Make sure the username/space name are EXACT:
    const SPACE_URL =
      process.env.HF_SPACE_URL || "https://xiaoxiao12123-sketch-to-style.hf.space";

    // If your Space is private, create a Vercel env var HF_TOKEN with your HF write token
    const headers = { "Content-Type": "application/json" };
    if (process.env.HF_TOKEN) headers.Authorization = `Bearer ${process.env.HF_TOKEN}`;

    // Gradio accepts a data URL for image inputs. Add prefix if needed.
    const dataUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/png;base64,${imageBase64}`;

    const payload = {
      // Order must match your Gradio app.py: [sketch, style, extra, steps, guidance, img_guidance, seed]
      data: [dataUrl, style, extra, steps, guidance, img_guidance, seed],
    };

    // Warm up the Space (ignore failures)
    try { await fetch(SPACE_URL, { method: "GET" }); } catch {}

    // Helper to call a path with timeout
    async function callPredict(path) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 55_000); // Vercel default 60s limit
      try {
        const resp = await fetch(`${SPACE_URL}${path}`, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        const text = await resp.text().catch(() => "");
        let json = null;
        try { json = JSON.parse(text); } catch {}
        return { ok: resp.ok, status: resp.status, text, json };
      } finally {
        clearTimeout(timer);
      }
    }

    // Try both common Gradio endpoints (some Spaces use one or the other)
    const paths = ["/run/predict", "/api/predict/"];
    let last = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      for (const p of paths) {
        const r = await callPredict(p);
        last = r;

        if (r.ok && r.json && Array.isArray(r.json.data)) {
          const out = r.json.data[0];

          // Gradio may return a data URL or raw base64; normalize to data URL
          const image =
            typeof out === "string" && out.startsWith("data:image")
              ? out
              : `data:image/png;base64,${out || ""}`;

          return res.status(200).json({ image });
        }

        // If 404 Not Found, try the other path immediately
        if (r.status === 404) continue;
      }
      // backoff for cold-starts
      await new Promise((r) => setTimeout(r, attempt * 3000));
    }

    return res.status(502).json({
      error: "hf_failed",
      detail: last?.text || "Unknown error from Space",
    });
  } catch (err) {
    return res.status(500).json({ error: "server_error", detail: String(err?.message || err) });
  }
}

