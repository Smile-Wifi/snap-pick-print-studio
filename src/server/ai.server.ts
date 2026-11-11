import { STYLES } from "@/lib/pasko-content";

const identityRule = "Preserve each person's exact face, age, skin tone, facial features, gaze, and head angle from the uploaded photo. Keep the same number of people; do not add or remove anyone. Change only clothing and Christmas surroundings. Photorealistic, natural anatomy, no text or watermark.";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-image-2.5-sunburst";

// Uses Lovable's built-in AI to restyle the customer's photo into one Christmas scene.
export async function generateChristmasPhoto(original: Blob, styleIndex: number) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Photo creation is not set up yet.");
  const style = STYLES[styleIndex];
  if (!style) throw new Error("Unknown Christmas style.");
  if (!original.size || original.size > 10 * 1024 * 1024) throw new Error("The original photo is missing or too large.");

  const form = new FormData();
  form.set("model", MODEL);
  form.set("prompt", `${style.prompt} ${identityRule}`);
  form.set("size", "1024x1536");
  form.set("output_format", "png");
  form.set("image", new File([original], "original.png", { type: original.type || "image/jpeg" }));

  const response = await fetch(`${GATEWAY}/images/edits`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!response.ok) {
    const text = await response.text();
    console.error(`Image edit failed [${response.status}]: ${text}`);
    if (response.status === 402) throw new Error("AI credits have run out. Add credits in Settings → Plans & credits, then try again.");
    if (response.status === 429) throw new Error("Too many photos are being created right now. Please try again in a minute.");
    let message = "";
    try { message = (JSON.parse(text) as { error?: { message?: string }; message?: string }).error?.message ?? ""; } catch { /* not json */ }
    throw new Error(message || `Photo creation failed (${response.status}).`);
  }
  const result = (await response.json()) as { data?: { b64_json?: string }[] };
  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error("No photo came back. The image may have been declined.");
  const binary = atob(b64);
  const png = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) png[i] = binary.charCodeAt(i);
  return png;
}
