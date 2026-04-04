"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface DiscussionAudioProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
}

function collectBlocks(root: HTMLElement): { el: HTMLElement; text: string }[] {
  const blocks: { el: HTMLElement; text: string }[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      const el = node as HTMLElement;
      const tag = el.tagName;
      if (el.offsetParent === null && tag !== "BODY") return NodeFilter.FILTER_SKIP;
      if (["SCRIPT", "STYLE", "BUTTON", "SVG", "NAV"].includes(tag)) return NodeFilter.FILTER_REJECT;
      if (
        ["P", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "TD", "TH", "BLOCKQUOTE", "FIGCAPTION"].includes(tag)
      ) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  });

  let node: Node | null;
  while ((node = walker.nextNode())) {
    const el = node as HTMLElement;
    const text = (el.innerText || el.textContent || "").trim();
    if (text.length > 0) {
      blocks.push({ el, text });
    }
  }
  return blocks;
}

function splitIntoChunks(text: string, maxLen = 200): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?।])\s+/);
  let current = "";
  for (const sentence of sentences) {
    if (current.length + sentence.length > maxLen && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += (current ? " " : "") + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter((c) => c.length > 0);
}

const HIGHLIGHT_CLASS = "tts-highlight";
const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5] as const;

export default function DiscussionAudio({ contentRef }: DiscussionAudioProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supported, setSupported] = useState(true);
  const [speed, setSpeed] = useState<number>(1);
  const [progress, setProgress] = useState(0);
  const [totalBlocks, setTotalBlocks] = useState(0);

  const blocksRef = useRef<{ el: HTMLElement; text: string }[]>([]);
  const blockIndexRef = useRef(0);
  const chunkIndexRef = useRef(0);
  const stoppedRef = useRef(false);
  const speedRef = useRef(1);
  const prevHighlightRef = useRef<HTMLElement | null>(null);
  const isActiveRef = useRef(false);
  // Flag to suppress onerror/onend reset when cancelling for speed change
  const speedChangingRef = useRef(false);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false);
    }

    if (typeof document !== "undefined" && !document.getElementById("tts-highlight-style")) {
      const style = document.createElement("style");
      style.id = "tts-highlight-style";
      style.textContent = `.${HIGHLIGHT_CLASS} { background-color: #fef08a; border-radius: 4px; transition: background-color 0.3s ease; }`;
      document.head.appendChild(style);
    }

    return () => {
      stoppedRef.current = true;
      isActiveRef.current = false;
      window.speechSynthesis?.cancel();
      clearHighlight();
    };
  }, []);

  // Keyboard shortcut: spacebar to pause/resume
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActiveRef.current) return;
      if (e.code !== "Space") return;
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (target.isContentEditable) return;

      e.preventDefault();
      if (isPlaying) {
        window.speechSynthesis.pause();
        setIsPaused(true);
        setIsPlaying(false);
      } else if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
        setIsPlaying(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isPaused]);

  const clearHighlight = useCallback(() => {
    if (prevHighlightRef.current) {
      prevHighlightRef.current.classList.remove(HIGHLIGHT_CLASS);
      prevHighlightRef.current = null;
    }
  }, []);

  const highlightBlock = useCallback((el: HTMLElement) => {
    clearHighlight();
    el.classList.add(HIGHLIGHT_CLASS);
    prevHighlightRef.current = el;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [clearHighlight]);

  const speakBlock = useCallback((blockIdx: number) => {
    const synth = window.speechSynthesis;
    const blocks = blocksRef.current;

    if (stoppedRef.current || blockIdx >= blocks.length) {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(blocks.length);
      clearHighlight();
      isActiveRef.current = false;
      return;
    }

    const block = blocks[blockIdx];
    highlightBlock(block.el);
    blockIndexRef.current = blockIdx;
    setProgress(blockIdx + 1);

    const chunks = splitIntoChunks(block.text);

    const speakChunk = (ci: number) => {
      if (stoppedRef.current || ci >= chunks.length) {
        blockIndexRef.current = blockIdx + 1;
        chunkIndexRef.current = 0;
        if (!stoppedRef.current) {
          speakBlock(blockIdx + 1);
        }
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[ci]);
      utterance.lang = "en-IN";
      utterance.rate = speedRef.current;
      utterance.pitch = 1;

      const voices = synth.getVoices();
      const enVoice =
        voices.find((v) => v.lang.startsWith("en-IN")) ||
        voices.find((v) => v.lang.startsWith("en"));
      if (enVoice) utterance.voice = enVoice;

      utterance.onend = () => {
        // Ignore if this was triggered by a speed change cancel
        if (speedChangingRef.current) return;
        chunkIndexRef.current = ci + 1;
        if (!stoppedRef.current) {
          speakChunk(ci + 1);
        }
      };
      utterance.onerror = (ev) => {
        // Ignore "interrupted" errors from speed change cancellation
        if (speedChangingRef.current) return;
        if (ev.error === "interrupted" || ev.error === "canceled") return;
        setIsPlaying(false);
        setIsPaused(false);
        clearHighlight();
        isActiveRef.current = false;
      };

      synth.speak(utterance);
    };

    speakChunk(0);
  }, [highlightBlock, clearHighlight]);

  const handlePlay = useCallback(() => {
    if (!contentRef.current) return;
    const synth = window.speechSynthesis;

    if (isPaused) {
      synth.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    synth.cancel();
    stoppedRef.current = false;
    isActiveRef.current = true;

    const blocks = collectBlocks(contentRef.current);
    if (blocks.length === 0) return;

    blocksRef.current = blocks;
    blockIndexRef.current = 0;
    chunkIndexRef.current = 0;
    setTotalBlocks(blocks.length);
    setProgress(0);

    setIsPlaying(true);
    setIsPaused(false);
    speakBlock(0);
  }, [contentRef, isPaused, speakBlock]);

  const handlePause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  }, []);

  const handleStop = useCallback(() => {
    stoppedRef.current = true;
    isActiveRef.current = false;
    window.speechSynthesis.cancel();
    blocksRef.current = [];
    blockIndexRef.current = 0;
    chunkIndexRef.current = 0;
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
    setTotalBlocks(0);
    clearHighlight();
  }, [clearHighlight]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    speedRef.current = newSpeed;

    // If currently playing, cancel and restart current block at new speed
    if (isActiveRef.current && !stoppedRef.current) {
      speedChangingRef.current = true;
      window.speechSynthesis.cancel();

      // Let the cancel settle, then restart
      setTimeout(() => {
        speedChangingRef.current = false;
        if (!stoppedRef.current && isActiveRef.current) {
          speakBlock(blockIndexRef.current);
        }
      }, 100);
    }
  }, [speakBlock]);

  if (!supported) return null;

  const progressPercent = totalBlocks > 0 ? Math.round((progress / totalBlocks) * 100) : 0;
  const showControls = isPlaying || isPaused;

  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Play / Pause button */}
        {!isPlaying ? (
          <button
            onClick={handlePlay}
            className="inline-flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors border border-purple-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            {isPaused ? "Resume" : "Listen"}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors border border-purple-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
            Pause
          </button>
        )}

        {/* Stop button */}
        {showControls && (
          <button
            onClick={handleStop}
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 font-medium px-3 py-2 rounded-lg text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
            Stop
          </button>
        )}

        {/* Speed dropdown */}
        {showControls && (
          <select
            value={speed}
            onChange={(e) => handleSpeedChange(Number(e.target.value))}
            className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1.5 rounded-md border border-purple-200 transition-colors cursor-pointer outline-none"
            title="Playback speed"
          >
            {SPEED_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}x
              </option>
            ))}
          </select>
        )}

        {/* Playing indicator */}
        {isPlaying && (
          <span className="text-xs text-purple-500 animate-pulse">Playing...</span>
        )}
        {isPaused && (
          <span className="text-xs text-gray-400">Paused — press Space to resume</span>
        )}
      </div>

      {/* Progress bar */}
      {showControls && totalBlocks > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 tabular-nums min-w-[2.5rem] text-right">
            {progressPercent}%
          </span>
        </div>
      )}
    </div>
  );
}
