import { useEffect, useRef, useState } from 'preact/hooks';
import { X } from 'lucide-preact';
import type { ClientRecord } from '../types/agenda';
import { AppointmentRegistrationLink } from './AppointmentRegistrationLink';

interface ClientFormProps {
  client?: ClientRecord;
  onSave: (client: ClientRecord) => boolean;
  onCancel: () => void;
}

export function ClientForm({ client, onSave, onCancel }: ClientFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(client?.name ?? '');
  const [phone, setPhone] = useState(client?.phone ?? '');
  const [email, setEmail] = useState(client?.email ?? '');
  const [view, setView] = useState<'form' | 'created'>('form');
  const [error, setError] = useState('');
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    return () => {
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
    };
  }, []);

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const normalizedName = name.trim();
    const normalizedPhone = phone.trim();
    const normalizedEmail = email.trim();
    if (!normalizedName || !normalizedPhone) {
      setError('Escribe el nombre y el teléfono del cliente para continuar.');
      return;
    }

    const nextClient: ClientRecord = {
      id: client?.id ?? `client-${crypto.randomUUID()}`,
      name: normalizedName,
      phone: normalizedPhone,
      email: normalizedEmail || undefined,
      active: client?.active ?? true,
    };
    if (!onSave(nextClient)) {
      setError('No se pudo guardar el cliente. Revisa el almacenamiento e inténtalo de nuevo.');
      setAnnouncement('');
      return;
    }

    setError('');
    if (client) setAnnouncement('Cambios del cliente guardados.');
    else setView('created');
  }

  return (
    <dialog
      class="appointment-modal"
      ref={dialogRef}
      aria-labelledby="client-form-title"
      onCancel={(event) => { event.preventDefault(); onCancel(); }}
    >
      {view === 'created' ? (
        <section class="appointment-success-view">
          <header class="appointment-form-heading">
            <div>
              <h2 id="client-form-title">Cliente agregado.</h2>
              <p>El registro se guardó en este dispositivo.</p>
            </div>
            <button class="appointment-form-close" type="button" aria-label="Cerrar confirmación" onClick={onCancel}>
              <X size={16} aria-hidden="true" />
              <span>Cerrar</span>
            </button>
          </header>
          <AppointmentRegistrationLink />
        </section>
      ) : (
        <form class="appointment-form" onSubmit={handleSubmit}>
          <header class="appointment-form-heading">
            <div>
              <h2 id="client-form-title">{client ? 'Editar cliente' : 'Nuevo cliente'}</h2>
              <p>Guarda los datos de contacto del cliente.</p>
            </div>
            <button class="appointment-form-close" type="button" aria-label="Cerrar formulario de cliente" onClick={onCancel}>
              <X size={16} aria-hidden="true" />
              <span>Cerrar</span>
            </button>
          </header>
          <div class="client-form-fields">
            <label class="appointment-form-control">
              <span>Nombre del cliente</span>
              <input autoComplete="name" required value={name} onInput={(event) => setName((event.currentTarget as HTMLInputElement).value)} />
            </label>
            <label class="appointment-form-control">
              <span>Teléfono del cliente</span>
              <input type="tel" inputMode="tel" autoComplete="tel" required value={phone} onInput={(event) => setPhone((event.currentTarget as HTMLInputElement).value)} />
            </label>
            {client && (
              <label class="appointment-form-control">
                <span>Correo electrónico (opcional)</span>
                <input type="email" autoComplete="email" value={email} onInput={(event) => setEmail((event.currentTarget as HTMLInputElement).value)} />
              </label>
            )}
          </div>
          {error && <p class="availability-error" role="alert">{error}</p>}
          {announcement && <p class="availability-announcement" role="status" aria-live="polite">{announcement}</p>}
          <div class="client-form-actions">
            <button class="availability-save-button" type="submit">{client ? 'Guardar cambios' : 'Guardar cliente'}</button>
            <button class="appointment-form-cancel" type="button" onClick={onCancel}>Cancelar</button>
          </div>
        </form>
      )}
    </dialog>
  );
}
