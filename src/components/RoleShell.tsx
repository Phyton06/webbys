import type { ComponentChildren } from 'preact';
import { getDemoSessionRole, type DemoRole } from '../lib/demo-auth';
import { AssistantShell } from './AssistantShell';
import { AdminShell } from './AdminShell';

interface RoleShellProps {
  children: ComponentChildren;
  activeSection?: string;
}

export function RoleShell({ children, activeSection }: RoleShellProps) {
  let role: DemoRole = 'administrator';
  try {
    if (typeof window !== 'undefined') role = getDemoSessionRole(window.localStorage) ?? role;
  } catch {
    // The enclosing gate handles unavailable session storage.
  }
  if (role === 'assistant') return <AssistantShell activeSection={activeSection}>{children}</AssistantShell>;
  return <AdminShell activeSection={activeSection}>{children}</AdminShell>;
}
