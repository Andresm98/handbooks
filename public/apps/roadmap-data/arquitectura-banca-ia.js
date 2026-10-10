/* Dominios: Arquitectura, Banca e IA */
RoadmapPlus.temas({
  'arquitectura-software': {
    conceptos: [
      ['Monolito modular', 'Un solo desplegable con módulos bien delimitados y dependencias controladas; el punto de partida recomendado.'],
      ['Microservicio', 'Servicio desplegable de forma independiente, dueño de sus datos, alineado a una capacidad de negocio.'],
      ['Bounded context', 'Frontera dentro de la cual un modelo de dominio y su lenguaje son consistentes (DDD).'],
      ['Lenguaje ubicuo', 'Vocabulario compartido entre negocio y código dentro de un contexto.'],
      ['Agregado', 'Conjunto de entidades que se modifica como unidad consistente a través de su raíz.'],
      ['Arquitectura hexagonal', 'El dominio en el centro, con puertos (interfaces) y adaptadores (base, HTTP, colas) intercambiables.'],
      ['Acoplamiento temporal', 'Dependencia de que otro servicio responda ahora; las llamadas síncronas en cadena lo maximizan.'],
      ['Event-driven', 'Servicios que reaccionan a eventos publicados por otros, con menor acoplamiento y consistencia eventual.'],
      ['CQRS', 'Modelos separados para escribir y para leer cuando sus necesidades divergen.'],
      ['Event sourcing', 'El estado se deriva de la secuencia de eventos guardados; auditoría completa a cambio de complejidad.'],
      ['Strangler fig', 'Reemplazar un sistema legado de forma incremental redirigiendo funcionalidades al nuevo.'],
      ['ADR', 'Registro corto de una decisión de arquitectura, sus alternativas y consecuencias.'],
      ['Ley de Conway', 'Los sistemas reflejan la estructura de comunicación de la organización que los construye.']
    ],
    profundidad: [
      { t: 'Cuándo dividir en microservicios (y cuándo no)', p: [
        ['**Señales a favor**: varios equipos bloqueándose en el mismo despliegue, partes con necesidades de escalado o confiabilidad muy distintas, dominios con fronteras claras.', '**Señales en contra**: un solo equipo, dominio aún cambiante, sin capacidad de operar observabilidad, CI/CD y plataforma.', 'Costos reales: red no confiable, consistencia eventual, transacciones distribuidas, depuración entre servicios, versionado de contratos y más infraestructura.', 'Un monolito modular con fronteras bien definidas permite extraer servicios después, cuando duela y no antes.']
      ] },
      { t: 'Arquitectura hexagonal en la práctica', p: [
        ['El dominio no importa nada de frameworks: entidades, reglas y casos de uso puros.', 'Los puertos son interfaces definidas por el dominio (`RepositorioCuentas`, `NotificadorTransferencias`).', 'Los adaptadores implementan esos puertos con tecnología concreta (JPA, Kafka, HTTP).', 'Las pruebas del dominio no necesitan base ni red; las de adaptadores usan Testcontainers.']
      ], code: { lang: 'Estructura — módulo con arquitectura hexagonal', code: 'transferencias/\n├── dominio/\n│   ├── Cuenta.java              # agregado con invariantes\n│   ├── Transferencia.java\n│   └── ReglasLimite.java\n├── aplicacion/\n│   ├── RealizarTransferencia.java   # caso de uso\n│   └── puertos/\n│       ├── RepositorioCuentas.java  # puerto de salida\n│       └── PublicadorEventos.java\n└── infraestructura/\n    ├── web/TransferenciaController.java     # adaptador de entrada\n    ├── persistencia/CuentaJpaRepository.java # adaptador de salida\n    └── mensajeria/KafkaPublicador.java' } },
      { t: 'Comunicación entre servicios', p: [
        ['**Síncrona** (REST, gRPC) cuando el llamador necesita la respuesta para continuar; con timeouts, reintentos idempotentes y circuit breaker.', '**Asíncrona** (eventos) para notificar hechos y desacoplar; con consumidores idempotentes y esquemas versionados.', 'Evita cadenas síncronas largas: la disponibilidad total es el producto de la de cada servicio (5 servicios al 99,9% dan alrededor de 99,5%).', 'Un API Gateway o BFF concentra autenticación, rate limiting y agregación para los clientes.']
      ] },
      { t: 'Documentar decisiones', p: [
        ['ADR por decisión significativa: contexto, opciones, decisión, consecuencias y condición de revisión.', 'Diagramas C4 (contexto, contenedores, componentes) versionados junto al código.', 'Las decisiones se revisan cuando cambian sus supuestos, no por moda.']
      ] }
    ],
    recurrentes: [
      { tema: 'Monolito distribuido', por: 'Microservicios que deben desplegarse juntos y comparten base de datos.', clave: 'Base de datos por servicio, contratos versionados y fronteras por capacidad de negocio.' },
      { tema: 'Base de datos compartida', por: 'Es el atajo más común y el que más acopla.', clave: 'Cada servicio es dueño de sus datos; los demás acceden por API o eventos.' },
      { tema: 'Consistencia entre servicios', por: 'Aparece en todo flujo que cruza fronteras (pago y notificación).', clave: 'Outbox, sagas con compensación e idempotencia; acepta y diseña los estados intermedios.' },
      { tema: 'Elegir arquitectura por moda', por: 'Kubernetes, microservicios y event sourcing "porque sí".', clave: 'Cada decisión con su ADR, sus alternativas y el problema concreto que resuelve.' }
    ],
    casos: [
      { titulo: 'Segment vuelve de 140 microservicios a un monolito', cuando: '2018', que: 'Segment explicó que tenía más de 140 microservicios (uno por destino de datos) y que el costo de mantener cada uno, con librerías compartidas en versiones distintas, frenaba al equipo; los consolidó en un solo servicio.', causa: 'La división multiplicaba el trabajo operativo y de actualización sin aportar independencia real a un equipo pequeño.', leccion: 'La granularidad de los servicios debe responder a la organización y a la carga; con un equipo pequeño, demasiados servicios son puro costo.', fuente: 'Blog de Segment, "Goodbye Microservices: From 100s of problem children to 1 superstar" (2018)' },
      { titulo: 'Netflix migra a la nube tras corromperse su base de datos', cuando: '2008-2016', que: 'Tras una corrupción de base de datos en 2008 que detuvo el envío de DVDs durante días, Netflix migró gradualmente a AWS y a una arquitectura de microservicios, completando la migración en 2016.', causa: 'Un monolito con una base de datos relacional central como punto único de falla y límite de escala.', leccion: 'La migración fue incremental durante años y vino acompañada de inversión en resiliencia (chaos engineering) y herramientas de plataforma.', fuente: 'Blog de Netflix, "Completing the Netflix Cloud Migration" (2016)' }
    ],
    escenarios: [
      { sintoma: 'Cada funcionalidad nueva obliga a coordinar despliegues de 5 microservicios.', pasos: ['Mapear qué servicios cambian juntos y por qué.', 'Revisar si comparten base de datos o modelos de dominio.', 'Revisar si las fronteras siguen procesos técnicos en lugar de capacidades de negocio.'], solucion: 'Redibujar fronteras por capacidad de negocio, fusionar servicios que siempre cambian juntos y desacoplar con eventos y contratos versionados.' }
    ]
  },

  'ingenieria-banca': {
    conceptos: [
      ['Core bancario', 'Sistema central de cuentas, saldos, préstamos y contabilidad; suele ser legado y de alta criticidad.'],
      ['Partida doble', 'Todo movimiento registra un débito y un crédito por el mismo monto; la suma total siempre cuadra.'],
      ['Libro mayor (ledger)', 'Registro inmutable de asientos contables; los errores se corrigen con asientos de reverso, nunca editando.'],
      ['Conciliación', 'Comparar registros de dos sistemas (core vs procesador, banco vs red) para detectar diferencias.'],
      ['Idempotencia transaccional', 'Una transferencia reintentada no debe ejecutarse dos veces.'],
      ['Cut-off', 'Hora de corte tras la cual las operaciones se procesan con la fecha del siguiente día hábil.'],
      ['Batch nocturno', 'Procesos masivos (intereses, cierres, extractos) ejecutados en ventanas definidas.'],
      ['KYC / AML', 'Conocer al cliente y prevenir lavado de activos: verificaciones obligatorias y monitoreo de transacciones.'],
      ['PCI DSS', 'Estándar de seguridad para datos de tarjetas; reduce alcance tokenizando el número de tarjeta.'],
      ['Segregación de funciones', 'Quien desarrolla no aprueba ni ejecuta el pase a producción; quien registra no autoriza.'],
      ['Auditoría inmutable', 'Registro de quién hizo qué y cuándo, que no se puede alterar.'],
      ['RTO / RPO regulatorio', 'Tiempos de recuperación y pérdida de datos máximos exigidos para servicios críticos.']
    ],
    profundidad: [
      { t: 'Modelar dinero correctamente', p: [
        ['Montos en decimal de escala fija o enteros en la unidad mínima, siempre con su moneda.', 'Saldos derivados de un libro mayor de asientos inmutables (partida doble), con saldo materializado para lectura rápida.', 'Correcciones mediante asientos de reverso con referencia al original.', 'Redondeo definido por norma (bancario HALF_EVEN) y aplicado en un solo lugar.', 'Fechas contables y fechas valor distintas de la fecha del sistema.']
      ], code: { lang: 'SQL — asientos de partida doble con verificación', code: 'CREATE TABLE asientos (\n  id            bigserial PRIMARY KEY,\n  operacion_id  uuid NOT NULL,\n  cuenta_id     bigint NOT NULL,\n  debito        numeric(18,2) NOT NULL DEFAULT 0 CHECK (debito >= 0),\n  credito       numeric(18,2) NOT NULL DEFAULT 0 CHECK (credito >= 0),\n  moneda        char(3) NOT NULL,\n  fecha_valor   date NOT NULL,\n  creado_en     timestamptz NOT NULL DEFAULT now(),\n  CHECK ((debito = 0) <> (credito = 0))\n);\n\n-- Invariante: cada operación cuadra\nSELECT operacion_id\nFROM asientos\nGROUP BY operacion_id\nHAVING sum(debito) <> sum(credito);   -- debe devolver 0 filas' } },
      { t: 'Integrar con un core legado', p: [
        ['Capa anticorrupción que traduce el modelo del core al modelo del dominio moderno.', 'El core suele tener ventanas de mantenimiento y procesos batch: diseña colas y estados pendientes.', 'Timeouts ambiguos: si no hubo respuesta, la operación puede haberse ejecutado; consulta el estado antes de reintentar.', 'CDC sobre el core para alimentar sistemas de lectura sin cargarlo con consultas.', 'Reemplazo incremental (strangler) por producto o funcionalidad, nunca en un big bang.']
      ] },
      { t: 'Controles que exige el regulador', p: [
        ['Trazabilidad de extremo a extremo de cada operación (quién, qué, cuándo, desde dónde).', 'Gestión de cambios con aprobación, evidencia de pruebas y segregación de funciones.', 'Planes de continuidad probados con simulacros documentados.', 'Gestión de proveedores críticos y de servicios en la nube.', 'Reporte de incidentes significativos al supervisor en los plazos definidos.']
      ] }
    ],
    recurrentes: [
      { tema: 'Timeouts con el core', por: 'No saber si una transferencia se ejecutó es el caso más delicado de la integración bancaria.', clave: 'Identificador de operación único, consulta de estado antes de reintentar y conciliación posterior.' },
      { tema: 'Conciliaciones que no cuadran', por: 'Diferencias entre sistemas aparecen todos los días.', clave: 'Conciliación automatizada con reglas, cola de excepciones y trazabilidad hasta el asiento.' },
      { tema: 'Migraciones de plataforma', por: 'Son los proyectos de mayor riesgo de un banco.', clave: 'Migración gradual por segmentos, ensayos generales con datos reales y plan de vuelta atrás.' }
    ],
    casos: [
      { titulo: 'TSB: la migración que dejó a millones sin banca en línea', cuando: 'Abr 2018', que: 'TSB migró a la plataforma de su nuevo dueño (Sabadell) en un fin de semana; millones de clientes no pudieron acceder a sus cuentas o vieron datos de otros durante semanas.', causa: 'Migración en un solo evento con pruebas insuficientes de la nueva plataforma y de su capacidad, y una gobernanza que no detectó que no estaba lista.', leccion: 'Las migraciones de core requieren despliegue gradual, ensayos con volumen real y criterios objetivos de preparación; los reguladores británicos multaron a TSB en 2022.', fuente: 'Informe independiente de Slaughter and May para TSB (2019) y resoluciones de FCA/PRA (2022)' },
      { titulo: 'RBS/NatWest: una actualización de batch bloquea pagos durante días', cuando: 'Jun 2012', que: 'Millones de clientes de RBS, NatWest y Ulster Bank no pudieron recibir pagos ni ver saldos correctos durante días, y en Ulster Bank durante semanas.', causa: 'Una actualización fallida del software que programaba los procesos batch nocturnos y una vuelta atrás mal ejecutada que dejó los procesos desordenados.', leccion: 'Los procesos batch son infraestructura crítica: las actualizaciones necesitan pruebas, ensayo del rollback y capacidad para reprocesar en orden; el regulador multó al grupo en 2014.', fuente: 'Resoluciones de la FCA y la PRA sobre RBS, NatWest y Ulster Bank (nov. 2014)' }
    ],
    escenarios: [
      { sintoma: 'Un cliente reporta un débito sin que la transferencia aparezca como completada.', pasos: ['Buscar la operación por su identificador en el servicio, el core y la cola de mensajes.', 'Determinar si hubo timeout y reintento.', 'Revisar la conciliación del día.'], solucion: 'Completar o reversar según el estado real en el core, con asiento de reverso si corresponde, y corregir la lógica de reintento para consultar estado primero.' }
    ]
  },

  'ia-generativa-agentes': {
    conceptos: [
      ['Token', 'Unidad de texto que procesa el modelo; costo y límites de contexto se miden en tokens.'],
      ['Ventana de contexto', 'Todo lo que el modelo ve en una llamada; fuera de ella no existe.'],
      ['Alucinación', 'Respuesta plausible pero falsa; se reduce con contexto, citas y verificación.'],
      ['Embedding', 'Vector que representa el significado de un texto; base de la búsqueda semántica.'],
      ['RAG', 'Recuperar fragmentos relevantes e incluirlos en el contexto antes de generar.'],
      ['Búsqueda híbrida', 'Combinar búsqueda léxica (BM25) y vectorial; mejora con códigos, nombres e IDs.'],
      ['Tool use', 'El modelo solicita ejecutar funciones definidas por la aplicación; el código las ejecuta.'],
      ['Agente', 'Loop en el que el modelo decide qué herramienta usar hasta completar una tarea.'],
      ['MCP', 'Model Context Protocol: estándar para exponer herramientas y datos a aplicaciones con modelos.'],
      ['Salidas estructuradas', 'Respuestas validadas contra un esquema JSON.'],
      ['Evals', 'Pruebas automatizadas de calidad sobre un conjunto de casos de referencia.'],
      ['Prompt injection', 'Instrucciones maliciosas dentro de contenido que el modelo lee.']
    ],
    profundidad: [
      { t: 'Del prototipo a producción', p: [
        ['Golden dataset con casos reales, difíciles y adversarios antes de optimizar el prompt.', 'Evals en CI que bloquean regresiones al cambiar prompt, modelo o recuperación.', 'Trazas por paso: prompt, herramienta, tokens, costo y latencia.', 'Límites de pasos, de tokens y de gasto por usuario.', 'Aprobación humana para acciones irreversibles y registro de auditoría.']
      ] },
      { t: 'Seguridad específica de LLMs', p: [
        ['El contenido recuperado o devuelto por herramientas es dato, no instrucción.', 'Herramientas con mínimo privilegio y con la identidad del usuario final.', 'No combinar datos privados, contenido no confiable y canal de salida sin aprobación.', 'Validar y escapar la salida del modelo antes de usarla en SQL, HTML o comandos.', 'Referencia: OWASP Top 10 for LLM Applications.']
      ] }
    ],
    recurrentes: [
      { tema: 'Evaluar a ojo', por: 'Un prompt "parece mejor" en tres ejemplos y empeora en producción.', clave: 'Golden dataset versionado y evals automáticas con umbral.' },
      { tema: 'Permisos en RAG', por: 'Documentos confidenciales que aparecen en respuestas a quien no debe verlos.', clave: 'Filtrar por permisos en el motor de búsqueda con la identidad del usuario.' },
      { tema: 'Costos que crecen', por: 'Contextos largos y agentes con muchos pasos.', clave: 'Caché de prompts, contexto mínimo, límites de pasos y costo por tarea medido.' }
    ],
    casos: [
      { titulo: 'Un chatbot de aerolínea promete un reembolso inexistente', cuando: 'Feb 2024', que: 'Un tribunal de Canadá obligó a Air Canada a respetar una política de reembolso que su chatbot describió de forma incorrecta a un cliente.', causa: 'El asistente generó información no respaldada por la política vigente y la empresa argumentó sin éxito que el chatbot era responsable de sus propias respuestas.', leccion: 'La empresa responde por lo que dice su asistente: grounding en fuentes oficiales, citas, abstención y revisión de temas con impacto contractual.', fuente: 'Moffatt v. Air Canada, Civil Resolution Tribunal de Columbia Británica (feb. 2024)' }
    ],
    escenarios: [
      { sintoma: 'El asistente interno responde con políticas derogadas.', pasos: ['Revisar si los documentos tienen metadatos de vigencia.', 'Verificar la frecuencia de reindexación y el borrado de versiones antiguas.', 'Revisar los fragmentos recuperados para las preguntas afectadas.'], solucion: 'Indexación incremental con borrado de versiones viejas, filtro por vigencia y casos de prueba de documentos derogados en las evals.' }
    ]
  }
});

/* ---------- Tema nuevo de Arquitectura ---------- */
RoadmapPlus.nuevo({
  id: 'system-design', num: 30, titulo: 'System Design Práctico',
  dominio: 'Arquitectura', resumen: 'Diseñar sistemas completos bajo restricciones reales: requisitos, estimaciones, componentes, datos, escalado y trade-offs, con ejercicios resueltos.',
  nivel: 'Senior', dificultad: 5, tiempoEstimado: '30-45h', prereq: ['arquitectura-software', 'performance-caching', 'mensajeria-kafka-distribuidos'],
  tecnologias: ['Estimaciones', 'Balanceo', 'Caché', 'Particionamiento', 'Colas', 'Consistencia', 'Rate limiting'],
  matriz: { frecuencia: 'Alta', importancia: 'Crítica' },
  c: {
    definicion: 'System design es el proceso de definir la arquitectura, componentes, datos e interfaces de un sistema para cumplir requisitos funcionales y no funcionales (escala, latencia, disponibilidad, costo, seguridad). En entrevistas senior es la prueba central; en el trabajo es lo que diferencia una solución que aguanta la producción de una que no.',
    problema: 'Los sistemas fallan por decisiones tempranas difíciles de revertir: un modelo de datos que no escala, una cadena síncrona frágil, una caché inconsistente o una base que se convierte en cuello de botella. Diseñar explícitamente, con números y trade-offs, evita esos errores antes de escribir código.',
    fundamentos: 'Un buen diseño parte de requisitos claros (funcionales y no funcionales), estima volúmenes (usuarios, requests por segundo, almacenamiento, ancho de banda), elige un modelo de datos según los patrones de acceso y aplica bloques conocidos: balanceadores, caché, colas, réplicas, particionamiento, CDN y rate limiting. Cada decisión implica un trade-off entre consistencia, disponibilidad, latencia, costo y complejidad.',
    arquitectura: 'La mayoría de sistemas comparten una forma: clientes → CDN y balanceador → API gateway → servicios sin estado → caché → bases de datos (primaria, réplicas, particiones) → colas y workers para trabajo asíncrono → almacenamiento de objetos → observabilidad transversal. El diseño consiste en dimensionar y conectar estas piezas según el problema.',
    funcionamiento: 'En una sesión de diseño se aclaran requisitos, se hacen estimaciones aproximadas, se propone un diseño de alto nivel, se profundiza en los componentes críticos (modelo de datos, flujo principal, puntos de falla) y se discuten trade-offs y evolución. Se razona en voz alta y se justifica cada elección con números.',
    buenas: ['Aclarar requisitos y restricciones antes de dibujar.', 'Estimar órdenes de magnitud y usarlos para decidir.', 'Empezar simple y escalar las partes que lo necesitan.', 'Identificar puntos únicos de falla y cuellos de botella.', 'Hacer explícitos los trade-offs.'],
    malas: ['Saltar directo a tecnologías de moda.', 'Diseñar para millones de usuarios sin que exista el requisito.', 'Ignorar el modelo de datos.', 'Olvidar seguridad, observabilidad y operación.', 'No considerar qué pasa cuando falla cada componente.'],
    errores: ['No distinguir lecturas de escrituras al dimensionar.', 'Suponer consistencia fuerte en todo sin necesitarla.', 'Olvidar la idempotencia en flujos con reintentos.'],
    patrones: ['Cache-aside', 'Réplicas de lectura', 'Particionamiento por clave', 'Cola + workers', 'Fan-out on write / on read', 'Rate limiting por token bucket', 'Outbox'],
    antipatrones: ['Diseño sin números', 'Una base de datos para todo sin analizar patrones de acceso', 'Cadenas síncronas largas entre servicios'],
    ejemploReal: 'Un acortador de URLs con 100 millones de enlaces nuevos al mes y 100 lecturas por escritura necesita unas 40 escrituras y 4.000 lecturas por segundo en promedio: el diseño se concentra en caché de lecturas y en generar identificadores únicos cortos sin coordinación costosa.',
    ejemploBanca: 'Diseñar un sistema de notificaciones de transacciones para millones de clientes implica eventos desde el core, una cola por canal (push, SMS, correo), preferencias de cliente, deduplicación, reintentos con proveedores y trazabilidad para reclamos.',
    ejemploEmpresarial: 'Sistemas como los de pagos, mensajería o feeds de redes sociales son casos clásicos de system design por sus requisitos combinados de escala, latencia y consistencia.',
    comparacion: { headers: ['Decisión', 'Opción A', 'Opción B', 'Criterio'], rows: [['Consistencia', 'Fuerte', 'Eventual', '¿Un dato viejo causa daño (saldo) o solo incomodidad (likes)?'], ['Comunicación', 'Síncrona', 'Asíncrona', '¿El llamador necesita el resultado ahora?'], ['Escalado de lecturas', 'Caché', 'Réplicas', 'Tasa de acierto y tolerancia a datos viejos'], ['Datos', 'Relacional', 'NoSQL', 'Relaciones, transacciones y patrones de acceso']] },
    ventajas: ['Sistemas que aguantan la producción', 'Decisiones justificadas y comunicables', 'Preparación para roles senior y de arquitectura'],
    desventajas: ['Requiere amplitud técnica', 'Sin práctica, las entrevistas se sienten abrumadoras'],
    faq: [
      { q: '¿Necesito memorizar números?', a: 'Órdenes de magnitud: lectura de memoria en nanosegundos, ida y vuelta en un datacenter en menos de un milisegundo, entre continentes del orden de 100 ms, un día tiene unos 86.400 segundos.' },
      { q: '¿Qué evalúan en una entrevista de system design?', a: 'Cómo aclaras requisitos, si razonas con números, la calidad de los trade-offs y la profundidad en las partes críticas; no hay una única respuesta correcta.' },
      { q: '¿Cómo practico?', a: 'Diseña sistemas conocidos en voz alta con un temporizador de 45 minutos y compáralos con diseños publicados por las empresas.' }
    ],
    codigo: { lang: 'Estimación — servicio de extractos bancarios', code: 'Usuarios activos mensuales: 2.000.000\nExtractos consultados por usuario/mes: 3       -> 6.000.000 consultas/mes\nPromedio: 6.000.000 / (30 * 86.400) ≈ 2,3 rps\nPico (día 1 del mes, factor 20):     ≈ 46 rps\nTamaño por extracto PDF: 200 KB\nAlmacenamiento por mes: 2.000.000 * 200 KB ≈ 400 GB  -> ~4,8 TB/año\n\nConclusiones:\n- El cómputo es pequeño; el desafío es el almacenamiento y el pico del día 1.\n- Generar PDFs por adelantado en batch y guardarlos en object storage.\n- Servir con URLs firmadas de corta duración; metadatos en la base relacional.' }
  },
  entrevistas: [
    { nivel: 'Semi Senior', pregunta: '¿Cómo diseñarías un acortador de URLs?', respuesta: 'Requisitos y estimaciones; generación de IDs únicos (contador por rangos o base62 de un ID), tabla clave-valor, caché para lecturas calientes, redirección 301/302 y análisis asíncrono de clics.' },
    { nivel: 'Semi Senior', pregunta: '¿Cómo implementarías un rate limiter?', respuesta: 'Token bucket o ventana deslizante por cliente en Redis con operaciones atómicas, respondiendo 429 con Retry-After; en el gateway para protegerlo todo.' },
    { nivel: 'Senior', pregunta: '¿Cómo diseñarías un sistema de notificaciones para millones de usuarios?', respuesta: 'Eventos de origen, servicio de preferencias, colas por canal, workers que llaman a proveedores con reintentos e idempotencia, deduplicación, plantillas y métricas de entrega por canal.' },
    { nivel: 'Senior', pregunta: '¿Cómo diseñarías un sistema de pagos entre cuentas?', respuesta: 'API idempotente, libro mayor de partida doble, validación de límites y fraude, transacción local con outbox, integración con redes externas vía saga, conciliación diaria y auditoría inmutable.' },
    { nivel: 'Senior', pregunta: '¿Cómo escalarías las lecturas de un sistema con 95% de lecturas?', respuesta: 'Caché con TTL y estrategia de invalidación, réplicas de lectura con manejo de lag y CDN para lo estático o público.' },
    { nivel: 'Staff/Arquitecto', pregunta: '¿Cómo diseñarías la disponibilidad de un servicio crítico ante la caída de una región?', respuesta: 'Definir RTO y RPO, replicación de datos entre regiones según el RPO, servicios sin estado desplegados en ambas, DNS o tráfico global con health checks, y simulacros de failover.' },
    { nivel: 'Staff/Arquitecto', pregunta: '¿Cómo particionarías una tabla de movimientos de miles de millones de filas?', respuesta: 'Partición por rango de fecha para mantenimiento y archivo, y si hace falta sharding por cliente para distribuir carga, considerando consultas, reportería y rebalanceo.' },
    { nivel: 'Staff/Arquitecto', pregunta: '¿Qué trade-offs presentarías al elegir entre consistencia fuerte y eventual para saldos?', respuesta: 'Para autorizar débitos, consistencia fuerte sobre la cuenta; para mostrar históricos o analíticas, eventual es aceptable. Se separan los caminos según el riesgo de cada lectura.' }
  ],
  ejercicios: ['Diseña en 45 minutos un sistema de transferencias inmediatas y escribe el documento con estimaciones y trade-offs.', 'Diseña un rate limiter distribuido y explica su comportamiento ante la caída de Redis.', 'Diseña un servicio de extractos con picos de fin de mes y calcula almacenamiento y costo.'],
  proyecto: { titulo: 'Portafolio de diseños', desc: 'Cuatro documentos de diseño (pagos, notificaciones, extractos, rate limiter) con requisitos, estimaciones, diagrama C4, modelo de datos, puntos de falla, trade-offs y plan de evolución, revisados por un par.', tech: ['C4', 'ADR', 'Estimaciones', 'Diagramas'] },
  checklist: ['Aclaro requisitos funcionales y no funcionales', 'Hago estimaciones de tráfico y almacenamiento', 'Elijo el modelo de datos según los patrones de acceso', 'Uso caché, colas, réplicas y particiones con criterio', 'Identifico puntos únicos de falla', 'Explico trade-offs de consistencia y disponibilidad', 'Diseño para idempotencia y reintentos'],
  recursos: [{ kind: 'Libro', label: 'Designing Data-Intensive Applications — Martin Kleppmann' }, { kind: 'Libro', label: 'System Design Interview — Alex Xu' }, { kind: 'Colección', label: 'Blogs de ingeniería de empresas (arquitecturas publicadas)' }],
  relacionados: ['arquitectura-software', 'performance-caching', 'mensajeria-kafka-distribuidos', 'ingenieria-banca'],
  plus: {
    conceptos: [
      ['Requisitos no funcionales', 'Latencia, disponibilidad, escala, durabilidad, seguridad y costo esperados.'],
      ['Estimación aproximada', 'Cálculo de órdenes de magnitud (rps, GB/día) para orientar el diseño.'],
      ['Punto único de falla', 'Componente cuya caída detiene todo el sistema.'],
      ['Escalado horizontal', 'Agregar instancias; requiere servicios sin estado.'],
      ['Particionamiento', 'Dividir datos por clave entre nodos; la clave decide la distribución de carga.'],
      ['Hash consistente', 'Distribución de claves que minimiza el movimiento al agregar o quitar nodos.'],
      ['Replicación', 'Copias de datos para disponibilidad y lecturas; síncrona o asíncrona.'],
      ['Fan-out', 'Distribuir un evento a muchos destinatarios, al escribir o al leer.'],
      ['Token bucket', 'Algoritmo de rate limiting que permite ráfagas hasta la capacidad del balde.'],
      ['Durabilidad', 'Garantía de que un dato confirmado no se pierde.'],
      ['Disponibilidad compuesta', 'La de una cadena de dependencias es el producto de sus disponibilidades.'],
      ['Degradación controlada', 'Seguir prestando la función principal cuando falla una secundaria.']
    ],
    profundidad: [
      { t: 'Plantilla de 45 minutos', p: [
        ['**5 min — Requisitos**: funciones principales, usuarios, volúmenes, latencia y disponibilidad esperadas, qué está fuera de alcance.', '**5 min — Estimaciones**: rps promedio y pico, lecturas frente a escrituras, almacenamiento por año.', '**10 min — Alto nivel**: componentes y flujo principal.', '**15 min — Profundidad**: modelo de datos, el componente más difícil, consistencia y fallos.', '**10 min — Trade-offs y evolución**: qué sacrificaste, cuellos de botella futuros, monitoreo.']
      ] },
      { t: 'Números que conviene tener a mano', p: [
        ['Un día tiene unos 86.400 segundos: 1 millón de requests diarios son unos 12 rps de promedio.', 'Lectura de memoria: nanosegundos; lectura de SSD: decenas de microsegundos; ida y vuelta en un datacenter: menos de 1 ms; entre continentes: del orden de 100 ms.', 'Una base relacional bien afinada en un servidor maneja miles de transacciones simples por segundo.', 'Redis atiende del orden de cien mil operaciones por segundo por instancia.', 'Disponibilidad: 99,9% son unos 43 minutos de caída al mes; 99,99% unos 4 minutos.']
      ] },
      { t: 'Ejercicio resuelto: transferencias inmediatas', p: [
        ['**Requisitos**: transferir entre cuentas propias y a otros bancos; confirmación en menos de 2 s; nunca duplicar ni perder dinero; auditoría completa.', '**Estimación**: 5 millones de transferencias diarias ≈ 60 rps promedio y unos 600 en pico de quincena.', '**Diseño**: API con Idempotency-Key → servicio de transferencias (validación de límites y fraude síncrona) → transacción local con asientos de partida doble y outbox → evento a Kafka → integración con la red interbancaria (saga con estados pendiente, confirmada, rechazada, reversada) → notificaciones.', '**Fallos**: timeout con la red externa deja la operación pendiente y se consulta su estado; nunca se reintenta a ciegas.', '**Trade-off**: la transferencia interna es fuertemente consistente; la externa es eventualmente consistente con estados visibles para el cliente.']
      ] }
    ],
    recurrentes: [
      { tema: 'Idempotencia en cada flujo con reintentos', por: 'Todo diseño de pagos o mensajería la necesita.', clave: 'Identificador de operación único y restricción única en el almacenamiento.' },
      { tema: 'Lecturas frente a escrituras', por: 'Diseñar sin distinguirlas lleva a escalar lo equivocado.', clave: 'Calcula la proporción y escala cada camino por separado.' },
      { tema: 'Qué pasa si esto falla', por: 'Es la pregunta favorita de todo entrevistador.', clave: 'Recorre cada componente del diagrama y define su comportamiento ante la caída.' }
    ],
    casos: [
      { titulo: 'Amazon Prime Video: del diseño distribuido al monolito', cuando: '2023', que: 'Un servicio de monitoreo de calidad de video diseñado con funciones serverless y orquestación por pasos se rediseñó como un solo proceso en contenedores, reduciendo el costo más de un 90%.', causa: 'El diseño original pagaba orquestación y transferencia de datos por cada frame, lo que no escalaba en costo.', leccion: 'En system design, el costo por unidad de trabajo es un requisito no funcional más; hay que estimarlo desde el principio.', fuente: 'Prime Video Tech Blog (2023)' }
    ],
    escenarios: [
      { sintoma: 'En una entrevista te piden diseñar "un WhatsApp" y te bloqueas.', pasos: ['Acotar: mensajes uno a uno, estado de entrega, sin llamadas ni grupos grandes.', 'Estimar usuarios activos, mensajes por día y tamaño.', 'Dibujar el flujo de un mensaje: conexión persistente, servicio de mensajes, almacenamiento, entrega y confirmación.'], solucion: 'Reducir el alcance explícitamente y profundizar en el flujo principal y en cómo se entrega un mensaje a un usuario desconectado.' }
    ]
  }
});
