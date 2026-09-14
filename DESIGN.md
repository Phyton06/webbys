---
name: "Webby's Barbershop"
description: "Estilo neo-brutalista oscuro y tradicional para la barbería del México rural"
colors:
  primary: "#C41E3A"
  primary-hover: "#A11830"
  primary-dark: "#9B1B30"
  primary-light: "#E8364F"
  accent-cyan: "#00BCD4"
  accent-cyan-dark: "#0097A7"
  accent-cyan-light: "#4DD0E1"
  surface: "#1A1A1A"
  surface-elevated: "#262626"
  border: "#333333"
  text-primary: "#FFFFFF"
  text-muted: "#A3A3A3"
  black: "#000000"
  white: "#FFFFFF"
typography:
  display:
    fontFamily: "Georgia, serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  xl: "12px"
  2xl: "16px"
  4xl: "32px"
spacing:
  safe-top: "env(safe-area-inset-top)"
  safe-bottom: "env(safe-area-inset-bottom)"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    rounded: "{rounded.xl}"
    padding: "14px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-cyan:
    backgroundColor: "{colors.accent-cyan}"
    textColor: "{colors.black}"
    rounded: "{rounded.xl}"
    padding: "14px 24px"
  button-cyan-hover:
    backgroundColor: "{colors.accent-cyan-dark}"
---

# Design System: Webby's Barbershop

## Overview

**Creative North Star: "El Templo de la Navaja"**

Webby's Barbershop fusiona la estética clásica de las barberías tradicionales (con sus emblemáticos postes de barbero y navajas de afeitar) con una interfaz oscura de alto contraste, diseñada específicamente para entornos de alta luminosidad y baja alfabetización digital en el México rural. No es una aplicación SaaS corporativa; es una herramienta digital de alta gama que se siente como entrar a una barbería real: madera oscura, luces de neón cian, detalles de toallas calientes de color rojo sangre y texturas marcadas.

La interfaz prioriza la legibilidad, con tamaños de fuente generosos (mínimo 16px para inputs) y áreas de toque masivas (mínimo 52px de altura para botones e inputs) que aseguran un uso sin fricciones en teléfonos móviles de gama media y tabletas compartidas en el local.

**Key Characteristics:**
- **Oscuridad Absoluta:** Fondo negro puro (#000000) para un contraste extremo y ahorro de batería en pantallas OLED de gama media.
- **Detalles Barber Pole:** Patrones de líneas diagonales de barbería en cian traslúcido para dar una identidad de marca inmediata.
- **Neo-Brutalismo de Alta Gama:** Bordes gruesos y definidos (#333333) con sombras sutiles que separan las superficies elevadas sin perder la solidez.
- **Mexicanidad Auténtica:** Copys amigables, directos y adaptados al español mexicano (MX), eliminando tecnicismos y jerga de software corporativo.

## Colors

La paleta cromática es intencionalmente limitada para guiar la atención del usuario sin saturar la vista en entornos de trabajo rápidos.

### Primary
- **Rojo Sangre de Toro** (#C41E3A): El color emblemático del logo de Webby's. Se utiliza con extrema moderación (menos del 10% de la UI) exclusivamente para acciones principales destructivas, elementos de marca clave y alertas críticas.

### Secondary
- **Azul Neón Cian** (#00BCD4): El color del dinamismo y la tecnología. Utilizado para enlaces interactivos, focos de inputs, botones de confirmación y para el emblemático patrón de líneas diagonales del barber pole.

### Neutral
- **Fondo Negro Puro** (#000000): Usado como fondo de pantalla completo (`bg-black`) para maximizar el contraste con el sol exterior.
- **Gris Carbón Superficie** (#1A1A1A): Para tarjetas (`.card`) y contenedores elevados.
- **Gris Carbón Elevado** (#262626): Para elementos flotantes, modales y filas activas en tablas.
- **Gris Frontera** (#333333): Para bordes limpios y separadores (`border-border`).

### Named Rules
**The 10% Accent Rule.** El rojo del logo (#C41E3A) y el cian interactivo (#00BCD4) nunca deben cubrir más del 10% de la superficie visual de una pantalla. Su poder radica en su escasez; si todo brilla, nada es importante.

## Typography

**Display Font:** Georgia, serif
**Body Font:** System-UI (BlinkMacSystemFont, -apple-system, sans-serif)

La combinación tipográfica contrasta el clasicismo elegante de una serif tradicional (Georgia) para los titulares de marca y secciones principales, con la legibilidad ultra-limpia y directa de las fuentes del sistema móvil para todos los textos operativos, formularios y tablas.

### Hierarchy
- **Display** (Bold, 32px-48px, line-height: 1.2): Usado únicamente para pantallas de bienvenida, logotipos de texto y grandes números de KPI en el dashboard.
- **Headline / Title** (Bold, 20px-24px, line-height: 1.3): Para títulos de tarjetas, secciones principales del admin y encabezados de páginas.
- **Body** (Regular, 16px, line-height: 1.5): El estándar de oro para todo texto descriptivo, filas de tablas e información operativa. Garantiza legibilidad impecable en teléfonos pequeños.
- **Label** (Bold, 12px, letter-spacing: 0.05em, uppercase): Para encabezados de tablas, badges de estado, pestañas e identificadores rápidos de datos.

## Layout

El sistema espacial se rige por una grilla flexible que se adapta desde teléfonos móviles de 320px de ancho hasta pantallas de escritorio.

### Spacing Rhythm
- **Padding Seguro Móvil:** El uso de las constantes CSS `env(safe-area-inset-top)` y `env(safe-area-inset-bottom)` es obligatorio para evitar que el notch del teléfono o las barras de navegación nativas del sistema operativo pisen botones interactivos.
- **Gaps de Grilla:** 16px (`gap-4`) para contenedores y listas. 24px (`gap-6`) para modales y layouts de dos columnas.

## Elevation & Depth

No usamos sombras difusas ni efectos de vidrio templado artificiales. La profundidad se transmite a través del contraste tonal estricto (Tonal Layering) combinado con bordes nítidos.

### Shadow Vocabulary
- **Sombra Neón** (`box-shadow: 0 10px 15px -3px rgba(0, 188, 212, 0.2)`): Exclusiva para botones de acción flotantes e interactivos de color cian para simular el brillo de un tubo de neón real.
- **Sombra Roja** (`box-shadow: 0 10px 15px -3px rgba(196, 30, 58, 0.2)`): Exclusiva para botones principales de color rojo sangre para darles peso visual.

### Named Rules
**The Sharp Contrast Rule.** Las superficies elevadas no flotan en el aire usando desenfoques exagerados; se asientan firmemente en la UI mediante un borde físico de 1px de color Gris Frontera (#333333) y una diferencia de luminosidad de fondo clara.

## Shapes

La geometría de Webby's es sólida y masculina, emulando la robustez de las herramientas de metal de una barbería tradicional.

- **Bordes Redondeados de Tarjetas** (`rounded-2xl` / 16px): Para suavizar de forma sutil las tarjetas de información principales y modales.
- **Bordes Redondeados de Controles** (`rounded-xl` / 12px): Para botones e inputs. Este radio es ideal para la precisión de toque con el dedo gordo en teléfonos móviles.

## Components

### Buttons
- **Shape:** rounded-xl (12px)
- **Primary:** `.btn-primary` (Rojo #C41E3A, Texto Blanco, padding de 14px 24px). Altura mínima de 52px para excelente accesibilidad.
- **Cyan:** `.btn-cyan` (Cian #00BCD4, Texto Negro, padding de 14px 24px). Altura mínima de 52px.
- **Ghost:** `.btn-ghost` (Fondo transparente, borde cian con opacidad 30%, texto cian).

### Cards
- **Corner Style:** rounded-2xl (16px)
- **Background:** Gris Carbón Superficie (#1A1A1A) con borde físico de 1px Gris Frontera (#333333).
- **Highlight:** `.card-highlight` lleva un sutil acento en el borde usando Rojo (#C41E3A) al 30% de opacidad para llamar la atención del admin sobre datos clave.

### Inputs
- **Style:** Fondo Gris Carbón Superficie (#1A1A1A), borde Gris Carbón (#666666), texto blanco, placeholder gris muted. Altura de 52px obligatoria para evitar zoom en Safari iOS.
- **Focus:** Borde Cian interactivo (#00BCD4) con anillo de enfoque de 2px.

### Navigation
- **Bottom Nav:** Barra inferior fija (`fixed bottom-0`) de Gris Carbón Superficie (#1A1A1A) con borde superior de 1px Gris Frontera (#333333), optimizada para pulgares en pantallas táctiles.

## Do's and Don'ts

### Do:
- **Do** usar siempre una altura mínima de 52px para todos los botones e inputs interactivos en pantallas móviles para garantizar accesibilidad.
- **Do** envolver todo texto o flujo interactivo dentro de áreas seguras (`safe-bottom` y `safe-top`) para respetar las pantallas curvas y notches de dispositivos modernos.
- **Do** aplicar la regla del 10% de acento cromático para que el rojo y el cian mantengan su impacto visual.

### Don't:
- **Don't** usar degradados multicolores ni transparencias tipo "glassmorphism" en las interfaces. La app de Webby's debe sentirse sólida, pesada y de metal.
- **Don't** reducir el tamaño de letra de los formularios por debajo de 16px para prevenir que el navegador de iOS haga zoom automático y rompa el diseño responsivo.
- **Don't** usar sombras negras borrosas y difusas para elevar elementos; la elevación se logra mediante bordes nítidos de 1px (#333333) y el contraste tonal del fondo.
