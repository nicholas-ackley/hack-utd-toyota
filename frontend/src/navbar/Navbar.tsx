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
      <div className="nav-left">
        <h2 className="logo">TOYOTA</h2>
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
