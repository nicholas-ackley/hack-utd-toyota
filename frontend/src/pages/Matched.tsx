import React, { useState } from "react";
import Navbar from "../navbar/Navbar";
import "../styles/Matched.css";

interface Question {
  id: number;
  key: string;
  text: string;
  min: number;
  max: number;
  step: number;
  labels: string[];
  unit?: string; // optional (e.g., "$", "s")
}

const Matched: React.FC = () => {
  const questions: Question[] = [
    {
      id: 1,
      key: "maxPrice",
      text: "What’s your ideal car budget range?",
      min: 20000,
      max: 60000,
      step: 500,
      labels: ["$20k", "$40k", "$60k+"],
      unit: "$",
    },
    {
      id: 2,
      key: "speedPreference",
      text: "How important is quick acceleration (0–60 mph)?",
      min: 6.0,
      max: 10.0,
      step: 0.1,
      labels: ["6s", "8s", "10s+"],
      unit: "s",
    },
    {
      id: 3,
      key: "sizePreference",
      text: "What car size fits you best?",
      min: 1,
      max: 3,
      step: 1,
      labels: ["Compact", "Midsize", "Large"],
    },
    {
      id: 4,
      key: "householdSize",
      text: "Is your household larger than 2 people?",
      min: 0,
      max: 1,
      step: 1,
      labels: ["No", "Yes"],
    },
    {
      id: 5,
      key: "commuteDistance",
      text: "Do you usually commute more than 5 miles daily?",
      min: 0,
      max: 1,
      step: 1,
      labels: ["No", "Yes"],
    },
    {
      id: 6,
      key: "fuelType",
      text: "What’s your preferred fuel type?",
      min: 0,
      max: 1,
      step: 1,
      labels: ["Gasoline", "Electric"],
    },
    {
      id: 7,
      key: "bodyType",
      text: "What vehicle style matches your lifestyle?",
      min: 0,
      max: 3,
      step: 1,
      labels: ["Sedan", "Wagon", "Truck", "Van"],
    },
  ];

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number }>({});
  const q = questions[current];
  const currentValue = answers[q.key] ?? q.min;

  const handleSlide = (value: number) => {
    setAnswers({ ...answers, [q.key]: value });
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      console.log("✅ Final structured answers:", answers);
      alert("Thanks! Your preferences have been recorded.");
    }
  };

  return (
    <>

      <div className="matched-container">
        <div className="quiz-card">
          <h2 className="question-number">
            Question {current + 1} of {questions.length}
          </h2>
          <h1 className="question-text">{q.text}</h1>

          {/* Slider */}
          <div className="slider-container">
            <div className="slider-value">
              {q.unit === "$"
                ? `${q.unit}${currentValue.toLocaleString()}`
                : q.unit
                ? `${currentValue}${q.unit}`
                : currentValue}
            </div>

            <input
              type="range"
              min={q.min}
              max={q.max}
              step={q.step}
              value={currentValue}
              onChange={(e) => handleSlide(Number(e.target.value))}
              className="slider"
            />

            <div className="slider-labels">
              {q.labels.map((label, i) => (
                <span key={i} className="slider-label">
                  {label}
                </span>
              ))}
            </div>
          </div>

          <button className="next-btn" onClick={handleNext}>
            {current === questions.length - 1 ? "Finish" : "Next"}
          </button>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((current + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Matched;
