import { ChevronLeft } from 'lucide-preact';
import '../styles/back-link.css';

interface BackLinkProps {
  label: string;
  onClick?: () => void;
  href?: string;
  ariaLabel?: string;
}

export function BackLink({ label, onClick, href, ariaLabel }: BackLinkProps) {
  const accessibleLabel = ariaLabel ?? `Volver a ${label}`;
  const content = (
    <>
      <ChevronLeft size={18} aria-hidden="true" />
      <span>{label}</span>
    </>
  );

  if (href) {
    return (
      <a class="view-back-link" href={href} aria-label={accessibleLabel}>
        {content}
      </a>
    );
  }

  return (
    <button class="view-back-link" type="button" aria-label={accessibleLabel} onClick={onClick}>
      {content}
    </button>
  );
}
