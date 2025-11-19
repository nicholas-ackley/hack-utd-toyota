import React from "react";
// import Navbar from "../navbar/Navbar";
import "../styles/Finance.css";
import { CheckCircle, Clock, Shield, TrendingDown } from "lucide-react";

const Finance: React.FC = () => {
  return (
    <>

      {/* HERO SECTION */}
      <section className="finance-hero">
        <h1>
          Smart <span>Financing</span>
        </h1>
        <p>
          Make your dream Toyota a reality with flexible financing options
          tailored to your lifestyle.
        </p>
        <button className="cta-btn">Get Pre-Qualified</button>
      </section>

      {/* BENEFITS SECTION */}
      <section className="finance-benefits">
        <div className="benefits-container">
          <div className="benefit-card">
            <TrendingDown className="benefit-icon" />
            <h3>Low APR Rates</h3>
            <p>
              Competitive rates starting as low as 2.9% APR for qualified buyers.
            </p>
          </div>
          <div className="benefit-card">
            <Clock className="benefit-icon" />
            <h3>Flexible Terms</h3>
            <p>
              Choose from 24 to 84 month financing options to fit your budget.
            </p>
          </div>
          <div className="benefit-card">
            <Shield className="benefit-icon" />
            <h3>Pre-Qualification</h3>
            <p>
              Get pre-qualified in minutes without affecting your credit score.
            </p>
          </div>
        </div>
      </section>

      {/* CALCULATOR SECTION */}
      <section className="finance-calculator">
        <div className="calc-left">
          <h2>Calculate Your Payment</h2>

          <div className="calc-slider">
            <label>Vehicle Price</label>
            <input type="range" min="10000" max="60000" />
            <p>$35,000</p>
          </div>

          <div className="calc-slider">
            <label>Down Payment</label>
            <input type="range" min="0" max="20000" />
            <p>$5,000</p>
          </div>

          <div className="calc-slider">
            <label>Loan Term (Months)</label>
            <input type="range" min="12" max="84" />
            <p>60 months</p>
          </div>

          <div className="calc-slider">
            <label>Interest Rate (%)</label>
            <input type="range" min="0" max="10" />
            <p>4.5%</p>
          </div>
        </div>

        <div className="calc-right">
          <h3>Estimated Monthly Payment</h3>
          <p className="calc-payment">$522/mo</p>
          <p className="calc-note">For 60 months at 4.5% APR</p>

          <div className="loan-breakdown">
            <h4>Loan Breakdown</h4>
            <div className="loan-item">
              <span>Loan Amount</span>
              <span>$28,000</span>
            </div>
            <div className="loan-item">
              <span>Total Interest</span>
              <span>$3,320</span>
            </div>
            <div className="loan-item total">
              <span>Total Payment</span>
              <span>$31,320</span>
            </div>
          </div>
        </div>
      </section>

      {/* CURRENT OFFERS */}
      <section className="finance-offers">
        <h2>Current Offers</h2>
        <p>Take advantage of our limited-time financing specials</p>

        <div className="offers-container">
          <div className="offer-card white">
            <div className="offer-header">
              <h3>0% APR Financing</h3>
              <span className="tag">Limited Time</span>
            </div>
            <p>Available on select 2024 models</p>
            <ul>
              <li>
                <CheckCircle className="check-icon" /> Up to 60 months financing
              </li>
              <li>
                <CheckCircle className="check-icon" /> No down payment required
              </li>
              <li>
                <CheckCircle className="check-icon" /> For qualified buyers
              </li>
            </ul>
          </div>

          <div className="offer-card red">
            <h3>Lease Specials</h3>
            <p>Drive more, pay less</p>
            <ul>
              <li>
                <CheckCircle className="check-icon" /> Low monthly payments
              </li>
              <li>
                <CheckCircle className="check-icon" /> Flexible mileage options
              </li>
              <li>
                <CheckCircle className="check-icon" /> Upgrade every few years
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
};

export default Finance;
