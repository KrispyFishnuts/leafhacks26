/**
 * TextToSpeech.jsx
 * ------------------------------------------------------------------
 * Reads a passage aloud sentence-by-sentence using the browser's
 * Web Speech API, highlighting the sentence currently being spoken.
 * Fully self-contained — just pass it the text.
 *
 * USAGE
 *   <TextToSpeech text="Some passage the student is reading..." />
 * ------------------------------------------------------------------
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Square, Volume2 } from "lucide-react";
import { TEAL, TEAL_DARK, LINE, AMBER, INK } from "./tokens";

function splitSentences(text) {
  const matches = text.match(/[^.!?]+[.!?]*/g);
  return matches ? matches.map((s) => s.trim()).filter(Boolean) : [text];
}

export default function TextToSpeech({ text = "", textColor = INK }) {
  const sentences = splitSentences(text);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [activeSentence, setActiveSentence] = useState(-1);
  const [rate, setRate] = useState(1);
  const queueRef = useRef({ idx: 0, cancelled: false });
  const supportsTTS = typeof window !== "undefined" && "speechSynthesis" in window;

  const speakFrom = useCallback(
    (startIdx) => {
      if (!supportsTTS) return;
      window.speechSynthesis.cancel();
      queueRef.current = { idx: startIdx, cancelled: false };

      const speakNext = () => {
        const q = queueRef.current;
        if (q.cancelled || q.idx >= sentences.length) {
          setSpeaking(false);
          setPaused(false);
          setActiveSentence(-1);
          return;
        }
        setActiveSentence(q.idx);
        const utter = new SpeechSynthesisUtterance(sentences[q.idx]);
        utter.rate = rate;
        utter.onend = () => {
          if (queueRef.current.cancelled) return;
          queueRef.current.idx += 1;
          speakNext();
        };
        window.speechSynthesis.speak(utter);
      };

      setSpeaking(true);
      setPaused(false);
      speakNext();
    },
    [sentences, rate, supportsTTS]
  );

  const handlePlay = () => {
    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      setSpeaking(true);
    } else {
      speakFrom(0);
    }
  };
  const handlePause = () => {
    window.speechSynthesis.pause();
    setPaused(true);
    setSpeaking(false);
  };
  const handleStop = () => {
    queueRef.current.cancelled = true;
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setActiveSentence(-1);
  };

  useEffect(() => {
    return () => {
      queueRef.current.cancelled = true;
      if (supportsTTS) window.speechSynthesis.cancel();
    };
  }, [supportsTTS]);

  return (
    <div>
      <p className="leading-relaxed" style={{ color: textColor }}>
        {sentences.map((s, i) => (
          <span
            key={i}
            className="transition-colors rounded"
            style={i === activeSentence ? { backgroundColor: AMBER, color: "#241505" } : {}}
          >
            {s + " "}
          </span>
        ))}
      </p>

      <div className="flex items-center gap-2 mt-4 flex-wrap">
        {!speaking && !paused && (
          <button
            onClick={handlePlay}
            disabled={!supportsTTS}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-40"
            style={{ backgroundColor: TEAL, color: "#fff" }}
          >
            <Volume2 size={16} /> Read aloud
          </button>
        )}
        {speaking && (
          <button
            onClick={handlePause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: TEAL_DARK, color: "#fff" }}
          >
            <Pause size={16} /> Pause
          </button>
        )}
        {paused && (
          <button
            onClick={handlePlay}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ backgroundColor: TEAL, color: "#fff" }}
          >
            <Play size={16} /> Resume
          </button>
        )}
        {(speaking || paused) && (
          <button
            onClick={handleStop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border"
            style={{ borderColor: LINE, color: textColor }}
          >
            <Square size={14} /> Stop
          </button>
        )}
        <div className="flex items-center gap-1 ml-2 text-sm" style={{ color: textColor }}>
          <span className="opacity-70">Speed</span>
          {[0.75, 1, 1.25, 1.5].map((r) => (
            <button
              key={r}
              onClick={() => setRate(r)}
              className="px-2 py-1 rounded-md border text-xs"
              style={{
                borderColor: LINE,
                backgroundColor: rate === r ? TEAL : "transparent",
                color: rate === r ? "#fff" : textColor,
              }}
            >
              {r}x
            </button>
          ))}
        </div>
        {!supportsTTS && (
          <span className="text-xs opacity-60" style={{ color: textColor }}>
            Text-to-speech isn't supported in this browser.
          </span>
        )}
      </div>
    </div>
  );
}
