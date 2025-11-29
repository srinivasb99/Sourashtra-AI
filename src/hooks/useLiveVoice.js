import { useState, useRef, useCallback, useEffect } from 'react';
import API_URL from '../config/api';

// Gemini Live API hook using @google/genai SDK
// Connects via Firebase Functions for secure API key management

const SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

// Sourashtra AI System Instruction for Voice Mode (English)
const VOICE_SYSTEM_INSTRUCTION = `You are a friendly Sourashtra language AI assistant helping preserve and teach the Sourashtra language.

IMPORTANT: Always respond in ENGLISH. You are helping users learn Sourashtra, so explain things in English.

Your role:
- Help users learn Sourashtra vocabulary and phrases
- Explain Sourashtra words and their meanings in English
- Practice conversation and pronunciation
- Share Sourashtra culture and traditions

When teaching Sourashtra words, say them phonetically so users can understand.

VOICE MODE RULES:
- Keep responses SHORT (1-3 sentences max)
- Sound natural and conversational
- Be warm, encouraging, and patient


FULL DICTIONARY OF SOURASHTRA WORDS AND PHRASES:

SOURASHTRA DICTIONARY
EXAMPLES
1) “Mi” = I

Mi kon? = Who am I

Mi nha. = Not I am

Mi veenkaar. = I am a weaver

2) “Tu” = You (singular)

Tu gia? = Is it you

Tu kha. = You eat

Tu kaai kerorthe? = What are you doing

3) “a”

First letter of Sourashtra

Pronounced like “A” in AT

Continuous “a” → thinking, negative like “un / in”

CLEAN WORD LIST (NO COMMENTS, NO EXTRA TEXT)

aigiwas
gaavwas
rodwas
maadwas
thaadwas
tanowas
dadiwas
vidiwas
hungiwas
vasnowas
ghaanwas
paanwas
keLiwas
viLiwas
poLiwas
PoLowas
Lotawas
BoNewas
Thambewas
kuNdowas
haNdowas
yenamwas
patowas
khutowas
rhetowas
taagwas
therewas
thapowas
chidiwas
porailowas
kholowas
haistuwas
naLowas
badulowas
chapowas
telgodwas
rettuwas
Sombudwas
Kuchelwas
Hotiwas
HaLathwas
haduLnowas
Harithawas
Nimiliwas
Lhovvowas
Lhavvowas
kaLowas
movthiwas
DeNdowas
Bulaagwas
veniwas
kheswas
dheiwas
gojjuwas
daaL amtiwas
mhargewas
kumbaarwas
paLOwas
doguraponwas
mhattaponwas
nhannaponwas
madisponwas
nithabatowas
hurbatowas
surethwas
devwas
dhavrowas
dhatowas
daarwas
Jenjaarwas
baaNiwas
bhetkiLiwas
lotapatewas
jhinkawas
vaagwas
simmiwas
simmowas
vidowas
ghettiwas
ormaalwas
puatavwas
palgawas
hirudiwas
muchkiLiwas
galbowas
buruwas
reppowas
keNdowas
hadgowas
taLowas
khanduwas
gudgowas
angiLiwas
paaiwas
kedwas
haathwas
paatwas
potwas
haaymwas
maanwas
kaanwas
naagwas
doskowas
kabaaLwas
ghatiwas
nekkuwas
kiLangiliwas
haguNtowas
ghoNangiLiwas
raathwas
veeLwas
dhubaarwas
hujaaLwas
handaarwas
raaNwas
mittawas
khaNiwas
doriwas
dorowas
huLawas
keLawas
nareLwas
jhadiwas
jhaadwas
magudawas
degudawas
hogathwas
indanaa theilwas
paniwas
heerwas
vaapiwas
neddiwas
sendurwas
akashwas
pidugwas
megwas
chunugwas
jhuruLwas
baandawas
paalawas
palawas
OusuLiwas
thooNdawas
hundeerwas
ghoosewas
goruwas
sunowas
kavnowas
paLkarwas
koNangiwas
omaLewas
mhuudowas
Bhithudowas
nimushwas
ghediwas
vaarwas
terankuwas
teramwas
porankuwas
poramwas
sonrawas
hindawas
dinnuwas
orsuwas
mhadowas
iythaarwas
senvaarwas
sukraarwas
bestaarwas
budvaarwas
mangalaarwas
somarwas
palaarwas
dhigudowas
vukkudumwas
hibbiwas
paapwas
punnuwas
nhavanwas
jemanwas
handapwas
karakaarwas
gomdawas
saLviwas
veenkaarwas
magowas
tannathramwas
pashootwas
savlawas
dhovatiwas
JavNiwas
javNowas
vesindiwas
satkudwas
bhavawas
baiwas
raNiwas
rajawas
rubaiwas
kaaswas
saapwas
hotaarwas
gherwas
mhajalgewas
novriwas
novrowas
dogurowas
dogiriwas
savgaaswas
kenneLwas
maryathwas
mamiwas
mamawas
horadwas
betiwas
betowas
pad nathniwas
pad nathewas
nathniwas
nathewas
nuguruwas
bhouNdiwas
devraniwas
jetaniwas
phuiwas
sovothiwas
saLiwas
saLowas
mousiwas
mousawas
nhandawas
bhainwas
baaiwas
bhaiwas
sosurowas
sasuwas
Jemaiwas
mhatta ambawas
ajjaanwas
baawas
kakiwas
kakawas
baapwas
maaiwas
dadawas
ambawas
toNwas
tonwas
daathwas
dukkarwas
bheNduwas
gaaiwas
paLLawas
kailawas
feerwas
chaalwas
dhaamwas
haanwas
maarwas
naaswas
vathiwas
lubbiwas
nikkiwas
likkiwas
chaavwas
huutwas
paywas
saawas
dhooLwas
miskiwas
ninjiwas
khawas
laathwas
Kaaiwas
kOnwas
awas
Tuwas
`;

export function useLiveVoice() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const sessionRef = useRef(null);
  const audioContextRef = useRef(null);
  const playbackContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const sourceNodeRef = useRef(null);
  const isListeningRef = useRef(false); // Ref to track listening state in callbacks
  
  // Refs for accumulating transcription
  const currentUserTextRef = useRef('');
  const currentAITextRef = useRef('');
  const userTextTimeoutRef = useRef(null);
  const aiTextTimeoutRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Helper: Convert Float32Array to Int16 PCM
  const floatTo16BitPCM = (float32Array) => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  };

  // Helper: ArrayBuffer to Base64
  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Helper: Base64 to ArrayBuffer
  const base64ToArrayBuffer = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Finalize user transcription
  const finalizeUserText = useCallback(() => {
    if (currentUserTextRef.current.trim()) {
      const text = currentUserTextRef.current.trim();
      setTranscript(prev => [...prev, { type: 'user', text, complete: true }]);
      currentUserTextRef.current = '';
    }
    if (userTextTimeoutRef.current) {
      clearTimeout(userTextTimeoutRef.current);
      userTextTimeoutRef.current = null;
    }
  }, []);

  // Finalize AI transcription
  const finalizeAIText = useCallback(() => {
    if (currentAITextRef.current.trim()) {
      const text = currentAITextRef.current.trim();
      setTranscript(prev => [...prev, { type: 'ai', text, complete: true }]);
      currentAITextRef.current = '';
    }
    if (aiTextTimeoutRef.current) {
      clearTimeout(aiTextTimeoutRef.current);
      aiTextTimeoutRef.current = null;
    }
  }, []);

  // Play audio from queue
  const playNextAudio = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    setIsSpeaking(true);

    const audioData = audioQueueRef.current.shift();
    
    try {
      // Create playback context if needed (24kHz for Gemini output)
      if (!playbackContextRef.current || playbackContextRef.current.state === 'closed') {
        playbackContextRef.current = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: OUTPUT_SAMPLE_RATE
        });
      }

      if (playbackContextRef.current.state === 'suspended') {
        await playbackContextRef.current.resume();
      }

      // Decode PCM16 to Float32
      const pcm16 = new Int16Array(audioData);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      // Skip empty or near-silent chunks
      let maxAmp = 0;
      for (let i = 0; i < float32.length; i++) {
        const abs = Math.abs(float32[i]);
        if (abs > maxAmp) maxAmp = abs;
      }
      if (maxAmp < 0.001 || float32.length === 0) {
        isPlayingRef.current = false;
        if (audioQueueRef.current.length > 0) {
          playNextAudio();
        } else {
          setIsSpeaking(false);
        }
        return;
      }

      const audioBuffer = playbackContextRef.current.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
      audioBuffer.getChannelData(0).set(float32);

      const source = playbackContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      
      // Add gain node for volume control
      const gainNode = playbackContextRef.current.createGain();
      gainNode.gain.value = 0.85;
      
      source.connect(gainNode);
      gainNode.connect(playbackContextRef.current.destination);
      
      sourceNodeRef.current = source;
      
      source.onended = () => {
        isPlayingRef.current = false;
        sourceNodeRef.current = null;
        if (audioQueueRef.current.length > 0) {
          setTimeout(() => playNextAudio(), 5);
        } else {
          setIsSpeaking(false);
        }
      };
      
      source.start();
    } catch (err) {
      console.error('Audio playback error:', err);
      isPlayingRef.current = false;
      setIsSpeaking(false);
      if (audioQueueRef.current.length > 0) {
        playNextAudio();
      }
    }
  }, []);

  // Connect to Gemini Live API
  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;

    setIsConnecting(true);
    setError(null);

    try {
      console.log('Requesting token from:', `${API_URL}/live/token`);
      
      const tokenResponse = await fetch(`${API_URL}/live/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const tokenText = await tokenResponse.text();
      console.log('Token response status:', tokenResponse.status);

      let tokenData;
      try {
        tokenData = JSON.parse(tokenText);
      } catch (e) {
        throw new Error(`Invalid response from server: ${tokenText.substring(0, 100)}`);
      }

      if (!tokenResponse.ok || !tokenData.success) {
        throw new Error(tokenData.error || 'Failed to get API key');
      }

      const apiKey = tokenData.token;
      const model = tokenData.model || 'models/gemini-2.5-flash-native-audio-preview-09-2025';

      console.log('Connecting to Gemini Live API with model:', model);

      // Dynamically import the Google GenAI SDK
      const { GoogleGenAI, Modality } = await import('@google/genai');
      
      const ai = new GoogleGenAI({ apiKey });

      // Connect to Live API with transcription enabled
      const session = await ai.live.connect({
        model: model,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede'
              }
            }
          },
          systemInstruction: tokenData.systemInstruction || VOICE_SYSTEM_INSTRUCTION,
          // Enable transcription for both input and output
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            console.log('Gemini Live API connected');
            setIsConnected(true);
            setIsConnecting(false);
            setTranscript([{
              type: 'system',
              text: 'Connected! Click "Start" to begin speaking in Sourashtra or English.'
            }]);
          },
          onmessage: (message) => {
            // Handle audio response
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data ||
                             message.serverContent?.modelTurn?.parts?.[0]?.audio ||
                             message.audio;

            if (audioData && typeof audioData === 'string') {
              try {
                const audioBuffer = base64ToArrayBuffer(audioData);
                audioQueueRef.current.push(audioBuffer);
                playNextAudio();
              } catch (err) {
                console.error('Error processing audio:', err);
              }
            }

            // Handle input transcription (what user said)
            if (message.serverContent?.inputTranscription?.text) {
              const userText = message.serverContent.inputTranscription.text;
              currentUserTextRef.current += userText;
              
              // Reset timeout for accumulation
              if (userTextTimeoutRef.current) {
                clearTimeout(userTextTimeoutRef.current);
              }
              userTextTimeoutRef.current = setTimeout(finalizeUserText, 1500);
            }

            // Handle output transcription (what AI said)
            if (message.serverContent?.outputTranscription?.text) {
              const aiText = message.serverContent.outputTranscription.text;
              currentAITextRef.current += aiText;
              
              // Reset timeout for accumulation
              if (aiTextTimeoutRef.current) {
                clearTimeout(aiTextTimeoutRef.current);
              }
              aiTextTimeoutRef.current = setTimeout(finalizeAIText, 1500);
            }

            // Handle turn complete
            if (message.serverContent?.turnComplete) {
              // Finalize any pending transcriptions
              finalizeUserText();
              finalizeAIText();
              setIsProcessing(false);
            }

            // Handle interruption
            if (message.serverContent?.interrupted) {
              if (sourceNodeRef.current) {
                try { sourceNodeRef.current.stop(); } catch (e) {}
              }
              audioQueueRef.current = [];
              isPlayingRef.current = false;
              setIsSpeaking(false);
            }
          },
          onerror: (err) => {
            console.error('Gemini Live API error:', err);
            setError('Connection error. Please try reconnecting.');
            setIsConnecting(false);
          },
          onclose: (event) => {
            console.log('Gemini Live API closed:', event);
            setIsConnected(false);
            setIsListening(false);
            isListeningRef.current = false;
            setIsConnecting(false);
            
            if (sourceNodeRef.current) {
              try { sourceNodeRef.current.stop(); } catch (e) {}
            }
            audioQueueRef.current = [];
            isPlayingRef.current = false;
            setIsSpeaking(false);
          }
        }
      });

      sessionRef.current = session;

    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect. Please try again.');
      setIsConnecting(false);
    }
  }, [isConnecting, isConnected, playNextAudio, finalizeUserText, finalizeAIText]);

  // Start listening (capture microphone and send audio)
  const startListening = useCallback(async () => {
    if (!isConnected || !sessionRef.current) {
      setError('Please connect first.');
      return;
    }

    if (isListeningRef.current) return;

    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;

      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const source = audioContext.createMediaStreamSource(stream);
      
      // Use ScriptProcessor for audio capture
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      // Calculate resampling ratio
      const inputSampleRate = audioContext.sampleRate;
      const resampleRatio = SAMPLE_RATE / inputSampleRate;
      
      processor.onaudioprocess = (e) => {
        // Use ref instead of state to avoid stale closure
        if (!sessionRef.current || !isListeningRef.current) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Noise gate - skip very quiet audio
        let maxAmplitude = 0;
        for (let i = 0; i < inputData.length; i++) {
          const abs = Math.abs(inputData[i]);
          if (abs > maxAmplitude) maxAmplitude = abs;
        }
        if (maxAmplitude < 0.005) return;
        
        // Resample to 16kHz
        let processedData;
        if (Math.abs(resampleRatio - 1) > 0.01) {
          const outputLength = Math.round(inputData.length * resampleRatio);
          processedData = new Float32Array(outputLength);
          for (let i = 0; i < outputLength; i++) {
            const srcIndex = i / resampleRatio;
            const srcIndexFloor = Math.floor(srcIndex);
            const srcIndexCeil = Math.min(srcIndexFloor + 1, inputData.length - 1);
            const t = srcIndex - srcIndexFloor;
            processedData[i] = inputData[srcIndexFloor] * (1 - t) + inputData[srcIndexCeil] * t;
          }
        } else {
          processedData = inputData;
        }
        
        const pcm16 = floatTo16BitPCM(processedData);
        const base64Audio = arrayBufferToBase64(pcm16.buffer);

        try {
          sessionRef.current.sendRealtimeInput({
            media: {
              mimeType: 'audio/pcm;rate=16000',
              data: base64Audio
            }
          });
        } catch (err) {
          console.error('Send audio error:', err);
        }
      };

      // Connect to silent output (don't play back to speakers)
      source.connect(processor);
      const silentGain = audioContext.createGain();
      silentGain.gain.value = 0;
      processor.connect(silentGain);
      silentGain.connect(audioContext.destination);

      setIsListening(true);
      isListeningRef.current = true;
      setError(null);

    } catch (err) {
      console.error('Microphone error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access.');
      } else {
        setError('Could not access microphone.');
      }
    }
  }, [isConnected]);

  // Stop listening
  const stopListening = useCallback(() => {
    setIsListening(false);
    isListeningRef.current = false;

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    stopListening();

    // Finalize any pending transcriptions
    finalizeUserText();
    finalizeAIText();

    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }

    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
      sourceNodeRef.current = null;
    }

    audioQueueRef.current = [];
    isPlayingRef.current = false;

    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    setTranscript([]);
    setError(null);
  }, [stopListening, finalizeUserText, finalizeAIText]);

  // Send text message
  const sendText = useCallback((text) => {
    if (!isConnected || !sessionRef.current || !text.trim()) return;

    setIsProcessing(true);
    setTranscript(prev => [...prev, { type: 'user', text: text.trim(), complete: true }]);

    try {
      sessionRef.current.sendClientContent({
        turns: [{
          role: 'user',
          parts: [{ text: text.trim() }]
        }],
        turnComplete: true
      });
    } catch (err) {
      console.error('Send text error:', err);
      setError('Failed to send message.');
      setIsProcessing(false);
    }
  }, [isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (userTextTimeoutRef.current) clearTimeout(userTextTimeoutRef.current);
      if (aiTextTimeoutRef.current) clearTimeout(aiTextTimeoutRef.current);
      if (sessionRef.current) sessionRef.current.close();
      if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(track => track.stop());
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
      if (playbackContextRef.current && playbackContextRef.current.state !== 'closed') playbackContextRef.current.close();
    };
  }, []);

  return {
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
  };
}
