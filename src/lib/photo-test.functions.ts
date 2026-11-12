import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Public test render requested by the owner: never touches orders. Uses AI credits per call.
export const testCheckoutPhoto = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ photo: z.string().max(14_000_000), index: z.number().int().min(0).max(4) }).parse(input))
  .handler(async ({ data }) => {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(data.photo);
    if (!match?.[1] || !match[2]) throw new Error("Choose a JPG, PNG or WEBP photo.");
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const { generateChristmasPhoto } = await import("@/server/ai.server");
    const png = await generateChristmasPhoto(new Blob([bytes], { type: match[1] }), data.index);
    let out = "";
    for (let i = 0; i < png.length; i += 0x8000) out += String.fromCharCode(...png.subarray(i, i + 0x8000));
    return { image: `data:image/png;base64,${btoa(out)}` };
  });
