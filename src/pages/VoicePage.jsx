import { useState, useEffect, useRef } from 'react';
import { useLiveVoice } from '../hooks/useLiveVoice';
import { useAuth } from '../context/AuthContext';
import './VoicePage.css';

function VoicePage() {
  const { user } = useAuth();
  const {
    isConnected,
    isListening,
    isSpeaking,
    transcript,
    error,
    connect,
    disconnect,
    startListening,
    stopListening,
  } = useLiveVoice();
  
  const [volume, setVolume] = useState(0);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

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
      });
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (analyserRef.current) {
        analyserRef.current.stream.getTracks().forEach(t => t.stop());
        analyserRef.current.audioContext.close();
        analyserRef.current = null;
      }
    };
  }, [isListening]);

  return (
    <div className="voice-page">
      <div className="voice-container">
        <div className="voice-header">
          <h1>🎙️ Live Voice Mode</h1>
          <p>Have a real-time conversation in Sourashtra</p>
        </div>

        <div className="voice-main">
          {/* Voice Orb */}
          <div className={`voice-orb-container ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}>
            <div 
              className="voice-orb"
              style={{ '--volume': volume }}
            >
              <div className="orb-core">
                <span className="orb-symbol">ஃ</span>
              </div>
              <div className="orb-rings">
                <div className="ring ring-1"></div>
                <div className="ring ring-2"></div>
                <div className="ring ring-3"></div>
              </div>
              {isListening && (
                <div className="volume-indicator" style={{ transform: `scale(${1 + volume * 0.5})` }}></div>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="voice-status">
            {!isConnected ? (
              <span className="status-disconnected">Not connected</span>
            ) : isListening ? (
              <span className="status-listening">Listening...</span>
            ) : isSpeaking ? (
              <span className="status-speaking">AI is speaking...</span>
            ) : (
              <span className="status-ready">Ready to listen</span>
            )}
          </div>

          {/* Controls */}
          <div className="voice-controls">
            {!isConnected ? (
              <button className="voice-btn connect-btn" onClick={connect}>
                <span className="btn-icon">🔌</span>
                <span>Connect</span>
              </button>
            ) : (
              <>
                <button 
                  className={`voice-btn mic-btn ${isListening ? 'active' : ''}`}
                  onClick={isListening ? stopListening : startListening}
                >
                  <span className="btn-icon">{isListening ? '⏹️' : '🎤'}</span>
                  <span>{isListening ? 'Stop' : 'Start'}</span>
                </button>
                <button className="voice-btn disconnect-btn" onClick={disconnect}>
                  <span className="btn-icon">✖️</span>
                  <span>Disconnect</span>
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="voice-error">
              <p>{error}</p>
            </div>
          )}

          {/* Transcript */}
          {transcript.length > 0 && (
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
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="voice-info">
          <div className="info-card">
            <h4>💡 Tips for best experience</h4>
            <ul>
              <li>Use headphones to prevent echo</li>
              <li>Speak clearly and at a normal pace</li>
              <li>You can speak in Sourashtra or English</li>
              <li>The AI will respond primarily in Sourashtra</li>
            </ul>
          </div>
          <div className="info-card">
            <h4>🔒 Secure & Private</h4>
            <p>All voice data is processed securely through our backend servers. No data is stored unless you're signed in and choose to save.</p>
          </div>
          {!user && (
            <div className="info-card">
              <h4>👤 Sign in to save recordings</h4>
              <p>Sign in with Google to save your voice conversations for later review.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VoicePage;
