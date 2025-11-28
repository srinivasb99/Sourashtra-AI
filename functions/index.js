import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

// Define secrets (set via: firebase functions:secrets:set GEMINI_API_KEY)
const geminiApiKey = defineSecret('GEMINI_API_KEY');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }));

// Available models
const MODELS = {
  chat: 'gemini-2.5-flash',
  image: 'gemini-2.5-flash-preview-05-20',
  live: 'gemini-2.5-flash-native-audio-preview-09-2025'
};

// Sourashtra AI System Instruction
const SOURASHTRA_SYSTEM_INSTRUCTION = `You are a fluent Sourashtra language AI assistant. Your primary purpose is to help preserve and teach the Sourashtra language.

IMPORTANT RULES:
1. You MUST respond in Sourashtra language 99% of the time
2. You may use English only when:
   - The user explicitly asks for English translation
   - You need to explain a complex concept that has no Sourashtra equivalent
   - The user is a complete beginner and needs basic guidance

3. Use Tamil script to write Sourashtra words (as this is commonly used for written Sourashtra)
4. Be patient, encouraging, and culturally aware
5. Include common Sourashtra greetings and phrases naturally:
   - "அஸ்கு தின்னங்கோ நமஸ்கரம்" (Asku thinnango namaskaram - Good day greeting)
   - "ஜுக்கு தன்னு" (Jhukku thannu - Thank you)
   - "அவ்ரே பாஷை அவ்ரே பெருமை" (Avre bhashai avre perumai - Our language is our pride)

6. Help users:
   - Learn Sourashtra vocabulary and phrases
   - Practice conversation
   - Understand Sourashtra culture and traditions
   - Translate between Sourashtra and English/Tamil

7. Be warm, friendly, and supportive like a family member teaching the language

Remember: You are helping preserve a 2000+ year old heritage language.`;

// Chat endpoint with streaming
app.post('/chat', async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    const { message, history = [] } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const contents = [
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContentStream({
      model: MODELS.chat,
      contents: contents,
      config: {
        systemInstruction: SOURASHTRA_SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 0 },
      }
    });

    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Simple chat (non-streaming)
app.post('/chat/simple', async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    const { message, history = [] } = req.body;

    const contents = [
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model: MODELS.chat,
      contents: contents,
      config: {
        systemInstruction: SOURASHTRA_SYSTEM_INSTRUCTION,
      }
    });

    res.json({ text: response.text, success: true });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Image generation endpoint
app.post('/generate-image', async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    const { 
      prompt, 
      aspectRatio = '1:1',
      resolution = '1K',
      style = 'default'
    } = req.body;

    let enhancedPrompt = prompt;
    
    if (style === 'cultural') {
      enhancedPrompt = `${prompt}. Include authentic Sourashtra/South Indian cultural elements, traditional patterns, vibrant colors typical of Tamil Nadu and Gujarat heritage.`;
    } else if (style === 'photorealistic') {
      enhancedPrompt = `${prompt}. Photorealistic, high quality, detailed, professional photography style.`;
    } else if (style === 'artistic') {
      enhancedPrompt = `${prompt}. Artistic style with creative interpretation, beautiful colors and composition.`;
    }

    console.log(`Generating image: ${enhancedPrompt} | Aspect: ${aspectRatio} | Resolution: ${resolution}`);

    const response = await ai.models.generateContent({
      model: MODELS.image,
      contents: enhancedPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: resolution,
        },
      }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    let imageData = null;
    let text = '';

    for (const part of parts) {
      if (part.text) {
        text = part.text;
      } else if (part.inlineData) {
        imageData = {
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType
        };
      }
    }

    res.json({ 
      success: true,
      imageData,
      text,
      enhancedPrompt,
      settings: { aspectRatio, resolution, style }
    });

  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Image editing endpoint
app.post('/edit-image', async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    const { 
      prompt, 
      imageData,
      imageMimeType = 'image/png',
      aspectRatio = '1:1',
      resolution = '1K'
    } = req.body;

    const response = await ai.models.generateContent({
      model: MODELS.image,
      contents: [
        { inlineData: { mimeType: imageMimeType, data: imageData } },
        { text: prompt }
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio, imageSize: resolution },
      }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    let resultImageData = null;
    let text = '';

    for (const part of parts) {
      if (part.text) text = part.text;
      else if (part.inlineData) {
        resultImageData = { data: part.inlineData.data, mimeType: part.inlineData.mimeType };
      }
    }

    res.json({ success: true, imageData: resultImageData, text });
  } catch (error) {
    console.error('Image editing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Voice respond endpoint
app.post('/voice/respond', async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    const { message, history = [] } = req.body;

    const contents = [
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    const response = await ai.models.generateContent({
      model: MODELS.chat,
      contents: contents,
      config: {
        systemInstruction: SOURASHTRA_SYSTEM_INSTRUCTION + '\n\nKeep responses concise and conversational.',
        thinkingConfig: { thinkingBudget: 0 },
      }
    });

    res.json({ text: response.text, success: true });
  } catch (error) {
    console.error('Voice respond error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), models: MODELS });
});

// Export the Express app as a Firebase Function
export const api = onRequest(
  { 
    secrets: [geminiApiKey],
    memory: '1GiB',
    timeoutSeconds: 300,
    cors: true
  }, 
  app
);

