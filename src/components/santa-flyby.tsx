import { useEffect, useRef, useState } from "react";
import Santa from "@/assets/santa-flyby.png.asset.json";

const flakes = Array.from({ length: 18 }, (_, i) => ({ left: (i * 53) % 100, size: 6 + ((i * 7) % 10), duration: 9 + ((i * 3) % 9), delay: -((i * 1.7) % 12) }));

// Santa's sleigh flies across the screen every so often, with gentle snowfall.
export function SantaFlyby() {
  const flight = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

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
        el.dataset["direction"] = reverse ? "left" : "right";
        const t = (x: number, y: number) => `translate(${x}vw, ${y}svh) rotate(${(toY - fromY) * (reverse ? -0.3 : 0.3)}deg)`;
        animation = el.animate([
          { transform: t(reverse ? 115 : -40, fromY), opacity: 0 },
          { opacity: 1, offset: 0.12 },
          { opacity: 1, offset: 0.85 },
          { transform: t(reverse ? -40 : 115, toY), opacity: 0 },
        ], { duration: 4200 + Math.random() * 1200, easing: "ease-in-out" });
      }
      timer = setTimeout(pass, 10000 + Math.random() * 12000);
    };
    timer = setTimeout(pass, 2500);
    return () => { clearTimeout(timer); animation?.cancel(); };
  }, [show]);

  if (!show) return null;
  return (
    <div className="santa-layer" aria-hidden="true">
      {flakes.map((f, i) => <span key={i} className="santa-snow" style={{ left: `${f.left}%`, fontSize: f.size, animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s` }}>❄</span>)}
      <div ref={flight} className="santa-flyby" data-direction="right">
        <img src={Santa.url} width={1152} height={576} alt="" />
        <div className="santa-trail">{Array.from({ length: 16 }, (_, i) => <span key={i} style={{ left: `${i * 6}%`, top: `${(i * 37) % 80}%`, animationDelay: `${-i * 0.09}s` }}>✦</span>)}</div>
      </div>
    </div>
  );
}
