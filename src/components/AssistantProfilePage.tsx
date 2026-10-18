import { AdminGate } from './AdminGate';
import { AssistantShell } from './AssistantShell';

export function AssistantProfilePage() {
  return (
    <AdminGate role="assistant">
      <AssistantShell activeSection="Perfil">
        <section class="assistant-profile-page" aria-labelledby="assistant-profile-title">
          <header class="assistant-heading">
            <h1 id="assistant-profile-title">Perfil</h1>
            <p>Información de la sesión de demostración.</p>
          </header>
          <dl class="assistant-profile-details">
            <div><dt>Perfil</dt><dd>Asistente</dd></div>
            <div><dt>Acceso</dt><dd>Demostración local</dd></div>
          </dl>
          <p class="assistant-profile-note">Esta sesión no usa autenticación real y sus datos no se sincronizan entre dispositivos.</p>
        </section>
      </AssistantShell>
    </AdminGate>
  );
}
