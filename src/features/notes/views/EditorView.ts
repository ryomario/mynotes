import type { NotesState } from '../state/NotesStore';
import { NotesStore } from '../state/NotesStore';

export class EditorView {
  private store: NotesStore;
  private noteEditor: HTMLTextAreaElement;
  private addNoteBtn: HTMLButtonElement;
  private sidebarToggle: HTMLButtonElement;
  private appContainer: HTMLElement;
  private saveTimeout: number | undefined;

  constructor(store: NotesStore) {
    this.store = store;
    this.noteEditor = document.getElementById('note-editor') as HTMLTextAreaElement;
    this.addNoteBtn = document.getElementById('add-note-btn') as HTMLButtonElement;
    this.sidebarToggle = document.getElementById('sidebar-toggle') as HTMLButtonElement;
    this.appContainer = document.getElementById('app') as HTMLElement;
  }

  public init(): void {
    this.addNoteBtn.addEventListener('click', () => {
      void this.createAndFocusNote();
    });

    this.noteEditor.addEventListener('input', () => {
      window.clearTimeout(this.saveTimeout);
      this.saveTimeout = window.setTimeout(() => {
        void this.saveCurrentNote();
      }, 300);
    });

    this.sidebarToggle.addEventListener('click', () => {
      this.appContainer.classList.toggle('sidebar-hidden');
    });

    this.store.subscribe(state => this.render(state));
  }

  public focus(): void {
    this.noteEditor.focus();
  }

  private async createAndFocusNote(): Promise<void> {
    await this.store.createNote();
    this.focus();
  }

  private async saveCurrentNote(): Promise<void> {
    const activeNoteId = this.store.state.activeNoteId;
    if (!activeNoteId) return;

    await this.store.updateNoteContent(activeNoteId, this.noteEditor.value);
  }

  private render(state: NotesState): void {
    const note = state.notes.find(item => item.id === state.activeNoteId);
    const nextValue = note?.content ?? '';

    if (this.noteEditor.value !== nextValue) {
      this.noteEditor.value = nextValue;
    }

    this.noteEditor.readOnly = !!note?.locked;
  }
}