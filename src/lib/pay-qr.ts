import gcash from "@/assets/gcash-qr.jpeg.asset.json";
import maya from "@/assets/maya-qr.jpeg.asset.json";
import gotyme from "@/assets/gotyme-qr.jpeg.asset.json";
/** Built-in QR images used until staff upload a replacement. */
export const DEFAULT_QR: Record<string, string> = { gcash: gcash.url, maya: maya.url, other: gotyme.url };
export const PAY_STATUS_LABEL = { pending: "Awaiting verification", verified: "Verified", rejected: "Rejected" } as const;
export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(new Error("Could not read the file.")); r.readAsDataURL(file); });
}
