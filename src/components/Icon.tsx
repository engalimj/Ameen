// Simple line icons (24px grid, 1.8 stroke) in the brand's calm style.
const PATHS = {
  home: "M3 11 12 4l9 7M5 10v10h14V10",
  jobs: "M8 4h8M9 2h6v4H9zM6 4H5a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-1M8 12l2.5 2.5L16 9",
  plus: "M12 5v14M5 12h14",
  wallet: "M3 7a2 2 0 0 1 2-2h13v4M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2zM16 14.5h.01",
  calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21a7 7 0 0 1 14 0M16 3.5a4 4 0 0 1 0 7.5M18 14a6 6 0 0 1 4 7",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l2 2H4zM10 21h4",
  report: "M5 20V10M12 20V4M19 20v-7",
  out: "M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10",
  back: "M15 5l-7 7 7 7",
  camera: "M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  check: "M5 12.5 10 17 19 7",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  star: "M12 3.5 14.6 9l6 .6-4.5 4 1.3 5.9L12 16.6 6.6 19.5 7.9 13.6 3.4 9.6l6-.6z",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  alert: "M12 4 2.5 20h19zM12 10v4M12 17h.01",
  lead: "M4 5h16v11H8l-4 4zM8 9h8M8 12h5",
  send: "M4 12 20 4l-6 16-3-7z",
  wrench: "M15 4a5 5 0 0 0-6 6l-6 6 3 3 6-6a5 5 0 0 0 6-6l-3 3-2.5-.5L12 7z",
  part: "M12 2 21 7v10l-9 5-9-5V7zM12 22V12M21 7l-9 5-9-5",
  sparkle: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6",
  sliders: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4",
  bandage: "M8.5 15.5l7-7M4.6 12.6l7.9-7.9a3 3 0 0 1 4.2 0l2.6 2.6a3 3 0 0 1 0 4.2l-7.9 7.9a3 3 0 0 1-4.2 0l-2.6-2.6a3 3 0 0 1 0-4.2zM10 10h.01M14 14h.01",
  person: "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  repeat: "M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3",
  lock: "M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4",
  door: "M6 3h10v18H6zM16 5h2v16M13 12h.01",
  toolbox: "M3 9h18v11H3zM8 9V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v3M3 14h18",
  helpers: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20a6 6 0 0 1 12 0M10 20a6 6 0 0 1 12 0",
  x: "M6 6l12 12M18 6 6 18",
  minus: "M5 12h14",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, className = "" }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${name === "back" ? "flip-rtl " : ""}${className}`}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
