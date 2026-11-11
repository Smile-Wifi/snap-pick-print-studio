import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { ChristmasSound } from "@/lib/christmas-magic";
import Santa from "@/assets/santa-flyby.png.asset.json";
import Poster from "@/assets/pasko-tow-poster.jpg";

const flakes = Array.from({ length: 18 }, (_, i) => ({ left: (i * 53) % 100, size: 6 + ((i * 7) % 10), duration: 9 + ((i * 3) % 9), delay: -((i * 1.7) % 12) }));

// Santa's sleigh flies across the screen every so often, towing a poster,
// with gentle snowfall and an optional jingle-and-greeting sound button.
export function SantaFlyby() {
  const flight = useRef<HTMLDivElement>(null);
  const sound = useRef<ChristmasSound | null>(null);
  const [show, setShow] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setShow(true);
  }, []);

  useEffect(() => {
    if (!show) return;
    let timer: ReturnType<typeof setTimeout>;
    let animation: Animation | undefined;
    const pass = () => {
      const el = flight.current;
      if (el && !document.hidden) {
        const reverse = Math.random() > 0.5;
        const fromY = 10 + Math.random() * 55;
        const toY = 10 + Math.random() * 55;
        const duration = 4200 + Math.random() * 1200;
        el.dataset["direction"] = reverse ? "left" : "right";
        const t = (x: number, y: number) => `translate(${x}vw, ${y}svh) rotate(${(toY - fromY) * (reverse ? -0.3 : 0.3)}deg)`;
        animation = el.animate([
          { transform: t(reverse ? 115 : -40, fromY), opacity: 0 },
          { opacity: 1, offset: 0.12 },
          { opacity: 1, offset: 0.85 },
          { transform: t(reverse ? -40 : 115, toY), opacity: 0 },
        ], { duration, easing: "ease-in-out" });
        if (sound.current) setTimeout(() => sound.current?.greet(), duration * 0.3);
      }
      timer = setTimeout(pass, 10000 + Math.random() * 12000);
    };
    timer = setTimeout(pass, 2500);
    return () => { clearTimeout(timer); animation?.cancel(); };
  }, [show]);

  useEffect(() => {
    const visibility = () => {
      if (document.hidden) { sound.current?.stop(); setEnabled(false); }
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      sound.current?.stop();
    };
  }, []);

  async function toggle() {
    if (enabled) {
      sound.current?.stop();
      setEnabled(false);
      return;
    }
    sound.current ??= new ChristmasSound();
    try {
      const running = await sound.current.start();
      setEnabled(running);
      if (!running) sound.current = null;
    } catch {
      sound.current?.stop();
      sound.current = null;
      setEnabled(false);
    }
  }

  if (!show) return null;
  return (
    <>
      <div className="santa-layer" aria-hidden="true">
        {flakes.map((f, i) => <span key={i} className="santa-snow" style={{ left: `${f.left}%`, fontSize: f.size, animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s` }}>❄</span>)}
        <div ref={flight} className="santa-flyby" data-direction="right">
          <div className="santa-tow">
            <svg className="santa-rope" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true"><path d="M200 20 Q150 34 100 20 T0 20" /></svg>
            <img className="santa-poster" src={Poster} width={1024} height={640} loading="lazy" alt="" />
          </div>
          <img src={Santa.url} width={1152} height={576} alt="" />
          <div className="santa-trail">{Array.from({ length: 16 }, (_, i) => <span key={i} style={{ left: `${i * 6}%`, top: `${(i * 37) % 80}%`, animationDelay: `${-i * 0.09}s` }}>✦</span>)}</div>
        </div>
      </div>
      <button
        type="button"
        className="santa-sound-toggle"
        onClick={() => void toggle()}
        aria-pressed={enabled}
        aria-label={enabled ? "Mute Christmas sounds" : "Play Christmas sounds"}
        title={enabled ? "Mute Christmas sounds" : "Play Christmas sounds"}
      >
        {enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>
    </>
  );
}
