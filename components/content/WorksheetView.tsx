"use client";

import { useState } from "react";
import { WorksheetData, TopicWorksheet, Question, DifficultyLevel } from "@/lib/types";

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

const DIFFICULTY_COLORS: Record<DifficultyLevel, { tab: string; badge: string }> = {
  easy: {
    tab: "text-green-700 bg-green-50 border-green-300",
    badge: "bg-green-100 text-green-700",
  },
  medium: {
    tab: "text-yellow-700 bg-yellow-50 border-yellow-300",
    badge: "bg-yellow-100 text-yellow-700",
  },
  hard: {
    tab: "text-red-700 bg-red-50 border-red-300",
    badge: "bg-red-100 text-red-700",
  },
};

function QuestionCard({ question, index }: { question: Question; index: number }) {
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex gap-3 mb-4">
        <span className="font-bold text-gray-400 min-w-[1.5rem]">{index + 1}.</span>
        <div className="flex-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-2">
            {question.type === "mcq" ? "MCQ" : question.type === "fill" ? "Fill in the blank" : "Short answer"}
          </span>
          <p className="text-gray-800 font-medium mt-1">{question.question}</p>
        </div>
      </div>

      {question.type === "mcq" && question.options && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-6 mb-4">
          {question.options.map((option, i) => (
            <div key={i} className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700">
              <span className="font-semibold text-gray-400 mr-2">{String.fromCharCode(65 + i)}.</span>
              {option}
            </div>
          ))}
        </div>
      )}

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

function TopicSection({ topic }: { topic: TopicWorksheet }) {
  const [activeDifficulty, setActiveDifficulty] = useState<DifficultyLevel>("easy");
  const questions = topic[activeDifficulty];
  const totalQuestions = topic.easy.length + topic.medium.length + topic.hard.length;

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden mb-6">
      {/* Topic Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{topic.topic}</h3>
        <span className="text-xs text-gray-400">{totalQuestions} questions</span>
      </div>

      <div className="p-6">
        {/* Difficulty Tabs */}
        <div className="flex gap-2 mb-5">
          {(["easy", "medium", "hard"] as DifficultyLevel[]).map((level) => (
            <button
              key={level}
              onClick={() => setActiveDifficulty(level)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                activeDifficulty === level
                  ? DIFFICULTY_COLORS[level].tab
                  : "text-gray-500 border-gray-200 hover:border-gray-300"
              }`}
            >
              {DIFFICULTY_LABELS[level]}
              <span className="ml-1.5 text-xs opacity-70">({topic[level].length})</span>
            </button>
          ))}
        </div>

        {/* Questions */}
        {questions.length > 0 ? (
          <div className="flex flex-col gap-4">
            {questions.map((question, index) => (
              <QuestionCard key={question.id} question={question} index={index} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No {activeDifficulty} questions for this topic yet.</p>
        )}
      </div>
    </div>
  );
}

export default function WorksheetView({ worksheet }: { worksheet: WorksheetData | null }) {
  const [activeTopicIndex, setActiveTopicIndex] = useState<number | null>(null);

  if (!worksheet) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-gray-400">
        Worksheet coming soon...
      </div>
    );
  }

  const topics = worksheet.topics;
  const displayedTopics = activeTopicIndex === null ? topics : [topics[activeTopicIndex]];

  return (
    <div>
      {/* Topic Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveTopicIndex(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
            activeTopicIndex === null
              ? "bg-gray-800 text-white border-gray-800"
              : "text-gray-600 border-gray-200 hover:border-gray-400"
          }`}
        >
          All Topics
          <span className="ml-1.5 text-xs opacity-70">({topics.length})</span>
        </button>
        {topics.map((topic, index) => (
          <button
            key={index}
            onClick={() => setActiveTopicIndex(index)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              activeTopicIndex === index
                ? "bg-gray-800 text-white border-gray-800"
                : "text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {topic.topic}
          </button>
        ))}
      </div>

      {/* Topic Sections */}
      {displayedTopics.map((topic, index) => (
        <TopicSection key={index} topic={topic} />
      ))}
    </div>
  );
}
