
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: CORS,
    });
  }

  try {
    const body = await req.json();
    const {
      imageBase64,            // raw base64 (no prefix) from the browser
      style,                  // "watercolor", etc.
      extra = "",             // optional extra prompt
      steps = 15,
      guidance = 7,
      img_guidance = 1.5,
      seed = -1,
    } = body || {};

    if (!imageBase64 || !style) {
      return new Response(JSON.stringify({ error: "missing_inputs" }), {
        status: 400,
        headers: CORS,
      });
    }

    // Convert raw base64 to data URL expected by Gradio
    const dataUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/png;base64,${imageBase64}`;

    // IMPORTANT: Order must match your Space's API docs: [sketch, style, extra, steps, guidance, img_guidance, seed]
    const payload = {
      data: [dataUrl, style, extra, steps, guidance, img_guidance, seed],
    };

    const hfRes = await fetch(
      "https://xiaoxiao12123-sketch-to-style.hf.space/run/predict",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!hfRes.ok) {
      const txt = await hfRes.text().catch(() => "");
      return new Response(
        JSON.stringify({ error: "hf_failed", detail: txt || hfRes.statusText }),
        { status: 502, headers: CORS }
      );
    }

    const result = await hfRes.json();
    const out = result?.data?.[0] || null;

    // Return a consistent JSON payload to the browser
    // If Space returned a data URL, just forward it; if not, wrap it.
    const image =
      typeof out === "string" && out.startsWith("data:image")
        ? out
        : `data:image/png;base64,${out || ""}`;

    return new Response(JSON.stringify({ image }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "server_error", detail: String(e) }),
      { status: 500, headers: CORS }
    );
  }
}
