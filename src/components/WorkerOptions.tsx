import { Icon, type IconName } from "./Icon";

// Large tap targets with a picture and one or two words, for workers who
// prefer not to read or type much.

export const OUTCOME_ICONS: Record<string, IconName> = {
  FIXED: "check",
  REPLACED_PART: "part",
  CLEANED: "sparkle",
  ADJUSTED: "wrench",
  TEMP_FIX: "bandage",
  NEEDS_PART: "part",
  NEEDS_SPECIALIST: "helpers",
  NEEDS_REVISIT: "repeat",
};

export const PROBLEM_ICONS: Record<string, IconName> = {
  NO_ACCESS: "lock",
  TENANT_ABSENT: "door",
  NEED_PART: "part",
  NEED_HELP: "helpers",
  MISSING_TOOLS: "toolbox",
  UNSAFE: "alert",
};

const WARN = new Set(["NEEDS_PART", "NEEDS_SPECIALIST", "NEEDS_REVISIT", "UNSAFE"]);

export function OptionTiles({
  name,
  options,
  icons,
  labels,
  type,
  selected = [],
  required,
}: {
  name: string;
  options: readonly string[];
  icons: Record<string, IconName>;
  labels: Record<string, string>;
  type: "checkbox" | "radio";
  selected?: string[];
  required?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {options.map((o) => (
        <label
          key={o}
          className="relative flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-line bg-white p-3 text-center text-[15px] font-semibold leading-tight transition-colors has-[:checked]:border-sage-deep has-[:checked]:bg-sage-tint has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-sage-deep"
        >
          <input type={type} name={name} value={o} defaultChecked={selected.includes(o)} required={required && type === "radio"} className="peer sr-only" />
          <span className={`flex size-11 items-center justify-center rounded-full ${WARN.has(o) ? "bg-wait-bg text-wait-ink" : "bg-sage-tint text-sage-deep"} peer-checked:bg-sage-deep peer-checked:text-white`}>
            <Icon name={icons[o]} size={26} />
          </span>
          {labels[o]}
          <span aria-hidden="true" className="absolute end-2 top-2 hidden size-6 items-center justify-center rounded-full bg-sage-deep text-white peer-checked:flex">
            <Icon name="check" size={16} />
          </span>
        </label>
      ))}
    </div>
  );
}

/** Checklist answer as three picture buttons: OK, needs fix, not applicable. */
export function CheckAnswer({ name, value, labels }: { name: string; value: string | null; labels: { OK: string; FAIL: string; NA: string } }) {
  const opts = [
    { v: "OK", icon: "check" as const, on: "has-[:checked]:border-done-ink has-[:checked]:bg-done-bg has-[:checked]:text-done-ink" },
    { v: "FAIL", icon: "x" as const, on: "has-[:checked]:border-urgent-ink has-[:checked]:bg-urgent-bg has-[:checked]:text-urgent-ink" },
    { v: "NA", icon: "minus" as const, on: "has-[:checked]:border-muted has-[:checked]:bg-ivory" },
  ];
  return (
    <div className="mt-2 grid grid-cols-3 gap-2">
      {opts.map((o) => (
        <label key={o.v} className={`flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-line bg-white text-sm font-semibold ${o.on}`}>
          <input type="radio" name={name} value={o.v} defaultChecked={value === o.v} className="sr-only" />
          <Icon name={o.icon} size={26} />
          {labels[o.v as "OK"]}
        </label>
      ))}
    </div>
  );
}
