import { useState, useRef, useCallback, useEffect } from 'react';

// WebSocket connection to our secure backend (which proxies to Gemini)
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002/api/live';

export function useLiveVoice() {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState(null);
  
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);

  // Connect to our backend WebSocket (NOT directly to Gemini)
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setError(null);
    
    try {
      wsRef.current = new WebSocket(WS_URL);
      
      wsRef.current.onopen = () => {
        console.log('Connected to Sourashtra AI backend');
        // Tell backend to start Gemini session
        wsRef.current.send(JSON.stringify({ type: 'start' }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'connected':
              setIsConnected(true);
              setTranscript(prev => [...prev, {
                type: 'system',
                text: 'Connected to Sourashtra AI Voice. Start speaking!'
              }]);
              break;
              
            case 'audio':
              // Queue audio for playback
              audioQueueRef.current.push(message.data);
              playNextAudio();
              setIsSpeaking(true);
              break;
              
            case 'response':
              if (message.data?.serverContent?.outputTranscription) {
                setTranscript(prev => [...prev, {
                  type: 'ai',
                  text: message.data.serverContent.outputTranscription.text
                }]);
              }
              if (message.data?.serverContent?.inputTranscription) {
                setTranscript(prev => [...prev, {
                  type: 'user',
                  text: message.data.serverContent.inputTranscription.text
                }]);
              }
              if (message.data?.serverContent?.turnComplete) {
                setIsSpeaking(false);
              }
              break;
              
            case 'error':
              setError(message.error);
              break;
              
            case 'disconnected':
              setIsConnected(false);
              break;
          }
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Connection error. Please try again.');
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        setIsListening(false);
      };
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Play audio from queue
  const playNextAudio = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingRef.current = true;

    try {
      const audioData = audioQueueRef.current.shift();
      const audioBytes = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 24000 // Gemini outputs at 24kHz
        });
      }

      // Convert PCM to AudioBuffer
      const audioBuffer = audioContextRef.current.createBuffer(1, audioBytes.length / 2, 24000);
      const channelData = audioBuffer.getChannelData(0);
      const dataView = new DataView(audioBytes.buffer);
      
      for (let i = 0; i < audioBytes.length / 2; i++) {
        channelData[i] = dataView.getInt16(i * 2, true) / 32768;
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        isPlayingRef.current = false;
        if (audioQueueRef.current.length > 0) {
          playNextAudio();
        } else {
          setIsSpeaking(false);
        }
      };
      
      source.start();
    } catch (err) {
      console.error('Audio playback error:', err);
      isPlayingRef.current = false;
    }
  }, []);

  // Start listening and sending audio to backend
  const startListening = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Not connected. Please connect first.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      mediaStreamRef.current = stream;

      // Create audio context for processing
      const audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });
      
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (!isListening || wsRef.current?.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }

        // Convert to base64 and send to backend
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        wsRef.current.send(JSON.stringify({
          type: 'audio',
          data: base64
        }));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
      processorRef.current = { processor, source, audioContext };

      setIsListening(true);
    } catch (err) {
      setError('Microphone access denied. Please allow microphone access.');
      console.error('Microphone error:', err);
    }
  }, [isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.processor.disconnect();
      processorRef.current.source.disconnect();
      processorRef.current.audioContext.close();
      processorRef.current = null;
    }

    setIsListening(false);
  }, []);

  // Disconnect from backend
  const disconnect = useCallback(() => {
    stopListening();

    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
      wsRef.current.close();
      wsRef.current = null;
    }

    audioQueueRef.current = [];
    setIsConnected(false);
    setTranscript([]);
  }, [stopListening]);

  // Send text message
  const sendText = useCallback((text) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'text',
        text: text
      }));
      setTranscript(prev => [...prev, { type: 'user', text }]);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isListening,
    isSpeaking,
    transcript,
    error,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendText,
  };
}

