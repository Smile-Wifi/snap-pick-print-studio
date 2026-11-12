import { META_STYLE_INDEX, META_STYLE_IDS, metaPhotoPrompt, type MetaPhotoStyle } from "@/lib/meta-photo-styles";

export async function generateMetaPhoto(imageBase64: string, style: MetaPhotoStyle) {
  const apiKey = process.env["MODEL_API_KEY"];
  if (!apiKey) throw new Error("Add MODEL_API_KEY in Cloud → Secrets before creating photos.");
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(imageBase64) || imageBase64.length > 14_000_000) throw new Error("Choose a JPG, PNG or WEBP photo up to 10 MB.");
  const request = () => fetch("https://api.meta.ai/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "muse-image-1.0", prompt: metaPhotoPrompt(style), images: [{ image_url: imageBase64 }], n: 1, output_format: "png" }),
  });
  let response = await request();
  // Meta can temporarily return 404 even while Muse is listed and available.
  // Retry this same edit once; never switch providers or retry other failures.
  if (response.status === 404) {
    console.warn("Meta photo edit temporary 404; retrying once", { style });
    await response.body?.cancel();
    await new Promise(resolve => setTimeout(resolve, 1000));
    response = await request();
  }
  // Never expose provider response bodies: they may contain request credentials.
  if (!response.ok) {
    console.error("Meta photo edit request failed", { status: response.status, model: "muse-image-1.0", endpoint: "/v1/images/edits", style });
    if (response.status === 404) throw new Error("Meta Muse Image is temporarily unavailable (404). Please retry this style shortly. If it continues, check your Meta account's Muse Image access.");
    if (response.status === 401) throw new Error("Meta could not authorize the request. Check MODEL_API_KEY in Cloud Secrets.");
    if ([402, 403].includes(response.status)) throw new Error("Meta has blocked image creation. Check your Meta account billing and Muse Image access.");
    if (response.status === 429) throw new Error("Meta is busy. Wait a minute before retrying this style.");
    throw new Error(`Meta photo creation failed (${response.status}).`);
  }
  const data = await response.json() as { data?: { b64_json?: string }[] };
  const image = data.data?.[0]?.b64_json;
  if (!image || !/^[A-Za-z0-9+/=]+$/.test(image)) throw new Error("Meta returned no PNG photo.");
  return image;
}

export async function generateChristmasPhoto(original: Blob, styleIndex: number) {
  const style = META_STYLE_IDS.find(id => META_STYLE_INDEX[id] === styleIndex);
  if (!style) throw new Error("Unknown Christmas style.");
  if (!original.size || original.size > 10 * 1024 * 1024) throw new Error("The original photo is missing or too large.");
  const bytes = new Uint8Array(await original.arrayBuffer());
  let input = "";
  for (let i = 0; i < bytes.length; i += 0x8000) input += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const b64 = await generateMetaPhoto(`data:${original.type || "image/jpeg"};base64,${btoa(input)}`, style);
  const binary = atob(b64);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}
