import React, { useEffect, useState } from 'react';
import AOS from "aos";
import "aos/dist/aos.css";
import { useNavigate } from "react-router-dom";
import '../styles/Homepage.css';
import Stock from '../images/stock.jpg';
import { FaBolt, FaShieldAlt, FaMedal } from "react-icons/fa";
import ChatWidget from '../components/chatbot/ChatWidget';
import Matched from './Matched';
const Homepage: React.FC = () => {
  const [offsetY, setOffsetY] = useState(0);
  const navigate = useNavigate();


  // AOS LIBRARY USEFFECT
useEffect(() => {

  window.scrollTo(0, 0);
}, []);


  useEffect(() => {
  AOS.init({
    duration: 500, 
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
      <section className="info-section" data-aos="fade-up" data-aos-delay="0">
        <div className="info-content">
          <h2>Find Your Toyota</h2>
          <p>
            Every Toyota is engineered with precision and crafted to deliver
            exceptional performance, comfort, and reliability. Whether you’re
            exploring the city or embarking on a cross-country adventure, Toyota
            vehicles are designed to take you further.
          </p>
        </div>
      </section>

<section className="car-container"data-aos="fade-up" data-aos-delay="0">
  <div className="car-box">
    <img className="stock-photo" src={Stock} alt="Toyota Showcase" />

    {/* Buttons now sit BELOW the image */}
    <div className="car-buttons">
      <button className="car-btn" data-aos="zoom-in" data-aos-delay="0" onClick={()=> navigate("/matched")}>Match Me</button>
      <button className="car-btn outline"data-aos="zoom-in" data-aos-delay="0">Compare</button>
    </div>
  </div>
</section>


      <section className="info-section alt"data-aos="fade-up" data-aos-delay="0">
        <div className="info-content">
          <h2>Safety You Can Count On</h2>
          <p>
            Equipped with Toyota Safety Sense™, our cars use advanced technology
            to help keep you and your passengers protected — wherever the road
            takes you.
          </p>
        </div>
      </section>

      <footer className="footer">
        <p>© 2024 Toyota Motor Corporation. All rights reserved.</p>
      </footer>
    </>
  );
};

export default Homepage;
