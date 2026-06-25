import { t } from '../../../shared/services/i18n/i18n';

export interface ContextMenuItem {
  label: string;
  i18nKey?: string;
  iconHtml?: string;
  onClick: (event: MouseEvent) => void;
  disabled?: boolean;
  danger?: boolean;
}

export class ContextMenu {
  private static instance: ContextMenu | null = null;
  private menuEl: HTMLElement | null = null;

  private constructor() {
    this.initDOM();
    document.addEventListener('click', () => this.hide());
    document.addEventListener('contextmenu', () => this.hide());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.hide();
    });
  }

  public static getInstance(): ContextMenu {
    if (!ContextMenu.instance) {
      ContextMenu.instance = new ContextMenu();
    }
    return ContextMenu.instance;
  }

  private initDOM() {
    this.menuEl = document.createElement('div');
    this.menuEl.className = 'grid-empty-menu context-menu-floating';
    this.menuEl.style.display = 'none';
    this.menuEl.style.position = 'fixed';
    this.menuEl.addEventListener('click', (e) => e.stopPropagation());
    document.body.appendChild(this.menuEl);
  }

  public show(x: number, y: number, items: ContextMenuItem[]): void {
    if (!this.menuEl) return;
    this.menuEl.innerHTML = '';

    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = 'grid-empty-menu-item';
      if (item.danger) {
        btn.style.color = '#ef4444';
      }
      if (item.disabled) {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      }

      let inner = '';
      if (item.iconHtml) {
        inner += `<span style="display: inline-flex; align-items: center; margin-right: 8px;">${item.iconHtml}</span>`;
      }
      inner += `<span>${item.i18nKey ? t(item.i18nKey) : item.label}</span>`;
      btn.innerHTML = inner;

      btn.addEventListener('click', (e) => {
        this.hide();
        item.onClick(e);
      });
      this.menuEl?.appendChild(btn);
    });

    this.menuEl.style.left = `${x}px`;
    this.menuEl.style.top = `${y}px`;
    this.menuEl.style.display = 'block';

    // Adjust position if it overflows viewport
    requestAnimationFrame(() => {
      if (!this.menuEl) return;
      const rect = this.menuEl.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        this.menuEl.style.left = `${Math.max(0, x - rect.width)}px`;
      }
      if (rect.bottom > window.innerHeight) {
        this.menuEl.style.top = `${Math.max(0, y - rect.height)}px`;
      }
    });
  }

  public hide(): void {
    if (this.menuEl) {
      this.menuEl.style.display = 'none';
    }
  }
}
