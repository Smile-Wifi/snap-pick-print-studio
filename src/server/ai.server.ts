import { STYLES } from "@/lib/pasko-content";

const identityRule = "Preserve each person's exact face, age, skin tone, facial features, gaze, and head angle from the uploaded photo. Keep the same number of people; do not add or remove anyone. Change only clothing and Christmas surroundings. Photorealistic, natural anatomy, no text or watermark.";
const gateway = "https://connector-gateway.lovable.dev/replicate/v1";

export async function generateChristmasPhoto(original: Blob, styleIndex: number) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const replicateKey = process.env["REPLICATE_API_KEY"];
  if (!lovableKey || !replicateKey) throw new Error("Photo generation is not connected yet.");
  const style = STYLES[styleIndex];
  if (!style) throw new Error("Unknown Christmas style.");
  if (!original.size || original.size > 10 * 1024 * 1024) throw new Error("The original photo is missing or too large.");

  const imageBytes = new Uint8Array(await original.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < imageBytes.length; offset += 8192) {
    binary += String.fromCharCode(...imageBytes.subarray(offset, offset + 8192));
  }
  const body = {
    input: {
      prompt: `${style.prompt} ${identityRule}`,
      input_image: `data:${original.type || "image/jpeg"};base64,${btoa(binary)}`,
      aspect_ratio: "2:3",
      output_format: "png",
    },
  };
  const endpoint = `${gateway}/models/black-forest-labs/flux-kontext-pro/predictions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": replicateKey,
      "Content-Type": "application/json",
      Prefer: "wait=60",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(65_000),
  });
  if (!response.ok) throw new Error("The photo provider could not create this image. Please try again.");
  const result: unknown = await response.json();
  if (!result || typeof result !== "object") throw new Error("The photo provider returned an unreadable result.");
  const prediction = result as { status?: string; output?: unknown; urls?: { get?: string } };

  let predictionState = prediction;
  for (let attempt = 0; attempt < 20 && (predictionState.status === "starting" || predictionState.status === "processing"); attempt += 1) {
    if (!predictionState.urls?.get || !predictionState.urls.get.startsWith(`${gateway}/`)) break;
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const poll = await fetch(predictionState.urls.get, {
      headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": replicateKey },
      signal: AbortSignal.timeout(10_000),
    });
    if (!poll.ok) throw new Error("The photo provider stopped responding.");
    const next: unknown = await poll.json();
    if (!next || typeof next !== "object") throw new Error("The photo provider returned an unreadable result.");
    predictionState = next as typeof predictionState;
  }
  const output = predictionState.output;
  if (predictionState.status !== "succeeded" || typeof output !== "string") {
    throw new Error("Photo generation did not complete. Please try again later.");
  }
  const imageUrl = new URL(output);
  if (imageUrl.protocol !== "https:" || !(imageUrl.hostname === "replicate.delivery" || imageUrl.hostname.endsWith(".replicate.delivery"))) {
    throw new Error("The photo provider returned an unsupported image address.");
  }
  const imageResponse = await fetch(imageUrl.href, { signal: AbortSignal.timeout(20_000) });
  if (!imageResponse.ok) throw new Error("The finished photo could not be downloaded.");
  const png = new Uint8Array(await imageResponse.arrayBuffer());
  if (![137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => png[index] === value)) {
    throw new Error("The photo provider returned an invalid image.");
  }
  return png;
}