import { useState } from 'preact/hooks';
import type { ClientRecord } from '../types/agenda';
import '../styles/client-combobox.css';

interface ClientComboboxProps {
  clients: ClientRecord[];
  selectedClientId: string;
  includeInactiveClientId?: string;
  onSelect: (clientId: string) => void;
}

function clientOptionLabel(client: ClientRecord): string {
  return client.phone ? `${client.name} · ${client.phone}` : client.name;
}

export function ClientCombobox({ clients, selectedClientId, includeInactiveClientId, onSelect }: ClientComboboxProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const selectableClients = clients.filter(({ id, active }) => active !== false || id === includeInactiveClientId);
  const selectedClient = selectableClients.find(({ id }) => id === selectedClientId);
  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const filteredClients = selectableClients.filter(({ name, phone, email }) => (
    !normalizedQuery
    || name.toLocaleLowerCase('es').includes(normalizedQuery)
    || phone?.toLocaleLowerCase('es').includes(normalizedQuery)
    || email?.toLocaleLowerCase('es').includes(normalizedQuery)
  ));
  const activeClient = filteredClients[activeIndex];

  function selectClient(client: ClientRecord) {
    onSelect(client.id);
    setQuery('');
    setIsOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => current < 0
        ? 0
        : Math.min(current + 1, Math.max(0, filteredClients.length - 1)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => filteredClients.length === 0
        ? -1
        : current <= 0 ? filteredClients.length - 1 : current - 1);
    } else if (event.key === 'Enter' && isOpen && activeClient) {
      event.preventDefault();
      selectClient(activeClient);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
    }
  }

  return (
    <div class="client-combobox">
      <label class="appointment-form-control" for="appointment-client-search">
        <span>Cliente</span>
        <input
          id="appointment-client-search"
          type="search"
          role="combobox"
          aria-label="Cliente"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="appointment-client-options"
          aria-activedescendant={isOpen && activeClient ? `appointment-client-option-${activeClient.id}` : undefined}
          autoComplete="off"
          placeholder="Buscar por nombre o teléfono"
          value={isOpen ? query : selectedClient?.name ?? ''}
          onFocus={() => {
            setQuery('');
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onInput={(event) => {
            const value = (event.currentTarget as HTMLInputElement).value;
            setQuery(value);
            setIsOpen(true);
            setActiveIndex(-1);
            if (value.trim().toLocaleLowerCase('es') !== selectedClient?.name.toLocaleLowerCase('es')) onSelect('');
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            setIsOpen(false);
            setQuery('');
          }}
        />
      </label>
      {isOpen && (
        <ul class="client-combobox-options" id="appointment-client-options" role="listbox" aria-label="Clientes encontrados">
          {filteredClients.map((client, index) => (
            <li
              id={`appointment-client-option-${client.id}`}
              class={`client-combobox-option${index === activeIndex ? ' is-active' : ''}`}
              role="option"
              aria-selected={client.id === selectedClientId}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectClient(client)}
              key={client.id}
            >
              {clientOptionLabel(client)}
            </li>
          ))}
        </ul>
      )}
      {isOpen && filteredClients.length === 0 && (
        <p class="client-combobox-empty" role="status" aria-live="polite">No hay clientes que coincidan.</p>
      )}
    </div>
  );
}
