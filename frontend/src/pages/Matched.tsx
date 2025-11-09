import React, { useState } from "react";
import Navbar from "../navbar/Navbar";
import "../styles/Matched.css";

interface Question {
  id: number;
  text: string;
  options: string[];
}

const Matched: React.FC = () => {
  const questions: Question[] = [
    {
      id: 1,
      text: "What type of driving do you enjoy most?",
      options: ["City Cruising", "Off-Road Adventure", "Highway Comfort", "Performance Speed"],
    },
    {
      id: 2,
      text: "What’s your ideal vehicle size?",
      options: ["Compact", "Midsize", "SUV", "Truck"],
    },
    {
      id: 3,
      text: "What’s most important to you in a car?",
      options: ["Fuel Efficiency", "Technology", "Luxury", "Power"],
    },
    {
      id: 4,
      text: "Which look do you prefer?",
      options: ["Sporty", "Classic", "Modern", "Rugged"],
    },
  ];

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});

  const handleSelect = (option: string) => {
    setAnswers({ ...answers, [current]: option });

    // Move to next question or end
    if (current < questions.length - 1) {
      setTimeout(() => setCurrent(current + 1), 300);
    } else {
      alert("✅ Answers submitted!");
    }
  };

  const q = questions[current];

  return (
    <>
      <Navbar/>

      <div className="matched-container">
        <div className="quiz-card">
          <h2 className="question-number">Question {current + 1} of {questions.length}</h2>
          <h1 className="question-text">{q.text}</h1>

          <div className="options-grid">
            {q.options.map((opt) => (
              <button
                key={opt}
                className={`option-btn ${answers[current] === opt ? "selected" : ""}`}
                onClick={() => handleSelect(opt)}
              >
                {opt}
              </button>
            ))}
          </div>

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
