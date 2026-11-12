export const META_STYLE_IDS = ["simbang-gabi", "snow", "pajama", "street", "barong"] as const;
export type MetaPhotoStyle = (typeof META_STYLE_IDS)[number];
export const META_STYLE_NAMES: Record<MetaPhotoStyle, string> = { "simbang-gabi": "Simbang Gabi", snow: "Snow", pajama: "Pajama", street: "Street Celebration", barong: "Traditional / Barong" };
export const META_STYLE_INDEX: Record<MetaPhotoStyle, number> = { "simbang-gabi": 0, snow: 2, pajama: 1, street: 3, barong: 4 };
export const META_STYLE_PROMPTS: Record<MetaPhotoStyle, string> = {
  "simbang-gabi": "warm Simbang Gabi Christmas portrait, Filipino church at dawn, warm parol lanterns, festive lights",
  snow: "cozy winter wonderland, soft falling snow, warm coat and scarf, Christmas tree bokeh lights",
  pajama: "relaxed family Christmas at home, matching Christmas pajamas, cozy living room with Christmas tree",
  street: "bright Filipino street Christmas celebration, colorful lights, night street, parol lanterns, festive bokeh",
  barong: "elegant traditional Filipino holiday portrait, wearing elegant barong / Filipiniana, formal studio with gold Christmas lights",
};
export function metaPhotoPrompt(style: MetaPhotoStyle) {
  return `${META_STYLE_PROMPTS[style]}, keep the exact same person's face, identity, hairstyle and smile, photorealistic. Keep the same number of people. No text or watermark.`;
}
