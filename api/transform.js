// api/transform.js
export const config = { runtime: "edge" };

/**
 * Configure your Space URL here (or via Vercel env var HF_SPACE_URL).
 * IMPORTANT: must match your HF space EXACTLY (owner/space-name).
 * Example: https://xiaoxiao12123-sketch-to-style.hf.space
 */
const SPACE_URL =
  process.env.HF_SPACE_URL ||
  "https://xiaoxiao12123-sketch-to-style.hf.space";

// We'll try Gradio v4 style first, then fallback to older v3 style.
const CANDIDATE_PATHS = ["/api/predict", "/run/predict"];

// Helper: POST with timeout (Edge default ~60s)
async function postWithTimeout(url, json, ms = 55000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json),
      signal: controller.signal
    });
    const text = await resp.text().catch(() => "");
    let parsed = null;
    try { parsed = JSON.parse(text); } catch {}
    return { ok: resp.ok, status: resp.status, text, json: parsed };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req) {
  try {
    const body = await req.json();
    const {
      imageBase64,        // "data:image/png;base64,...."
      style,              // "watercolor" | "oil-painting" | ...
      extra = "",         // extra prompt
      steps = 15,
      guidance = 7,
      img_guidance = 1.5,
      seed = -1
    } = body || {};

    if (!imageBase64 || !style) {
      return new Response(
        JSON.stringify({ error: "missing_inputs" }),
        { status: 400 }
      );
    }

    // Payload format for Gradio HTTP API is "data": [ ... in UI order ... ]
    const payload = {
      data: [
        imageBase64, // image
        style,       // dropdown
        extra,       // text
        steps,       // number
        guidance,    // number
        img_guidance,// number
        seed         // number
      ]
    };

    // Try modern path first, then fallback.
    let last = null;
    for (const p of CANDIDATE_PATHS) {
      const url = `${SPACE_URL}${p}`;
      const res = await postWithTimeout(url, payload);
      // If 404/405, try next path
      if (res.status === 404 || res.status === 405) {
        last = res;
        continue;
      }
      // If other error, surface it
      if (!res.ok) {
        return new Response(
          JSON.stringify({ error: "hf_failed", detail: res.text || res.status }),
          { status: 502 }
        );
      }

      // Gradio response shape: { data: [<image or dataUri>], ... }
      const out = res.json;
      const img = out?.data?.[0] ?? null;
      if (!img) {
        return new Response(
          JSON.stringify({ error: "no_image_in_response", detail: out }),
          { status: 502 }
        );
      }

      return new Response(
        JSON.stringify({ image: img }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Both paths failed specifically with Not Found / Method Not Allowed
    return new Response(
      JSON.stringify({
        error: "hf_failed",
        detail: last?.text || `${last?.status} Not Found/Not Allowed`
      }),
      { status: 502 }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ error: "server_error", detail: String(e?.message || e) }),
      { status: 500 }
    );
  }
}
