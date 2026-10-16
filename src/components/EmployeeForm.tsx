import { useEffect, useRef, useState } from 'preact/hooks';
import { X } from 'lucide-preact';
import {
  EMPLOYEE_INVITATION_STATUS,
  EMPLOYEE_ROLE,
  type EmployeeInvitationStatus,
  type EmployeeRecord,
  type EmployeeRole,
} from '../types/agenda';
import type { DropdownOption } from './Dropdown';
import { Dropdown } from './Dropdown';
import { AppointmentRegistrationLink } from './AppointmentRegistrationLink';

interface EmployeeFormProps {
  employee?: EmployeeRecord;
  roleLocked?: boolean;
  onSave: (employee: EmployeeRecord) => boolean;
  onCancel: () => void;
}

const employeeRoleOptions: DropdownOption<EmployeeRole>[] = [
  { value: EMPLOYEE_ROLE.ADMINISTRATOR, label: 'Administrador' },
  { value: EMPLOYEE_ROLE.BARBER, label: 'Barbero' },
  { value: EMPLOYEE_ROLE.ASSISTANT, label: 'Asistente' },
];

const invitationStatusOptions: DropdownOption<EmployeeInvitationStatus>[] = [
  { value: EMPLOYEE_INVITATION_STATUS.PENDING, label: 'Pendiente' },
  { value: EMPLOYEE_INVITATION_STATUS.COMPLETED, label: 'Completado' },
];

export function EmployeeForm({ employee, roleLocked = false, onSave, onCancel }: EmployeeFormProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState(employee?.name ?? '');
  const [phone, setPhone] = useState(employee?.phone ?? '');
  const [role, setRole] = useState<EmployeeRole>(employee?.role ?? EMPLOYEE_ROLE.BARBER);
  const [invitationStatus, setInvitationStatus] = useState<EmployeeInvitationStatus>(
    employee?.invitationStatus ?? EMPLOYEE_INVITATION_STATUS.PENDING,
  );
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
    if (!normalizedName || !normalizedPhone) {
      setError('Escribe el nombre y el teléfono del empleado para continuar.');
      return;
    }

    const nextEmployee: EmployeeRecord = {
      id: employee?.id ?? `employee-${crypto.randomUUID()}`,
      name: normalizedName,
      phone: normalizedPhone,
      role,
      active: employee?.active ?? true,
      invitationStatus,
    };
    if (!onSave(nextEmployee)) {
      setError('No se pudo guardar el empleado. Revisa el almacenamiento e inténtalo de nuevo.');
      setAnnouncement('');
      return;
    }

    setError('');
    if (employee) setAnnouncement('Cambios del empleado guardados.');
    else setView('created');
  }

  return (
    <dialog
      class="appointment-modal"
      ref={dialogRef}
      aria-labelledby="employee-form-title"
      onCancel={(event) => { event.preventDefault(); onCancel(); }}
    >
      {view === 'created' ? (
        <section class="appointment-success-view employee-created-view">
          <header class="appointment-form-heading">
            <div>
              <h2 id="employee-form-title">Empleado agregado.</h2>
              <p>El registro se guardó en este dispositivo con el rol de {employeeRoleOptions.find((option) => option.value === role)?.label}.</p>
            </div>
            <button class="appointment-form-close" type="button" aria-label="Cerrar confirmación" onClick={onCancel}>
              <X size={16} aria-hidden="true" />
              <span>Cerrar</span>
            </button>
          </header>
          <p class="employee-registration-note">Este enlace es genérico y no completa el registro de la cuenta.</p>
          <AppointmentRegistrationLink />
        </section>
      ) : (
        <form class="appointment-form employee-form" onSubmit={handleSubmit}>
          <header class="appointment-form-heading">
            <div>
              <h2 id="employee-form-title">{employee ? 'Editar empleado' : 'Nuevo empleado'}</h2>
              <p>Guarda los datos de contacto y el rol del empleado.</p>
            </div>
            <button class="appointment-form-close" type="button" aria-label="Cerrar formulario de empleado" onClick={onCancel}>
              <X size={16} aria-hidden="true" />
              <span>Cerrar</span>
            </button>
          </header>
          <div class="appointment-form-fields">
            <label class="appointment-form-control">
              <span>Nombre del empleado</span>
              <input autoComplete="name" required value={name} onInput={(event) => setName((event.currentTarget as HTMLInputElement).value)} />
            </label>
            <label class="appointment-form-control">
              <span>Teléfono del empleado</span>
              <input type="tel" inputMode="tel" autoComplete="tel" required value={phone} onInput={(event) => setPhone((event.currentTarget as HTMLInputElement).value)} />
            </label>
            <label class="appointment-form-control">
              <span>Rol</span>
              {roleLocked ? (
                <div class="employee-role-locked">
                  <span>{employeeRoleOptions.find((option) => option.value === role)?.label}</span>
                  <span>El rol no se puede cambiar mientras sea el último administrador activo.</span>
                </div>
              ) : (
                <Dropdown label="Rol" value={role} options={employeeRoleOptions} onChange={setRole} />
              )}
            </label>
            {employee && (
              <label class="appointment-form-control">
                <span>Estado del registro</span>
                <Dropdown
                  label="Estado de registro"
                  value={invitationStatus}
                  options={invitationStatusOptions}
                  onChange={setInvitationStatus}
                />
              </label>
            )}
          </div>
          {!employee && <p class="employee-registration-note">Después de guardar, podrás compartir el enlace genérico de registro.</p>}
          {error && <p class="availability-error" role="alert">{error}</p>}
          {announcement && <p class="availability-announcement" role="status" aria-live="polite">{announcement}</p>}
          <div class="appointment-form-actions">
            <button class="availability-save-button" type="submit">{employee ? 'Guardar cambios' : 'Guardar empleado'}</button>
            <button class="appointment-form-cancel" type="button" onClick={onCancel}>Cancelar</button>
          </div>
        </form>
      )}
    </dialog>
  );
}
