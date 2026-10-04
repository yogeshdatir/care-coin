import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { useState } from 'react';

interface Props {
  onSubmit: (text: string) => void;
  onClear: () => void;
  hasSavedData: boolean;
  error?: string | null;
}

export function PasteInput({ onSubmit, onClear, hasSavedData, error }: Props) {
  const [text, setText] = useState('');
  return (
    <div className="space-y-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Copy your Excel table (with header row) and paste here"
        rows={8}
        className="font-mono text-xs"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => onSubmit(text)} disabled={!text.trim()}>
          Create chart
        </Button>
        {hasSavedData && (
          <>
            <Button
              variant="outline"
              onClick={() => {
                setText('');
                onClear();
              }}
            >
              Clear saved data
            </Button>
            <span className="text-muted-foreground text-xs">
              Showing data saved in this browser
            </span>
          </>
        )}
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
