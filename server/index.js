import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Available models
const MODELS = {
  chat: 'gemini-2.5-flash',
  image: 'gemini-2.5-flash-preview-05-20',  // Nano Banana Pro for image generation
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

Respond in Sourashtra 99 percent of the time. BUT if user is asking something in English, respond in English and ask what they want to know in Sourashtra. DO NOT USE ANY OTHER LANGUAGE! ONLY THE THINGS FROM THIS DICTIONARY. Write all Sourashtra words in Roman script only.

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

// Chat endpoint with streaming
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const contents = [
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
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

// Image generation endpoint with Nano Banana Pro
// Supports: aspect ratios, resolutions (1K, 2K, 4K), style options
app.post('/api/generate-image', async (req, res) => {
  try {
    const { 
      prompt, 
      aspectRatio = '1:1',  // 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
      resolution = '1K',     // 1K, 2K, 4K
      style = 'default'      // default, photorealistic, artistic, cultural
    } = req.body;

    // Enhance prompt with Sourashtra cultural context based on style
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
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: resolution,  // 1K, 2K, or 4K
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
app.post('/api/edit-image', async (req, res) => {
  try {
    const { 
      prompt, 
      imageData,  // base64 encoded image
      imageMimeType = 'image/png',
      aspectRatio = '1:1',
      resolution = '1K'
    } = req.body;

    const response = await ai.models.generateContent({
      model: MODELS.image,
      contents: [
        {
          inlineData: {
            mimeType: imageMimeType,
            data: imageData,
          },
        },
        { text: prompt }
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: resolution,
        },
      }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    let resultImageData = null;
    let text = '';

    for (const part of parts) {
      if (part.text) {
        text = part.text;
      } else if (part.inlineData) {
        resultImageData = {
          data: part.inlineData.data,
          mimeType: part.inlineData.mimeType
        };
      }
    }

    res.json({ 
      success: true,
      imageData: resultImageData,
      text
    });

  } catch (error) {
    console.error('Image editing error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Voice/Audio transcription endpoint
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioData, mimeType = 'audio/wav' } = req.body;

    const response = await ai.models.generateContent({
      model: MODELS.chat,
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: audioData,
          },
        },
        { text: 'Transcribe this audio. If it is in Sourashtra, transcribe it in Roman script. Also provide the English translation.' }
      ],
    });

    res.json({ 
      transcription: response.text,
      success: true 
    });

  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Voice respond endpoint
app.post('/api/voice/respond', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    const contents = [
      ...history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user',
        parts: [{ text: message }]
      }
    ];

    const response = await ai.models.generateContent({
      model: MODELS.chat,
      contents: contents,
      config: {
        systemInstruction: SOURASHTRA_SYSTEM_INSTRUCTION + '\n\nKeep responses concise and conversational.',
        thinkingConfig: { thinkingBudget: 0 },
      }
    });

    res.json({ 
      text: response.text,
      success: true 
    });

  } catch (error) {
    console.error('Voice respond error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    models: MODELS
  });
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket server for Live Voice
const wss = new WebSocketServer({ server, path: '/api/live' });

wss.on('connection', (ws) => {
  console.log('Live voice client connected');
  let geminiSession = null;

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'start') {
        geminiSession = await ai.live.connect({
          model: MODELS.live,
          config: {
            responseModalities: ['AUDIO'],
            systemInstruction: SOURASHTRA_SYSTEM_INSTRUCTION,
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Kore'
                }
              }
            }
          },
          callbacks: {
            onopen: () => {
              ws.send(JSON.stringify({ type: 'connected' }));
            },
            onmessage: (msg) => {
              if (msg.serverContent) {
                ws.send(JSON.stringify({ type: 'response', data: msg }));
              }
              if (msg.data) {
                ws.send(JSON.stringify({ type: 'audio', data: msg.data }));
              }
            },
            onerror: (error) => {
              ws.send(JSON.stringify({ type: 'error', error: error.message }));
            },
            onclose: () => {
              ws.send(JSON.stringify({ type: 'disconnected' }));
            }
          }
        });
      } else if (message.type === 'audio' && geminiSession) {
        geminiSession.sendRealtimeInput({
          audio: { data: message.data, mimeType: 'audio/pcm;rate=16000' }
        });
      } else if (message.type === 'text' && geminiSession) {
        geminiSession.sendClientContent({ turns: message.text, turnComplete: true });
      } else if (message.type === 'stop' && geminiSession) {
        geminiSession.close();
        geminiSession = null;
      }
    } catch (error) {
      console.error('WebSocket error:', error);
      ws.send(JSON.stringify({ type: 'error', error: error.message }));
    }
  });

  ws.on('close', () => {
    console.log('Live voice client disconnected');
    if (geminiSession) geminiSession.close();
  });
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`🚀 Sourashtra AI Server running on port ${PORT}`);
  console.log(`📡 WebSocket Live API available at ws://localhost:${PORT}/api/live`);
  console.log(`🤖 Using models:`, MODELS);
});
