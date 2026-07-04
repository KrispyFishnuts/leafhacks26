/**
 * TextSizeControl.jsx
 * ------------------------------------------------------------------
 * A 4-step "larger text" control (18px – 33px).
 *
 * USAGE
 *   const [sizeIdx, setSizeIdx] = useState(0);
 *   <TextSizeControl value={sizeIdx} onChange={setSizeIdx} />
 *
 *   // apply it:
 *   <p style={{ fontSize: `${FONT_SIZES[sizeIdx].px}px` }}>...</p>
 * ------------------------------------------------------------------
 */

import React from "react";
import { Type, Minus, Plus } from "lucide-react";
import { INK, TEAL, LINE } from "./tokens";

export const FONT_SIZES = [
  { id: "md", px: 18 },
  { id: "lg", px: 22 },
  { id: "xl", px: 27 },
  { id: "xxl", px: 33 },
];

export default function TextSizeControl({ value = 0, onChange = () => {} }) {
  const dec = () => onChange(Math.max(0, value - 1));
  const inc = () => onChange(Math.min(FONT_SIZES.length - 1, value + 1));

  return (
    <div>
      <h3
        className="flex items-center gap-2 text-sm font-semibold mb-3"
        style={{ color: INK }}
      >
        <Type size={16} style={{ color: TEAL }} /> Text size
      </h3>
      <div className="flex items-center gap-2">
        <button
          onClick={dec}
          aria-label="Decrease text size"
          className="p-1.5 rounded-lg border"
          style={{ borderColor: LINE }}
        >
          <Minus size={14} />
        </button>
        <div className="flex-1 flex gap-1">
          {FONT_SIZES.map((f, i) => (
            <div
              key={f.id}
              className="flex-1 h-2 rounded-full"
              style={{ backgroundColor: i <= value ? TEAL : LINE }}
            />
          ))}
        </div>
        <button
          onClick={inc}
          aria-label="Increase text size"
          className="p-1.5 rounded-lg border"
          style={{ borderColor: LINE }}
        >
          <Plus size={14} />
        </button>
      </div>
      <p className="text-xs mt-1.5 opacity-60">{FONT_SIZES[value].px}px</p>
    </div>
  );
}
