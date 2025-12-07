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
const saveButton = document.getElementById('save-button') as HTMLButtonElement;
const exportButton = document.getElementById('export-button') as HTMLButtonElement;
const importButton = document.getElementById('import-button') as HTMLButtonElement;
const importFileInput = document.getElementById('import-file') as HTMLInputElement;

// Settings Elements
const settingsButton = document.getElementById('settings-button') as HTMLButtonElement;
const settingsDialog = document.getElementById('settings-dialog') as HTMLDialogElement;
const settingsForm = document.getElementById('settings-form') as HTMLFormElement;
const closeSettingsBtn = document.getElementById('close-settings-btn') as HTMLButtonElement;
const cancelSettingsBtn = document.getElementById('cancel-settings') as HTMLButtonElement;
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

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


// --- TYPE DEFINITIONS ---
type Turn = {
  id: string;
  type: 'text' | 'image';
  content: string; // For text, it's markdown. For image, it's base64 data URI.
};

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
}

// --- STATE ---
let conversation: Turn[] = [];

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
};

let currentSettings: AppSettings = { ...DEFAULT_SETTINGS };


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
    // If the saved model isn't in the preset dropdown, switch to custom or default to flash-image
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

  saveSettingsToStorage();
  settingsDialog.close();
}

// Settings Event Listeners
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

// Dynamic Settings Logic
chatProviderSelect.addEventListener('change', () => {
    if (chatProviderSelect.value === 'google') {
        chatModelGroup.classList.remove('hidden');
        chatCustomModelGroup.classList.add('hidden');
    } else {
        chatModelGroup.classList.add('hidden');
        chatCustomModelGroup.classList.remove('hidden');
    }
});

// Tabs
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        const tabId = (btn as HTMLElement).dataset.tab;
        if(tabId) document.getElementById(tabId)?.classList.add('active');
    });
});


// --- RENDERING LOGIC ---

/**
 * Renders a single turn into the conversation container.
 */
function renderTurn(turn: Turn) {
  const turnElement = document.createElement('div');
  turnElement.className = 'turn';
  turnElement.dataset.id = turn.id;

  const contentElement = document.createElement('div');
  contentElement.className = 'turn-content';

  if (turn.type === 'text') {
    contentElement.innerHTML = marked.parse(turn.content) as string;
  } else {
    const img = new Image();
    img.src = turn.content;
    contentElement.appendChild(img);
  }

  turnElement.appendChild(createTurnControls(turn, turnElement));
  conversationContainer.appendChild(turnElement);
  conversationContainer.scrollTop = conversationContainer.scrollHeight;
}

/**
 * Creates the edit and delete buttons for a turn.
 */
function createTurnControls(turn: Turn, turnElement: HTMLElement): HTMLElement {
  const controls = document.createElement('div');
  controls.className = 'turn-controls';

  const deleteButton = document.createElement('button');
  deleteButton.innerHTML = '&#128465;'; // Trash can icon
  deleteButton.title = 'Delete';
  deleteButton.onclick = () => {
    turnElement.remove();
    conversation = conversation.filter((t) => t.id !== turn.id);
  };

  const editButton = document.createElement('button');
  editButton.innerHTML = '&#9998;'; // Pencil icon
  editButton.title = 'Edit';
  if (turn.type === 'image') {
    editButton.disabled = true; // Disable editing for images for now
  }
  editButton.onclick = () => {
    enterEditMode(turn, turnElement);
  };

  controls.appendChild(editButton);
  controls.appendChild(deleteButton);
  return controls;
}

/**
 * Switches a text turn to edit mode.
 */
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
        contentDiv.innerHTML = (await marked.parse(newContent)) as string;
        contentDiv.style.display = 'block';
        editContainer.remove();
    };

    editContainer.appendChild(textArea);
    editContainer.appendChild(saveEditButton);
    turnElement.appendChild(editContainer);
}


/**
 * Renders the entire conversation from the global state.
 */
function renderConversation() {
  conversationContainer.innerHTML = '';
  conversation.forEach(renderTurn);
}

// --- API & GENERATION LOGIC ---

/**
 * Calls the Gemini API and streams the response.
 */
async function generateContent(prompt: string) {
  setLoading(true);
  try {
    // 1. Determine Chat Configuration
    const chatKey = currentSettings.chatApiKey || process.env.API_KEY;
    const chatModel = currentSettings.chatModel;
    
    // 2. Determine Modalities based on model name heuristic
    const supportsImages = chatModel.toLowerCase().includes('image');
    const modalities = [Modality.TEXT];
    if (supportsImages) {
        modalities.push(Modality.IMAGE);
    }

    const ai = new GoogleGenAI({ apiKey: chatKey });
    
    // 3. Prepare config and modified prompt based on image settings
    const config: any = {
      responseModalities: modalities,
    };

    // Build system/context instructions
    const systemInstructions: string[] = [];

    // Writing Style
    if (currentSettings.chatWritingStyle && currentSettings.chatWritingStyle !== 'standard') {
        let styleDesc = currentSettings.chatWritingStyle;
        if(styleDesc === 'simple') styleDesc = 'simple and easy to understand (for kids)';
        systemInstructions.push(`Writing Style: ${styleDesc}.`);
    }

    // Output Length
    if (currentSettings.chatOutputLength) {
        let lengthInstruction = "";
        switch(currentSettings.chatOutputLength) {
            case 'short': lengthInstruction = "Keep the response short, around 100 words."; break;
            case 'medium': lengthInstruction = "Write a medium length response, around 300 words."; break;
            case 'long': lengthInstruction = "Write a long, detailed response, around 600 words."; break;
        }
        if (lengthInstruction) systemInstructions.push(lengthInstruction);
    }

    // Only apply image configuration if the model supports images
    if (supportsImages) {
      if (currentSettings.imageAspectRatio) {
         config.imageConfig = {
             aspectRatio: currentSettings.imageAspectRatio
         };
      }

      // Inject style and negative prompt into the request via prompt engineering
      
      if (currentSettings.imageStyle && currentSettings.imageStyle !== 'none') {
        systemInstructions.push(`Visual Style for Images: ${currentSettings.imageStyle.replace(/-/g, ' ')}.`);
      }
      
      if (currentSettings.imageNegativePrompt) {
        systemInstructions.push(`Negative Prompt (avoid in images): ${currentSettings.imageNegativePrompt}.`);
      }
    }

    let finalPrompt = prompt;
    if (systemInstructions.length > 0) {
      finalPrompt = `${prompt}\n\n[System & Generation Configuration]\n${systemInstructions.join('\n')}`;
    }

    const responseStream = await ai.models.generateContentStream({
      model: chatModel,
      contents: finalPrompt,
      config: config,
    });

    let partialText = '';
    let currentTextTurn: Turn | null = null;

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        partialText += text;
        if (!currentTextTurn) {
            // Create a new turn for this block of text
            currentTextTurn = { id: Date.now().toString(), type: 'text', content: '' };
            conversation.push(currentTextTurn);
            renderTurn(currentTextTurn);
        }
        currentTextTurn.content = partialText;
        const turnElement = conversationContainer.querySelector(`[data-id="${currentTextTurn.id}"] .turn-content`) as HTMLElement;
        if(turnElement) {
            turnElement.innerHTML = marked.parse(partialText) as string;
        }

      } else if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
        // Text block is finished (or interleaved), create image turn
        // If we were building a text turn, we leave it as is and start a new image turn
        if (currentTextTurn) {
            currentTextTurn = null; 
            partialText = '';
        }

        const base64Data = chunk.candidates[0].content.parts[0].inlineData.data;
        const imageTurn: Turn = {
          id: Date.now().toString(),
          type: 'image',
          content: `data:image/png;base64,${base64Data}`,
        };
        conversation.push(imageTurn);
        renderTurn(imageTurn);
      }
    }
  } catch (e) {
    console.error(e);
    const errorTurn: Turn = {
        id: Date.now().toString(),
        type: 'text',
        content: `**An error occurred:**\n\n\`\`\`\n${(e as Error).message}\n\`\`\``
    };
    conversation.push(errorTurn);
    renderTurn(errorTurn);
  } finally {
    setLoading(false);
  }
}

/**
 * Manages the UI loading state.
 */
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

// --- DATA PERSISTENCE ---

function saveConversation() {
  localStorage.setItem('storyWeaverConversation', JSON.stringify(conversation));
  alert('Conversation saved!');
}

function loadConversation() {
  const saved = localStorage.getItem('storyWeaverConversation');
  if (saved) {
    conversation = JSON.parse(saved);
    renderConversation();
  }
}

function exportConversation() {
  if (conversation.length === 0) {
    alert('Nothing to export!');
    return;
  }
  const blob = new Blob([JSON.stringify(conversation, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `story-weaver-${new Date().toISOString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function importConversation(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const result = e.target?.result as string;
      const importedData = JSON.parse(result);
      if (Array.isArray(importedData)) { // Basic validation
        conversation = importedData;
        renderConversation();
      } else {
        throw new Error('Invalid file format.');
      }
    } catch (error) {
      alert(`Error importing file: ${(error as Error).message}`);
    }
  };
  reader.readAsText(file);
}

// --- EVENT LISTENERS & INITIALIZATION ---

promptForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const prompt = promptInput.value.trim();
  if (prompt) {
    generateContent(prompt);
    promptInput.value = '';
  }
});

saveButton.addEventListener('click', saveConversation);
exportButton.addEventListener('click', exportConversation);
importButton.addEventListener('click', () => importFileInput.click());
importFileInput.addEventListener('change', importConversation);

// Load conversation and settings on startup
loadSettings();
loadConversation();