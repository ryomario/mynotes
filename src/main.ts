import { state, initNotes } from './state';
import { getSortedNotes } from './utils/noteUtils';
import { initSettings, loadSettings } from './ui/settings';
import { initSidebar, renderNotesList, selectNote } from './ui/sidebar';
import { initEditor, createNewNote } from './ui/editor';

async function init() {
  // 1. Initialize core state (load from storage)
  await initNotes();

  // 2. Initialize and load settings
  initSettings();
  loadSettings();

  // 3. Initialize UI modules
  initEditor();
  initSidebar();

  // 4. Render initial view
  renderNotesList();

  // 5. Select initial note based on user settings
  const settings = JSON.parse(localStorage.getItem('mynotes_settings') || '{}');
  if (state.notes.length > 0) {
    const lastNoteId = settings.rememberLastNote ? settings.lastNoteId : null;
    const noteToSelect = lastNoteId ? state.notes.find(n => n.id === lastNoteId) : null;

    if (noteToSelect) {
      selectNote(noteToSelect.id);
    } else {
      const sorted = getSortedNotes(state.notes);
      selectNote(sorted[0].id);
    }
  } else {
    createNewNote();
  }
}

// Bootstrap application
init();
