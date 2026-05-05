import { state, saveNote } from '../state';
import { getTitle } from '../utils/noteUtils';
import { renderNotesList, updateNoteInList } from './sidebar';

export const noteEditor = document.getElementById('note-editor') as HTMLTextAreaElement;
const addNoteBtn = document.getElementById('add-note-btn') as HTMLButtonElement;
const sidebarToggle = document.getElementById('sidebar-toggle') as HTMLButtonElement;
const appContainer = document.getElementById('app') as HTMLElement;

export function initEditor() {
  addNoteBtn.addEventListener('click', createNewNote);

  let saveTimeout: number;
  noteEditor.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveTimeout = window.setTimeout(saveCurrentNote, 300);
  });

  sidebarToggle.addEventListener('click', () => appContainer.classList.toggle('sidebar-hidden'));
}

export async function createNewNote() {
  const maxOrder = state.notes.length > 0 ? Math.max(...state.notes.map(n => n.order ?? 0)) : 0;
  const newNote = {
    id: crypto.randomUUID(),
    content: '',
    updatedAt: Date.now(),
    pinned: false,
    locked: false,
    order: maxOrder + 1
  };
  state.notes.unshift(newNote);
  state.activeNoteId = newNote.id;
  noteEditor.value = '';
  noteEditor.readOnly = false;
  await saveNote(newNote);
  renderNotesList();
  noteEditor.focus();
}

async function saveCurrentNote() {
  if (!state.activeNoteId) return;

  const note = state.notes.find(n => n.id === state.activeNoteId);
  if (note && !note.locked) {
    const needToRenderList = getTitle(note.content) !== getTitle(noteEditor.value) || note.pinned;
    note.content = noteEditor.value;
    note.updatedAt = Date.now();
    await saveNote(note);
    if (needToRenderList) {
      renderNotesList();
    } else {
      updateNoteInList(note);
    }
  }
}

export function updateEditorContent() {
  const note = state.notes.find(n => n.id === state.activeNoteId);
  if (note) {
    noteEditor.value = note.content;
    noteEditor.readOnly = !!note.locked;
  } else {
    noteEditor.value = '';
    noteEditor.readOnly = false;
  }
}
