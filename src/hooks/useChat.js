import { useState, useCallback, useEffect, useRef } from 'react';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config/api';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentChatName, setCurrentChatName] = useState('New Chat');
  const { user } = useAuth();
  const hasGeneratedName = useRef(false);

  // Load all chats list from Firestore
  useEffect(() => {
    const loadChats = async () => {
      if (!user?.uid) {
        setChats([]);
        setIsLoadingHistory(false);
        return;
      }

      try {
        const chatsRef = collection(db, 'users', user.uid, 'chats');
        const q = query(chatsRef, orderBy('updatedAt', 'desc'));
        const snapshot = await getDocs(q);
        
        const chatsList = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          chatsList.push({
            id: doc.id,
            name: data.name || 'New Chat',
            updatedAt: data.updatedAt,
            messageCount: data.messages?.length || 0,
          });
        });
        
        setChats(chatsList);
        
        // Always start with a fresh new chat (user can select existing chats from sidebar)
        const newChatId = `chat_${Date.now()}`;
        setCurrentChatId(newChatId);
        setCurrentChatName('New Chat');
        setMessages([]);
        hasGeneratedName.current = false;
      } catch (err) {
        console.error('Error loading chats:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChats();
  }, [user?.uid]);

  // Generate chat name after 2-3 user messages
  useEffect(() => {
    const generateChatName = async () => {
      if (!user?.uid || !currentChatId || hasGeneratedName.current) return;
      
      const userMessages = messages.filter(m => m.role === 'user');
      if (userMessages.length < 2) return;
      
      // Only use text content for name generation (strip attachments)
      const messagesForName = messages.map(m => ({
        role: m.role,
        content: m.content || ''
      })).filter(m => m.content);
      
      if (messagesForName.length < 2) return;
      
      try {
        const response = await fetch(`${API_URL}/generate-chat-name`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: messagesForName }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.name && data.name !== 'New Chat') {
            hasGeneratedName.current = true; // Only set after success
            setCurrentChatName(data.name);
            
            // Update in Firestore
            const chatRef = doc(db, 'users', user.uid, 'chats', currentChatId);
            await setDoc(chatRef, { name: data.name }, { merge: true });
            
            // Update chats list
            setChats(prev => prev.map(c => 
              c.id === currentChatId ? { ...c, name: data.name } : c
            ));
          }
        } else {
          console.error('Failed to generate chat name:', response.status);
        }
      } catch (err) {
        console.error('Error generating chat name:', err);
        // Don't set hasGeneratedName to true on error, allow retry
      }
    };

    // Debounce to avoid too many calls
    const timeoutId = setTimeout(generateChatName, 2000);
    return () => clearTimeout(timeoutId);
  }, [messages, user?.uid, currentChatId]);

  // Save chat to Firestore when messages change
  useEffect(() => {
    const saveChat = async () => {
      if (!user?.uid || !currentChatId || messages.length === 0 || isLoading) return;

      try {
        // Sanitize messages - save URLs instead of base64 data
        const sanitizedMessages = messages.map(msg => {
          const sanitized = {
            role: msg.role,
            content: msg.content || '',
          };
          
          // Save attachment metadata WITH URLs (not base64 data)
          if (msg.attachments && msg.attachments.length > 0) {
            sanitized.attachments = msg.attachments.map(att => ({
              name: att.name || 'file',
              type: att.type || 'file',
              mimeType: att.mimeType || 'application/octet-stream',
              url: att.url || null, // Save the Firebase Storage URL
              // Don't save the base64 data - it's too large
            }));
          }
          
          return sanitized;
        });

        const chatRef = doc(db, 'users', user.uid, 'chats', currentChatId);
        await setDoc(chatRef, {
          messages: sanitizedMessages,
          name: currentChatName,
          updatedAt: serverTimestamp(),
        }, { merge: true });
        
        // Update chats list
        setChats(prev => {
          const exists = prev.find(c => c.id === currentChatId);
          if (exists) {
            return prev.map(c => 
              c.id === currentChatId 
                ? { ...c, messageCount: messages.length, updatedAt: new Date() }
                : c
            );
          } else {
            return [{ 
              id: currentChatId, 
              name: currentChatName, 
              messageCount: messages.length,
              updatedAt: new Date()
            }, ...prev];
          }
        });
      } catch (err) {
        console.error('Error saving chat:', err);
      }
    };

    const timeoutId = setTimeout(saveChat, 1000);
    return () => clearTimeout(timeoutId);
  }, [messages, user?.uid, currentChatId, currentChatName, isLoading]);

  const sendMessage = useCallback(async (content, attachments = []) => {
    setIsLoading(true);
    setError(null);

    // Build message content with attachments
    let messageContent = content;
    const attachmentData = [];
    
    for (const attachment of attachments) {
      const attData = {
        type: attachment.type,
        name: attachment.name,
        data: attachment.data, // base64 for API call
        mimeType: attachment.mimeType,
      };
      
      // Upload to Firebase Storage if user is logged in
      if (user?.uid && currentChatId) {
        try {
          const timestamp = Date.now();
          const safeName = attachment.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const storagePath = `users/${user.uid}/chats/${currentChatId}/${timestamp}_${safeName}`;
          const storageRef = ref(storage, storagePath);
          
          // Upload as base64 data URL
          const dataUrl = `data:${attachment.mimeType};base64,${attachment.data}`;
          await uploadString(storageRef, dataUrl, 'data_url');
          
          // Get download URL
          const downloadUrl = await getDownloadURL(storageRef);
          attData.url = downloadUrl;
        } catch (err) {
          console.error('Error uploading attachment:', err);
          // Continue without URL - will still work for current session
        }
      }
      
      attachmentData.push(attData);
    }

    // Add user message immediately
    const userMessage = { 
      role: 'user', 
      content: messageContent,
      attachments: attachmentData.length > 0 ? attachmentData : undefined,
    };
    setMessages(prev => [...prev, userMessage]);

    // Add placeholder for assistant message
    const assistantMessage = { role: 'model', content: '' };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Call our secure backend
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          history: messages,
          attachments: attachmentData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                throw new Error(data.error);
              }
              if (data.text) {
                fullResponse += data.text;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: 'model',
                    content: fullResponse,
                  };
                  return updated;
                });
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err.message === 'Failed to fetch' 
        ? 'Unable to connect to the server. Please check your connection and try again.'
        : err.message;
      setError(errorMessage);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, user?.uid, currentChatId]);

  const startNewChat = useCallback(() => {
    const newChatId = `chat_${Date.now()}`;
    setCurrentChatId(newChatId);
    setCurrentChatName('New Chat');
    setMessages([]);
    hasGeneratedName.current = false;
    setError(null);
  }, []);

  const selectChat = useCallback(async (chatId) => {
    if (!user?.uid || chatId === currentChatId) return;
    
    try {
      const chatDoc = await getDoc(doc(db, 'users', user.uid, 'chats', chatId));
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        setCurrentChatId(chatId);
        setCurrentChatName(data.name || 'New Chat');
        setMessages(data.messages || []);
        hasGeneratedName.current = !!data.name && data.name !== 'New Chat';
        setError(null);
      }
    } catch (err) {
      console.error('Error loading chat:', err);
    }
  }, [user?.uid, currentChatId]);

  const deleteChat = useCallback(async (chatId) => {
    if (!user?.uid) return;
    
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'chats', chatId));
      setChats(prev => prev.filter(c => c.id !== chatId));
      
      // If deleting current chat, switch to another or create new
      if (chatId === currentChatId) {
        const remainingChats = chats.filter(c => c.id !== chatId);
        if (remainingChats.length > 0) {
          selectChat(remainingChats[0].id);
        } else {
          startNewChat();
        }
      }
    } catch (err) {
      console.error('Error deleting chat:', err);
    }
  }, [user?.uid, currentChatId, chats, selectChat, startNewChat]);

  const clearCurrentChat = useCallback(async () => {
    setMessages([]);
    setError(null);
    hasGeneratedName.current = false;
    setCurrentChatName('New Chat');

    if (user?.uid && currentChatId) {
      try {
        const chatRef = doc(db, 'users', user.uid, 'chats', currentChatId);
        await setDoc(chatRef, {
          messages: [],
          name: 'New Chat',
          updatedAt: serverTimestamp(),
        });
        
        setChats(prev => prev.map(c => 
          c.id === currentChatId ? { ...c, name: 'New Chat', messageCount: 0 } : c
        ));
      } catch (err) {
        console.error('Error clearing chat:', err);
      }
    }
  }, [user?.uid, currentChatId]);

  const renameChat = useCallback(async (chatId, newName) => {
    if (!user?.uid || !newName.trim()) return;
    
    const trimmedName = newName.trim();
    
    try {
      const chatRef = doc(db, 'users', user.uid, 'chats', chatId);
      await setDoc(chatRef, { name: trimmedName }, { merge: true });
      
      // Update current chat name if renaming current chat
      if (chatId === currentChatId) {
        setCurrentChatName(trimmedName);
        hasGeneratedName.current = true; // Prevent auto-generation
      }
      
      // Update chats list
      setChats(prev => prev.map(c => 
        c.id === chatId ? { ...c, name: trimmedName } : c
      ));
    } catch (err) {
      console.error('Error renaming chat:', err);
    }
  }, [user?.uid, currentChatId]);

  return {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    chats,
    currentChatId,
    currentChatName,
    sendMessage,
    startNewChat,
    selectChat,
    deleteChat,
    clearCurrentChat,
    renameChat,
    setMessages,
  };
}
