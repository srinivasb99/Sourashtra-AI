import { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../context/AuthContext';
import './ChatPage.css';

function ChatPage() {
  const { messages, isLoading, error, sendMessage, clearMessages } = useChat();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  const quickPrompts = [
    { emoji: '👋', text: 'நமஸ்கரம்! எப்படி இருக்கீங்க?' },
    { emoji: '📚', text: 'Teach me basic Sourashtra greetings' },
    { emoji: '🗣️', text: 'How do I say "How are you?" in Sourashtra?' },
    { emoji: '🏠', text: 'Tell me about Sourashtra culture' },
  ];

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Sidebar */}
        <aside className="chat-sidebar">
          <div className="sidebar-header">
            <h3>💬 Chat History</h3>
            {messages.length > 0 && (
              <button className="clear-btn" onClick={clearMessages}>
                Clear
              </button>
            )}
          </div>
          {user ? (
            <div className="saved-chats">
              <p className="sidebar-note">Your chats are automatically saved</p>
            </div>
          ) : (
            <div className="sidebar-note">
              <p>Sign in to save your chat history</p>
            </div>
          )}
        </aside>

        {/* Main Chat Area */}
        <main className="chat-main">
          <div className="messages-container">
            {messages.length === 0 ? (
              <div className="chat-welcome">
                <div className="welcome-icon">ஃ</div>
                <h2>அஸ்கு தின்னங்கோ நமஸ்கரம்!</h2>
                <p>Start a conversation in Sourashtra or English. I'll respond primarily in Sourashtra to help you learn and practice.</p>
                
                <div className="quick-prompts">
                  {quickPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      className="quick-prompt"
                      onClick={() => sendMessage(prompt.text)}
                    >
                      <span className="prompt-emoji">{prompt.emoji}</span>
                      <span className="prompt-text">{prompt.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="messages-list">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
                  >
                    <div className="message-avatar">
                      {message.role === 'user' ? (
                        user?.photoURL ? (
                          <img src={user.photoURL} alt="You" />
                        ) : (
                          <span>👤</span>
                        )
                      ) : (
                        <span className="ai-avatar">ஃ</span>
                      )}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-sender">
                          {message.role === 'user' ? 'You' : 'Sourashtra AI'}
                        </span>
                      </div>
                      <div className="message-text">
                        {message.content || (
                          <span className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <form className="chat-input-area" onSubmit={handleSubmit}>
            <div className="input-wrapper">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message in Sourashtra or English..."
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className="send-btn"
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                )}
              </button>
            </div>
            {error && <p className="error-message">{error}</p>}
            <p className="input-hint">
              Press Enter to send • Sourashtra AI responds primarily in Sourashtra
            </p>
          </form>
        </main>
      </div>
    </div>
  );
}

export default ChatPage;

