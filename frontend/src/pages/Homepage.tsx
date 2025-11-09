import React, { useEffect, useState } from 'react';
import '../styles/Homepage.css';

const Homepage: React.FC = () => {
  const [offsetY, setOffsetY] = useState(0);

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
        <div className="hero-content">
          <h1 className="hero-heading">Let's Go Places</h1>
          <p className="hero-subtext">
            Discover the latest in Toyota innovation and design.
          </p>
          <div className="hero-buttons">
            <button className="outline-btn">Explore Collection {'>'}</button>
            <button className="outline-btn">Learn More</button>
          </div>
        </div>
      </section>

      {/* Scroll Content */}
      <section className="info-section">
        <div className="info-content">
          <h2>Innovation Meets Performance</h2>
          <p>
            Every Toyota is engineered with precision and crafted to deliver
            exceptional performance, comfort, and reliability. Whether you’re
            exploring the city or embarking on a cross-country adventure, Toyota
            vehicles are designed to take you further.
          </p>
        </div>
      </section>

      <section className="info-section alt">
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
