import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaSearch, FaHeart, FaUser } from "react-icons/fa";
import "../styles/Navbar.css";

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // detect scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // detect route for dark pages
  const darkPages = ["/finance", "/matched", "/compare"]; // 👈 add any routes that need black navbar
  const isDark = darkPages.includes(location.pathname.toLowerCase());

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""} ${isDark ? "dark" : "light"}`}>
      <div className="nav-left" data-aos="fade-up" data-aos-delay="100">
        <h2 className="logo"data-aos="fade-up" data-aos-delay="200">TOYOTA</h2>
        <ul className="nav-links"data-aos="fade-up" data-aos-delay="300">
          <li><Link to="/" data-aos="fade-up" data-aos-delay="400">Models</Link></li>
          <li><Link to="/preowned"data-aos="fade-up" data-aos-delay="500">Pre-Owned</Link></li>
          <li><Link to="/finance"data-aos="fade-up" data-aos-delay="600">Financing</Link></li>
          <li><Link to="/about"data-aos="fade-up" data-aos-delay="700">About</Link></li>
        </ul>
      </div>

      <div className="nav-icons">
        <FaSearch className="icon" />
        <FaHeart className="icon" />
        <FaUser className="icon" />
      </div>
    </nav>
  );
};

export default Navbar;
