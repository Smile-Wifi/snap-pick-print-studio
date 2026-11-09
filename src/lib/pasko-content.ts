export const packages = {
  basic: {
    name: "Basic Magic",
    price: 99,
    details: "5 Christmas photos · No background music",
    summary: "5 Christmas photos",
  },
  premium: {
    name: "Magic with Music",
    price: 149,
    details: "5 Christmas photos · Slideshow + music",
    summary: "5 photos · Slideshow + music",
  },
} as const;

export type PackageId = keyof typeof packages;

export const photoStyles = [
  { name: "Simbang Gabi", detail: "A warm Filipino Christmas tradition" },
  { name: "Snow", detail: "A cozy winter wonderland" },
  { name: "Pajama", detail: "A relaxed family Christmas at home" },
  { name: "Street Celebration", detail: "Bright lights and festive nights" },
  { name: "Traditional / Barong", detail: "An elegant holiday portrait" },
] as const;

export const howItWorks = [
  { title: "Upload your old photo", detail: "Any clear photo of a face — old, faded or new." },
  { title: "Choose your template", detail: "Pick your first Christmas look. All five styles are included." },
  { title: "Payment", detail: "Choose ₱99 Basic or ₱149 with music. Pay with GCash, Maya or bank transfer." },
  { title: "Generate 5 photos", detail: "After payment verification, five Christmas photos are ready to download and share." },
] as const;