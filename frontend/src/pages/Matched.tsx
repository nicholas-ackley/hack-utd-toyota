import React, { useState } from "react";
import "../styles/Matched.css";
import { getTop3CompatibleCars } from "../firebaseFunctions";
import type { UserPreferences } from "../firebaseFunctions";

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
  const [recommendations, setRecommendations] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  
  // Safety check
  if (!questions || questions.length === 0) {
    return <div>Error: No questions available</div>;
  }
  
  const q = questions[current];
  if (!q) {
    return <div>Error: Invalid question index</div>;
  }
  
  const currentValue = answers[q.key] ?? q.min;

  const handleSlide = (value: number) => {
    const updatedAnswers = { ...answers, [q.key]: value };
    setAnswers(updatedAnswers);
  };

  // Initialize all answers with default values if not already set
  const getAllAnswersWithDefaults = (inputAnswers: { [key: string]: number }): { [key: string]: number } => {
    const allAnswers = { ...inputAnswers };
    questions.forEach(question => {
      // Check if the key exists in the object (handles both undefined and missing keys)
      if (!(question.key in allAnswers)) {
        allAnswers[question.key] = question.min;
      }
    });
    return allAnswers;
  };

  const convertAnswersToPreferences = (answers: { [key: string]: number }): UserPreferences => {
    // Ensure all answers have default values
    const completeAnswers = getAllAnswersWithDefaults(answers);
    
    // Convert numeric answers to correct format
    const bodyTypeMap: { [key: number]: 'regcar' | 'stwagon' | 'truck' | 'van' } = {
      0: 'regcar',
      1: 'stwagon',
      2: 'truck',
      3: 'van'
    };
    
    const fuelTypeMap: { [key: number]: 'gasoline' | 'electric' } = {
      0: 'gasoline',
      1: 'electric'
    };

    return {
      bodyType: bodyTypeMap[completeAnswers.bodyType] || undefined,
      fuelType: fuelTypeMap[completeAnswers.fuelType] || undefined,
      maxPrice: completeAnswers.maxPrice,
      speedPreference: completeAnswers.speedPreference,
      sizePreference: completeAnswers.sizePreference as 1 | 2 | 3,
      householdSize: completeAnswers.householdSize as 0 | 1,
      commuteDistance: completeAnswers.commuteDistance as 0 | 1,
    };
  };

  const handleNext = async () => {
    // Always save the current question's answer (even if it's the default)
    const currentAnswer = answers[q.key] ?? q.min;
    const updatedAnswers = { ...answers, [q.key]: currentAnswer };
    setAnswers(updatedAnswers);
    
    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      // Quiz is complete - fetch recommendations
      setQuizCompleted(true);
      setLoading(true);
      
      try {
        // Convert answers to preferences format (using updated answers)
        const preferences = convertAnswersToPreferences(updatedAnswers);
        console.log("✅ Final preferences:", preferences);
        
        // Get top 3 compatible cars
        const topCars = await getTop3CompatibleCars(preferences);
        
        if (!topCars || topCars.length === 0) {
          alert("No cars found matching your preferences. Please try adjusting your answers.");
          setQuizCompleted(false);
        } else {
          setRecommendations(topCars);
          console.log("✅ Top 3 compatible cars:", topCars);
        }
      } catch (error: any) {
        console.error("Error getting recommendations:", error);
        const errorMessage = error?.message || "Unknown error occurred";
        // Clean up error message for user display
        let userMessage = errorMessage;
        if (errorMessage.includes("composite index") || errorMessage.includes("failed-precondition")) {
          userMessage = "Database query error occurred. Please try again.";
        }
        alert(`Sorry, there was an error finding your perfect match: ${userMessage}. Please try again.`);
        setQuizCompleted(false);
      } finally {
        setLoading(false);
      }
    }
  };

  // Show recommendations screen after quiz is completed
  if (quizCompleted) {
    return (
      <>
        <div className="matched-container">
          <div className="quiz-card" style={{ maxWidth: '900px', width: '100%' }}>
            <h2 className="question-number">Your Perfect Match</h2>
            <h1 className="question-text">Top {recommendations.length} Recommendations</h1>
            
            {loading ? (
              <div className="recommendations-loading">
                <p>Finding your perfect match...</p>
              </div>
            ) : recommendations.length > 0 ? (
              <>
                <div className="recommendations-list">
                  {recommendations.map((car, index) => (
                    <div key={car.id} className="recommendation-card">
                      <div className="recommendation-rank">#{index + 1}</div>
                      {car.imageUrl && (
                        <div 
                          className="recommendation-image"
                          onClick={() => setSelectedImage(car.imageUrl!)}
                        >
                          <img 
                            src={car.imageUrl} 
                            alt={car.name || `${car.model} ${car.trim}`}
                            loading="lazy"
                          />
                          <div className="image-overlay">
                            <span className="zoom-hint">Click to enlarge</span>
                          </div>
                        </div>
                      )}
                      <div className="recommendation-content">
                        <h3>{car.name || `${car.model} ${car.trim}`}</h3>
                        <p className="recommendation-details">
                          {car.year} • {car.type} • {car.fuel}
                        </p>
                        <div className="recommendation-specs">
                          <span>${car.price.toLocaleString()}</span>
                          <span>{car.zeroToSixtySec}s 0-60</span>
                          <span>Size: {car.size}</span>
                        </div>
                        <div className="recommendation-score">
                          Match Score: {car.utilityScore.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  className="next-btn" 
                  onClick={() => {
                    setRecommendations([]);
                    setCurrent(0);
                    setAnswers({});
                    setQuizCompleted(false);
                  }}
                  style={{ marginTop: '2rem' }}
                >
                  Start Over
                </button>
              </>
            ) : (
              <div className="recommendations-loading">
                <p>No matches found. Please try again.</p>
              </div>
            )}
          </div>
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="image-modal" 
            onClick={() => setSelectedImage(null)}
          >
            <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
              <button 
                className="image-modal-close"
                onClick={() => setSelectedImage(null)}
              >
                ×
              </button>
              <img src={selectedImage} alt="Car detail" />
            </div>
          </div>
        )}
      </>
    );
  }

  // Show quiz questions
  return (
    <>
      <div className="matched-container">
        <div className="quiz-section">
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

            <button 
              className="next-btn" 
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? "Finding Your Match..." : current === questions.length - 1 ? "Finish" : "Next"}
            </button>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((current + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal - outside container for proper overlay */}
      {selectedImage && (
        <div 
          className="image-modal" 
          onClick={() => setSelectedImage(null)}
        >
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="image-modal-close"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
            <img src={selectedImage} alt="Car detail" />
          </div>
        </div>
      )}
    </>
  );
};

export default Matched;
