import { useState } from 'preact/hooks';

export function AppointmentRegistrationLink() {
  const [copyMessage, setCopyMessage] = useState('');
  const link = typeof window === 'undefined'
    ? '/registro'
    : new URL('/registro', window.location.origin).toString();

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopyMessage('Enlace copiado.');
    } catch {
      const input = document.getElementById('appointment-registration-link');
      if (input instanceof HTMLInputElement) {
        input.focus();
        input.select();
      }
      setCopyMessage('Selecciona y copia el enlace.');
    }
  }

  return (
    <div class="appointment-registration-link">
      <label class="appointment-form-control" for="appointment-registration-link">
        <span>Enlace de registro genérico</span>
        <input
          id="appointment-registration-link"
          aria-label="Enlace de registro genérico"
          readOnly
          value={link}
          onFocus={(event) => (event.currentTarget as HTMLInputElement).select()}
        />
      </label>
      <button class="availability-save-button" type="button" onClick={copyLink}>Copiar enlace</button>
      {copyMessage && <p class="availability-announcement" role="status" aria-live="polite">{copyMessage}</p>}
    </div>
  );
}
