import ChristmasOur from "@/assets/christmas-our-30s.mp3.asset.json";
import StarNgPasko from "@/assets/star-ng-pasko-30s.mp3.asset.json";
import Christmas02 from "@/assets/christmas-02-30s.mp3.asset.json";
import { useEffect, useState } from "react";

/** 30-second slideshow tracks; add new songs here and they join the shuffle. */
export const SLIDESHOW_TRACKS = [
  { url: ChristmasOur.url, title: "Christmas Our" },
  { url: StarNgPasko.url, title: "Star ng Pasko" },
  { url: Christmas02.url, title: "Christmas" },
];

export function pickSlideshowTrack(random: () => number = Math.random) {
  return SLIDESHOW_TRACKS[Math.floor(random() * SLIDESHOW_TRACKS.length) % SLIDESHOW_TRACKS.length];
}

/** Picks a random track after mount (avoids SSR mismatch); re-picks when `key` changes. */
export function useRandomSlideshowTrack(key?: unknown) {
  const [track, setTrack] = useState<(typeof SLIDESHOW_TRACKS)[number] | null>(null);
  useEffect(() => { setTrack(pickSlideshowTrack()); }, [key]);
  return track;
}
