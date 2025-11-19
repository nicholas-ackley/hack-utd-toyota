import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaSearch, FaHeart, FaUser } from "react-icons/fa";
import "../styles/Navbar.css";

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Only apply scroll detection on homepage (or whichever page you want)
  const scrollPage = ["/"]; // 👈 Only these routes get scroll effect

  useEffect(() => {
    if (scrollPage.includes(location.pathname.toLowerCase())) {
      const handleScroll = () => setScrolled(window.scrollY > 10);
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    } else {
      setScrolled(true); // Always show fixed navbar on other pages
    }
  }, [location.pathname]);

  const darkPages = ["/finance", "/matched", "/compare", "/preowned", "/results"];

  const isDark = darkPages.includes(location.pathname.toLowerCase());

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""} ${isDark ? "dark" : "light"}`}>
      <div className="nav-left" data-aos="fade-down">
        <h2 className="logo" data-aos="fade-down" >TOYOTA</h2>
        <ul className="nav-links">
          <li><Link to="/">Models</Link></li>
          <li><Link to="/preowned">Pre-Owned</Link></li>
          <li><Link to="/finance">Financing</Link></li>
          <li><Link to="/about">About</Link></li>
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
