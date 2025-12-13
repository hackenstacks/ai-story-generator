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
  imageGenerationCount: 1,
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
    
    // Auto-close sidebar
    closeLibrarySidebar();
}

function loadStory(id: string) {
    const story = library.find(s => s.id === id);
    if (!story) return;

    currentStoryId = id;
    renderConversation(story); // Pass full story to access theme
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

function updateCurrentStory(conversation: Turn[], themeImage?: string) {
    if (!currentStoryId) {
        createNewStory();
    }
    
    const storyIndex = library.findIndex(s => s.id === currentStoryId);
    if (storyIndex !== -1) {
        library[storyIndex].conversation = conversation;
        library[storyIndex].updatedAt = Date.now();
        if(themeImage) {
            library[storyIndex].themeImage = themeImage;
        }
        
        // Auto-title if it's "New Story"
        if (library[storyIndex].title === 'New Story' && conversation.length > 0 && conversation[0].type === 'text') {
             let text = conversation[0].content.replace(/[#*`]/g, '').trim();
             if (text.length > 30) text = text.substring(0, 30) + '...';
             if (text) library[storyIndex].title = text;
        }
        
        saveLibrary();
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

  saveSettingsToStorage();
  settingsDialog.close();
}


// --- RENDERING LOGIC ---

/**
 * Renders a single turn into the conversation container.
 */
async function renderTurn(turn: Turn, themeImage?: string) {
  let turnElement = conversationContainer.querySelector(`[data-id="${turn.id}"]`) as HTMLElement;
  let isNew = false;
  
  if (!turnElement) {
      isNew = true;
      turnElement = document.createElement('div');
      turnElement.className = 'turn';
      turnElement.dataset.id = turn.id;
      
      // Apply theme if available
      if (themeImage) {
          turnElement.style.setProperty('--story-theme', `url('${themeImage}')`);
      }

      const contentElement = document.createElement('div');
      contentElement.className = 'turn-content';
      turnElement.appendChild(contentElement);
      
      turnElement.appendChild(createTurnControls(turn, turnElement));
      conversationContainer.appendChild(turnElement);
  } else if (themeImage && !turnElement.style.getPropertyValue('--story-theme')) {
       // Update existing turn if theme arrived late
       turnElement.style.setProperty('--story-theme', `url('${themeImage}')`);
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

  const deleteButton = document.createElement('button');
  deleteButton.innerHTML = '&#128465;'; 
  deleteButton.title = 'Delete';
  deleteButton.onclick = () => {
    turnElement.remove();
    const story = library.find(s => s.id === currentStoryId);
    if(story) {
        story.conversation = story.conversation.filter((t) => t.id !== turn.id);
        updateCurrentStory(story.conversation);
    }
  };

  const editButton = document.createElement('button');
  editButton.innerHTML = '&#9998;'; 
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


async function renderConversation(story: Story) {
  conversationContainer.innerHTML = '';
  const conversation = story.conversation;
  
  if (conversation.length === 0) {
      conversationContainer.appendChild(welcomeMessage);
      welcomeMessage.style.display = 'block';
  } else {
      welcomeMessage.style.display = 'none';
      for (const turn of conversation) {
          await renderTurn(turn, story.themeImage);
      }
  }
}

// --- API & GENERATION LOGIC ---

async function generateTheme(prompt: string) {
    try {
        console.log('[DEBUG] Generating theme for prompt:', prompt);
        const apiKey = currentSettings.imageApiKey || currentSettings.chatApiKey || process.env.API_KEY;
        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        const themePrompt = `Create a seamless, decorative, rectangular frame border texture relevant to the following story theme: "${prompt}". 
        The image should be a frame design or a seamless texture suitable for a CSS border-image. 
        No text. High contrast or distinct pattern preferred. Square aspect ratio.`;
        
        // Use gemini-2.5-flash-image for speed
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: themePrompt,
            config: {
                responseModalities: [Modality.IMAGE],
                imageConfig: { aspectRatio: '1:1' }
            }
        });
        
        const imgPart = response.candidates?.[0]?.content?.parts?.[0];
        if (imgPart && imgPart.inlineData) {
            const base64 = `data:image/png;base64,${imgPart.inlineData.data}`;
            return base64;
        }
    } catch (e) {
        console.error('Theme generation failed', e);
    }
    return undefined;
}

async function generateContent(prompt: string) {
  if (!currentStoryId) {
      createNewStory();
  }
  
  const story = library.find(s => s.id === currentStoryId);
  if (!story) return;
  
  welcomeMessage.style.display = 'none';
  setLoading(true);

  // --- THEME GENERATION CHECK ---
  // If story has no theme, trigger generation in background
  if (!story.themeImage) {
      generateTheme(prompt).then(theme => {
          if (theme) {
              story.themeImage = theme;
              updateCurrentStory(story.conversation, theme);
              // Re-render to apply theme to existing bubbles
              renderConversation(story);
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
      
      // Explicit instruction for image count
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

    for await (const chunk of responseStream) {
      const text = chunk.text;
      
      if (text) {
        partialText += text;
        if (!currentTextTurn) {
            currentTextTurn = { id: Date.now().toString(), type: 'text', content: '' };
            story.conversation.push(currentTextTurn);
            await renderTurn(currentTextTurn, story.themeImage);
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

      } else if (chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
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
        await renderTurn(imageTurn, story.themeImage);
      }
    }
    
    updateCurrentStory(story.conversation);

  } catch (e) {
    console.error('Generation Error:', e);
    const errorTurn: Turn = {
        id: Date.now().toString(),
        type: 'text',
        content: `**Error:** ${(e as Error).message}`
    };
    story.conversation.push(errorTurn);
    await renderTurn(errorTurn, story.themeImage);
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

// Menu & Sidebar Navigation
function toggleMainMenu() {
    mainMenu.classList.toggle('open');
    sidebarOverlay.classList.toggle('visible');
    // Ensure secondary library sidebar is closed when main menu opens
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
    // We can keep overlay visible or handle specifically.
    // If we open library from main menu, maybe close main menu?
    if (window.innerWidth < 768) {
        mainMenu.classList.remove('open'); // Mobile behavior
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
          if(importedData.length > 0 && importedData[0].conversation) {
              library = [...library, ...importedData];
          } else {
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