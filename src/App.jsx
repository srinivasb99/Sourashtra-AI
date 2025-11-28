import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import About from './components/About';
import CTA from './components/CTA';
import Footer from './components/Footer';
import ChatPage from './pages/ChatPage';
import VoicePage from './pages/VoicePage';
import ImagePage from './pages/ImagePage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import './App.css';

// Landing Page Component
function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <About />
      <CTA />
      <Footer />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app loaded">
          <div className="background-pattern"></div>
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/voice" element={<VoicePage />} />
              <Route path="/image" element={<ImagePage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="/signup" element={<SignUpPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
