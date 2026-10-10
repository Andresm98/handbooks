/* Dominio: Datos */
RoadmapPlus.temas({
  'bases-relacionales': {
    conceptos: [
      ['ACID', 'Atomicidad, Consistencia, Aislamiento y Durabilidad: las cuatro garantías de una transacción. Durabilidad se implementa con el WAL (write-ahead log).'],
      ['Índice B-tree', 'Árbol balanceado ordenado por la(s) columna(s) indexadas. Sirve para igualdad, rangos y ORDER BY; búsqueda en O(log n).'],
      ['Índice compuesto', 'Índice sobre varias columnas. Solo se aprovecha de izquierda a derecha: (a, b, c) sirve para filtrar por a o por a+b, no por b sola.'],
      ['Índice cubriente', 'Contiene todas las columnas que pide la consulta, así el motor responde sin leer la tabla (index-only scan / INCLUDE).'],
      ['Selectividad', 'Fracción de filas que devuelve un filtro. Un índice sobre una columna poco selectiva (estado = ACTIVO en el 95% de filas) casi nunca se usa.'],
      ['Plan de ejecución', 'Cómo decide el optimizador resolver la consulta (seq scan, index scan, nested loop, hash join). Se inspecciona con `EXPLAIN (ANALYZE, BUFFERS)`.'],
      ['MVCC', 'Multi-Version Concurrency Control: cada transacción ve una instantánea consistente; lectores no bloquean a escritores. Base de PostgreSQL, Oracle y del modo RCSI de SQL Server.'],
      ['Niveles de aislamiento', 'Read Uncommitted, Read Committed, Repeatable Read, Serializable. Cada nivel prohíbe más anomalías (lectura sucia, no repetible, fantasma, write skew).'],
      ['Deadlock', 'Dos transacciones esperan locks que tiene la otra. El motor aborta una; la aplicación debe reintentar y adquirir locks en orden consistente.'],
      ['Bloqueo optimista', 'Columna `version` que se compara en el UPDATE; si cambió, alguien escribió antes y se reintenta. Ideal con baja contención.'],
      ['Bloqueo pesimista', '`SELECT ... FOR UPDATE` bloquea las filas hasta el commit. Necesario cuando la contención es alta y el conflicto es caro (saldos).'],
      ['N+1 queries', 'Cargar una lista y luego una consulta por cada elemento. Típico de ORMs con carga perezosa; se resuelve con JOIN, batch o fetch join.'],
      ['Paginación keyset', 'Paginar con `WHERE id > :ultimo ORDER BY id LIMIT n` en vez de OFFSET. Costo constante y estable ante inserciones.'],
      ['Connection pool', 'Conjunto acotado de conexiones reutilizadas (HikariCP, pgbouncer). Cada conexión de PostgreSQL es un proceso: más no es mejor.']
    ],
    profundidad: [
      { t: 'Cómo decide el optimizador y por qué ignora tu índice', p: [
        'El optimizador estima el costo de cada plan con estadísticas (número de filas, distribución de valores, correlación física). Si estima que el filtro devuelve mucho, un escaneo secuencial es más barato que saltar por el índice y luego a la tabla.',
        ['Estadísticas desactualizadas tras cargas masivas: ejecuta `ANALYZE` (PostgreSQL) o `UPDATE STATISTICS` (SQL Server).', 'Funciones sobre la columna (`WHERE DATE(fecha) = ...`, `LOWER(email)`) anulan el índice salvo que exista un índice funcional.', 'Conversión implícita de tipos (comparar `varchar` con un parámetro `nvarchar` en SQL Server) provoca scans.', 'Parameter sniffing (SQL Server): el plan se compila con el primer valor y se reutiliza para valores con selectividad muy distinta.'],
        'Lee el plan de abajo hacia arriba y compara filas estimadas contra reales: una diferencia de órdenes de magnitud indica estadísticas malas o un predicado que el optimizador no entiende.'
      ], code: { lang: 'SQL — diagnóstico de una consulta lenta (PostgreSQL)', code: 'EXPLAIN (ANALYZE, BUFFERS)\nSELECT id, monto, fecha\nFROM movimientos\nWHERE cuenta_id = 42\n  AND fecha >= now() - interval \'30 days\'\nORDER BY fecha DESC\nLIMIT 50;\n\n-- Índice que convierte el plan en un Index Scan sin ordenamiento extra:\nCREATE INDEX CONCURRENTLY ix_mov_cuenta_fecha\n  ON movimientos (cuenta_id, fecha DESC) INCLUDE (monto);' } },
      { t: 'Aislamiento, MVCC y anomalías que sí ocurren en producción', p: [
        'Read Committed (el valor por defecto en PostgreSQL y SQL Server) evita lecturas sucias pero permite la **pérdida de actualización**: dos procesos leen saldo 100, ambos restan 30 y ambos escriben 70.',
        ['Solución 1: actualización atómica en SQL (`UPDATE cuentas SET saldo = saldo - 30 WHERE id = 1 AND saldo >= 30`).', 'Solución 2: `SELECT ... FOR UPDATE` dentro de la transacción.', 'Solución 3: bloqueo optimista con versión y reintento.', 'Solución 4: nivel Serializable con reintento ante error de serialización (SQLSTATE 40001).'],
        '**Write skew**: dos transacciones leen el mismo conjunto, toman decisiones válidas por separado y juntas violan una regla (dos médicos de guardia se dan de baja a la vez). Solo Serializable o un lock explícito sobre el conjunto lo evita.'
      ] },
      { t: 'Transacciones: alcance, duración y efectos colaterales', p: [
        'Una transacción larga retiene locks, impide que el VACUUM de PostgreSQL limpie versiones viejas (bloat) y aumenta la probabilidad de deadlocks.',
        ['Nunca llames a una API externa ni esperes input del usuario dentro de una transacción de base de datos.', 'Mantén el orden de acceso a tablas consistente en todo el código para evitar deadlocks.', 'Usa el patrón outbox para publicar eventos: escribe el evento en una tabla dentro de la misma transacción y publícalo después.', 'En Spring, `@Transactional` en un método llamado desde la misma clase no se aplica (proxy): un error clásico.']
      ] },
      { t: 'Migraciones de esquema sin downtime (expand / contract)', p: [
        'Un `ALTER TABLE` que reescribe la tabla o toma un lock exclusivo puede detener producción. La técnica estándar divide el cambio en pasos compatibles hacia atrás:',
        ['**Expand**: agregar columna nullable o tabla nueva; desplegar código que escribe en ambas.', '**Migrate**: backfill por lotes pequeños con pausas, fuera del lock principal.', '**Switch**: el código lee de la nueva estructura.', '**Contract**: eliminar la columna vieja en un despliegue posterior.'],
        'En PostgreSQL crea índices con `CONCURRENTLY`; agregar una columna con valor por defecto constante es instantáneo desde la versión 11, pero agregar `NOT NULL` a una columna existente requiere validar toda la tabla (usa `CHECK ... NOT VALID` y luego `VALIDATE`).'
      ] },
      { t: 'Escalar una base relacional', p: [
        ['**Primero**: índices correctos, consultas sin N+1, pool bien dimensionado y caché de lecturas calientes.', '**Réplicas de lectura**: escalan lecturas, pero introducen lag de replicación (leer tu propia escritura falla si lees de la réplica).', '**Particionamiento** (por rango de fecha en tablas de movimientos): consultas y mantenimiento sobre particiones pequeñas; borrar datos históricos es un `DROP PARTITION`.', '**Sharding**: dividir por clave (cliente) en varias bases. Último recurso: complica JOINs, transacciones y reportería.'],
        'Regla práctica: una sola instancia bien afinada de PostgreSQL o SQL Server soporta miles de transacciones por segundo; la mayoría de problemas de "escala" son consultas e índices.'
      ] }
    ],
    recurrentes: [
      { tema: 'El problema N+1 en ORMs', por: 'Aparece en cada code review de JPA/Hibernate, Entity Framework o Django; en desarrollo pasa desapercibido con 10 filas.', clave: 'Activa el log de SQL en desarrollo y cuenta consultas por request; usa fetch join, `Include()` o `select_related` deliberadamente.' },
      { tema: 'Índice compuesto: orden de columnas', por: 'Es la pregunta de entrevista de bases de datos más frecuente y la causa de muchos índices inútiles.', clave: 'Columnas de igualdad primero, luego la de rango u ordenamiento: `(cuenta_id, fecha)` sirve para "movimientos de la cuenta X en un rango".' },
      { tema: 'Concurrencia sobre saldos', por: 'Todo sistema financiero tiene que resolver dos débitos simultáneos sobre la misma cuenta.', clave: 'Actualización atómica condicionada o `FOR UPDATE`; nunca leer-calcular-escribir sin protección.' },
      { tema: 'Paginación OFFSET en tablas grandes', por: 'Las pantallas de historial y las APIs listas siempre empiezan con OFFSET y se degradan al crecer.', clave: 'OFFSET 100000 lee y descarta 100000 filas: usa keyset/cursor para listados profundos.' },
      { tema: 'Deadlocks intermitentes', por: 'Surgen con carga real, nunca en pruebas unitarias, y generan errores esporádicos difíciles de reproducir.', clave: 'Orden de acceso consistente, transacciones cortas, índices en las FKs y reintento automático del error de deadlock.' },
      { tema: 'Lag de réplicas de lectura', por: 'Al añadir réplicas para escalar, aparecen bugs de "guardé y no lo veo".', clave: 'Lee de la primaria después de escribir (read-your-writes) o enruta por sesión durante unos segundos.' }
    ],
    casos: [
      { titulo: 'GitLab borra su base de datos de producción', cuando: 'Ene 2017', que: 'Durante un incidente de replicación, un ingeniero ejecutó un borrado del directorio de datos en el servidor primario creyendo que estaba en el secundario. Se perdieron unas 6 horas de datos (issues, merge requests, comentarios).', causa: 'Acción manual bajo presión en el servidor equivocado, y cinco mecanismos de respaldo que no funcionaban o no se habían verificado (los dumps fallaban silenciosamente).', leccion: 'Un backup que nunca se restauró no es un backup: automatiza y prueba restauraciones periódicamente, distingue visualmente los entornos y limita acciones destructivas manuales.', fuente: 'Postmortem público de GitLab (feb. 2017)' },
      { titulo: 'Uber migra de PostgreSQL a MySQL', cuando: '2016', que: 'Uber publicó por qué migró su capa de almacenamiento: con su patrón de escrituras, PostgreSQL generaba amplificación de escrituras en índices y replicación costosa a través de centros de datos.', causa: 'El diseño de actualizaciones de PostgreSQL (nueva versión de tupla e índices) frente a su caso de muchas actualizaciones y muchos índices secundarios.', leccion: 'No hay base "mejor" en abstracto: el patrón de acceso decide. Entiende el modelo de almacenamiento del motor antes de escalar.', fuente: 'Blog de ingeniería de Uber, "Why Uber Engineering Switched from Postgres to MySQL" (2016)' },
      { titulo: 'Failover de MySQL en GitHub tras 43 segundos de partición', cuando: 'Oct 2018', que: 'Una partición de red de 43 segundos entre la costa este y un centro de datos provocó que el orquestador promoviera primarios en otra región; al recuperarse, había escrituras en ambos lados. El servicio estuvo degradado unas 24 horas.', causa: 'Failover automático entre regiones sin considerar la latencia y la divergencia de datos que produciría.', leccion: 'La alta disponibilidad automática también puede causar incidentes: define qué escenarios justifican failover entre regiones y cómo se reconcilian datos divergentes.', fuente: 'Análisis de incidente publicado por GitHub (oct. 2018)' }
    ],
    escenarios: [
      { sintoma: 'Una consulta que tardaba 50 ms ahora tarda 8 s, sin cambios de código.', pasos: ['Comparar el plan actual con `EXPLAIN ANALYZE`: ¿pasó de Index Scan a Seq Scan?', 'Revisar si hubo una carga masiva reciente y estadísticas desactualizadas.', 'Verificar si cambió la distribución de datos (un cliente con 10 millones de filas).', 'En SQL Server, sospechar de parameter sniffing y revisar el plan en caché.'], solucion: 'Actualizar estadísticas, crear o ajustar el índice compuesto adecuado y, si es sniffing, recompilar o usar planes optimizados por valor.' },
      { sintoma: 'Errores esporádicos "deadlock detected" en el servicio de transferencias bajo carga.', pasos: ['Obtener el grafo del deadlock (log de PostgreSQL o Extended Events en SQL Server).', 'Identificar las dos sentencias y el orden en que bloquean filas o tablas.', 'Revisar si faltan índices en claves foráneas que provocan locks más amplios.'], solucion: 'Adquirir locks en orden determinista (por ejemplo, la cuenta de menor id primero), acortar la transacción y reintentar automáticamente ante deadlock.' },
      { sintoma: 'El pool de conexiones se agota y los requests esperan 30 s.', pasos: ['Medir conexiones activas frente al tamaño del pool y el tiempo de espera de adquisición.', 'Buscar transacciones abiertas largas (`pg_stat_activity`, estado idle in transaction).', 'Revisar llamadas externas dentro de transacciones o fugas de conexiones no devueltas.'], solucion: 'Cerrar transacciones antes de llamadas externas, corregir la fuga, poner timeouts de statement y de idle-in-transaction, y dimensionar el pool con la fórmula de núcleos, no "lo más grande posible".' }
    ]
  },

  'bases-nosql-cache': {
    conceptos: [
      ['Modelo documento', 'Datos como documentos JSON/BSON con estructura flexible (MongoDB). Se modela según cómo se leen los datos, no normalizando.'],
      ['Clave-valor', 'Acceso por clave en O(1) (Redis, DynamoDB). Sin consultas ad hoc: el patrón de acceso se diseña de antemano.'],
      ['Columnar ancho', 'Filas con columnas dinámicas agrupadas por clave de partición (Cassandra, ScyllaDB). Escrituras masivas y lecturas por partición.'],
      ['Clave de partición', 'Determina en qué nodo vive el dato. Una mala clave genera particiones calientes que concentran toda la carga.'],
      ['Teorema CAP', 'Ante una partición de red, un sistema distribuido elige entre consistencia y disponibilidad. Sin partición, el trade-off real es latencia frente a consistencia (PACELC).'],
      ['Consistencia eventual', 'Las réplicas convergen con el tiempo; una lectura puede devolver un valor viejo. Aceptable para catálogos, no para saldos.'],
      ['Quorum', 'Lecturas y escrituras confirmadas por mayoría de réplicas (R + W > N) para leer lo último escrito.'],
      ['Cache-aside', 'La aplicación lee de la caché; si falla, lee de la base y guarda en caché. El patrón más común y el más fácil de razonar.'],
      ['Write-through / write-behind', 'Escribir en caché y base a la vez (through) o en caché y luego en base asíncronamente (behind, riesgo de pérdida).'],
      ['TTL', 'Tiempo de vida de una entrada. Toda clave de caché debe tener TTL salvo razón explícita.'],
      ['Política de expulsión', 'Qué se elimina cuando la memoria se llena (LRU, LFU, allkeys vs volatile en Redis).'],
      ['Cache stampede', 'Muchas peticiones a la vez encuentran la caché vacía y golpean la base al mismo tiempo.'],
      ['Persistencia de Redis', 'RDB (snapshots) y AOF (log de operaciones). Redis como caché puede perder datos; como almacén primario requiere configurarlo.']
    ],
    profundidad: [
      { t: 'Modelar NoSQL desde las consultas', p: [
        'En relacional normalizas y luego consultas como quieras. En NoSQL primero enumeras los patrones de acceso ("movimientos de una cuenta por fecha", "perfil por id de cliente") y diseñas claves e índices para cada uno.',
        ['Embebe datos que se leen juntos y tienen relación 1:pocos (direcciones dentro del cliente).', 'Referencia datos que crecen sin límite (movimientos) o que se comparten.', 'Duplica datos de forma deliberada para evitar joins, asumiendo el costo de mantenerlos sincronizados.', 'En DynamoDB, el diseño de tabla única con claves compuestas (PK/SK) sirve varios patrones de acceso en una tabla.'],
        'Señal de alarma: si necesitas joins y transacciones multi-entidad por todas partes, probablemente el problema es relacional.'
      ] },
      { t: 'Invalidación de caché: el problema difícil', p: [
        'Una caché introduce una segunda copia del dato. La pregunta de diseño no es "cómo cacheo" sino "cuánto tiempo puede estar desactualizado este dato y qué pasa si lo está".',
        ['**TTL corto** como red de seguridad siempre, incluso con invalidación explícita.', '**Invalidar al escribir**: borrar la clave tras actualizar la base (no actualizarla: dos escrituras concurrentes pueden dejar el valor viejo).', '**Eventos de cambio** (CDC) para invalidar cachés de otros servicios.', '**Versionar claves** (`producto:42:v7`) para invalidación masiva sin barrer claves.'],
        'Datos de saldo o límites de crédito no se sirven desde caché sin una estrategia explícita de consistencia; tasas de cambio o catálogos sí.'
      ], code: { lang: 'Pseudocódigo — cache-aside con protección contra stampede', code: 'function obtenerTasa(moneda):\n    valor = redis.get("tasa:" + moneda)\n    if valor existe:\n        return valor\n    # Solo un proceso recalcula; el resto espera brevemente o usa el valor viejo\n    if redis.set("lock:tasa:" + moneda, "1", NX, EX=5):\n        valor = baseDatos.consultarTasa(moneda)\n        redis.set("tasa:" + moneda, valor, EX=60 + aleatorio(0, 10))  # jitter\n        redis.del("lock:tasa:" + moneda)\n        return valor\n    esperar(50ms)\n    return obtenerTasa(moneda)' } },
      { t: 'Redis más allá de la caché', p: [
        ['**Rate limiting** con contadores y expiración o con sorted sets (ventana deslizante).', '**Locks distribuidos** con `SET NX PX`; para corrección fuerte usa fencing tokens o la base de datos, no solo Redis.', '**Colas y streams** (Redis Streams) para trabajo asíncrono ligero con grupos de consumidores.', '**Sesiones** y datos efímeros con TTL.', '**Estructuras**: sorted sets para rankings, HyperLogLog para conteos aproximados, bitmaps para flags por usuario.'],
        'Redis ejecuta comandos en un solo hilo: un `KEYS *` o un `SMEMBERS` sobre millones de elementos bloquea a todos los clientes. Usa `SCAN`.'
      ] },
      { t: 'Consistencia en bases distribuidas', p: [
        'Cassandra y DynamoDB permiten elegir consistencia por operación. MongoDB ofrece write concern y read concern (majority) y transacciones multi-documento con costo.',
        ['Lecturas de tu propia escritura: lee de la primaria o con consistencia fuerte tras escribir.', 'Escrituras idempotentes: los reintentos en sistemas distribuidos son la norma, no la excepción.', 'Conflictos: last-write-wins pierde datos silenciosamente; para contadores usa tipos que se combinan (CRDTs, contadores atómicos).']
      ] }
    ],
    recurrentes: [
      { tema: 'Cuándo NoSQL y cuándo relacional', por: 'Se pregunta en todas las entrevistas y en cada diseño nuevo.', clave: 'Relacional por defecto para datos transaccionales con relaciones; NoSQL cuando el patrón de acceso es simple y la escala o la flexibilidad del esquema lo justifican.' },
      { tema: 'Qué cachear y con qué TTL', por: 'Cada servicio con lecturas frecuentes termina con una caché, a menudo sin criterio.', clave: 'Cachea lo que se lee mucho y tolera estar desactualizado; define el TTL por la tolerancia del negocio, no por intuición.' },
      { tema: 'Cache stampede y thundering herd', por: 'Causa picos de carga sobre la base justo cuando expira una clave popular.', clave: 'Lock de recálculo, TTL con jitter, y refresco anticipado antes de expirar.' },
      { tema: 'Particiones calientes', por: 'En Cassandra, DynamoDB y Kafka, una mala clave concentra la carga en un nodo.', clave: 'Elige claves con alta cardinalidad y distribución uniforme; agrega un sufijo aleatorio si una clave es inevitablemente popular.' },
      { tema: 'Redis como almacén primario', por: 'Equipos guardan datos críticos en Redis "porque es rápido" y los pierden al reiniciar.', clave: 'Si el dato no se puede reconstruir, configura persistencia y replicación o guárdalo en una base durable.' }
    ],
    casos: [
      { titulo: 'Discord migra miles de millones de mensajes de Cassandra a ScyllaDB', cuando: '2023', que: 'Discord describió cómo su clúster de Cassandra sufría latencias impredecibles por particiones calientes y pausas de recolección de basura de la JVM, y migró a ScyllaDB con servicios intermedios en Rust que agrupan peticiones.', causa: 'Particiones calientes (canales muy activos) y el costo operativo de afinar la JVM y las compactaciones.', leccion: 'El modelo de datos y la distribución de carga importan más que la base elegida; los servicios intermedios que deduplican y agrupan lecturas protegen el almacenamiento.', fuente: 'Blog de ingeniería de Discord, "How Discord Stores Trillions of Messages" (2023)' },
      { titulo: 'Base de datos sin autenticación expuesta a Internet', cuando: 'Recurrente', que: 'Durante años se han reportado miles de instancias de MongoDB, Elasticsearch y Redis accesibles públicamente sin contraseña, muchas borradas y secuestradas a cambio de rescate.', causa: 'Configuraciones por defecto que escuchaban en todas las interfaces sin autenticación, sumadas a reglas de red abiertas.', leccion: 'Ninguna base de datos debe ser alcanzable desde Internet; autenticación y red privada son obligatorias aunque "sea solo desarrollo".', fuente: 'Reportes públicos de investigadores de seguridad (2017 en adelante)' }
    ],
    escenarios: [
      { sintoma: 'La CPU de la base sube al 100% cada hora en punto.', pasos: ['Correlacionar con la expiración de claves de caché creadas con el mismo TTL.', 'Ver en métricas de Redis los misses por minuto en ese momento.', 'Identificar la consulta pesada que repite cada servicio al expirar.'], solucion: 'Agregar jitter al TTL, lock de recálculo y refresco anticipado de las claves más populares.' },
      { sintoma: 'Redis responde lento a todos los clientes durante unos segundos.', pasos: ['Revisar `SLOWLOG GET` para comandos costosos.', 'Buscar `KEYS`, `FLUSHALL` o colecciones gigantes leídas completas.', 'Revisar si el snapshot RDB (fork) coincide con picos de memoria.'], solucion: 'Reemplazar `KEYS` por `SCAN`, paginar colecciones grandes y ajustar la persistencia o la memoria disponible para el fork.' }
    ]
  }
});
