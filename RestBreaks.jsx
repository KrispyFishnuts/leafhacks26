/**
 * RestBreaks.jsx
 * ------------------------------------------------------------------
 * Schedules recurring rest breaks during a practice session. Runs its
 * own clock — pass `active={false}` to pause the schedule (e.g. while
 * your own session timer is paused), and use `onBreakChange` if a
 * parent timer needs to pause too.
 *
 * USAGE
 *   <RestBreaks
 *     active={sessionRunning}
 *     onBreakChange={(onBreak) => setSessionPaused(onBreak)}
 *   />
 * ------------------------------------------------------------------
 */

import React, { useState, useEffect } from "react";
import { Coffee, Check, Plus } from "lucide-react";
import { INK, SAGE, LINE } from "./tokens";

const BREAK_INTERVALS = [5, 10, 15, 20]; // minutes
const BREAK_LENGTH_SECONDS = 120;

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function RestBreaks({ active = true, onBreakChange = () => {} }) {
  const [breakInterval, setBreakInterval] = useState(15); // minutes
  const [sinceBreak, setSinceBreak] = useState(0); // seconds since last break
  const [onBreak, setOnBreak] = useState(false);
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(BREAK_LENGTH_SECONDS);

  useEffect(() => {
    onBreakChange(onBreak);
  }, [onBreak, onBreakChange]);

  // scheduling clock
  useEffect(() => {
    if (!active || onBreak) return;
    const id = setInterval(() => {
      setSinceBreak((s) => {
        const next = s + 1;
        if (next >= breakInterval * 60) {
          setOnBreak(true);
          setBreakSecondsLeft(BREAK_LENGTH_SECONDS);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [active, onBreak, breakInterval]);

  // break countdown
  useEffect(() => {
    if (!onBreak) return;
    const id = setInterval(() => {
      setBreakSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          setOnBreak(false);
          return BREAK_LENGTH_SECONDS;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onBreak]);

  const takeBreakNow = () => {
    setOnBreak(true);
    setBreakSecondsLeft(BREAK_LENGTH_SECONDS);
    setSinceBreak(0);
  };
  const endBreakNow = () => {
    setOnBreak(false);
    setSinceBreak(0);
  };

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold mb-3" style={{ color: INK }}>
        <Coffee size={16} style={{ color: SAGE }} /> Rest breaks
      </h3>
      <div className="flex flex-wrap gap-2">
        {BREAK_INTERVALS.map((m) => (
          <button
            key={m}
            onClick={() => setBreakInterval(m)}
            className="px-2.5 py-1 rounded-lg text-xs border"
            style={{
              borderColor: LINE,
              backgroundColor: breakInterval === m ? SAGE : "transparent",
              color: breakInterval === m ? "#fff" : INK,
            }}
          >
            every {m}m
          </button>
        ))}
        <button
          onClick={takeBreakNow}
          className="px-2.5 py-1 rounded-lg text-xs border font-medium"
          style={{ borderColor: LINE, color: INK }}
        >
          Take a break now
        </button>
      </div>
      <p className="text-xs mt-1.5 opacity-60">
        Next break in {formatClock(breakInterval * 60 - sinceBreak)}
      </p>

      {onBreak && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(20,24,28,0.92)" }}
        >
          <div className="max-w-sm w-full rounded-2xl p-8 text-center" style={{ backgroundColor: "#FFFFFF" }}>
            <Coffee size={32} style={{ color: SAGE, margin: "0 auto 12px" }} />
            <h2 className="text-xl font-semibold mb-2" style={{ color: INK }}>
              Time for a rest break
            </h2>
            <p className="text-sm mb-5 opacity-70" style={{ color: INK }}>
              Step away from the screen for a moment.
            </p>
            <div className="text-3xl mb-6 tabular-nums" style={{ color: SAGE }}>
              {formatClock(breakSecondsLeft)}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={endBreakNow}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: SAGE, color: "#fff" }}
              >
                <Check size={16} /> I'm ready, continue
              </button>
              <button
                onClick={() => setBreakSecondsLeft((s) => s + 300)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border"
                style={{ borderColor: LINE, color: INK }}
              >
                <Plus size={16} /> 5 more min
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
