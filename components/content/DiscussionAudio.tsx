"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface DiscussionAudioProps {
  contentRef: React.RefObject<HTMLDivElement | null>;
}

// Split text into chunks small enough for Chrome's SpeechSynthesis
// (Chrome silently fails on long text ~300+ chars)
function splitIntoChunks(text: string, maxLen = 200): string[] {
  const chunks: string[] = [];
  // Split by sentences first
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

export default function DiscussionAudio({ contentRef }: DiscussionAudioProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [supported, setSupported] = useState(true);
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false);
    }
    return () => {
      stoppedRef.current = true;
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speakChunk = useCallback((index: number) => {
    const synth = window.speechSynthesis;
    const chunks = chunksRef.current;

    if (stoppedRef.current || index >= chunks.length) {
      setIsPlaying(false);
      setIsPaused(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    // Try to pick an English voice
    const voices = synth.getVoices();
    const enVoice = voices.find((v) => v.lang.startsWith("en-IN"))
      || voices.find((v) => v.lang.startsWith("en"));
    if (enVoice) utterance.voice = enVoice;

    utterance.onend = () => {
      chunkIndexRef.current = index + 1;
      if (!stoppedRef.current) {
        speakChunk(index + 1);
      }
    };
    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    synth.speak(utterance);
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
    stoppedRef.current = false;

    const text = contentRef.current.innerText;
    if (!text.trim()) return;

    chunksRef.current = splitIntoChunks(text);
    chunkIndexRef.current = 0;

    setIsPlaying(true);
    setIsPaused(false);
    speakChunk(0);
  }, [contentRef, isPaused, speakChunk]);

  const handlePause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  }, []);

  const handleStop = useCallback(() => {
    stoppedRef.current = true;
    window.speechSynthesis.cancel();
    chunksRef.current = [];
    chunkIndexRef.current = 0;
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
