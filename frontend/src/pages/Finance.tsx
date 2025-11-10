import React, { useState, useEffect } from "react";
import Navbar from "../navbar/Navbar";
import "../styles/Finance.css";
import { CheckCircle, Clock, Shield, TrendingDown } from "lucide-react";

const Finance: React.FC = () => {
  const [price, setPrice] = useState(35000);
  const [down, setDown] = useState(5000);
  const [term, setTerm] = useState(60);
  const [rate, setRate] = useState(4.5);
  const [monthly, setMonthly] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);

  useEffect(() => {
    const principal = price - down;
    const monthlyRate = rate / 100 / 12;
    const payment =
      (principal * monthlyRate) /
      (1 - Math.pow(1 + monthlyRate, -term));
    const totalPay = payment * term;
    const interest = totalPay - principal;

    setMonthly(payment);
    setTotalPayment(totalPay);
    setTotalInterest(interest);
  }, [price, down, term, rate]);

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
            <p>Competitive rates starting as low as 2.9% APR for qualified buyers.</p>
          </div>
          <div className="benefit-card">
            <Clock className="benefit-icon" />
            <h3>Flexible Terms</h3>
            <p>Choose from 24 to 84 month financing options to fit your budget.</p>
          </div>
          <div className="benefit-card">
            <Shield className="benefit-icon" />
            <h3>Pre-Qualification</h3>
            <p>Get pre-qualified in minutes without affecting your credit score.</p>
          </div>
        </div>
      </section>

      {/* CALCULATOR SECTION */}
      <section className="finance-calculator">
        <div className="calc-left">
          <h2>Calculate Your Payment</h2>

          <div className="calc-slider">
            <label>Vehicle Price: ${price.toLocaleString()}</label>
            <input
              type="range"
              min="10000"
              max="60000"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>

          <div className="calc-slider">
            <label>Down Payment: ${down.toLocaleString()}</label>
            <input
              type="range"
              min="0"
              max="20000"
              value={down}
              onChange={(e) => setDown(Number(e.target.value))}
            />
          </div>

          <div className="calc-slider">
            <label>Loan Term: {term} months</label>
            <input
              type="range"
              min="12"
              max="84"
              step="12"
              value={term}
              onChange={(e) => setTerm(Number(e.target.value))}
            />
          </div>

          <div className="calc-slider">
            <label>Interest Rate: {rate}%</label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="calc-right">
          <h3>Estimated Monthly Payment</h3>
          <p className="calc-payment">${monthly.toFixed(2)}/mo</p>
          <p className="calc-note">
            For {term} months at {rate}% APR
          </p>

          <div className="loan-breakdown">
            <h4>Loan Breakdown</h4>
            <div className="loan-item">
              <span>Loan Amount</span>
              <span>${(price - down).toLocaleString()}</span>
            </div>
            <div className="loan-item">
              <span>Total Interest</span>
              <span>${totalInterest.toFixed(2)}</span>
            </div>
            <div className="loan-item total">
              <span>Total Payment</span>
              <span>${totalPayment.toFixed(2)}</span>
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
              <li><CheckCircle className="check-icon" /> Up to 60 months financing</li>
              <li><CheckCircle className="check-icon" /> No down payment required</li>
              <li><CheckCircle className="check-icon" /> For qualified buyers</li>
            </ul>
          </div>

          <div className="offer-card red">
            <h3>Lease Specials</h3>
            <p>Drive more, pay less</p>
            <ul>
              <li><CheckCircle className="check-icon" /> Low monthly payments</li>
              <li><CheckCircle className="check-icon" /> Flexible mileage options</li>
              <li><CheckCircle className="check-icon" /> Upgrade every few years</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
};

export default Finance;
