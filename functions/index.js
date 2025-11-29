import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import express from 'express';
import cors from 'cors';
import { GoogleGenAI, Modality } from '@google/genai';
import admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Define secrets (set via: firebase functions:secrets:set GEMINI_API_KEY)
const geminiApiKey = defineSecret('GEMINI_API_KEY');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }));

// Create a router for /api routes
const router = express.Router();

// Available models
const MODELS = {
  chat: 'gemini-flash-latest',
  chatLite: 'gemini-flash-lite-latest',
  image: 'gemini-3-pro-image-preview',
  live: 'gemini-2.5-flash-native-audio-preview-09-2025'
};

// Sourashtra AI System Instruction
const SOURASHTRA_SYSTEM_INSTRUCTION = `SOURASHTRA DICTIONARY
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

SOURASHTRA DICTIONARY:

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




You are a fluent Sourashtra language AI assistant. Your purpose is to help preserve and teach the Sourashtra language.

RULES:

Respond in Sourashtra 99 percent of the time.

Use English only when the user asks for translation or when explaining a concept that Sourashtra does not have words for.

Write Sourashtra words in Roman script only.

Be patient, friendly, and culturally aware.

Use common Sourashtra greetings and phrases naturally:

Asku thinnango namaskaram

Jhukku thannu

Avre bhashai avre perumai

Help users learn vocabulary, phrases, conversation, culture, and translation.

Speak like a supportive family member teaching the language.

Your goal is to preserve the Sourashtra language and make learning enjoyable.`;

// Chat endpoint with streaming (supports multimodal: images, videos, files)
router.post('/chat', async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    const { message, history = [], attachments = [] } = req.body;

    console.log('Chat request received:', { 
      message, 
      historyLength: history.length,
      attachmentsCount: attachments.length 
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Helper to build parts array for a message
    const buildParts = (content, msgAttachments = []) => {
      const parts = [];
      
      // Add attachments first (Gemini prefers media before text)
      for (const att of msgAttachments) {
        if (att.data && att.mimeType) {
          parts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data // base64 encoded
            }
          });
        }
      }
      
      // Add text content
      if (content) {
        parts.push({ text: content });
      }
      
      return parts;
    };

    // Build contents with proper role mapping and attachments
    const contents = [
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: buildParts(msg.content, msg.attachments)
      })),
      { 
        role: 'user', 
        parts: buildParts(message, attachments)
      }
    ];

    const response = await ai.models.generateContentStream({
      model: MODELS.chat,
      contents: contents,
      config: {
        systemInstruction: SOURASHTRA_SYSTEM_INSTRUCTION,
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
router.post('/chat/simple', async (req, res) => {
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
router.post('/generate-image', async (req, res) => {
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
      enhancedPrompt = `${prompt}. Include authentic Sourashtra/South Indian cultural elements, traditional patterns, and vibrant colors.`;
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
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: resolution,
        },
      }
    });

    // Parse response - check both old and new response formats
    let imageData = null;
    let text = '';
    
    // Try new format first (response.candidates)
    const parts = response.candidates?.[0]?.content?.parts || response.parts || [];

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
router.post('/edit-image', async (req, res) => {
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
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        imageConfig: { aspectRatio, imageSize: resolution },
      }
    });

    const parts = response.candidates?.[0]?.content?.parts || response.parts || [];
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

// Voice respond endpoint (text-to-text, client handles TTS)
// Note: For real-time audio streaming, use the Live API directly from client
// with WebSockets. Cloud Functions can't maintain persistent WebSocket connections.
router.post('/voice/respond', async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    const { message, history = [] } = req.body;

    const contents = [
      ...history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      { role: 'user', parts: [{ text: message }] }
    ];

    // Use chat model for voice responses - keep them concise
    const voiceSystemInstruction = SOURASHTRA_SYSTEM_INSTRUCTION + `

VOICE RESPONSE GUIDELINES:
- Keep responses SHORT and CONCISE (1-3 sentences max)
- Use simple, conversational language
- Avoid complex sentences or long explanations
- Be warm and encouraging
- Respond naturally as if speaking in a conversation`;

    const response = await ai.models.generateContent({
      model: MODELS.chat,
      contents: contents,
      config: {
        systemInstruction: voiceSystemInstruction,
      }
    });

    res.json({ text: response.text, success: true });
  } catch (error) {
    console.error('Voice respond error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to create token for Live API (client-side WebSocket connection)
// Returns API key directly since ephemeral tokens require specific setup
router.post('/live/token', async (req, res) => {
  try {
    const key = geminiApiKey.value();
    if (!key) {
      console.error('GEMINI_API_KEY secret not configured');
      return res.status(500).json({ success: false, error: 'API key not configured' });
    }

    const now = new Date();
    const expireTime = new Date(now.getTime() + (30 * 60 * 1000)); // 30 minutes from now

    // Voice-specific system instruction in English
    const voiceSystemInstruction = `You are a friendly Sourashtra language AI assistant helping preserve and teach the Sourashtra language.

IMPORTANT: Always respond in ENGLISH. You are helping users learn Sourashtra, so explain things in English.

Your role:
- Help users learn Sourashtra vocabulary and phrases
- Explain Sourashtra words and their meanings in English
- Practice conversation and pronunciation
- Share Sourashtra culture and traditions
- Translate between Sourashtra and English

When teaching Sourashtra words, say them phonetically in English so users can understand the pronunciation.

VOICE MODE RULES:
- Keep responses SHORT (1-3 sentences max)
- Sound natural and conversational
- Be warm, encouraging, and patient
- You're like a friendly family member teaching the language

Remember: You are helping preserve a 2000+ year old heritage language. "Avre bhashai avre perumai" - Our language is our pride.`;

    res.json({ 
      success: true, 
      token: key,
      model: `models/${MODELS.live}`,
      expireTime: expireTime.toISOString(),
      systemInstruction: voiceSystemInstruction
    });
  } catch (error) {
    console.error('Live token error:', error);
    res.status(500).json({ success: false, error: error.message || 'Unknown error' });
  }
});

// Generate chat name from conversation history
router.post('/generate-chat-name', async (req, res) => {
  try {
    const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });
    const { messages } = req.body;

    if (!messages || messages.length < 2) {
      return res.json({ name: 'New Chat', success: true });
    }

    // Take first few messages for context
    const context = messages.slice(0, 6).map(m => 
      `${m.role === 'user' ? 'User' : 'AI'}: ${m.content.substring(0, 200)}`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: MODELS.chatLite,
      contents: `Based on this conversation, generate a very short chat title (2-5 words max). Just return the title, nothing else.

Conversation:
${context}

Title:`,
    });

    const name = response.text?.trim().replace(/^["']|["']$/g, '') || 'New Chat';
    res.json({ name: name.substring(0, 50), success: true });
  } catch (error) {
    console.error('Generate chat name error:', error);
    res.json({ name: 'New Chat', success: true });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), models: MODELS });
});

// Generate password reset link endpoint
router.post('/auth/generate-reset-link', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Check if user exists
    try {
      await admin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({ success: false, error: 'No account found with this email' });
      }
      throw error;
    }

    // Generate password reset link
    const resetLink = await admin.auth().generatePasswordResetLink(email, {
      url: 'https://sourashtra-ai.web.app/signin',
      handleCodeInApp: false
    });

    res.json({ 
      success: true, 
      resetLink,
      message: 'Password reset link generated successfully'
    });

  } catch (error) {
    console.error('Generate reset link error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mount router at /api
app.use('/api', router);

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

