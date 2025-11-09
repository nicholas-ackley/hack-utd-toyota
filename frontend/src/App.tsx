import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { seedToyotaMockCatalog } from './firebaseFunctions';
import Navbar from './navbar/Navbar';
import Homepage from './pages/Homepage';
import Models from './pages/Models';
import Preowned from './pages/Preowned';

function App() {

  const hasAddedRef = useRef(false);

  useEffect(() => {
    if (hasAddedRef.current) return;
    hasAddedRef.current = true;
    seedToyotaMockCatalog(); // runs once when the app loads - seeds all 18 Toyota cars
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
