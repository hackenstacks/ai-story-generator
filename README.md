# 🧙‍♂️ Story Weaver: Advanced AI Storytelling Interface

![Status](https://img.shields.io/badge/Status-Operational-brightgreen) ![Tech](https://img.shields.io/badge/Tech-TypeScript%20%7C%20Go%20%7C%20Gemini-blue) ![License](https://img.shields.io/badge/License-Apache_2.0-orange)

> **"A military-grade, offline-first, multimedia storytelling CLI & Web Interface."**

Story Weaver is a high-performance, aesthetically crafted application designed to weave interactive narratives using the latest in Generative AI. It features local data encryption (conceptual), a robust asset library, and an immersive media environment.

---

## ✨ Features

### 📖 Core Storytelling
*   **Infinite Context**: Uses advanced context window management to keep stories coherent.
*   **Auto-Pilot Mode**: Leave the prompt empty and let the AI drive the narrative forward based on previous events.
*   **Dynamic Formatting**: Supports Markdown, dialogue highlighting, and dramatic structuring.

### 🎨 Visual & Immersive
*   **Auto-Theming**: The AI analyzes your story start and generates a **custom seamless border texture** and selects a **historically accurate font** (e.g., Cinzel for fantasy, Courier for noir).
*   **Inline Image Generation**: Creates scene illustrations on the fly using `gemini-2.5-flash-image` or `imagen`.
*   **Video Support**: Import and embed video clips directly into the narrative stream.

### 🎧 Advanced Audio Engine
*   **Neural Narration (TTS)**: 
    *   State-of-the-art Text-to-Speech using `gemini-2.5-flash-preview-tts`.
    *   **Smart Queueing**: Reads the full generated text without looping, waiting for generation to complete before speaking.
    *   **Voices**: Select from distinct personas like *Fenrir* (Deep), *Puck* (Playful), or *Kore* (Soothing).
*   **Generative Ambience**: 
    *   **Contextual Ambience**: Click ✨ to generate background sounds that match the *exact* mood of the current text.
    *   **Custom Mixer 🎛️**: Select audio files from your library, provide a prompt (e.g., *"A storm is coming"*), and the AI will mix/transform them into a new loop.

### 🛡️ Security & Privacy (Military Grade)
*   **Local-First Architecture**: All stories and assets are stored in `IndexedDB` within your browser. Nothing is sent to a backend server (except the AI API calls).
*   **Encrypted Logic**: Designed to support user-key encryption for saved stories.
*   **No Telemetry**: Zero tracking.

---

## 🛠️ Technical Stack

*   **Frontend**: Native TypeScript (ESM), no bundler required for dev (uses `esm.sh` for imports).
*   **AI Backend**: Google GenAI SDK (`@google/genai`).
*   **Storage**: IndexedDB (Client-side).
*   **Styling**: Raw CSS variables for easy theming (Dark Mode default).

---

## 🚀 Getting Started

### Prerequisites
*   A modern browser (Chrome/Edge/Firefox).
*   A Google Gemini API Key.

### Installation
Since this is a client-side application using ES Modules, you need a lightweight local server to run it (to avoid CORS issues with file:// protocol).

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-repo/story-weaver.git
    cd story-weaver
    ```

2.  **Serve the files**
    You can use any static file server.
    *   Using Python: `python3 -m http.server 8080`
    *   Using Node: `npx http-server`
    *   Using Go: `go run main.go` (if using the Go wrapper)

3.  **Launch**
    Open `http://localhost:8080` in your browser.

4.  **Configure API Key**
    *   Click **Settings ⚙️**.
    *   Enter your **Gemini API Key**.
    *   (Optional) Adjust model preferences (Flash vs Pro).

---

## 🎮 Controls Manual

### Main Interface
*   **Input Bar**: Type here to act. Empty + Enter = AI Auto-continue.
*   **🎚️ Button**: Opens the **Main Media Center**.

### The Media Center (Slide Down)
*   **Sliders**: Independent control for Ambience (Music) and Voice (Narrator).
*   **✨ Auto Ambience**: One-click sound generation.
*   **🎛️ Mixer**: Advanced audio blending tool.
*   **Narrator Toggle**: 🔇/🗣️.

### The Library 📚
*   **Stories**: Create new sessions, delete old ones. Auto-saves.
*   **Assets**: 
    *   **Upload**: Drag & drop or select images/audio/video.
    *   **Apply**: Click an asset to apply it (Image -> Border, Audio -> BG Music).

---

## 🧩 Customization

You can tweak the `index.css` variables to change the entire color scheme:

```css
:root {
  --primary-color: #bb86fc; /* Change this for main accent */
  --background-color: #121212; /* Deep void black */
  --surface-color: #1e1e1e; /* Panel grey */
}
```

---

## 🤝 Contributing

1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📜 License

Distributed under the Apache 2.0 License. See `LICENSE` for more information.

---

*"Any sufficiently advanced technology is indistinguishable from magic."* 🧙‍♂️
