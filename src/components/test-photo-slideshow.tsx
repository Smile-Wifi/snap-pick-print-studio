import { useMemo } from "react";
import { Slideshow } from "@/components/order/Slideshow";
import { dataUrlToBlob } from "@/lib/download";
import SantaBells from "@/assets/santa-bells-first-10s.mp3.asset.json";

export function TestPhotoSlideshow({ images }: { images: (string | null)[] }) {
  const photos = useMemo(() => images.filter((image): image is string => Boolean(image)), [images]);
  const blobs = useMemo(() => Object.fromEntries(photos.map(image => [image, dataUrlToBlob(image)])), [photos]);
  if (!photos.length) return null;
  return <Slideshow images={photos} musicUrl={SantaBells.url} musicTitle="Christmas Bells" blobs={blobs} fileName="pasko-test-slideshow" />;
}