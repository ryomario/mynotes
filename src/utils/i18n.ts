export type Language = 'en' | 'id';

export const availableLanguages: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'id', label: 'Bahasa Indonesia' },
];

import enJson from '../langs/en.json';
import idJson from '../langs/id.json';

const enTranslations = enJson as Record<string, string>;
const idTranslations = idJson as Record<string, string>;

type TranslationsMap = Record<string, Record<Language, string>>;

const translations: TranslationsMap = {};

for (const key in enTranslations) {
  if (Object.prototype.hasOwnProperty.call(enTranslations, key)) {
    translations[key] = {
      en: enTranslations[key],
      id: idTranslations[key],
    };
  }
}

export function getCurrentLanguage(): Language {
  try {
    const settings = JSON.parse(localStorage.getItem('mynotes_settings') || '{}');
    if (settings.language === 'id' || settings.language === 'en') {
      return settings.language;
    }
  } catch (e) {
    // Ignore error
  }

  // Fallback to browser preference
  if (navigator.language.startsWith('id')) {
    return 'id';
  }
  return 'en';
}

export function saveLanguageSetting(lang: Language): void {
  try {
    const settings = JSON.parse(localStorage.getItem('mynotes_settings') || '{}');
    settings.language = lang;
    localStorage.setItem('mynotes_settings', JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save language setting', e);
  }
}

export function t(key: string, replacements?: Record<string, string>): string {
  const lang = getCurrentLanguage();
  const entry = translations[key];
  if (!entry) {
    return key;
  }
  let text = entry[lang] || entry['en'] || key;
  if (replacements) {
    Object.entries(replacements).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    });
  }
  return text;
}

export function translateDOM(): void {
  // 1. Text elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  // 2. Placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      (el as HTMLInputElement | HTMLTextAreaElement).placeholder = t(key);
    }
  });

  // 3. Titles (tooltips)
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      (el as HTMLElement).title = t(key);
    }
  });

  // 4. Update document title if applicable
  const currentTitleKey = document.title.includes('Bookmarks') ? 'bookmarks_page_title' : 'app_title';
  document.title = t(currentTitleKey);
}

export function createLanguageSelectorComponent(): HTMLElement {
  const currentLang = getCurrentLanguage();

  const container = document.createElement('div');
  container.className = 'setting-item language-selector-item';

  const label = document.createElement('span');
  label.setAttribute('data-i18n', 'language_setting_label');
  label.textContent = t('language_setting_label');

  const select = document.createElement('select');
  select.id = 'language-setting-select';

  for (const lang of availableLanguages) {
    const option = document.createElement('option');
    option.value = lang.code;
    option.textContent = lang.label;
    option.selected = currentLang === lang.code;
    select.appendChild(option);
  }

  container.appendChild(label);
  container.appendChild(select);

  select.addEventListener('change', () => {
    const selectedLang = select.value as Language;
    saveLanguageSetting(selectedLang);
    window.location.reload();
  });

  return container;
}
