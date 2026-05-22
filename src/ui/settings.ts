import { state, clearAllNotes, saveNote, getNotesFromStorage } from '../state';
import { t } from '../utils/i18n';

// Settings Elements
const settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;
const settingsSidebar = document.getElementById('settings-sidebar') as HTMLElement;
const settingsClose = document.getElementById('settings-close') as HTMLButtonElement;
const darkModeToggle = document.getElementById('dark-mode-toggle') as HTMLInputElement;
const fontSizeRange = document.getElementById('font-size-range') as HTMLInputElement;
const fontSizeValue = document.getElementById('font-size-value') as HTMLElement;
const fontFamilySelect = document.getElementById('font-family-select') as HTMLSelectElement;
const colorBtns = document.querySelectorAll('.color-btn');
const rememberNoteToggle = document.getElementById('remember-note-toggle') as HTMLInputElement;

// Data Logic Elements
const exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
const importBtn = document.getElementById('import-btn') as HTMLButtonElement;
const importInput = document.getElementById('import-input') as HTMLInputElement;

export function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('mynotes_settings') || '{}');

  // Dark Mode
  const isDark = settings.darkMode !== undefined ? settings.darkMode : window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (!isDark) {
    document.documentElement.classList.add('light-mode');
  }
  darkModeToggle.checked = isDark;

  // Font Size
  if (settings.fontSize) {
    fontSizeRange.value = settings.fontSize;
    fontSizeValue.textContent = `${settings.fontSize}px`;
    document.documentElement.style.setProperty('--editor-font-size', `${settings.fontSize}px`);
  }

  // Font Family
  if (settings.fontFamily) {
    fontFamilySelect.value = settings.fontFamily;
    const font = settings.fontFamily === 'Serif' ? 'Georgia, serif' :
      settings.fontFamily === 'Mono' ? 'monospace' :
        "'Inter', sans-serif";
    document.documentElement.style.setProperty('--editor-font-family', font);
  }

  // Color
  if (settings.color) {
    document.documentElement.style.setProperty('--editor-text-color', settings.color);
    colorBtns.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-color') === settings.color);
    });
  }

  // Remember Last Note
  if (settings.rememberLastNote !== undefined) {
    rememberNoteToggle.checked = settings.rememberLastNote;
  }
}

export function saveSettings(key: string, value: any) {
  const settings = JSON.parse(localStorage.getItem('mynotes_settings') || '{}');
  settings[key] = value;
  localStorage.setItem('mynotes_settings', JSON.stringify(settings));
}

export function initSettings() {
  settingsBtn.addEventListener('click', () => settingsSidebar.classList.add('show'));
  settingsClose.addEventListener('click', () => settingsSidebar.classList.remove('show'));

  darkModeToggle.addEventListener('change', (e) => {
    const isDark = (e.target as HTMLInputElement).checked;
    document.documentElement.classList.toggle('light-mode', !isDark);
    saveSettings('darkMode', isDark);
  });

  fontSizeRange.addEventListener('input', (e) => {
    const val = (e.target as HTMLInputElement).value;
    fontSizeValue.textContent = `${val}px`;
    document.documentElement.style.setProperty('--editor-font-size', `${val}px`);
    saveSettings('fontSize', val);
  });

  fontFamilySelect.addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value;
    const font = val === 'Serif' ? 'Georgia, serif' :
      val === 'Mono' ? 'monospace' :
        "'Inter', sans-serif";
    document.documentElement.style.setProperty('--editor-font-family', font);
    saveSettings('fontFamily', val);
  });

  colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const color = btn.getAttribute('data-color')!;
      document.documentElement.style.setProperty('--editor-text-color', color);
      colorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveSettings('color', color);
    });
  });

  rememberNoteToggle.addEventListener('change', (e) => {
    const val = (e.target as HTMLInputElement).checked;
    saveSettings('rememberLastNote', val);
    if (val && state.activeNoteId) {
      saveSettings('lastNoteId', state.activeNoteId);
    }
  });

  // Export Logic
  exportBtn.addEventListener('click', async () => {
    const data = await getNotesFromStorage();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mynotes_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import Logic
  importBtn.addEventListener('click', () => importInput.click());

  importInput.addEventListener('change', async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const importedNotes = JSON.parse(content);

        if (Array.isArray(importedNotes) && confirm(t('import_replace_confirm'))) {
          await clearAllNotes();
          for (const note of importedNotes) {
            await saveNote(note);
          }
          window.location.reload();
        } else if (!Array.isArray(importedNotes)) {
          alert(t('import_invalid_format'));
        }
      } catch (err) {
        console.error('Import failed:', err);
        alert(t('import_failed'));
      }
      importInput.value = '';
    };
    reader.readAsText(file);
  });
}
