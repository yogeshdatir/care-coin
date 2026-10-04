export type Tone = 'positive' | 'negative' | 'neutral';

export const toneOf = (n: number): Tone =>
  n > 0 ? 'positive' : n < 0 ? 'negative' : 'neutral';

export const toneClass: Record<Tone, string> = {
  positive: 'text-emerald-600 dark:text-emerald-400',
  negative: 'text-red-600 dark:text-red-400',
  neutral: '',
};
