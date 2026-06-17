import { getRelativeTime, getSortedNotes, getTitle } from '../../../utils/noteUtils';
import { t } from '../../../utils/i18n';
import type { Note } from '../../../shared/types';
import type { NotesState } from '../state/NotesStore';
import { NotesStore } from '../state/NotesStore';

export class SidebarView {
  private store: NotesStore;
  private notesList: HTMLElement;
  private refreshIntervalId: number | undefined;
  private onSelectNote?: (id: string) => void;

  constructor(store: NotesStore, options: { onSelectNote?: (id: string) => void } = {}) {
    this.store = store;
    this.notesList = document.getElementById('notes-list') as HTMLElement;
    this.onSelectNote = options.onSelectNote;
  }

  public init(): void {
    this.store.subscribe(state => this.render(state));

    this.refreshIntervalId = window.setInterval(() => {
      this.render(this.store.state);
    }, 30000);

    document.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      if (!target.closest('.note-options')) {
        this.store.closeDropdown();
      }
    });
  }

  public dispose(): void {
    if (this.refreshIntervalId !== undefined) {
      window.clearInterval(this.refreshIntervalId);
    }
  }

  private render(state: NotesState): void {
    this.notesList.innerHTML = '';

    getSortedNotes(state.notes).forEach(note => {
      this.notesList.appendChild(this.createNoteItem(note, state));
    });
  }

  private createNoteItem(note: Note, state: NotesState): HTMLElement {
    const title = getTitle(note.content) || t('untitled_note');
    const relativeTime = getRelativeTime(note.updatedAt);
    const fullDate = new Date(note.updatedAt).toLocaleString();

    const div = document.createElement('div');
    div.dataset.id = note.id;
    div.className = `note-item ${note.id === state.activeNoteId ? 'active' : ''} ${note.pinned ? 'pinned' : ''} ${state.activeDropdownId === note.id ? 'dropdown-active' : ''}`;
    div.draggable = true;
    div.innerHTML = `
      <div class="note-info">
        <div class="note-title"></div>
        <div class="note-date" title="${fullDate}">${relativeTime} ${note.locked ? '🔒' : ''}</div>
      </div>
      <div class="note-options">
        <button class="options-trigger" title="${t('more_options_tooltip')}">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z" />
          </svg>
        </button>
        <div class="dropdown-menu ${state.activeDropdownId === note.id ? 'show' : ''}">
          <button class="dropdown-item pin-btn">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" />
            </svg>
            ${note.pinned ? t('unpin_label') : t('pin_label')}
          </button>
          <button class="dropdown-item lock-btn">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="${this.getLockIconPath(!!note.locked)}" />
            </svg>
            ${note.locked ? t('unlock_label') : t('lock_label')}
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item delete-btn danger">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19V4M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
            </svg>
            ${t('delete_label')}
          </button>
        </div>
      </div>
    `;

    const titleElement = div.querySelector('.note-title');
    if (titleElement) titleElement.textContent = title;

    this.bindNoteItemEvents(div, note);
    return div;
  }

  private bindNoteItemEvents(div: HTMLElement, note: Note): void {
    div.addEventListener('dragstart', event => {
      this.store.setDraggedItem(note.id);
      div.classList.add('dragging');
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
      }
    });

    div.addEventListener('dragend', () => {
      div.classList.remove('dragging');
      this.store.setDraggedItem(null);
      document.querySelectorAll('.note-item').forEach(element => element.classList.remove('drag-over'));
    });

    div.addEventListener('dragover', event => {
      event.preventDefault();
      if (this.store.state.draggedItemId && this.store.state.draggedItemId !== note.id) {
        div.classList.add('drag-over');
      }
    });

    div.addEventListener('dragleave', () => {
      div.classList.remove('drag-over');
    });

    div.addEventListener('drop', event => {
      event.preventDefault();
      const draggedItemId = this.store.state.draggedItemId;
      if (draggedItemId && draggedItemId !== note.id) {
        void this.store.reorderNotes(draggedItemId, note.id);
      }
    });

    div.addEventListener('click', event => {
      const target = event.target as HTMLElement;
      if (target.closest('.note-options')) return;
      this.store.selectNote(note.id);
      this.onSelectNote?.(note.id);
    });

    this.bindButton(div, '.options-trigger', event => {
      event.stopPropagation();
      this.store.toggleDropdown(note.id);
    });

    this.bindButton(div, '.pin-btn', event => {
      event.stopPropagation();
      void this.store.togglePin(note.id).then(() => this.store.closeDropdown());
    });

    this.bindButton(div, '.lock-btn', event => {
      event.stopPropagation();
      void this.store.toggleLock(note.id).then(() => this.store.closeDropdown());
    });

    this.bindButton(div, '.delete-btn', event => {
      event.stopPropagation();
      if (confirm(t('delete_note_confirm'))) {
        void this.store.deleteNote(note.id);
      }
      this.store.closeDropdown();
    });
  }

  private bindButton(parent: HTMLElement, selector: string, handler: (event: MouseEvent) => void): void {
    const button = parent.querySelector(selector) as HTMLButtonElement | null;
    button?.addEventListener('click', handler);
  }

  private getLockIconPath(locked: boolean): string {
    return locked
      ? 'M12,17A2,2 0 0,0 14,15A2,2 0 0,0 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8H17V6A5,5 0 0,0 12,1A5,5 0 0,0 7,6V8H6A2,2 0 0,0 4,10V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V10A2,2 0 0,0 18,8M8,6A4,4 0 0,1 12,2A4,4 0 0,1 16,6V8H8V6Z'
      : 'M12,13A2,2 0 0,1 14,15A2,2 0 0,1 12,17A2,2 0 0,1 10,15A2,2 0 0,1 12,13M18,8H17V6A5,5 0 0,0 12,1A5,5 0 0,0 7,6V8H6A2,2 0 0,0 4,10V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V10A2,2 0 0,0 18,8M8,6A4,4 0 0,1 12,2A4,4 0 0,1 16,6V8H8V6M18,20H6V10H18V20Z';
  }
}