import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './navbar/Navbar';
import Homepage from './pages/Homepage';
import Models from './pages/Models';
import Preowned from './pages/Preowned';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/models" element={<Models />} />
        <Route path="/preowned" element={<Preowned />} />
      </Routes>
    </Router>
  );
}

export default App;
