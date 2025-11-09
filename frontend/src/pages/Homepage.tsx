import React, { useEffect, useState } from 'react';
import AOS from "aos";
import "aos/dist/aos.css";
import { useNavigate } from "react-router-dom";
import '../styles/Homepage.css';
import Stock from '../images/stock.jpg';
import { FaBolt, FaShieldAlt, FaMedal } from "react-icons/fa";
import Rav4 from '../images/rav4.jpg';
// import ChatWidget from '../components/chatbot/ChatWidget';
// import Matched from './Matched';
const Homepage: React.FC = () => {
  const [offsetY, setOffsetY] = useState(0);
  const navigate = useNavigate();


  // AOS LIBRARY USEFFECT
useEffect(() => {

  window.scrollTo(0, 0);
}, []);


  useEffect(() => {
  AOS.init({
    duration: 1000, 
    once: true,     
    easing: "ease-out-cubic",
  });
}, []);


// Scroll event listener
  useEffect(() => {
    const handleScroll = () => setOffsetY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section
        className="homepage-container"
        style={{
          backgroundPositionY: `${offsetY * 0.4}px`, // parallax movement
        }}
      >
        <div className="hero-content" data-aos="fade-up" data-aos-delay="0">
          <h1 className="hero-heading">Let's Go Places</h1>
          <p className="hero-subtext">
            Discover the latest in Toyota innovation and design.
          </p>
          <div className="hero-buttons">
            <button className="outline-btn">Explore Collection {'>'}</button>
            <button className="outline-btn2">Learn More</button>
          </div>
        </div>
      </section>

      {/* Scroll Content */}
 <section className="stats-container"data-aos="fade-up" data-aos-delay="100" >
  <div className="stats-box">
    <div className="icon">
      <FaBolt className="stats-icon" />
    </div>
    <h3>Hybrid & Electric</h3>
    <p>Leading the way in sustainable mobility</p>
  </div>

  <div className="stats-box"data-aos="fade-up" data-aos-delay="100">
    <div className="icon" >
      <FaShieldAlt className="stats-icon" />
    </div>
    <h3>Toyota Safety Sense</h3>
    <p>Advanced safety features standard</p>
  </div>

  <div className="stats-box" data-aos="fade-up" data-aos-delay="100">
    <div className="icon" >
      <FaMedal className="stats-icon" />
    </div>
    <h3>Quality & Reliability</h3>
    <p>Trusted by millions worldwide</p>
  </div>

      </section>
{/* FIND YOUR PERFECT TOYOTA SECTION */}
<section className="perfect-section" data-aos="fade-up" data-aos-delay="0">
  <div className="perfect-container">
    
    {/* LEFT SIDE — TEXT + STATS */}
    <div className="perfect-text">
      <h2 className="perfect-heading">Find Your Perfect Toyota</h2>
      <p className="perfect-description">
        Every Toyota is engineered with precision and crafted to deliver exceptional performance, comfort, and reliability. 
        Whether you're exploring the city or embarking on a cross-country adventure, Toyota vehicles are designed to take you further.
      </p>

      {/* Stats */}
      <div className="perfect-stats">
        <div className="stat-item">
          <h3>20+</h3>
          <p>Models Available</p>
        </div>
        <div className="stat-item">
          <h3>98%</h3>
          <p>Customer Satisfaction</p>
        </div>
        <div className="stat-item">
          <h3>10Y</h3>
          <p>Warranty Coverage</p>
        </div>
      </div>
    </div>

    {/* RIGHT SIDE — IMAGE + BUTTONS */}
    <div className="perfect-card">
      <img src={Stock} alt="Toyota Camry" className="perfect-image" />

      <div className="perfect-buttons">
        <button 
          className="car-btn red" 
          data-aos="zoom-in" 
          onClick={() => navigate("/matched")}
        >
          🚗 Match Me
        </button>
        <button 
          className="car-btn white" 
          data-aos="zoom-in"
        >
          ⚙️ Compare Models
        </button>
      </div>
    </div>

  </div>
</section>



{/* --- SAFETY DETAILS SECTION (Reversed Layout) --- */}
<section className="safety-section" data-aos="fade-up" data-aos-delay="0">
  <div className="safety-container reverse">
    {/* Left side image */}
    <div className="safety-image"data-aos="fade-right" data-aos-delay="100">
      <img 
        src={Rav4}
        alt="Toyota Safety Testing"
      />
    </div>

    {/* Right side text */}
    <div className="safety-text"data-aos="fade-left" data-aos-delay="100">
      <h2>Toyota Safety Sense™</h2>
      <p>
        Toyota Safety Sense™ (TSS) is a suite of advanced active safety 
        technologies designed to keep you and your passengers safe. 
        From pre-collision systems to lane departure alerts, TSS helps 
        prevent accidents before they happen.
      </p>

      {/* Ratings */}
      <div className="safety-ratings"data-aos="fade-right" data-aos-delay="100">
        <div className="rating-box">
          <h3>5★</h3>
          <p>NHTSA Overall Rating</p>
        </div>
        <div className="rating-box">
          <h3>Top Safety Pick+</h3>
          <p>IIHS Award 2025</p>
        </div>
        <div className="rating-box">
          <h3>90%</h3>
          <p>Driver Assist Accuracy</p>
        </div>
      </div>
    </div>
  </div>
</section>

{/* --- OFFICIAL TOYOTA FOOTER --- */}
<footer className="toyota-footer">
  <div className="footer-container">
    <div className="footer-columns">
      <div className="footer-col">
        <h4>Vehicles</h4>
        <ul>
          <li><a href="#">All Models</a></li>
          <li><a href="#">Cars & Minivans</a></li>
          <li><a href="#">SUVs & Crossovers</a></li>
          <li><a href="#">Trucks</a></li>
          <li><a href="#">Hybrids & EVs</a></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>Shopping Tools</h4>
        <ul>
          <li><a href="#">Build & Price</a></li>
          <li><a href="#">Search Inventory</a></li>
          <li><a href="#">Find a Dealer</a></li>
          <li><a href="#">Special Offers</a></li>
          <li><a href="#">Estimate Payments</a></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>Owners</h4>
        <ul>
          <li><a href="#">ToyotaCare</a></li>
          <li><a href="#">Service Centers</a></li>
          <li><a href="#">Recalls Lookup</a></li>
          <li><a href="#">Accessories</a></li>
          <li><a href="#">Toyota Financial</a></li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>About Toyota</h4>
        <ul>
          <li><a href="#">Newsroom</a></li>
          <li><a href="#">Careers</a></li>
          <li><a href="#">Investors</a></li>
          <li><a href="#">Environmental Impact</a></li>
          <li><a href="#">Press Kit</a></li>
        </ul>
      </div>
    </div>

    {/* Divider */}
    <div className="footer-divider"></div>

    {/* Bottom Row */}
    <div className="footer-bottom">
      <div className="footer-socials">
        <a href="#" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
        <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
        <a href="#" aria-label="YouTube"><i className="fab fa-youtube"></i></a>
        <a href="#" aria-label="Twitter"><i className="fab fa-x-twitter"></i></a>
      </div>

      <p className="footer-legal">
        © {new Date().getFullYear()} Toyota Motor Corporation. All rights reserved. |
        <a href="#"> Privacy Policy </a> | 
        <a href="#"> Terms of Use </a> | 
        <a href="#"> Accessibility </a>
      </p>
    </div>
  </div>
</footer>

    </>
  );
};

export default Homepage;
