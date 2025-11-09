import { Link } from 'react-router-dom';
import '../styles/Navbar.css'; // make sure this path matches your structure

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <h2 className="logo">Toyota</h2>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/models">Models</Link></li>
        <li><Link to="/contact">Contact</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
