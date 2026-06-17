import type { Note } from '../../../shared/types';
import { t } from '../../../utils/i18n';
import { NotesStore } from '../state/NotesStore';

type SettingValue = string | boolean | number;

export class SettingsView {
  private store: NotesStore;
  private settingsBtn: HTMLButtonElement;
  private settingsSidebar: HTMLElement;
  private settingsClose: HTMLButtonElement;
  private darkModeToggle: HTMLInputElement;
  private fontSizeRange: HTMLInputElement;
  private fontSizeValue: HTMLElement;
  private fontFamilySelect: HTMLSelectElement;
  private colorBtns: NodeListOf<Element>;
  private rememberNoteToggle: HTMLInputElement;
  private exportBtn: HTMLButtonElement;
  private importBtn: HTMLButtonElement;
  private importInput: HTMLInputElement;

  constructor(store: NotesStore) {
    this.store = store;
    this.settingsBtn = document.getElementById('settings-btn') as HTMLButtonElement;
    this.settingsSidebar = document.getElementById('settings-sidebar') as HTMLElement;
    this.settingsClose = document.getElementById('settings-close') as HTMLButtonElement;
    this.darkModeToggle = document.getElementById('dark-mode-toggle') as HTMLInputElement;
    this.fontSizeRange = document.getElementById('font-size-range') as HTMLInputElement;
    this.fontSizeValue = document.getElementById('font-size-value') as HTMLElement;
    this.fontFamilySelect = document.getElementById('font-family-select') as HTMLSelectElement;
    this.colorBtns = document.querySelectorAll('.color-btn');
    this.rememberNoteToggle = document.getElementById('remember-note-toggle') as HTMLInputElement;
    this.exportBtn = document.getElementById('export-btn') as HTMLButtonElement;
    this.importBtn = document.getElementById('import-btn') as HTMLButtonElement;
    this.importInput = document.getElementById('import-input') as HTMLInputElement;
  }

  public init(): void {
    this.loadSettings();
    this.bindSettingsEvents();
    this.bindDataEvents();
  }

  public saveSettings(key: string, value: SettingValue): void {
    const settings = this.getSettings();
    settings[key] = value;
    localStorage.setItem('mynotes_settings', JSON.stringify(settings));
  }

  private loadSettings(): void {
    const settings = this.getSettings();

    const isDark = settings.darkMode !== undefined
      ? Boolean(settings.darkMode)
      : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('light-mode', !isDark);
    this.darkModeToggle.checked = isDark;

    if (settings.fontSize) {
      const fontSize = String(settings.fontSize);
      this.fontSizeRange.value = fontSize;
      this.fontSizeValue.textContent = `${fontSize}px`;
      document.documentElement.style.setProperty('--editor-font-size', `${fontSize}px`);
    }

    if (settings.fontFamily) {
      const fontFamily = String(settings.fontFamily);
      this.fontFamilySelect.value = fontFamily;
      document.documentElement.style.setProperty('--editor-font-family', this.resolveFontFamily(fontFamily));
    }

    if (settings.color) {
      const color = String(settings.color);
      document.documentElement.style.setProperty('--editor-text-color', color);
      this.colorBtns.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-color') === color);
      });
    }

    if (settings.rememberLastNote !== undefined) {
      this.rememberNoteToggle.checked = Boolean(settings.rememberLastNote);
    }
  }

  private bindSettingsEvents(): void {
    this.settingsBtn.addEventListener('click', () => this.settingsSidebar.classList.add('show'));
    this.settingsClose.addEventListener('click', () => this.settingsSidebar.classList.remove('show'));

    this.darkModeToggle.addEventListener('change', event => {
      const isDark = (event.target as HTMLInputElement).checked;
      document.documentElement.classList.toggle('light-mode', !isDark);
      this.saveSettings('darkMode', isDark);
    });

    this.fontSizeRange.addEventListener('input', event => {
      const value = (event.target as HTMLInputElement).value;
      this.fontSizeValue.textContent = `${value}px`;
      document.documentElement.style.setProperty('--editor-font-size', `${value}px`);
      this.saveSettings('fontSize', value);
    });

    this.fontFamilySelect.addEventListener('change', event => {
      const value = (event.target as HTMLSelectElement).value;
      document.documentElement.style.setProperty('--editor-font-family', this.resolveFontFamily(value));
      this.saveSettings('fontFamily', value);
    });

    this.colorBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.getAttribute('data-color');
        if (!color) return;

        document.documentElement.style.setProperty('--editor-text-color', color);
        this.colorBtns.forEach(colorBtn => colorBtn.classList.remove('active'));
        btn.classList.add('active');
        this.saveSettings('color', color);
      });
    });

    this.rememberNoteToggle.addEventListener('change', event => {
      const rememberLastNote = (event.target as HTMLInputElement).checked;
      this.saveSettings('rememberLastNote', rememberLastNote);

      if (rememberLastNote && this.store.state.activeNoteId) {
        this.saveSettings('lastNoteId', this.store.state.activeNoteId);
      }
    });
  }

  private bindDataEvents(): void {
    this.exportBtn.addEventListener('click', () => {
      void this.exportNotes();
    });

    this.importBtn.addEventListener('click', () => this.importInput.click());

    this.importInput.addEventListener('change', event => {
      void this.importNotes(event);
    });
  }

  private async exportNotes(): Promise<void> {
    const data = await this.store.getPersistedNotes();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `mynotes_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private async importNotes(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const importedNotes = JSON.parse(content) as unknown;

      if (Array.isArray(importedNotes) && confirm(t('import_replace_confirm'))) {
        await this.store.importNotes(importedNotes as Note[]);
      } else if (!Array.isArray(importedNotes)) {
        alert(t('import_invalid_format'));
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert(t('import_failed'));
    } finally {
      this.importInput.value = '';
    }
  }

  private getSettings(): Record<string, SettingValue> {
    return JSON.parse(localStorage.getItem('mynotes_settings') || '{}') as Record<string, SettingValue>;
  }

  private resolveFontFamily(value: string): string {
    if (value === 'Serif') return 'Georgia, serif';
    if (value === 'Mono') return 'monospace';
    return "'Inter', sans-serif";
  }
}