/* Dominio: Infraestructura */
RoadmapPlus.temas({
  'contenedores-orquestacion': {
    conceptos: [
      ['Imagen', 'Paquete inmutable de capas con la aplicación y su entorno; se identifica por digest, no solo por tag.'],
      ['Contenedor', 'Proceso aislado con namespaces (qué ve) y cgroups (cuánto consume) del kernel Linux; no es una máquina virtual.'],
      ['Build multi-etapa', 'Compilar en una etapa y copiar solo el artefacto a una imagen mínima.'],
      ['Pod', 'Unidad mínima de Kubernetes: uno o más contenedores que comparten red y volúmenes.'],
      ['Deployment', 'Declara cuántas réplicas de un pod deben existir y cómo actualizarlas (rolling update).'],
      ['Service', 'Dirección estable y balanceo hacia los pods que coinciden con un selector.'],
      ['Ingress / Gateway API', 'Entrada HTTP desde fuera del clúster con enrutamiento por host y ruta.'],
      ['Requests y limits', 'Request reserva recursos para el scheduler; limit es el máximo. Superar el límite de memoria = OOMKilled.'],
      ['Probes', 'Liveness reinicia el contenedor; readiness lo saca del balanceo; startup protege arranques lentos.'],
      ['HPA', 'Horizontal Pod Autoscaler: escala réplicas según métricas (CPU, memoria o personalizadas).'],
      ['ConfigMap / Secret', 'Configuración y secretos inyectados como variables o archivos; los Secrets están en base64, no cifrados por defecto.'],
      ['PodDisruptionBudget', 'Garantiza un mínimo de réplicas disponibles durante mantenimientos voluntarios del clúster.'],
      ['Namespace', 'Partición lógica del clúster para equipos o ambientes, con cuotas y políticas.']
    ],
    profundidad: [
      { t: 'Recursos, OOMKilled y throttling', p: [
        ['Sin requests, el scheduler no sabe dónde colocar el pod y los nodos se sobrecargan.', 'Un límite de memoria bajo provoca OOMKilled (código de salida 137); revisa `kubectl describe pod`.', 'Un límite de CPU bajo provoca throttling: el proceso se pausa y la latencia sube aunque el uso promedio parezca bajo.', 'Para la JVM y .NET, alinea el heap con el límite del contenedor y deja margen para memoria no-heap.', 'Muchos equipos fijan límite de memoria y omiten el límite de CPU para evitar throttling, manteniendo requests correctos.']
      ] },
      { t: 'Despliegues sin downtime', p: [
        ['Readiness probe correcta: el pod recibe tráfico solo cuando realmente puede atenderlo (dependencias listas, caché caliente).', 'Graceful shutdown: al recibir SIGTERM, dejar de aceptar requests y terminar los en curso dentro de `terminationGracePeriodSeconds`.', 'Un `preStop` breve compensa el tiempo que tarda en propagarse la salida del pod del balanceo.', '`maxUnavailable: 0` y `maxSurge` para no reducir capacidad durante el rolling update.', 'PodDisruptionBudget para que los mantenimientos de nodos no tumben todas las réplicas.']
      ], code: { lang: 'YAML — Deployment con probes, recursos y apagado ordenado', code: 'apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: transferencias\nspec:\n  replicas: 3\n  strategy:\n    rollingUpdate: { maxUnavailable: 0, maxSurge: 1 }\n  template:\n    spec:\n      terminationGracePeriodSeconds: 30\n      containers:\n        - name: app\n          image: registry.banco/transferencias@sha256:4f1e...\n          resources:\n            requests: { cpu: "500m", memory: "768Mi" }\n            limits: { memory: "768Mi" }\n          readinessProbe:\n            httpGet: { path: /health/ready, port: 8080 }\n            periodSeconds: 5\n          livenessProbe:\n            httpGet: { path: /health/live, port: 8080 }\n            periodSeconds: 10\n            failureThreshold: 3\n          lifecycle:\n            preStop:\n              exec: { command: ["sleep", "5"] }\n          securityContext:\n            runAsNonRoot: true\n            readOnlyRootFilesystem: true\n            allowPrivilegeEscalation: false' } },
      { t: 'Imágenes seguras y pequeñas', p: [
        ['Base mínima (distroless, alpine o chiseled) y usuario no root.', 'Fija la imagen por digest en producción; los tags son mutables.', 'Escanea vulnerabilidades en el pipeline y firma las imágenes.', 'No pongas secretos en la imagen ni en capas intermedias (quedan en el historial).', 'Ordena el Dockerfile para aprovechar la caché: dependencias antes que el código.']
      ] },
      { t: 'Liveness mal configurada: el anti-patrón más caro', p: [
        'Una liveness que consulta la base de datos hace que, si la base se degrada, Kubernetes reinicie todos los pods a la vez: un problema de la base se convierte en una caída total y en un pico de reconexiones. La liveness debe comprobar solo que el proceso está vivo; las dependencias van en readiness (y con cuidado).'
      ] }
    ],
    recurrentes: [
      { tema: 'CrashLoopBackOff', por: 'Es el estado que más se ve al desplegar algo roto.', clave: '`kubectl logs --previous` y `describe pod`: configuración faltante, OOM o probe demasiado agresiva.' },
      { tema: 'Requests y limits mal dimensionados', por: 'Causan OOMKilled, throttling o nodos desperdiciados.', clave: 'Basarlos en métricas reales de uso (p95) y revisarlos periódicamente.' },
      { tema: 'Probes que reinician en cascada', por: 'Convierten un fallo parcial en una caída total.', clave: 'Liveness simple, readiness con dependencias y startup probe para arranques lentos.' },
      { tema: 'Secretos en Kubernetes', por: 'Se asume que un Secret está cifrado.', clave: 'Cifrado en etcd, RBAC estricto y preferentemente un gestor externo (Vault, Secrets Manager) con CSI o external-secrets.' }
    ],
    casos: [
      { titulo: 'Roblox: 73 horas fuera de servicio', cuando: 'Oct 2021', que: 'Roblox estuvo caído alrededor de 73 horas. Su infraestructura dependía de Consul para el descubrimiento de servicios y Consul dejó de funcionar.', causa: 'Una nueva funcionalidad de streaming de Consul activada bajo carga alta, combinada con un problema de rendimiento en la base BoltDB subyacente, degradó el clúster; además la propia telemetría dependía del sistema caído.', leccion: 'Los componentes de plataforma compartidos (descubrimiento, configuración) son puntos únicos de falla; la observabilidad no debe depender del sistema que observa, y los cambios de plataforma se activan gradualmente.', fuente: 'Postmortem de Roblox, "Roblox Return to Service 10/28-10/31 2021" (ene. 2022)' }
    ],
    escenarios: [
      { sintoma: 'Durante cada despliegue hay un pico de errores 502 durante unos segundos.', pasos: ['Revisar si la readiness probe pasa antes de que la app esté lista.', 'Verificar el manejo de SIGTERM y el graceful shutdown.', 'Comprobar si existe preStop para la propagación del endpoint.'], solucion: 'Readiness real, apagado ordenado, preStop breve y `maxUnavailable: 0`.' },
      { sintoma: 'Pods reiniciados con OOMKilled aunque el heap de la JVM está al 60%.', pasos: ['Comparar el límite del contenedor con el heap máximo configurado.', 'Medir memoria nativa (metaspace, hilos, buffers directos).'], solucion: 'Usar `MaxRAMPercentage` (alrededor de 70-75%) y subir el límite según el uso real total.' }
    ]
  },

  'cloud-aws-azure-gcp': {
    conceptos: [
      ['Región y zona de disponibilidad', 'Región: ubicación geográfica; zonas: centros de datos aislados dentro de ella. Alta disponibilidad básica = varias zonas.'],
      ['Responsabilidad compartida', 'El proveedor asegura la infraestructura; tú, la configuración, identidades, datos y aplicaciones.'],
      ['IAM', 'Identidades, roles y políticas. Mínimo privilegio y roles temporales en lugar de llaves de larga duración.'],
      ['VPC / VNet', 'Red privada virtual con subredes públicas y privadas, rutas y reglas de firewall.'],
      ['Security group / NSG', 'Firewall con estado a nivel de instancia o subred.'],
      ['Private endpoint', 'Acceso a servicios gestionados (bases, almacenamiento) por red privada, sin pasar por Internet.'],
      ['Infraestructura como código', 'Terraform, Bicep, CloudFormation o Pulumi: infraestructura versionada, revisada y reproducible.'],
      ['Estado de Terraform', 'Archivo que mapea recursos reales; se guarda remoto, con bloqueo y cifrado.'],
      ['Autoscaling', 'Agregar o quitar capacidad según métricas.'],
      ['Object storage', 'S3, Blob, GCS: almacenamiento barato y durable; el riesgo típico es dejar buckets públicos.'],
      ['Metadata service', 'Endpoint interno que entrega credenciales a las instancias; objetivo clásico de ataques SSRF (usar IMDSv2).'],
      ['FinOps', 'Gestión del costo cloud: visibilidad por etiquetas, dimensionamiento correcto, reservas y apagado de lo ocioso.']
    ],
    profundidad: [
      { t: 'Diseñar para fallos de zona y de región', p: [
        ['Mínimo: aplicación en varias zonas detrás de un balanceador, base de datos con réplica síncrona en otra zona.', 'Multi-región solo si el negocio lo justifica: duplica costo y complejidad (datos, consistencia, failover).', 'Define RTO (cuánto tiempo puede estar caído) y RPO (cuántos datos se pueden perder) antes de elegir la estrategia.', 'Prueba el failover; uno que nunca se ejecutó probablemente falle.']
      ] },
      { t: 'IAM: donde ocurren la mayoría de incidentes', p: [
        ['Sin llaves de acceso de larga duración en código o pipelines: usa roles e identidades federadas (OIDC desde GitHub Actions, workload identity).', 'Políticas con el mínimo de acciones y recursos; evita `*`.', 'Separa cuentas o suscripciones por ambiente.', 'Registra y alerta sobre cambios de IAM y accesos inusuales (CloudTrail, Activity Log).']
      ], code: { lang: 'Terraform — rol para una función con acceso mínimo a un bucket', code: 'resource "aws_iam_role_policy" "lector_extractos" {\n  name = "lector-extractos"\n  role = aws_iam_role.funcion_extractos.id\n  policy = jsonencode({\n    Version = "2012-10-17"\n    Statement = [{\n      Effect   = "Allow"\n      Action   = ["s3:GetObject"]\n      Resource = "${aws_s3_bucket.extractos.arn}/clientes/*"\n    }]\n  })\n}' } },
      { t: 'Elegir el modelo de cómputo', p: [
        ['**Máquinas virtuales**: máximo control, máxima operación.', '**Contenedores gestionados** (ECS/Fargate, Cloud Run, Container Apps): buen punto medio.', '**Kubernetes gestionado** (EKS, AKS, GKE): flexibilidad y estándar, con costo operativo real.', '**Serverless** (Lambda, Functions): escala a cero y paga por uso; cuidado con arranques en frío, límites de tiempo y costo a alto volumen.']
      ] }
    ],
    recurrentes: [
      { tema: 'Buckets públicos', por: 'Siguen siendo una causa frecuente de filtraciones.', clave: 'Bloqueo de acceso público a nivel de cuenta y revisión automática de políticas.' },
      { tema: 'Llaves de acceso en repositorios', por: 'Se publican por error y se explotan en minutos.', clave: 'Identidades federadas y escaneo de secretos en el repositorio y el pipeline.' },
      { tema: 'Costos que se disparan', por: 'Recursos olvidados, tráfico de salida y sobredimensionamiento.', clave: 'Etiquetas obligatorias, presupuestos con alertas y revisión mensual.' },
      { tema: 'Terraform manual en consola', por: 'Cambios hechos a mano generan drift y sorpresas en el siguiente apply.', clave: 'Todo cambio por código con plan revisado en el pipeline.' }
    ],
    casos: [
      { titulo: 'Capital One: SSRF hasta las credenciales de la instancia', cuando: 'Jul 2019', que: 'Una atacante obtuvo datos de unos 100 millones de clientes en EE. UU. y Canadá desde buckets de S3.', causa: 'Un firewall de aplicaciones mal configurado permitió una falsificación de solicitudes del lado del servidor (SSRF) hacia el servicio de metadatos de la instancia, que devolvió credenciales de un rol con permisos excesivos sobre los buckets.', leccion: 'Mínimo privilegio en los roles de las instancias, IMDSv2 para bloquear SSRF hacia metadatos y detección de accesos anómalos a datos.', fuente: 'Comunicado de Capital One y acusación del Departamento de Justicia de EE. UU. (jul. 2019)' },
      { titulo: 'Caída de S3 en us-east-1 por un comando mal escrito', cuando: 'Feb 2017', que: 'Amazon S3 en la región us-east-1 quedó indisponible unas cuatro horas, afectando a una gran cantidad de sitios y servicios.', causa: 'Durante una depuración, un comando con un parámetro mal escrito eliminó más servidores de los previstos en subsistemas críticos de S3, que tardaron en reiniciarse.', leccion: 'Las herramientas operativas deben limitar el alcance de cada acción y validar contra umbrales mínimos de capacidad; diseña para tolerar la caída de una región si el negocio lo exige.', fuente: 'Resumen de AWS sobre la interrupción de S3 del 28 de febrero de 2017' }
    ],
    escenarios: [
      { sintoma: 'La factura cloud subió un 40% en un mes sin más tráfico.', pasos: ['Agrupar costos por servicio y etiqueta.', 'Buscar recursos sin dueño, discos y snapshots huérfanos, NAT gateways y transferencia entre zonas o regiones.', 'Revisar cambios de autoscaling y logs con retención excesiva.'], solucion: 'Eliminar lo ocioso, ajustar tamaños, reducir tráfico entre zonas y fijar presupuestos con alertas.' }
    ]
  },

  'mensajeria-kafka-distribuidos': {
    conceptos: [
      ['Topic y partición', 'Un topic se divide en particiones ordenadas; el orden solo se garantiza dentro de una partición.'],
      ['Clave de mensaje', 'Determina la partición: mensajes con la misma clave (id de cuenta) mantienen su orden.'],
      ['Consumer group', 'Los consumidores de un grupo se reparten las particiones; el paralelismo máximo es el número de particiones.'],
      ['Offset', 'Posición del consumidor en la partición; confirmarlo antes de procesar puede perder mensajes, después puede duplicarlos.'],
      ['At-least-once', 'Cada mensaje se procesa una o más veces: la garantía práctica más común, exige consumidores idempotentes.'],
      ['Exactly-once', 'En Kafka, transacciones e idempotencia del productor dentro de Kafka; con efectos externos sigue haciendo falta idempotencia.'],
      ['Consumer lag', 'Diferencia entre el último mensaje y el último procesado: la métrica clave de salud.'],
      ['Rebalanceo', 'Redistribución de particiones al entrar o salir consumidores; pausa el consumo.'],
      ['Dead letter topic', 'Destino de mensajes que fallan repetidamente, para no bloquear la partición.'],
      ['Outbox', 'Escribir el evento en una tabla dentro de la transacción de negocio y publicarlo después (por CDC o polling).'],
      ['Saga', 'Secuencia de transacciones locales con compensaciones en lugar de una transacción distribuida.'],
      ['Schema Registry', 'Registro de esquemas (Avro, Protobuf) con reglas de compatibilidad entre versiones.']
    ],
    profundidad: [
      { t: 'El problema de la doble escritura', p: [
        'Guardar en la base y publicar en Kafka son dos sistemas distintos: si uno falla después del otro, quedan inconsistentes (el pago se registró pero el evento nunca salió, o al revés).',
        ['**Outbox**: la transacción de negocio también inserta el evento en una tabla outbox; un proceso (Debezium/CDC o un poller) lo publica.', 'El publicador puede duplicar: los consumidores deben ser idempotentes.', 'Evita publicar dentro de la transacción y esperar al broker: alarga la transacción y no resuelve la atomicidad.']
      ], code: { lang: 'SQL — patrón outbox en la misma transacción', code: 'BEGIN;\nUPDATE cuentas SET saldo = saldo - 100 WHERE id = 1 AND saldo >= 100;\nINSERT INTO transferencias (id, origen, destino, monto) VALUES (:id, 1, 2, 100);\nINSERT INTO outbox (id, agregado, tipo, payload)\nVALUES (gen_random_uuid(), :id, \'TransferenciaRealizada\', :json);\nCOMMIT;\n-- Debezium lee el WAL de la tabla outbox y publica en Kafka' } },
      { t: 'Orden, paralelismo y particiones', p: [
        ['Elige la clave por la entidad cuyo orden importa (cuenta, no transferencia).', 'Más particiones = más paralelismo, pero más archivos, rebalanceos más lentos y más costo; no se reducen fácilmente.', 'Un mensaje que falla siempre ("poison pill") bloquea su partición: reintentos acotados y luego DLT.', 'Los reintentos con un topic de reintento con retraso evitan bloquear el flujo principal.']
      ] },
      { t: 'Consistencia entre servicios', p: [
        ['Sin transacciones distribuidas (2PC) en microservicios: se aceptan estados intermedios y se diseñan compensaciones.', 'Saga orquestada (un coordinador con máquina de estados) es más fácil de seguir que una coreografía de eventos para flujos largos.', 'Cada evento lleva un identificador único y versión para deduplicar y ordenar.', 'Los consumidores deben tolerar eventos duplicados, tardíos y, entre claves distintas, desordenados.']
      ] }
    ],
    recurrentes: [
      { tema: 'Consumidores idempotentes', por: 'Kafka entrega al menos una vez: los duplicados ocurren en todo rebalanceo o reinicio.', clave: 'Registro de IDs procesados o efectos idempotentes (upsert por clave), en la misma transacción del efecto.' },
      { tema: 'Consumer lag creciente', por: 'Es la señal temprana de que el sistema no da abasto.', clave: 'Alerta sobre lag y tiempo de lag; escala consumidores hasta el número de particiones o acelera el procesamiento.' },
      { tema: 'Evolución de esquemas', por: 'Un productor cambia un campo y rompe a cinco consumidores.', clave: 'Schema Registry con compatibilidad hacia atrás y solo cambios aditivos.' },
      { tema: 'Mensajes envenenados', por: 'Un mensaje mal formado detiene una partición entera.', clave: 'Reintentos acotados, DLT con alerta y herramienta para reprocesar.' }
    ],
    casos: [
      { titulo: 'LinkedIn crea Kafka para unificar sus flujos de datos', cuando: '2011', que: 'LinkedIn desarrolló Kafka para reemplazar decenas de integraciones punto a punto entre sistemas por un log distribuido central, y lo liberó como código abierto.', causa: 'La cantidad de conexiones directas entre productores y consumidores de datos crecía de forma inmanejable.', leccion: 'Un log de eventos central desacopla productores de consumidores; el costo se traslada a operar el log y a gobernar los esquemas.', fuente: 'Jay Kreps, "The Log: What every software engineer should know about real-time data\'s unifying abstraction" (2013)' }
    ],
    escenarios: [
      { sintoma: 'El lag del consumidor de notificaciones crece sin parar desde el mediodía.', pasos: ['Ver si todas las particiones tienen lag o solo una (mensaje envenenado o partición caliente).', 'Medir el tiempo de procesamiento por mensaje y la latencia de las dependencias externas.', 'Revisar si hay rebalanceos frecuentes (consumidores que exceden max.poll.interval).'], solucion: 'Mover el mensaje problemático a la DLT, acelerar o paralelizar el procesamiento y ajustar los timeouts de poll.' },
      { sintoma: 'Algunos clientes reciben la misma notificación de transferencia dos veces.', pasos: ['Verificar si coincide con rebalanceos o reinicios.', 'Revisar cuándo se confirma el offset respecto del envío.'], solucion: 'Registrar el ID del evento procesado con restricción única antes de confirmar el efecto (idempotencia).' }
    ]
  },

  'devops-cicd-git': {
    conceptos: [
      ['CI', 'Integración continua: cada cambio se integra a la rama principal y se valida automáticamente (build, pruebas, análisis).'],
      ['CD', 'Entrega continua: siempre desplegable; despliegue continuo: cada cambio aprobado llega solo a producción.'],
      ['Pipeline como código', 'Definición versionada del pipeline (GitHub Actions, GitLab CI, Azure Pipelines).'],
      ['Artefacto inmutable', 'Se construye una vez y se promueve por ambientes con el mismo digest.'],
      ['Blue/green', 'Dos entornos idénticos; se cambia el tráfico de uno a otro y se puede volver al instante.'],
      ['Canary', 'Liberar a un porcentaje pequeño de tráfico y observar antes de ampliar.'],
      ['Rollback vs roll forward', 'Volver a la versión anterior o corregir con un nuevo despliegue; las migraciones de base complican el rollback.'],
      ['Rebase vs merge', 'Rebase reescribe historia lineal (solo en ramas propias); merge preserva la historia.'],
      ['Branch protection', 'Reglas que exigen revisión y checks verdes antes de integrar.'],
      ['GitOps', 'El estado deseado del clúster vive en Git y un agente (Argo CD, Flux) lo sincroniza.'],
      ['SAST / SCA / DAST', 'Análisis estático de código, de dependencias y dinámico de la aplicación desplegada.'],
      ['Supply chain (SLSA)', 'Garantías sobre cómo se construyó un artefacto: builds reproducibles, firmados y con procedencia.']
    ],
    profundidad: [
      { t: 'Anatomía de un pipeline confiable', p: [
        ['**Rápido**: la retroalimentación del PR en menos de 10-15 minutos; si tarda más, se ignora.', '**Determinista**: pruebas inestables (flaky) se arreglan o se ponen en cuarentena; un pipeline que falla al azar entrena a ignorarlo.', '**Seguro**: secretos fuera del código, identidad federada (OIDC) hacia la nube, permisos mínimos del runner.', '**Trazable**: cada despliegue enlaza commit, artefacto, aprobación y resultado.'],
        'Etapas típicas: lint y build → pruebas unitarias → análisis estático y de dependencias → imagen y escaneo → pruebas de integración → despliegue a staging → pruebas de humo → aprobación → producción con canary.'
      ], code: { lang: 'YAML — GitHub Actions con identidad federada y caché', code: 'name: ci\non: [pull_request, push]\npermissions:\n  contents: read\n  id-token: write   # OIDC hacia la nube, sin llaves guardadas\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-java@v4\n        with: { distribution: temurin, java-version: 21, cache: maven }\n      - run: ./mvnw -B verify\n      - run: ./mvnw -B org.owasp:dependency-check-maven:check\n      - uses: aws-actions/configure-aws-credentials@v4\n        if: github.ref == \'refs/heads/main\'\n        with:\n          role-to-assume: arn:aws:iam::123456789012:role/ci-deploy\n          aws-region: us-east-1' } },
      { t: 'Despliegue progresivo y rollback', p: [
        ['Despliega con canary y criterios automáticos de avance (tasa de errores, latencia p99).', 'Separa desplegar de liberar con feature flags.', 'Migraciones de base compatibles hacia atrás (expand/contract) para que el rollback de código sea seguro.', 'Practica el rollback: si nunca se hizo, no se sabe si funciona.']
      ] },
      { t: 'Git que no estorba', p: [
        ['Ramas cortas (horas o pocos días) y PRs pequeños.', 'Mensajes de commit que explican el porqué.', 'Nunca reescribas historia compartida (`push --force` a main).', '`git bisect` encuentra el commit que introdujo un bug en log2(n) pasos.', 'Firma de commits y protección de ramas en repositorios críticos.']
      ] }
    ],
    recurrentes: [
      { tema: 'Pruebas inestables', por: 'Erosionan la confianza en el pipeline y se terminan ignorando.', clave: 'Cuarentena inmediata, dueño asignado y corrección de la causa (tiempo, orden, datos compartidos).' },
      { tema: 'Secretos en el pipeline', por: 'Logs, variables expuestas y llaves de larga duración.', clave: 'Gestor de secretos, OIDC, enmascarado de logs y permisos mínimos por job.' },
      { tema: 'Despliegues los viernes', por: 'Síntoma de que desplegar da miedo.', clave: 'Si desplegar es seguro y reversible, el día no importa; invierte en eso.' },
      { tema: 'Drift entre ambientes', por: '"Funciona en staging" y falla en producción.', clave: 'Infraestructura como código y el mismo artefacto en todos los ambientes.' }
    ],
    casos: [
      { titulo: 'CrowdStrike: una actualización de contenido tumba millones de equipos Windows', cuando: 'Jul 2024', que: 'Una actualización de configuración del sensor Falcon provocó pantallas azules en alrededor de 8,5 millones de equipos Windows, afectando aerolíneas, bancos y hospitales.', causa: 'Un archivo de contenido con un defecto que el validador no detectó se distribuyó a todos los clientes a la vez; el componente que lo leía se ejecuta en el kernel.', leccion: 'Toda actualización, incluida la de "solo configuración", necesita despliegue gradual por anillos, validación real y capacidad de rollback rápido.', fuente: 'Revisión preliminar post-incidente y análisis de causa raíz de CrowdStrike (jul.-ago. 2024)' },
      { titulo: 'Atlassian borra los sitios de unos 775 clientes', cuando: 'Abr 2022', que: 'Un script de mantenimiento destinado a eliminar una aplicación heredada eliminó los sitios completos de cientos de clientes; algunos tardaron hasta dos semanas en recuperar el servicio.', causa: 'El script recibió identificadores de sitios en lugar de identificadores de la aplicación, y la API permitía ambas eliminaciones sin salvaguardas adicionales.', leccion: 'Operaciones destructivas masivas con validación del tipo de objeto, eliminación lógica primero, ejecución gradual y procedimientos de restauración probados a escala.', fuente: 'Post-incident review de Atlassian (abr. 2022)' }
    ],
    escenarios: [
      { sintoma: 'El pipeline tarda 45 minutos y los desarrolladores acumulan cambios para no esperarlo.', pasos: ['Medir el tiempo por etapa.', 'Buscar etapas secuenciales que podrían ir en paralelo y builds sin caché.', 'Identificar pruebas lentas o de integración en la etapa rápida.'], solucion: 'Paralelizar, cachear dependencias e imágenes, separar pruebas lentas en una etapa posterior y ejecutar solo lo afectado por el cambio.' }
    ]
  }
});

/* ---------- Temas nuevos de Infraestructura ---------- */
RoadmapPlus.nuevo({
  id: 'redes-protocolos', num: 26, titulo: 'Redes para Ingenieros: HTTP, TCP, DNS y TLS',
  dominio: 'Infraestructura', resumen: 'Lo que pasa entre el cliente y tu servicio: DNS, TCP, TLS, HTTP/1.1-2-3, proxies, balanceadores y timeouts.',
  nivel: 'Semi Senior', dificultad: 3, tiempoEstimado: '15-25h', prereq: ['programacion-paradigmas'],
  tecnologias: ['DNS', 'TCP', 'TLS', 'HTTP/2', 'HTTP/3', 'Load balancers', 'CDN', 'curl'],
  matriz: { frecuencia: 'Alta', importancia: 'Alta' },
  c: {
    definicion: 'Las redes son el medio por el que viaja cada request: resolución de nombres (DNS), conexión confiable (TCP o QUIC), cifrado (TLS) y protocolo de aplicación (HTTP). Un ingeniero de backend necesita entender estas capas para diagnosticar latencia, errores intermitentes y caídas que no están en su código.',
    problema: 'Muchos incidentes se presentan como "la API está lenta" o "falla a veces" y su causa está en la red: DNS cacheado con una IP vieja, conexiones agotadas, timeouts mal configurados, certificados expirados o un balanceador que corta conexiones largas. Sin conocer las capas, se diagnostica a ciegas.',
    fundamentos: 'Un request HTTPS típico: el cliente resuelve el nombre por DNS (con caché y TTL), abre una conexión TCP (handshake de 3 pasos, 1 RTT), negocia TLS (1 RTT en TLS 1.3) y envía la petición HTTP. HTTP/1.1 reutiliza conexiones con keep-alive pero procesa una petición a la vez por conexión; HTTP/2 multiplexa varias sobre una conexión; HTTP/3 usa QUIC sobre UDP para evitar el bloqueo de cabeza de línea de TCP.',
    arquitectura: 'Entre cliente y servicio suele haber CDN, WAF, balanceador L7 (HTTP) o L4 (TCP), proxies o service mesh y el balanceo interno de Kubernetes. Cada salto tiene sus propios timeouts, límites de conexión y logs; un request lento puede estar esperando en cualquiera de ellos.',
    funcionamiento: 'Para diagnosticar se descompone el tiempo de un request: DNS, conexión, TLS, tiempo hasta el primer byte y transferencia (`curl -w` lo muestra). Luego se revisan los timeouts de cada salto, la reutilización de conexiones y los códigos de error de cada capa (502 y 504 suelen venir del proxy, no de la aplicación).',
    buenas: ['Reutilizar conexiones (pools, keep-alive) en clientes HTTP y de base de datos.', 'Definir timeouts en cada salto, decrecientes de afuera hacia adentro.', 'Monitorear la expiración de certificados y renovarlos automáticamente.', 'Respetar el TTL de DNS en clientes de larga vida.', 'Usar HTTP/2 o gRPC para muchas llamadas entre servicios.'],
    malas: ['Crear una conexión nueva por request.', 'Timeouts infinitos o más largos en el servicio interno que en el proxy externo.', 'Desactivar la verificación de certificados "para que funcione".', 'Cachear para siempre la IP resuelta.', 'Asumir que la red es confiable y sin latencia.'],
    errores: ['Confundir un 504 del balanceador con un error de la aplicación.', 'Olvidar que un TTL bajo de DNS no ayuda si el cliente cachea por su cuenta.', 'Ignorar el MTU o la fragmentación en VPNs y túneles.'],
    patrones: ['Connection pooling', 'Retry con backoff y jitter', 'Circuit breaker', 'Health checks del balanceador', 'TLS termination en el borde'],
    antipatrones: ['Certificados autofirmados en producción', 'Reintentos sin límite que amplifican una caída', 'Timeouts por defecto de la librería sin revisar'],
    ejemploReal: 'Un servicio tenía errores 502 esporádicos: el balanceador cerraba conexiones inactivas a los 60 segundos y el servidor de aplicación a los 75, así que a veces el balanceador reutilizaba una conexión que el servidor ya había cerrado. Ajustar el keep-alive del servidor por encima del del balanceador lo resolvió.',
    ejemploBanca: 'Las integraciones con redes de pago y otros bancos usan TLS mutuo (mTLS) y listas de IPs permitidas; un certificado de cliente expirado detiene las transferencias interbancarias hasta que se renueva.',
    ejemploEmpresarial: 'Las CDN sirven contenido desde ubicaciones cercanas al usuario y absorben picos de tráfico y ataques DDoS antes de que lleguen al origen.',
    comparacion: { headers: ['Protocolo', 'Transporte', 'Multiplexación', 'Uso típico'], rows: [['HTTP/1.1', 'TCP', 'No (una petición a la vez por conexión)', 'APIs simples, compatibilidad'], ['HTTP/2', 'TCP', 'Sí', 'Navegadores modernos, gRPC'], ['HTTP/3', 'QUIC/UDP', 'Sí, sin bloqueo de cabeza de línea', 'Redes móviles con pérdida'], ['gRPC', 'HTTP/2', 'Sí, con streaming', 'Comunicación entre servicios']] },
    ventajas: ['Diagnóstico rápido de latencia e intermitencia', 'Mejores decisiones de timeouts y reintentos', 'Integraciones seguras con terceros'],
    desventajas: ['Muchas capas y herramientas que aprender', 'Los problemas suelen ser intermitentes'],
    faq: [
      { q: '¿Qué diferencia hay entre 502, 503 y 504?', a: '502: el proxy recibió una respuesta inválida o la conexión se cortó; 503: servicio no disponible (sobrecarga o sin backends sanos); 504: el proxy se cansó de esperar al backend.' },
      { q: '¿Por qué TLS 1.3 es más rápido?', a: 'Reduce el handshake a un solo viaje de ida y vuelta y elimina algoritmos inseguros.' },
      { q: '¿Qué es mTLS?', a: 'TLS donde también el cliente presenta un certificado: ambos extremos se autentican.' }
    ],
    codigo: { lang: 'Bash — descomponer el tiempo de un request con curl', code: 'curl -o /dev/null -s -w "\ndns:        %{time_namelookup}s\nconexion:   %{time_connect}s\ntls:        %{time_appconnect}s\nprimer byte:%{time_starttransfer}s\ntotal:      %{time_total}s\ncodigo:     %{http_code}\n" https://api.banco.ejemplo/salud\n\n# Verificar certificado y fecha de expiración\nopenssl s_client -connect api.banco.ejemplo:443 -servername api.banco.ejemplo </dev/null 2>/dev/null \\\n  | openssl x509 -noout -subject -enddate' }
  },
  entrevistas: [
    { nivel: 'Junior', pregunta: '¿Qué pasa cuando escribes una URL en el navegador?', respuesta: 'Resolución DNS, conexión TCP, handshake TLS, petición HTTP, respuesta del servidor (posiblemente pasando por CDN y balanceadores) y renderizado.' },
    { nivel: 'Junior', pregunta: '¿Diferencia entre TCP y UDP?', respuesta: 'TCP es orientado a conexión, confiable y ordenado; UDP envía datagramas sin garantías ni conexión, con menos latencia.' },
    { nivel: 'Semi Senior', pregunta: '¿Qué ventajas trae HTTP/2 sobre HTTP/1.1?', respuesta: 'Multiplexación de varias peticiones en una conexión, compresión de cabeceras y priorización, lo que reduce conexiones y latencia.' },
    { nivel: 'Semi Senior', pregunta: '¿Cómo configurarías timeouts en una cadena cliente → gateway → servicio → base?', respuesta: 'Decrecientes hacia adentro: cada capa interna debe agotar su timeout antes que la externa, para responder un error controlado en lugar de que el cliente vea un corte.' },
    { nivel: 'Senior', pregunta: '¿Cómo diagnosticarías errores 502 intermitentes?', respuesta: 'Correlaciono logs del balanceador y del servicio, reviso keep-alive e idle timeouts entre ambos, reinicios de pods y conexiones cortadas durante despliegues.' },
    { nivel: 'Senior', pregunta: '¿Por qué los reintentos pueden empeorar una caída?', respuesta: 'Multiplican la carga sobre un servicio ya saturado (retry storm); se mitigan con backoff exponencial con jitter, presupuesto de reintentos y circuit breaker.' },
    { nivel: 'Staff/Arquitecto', pregunta: '¿Cómo diseñarías la conectividad segura con una red de pagos externa?', respuesta: 'mTLS con rotación de certificados, IPs permitidas, conexión privada o VPN dedicada, timeouts e idempotencia en los mensajes y monitoreo de expiración.' },
    { nivel: 'Staff/Arquitecto', pregunta: '¿Qué implica que DNS sea un punto único de falla?', respuesta: 'Si la resolución falla, todo falla aunque los servicios estén sanos: se mitiga con proveedores redundantes, TTL razonables y cachés con valores previos (serve-stale).' }
  ],
  ejercicios: ['Mide con curl la descomposición de tiempos de tres APIs públicas y explica las diferencias.', 'Provoca y explica un 504 configurando timeouts entre un proxy Nginx y un servicio lento.', 'Configura mTLS entre dos servicios locales con certificados de una CA propia.'],
  proyecto: { titulo: 'Laboratorio de red de un microservicio', desc: 'Entorno con Nginx como proxy, un servicio y una base, donde se reproducen y documentan: DNS cacheado, timeouts mal escalonados, keep-alive inconsistente, certificado expirado y retry storm, con la corrección de cada uno.', tech: ['Docker Compose', 'Nginx', 'curl', 'openssl', 'Wireshark'] },
  checklist: ['Explico el recorrido completo de un request HTTPS', 'Distingo 502, 503 y 504 y sé de qué capa vienen', 'Configuro timeouts escalonados', 'Entiendo HTTP/1.1, HTTP/2 y HTTP/3', 'Sé verificar y renovar certificados TLS', 'Uso curl y openssl para diagnosticar', 'Diseño reintentos con backoff y jitter'],
  recursos: [{ kind: 'Libro', label: 'High Performance Browser Networking — Ilya Grigorik' }, { kind: 'Libro', label: 'Computer Networking: A Top-Down Approach — Kurose y Ross' }, { kind: 'Doc oficial', label: 'MDN Web Docs: HTTP' }],
  relacionados: ['seguridad-redes-linux', 'cloud-aws-azure-gcp', 'incidentes-troubleshooting', 'apis-rest-graphql'],
  plus: {
    conceptos: [
      ['RTT', 'Tiempo de ida y vuelta entre dos puntos; cada handshake cuesta al menos uno.'],
      ['TTL de DNS', 'Cuánto tiempo puede cachearse una respuesta DNS.'],
      ['Keep-alive', 'Reutilizar una conexión TCP para varias peticiones.'],
      ['Head-of-line blocking', 'Una petición o paquete lento bloquea a los que vienen detrás.'],
      ['TLS termination', 'Descifrar TLS en el balanceador o proxy y reenviar al servicio.'],
      ['SNI', 'Extensión TLS que indica a qué dominio se conecta el cliente, para elegir certificado.'],
      ['mTLS', 'Autenticación mutua con certificados de cliente y servidor.'],
      ['L4 vs L7', 'Balanceo por conexión TCP frente a balanceo por contenido HTTP (ruta, host, headers).'],
      ['Backoff con jitter', 'Esperas crecientes y aleatorizadas entre reintentos para no sincronizar a los clientes.'],
      ['CDN', 'Red de servidores de borde que cachean contenido cerca del usuario.'],
      ['Anycast', 'Varias ubicaciones anuncian la misma IP; el usuario llega a la más cercana.'],
      ['BGP', 'Protocolo con el que las redes de Internet anuncian qué rangos de IP alcanzan.']
    ],
    profundidad: [
      { t: 'Timeouts escalonados y reintentos seguros', p: [
        ['Cliente 10 s → gateway 9 s → servicio 8 s → base de datos 5 s: cada capa interna responde antes de que la externa corte.', 'Reintenta solo operaciones idempotentes y errores transitorios (conexión, 503, 429 respetando Retry-After).', 'Backoff exponencial con jitter completo y número máximo de intentos.', 'Presupuesto de reintentos: no más de un porcentaje del tráfico total, para no convertir una degradación en caída.']
      ], code: { lang: 'Pseudocódigo — reintento con backoff exponencial y jitter completo', code: 'function llamarConReintentos(op, maxIntentos = 4, base = 100ms, tope = 2s):\n    for intento in 1..maxIntentos:\n        try:\n            return op()\n        catch ErrorTransitorio:\n            if intento == maxIntentos: throw\n            espera = aleatorio(0, min(tope, base * 2^intento))\n            dormir(espera)' } },
      { t: 'DNS: el componente que se olvida', p: [
        ['Los cambios de DNS tardan lo que dure el TTL más las cachés de cada cliente.', 'La JVM históricamente cacheaba resoluciones; revisa `networkaddress.cache.ttl` en clientes de larga vida.', 'En Kubernetes, las búsquedas con `ndots` generan varias consultas por nombre; usa nombres completos para dependencias externas.', 'Baja el TTL con antelación antes de una migración de IP.']
      ] }
    ],
    recurrentes: [
      { tema: 'Certificados expirados', por: 'Caídas completamente evitables que siguen ocurriendo cada año en empresas grandes.', clave: 'Renovación automática (ACME, cert-manager) y alertas 30 días antes.' },
      { tema: 'Retry storms', por: 'Los reintentos de todos los clientes tumban un servicio que se estaba recuperando.', clave: 'Backoff con jitter, límite de reintentos y circuit breaker.' },
      { tema: 'Idle timeouts desalineados', por: 'Generan 502 esporádicos difíciles de reproducir.', clave: 'El keep-alive del servidor debe ser mayor que el idle timeout del balanceador.' }
    ],
    casos: [
      { titulo: 'Facebook desaparece de Internet por un cambio de BGP', cuando: 'Oct 2021', que: 'Facebook, Instagram y WhatsApp estuvieron inaccesibles unas seis horas.', causa: 'Un comando durante un mantenimiento desconectó la red troncal; los servidores DNS de Facebook, al perder conectividad con los centros de datos, retiraron sus anuncios BGP y los dominios dejaron de resolverse. Las herramientas internas y el acceso físico también dependían de esa red.', leccion: 'Las herramientas de recuperación y el acceso de emergencia no deben depender del sistema que fallará; los cambios de red necesitan validación y alcance limitado.', fuente: 'Publicaciones de ingeniería de Meta sobre la interrupción del 4 de octubre de 2021' },
      { titulo: 'Fastly: una configuración de cliente tumba buena parte de la web', cuando: 'Jun 2021', que: 'Durante cerca de una hora, una gran parte de la red de Fastly devolvió errores, dejando caídos sitios de medios y gobiernos.', causa: 'Una configuración válida de un cliente activó un bug latente introducido en un despliegue semanas antes.', leccion: 'Los bugs latentes esperan una entrada concreta; la capacidad de detectar y revertir en minutos importa tanto como prevenir.', fuente: 'Resumen de incidente de Fastly (8 de junio de 2021)' }
    ],
    escenarios: [
      { sintoma: 'Tras migrar una base de datos a una nueva IP, un servicio sigue conectando a la antigua durante horas.', pasos: ['Verificar el TTL del registro DNS.', 'Revisar si el cliente o la JVM cachean la resolución indefinidamente.', 'Comprobar si el pool de conexiones mantiene conexiones viejas abiertas.'], solucion: 'Configurar el TTL de caché DNS del runtime, limitar la vida máxima de las conexiones del pool y bajar el TTL antes de migrar.' }
    ]
  }
});

RoadmapPlus.nuevo({
  id: 'incidentes-troubleshooting', num: 27, titulo: 'Incidentes, Debugging y Troubleshooting en Producción',
  dominio: 'Infraestructura', resumen: 'Cómo diagnosticar y resolver problemas reales en producción: método, herramientas, gestión del incidente y postmortem.',
  nivel: 'Senior', dificultad: 4, tiempoEstimado: '15-25h', prereq: ['observabilidad-sre', 'redes-protocolos'],
  tecnologias: ['Logs', 'Métricas', 'Trazas', 'Profilers', 'Heap dumps', 'kubectl', 'Postmortems'],
  matriz: { frecuencia: 'Alta', importancia: 'Crítica' },
  c: {
    definicion: 'El troubleshooting es el proceso sistemático de encontrar la causa de un comportamiento incorrecto en un sistema en producción; la gestión de incidentes es la coordinación para restaurar el servicio rápido y aprender después. Son habilidades distintas: primero se mitiga, después se investiga.',
    problema: 'En producción no hay depurador paso a paso, el problema puede ser intermitente, el tiempo cuenta en dinero y reputación, y varias personas investigan a la vez. Sin método, los equipos saltan entre hipótesis, cambian varias cosas a la vez y pierden horas.',
    fundamentos: 'El método se basa en: definir el impacto con datos, mitigar antes de diagnosticar (rollback, escalar, desviar tráfico), acotar dónde está el problema (qué cambió, qué componente, qué segmento de usuarios), formular hipótesis verificables y comprobarlas una a una. Las señales vienen de métricas (qué y cuánto), logs (detalle de eventos) y trazas (dónde se va el tiempo de un request).',
    arquitectura: 'Un incidente bien gestionado tiene roles: comandante del incidente (coordina y decide), responsable de comunicación (actualiza a negocio y clientes) y personas que investigan. Se trabaja en un canal único, con línea de tiempo registrada, y se cierra con un postmortem sin culpa con acciones concretas.',
    funcionamiento: 'Flujo típico: alerta → evaluación de severidad → declaración del incidente → mitigación (revertir el último cambio es la primera hipótesis) → diagnóstico con métodos como USE (utilización, saturación, errores) para recursos y RED (tasa, errores, duración) para servicios → corrección → verificación → postmortem.',
    buenas: ['Mitigar primero: revertir el último cambio antes de entender la causa.', 'Preguntar siempre "¿qué cambió?" (despliegues, configuración, tráfico, dependencias).', 'Cambiar una sola cosa a la vez y registrar cada acción con hora.', 'Comunicar estado a intervalos regulares.', 'Postmortem sin culpa con acciones con dueño y fecha.'],
    malas: ['Investigar la causa raíz mientras los clientes siguen afectados.', 'Aplicar varios cambios a la vez sin registrar.', 'Reiniciar todo "a ver si se arregla" y perder la evidencia.', 'Buscar culpables.', 'Cerrar el incidente sin acciones preventivas.'],
    errores: ['Confundir correlación con causa.', 'Fiarse de un solo dashboard sin verificar el dato.', 'No capturar evidencia (heap dump, logs) antes de reiniciar.'],
    patrones: ['Incident commander', 'Runbooks', 'Rollback primero', 'Bisección de cambios', 'USE y RED', 'Postmortem sin culpa'],
    antipatrones: ['Héroe que resuelve solo y sin documentar', 'Alertas que nadie atiende', 'Postmortems sin seguimiento'],
    ejemploReal: 'Una caída de pagos se atribuyó durante una hora a la base de datos; la línea de tiempo mostró que comenzó 2 minutos después de un cambio de configuración del pool de conexiones. Revertirlo restauró el servicio en 5 minutos.',
    ejemploBanca: 'En banca, un incidente que afecta transferencias tiene obligaciones de comunicación al regulador y a clientes; la línea de tiempo y el postmortem documentados son evidencia de auditoría.',
    ejemploEmpresarial: 'Google popularizó el postmortem sin culpa y las prácticas de SRE; muchas empresas publican sus postmortems como forma de transparencia y aprendizaje.',
    comparacion: { headers: ['Señal', 'Responde', 'Ejemplo'], rows: [['Métricas', '¿Qué y cuánto?', 'Tasa de errores 5xx subió al 12%'], ['Logs', '¿Qué pasó exactamente?', 'Timeout al llamar al core para el cliente X'], ['Trazas', '¿Dónde se va el tiempo?', '1,8 s de 2 s en la consulta de límites'], ['Profiles', '¿Qué consume CPU o memoria?', 'Serialización JSON en el 40% de CPU']] },
    ventajas: ['Menor tiempo de restauración', 'Aprendizaje organizacional', 'Menos incidentes repetidos'],
    desventajas: ['Requiere práctica y tiempo para postmortems', 'Disciplina en situaciones de presión'],
    faq: [
      { q: '¿Qué hago primero ante una alerta crítica?', a: 'Confirmar el impacto real, declarar el incidente si corresponde y buscar la mitigación más rápida (normalmente revertir el último cambio).' },
      { q: '¿Qué hace un buen postmortem?', a: 'Línea de tiempo factual, impacto cuantificado, causas contribuyentes (no culpables), qué funcionó y acciones concretas con dueño.' },
      { q: '¿Cuándo tomo un heap dump?', a: 'Ante sospecha de fuga de memoria, antes de reiniciar el proceso, si el entorno lo permite sin exponer datos sensibles.' }
    ],
    codigo: { lang: 'Bash — primeros minutos en un pod con problemas', code: '# ¿Qué cambió y en qué estado está?\nkubectl rollout history deploy/pagos\nkubectl get pods -l app=pagos -o wide\nkubectl describe pod pagos-7d9f8 | tail -30   # eventos: OOMKilled, probes\nkubectl logs pagos-7d9f8 --previous --tail=200   # logs del contenedor anterior\nkubectl top pod -l app=pagos\n\n# Mitigación: volver a la versión anterior\nkubectl rollout undo deploy/pagos\n\n# Evidencia en JVM antes de reiniciar (si la política lo permite)\nkubectl exec pagos-7d9f8 -- jcmd 1 Thread.print > hilos.txt' }
  },
  entrevistas: [
    { nivel: 'Junior', pregunta: '¿Qué harías si producción empieza a fallar después de tu despliegue?', respuesta: 'Avisar de inmediato, revertir el despliegue para mitigar y luego investigar con logs y métricas.' },
    { nivel: 'Semi Senior', pregunta: '¿Qué es un postmortem sin culpa?', respuesta: 'Un análisis que busca causas sistémicas y mejoras de proceso, no responsables individuales, para que la gente reporte con honestidad.' },
    { nivel: 'Semi Senior', pregunta: '¿Cómo encuentras el commit que introdujo un bug?', respuesta: 'Con `git bisect` entre una versión buena y una mala, probando en cada paso: búsqueda binaria sobre el historial.' },
    { nivel: 'Senior', pregunta: 'La latencia p99 sube pero el promedio está bien. ¿Qué investigas?', respuesta: 'Segmento por endpoint, cliente e instancia; busco pausas de GC, contención de locks o pools, una dependencia lenta para algunos casos y consultas con planes distintos.' },
    { nivel: 'Senior', pregunta: '¿Cómo diagnosticas una fuga de memoria en producción?', respuesta: 'Confirmo con la tendencia de memoria tras GC, comparo heap dumps o perfiles en el tiempo y busco colecciones que crecen (cachés sin límite, listeners, sesiones).' },
    { nivel: 'Senior', pregunta: '¿Qué roles tiene un incidente grave?', respuesta: 'Comandante del incidente, comunicación, investigadores y escriba de la línea de tiempo; un solo canal y decisiones explícitas.' },
    { nivel: 'Staff/Arquitecto', pregunta: '¿Cómo reduces el tiempo de restauración de toda la organización?', respuesta: 'Despliegues reversibles, feature flags, runbooks, observabilidad con trazas, simulacros de incidentes y alertas basadas en síntomas de usuario.' },
    { nivel: 'Staff/Arquitecto', pregunta: '¿Cómo te aseguras de que las acciones de los postmortems se cumplan?', respuesta: 'Seguimiento en el backlog con prioridad, revisión periódica de acciones abiertas y métricas de incidentes repetidos.' }
  ],
  ejercicios: ['Realiza un simulacro de incidente en equipo con roles y redacta el postmortem.', 'Provoca una fuga de memoria en un servicio de prueba y diagnostícala con un heap dump.', 'Usa git bisect para encontrar un bug introducido deliberadamente en 50 commits.'],
  proyecto: { titulo: 'Juego de incidentes', desc: 'Repositorio con un servicio y cinco fallas inyectables (fuga de memoria, pool agotado, dependencia lenta, configuración rota, consulta sin índice), runbooks para cada una y plantilla de postmortem.', tech: ['Docker Compose', 'Prometheus', 'Grafana', 'OpenTelemetry', 'k6'] },
  checklist: ['Priorizo mitigar sobre diagnosticar', 'Pregunto qué cambió antes de teorizar', 'Uso métricas, logs y trazas de forma combinada', 'Sé usar git bisect', 'Sé capturar evidencia (dumps, perfiles) de forma segura', 'Puedo coordinar un incidente con roles', 'Redacto postmortems sin culpa con acciones concretas'],
  recursos: [{ kind: 'Libro', label: 'Site Reliability Engineering — Google (capítulos de incidentes y postmortems)' }, { kind: 'Artículo', label: 'The USE Method — Brendan Gregg' }, { kind: 'Colección', label: 'Postmortems públicos (danluu/post-mortems en GitHub)' }],
  relacionados: ['observabilidad-sre', 'redes-protocolos', 'devops-cicd-git', 'performance-caching'],
  plus: {
    conceptos: [
      ['MTTR / tiempo de restauración', 'Cuánto se tarda en restaurar el servicio tras un incidente.'],
      ['Severidad', 'Clasificación del impacto (SEV1 a SEV4) que define quién se activa y cómo se comunica.'],
      ['Incident commander', 'Persona que coordina y decide, no necesariamente la que diagnostica.'],
      ['Mitigación', 'Acción que detiene el impacto aunque no corrija la causa (rollback, desviar tráfico).'],
      ['Causa raíz vs causas contribuyentes', 'Los incidentes rara vez tienen una sola causa; se buscan los factores que lo permitieron.'],
      ['Método USE', 'Para cada recurso: utilización, saturación y errores.'],
      ['Método RED', 'Para cada servicio: tasa de peticiones, errores y duración.'],
      ['Runbook', 'Procedimiento documentado para diagnosticar o mitigar un tipo de alerta.'],
      ['Heap dump / thread dump', 'Fotografía de la memoria o de los hilos de un proceso para analizar fugas o bloqueos.'],
      ['Flame graph', 'Visualización de un perfil de CPU donde el ancho representa el tiempo consumido.']
    ],
    profundidad: [
      { t: 'Los primeros 15 minutos', p: [
        ['**Minuto 0-2**: confirmar que el impacto es real (no una alerta falsa) y su alcance.', '**Minuto 2-5**: declarar el incidente, nombrar comandante y abrir el canal.', '**Minuto 5-10**: revisar cambios recientes (despliegues, configuración, flags, dependencias) y aplicar la mitigación más probable.', '**Minuto 10-15**: primera comunicación a interesados con impacto, acciones y hora de la próxima actualización.'],
        'Revertir sin estar seguro de que el cambio es la causa es aceptable si es seguro: es una hipótesis barata de probar.'
      ] },
      { t: 'Patrones de diagnóstico por síntoma', p: [
        ['**Todo lento**: saturación de un recurso compartido (base, pool, CPU), dependencia lenta o GC.', '**Errores solo en algunos usuarios**: datos particulares, una réplica o zona, una versión de cliente.', '**Fallo periódico**: tareas programadas, expiración de caché, rotación de logs o certificados.', '**Degradación gradual**: fuga de memoria, crecimiento de datos sin índice, colas que se acumulan.', '**Tras un despliegue**: el cambio, su configuración o una migración de base.']
      ] }
    ],
    recurrentes: [
      { tema: '"¿Qué cambió?"', por: 'La mayoría de incidentes siguen a un cambio.', clave: 'Registro centralizado de cambios (despliegues, configuración, flags) correlacionable con las métricas.' },
      { tema: 'Alertas ruidosas', por: 'Si alertan demasiado, se ignoran justo cuando importa.', clave: 'Alerta sobre síntomas del usuario y SLOs; lo demás va a dashboards.' },
      { tema: 'Conocimiento solo en la cabeza de alguien', por: 'Los incidentes nocturnos dependen de una persona.', clave: 'Runbooks enlazados en cada alerta y rotación de guardias.' }
    ],
    casos: [
      { titulo: 'El postmortem público de GitLab como modelo', cuando: 'Ene 2017', que: 'Tras perder horas de datos de producción, GitLab publicó una línea de tiempo detallada, las causas contribuyentes y un plan de mejoras con seguimiento público.', causa: 'Varios mecanismos de respaldo no funcionaban y nadie lo sabía; la acción manual se ejecutó en el servidor equivocado bajo presión.', leccion: 'Un buen postmortem enumera varias causas contribuyentes y convierte cada una en una acción verificable.', fuente: 'Postmortem público de GitLab (feb. 2017)' }
    ],
    escenarios: [
      { sintoma: 'La tasa de errores del checkout sube al 30% a las 03:00.', pasos: ['Confirmar impacto en métricas de negocio (pagos completados).', 'Revisar despliegues, jobs programados y cambios de configuración cercanos.', 'Revisar el estado de dependencias (proveedor de pagos, base).', 'Segmentar errores por endpoint, código y zona.'], solucion: 'Mitigar desactivando el feature flag o revirtiendo el cambio identificado; si es la dependencia, activar el modo degradado y comunicar.' },
      { sintoma: 'Un servicio Java consume cada vez más memoria y se reinicia cada dos días.', pasos: ['Graficar memoria tras GC: si crece tras cada ciclo, hay retención.', 'Tomar dos heap dumps separados por horas y comparar los objetos que crecen.', 'Buscar cachés sin límite, mapas estáticos o listeners no removidos.'], solucion: 'Acotar o eliminar la estructura que retiene objetos y agregar una alerta sobre memoria tras GC.' }
    ]
  }
});
