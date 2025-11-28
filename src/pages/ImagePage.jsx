import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config/api';
import './ImagePage.css';

// Available options
const ASPECT_RATIOS = [
  { value: '1:1', label: 'Square (1:1)', icon: '⬜' },
  { value: '16:9', label: 'Landscape (16:9)', icon: '🖼️' },
  { value: '9:16', label: 'Portrait (9:16)', icon: '📱' },
  { value: '4:3', label: 'Standard (4:3)', icon: '🖥️' },
  { value: '3:4', label: 'Portrait (3:4)', icon: '📷' },
  { value: '3:2', label: 'Photo (3:2)', icon: '📸' },
  { value: '2:3', label: 'Portrait Photo (2:3)', icon: '🎞️' },
  { value: '21:9', label: 'Ultra Wide (21:9)', icon: '🎬' },
];

const RESOLUTIONS = [
  { value: '1K', label: '1K (Standard)', desc: 'Fast generation' },
  { value: '2K', label: '2K (High Quality)', desc: 'Balanced quality' },
  { value: '4K', label: '4K (Ultra HD)', desc: 'Maximum detail' },
];

const STYLES = [
  { value: 'default', label: 'Default', icon: '✨', desc: 'AI chooses best style' },
  { value: 'cultural', label: 'Cultural', icon: '🎭', desc: 'Sourashtra heritage themes' },
  { value: 'photorealistic', label: 'Photorealistic', icon: '📷', desc: 'Photo-like quality' },
  { value: 'artistic', label: 'Artistic', icon: '🎨', desc: 'Creative interpretation' },
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const examplePrompts = [
    {
      emoji: '🏛️',
      text: 'Traditional Sourashtra silk weaving scene with intricate patterns',
      description: 'Classic heritage art'
    },
    {
      emoji: '🎭',
      text: 'Sourashtra traditional wedding ceremony with ornate decorations',
      description: 'Cultural celebration'
    },
    {
      emoji: '🎨',
      text: 'Modern abstract art featuring Sourashtra script calligraphy',
      description: 'Contemporary design'
    },
    {
      emoji: '🌸',
      text: 'Colorful Kolam floor pattern with Sourashtra cultural motifs',
      description: 'Traditional floor art'
    },
  ];

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
          style
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();
      
      if (data.imageData) {
        const imageUrl = `data:${data.imageData.mimeType};base64,${data.imageData.data}`;
        setResult({
          url: imageUrl,
          prompt: promptToUse,
          enhancedPrompt: data.enhancedPrompt,
          text: data.text,
          settings: data.settings,
        });
        
        setHistory(prev => [{
          url: imageUrl,
          prompt: promptToUse,
          settings: data.settings,
          timestamp: new Date().toISOString(),
        }, ...prev].slice(0, 12));
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

  return (
    <div className="image-page">
      <div className="image-container">
        <div className="image-header">
          <h1>🎨 Image Generation</h1>
          <p>Create beautiful images with Sourashtra cultural themes • Powered by Gemini</p>
        </div>

        <div className="image-main">
          <div className="generation-area">
            <form className="prompt-form" onSubmit={handleSubmit}>
              <div className="prompt-input-wrapper">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to create..."
                  disabled={isGenerating}
                  rows={3}
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
                      <span>✨</span>
                      <span>Generate</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Settings */}
            <div className="generation-settings">
              <button 
                className="toggle-advanced"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? '▼' : '▶'} Generation Settings
              </button>

              {showAdvanced && (
                <div className="settings-panel">
                  {/* Resolution */}
                  <div className="setting-group">
                    <label>Resolution</label>
                    <div className="resolution-options">
                      {RESOLUTIONS.map(res => (
                        <button
                          key={res.value}
                          className={`resolution-btn ${resolution === res.value ? 'active' : ''}`}
                          onClick={() => setResolution(res.value)}
                          type="button"
                        >
                          <span className="res-label">{res.label}</span>
                          <span className="res-desc">{res.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio */}
                  <div className="setting-group">
                    <label>Aspect Ratio</label>
                    <div className="aspect-options">
                      {ASPECT_RATIOS.map(ar => (
                        <button
                          key={ar.value}
                          className={`aspect-btn ${aspectRatio === ar.value ? 'active' : ''}`}
                          onClick={() => setAspectRatio(ar.value)}
                          type="button"
                          title={ar.label}
                        >
                          <span className="aspect-icon">{ar.icon}</span>
                          <span className="aspect-value">{ar.value}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Style */}
                  <div className="setting-group">
                    <label>Style</label>
                    <div className="style-options">
                      {STYLES.map(s => (
                        <button
                          key={s.value}
                          className={`style-btn ${style === s.value ? 'active' : ''}`}
                          onClick={() => setStyle(s.value)}
                          type="button"
                        >
                          <span className="style-icon">{s.icon}</span>
                          <span className="style-label">{s.label}</span>
                          <span className="style-desc">{s.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Example Prompts */}
            {!result && !isGenerating && (
              <div className="example-prompts">
                <h3>Try these examples:</h3>
                <div className="examples-grid">
                  {examplePrompts.map((example, index) => (
                    <button
                      key={index}
                      className="example-btn"
                      onClick={() => {
                        setPrompt(example.text);
                        generateImage(example.text);
                      }}
                    >
                      <span className="example-emoji">{example.emoji}</span>
                      <span className="example-text">{example.text}</span>
                      <span className="example-desc">{example.description}</span>
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
                      src="https://firebasestorage.googleapis.com/v0/b/sourashtra-ai.firebasestorage.app/o/palkar.png?alt=media&token=9284aeb3-8cbd-4cc1-bed3-35d9f889283a" 
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
                <p className="generating-text">Creating your {resolution} image...</p>
                <p className="generating-hint">This may take a moment for higher resolutions</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="error-state">
                <span className="error-icon">⚠️</span>
                <p>{error}</p>
                <button onClick={() => setError(null)} className="retry-btn">
                  Try Again
                </button>
              </div>
            )}

            {/* Result */}
            {result && !isGenerating && (
              <div className="generated-result">
                {result.url ? (
                  <>
                    <div className="result-image">
                      <img src={result.url} alt={result.prompt} />
                      <div className="result-badge">
                        {result.settings?.resolution || resolution}
                      </div>
                    </div>
                    <div className="result-info">
                      <p className="result-prompt">"{result.prompt}"</p>
                      {result.enhancedPrompt && result.enhancedPrompt !== result.prompt && (
                        <p className="enhanced-prompt">
                          <strong>Enhanced:</strong> {result.enhancedPrompt}
                        </p>
                      )}
                      <div className="result-actions">
                        <button className="action-btn download-btn" onClick={downloadImage}>
                          <span>⬇️</span>
                          <span>Download {resolution}</span>
                        </button>
                        <button 
                          className="action-btn new-btn" 
                          onClick={() => {
                            setResult(null);
                            setPrompt('');
                          }}
                        >
                          <span>✨</span>
                          <span>New Image</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="result-card">
                    <div className="coming-soon-notice">
                      <span className="notice-icon">🎨</span>
                      <h4>Image Generation Processing</h4>
                      <p>{result.text || 'Your image is being generated...'}</p>
                      {result.enhancedPrompt && (
                        <div className="copy-prompt">
                          <p><strong>Enhanced prompt:</strong> {result.enhancedPrompt}</p>
                          <button 
                            onClick={() => navigator.clipboard.writeText(result.enhancedPrompt)}
                            className="copy-btn"
                          >
                            📋 Copy Prompt
                          </button>
                        </div>
                      )}
                    </div>
                    <button 
                      className="action-btn new-btn" 
                      onClick={() => {
                        setResult(null);
                        setPrompt('');
                      }}
                    >
                      <span>✨</span>
                      <span>Try Again</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* History Sidebar */}
          {history.length > 0 && (
            <aside className="history-sidebar">
              <h3>Recent Creations</h3>
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
              {!user && (
                <p className="history-note">
                  Sign in to save your images permanently
                </p>
              )}
            </aside>
          )}
        </div>

        {/* Features */}
        <div className="image-features">
          <div className="feature-item">
            <span className="feature-icon">🎭</span>
            <h4>Cultural Themes</h4>
            <p>Generate images with authentic Sourashtra cultural elements</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">4️⃣K</span>
            <h4>Up to 4K Resolution</h4>
            <p>Create ultra HD images with stunning detail</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🆓</span>
            <h4>Completely Free</h4>
            <p>Generate unlimited images at no cost</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImagePage;
