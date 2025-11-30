import { useState, useEffect, useRef } from 'react';
import { useLiveVoice } from '../hooks/useLiveVoice';
import { useAuth } from '../context/AuthContext';
import { Mic, MicOff, Plug, X, Loader2, ArrowUp } from 'lucide-react';
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
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const transcriptEndRef = useRef(null);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript]);

  // Volume visualization when listening
  useEffect(() => {
    if (isListening && !analyserRef.current) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        analyserRef.current = { analyser, audioContext, stream };

        const updateVolume = () => {
          if (analyserRef.current) {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setVolume(avg / 255);
            animationRef.current = requestAnimationFrame(updateVolume);
          }
        };
        updateVolume();
      }).catch(() => {
        // Microphone access handled by speech recognition
      });
    }

    if (!isListening && analyserRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      analyserRef.current.stream.getTracks().forEach(t => t.stop());
      analyserRef.current.audioContext.close();
      analyserRef.current = null;
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
      if (analyserRef.current) {
        analyserRef.current.stream.getTracks().forEach(t => t.stop());
        analyserRef.current.audioContext.close();
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
            <h1>Live Voice Mode</h1>
            <p>Have a real-time conversation in Sourashtra</p>
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
