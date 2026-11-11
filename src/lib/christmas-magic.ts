// Jingle Bells' public-domain melody, synthesized locally with Web Audio.
const MELODY: [number, number][] = [
  [76, 1], [76, 1], [76, 2], [76, 1], [76, 1], [76, 2], [76, 1], [79, 1], [72, 1.5], [74, 0.5], [76, 4],
  [77, 1], [77, 1], [77, 1.5], [77, 0.5], [77, 1], [76, 1], [76, 1], [76, 0.5], [76, 0.5], [76, 1], [74, 1], [74, 1], [76, 1], [74, 2], [79, 2],
  [76, 1], [76, 1], [76, 2], [76, 1], [76, 1], [76, 2], [76, 1], [79, 1], [72, 1.5], [74, 0.5], [76, 4],
  [77, 1], [77, 1], [77, 1], [77, 1], [77, 1], [76, 1], [76, 1], [76, 0.5], [76, 0.5], [79, 1], [79, 1], [77, 1], [74, 1], [72, 4],
];

const GREETINGS = [
  "Ho ho ho! Maligayang Pasko!",
  "Ho ho ho! Merry Christmas!",
  "Maligayang Pasko, mga kaibigan!",
] as const;

export class ChristmasSound {
  private context: AudioContext | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private generation = 0;
  private greetingIndex = 0;

  async start() {
    this.stop();
    const generation = this.generation;
    const context = new AudioContext();
    this.context = context;
    await context.resume();
    if (this.generation !== generation || context.state !== "running") {
      this.stop();
      return false;
    }
    const phrase = () => {
      if (this.generation !== generation || context.state !== "running") return;
      let time = context.currentTime + 0.04;
      for (const [note, beats] of MELODY) {
        const duration = beats * 0.21;
        for (const harmonic of [1, 2.76]) {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = "sine";
          oscillator.frequency.value = 440 * Math.pow(2, (note - 69) / 12) * harmonic;
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(harmonic === 1 ? 0.045 : 0.012, time + 0.006);
          gain.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(duration, 0.3));
          oscillator.connect(gain).connect(context.destination);
          oscillator.start(time);
          oscillator.stop(time + Math.max(duration, 0.3) + 0.05);
        }
        time += duration;
      }
      this.timer = setTimeout(phrase, (time - context.currentTime) * 1000);
    };
    phrase();
    return true;
  }

  // Santa calls out as the sleigh passes, using the device's own voice.
  greet() {
    if (typeof speechSynthesis === "undefined" || document.hidden) return;
    const text = GREETINGS[this.greetingIndex % GREETINGS.length] ?? GREETINGS[0];
    this.greetingIndex += 1;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fil-PH";
    utterance.rate = 0.9;
    utterance.pitch = 0.6;
    utterance.volume = 0.9;
    speechSynthesis.speak(utterance);
  }

  stop() {
    this.generation++;
    clearTimeout(this.timer);
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
    if (this.context && this.context.state !== "closed") void this.context.close().catch(() => {});
    this.context = null;
  }
}
