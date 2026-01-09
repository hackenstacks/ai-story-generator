
/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Modality, GenerateContentResponse } from '@google/genai';
import { marked } from 'marked';

// --- DOM ELEMENT REFERENCES ---
const promptForm = document.getElementById('prompt-form') as HTMLFormElement;
const promptInput = document.getElementById('prompt-input') as HTMLInputElement;
const submitButton = document.getElementById('submit-button') as HTMLButtonElement;
const conversationContainer = document.getElementById('conversation-container') as HTMLElement;
const welcomeMessage = document.getElementById('welcome-message') as HTMLElement;
const bgMusicPlayer = document.getElementById('bg-music-player') as HTMLAudioElement;
const studioFooter = document.getElementById('studio-footer') as HTMLElement;

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
const mmcGenerateVideo = document.getElementById('mmc-generate-video') as HTMLButtonElement;
const mmcTtsVoice = document.getElementById('mmc-tts-voice') as HTMLSelectElement;
const mmcImageRatio = document.getElementById('mmc-image-ratio') as HTMLSelectElement;
const mmcImageStyle = document.getElementById('mmc-image-style') as HTMLSelectElement;

// Mini Control Deck Elements (Header)
const miniPlayPause = document.getElementById('mini-play-pause') as HTMLButtonElement;
const miniNarratorToggle = document.getElementById('mini-narrator-toggle') as HTMLButtonElement;
const miniExpand = document.getElementById('mini-expand') as HTMLButtonElement;
const footerMediaBtn = document.getElementById('footer-media-btn') as HTMLButtonElement;

// Main Menu Elements
const mainMenu = document.getElementById('main-menu') as HTMLElement;
const mainMenuToggle = document.getElementById('main-menu-toggle') as HTMLButtonElement;
const closeMenuBtn = document.getElementById('close-menu-btn') as HTMLButtonElement;
const sidebarOverlay = document.getElementById('sidebar-overlay') as HTMLElement;

// App Modes
const modeBtns = document.querySelectorAll('.mode-btn');
const scriptEditorContainer = document.getElementById('script-editor-container') as HTMLElement;
const playerContainer = document.getElementById('player-container') as HTMLElement;
const scriptTextarea = document.getElementById('script-textarea') as HTMLTextAreaElement;
const scriptUpload = document.getElementById('script-upload') as HTMLInputElement;
const compileScriptBtn = document.getElementById('compile-script-btn') as HTMLButtonElement;
const exitPlayerBtn = document.getElementById('exit-player-btn') as HTMLButtonElement;
const playerStage = document.getElementById('player-stage') as HTMLElement;
const playerPrevBtn = document.getElementById('player-prev') as HTMLButtonElement;
const playerNextBtn = document.getElementById('player-next') as HTMLButtonElement;

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
const importStoryBtn = document.getElementById('import-story-btn') as HTMLButtonElement;
const storyList = document.getElementById('story-list') as HTMLElement;
const assetsList = document.getElementById('assets-list') as HTMLElement;
const assetsFilterLabel = document.getElementById('assets-filter-label') as HTMLElement;
const libTabs = document.querySelectorAll('.lib-tab');
const libContents = document.querySelectorAll('.lib-content');
const assetUploadInput = document.getElementById('asset-upload') as HTMLInputElement;
const docUploadInput = document.getElementById('doc-upload') as HTMLInputElement;

// Settings Elements
const settingsButton = document.getElementById('settings-button') as HTMLButtonElement;
const settingsDialog = document.getElementById('settings-dialog') as HTMLDialogElement;
const settingsForm = document.getElementById('settings-form') as HTMLFormElement;
const closeSettingsBtn = document.getElementById('close-settings-btn') as HTMLButtonElement;
const cancelSettingsBtn = document.getElementById('cancel-settings') as HTMLButtonElement;
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Asset Action Dialog
const assetActionDialog = document.getElementById('asset-action-dialog') as HTMLDialogElement;
const aadPreviewContainer = document.getElementById('aad-preview-container') as HTMLElement;
const aadName = document.getElementById('aad-name') as HTMLElement;
const aadInsertBtn = document.getElementById('aad-insert-btn') as HTMLButtonElement;
const aadThemeBtn = document.getElementById('aad-theme-btn') as HTMLButtonElement;
const aadDeleteBtn = document.getElementById('aad-delete-btn') as HTMLButtonElement;
const closeAadBtn = document.getElementById('close-aad-btn') as HTMLButtonElement;

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

// Video Generation Dialog Elements
const videoGenDialog = document.getElementById('video-gen-dialog') as HTMLDialogElement;
const closeVideoGenBtn = document.getElementById('close-video-gen-btn') as HTMLButtonElement;
const cancelVideoGenBtn = document.getElementById('cancel-video-gen-btn') as HTMLButtonElement;
const confirmVideoGenBtn = document.getElementById('confirm-video-gen-btn') as HTMLButtonElement;
const videoGenPromptInput = document.getElementById('video-gen-prompt') as HTMLTextAreaElement;

// Help Elements
const helpButton = document.getElementById('help-button') as HTMLButtonElement;
const helpDialog = document.getElementById('help-dialog') as HTMLDialogElement;
const closeHelpBtn = document.getElementById('close-help-btn') as HTMLButtonElement;
const closeHelpActionBtn = document.getElementById('close-help-action') as HTMLButtonElement;


// Settings Form Inputs
const chatProviderSelect = document.getElementById('chat-provider') as HTMLSelectElement;
const chatModelSelect = document.getElementById('chat-model-select') as HTMLSelectElement;
const chatCustomModelInput = document.getElementById('chat-custom-model') as HTMLInputElement;
// API keys are handled via process.env.API_KEY, removing user input references
const chatModelGroup = document.getElementById('chat-model-group') as HTMLElement;
const chatCustomModelGroup = document.getElementById('chat-custom-model-group') as HTMLElement;
const imageProviderSelect = document.getElementById('image-provider') as HTMLSelectElement;
const imageModelSelect = document.getElementById('image-model-select') as HTMLSelectElement;
const imageCountInput = document.getElementById('image-count') as HTMLInputElement;
const imageNegativePromptInput = document.getElementById('image-negative-prompt') as HTMLTextAreaElement;

// Audio & Theme Settings
const storyFontSelect = document.getElementById('story-font') as HTMLSelectElement;
const borderUploadInput = document.getElementById('border-upload') as HTMLInputElement;
const clearBorderBtn = document.getElementById('clear-border-btn') as HTMLButtonElement;


// --- TYPE DEFINITIONS ---
type Turn = {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio';
  content: string;
};

interface Story {
    id: string;
    title: string;
    conversation: Turn[];
    script?: string;
    createdAt: number;
    updatedAt: number;
    themeImage?: string; 
    fontFamily?: string; 
    bgMusic?: string; 
}

interface Asset {
    id: string;
    type: 'image' | 'audio' | 'video';
    name: string;
    data: string; 
    mimeType: string;
    createdAt: number;
    storyId?: string;
}

interface AppSettings {
  chatProvider: 'google' | 'custom';
  chatModel: string;
  chatWritingStyle: string;
  chatOutputLength: string;
  imageProvider: 'google';
  imageModel: string;
  imageAspectRatio: string;
  imageStyle: string;
  imageNegativePrompt: string;
  imageGenerationCount: number;
  ttsVoice: string;
  manualFont: string; 
}

// --- STATE ---
let library: Story[] = [];
let assets: Asset[] = [];
let currentStoryId: string | null = null;
let audioContext: AudioContext | null = null;
let narrationGainNode: GainNode | null = null;
let narrationSource: AudioBufferSourceNode | null = null; 
let currentNarrationVolume = 1.0;
let isNarratorEnabled = false;
let currentMode: 'editor' | 'studio' | 'player' = 'studio';
let playerSceneIndex = 0; 
let turnToRegenerate: Turn | null = null;
let selectedAssetForAction: Asset | null = null;

const DEFAULT_SETTINGS: AppSettings = {
  chatProvider: 'google',
  chatModel: 'gemini-2.5-flash-image',
  chatWritingStyle: 'standard',
  chatOutputLength: 'medium',
  imageProvider: 'google',
  imageModel: 'gemini-2.5-flash-image',
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
const DB_VERSION = 2; 
const STORE_STORIES = 'stories';
const STORE_ASSETS = 'assets';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_STORIES)) db.createObjectStore(STORE_STORIES, { keyPath: 'id' });
      if (!db.objectStoreNames.contains(STORE_ASSETS)) db.createObjectStore(STORE_ASSETS, { keyPath: 'id' });
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
    } catch (e) { console.error(e); return []; }
}
async function saveStoryToDB(story: Story): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_STORIES, 'readwrite');
            const store = tx.objectStore(STORE_STORIES);
            store.put(story).onsuccess = () => resolve();
        });
    } catch (e) { console.error(e); }
}
async function deleteStoryFromDB(id: string): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_STORIES, 'readwrite');
            const store = tx.objectStore(STORE_STORIES);
            store.delete(id).onsuccess = () => resolve();
        });
    } catch (e) { console.error(e); }
}

// -- ASSETS DB OPS --
async function getAllAssetsFromDB(): Promise<Asset[]> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_ASSETS, 'readonly');
            const store = tx.objectStore(STORE_ASSETS);
            store.getAll().onsuccess = (e) => resolve((e.target as any).result);
        });
    } catch (e) { console.error(e); return []; }
}
async function saveAssetToDB(asset: Asset): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_ASSETS, 'readwrite');
            const store = tx.objectStore(STORE_ASSETS);
            store.put(asset).onsuccess = () => resolve();
        });
    } catch (e) { console.error(e); }
}
async function deleteAssetFromDB(id: string): Promise<void> {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_ASSETS, 'readwrite');
            const store = tx.objectStore(STORE_ASSETS);
            store.delete(id).onsuccess = () => resolve();
        });
    } catch (e) { console.error(e); }
}


// --- HELPERS ---
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}
function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// --- AUDIO LOGIC ---
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        narrationGainNode = audioContext.createGain();
        narrationGainNode.gain.value = currentNarrationVolume;
        narrationGainNode.connect(audioContext.destination);
    }
}

/** Helper to decode raw PCM data from Gemini API as per guidelines */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

async function playAudioBytes(base64Data: string) {
    initAudioContext();
    if (!audioContext || !narrationGainNode) return;
    if (narrationSource) { try { narrationSource.stop(); } catch(e) {} narrationSource = null; }
    if (audioContext.state === 'suspended') await audioContext.resume();

    try {
        const bytes = decode(base64Data);
        // Gemini raw PCM audio decoding as per guidelines
        const audioBuffer = await decodeAudioData(bytes, audioContext, 24000, 1);
        playBuffer(audioBuffer);
    } catch (e) { console.error("Error playing audio:", e); }
}

function playBuffer(buffer: AudioBuffer) {
    if(!audioContext || !narrationGainNode) return;
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(narrationGainNode);
    narrationSource = source;
    source.start(0);
    source.onended = () => { if(narrationSource === source) narrationSource = null; };
}

async function speakText(text: string) {
    if (!text || !text.trim()) return;
    try {
        // ALWAYS use process.env.API_KEY directly for initialization
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: currentSettings.ttsVoice || 'Kore' } } },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) await playAudioBytes(base64Audio);
    } catch (error) { console.error("TTS Error:", error); }
}

// --- LIBRARY LOGIC ---
async function initLibrary() {
    library = await getAllStoriesFromDB();
    assets = await getAllAssetsFromDB();
    renderLibraryList();
    renderAssetsList();
    if (library.length > 0 && !currentStoryId) {
        const recent = library.sort((a,b) => b.updatedAt - a.updatedAt)[0];
        loadStory(recent.id);
    }
    updateMediaControls();
}

async function createNewStory() {
    const newStory: Story = {
        id: generateId(),
        title: 'New Story Project',
        conversation: [],
        script: '',
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
    scriptTextarea.value = story.script || '';
    renderConversation(story); 
    renderLibraryList();
    renderAssetsList();
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
    if(!confirm('Delete this project?')) return;
    await deleteStoryFromDB(id);
    library = library.filter(s => s.id !== id);
    if (currentStoryId === id) {
        currentStoryId = null;
        conversationContainer.innerHTML = '';
        conversationContainer.appendChild(welcomeMessage); 
        welcomeMessage.style.display = 'block';
        scriptTextarea.value = '';
        bgMusicPlayer.pause();
        updateMediaControls();
    }
    renderLibraryList();
}

async function updateCurrentStory(conversation: Turn[], updates: Partial<Story> = {}) {
    if (!currentStoryId) await createNewStory();
    const story = library.find(s => s.id === currentStoryId);
    if (!story) return;
    story.conversation = conversation;
    story.updatedAt = Date.now();
    Object.assign(story, updates);
    if (story.title === 'New Story Project' && conversation.length > 0 && conversation[0].type === 'text') {
         let text = conversation[0].content.replace(/[#*`]/g, '').trim();
         if (text.length > 30) text = text.substring(0, 30) + '...';
         if (text) story.title = text;
    }
    await saveStoryToDB(story);
    renderLibraryList();
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
        info.innerHTML = `<span class="story-title">${story.title}</span><div class="story-date">${formatDate(story.updatedAt)}</div>`;
        const delBtn = document.createElement('button');
        delBtn.className = 'delete-story-btn';
        delBtn.innerHTML = '&times;';
        delBtn.onclick = (e) => deleteStory(story.id, e);
        item.append(info, delBtn);
        storyList.appendChild(item);
    });
}

function renderAssetsList() {
    assetsList.innerHTML = '';
    let filteredAssets = [...assets];
    if (currentStoryId) {
        filteredAssets.sort((a,b) => (a.storyId === currentStoryId ? -1 : 1));
        assetsFilterLabel.style.display = 'block';
    } else {
        filteredAssets.sort((a,b) => b.createdAt - a.createdAt);
        assetsFilterLabel.style.display = 'none';
    }

    filteredAssets.forEach(asset => {
        const item = document.createElement('div');
        item.className = 'asset-item';
        if(currentStoryId && asset.storyId === currentStoryId) item.style.borderLeft = '3px solid var(--primary-color)';
        
        // Use openAssetActionDialog instead of direct applyAssetToStory
        item.onclick = () => openAssetActionDialog(asset);
        
        if (asset.type === 'image') {
            const img = document.createElement('img'); img.src = asset.data; img.className = 'asset-preview-img'; item.appendChild(img);
        } else if (asset.type === 'video') {
            const vid = document.createElement('video'); vid.src = asset.data; vid.className = 'asset-preview-video'; vid.muted = true; item.appendChild(vid);
        } else {
            const icon = document.createElement('div'); icon.className = 'asset-icon'; icon.textContent = '🎵'; item.appendChild(icon);
        }
        
        // FIX: Fixed error "Property 'div' does not exist on type 'Document'" on line 528
        const info = document.createElement('div'); info.className = 'asset-info';
        info.innerHTML = `<span class="asset-name">${asset.name}</span>`;
        const delBtn = document.createElement('button'); delBtn.className = 'delete-asset-btn'; delBtn.innerHTML = '&times;'; 
        delBtn.onclick = async (e) => { e.stopPropagation(); if(confirm("Delete?")) { await deleteAssetFromDB(asset.id); assets = assets.filter(a=>a.id!==asset.id); renderAssetsList(); } };
        item.append(info, delBtn);
        assetsList.appendChild(item);
    });
}

// --- NEW ASSET ACTION DIALOG ---
function openAssetActionDialog(asset: Asset) {
    if(!currentStoryId) { alert("Select a project first."); return; }
    selectedAssetForAction = asset;
    
    aadName.textContent = asset.name;
    aadPreviewContainer.innerHTML = '';
    
    if (asset.type === 'image') {
        const img = document.createElement('img'); img.src = asset.data; 
        img.style.maxWidth = '100%'; img.style.maxHeight = '200px'; img.style.borderRadius = '8px';
        aadPreviewContainer.appendChild(img);
        aadThemeBtn.style.display = 'block';
    } else if (asset.type === 'video') {
        const vid = document.createElement('video'); vid.src = asset.data; vid.controls = true;
        vid.style.maxWidth = '100%'; vid.style.maxHeight = '200px';
        aadPreviewContainer.appendChild(vid);
        aadThemeBtn.style.display = 'none';
    } else {
        const icon = document.createElement('div'); icon.textContent = '🎵'; icon.style.fontSize = '4rem';
        aadPreviewContainer.appendChild(icon);
        aadThemeBtn.textContent = 'Set as Background Music';
        aadThemeBtn.style.display = 'block';
    }
    
    assetActionDialog.showModal();
}

// Dialog Button Logic
aadInsertBtn.addEventListener('click', async () => {
    if(!selectedAssetForAction || !currentStoryId) return;
    const story = library.find(s => s.id === currentStoryId);
    if(story) {
        // Insert into conversation
        const turn: Turn = { id: generateId(), type: selectedAssetForAction.type as any, content: selectedAssetForAction.data };
        story.conversation.push(turn);
        await updateCurrentStory(story.conversation);
        renderConversation(story);
        assetActionDialog.close();
    }
});

aadThemeBtn.addEventListener('click', async () => {
    if(!selectedAssetForAction || !currentStoryId) return;
    const story = library.find(s => s.id === currentStoryId);
    if(!story) return;
    
    if(selectedAssetForAction.type === 'image') {
        await updateCurrentStory(story.conversation, { themeImage: selectedAssetForAction.data });
        loadStory(story.id); // Reload to apply theme
    } else if (selectedAssetForAction.type === 'audio') {
        await updateCurrentStory(story.conversation, { bgMusic: selectedAssetForAction.data });
        bgMusicPlayer.src = selectedAssetForAction.data;
        bgMusicPlayer.play().then(updateMediaControls);
    }
    assetActionDialog.close();
});

aadDeleteBtn.addEventListener('click', async () => {
    if(!selectedAssetForAction) return;
    if(confirm("Permanently delete this asset?")) {
        await deleteAssetFromDB(selectedAssetForAction.id);
        assets = assets.filter(a => a.id !== selectedAssetForAction!.id);
        renderAssetsList();
        assetActionDialog.close();
    }
});

closeAadBtn.addEventListener('click', () => assetActionDialog.close());


// --- DOCUMENT IMPORT LOGIC ---
docUploadInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if(!file || !currentStoryId) return;
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
        const content = ev.target?.result as string;
        const story = library.find(s => s.id === currentStoryId);
        if(!story) return;

        // Append to Script
        if(story.script) story.script += '\n\n' + content;
        else story.script = content;
        
        scriptTextarea.value = story.script;
        
        // If in Studio mode, optionally insert as context? 
        // For now, simpler to just append to Script and save.
        await updateCurrentStory(story.conversation, { script: story.script });
        
        // Feedback
        alert("Document appended to Project Script!");
        
        // Switch to Editor to show it
        if(currentMode !== 'editor') {
            const editorBtn = document.querySelector('.mode-btn[data-mode="editor"]') as HTMLButtonElement;
            if(editorBtn) editorBtn.click();
        }
    };
    reader.readAsText(file);
    (e.target as HTMLInputElement).value = ''; // Reset
});


// --- ASSET UPLOAD LOGIC ---
assetUploadInput.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    const base64 = await blobToBase64(file);
    let type: 'image' | 'audio' | 'video';
    
    if (file.type.startsWith('image')) type = 'image';
    else if (file.type.startsWith('audio')) type = 'audio';
    else if (file.type.startsWith('video')) type = 'video';
    else { alert("Unsupported file type"); return; }
    
    const newAsset: Asset = {
        id: generateId(),
        type: type,
        name: file.name,
        data: base64,
        mimeType: file.type,
        createdAt: Date.now(),
        storyId: currentStoryId || undefined
    };
    
    await saveAssetToDB(newAsset);
    assets.unshift(newAsset);
    renderAssetsList();
    (e.target as HTMLInputElement).value = '';
    
    // Auto-open action dialog for immediate use
    openAssetActionDialog(newAsset);
});


// --- RENDERING CONVERSATION ---
async function renderConversation(story: Story) {
    conversationContainer.innerHTML = '';
    if (!story.conversation || story.conversation.length === 0) {
        conversationContainer.appendChild(welcomeMessage);
        return;
    }

    const turns = story.conversation;
    let i = 0;
    while (i < turns.length) {
        const currentTurn = turns[i];
        let nextTurn = turns[i+1];
        let textTurn: Turn | null = null;
        let mediaTurn: Turn | null = null;

        if (currentTurn.type === 'text') {
            textTurn = currentTurn;
            if (nextTurn && (nextTurn.type === 'image' || nextTurn.type === 'video')) {
                mediaTurn = nextTurn;
                i++; 
            }
        } else {
            mediaTurn = currentTurn;
             if (nextTurn && nextTurn.type === 'text') {
                textTurn = nextTurn;
                i++;
            }
        }
        
        const sceneEl = document.createElement('div');
        sceneEl.className = 'story-scene';
        if (i % 4 !== 0) sceneEl.classList.add('reversed'); // Alternate layout roughly
        
        if (textTurn) {
            const textContainer = document.createElement('div');
            textContainer.className = 'turn-text-container';
            if(story.fontFamily) textContainer.style.fontFamily = story.fontFamily;
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = await marked.parse(textTurn.content);
            textContainer.appendChild(contentDiv);
            textContainer.appendChild(createTurnControls(textTurn));
            sceneEl.appendChild(textContainer);
        }
        if (mediaTurn) {
            const mediaContainer = document.createElement('div');
            mediaContainer.className = 'turn-media-container';
            if (mediaTurn.type === 'image') {
                const img = document.createElement('img'); img.src = mediaTurn.content;
                mediaContainer.appendChild(img);
            } else if (mediaTurn.type === 'video') {
                const vid = document.createElement('video'); vid.src = mediaTurn.content; vid.controls = true;
                mediaContainer.appendChild(vid);
            } else if (mediaTurn.type === 'audio') { // Handle audio inserted into flow
                 const audio = document.createElement('audio'); audio.src = mediaTurn.content; audio.controls = true;
                 mediaContainer.appendChild(audio);
            }
            mediaContainer.appendChild(createTurnControls(mediaTurn));
            sceneEl.appendChild(mediaContainer);
        }
        conversationContainer.appendChild(sceneEl);
        i++;
    }
    conversationContainer.scrollTop = conversationContainer.scrollHeight;
}

function createTurnControls(turn: Turn): HTMLElement {
    const div = document.createElement('div');
    div.className = 'turn-controls';
    const delBtn = document.createElement('button');
    delBtn.innerText = '🗑️';
    delBtn.onclick = async () => {
        if(!confirm("Delete?")) return;
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
    if (turn.type === 'text') {
        const speakBtn = document.createElement('button');
        speakBtn.innerText = '🔊';
        speakBtn.onclick = () => speakText(turn.content.replace(/[#*`]/g, ''));
        div.appendChild(speakBtn);
    }
    return div;
}

// --- GENERATE ---
async function generateContent(prompt: string) {
    if (!currentStoryId) await createNewStory();
    const story = library.find(s => s.id === currentStoryId);
    if (!story) return;
    
    welcomeMessage.style.display = 'none';
    submitButton.disabled = true;
    submitButton.textContent = '...';

    try {
        // ALWAYS use process.env.API_KEY directly for initialization
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const config: any = { responseModalities: [Modality.TEXT] };
        if(currentSettings.imageGenerationCount > 0) config.responseModalities.push(Modality.IMAGE);

        const responseStream = await ai.models.generateContentStream({
            model: currentSettings.chatModel,
            contents: `Context: ${story.conversation.slice(-3).map(t=>t.type==='text'?t.content:'').join('\n')}\nPrompt: ${prompt}`,
            config: config
        });

        let partialText = '';
        let currentTextTurn: Turn | null = null;
        
        for await (const chunk of responseStream) {
            const chunkResponse = chunk as GenerateContentResponse;
            // FIX: Use chunk.text property to extract content as per guidelines
            const textOutput = chunkResponse.text;
            if (textOutput) {
                partialText += textOutput;
                if (!currentTextTurn) {
                    currentTextTurn = { id: Date.now().toString(), type: 'text', content: '' };
                    story.conversation.push(currentTextTurn);
                    renderConversation(story);
                } else {
                    currentTextTurn.content = partialText;
                    renderConversation(story); 
                }
            }
            
            const parts = chunkResponse.candidates?.[0]?.content?.parts || [];
            for (const part of parts) {
                if (part.inlineData) {
                    if(currentTextTurn) { currentTextTurn = null; partialText = ''; }
                    const imgTurn: Turn = { id: Date.now().toString(), type: 'image', content: `data:image/png;base64,${part.inlineData.data}` };
                    story.conversation.push(imgTurn);
                    renderConversation(story);
                    // Save Asset
                    await saveAssetToDB({id: generateId(), type: 'image', name: `Gen ${Date.now()}`, data: imgTurn.content, mimeType: 'image/png', createdAt: Date.now(), storyId: currentStoryId});
                }
            }
        }
        await updateCurrentStory(story.conversation);
        if(isNarratorEnabled && partialText) speakText(partialText.replace(/[#*`]/g, ''));
    } catch(e) {
        console.error(e);
        alert("Generation Error");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Generate';
    }
}

// --- UI UPDATERS & SETTINGS PERSISTENCE ---
function updateMediaControls() {
    const isPlaying = !bgMusicPlayer.paused;
    mmcPlayPause.innerText = isPlaying ? '⏸' : '▶';
    miniPlayPause.innerText = isPlaying ? '⏸' : '▶';
    
    // Apply immediate volume/speed updates
    const bgVol = parseFloat(mmcBgVolume.value);
    if (!isNaN(bgVol)) bgMusicPlayer.volume = bgVol;
    
    const speed = parseFloat(mmcSpeed.value);
    if (!isNaN(speed)) bgMusicPlayer.playbackRate = speed;
}

function updateNarratorToggleUI() {
    mmcNarratorToggle.innerText = isNarratorEnabled ? 'Narrator: ON' : 'Narrator: OFF';
    miniNarratorToggle.innerText = isNarratorEnabled ? '🗣️' : '🔇';
    
    const navVol = parseFloat(mmcNarratorVolume.value);
    if (narrationGainNode && !isNaN(navVol)) {
        narrationGainNode.gain.value = isNarratorEnabled ? navVol : 0;
    }
}

function loadSettings() {
    try {
        const saved = localStorage.getItem('story_weaver_settings');
        if (saved) Object.assign(currentSettings, JSON.parse(saved));
    } catch(e) { console.warn('Settings load error', e); }
}

function saveSettingsToStorage() {
    localStorage.setItem('story_weaver_settings', JSON.stringify(currentSettings));
}

// --- INTELLIGENT IMPORT LOGIC ---
async function processImportData(json: any) {
    let storiesToImport: Story[] = [];
    let assetsToImport: Asset[] = [];
    let mode = "Unknown";

    // 1. Detect System Backup (Package)
    if (json.stories && Array.isArray(json.stories)) {
        storiesToImport = json.stories;
        assetsToImport = json.assets || [];
        mode = "System Backup";
    } 
    // 2. Detect Single Story Object
    else if (json.id && json.conversation && Array.isArray(json.conversation)) {
        storiesToImport = [json];
        mode = "Single Story";
    }
    // 3. Detect Array of Stories
    else if (Array.isArray(json) && json.length > 0 && json[0].conversation) {
        storiesToImport = json;
        mode = "Story Collection";
    }

    if (storiesToImport.length === 0) {
        alert("Import failed: Could not recognize data format. Ensure the file is a valid Story Weaver export.");
        return;
    }

    if (confirm(`Detected ${mode}. Import ${storiesToImport.length} stories and ${assetsToImport.length} assets?`)) {
        let importedStoriesCount = 0;
        let importedAssetsCount = 0;

        for (const s of storiesToImport) {
            // Check if exists
            const existing = library.find(x => x.id === s.id);
            if (!existing) {
                await saveStoryToDB(s);
                library.push(s);
                importedStoriesCount++;
            } else {
                if (confirm(`Story "${s.title}" already exists. Overwrite?`)) {
                    await saveStoryToDB(s);
                    const idx = library.findIndex(x => x.id === s.id);
                    library[idx] = s;
                    importedStoriesCount++;
                }
            }
        }

        for (const a of assetsToImport) {
            if (!assets.find(x => x.id === a.id)) {
                await saveAssetToDB(a);
                assets.push(a);
                importedAssetsCount++;
            }
        }

        alert(`Successfully imported ${importedStoriesCount} stories and ${importedAssetsCount} assets.`);
        renderLibraryList();
        renderAssetsList();
        
        // Load the first imported story if none selected
        if (!currentStoryId && library.length > 0) {
            loadStory(library[0].id);
        }
    }
}

// --- EVENT LISTENERS ---

// 1. Menu Toggles
mainMenuToggle.addEventListener('click', () => { mainMenu.classList.add('open'); sidebarOverlay.classList.add('open'); });
closeMenuBtn.addEventListener('click', () => { mainMenu.classList.remove('open'); sidebarOverlay.classList.remove('open'); });
sidebarOverlay.addEventListener('click', () => {
    mainMenu.classList.remove('open');
    librarySidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
});

// 2. Library Toggles
libraryToggleBtn.addEventListener('click', () => {
    mainMenu.classList.remove('open'); // Switch menus
    librarySidebar.classList.add('open');
    sidebarOverlay.classList.add('open');
});
closeSidebarBtn.addEventListener('click', () => {
    librarySidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
});

// 3. Settings Button
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

// 4. Save & Backup Buttons
saveButton.addEventListener('click', () => {
    if(currentStoryId) {
        alert("Project Saved Successfully (Auto-save is also active).");
    } else {
        alert("No active project.");
    }
});

exportButton.addEventListener('click', () => {
    // System Backup
    const backup = {
        version: 1,
        timestamp: Date.now(),
        settings: currentSettings,
        stories: library,
        assets: assets
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story-weaver-backup-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// 5. Intelligent Import Trigger
importButton.addEventListener('click', () => importFileInput.click());
importStoryBtn.addEventListener('click', () => importFileInput.click());

importFileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            const json = JSON.parse(ev.target?.result as string);
            await processImportData(json);
        } catch(err) { 
            alert("Error: File is not a valid JSON or is corrupted."); 
        }
    };
    reader.readAsText(file);
    (e.target as HTMLInputElement).value = ''; // Reset input
});

// 6. Help Button
helpButton.addEventListener('click', () => helpDialog.showModal());
closeHelpBtn.addEventListener('click', () => helpDialog.close());
closeHelpActionBtn.addEventListener('click', () => helpDialog.close());

// 7. Media Controls (Header & Footer)
footerMediaBtn.addEventListener('click', openMediaCenter);
miniExpand.addEventListener('click', openMediaCenter);
mmcCancelBtn.addEventListener('click', () => closeMediaCenter(false));
mmcOkBtn.addEventListener('click', () => closeMediaCenter(true));

// 8. Internal Media Center Controls
mmcPlayPause.addEventListener('click', () => {
    if(bgMusicPlayer.paused) bgMusicPlayer.play(); else bgMusicPlayer.pause();
    updateMediaControls();
});
miniPlayPause.addEventListener('click', () => {
    if(bgMusicPlayer.paused) bgMusicPlayer.play(); else bgMusicPlayer.pause();
    updateMediaControls();
});
mmcNarratorToggle.addEventListener('click', () => {
    isNarratorEnabled = !isNarratorEnabled;
    updateNarratorToggleUI();
});
miniNarratorToggle.addEventListener('click', () => {
    isNarratorEnabled = !isNarratorEnabled;
    updateNarratorToggleUI();
});
mmcStopAll.addEventListener('click', () => {
    bgMusicPlayer.pause();
    if(narrationSource) { try { narrationSource.stop(); } catch(e){} narrationSource = null; }
    updateMediaControls();
});

// 9. Video Generation (Veo)
mmcGenerateVideo.addEventListener('click', () => videoGenDialog.showModal());
closeVideoGenBtn.addEventListener('click', () => videoGenDialog.close());
cancelVideoGenBtn.addEventListener('click', () => videoGenDialog.close());
confirmVideoGenBtn.addEventListener('click', async () => {
    videoGenDialog.close();
    // Veo Logic
    const prompt = videoGenPromptInput.value;
    if(!prompt) return;
    
    // API Key Selection logic as per Veo guidelines
    try {
        if(!(window as any).aistudio) {
             console.warn("AI Studio hasSelectedApiKey platform logic missing.");
        } else if (!await (window as any).aistudio.hasSelectedApiKey()) {
             await (window as any).aistudio.openSelectKey();
        }
    } catch(e) { console.warn(e); }

    submitButton.textContent = 'Generating Video...';
    try {
        // MUST initiate GoogleGenAI right before making the call using process.env.API_KEY
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let op = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: { numberOfVideos: 1, aspectRatio: '16:9', resolution: '720p' }
        });
        
        // Polling for LRO
        let attempts = 0;
        while (!op.done && attempts < 60) {
            await new Promise(r => setTimeout(r, 10000));
            op = await ai.operations.getVideosOperation({operation: op});
            attempts++;
        }
        
        const uri = op.response?.generatedVideos?.[0]?.video?.uri;
        if (uri) {
            // Append process.env.API_KEY to fetch call
            const res = await fetch(`${uri}&key=${process.env.API_KEY}`);
            const b64 = await blobToBase64(await res.blob());
            // Add to story
            if(!currentStoryId) await createNewStory();
            const story = library.find(s=>s.id===currentStoryId);
            if(story) {
                const turn: Turn = { id: generateId(), type: 'video', content: b64 };
                story.conversation.push(turn);
                await updateCurrentStory(story.conversation);
                renderConversation(story);
                // Save Asset
                await saveAssetToDB({id: generateId(), type: 'video', name: `Vid: ${prompt.substring(0,10)}`, data: b64, mimeType: 'video/mp4', createdAt: Date.now(), storyId: currentStoryId});
            }
        } else {
            alert("Video generation timed out or failed.");
        }
    } catch(e) {
        // Guideline: handle "Requested entity was not found." for key selection
        if ((e as Error).message.includes("Requested entity was not found.")) {
             try { await (window as any).aistudio.openSelectKey(); } catch(err) { console.warn(err); }
        }
        alert("Video Error: " + (e as Error).message);
    } finally {
        submitButton.textContent = 'Generate';
    }
});

// 10. Sound Mixer
mmcOpenMixer.addEventListener('click', () => soundGenDialog.showModal());
closeSoundGenBtn.addEventListener('click', () => soundGenDialog.close());
cancelSoundGenBtn.addEventListener('click', () => soundGenDialog.close());

// 11. Script Editor & Modes
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        if (mode === 'editor' || mode === 'studio' || mode === 'player') {
            currentMode = mode as any;
            modeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (mode === 'editor') {
                scriptEditorContainer.style.display = 'flex';
                playerContainer.style.display = 'none';
                conversationContainer.style.display = 'none';
                studioFooter.style.display = 'none';
            } else if (mode === 'player') {
                scriptEditorContainer.style.display = 'none';
                playerContainer.style.display = 'flex';
                conversationContainer.style.display = 'none';
                studioFooter.style.display = 'none';
                // Basic Player Init
                 if(currentStoryId) {
                     const story = library.find(s=>s.id===currentStoryId);
                     if(story) {
                         playerStage.innerHTML = `<div style="text-align:center; padding-top:20%;"><h3>${story.title}</h3><p>Player Mode Placeholder</p></div>`;
                     }
                }
            } else { // Studio
                scriptEditorContainer.style.display = 'none';
                playerContainer.style.display = 'none';
                conversationContainer.style.display = 'block';
                studioFooter.style.display = 'flex';
                if(currentStoryId) {
                    const story = library.find(s=>s.id===currentStoryId);
                    if(story) renderConversation(story);
                }
            }
        }
    });
});

promptForm.addEventListener('submit', (e) => {
    e.preventDefault();
    generateContent(promptInput.value);
    promptInput.value = '';
});

// 12. New Story Button
newStoryBtn.addEventListener('click', createNewStory);

// INITIALIZATION
loadSettings();
initLibrary();
updateNarratorToggleUI();

function closeLibrarySidebar() {
    librarySidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
}

function updateSettingsUI() {
    chatProviderSelect.value = currentSettings.chatProvider;
    storyFontSelect.value = currentSettings.manualFont;
    if(currentSettings.chatProvider==='google') {
        chatModelSelect.value = currentSettings.chatModel;
        chatModelGroup.classList.remove('hidden');
        chatCustomModelGroup.classList.add('hidden');
    } else {
        chatCustomModelInput.value = currentSettings.chatModel;
        chatModelGroup.classList.add('hidden');
        chatCustomModelGroup.classList.remove('hidden');
    }
}
function saveSettingsFromUI() {
    currentSettings.chatProvider = chatProviderSelect.value as any;
    currentSettings.chatModel = currentSettings.chatProvider==='google' ? chatModelSelect.value : chatCustomModelInput.value;
    currentSettings.manualFont = storyFontSelect.value;
    saveSettingsToStorage();
    settingsDialog.close();
}

function openMediaCenter() { mainMediaCenter.classList.add('open'); }
function closeMediaCenter(save: boolean) { 
    mainMediaCenter.classList.remove('open'); 
    if(save) {
        currentSettings.ttsVoice = mmcTtsVoice.value;
        saveSettingsToStorage();
    }
}
