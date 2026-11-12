import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TestPhotoSlideshow } from "@/components/test-photo-slideshow";
import SlideshowMusic from "@/assets/kampana-ng-simbahan-27-44s.mp3.asset.json";

const captured = vi.hoisted(() => ({ props: [] as { images: string[]; musicUrl: string }[] }));
vi.mock("@/components/order/Slideshow", () => ({ Slideshow: (props: { images: string[]; musicUrl: string }) => { captured.props.push(props); return null; } }));
afterEach(() => { cleanup(); captured.props = []; });
const photo = "data:image/png;base64,aGVsbG8=";

describe("Public test slideshow results", () => {
  it("accepts one available result without requiring five successes", () => {
    render(<TestPhotoSlideshow images={[null, null, photo, null, null]} />);
    expect(captured.props[0]?.images).toEqual([photo]);
    expect(captured.props[0]?.musicUrl).toBe(SlideshowMusic.url);
  });
  it("passes all five successful results to the music video player", () => {
    render(<TestPhotoSlideshow images={Array(5).fill(photo)} />);
    expect(captured.props[0]?.images).toHaveLength(5);
  });
  it("does not impose a quota on repeated test result sets", () => {
    const view = render(<TestPhotoSlideshow images={[]} />);
    for (let attempt = 0; attempt < 20; attempt += 1) view.rerender(<TestPhotoSlideshow images={[photo]} />);
    expect(captured.props).toHaveLength(20);
    expect(captured.props[19]?.images).toEqual([photo]);
  });
});