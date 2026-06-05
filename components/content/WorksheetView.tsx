"use client";

import { useState, useEffect } from "react";
import { WorksheetData, TopicWorksheet, Question, DifficultyLevel, ContentAccessLevel } from "@/lib/types";
import { matchAnswer } from "@/lib/answer-matcher";
import ContentBlur from "./ContentBlur";

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
  const [selected, setSelected] = useState<number | null>(null);
  const [fillAnswer, setFillAnswer] = useState("");
  const [checked, setChecked] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const isMcq = question.type === "mcq" && question.options;
  const isFill = question.type === "fill";

  // For MCQ: check if selected option text matches the answer
  const isCorrectMcq = isMcq && selected !== null && question.options
    ? question.options[selected].trim().toLowerCase() === question.answer.trim().toLowerCase()
    : false;

  // For Fill: use the layered matcher (exact → context-stripped → alternatives
  // → fuzzy). The matcher accepts "Obtuse angle" when the canonical answer
  // is "obtuse" and the question says "_____ angle", catches single-character
  // typos, and respects optional acceptedAlternatives from content authors.
  const fillMatch = isFill && checked
    ? matchAnswer(fillAnswer, question.answer, {
        questionContext: question.question,
        alternatives: question.acceptedAlternatives,
      })
    : null;
  const isCorrectFill = fillMatch?.isCorrect ?? false;

  const handleMcqSelect = (optionIndex: number) => {
    if (selected !== null) return; // already answered
    setSelected(optionIndex);
  };

  const handleFillCheck = () => {
    if (!fillAnswer.trim()) return;
    setChecked(true);
  };

  const handleRetry = () => {
    setSelected(null);
    setFillAnswer("");
    setChecked(false);
    setShowAnswer(false);
  };

  // Determine if the question has been answered (MCQ selected or fill checked)
  const isAnswered = (isMcq && selected !== null) || (isFill && checked);
  const isCorrect = isMcq ? isCorrectMcq : isFill ? isCorrectFill : false;

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

      {/* MCQ Options — clickable */}
      {isMcq && question.options && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-6 mb-4">
          {question.options.map((option, i) => {
            let optionStyle = "border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer";

            if (selected !== null) {
              const isThisCorrect = option.trim().toLowerCase() === question.answer.trim().toLowerCase();
              if (i === selected) {
                optionStyle = isThisCorrect
                  ? "border-green-400 bg-green-50 ring-2 ring-green-200"
                  : "border-red-400 bg-red-50 ring-2 ring-red-200";
              } else if (isThisCorrect) {
                // Highlight the correct answer when wrong one was selected
                optionStyle = "border-green-400 bg-green-50";
              } else {
                optionStyle = "border-gray-200 opacity-50";
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleMcqSelect(i)}
                disabled={selected !== null}
                className={`border rounded-lg px-4 py-2.5 text-sm text-left transition-all ${optionStyle} ${
                  selected !== null ? "cursor-default" : ""
                }`}
              >
                <span className="font-semibold text-gray-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                <span className="text-gray-700">{option}</span>
                {selected !== null && i === selected && (
                  <span className="ml-2">
                    {isCorrectMcq ? (
                      <svg className="w-4 h-4 inline text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 inline text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Fill in the blank — text input + check button */}
      {isFill && (
        <div className="ml-6 mb-4">
          <div className="flex items-center gap-2 max-w-md">
            <input
              type="text"
              value={fillAnswer}
              onChange={(e) => setFillAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleFillCheck(); }}
              disabled={checked}
              placeholder="Type your answer..."
              className={`flex-1 px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                checked
                  ? isCorrectFill
                    ? "border-green-400 bg-green-50 text-green-800"
                    : "border-red-400 bg-red-50 text-red-800"
                  : "border-gray-200"
              }`}
            />
            {!checked ? (
              <button
                onClick={handleFillCheck}
                disabled={!fillAnswer.trim()}
                className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Check
              </button>
            ) : (
              <span className="shrink-0">
                {isCorrectFill ? (
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </span>
            )}
          </div>
          {checked && !isCorrectFill && (
            <p className="text-sm text-red-600 mt-2 ml-1">
              Correct answer: <span className="font-medium">{question.answer}</span>
            </p>
          )}
        </div>
      )}

      {/* Short/Long answer — static, just show answer toggle */}
      {question.type !== "mcq" && question.type !== "fill" && (
        <div className="ml-6 mb-2">
          <p className="text-xs text-gray-400 italic">Think about your answer, then check below.</p>
        </div>
      )}

      {/* Feedback + Show Answer / Retry */}
      <div className="ml-6 flex items-center gap-3 flex-wrap">
        {isAnswered && (
          <span className={`text-sm font-semibold ${isCorrect ? "text-green-600" : "text-red-500"}`}>
            {isCorrect ? "Correct!" : "Incorrect"}
          </span>
        )}

        {isAnswered && !isCorrect && !showAnswer && (
          <button
            onClick={() => setShowAnswer(true)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Show Explanation ▼
          </button>
        )}

        {isAnswered && (
          <button
            onClick={handleRetry}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Try Again
          </button>
        )}

        {!isAnswered && (
          <button
            onClick={() => setShowAnswer(!showAnswer)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showAnswer ? "Hide Answer ▲" : "Show Answer ▼"}
          </button>
        )}

        {(showAnswer || (isAnswered && isCorrect)) && (
          <div className="w-full mt-3 space-y-2">
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

function TopicSection({ topic, hideDifficulty }: { topic: TopicWorksheet; hideDifficulty?: boolean }) {
  const [activeDifficulty, setActiveDifficulty] = useState<DifficultyLevel>("easy");
  const allQuestions = [...topic.easy, ...topic.medium, ...topic.hard];
  const questions = hideDifficulty ? allQuestions : topic[activeDifficulty];
  const totalQuestions = allQuestions.length;

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden mb-6">
      {/* Topic Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{topic.topic}</h3>
        <span className="text-xs text-gray-400">{totalQuestions} questions</span>
      </div>

      <div className="p-6">
        {/* Difficulty Tabs — hidden for Class 1-5 */}
        {!hideDifficulty && (
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
        )}

        {/* Questions */}
        {questions.length > 0 ? (
          <div className="flex flex-col gap-4">
            {questions.map((question, index) => (
              <QuestionCard key={question.id} question={question} index={index} />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No questions for this topic yet.</p>
        )}
      </div>
    </div>
  );
}

export default function WorksheetView({
  worksheet,
  accessLevel = 'subscribed',
  currentPath = '/',
  initialTopicIndex = null,
  classId,
}: {
  worksheet: WorksheetData | null;
  accessLevel?: ContentAccessLevel;
  currentPath?: string;
  initialTopicIndex?: number | null;
  classId?: string;
}) {
  // Hide difficulty tabs for Class 1-5
  const classNum = classId ? parseInt(classId.replace('class-', ''), 10) : 0;
  const hideDifficulty = classNum >= 1 && classNum <= 5;
  const [activeTopicIndex, setActiveTopicIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialTopicIndex !== null && initialTopicIndex !== undefined) {
      setActiveTopicIndex(initialTopicIndex);
    }
  }, [initialTopicIndex]);

  if (!worksheet) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-gray-400">
        Worksheet coming soon...
      </div>
    );
  }

  const topics = worksheet.topics;
  const displayedTopics = activeTopicIndex === null ? topics : [topics[activeTopicIndex]];

  // For anonymous/expired users viewing all topics: show first topic, blur the rest
  const hasAccess = accessLevel === 'trial' || accessLevel === 'subscribed' || accessLevel === 'admin';
  const shouldBlurRest = !hasAccess && activeTopicIndex === null && displayedTopics.length > 1;
  const visibleTopics = shouldBlurRest ? displayedTopics.slice(0, 1) : displayedTopics;
  const blurredTopics = shouldBlurRest ? displayedTopics.slice(1) : [];

  return (
    <div>
      {/* Topic Filter */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 px-1">Choose TOPICS</p>
        <div className="flex flex-col gap-1 bg-gray-50 rounded-xl p-3">
          <button
            onClick={() => setActiveTopicIndex(null)}
            className={`text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTopicIndex === null
                ? "bg-gray-800 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All {topics.length} Topics
          </button>
          {topics.map((topic, index) => (
            <button
              key={index}
              onClick={() => setActiveTopicIndex(index)}
              className={`text-left px-4 py-2.5 rounded-lg text-sm transition-all flex items-baseline gap-2 ${
                activeTopicIndex === index
                  ? "bg-gray-800 text-white font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className={`text-xs font-bold min-w-[1.25rem] ${activeTopicIndex === index ? "text-gray-400" : "text-gray-300"}`}>{index + 1}.</span>
              {topic.topic}
            </button>
          ))}
        </div>
      </div>

      {/* Visible Topics */}
      {visibleTopics.map((topic, index) => (
        <TopicSection key={index} topic={topic} hideDifficulty={hideDifficulty} />
      ))}

      {/* Blurred Topics (anonymous only) */}
      {blurredTopics.length > 0 && (
        <ContentBlur accessLevel={accessLevel} currentPath={currentPath} maxHeight="300px">
          {blurredTopics.map((topic, index) => (
            <TopicSection key={visibleTopics.length + index} topic={topic} hideDifficulty={hideDifficulty} />
          ))}
        </ContentBlur>
      )}
    </div>
  );
}
