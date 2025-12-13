/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Modality } from '@google/genai';
import { marked } from 'marked';

// --- DOM ELEMENT REFERENCES ---
const promptForm = document.getElementById('prompt-form') as HTMLFormElement;
const promptInput = document.getElementById('prompt-input') as HTMLInputElement;
const submitButton = document.getElementById('submit-button') as HTMLButtonElement;
const conversationContainer = document.getElementById('conversation-container') as HTMLElement;
const welcomeMessage = document.getElementById('welcome-message') as HTMLElement;
const bgMusicPlayer = document.getElementById('bg-music-player') as HTMLAudioElement;

// Main Menu Elements
const mainMenu = document.getElementById('main-menu') as HTMLElement;
const mainMenuToggle = document.getElementById('main-menu-toggle') as HTMLButtonElement;
const closeMenuBtn = document.getElementById('close-menu-btn') as HTMLButtonElement;
const sidebarOverlay = document.getElementById('sidebar-overlay') as HTMLElement;

// Menu Actions
const libraryToggleBtn = document.getElementById('library-toggle-btn') as HTMLButtonElement;
const saveButton = document.getElementById('save-button') as HTMLButtonElement;
const exportButton = document.getElementById('export-button') as HTMLButtonElement;
const importButton = document.getElementById('import-button') as HTMLButtonElement;
const importFileInput = document.getElementById('import-file') as HTMLInputElement;

// Library Sidebar Elements
const librarySidebar = document.getElementById('library-sidebar') as HTMLElement;
const closeSidebarBtn = document.getElementById('close-sidebar-btn') as HTMLButtonElement;
const newStoryBtn = document.getElementById('new-story-btn') as HTMLButtonElement;
const storyList = document.getElementById('story-list') as HTMLElement;


// Settings Elements
const settingsButton = document.getElementById('settings-button') as HTMLButtonElement;
const settingsDialog = document.getElementById('settings-dialog') as HTMLDialogElement;
const settingsForm = document.getElementById('settings-form') as HTMLFormElement;
const closeSettingsBtn = document.getElementById('close-settings-btn') as HTMLButtonElement;
const cancelSettingsBtn = document.getElementById('cancel-settings') as HTMLButtonElement;
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Help Elements
const helpButton = document.getElementById('help-button') as HTMLButtonElement;
const helpDialog = document.getElementById('help-dialog') as HTMLDialogElement;
const closeHelpBtn = document.getElementById('close-help-btn') as HTMLButtonElement;
const closeHelpActionBtn = document.getElementById('close-help-action') as HTMLButtonElement;


// Settings Form Inputs
const chatProviderSelect = document.getElementById('chat-provider') as HTMLSelectElement;
const chatModelSelect = document.getElementById('chat-model-select') as HTMLSelectElement;
const chatCustomModelInput = document.getElementById('chat-custom-model') as HTMLInputElement;
const chatApiKeyInput = document.getElementById('chat-api-key') as HTMLInputElement;
const chatModelGroup = document.getElementById('chat-model-group') as HTMLElement;
const chatCustomModelGroup = document.getElementById('chat-custom-model-group') as HTMLElement;
const chatWritingStyleSelect = document.getElementById('chat-writing-style') as HTMLSelectElement;
const chatOutputLengthSelect = document.getElementById('chat-output-length') as HTMLSelectElement;


const imageProviderSelect = document.getElementById('image-provider') as HTMLSelectElement;
const imageModelSelect = document.getElementById('image-model-select') as HTMLSelectElement;
const imageAspectRatioSelect = document.getElementById('image-aspect-ratio') as HTMLSelectElement;
const imageStyleSelect = document.getElementById('image-style') as HTMLSelectElement;
const imageNegativePromptInput = document.getElementById('image-negative-prompt') as HTMLTextAreaElement;
const imageApiKeyInput = document.getElementById('image-api-key') as HTMLInputElement;
const imageCountInput = document.getElementById('image-count') as HTMLInputElement;

// Audio & Theme Settings
const storyFontSelect = document.getElementById('story-font') as HTMLSelectElement;
const ttsVoiceSelect = document.getElementById('tts-voice') as HTMLSelectElement;
const borderUploadInput = document.getElementById('border-upload') as HTMLInputElement;
const musicUploadInput = document.getElementById('music-upload') as HTMLInputElement;
const clearBorderBtn = document.getElementById('clear-border-btn') as HTMLButtonElement;
const clearMusicBtn = document.getElementById('clear-music-btn') as HTMLButtonElement;


// --- TYPE DEFINITIONS ---
type Turn = {
  id: string;
  type: 'text' | 'image';
  content: string; // For text, it's markdown. For image, it's base64 data URI.
};

interface Story {
    id: string;
    title: string;
    conversation: Turn[];
    createdAt: number;
    updatedAt: number;
    themeImage?: string; // Base64 image for the bezel/border
    fontFamily?: string; 
    bgMusic?: string; // Base64 audio data URI
}

interface AppSettings {
  chatProvider: 'google' | 'custom';
  chatModel: string;
  chatApiKey: string;
  chatWritingStyle: string;
  chatOutputLength: string;
  imageProvider: 'google';
  imageModel: string;
  imageApiKey: string;
  imageAspectRatio: string;
  imageStyle: string;
  imageNegativePrompt: string;
  imageGenerationCount: number;
  // Audio settings
  ttsVoice: string;
  manualFont: string; // If set, overrides auto-detected font
}

// --- STATE ---
let library: Story[] = [];
let currentStoryId: string | null = null;
let audioContext: AudioContext | null = null;

const DEFAULT_SETTINGS: AppSettings = {
  chatProvider: 'google',
  chatModel: 'gemini-2.5-flash-image',
  chatApiKey: '',
  chatWritingStyle: 'standard',
  chatOutputLength: 'medium',
  imageProvider: 'google',
  imageModel: 'gemini-2.5-flash-image',
  imageApiKey: '',
  imageAspectRatio: '1:1',
  imageStyle: 'none',
  imageNegativePrompt: '',
  imageGenerationCount: 1,
  ttsVoice: 'Kore',
  manualFont: '',
};

let currentSettings: AppSettings = { ...DEFAULT_SETTINGS };

// --- INDEXED DB HELPER ---
const DB_NAME = 'StoryWeaverDB';
const DB_VERSION = 1;
const STORE_STORIES = 'stories';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_STORIES)) {
        db.createObjectStore(STORE_STORIES, { keyPath: 'id' });
      }
    };
  });
}

async function getAllStoriesFromDB(): Promise<Story[]> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_STORIES, 'readonly');
            const store = tx.objectStore(STORE_STORIES);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("DB Error getting stories:", e);
        return [];
    }
}

async function saveStoryToDB(story: Story): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_STORIES, 'readwrite');
            const store = tx.objectStore(STORE_STORIES);
            const request = store.put(story);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("DB Error saving story:", e);
        alert("Failed to save story. Storage might be full.");
    }
}

async function deleteStoryFromDB(id: string): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_STORIES, 'readwrite');
            const store = tx.objectStore(STORE_STORIES);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("DB Error deleting story:", e);
    }
}

// --- AUDIO HELPERS ---

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Decodes raw PCM or Encoded Audio from Gemini TTS
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Use browser's decodeAudioData which supports many formats including mp3/wav if returned, 
// OR handle raw PCM if specifically requested. Gemini 'audio/mp3' output is standard.
async function playAudioBytes(base64Data: string) {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Resume context if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    try {
        const arrayBuffer = decode(base64Data).buffer;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
    } catch (e) {
        console.error("Error decoding/playing audio:", e);
        alert("Could not play audio. Format may not be supported.");
    }
}


// --- HELPERS ---
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// --- LIBRARY LOGIC ---

async function initLibrary() {
    library = await getAllStoriesFromDB();
    renderLibraryList();
    
    if (library.length > 0 && !currentStoryId) {
        // Load most recent story
        const recent = library.sort((a,b) => b.updatedAt - a.updatedAt)[0];
        loadStory(recent.id);
    }
}


async function createNewStory() {
    const newStory: Story = {
        id: generateId(),
        title: 'New Story',
        conversation: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    
    await saveStoryToDB(newStory);
    
    library.unshift(newStory);
    loadStory(newStory.id);
    renderLibraryList();
    closeLibrarySidebar();
}

function loadStory(id: string) {
    const story = library.find(s => s.id === id);
    if (!story) return;

    currentStoryId = id;
    renderConversation(story); 
    renderLibraryList(); 
    
    // Handle BG Music
    if (story.bgMusic) {
        bgMusicPlayer.src = story.bgMusic;
        bgMusicPlayer.play().catch(e => console.log('Autoplay blocked', e));
    } else {
        bgMusicPlayer.pause();
        bgMusicPlayer.src = "";
    }
}

async function deleteStory(id: string, event: Event) {
    event.stopPropagation(); 
    if(!confirm('Are you sure you want to delete this story?')) return;

    await deleteStoryFromDB(id);
    library = library.filter(s => s.id !== id);
    
    if (currentStoryId === id) {
        currentStoryId = null;
        conversationContainer.innerHTML = '';
        conversationContainer.appendChild(welcomeMessage); 
        welcomeMessage.style.display = 'block';
        bgMusicPlayer.pause();
    }
    
    renderLibraryList();
}

async function updateCurrentStory(conversation: Turn[], updates: Partial<Story> = {}) {
    if (!currentStoryId) {
        await createNewStory();
    }
    
    const storyIndex = library.findIndex(s => s.id === currentStoryId);
    if (storyIndex !== -1) {
        const story = library[storyIndex];
        story.conversation = conversation;
        story.updatedAt = Date.now();
        
        // Merge updates (theme, font, music)
        Object.assign(story, updates);
        
        // Auto-title
        if (story.title === 'New Story' && conversation.length > 0 && conversation[0].type === 'text') {
             let text = conversation[0].content.replace(/[#*`]/g, '').trim();
             if (text.length > 30) text = text.substring(0, 30) + '...';
             if (text) story.title = text;
        }
        
        await saveStoryToDB(story);
        renderLibraryList();
    }
}

function renderLibraryList() {
    storyList.innerHTML = '';
    const sorted = [...library].sort((a,b) => b.updatedAt - a.updatedAt);
    
    sorted.forEach(story => {
        const item = document.createElement('div');
        item.className = `story-item ${story.id === currentStoryId ? 'active' : ''}`;
        item.onclick = () => loadStory(story.id);
        
        const info = document.createElement('div');
        info.className = 'story-info';
        
        const title = document.createElement('span');
        title.className = 'story-title';
        title.textContent = story.title;
        
        const date = document.createElement('div');
        date.className = 'story-date';
        date.textContent = formatDate(story.updatedAt);
        
        info.appendChild(title);
        info.appendChild(date);
        
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-story-btn';
        delBtn.innerHTML = '&times;';
        delBtn.title = 'Delete Story';
        delBtn.onclick = (e) => deleteStory(story.id, e);
        
        item.appendChild(info);
        item.appendChild(delBtn);
        storyList.appendChild(item);
    });
}


// --- SETTINGS LOGIC ---

function loadSettings() {
  const stored = localStorage.getItem('storyWeaverSettings');
  if (stored) {
    currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  }
}

function saveSettingsToStorage() {
  localStorage.setItem('storyWeaverSettings', JSON.stringify(currentSettings));
}

function updateSettingsUI() {
  // Chat Tab
  chatProviderSelect.value = currentSettings.chatProvider;
  
  if (currentSettings.chatProvider === 'google') {
    if ([...chatModelSelect.options].some(o => o.value === currentSettings.chatModel)) {
      chatModelSelect.value = currentSettings.chatModel;
    } else {
      chatModelSelect.value = 'gemini-2.5-flash-image'; 
    }
    chatModelGroup.classList.remove('hidden');
    chatCustomModelGroup.classList.add('hidden');
  } else {
    chatCustomModelInput.value = currentSettings.chatModel;
    chatModelGroup.classList.add('hidden');
    chatCustomModelGroup.classList.remove('hidden');
  }

  chatApiKeyInput.value = currentSettings.chatApiKey;
  chatWritingStyleSelect.value = currentSettings.chatWritingStyle;
  chatOutputLengthSelect.value = currentSettings.chatOutputLength;

  // Image Tab
  imageProviderSelect.value = currentSettings.imageProvider;
  imageModelSelect.value = currentSettings.imageModel;
  imageApiKeyInput.value = currentSettings.imageApiKey;
  imageAspectRatioSelect.value = currentSettings.imageAspectRatio;
  imageStyleSelect.value = currentSettings.imageStyle;
  imageNegativePromptInput.value = currentSettings.imageNegativePrompt;
  imageCountInput.value = currentSettings.imageGenerationCount.toString();
  
  // Audio & Theme
  storyFontSelect.value = currentSettings.manualFont;
  ttsVoiceSelect.value = currentSettings.ttsVoice;
}

function saveSettingsFromUI() {
  const provider = chatProviderSelect.value as 'google' | 'custom';
  currentSettings.chatProvider = provider;
  
  if (provider === 'google') {
    currentSettings.chatModel = chatModelSelect.value;
  } else {
    currentSettings.chatModel = chatCustomModelInput.value.trim() || 'gemini-2.5-flash-image';
  }
  
  currentSettings.chatApiKey = chatApiKeyInput.value.trim();
  currentSettings.chatWritingStyle = chatWritingStyleSelect.value;
  currentSettings.chatOutputLength = chatOutputLengthSelect.value;

  currentSettings.imageProvider = imageProviderSelect.value as 'google';
  currentSettings.imageModel = imageModelSelect.value;
  currentSettings.imageApiKey = imageApiKeyInput.value.trim();
  currentSettings.imageAspectRatio = imageAspectRatioSelect.value;
  currentSettings.imageStyle = imageStyleSelect.value;
  currentSettings.imageNegativePrompt = imageNegativePromptInput.value.trim();
  currentSettings.imageGenerationCount = parseInt(imageCountInput.value, 10) || 1;
  
  currentSettings.manualFont = storyFontSelect.value;
  currentSettings.ttsVoice = ttsVoiceSelect.value;
  
  // Handle File Uploads (Update current story immediately)
  const borderFile = borderUploadInput.files?.[0];
  const musicFile = musicUploadInput.files?.[0];
  
  if (currentStoryId && (borderFile || musicFile || currentSettings.manualFont)) {
      const updates: Partial<Story> = {};
      
      const updatePromises = [];
      
      if (borderFile) {
          updatePromises.push(blobToBase64(borderFile).then(b64 => updates.themeImage = b64));
      }
      
      if (musicFile) {
          updatePromises.push(blobToBase64(musicFile).then(b64 => {
              updates.bgMusic = b64;
              bgMusicPlayer.src = b64;
              bgMusicPlayer.play();
          }));
      }
      
      if (currentSettings.manualFont) {
          updates.fontFamily = currentSettings.manualFont;
      }
      
      Promise.all(updatePromises).then(() => {
          const story = library.find(s => s.id === currentStoryId);
          if (story) {
             updateCurrentStory(story.conversation, updates).then(() => loadStory(story.id));
          }
      });
  }

  saveSettingsToStorage();
  settingsDialog.close();
}


// --- RENDERING LOGIC ---

/**
 * Renders a single turn into the conversation container.
 */
async function renderTurn(turn: Turn, themeImage?: string, fontFamily?: string) {
  let turnElement = conversationContainer.querySelector(`[data-id="${turn.id}"]`) as HTMLElement;
  let isNew = false;
  
  if (!turnElement) {
      isNew = true;
      turnElement = document.createElement('div');
      turnElement.className = 'turn';
      turnElement.dataset.id = turn.id;
      
      const contentElement = document.createElement('div');
      contentElement.className = 'turn-content';
      turnElement.appendChild(contentElement);
      
      turnElement.appendChild(createTurnControls(turn, turnElement));
      conversationContainer.appendChild(turnElement);
  }

  // Update Styles always (in case they changed)
  if (themeImage) {
      turnElement.style.setProperty('--story-theme', `url('${themeImage}')`);
  }
  if (fontFamily) {
      turnElement.style.setProperty('--story-font', fontFamily);
  }

  const contentElement = turnElement.querySelector('.turn-content') as HTMLElement;

  if (turn.type === 'text') {
    try {
        const rawContent = turn.content || '';
        let html = await marked.parse(rawContent);
        contentElement.innerHTML = html as string;
    } catch(e) {
        console.error('Markdown parse error:', e);
        contentElement.textContent = turn.content;
    }
  } else {
    contentElement.innerHTML = '';
    const img = new Image();
    img.src = turn.content;
    contentElement.appendChild(img);
  }

  if (isNew) {
      conversationContainer.scrollTop = conversationContainer.scrollHeight;
  }
}

function createTurnControls(turn: Turn, turnElement: HTMLElement): HTMLElement {
  const controls = document.createElement('div');
  controls.className = 'turn-controls';
  
  // TTS Button
  if (turn.type === 'text') {
      const speakButton = document.createElement('button');
      speakButton.innerHTML = '🔊'; 
      speakButton.title = 'Read Aloud';
      speakButton.onclick = () => {
          // Get text content (strip basic markdown for speech stability if needed, 
          // or rely on model to ignore markdown chars). 
          // Simple strip for cleaner speech:
          const textToSpeak = turn.content.replace(/[#*`]/g, '');
          speakText(textToSpeak);
      };
      controls.appendChild(speakButton);
  }

  const editButton = document.createElement('button');
  editButton.innerHTML = '&#9998;'; 
  editButton.title = 'Edit';
  if (turn.type === 'image') {
    editButton.disabled = true;
  }
  editButton.onclick = () => {
    enterEditMode(turn, turnElement);
  };

  const deleteButton = document.createElement('button');
  deleteButton.innerHTML = '&#128465;'; 
  deleteButton.title = 'Delete';
  deleteButton.onclick = async () => {
    turnElement.remove();
    const story = library.find(s => s.id === currentStoryId);
    if(story) {
        story.conversation = story.conversation.filter((t) => t.id !== turn.id);
        await updateCurrentStory(story.conversation);
    }
  };

  controls.appendChild(editButton);
  controls.appendChild(deleteButton);
  return controls;
}

function enterEditMode(turn: Turn, turnElement: HTMLElement) {
    const contentDiv = turnElement.querySelector('.turn-content') as HTMLElement;
    if (!contentDiv) return;

    const currentContent = turn.content;
    contentDiv.style.display = 'none';

    const editContainer = document.createElement('div');
    const textArea = document.createElement('textarea');
    textArea.value = currentContent;
    
    const saveEditButton = document.createElement('button');
    saveEditButton.textContent = 'Save';
    saveEditButton.style.marginTop = '0.5rem';

    saveEditButton.onclick = async () => {
        const newContent = textArea.value;
        turn.content = newContent;
        
        const story = library.find(s => s.id === currentStoryId);
        if(story) {
            await updateCurrentStory(story.conversation);
        }

        contentDiv.innerHTML = (await marked.parse(newContent)) as string;
        contentDiv.style.display = 'block';
        editContainer.remove();
    };

    editContainer.appendChild(textArea);
    editContainer.appendChild(saveEditButton);
    turnElement.appendChild(editContainer);
}


async function renderConversation(story: Story) {
  conversationContainer.innerHTML = '';
  const conversation = story.conversation;
  
  // Font logic: Manual override > Story specific > Default
  const fontToUse = currentSettings.manualFont || story.fontFamily;
  
  if (conversation.length === 0) {
      conversationContainer.appendChild(welcomeMessage);
      welcomeMessage.style.display = 'block';
  } else {
      welcomeMessage.style.display = 'none';
      for (const turn of conversation) {
          await renderTurn(turn, story.themeImage, fontToUse);
      }
  }
}

// --- API & GENERATION LOGIC ---

// Generates both a border image and a suggested font
async function generateStoryThemeMetadata(prompt: string): Promise<{image?: string, font?: string}> {
    try {
        console.log('[DEBUG] Generating theme metadata for prompt:', prompt);
        const apiKey = currentSettings.imageApiKey || currentSettings.chatApiKey || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        // 1. Generate Image (Square Frame)
        const imageResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: `Create a seamless, decorative, rectangular frame border texture relevant to the following story theme: "${prompt}". 
            High contrast. Square aspect ratio. No text.`,
            config: {
                responseModalities: [Modality.IMAGE],
                imageConfig: { aspectRatio: '1:1' }
            }
        });
        
        let imageBase64;
        const imgPart = imageResponse.candidates?.[0]?.content?.parts?.[0];
        if (imgPart && imgPart.inlineData) {
            imageBase64 = `data:image/png;base64,${imgPart.inlineData.data}`;
        }
        
        // 2. Generate Font Suggestion (Text)
        const fontResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the mood of this story prompt: "${prompt}". 
            Suggest exactly one CSS font-family from this list that best fits: 
            'Roboto', 'Merriweather', 'Courier Prime', 'Dancing Script', 'Cinzel'.
            Return ONLY the font family name.`,
        });
        
        let fontName = fontResponse.text?.trim().replace(/['"]/g, '');
        // Validate against our list to be safe
        const validFonts = ['Roboto', 'Merriweather', 'Courier Prime', 'Dancing Script', 'Cinzel'];
        if (!validFonts.some(f => fontName?.includes(f))) {
            fontName = undefined;
        }

        return { image: imageBase64, font: fontName };

    } catch (e) {
        console.error('Theme generation failed', e);
        return {};
    }
}


async function speakText(text: string) {
    if (!text) return;
    try {
        const apiKey = currentSettings.chatApiKey || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey });
        
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: currentSettings.ttsVoice },
                },
            },
          },
        });
        
        const audioPart = response.candidates?.[0]?.content?.parts?.[0];
        if (audioPart && audioPart.inlineData) {
            await playAudioBytes(audioPart.inlineData.data);
        }

    } catch(e) {
        console.error("TTS Error:", e);
        alert("Text-to-Speech generation failed. Check API key/Quota.");
    }
}


async function generateContent(prompt: string) {
  if (!currentStoryId) {
      await createNewStory();
  }
  
  const story = library.find(s => s.id === currentStoryId);
  if (!story) return;
  
  welcomeMessage.style.display = 'none';
  setLoading(true);

  // --- THEME GENERATION CHECK ---
  // If story has no theme (and no manual override set), generate one
  if (!story.themeImage && !story.fontFamily) {
      generateStoryThemeMetadata(prompt).then(async (metadata) => {
          const updates: Partial<Story> = {};
          if (metadata.image) updates.themeImage = metadata.image;
          if (metadata.font) updates.fontFamily = metadata.font;
          
          if (Object.keys(updates).length > 0) {
              await updateCurrentStory(story.conversation, updates);
              // Force re-render to apply new font/border
              const updatedStory = library.find(s => s.id === currentStoryId);
              if(updatedStory) renderConversation(updatedStory);
          }
      });
  }

  try {
    const chatKey = currentSettings.chatApiKey || process.env.API_KEY;
    const chatModel = currentSettings.chatModel;
    
    const supportsImages = chatModel.toLowerCase().includes('image');
    const modalities = [Modality.TEXT];
    if (supportsImages && currentSettings.imageGenerationCount > 0) {
        modalities.push(Modality.IMAGE);
    }

    const ai = new GoogleGenAI({ apiKey: chatKey });
    
    const config: any = {
      responseModalities: modalities,
    };

    const systemInstructions: string[] = [];
    if (currentSettings.chatWritingStyle && currentSettings.chatWritingStyle !== 'standard') {
        let styleDesc = currentSettings.chatWritingStyle;
        if(styleDesc === 'simple') styleDesc = 'simple and easy to understand (for kids)';
        systemInstructions.push(`Writing Style: ${styleDesc}.`);
    }
    if (currentSettings.chatOutputLength) {
        let lengthInstruction = "";
        switch(currentSettings.chatOutputLength) {
            case 'short': lengthInstruction = "Keep the response short, around 100 words."; break;
            case 'medium': lengthInstruction = "Write a medium length response, around 300 words."; break;
            case 'long': lengthInstruction = "Write a long, detailed response, around 600 words."; break;
        }
        if (lengthInstruction) systemInstructions.push(lengthInstruction);
    }

    if (supportsImages && currentSettings.imageGenerationCount > 0) {
      if (currentSettings.imageAspectRatio) {
         config.imageConfig = { aspectRatio: currentSettings.imageAspectRatio };
      }
      if (currentSettings.imageStyle && currentSettings.imageStyle !== 'none') {
        systemInstructions.push(`Visual Style for Images: ${currentSettings.imageStyle.replace(/-/g, ' ')}.`);
      }
      if (currentSettings.imageNegativePrompt) {
        systemInstructions.push(`Negative Prompt (avoid in images): ${currentSettings.imageNegativePrompt}.`);
      }
      systemInstructions.push(`If you generate images, please try to generate exactly ${currentSettings.imageGenerationCount} image(s) that match the story events.`);
    }

    let context = '';
    const textTurns = story.conversation.filter(t => t.type === 'text');
    if (textTurns.length > 0) {
        const lastFew = textTurns.slice(-3).map(t => t.content).join('\n\n');
        context = `Previous Story Context:\n${lastFew}\n\n`;
    }

    let finalPrompt = prompt;
    if (context) {
        finalPrompt = context + "Continue the story based on the following instruction: " + prompt;
    }

    if (systemInstructions.length > 0) {
      finalPrompt = `${finalPrompt}\n\n[System & Generation Configuration]\n${systemInstructions.join('\n')}`;
    }

    const responseStream = await ai.models.generateContentStream({
      model: chatModel,
      contents: finalPrompt,
      config: config,
    });

    let partialText = '';
    let currentTextTurn: Turn | null = null;

    // Use font override if present, else story font
    const fontToUse = currentSettings.manualFont || story.fontFamily;

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts || [];
      
      for (const part of parts) {
          if (part.text) {
              const text = part.text;
              partialText += text;
              if (!currentTextTurn) {
                  currentTextTurn = { id: Date.now().toString(), type: 'text', content: '' };
                  story.conversation.push(currentTextTurn);
                  await renderTurn(currentTextTurn, story.themeImage, fontToUse);
              }
              currentTextTurn.content = partialText;
              
              const turnElement = conversationContainer.querySelector(`[data-id="${currentTextTurn.id}"] .turn-content`) as HTMLElement;
              if(turnElement) {
                  try {
                      const html = await marked.parse(partialText);
                      turnElement.innerHTML = html as string;
                  } catch (e) {
                      turnElement.textContent = partialText;
                  }
              }
              conversationContainer.scrollTop = conversationContainer.scrollHeight;
          } 
          
          if (part.inlineData) {
              if (currentTextTurn) {
                  currentTextTurn = null; 
                  partialText = '';
              }
              const base64Data = part.inlineData.data;
              const imageTurn: Turn = {
                  id: Date.now().toString(),
                  type: 'image',
                  content: `data:image/png;base64,${base64Data}`,
              };
              story.conversation.push(imageTurn);
              await renderTurn(imageTurn, story.themeImage, fontToUse);
              conversationContainer.scrollTop = conversationContainer.scrollHeight;
          }
      }
    }
    
    await updateCurrentStory(story.conversation);

  } catch (e) {
    console.error('Generation Error:', e);
    const errorTurn: Turn = {
        id: Date.now().toString(),
        type: 'text',
        content: `**Error:** ${(e as Error).message}`
    };
    story.conversation.push(errorTurn);
    await renderTurn(errorTurn, story.themeImage);
    await updateCurrentStory(story.conversation);
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading: boolean) {
  promptInput.disabled = isLoading;
  submitButton.disabled = isLoading;

  if (isLoading) {
    submitButton.innerHTML = '<div class="spinner"></div><span>Generating...</span>';
  } else {
    submitButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
      </svg>
      <span>Generate</span>
    `;
  }
}


// --- EVENT LISTENERS ---

// Menu & Sidebar Navigation
function toggleMainMenu() {
    mainMenu.classList.toggle('open');
    sidebarOverlay.classList.toggle('visible');
    if(mainMenu.classList.contains('open')) {
        librarySidebar.classList.remove('open');
    }
}

function closeMainMenu() {
    mainMenu.classList.remove('open');
    sidebarOverlay.classList.remove('visible');
}

function toggleLibrarySidebar() {
    librarySidebar.classList.toggle('open');
    if (window.innerWidth < 768) {
        mainMenu.classList.remove('open');
    }
    sidebarOverlay.classList.add('visible');
}

function closeLibrarySidebar() {
    librarySidebar.classList.remove('open');
    if (!mainMenu.classList.contains('open')) {
        sidebarOverlay.classList.remove('visible');
    }
}

mainMenuToggle.addEventListener('click', toggleMainMenu);
closeMenuBtn.addEventListener('click', closeMainMenu);
sidebarOverlay.addEventListener('click', () => {
    closeMainMenu();
    closeLibrarySidebar();
});

libraryToggleBtn.addEventListener('click', toggleLibrarySidebar);
closeSidebarBtn.addEventListener('click', closeLibrarySidebar);
newStoryBtn.addEventListener('click', createNewStory);

// Form & Settings
promptForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const prompt = promptInput.value.trim();
  if (prompt) {
    generateContent(prompt);
    promptInput.value = '';
  }
});

saveButton.addEventListener('click', () => {
    // saveLibrary(); // Legacy button, now it just confirms storage
    alert('Stories are automatically saved to your browser database (IndexedDB).');
});

exportButton.addEventListener('click', () => {
  const data = JSON.stringify(library, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `story-weaver-library-${new Date().toISOString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

importButton.addEventListener('click', () => importFileInput.click());

importFileInput.addEventListener('change', (event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const result = e.target?.result as string;
      const importedData = JSON.parse(result);
      if (Array.isArray(importedData)) {
          if(importedData.length > 0 && importedData[0].conversation) {
              for(const s of importedData) {
                  // Avoid duplicates by ID, or generate new ID if desired
                  if(!library.find(ex => ex.id === s.id)) {
                      await saveStoryToDB(s);
                      library.push(s);
                  }
              }
          } else {
               const newStory: Story = {
                    id: generateId(),
                    title: 'Imported Story',
                    conversation: importedData as Turn[],
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                await saveStoryToDB(newStory);
                library.push(newStory);
          }
        
        renderLibraryList();
        alert('Import successful!');
      } else {
        throw new Error('Invalid format.');
      }
    } catch (error) {
      alert(`Error importing file: ${(error as Error).message}`);
    }
  };
  reader.readAsText(file);
});

settingsButton.addEventListener('click', () => {
  updateSettingsUI();
  settingsDialog.showModal();
});
closeSettingsBtn.addEventListener('click', () => settingsDialog.close());
cancelSettingsBtn.addEventListener('click', () => settingsDialog.close());
settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveSettingsFromUI();
});
helpButton.addEventListener('click', () => helpDialog.showModal());
closeHelpBtn.addEventListener('click', () => helpDialog.close());
closeHelpActionBtn.addEventListener('click', () => helpDialog.close());
chatProviderSelect.addEventListener('change', () => {
    if (chatProviderSelect.value === 'google') {
        chatModelGroup.classList.remove('hidden');
        chatCustomModelGroup.classList.add('hidden');
    } else {
        chatModelGroup.classList.add('hidden');
        chatCustomModelGroup.classList.remove('hidden');
    }
});
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const tabId = (btn as HTMLElement).dataset.tab;
        if(tabId) document.getElementById(tabId)?.classList.add('active');
    });
});

clearBorderBtn.addEventListener('click', () => {
    borderUploadInput.value = '';
    if (currentStoryId) {
        const story = library.find(s => s.id === currentStoryId);
        if(story) {
            delete story.themeImage; // Clear manual image
            updateCurrentStory(story.conversation, { themeImage: undefined }).then(() => loadStory(story.id));
        }
    }
});

clearMusicBtn.addEventListener('click', () => {
     musicUploadInput.value = '';
     bgMusicPlayer.pause();
     bgMusicPlayer.src = "";
     if (currentStoryId) {
        const story = library.find(s => s.id === currentStoryId);
        if(story) {
            delete story.bgMusic;
            updateCurrentStory(story.conversation, { bgMusic: undefined });
        }
    }
});

// Initialization
loadSettings();
initLibrary();