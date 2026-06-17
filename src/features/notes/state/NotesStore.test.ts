import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotesStore } from './NotesStore';
import type { StorageService } from '../../../shared/services/storage/StorageService';
import type { Note } from '../../../shared/types';

describe('NotesStore', () => {
  let storage: StorageService;
  let store: NotesStore;
  let now: number;
  let idCounter: number;

  const notes: Note[] = [
    { id: '1', content: 'First', updatedAt: 100, pinned: false, locked: false, order: 1 },
    { id: '2', content: 'Second', updatedAt: 200, pinned: false, locked: false, order: 2 },
  ];

  beforeEach(() => {
    now = 1000;
    idCounter = 1;
    storage = {
      getNotes: vi.fn().mockResolvedValue(notes),
      saveNote: vi.fn().mockResolvedValue(undefined),
      deleteNote: vi.fn().mockResolvedValue(undefined),
      clearAllNotes: vi.fn().mockResolvedValue(undefined),
      getBookmarks: vi.fn(),
      saveBookmark: vi.fn(),
      deleteBookmark: vi.fn(),
      deleteBookmarks: vi.fn(),
      getBookmarkFolders: vi.fn(),
      saveBookmarkFolder: vi.fn(),
      getThumbnail: vi.fn(),
      saveThumbnail: vi.fn(),
    };
    store = new NotesStore(storage, {
      createId: () => `new-${idCounter++}`,
      now: () => now,
    });
  });

  it('initializes with default state values', () => {
    expect(store.state.notes).toEqual([]);
    expect(store.state.activeNoteId).toBeNull();
    expect(store.state.activeDropdownId).toBeNull();
    expect(store.state.draggedItemId).toBeNull();
    expect(store.state.isLoading).toBe(false);
  });

  it('loads notes from storage', async () => {
    const loadingStates: boolean[] = [];
    store.subscribe(state => loadingStates.push(state.isLoading));

    await store.loadNotes();

    expect(storage.getNotes).toHaveBeenCalledTimes(1);
    expect(store.state.notes).toEqual(notes);
    expect(store.state.isLoading).toBe(false);
    expect(loadingStates).toContain(true);
  });

  it('creates a note and persists it', async () => {
    await store.loadNotes();
    const created = await store.createNote();

    expect(created).toMatchObject({
      id: 'new-1',
      content: '',
      updatedAt: 1000,
      pinned: false,
      locked: false,
      order: 3,
    });
    expect(store.state.notes[0]).toEqual(created);
    expect(store.state.activeNoteId).toBe('new-1');
    expect(storage.saveNote).toHaveBeenCalledWith(created);
  });

  it('updates unlocked note content with timestamp', async () => {
    await store.loadNotes();
    now = 2000;

    await store.updateNoteContent('1', 'Updated');

    expect(store.state.notes.find(note => note.id === '1')).toMatchObject({
      content: 'Updated',
      updatedAt: 2000,
    });
    expect(storage.saveNote).toHaveBeenCalledWith(expect.objectContaining({ id: '1', content: 'Updated' }));
  });

  it('does not update locked note content', async () => {
    vi.mocked(storage.getNotes).mockResolvedValue([{ ...notes[0], locked: true }]);
    await store.loadNotes();

    await store.updateNoteContent('1', 'Blocked');

    expect(store.state.notes[0].content).toBe('First');
    expect(storage.saveNote).not.toHaveBeenCalled();
  });

  it('selects notes and ignores unknown IDs', async () => {
    await store.loadNotes();

    store.selectNote('1');
    expect(store.state.activeNoteId).toBe('1');

    store.selectNote('missing');
    expect(store.state.activeNoteId).toBe('1');
  });

  it('toggles pin and lock state', async () => {
    await store.loadNotes();

    await store.togglePin('1');
    await store.toggleLock('1');

    expect(store.state.notes.find(note => note.id === '1')).toMatchObject({ pinned: true, locked: true });
    expect(storage.saveNote).toHaveBeenCalledTimes(2);
  });

  it('reorders notes and persists updated order values', async () => {
    await store.loadNotes();

    await store.reorderNotes('1', '2');

    expect(store.state.notes.map(note => note.id)).toEqual(['2', '1']);
    expect(store.state.notes.map(note => note.order)).toEqual([2, 1]);
    expect(storage.saveNote).toHaveBeenCalledTimes(2);
  });

  it('deletes active note and selects next sorted note', async () => {
    await store.loadNotes();
    store.selectNote('2');

    await store.deleteNote('2');

    expect(store.state.notes.map(note => note.id)).toEqual(['1']);
    expect(store.state.activeNoteId).toBe('1');
    expect(storage.deleteNote).toHaveBeenCalledWith('2');
  });

  it('imports notes by replacing persisted notes', async () => {
    const imported: Note[] = [
      { id: 'imported', content: 'Imported', updatedAt: 300, pinned: false, locked: false, order: 1 },
    ];

    await store.importNotes(imported);

    expect(storage.clearAllNotes).toHaveBeenCalledTimes(1);
    expect(storage.saveNote).toHaveBeenCalledWith(imported[0]);
    expect(store.state.notes).toEqual(imported);
    expect(store.state.activeNoteId).toBe('imported');
  });

  it('clears all notes', async () => {
    await store.loadNotes();
    store.selectNote('1');

    await store.clearAllNotes();

    expect(store.state.notes).toEqual([]);
    expect(store.state.activeNoteId).toBeNull();
    expect(storage.clearAllNotes).toHaveBeenCalledTimes(1);
  });
});