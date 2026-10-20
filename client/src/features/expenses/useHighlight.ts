import { useCallback, useEffect, useRef, useState } from 'react';

export type Highlight = { id: string; kind: 'added' | 'updated' } | null;
export type Flash = (id: string, kind: 'added' | 'updated') => void;

export const useHighlight = (durationMs = 10000) => {
  const [highlight, setHighlight] = useState<Highlight>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flash = useCallback(
    (id: string, kind: 'added' | 'updated') => {
      clearTimeout(timer.current);
      setHighlight({ id, kind });
      timer.current = setTimeout(() => setHighlight(null), durationMs);
    },
    [durationMs],
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  return { highlight, flash };
};
