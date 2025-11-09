import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch, FaHeart, FaUser } from "react-icons/fa";
import "../styles/Navbar.css";

const Navbar: React.FC = () => {

  return (
    <nav>
      <div className="nav-left ">
        <h2 className="logo" data-aos="fade-down" data-aos-delay="0">TOYOTA</h2>
        <ul className="nav-links" data-aos="fade-down" data-aos-delay="0">
          <li><Link to="/" data-aos="fade-down" data-aos-delay="100">Models</Link></li>
          <li><Link to="/preowned" data-aos="fade-down" data-aos-delay="200">Pre-Owned</Link></li>
          <li><Link to="/finance" data-aos="fade-down" data-aos-delay="300">Financing</Link></li>
          <li><Link to="/about" data-aos="fade-down" data-aos-delay="400">About</Link></li>
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
