import { getStorageService } from './shared/services/storage/storageFactory';
import { getSortedNotes } from './utils/noteUtils';
import { translateDOM, createLanguageSelectorComponent } from './shared/services/i18n/i18n';
import { EditorView, NotesStore, SettingsView, SidebarView } from './features/notes';

async function init() {
  // Initialize translations
  translateDOM();

  const notesStore = new NotesStore(getStorageService());
  await notesStore.loadNotes();

  const settingsView = new SettingsView(notesStore);
  settingsView.init();

  // Inject language selector
  const settingsSection = document.querySelector('#settings-sidebar .settings-content .settings-section');
  if (settingsSection) {
    settingsSection.appendChild(createLanguageSelectorComponent());
  }

  const editorView = new EditorView(notesStore);
  const sidebarView = new SidebarView(notesStore, {
    onSelectNote: id => {
      const settings = JSON.parse(localStorage.getItem('mynotes_settings') || '{}');
      if (settings.rememberLastNote) {
        settingsView.saveSettings('lastNoteId', id);
      }
    },
  });

  editorView.init();
  sidebarView.init();

  const settings = JSON.parse(localStorage.getItem('mynotes_settings') || '{}');
  if (notesStore.state.notes.length > 0) {
    const lastNoteId = settings.rememberLastNote ? settings.lastNoteId : null;
    const noteToSelect = lastNoteId ? notesStore.state.notes.find(note => note.id === lastNoteId) : null;

    if (noteToSelect) {
      notesStore.selectNote(noteToSelect.id);
    } else {
      const sorted = getSortedNotes(notesStore.state.notes);
      notesStore.selectNote(sorted[0].id);
    }
  } else {
    await notesStore.createNote();
    editorView.focus();
  }
}

// Bootstrap application
init();
