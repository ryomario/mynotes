export function getTitle(content: string): string {
  const firstLine = content.split('\n')[0].trim();
  return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
}

import { t } from './i18n';

export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (seconds < 60) return t('time_just_now');
  if (minutes === 1) return t('time_a_minute_ago');
  if (minutes < 60) return t('time_minutes_ago', { count: String(minutes) });
  if (hours === 1) return t('time_an_hour_ago');
  if (hours < 24) return t('time_hours_ago', { count: String(hours) });
  if (days === 1) return t('time_yesterday');
  if (days < 30) return t('time_days_ago', { count: String(days) });
  if (months === 1) return t('time_a_month_ago');
  if (months < 12) return t('time_months_ago', { count: String(months) });
  if (years === 1) return t('time_a_year_ago');
  return t('time_years_ago', { count: String(years) });
}

import type { Note } from '../shared/types'

export function getSortedNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    const orderA = a.order ?? 0;
    const orderB = b.order ?? 0;
    if (orderA !== orderB) return orderB - orderA;

    return b.updatedAt - a.updatedAt;
  });
}
