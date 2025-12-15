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
const assetsList = document.getElementById('assets-list') as HTMLElement;
const libTabs = document.querySelectorAll('.lib-tab');
const libContents = document.querySelectorAll('.lib-content');
const assetUploadInput = document.getElementById('asset-upload') as HTMLInputElement;

// Settings Elements
const settingsButton = document.getElementById('settings-button') as HTMLButtonElement;
const settingsDialog = document.getElementById('settings-dialog') as HTMLDialogElement;
const settingsForm = document.getElementById('settings-form') as HTMLFormElement;
const closeSettingsBtn = document.getElementById('close-settings-btn') as HTMLButtonElement;
const cancelSettingsBtn = document.getElementById('cancel-settings') as HTMLButtonElement;
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Regenerate Dialog Elements
const regenerateDialog = document.getElementById('regenerate-dialog') as HTMLDialogElement;
const regenPromptInput = document.getElementById('regen-prompt') as HTMLInputElement;
const confirmRegenBtn = document.getElementById('confirm-regen-btn') as HTMLButtonElement;
const cancelRegenBtn = document.getElementById('cancel-regen-btn') as HTMLButtonElement;
const closeRegenBtn = document.getElementById('close-regen-btn') as HTMLButtonElement;

// Sound Generation Dialog Elements
const soundGenDialog = document.getElementById('sound-gen-dialog') as HTMLDialogElement;
const closeSoundGenBtn = document.getElementById('close-sound-gen-btn') as HTMLButtonElement;
const cancelSoundGenBtn = document.getElementById('cancel-sound-gen-btn') as HTMLButtonElement;
const confirmSoundGenBtn = document.getElementById('confirm-sound-gen-btn') as HTMLButtonElement;
const soundGenPromptInput = document.getElementById('sound-gen-prompt') as HTMLTextAreaElement;
const audioAssetSelectionList = document.getElementById('audio-asset-selection-list') as HTMLElement;

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

// Media Player Widget Elements
const mediaPlayPauseBtn = document.getElementById('media-play-pause') as HTMLButtonElement;
const bgVolumeSlider = document.getElementById('bg-volume') as HTMLInputElement;
const narratorVolumeSlider = document.getElementById('narrator-volume') as HTMLInputElement;
const mediaSpeedSelect = document.getElementById('media-speed') as HTMLSelectElement;
const mediaGenerateBtn = document.getElementById('media-generate') as HTMLButtonElement;
const mediaMixerBtn = document.getElementById('media-mixer') as HTMLButtonElement;
const narratorToggleBtn = document.getElementById('narrator-toggle') as HTMLButtonElement;


// --- TYPE DEFINITIONS ---
type Turn = {
  id: string;
  type: 'text' | 'image' | 'video';
  content: string; // For text, markdown. For media, base64 data URI.
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

interface Asset {
    id: string;
    type: 'image' | 'audio' | 'video';
    name: string;
    data: string; // Base64
    mimeType: string;
    createdAt: number;
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
let assets: Asset[] = [];
let currentStoryId: string | null = null;
let audioContext: AudioContext | null = null;
let narrationGainNode: GainNode | null = null;
let currentNarrationVolume = 1.0;
let isNarratorEnabled = false;

// Regenerate state
let turnToRegenerate: Turn | null = null;
let turnElementToRegenerate: HTMLElement | null = null;

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
const DB_VERSION = 2; // Bumped version for Assets store
const STORE_STORIES = 'stories';
const STORE_ASSETS = 'assets';

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
      if (!db.objectStoreNames.contains(STORE_ASSETS)) {
        db.createObjectStore(STORE_ASSETS, { keyPath: 'id' });
      }
    };
  });
}

// -- STORIES DB OPS --
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

// -- ASSETS DB OPS --
async function getAllAssetsFromDB(): Promise<Asset[]> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_ASSETS, 'readonly');
            const store = tx.objectStore(STORE_ASSETS);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("DB Error getting assets:", e);
        return [];
    }
}

async function saveAssetToDB(asset: Asset): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_ASSETS, 'readwrite');
            const store = tx.objectStore(STORE_ASSETS);
            const request = store.put(asset);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("DB Error saving asset:", e);
        alert("Failed to save asset. Storage might be full.");
    }
}

async function deleteAssetFromDB(id: string): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_ASSETS, 'readwrite');
            const store = tx.objectStore(STORE_ASSETS);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("DB Error deleting asset:", e);
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

// Helper to convert Raw PCM 16-bit to WAV for standard playback
function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000, numChannels: number = 1): string {
    const buffer = new ArrayBuffer(44 + pcmData.length);
    const view = new DataView(buffer);

    // RIFF identifier
    writeString(view, 0, 'RIFF');
    // RIFF chunk length
    view.setUint32(4, 36 + pcmData.length, true);
    // WAVE identifier
    writeString(view, 8, 'WAVE');
    // fmt chunk identifier
    writeString(view, 12, 'fmt ');
    // fmt chunk length
    view.setUint32(16, 16, true);
    // Sample format (1 is PCM)
    view.setUint16(20, 1, true);
    // Channel count
    view.setUint16(22, numChannels, true);
    // Sample rate
    view.setUint32(24, sampleRate, true);
    // Byte rate (sampleRate * blockAlign)
    view.setUint32(28, sampleRate * numChannels * 2, true);
    // Block align (channel count * bytes per sample)
    view.setUint16(32, numChannels * 2, true);
    // Bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, pcmData.length, true);

    // Write PCM data
    const pcmBytes = new Uint8Array(buffer, 44);
    pcmBytes.set(pcmData);

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob); // Note: For persistence we usually want Base64, but Blob URL works for immediate play.
}

function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// Convert PCM Buffer to Base64 String (Wrapped in WAV)
async function pcmToBase64Wav(pcmData: Uint8Array, sampleRate: number): Promise<string> {
    const wavUrl = pcmToWav(pcmData, sampleRate);
    const response = await fetch(wavUrl);
    const blob = await response.blob();
    return blobToBase64(blob);
}

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        narrationGainNode = audioContext.createGain();
        narrationGainNode.gain.value = currentNarrationVolume;
        narrationGainNode.connect(audioContext.destination);
    }
}

// Use browser's decodeAudioData which supports many formats including mp3/wav if returned, 
// OR handle raw PCM if specifically requested. Gemini 'audio/mp3' output is standard.
async function playAudioBytes(base64Data: string) {
    initAudioContext();
    if (!audioContext || !narrationGainNode) return;
    
    // Resume context if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    try {
        const bytes = decode(base64Data);
        const arrayBuffer = bytes.buffer;

        // Clone the buffer because decodeAudioData detaches it
        const bufferCopy = arrayBuffer.slice(0);

        // Try standard decode first
        try {
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            // Connect to Narration Gain Node
            source.connect(narrationGainNode);
            source.start(0);
        } catch (decodeError) {
             // Fallback for raw PCM (assume 24kHz mono if standard decode fails)
             // Note: AudioContext.decodeAudioData fails on raw PCM.
             console.warn("Standard decode failed, trying raw PCM assumption (24kHz Mono)", decodeError);
             
             // Very simple manual PCM decode assuming 16-bit little endian, 24kHz
             // Use bufferCopy because arrayBuffer is detached
             const pcmData = new Int16Array(bufferCopy);
             const audioBuffer = audioContext.createBuffer(1, pcmData.length, 24000);
             const channelData = audioBuffer.getChannelData(0);
             for(let i=0; i<pcmData.length; i++) {
                 channelData[i] = pcmData[i] / 32768.0;
             }
             const source = audioContext.createBufferSource();
             source.buffer = audioBuffer;
             source.connect(narrationGainNode);
             source.start(0);
        }
    } catch (e) {
        console.error("Error decoding/playing audio:", e);
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
    assets = await getAllAssetsFromDB();
    renderLibraryList();
    renderAssetsList();
    
    if (library.length > 0 && !currentStoryId) {
        // Load most recent story
        const recent = library.sort((a,b) => b.updatedAt - a.updatedAt)[0];
        loadStory(recent.id);
    }
    updateMediaControls();
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
        bgMusicPlayer.playbackRate = parseFloat(mediaSpeedSelect.value) || 1.0;
        // Check if previously playing? For now, we auto-play if music exists, or pause.
        // Actually, let's respect user intent slightly more. 
        // Just load it, don't force play unless it was already playing.
        // But for a new story load, let's auto-play to set the mood.
        bgMusicPlayer.play().then(() => updateMediaControls()).catch(e => {
            console.log('Autoplay blocked', e);
            updateMediaControls();
        });
    } else {
        bgMusicPlayer.pause();
        bgMusicPlayer.src = "";
        updateMediaControls();
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
        updateMediaControls();
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

// -- ASSET LIBRARY LOGIC --
async function handleAssetUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const base64 = await blobToBase64(file);
    let type: 'image' | 'audio' | 'video';
    
    if (file.type.startsWith('image')) type = 'image';
    else if (file.type.startsWith('audio')) type = 'audio';
    else if (file.type.startsWith('video')) type = 'video';
    else {
        alert("Unsupported file type");
        return;
    }
    
    const newAsset: Asset = {
        id: generateId(),
        type: type,
        name: file.name,
        data: base64,
        mimeType: file.type,
        createdAt: Date.now()
    };

    await saveAssetToDB(newAsset);
    assets.unshift(newAsset);
    renderAssetsList();
    
    // Clear input so same file can be selected again
    (e.target as HTMLInputElement).value = '';
}

async function deleteAsset(id: string, e: Event) {
    e.stopPropagation();
    if (!confirm("Delete this asset from library?")) return;
    await deleteAssetFromDB(id);
    assets = assets.filter(a => a.id !== id);
    renderAssetsList();
}

async function applyAssetToStory(asset: Asset) {
    if (!currentStoryId) return alert("Select or create a story first.");
    const story = library.find(s => s.id === currentStoryId);
    if (!story) return;

    if (asset.type === 'image') {
        // For image, we set theme.
        if (confirm("Set this image as the story border theme?")) {
            await updateCurrentStory(story.conversation, { themeImage: asset.data });
            loadStory(story.id);
        }
    } else if (asset.type === 'audio') {
        // For audio, set BG music
        if(confirm("Set this audio as the background music?")) {
            await updateCurrentStory(story.conversation, { bgMusic: asset.data });
            bgMusicPlayer.src = asset.data;
            bgMusicPlayer.play().then(updateMediaControls);
        }
    } else if (asset.type === 'video') {
        // For video, insert into conversation
        if(confirm("Insert this video clip into the story?")) {
             const videoTurn: Turn = {
                id: Date.now().toString(),
                type: 'video',
                content: asset.data,
            };
            story.conversation.push(videoTurn);
            await renderTurn(videoTurn, story.themeImage, story.fontFamily || currentSettings.manualFont);
            await updateCurrentStory(story.conversation);
            conversationContainer.scrollTop = conversationContainer.scrollHeight;
        }
    }
}

function renderAssetsList() {
    assetsList.innerHTML = '';
    const sorted = [...assets].sort((a,b) => b.createdAt - a.createdAt);

    sorted.forEach(asset => {
        const item = document.createElement('div');
        item.className = 'asset-item';
        item.onclick = () => applyAssetToStory(asset);

        // Icon/Preview
        if (asset.type === 'image') {
            const img = document.createElement('img');
            img.src = asset.data;
            img.className = 'asset-preview-img';
            item.appendChild(img);
        } else if (asset.type === 'video') {
            const vid = document.createElement('video');
            vid.src = asset.data;
            vid.className = 'asset-preview-video';
            vid.muted = true;
            item.appendChild(vid);
        } else {
            const icon = document.createElement('div');
            icon.className = 'asset-icon';
            icon.textContent = '🎵';
            item.appendChild(icon);
        }

        const info = document.createElement('div');
        info.className = 'asset-info';
        
        const name = document.createElement('span');
        name.className = 'asset-name';
        name.textContent = asset.name;
        
        const typeLabel = document.createElement('div');
        typeLabel.className = 'asset-type';
        let typeText = 'Audio';
        if (asset.type === 'image') typeText = 'Image Border';
        if (asset.type === 'video') typeText = 'Video Clip';
        typeLabel.textContent = typeText;
        
        info.appendChild(name);
        info.appendChild(typeLabel);
        
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-asset-btn';
        delBtn.innerHTML = '&times;';
        delBtn.title = 'Delete Asset';
        delBtn.onclick = (e) => deleteAsset(asset.id, e);
        
        item.appendChild(info);
        item.appendChild(delBtn);
        assetsList.appendChild(item);
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
              bgMusicPlayer.play().then(updateMediaControls);
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
  } else if (turn.type === 'image') {
    contentElement.innerHTML = '';
    const img = new Image();
    img.src = turn.content;
    contentElement.appendChild(img);
  } else if (turn.type === 'video') {
    contentElement.innerHTML = '';
    const vid = document.createElement('video');
    vid.src = turn.content;
    vid.controls = true;
    contentElement.appendChild(vid);
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
  if (turn.type !== 'text') {
    editButton.disabled = true;
  }
  editButton.onclick = () => {
    enterEditMode(turn, turnElement);
  };

  const regenButton = document.createElement('button');
  regenButton.innerHTML = '&#128257;'; // Loop/Refresh icon
  regenButton.title = 'Regenerate';
  regenButton.onclick = () => {
      turnToRegenerate = turn;
      turnElementToRegenerate = turnElement;
      regenPromptInput.value = '';
      regenerateDialog.showModal();
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
  controls.appendChild(regenButton);
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

// --- REGENERATION LOGIC ---

async function performRegeneration(turn: Turn, element: HTMLElement, steeringPrompt: string) {
    const story = library.find(s => s.id === currentStoryId);
    if (!story) return;

    const turnIndex = story.conversation.findIndex(t => t.id === turn.id);
    if (turnIndex === -1) return;

    // Get context up to this turn
    const previousContextTurns = story.conversation.slice(0, turnIndex).filter(t => t.type === 'text');
    let context = '';
    if (previousContextTurns.length > 0) {
        context = previousContextTurns.slice(-5).map(t => t.content).join('\n\n');
    }

    const contentDiv = element.querySelector('.turn-content') as HTMLElement;
    contentDiv.innerHTML = '<div class="spinner"></div>';
    
    try {
        const chatKey = currentSettings.chatApiKey || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: chatKey });

        if (turn.type === 'text') {
            const model = currentSettings.chatModel;
            let prompt = `Original Context:\n${context}\n\nTask: Regenerate the next response in the story.`;
            if (steeringPrompt) {
                prompt += `\nAdditional Instruction: ${steeringPrompt}`;
            } else {
                prompt += `\nInstruction: Write a different variation of the scene.`;
            }

            const result = await ai.models.generateContent({
                model: model,
                contents: prompt
            });

            if (result.text) {
                turn.content = result.text;
                contentDiv.innerHTML = await marked.parse(result.text) as string;
            }

        } else if (turn.type === 'image') {
             const model = currentSettings.imageModel;
             let prompt = steeringPrompt;
             
             // If no steering prompt, try to infer from last text turn
             if (!prompt) {
                 const lastText = previousContextTurns.length > 0 ? previousContextTurns[previousContextTurns.length - 1].content : "A fantasy scene";
                 // Shorten context for image prompt
                 prompt = lastText.length > 200 ? lastText.substring(0, 200) : lastText;
             }

             // Generate Image
             const result = await ai.models.generateContent({
                model: model,
                contents: prompt,
                config: {
                    responseModalities: [Modality.IMAGE],
                    imageConfig: { aspectRatio: currentSettings.imageAspectRatio as any }
                }
             });

             const imgPart = result.candidates?.[0]?.content?.parts?.[0];
             if (imgPart && imgPart.inlineData) {
                 const base64 = `data:image/png;base64,${imgPart.inlineData.data}`;
                 turn.content = base64;
                 contentDiv.innerHTML = '';
                 const img = new Image();
                 img.src = base64;
                 contentDiv.appendChild(img);
             } else {
                 throw new Error("No image generated.");
             }
        }
        
        await updateCurrentStory(story.conversation);

    } catch (e) {
        console.error("Regeneration failed", e);
        alert("Regeneration failed: " + (e as Error).message);
        // Restore old content
        if (turn.type === 'text') {
            contentDiv.innerHTML = await marked.parse(turn.content) as string;
        } else if (turn.type === 'image') {
            contentDiv.innerHTML = '';
            const img = new Image();
            img.src = turn.content;
            contentDiv.appendChild(img);
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

// Generates background ambience using context (Automatic mode)
async function generateContextualAmbience() {
     if (!currentStoryId) return;
    const story = library.find(s => s.id === currentStoryId);
    if (!story) return;

    mediaGenerateBtn.classList.add('loading');
    
    // Construct context from last few turns
    const textTurns = story.conversation.filter(t => t.type === 'text');
    let context = "A mysterious story.";
    if (textTurns.length > 0) {
        context = textTurns.slice(-3).map(t => t.content).join(' ');
    }
    if (context.length > 500) context = context.substring(0, 500) + "...";

    try {
        const apiKey = currentSettings.chatApiKey || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey });

        // Use TTS model with "Fenrir" for deep atmospheric narration/sound description
        // This is a creative use of TTS to generate "Ambience"
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: `Narrate the ambient atmosphere and sounds for this scene in a low, immersive voice: "${context}".`,
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: 'Fenrir' },
                    },
                },
            }
        });

        const audioPart = response.candidates?.[0]?.content?.parts?.[0];
        if (audioPart && audioPart.inlineData) {
             const base64Raw = audioPart.inlineData.data;
             const rawBytes = decode(base64Raw);
             const wavBase64 = await pcmToBase64Wav(rawBytes, 24000);
             
             story.bgMusic = wavBase64;
             await updateCurrentStory(story.conversation, { bgMusic: wavBase64 });
             
             bgMusicPlayer.src = wavBase64;
             bgMusicPlayer.play().then(updateMediaControls);
        } else {
            alert("Failed to generate audio.");
        }

    } catch (e) {
        console.error("Ambience Generation Error:", e);
        alert("Ambience generation failed. " + (e as Error).message);
    } finally {
        mediaGenerateBtn.classList.remove('loading');
    }
}

// Generates background ambience using inputs (Manual/Mixer mode)
async function generateGuidedAmbience() {
    // 1. Collect selected assets
    const checkedBoxes = audioAssetSelectionList.querySelectorAll('input[type="checkbox"]:checked');
    const selectedAssetIds = Array.from(checkedBoxes).map(cb => (cb as HTMLInputElement).value);
    
    const selectedAssets = assets.filter(a => selectedAssetIds.includes(a.id) && a.type === 'audio');
    
    // 2. Collect prompt
    const prompt = soundGenPromptInput.value.trim();

    if (selectedAssets.length === 0 && !prompt) {
        alert("Please select audio assets or provide a prompt.");
        return;
    }

    // 3. Close dialog and start loading UI
    soundGenDialog.close();
    mediaMixerBtn.classList.add('pulse'); // Visual feedback on mixer btn

    // 4. API Call
    try {
        const apiKey = currentSettings.chatApiKey || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey });

        const parts: any[] = [];
        
        // Add Audio Parts
        for(const asset of selectedAssets) {
             // asset.data is "data:audio/mp3;base64,....."
             const base64Data = asset.data.split(',')[1];
             parts.push({
                 inlineData: {
                     mimeType: asset.mimeType || 'audio/mp3',
                     data: base64Data
                 }
             });
        }

        // Add Text Prompt Part
        let textInstruction = "Generate an immersive background soundscape/ambience.";
        if (prompt) textInstruction += ` details: ${prompt}`;
        if (selectedAssets.length > 0) textInstruction += ` Use the provided audio files as reference or mix them creatively based on the description.`;
        
        parts.push({ text: textInstruction });

        // Use Native Audio model for inputting audio files
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-native-audio-preview-09-2025",
            contents: [{ parts: parts }],
            config: {
                responseModalities: [Modality.AUDIO]
            }
        });

        const audioPart = response.candidates?.[0]?.content?.parts?.[0];
        if (audioPart && audioPart.inlineData) {
             const base64Raw = audioPart.inlineData.data;
             const rawBytes = decode(base64Raw);
             const wavBase64 = await pcmToBase64Wav(rawBytes, 24000);
             
             // Update story
             const story = library.find(s => s.id === currentStoryId);
             if (story) {
                story.bgMusic = wavBase64;
                await updateCurrentStory(story.conversation, { bgMusic: wavBase64 });
                bgMusicPlayer.src = wavBase64;
                bgMusicPlayer.play().then(updateMediaControls);
             }
        } else {
            alert("No audio generated.");
        }

    } catch(e) {
        console.error("Sound Gen Error", e);
        alert("Failed to generate soundscape: " + (e as Error).message);
    } finally {
        mediaMixerBtn.classList.remove('pulse');
    }
}

// Wrapper to open the dialog
function openSoundGenDialog() {
    // Populate list
    audioAssetSelectionList.innerHTML = '';
    const audioAssets = assets.filter(a => a.type === 'audio');
    
    if (audioAssets.length === 0) {
        audioAssetSelectionList.innerHTML = '<div class="empty-state">No audio assets in library. Upload some first!</div>';
    } else {
        audioAssets.forEach(asset => {
            const row = document.createElement('label');
            row.className = 'checkbox-item';
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = asset.id;
            row.appendChild(cb);
            const span = document.createElement('span');
            span.textContent = asset.name;
            row.appendChild(span);
            audioAssetSelectionList.appendChild(row);
        });
    }
    
    soundGenDialog.showModal();
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
        // Silent fail for auto-narration to avoid spamming alerts, log only
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
    let fullTextAccumulated = '';

    // Use font override if present, else story font
    const fontToUse = currentSettings.manualFont || story.fontFamily;

    for await (const chunk of responseStream) {
      const parts = chunk.candidates?.[0]?.content?.parts || [];
      
      for (const part of parts) {
          if (part.text) {
              const text = part.text;
              partialText += text;
              fullTextAccumulated += text;

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
    
    // Auto-Narrate if enabled
    if (isNarratorEnabled && fullTextAccumulated) {
        // Strip markdown chars before speaking
        const speakableText = fullTextAccumulated.replace(/[#*`]/g, '');
        speakText(speakableText);
    }

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


// --- MEDIA WIDGET LOGIC ---

function updateMediaControls() {
    if (bgMusicPlayer.paused) {
        mediaPlayPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    } else {
        mediaPlayPauseBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
    }
    
    // Update Narrator Toggle Icon
    if (isNarratorEnabled) {
        narratorToggleBtn.innerHTML = '<span class="icon">🗣️</span>';
        narratorToggleBtn.classList.add('active');
        narratorToggleBtn.title = 'Disable Auto-Narration';
    } else {
        narratorToggleBtn.innerHTML = '<span class="icon">🔇</span>';
        narratorToggleBtn.classList.remove('active');
        narratorToggleBtn.title = 'Enable Auto-Narration';
    }

    bgVolumeSlider.value = bgMusicPlayer.volume.toString();
    narratorVolumeSlider.value = currentNarrationVolume.toString();
}

bgMusicPlayer.addEventListener('play', updateMediaControls);
bgMusicPlayer.addEventListener('pause', updateMediaControls);
bgMusicPlayer.addEventListener('volumechange', updateMediaControls);

mediaPlayPauseBtn.addEventListener('click', () => {
    if(bgMusicPlayer.src) {
        if(bgMusicPlayer.paused) bgMusicPlayer.play();
        else bgMusicPlayer.pause();
    } else {
        // Fallback: one click generate
        generateContextualAmbience();
    }
});

narratorToggleBtn.addEventListener('click', () => {
    isNarratorEnabled = !isNarratorEnabled;
    updateMediaControls();
});

bgVolumeSlider.addEventListener('input', (e) => {
    bgMusicPlayer.volume = parseFloat((e.target as HTMLInputElement).value);
});

narratorVolumeSlider.addEventListener('input', (e) => {
    currentNarrationVolume = parseFloat((e.target as HTMLInputElement).value);
    if (narrationGainNode) {
        narrationGainNode.gain.value = currentNarrationVolume;
    }
});

mediaSpeedSelect.addEventListener('change', () => {
    bgMusicPlayer.playbackRate = parseFloat(mediaSpeedSelect.value);
});

mediaGenerateBtn.addEventListener('click', generateContextualAmbience);
mediaMixerBtn.addEventListener('click', openSoundGenDialog);


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

libTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        libTabs.forEach(t => t.classList.remove('active'));
        libContents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        const targetId = (tab as HTMLElement).dataset.target;
        if(targetId) document.getElementById(targetId)?.classList.add('active');
    });
});

assetUploadInput.addEventListener('change', handleAssetUpload);


// Form & Settings
promptForm.addEventListener('submit', (e) => {
  e.preventDefault();
  let prompt = promptInput.value.trim();
  if (!prompt) {
      prompt = "Continue the story naturally."; // Default prompt logic
  }
  generateContent(prompt);
  promptInput.value = '';
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
    updateMediaControls();
});

// Regenerate Events
closeRegenBtn.addEventListener('click', () => regenerateDialog.close());
cancelRegenBtn.addEventListener('click', () => regenerateDialog.close());
confirmRegenBtn.addEventListener('click', () => {
    if (turnToRegenerate && turnElementToRegenerate) {
        const prompt = regenPromptInput.value.trim();
        regenerateDialog.close();
        performRegeneration(turnToRegenerate, turnElementToRegenerate, prompt);
    }
});

// Sound Gen Events
closeSoundGenBtn.addEventListener('click', () => soundGenDialog.close());
cancelSoundGenBtn.addEventListener('click', () => soundGenDialog.close());
confirmSoundGenBtn.addEventListener('click', () => generateGuidedAmbience());


// Initialization
loadSettings();
initLibrary();