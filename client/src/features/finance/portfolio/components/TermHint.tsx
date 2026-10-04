import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/shared/components/ui/tooltip';

interface Props {
  hint: string;
  children: ReactNode;
}

export function TermHint({ hint, children }: Props) {
  return (
    <span className="inline-flex items-center gap-1">
      {children}
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label="More info"
              className="text-muted-foreground"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-56 text-xs">{hint}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
}
