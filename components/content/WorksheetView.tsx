"use client";

import { useState } from "react";
import { WorksheetData, Question, DifficultyLevel } from "@/lib/types";

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  easy: "text-green-700 bg-green-50 border-green-200",
  medium: "text-yellow-700 bg-yellow-50 border-yellow-200",
  hard: "text-red-700 bg-red-50 border-red-200",
};

function QuestionCard({ question, index }: { question: Question; index: number }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      {/* Question */}
      <div className="flex gap-3 mb-4">
        <span className="font-bold text-gray-400 min-w-[1.5rem]">{index + 1}.</span>
        <div className="flex-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-2">
            {question.type === "mcq" ? "MCQ" : question.type === "fill" ? "Fill in the blank" : "Short answer"}
          </span>
          <p className="text-gray-800 font-medium mt-1">{question.question}</p>
        </div>
      </div>

      {/* MCQ Options */}
      {question.type === "mcq" && question.options && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-6 mb-4">
          {question.options.map((option, i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700"
            >
              <span className="font-semibold text-gray-400 mr-2">
                {String.fromCharCode(65 + i)}.
              </span>
              {option}
            </div>
          ))}
        </div>
      )}

      {/* Answer Toggle */}
      <div className="ml-6">
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          {showAnswer ? "Hide Answer ▲" : "Show Answer ▼"}
        </button>

        {showAnswer && (
          <div className="mt-3 space-y-2">
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <span className="text-xs font-semibold text-green-600 uppercase tracking-wide">Answer: </span>
              <span className="text-green-800 font-medium">{question.answer}</span>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Why: </span>
              <span className="text-blue-800 text-sm">{question.explanation}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorksheetView({ worksheet }: { worksheet: WorksheetData | null }) {
  const [activeDifficulty, setActiveDifficulty] = useState<DifficultyLevel>("easy");

  if (!worksheet) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-gray-400">
        Worksheet coming soon...
      </div>
    );
  }

  const questions = worksheet[activeDifficulty];

  return (
    <div>
      {/* Difficulty Tabs */}
      <div className="flex gap-3 mb-6">
        {(["easy", "medium", "hard"] as DifficultyLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => setActiveDifficulty(level)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              activeDifficulty === level
                ? DIFFICULTY_COLORS[level]
                : "text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            {DIFFICULTY_LABELS[level]}
            <span className="ml-1.5 text-xs opacity-70">({worksheet[level].length})</span>
          </button>
        ))}
      </div>

      {/* Questions */}
      <div className="flex flex-col gap-4">
        {questions.map((question, index) => (
          <QuestionCard key={question.id} question={question} index={index} />
        ))}
      </div>
    </div>
  );
}
