// api/transform.js  — Edge runtime (≈30s), CORS, friendly GET, POST text→image
export const config = { runtime: "edge" };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
};

export default async function handler(req) {
  // CORS / preflight
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method === "GET") {
    return new Response(JSON.stringify({ ok: true, hint: "POST JSON { style, imageBase64? }" }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: CORS });
  }

  try {
    const { style } = await req.json().catch(() => ({}));
    if (!style) {
      return new Response(JSON.stringify({ error: "missing_style" }), { status: 400, headers: CORS });
    }

    // Use a fast model + wait_for_model so first call doesn’t 503
    const prompt = `A high-quality artwork in ${style} style, derived from a hand sketch, crisp clean lines.`;

    // Abort after ~28s (Edge hard limit ≈30s)
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 28_000);

    const hfRes = await fetch(
      // faster model than sd2; switch later to img2img when pipeline is stable
      "https://api-inference.huggingface.co/models/stabilityai/sdxl-turbo",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          options: { wait_for_model: true }, // important on first call
        }),
        signal: controller.signal,
      }
    ).catch((e) => e);

    clearTimeout(t);

    if (!hfRes || !hfRes.ok) {
      const detail = (hfRes && (await hfRes.text().catch(() => ""))) || "fetch_failed";
      return new Response(JSON.stringify({ error: "hf_failed", detail }), {
        status: (hfRes && hfRes.status) || 502,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const arr = await hfRes.arrayBuffer();
    return new Response(arr, { status: 200, headers: { ...CORS, "Content-Type": "image/png" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: "server_error", detail: String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
}

