import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { addCarToDatabase } from './firebaseFunctions';
import Navbar from './navbar/Navbar';
import Homepage from './pages/Homepage';
import Models from './pages/Models';
import Preowned from './pages/Preowned';

function App() {

  const hasAddedRef = useRef(false);

  useEffect(() => {
    if (hasAddedRef.current) return;
    hasAddedRef.current = true;
    addCarToDatabase(); // runs once when the app loads
  }, []);


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
