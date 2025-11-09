import React, { useState } from "react";
import Navbar from "../navbar/Navbar";
import "../styles/Matched.css";

interface Question {
  id: number;
  key: string;
  text: string;
  type: "slider" | "binary" | "multiple";
  min?: number;
  max?: number;
  step?: number;
  labels: string[];
  unit?: string;
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
      type: "slider",
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
      type: "slider",
    },
    {
      id: 3,
      key: "sizePreference",
      text: "What car size fits you best?",
      labels: ["Compact", "Midsize", "SUV", "Truck"],
      type: "multiple",
    },
    {
      id: 4,
      key: "householdSize",
      text: "Is your household larger than 2 people?",
      labels: ["No", "Yes"],
      type: "binary",
    },
    {
      id: 5,
      key: "commuteDistance",
      text: "Do you usually commute more than 5 miles daily?",
      labels: ["No", "Yes"],
      type: "binary",
    },
    {
      id: 6,
      key: "fuelType",
      text: "What’s your preferred fuel type?",
      labels: ["Gasoline", "Hybrid", "Electric"],
      type: "multiple",
    },
    {
      id: 7,
      key: "bodyType",
      text: "What vehicle style matches your lifestyle?",
      labels: ["Sedan", "Wagon", "Truck", "Van"],
      type: "multiple",
    },
  ];

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: number | string }>({});
  const q = questions[current];
  const currentValue = answers[q.key] ?? q.min ?? 0;

  // ✅ Save answers to backend
  const saveAnswers = async (answers: Record<string, number | string>) => {
    try {
      const response = await fetch("http://localhost:8000/api/save-answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "guest-" + Math.floor(Math.random() * 10000),
          answers,
        }),
      });
      const data = await response.json();
      console.log("✅ Saved to backend:", data);
    } catch (err) {
      console.error("❌ Error saving answers:", err);
    }
  };

  const handleSelect = (value: string | number) => {
    setAnswers({ ...answers, [q.key]: value });
  };

const handleNext = async () => {
  if (current < questions.length - 1) {
    setCurrent(current + 1);
  } else {
    console.log("✅ Final structured answers:", answers);

    try {
      const response = await fetch("http://localhost:8000/api/save-answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "guest-" + Math.floor(Math.random() * 10000),
          answers,
        }),
      });

      const data = await response.json();
      console.log("📤 Backend response:", data);

      alert("✅ Answers saved successfully!");
    } catch (error) {
      console.error("❌ Failed to save answers:", error);
      alert("Something went wrong saving your answers.");
    }
  }
};


  return (
    <>
      <Navbar />
      <div className="matched-container">
        <div className="quiz-card">
          <h2 className="question-number">
            Question {current + 1} of {questions.length}
          </h2>
          <h1 className="question-text">{q.text}</h1>

          {/* --- Slider --- */}
          {q.type === "slider" && (
            <div className="slider-container">
              <div className="slider-value">
                {q.unit === "$"
                  ? `${q.unit}${Number(currentValue).toLocaleString()}`
                  : q.unit
                  ? `${currentValue}${q.unit}`
                  : currentValue}
              </div>

              <input
                type="range"
                min={q.min}
                max={q.max}
                step={q.step}
                value={Number(currentValue)}
                onChange={(e) => handleSelect(Number(e.target.value))}
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
          )}

          {/* --- Multiple & Binary --- */}
          {(q.type === "binary" || q.type === "multiple") && (
            <div className="choice-container">
              {q.labels.map((label) => (
                <button
                  key={label}
                  onClick={() => handleSelect(label)}
                  className={`choice-btn ${
                    answers[q.key] === label ? "selected" : ""
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <button className="next-btn" onClick={handleNext}>
            {current === questions.length - 1 ? "Finish" : "Next Question"}
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
