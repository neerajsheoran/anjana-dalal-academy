"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface DiscussionAudioProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export default function DiscussionAudio({ contentRef }: DiscussionAudioProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supported, setSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false);
    }
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

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

    const text = contentRef.current.innerText;
    if (!text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  }, [contentRef, isPaused]);

  const handlePause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  }, []);

  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  if (!supported) return null;

  return (
    <div className="flex items-center gap-2 mb-4">
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
      {(isPlaying || isPaused) && (
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
      {isPlaying && (
        <span className="text-xs text-purple-500 animate-pulse">Playing...</span>
      )}
    </div>
  );
}
