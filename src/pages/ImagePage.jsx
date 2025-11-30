import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import API_URL from '../config/api';
import { 
  Image, Square, Monitor, Smartphone, Camera, Film, 
  Sparkles, Palette, Theater, Download, AlertTriangle,
  Copy, Landmark, Flower2, Settings, Plus, X, ArrowUp
} from 'lucide-react';
import './ImagePage.css';

// Available options
const ASPECT_RATIOS = [
  { value: '1:1', label: 'Square', icon: <Square size={14} /> },
  { value: '16:9', label: 'Wide', icon: <Monitor size={14} /> },
  { value: '9:16', label: 'Tall', icon: <Smartphone size={14} /> },
  { value: '4:3', label: 'Standard', icon: <Monitor size={14} /> },
];

const RESOLUTIONS = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
];

const STYLES = [
  { value: 'default', label: 'Default', icon: <Sparkles size={14} /> },
  { value: 'cultural', label: 'Cultural', icon: <Theater size={14} /> },
  { value: 'photorealistic', label: 'Photo', icon: <Camera size={14} /> },
  { value: 'artistic', label: 'Artistic', icon: <Palette size={14} /> },
];

function ImagePage() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [resolution, setResolution] = useState('1K');
  const [style, setStyle] = useState('default');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [referenceImages, setReferenceImages] = useState([]);
  
  // Track if history has been modified locally (not just loaded from Firestore)
  const historyModifiedRef = useRef(false);
  const initialLoadCompleteRef = useRef(false);
  const fileInputRef = useRef(null);

  // Load image history from Firestore when user logs in
  useEffect(() => {
    const loadImageHistory = async () => {
      if (!user?.uid) {
        setIsLoadingHistory(false);
        initialLoadCompleteRef.current = true;
        return;
      }

      try {
        const imagesRef = doc(db, 'users', user.uid, 'images', 'history');
        const imagesDoc = await getDoc(imagesRef);
        
        if (imagesDoc.exists()) {
          const data = imagesDoc.data();
          if (data.history && Array.isArray(data.history)) {
            setHistory(data.history);
          }
        }
      } catch (err) {
        console.error('Error loading image history:', err);
      } finally {
        setIsLoadingHistory(false);
        initialLoadCompleteRef.current = true;
      }
    };

    loadImageHistory();
  }, [user?.uid]);

  // Save image history to Firestore when it changes
  useEffect(() => {
    const saveImageHistory = async () => {
      // Only save if:
      // 1. User is logged in
      // 2. Initial load is complete (to avoid race conditions)
      // 3. History was actually modified locally (not just loaded)
      // 4. Not currently generating
      if (!user?.uid || !initialLoadCompleteRef.current || !historyModifiedRef.current || isGenerating) {
        return;
      }

      try {
        const imagesRef = doc(db, 'users', user.uid, 'images', 'history');
        await setDoc(imagesRef, {
          history: history,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      } catch (err) {
        console.error('Error saving image history:', err);
      }
    };

    // Debounce save to avoid too many writes
    const timeoutId = setTimeout(saveImageHistory, 500);
    return () => clearTimeout(timeoutId);
  }, [history, user?.uid, isGenerating]);

  const examplePrompts = [
    { text: 'Sourashtra silk weaving scene' },
    { text: 'Traditional wedding ceremony' },
    { text: 'Sourashtra script calligraphy' },
    { text: 'Kolam floor pattern' },
    { text: 'Temple architecture' },
    { text: 'Classical dance performance' },
    { text: 'Festival celebration' },
    { text: 'Traditional jewelry design' },
  ];

  // Upload image to Firebase Storage and return the download URL
  const uploadImageToStorage = async (base64Data, mimeType) => {
    if (!user?.uid) return null;
    
    const timestamp = Date.now();
    const extension = mimeType.includes('png') ? 'png' : 'jpg';
    // Use /users/{uid}/images/ path to match storage rules
    const filename = `users/${user.uid}/images/${timestamp}.${extension}`;
    const storageRef = ref(storage, filename);
    
    // Upload the base64 string
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    await uploadString(storageRef, dataUrl, 'data_url');
    
    // Get the download URL
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  };

  const generateImage = async (inputPrompt) => {
    const promptToUse = inputPrompt || prompt;
    if (!promptToUse.trim()) return;

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: promptToUse,
          aspectRatio,
          resolution,
          style,
          referenceImages: referenceImages.map(img => ({
            data: img.data,
            mimeType: img.mimeType,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();
      
      if (data.imageData) {
        const localImageUrl = `data:${data.imageData.mimeType};base64,${data.imageData.data}`;
        
        // Show the result immediately with local base64
        setResult({
          url: localImageUrl,
          prompt: promptToUse,
          enhancedPrompt: data.enhancedPrompt,
          text: data.text,
          settings: data.settings,
        });
        
        // Upload to Storage in background (only for logged-in users)
        if (user?.uid) {
          try {
            const storageUrl = await uploadImageToStorage(data.imageData.data, data.imageData.mimeType);
            
            if (storageUrl) {
              // Mark history as modified locally so it gets saved
              historyModifiedRef.current = true;
              setHistory(prev => [{
                url: storageUrl, // Use Storage URL for persistence
                prompt: promptToUse,
                settings: {
                  aspectRatio: data.settings?.aspectRatio || aspectRatio,
                  resolution: data.settings?.resolution || resolution,
                  style: data.settings?.style || style,
                },
                timestamp: new Date().toISOString(),
              }, ...prev].slice(0, 8));
            }
          } catch (uploadErr) {
            console.error('Failed to upload image to Storage:', uploadErr);
            // Still show the image, just won't be saved to history
          }
        }
      } else {
        setResult({
          prompt: promptToUse,
          enhancedPrompt: data.enhancedPrompt,
          text: data.text,
          settings: data.settings,
          url: null,
        });
      }
    } catch (err) {
      setError(err.message);
      console.error('Generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generateImage();
  };

  const downloadImage = () => {
    if (!result?.url) return;
    const link = document.createElement('a');
    link.href = result.url;
    link.download = `sourashtra-ai-${resolution}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReferenceUpload = async (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        continue;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`Image too large: ${file.name}\n\nMax size: 10MB`);
        continue;
      }

      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      newImages.push({
        name: file.name,
        dataUrl,
        data: dataUrl.split(',')[1], // base64 only
        mimeType: file.type,
      });
    }

    setReferenceImages(prev => [...prev, ...newImages].slice(0, 3)); // Max 3 reference images
    e.target.value = '';
  };

  const removeReferenceImage = (index) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="image-page">
      <div className="image-container">
        {/* Top: Prompt Input */}
        <div className="prompt-section">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleReferenceUpload}
            accept="image/*"
            multiple
            hidden
          />
          <div className="prompt-input-box">
            {/* Reference Images Preview - Inside Input Box */}
            {referenceImages.length > 0 && (
              <div className="reference-images-inside">
                {referenceImages.map((img, index) => (
                  <div key={index} className="reference-image-thumb">
                    <img src={img.dataUrl} alt={img.name} />
                    <button
                      type="button"
                      className="remove-reference"
                      onClick={() => removeReferenceImage(index)}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <form className="prompt-form" onSubmit={handleSubmit}>
              <button
                type="button"
                className="add-reference-btn-main"
                onClick={() => fileInputRef.current?.click()}
                title="Add reference images"
              >
                <Plus size={20} />
              </button>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want to create..."
                disabled={isGenerating}
              />
            <button 
              type="submit" 
              className="generate-btn"
              disabled={!prompt.trim() || isGenerating}
            >
              {isGenerating ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Create</span>
                </>
              )}
            </button>
            </form>
          </div>
        </div>

        {/* Main Content: Settings | Image | History */}
        <div className="main-content">
          {/* Left: Settings Panel */}
          <aside className="settings-panel">
            <div className="panel-header">
              <Settings size={14} />
              <span>Settings</span>
            </div>
            
            <div className="setting-group">
              <label>Resolution</label>
              <div className="resolution-options">
                {RESOLUTIONS.map(res => (
                  <button
                    key={res.value}
                    className={`option-btn ${resolution === res.value ? 'active' : ''}`}
                    onClick={() => setResolution(res.value)}
                    type="button"
                  >
                    {res.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label>Aspect Ratio</label>
              <div className="aspect-options">
                {ASPECT_RATIOS.map(ar => (
                  <button
                    key={ar.value}
                    className={`option-btn aspect-btn ${aspectRatio === ar.value ? 'active' : ''}`}
                    onClick={() => setAspectRatio(ar.value)}
                    type="button"
                    title={ar.label}
                  >
                    {ar.icon}
                    <span>{ar.value}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="setting-group">
              <label>Style</label>
              <div className="style-options">
                {STYLES.map(s => (
                  <button
                    key={s.value}
                    className={`option-btn style-btn ${style === s.value ? 'active' : ''}`}
                    onClick={() => setStyle(s.value)}
                    type="button"
                  >
                    {s.icon}
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </aside>

          {/* Center: Image Viewer */}
          <div className="image-viewer">
            {/* Default State - Examples */}
            {!result && !isGenerating && !error && (
              <div className="empty-state">
                <div className="empty-icon">
                  <Image size={32} />
                </div>
                <p>Enter a prompt to create an image</p>

                <div className="example-chips">
                  {examplePrompts.map((example, index) => (
                    <button
                      key={index}
                      className="example-chip"
                      onClick={() => {
                        setPrompt(example.text);
                        generateImage(example.text);
                      }}
                    >
                      {example.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State */}
            {isGenerating && (
              <div className="generating-state">
                <div className="generating-animation">
                  <div className="gen-orb">
                    <img 
                      src="https://firebasestorage.googleapis.com/v0/b/sourashtra-ai.firebasestorage.app/o/palkar-removebg-preview.png?alt=media&token=cdeccfaf-c19e-43d2-bb58-c853b0a4bd7d" 
                      alt="Generating"
                      className="gen-logo"
                    />
                  </div>
                  <div className="gen-rings">
                    <div className="gen-ring"></div>
                    <div className="gen-ring"></div>
                    <div className="gen-ring"></div>
                  </div>
                </div>
                <p className="generating-text">Creating your image...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="error-state">
                <AlertTriangle size={24} />
                <p>{error}</p>
                <button onClick={() => setError(null)} className="retry-btn">
                  Try Again
                </button>
              </div>
            )}

            {/* Result */}
            {result && !isGenerating && (
              <div className="result-container">
                {result.url ? (
                  <>
                    <div className="result-image">
                      <img src={result.url} alt={result.prompt} />
                      <div className="result-badge">{result.settings?.resolution || resolution}</div>
                    </div>
                    <div className="result-actions">
                      <button className="action-btn download-btn" onClick={downloadImage}>
                        <Download size={14} />
                        Download
                      </button>
                      <button 
                        className="action-btn new-btn" 
                        onClick={() => { setResult(null); setPrompt(''); }}
                      >
                        <Sparkles size={14} />
                        New
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="processing-state">
                    <Palette size={24} />
                    <p>{result.text || 'Processing...'}</p>
                    <button 
                      className="action-btn new-btn" 
                      onClick={() => { setResult(null); setPrompt(''); }}
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Creations - Below */}
        {history.length > 0 && (
          <div className="history-section">
            <div className="history-header">
              <span>Recent Creations</span>
            </div>
            <div className="history-grid">
              {history.map((item, index) => (
                <button
                  key={index}
                  className="history-item"
                  onClick={() => setResult({
                    url: item.url,
                    prompt: item.prompt,
                    settings: item.settings,
                  })}
                >
                  <img src={item.url} alt={item.prompt} />
                  <span className="history-res">{item.settings?.resolution || '1K'}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImagePage;
