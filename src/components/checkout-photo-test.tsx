import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, FlaskConical, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { testCheckoutPhoto } from "@/lib/photo-test.functions";
import { photoStyles } from "@/lib/pasko-content";
import { dataUrlToBlob, deliverFile } from "@/lib/download";
import { LocalPackageDownload } from "@/components/LocalDownloadControls";

type Slot = { image: string; error: string; busy: boolean };
const emptySlots = (): Slot[] => photoStyles.map(() => ({ image: "", error: "", busy: false }));

export function CheckoutPhotoTest({ photo, template, pkg = "basic" }: { photo: string; template: string; pkg?: "basic" | "premium" }) {
  const run = useServerFn(testCheckoutPhoto);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [slots, setSlots] = useState<Slot[]>(emptySlots);
  const found = photoStyles.findIndex((s) => s.key === template);
  const first = found < 0 ? 0 : found;
  const order = [first, ...photoStyles.map((_, i) => i).filter((i) => i !== first)];

  async function generate() {
    if (busy) return;
    setBusy(true);
    setSlots(emptySlots());
    for (const index of order) {
      setSlots((p) => p.map((s, i) => (i === index ? { ...s, busy: true } : s)));
      try {
        const r = await run({ data: { photo, index } });
        setSlots((p) => p.map((s, i) => (i === index ? { image: r.image, error: "", busy: false } : s)));
      } catch (e) {
        const message = e instanceof Error ? e.message : "Photo test failed. Please try again.";
        setSlots((p) => p.map((s, i) => (i === index ? { image: "", error: message, busy: false } : s)));
      }
    }
    setBusy(false);
  }

  const done = slots.some((s) => s.image || s.error);
  const images = order.map((i) => slots[i]?.image).filter((x): x is string => !!x);
  const key = images.join("|");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const localPhotos = useMemo(() => images.map((u, i) => ({ blob: dataUrlToBlob(u), name: `pasko-test-${i + 1}.png` })), [key]);

  return <>
    <Button type="button" size="lg" className="mt-4 h-16 w-full text-lg font-bold shadow-lg" onClick={() => { setOpen(true); setSlots(emptySlots()); }}>
      <FlaskConical className="size-6" />{pkg === "premium" ? "TEST ₱149 — 5 photos" : "TEST PHOTO — Try 5 styles"}
    </Button>
    <Dialog open={open} onOpenChange={(v) => { if (!busy) setOpen(v); }}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test Christmas Photos</DialogTitle>
          <DialogDescription>Creates all 5 styles one at a time with the built-in AI. No payment or order is created.</DialogDescription>
        </DialogHeader>
        {!done && <img src={photo} alt="Your uploaded photo" className="mx-auto max-h-60 w-full object-contain" />}
        <div className="grid grid-cols-2 gap-3">
          {photoStyles.map((style, index) => {
            const slot = slots[index] ?? { image: "", error: "", busy: false };
            return <div key={style.key} className="space-y-1">
              <p className="text-xs font-semibold">{style.name}{index === first ? " (selected)" : ""}</p>
              {slot.image
                ? <img src={slot.image} alt={`${style.name} test photo`} className="w-full rounded-xl object-contain" />
                : <div className="flex h-32 items-center justify-center rounded-xl bg-muted text-xs text-muted-foreground">
                    {slot.busy ? <LoaderCircle className="animate-spin" /> : slot.error ? <span role="alert" className="break-words p-2 text-destructive">{slot.error}</span> : "Waiting…"}
                  </div>}
              {slot.image && <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => void deliverFile(dataUrlToBlob(slot.image), `pasko-test-${style.key}.png`)}><Download />Save photo</Button>}
            </div>;
          })}
        </div>
        {!busy && images.length === 5 && <LocalPackageDownload photos={localPhotos} name="pasko-test-photos" />}
        <Button type="button" disabled={busy} onClick={generate}>
          {busy ? <LoaderCircle className="animate-spin" /> : <FlaskConical />}
          {busy ? "Generating…" : done ? "Test again" : "Generate 5 Test Photos"}
        </Button>
      </DialogContent>
    </Dialog>
  </>;
}
