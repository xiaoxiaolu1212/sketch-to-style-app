export const config = { runtime: "edge" };

export default async function handler(req) {
  try {
    const body = await req.json();
    const { imageBase64, style, steps = 15, guidance = 7, img_guidance = 1.5, seed = -1 } = body;

    if (!imageBase64 || !style) {
      return new Response(JSON.stringify({ error: "missing_inputs" }), { status: 400 });
    }

    // Forward the request to your Hugging Face Space API
    const hfRes = await fetch("https://xiaoxiao12123-sketch-to-style.hf.space/run/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [ 
          imageBase64,  // sketch (base64 string)
          style,        // dropdown style
          "",           // extra prompt (blank for now)
          steps,
          guidance,
          img_guidance,
          seed
        ]
      }),
    });

    if (!hfRes.ok) {
      const txt = await hfRes.text();
      return new Response(JSON.stringify({ error: "hf_failed", detail: txt }), { status: 502 });
    }

    const result = await hfRes.json();
    const imgBase64 = result?.data?.[0] || null;

    return new Response(JSON.stringify({ image: imgBase64 }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "server_error", detail: e.message }), { status: 500 });
  }
}
