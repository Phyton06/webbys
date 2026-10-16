# Desarrollo de PWA para barbería — Panel de administración

## 1. Objetivo del proyecto

Desarrollaremos una **Progressive Web App (PWA) mobile-first para la gestión integral de una barbería**, utilizando Astro como tecnología principal.

En esta primera etapa nos enfocaremos exclusivamente en el **frontend del perfil de administrador**. No desarrolles un backend ni implementes servicios reales de autenticación, base de datos o envío de notificaciones. Sin embargo, prepara una arquitectura limpia que permita integrar posteriormente una API y un backend sin tener que rehacer la interfaz.

La aplicación debe ofrecer una experiencia comparable a la de una aplicación móvil comercial moderna: rápida, intuitiva, visualmente atractiva y diseñada principalmente para utilizarse desde un teléfono celular.

**Utiliza obligatoriamente la skill `impeccable` para definir y aplicar la dirección visual, los patrones de interfaz y los criterios de calidad del diseño.** Consulta sus instrucciones antes de comenzar y aplícalas durante todo el desarrollo.

## 2. Tecnologías y restricciones

- **Astro:** framework principal.
- **TypeScript:** tipado estricto y código mantenible.
- **PWA:** instalación en dispositivos compatibles, manifest, iconos y configuración de service worker cuando corresponda.
- **Frontend exclusivamente:** no crear backend, endpoints reales ni bases de datos.
- Utiliza componentes reutilizables, una estructura de carpetas clara y separación de responsabilidades.
- Selecciona una solución adecuada para los componentes interactivos y el estado de la aplicación.
- Los formularios, botones, filtros, modales, menús y acciones CRUD deben funcionar en el frontend.
- Utiliza datos de demostración realistas y persistencia local cuando resulte útil para que la aplicación sea navegable y comprobable sin backend.
- Centraliza los datos de demostración y crea una capa de servicios simulados que posteriormente pueda sustituirse por peticiones HTTP.
- Evita dependencias innecesarias y componentes excesivamente complejos.

No conviertas toda la aplicación en una SPA sin necesidad. Aprovecha Astro y utiliza componentes interactivos donde realmente se requieran.

## 3. Dirección visual y experiencia de usuario

El diseño debe sentirse como un producto SaaS premium especializado en barberías, no como una plantilla administrativa genérica.

### Paleta de colores

- Negro y tonos carbón como colores principales.
- Rojo intenso como color de acento para acciones principales, indicadores y elementos destacados.
- Blanco y grises neutros para textos, superficies y elementos secundarios.
- Utiliza el rojo de forma estratégica, evitando saturar toda la interfaz.

Define los colores mediante variables o tokens de diseño para mantener la consistencia.

### Estilo visual

- Diseño mobile-first real, no una interfaz de escritorio reducida.
- Apariencia moderna, elegante, profesional y relacionada con el mundo de la barbería.
- Tipografía legible, jerarquía visual clara y buen uso del espacio.
- Tarjetas con información concisa, bordes sutiles y profundidad visual moderada.
- Iconografía consistente mediante una librería apropiada.
- Microinteracciones, transiciones y estados de interacción cuidadosamente diseñados.
- Estados vacíos, errores, confirmaciones, carga y formularios de validación.
- Contraste suficiente, áreas táctiles cómodas y accesibilidad.
- Gráficas legibles en pantallas pequeñas.
- Formularios y calendarios adaptados a dispositivos táctiles.

Evita los diseños genéricos generados automáticamente: exceso de tarjetas, gradientes innecesarios, efectos de vidrio sin propósito, sombras exageradas, emojis utilizados como iconos y componentes que no aporten valor.

### Navegación móvil

Diseña una navegación apropiada para una aplicación móvil, con una barra inferior para las secciones principales y acceso a las opciones secundarias mediante un menú o panel contextual.

La navegación debe permanecer consistente en todas las pantallas autenticadas.

En pantallas más grandes, adapta la navegación sin perder la identidad visual ni la funcionalidad.

## 4. Alcance: perfil de administrador

La aplicación debe representar exclusivamente la experiencia del administrador.

El administrador tendrá acceso a los siguientes módulos:

1. Inicio y resumen del negocio.
2. Agenda y citas.
3. Clientes.
4. Empleados.
5. Servicios.
6. Productos.
7. Promociones.
8. Ventas.
9. Analíticas.
10. Notificaciones.
11. Configuración del negocio y del perfil.

No es necesario desarrollar los paneles independientes de clientes, barberos o asistentes en esta etapa.

## 5. Autenticación y acceso

Diseña una pantalla de inicio de sesión moderna con:

- Inicio de sesión mediante correo electrónico y contraseña.
- Opción para continuar con Google.
- Opción para continuar con Facebook.
- Mostrar u ocultar contraseña.
- Validación de campos.
- Mensajes de error y estados de carga.
- Opción para recuperar contraseña.
- Enlace a términos y privacidad, si corresponde.

Las opciones de Google y Facebook deben contar con sus respectivos botones e identidad visual, pero en esta etapa solo deben simular el flujo de autenticación.

Incluye una ruta o mecanismo de demostración para entrar al panel administrativo sin necesitar credenciales reales.

La interfaz debe dejar clara la diferencia entre una simulación de frontend y una autenticación real pendiente de integración.

## 6. Panel principal

Construye un dashboard que permita conocer rápidamente el estado del negocio.

Incluye indicadores como:

- Ventas del día.
- Ventas del mes.
- Número de citas del día.
- Citas pendientes.
- Citas completadas y canceladas.
- Clientes registrados.
- Servicios más vendidos.
- Productos más vendidos.
- Rendimiento de los barberos.
- Promociones activas y resultados generales.

Añade gráficas para comparar ventas por día, semana o mes, así como una sección de próximas citas y actividad reciente.

Permite cambiar el periodo de consulta y utiliza datos de demostración coherentes entre los indicadores, las gráficas y las tablas.

En dispositivos móviles, prioriza los indicadores más importantes y evita comprimir demasiada información en una sola pantalla.

## 7. Gestión de clientes

Implementa un módulo CRUD completo para clientes:

- Listar clientes.
- Buscar por nombre, teléfono o correo.
- Filtrar y ordenar resultados.
- Consultar el perfil y el historial de citas.
- Consultar el historial de compras cuando existan ventas registradas.
- Editar información.
- Desactivar o eliminar registros con confirmación, según corresponda.

### Registro de clientes mediante invitación

El administrador debe poder registrar inicialmente a un cliente proporcionando únicamente:

- Nombre.
- Número de teléfono.

Al crear el registro, genera una URL de invitación única de demostración para ese cliente.

La interfaz debe permitir:

- Copiar la URL al portapapeles.
- Compartirla mediante las opciones nativas del dispositivo cuando estén disponibles.
- Consultar el estado de la invitación.
- Distinguir entre invitaciones pendientes y registros completados.
- Simular la expiración o regeneración de una invitación.

El cliente utilizará esa URL para completar su registro en una pantalla independiente del flujo administrativo, proporcionando su correo electrónico, contraseña y los demás datos del perfil que se definan.

Aunque el backend no se desarrollará ahora, prepara la estructura de rutas y los estados necesarios para representar este proceso de principio a fin.

No utilices un enlace estático compartido para todos los clientes. Cada invitación debe tener un identificador o token simulado diferente.

## 8. Gestión de empleados y roles

Implementa un CRUD completo de empleados.

Los roles disponibles son:

- Administrador.
- Barbero.
- Asistente.

Permite:

- Crear empleados.
- Asignar y modificar roles.
- Editar datos personales y de contacto.
- Activar o desactivar cuentas.
- Consultar información del empleado.
- Consultar su agenda y disponibilidad cuando corresponda.

### Invitación de empleados

El proceso debe ser similar al registro de clientes, pero el administrador debe asignar el rol antes de generar la invitación.

El empleado recibirá un enlace único para completar sus datos de acceso y su perfil.

Muestra claramente el rol asignado, el estado de la invitación y si el registro se ha completado.

La interfaz no debe permitir que el administrador se elimine accidentalmente a sí mismo si eso pudiera dejar al negocio sin acceso administrativo.

## 9. Agenda y gestión de citas

Este es uno de los módulos prioritarios del proyecto.

Desarrolla un sistema de agenda que permita administrar las citas de todos los barberos desde una sola interfaz.

### Visualización de la agenda

Incluye:

- Vista diaria.
- Vista semanal.
- Selección de fecha.
- Filtro por barbero.
- Vista conjunta de todos los barberos.
- Diferenciación visual por estado de cita.
- Indicadores de horarios disponibles y ocupados.
- Acceso al detalle de cada cita.

En móviles, prioriza una agenda táctil, fácil de recorrer y sin depender de tablas demasiado anchas.

### Gestión de horarios laborales

Cada barbero debe tener una configuración individual de disponibilidad:

- Días de trabajo.
- Hora de inicio y finalización de cada jornada.
- Pausas y descansos.
- Días libres.
- Excepciones de disponibilidad para fechas específicas.

La agenda debe respetar estrictamente esta configuración.

**No debe ser posible crear una cita fuera del horario laboral de un barbero**, en un día en el que no trabaja, durante sus descansos ni cuando ya tenga otra cita que se solape.

### Creación y administración de citas

El administrador debe poder:

- Crear citas manualmente.
- Seleccionar cliente.
- Seleccionar barbero.
- Seleccionar uno o varios servicios cuando corresponda.
- Calcular la duración total según la duración configurada de los servicios.
- Mostrar los horarios disponibles para el día seleccionado.
- Consultar el precio estimado.
- Añadir notas.
- Reprogramar citas.
- Cancelar citas.
- Cambiar su estado: pendiente, confirmada, completada o cancelada.

Antes de permitir guardar una cita, valida nuevamente que el barbero esté disponible durante toda la duración del servicio.

Cuando cambie el barbero, la fecha o los servicios, actualiza los horarios disponibles.

Si un servicio dura 45 minutos, por ejemplo, el horario seleccionado debe disponer de esos 45 minutos completos.

Utiliza una única fuente de verdad para los horarios laborales, los descansos, las citas existentes y las excepciones. No implementes validaciones independientes que puedan producir resultados contradictorios.

Incluye datos de demostración suficientes para probar conflictos, horarios disponibles y cambios de cita.

## 10. Gestión de servicios

Implementa un CRUD completo para los servicios de la barbería.

Ejemplos:

- Corte de cabello.
- Arreglo de barba.
- Corte y barba.
- Otros servicios configurables.

Cada servicio debe tener:

- Nombre.
- Descripción.
- Precio.
- Duración estimada.
- Estado activo o inactivo.

Permite crear, editar, visualizar, buscar y desactivar servicios.

La duración debe utilizarse en el cálculo de disponibilidad de las citas. El precio debe utilizarse para calcular el importe estimado de la reserva.

## 11. Gestión de productos

Implementa un CRUD completo de productos que comercializa la barbería.

Ejemplos:

- Shampoo.
- Gel para cabello.
- Cera para peinar.
- Aceites para barba.
- Otros productos de cuidado personal.

Cada producto debe incluir:

- Nombre.
- Descripción.
- Precio de venta.
- Costo de adquisición opcional.
- Existencias.
- Categoría.
- Imagen.
- Estado activo o inactivo.

Incluye búsqueda, filtros y una vista detallada del producto.

Cuando se registren ventas de demostración, permite representar la actualización de existencias y los indicadores de productos vendidos.

Define cómo se manejarán las existencias insuficientes y evita mostrar cantidades negativas.

## 12. Gestión de promociones

El administrador debe poder crear y administrar promociones para productos, servicios o combinaciones de ambos.

Admite dos modalidades de descuento:

**A. Descuento porcentual**
- Ejemplo: 20 % de descuento en el servicio de corte.

**B. Precio promocional directo**
- Ejemplo: corte de $200 a $150.

Cada promoción debe incluir:

- Nombre.
- Descripción.
- Tipo de descuento.
- Productos o servicios incluidos.
- Precio original.
- Porcentaje o precio promocional.
- Fecha de inicio y finalización.
- Estado: borrador, programada, activa, finalizada o desactivada.
- Imagen o material visual opcional.
- Restricciones o condiciones, si corresponde.

Muestra una vista previa de la promoción tal como podría visualizarla un cliente.

Valida fechas, precios y descuentos para evitar configuraciones inválidas.

Para productos, contempla opcionalmente límites de existencias o unidades promocionales.

## 13. Ventas y analíticas comerciales

Construye un módulo para consultar las ventas del negocio y analizar sus resultados.

Incluye:

- Listado de ventas.
- Fecha y hora.
- Productos y servicios vendidos.
- Cantidades.
- Precios originales.
- Descuentos aplicados.
- Importe final.
- Barbero o empleado asociado cuando corresponda.
- Método de pago como dato de demostración.
- Estado de la operación.

Permite filtrar por fecha, empleado, producto, servicio y promoción.

### Analíticas generales

Incluye indicadores y gráficas de:

- Ingresos por periodo.
- Número de ventas.
- Ticket promedio.
- Productos más vendidos.
- Servicios más vendidos.
- Rendimiento por barbero.
- Comparación entre periodos.
- Evolución de ventas.

Distingue claramente entre ingresos brutos, descuentos e ingresos netos según los datos disponibles. No confundas ventas con utilidad: para calcular utilidad es necesario disponer de los costos correspondientes.

### Analíticas de promociones

Este módulo es especialmente importante.

Permite evaluar si las promociones realmente ayudaron al negocio.

Incluye, cuando los datos de demostración lo permitan:

- Ventas asociadas a cada promoción.
- Unidades vendidas durante la promoción.
- Ingresos generados.
- Descuentos concedidos.
- Comparación con un periodo anterior comparable.
- Comparación con ventas de productos o servicios sin promoción.
- Promociones con mejores y peores resultados.
- Evolución del rendimiento por promoción.

Diferencia entre ventas que simplemente ocurrieron durante una promoción y ventas efectivamente atribuidas a ella.

Si se muestran métricas de incremento, conversión o retorno de inversión, define claramente sus fórmulas y los datos necesarios. No inventes resultados ni atribuyas causalidad a una promoción sin información suficiente.

## 14. Sistema de notificaciones

Diseña un módulo para que el administrador pueda preparar y gestionar notificaciones destinadas a los clientes o empleados.

Casos de uso:

- Anunciar un nuevo producto.
- Anunciar un nuevo servicio.
- Comunicar una promoción.
- Enviar avisos generales.
- Informar de cambios relevantes en el negocio.

El administrador debe poder:

- Redactar título y mensaje.
- Seleccionar destinatarios.
- Elegir entre clientes, empleados o segmentos disponibles.
- Programar una notificación o enviarla inmediatamente de forma simulada.
- Previsualizar el mensaje.
- Consultar el historial.
- Ver el estado de cada envío.
- Consultar métricas de entrega o apertura únicamente cuando estén disponibles en los datos.

### Notificaciones nativas del dispositivo

El objetivo futuro es que las notificaciones se comporten como las de una aplicación convencional y aparezcan en la barra de notificaciones del celular, incluso cuando la PWA no esté abierta, dentro de las capacidades y restricciones del sistema operativo y del navegador.

Diseña el frontend teniendo en cuenta:

- Solicitud de permiso para recibir notificaciones.
- Estado de suscripción de cada usuario.
- Preferencias de notificación.
- Vista previa del contenido.
- Acciones de prueba.
- Estados de habilitadas, deshabilitadas y pendientes de configuración.

Importante: no simules que una notificación fue enviada realmente al dispositivo si no existe integración.

La entrega real requerirá posteriormente un backend, suscripciones Push, un proveedor o servicio de envío y un service worker correctamente configurado. Las notificaciones push web requieren soporte del navegador y permisos del usuario; no se deben prometer como universales en todos los dispositivos.

En esta etapa, construye los componentes y estados necesarios para integrar ese sistema posteriormente.

## 15. Configuración del negocio y perfil

Incluye una sección de configuración que permita representar la administración de:

- Nombre de la barbería.
- Logotipo.
- Dirección y datos de contacto.
- Horarios generales del establecimiento.
- Moneda.
- Datos del perfil administrativo.
- Preferencias visuales y de notificaciones.

Los horarios generales del establecimiento no deben sustituir los horarios individuales de los barberos.

La configuración debe ser consistente con el resto de la aplicación.

## 16. Requisitos funcionales de frontend

No entregues únicamente diseños estáticos.

Todas las interacciones visibles deben funcionar de manera coherente utilizando datos simulados.

Implementa:

- Navegación real entre secciones.
- Formularios con validaciones.
- Búsqueda y filtros funcionales.
- Ordenación y paginación cuando sean necesarias.
- Modales o paneles de edición.
- Confirmaciones antes de acciones destructivas.
- Notificaciones visuales de éxito y error.
- Estados de carga y estados vacíos.
- Persistencia local de los cambios cuando resulte conveniente.
- Datos relacionados coherentes entre módulos.
- Diseño adaptable a diferentes tamaños de pantalla.
- Accesibilidad básica para controles y formularios.

Evita botones que no hagan nada, enlaces sin destino y métricas que cambien de manera arbitraria.

## 17. Arquitectura y organización del proyecto

Organiza el código de manera modular.

Separa, como mínimo:

- Layouts.
- Componentes compartidos.
- Componentes de navegación.
- Páginas y rutas.
- Formularios.
- Componentes de agenda.
- Componentes de gráficas.
- Tipos e interfaces de TypeScript.
- Datos de demostración.
- Servicios simulados.
- Utilidades de fechas, horarios y precios.
- Tokens y estilos globales.

Utiliza tipos explícitos para entidades como clientes, empleados, servicios, productos, promociones, citas, ventas y notificaciones.

Evita concentrar toda la lógica en un único componente o archivo.

La lógica de disponibilidad de la agenda debe estar separada de la presentación visual y tener pruebas para los principales casos límite.

## 18. Metodología de trabajo

Trabaja por etapas, manteniendo la calidad visual y funcional.

**Etapa 1. Inspección y planificación**
- Inspecciona el proyecto existente antes de modificarlo.
- Consulta la skill `impeccable`.
- Define la dirección visual y los tokens de diseño.
- Identifica dependencias, restricciones y estructura actual.
- Presenta una propuesta breve de arquitectura y navegación.

**Etapa 2. Base visual**
- Configura la estructura de la aplicación.
- Implementa tipografía, colores, componentes base y navegación móvil.
- Construye el login y el layout administrativo.

**Etapa 3. Módulos principales**
- Dashboard.
- Agenda y disponibilidad.
- Clientes.
- Empleados.
- Servicios.
- Productos.

**Etapa 4. Funcionalidades comerciales**
- Promociones.
- Ventas.
- Analíticas.
- Notificaciones.
- Configuración.

**Etapa 5. Integración y validación**
- Comprueba la navegación completa.
- Valida todos los formularios y acciones.
- Prueba la disponibilidad de los barberos y los conflictos de agenda.
- Comprueba los diseños en diferentes tamaños de pantalla.
- Ejecuta los comandos de compilación, revisión de tipos y pruebas disponibles.
- Corrige errores y elimina inconsistencias visuales.

No intentes implementar todas las pantallas de forma superficial en una sola pasada. Prioriza una base sólida y continúa módulo por módulo.

## 19. Criterios de aceptación

Consideraremos satisfactoria esta etapa cuando:

1. La aplicación se ejecute correctamente con Astro.
2. La interfaz tenga una identidad visual consistente, moderna y profesional.
3. La experiencia esté optimizada para teléfonos celulares.
4. El administrador pueda recorrer todos los módulos.
5. Los CRUD funcionen con datos de demostración.
6. Las invitaciones de clientes y empleados puedan generarse y copiarse de manera simulada.
7. La agenda respete los horarios laborales, descansos, días libres y citas existentes.
8. Los precios, duraciones y descuentos sean coherentes entre los módulos.
9. Las analíticas se calculen a partir de datos consistentes.
10. Las notificaciones tengan una interfaz funcional sin afirmar que existe envío push real.
11. Los datos simulados estén preparados para sustituirse por una API.
12. No existan errores importantes de compilación, navegación o interacción.
13. La interfaz no presente desbordamientos horizontales injustificados en móviles.
14. El resultado parezca una aplicación real lista para una demostración de producto.

## 20. Instrucción final

Actúa como un desarrollador frontend senior con experiencia en Astro, TypeScript, PWAs, diseño de productos móviles y sistemas administrativos.

Aplica la skill `impeccable` desde el inicio. Antes de escribir código, inspecciona el proyecto y sus herramientas disponibles. No reemplaces configuraciones existentes sin necesidad.

Prioriza la calidad del diseño, la experiencia móvil, la coherencia de los datos y la funcionalidad real de cada interacción.

Si necesitas tomar decisiones no especificadas, utiliza criterios profesionales y consistentes con el producto. No te detengas a preguntar por detalles menores.

**Comienza por inspeccionar el proyecto, revisar las instrucciones de la skill y definir la arquitectura y la dirección visual. Después, implementa el proyecto por etapas, verificando el funcionamiento antes de avanzar.**