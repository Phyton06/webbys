import {
  EMPLOYEE_INVITATION_STATUS,
  EMPLOYEE_ROLE,
  type BarberRecord,
  type EmployeeRecord,
} from '../types/agenda';

export function normalizeEmployees(
  employees: EmployeeRecord[] | undefined,
  barbers: BarberRecord[],
): EmployeeRecord[] {
  if (employees !== undefined) return employees;

  return barbers.map(({ id, name }) => ({
    id,
    name,
    phone: '',
    role: EMPLOYEE_ROLE.BARBER,
    active: true,
    invitationStatus: EMPLOYEE_INVITATION_STATUS.COMPLETED,
  }));
}

export function syncBarberProjection(
  employees: EmployeeRecord[],
  existingBarbers: BarberRecord[],
): BarberRecord[] {
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
  const projection = existingBarbers.map((barber) => ({
    ...barber,
    name: employeesById.get(barber.id)?.name ?? barber.name,
  }));
  const projectedIds = new Set(projection.map(({ id }) => id));

  for (const employee of employees) {
    if (employee.role === EMPLOYEE_ROLE.BARBER && !projectedIds.has(employee.id)) {
      projection.push({ id: employee.id, name: employee.name });
    }
  }

  return projection;
}

export function getBookableBarbers(
  employees: EmployeeRecord[] | undefined,
  barbers: BarberRecord[],
  includeBarberId?: string,
): BarberRecord[] {
  const allEmployees = normalizeEmployees(employees, barbers);
  const eligibleIds = new Set(
    allEmployees
      .filter((employee) => employee.active && employee.role === EMPLOYEE_ROLE.BARBER)
      .map(({ id }) => id),
  );
  if (includeBarberId && barbers.some(({ id }) => id === includeBarberId)) eligibleIds.add(includeBarberId);

  return syncBarberProjection(allEmployees, barbers).filter(({ id }) => eligibleIds.has(id));
}

export function canDeactivateEmployee(employeeId: string, employees: EmployeeRecord[]): boolean {
  const employee = employees.find(({ id }) => id === employeeId);
  if (!employee?.active) return false;
  if (employee.role !== EMPLOYEE_ROLE.ADMINISTRATOR) return true;

  const activeAdministrators = employees.filter((entry) => (
    entry.active && entry.role === EMPLOYEE_ROLE.ADMINISTRATOR
  ));
  return activeAdministrators.length > 1;
}
