import { ChevronDown } from 'lucide-preact';
import { useEffect, useRef, useState } from 'preact/hooks';

export interface DropdownOption<Value extends string> {
  label: string;
  value: Value;
}

interface DropdownProps<Value extends string> {
  label: string;
  value: Value;
  options: DropdownOption<Value>[];
  onChange: (value: Value) => void;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
}

export function Dropdown<Value extends string>({ label, value, options, onChange, ariaInvalid, ariaDescribedBy }: DropdownProps<Value>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex((option) => option.value === value)));
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];
  const listboxId = `dropdown-${label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    rootRef.current?.querySelector<HTMLElement>(`#${listboxId}-option-${activeIndex}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [open]);

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setOpen(true);
      setActiveIndex((index) => (index + direction + options.length) % options.length);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) {
        const option = options[activeIndex];
        if (option) onChange(option.value);
        setOpen(false);
      } else {
        setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)));
        setOpen(true);
      }
    }
  }

  return (
    <div class="dropdown" ref={rootRef}>
      <button
        class="dropdown-trigger"
        type="button"
        aria-label={`${label}: ${selected?.label ?? ''}`}
        aria-invalid={ariaInvalid ? 'true' : undefined}
        aria-describedby={ariaDescribedBy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open ? `${listboxId}-option-${activeIndex}` : undefined}
        onClick={() => {
          setActiveIndex(Math.max(0, options.findIndex((option) => option.value === value)));
          setOpen((current) => !current);
        }}
        onKeyDown={handleKeyDown}
      >
        <span>{selected?.label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <ul class="dropdown-menu" id={listboxId} role="listbox" aria-label={label}>
          {options.map((option, index) => (
            <li
              class={`dropdown-option${option.value === value ? ' is-selected' : ''}${index === activeIndex ? ' is-active' : ''}`}
              role="option"
              id={`${listboxId}-option-${index}`}
              aria-selected={option.value === value}
              key={option.value}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
