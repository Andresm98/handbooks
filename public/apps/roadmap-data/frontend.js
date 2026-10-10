/* Dominio: Frontend */
RoadmapPlus.temas({
  'frontend-web': {
    conceptos: [
      ['Critical rendering path', 'Pasos del navegador para pintar: HTML → DOM, CSS → CSSOM, render tree, layout, paint. El CSS y el JS bloqueantes lo retrasan.'],
      ['Core Web Vitals', 'LCP (carga del elemento principal, < 2,5 s), INP (respuesta a interacciones, < 200 ms) y CLS (estabilidad visual, < 0,1).'],
      ['Event loop del navegador', 'Un solo hilo principal ejecuta JS, layout y paint; una tarea larga congela la interfaz.'],
      ['Estado local vs global', 'Mantén el estado lo más cerca posible de donde se usa; global solo lo compartido de verdad.'],
      ['Estado del servidor', 'Datos que vienen del backend (caché, revalidación, reintentos): se gestionan con React Query, Angular resource/HttpClient + signals, no como estado de UI.'],
      ['Change detection', 'Cómo el framework decide qué re-renderizar: reconciliación del virtual DOM (React), zone.js o signals (Angular).'],
      ['Signals', 'Valores reactivos de grano fino (Angular, Solid, Preact) que actualizan solo lo que depende de ellos.'],
      ['SSR / SSG / CSR', 'Renderizar en servidor por request, en build o en el navegador; afecta tiempo de carga, SEO y costo.'],
      ['Hidratación', 'Conectar el HTML renderizado en servidor con el JS del cliente para hacerlo interactivo.'],
      ['Code splitting', 'Dividir el bundle y cargar por ruta o por componente bajo demanda.'],
      ['XSS', 'Inyección de scripts en la página; los frameworks escapan por defecto, salvo `innerHTML` o `dangerouslySetInnerHTML`.'],
      ['CSP', 'Content Security Policy: cabecera que limita de dónde se pueden cargar scripts y recursos.'],
      ['Accesibilidad (a11y)', 'Semántica HTML, foco, contraste y lectores de pantalla; requisito legal en muchos países.']
    ],
    profundidad: [
      { t: 'Rendimiento: de la medición a la corrección', p: [
        ['Mide con datos de campo (RUM, CrUX), no solo con Lighthouse en tu máquina.', '**LCP**: optimiza la imagen o texto principal (tamaño, formato moderno, `fetchpriority="high"`), reduce el JS bloqueante y usa CDN.', '**INP**: divide tareas largas, evita re-renderizados masivos y difiere trabajo no urgente.', '**CLS**: reserva espacio para imágenes, anuncios y contenido dinámico.', 'Presupuesto de rendimiento en CI (tamaño de bundle) para que no se degrade con el tiempo.']
      ] },
      { t: 'Gestión de estado sin caos', p: [
        'La mayoría del "estado global" de una app es en realidad caché de datos del servidor. Separarlo simplifica todo:',
        ['**Estado del servidor**: librería de fetching con caché, deduplicación, reintentos y revalidación.', '**Estado de UI**: local al componente (abierto/cerrado, valor de un input).', '**Estado de formulario**: librería de formularios con validación.', '**Estado global de cliente**: lo mínimo (sesión, preferencias), en un store o signals.', 'En la URL: filtros y paginación, para que se puedan compartir y recargar.']
      ], code: { lang: 'TypeScript (Angular) — estado derivado con signals', code: '@Component({ selector: "app-movimientos", templateUrl: "./movimientos.html" })\nexport class MovimientosComponent {\n  private api = inject(MovimientosApi);\n  filtro = signal<"todos" | "debitos" | "creditos">("todos");\n  movimientos = toSignal(this.api.listar(), { initialValue: [] });\n  visibles = computed(() => {\n    const f = this.filtro();\n    return f === "todos" ? this.movimientos() : this.movimientos().filter(m => m.tipo === f);\n  });\n  total = computed(() => this.visibles().reduce((s, m) => s + m.monto, 0));\n}' } },
      { t: 'Seguridad en el frontend', p: [
        ['El frontend nunca es una barrera de seguridad: toda validación y autorización se repite en el backend.', 'Tokens: en SPA, el patrón recomendado es BFF (backend for frontend) con cookie HttpOnly, SameSite y Secure, en lugar de guardar access tokens en localStorage.', 'CSP estricta y sin `unsafe-inline` reduce el impacto de un XSS.', 'Dependencias npm: lockfile, auditoría y revisión de paquetes nuevos (ataques de cadena de suministro).']
      ] },
      { t: 'Arquitectura de aplicaciones grandes', p: [
        ['Organiza por funcionalidad (feature folders), no por tipo técnico.', 'Componentes de presentación sin lógica de datos y contenedores que la orquestan.', 'Design system con componentes accesibles reutilizables.', 'Microfrontends solo cuando hay varios equipos que necesitan desplegar independientemente; tienen costo alto de consistencia y rendimiento.']
      ] }
    ],
    recurrentes: [
      { tema: 'Re-renderizados innecesarios', por: 'La interfaz se vuelve lenta al crecer la app.', clave: 'Mide con el profiler del framework; estado local, memoización selectiva y signals.' },
      { tema: 'Tokens en localStorage', por: 'Cualquier XSS los roba.', clave: 'BFF con cookies HttpOnly o, como mínimo, tokens de vida corta y CSP estricta.' },
      { tema: 'Bundles gigantes', por: 'Cada librería agregada suma peso que paga cada usuario móvil.', clave: 'Code splitting por ruta, análisis del bundle y presupuesto en CI.' },
      { tema: 'Manejo de errores y estados de carga', por: 'Pantallas en blanco cuando la API falla.', clave: 'Diseña siempre los estados: cargando, vacío, error y éxito.' }
    ],
    casos: [
      { titulo: 'left-pad: 11 líneas que rompieron miles de builds', cuando: 'Mar 2016', que: 'Un desarrollador retiró sus paquetes de npm, entre ellos left-pad, una función de 11 líneas de la que dependían (directa o indirectamente) proyectos como Babel y React; miles de builds fallaron.', causa: 'Dependencia transitiva masiva de un paquete trivial y un registro que permitía retirar versiones publicadas.', leccion: 'Conoce tu árbol de dependencias, usa lockfiles y un registro espejo o caché interno; npm cambió después su política de despublicación.', fuente: 'Comunicado de npm, "kik, left-pad, and npm" (mar. 2016)' },
      { titulo: 'Ataque a la cadena de suministro con event-stream', cuando: 'Nov 2018', que: 'El mantenedor de event-stream, un paquete npm con millones de descargas, cedió el control a un desconocido que agregó una dependencia con código malicioso dirigido a robar fondos de una billetera de criptomonedas.', causa: 'Confianza implícita en mantenedores de paquetes transitivos y ausencia de revisión de cambios en dependencias.', leccion: 'Fija versiones, revisa dependencias nuevas, usa herramientas de análisis de cadena de suministro y minimiza dependencias en el frontend.', fuente: 'Reporte del incidente en el repositorio de event-stream y avisos de npm (nov. 2018)' }
    ],
    escenarios: [
      { sintoma: 'Al escribir en un buscador, la app se congela medio segundo por tecla.', pasos: ['Grabar con el Performance panel y buscar tareas largas.', 'Revisar si cada tecla re-renderiza una lista grande o filtra miles de elementos.', 'Verificar si hay una petición por tecla.'], solucion: 'Debounce de la búsqueda, virtualización de la lista y memoización del filtrado.' },
      { sintoma: 'El LCP en móviles reales es de 6 segundos.', pasos: ['Identificar el elemento LCP en datos de campo.', 'Revisar tamaño y formato de la imagen principal y si se carga tarde.', 'Medir el JS que bloquea antes del primer render.'], solucion: 'Imagen optimizada y precargada, menos JS inicial con code splitting y SSR o prerender de la vista principal.' }
    ]
  },

  'frontend-movil': {
    conceptos: [
      ['Nativo vs multiplataforma', 'Swift/Kotlin dan máximo control; React Native y Flutter comparten código con menos esfuerzo y algunas limitaciones.'],
      ['Ciclo de vida de la app', 'Primer plano, segundo plano y terminada: el SO puede matar la app en cualquier momento.'],
      ['Offline-first', 'La app funciona con datos locales y sincroniza al recuperar conexión.'],
      ['Almacenamiento seguro', 'Keychain (iOS) y Keystore (Android) para tokens y secretos; nunca en almacenamiento plano.'],
      ['Autenticación biométrica', 'Face ID o huella para desbloquear una credencial guardada en almacenamiento seguro.'],
      ['Certificate pinning', 'La app acepta solo certificados específicos del servidor, dificultando ataques de intermediario.'],
      ['Deep links', 'URLs que abren pantallas específicas de la app; deben validar parámetros como cualquier entrada externa.'],
      ['Push notifications', 'Mensajes vía APNs/FCM; no deben contener datos sensibles en el texto.'],
      ['Distribución', 'Revisión de las tiendas: un bug crítico no se corrige al instante.'],
      ['OTA updates', 'Actualizar código JS sin pasar por la tienda (React Native/Expo) dentro de las reglas de cada tienda.'],
      ['Detección de root/jailbreak', 'Señal de riesgo que las apps bancarias usan para limitar funciones.'],
      ['Feature flags remotos', 'Activar o desactivar funcionalidades sin publicar una versión nueva.']
    ],
    profundidad: [
      { t: 'Por qué el móvil es distinto del web', p: [
        ['No controlas cuándo se actualiza el usuario: convivirán varias versiones de la app contra la misma API durante meses.', 'La red es intermitente y lenta: timeouts, reintentos y modo sin conexión son parte del diseño.', 'La batería y la memoria son limitadas: el SO mata procesos en segundo plano.', 'Corregir un bug requiere revisión de la tienda: los feature flags y el versionado de API son esenciales.']
      ] },
      { t: 'Seguridad en apps bancarias', p: [
        ['Tokens en Keychain/Keystore protegidos por biometría; sesión con expiración y renovación controlada.', 'Sin datos sensibles en logs, capturas de pantalla (bloquearlas en pantallas sensibles) ni notificaciones.', 'Ofuscación y detección de manipulación, root o jailbreak como capas adicionales, no como única defensa.', 'Toda lógica de autorización y límites en el backend: la app puede ser modificada por un atacante.', 'Referencia: OWASP MASVS para requisitos de seguridad móvil.']
      ] },
      { t: 'Sincronización offline-first', p: [
        ['Base local (SQLite, Realm) como fuente para la interfaz.', 'Cola de operaciones pendientes con identificador único (idempotencia) que se envían al reconectar.', 'Resolución de conflictos definida por el negocio: las operaciones de dinero nunca se resuelven con "gana el último".', 'Mostrar claramente qué está pendiente de sincronizar.']
      ], code: { lang: 'TypeScript — cola de operaciones pendientes con idempotencia', code: 'type Pendiente = { id: string; tipo: "pago"; payload: unknown; creadoEn: number };\n\nasync function encolar(op: Omit<Pendiente, "id" | "creadoEn">) {\n  const pendiente = { ...op, id: crypto.randomUUID(), creadoEn: Date.now() };\n  await db.insert("pendientes", pendiente); // persiste antes de intentar enviar\n  void sincronizar();\n}\n\nasync function sincronizar() {\n  for (const p of await db.all<Pendiente>("pendientes")) {\n    const r = await fetch("/pagos", { method: "POST", headers: { "Idempotency-Key": p.id }, body: JSON.stringify(p.payload) });\n    if (r.ok || r.status === 409) await db.delete("pendientes", p.id);\n  }\n}' } }
    ],
    recurrentes: [
      { tema: 'Versiones viejas de la app', por: 'Usuarios que no actualizan siguen llamando a la API antigua.', clave: 'Versionado de API, compatibilidad hacia atrás y mecanismo de actualización forzada para versiones inseguras.' },
      { tema: 'Datos sensibles en el dispositivo', por: 'Auditorías de seguridad bancaria lo revisan siempre.', clave: 'Solo en almacenamiento seguro, cifrado y con el mínimo tiempo de vida.' },
      { tema: 'Rendimiento en gama baja', por: 'La app se prueba en teléfonos de gama alta y los clientes usan gama baja.', clave: 'Prueba en dispositivos reales representativos y mide arranque y uso de memoria.' }
    ],
    casos: [
      { titulo: 'Apps con claves de API y secretos embebidos', cuando: 'Recurrente', que: 'Investigaciones públicas han encontrado repetidamente miles de apps móviles con claves de servicios en la nube y secretos de API dentro del binario, extraíbles con herramientas gratuitas.', causa: 'Tratar el binario de la app como si fuera un entorno confiable.', leccion: 'Todo lo que viaja en la app es público: los secretos viven en el backend y la app obtiene credenciales de corta duración por usuario.', fuente: 'Reportes de investigadores de seguridad sobre secretos expuestos en apps móviles (2019 en adelante)' }
    ],
    escenarios: [
      { sintoma: 'Usuarios reportan que la app "cierra sesión sola" al volver de otra app.', pasos: ['Revisar si el SO mató el proceso en segundo plano y el estado de sesión solo estaba en memoria.', 'Verificar la persistencia del refresh token en almacenamiento seguro.', 'Revisar la lógica de restauración al reabrir.'], solucion: 'Persistir de forma segura el estado necesario y restaurar la sesión con el refresh token y biometría.' }
    ]
  }
});
