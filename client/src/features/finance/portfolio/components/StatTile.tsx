import { toneClass, type Tone } from '../lib/tone';

interface Props {
  label: string;
  value: string;
  tone?: Tone;
  hint?: string;
}

export function StatTile({ label, value, tone = 'neutral', hint }: Props) {
  return (
    <div className="p-3 border rounded-lg">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${toneClass[tone]}`}>
        {value}
      </p>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
}
