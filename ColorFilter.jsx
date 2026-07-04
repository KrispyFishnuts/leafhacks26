/**
 * ColorFilter.jsx
 * ------------------------------------------------------------------
 * Lets a student pick a reading colour scheme. Presets swap the actual
 * background/text colours (not a CSS filter) so contrast stays legible —
 * filters like grayscale/invert distort the contrast they're meant to fix.
 *
 * USAGE
 *   const [filterId, setFilterId] = useState("none");
 *   <ColorFilter value={filterId} onChange={setFilterId} />
 *
 *   // apply it to whatever you're rendering:
 *   const filter = COLOR_FILTERS.find(f => f.id === filterId);
 *   <div style={{ backgroundColor: filter.bg, color: filter.fg }}>...</div>
 * ------------------------------------------------------------------
 */

import React from "react";
import { Palette, Check } from "lucide-react";
import { INK, TEAL, LINE } from "./tokens";

export const COLOR_FILTERS = [
  { id: "none", label: "None", bg: "#FFFFFF", fg: INK, swatch: "#FFFFFF" },
  { id: "cream", label: "Cream", bg: "#FBF3DE", fg: "#2A2417", swatch: "#FBF3DE" },
  { id: "blue", label: "Blue tint", bg: "#E7F0F6", fg: "#14232E", swatch: "#E7F0F6" },
  { id: "green", label: "Green tint", bg: "#E9F3E7", fg: "#17261A", swatch: "#E9F3E7" },
  { id: "yellow", label: "Yellow overlay", bg: "#FFF6C9", fg: "#241F05", swatch: "#FFF6C9" },
  { id: "dark", label: "Dark mode", bg: "#14181C", fg: "#EDEFF1", swatch: "#14181C" },
  { id: "contrast", label: "High contrast", bg: "#000000", fg: "#FFFF00", swatch: "#000000" },
];

export default function ColorFilter({ value = "none", onChange = () => {} }) {
  const active = COLOR_FILTERS.find((f) => f.id === value) || COLOR_FILTERS[0];

  return (
    <div>
      <h3
        className="flex items-center gap-2 text-sm font-semibold mb-3"
        style={{ color: INK }}
      >
        <Palette size={16} style={{ color: TEAL }} /> Colour filter
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {COLOR_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            title={f.label}
            aria-label={f.label}
            aria-pressed={value === f.id}
            className="aspect-square rounded-lg border-2 flex items-center justify-center"
            style={{
              backgroundColor: f.swatch,
              borderColor: value === f.id ? TEAL : LINE,
            }}
          >
            {value === f.id && (
              <Check
                size={14}
                color={f.id === "dark" || f.id === "contrast" ? "#fff" : INK}
              />
            )}
          </button>
        ))}
      </div>
      <p className="text-xs mt-1.5 opacity-60">{active.label}</p>
    </div>
  );
}
