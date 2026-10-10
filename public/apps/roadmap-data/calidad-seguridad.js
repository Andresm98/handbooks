/* Dominios: Calidad y Seguridad */
RoadmapPlus.temas({
  'testing-calidad': {
    conceptos: [
      ['Pirámide de pruebas', 'Muchas pruebas unitarias rápidas, menos de integración y pocas de extremo a extremo.'],
      ['Prueba unitaria', 'Verifica una unidad de comportamiento aislada, en milisegundos y sin I/O real.'],
      ['Prueba de integración', 'Verifica la interacción con dependencias reales (base, broker), idealmente con Testcontainers.'],
      ['Prueba de contrato', 'Verifica que proveedor y consumidor de una API cumplen el mismo contrato (Pact, OpenAPI).'],
      ['Prueba E2E', 'Recorre el sistema como un usuario; valiosa y frágil, se reserva para flujos críticos.'],
      ['Test double', 'Sustituto de una dependencia: stub (devuelve datos), mock (verifica llamadas), fake (implementación simple).'],
      ['Cobertura', 'Porcentaje de código ejecutado por las pruebas; mide lo no probado, no la calidad de lo probado.'],
      ['Mutation testing', 'Introduce cambios en el código y verifica que alguna prueba falle; mide la efectividad real.'],
      ['Prueba inestable (flaky)', 'Pasa o falla sin cambios en el código: depende de tiempo, orden o estado compartido.'],
      ['Property-based testing', 'Genera muchas entradas aleatorias para verificar propiedades que siempre deben cumplirse.'],
      ['Prueba de carga', 'Mide el comportamiento bajo volumen esperado y pico (k6, Gatling, JMeter).'],
      ['TDD', 'Escribir la prueba antes del código en ciclos cortos rojo-verde-refactor.']
    ],
    profundidad: [
      { t: 'Qué probar en cada nivel', p: [
        ['**Unitarias**: reglas de negocio y casos borde (límites, redondeo, fechas, estados).', '**Integración**: consultas SQL reales, migraciones, serialización, consumidores de mensajes.', '**Contrato**: cada API consumida por otro equipo.', '**E2E**: los 5-10 flujos que no pueden fallar (login, transferencia, pago).', '**No funcionales**: carga, resiliencia (caer una dependencia), seguridad.'],
        'Las pruebas con mocks de la base de datos dan falsa confianza en consultas: el SQL solo se prueba contra un motor real.'
      ], code: { lang: 'Java — prueba de integración con Testcontainers y PostgreSQL real', code: '@Testcontainers\n@SpringBootTest\nclass TransferenciaRepositoryIT {\n    @Container @ServiceConnection\n    static PostgreSQLContainer<?> db = new PostgreSQLContainer<>("postgres:16");\n\n    @Autowired TransferenciaService servicio;\n\n    @Test\n    void noPermiteSaldoNegativoConDebitosConcurrentes() throws Exception {\n        var cuenta = crearCuentaConSaldo("100.00");\n        var tareas = IntStream.range(0, 20)\n            .mapToObj(i -> (Callable<Boolean>) () -> servicio.debitar(cuenta, "10.00"))\n            .toList();\n        Executors.newFixedThreadPool(20).invokeAll(tareas);\n        assertThat(saldo(cuenta)).isEqualByComparingTo("0.00");\n    }\n}' } },
      { t: 'Pruebas que no se rompen con cada refactor', p: [
        ['Prueba comportamiento observable (entradas y salidas), no detalles de implementación.', 'Evita mocks excesivos: verificar que se llamó a un método privado acopla la prueba al diseño.', 'Datos de prueba explícitos en la prueba (builders), no fixtures compartidos gigantes.', 'Nombres que describen el escenario: `rechazaTransferenciaQueSuperaLimiteDiario`.']
      ] },
      { t: 'Eliminar pruebas inestables', p: [
        ['**Tiempo**: inyecta un reloj controlable en lugar de usar `now()`.', '**Asincronía**: espera condiciones (Awaitility), nunca `sleep` fijo.', '**Orden**: cada prueba crea y limpia sus datos.', '**Recursos externos**: contenedores efímeros por suite, no ambientes compartidos.']
      ] }
    ],
    recurrentes: [
      { tema: 'Cobertura como objetivo', por: 'Equipos persiguen el 80% con pruebas que no verifican nada.', clave: 'Usa la cobertura para encontrar zonas sin probar; mide la efectividad con mutation testing o con bugs escapados.' },
      { tema: 'Mocks de la base de datos', por: 'Las consultas fallan en producción aunque las pruebas pasan.', clave: 'Testcontainers con el mismo motor y versión que producción.' },
      { tema: 'Pruebas E2E lentas y frágiles', por: 'Crecen hasta que nadie confía en ellas.', clave: 'Pocas y de flujos críticos; el resto baja a integración o contrato.' },
      { tema: 'Pruebas de fechas y zonas horarias', por: 'Fallan a fin de mes, en cambio de horario o en otro servidor.', clave: 'Reloj inyectable y pruebas explícitas de bordes de fecha y zona.' }
    ],
    casos: [
      { titulo: 'Cloudflare 2019: una regla sin prueba de rendimiento', cuando: 'Jul 2019', que: 'Una regla nueva del WAF con una expresión regular de retroceso catastrófico se desplegó globalmente y llevó la CPU al 100% en toda la red.', causa: 'Las pruebas validaban que la regla detectaba ataques, no su costo de ejecución; el despliegue de reglas no era gradual.', leccion: 'Las pruebas deben cubrir propiedades no funcionales (tiempo de ejecución) de lo que procesa entradas externas, y todo cambio global necesita despliegue progresivo.', fuente: 'Postmortem de Cloudflare, "Details of the Cloudflare outage on July 2, 2019"' }
    ],
    escenarios: [
      { sintoma: 'Una prueba falla 1 de cada 20 ejecuciones en CI.', pasos: ['Correrla en bucle localmente y con orden aleatorio.', 'Buscar dependencias de tiempo, sleeps, datos compartidos o puertos fijos.', 'Revisar si depende de otra prueba que deja estado.'], solucion: 'Aislar datos, reemplazar sleeps por esperas de condición e inyectar el reloj; ponerla en cuarentena mientras tanto.' }
    ]
  },

  'observabilidad-sre': {
    conceptos: [
      ['SLI', 'Indicador de nivel de servicio: medida de lo que el usuario percibe (porcentaje de requests exitosos en menos de 300 ms).'],
      ['SLO', 'Objetivo sobre un SLI en una ventana (99,9% en 30 días).'],
      ['SLA', 'Compromiso contractual con consecuencias; debe ser más laxo que el SLO interno.'],
      ['Presupuesto de error', '100% menos el SLO: cuánta falla se tolera. Si se agota, se prioriza confiabilidad sobre funcionalidades.'],
      ['Burn rate', 'Velocidad a la que se consume el presupuesto de error; base de las alertas por SLO.'],
      ['Golden signals', 'Latencia, tráfico, errores y saturación.'],
      ['Percentiles', 'p50, p95, p99: el promedio oculta la experiencia de los usuarios más afectados.'],
      ['Log estructurado', 'Logs en JSON con campos (trace_id, user_id, operación) consultables.'],
      ['Traza distribuida', 'Recorrido de un request por varios servicios con spans y tiempos.'],
      ['OpenTelemetry', 'Estándar abierto para instrumentar métricas, logs y trazas sin depender de un proveedor.'],
      ['Cardinalidad', 'Número de combinaciones de etiquetas de una métrica; un user_id como etiqueta puede tumbar el sistema de métricas.'],
      ['Toil', 'Trabajo operativo manual, repetitivo y automatizable que crece con el sistema.']
    ],
    profundidad: [
      { t: 'Definir SLOs que sirvan', p: [
        ['Parte del viaje del usuario: "el cliente puede ver su saldo", "la transferencia se ejecuta".', 'SLI medido lo más cerca posible del usuario (balanceador o cliente), no en la CPU del servidor.', '99,9% mensual = unos 43 minutos de indisponibilidad al mes; 99,99% = unos 4 minutos. Cada nueve cuesta mucho más.', 'Alerta por burn rate en dos ventanas (rápida y lenta) en lugar de umbrales fijos de errores.']
      ] },
      { t: 'Instrumentar bien un servicio', p: [
        ['Métricas RED por endpoint: tasa, errores, duración (histogramas, no promedios).', 'Logs estructurados con trace_id en cada línea para saltar de la traza a los logs.', 'Trazas con propagación de contexto (W3C traceparent) entre servicios y mensajes.', 'Sin datos sensibles en logs: enmascara números de cuenta, tokens y datos personales.', 'Métricas de negocio: transferencias por minuto, tasa de rechazo, monto procesado.']
      ], code: { lang: 'JSON — log estructurado correlacionado con la traza', code: '{\n  "ts": "2026-10-09T14:03:21.512Z",\n  "level": "WARN",\n  "service": "transferencias",\n  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",\n  "span_id": "00f067aa0ba902b7",\n  "event": "limite_diario_excedido",\n  "cuenta": "****4821",\n  "monto": "1500.00",\n  "limite_restante": "200.00",\n  "duracion_ms": 38\n}' } },
      { t: 'Alertas que despiertan solo cuando importa', p: [
        ['Alerta sobre síntomas del usuario (SLO), no sobre causas (CPU al 80%).', 'Toda alerta debe ser accionable y tener runbook.', 'Revisa periódicamente las alertas que se ignoran o se silencian.', 'Las causas (disco, CPU, memoria) van a dashboards y a alertas de baja prioridad o tickets.']
      ] }
    ],
    recurrentes: [
      { tema: 'Promedios que engañan', por: 'El promedio está bien mientras el 5% de usuarios espera 10 segundos.', clave: 'Histogramas y percentiles p95/p99 por endpoint.' },
      { tema: 'Fatiga de alertas', por: 'Cientos de alertas por semana que nadie mira.', clave: 'Alertas por SLO y burn rate; lo demás a dashboards.' },
      { tema: 'Explosión de cardinalidad', por: 'Etiquetas con IDs únicos disparan costo y caídas del sistema de métricas.', clave: 'IDs en logs y trazas, nunca como etiqueta de métrica.' },
      { tema: 'Datos sensibles en logs', por: 'Hallazgo recurrente en auditorías bancarias y de PCI.', clave: 'Enmascarado en la librería de logging y revisión automática.' }
    ],
    casos: [
      { titulo: 'Google y el presupuesto de error', cuando: '2016', que: 'El libro de SRE de Google popularizó el presupuesto de error: mientras queda presupuesto, el equipo lanza funcionalidades; si se agota, se congela el riesgo y se invierte en confiabilidad.', causa: 'La tensión permanente entre velocidad de desarrollo y estabilidad sin un criterio objetivo para decidir.', leccion: 'Un SLO acordado con negocio convierte la discusión "más features o más estabilidad" en una decisión basada en datos.', fuente: 'Site Reliability Engineering, O\'Reilly (2016), capítulo "Embracing Risk"' },
      { titulo: 'Roblox: la telemetría caía con el sistema que observaba', cuando: 'Oct 2021', que: 'Durante su caída de 73 horas, Roblox tuvo dificultades para diagnosticar porque partes de su sistema de monitoreo dependían de la misma infraestructura afectada.', causa: 'Dependencia circular entre la observabilidad y la plataforma observada.', leccion: 'La observabilidad crítica debe funcionar cuando la plataforma principal no funciona.', fuente: 'Postmortem de Roblox (ene. 2022)' }
    ],
    escenarios: [
      { sintoma: 'Los clientes se quejan de lentitud pero todos los dashboards están en verde.', pasos: ['Revisar si los dashboards muestran promedios en lugar de percentiles.', 'Medir desde el borde (balanceador, RUM) y no solo desde el servicio.', 'Segmentar por endpoint, versión de app y región.'], solucion: 'Histogramas por endpoint, SLIs medidos en el borde y alertas sobre p99.' }
    ]
  },

  'seguridad-redes-linux': {
    conceptos: [
      ['Autenticación vs autorización', 'Autenticar es verificar quién eres; autorizar es decidir qué puedes hacer.'],
      ['OAuth 2.0', 'Marco de autorización delegada: un cliente obtiene un access token para actuar sobre recursos.'],
      ['OpenID Connect', 'Capa de identidad sobre OAuth 2.0: agrega el ID token con información del usuario.'],
      ['Authorization Code + PKCE', 'El flujo recomendado para aplicaciones web y móviles; reemplaza al flujo implícito.'],
      ['JWT', 'Token firmado con claims; se valida firma, emisor, audiencia y expiración. No es cifrado por defecto.'],
      ['Access vs refresh token', 'Access token de vida corta para llamar APIs; refresh token de vida larga, guardado con más protección.'],
      ['Scopes y claims', 'Permisos del token y atributos del sujeto; la autorización fina se decide en el servicio.'],
      ['mTLS', 'Autenticación mutua por certificados, común entre servicios y con terceros financieros.'],
      ['Principio de mínimo privilegio', 'Cada identidad tiene solo los permisos estrictamente necesarios.'],
      ['Permisos de Linux', 'Usuario, grupo y otros con lectura, escritura y ejecución; los servicios no deben correr como root.'],
      ['Firewall / segmentación', 'Limitar qué puede hablar con qué; la red interna no es confiable por defecto (zero trust).'],
      ['Gestión de secretos', 'Secretos en un vault con rotación y auditoría, nunca en código ni en variables de imagen.']
    ],
    profundidad: [
      { t: 'Validar un JWT correctamente', p: [
        ['Verifica la firma con la clave pública del emisor (JWKS) y rechaza `alg: none`.', 'Valida `iss` (emisor), `aud` (que el token es para tu API), `exp` y `nbf`.', 'No confíes en claims para autorizar recursos sin verificar la pertenencia del recurso.', 'Revocar un JWT antes de su expiración requiere listas de revocación o tokens de vida corta; por eso los access tokens duran minutos.', 'Nunca pongas datos sensibles en el payload: cualquiera puede decodificarlo.']
      ], code: { lang: 'Java (Spring Security) — resource server con validación de audiencia', code: '@Bean\nSecurityFilterChain api(HttpSecurity http) throws Exception {\n    http.authorizeHttpRequests(a -> a\n            .requestMatchers("/actuator/health/**").permitAll()\n            .requestMatchers(HttpMethod.POST, "/transferencias").hasAuthority("SCOPE_transferencias:write")\n            .anyRequest().authenticated())\n        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));\n    return http.build();\n}\n// application.yml: spring.security.oauth2.resourceserver.jwt.issuer-uri y audiences' } },
      { t: 'Linux para depurar servicios', p: [
        ['`ss -tlnp`: qué escucha en qué puerto; `ss -s` para conteo de conexiones.', '`top`/`htop` y `vmstat`: CPU, memoria, swap y procesos en espera.', '`df -h` y `du`: disco lleno (logs) es una causa clásica de caídas.', '`journalctl -u servicio` y `dmesg`: logs del sistema y del kernel (OOM killer).', '`dig` y `nslookup` para DNS; `curl -v` y `openssl s_client` para HTTP y TLS.', '`ulimit -n`: límite de descriptores de archivo, causa de "too many open files".']
      ] },
      { t: 'Zero trust y segmentación', p: [
        ['Autentica y autoriza cada llamada entre servicios (mTLS o tokens de servicio), aunque estén en la misma red.', 'Políticas de red (NetworkPolicy, security groups) que permiten solo el tráfico necesario.', 'Accesos administrativos con identidad, MFA y registro; sin llaves SSH compartidas.', 'Separación de ambientes: desarrollo nunca accede a datos de producción.']
      ] }
    ],
    recurrentes: [
      { tema: 'Tokens en el lugar equivocado', por: 'localStorage, URLs y logs exponen tokens.', clave: 'Cookies HttpOnly con BFF o almacenamiento seguro del sistema; nunca tokens en URLs ni logs.' },
      { tema: 'Validación incompleta de JWT', por: 'Aceptar tokens de otra audiencia o sin verificar firma.', clave: 'Usa la librería del framework con issuer y audience configurados.' },
      { tema: 'Servicios corriendo como root', por: 'Aumenta el impacto de cualquier vulnerabilidad.', clave: 'Usuario no privilegiado, sistema de archivos de solo lectura y capacidades mínimas.' },
      { tema: 'Parches pendientes', por: 'La mayoría de brechas explotan vulnerabilidades conocidas.', clave: 'Inventario de software, escaneo continuo y SLA de parcheo por severidad.' }
    ],
    casos: [
      { titulo: 'Equifax: una vulnerabilidad conocida sin parchear', cuando: 'Mar-Jul 2017', que: 'Atacantes obtuvieron datos personales de unos 147 millones de personas.', causa: 'Una vulnerabilidad de Apache Struts (CVE-2017-5638) con parche disponible desde marzo no se aplicó en un portal; además, un certificado expirado en una herramienta de inspección de tráfico impidió detectar la exfiltración durante meses.', leccion: 'Inventario de componentes y parcheo con plazos por severidad; los controles de detección también necesitan mantenimiento (certificados, licencias).', fuente: 'Informe del Comité de Supervisión de la Cámara de Representantes de EE. UU. sobre la filtración de Equifax (dic. 2018)' },
      { titulo: 'Heartbleed', cuando: 'Abr 2014', que: 'Una vulnerabilidad en OpenSSL permitía leer hasta 64 KB de memoria del servidor por petición, incluidas claves privadas y contraseñas.', causa: 'Falta de validación de longitud en la extensión heartbeat de TLS (lectura fuera de límites).', leccion: 'Las bibliotecas criptográficas críticas necesitan auditoría y financiamiento; tras parchear hay que rotar claves y certificados expuestos.', fuente: 'CVE-2014-0160 y aviso de seguridad de OpenSSL (abr. 2014)' }
    ],
    escenarios: [
      { sintoma: 'El servicio falla con "too many open files" bajo carga.', pasos: ['Revisar `ulimit -n` del proceso y el número de descriptores abiertos (`ls /proc/<pid>/fd | wc -l`).', 'Buscar conexiones o archivos que no se cierran.'], solucion: 'Cerrar recursos correctamente (try-with-resources, using), reutilizar conexiones y ajustar el límite si la carga lo justifica.' },
      { sintoma: 'Una API acepta tokens emitidos para otra aplicación.', pasos: ['Revisar la configuración de audiencia en la validación del JWT.', 'Verificar si se valida el emisor.'], solucion: 'Configurar issuer y audience obligatorios y agregar pruebas con tokens de otra audiencia.' }
    ]
  }
});

/* ---------- Temas nuevos de Seguridad y Calidad ---------- */
RoadmapPlus.nuevo({
  id: 'seguridad-aplicativa-owasp', num: 28, titulo: 'Seguridad Aplicativa: OWASP Top 10 y Secure Coding',
  dominio: 'Seguridad', resumen: 'Las vulnerabilidades que más se explotan en aplicaciones web y APIs, cómo se ven en el código y cómo prevenirlas.',
  nivel: 'Semi Senior', dificultad: 3, tiempoEstimado: '20-30h', prereq: ['apis-rest-graphql', 'seguridad-redes-linux'],
  tecnologias: ['OWASP Top 10', 'OWASP API Top 10', 'SAST', 'DAST', 'SCA', 'Threat modeling'],
  matriz: { frecuencia: 'Alta', importancia: 'Crítica' },
  c: {
    definicion: 'La seguridad aplicativa es la práctica de diseñar, escribir y probar software que resista ataques. OWASP Top 10 es la lista de referencia de los riesgos más críticos en aplicaciones web; la OWASP API Security Top 10 hace lo mismo para APIs.',
    problema: 'La mayoría de las brechas no vienen de ataques sofisticados sino de errores repetidos: falta de autorización en un endpoint, consultas construidas con concatenación, dependencias vulnerables, secretos en el código o configuraciones por defecto. En banca, cada uno puede significar fraude, multas regulatorias y pérdida de confianza.',
    fundamentos: 'Los principios base son: no confiar en ninguna entrada, validar y codificar según el contexto de salida, autorizar cada acceso a cada recurso, mínimo privilegio, defensa en profundidad, fallar de forma segura y mantener dependencias actualizadas. La OWASP Top 10 (edición 2021) incluye control de acceso roto, fallas criptográficas, inyección, diseño inseguro, configuración insegura, componentes vulnerables, fallas de autenticación, fallas de integridad, fallas de registro y monitoreo, y SSRF.',
    arquitectura: 'La seguridad se integra en el ciclo: threat modeling en el diseño, revisión de código con foco en seguridad, SAST (análisis estático), SCA (dependencias), escaneo de secretos y de imágenes en el pipeline, DAST y pentests sobre la aplicación desplegada, y monitoreo de eventos de seguridad en producción.',
    funcionamiento: 'En el código: consultas parametrizadas, autorización a nivel de objeto en cada endpoint, contraseñas con algoritmos lentos (bcrypt, Argon2), secretos desde un vault, cabeceras de seguridad, validación de URLs de salida para evitar SSRF y registro de eventos de seguridad sin datos sensibles.',
    buenas: ['Consultas parametrizadas u ORM, nunca concatenación.', 'Autorización por recurso en cada endpoint, verificada con pruebas.', 'Dependencias escaneadas y actualizadas con SLA por severidad.', 'Secretos en un vault y escaneo de secretos en el repositorio.', 'Threat modeling para funcionalidades sensibles.', 'Registro de eventos de seguridad (logins, cambios de permisos, fallos de autorización).'],
    malas: ['Confiar en validaciones del frontend.', 'Construir SQL o comandos con strings.', 'Mensajes de error con trazas o datos internos.', 'Criptografía casera.', 'Desactivar la verificación TLS.'],
    errores: ['Autenticar sin autorizar el recurso concreto.', 'Hashear contraseñas con SHA-256 sin sal ni algoritmo lento.', 'Exponer endpoints de administración o actuator sin protección.'],
    patrones: ['Validación de entrada por lista permitida', 'Codificación de salida por contexto', 'Autorización centralizada por políticas', 'Secretos dinámicos', 'Rate limiting en autenticación'],
    antipatrones: ['Seguridad por oscuridad', 'Listas negras de caracteres', 'Un único usuario de base de datos con todos los permisos'],
    ejemploReal: 'Un endpoint `GET /api/extractos/{id}` validaba que el usuario estuviera autenticado pero no que el extracto fuera suyo; cambiando el número en la URL se descargaban extractos de otros clientes. La corrección fue verificar la pertenencia y usar identificadores no secuenciales.',
    ejemploBanca: 'Los bancos combinan controles: autenticación fuerte con MFA, límites transaccionales en el backend, detección de fraude, registro inmutable de operaciones y pruebas de penetración periódicas exigidas por el regulador y por PCI DSS.',
    ejemploEmpresarial: 'Las empresas con programas de bug bounty reciben con frecuencia reportes de IDOR y fallas de control de acceso, la categoría número uno de OWASP.',
    comparacion: { headers: ['Vulnerabilidad', 'Ejemplo', 'Prevención'], rows: [['Control de acceso roto', 'Ver la cuenta de otro cambiando un ID', 'Autorización por objeto'], ['Inyección', 'SQL concatenado con input', 'Consultas parametrizadas'], ['SSRF', 'Servidor que descarga una URL del usuario', 'Lista permitida de destinos'], ['Componentes vulnerables', 'Log4j sin parchear', 'SCA y parcheo continuo']] },
    ventajas: ['Menos brechas y fraudes', 'Cumplimiento regulatorio', 'Confianza de clientes'],
    desventajas: ['Requiere formación continua', 'Herramientas con falsos positivos que hay que gestionar'],
    faq: [
      { q: '¿El ORM me protege de inyección SQL?', a: 'En las consultas que genera sí; las consultas nativas o los fragmentos concatenados siguen siendo vulnerables.' },
      { q: '¿Qué algoritmo uso para contraseñas?', a: 'Argon2id o bcrypt con un costo adecuado; nunca hashes rápidos como MD5 o SHA-256 solos.' },
      { q: '¿Quién es responsable de la seguridad?', a: 'Todo el equipo; seguridad aporta herramientas, criterios y revisiones, pero el código seguro lo escriben los desarrolladores.' }
    ],
    codigo: { lang: 'Java — consulta parametrizada y autorización por objeto', code: '// Vulnerable: concatenación\n// jdbc.query("select * from extractos where id = " + id, ...);\n\n@GetMapping("/extractos/{id}")\nExtractoDto obtener(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {\n    var extracto = repo.findById(id).orElseThrow(NoEncontrado::new);\n    if (!extracto.clienteId().equals(jwt.getSubject())) {\n        auditoria.registrarAccesoDenegado(jwt.getSubject(), id);\n        throw new NoEncontrado(); // 404, no 403: no confirmar que existe\n    }\n    return ExtractoDto.de(extracto);\n}' }
  },
  entrevistas: [
    { nivel: 'Junior', pregunta: '¿Qué es una inyección SQL y cómo se previene?', respuesta: 'Insertar SQL a través de una entrada que se concatena en una consulta; se previene con consultas parametrizadas.' },
    { nivel: 'Junior', pregunta: '¿Qué es XSS?', respuesta: 'Inyectar scripts que se ejecutan en el navegador de otro usuario; se previene codificando la salida según contexto y con CSP.' },
    { nivel: 'Semi Senior', pregunta: '¿Qué es IDOR o BOLA?', respuesta: 'Acceder a objetos de otros usuarios manipulando identificadores, porque el servidor no verifica la pertenencia del recurso.' },
    { nivel: 'Semi Senior', pregunta: '¿Cómo almacenarías contraseñas?', respuesta: 'Con Argon2id o bcrypt, sal única por usuario y costo ajustado; idealmente delegando la autenticación a un proveedor de identidad.' },
    { nivel: 'Senior', pregunta: '¿Qué es SSRF y cómo lo mitigas?', respuesta: 'Hacer que el servidor realice peticiones a destinos elegidos por el atacante (por ejemplo metadatos de la nube); se mitiga con listas permitidas, bloqueo de IPs internas, IMDSv2 y segmentación de red.' },
    { nivel: 'Senior', pregunta: '¿Cómo integras seguridad en el pipeline?', respuesta: 'SAST, SCA, escaneo de secretos e imágenes en cada PR con umbrales que bloquean, DAST en staging y gestión de excepciones con fecha.' },
    { nivel: 'Staff/Arquitecto', pregunta: '¿Cómo harías threat modeling de una funcionalidad de transferencias?', respuesta: 'Diagrama de flujo de datos, identificación de amenazas con STRIDE por componente y frontera de confianza, priorización por riesgo y controles verificables.' },
    { nivel: 'Staff/Arquitecto', pregunta: '¿Cómo gestionas una vulnerabilidad crítica en una dependencia transversal?', respuesta: 'SBOM para saber qué sistemas la usan, mitigaciones temporales (WAF, configuración), parcheo priorizado por exposición y verificación posterior.' }
  ],
  ejercicios: ['Explota y corrige localmente inyección SQL, XSS e IDOR en una aplicación vulnerable de práctica (OWASP Juice Shop).', 'Haz threat modeling con STRIDE de un flujo de pago.', 'Configura SAST, SCA y escaneo de secretos en un pipeline y gestiona los hallazgos.'],
  proyecto: { titulo: 'API bancaria endurecida', desc: 'API de cuentas y transferencias con autorización por objeto, consultas parametrizadas, rate limiting de autenticación, auditoría de eventos de seguridad, pruebas automáticas de acceso indebido y pipeline con SAST, SCA y escaneo de secretos.', tech: ['Spring Boot o .NET', 'OWASP ZAP', 'Semgrep o SonarQube', 'Dependabot o Renovate', 'gitleaks'] },
  checklist: ['Conozco la OWASP Top 10 y la API Top 10', 'Uso consultas parametrizadas siempre', 'Implemento autorización por objeto con pruebas', 'Almaceno contraseñas correctamente', 'Prevengo SSRF', 'Integro SAST, SCA y escaneo de secretos', 'Sé hacer un threat model básico'],
  recursos: [{ kind: 'Estándar', label: 'OWASP Top 10 (2021) y OWASP API Security Top 10 (2023)' }, { kind: 'Guía', label: 'OWASP Cheat Sheet Series' }, { kind: 'Estándar', label: 'OWASP ASVS — Application Security Verification Standard' }],
  relacionados: ['seguridad-redes-linux', 'apis-rest-graphql', 'devops-cicd-git', 'ingenieria-banca'],
  plus: {
    conceptos: [
      ['Control de acceso roto', 'Categoría número uno de OWASP: usuarios que acceden a datos o acciones fuera de sus permisos.'],
      ['Inyección', 'Datos que se interpretan como código o comando (SQL, NoSQL, OS, LDAP).'],
      ['XSS', 'Ejecución de scripts en el navegador de la víctima (reflejado, almacenado, DOM).'],
      ['CSRF', 'Una página maliciosa hace que el navegador de la víctima envíe una acción autenticada; se mitiga con SameSite y tokens anti-CSRF.'],
      ['SSRF', 'El servidor hace peticiones a destinos elegidos por el atacante.'],
      ['Deserialización insegura', 'Reconstruir objetos desde datos no confiables puede ejecutar código.'],
      ['Mass assignment', 'Vincular todo el JSON de entrada a la entidad permite cambiar campos protegidos (rol, saldo).'],
      ['Threat modeling', 'Análisis estructurado de qué puede salir mal (STRIDE) antes de construir.'],
      ['SAST / DAST / SCA', 'Análisis estático, dinámico y de componentes de terceros.'],
      ['SBOM', 'Inventario de componentes de software de un artefacto.'],
      ['Secrets scanning', 'Detección de credenciales en repositorios e historial.'],
      ['Defensa en profundidad', 'Varias capas de control para que el fallo de una no comprometa el sistema.']
    ],
    profundidad: [
      { t: 'Autorización: el error más frecuente', p: [
        ['Verifica en el servidor, en cada endpoint, que el usuario puede actuar sobre **ese** recurso.', 'Centraliza la lógica de autorización (políticas) para no repetirla mal en 50 controladores.', 'Responde 404 en lugar de 403 para no confirmar la existencia de recursos ajenos cuando corresponda.', 'Escribe pruebas automáticas que intenten acceder a recursos de otro usuario y a funciones de administración.', 'Usa DTOs de entrada explícitos para evitar mass assignment.']
      ] },
      { t: 'Threat modeling con STRIDE en 30 minutos', p: [
        ['Dibuja el flujo de datos con sus fronteras de confianza (navegador, API, base, terceros).', '**S**poofing: ¿se puede suplantar a alguien?', '**T**ampering: ¿se pueden modificar datos en tránsito o reposo?', '**R**epudiation: ¿se puede negar haber hecho una operación? (auditoría)', '**I**nformation disclosure: ¿qué se puede filtrar?', '**D**enial of service: ¿qué se puede saturar?', '**E**levation of privilege: ¿cómo se obtienen más permisos?', 'Cada amenaza relevante termina en un control verificable o en un riesgo aceptado por escrito.']
      ] }
    ],
    recurrentes: [
      { tema: 'IDOR en endpoints nuevos', por: 'Cada endpoint nuevo es una oportunidad de olvidar la verificación de pertenencia.', clave: 'Política de autorización centralizada y pruebas automáticas de acceso cruzado.' },
      { tema: 'Dependencias vulnerables', por: 'Aparecen nuevas CVEs cada semana en librerías que ya usas.', clave: 'Bots de actualización, SCA en el pipeline y SLA de corrección por severidad.' },
      { tema: 'Secretos filtrados en Git', por: 'Un commit con una llave queda en el historial aunque se borre después.', clave: 'Escaneo de secretos antes del push y rotación inmediata si se filtra.' }
    ],
    casos: [
      { titulo: 'Equifax: parche disponible, no aplicado', cuando: '2017', que: 'La vulnerabilidad de Apache Struts explotada tenía parche desde hacía unos dos meses cuando comenzó el ataque que expuso datos de unos 147 millones de personas.', causa: 'Falta de inventario preciso de dónde se usaba el componente y proceso de parcheo que no verificó su aplicación.', leccion: 'Componentes vulnerables (OWASP A06) es un problema de inventario y proceso, no solo técnico.', fuente: 'Informe del Comité de Supervisión de la Cámara de EE. UU. (dic. 2018)' },
      { titulo: 'Capital One: SSRF en la nube', cuando: '2019', que: 'Una SSRF a través de un WAF mal configurado permitió obtener credenciales temporales del servicio de metadatos y leer datos de unos 100 millones de clientes.', causa: 'SSRF combinado con un rol con permisos excesivos.', leccion: 'SSRF (OWASP A10) es especialmente grave en la nube: IMDSv2, mínimo privilegio y filtrado de destinos.', fuente: 'Comunicado de Capital One y Departamento de Justicia de EE. UU. (jul. 2019)' }
    ],
    escenarios: [
      { sintoma: 'El escáner de dependencias reporta una CVE crítica en una librería transitiva.', pasos: ['Confirmar si la parte vulnerable se usa y si es alcanzable desde una entrada externa.', 'Buscar la versión corregida y si el padre directo la admite.', 'Evaluar mitigaciones temporales.'], solucion: 'Actualizar (o forzar la versión transitiva), desplegar y registrar la evaluación; si no hay parche, mitigar y documentar el riesgo con fecha de revisión.' }
    ]
  }
});

RoadmapPlus.nuevo({
  id: 'performance-caching', num: 29, titulo: 'Performance, Escalabilidad y Caching',
  dominio: 'Calidad', resumen: 'Medir, encontrar el cuello de botella y escalar: latencia, throughput, profiling, pruebas de carga y estrategias de caché.',
  nivel: 'Senior', dificultad: 4, tiempoEstimado: '20-30h', prereq: ['bases-relacionales', 'bases-nosql-cache', 'observabilidad-sre'],
  tecnologias: ['Profiling', 'k6', 'Gatling', 'Redis', 'CDN', 'Connection pooling', 'Autoscaling'],
  matriz: { frecuencia: 'Alta', importancia: 'Alta' },
  c: {
    definicion: 'Performance es cuánto tarda y cuántos recursos consume el sistema para una carga dada; escalabilidad es su capacidad de mantener ese desempeño al crecer la carga agregando recursos. El caching guarda resultados costosos para reutilizarlos.',
    problema: 'Los problemas de rendimiento aparecen con datos y tráfico reales: picos de fin de mes, campañas, cierres contables. Optimizar sin medir desperdicia esfuerzo en lo que no importa; escalar sin entender el cuello de botella solo lo traslada.',
    fundamentos: 'La ley de Little relaciona concurrencia, throughput y latencia (L = λ × W). La ley de Amdahl limita la mejora por paralelismo según la parte secuencial. La latencia se analiza en percentiles. Los cuellos de botella típicos son la base de datos, las llamadas remotas en serie, la serialización, la contención de locks y las pausas de GC.',
    arquitectura: 'Escalar empieza por eliminar trabajo (consultas, llamadas, bytes), luego cachear (cliente, CDN, aplicación, base), luego escalar horizontalmente lo que no tiene estado y, finalmente, particionar los datos. Las colas absorben picos y desacoplan el trabajo que no necesita respuesta inmediata.',
    funcionamiento: 'Ciclo: definir el objetivo (p99 < 300 ms a 500 rps), medir la línea base con pruebas de carga realistas, perfilar para encontrar dónde se va el tiempo, cambiar una cosa, volver a medir y repetir hasta cumplir el objetivo.',
    buenas: ['Definir objetivos de rendimiento medibles antes de optimizar.', 'Perfilar en condiciones realistas antes de cambiar código.', 'Paralelizar llamadas remotas independientes.', 'Cachear con TTL y estrategia de invalidación explícitas.', 'Probar carga con datos y patrones de producción.'],
    malas: ['Optimizar por intuición.', 'Medir solo promedios.', 'Escalar réplicas cuando el cuello de botella es la base de datos.', 'Cachear todo sin pensar en consistencia.', 'Pruebas de carga contra datos vacíos.'],
    errores: ['Olvidar el warm-up de la JVM o del JIT al medir.', 'Probar carga desde una sola máquina saturada que se convierte en el cuello de botella.', 'Ignorar el efecto del pool de conexiones al escalar réplicas.'],
    patrones: ['Cache-aside', 'Read replicas', 'Paginación keyset', 'Procesamiento asíncrono con colas', 'Batching', 'Bulkhead', 'CDN'],
    antipatrones: ['Llamadas remotas en bucle', 'Chatty APIs', 'Caché sin TTL', 'Escalar vertical indefinidamente'],
    ejemploReal: 'Una pantalla de resumen de cliente llamaba en serie a 6 servicios (cuentas, tarjetas, préstamos, inversiones, seguros, notificaciones) con 150 ms cada uno: 900 ms. Paralelizar las llamadas independientes la dejó en unos 200 ms.',
    ejemploBanca: 'Los cierres de mes y el pago de nómina generan picos de varias veces el tráfico normal; los bancos los preparan con pruebas de carga, escalado anticipado y colas para el procesamiento masivo.',
    ejemploEmpresarial: 'Amazon ha reportado que pequeños aumentos de latencia reducen las ventas; las empresas de comercio electrónico preparan Black Friday con meses de pruebas de carga.',
    comparacion: { headers: ['Nivel de caché', 'Latencia típica', 'Riesgo'], rows: [['Navegador / cliente', 'Inmediato', 'Datos viejos sin control del servidor'], ['CDN', 'Decenas de ms', 'Invalidación y datos personalizados'], ['Caché distribuida (Redis)', '~1 ms en la red', 'Consistencia y stampede'], ['Caché en memoria del proceso', 'Microsegundos', 'Inconsistencia entre réplicas, memoria']] },
    ventajas: ['Mejor experiencia de usuario', 'Menor costo de infraestructura', 'Capacidad para picos'],
    desventajas: ['Las cachés introducen inconsistencia', 'Optimizar agrega complejidad que hay que justificar'],
    faq: [
      { q: '¿Cuándo optimizo?', a: 'Cuando hay un objetivo incumplido o un costo medible; antes, el código claro gana.' },
      { q: '¿Qué mido en una prueba de carga?', a: 'Throughput, percentiles de latencia, tasa de errores y saturación de recursos, a distintos niveles de carga hasta encontrar el punto de quiebre.' },
      { q: '¿Escalo vertical u horizontal?', a: 'Vertical es más simple y suele bastar al principio; horizontal requiere servicios sin estado y da resiliencia.' }
    ],
    codigo: { lang: 'JavaScript (k6) — prueba de carga con umbrales', code: 'import http from "k6/http";\nimport { check } from "k6";\n\nexport const options = {\n  stages: [\n    { duration: "2m", target: 200 },  // rampa\n    { duration: "5m", target: 200 },  // carga sostenida\n    { duration: "2m", target: 600 },  // pico de fin de mes\n  ],\n  thresholds: {\n    http_req_duration: ["p(95)<300", "p(99)<800"],\n    http_req_failed: ["rate<0.01"],\n  },\n};\n\nexport default function () {\n  const r = http.get(`${__ENV.BASE_URL}/clientes/${Math.ceil(Math.random() * 50000)}/resumen`);\n  check(r, { "status 200": (res) => res.status === 200 });\n}' }
  },
  entrevistas: [
    { nivel: 'Junior', pregunta: '¿Qué diferencia hay entre latencia y throughput?', respuesta: 'Latencia es cuánto tarda una operación; throughput es cuántas operaciones se completan por unidad de tiempo.' },
    { nivel: 'Semi Senior', pregunta: '¿Por qué usar p99 en lugar del promedio?', respuesta: 'Porque el promedio oculta a los usuarios más lentos, y en sistemas con muchas llamadas por página casi todos los usuarios experimentan la cola.' },
    { nivel: 'Semi Senior', pregunta: '¿Cómo encontrarías el cuello de botella de un endpoint lento?', respuesta: 'Con trazas para ver qué span consume el tiempo y con un profiler para el código; luego verifico la hipótesis con una medición antes y después.' },
    { nivel: 'Senior', pregunta: '¿Qué pasa al escalar de 3 a 30 réplicas un servicio con pool de 50 conexiones?', respuesta: 'Se pasa de 150 a 1.500 conexiones a la base, que puede colapsar; hay que dimensionar pools o usar un pooler como pgbouncer.' },
    { nivel: 'Senior', pregunta: '¿Cómo evitas el cache stampede?', respuesta: 'Lock de recálculo, TTL con jitter, refresco anticipado y servir el valor viejo mientras se recalcula.' },
    { nivel: 'Senior', pregunta: '¿Qué dice la ley de Little y para qué sirve?', respuesta: 'Concurrencia = throughput × latencia; sirve para dimensionar pools, hilos y réplicas.' },
    { nivel: 'Staff/Arquitecto', pregunta: '¿Cómo prepararías un sistema para un pico 10 veces mayor?', respuesta: 'Prueba de carga para encontrar el primer cuello de botella, escalado anticipado, caché y CDN, colas para trabajo diferible, degradación controlada de funciones no críticas y rate limiting.' },
    { nivel: 'Staff/Arquitecto', pregunta: '¿Cuándo no cachearías?', respuesta: 'Cuando el dato debe ser exacto y actual (saldos para autorizar), cuando la tasa de acierto sería baja o cuando la complejidad de invalidación supera el beneficio.' }
  ],
  ejercicios: ['Encuentra con un profiler la función más costosa de un endpoint y optimízala midiendo antes y después.', 'Diseña y ejecuta una prueba de carga con rampa, carga sostenida y pico, y reporta el punto de quiebre.', 'Implementa cache-aside con protección contra stampede y mide la tasa de acierto.'],
  proyecto: { titulo: 'Optimización del resumen de cliente', desc: 'Servicio que agrega datos de 5 servicios simulados; partir de una implementación lenta, medir con k6 y trazas, y llevarlo a un p99 objetivo con paralelismo, caché y consultas optimizadas, documentando cada mejora con números.', tech: ['k6', 'OpenTelemetry', 'Redis', 'PostgreSQL', 'Profiler del lenguaje'] },
  checklist: ['Defino objetivos de rendimiento medibles', 'Mido con percentiles', 'Sé perfilar CPU y memoria', 'Diseño y ejecuto pruebas de carga realistas', 'Aplico la ley de Little para dimensionar', 'Elijo el nivel de caché adecuado', 'Prevengo cache stampede'],
  recursos: [{ kind: 'Libro', label: 'Systems Performance — Brendan Gregg' }, { kind: 'Libro', label: 'Designing Data-Intensive Applications — Martin Kleppmann' }, { kind: 'Doc oficial', label: 'Documentación de k6' }],
  relacionados: ['bases-nosql-cache', 'bases-relacionales', 'observabilidad-sre', 'system-design'],
  plus: {
    conceptos: [
      ['Latencia de cola', 'La de los percentiles altos (p99, p99.9); domina la experiencia cuando una página hace muchas llamadas.'],
      ['Throughput', 'Operaciones completadas por segundo.'],
      ['Saturación', 'Trabajo que espera porque el recurso está ocupado (cola de CPU, conexiones en espera).'],
      ['Ley de Little', 'L = λ × W: concurrencia = tasa de llegada × tiempo en el sistema.'],
      ['Ley de Amdahl', 'La mejora por paralelismo está limitada por la fracción secuencial del trabajo.'],
      ['Profiling', 'Medir dónde se gasta CPU, memoria o tiempo de espera dentro del proceso.'],
      ['Tasa de acierto de caché', 'Porcentaje de lecturas servidas desde caché; por debajo de cierto valor la caché no compensa.'],
      ['Warm-up', 'Periodo inicial en que el JIT, las cachés y los pools aún no están listos.'],
      ['Backpressure', 'Rechazar o frenar carga cuando el sistema está saturado en lugar de acumularla.'],
      ['Degradación controlada', 'Apagar funciones no críticas bajo carga para proteger las críticas.'],
      ['Connection pool', 'Reutilizar conexiones costosas; su tamaño es un límite de concurrencia.'],
      ['Autoscaling', 'Agregar capacidad automáticamente según métricas; tarda en reaccionar y no ayuda si el límite es la base.']
    ],
    profundidad: [
      { t: 'El método: medir, aislar, cambiar, medir', p: [
        ['Fija el objetivo y la carga de referencia.', 'Mide la línea base con la misma prueba que usarás después.', 'Usa trazas para ubicar el componente y un profiler para la línea de código.', 'Cambia una sola cosa por iteración.', 'Verifica que la mejora no empeoró otra métrica (memoria, errores, costo).'],
        'Las mejoras más grandes casi siempre vienen de eliminar trabajo (una consulta N+1, una llamada en serie, un payload enorme), no de micro-optimizaciones.'
      ] },
      { t: 'Escalar por etapas', p: [
        ['**1. Eliminar trabajo**: índices, consultas, payloads, llamadas.', '**2. Paralelizar** lo independiente.', '**3. Cachear** lecturas calientes con TTL.', '**4. Asíncrono**: mover a colas lo que no necesita respuesta inmediata.', '**5. Escalar horizontal** servicios sin estado.', '**6. Escalar datos**: réplicas de lectura, particiones y, en último caso, sharding.']
      ] }
    ],
    recurrentes: [
      { tema: 'Llamadas en serie', por: 'Agregar datos de varios servicios uno tras otro suma latencias.', clave: 'Paraleliza lo independiente con timeouts y maneja respuestas parciales.' },
      { tema: 'La base de datos como límite', por: 'Escalar la aplicación traslada la carga a la base.', clave: 'Optimiza consultas, cachea, usa réplicas y controla el total de conexiones.' },
      { tema: 'Pruebas de carga poco realistas', por: 'Dan resultados optimistas que no se repiten en producción.', clave: 'Datos de volumen real, mezcla de operaciones real y generadores distribuidos.' }
    ],
    casos: [
      { titulo: 'Amazon Prime Video vuelve a un monolito y reduce costos un 90%', cuando: '2023', que: 'El equipo de monitoreo de calidad de video de Prime Video publicó que migró un sistema de microservicios serverless orquestados por Step Functions a un servicio monolítico en contenedores, reduciendo el costo de infraestructura en más de un 90%.', causa: 'El diseño distribuido pagaba transiciones de orquestación y transferencias de datos entre componentes por cada frame procesado.', leccion: 'La arquitectura debe ajustarse al patrón de carga y al costo por unidad de trabajo; distribuido no es sinónimo de escalable ni de barato.', fuente: 'Prime Video Tech Blog, "Scaling up the Prime Video audio/video monitoring service and reducing costs by 90%" (2023)' },
      { titulo: 'Stack Overflow: rendimiento medido en cada página', cuando: '2016', que: 'Stack Overflow documentó cómo servía su tráfico con un monolito y pocos servidores, apoyándose en medición de cada request (MiniProfiler), SQL optimizado y caché en varios niveles.', causa: 'Una cultura de medir el costo de cada página en lugar de escalar hardware por defecto.', leccion: 'Visibilidad del costo por request y optimización continua permiten escalar con mucha menos infraestructura.', fuente: 'Nick Craver, "Stack Overflow: The Architecture - 2016 Edition"' }
    ],
    escenarios: [
      { sintoma: 'Con 2x de tráfico, la latencia sube 10x aunque la CPU de la aplicación está al 40%.', pasos: ['Revisar saturación de recursos compartidos: pool de conexiones, base de datos, locks.', 'Ver en trazas dónde aumenta el tiempo de espera.', 'Revisar conexiones totales a la base tras el autoscaling.'], solucion: 'Corregir el cuello de botella en la base (consultas, índices, conexiones) en lugar de seguir escalando la aplicación.' }
    ]
  }
});
