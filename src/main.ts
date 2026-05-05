import './style.css'
import { getStorageAdapter } from './storages/storage'
import type { Note } from './storages/storage'
import { getTitle, getRelativeTime } from './utils/noteUtils'

const storage = getStorageAdapter();
const notesList = document.getElementById('notes-list') as HTMLElement;
const noteEditor = document.getElementById('note-editor') as HTMLTextAreaElement;
const addNoteBtn = document.getElementById('add-note-btn') as HTMLButtonElement;

let notes: Note[] = [];
let activeNoteId: string | null = null;
let activeDropdownId: string | null = null;

async function init() {
  notes = await storage.getNotes();
  renderNotesList();

  if (notes.length > 0) {
    selectNote(notes[0].id);
  } else {
    createNewNote();
  }
}

function renderNotesList() {
  notesList.innerHTML = '';

  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt - a.updatedAt;
  });

  sortedNotes.forEach(note => {
    const title = getTitle(note.content);
    const relativeTime = getRelativeTime(note.updatedAt);
    const fullDate = new Date(note.updatedAt).toLocaleString();

    const div = document.createElement('div');
    div.dataset.id = note.id;
    div.className = `note-item ${note.id === activeNoteId ? 'active' : ''} ${note.pinned ? 'pinned' : ''} ${activeDropdownId === note.id ? 'dropdown-active' : ''}`;
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
        <div class="dropdown-menu ${activeDropdownId === note.id ? 'show' : ''}">
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
      deleteNote(note.id);
      closeDropdown();
    };

    notesList.appendChild(div);
  });
}

function toggleDropdown(id: string) {
  const previousId = activeDropdownId;

  if (activeDropdownId === id) {
    activeDropdownId = null;
  } else {
    activeDropdownId = id;
  }

  if (previousId && previousId !== activeDropdownId) {
    const prevItem = notesList.querySelector(`[data-id="${previousId}"]`);
    prevItem?.classList.remove('dropdown-active');
    prevItem?.querySelector('.dropdown-menu')?.classList.remove('show');
  }

  if (activeDropdownId) {
    const newItem = notesList.querySelector(`[data-id="${activeDropdownId}"]`);
    newItem?.classList.add('dropdown-active');
    newItem?.querySelector('.dropdown-menu')?.classList.add('show');
  }
}

function closeDropdown() {
  if (activeDropdownId) {
    const item = notesList.querySelector(`[data-id="${activeDropdownId}"]`);
    item?.classList.remove('dropdown-active');
    item?.querySelector('.dropdown-menu')?.classList.remove('show');
    activeDropdownId = null;
  }
}

// Close dropdown on click outside
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.note-options')) {
    if (activeDropdownId) {
      closeDropdown();
    }
  }
});


function selectNote(id: string) {
  if (activeNoteId === id && notesList.querySelector(`.note-item.active[data-id="${id}"]`)) return;

  const previousId = activeNoteId;
  activeNoteId = id;
  const note = notes.find(n => n.id === id);
  
  if (note) {
    noteEditor.value = note.content;
    noteEditor.readOnly = !!note.locked;
    
    // Update Sidebar Item highlighting directly
    if (previousId) {
      const prevItem = notesList.querySelector(`[data-id="${previousId}"]`);
      prevItem?.classList.remove('active');
    }
    
    const newItem = notesList.querySelector(`[data-id="${id}"]`);
    newItem?.classList.add('active');
  }
}

async function createNewNote() {
  const newNote: Note = {
    id: crypto.randomUUID(),
    content: '',
    updatedAt: Date.now(),
    pinned: false,
    locked: false
  };
  notes.unshift(newNote);
  activeNoteId = newNote.id;
  noteEditor.value = '';
  noteEditor.readOnly = false;
  await storage.saveNote(newNote);
  renderNotesList();
  noteEditor.focus();
}

async function saveCurrentNote() {
  if (!activeNoteId) return;

  const note = notes.find(n => n.id === activeNoteId);
  if (note && !note.locked) {
    const needToRenderList = getTitle(note.content) !== getTitle(noteEditor.value) || note.pinned;
    note.content = noteEditor.value;
    note.updatedAt = Date.now();
    await storage.saveNote(note);
    if (needToRenderList) {
      renderNotesList();
    } else {
      // Update date directly in DOM if list is not re-rendered
      const noteItem = notesList.querySelector(`[data-id="${note.id}"]`);
      if (noteItem) {
        const dateEl = noteItem.querySelector('.note-date') as HTMLElement;
        if (dateEl) {
          dateEl.innerHTML = `${getRelativeTime(note.updatedAt)} ${note.locked ? '🔒' : ''}`;
        }
      }
    }
  }
}

async function togglePin(id: string) {
  const note = notes.find(n => n.id === id);
  if (note) {
    note.pinned = !note.pinned;
    await storage.saveNote(note);
    renderNotesList();
  }
}

async function toggleLock(id: string) {
  const note = notes.find(n => n.id === id);
  if (note) {
    note.locked = !note.locked;
    
    // Update Editor if active
    if (activeNoteId === id) {
      noteEditor.readOnly = note.locked;
    }

    // Update Sidebar Item directly
    const noteItem = notesList.querySelector(`[data-id="${id}"]`);
    if (noteItem) {
      // Update Lock Icon in Info
      const dateEl = noteItem.querySelector('.note-date') as HTMLElement;
      if (dateEl) {
        const relativeTime = getRelativeTime(note.updatedAt);
        dateEl.innerHTML = `${relativeTime} ${note.locked ? '🔒' : ''}`;
      }

      // Update Lock Button in Dropdown
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

    await storage.saveNote(note);
  }
}

async function deleteNote(id: string) {
  if (confirm('Are you sure you want to delete this note?')) {
    await storage.deleteNote(id);
    notes = notes.filter(n => n.id !== id);
    if (activeNoteId === id) {
      activeNoteId = notes.length > 0 ? notes[0].id : null;
      if (activeNoteId) {
        selectNote(activeNoteId);
      } else {
        noteEditor.value = '';
        noteEditor.readOnly = false;
      }
    }
    renderNotesList();
  }
}

// Event Listeners
addNoteBtn.addEventListener('click', createNewNote);

// Debounced save for better performance
let saveTimeout: number;
noteEditor.addEventListener('input', () => {
  clearTimeout(saveTimeout);
  saveTimeout = window.setTimeout(saveCurrentNote, 300);
});

// Poll to update relative time in the sidebar every 30 seconds
setInterval(() => {
  const noteItems = notesList.querySelectorAll('.note-item');
  noteItems.forEach(item => {
    const id = (item as HTMLElement).dataset.id;
    const note = notes.find(n => n.id === id);
    if (note) {
      const dateEl = item.querySelector('.note-date') as HTMLElement;
      if (dateEl) {
        const relativeTime = getRelativeTime(note.updatedAt);
        // Preserve the lock icon if present
        dateEl.innerHTML = `${relativeTime} ${note.locked ? '🔒' : ''}`;
      }
    }
  });
}, 30000);

init();
