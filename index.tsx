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

const saveButton = document.getElementById('save-button') as HTMLButtonElement;
const exportButton = document.getElementById('export-button') as HTMLButtonElement;
const importButton = document.getElementById('import-button') as HTMLButtonElement;
const importFileInput = document.getElementById('import-file') as HTMLInputElement;

// Sidebar / Library Elements
const menuButton = document.getElementById('menu-button') as HTMLButtonElement;
const librarySidebar = document.getElementById('library-sidebar') as HTMLElement;
const closeSidebarBtn = document.getElementById('close-sidebar-btn') as HTMLButtonElement;
const sidebarOverlay = document.getElementById('sidebar-overlay') as HTMLElement;
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
}

// --- STATE ---
let library: Story[] = [];
let currentStoryId: string | null = null;


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

// --- HELPERS ---
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// --- LIBRARY LOGIC ---

function loadLibrary() {
    const stored = localStorage.getItem('storyWeaverLibrary');
    if (stored) {
        try {
            library = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse library', e);
            library = [];
        }
    }
    
    // Legacy migration: check for old single conversation
    const oldConv = localStorage.getItem('storyWeaverConversation');
    if (oldConv && library.length === 0) {
        try {
            const conversation = JSON.parse(oldConv);
            if (conversation.length > 0) {
                const newStory: Story = {
                    id: generateId(),
                    title: 'Restored Story',
                    conversation: conversation,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                library.push(newStory);
                saveLibrary();
                localStorage.removeItem('storyWeaverConversation'); // Cleanup
            }
        } catch(e) {}
    }

    renderLibraryList();
    
    if (library.length > 0 && !currentStoryId) {
        // Load most recent story
        const recent = library.sort((a,b) => b.updatedAt - a.updatedAt)[0];
        loadStory(recent.id);
    }
}

function saveLibrary() {
    localStorage.setItem('storyWeaverLibrary', JSON.stringify(library));
}

function createNewStory() {
    const newStory: Story = {
        id: generateId(),
        title: 'New Story',
        conversation: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    library.unshift(newStory);
    saveLibrary();
    loadStory(newStory.id);
    renderLibraryList();
    
    // Close sidebar on mobile/small screens when creating new
    if(window.innerWidth < 768) {
        closeSidebar();
    }
}

function loadStory(id: string) {
    const story = library.find(s => s.id === id);
    if (!story) return;

    currentStoryId = id;
    renderConversation(story.conversation);
    renderLibraryList(); // To update active state
}

function deleteStory(id: string, event: Event) {
    event.stopPropagation(); // Prevent loading the story
    if(!confirm('Are you sure you want to delete this story?')) return;

    library = library.filter(s => s.id !== id);
    saveLibrary();
    
    if (currentStoryId === id) {
        currentStoryId = null;
        conversationContainer.innerHTML = '';
        conversationContainer.appendChild(welcomeMessage); // Show welcome
        welcomeMessage.style.display = 'block';
    }
    
    renderLibraryList();
}

function updateCurrentStory(conversation: Turn[]) {
    if (!currentStoryId) {
        // Should have been created by now, but just in case
        createNewStory();
    }
    
    const storyIndex = library.findIndex(s => s.id === currentStoryId);
    if (storyIndex !== -1) {
        library[storyIndex].conversation = conversation;
        library[storyIndex].updatedAt = Date.now();
        
        // Auto-title if it's "New Story" and has content
        if (library[storyIndex].title === 'New Story' && conversation.length > 0 && conversation[0].type === 'text') {
            // Take first 30 chars of first turn
             let text = conversation[0].content.replace(/[#*`]/g, '').trim();
             if (text.length > 30) text = text.substring(0, 30) + '...';
             if (text) library[storyIndex].title = text;
        }
        
        saveLibrary();
        renderLibraryList(); // update title/time
    }
}

function renderLibraryList() {
    storyList.innerHTML = '';
    // Sort by updated desc
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


// --- RENDERING LOGIC ---

/**
 * Renders a single turn into the conversation container.
 */
async function renderTurn(turn: Turn) {
  // Check if turn already exists to avoid duplication
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

  const contentElement = turnElement.querySelector('.turn-content') as HTMLElement;

  if (turn.type === 'text') {
    // IMPORTANT: Await marked.parse because newer versions might be async or return a Promise.
    // Also handle possible empty content to avoid "undefined" string.
    try {
        const rawContent = turn.content || '';
        let html = await marked.parse(rawContent);
        contentElement.innerHTML = html as string;
    } catch(e) {
        console.error('Markdown parse error:', e);
        contentElement.textContent = turn.content; // Fallback
    }
  } else {
    // Clear existing content (e.g. if switching types or reloading)
    contentElement.innerHTML = '';
    const img = new Image();
    img.src = turn.content;
    contentElement.appendChild(img);
  }

  if (isNew) {
      conversationContainer.scrollTop = conversationContainer.scrollHeight;
  }
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
    // Update State
    const story = library.find(s => s.id === currentStoryId);
    if(story) {
        story.conversation = story.conversation.filter((t) => t.id !== turn.id);
        updateCurrentStory(story.conversation);
    }
  };

  const editButton = document.createElement('button');
  editButton.innerHTML = '&#9998;'; // Pencil icon
  editButton.title = 'Edit';
  if (turn.type === 'image') {
    editButton.disabled = true;
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
        
        // Update State
        const story = library.find(s => s.id === currentStoryId);
        if(story) {
            updateCurrentStory(story.conversation);
        }

        contentDiv.innerHTML = (await marked.parse(newContent)) as string;
        contentDiv.style.display = 'block';
        editContainer.remove();
    };

    editContainer.appendChild(textArea);
    editContainer.appendChild(saveEditButton);
    turnElement.appendChild(editContainer);
}


/**
 * Renders the entire conversation.
 */
async function renderConversation(conversation: Turn[]) {
  conversationContainer.innerHTML = '';
  if (conversation.length === 0) {
      conversationContainer.appendChild(welcomeMessage);
      welcomeMessage.style.display = 'block';
  } else {
      welcomeMessage.style.display = 'none';
      for (const turn of conversation) {
          await renderTurn(turn);
      }
  }
}

// --- API & GENERATION LOGIC ---

async function generateContent(prompt: string) {
  // Ensure we have a story to add to
  if (!currentStoryId) {
      createNewStory();
  }
  
  // Get current conversation from library to append to
  const story = library.find(s => s.id === currentStoryId);
  if (!story) return; // Should not happen
  
  welcomeMessage.style.display = 'none';
  setLoading(true);

  // Optimistic UI: Add user turn immediately? 
  // For this app, we generate based on prompt, so we don't necessarily show user prompt as a bubble
  // unless we want to. The current design implies "Weaver" style where user gives instructions.
  // We won't add user prompt as a bubble based on existing design, but we could.
  // User input is "hidden" in the narrative flow usually, or we can add it.
  // The existing design didn't add user prompts to the `conversation` array, only AI output. 
  // I will stick to that to preserve the "Story Weaver" feel, but usually chat apps show both.
  // PROMPT: "Weave a new story..." implies instructions.

  try {
    const chatKey = currentSettings.chatApiKey || process.env.API_KEY;
    const chatModel = currentSettings.chatModel;
    
    const supportsImages = chatModel.toLowerCase().includes('image');
    const modalities = [Modality.TEXT];
    if (supportsImages) {
        modalities.push(Modality.IMAGE);
    }

    console.log('[DEBUG] Initializing GoogleGenAI');
    const ai = new GoogleGenAI({ apiKey: chatKey });
    
    const config: any = {
      responseModalities: modalities,
    };

    // System Instructions Construction
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

    if (supportsImages) {
      if (currentSettings.imageAspectRatio) {
         config.imageConfig = { aspectRatio: currentSettings.imageAspectRatio };
      }
      if (currentSettings.imageStyle && currentSettings.imageStyle !== 'none') {
        systemInstructions.push(`Visual Style for Images: ${currentSettings.imageStyle.replace(/-/g, ' ')}.`);
      }
      if (currentSettings.imageNegativePrompt) {
        systemInstructions.push(`Negative Prompt (avoid in images): ${currentSettings.imageNegativePrompt}.`);
      }
    }

    // Context from previous turns? 
    // Currently, the app sends only the *new* prompt. To make it a continuous story, we should probably 
    // send context. However, for "generateContentStream" it's single turn.
    // If the user wants a continuous story, we should really be using `chat` or appending previous text.
    // For now, I will stick to the existing behavior (single prompt) but acknowledge the "Story" aspect 
    // might need context later.
    // Spec update: Let's prepend the last 2000 chars of the story so far to the prompt for context, 
    // strictly as context, if it's not empty.
    
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

    console.log(`[DEBUG] Final Prompt sent to model:`, finalPrompt);

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
            currentTextTurn = { id: Date.now().toString(), type: 'text', content: '' };
            story.conversation.push(currentTextTurn);
            // Render basic structure first
            await renderTurn(currentTextTurn);
        }
        currentTextTurn.content = partialText;
        
        // Update DOM
        const turnElement = conversationContainer.querySelector(`[data-id="${currentTextTurn.id}"] .turn-content`) as HTMLElement;
        if(turnElement) {
            // Await marked parse here too
            try {
                const html = await marked.parse(partialText);
                turnElement.innerHTML = html as string;
            } catch (e) {
                 turnElement.textContent = partialText;
            }
        }
        
        // Scroll to bottom during generation
        conversationContainer.scrollTop = conversationContainer.scrollHeight;

      } else if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
        // Image logic
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
        story.conversation.push(imageTurn);
        await renderTurn(imageTurn);
      }
    }
    
    updateCurrentStory(story.conversation); // Save after generation complete

  } catch (e) {
    console.error('Generation Error:', e);
    const errorTurn: Turn = {
        id: Date.now().toString(),
        type: 'text',
        content: `**Error:** ${(e as Error).message}`
    };
    story.conversation.push(errorTurn);
    await renderTurn(errorTurn);
    updateCurrentStory(story.conversation);
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

// Sidebar
function openSidebar() {
    librarySidebar.classList.add('open');
    sidebarOverlay.classList.add('visible');
}
function closeSidebar() {
    librarySidebar.classList.remove('open');
    sidebarOverlay.classList.remove('visible');
}

menuButton.addEventListener('click', openSidebar);
closeSidebarBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);
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
    saveLibrary();
    alert('Library saved to browser storage.');
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
  reader.onload = (e) => {
    try {
      const result = e.target?.result as string;
      const importedData = JSON.parse(result);
      if (Array.isArray(importedData)) {
          // Check if it's a library (array of stories) or a single conversation (legacy)
          if(importedData.length > 0 && importedData[0].conversation) {
              // It's a library
              library = [...library, ...importedData];
          } else {
              // It's likely a conversation array
               const newStory: Story = {
                    id: generateId(),
                    title: 'Imported Story',
                    conversation: importedData as Turn[],
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                library.push(newStory);
          }
        
        saveLibrary();
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

// Initialization
loadSettings();
loadLibrary();