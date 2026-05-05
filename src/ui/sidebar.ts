import { state, saveNote, deleteNote } from '../state';
import { getTitle, getRelativeTime, getSortedNotes } from '../utils/noteUtils';
import { updateEditorContent, noteEditor } from './editor';
import { saveSettings } from './settings';
import type { Note } from '../storages/storage';

export const notesList = document.getElementById('notes-list') as HTMLElement;

export function initSidebar() {
  setInterval(() => {
    const noteItems = notesList.querySelectorAll('.note-item');
    noteItems.forEach(item => {
      const id = (item as HTMLElement).dataset.id;
      const note = state.notes.find(n => n.id === id);
      if (note) {
        updateNoteInList(note);
      }
    });
  }, 30000);

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.note-options')) {
      if (state.activeDropdownId) {
        closeDropdown();
      }
    }
  });
}

export function updateNoteInList(note: Note) {
  const noteItem = notesList.querySelector(`[data-id="${note.id}"]`);
  if (noteItem) {
    const dateEl = noteItem.querySelector('.note-date') as HTMLElement;
    if (dateEl) {
      const relativeTime = getRelativeTime(note.updatedAt);
      dateEl.innerHTML = `${relativeTime} ${note.locked ? '🔒' : ''}`;
    }
  }
}

export function renderNotesList() {
  notesList.innerHTML = '';
  const sortedNotes = getSortedNotes(state.notes);

  sortedNotes.forEach(note => {
    const title = getTitle(note.content);
    const relativeTime = getRelativeTime(note.updatedAt);
    const fullDate = new Date(note.updatedAt).toLocaleString();

    const div = document.createElement('div');
    div.dataset.id = note.id;
    div.className = `note-item ${note.id === state.activeNoteId ? 'active' : ''} ${note.pinned ? 'pinned' : ''} ${state.activeDropdownId === note.id ? 'dropdown-active' : ''}`;
    div.draggable = true;
    div.innerHTML = `
      <div class="note-info">
        <div class="note-title">${title || 'Untitled Note'}</div>
        <div class="note-date" title="${fullDate}">${relativeTime} ${note.locked ? '🔒' : ''}</div>
      </div>
      <div class="note-options">
        <button class="options-trigger" title="More options">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z" />
          </svg>
        </button>
        <div class="dropdown-menu ${state.activeDropdownId === note.id ? 'show' : ''}">
          <button class="dropdown-item pin-btn">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" />
            </svg>
            ${note.pinned ? 'Unpin' : 'Pin'}
          </button>
          <button class="dropdown-item lock-btn">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="${note.locked ? 'M12,17A2,2 0 0,0 14,15A2,2 0 0,0 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8H17V6A5,5 0 0,0 12,1A5,5 0 0,0 7,6V8H6A2,2 0 0,0 4,10V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V10A2,2 0 0,0 18,8M8,6A4,4 0 0,1 12,2A4,4 0 0,1 16,6V8H8V6Z' : 'M12,13A2,2 0 0,1 14,15A2,2 0 0,1 12,17A2,2 0 0,1 10,15A2,2 0 0,1 12,13M18,8H17V6A5,5 0 0,0 12,1A5,5 0 0,0 7,6V8H6A2,2 0 0,0 4,10V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V10A2,2 0 0,0 18,8M8,6A4,4 0 0,1 12,2A4,4 0 0,1 16,6V8H8V6M18,20H6V10H18V20Z'}" />
            </svg>
            ${note.locked ? 'Unlock' : 'Lock'}
          </button>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item delete-btn danger">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19V4M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    `;

    // Drag and Drop Events
    div.addEventListener('dragstart', (e) => {
      state.draggedItemId = note.id;
      div.classList.add('dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
      }
    });

    div.addEventListener('dragend', () => {
      div.classList.remove('dragging');
      state.draggedItemId = null;
      document.querySelectorAll('.note-item').forEach(el => el.classList.remove('drag-over'));
    });

    div.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (state.draggedItemId && state.draggedItemId !== note.id) {
        div.classList.add('drag-over');
      }
    });

    div.addEventListener('dragleave', () => {
      div.classList.remove('drag-over');
    });

    div.addEventListener('drop', async (e) => {
      e.preventDefault();
      if (state.draggedItemId && state.draggedItemId !== note.id) {
        await reorderNotes(state.draggedItemId, note.id);
      }
    });

    div.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('.note-options')) return;
      selectNote(note.id);
    });

    const optionsTrigger = div.querySelector('.options-trigger') as HTMLButtonElement;
    optionsTrigger.onclick = (e) => {
      e.stopPropagation();
      toggleDropdown(note.id);
    };

    const pinBtn = div.querySelector('.pin-btn') as HTMLButtonElement;
    pinBtn.onclick = (e) => {
      e.stopPropagation();
      togglePin(note.id);
      closeDropdown();
    };

    const lockBtn = div.querySelector('.lock-btn') as HTMLButtonElement;
    lockBtn.onclick = (e) => {
      e.stopPropagation();
      toggleLock(note.id);
      closeDropdown();
    };

    const deleteBtn = div.querySelector('.delete-btn') as HTMLButtonElement;
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteNoteHandler(note.id);
      closeDropdown();
    };

    notesList.appendChild(div);
  });
}

export function selectNote(id: string) {
  if (state.activeNoteId === id && notesList.querySelector(`.note-item.active[data-id="${id}"]`)) return;

  const previousId = state.activeNoteId;
  state.activeNoteId = id;
  const note = state.notes.find(n => n.id === id);

  if (note) {
    updateEditorContent();

    if (previousId) {
      const prevItem = notesList.querySelector(`[data-id="${previousId}"]`);
      prevItem?.classList.remove('active');
    }

    const newItem = notesList.querySelector(`[data-id="${id}"]`);
    newItem?.classList.add('active');

    const settings = JSON.parse(localStorage.getItem('mynotes_settings') || '{}');
    if (settings.rememberLastNote) {
      saveSettings('lastNoteId', id);
    }
  }
}

async function reorderNotes(draggedId: string, targetId: string) {
  const draggedIndex = state.notes.findIndex(n => n.id === draggedId);
  const targetIndex = state.notes.findIndex(n => n.id === targetId);

  if (draggedIndex !== -1 && targetIndex !== -1) {
    const [draggedItem] = state.notes.splice(draggedIndex, 1);
    state.notes.splice(targetIndex, 0, draggedItem);

    // Update order values for all notes (top-down)
    state.notes.forEach((note, index) => {
      note.order = state.notes.length - index;
      saveNote(note);
    });

    renderNotesList();
  }
}

function toggleDropdown(id: string) {
  const previousId = state.activeDropdownId;

  if (state.activeDropdownId === id) {
    state.activeDropdownId = null;
  } else {
    state.activeDropdownId = id;
  }

  if (previousId && previousId !== state.activeDropdownId) {
    const prevItem = notesList.querySelector(`[data-id="${previousId}"]`);
    prevItem?.classList.remove('dropdown-active');
    prevItem?.querySelector('.dropdown-menu')?.classList.remove('show');
  }

  if (state.activeDropdownId) {
    const newItem = notesList.querySelector(`[data-id="${state.activeDropdownId}"]`);
    newItem?.classList.add('dropdown-active');
    newItem?.querySelector('.dropdown-menu')?.classList.add('show');
  }
}

function closeDropdown() {
  if (state.activeDropdownId) {
    const item = notesList.querySelector(`[data-id="${state.activeDropdownId}"]`);
    item?.classList.remove('dropdown-active');
    item?.querySelector('.dropdown-menu')?.classList.remove('show');
    state.activeDropdownId = null;
  }
}

async function togglePin(id: string) {
  const note = state.notes.find(n => n.id === id);
  if (note) {
    note.pinned = !note.pinned;
    await saveNote(note);
    renderNotesList();
  }
}

async function toggleLock(id: string) {
  const note = state.notes.find(n => n.id === id);
  if (note) {
    note.locked = !note.locked;

    if (state.activeNoteId === id) {
      noteEditor.readOnly = note.locked;
    }

    const noteItem = notesList.querySelector(`[data-id="${id}"]`);
    if (noteItem) {
      const dateEl = noteItem.querySelector('.note-date') as HTMLElement;
      if (dateEl) {
        const relativeTime = getRelativeTime(note.updatedAt);
        dateEl.innerHTML = `${relativeTime} ${note.locked ? '🔒' : ''}`;
      }

      const lockBtn = noteItem.querySelector('.lock-btn') as HTMLButtonElement;
      if (lockBtn) {
        const lockIcon = lockBtn.querySelector('path') as SVGPathElement;
        const lockPath = note.locked
          ? 'M12,17A2,2 0 0,0 14,15A2,2 0 0,0 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8H17V6A5,5 0 0,0 12,1A5,5 0 0,0 7,6V8H6A2,2 0 0,0 4,10V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V10A2,2 0 0,0 18,8M8,6A4,4 0 0,1 12,2A4,4 0 0,1 16,6V8H8V6Z'
          : 'M12,13A2,2 0 0,1 14,15A2,2 0 0,1 12,17A2,2 0 0,1 10,15A2,2 0 0,1 12,13M18,8H17V6A5,5 0 0,0 12,1A5,5 0 0,0 7,6V8H6A2,2 0 0,0 4,10V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V10A2,2 0 0,0 18,8M8,6A4,4 0 0,1 12,2A4,4 0 0,1 16,6V8H8V6M18,20H6V10H18V20Z';
        lockIcon.setAttribute('d', lockPath);
        lockBtn.childNodes[lockBtn.childNodes.length - 1].textContent = ` ${note.locked ? 'Unlock' : 'Lock'}`;
      }
    }

    await saveNote(note);
  }
}

async function deleteNoteHandler(id: string) {
  if (confirm('Are you sure you want to delete this note?')) {
    await deleteNote(id);
    if (state.activeNoteId === id) {
      state.activeNoteId = state.notes.length > 0 ? state.notes[0].id : null;
      if (state.activeNoteId) {
        selectNote(state.activeNoteId);
      } else {
        updateEditorContent();
      }
    }
    renderNotesList();
  }
}
