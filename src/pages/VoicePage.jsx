import { useState, useEffect, useRef } from 'react';
import { useLiveVoice } from '../hooks/useLiveVoice';
import { useAuth } from '../context/AuthContext';
import { Mic, MicOff, Plug, X, Loader2, ArrowUp, Info } from 'lucide-react';
import './VoicePage.css';

const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/sourashtra-ai.firebasestorage.app/o/palkar-removebg-preview.png?alt=media&token=cdeccfaf-c19e-43d2-bb58-c853b0a4bd7d";

function VoicePage() {
  const { user } = useAuth();
  const {
    isConnected,
    isConnecting,
    isListening,
    isSpeaking,
    isProcessing,
    transcript,
    error,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendText,
  } = useLiveVoice();
  
  const [textInput, setTextInput] = useState('');
  
  const [volume, setVolume] = useState(0);
  const animationRef = useRef(null);
  const transcriptEndRef = useRef(null);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  // Volume visualization when listening
  // Note: We use a simple pulsing animation instead of actual volume analysis
  // to avoid creating a second microphone stream that conflicts with useLiveVoice
  useEffect(() => {
    if (isListening) {
      // Simulate volume with a gentle pulse effect
      let phase = 0;
      const updateVolume = () => {
        phase += 0.1;
        // Create a smooth sine wave pulse between 0.2 and 0.6
        const simulatedVolume = 0.4 + Math.sin(phase) * 0.2;
        setVolume(simulatedVolume);
        animationRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setVolume(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (!isConnected) return 'Not connected';
    if (isProcessing) return 'Thinking...';
    if (isSpeaking) return 'AI is speaking...';
    if (isListening) return 'Listening...';
    return 'Ready to listen';
  };

  const getStatusClass = () => {
    if (!isConnected) return 'status-disconnected';
    if (isProcessing) return 'status-processing';
    if (isSpeaking) return 'status-speaking';
    if (isListening) return 'status-listening';
    return 'status-ready';
  };

  const getOrbClass = () => {
    let classes = 'voice-orb-container';
    if (isListening) classes += ' listening';
    if (isSpeaking) classes += ' speaking';
    if (isProcessing) classes += ' processing';
    return classes;
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim() && isConnected && !isProcessing) {
      sendText(textInput.trim());
      setTextInput('');
    }
  };

  return (
    <div className="voice-page">
      <div className="voice-layout">
        {/* Main Voice Panel */}
        <div className="voice-panel">
          <div className="voice-header">
            <span className="beta-tag">BETA</span>
            <h1>Live Voice Mode</h1>
            <p>Have a real-time conversation in Sourashtra</p>
            <div className="beta-disclaimer">
              <Info size={14} />
              <span>The AI is still learning Sourashtra and may occasionally provide incorrect responses. It's actively improving!</span>
            </div>
          </div>

          <div className="voice-main">
            {/* Voice Orb */}
            <div className={getOrbClass()}>
              <div 
                className="voice-orb"
                style={{ '--volume': volume }}
              >
                {isListening && (
                  <div 
                    className="volume-indicator" 
                    style={{ '--scale': 1 + volume * 0.5 }}
                  ></div>
                )}
                <div className="orb-rings">
                  <div className="ring ring-1"></div>
                  <div className="ring ring-2"></div>
                  <div className="ring ring-3"></div>
                </div>
                <div className="orb-core">
                  {isProcessing && <Loader2 className="orb-loader" size={32} />}
                  <img 
                    src={LOGO_URL} 
                    alt="Sourashtra AI" 
                    className={`orb-logo ${isProcessing ? 'processing' : ''}`}
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="voice-status">
              <span className={getStatusClass()}>{getStatusText()}</span>
            </div>

            {/* Controls */}
            <div className="voice-controls">
              {!isConnected ? (
                <button 
                  className="voice-btn connect-btn" 
                  onClick={connect}
                  disabled={isConnecting}
                >
                  {isConnecting ? <Loader2 className="btn-spinner" size={20} /> : <Plug size={20} />}
                  <span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
                </button>
              ) : (
                <>
                  <button 
                    className={`voice-btn mic-btn ${isListening ? 'active' : ''}`}
                    onClick={isListening ? stopListening : startListening}
                    disabled={isProcessing || isSpeaking}
                  >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    <span>{isListening ? 'Stop' : 'Start'}</span>
                  </button>
                  <button 
                    className="voice-btn disconnect-btn" 
                    onClick={disconnect}
                    disabled={isProcessing}
                  >
                    <X size={20} />
                    <span>Disconnect</span>
                  </button>
                </>
              )}
            </div>

            {/* Text Input */}
            {isConnected && (
              <form className="voice-text-input" onSubmit={handleTextSubmit}>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Or type a message..."
                  disabled={!isConnected || isProcessing}
                />
              <button 
                type="submit" 
                className="send-btn"
                disabled={!textInput.trim() || isProcessing}
              >
                <ArrowUp size={18} />
              </button>
              </form>
            )}

            {error && (
              <div className="voice-error">
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Transcript Panel - Side */}
        {transcript.length > 0 && (
          <div className="voice-transcript-panel">
            <div className="voice-transcript">
              <h3>Conversation</h3>
              <div className="transcript-list">
                {transcript.map((item, index) => (
                  <div key={index} className={`transcript-item ${item.type}`}>
                    <span className="transcript-label">
                      {item.type === 'user' ? 'You' : item.type === 'ai' ? 'AI' : 'System'}:
                    </span>
                    <span className="transcript-text">{item.text}</span>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VoicePage;
