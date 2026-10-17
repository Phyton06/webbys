import { useState } from 'preact/hooks';
import type { NotificationRecipient } from '../types/notifications';
import '../styles/client-combobox.css';

interface NotificationRecipientPickerProps {
  recipients: NotificationRecipient[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase('es').normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

export function NotificationRecipientPicker({ recipients, selectedIds, onToggle }: NotificationRecipientPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = 'notification-recipient-options';
  const selectedSet = new Set(selectedIds);
  const normalizedQuery = normalize(query);
  const results = recipients.filter(({ id, name }) => !selectedSet.has(id)
    && (!normalizedQuery || normalize(name).includes(normalizedQuery)));
  const activeRecipient = results[activeIndex];

  function select(recipient: NotificationRecipient) {
    onToggle(recipient.id);
    setQuery('');
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => current < 0 ? 0 : Math.min(current + 1, Math.max(results.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => results.length === 0 ? -1 : current <= 0 ? results.length - 1 : current - 1);
    } else if (event.key === 'Enter' && open && activeRecipient) {
      event.preventDefault();
      select(activeRecipient);
    } else if (event.key === 'Escape') {
      setOpen(false);
      setQuery('');
      setActiveIndex(-1);
    }
  }

  return (
    <div class="notification-recipient-picker">
      <div class="client-combobox">
        <input
          type="search"
          role="combobox"
          aria-label="Buscar destinatarios"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open && activeRecipient ? `${listboxId}-${activeIndex}` : undefined}
          placeholder="Buscar por nombre"
          autoComplete="off"
          value={query}
          onFocus={() => { setOpen(true); setActiveIndex(-1); }}
          onInput={(event) => { setQuery(event.currentTarget.value); setOpen(true); setActiveIndex(-1); }}
          onKeyDown={handleKeyDown}
          onBlur={() => { setOpen(false); setQuery(''); setActiveIndex(-1); }}
        />
        {open && (
          <ul class="client-combobox-options" id={listboxId} role="listbox" aria-label="Resultados de destinatarios">
            {results.map((recipient, index) => (
              <li
                id={`${listboxId}-${index}`}
                class={`client-combobox-option${index === activeIndex ? ' is-active' : ''}`}
                role="option"
                aria-label={recipient.name}
                aria-selected="false"
                key={recipient.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(recipient)}
              >
                {recipient.name}
              </li>
            ))}
            {results.length === 0 && <li class="client-combobox-empty">No hay destinatarios coincidentes.</li>}
          </ul>
        )}
      </div>
      {selectedIds.length > 0 && (
        <ul class="notification-recipient-selected" aria-label="Destinatarios seleccionados">
          {recipients.filter(({ id }) => selectedSet.has(id)).map((recipient) => (
            <li key={recipient.id}>
              <span>{recipient.name}</span>
              <button type="button" aria-label={`Quitar ${recipient.name}`} onClick={() => onToggle(recipient.id)}>Quitar</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
