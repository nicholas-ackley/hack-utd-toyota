import React from "react";
import Navbar from "../navbar/Navbar";
import "../styles/Compare.css";

const Compare: React.FC = () => {
  return (
    <>
      <Navbar />

      <div className="compare-container">
        <h1 className="compare-title" data-aos="fade-up">
          Toyota vs the Competition
        </h1>
        <p className="compare-subtitle" data-aos="fade-up" data-aos-delay="100">
          See how Toyota stacks up against other leading brands.
        </p>

        <div className="compare-table" data-aos="fade-up" data-aos-delay="200">
          <div className="compare-header">
            <div className="compare-cell">Category</div>
            <div className="compare-cell highlight">Toyota</div>
            <div className="compare-cell">Honda</div>
            <div className="compare-cell">Nissan</div>
          </div>

          <div className="compare-row">
            <div className="compare-cell">Reliability</div>
            <div className="compare-cell highlight">★★★★★</div>
            <div className="compare-cell">★★★★☆</div>
            <div className="compare-cell">★★★☆☆</div>
          </div>

          <div className="compare-row">
            <div className="compare-cell">Safety Ratings</div>
            <div className="compare-cell highlight">Top Safety Pick+</div>
            <div className="compare-cell">Top Safety Pick</div>
            <div className="compare-cell">Good</div>
          </div>

          <div className="compare-row">
            <div className="compare-cell">Hybrid Options</div>
            <div className="compare-cell highlight">15+</div>
            <div className="compare-cell">6</div>
            <div className="compare-cell">4</div>
          </div>

          <div className="compare-row">
            <div className="compare-cell">Resale Value</div>
            <div className="compare-cell highlight">Highest</div>
            <div className="compare-cell">High</div>
            <div className="compare-cell">Moderate</div>
          </div>

          <div className="compare-row">
            <div className="compare-cell">Warranty</div>
            <div className="compare-cell highlight">10 Years / 150k mi</div>
            <div className="compare-cell">8 Years / 120k mi</div>
            <div className="compare-cell">6 Years / 100k mi</div>
          </div>
        </div>

        <p className="compare-note" data-aos="fade-up" data-aos-delay="300">
          Data based on manufacturer specifications and independent studies (2025).
        </p>
      </div>
    </>
  );
};

export default Compare;
