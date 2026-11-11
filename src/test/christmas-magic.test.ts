import { afterEach, expect, it, vi } from "vitest";
import { ChristmasSound } from "@/lib/christmas-magic";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

it("keeps Santa greetings silent until audio starts and after mute", async () => {
  vi.useFakeTimers();
  const speak = vi.fn();
  vi.stubGlobal("speechSynthesis", { speak, cancel: vi.fn(), getVoices: () => [] });
  vi.stubGlobal("SpeechSynthesisUtterance", class { constructor(public text: string) {} });
  const param = { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
  vi.stubGlobal("AudioContext", class {
    state = "running";
    currentTime = 0;
    destination = {};
    async resume() {}
    async close() { this.state = "closed"; }
    createOscillator() { return { frequency: { value: 0 }, connect: (gain: unknown) => gain, start: vi.fn(), stop: vi.fn() }; }
    createGain() { return { gain: param, connect: vi.fn() }; }
  });
  const sound = new ChristmasSound();
  sound.greet();
  expect(speak).toHaveBeenCalledTimes(0);
  expect(await sound.start()).toBe(true);
  sound.greet();
  expect(speak).toHaveBeenCalledTimes(1);
  sound.stop();
  sound.greet();
  expect(speak).toHaveBeenCalledTimes(1);
});