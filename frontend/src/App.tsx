import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { seedToyotaMockCatalog } from './firebaseFunctions';
import Navbar from './navbar/Navbar';
import Homepage from './pages/Homepage';
import Models from './pages/Models';
import Preowned from './pages/Preowned';
import ChatWidget from './components/chatbot/ChatWidget';
import Matched from './pages/Matched';
import Finance from './pages/Finance';
import Results from './pages/Results';
import Compare from './pages/Compare';
import AOS from "aos";
import "aos/dist/aos.css";

function AppContent() {
  const location = useLocation();

  // ✅ Initialize AOS once
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: false,
      mirror: true,
      easing: "ease-out-cubic",
    });

    // ✅ Refresh AOS whenever route changes
    AOS.refresh();
  }, [location]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/models" element={<Models />} />
        <Route path="/preowned" element={<Preowned />} />
        <Route path="/matched" element={<Matched />} />  
        <Route path="/finance" element={<Finance />} />  
        <Route path="/results" element={<Results />} /> 
              <Route path="/compare" element={<Compare />} /> 
      </Routes>
    </>
  );
}

function App() {
  const hasAddedRef = useRef(false);

  useEffect(() => {
    if (hasAddedRef.current) return;
    hasAddedRef.current = true;
    seedToyotaMockCatalog(); // seeds mock data once
  }, []);

  return (
    <>
      <ChatWidget />
      <Router>
        <AppContent />
      </Router>
    </>
  );
}

export default App;
