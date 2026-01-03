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

// Main Media Center Elements
const mainMediaCenter = document.getElementById('main-media-center') as HTMLElement;
const mmcCancelBtn = document.getElementById('mmc-cancel-btn') as HTMLButtonElement;
const mmcOkBtn = document.getElementById('mmc-ok-btn') as HTMLButtonElement;
const mmcBgVolume = document.getElementById('mmc-bg-volume') as HTMLInputElement;
const mmcNarratorVolume = document.getElementById('mmc-narrator-volume') as HTMLInputElement;
const mmcSpeed = document.getElementById('mmc-speed') as HTMLSelectElement;
const mmcPlayPause = document.getElementById('mmc-play-pause') as HTMLButtonElement;
const mmcNarratorToggle = document.getElementById('mmc-narrator-toggle') as HTMLButtonElement;
const mmcStopAll = document.getElementById('mmc-stop-all') as HTMLButtonElement;
const mmcGenerateAmbience = document.getElementById('mmc-generate-ambience') as HTMLButtonElement;
const mmcOpenMixer = document.getElementById('mmc-open-mixer') as HTMLButtonElement;
const mmcTtsVoice = document.getElementById('mmc-tts-voice') as HTMLSelectElement;
const mmcImageRatio = document.getElementById('mmc-image-ratio') as HTMLSelectElement;
const mmcImageStyle = document.getElementById('mmc-image-style') as HTMLSelectElement;

// Mini Control Deck Elements
const miniControlDeck = document.getElementById('mini-control-deck') as HTMLElement;
const miniPlayPause = document.getElementById('mini-play-pause') as HTMLButtonElement;
const miniNarratorToggle = document.getElementById('mini-narrator-toggle') as HTMLButtonElement;
const miniExpand = document.getElementById('mini-expand') as HTMLButtonElement;
const footerMediaBtn = document.getElementById('footer-media-btn') as HTMLButtonElement;

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

// Settings Elements (Legacy/Global)
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
const imageApiKeyInput = document.getElementById('image-api-key') as HTMLInputElement;
const imageCountInput = document.getElementById('image-count') as HTMLInputElement;
const imageNegativePromptInput = document.getElementById('image-negative-prompt') as HTMLTextAreaElement;

// Audio & Theme Settings
const storyFontSelect = document.getElementById('story-font') as HTMLSelectElement;
const ttsVoiceSelect = document.getElementById('tts-voice') as HTMLSelectElement; // Legacy hidden in dialog
const borderUploadInput = document.getElementById('border-upload') as HTMLInputElement;
const musicUploadInput = document.getElementById('music-upload') as HTMLInputElement;
const clearBorderBtn = document.getElementById('clear-border-btn') as HTMLButtonElement;
const clearMusicBtn = document.getElementById('clear-music-btn') as HTMLButtonElement;


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
let narrationSource: AudioBufferSourceNode | null = null; // Track current narrator source
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
    
    // Stop any currently playing narration to prevent overlap
    if (narrationSource) {
        try { narrationSource.stop(); } catch(e) {}
        narrationSource = null;
    }
    
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
            source.loop = false; // Ensure no loop
            // Connect to Narration Gain Node
            source.connect(narrationGainNode);
            narrationSource = source; // Store reference
            source.start(0);
            
            source.onended = () => {
                if(narrationSource === source) narrationSource = null;
            };

        } catch (decodeError) {
             console.warn("Standard decode failed, trying raw PCM assumption (24kHz Mono)", decodeError);
             
             const pcmData = new Int16Array(bufferCopy);
             const audioBuffer = audioContext.createBuffer(1, pcmData.length, 24000);
             const channelData = audioBuffer.getChannelData(0);
             for(let i=0; i<pcmData.length; i++) {
                 channelData[i] = pcmData[i] / 32768.0;
             }
             const source = audioContext.createBufferSource();
             source.buffer = audioBuffer;
             source.loop = false;
             source.connect(narrationGainNode);
             narrationSource = source; // Store reference
             source.start(0);
             
             source.onended = () => {
                if(narrationSource === source) narrationSource = null;
            };
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
        bgMusicPlayer.playbackRate = parseFloat(mmcSpeed.value) || 1.0;
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
        if (confirm("Set this image as the story border theme?")) {
            await updateCurrentStory(story.conversation, { themeImage: asset.data });
            loadStory(story.id);
        }
    } else if (asset.type === 'audio') {
        if(confirm("Set this audio as the background music?")) {
            await updateCurrentStory(story.conversation, { bgMusic: asset.data });
            bgMusicPlayer.src = asset.data;
            bgMusicPlayer.play().then(updateMediaControls);
        }
    } else if (asset.type === 'video') {
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
  // Sync Main Dialog
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

  imageProviderSelect.value = currentSettings.imageProvider;
  imageModelSelect.value = currentSettings.imageModel;
  imageApiKeyInput.value = currentSettings.imageApiKey;
  imageCountInput.value = currentSettings.imageGenerationCount.toString();
  imageNegativePromptInput.value = currentSettings.imageNegativePrompt;
  
  // Sync Media Center Inputs
  mmcTtsVoice.value = currentSettings.ttsVoice;
  mmcImageRatio.value = currentSettings.imageAspectRatio;
  mmcImageStyle.value = currentSettings.imageStyle;
  
  storyFontSelect.value = currentSettings.manualFont;
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
  currentSettings.imageGenerationCount = parseInt(imageCountInput.value, 10) || 1;
  currentSettings.imageNegativePrompt = imageNegativePromptInput.value.trim();
  
  // Sync back from Media Center if that's open, else use defaults.
  // Since user might click 'Save' on Main Settings, we save inputs from Main Settings if they exist, but here those inputs are now in Media Center.
  // Actually, let's just make Media Center inputs live-update settings or save on Close.
  // For simplicity, we assume saving from Settings Modal saves global keys.
  
  currentSettings.manualFont = storyFontSelect.value;
  
  // Handle File Uploads (Update current story immediately)
  const borderFile = borderUploadInput.files?.[0];
  const musicFile = musicUploadInput.files?.[0];
  
  if (currentStoryId && (borderFile || musicFile || currentSettings.manualFont)) {
      const updates: Partial<Story> = {};
      const updatePromises = [];
      if (borderFile) updatePromises.push(blobToBase64(borderFile).then(b64 => updates.themeImage = b64));
      if (musicFile) updatePromises.push(blobToBase64(musicFile).then(b64 => {
              updates.bgMusic = b64;
              bgMusicPlayer.src = b64;
              bgMusicPlayer.play().then(updateMediaControls);
      }));
      if (currentSettings.manualFont) updates.fontFamily = currentSettings.manualFont;
      
      Promise.all(updatePromises).then(() => {
          const story = library.find(s => s.id === currentStoryId);
          if (story) updateCurrentStory(story.conversation, updates).then(() => loadStory(story.id));
      });
  }

  saveSettingsToStorage();
  settingsDialog.close();
}

function saveMediaCenterSettings() {
    currentSettings.ttsVoice = mmcTtsVoice.value;
    currentSettings.imageAspectRatio = mmcImageRatio.value;
    currentSettings.imageStyle = mmcImageStyle.value;
    saveSettingsToStorage();
}


// --- MEDIA CENTER LOGIC ---

function openMediaCenter() {
    // Populate values
    mmcBgVolume.value = bgMusicPlayer.volume.toString();
    mmcNarratorVolume.value = currentNarrationVolume.toString();
    mmcSpeed.value = bgMusicPlayer.playbackRate.toString();
    mmcTtsVoice.value = currentSettings.ttsVoice;
    mmcImageRatio.value = currentSettings.imageAspectRatio;
    mmcImageStyle.value = currentSettings.imageStyle;
    updateNarratorToggleUI();

    mainMediaCenter.classList.add('open');
}

function closeMediaCenter(save: boolean) {
    if (save) saveMediaCenterSettings();
    mainMediaCenter.classList.remove('open');
}

function updateNarratorToggleUI() {
    const text = isNarratorEnabled ? "Disable Narration" : "Enable Narration";
    mmcNarratorToggle.textContent = text;
    mmcNarratorToggle.style.backgroundColor = isNarratorEnabled ? 'var(--primary-color)' : '';
    mmcNarratorToggle.style.color = isNarratorEnabled ? '#000' : '';
    
    // Mini
    miniNarratorToggle.innerHTML = isNarratorEnabled ? '<span class="icon">🗣️</span>' : '<span class="icon">🔇</span>';
    miniNarratorToggle.classList.toggle('active', isNarratorEnabled);
}

function updateMediaControls() {
    // Sync Mini Deck with BG Player state
    if (bgMusicPlayer.paused) {
        miniPlayPause.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    } else {
        miniPlayPause.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
    }
}

// Event Listeners for Media Center
mmcCancelBtn.addEventListener('click', () => closeMediaCenter(false));
mmcOkBtn.addEventListener('click', () => closeMediaCenter(true));

mmcBgVolume.addEventListener('input', () => bgMusicPlayer.volume = parseFloat(mmcBgVolume.value));
mmcNarratorVolume.addEventListener('input', () => {
    currentNarrationVolume = parseFloat(mmcNarratorVolume.value);
    if(narrationGainNode) narrationGainNode.gain.value = currentNarrationVolume;
});
mmcSpeed.addEventListener('change', () => bgMusicPlayer.playbackRate = parseFloat(mmcSpeed.value));

mmcPlayPause.addEventListener('click', () => {
    if(bgMusicPlayer.src) {
        if(bgMusicPlayer.paused) bgMusicPlayer.play(); else bgMusicPlayer.pause();
    }
});

mmcNarratorToggle.addEventListener('click', () => {
    isNarratorEnabled = !isNarratorEnabled;
    updateNarratorToggleUI();
});

mmcStopAll.addEventListener('click', () => {
    bgMusicPlayer.pause();
    if(narrationSource) {
        try { narrationSource.stop(); } catch(e){}
        narrationSource = null;
    }
    updateMediaControls();
});

mmcGenerateAmbience.addEventListener('click', generateContextualAmbience);
mmcOpenMixer.addEventListener('click', openSoundGenDialog);

// Event Listeners for Mini Deck
miniPlayPause.addEventListener('click', () => {
    if(bgMusicPlayer.src) {
        if(bgMusicPlayer.paused) bgMusicPlayer.play(); else bgMusicPlayer.pause();
    } else {
        generateContextualAmbience();
    }
});
miniNarratorToggle.addEventListener('click', () => {
    isNarratorEnabled = !isNarratorEnabled;
    updateNarratorToggleUI();
});
miniExpand.addEventListener('click', openMediaCenter);
footerMediaBtn.addEventListener('click', openMediaCenter);

// BG Music Events
bgMusicPlayer.addEventListener('play', updateMediaControls);
bgMusicPlayer.addEventListener('pause', updateMediaControls);


// --- GENERATION & RENDER LOGIC ---

function closeLibrarySidebar() {
    librarySidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
}

function openSoundGenDialog() {
    soundGenDialog.showModal();
}

function setLoading(isLoading: boolean) {
    submitButton.disabled = isLoading;
    promptInput.disabled = isLoading;
    if(isLoading) {
        submitButton.textContent = '...';
        document.body.style.cursor = 'wait';
    } else {
        submitButton.textContent = 'Send';
        document.body.style.cursor = 'default';
        promptInput.focus();
    }
}

async function generateStoryThemeMetadata(prompt: string): Promise<{font?: string, image?: string}> {
    try {
        const apiKey = currentSettings.chatApiKey || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey });
        
        const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: `Analyze the following story prompt and suggest a font family (options: 'Merriweather', 'Roboto', 'Courier Prime', 'Dancing Script') and a visual theme description for a border. \nPrompt: ${prompt}\nOutput JSON format: {"font": "...", "themeDescription": "..."}`,
             config: { responseMimeType: 'application/json' }
        });
        
        const json = JSON.parse(response.text);
        const font = json.font;
        const themeDesc = json.themeDescription;
        
        let image = undefined;
        if (themeDesc && currentSettings.imageGenerationCount > 0) {
            // Generate border image
             const imgResponse = await ai.models.generateContent({
                 model: 'gemini-2.5-flash-image',
                 contents: { parts: [{ text: `A decorative border texture, ${themeDesc}, white background, vector style` }] }
             });
             for(const part of imgResponse.candidates?.[0]?.content?.parts || []) {
                 if (part.inlineData) {
                     image = `data:image/png;base64,${part.inlineData.data}`;
                     break;
                 }
             }
        }
        
        return { font, image };
    } catch (e) {
        console.warn("Metadata generation failed", e);
        return {};
    }
}

async function generateContextualAmbience() {
    if(!currentStoryId) return;
    const story = library.find(s => s.id === currentStoryId);
    if (!story) return;
    
    // Get context
    const textTurns = story.conversation.filter(t => t.type === 'text').slice(-3);
    const context = textTurns.map(t => t.content).join('\n');
    
    // Ask Gemini for sound prompt
    try {
        const apiKey = currentSettings.chatApiKey || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Describe the ambient sound for this scene in 10 words or less:\n${context}`
        });
        soundGenPromptInput.value = response.text.trim();
        openSoundGenDialog();
    } catch (e) {
        soundGenPromptInput.value = "Ambient sound";
        openSoundGenDialog();
    }
}

function createTurnControls(turn: Turn): HTMLElement {
    const div = document.createElement('div');
    div.className = 'turn-controls';
    
    const delBtn = document.createElement('button');
    delBtn.innerText = '🗑️';
    delBtn.onclick = async () => {
        if(!confirm("Delete this turn?")) return;
        if(currentStoryId) {
             const story = library.find(s => s.id === currentStoryId);
             if(story) {
                 story.conversation = story.conversation.filter(t => t.id !== turn.id);
                 await updateCurrentStory(story.conversation);
                 renderConversation(story);
             }
        }
    };
    div.appendChild(delBtn);
    
    const regenBtn = document.createElement('button');
    regenBtn.innerText = '🔄';
    regenBtn.onclick = () => {
        turnToRegenerate = turn;
        regenerateDialog.showModal();
    };
    div.appendChild(regenBtn);

    return div;
}

async function renderTurn(turn: Turn, themeImage?: string, fontFamily?: string) {
    const el = document.createElement('div');
    el.className = `turn-item turn-${turn.type}`;
    el.dataset.id = turn.id;
    if (fontFamily) el.style.fontFamily = fontFamily;
    
    const content = document.createElement('div');
    content.className = 'turn-content';
    
    if (turn.type === 'text') {
        content.innerHTML = await marked.parse(turn.content);
    } else if (turn.type === 'image') {
        const img = document.createElement('img');
        img.src = turn.content;
        content.appendChild(img);
    } else if (turn.type === 'video') {
        const vid = document.createElement('video');
        vid.src = turn.content;
        vid.controls = true;
        content.appendChild(vid);
    }
    
    if (themeImage) {
        el.style.border = '10px solid transparent';
        el.style.borderImage = `url(${themeImage}) 30 round`;
    }
    
    el.appendChild(content);
    el.appendChild(createTurnControls(turn));
    conversationContainer.appendChild(el);
}

async function renderConversation(story: Story) {
    conversationContainer.innerHTML = '';
    if (story.conversation.length === 0) {
        conversationContainer.appendChild(welcomeMessage);
        welcomeMessage.style.display = 'block';
    } else {
        welcomeMessage.style.display = 'none';
        for (const turn of story.conversation) {
            await renderTurn(turn, story.themeImage, story.fontFamily || currentSettings.manualFont);
        }
    }
    conversationContainer.scrollTop = conversationContainer.scrollHeight;
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

  if (!story.themeImage && !story.fontFamily) {
      generateStoryThemeMetadata(prompt).then(async (metadata) => {
          const updates: Partial<Story> = {};
          if (metadata.image) updates.themeImage = metadata.image;
          if (metadata.font) updates.fontFamily = metadata.font;
          if (Object.keys(updates).length > 0) {
              await updateCurrentStory(story.conversation, updates);
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
    
    // Check if we need image config from Media Center settings
    const config: any = { responseModalities: modalities };
    if (supportsImages && currentSettings.imageGenerationCount > 0 && currentSettings.imageAspectRatio) {
         config.imageConfig = { aspectRatio: currentSettings.imageAspectRatio };
    }

    const systemInstructions: string[] = [];
    if (currentSettings.chatWritingStyle && currentSettings.chatWritingStyle !== 'standard') {
        let styleDesc = currentSettings.chatWritingStyle;
        if(styleDesc === 'simple') styleDesc = 'simple and easy to understand (for kids)';
        systemInstructions.push(`Writing Style: ${styleDesc}.`);
    }
    if (currentSettings.chatOutputLength) {
        // ... (Existing output length logic)
    }

    if (supportsImages && currentSettings.imageGenerationCount > 0) {
      if (currentSettings.imageStyle && currentSettings.imageStyle !== 'none') {
        systemInstructions.push(`Visual Style for Images: ${currentSettings.imageStyle.replace(/-/g, ' ')}.`);
      }
      if (currentSettings.imageNegativePrompt) {
        systemInstructions.push(`Negative Prompt: ${currentSettings.imageNegativePrompt}.`);
      }
      systemInstructions.push(`Generate ${currentSettings.imageGenerationCount} image(s).`);
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
      finalPrompt = `${finalPrompt}\n\n[System Config]\n${systemInstructions.join('\n')}`;
    }

    const responseStream = await ai.models.generateContentStream({
      model: chatModel,
      contents: finalPrompt,
      config: config,
    });

    let partialText = '';
    let currentTextTurn: Turn | null = null;
    let fullTextAccumulated = '';
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
              if (currentTextTurn) { currentTextTurn = null; partialText = ''; }
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
    
    // Auto-Narrate
    if (isNarratorEnabled && fullTextAccumulated) {
        const speakableText = fullTextAccumulated.replace(/[#*`]/g, '');
        speakText(speakableText);
    }

  } catch (e) {
    console.error('Generation Error:', e);
    // ... Error handling
  } finally {
    setLoading(false);
  }
}

// ... (Existing Event Listeners for other UI elements) ...

// Form & Settings
promptForm.addEventListener('submit', (e) => {
  e.preventDefault();
  let prompt = promptInput.value.trim();
  if (!prompt) {
      prompt = "Continue the story naturally.";
  }
  generateContent(prompt);
  promptInput.value = '';
});

// Added Listeners for missing elements functionality
libraryToggleBtn.addEventListener('click', () => {
    librarySidebar.classList.add('open');
    sidebarOverlay.classList.add('open');
});
closeSidebarBtn.addEventListener('click', closeLibrarySidebar);
sidebarOverlay.addEventListener('click', closeLibrarySidebar);
newStoryBtn.addEventListener('click', createNewStory);
assetUploadInput.addEventListener('change', handleAssetUpload);
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
closeSoundGenBtn.addEventListener('click', () => soundGenDialog.close());
cancelSoundGenBtn.addEventListener('click', () => soundGenDialog.close());
closeRegenBtn.addEventListener('click', () => regenerateDialog.close());
cancelRegenBtn.addEventListener('click', () => regenerateDialog.close());

// Initialization
loadSettings();
initLibrary();
updateNarratorToggleUI();
