/* Dominio: Backend */
RoadmapPlus.temas({
  'java-spring': {
    conceptos: [
      ['Inversión de control', 'El contenedor de Spring crea los objetos (beans) y les inyecta dependencias; tu código no hace `new` de sus colaboradores.'],
      ['Inyección por constructor', 'Forma recomendada: dependencias explícitas, campos `final` y fácil de probar sin Spring.'],
      ['Scope de bean', 'Singleton por defecto (una instancia por contexto): no debe guardar estado de un request.'],
      ['Proxy de Spring', '`@Transactional`, `@Cacheable` y `@Async` funcionan envolviendo el bean en un proxy; las llamadas internas (`this.metodo()`) no pasan por él.'],
      ['Propagación transaccional', 'REQUIRED reutiliza la transacción existente; REQUIRES_NEW abre otra independiente.'],
      ['JPA / Hibernate', 'ORM que mapea entidades a tablas; gestiona un contexto de persistencia con caché de primer nivel y dirty checking.'],
      ['Lazy loading', 'Las relaciones se cargan al accederlas; fuera de la transacción provoca LazyInitializationException, y dentro puede causar N+1.'],
      ['Open Session in View', 'Mantener la sesión abierta durante la vista; activo por defecto en Spring Boot y fuente de consultas ocultas. Se recomienda desactivarlo.'],
      ['Actuator', 'Endpoints de salud, métricas e info para operar la aplicación.'],
      ['Virtual threads', 'Hilos ligeros de Java 21 que permiten código bloqueante simple con alta concurrencia de I/O (`spring.threads.virtual.enabled`).'],
      ['GC', 'Recolector de basura: G1 por defecto; ZGC para pausas muy bajas en heaps grandes.'],
      ['Spring Security', 'Cadena de filtros que autentica (JWT, OAuth2, sesión) y autoriza por URL o por método.']
    ],
    profundidad: [
      { t: 'Las trampas de @Transactional', p: [
        ['Solo aplica a métodos públicos llamados desde fuera del bean (por el proxy).', 'Por defecto solo hace rollback con excepciones no verificadas (RuntimeException); una excepción verificada hace commit salvo `rollbackFor`.', 'Una transacción alrededor de una llamada HTTP a otro servicio retiene la conexión a la base durante toda la espera.', '`readOnly = true` permite optimizaciones y evita escrituras accidentales en consultas.'],
        'Regla: la transacción envuelve el caso de uso que modifica datos, es corta y no contiene I/O externo.'
      ] },
      { t: 'JPA sin sorpresas de rendimiento', p: [
        ['Activa el log de SQL (o un contador de consultas) en las pruebas para detectar N+1.', 'Usa `JOIN FETCH` o `@EntityGraph` para cargar relaciones necesarias en una consulta.', 'Para lecturas de pantalla usa proyecciones (DTO o interfaces), no entidades completas.', 'Las operaciones masivas no se hacen entidad por entidad: usa `@Modifying` con JPQL o SQL, o batch inserts.', 'Desactiva `spring.jpa.open-in-view` para que los accesos perezosos fallen en desarrollo en lugar de disparar consultas ocultas.']
      ], code: { lang: 'Java — evitar N+1 con una proyección y un fetch explícito', code: 'public interface MovimientoResumen {\n    Long getId();\n    BigDecimal getMonto();\n    String getCuentaNumero();\n}\n\n@Query("""\n    select m.id as id, m.monto as monto, c.numero as cuentaNumero\n    from Movimiento m join m.cuenta c\n    where c.cliente.id = :clienteId and m.fecha >= :desde\n    order by m.fecha desc\n""")\nList<MovimientoResumen> resumen(Long clienteId, LocalDate desde, Pageable page);' } },
      { t: 'Ajustes de producción de una app Spring Boot', p: [
        ['Pool de conexiones (HikariCP) dimensionado por la base, no por el número de hilos.', 'Timeouts explícitos en todos los clientes HTTP (conexión y lectura).', 'Graceful shutdown activado para no cortar requests en curso durante despliegues.', 'Límites de memoria del contenedor coherentes con el heap (`-XX:MaxRAMPercentage`).', 'Health checks separados: liveness (el proceso vive) y readiness (puede recibir tráfico).']
      ] },
      { t: 'El ecosistema Java en banca', p: [
        'Java domina el backend bancario por estabilidad, tipado fuerte, ecosistema maduro (Spring, Kafka, drivers) y soporte de largo plazo. Las versiones LTS (17, 21, 25) marcan el ritmo de actualización; mantenerse en una LTS soportada es un requisito de seguridad.'
      ] }
    ],
    recurrentes: [
      { tema: '@Transactional que no funciona', por: 'Llamadas internas o excepciones verificadas hacen que no haya rollback.', clave: 'Entiende el proxy: llama desde otro bean y define `rollbackFor` cuando corresponda.' },
      { tema: 'LazyInitializationException', por: 'Acceder a relaciones perezosas fuera de la transacción.', clave: 'Carga lo necesario explícitamente en el caso de uso; no lo arregles con EAGER global.' },
      { tema: 'Memoria del contenedor', por: 'Pods reiniciados por OOMKilled aunque el heap "tenga espacio".', clave: 'La JVM usa memoria fuera del heap (metaspace, hilos, buffers): deja margen y usa porcentajes.' },
      { tema: 'Beans singleton con estado', por: 'Datos de un usuario aparecen en la respuesta de otro.', clave: 'Los beans singleton son compartidos: nada de estado por request en campos.' }
    ],
    casos: [
      { titulo: 'Log4Shell: ejecución remota a través de un log', cuando: 'Dic 2021', que: 'Una vulnerabilidad en Log4j 2 (CVE-2021-44228) permitía ejecutar código remoto con solo hacer que la aplicación registrara una cadena maliciosa como `${jndi:ldap://...}`, por ejemplo en un header User-Agent.', causa: 'La función de lookups de Log4j interpretaba expresiones dentro de los mensajes registrados, incluidas búsquedas JNDI remotas.', leccion: 'Mantén un inventario de dependencias (SBOM) para saber en horas qué sistemas están afectados, y trata toda entrada externa como no confiable incluso al registrarla.', fuente: 'Aviso de Apache Log4j y CVE-2021-44228 (dic. 2021)' }
    ],
    escenarios: [
      { sintoma: 'La latencia p99 sube a varios segundos cada pocos minutos sin aumento de tráfico.', pasos: ['Revisar logs de GC y pausas (`-Xlog:gc`).', 'Medir la tasa de asignación y el uso de heap antes de cada pausa.', 'Buscar cachés en memoria sin límite o colecciones que crecen.'], solucion: 'Acotar cachés, reducir asignaciones en el camino caliente y evaluar G1 ajustado o ZGC.' },
      { sintoma: 'Requests lentos con el pool de Hikari agotado ("Connection is not available").', pasos: ['Ver métricas de Hikari: activas, en espera, tiempo de adquisición.', 'Buscar transacciones que incluyen llamadas HTTP externas.', 'Revisar `open-in-view` y consultas perezosas en la vista.'], solucion: 'Sacar I/O externo de las transacciones, desactivar open-in-view y corregir el N+1.' }
    ]
  },

  'dotnet-backend': {
    conceptos: [
      ['Pipeline de middleware', 'Cadena ordenada de componentes que procesan cada request en ASP.NET Core; el orden importa (autenticación antes que autorización).'],
      ['Lifetimes de DI', 'Singleton (una instancia), Scoped (una por request) y Transient (una por inyección). Inyectar un scoped en un singleton es un bug.'],
      ['async/await', 'Libera el hilo mientras espera I/O. `.Result` o `.Wait()` sobre tareas puede causar bloqueos y agotar el thread pool.'],
      ['DbContext', 'Unidad de trabajo de Entity Framework Core; scoped y no thread-safe.'],
      ['Change tracking', 'EF Core rastrea entidades cargadas; para lecturas usa `AsNoTracking()`.'],
      ['IQueryable vs IEnumerable', 'IQueryable se traduce a SQL; materializar antes (`ToList()`) y filtrar después trae toda la tabla a memoria.'],
      ['Minimal APIs', 'Endpoints declarados sin controladores, con menos ceremonia.'],
      ['Options pattern', 'Configuración tipada y validada (`IOptions<T>`) en lugar de leer strings sueltos.'],
      ['HttpClientFactory', 'Gestiona el ciclo de vida de HttpClient y evita el agotamiento de sockets.'],
      ['CancellationToken', 'Propaga la cancelación del request a las operaciones de I/O.'],
      ['Polly / resiliencia', 'Reintentos, circuit breaker y timeouts declarativos para dependencias externas.']
    ],
    profundidad: [
      { t: 'Errores clásicos con async en .NET', p: [
        ['`async void` solo para manejadores de eventos: sus excepciones no se pueden capturar.', '`Task.Result` y `.Wait()` en código de request bloquean hilos del pool y degradan todo el servicio bajo carga (thread pool starvation).', 'Olvidar `await` deja tareas "fire and forget" cuyos errores se pierden.', 'Propaga el `CancellationToken` hasta EF Core y HttpClient para no seguir trabajando cuando el cliente cancela.']
      ] },
      { t: 'Entity Framework Core en producción', p: [
        ['`AsNoTracking()` en consultas de solo lectura reduce memoria y CPU.', 'Proyecta a DTO con `Select` para traer solo columnas necesarias.', '`Include` encadenados generan productos cartesianos: usa `AsSplitQuery()` cuando cargas varias colecciones.', 'Revisa el SQL generado (`ToQueryString()` o logging) en consultas críticas.', 'Las migraciones se revisan como código y se aplican en el pipeline, no al arrancar la aplicación en producción.']
      ], code: { lang: 'C# — consulta de lectura eficiente con EF Core', code: 'var movimientos = await db.Movimientos\n    .AsNoTracking()\n    .Where(m => m.CuentaId == cuentaId && m.Fecha >= desde)\n    .OrderByDescending(m => m.Fecha)\n    .Select(m => new MovimientoDto(m.Id, m.Monto, m.Descripcion, m.Fecha))\n    .Take(50)\n    .ToListAsync(ct);' } },
      { t: 'HttpClient y resiliencia', p: [
        'Crear un `new HttpClient()` por request agota los sockets disponibles; uno estático ignora cambios de DNS. `IHttpClientFactory` resuelve ambos problemas.',
        ['Configura timeout por cliente y política de reintentos solo para errores transitorios y operaciones idempotentes.', 'Circuit breaker para dejar de golpear una dependencia caída.', 'En .NET 8+ el paquete Microsoft.Extensions.Http.Resilience aplica estrategias estándar.']
      ] }
    ],
    recurrentes: [
      { tema: 'Lifetimes de dependencias', por: 'Un DbContext capturado por un singleton produce errores de concurrencia y datos viejos.', clave: 'Activa la validación de scopes en desarrollo y respeta: singleton nunca depende de scoped.' },
      { tema: 'Thread pool starvation', por: 'Servicios que se congelan bajo carga sin uso alto de CPU.', clave: 'Async de punta a punta, sin `.Result`; diagnosticable con dotnet-counters.' },
      { tema: 'Consultas que traen la tabla entera', por: 'Un `ToList()` antes del `Where` funciona en pruebas y explota en producción.', clave: 'Mantén IQueryable hasta el final y revisa el SQL generado.' }
    ],
    casos: [
      { titulo: 'Stack Overflow escala con pocos servidores', cuando: '2013-2016', que: 'Stack Overflow documentó cómo servía uno de los sitios más visitados del mundo con un monolito .NET y unas pocas decenas de servidores, gracias a medición constante, SQL afinado y caché agresiva.', causa: 'Decisiones guiadas por medición de rendimiento en lugar de seguir arquitecturas de moda.', leccion: 'Un monolito bien medido y optimizado escala mucho más de lo que se suele creer; mide antes de redistribuir.', fuente: 'Serie "Stack Overflow: The Architecture" de Nick Craver (2016)' }
    ],
    escenarios: [
      { sintoma: 'La API deja de responder con CPU baja cuando sube el tráfico.', pasos: ['Revisar con dotnet-counters la cola del thread pool.', 'Buscar `.Result`, `.Wait()` y llamadas síncronas a I/O.', 'Revisar dependencias lentas sin timeout.'], solucion: 'Convertir el camino a async completo, poner timeouts y circuit breaker en dependencias.' }
    ]
  },

  'python-backend': {
    conceptos: [
      ['GIL', 'Global Interpreter Lock de CPython: un solo hilo ejecuta bytecode Python a la vez. Hilos sirven para I/O, no para paralelizar CPU.'],
      ['asyncio', 'Event loop cooperativo: una corrutina cede el control solo en `await`.'],
      ['ASGI vs WSGI', 'WSGI es síncrono (Flask, Django clásico); ASGI soporta async y WebSockets (FastAPI, Starlette, Django async).'],
      ['Pydantic', 'Validación y serialización de datos con type hints; base de los esquemas de FastAPI.'],
      ['Dependencias de FastAPI', 'Sistema de inyección por función (`Depends`) para sesión de base, usuario autenticado, etc.'],
      ['Entorno virtual', 'Aislamiento de dependencias por proyecto (venv, uv, poetry).'],
      ['Lock de dependencias', 'Versiones exactas fijadas (poetry.lock, uv.lock) para builds reproducibles.'],
      ['Type hints + mypy', 'Tipado estático opcional que detecta errores antes de ejecutar.'],
      ['Multiprocessing', 'Varios procesos para paralelizar CPU, esquivando el GIL.'],
      ['Gunicorn / Uvicorn workers', 'Procesos que sirven la aplicación; su número se ajusta a núcleos y tipo de carga.']
    ],
    profundidad: [
      { t: 'Async en Python sin trampas', p: [
        ['Una función `async` que llama a una librería bloqueante (requests, un driver síncrono) bloquea todo el event loop.', 'Usa clientes async (httpx, asyncpg, SQLAlchemy async) o `run_in_executor` para lo bloqueante.', 'En FastAPI, un endpoint definido con `def` (no `async def`) se ejecuta en un pool de hilos: es la opción correcta si usas librerías síncronas.', 'Limita la concurrencia con `asyncio.Semaphore` cuando lanzas muchas tareas contra una dependencia.']
      ], code: { lang: 'Python — llamadas concurrentes acotadas con httpx', code: 'import asyncio, httpx\n\nasync def consultar_saldos(cuentas: list[str]) -> dict[str, float]:\n    limite = asyncio.Semaphore(10)\n    async with httpx.AsyncClient(timeout=3.0) as cliente:\n        async def uno(c: str):\n            async with limite:\n                r = await cliente.get(f"https://core/cuentas/{c}/saldo")\n                r.raise_for_status()\n                return c, r.json()["saldo"]\n        return dict(await asyncio.gather(*(uno(c) for c in cuentas)))' } },
      { t: 'Rendimiento y escalado', p: [
        ['Escala con procesos (workers de Gunicorn/Uvicorn) y réplicas, no con hilos para CPU.', 'Perfila antes de optimizar (cProfile, py-spy en producción).', 'Lleva el trabajo numérico a librerías nativas (NumPy, pandas, Polars).', 'Tareas largas fuera del request: colas como Celery, RQ o Arq.']
      ] },
      { t: 'Calidad en proyectos Python', p: [
        ['Formato y lint automáticos (ruff).', 'Tipado verificado con mypy o pyright en el pipeline.', 'Pruebas con pytest y fixtures; base de datos real con Testcontainers.', 'Dependencias fijadas y escaneadas (pip-audit).']
      ] }
    ],
    recurrentes: [
      { tema: 'El GIL', por: 'Se pregunta en toda entrevista de Python y se malinterpreta a menudo.', clave: 'Hilos para I/O, procesos para CPU; el GIL no impide concurrencia de I/O.' },
      { tema: 'Bloquear el event loop', por: 'Un endpoint async lento afecta a todos los usuarios.', clave: 'Nada bloqueante dentro de `async def`; si no hay alternativa async, usa un executor.' },
      { tema: 'Valores por defecto mutables', por: '`def f(lista=[])` comparte la lista entre llamadas.', clave: 'Usa `None` como valor por defecto y crea el objeto dentro.' }
    ],
    casos: [
      { titulo: 'Instagram desactiva el GC de Python para ahorrar memoria', cuando: '2017', que: 'Instagram publicó que, en su servidor Django con procesos forkeados, desactivar el recolector de basura cíclico mejoró el aprovechamiento de memoria compartida (copy-on-write) y la capacidad por servidor.', causa: 'El GC tocaba objetos compartidos entre procesos y forzaba copias de páginas de memoria.', leccion: 'A escala, entender el runtime (memoria, GC, forks) da mejoras que ninguna optimización de código lograría; mide antes y después.', fuente: 'Blog de ingeniería de Instagram, "Dismissing Python Garbage Collection at Instagram" (2017)' }
    ],
    escenarios: [
      { sintoma: 'Un servicio FastAPI pasa de 20 ms a 2 s de latencia con 50 usuarios concurrentes.', pasos: ['Medir el event loop lag.', 'Buscar llamadas síncronas (requests, psycopg2) dentro de `async def`.', 'Revisar el número de workers.'], solucion: 'Cambiar a clientes async o declarar los endpoints con `def`, y ajustar workers a los núcleos.' }
    ]
  },

  'go-backend': {
    conceptos: [
      ['Goroutine', 'Función concurrente gestionada por el runtime; arranca con pocos KB de pila.'],
      ['Channel', 'Conducto tipado para comunicar goroutines; "no compartas memoria para comunicarte, comunícate para compartir memoria".'],
      ['select', 'Espera sobre varios channels a la vez, incluido el de cancelación.'],
      ['context.Context', 'Propaga cancelación, deadlines y valores de request a través de llamadas.'],
      ['Errores como valores', 'Las funciones devuelven `error`; se envuelve con `fmt.Errorf("...: %w", err)` y se inspecciona con `errors.Is/As`.'],
      ['Interfaces implícitas', 'Un tipo satisface una interfaz sin declararlo; se definen interfaces pequeñas del lado del consumidor.'],
      ['Race detector', '`go test -race` detecta accesos concurrentes no sincronizados.'],
      ['Goroutine leak', 'Goroutines bloqueadas para siempre (sin receptor o sin cancelación) que consumen memoria.'],
      ['pprof', 'Perfilador integrado de CPU, memoria, goroutines y bloqueos.'],
      ['Módulos', 'Gestión de dependencias con go.mod y go.sum.']
    ],
    profundidad: [
      { t: 'Concurrencia en Go sin fugas', p: [
        ['Toda goroutine debe tener una forma de terminar: context cancelado, channel cerrado o trabajo finito.', 'El emisor cierra el channel, nunca el receptor.', 'Usa `errgroup` para lanzar un grupo de tareas y cancelar las demás al primer error.', 'Un `sync.Mutex` es más simple que un channel para proteger un mapa; usa la herramienta más clara.', 'Corre las pruebas con `-race` en CI.']
      ] },
      { t: 'Manejo de errores idiomático', p: [
        ['Agrega contexto al propagar: `fmt.Errorf("debitar cuenta %s: %w", id, err)`.', 'Define errores centinela (`var ErrSaldoInsuficiente = errors.New(...)`) para casos de negocio.', 'No uses `panic` para errores esperados; reserva panic para errores de programación.', 'Registra el error una sola vez, en el borde, no en cada capa.']
      ], code: { lang: 'Go — errores de negocio y contexto', code: 'var ErrSaldoInsuficiente = errors.New("saldo insuficiente")\n\nfunc (s *Servicio) Transferir(ctx context.Context, t Transferencia) error {\n    if err := s.repo.Debitar(ctx, t.Origen, t.Monto); err != nil {\n        return fmt.Errorf("transferir %s: %w", t.ID, err)\n    }\n    return nil\n}\n\n// En el handler HTTP:\nif errors.Is(err, ErrSaldoInsuficiente) {\n    http.Error(w, "saldo insuficiente", http.StatusUnprocessableEntity)\n    return\n}' } },
      { t: 'Servicios HTTP en producción', p: [
        ['El `http.Server` por defecto no tiene timeouts: configura ReadHeaderTimeout, ReadTimeout, WriteTimeout e IdleTimeout.', 'Implementa graceful shutdown con `server.Shutdown(ctx)` al recibir SIGTERM.', 'Reutiliza `http.Client` (tiene pool de conexiones) y define su timeout.', 'Expón pprof solo en un puerto interno.']
      ] }
    ],
    recurrentes: [
      { tema: 'Goroutines que nunca terminan', por: 'La memoria crece lentamente hasta que el pod se reinicia.', clave: 'Cada goroutine con su camino de salida; monitorea el número de goroutines.' },
      { tema: 'Servidores sin timeouts', por: 'Clientes lentos agotan conexiones (slowloris).', clave: 'Configura todos los timeouts del servidor y del cliente.' },
      { tema: 'Captura de variables en bucles', por: 'Era un bug clásico antes de Go 1.22.', clave: 'Desde Go 1.22 cada iteración tiene su propia variable; en versiones anteriores, copia la variable.' }
    ],
    casos: [
      { titulo: 'Discord reescribe un servicio de Go en Rust por la latencia del GC', cuando: '2020', que: 'Discord explicó que su servicio "Read States" en Go tenía picos de latencia periódicos causados por el recolector de basura al recorrer una caché grande en memoria, y lo reescribió en Rust.', causa: 'Una caché LRU enorme en memoria que el GC de Go debía escanear periódicamente.', leccion: 'El GC tiene costos visibles en la latencia de cola con mucho estado en memoria; antes de cambiar de lenguaje, considera reducir el estado en heap o moverlo fuera del proceso.', fuente: 'Blog de Discord, "Why Discord is switching from Go to Rust" (2020)' }
    ],
    escenarios: [
      { sintoma: 'El consumo de memoria de un servicio Go crece sin parar durante días.', pasos: ['Revisar el perfil de goroutines con pprof (`/debug/pprof/goroutine`).', 'Buscar goroutines bloqueadas en envíos o recepciones de channels.', 'Comparar perfiles de heap en el tiempo.'], solucion: 'Agregar cancelación por context y cierre de channels; corregir la goroutine que se filtra.' }
    ]
  },

  'apis-rest-graphql': {
    conceptos: [
      ['Recurso', 'Sustantivo expuesto por la API (`/cuentas/{id}`); los verbos HTTP expresan la acción.'],
      ['Idempotencia HTTP', 'GET, PUT y DELETE son idempotentes; POST no lo es, por eso necesita Idempotency-Key en pagos.'],
      ['Códigos de estado', '2xx éxito, 4xx error del cliente (no reintentar sin cambios), 5xx error del servidor (reintentable con cuidado).'],
      ['Versionado', 'En la URL (`/v1`), en un header o por media type; lo importante es no romper clientes sin aviso.'],
      ['Paginación por cursor', 'El servidor devuelve un cursor opaco para la siguiente página; estable ante inserciones.'],
      ['Problem Details', 'Formato estándar de errores (RFC 9457) con type, title, status y detail.'],
      ['ETag / If-Match', 'Control de concurrencia optimista en HTTP: actualizar solo si el recurso no cambió.'],
      ['Rate limiting', 'Límite de requests por cliente; se comunica con 429 y Retry-After.'],
      ['OpenAPI', 'Contrato de la API en formato estándar; genera documentación, clientes y pruebas.'],
      ['GraphQL resolver', 'Función que resuelve un campo; sin DataLoader produce N+1.'],
      ['DataLoader', 'Agrupa y cachea cargas por request para evitar N+1 en GraphQL.'],
      ['gRPC', 'RPC binario sobre HTTP/2 con contratos Protobuf; eficiente entre servicios internos.']
    ],
    profundidad: [
      { t: 'Diseño de una API de transferencias', p: [
        ['`POST /transferencias` con header `Idempotency-Key`; responde 201 con el recurso o 200 con el original si es un reintento.', 'Validación de negocio con 422 y Problem Details (`/errores/saldo-insuficiente`).', '`GET /transferencias/{id}` para consultar el estado; operaciones largas devuelven 202 y un recurso de estado.', 'Nunca expongas IDs internos secuenciales que permitan enumerar recursos de otros clientes.', 'Autorización por recurso: el token del cliente A no puede leer la transferencia del cliente B (BOLA, el riesgo número uno de OWASP API).']
      ], code: { lang: 'HTTP — error de negocio con Problem Details', code: 'HTTP/1.1 422 Unprocessable Content\nContent-Type: application/problem+json\n\n{\n  "type": "https://api.banco.ejemplo/errores/saldo-insuficiente",\n  "title": "Saldo insuficiente",\n  "status": 422,\n  "detail": "La cuenta no tiene saldo disponible para 1500.00 USD",\n  "instance": "/transferencias/9f1c2e",\n  "saldoDisponible": "1200.00"\n}' } },
      { t: 'Evolucionar una API sin romper clientes', p: [
        ['Cambios compatibles: agregar campos opcionales, nuevos endpoints, nuevos valores tolerados.', 'Cambios incompatibles: renombrar o quitar campos, cambiar tipos o semántica, volver obligatorio algo opcional.', 'Los clientes deben ignorar campos desconocidos (tolerant reader).', 'Para romper: nueva versión, periodo de convivencia y comunicación con fecha de retiro (header Sunset).', 'Pruebas de contrato (Pact, validación contra OpenAPI) en el pipeline detectan roturas antes del despliegue.']
      ] },
      { t: 'REST, GraphQL o gRPC', p: [
        ['**REST**: APIs públicas y de socios, cacheable por HTTP, herramientas universales.', '**GraphQL**: frontends con necesidades de datos variadas; requiere controlar costo de consultas, N+1 y autorización por campo.', '**gRPC**: comunicación interna entre servicios con contratos estrictos, streaming y baja latencia.', 'Un API Gateway o BFF puede exponer REST hacia afuera y usar gRPC hacia adentro.']
      ] }
    ],
    recurrentes: [
      { tema: 'Reintentos de POST', por: 'Timeouts de red generan cobros o transferencias duplicadas.', clave: 'Idempotency-Key obligatoria en operaciones con dinero.' },
      { tema: 'Autorización por objeto (BOLA)', por: 'Es la vulnerabilidad más común en APIs.', clave: 'Verifica en cada endpoint que el recurso pertenece al usuario autenticado, no solo que está autenticado.' },
      { tema: 'Paginación', por: 'Listados que crecen sin límite.', clave: 'Límite máximo de página y cursores para listas grandes.' },
      { tema: 'Cambios incompatibles', por: 'Un campo renombrado rompe la app móvil que no se actualizó.', clave: 'Solo cambios aditivos en una versión; pruebas de contrato.' }
    ],
    casos: [
      { titulo: 'Exposición masiva de datos por una API sin autorización por objeto', cuando: 'Recurrente', que: 'Numerosas filtraciones públicas en empresas de telecomunicaciones, salud y fintech se originaron en APIs que devolvían datos de cualquier cliente cambiando el ID en la URL.', causa: 'Endpoints que verificaban autenticación pero no que el recurso solicitado perteneciera al usuario (BOLA/IDOR).', leccion: 'Autorización a nivel de objeto en cada endpoint, identificadores no enumerables y pruebas automáticas que intenten acceder a recursos ajenos.', fuente: 'OWASP API Security Top 10 (2023), API1: Broken Object Level Authorization' }
    ],
    escenarios: [
      { sintoma: 'Clientes reportan transferencias duplicadas en horas de alta latencia.', pasos: ['Buscar en logs pares de requests iguales del mismo cliente con segundos de diferencia.', 'Verificar si la app reintenta al recibir timeout.', 'Revisar si el endpoint usa clave de idempotencia.'], solucion: 'Implementar Idempotency-Key con restricción única y hacer que el cliente la reutilice en los reintentos.' }
    ]
  }
});
