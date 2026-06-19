export abstract class Store<S extends object> {
  private _state: S;
  private listeners = new Set<(state: S) => void>();

  constructor(initialState: S) {
    this._state = { ...initialState };
  }

  public get state(): Readonly<S> {
    return this._state;
  }

  protected setState(update: Partial<S> | ((state: S) => Partial<S>)): void {
    const changes = typeof update === 'function' ? update(this._state) : update;
    this._state = Object.freeze({ ...this._state, ...changes });
    this.notify();
  }

  public subscribe(listener: (state: S) => void): () => void {
    this.listeners.add(listener);
    listener(this._state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this._state);
      } catch (err) {
        console.error('Error in store subscription listener:', err);
      }
    });
  }
}
