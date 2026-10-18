import { useState } from 'preact/hooks';
import { PROMOTION_TARGET_KIND, type PromotionTarget } from '../types/agenda';
import type { CurrencyCode } from '../types/business-settings';
import { formatCurrency } from '../services/currency';
import '../styles/client-combobox.css';

interface PromotionTargetComboboxProps {
  label: string;
  targets: PromotionTarget[];
  selectedKeys: string[];
  currency: CurrencyCode;
  onSelect: (target: PromotionTarget) => void;
  highlightFirstResult?: boolean;
}

function targetKindLabel(target: PromotionTarget): string {
  const kind = target.kind === PROMOTION_TARGET_KIND.PRODUCT ? 'Producto' : 'Servicio';
  return `${kind}: ${target.name}`;
}

export function PromotionTargetCombobox({ label, targets, selectedKeys, currency, onSelect, highlightFirstResult = false }: PromotionTargetComboboxProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = 'promotion-target-options';
  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const selected = new Set(selectedKeys);
  const results = targets.filter((target) => {
    const key = `${target.kind}:${target.id}`;
    return !selected.has(key) && target.name.toLocaleLowerCase('es').includes(normalizedQuery);
  });
  const activeTarget = results[activeIndex];

  function chooseTarget(target: PromotionTarget) {
    onSelect(target);
    setQuery('');
    setActiveIndex(-1);
    setIsOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => current < 0 ? 0 : Math.min(current + 1, Math.max(0, results.length - 1)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => results.length === 0 ? -1 : current <= 0 ? results.length - 1 : current - 1);
    } else if (event.key === 'Enter' && isOpen && activeTarget) {
      event.preventDefault();
      chooseTarget(activeTarget);
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
      setActiveIndex(-1);
    }
  }

  return (
    <div class="client-combobox promotion-target-combobox">
      <input
        type="search"
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen && activeTarget ? `${listboxId}-${activeIndex}` : undefined}
        autoComplete="off"
        placeholder="Buscar por nombre"
        value={query}
        onFocus={() => { setIsOpen(true); setActiveIndex(highlightFirstResult && results.length ? 0 : -1); }}
        onInput={(event) => {
          const nextQuery = event.currentTarget.value;
          const nextResults = targets.filter((target) => (
            !selected.has(`${target.kind}:${target.id}`)
            && target.name.toLocaleLowerCase('es').includes(nextQuery.trim().toLocaleLowerCase('es'))
          ));
          setQuery(nextQuery);
          setIsOpen(true);
          setActiveIndex(highlightFirstResult && nextResults.length ? 0 : -1);
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => { setIsOpen(false); setQuery(''); setActiveIndex(-1); }}
      />
      {isOpen && (
        <ul class="client-combobox-options" id={listboxId} role="listbox" aria-label={label.replace(/^Buscar /, 'Resultados de ')}>
          {results.map((target, index) => (
            <li
              id={`${listboxId}-${index}`}
              class={`client-combobox-option promotion-target-option${index === activeIndex ? ' is-active' : ''}`}
              role="option"
              aria-label={`${targetKindLabel(target)} · ${formatCurrency(target.price, currency)}`}
              aria-selected="false"
              key={`${target.kind}:${target.id}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => chooseTarget(target)}
            >
              <span>{targetKindLabel(target)}</span>
              <strong>{formatCurrency(target.price, currency)}</strong>
            </li>
          ))}
          {results.length === 0 && <li class="client-combobox-empty">No hay coincidencias disponibles.</li>}
        </ul>
      )}
    </div>
  );
}
