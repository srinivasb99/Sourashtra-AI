# Sourashtra AI 🎙️

<p align="center">
  <img src="https://firebasestorage.googleapis.com/v0/b/sourashtra-ai.firebasestorage.app/o/palkar.png?alt=media&token=9284aeb3-8cbd-4cc1-bed3-35d9f889283a" alt="Sourashtra AI Logo" width="150"/>
</p>

<p align="center">
  <strong>The world's first AI that truly understands and speaks Sourashtra</strong>
</p>

<p align="center">
  <a href="https://sourashtra-ai.web.app">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#development">Development</a>
</p>

---

## 🌟 About

Sourashtra AI is a **completely free** platform designed to preserve and teach the Sourashtra language through AI-powered conversations. Connect with your heritage through natural voice and text interactions.

## ✨ Features

### 💬 Chat
- Real-time streaming responses
- Responses primarily in Sourashtra (Roman script)
- Cultural context and heritage knowledge

### 🎙️ Live Voice Mode
- Real-time voice conversations
- Speak in Sourashtra or English
- AI responds in authentic Sourashtra

### 🎨 Image Generation
- Create images with Sourashtra cultural themes
- Multiple resolutions: 1K, 2K, 4K
- Various aspect ratios and styles
- Powered by Gemini

### 🔐 Authentication
- Optional Google Sign-In
- Save chat history when signed in
- Works fully without an account

## 🛠️ Tech Stack

- **Frontend**: React + Vite
- **Backend**: Firebase Cloud Functions
- **AI**: Google Gemini (Flash models)
- **Auth**: Firebase Authentication
- **Hosting**: Firebase Hosting
- **Database**: Firebase Firestore

## 🚀 Development

### Prerequisites
- Node.js 20+
- Firebase CLI
- Google Cloud account with Gemini API access

### Local Setup

```bash
# Clone the repository
git clone https://github.com/srinivasb99/Sourashtra-AI.git
cd Sourashtra-AI

# Install dependencies
npm install
cd functions && npm install && cd ..

# Start development server
npm run dev

# In another terminal, start the backend
cd server && npm run dev
```

### Environment Variables

Create `server/.env`:
```
GEMINI_API_KEY=your_gemini_api_key
PORT=3002
```

### Deployment

The project auto-deploys via GitHub Actions on push to `main` branch.

For manual deployment:
```bash
npm run deploy
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- [Sourashtra Association Inc.](https://sourashtraassociation.org/) - For their work in preserving Sourashtra heritage
- Google Gemini API - For powering the AI capabilities

---

<p align="center">
  Built with ❤️ for the Sourashtra community
</p>

