# IDIO Frontend Style Guide

Versión: demo negra  
Alcance: frontend únicamente  
Referencia base: dirección visual tipo A, adaptada a una app operativa negra, monocromática y responsive

## Objetivo

Este documento define el estilo visual y de interacción que debe repetirse en todas las páginas frontend de IDIO. La implementación debe mantenerse dentro de `frontend/` y no debe modificar contratos, circuitos, scripts de backend, servicios de chain o estructuras de datos existentes.

La interfaz debe sentirse como una consola institucional para emisión, subasta, auditoría y cumplimiento: precisa, sobria, técnica y confiable. La estética base es negra y blanca, con verde IDIO usado solo como señal de acción, estado activo o verificación.

## Principios visuales

1. Fondo negro como superficie principal.
2. Texto blanco o gris claro con contraste alto.
3. Líneas finas para separar estructura, no tarjetas decorativas.
4. Verde como señal funcional, no como decoración.
5. Layout editorial tipo sistema de marca, aplicado a producto.
6. Formularios y tablas con densidad limpia.
7. Animaciones cortas, suaves y vinculadas a estado.
8. Mobile tratado como diseño principal, no como reducción del desktop.

## Paleta

Usar una paleta monocromática con un solo acento verde.

```css
:root {
  --idio-bg: #030403;
  --idio-bg-soft: #080a08;
  --idio-panel: #0d100d;
  --idio-panel-raised: #111611;
  --idio-line: rgba(255, 255, 255, 0.14);
  --idio-line-strong: rgba(255, 255, 255, 0.24);
  --idio-text: #f4f6f4;
  --idio-text-muted: #a0a8a0;
  --idio-text-dim: #6f786f;
  --idio-green: #35e66b;
  --idio-green-soft: rgba(53, 230, 107, 0.14);
  --idio-green-line: rgba(53, 230, 107, 0.55);
  --idio-danger: #ff6b6b;
  --idio-warning: #f5c542;
}
```

Uso:

- `--idio-bg`: body y áreas principales.
- `--idio-bg-soft`: sidebar, header móvil, zonas de navegación.
- `--idio-panel`: formularios, paneles de inspección y filas activas.
- `--idio-line`: divisores y bordes finos.
- `--idio-green`: acción primaria, rol activo, foco, confirmación.
- `--idio-green-soft`: fondos activos discretos.
- `--idio-danger` y `--idio-warning`: solo estados reales.

No usar morado, cyan o degradados como identidad principal en esta versión demo.

## Tipografía

Usar una sola familia sans para producto. La familia actual puede mantenerse si ya está cargada, pero la aplicación debe verse más precisa mediante escala, peso y espaciado.

Escala recomendada:

```css
--font-display: 40px;
--font-h1: 32px;
--font-h2: 24px;
--font-h3: 18px;
--font-body: 15px;
--font-small: 13px;
--font-micro: 11px;
```

Reglas:

- H1 desktop: 32 a 40 px, peso 650 a 750.
- H1 mobile: 28 a 32 px.
- Body: 15 a 16 px.
- Labels: 10 a 11 px, uppercase, tracking amplio, solo para metadatos cortos.
- Números, hashes y direcciones: usar mono únicamente para datos técnicos.
- No usar uppercase para párrafos completos.
- Evitar textos grises demasiado bajos. El contenido operativo debe ser legible.

## Layout base

La app debe usar un shell consistente.

Desktop:

- Sidebar fijo a la izquierda.
- Contenido principal con ancho completo.
- Header superior compacto cuando la página lo necesita.
- Panel secundario a la derecha para preflight, resumen, filtros o inspección.

Estructura:

```text
┌────────────── sidebar 280px ──────────────┬──────────── content ────────────┬── panel opcional ──┐
│ Logo, rol, menú, entorno, wallet          │ Título, acciones, tabla/form     │ Estado, resumen    │
└───────────────────────────────────────────┴─────────────────────────────────┴───────────────────┘
```

Mobile:

- Header fijo arriba.
- Sidebar oculto por defecto.
- Al abrir menú, el sidebar ocupa 85% del ancho de pantalla.
- Overlay oscuro en el 15% restante.
- El contenido principal no debe quedar interactivo mientras el menú está abierto.

Breakpoints:

```css
--bp-mobile: 0px to 767px;
--bp-tablet: 768px to 1023px;
--bp-desktop: 1024px and up;
```

## Header responsive

El header móvil debe ser limpio y visible sobre fondo negro.

Debe contener:

- Logo IDIO a la izquierda.
- Estado corto al centro o debajo del logo si el ancho no alcanza.
- Botón de menú a la derecha.
- Altura recomendada: 64 px.
- Borde inferior de 1 px con `--idio-line`.
- Fondo `--idio-bg-soft`.

Comportamiento:

- En desktop, el header móvil desaparece si el sidebar está visible.
- En mobile, el botón de menú usa tres líneas.
- Al hacer click, las tres líneas se transforman en una X.
- La transición debe durar 180 a 220 ms.
- La X no debe saltar de posición.

Especificación del icono:

```css
.menu-button span {
  transition:
    transform 200ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 160ms ease-out;
}

.menu-button[data-open="true"] span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.menu-button[data-open="true"] span:nth-child(2) {
  opacity: 0;
}

.menu-button[data-open="true"] span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}
```

## Sidebar mobile

El sidebar móvil debe ocupar 85% del viewport.

```css
.mobile-sidebar {
  width: 85vw;
  max-width: 420px;
  transform: translateX(-100%);
  transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.mobile-sidebar[data-open="true"] {
  transform: translateX(0);
}
```

Los elementos del sidebar deben aparecer de derecha a izquierda dentro del panel, con un stagger natural.

```css
.mobile-sidebar [data-menu-item] {
  opacity: 0;
  transform: translateX(24px);
  transition:
    opacity 220ms ease-out,
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.mobile-sidebar[data-open="true"] [data-menu-item] {
  opacity: 1;
  transform: translateX(0);
}
```

Aplicar retrasos cortos:

```css
[data-menu-item]:nth-child(1) { transition-delay: 40ms; }
[data-menu-item]:nth-child(2) { transition-delay: 70ms; }
[data-menu-item]:nth-child(3) { transition-delay: 100ms; }
[data-menu-item]:nth-child(4) { transition-delay: 130ms; }
[data-menu-item]:nth-child(5) { transition-delay: 160ms; }
```

Accesibilidad:

- El botón debe tener `aria-expanded`.
- El sidebar debe cerrarse con Escape.
- El foco debe regresar al botón de menú al cerrar.
- Respetar `prefers-reduced-motion`.

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Componentes base

### App shell

El shell debe ser el contenedor de todas las páginas operativas.

Partes:

- Sidebar.
- Header móvil.
- Main content.
- Panel derecho opcional.
- Overlay móvil.

### Sidebar

Desktop:

- Ancho: 280 px.
- Fondo: `--idio-bg-soft`.
- Borde derecho: 1 px `--idio-line`.
- Logo arriba.
- Selector de rol en bloque delimitado.
- Navegación con numeración corta.
- Selector Demo/Testnet abajo.
- Wallet abajo.

Mobile:

- 85vw.
- Misma jerarquía visual.
- Menú con animación derecha a izquierda.

### Botones

Primario:

- Fondo verde.
- Texto negro.
- Radio: 6 a 10 px.
- Sin sombra decorativa.
- Hover: verde ligeramente más claro.
- Focus: outline verde visible.

Secundario:

- Fondo transparente o panel.
- Borde `--idio-line`.
- Texto blanco.

Ghost:

- Sin borde si aparece dentro de navegación.
- Hover con `--idio-panel`.

### Inputs y selects

- Fondo `--idio-panel`.
- Borde `--idio-line`.
- Texto `--idio-text`.
- Placeholder `--idio-text-muted`, no demasiado bajo.
- Focus con borde verde.
- Altura mínima: 44 px desktop, 48 px mobile.
- Radio: 8 px.

### Paneles

Los paneles deben verse como módulos de sistema, no como cards SaaS.

- Borde de 1 px.
- Fondo negro o panel muy sutil.
- Sin blur decorativo.
- Sin sombras grandes.
- Header interno con label técnico.
- Filas separadas por líneas finas.

### Tablas y registros

La tabla es el componente principal para subastas, auditoría y cumplimiento.

Reglas:

- Header con texto micro uppercase.
- Filas con hover sutil.
- Fila activa con fondo verde suave y borde verde tenue.
- Datos técnicos en mono.
- En mobile, convertir filas en bloques compactos con pares label/value.

## Tipos de páginas necesarias

Estas son las páginas que se deben diseñar para cubrir el producto sin tocar backend.

### 1. Landing demo / entrada

Propósito: presentar IDIO y permitir entrar por rol.

Contenido:

- Hero negro tipo dirección A.
- Frase principal: emisión privada con verificación pública.
- Visual abstracto monocromático con acento verde.
- CTAs: entrar como emisor, oferente, auditor o regulador.
- Explicación breve de flujo: emitir, ofertar, revelar, auditar.
- Estado demo/testnet visible.

Notas:

- Esta página puede reemplazar visualmente el selector de rol actual.
- Debe funcionar como primera pantalla en mobile.

### 2. Protocol overview

Propósito: dashboard inicial del rol activo.

Contenido:

- Estado del protocolo.
- Acciones principales por rol.
- Métricas de demo.
- Últimas subastas o eventos.
- Panel derecho de entorno y wallet.

### 3. Issue auction

Propósito: crear una subasta privada.

Contenido:

- Formulario principal de emisión.
- Secciones: términos de emisión, condiciones de subasta, memorándum.
- Panel derecho `Proof preflight`.
- Estados: listo, validando, error, publicado.

Referencia directa: la imagen adjunta de WhatsApp.

### 4. Auction registry

Propósito: listar y filtrar subastas.

Contenido:

- Tabla de subastas.
- Filtros por estado.
- Búsqueda por asset, emisor o dirección.
- Panel de inspección al seleccionar una fila.
- Acciones según rol.

### 5. Auction detail

Propósito: operar una subasta específica.

Contenido:

- Resumen de asset y estado.
- Timeline: creada, abierta, cerrada, revelada, liquidada.
- Ofertas selladas o reveladas según permisos.
- Acciones: ofertar, revelar, liquidar, pagar ganador.

### 6. Submit bid

Propósito: permitir al oferente enviar oferta.

Contenido:

- Formulario compacto.
- Explicación clara de bid sellado.
- Estado de wallet.
- Confirmación local antes de enviar.
- Resultado con hash o id.

### 7. Audit desk

Propósito: revisar pruebas y revelaciones.

Contenido:

- Entrada de view key.
- Tabla de evidencias.
- Estados de verificación.
- Panel de resultado.

### 8. Compliance desk

Propósito: vista de regulador.

Contenido:

- Registro de participantes.
- Estados de compliance.
- Subastas con banderas.
- Panel de inspección.

### 9. Bank profile

Propósito: perfil público o semi público de emisor.

Contenido:

- Identidad del banco o emisor.
- Historial de subastas.
- Métricas de participación.
- Estado de confianza y reservas si existe en datos actuales.

### 10. Empty, loading y error states

Estas vistas deben estar diseñadas, no improvisadas.

Empty:

- Mensaje corto.
- Próxima acción clara.
- Sin ilustraciones genéricas.

Loading:

- Skeletons en tablas y paneles.
- No spinner grande centrado salvo operación puntual.

Error:

- Mensaje concreto.
- Acción de recuperación.
- Detalle técnico colapsable si aplica.

## Responsive por página

### Landing demo

Desktop:

- Hero en dos columnas.
- Visual grande a la derecha.
- Roles en una banda inferior.

Mobile:

- Hero de una columna.
- CTA de rol en bloque vertical.
- Visual reducido.
- Header sticky.

### Issue auction

Desktop:

- Formulario en 2 columnas.
- Panel preflight fijo a la derecha.

Tablet:

- Formulario en 2 columnas si hay espacio.
- Panel preflight debajo o como columna secundaria.

Mobile:

- Formulario en 1 columna.
- Panel preflight debajo del título o antes del submit.
- Inputs 48 px mínimo.
- Sidebar 85vw.

### Auction registry

Desktop:

- Tabla completa con panel de inspección.

Mobile:

- Tabla convertida en lista.
- Cada fila muestra asset, estado, monto, duración y acción principal.
- Filtros en panel colapsable.

### Audit y Compliance

Desktop:

- Tabla con panel derecho.

Mobile:

- Lista por registros.
- Panel de inspección como drawer o sección debajo del registro seleccionado.

## Movimiento

Duraciones:

- Hover: 120 a 160 ms.
- Menú mobile: 220 a 260 ms.
- Entrada de items del sidebar: 220 a 280 ms.
- Cambio de estado: 150 a 220 ms.

Easing:

```css
--ease-out: cubic-bezier(0.22, 1, 0.36, 1);
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
```

No usar:

- Rebotes.
- Animaciones largas.
- Fade-in obligatorio para que el contenido exista.
- Movimiento decorativo sin estado.

## Copy y tono

La voz debe ser institucional, concreta y técnica.

Ejemplos:

- `Issue a private auction.`
- `A proof of reserves is generated before publication.`
- `Auction registry`
- `Proof preflight`
- `Reserve predicate checked`
- `Connect wallet`
- `Switch role`

Reglas:

- Botones con verbo y objeto.
- Mensajes cortos.
- Evitar marketing genérico.
- Mantener términos técnicos si ya existen en la app.
- UI principal puede estar en inglés si el producto ya lo usa, pero debe ser consistente.

## Reglas de implementación frontend

1. No modificar backend, contratos, circuitos o scripts de despliegue.
2. Mantener intactas las firmas de servicios existentes.
3. Crear componentes visuales reutilizables antes de duplicar estilos.
4. Centralizar tokens en CSS/Tailwind.
5. Evitar estilos hardcodeados por página salvo composición específica.
6. Probar desktop, tablet y mobile.
7. Probar modo demo antes de cualquier modo chain/testnet.

## Componentes reutilizables recomendados

- `AppShell`
- `MobileHeader`
- `Sidebar`
- `RoleSwitcher`
- `EnvironmentSwitch`
- `WalletStatus`
- `PageHeader`
- `RuledPanel`
- `DataTable`
- `ResponsiveRecordList`
- `StatusBadge`
- `ActionButton`
- `PreflightPanel`
- `EmptyState`
- `SkeletonBlock`
- `ErrorNotice`

## Checklist antes de programar

- [ ] La página usa el shell común.
- [ ] El header mobile existe y no tapa contenido.
- [ ] El sidebar mobile ocupa 85vw.
- [ ] El botón hamburguesa se transforma en X.
- [ ] Los items del sidebar entran de derecha a izquierda.
- [ ] Los inputs tienen foco verde visible.
- [ ] Las tablas tienen versión mobile.
- [ ] El verde solo comunica acción, estado o verificación.
- [ ] No hay gradientes morados, glassmorphism o sombras decorativas.
- [ ] No se tocó backend ni servicios de datos.
- [ ] La pantalla funciona en demo mode.

