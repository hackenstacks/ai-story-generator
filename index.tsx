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

// --- TYPE DEFINITIONS ---
type Turn = {
  id: string;
  type: 'text' | 'image';
  content: string; // For text, it's markdown. For image, it's base64 data URI.
};

let conversation: Turn[] = [];

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

  turnElement.appendChild(contentElement);
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
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
        // Text block is finished, create image turn
        partialText = '';
        currentTextTurn = null;

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

// Load conversation on startup
loadConversation();
