import { Store } from '../../../shared/state/Store';
import type { StorageService } from '../../../shared/services/storage/StorageService';
import type { Note } from '../../../shared/types';
import { getSortedNotes } from '../../../utils/noteUtils';

export interface NotesState {
  notes: Note[];
  activeNoteId: string | null;
  activeDropdownId: string | null;
  draggedItemId: string | null;
  isLoading: boolean;
}

export interface NotesStoreOptions {
  createId?: () => string;
  now?: () => number;
}

export class NotesStore extends Store<NotesState> {
  private storageService: StorageService;
  private createId: () => string;
  private now: () => number;

  constructor(storageService: StorageService, options: NotesStoreOptions = {}) {
    super({
      notes: [],
      activeNoteId: null,
      activeDropdownId: null,
      draggedItemId: null,
      isLoading: false,
    });

    this.storageService = storageService;
    this.createId = options.createId ?? (() => crypto.randomUUID());
    this.now = options.now ?? (() => Date.now());
  }

  public async loadNotes(): Promise<void> {
    this.setState({ isLoading: true });

    try {
      const notes = await this.storageService.getNotes();
      this.setState({ notes: this.cloneNotes(notes), isLoading: false });
    } catch (error) {
      console.error('Failed to load notes:', error);
      this.setState({ isLoading: false });
    }
  }

  public async createNote(): Promise<Note> {
    const maxOrder = this.state.notes.length > 0
      ? Math.max(...this.state.notes.map(note => note.order ?? 0))
      : 0;

    const note: Note = {
      id: this.createId(),
      content: '',
      updatedAt: this.now(),
      pinned: false,
      locked: false,
      order: maxOrder + 1,
    };

    this.setState({
      notes: [note, ...this.state.notes],
      activeNoteId: note.id,
      activeDropdownId: null,
    });

    await this.storageService.saveNote(note);
    return note;
  }

  public async updateNoteContent(id: string, content: string): Promise<void> {
    const existing = this.findNote(id);
    if (!existing || existing.locked || existing.content === content) return;

    const updated: Note = {
      ...existing,
      content,
      updatedAt: this.now(),
    };

    this.replaceNote(updated);
    await this.storageService.saveNote(updated);
  }

  public selectNote(id: string | null): void {
    if (id !== null && !this.findNote(id)) return;
    this.setState({ activeNoteId: id, activeDropdownId: null });
  }

  public toggleDropdown(id: string): void {
    this.setState({ activeDropdownId: this.state.activeDropdownId === id ? null : id });
  }

  public closeDropdown(): void {
    if (this.state.activeDropdownId) {
      this.setState({ activeDropdownId: null });
    }
  }

  public setDraggedItem(id: string | null): void {
    this.setState({ draggedItemId: id });
  }

  public async deleteNote(id: string): Promise<void> {
    const notes = this.state.notes.filter(note => note.id !== id);
    const activeNoteId = this.state.activeNoteId === id
      ? (getSortedNotes(notes)[0]?.id ?? null)
      : this.state.activeNoteId;

    this.setState({ notes, activeNoteId, activeDropdownId: null });
    await this.storageService.deleteNote(id);
  }

  public async togglePin(id: string): Promise<void> {
    const note = this.findNote(id);
    if (!note) return;

    const updated: Note = { ...note, pinned: !note.pinned };
    this.replaceNote(updated);
    await this.storageService.saveNote(updated);
  }

  public async toggleLock(id: string): Promise<void> {
    const note = this.findNote(id);
    if (!note) return;

    const updated: Note = { ...note, locked: !note.locked };
    this.replaceNote(updated);
    await this.storageService.saveNote(updated);
  }

  public async reorderNotes(draggedId: string, targetId: string): Promise<void> {
    if (draggedId === targetId) return;

    const notes = [...this.state.notes];
    const draggedIndex = notes.findIndex(note => note.id === draggedId);
    const targetIndex = notes.findIndex(note => note.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedItem] = notes.splice(draggedIndex, 1);
    notes.splice(targetIndex, 0, draggedItem);

    const reorderedNotes = notes.map((note, index) => ({
      ...note,
      order: notes.length - index,
    }));

    this.setState({ notes: reorderedNotes, draggedItemId: null });
    await Promise.all(reorderedNotes.map(note => this.storageService.saveNote(note)));
  }

  public async importNotes(notes: Note[]): Promise<void> {
    const normalizedNotes = this.cloneNotes(notes);

    await this.storageService.clearAllNotes();
    await Promise.all(normalizedNotes.map(note => this.storageService.saveNote(note)));

    this.setState({
      notes: normalizedNotes,
      activeNoteId: getSortedNotes(normalizedNotes)[0]?.id ?? null,
      activeDropdownId: null,
      draggedItemId: null,
    });
  }

  public async clearAllNotes(): Promise<void> {
    await this.storageService.clearAllNotes();
    this.setState({ notes: [], activeNoteId: null, activeDropdownId: null, draggedItemId: null });
  }

  public async getPersistedNotes(): Promise<Note[]> {
    return this.storageService.getNotes();
  }

  private findNote(id: string): Note | undefined {
    return this.state.notes.find(note => note.id === id);
  }

  private replaceNote(updatedNote: Note): void {
    this.setState({
      notes: this.state.notes.map(note => note.id === updatedNote.id ? updatedNote : note),
    });
  }

  private cloneNotes(notes: Note[]): Note[] {
    return notes.map(note => ({ ...note }));
  }
}