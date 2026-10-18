import * as React from 'react';
import { format } from 'date-fns';

import { Button } from '@/shared/components/ui/button';
import { Calendar } from '@/shared/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import { cn } from '../lib/utils';

interface Props {
  id?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  isInvalid?: boolean; // Pass down error state
  errorId?: string; // Link to the error message element
}

export default function DatePickerSimple({
  id,
  value,
  onChange,
  isInvalid,
  errorId,
}: Props) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (onChange) onChange(selectedDate);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id={id}
          // ♿ Accessibility Attributes
          aria-invalid={isInvalid ? 'true' : undefined}
          aria-describedby={isInvalid ? errorId : undefined}
          className={cn(
            'justify-start w-[240px] font-normal',
            isInvalid &&
              'border-destructive text-destructive focus-visible:ring-destructive',
          )}
        >
          {value ? format(value, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-auto" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          defaultMonth={value}
        />
      </PopoverContent>
    </Popover>
  );
}
