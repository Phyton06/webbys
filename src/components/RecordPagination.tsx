import { ChevronLeft, ChevronRight } from 'lucide-preact';
import '../styles/record-pagination.css';

export const RECORD_PAGE_SIZE = 5;

export function pageRecords<T>(records: T[], page: number): T[] {
  return records.slice(page * RECORD_PAGE_SIZE, (page + 1) * RECORD_PAGE_SIZE);
}

export function RecordPagination({
  page,
  pageCount,
  label,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  label: string;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav class="record-pagination" aria-label={label}>
      <button type="button" aria-label="Página anterior" disabled={page === 0} onClick={() => onPageChange(Math.max(0, page - 1))}>
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <span aria-live="polite">Página {page + 1} de {pageCount}</span>
      <button type="button" aria-label="Página siguiente" disabled={page >= pageCount - 1} onClick={() => onPageChange(Math.min(pageCount - 1, page + 1))}>
        <ChevronRight size={18} aria-hidden="true" />
      </button>
    </nav>
  );
}
