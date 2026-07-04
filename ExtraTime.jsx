/**
 * ExtraTime.jsx
 * ------------------------------------------------------------------
 * A session countdown timer with an "extra time" accommodation
 * (+25% / +50% / +100%), applied to a base session length.
 *
 * USAGE
 *   <ExtraTime sessionMinutes={20} onSessionEnd={() => console.log("done")} />
 * ------------------------------------------------------------------
 */

import React, { useState, useEffect } from "react";
import { Clock, Play, Pause, RefreshCw } from "lucide-react";
import { INK, TEAL, AMBER, LINE } from "./tokens";

const EXTRA_TIME_OPTIONS = [
  { id: "none", label: "Off", mult: 1 },
  { id: "25", label: "+25%", mult: 1.25 },
  { id: "50", label: "+50%", mult: 1.5 },
  { id: "100", label: "+100%", mult: 2 },
];

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function ExtraTime({ sessionMinutes = 20, onSessionEnd = () => {}, paused = false }) {
  const [extraId, setExtraId] = useState("none");
  const extraMult = EXTRA_TIME_OPTIONS.find((e) => e.id === extraId).mult;
  const totalSeconds = Math.round(sessionMinutes * 60 * extraMult);

  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);

  // keep remaining in sync while the session hasn't started yet
  useEffect(() => {
    if (!running) setRemaining(totalSeconds);
  }, [totalSeconds, running]);

  useEffect(() => {
    if (!running || paused) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          setRunning(false);
          onSessionEnd();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, paused, onSessionEnd]);

  const progressPct = Math.min(100, Math.round(((totalSeconds - remaining) / totalSeconds) * 100));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex items-center gap-2" style={{ color: INK }}>
          <Clock size={18} />
          <span className="text-xl tabular-nums">{formatClock(remaining)}</span>
          {extraId !== "none" && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: AMBER, color: "#241505" }}>
              {EXTRA_TIME_OPTIONS.find((e) => e.id === extraId).label} time
            </span>
          )}
        </div>
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{ backgroundColor: TEAL, color: "#fff" }}
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? "Pause session" : "Start session"}
        </button>
      </div>

      <div className="h-1 w-full rounded-full overflow-hidden mb-4" style={{ backgroundColor: LINE }}>
        <div className="h-1 transition-all" style={{ width: `${progressPct}%`, backgroundColor: TEAL }} />
      </div>

      <h3 className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: INK }}>
        <RefreshCw size={16} style={{ color: AMBER }} /> Extra time
      </h3>
      <div className="flex flex-wrap gap-2">
        {EXTRA_TIME_OPTIONS.map((e) => (
          <button
            key={e.id}
            onClick={() => setExtraId(e.id)}
            disabled={running}
            className="px-2.5 py-1 rounded-lg text-xs border disabled:opacity-40"
            style={{
              borderColor: LINE,
              backgroundColor: extraId === e.id ? AMBER : "transparent",
              color: extraId === e.id ? "#241505" : INK,
            }}
          >
            {e.label}
          </button>
        ))}
      </div>
      <p className="text-xs mt-1.5 opacity-60">
        Base session: {sessionMinutes}m → {Math.round(totalSeconds / 60)}m total
      </p>
    </div>
  );
}
