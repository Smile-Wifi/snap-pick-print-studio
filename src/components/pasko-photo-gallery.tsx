import { useEffect, useMemo, useState } from "react";
import { Download, LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STYLES } from "@/lib/pasko-content";
import { dataUrlToBlob, deliverFile } from "@/lib/download";
import { LocalPackageDownload } from "@/components/LocalDownloadControls";
import { RENDER_STATUS_LABEL, type RenderStatus } from "@/lib/render-outcome";

export function PaskoPhotoGallery({ images, errors = {}, busy = [], status = {}, retry }: { images: (string | null)[]; errors?: Record<number, string>; busy?: number[]; status?: Record<number, RenderStatus>; retry?: (index: number) => void }) {
  const [blobs, setBlobs] = useState<Record<string, Blob>>({});
  const key = images.join("|");
  useEffect(() => {
    let active = true;
    void Promise.all(images.filter((u): u is string => Boolean(u)).map(async url => {
      const blob = url.startsWith("data:") ? dataUrlToBlob(url) : await fetch(url).then(r => { if (!r.ok) throw new Error("Download unavailable"); return r.blob(); });
      return [url, blob] as const;
    })).then(entries => { if (active) setBlobs(Object.fromEntries(entries)); }).catch(() => { if (active) setBlobs({}); });
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const photos = useMemo(() => images.flatMap((url, i) => url && blobs[url] ? [{ blob: blobs[url], name: `${STYLES[i]?.key ?? i}.png` }] : []), [blobs, images]);
  return <div className="space-y-4"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {STYLES.map((style, i) => <figure key={style.key} className="space-y-2">
      <figcaption className="font-semibold">{style.name}</figcaption>
      {images[i] ? <img src={images[i] ?? undefined} alt={`${style.name} Christmas portrait`} className="aspect-[2/3] w-full rounded-lg object-contain bg-muted" /> : <div className="flex aspect-[2/3] items-center justify-center rounded-lg bg-muted p-4 text-center text-muted-foreground">{busy.includes(i) ? <span className="flex flex-col items-center gap-2"><LoaderCircle className="animate-spin" aria-label="Creating photo" />{status[i] && <span>{RENDER_STATUS_LABEL[status[i]]}</span>}</span> : errors[i] ? <p role="alert">{errors[i]}</p> : "Waiting for photo"}</div>}
      {images[i] && <Button type="button" variant="outline" disabled={!blobs[images[i] ?? ""]} onClick={() => { const blob = blobs[images[i] ?? ""]; if (blob) void deliverFile(blob, `pasko-${style.key}.png`); }}><Download />Download</Button>}
      {!images[i] && errors[i] && retry && <Button type="button" variant="outline" disabled={busy.length > 0} onClick={() => retry(i)}><RotateCcw />Retry this style</Button>}
    </figure>)}
  </div>{photos.length === 5 && <LocalPackageDownload photos={photos} name="pasko-five-portraits" />}</div>;
}
