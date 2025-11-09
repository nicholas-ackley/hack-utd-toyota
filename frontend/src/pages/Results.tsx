import React from "react";
import { useLocation, Link } from "react-router-dom";
import Navbar from "../navbar/Navbar";
import "../styles/Results.css";

const Results: React.FC = () => {
  const location = useLocation();
  const result = location.state?.result;
  const car = result?.car;

  // 🧱 If nothing was passed, show fallback
  if (!car) {
    return (
      <>
        <Navbar />
        <div className="results-container">
          <h2>No match data found 😕</h2>
          <p>Try retaking the survey to get your car match.</p>
          <Link to="/matched" className="retry-btn">Go Back</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="results-container">
        <div className="results-card" data-aos="fade-up">
          <h1>Your Best Match</h1>
          <img src={car.image} alt={car.name} className="car-image" />
          <h2>{car.name}</h2>
          <h4>{car.year}</h4>
          <p>{car.description}</p>

          <div className="result-actions">
            <Link to="/models" className="explore-btn">Explore Models</Link>
            <Link to="/finance" className="finance-btn">Finance Options</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Results;
