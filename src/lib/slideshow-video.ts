// Records Christmas photos and music locally; never uploads customer media.
export const SLIDESHOW_WIDTH = 720;
export const SLIDESHOW_HEIGHT = 1280;
// Keep the existing music source; the film completes one cycle in 15 seconds.
export const SLIDESHOW_DURATION_SECONDS = 15;
export const SLIDESHOW_PHOTO_SECONDS = SLIDESHOW_DURATION_SECONDS / 5;
const W = SLIDESHOW_WIDTH;
const H = SLIDESHOW_HEIGHT;
export const SLIDESHOW_TRANSITION_SECONDS = 0.3;

export function filmstripLayout(t: number, count: number) {
  const photoHeight = 1024;
  const photoWidth = photoHeight * 9 / 16;
  const pitch = photoWidth + 48;
  const progress = Math.max(0, t) % SLIDESHOW_DURATION_SECONDS / SLIDESHOW_DURATION_SECONDS;
  return { photoWidth, photoHeight, pitch, offsetX: progress === 0 ? 0 : -progress * count * pitch, photoY: (H - photoHeight) / 2, startX: (W - photoWidth) / 2 };
}

const VIDEO_TYPES = ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/webm;codecs=vp8,opus", "video/webm;codecs=vp9,opus"];

export function pickVideoType(): { mime: string; ext: "mp4" | "webm" } | null {
  if (typeof MediaRecorder === "undefined") return null;
  // Generic video/mp4 can silently select VP9 + Opus, which iPhone Photos cannot play.
  for (const mime of VIDEO_TYPES) {
    if (MediaRecorder.isTypeSupported(mime)) return { mime, ext: mime.startsWith("video/mp4") ? "mp4" : "webm" };
  }
  return null;
}

export function createSlideshowRecorder(stream: MediaStream): MediaRecorder {
  if (typeof MediaRecorder !== "undefined") {
    for (const mimeType of VIDEO_TYPES) {
      if (!MediaRecorder.isTypeSupported(mimeType)) continue;
      // Some phones advertise a codec but cannot initialize its encoder.
      for (const options of [{ mimeType, videoBitsPerSecond: 5_000_000, audioBitsPerSecond: 128_000 }, { mimeType }]) {
        try { return new MediaRecorder(stream, options); } catch { /* Try safer options, then the next codec. */ }
      }
    }
  }
  throw new Error("This browser can't create a playable video. Please open the page in Safari or Chrome.");
}

export async function wakeSlideshowAudio(ctx: AudioContext) {
  const isRunning = () => ctx.state === "running";
  if (isRunning()) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      ctx.resume(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Tap Create slideshow video to enable the music, and keep this page open.")), 1500); }),
    ]);
    if (!isRunning()) throw new Error("Tap Create slideshow video to enable the music, and keep this page open.");
  } finally {
    clearTimeout(timer);
  }
}

function drawCover(ctx: CanvasRenderingContext2D, img: ImageBitmap, alpha: number, zoom: number, x = 0, y = 0, w = W, h = H) {
  const scale = Math.max(w / img.width, h / img.height) * zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

export function christmasTitleMotion(t: number) {
  const progress = Math.max(0, Math.min(t / 0.45, 1));
  const scale = progress === 1 ? 1 : 1 + 2.70158 * Math.pow(progress - 1, 3) + 1.70158 * Math.pow(progress - 1, 2);
  return { scale, opacity: t <= 4 ? 1 : Math.max(0, 1 - (t - 4) / 2) };
}

export function makeGrain(): HTMLCanvasElement {
  const g = document.createElement("canvas");
  g.width = 256; g.height = 256;
  const gctx = g.getContext("2d");
  if (gctx) {
    const data = gctx.createImageData(256, 256);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = Math.random() * 255;
      data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
      data.data[i + 3] = 10;
    }
    gctx.putImageData(data, 0, 0);
  }
  return g;
}

export async function loadFilmPhoto(photo: Blob): Promise<ImageBitmap> {
  const original = await createImageBitmap(photo);
  try {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, H / Math.max(original.width, original.height));
    canvas.width = Math.round(original.width * scale);
    canvas.height = Math.round(original.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Photo rendering is unavailable.");
    ctx.filter = "sepia(0.12) saturate(1.08) contrast(1.02) brightness(1.02)";
    ctx.drawImage(original, 0, 0, canvas.width, canvas.height);
    return await createImageBitmap(canvas);
  } finally { original.close(); }
}

// The same five-photo filmstrip is drawn in playback and the downloaded video.
export function drawFilmFrame(ctx: CanvasRenderingContext2D, bitmaps: ImageBitmap[], t: number, grain: HTMLCanvasElement) {
  if (!bitmaps.length) return;
  const tokens = getComputedStyle(document.documentElement);
  const color = (name: string) => tokens.getPropertyValue(`--film-${name}`).trim();
  ctx.save();
  ctx.filter = "none";
  ctx.fillStyle = color("background");
  ctx.fillRect(0, 0, W, H);

  // Portrait frames travel sideways on a continuous horizontal film reel.
  const photos = bitmaps.slice(0, 5);
  const { photoWidth: photoW, photoHeight: photoH, photoY, startX, pitch, offsetX } = filmstripLayout(t, photos.length);
  const stripTop = photoY - 48;
  const stripHeight = photoH + 96;
  ctx.fillStyle = color("stock");
  ctx.fillRect(0, stripTop, W, stripHeight);
  ctx.strokeStyle = color("edge");
  ctx.lineWidth = 1;
  ctx.strokeRect(-1, stripTop, W + 2, stripHeight);

  for (let slot = -1; slot <= photos.length + 1; slot += 1) {
    const index = (slot + photos.length) % photos.length;
    const photo = photos[index];
    if (!photo) continue;
    const photoX = startX + slot * pitch + offsetX;
    if (photoX + photoW < 0 || photoX > W) continue;
    const zoom = 1 + 0.025 * (0.5 + 0.5 * Math.sin(t * 0.4 + index));
    drawCover(ctx, photo, 1, zoom, photoX, photoY, photoW, photoH);
    ctx.strokeStyle = color("edge");
    ctx.strokeRect(photoX, photoY, photoW, photoH);
  }

  // Sprocket holes move with the upper and lower edges of the reel.
  for (let x = (offsetX % 48) - 48; x < W + 48; x += 48) {
    for (const y of [stripTop + 12, stripTop + stripHeight - 35]) {
      ctx.fillStyle = color("perforation");
      ctx.beginPath();
      ctx.roundRect(x, y, 29, 23, 3);
      ctx.fill();
      ctx.strokeStyle = color("edge");
      ctx.stroke();
    }
  }

  // Restrained vintage treatment: fine grain, edge vignette and soft light leaks.
  ctx.fillStyle = color("tint");
  ctx.fillRect(0, stripTop, W, stripHeight);
  const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, H * 0.75);
  vignette.addColorStop(0, color("clear"));
  vignette.addColorStop(1, color("vignette"));
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
  const leak = ctx.createLinearGradient(0, 0, 170, H);
  leak.addColorStop(0, color("leak"));
  leak.addColorStop(0.45, color("clear"));
  leak.addColorStop(1, color("clear"));
  ctx.globalAlpha = 0.45 + 0.12 * Math.sin(t * 0.7);
  ctx.fillStyle = leak;
  ctx.fillRect(0, stripTop, W, stripHeight);
  ctx.globalAlpha = 0.5;
  ctx.translate(-Math.random() * 128, -Math.random() * 128);
  ctx.fillStyle = ctx.createPattern(grain, "repeat") ?? color("clear");
  ctx.fillRect(0, 0, W + 128, H + 128);
  ctx.restore();
}

export async function recordSlideshow(photos: Blob[], music: Blob | null, onProgress: (p: number) => void, preparedAudio?: AudioContext, signal?: AbortSignal): Promise<{ blob: Blob; ext: string }> {
  const type = pickVideoType();
  if (!type) throw new Error("This browser can't create a playable video. Please open the page in Safari or Chrome.");
  if (!photos.length) throw new Error("Your photos are not ready yet.");
  let bitmaps: ImageBitmap[] = [];
  let audioCtx: AudioContext | null = preparedAudio ?? null;
  let source: AudioBufferSourceNode | null = null;
  let stream: MediaStream | null = null;
  let rec: MediaRecorder | null = null;
  let frame = 0;
  try {
    signal?.throwIfAborted();
    if (music) {
      audioCtx ??= new AudioContext();
      await wakeSlideshowAudio(audioCtx);
    }
    await Promise.all(["46px 'Great Vibes'", "900 62px Outfit"].map(f => document.fonts?.load(f).catch(() => {})));
    for (const photo of photos) bitmaps.push(await loadFilmPhoto(photo));
    signal?.throwIfAborted();
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx || !canvas.captureStream) throw new Error("Video recording is unavailable here. Please open this page in Safari or Chrome.");
    stream = canvas.captureStream(30);
    // Ensure the encoder is given a real bitrate so videos are full quality, not tiny files.
    const total = SLIDESHOW_DURATION_SECONDS;
    if (music && audioCtx) {
      const buf = await audioCtx.decodeAudioData(await music.arrayBuffer());
      const dest = audioCtx.createMediaStreamDestination();
      const gain = audioCtx.createGain();
      source = audioCtx.createBufferSource();
      source.buffer = buf;
      source.loop = true;
      source.connect(gain).connect(dest);
      gain.gain.setValueAtTime(1, audioCtx.currentTime);
      gain.gain.setValueAtTime(1, audioCtx.currentTime + total - 2);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + total);
      dest.stream.getAudioTracks().forEach(t => stream?.addTrack(t));
    }
    rec = createSlideshowRecorder(stream);
    const chunks: Blob[] = [];
    let recordedMs = total * 1000;
    const recorder = rec;
    const grain = makeGrain();
    const draw = (t: number) => drawFilmFrame(ctx, bitmaps, t, grain);
    await new Promise<void>((resolve, reject) => {
      let stopped = false;
      let timer = 0;
      const cleanup = () => {
        stopped = true;
        cancelAnimationFrame(frame);
        clearTimeout(timer);
        document.removeEventListener("visibilitychange", visibility);
        signal?.removeEventListener("abort", abort);
      };
      const fail = (error: Error) => {
        cleanup();
        reject(error);
        if (recorder.state !== "inactive") recorder.stop();
      };
      const abort = () => fail(new DOMException("Slideshow cancelled", "AbortError"));
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => { cleanup(); resolve(); };
      recorder.onerror = () => fail(new Error("Video recording failed. Please try again in Safari or Chrome."));
      const visibility = () => {
        if (!document.hidden) return;
        fail(new Error("Recording was interrupted. Keep this page open and tap Create slideshow video again."));
      };
      document.addEventListener("visibilitychange", visibility);
      signal?.addEventListener("abort", abort, { once: true });
      const animate = () => {
        if (stopped) return;
        source?.start();
        const start = performance.now();
        // A timer (not animation frames) keeps 30fps even in embedded/background views,
        // so the file always has a full 15 seconds of frames.
        const track = stream?.getVideoTracks()[0] as (MediaStreamTrack & { requestFrame?: () => void }) | undefined;
        const tick = () => {
          if (stopped) return;
          const t = (performance.now() - start) / 1000;
          if (t >= total) { draw(total); track?.requestFrame?.(); recordedMs = total * 1000; recorder.stop(); return; }
          draw(t);
          track?.requestFrame?.();
          onProgress(t / total);
          timer = window.setTimeout(tick, 1000 / 30);
        };
        tick();
      };
      try {
        signal?.throwIfAborted();
        draw(0);
        recorder.start(250);
        animate();
      } catch (error) {
        fail(error instanceof Error ? error : new Error("Could not start video recording."));
        return;
      }
    });
    const mime = recorder.mimeType || type.mime;
    let blob = new Blob(chunks, { type: mime.split(";")[0] ?? type.mime });
    if (blob.size < 1024) throw new Error("The video recording was empty. Please try again.");
    if (mime.startsWith("video/webm")) {
      const { default: fixWebmDuration } = await import("fix-webm-duration");
      blob = await fixWebmDuration(blob, recordedMs, { logger: false });
    }
    onProgress(1);
    return { blob, ext: mime.startsWith("video/mp4") ? "mp4" : "webm" };
  } finally {
    cancelAnimationFrame(frame);
    if (rec && rec.state !== "inactive") rec.stop();
    try { source?.stop(); } catch { /* A source can fail before it has started. */ }
    stream?.getTracks().forEach(t => t.stop());
    if (audioCtx && audioCtx.state !== "closed") await audioCtx.close().catch(() => {});
    bitmaps.forEach(b => b.close());
  }
}
