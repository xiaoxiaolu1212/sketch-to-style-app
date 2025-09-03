/api/transform.js
// /api/transform.js
export const config = { runtime: "edge" }; // faster cold start

export default async function handler(req) {
  try {
    const body = await req.json();
    const { imageBase64, style } = body || {};
    if (!imageBase64 || !style) {
      return new Response(JSON.stringify({ error: "missing_inputs" }), { status: 400 });
    }

    // Choose a text-to-image or image-to-image model you like on HF.
    // This example shows a simple text-to-image call that *ignores* the sketch.
    // Swap to an img2img model when you pick one; then include the sketch per that model's docs.
    const prompt = `Transform a hand-drawn sketch to ${style} style, clean lines, high-quality output.`;

    const hfRes = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HF_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: prompt }),
      }
    );

    if (!hfRes.ok) {
      const txt = await hfRes.text();
      return new Response(JSON.stringify({ error: "hf_failed", detail: txt }), { status: 502 });
    }

    // Many HF text→image endpoints return image bytes.
    const arr = await hfRes.arrayBuffer();
    return new Response(arr, { headers: { "Content-Type": "image/png" }, status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: "server_error" }), { status: 500 });
  }
}
