import { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../context/AuthContext';
import { 
  MessageCircle, Book, MessageSquare, Home, ArrowUp, 
  Plus, Trash2, X, FileText, Image as ImageIcon, Video, Pencil, Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import './ChatPage.css';

// Allowed file types
const ALLOWED_TYPES = {
  'image/jpeg': { icon: ImageIcon, label: 'Image' },
  'image/png': { icon: ImageIcon, label: 'Image' },
  'image/gif': { icon: ImageIcon, label: 'Image' },
  'image/webp': { icon: ImageIcon, label: 'Image' },
  'video/mp4': { icon: Video, label: 'Video' },
  'video/webm': { icon: Video, label: 'Video' },
  'video/quicktime': { icon: Video, label: 'Video' },
  'application/pdf': { icon: FileText, label: 'PDF' },
  'application/msword': { icon: FileText, label: 'Document' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: FileText, label: 'Document' },
  'application/vnd.ms-powerpoint': { icon: FileText, label: 'Presentation' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { icon: FileText, label: 'Presentation' },
  'text/plain': { icon: FileText, label: 'Text' },
};

function ChatPage() {
  const { 
    messages, isLoading, isLoadingHistory, error, 
    chats, currentChatId, currentChatName,
    sendMessage, startNewChat, selectChat, deleteChat, clearCurrentChat, renameChat 
  } = useChat();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const renameInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      sendMessage(input.trim(), attachments);
      setInput('');
      setAttachments([]);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = [];

    for (const file of files) {
      if (!ALLOWED_TYPES[file.type]) {
        alert(`File type not supported: ${file.name}\n\nAllowed: Images, Videos, PDFs, Word docs, Text files`);
        continue;
      }

      if (file.size > 20 * 1024 * 1024) { // 20MB limit
        alert(`File too large: ${file.name}\n\nMax size: 20MB`);
        continue;
      }

      // Convert to base64
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      newAttachments.push({
        name: file.name,
        type: file.type.split('/')[0],
        mimeType: file.type,
        data: dataUrl.split(',')[1], // base64 only for API
        dataUrl, // full data URL for preview
        size: file.size,
      });
    }

    setAttachments(prev => [...prev, ...newAttachments].slice(0, 5)); // Max 5 attachments
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const quickPrompts = [
    { icon: <MessageSquare size={16} />, text: 'Say hello in Sourashtra' },
    { icon: <Book size={16} />, text: 'Teach me basic Sourashtra greetings' },
    { icon: <MessageCircle size={16} />, text: 'How do I say "How are you?" in Sourashtra?' },
    { icon: <Home size={16} />, text: 'Tell me about Sourashtra culture' },
  ];

  const getAttachmentIcon = (mimeType) => {
    const IconComponent = ALLOWED_TYPES[mimeType]?.icon || FileText;
    return <IconComponent size={14} />;
  };

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Sidebar */}
        <aside className="chat-sidebar">
          <div className="sidebar-header">
            <h3>Chats</h3>
            <button className="new-chat-btn" onClick={startNewChat} title="New chat">
              <Plus size={18} />
            </button>
          </div>

          <div className="chats-list">
            {user ? (
              <>
                {chats.length === 0 && messages.length === 0 ? (
                  <p className="sidebar-note">Start a conversation to begin</p>
                ) : (
                  <>
                    {/* Current chat if new */}
                    {currentChatId && !chats.find(c => c.id === currentChatId) && messages.length > 0 && (
                      <div className="chat-item active">
                        <MessageCircle size={16} />
                        <span className="chat-name">{currentChatName}</span>
                      </div>
                    )}
                    
                    {/* Saved chats */}
                    {chats.map(chat => (
                      <div 
                        key={chat.id}
                        className={`chat-item ${chat.id === currentChatId ? 'active' : ''}`}
                        onClick={() => editingChatId !== chat.id && selectChat(chat.id)}
                      >
                        <MessageCircle size={16} />
                        {editingChatId === chat.id ? (
                          <input
                            ref={renameInputRef}
                            type="text"
                            className="chat-rename-input"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                renameChat(chat.id, editingName);
                                setEditingChatId(null);
                              } else if (e.key === 'Escape') {
                                setEditingChatId(null);
                              }
                            }}
                            onBlur={() => {
                              if (editingName.trim()) {
                                renameChat(chat.id, editingName);
                              }
                              setEditingChatId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        ) : (
                          <span className="chat-name">{chat.name}</span>
                        )}
                        <div className="chat-item-actions">
                          {editingChatId === chat.id ? (
                            <button 
                              className="save-rename-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                renameChat(chat.id, editingName);
                                setEditingChatId(null);
                              }}
                              title="Save"
                            >
                              <Check size={14} />
                            </button>
                          ) : (
                            <button 
                              className="rename-chat-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChatId(chat.id);
                                setEditingName(chat.name);
                              }}
                              title="Rename chat"
                            >
                              <Pencil size={14} />
                            </button>
                          )}
                          <button 
                            className="delete-chat-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(chat.id);
                            }}
                            title="Delete chat"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show save notice only if no saved chats */}
                    {chats.length === 0 && (
                      <p className="sidebar-note small">Chats save automatically</p>
                    )}
                  </>
                )}
              </>
            ) : (
              <p className="sidebar-note">Sign in to save your chat history</p>
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="chat-main">
          <div className="messages-container">
            {isLoadingHistory ? (
              <div className="chat-welcome">
                <div className="loading-history">
                  <img 
                    src="https://firebasestorage.googleapis.com/v0/b/sourashtra-ai.firebasestorage.app/o/palkar-removebg-preview.png?alt=media&token=cdeccfaf-c19e-43d2-bb58-c853b0a4bd7d" 
                    alt="Sourashtra AI" 
                    className="welcome-logo"
                  />
                  <p>Loading your chats...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="chat-welcome">
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/sourashtra-ai.firebasestorage.app/o/palkar-removebg-preview.png?alt=media&token=cdeccfaf-c19e-43d2-bb58-c853b0a4bd7d" 
                  alt="Sourashtra AI" 
                  className="welcome-logo"
                />
                <h2>Sourashtra AI</h2>
                <p className="welcome-subtitle">Learn and practice Sourashtra language through conversation</p>
                
                <div className="quick-prompts">
                  {quickPrompts.map((prompt, index) => (
                    <button
                      key={index}
                      className="quick-prompt"
                      onClick={() => sendMessage(prompt.text)}
                    >
                      <span className="prompt-icon">{prompt.icon}</span>
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
                    {message.role !== 'user' && (
                      <div className="message-avatar">
                        <img 
                          src="https://firebasestorage.googleapis.com/v0/b/sourashtra-ai.firebasestorage.app/o/palkar-removebg-preview.png?alt=media&token=cdeccfaf-c19e-43d2-bb58-c853b0a4bd7d" 
                          alt="AI" 
                          className="ai-avatar-img"
                        />
                      </div>
                    )}
                    <div className="message-content">
                      {/* Show attachments if any */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="message-attachments-preview">
                          {message.attachments.map((att, i) => {
                            const type = att.mimeType?.split('/')[0] || att.type;
                            const hasData = att.data && att.data !== 'undefined';
                            const hasUrl = att.url && att.url !== 'null';
                            
                            // Determine the source URL - prefer base64 for current session, URL for loaded
                            const sourceUrl = hasData 
                              ? `data:${att.mimeType};base64,${att.data}` 
                              : hasUrl 
                                ? att.url 
                                : null;
                            
                            // If no source available, show a badge
                            if (!sourceUrl) {
                              return (
                                <div key={i} className="msg-attachment-badge">
                                  {getAttachmentIcon(att.mimeType)}
                                  <span>{att.name}</span>
                                </div>
                              );
                            }
                            
                            if (type === 'image') {
                              return (
                                <div key={i} className="msg-attachment-image">
                                  <img src={sourceUrl} alt={att.name} />
                                </div>
                              );
                            } else if (type === 'video') {
                              return (
                                <div key={i} className="msg-attachment-video">
                                  <video src={sourceUrl} controls />
                                </div>
                              );
                            } else {
                              // For files (PDFs, docs), show download link if URL available
                              return (
                                <a 
                                  key={i} 
                                  href={sourceUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="msg-attachment-file"
                                  download={att.name}
                                >
                                  {getAttachmentIcon(att.mimeType)}
                                  <div className="msg-attachment-info">
                                    <span className="msg-attachment-name">{att.name}</span>
                                    <span className="msg-attachment-type">{ALLOWED_TYPES[att.mimeType]?.label || 'File'}</span>
                                  </div>
                                </a>
                              );
                            }
                          })}
                        </div>
                      )}
                      <div className="message-text">
                        {message.content ? (
                          <div className="markdown-content">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                              components={{
                                // Custom code block rendering
                                code({ node, inline, className, children, ...props }) {
                                  return inline ? (
                                    <code className="inline-code" {...props}>{children}</code>
                                  ) : (
                                    <pre className="code-block">
                                      <code className={className} {...props}>{children}</code>
                                    </pre>
                                  );
                                },
                                // Open links in new tab
                                a({ node, children, ...props }) {
                                  return <a target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                                }
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
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
          <div className="chat-input-area">
            <form className="input-form" onSubmit={handleSubmit}>
              <div className="input-box">
                {/* Attachments Preview - Inside Input Box */}
                {attachments.length > 0 && (
                  <div className="attachments-inside">
                    {attachments.map((att, index) => (
                      att.type === 'image' ? (
                        // Image preview
                        <div key={index} className="attachment-image">
                          <img src={att.dataUrl} alt={att.name} />
                          <button 
                            type="button"
                            className="attachment-remove-img"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeAttachment(index);
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : att.type === 'video' ? (
                        // Video preview with playback controls
                        <div key={index} className="attachment-video">
                          <video src={att.dataUrl} controls />
                          <button 
                            type="button"
                            className="attachment-remove-video"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeAttachment(index);
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        // File card for other files
                        <div key={index} className="attachment-card">
                          <div className="attachment-icon">
                            {getAttachmentIcon(att.mimeType)}
                          </div>
                          <div className="attachment-info">
                            <span className="attachment-name">{att.name}</span>
                            <span className="attachment-type">{ALLOWED_TYPES[att.mimeType]?.label || 'File'}</span>
                          </div>
                          <button 
                            type="button"
                            className="attachment-remove"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeAttachment(index);
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )
                    ))}
                  </div>
                )}

                {/* Input Row */}
                <div className="input-row">
                  <button 
                    type="button" 
                    className="add-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    title="Add files"
                  >
                    <Plus size={20} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"
                    multiple
                    hidden
                  />
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything"
                    disabled={isLoading}
                  />
                  <button 
                    type="submit" 
                    className="send-btn"
                    disabled={(!input.trim() && attachments.length === 0) || isLoading}
                  >
                    {isLoading ? (
                      <span className="loading-spinner"></span>
                    ) : (
                      <ArrowUp size={20} />
                    )}
                  </button>
                </div>
              </div>
            </form>
            {error && <p className="error-message">{error}</p>}
          </div>
        </main>
      </div>
    </div>
  );
}

export default ChatPage;
