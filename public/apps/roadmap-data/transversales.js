/* Temas transversales: conceptos que reaparecen en todas las capas del stack */
RoadmapPlus.transversales([
  {
    tema: 'Idempotencia',
    resumen: 'Ejecutar una operación varias veces debe tener el mismo efecto que ejecutarla una vez. En sistemas distribuidos los reintentos son inevitables (timeouts, rebalanceos, doble clic), así que toda operación con efectos debe tolerarlos.',
    capas: ['**API**: header `Idempotency-Key` en POST de pagos y transferencias.', '**Base de datos**: restricción única sobre el identificador de operación; `INSERT ... ON CONFLICT`.', '**Mensajería**: consumidores que registran el ID del evento procesado.', '**Frontend y móvil**: el mismo identificador en cada reintento, generado antes del primer envío.', '**Infraestructura**: scripts y migraciones que se pueden ejecutar dos veces sin daño.'],
    regla: 'Si una operación con efectos puede reintentarse, debe ser idempotente; si no puede serlo, debe poder consultarse su estado antes de reintentar.',
    temas: ['apis-rest-graphql', 'concurrencia-paralelismo', 'mensajeria-kafka-distribuidos', 'ingenieria-banca', 'system-design']
  },
  {
    tema: 'Timeouts, reintentos y backoff',
    resumen: 'Toda llamada remota puede quedarse colgada. Sin timeout, un recurso lento agota hilos y conexiones; con reintentos sin control, una degradación se convierte en caída (retry storm).',
    capas: ['**Clientes HTTP y de base**: timeout de conexión y de lectura siempre definidos.', '**Cadenas de servicios**: timeouts decrecientes de afuera hacia adentro.', '**Reintentos**: solo errores transitorios y operaciones idempotentes, con backoff exponencial y jitter.', '**Protección**: circuit breaker y presupuesto de reintentos.', '**Mensajería**: reintentos acotados y dead letter topic.'],
    regla: 'Ninguna espera sin límite; ningún reintento sin backoff, sin límite ni idempotencia.',
    temas: ['redes-protocolos', 'go-backend', 'dotnet-backend', 'mensajeria-kafka-distribuidos', 'incidentes-troubleshooting']
  },
  {
    tema: 'Consistencia y transacciones',
    resumen: 'Decidir qué datos deben ser exactos en todo momento (saldos) y cuáles pueden estar momentáneamente desactualizados (notificaciones, analítica). La consistencia fuerte cuesta latencia y disponibilidad.',
    capas: ['**Base relacional**: transacciones ACID, aislamiento y locks.', '**Entre servicios**: outbox, sagas y compensaciones en lugar de transacciones distribuidas.', '**Réplicas y cachés**: lag y datos viejos; lee de la primaria tras escribir cuando importa.', '**NoSQL**: niveles de consistencia por operación (quorum).', '**Interfaz**: mostrar estados intermedios (pendiente, procesando).'],
    regla: 'Consistencia fuerte donde un dato viejo causa daño; eventual donde solo causa incomodidad, y que el usuario lo vea reflejado.',
    temas: ['bases-relacionales', 'bases-nosql-cache', 'mensajeria-kafka-distribuidos', 'arquitectura-software', 'system-design']
  },
  {
    tema: 'Caché e invalidación',
    resumen: 'La caché es la palanca de rendimiento más barata y la fuente de bugs más sutil: introduce una segunda copia del dato que puede estar desactualizada.',
    capas: ['**Navegador y CDN**: cabeceras Cache-Control y ETag.', '**Aplicación**: cachés en memoria acotadas.', '**Distribuida**: Redis con TTL, invalidación al escribir y protección contra stampede.', '**Base de datos**: buffer pool, planes cacheados.', '**DNS**: TTL y cachés del runtime.'],
    regla: 'Toda entrada de caché tiene TTL y una respuesta clara a "¿qué pasa si este dato está viejo?".',
    temas: ['bases-nosql-cache', 'performance-caching', 'frontend-web', 'redes-protocolos']
  },
  {
    tema: 'Concurrencia sobre estado compartido',
    resumen: 'El patrón leer-calcular-escribir sin protección produce dinero duplicado, inventario negativo y contadores incorrectos, y solo aparece bajo carga.',
    capas: ['**Proceso**: locks, atómicos y estructuras concurrentes.', '**Réplicas**: la base de datos como árbitro (UPDATE condicionado, FOR UPDATE, versión).', '**Servicios**: idempotencia y ordenamiento por clave.', '**Frontend**: botones que no disparan dos envíos.'],
    regla: 'Protege la invariante en el lugar donde vive el dato, con la herramienta del nivel correcto.',
    temas: ['concurrencia-paralelismo', 'bases-relacionales', 'java-spring', 'go-backend']
  },
  {
    tema: 'Paginación y volumen de datos',
    resumen: 'Todo listado empieza pequeño y crece: sin paginación correcta, consultas y respuestas se degradan con el tiempo.',
    capas: ['**SQL**: keyset en lugar de OFFSET para listados profundos.', '**API**: límite máximo de página y cursores opacos.', '**Frontend**: virtualización de listas largas.', '**Batch**: procesamiento por lotes con checkpoints.'],
    regla: 'Ningún endpoint devuelve colecciones sin límite.',
    temas: ['bases-relacionales', 'apis-rest-graphql', 'frontend-web', 'performance-caching']
  },
  {
    tema: 'Autorización por recurso',
    resumen: 'Estar autenticado no autoriza a ver cualquier cosa. La falla de control de acceso es la categoría número uno de OWASP en aplicaciones y APIs.',
    capas: ['**API**: verificar la pertenencia del recurso en cada endpoint.', '**Datos**: filtros por usuario o tenant aplicados por el servidor; en RAG, también en la búsqueda.', '**Servicios**: identidad propagada y mínimo privilegio.', '**Pruebas**: casos automáticos de acceso cruzado.'],
    regla: 'Cada acceso a un recurso verifica quién lo pide y si le pertenece, en el servidor.',
    temas: ['seguridad-aplicativa-owasp', 'apis-rest-graphql', 'seguridad-redes-linux', 'ia-generativa-agentes']
  },
  {
    tema: 'Observabilidad y correlación',
    resumen: 'Sin un identificador que atraviese todas las capas, diagnosticar un request que pasa por cinco servicios y una cola es adivinar.',
    capas: ['**Logs**: estructurados con trace_id.', '**Métricas**: RED por endpoint con percentiles.', '**Trazas**: propagación de contexto en HTTP y mensajes.', '**Negocio**: métricas de operaciones completadas y rechazadas.', '**Alertas**: sobre SLOs y síntomas de usuario.'],
    regla: 'Todo request y todo evento lleva un identificador de correlación de punta a punta.',
    temas: ['observabilidad-sre', 'incidentes-troubleshooting', 'mensajeria-kafka-distribuidos']
  },
  {
    tema: 'Cambios seguros en producción',
    resumen: 'La mayoría de incidentes siguen a un cambio. Hacer los cambios pequeños, graduales y reversibles reduce tanto la probabilidad como el impacto.',
    capas: ['**Código**: PRs pequeños y feature flags.', '**Despliegue**: canary, blue/green y rollback automático.', '**Base de datos**: migraciones expand/contract.', '**Configuración e infraestructura**: como código, revisada y desplegada gradualmente.', '**Operaciones manuales**: con validación, alcance limitado y doble verificación.'],
    regla: 'Si un cambio no se puede desplegar gradualmente ni revertir rápido, necesita un plan explícito antes de ejecutarse.',
    temas: ['devops-cicd-git', 'fundamentos-sdlc', 'bases-relacionales', 'incidentes-troubleshooting']
  },
  {
    tema: 'Gestión de dependencias y cadena de suministro',
    resumen: 'La mayor parte del código que despliegas no lo escribiste tú: librerías, imágenes base y herramientas de build son superficie de ataque y de fallo.',
    capas: ['**Librerías**: lockfiles, actualizaciones automáticas y escaneo de vulnerabilidades.', '**Imágenes**: base mínima, escaneo y firma.', '**Pipeline**: runners con permisos mínimos y acciones fijadas por versión.', '**Inventario**: SBOM para responder en horas a una vulnerabilidad nueva.'],
    regla: 'Saber qué usas, de dónde viene y cómo actualizarlo rápido.',
    temas: ['seguridad-aplicativa-owasp', 'devops-cicd-git', 'frontend-web', 'java-spring']
  }
]);
