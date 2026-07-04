/**
 * PracticeMode.jsx
 * ------------------------------------------------------------------
 * Optional example showing how to compose the five standalone
 * components (ColorFilter, TextSizeControl, TextToSpeech, RestBreaks,
 * ExtraTime) into one practice-mode panel. Feel free to skip this file
 * and wire the pieces together yourself in whatever layout you need —
 * each one works independently.
 * ------------------------------------------------------------------
 */

import React, { useState } from "react";
import ColorFilter, { COLOR_FILTERS } from "./ColorFilter";
import TextSizeControl, { FONT_SIZES } from "./TextSizeControl";
import TextToSpeech from "./TextToSpeech";
import RestBreaks from "./RestBreaks";
import ExtraTime from "./ExtraTime";
import { LINE } from "./tokens";

const DEFAULT_PASSAGE =
  "The tide pool held a whole small world. A crab paused under a ledge of rock, " +
  "waiting for the water to decide what it wanted to do next. Above the surface, " +
  "gulls argued about nothing in particular.";

export default function PracticeMode({ passage = DEFAULT_PASSAGE, sessionMinutes = 20 }) {
  const [filterId, setFilterId] = useState("none");
  const [sizeIdx, setSizeIdx] = useState(0);
  const [onBreak, setOnBreak] = useState(false);
  const [sessionRunning, setSessionRunning] = useState(true);

  const filter = COLOR_FILTERS.find((f) => f.id === filterId);
  const fontPx = FONT_SIZES[sizeIdx].px;

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl overflow-hidden border" style={{ borderColor: LINE }}>
      <div className="p-5 border-b" style={{ borderColor: LINE }}>
        <ExtraTime
          sessionMinutes={sessionMinutes}
          paused={onBreak}
          onSessionEnd={() => setSessionRunning(false)}
        />
      </div>

      <div className="grid md:grid-cols-[1fr_320px]">
        <div className="p-6" style={{ backgroundColor: filter.bg, fontSize: `${fontPx}px` }}>
          <TextToSpeech text={passage} textColor={filter.fg} />
        </div>

        <div className="p-5 space-y-6 border-t md:border-t-0 md:border-l" style={{ borderColor: LINE }}>
          <ColorFilter value={filterId} onChange={setFilterId} />
          <TextSizeControl value={sizeIdx} onChange={setSizeIdx} />
          <RestBreaks active={sessionRunning} onBreakChange={setOnBreak} />
        </div>
      </div>
    </div>
  );
}
