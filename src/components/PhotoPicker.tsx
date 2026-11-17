"use client";
import { useState } from "react";
import { Icon } from "./Icon";

/** A big camera button that opens the phone camera and shows small previews of what was taken. */
export function PhotoPicker({ name, label, existing, addMore }: { name: string; label: string; existing: number; addMore: string }) {
  const [previews, setPreviews] = useState<string[]>([]);
  const count = existing + previews.length;
  return (
    <div>
      <label className={`flex min-h-20 cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 text-lg font-semibold ${count ? "border-sage-deep bg-sage-tint text-sage-deep" : "border-line bg-white"}`}>
        <input
          type="file"
          name={name}
          accept="image/*"
          capture="environment"
          multiple
          className="sr-only"
          onChange={(e) => setPreviews(Array.from(e.target.files ?? []).map((f) => URL.createObjectURL(f)))}
        />
        <Icon name="camera" size={30} />
        <span>{count ? `${label} (${count}) · ${addMore}` : label}</span>
        {count > 0 && <Icon name="check" size={22} />}
      </label>
      {previews.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {previews.map((src) => (
            <img key={src} src={src} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}
