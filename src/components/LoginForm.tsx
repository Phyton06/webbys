import { useState } from 'preact/hooks';
import { Eye, EyeOff } from 'lucide-preact';
import { startDemoSession } from '../lib/demo-auth';
import { sitePath } from '../lib/site-path';

interface LoginFormProps {
  onAuthenticated?: () => void;
}

export function LoginForm({ onAuthenticated }: LoginFormProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  function showProviderNotice(provider: 'Google' | 'Facebook') {
    setMessage(`${provider} estará disponible próximamente.`);
  }

  function beginSession() {
    try {
      startDemoSession(window.localStorage);
      setIsSubmitting(true);
      setMessage('Iniciando sesión…');

      window.setTimeout(() => {
        if (onAuthenticated) {
          onAuthenticated();
        } else {
          window.location.assign(sitePath('/admin/'));
        }
      }, 220);
    } catch {
      setIsSubmitting(false);
      setMessage('No se pudo iniciar sesión. Revisa el almacenamiento del navegador e inténtalo de nuevo.');
    }
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setMessage('');
    beginSession();
  }

  return (
    <main class="login-page">
      <div class="login-frame">
        <aside class="login-story" aria-label="Vista previa de la agenda">
          <h2>Un buen día<br />empieza con<br /><span>una buena agenda.</span></h2>
          <p class="story-copy">El ritmo del negocio, claro desde el primer vistazo.</p>
          <div class="story-preview" aria-hidden="true">
            <div class="story-preview-header">
              <span>AGENDA · HOY</span>
              <span>DISPONIBLE</span>
            </div>
            <div class="story-slot">
              <time>09:30</time>
              <span class="slot-rule" />
              <span class="slot-text">Corte · 45 min</span>
            </div>
            <div class="story-slot story-slot-active">
              <time>10:30</time>
              <span class="slot-rule" />
              <span class="slot-text">Barba · 30 min</span>
            </div>
            <div class="story-slot">
              <time>11:15</time>
              <span class="slot-rule" />
              <span class="slot-text">Corte + barba · 60 min</span>
            </div>
          </div>
        </aside>

        <section class="login-content" aria-labelledby="login-title">
          <a class="wordmark" href={sitePath('/')} aria-label="Webby's Barbershop, inicio">
            <img class="wordmark-logo" src={sitePath('/logo.jpeg')} alt="Webby's Barbershop" />
            <span>Webby's Barbershop</span>
          </a>

          <div class="login-heading">
            <h1 id="login-title">Qué bueno verte.</h1>
            <p class="login-subtitle">Acceso de administrador a Webby's Barbershop.</p>
          </div>

          <form class="login-form" noValidate onSubmit={handleSubmit}>
            <div class="field-group">
              <label for="email">Correo electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="nombre@correo.com"
              />
            </div>

            <div class="field-group">
              <label for="password">Contraseña</label>
              <div class="password-field">
                <input
                  id="password"
                  name="password"
                  type={passwordVisible ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                />
                <button
                  class="visibility-button"
                  type="button"
                  aria-label={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={passwordVisible}
                  onClick={() => setPasswordVisible((visible) => !visible)}
                >
                  {passwordVisible ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div class="form-meta">
              <span class="form-meta-note">Acceso seguro a tu panel</span>
              <a
                href="#recuperacion"
                onClick={(event) => {
                  event.preventDefault();
                  setMessage('Comunícate con el administrador para recuperar tu contraseña.');
                }}
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button class="submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Iniciando…' : 'Iniciar sesión'}
            </button>
          </form>

          <div class="separator" aria-hidden="true"><span>O CONTINÚA CON</span></div>
          <div class="provider-actions" aria-label="Otras opciones de acceso">
            <button class="provider-button" type="button" onClick={() => showProviderNotice('Google')}>
              <span class="provider-mark google-mark" aria-hidden="true">G</span>
              Continuar con Google
            </button>
            <button class="provider-button" type="button" onClick={() => showProviderNotice('Facebook')}>
              <span class="provider-mark facebook-mark" aria-hidden="true">f</span>
              Continuar con Facebook
            </button>
          </div>

          <p class="status-message" role="status" aria-live="polite">{message}</p>
        </section>

        <footer class="login-footer">
          <span>Webby's Barbershop</span>
          <span>Tu espacio, tu ritmo.</span>
        </footer>
      </div>
    </main>
  );
}
