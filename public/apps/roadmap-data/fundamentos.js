/* Dominio: Fundamentos */
RoadmapPlus.temas({
  'fundamentos-sdlc': {
    conceptos: [
      ['SDLC', 'Ciclo de vida del software: descubrimiento, diseño, construcción, pruebas, despliegue y operación. Lo que cambia entre metodologías es el tamaño del lote y la frecuencia del ciclo.'],
      ['Lead time for changes', 'Tiempo desde el commit hasta producción. Métrica DORA que mide la velocidad real de entrega.'],
      ['Deployment frequency', 'Cuántas veces se despliega a producción. Desplegar seguido reduce el tamaño (y el riesgo) de cada cambio.'],
      ['Change failure rate', 'Porcentaje de despliegues que causan un incidente o requieren rollback.'],
      ['Time to restore', 'Tiempo para recuperar el servicio tras un fallo (antes MTTR). Mide la capacidad de respuesta, no la ausencia de errores.'],
      ['Definition of Done', 'Criterios objetivos y compartidos para considerar un incremento terminado: revisado, probado, documentado y desplegable.'],
      ['Criterios de aceptación', 'Condiciones verificables de una historia, idealmente en formato Dado-Cuando-Entonces, que pueden convertirse en pruebas.'],
      ['Trunk-based development', 'Integrar en la rama principal al menos una vez al día con cambios pequeños, usando feature flags para lo incompleto.'],
      ['Feature flag', 'Interruptor en tiempo de ejecución que separa desplegar código de activar funcionalidad.'],
      ['Shift-left', 'Mover controles (pruebas, seguridad, análisis estático) lo más temprano posible en el ciclo, donde corregir es barato.'],
      ['Deuda técnica', 'Costo futuro de decisiones de diseño que se toman para ir más rápido hoy. Se gestiona como ítem visible del backlog, no como culpa.'],
      ['ADR', 'Architecture Decision Record: documento corto con contexto, decisión, alternativas y consecuencias de una decisión técnica.']
    ],
    profundidad: [
      { t: 'Las cuatro métricas DORA y cómo no engañarse con ellas', p: [
        'Las métricas DORA (de la investigación de Accelerate) relacionan prácticas de ingeniería con desempeño organizacional. Dos miden velocidad (frecuencia de despliegue y lead time) y dos miden estabilidad (tasa de fallos y tiempo de restauración). La conclusión clave de la investigación: los equipos de alto desempeño son más rápidos **y** más estables a la vez.',
        ['Mide a nivel de equipo o servicio, nunca para comparar personas.', 'Si optimizas una métrica aislada, la degradas: desplegar más seguido sin pruebas sube el change failure rate.', 'El lead time se mide desde el commit, no desde que alguien pidió la funcionalidad (eso es lead time de producto).', 'Un equipo que no puede desplegar en horario laboral sin miedo tiene un problema de pipeline, no de personas.']
      ] },
      { t: 'Tamaño de lote: la variable que más impacta', p: [
        'Cambios grandes acumulan riesgo: más código para revisar, más interacciones, más difícil saber qué rompió producción. Reducir el tamaño de cada cambio es la palanca con más retorno de todo el SDLC.',
        ['Pull requests de menos de 400 líneas se revisan bien; los de 2.000 se aprueban sin leer.', 'Divide historias verticalmente (una funcionalidad delgada de punta a punta), no por capas (primero toda la base, luego toda la API).', 'Feature flags y branch by abstraction permiten integrar trabajo incompleto sin exponerlo.']
      ] },
      { t: 'Del requisito al código: historias que se pueden probar', p: [
        'Una buena historia de usuario expresa valor, cabe en un sprint y tiene criterios de aceptación que se traducen directamente en pruebas automatizadas.',
        ['Mala: "Como sistema quiero validar transferencias".', 'Buena: "Como cliente quiero que se rechace una transferencia que supera mi límite diario para no exceder mi presupuesto". Criterio: Dado un límite de 1.000 y 900 transferidos hoy, Cuando transfiero 200, Entonces se rechaza con el código LIMITE_DIARIO y no se debita nada.'],
        'Los criterios de aceptación ambiguos son la principal fuente de retrabajo: aclarar antes de estimar es más barato que corregir después de desplegar.'
      ] },
      { t: 'Ambientes y promoción de artefactos', p: [
        ['Se construye **un solo artefacto** (imagen, jar) y se promueve entre ambientes; nunca se recompila para producción.', 'La configuración cambia por ambiente; el binario no.', 'Staging que no se parece a producción (datos, volumen, configuración) da falsa confianza.', 'En banca, la segregación de funciones exige que quien aprueba el pase a producción no sea quien escribió el código.']
      ] }
    ],
    recurrentes: [
      { tema: 'Estimación', por: 'Cada planificación la pide y siempre falla de la misma forma: sobreoptimista y con falsa precisión.', clave: 'Estima en tamaño relativo, divide hasta que la incertidumbre sea pequeña y comunica rangos, no fechas exactas.' },
      { tema: 'Definition of Done incompleta', por: 'Origen de "está terminado pero no se puede desplegar".', clave: 'Incluye pruebas, revisión, observabilidad y documentación mínima en la DoD; si no está en producción, no está terminado.' },
      { tema: 'Deuda técnica invisible', por: 'Se acumula sin registro hasta que frena todo el equipo.', clave: 'Regístrala en el backlog con su costo concreto ("cada cambio en pagos tarda 2 días extra") para poder priorizarla.' },
      { tema: 'Releases grandes y code freeze', por: 'Organizaciones que despliegan poco viven con miedo a desplegar, y despliegan aún menos.', clave: 'Desplegar más seguido con cambios pequeños reduce el riesgo; el freeze largo lo concentra.' },
      { tema: 'Retrospectivas sin acciones', por: 'Se repiten los mismos problemas sprint tras sprint.', clave: 'Una o dos acciones concretas con dueño y fecha, revisadas en la siguiente retro.' }
    ],
    casos: [
      { titulo: 'Knight Capital pierde 440 millones de dólares en 45 minutos', cuando: 'Ago 2012', que: 'Un despliegue manual de software de trading dejó código antiguo en uno de ocho servidores. Una bandera reutilizada activó esa funcionalidad obsoleta, que envió millones de órdenes no deseadas al mercado en 45 minutos.', causa: 'Despliegue manual sin verificación de que todos los servidores tenían la misma versión, reutilización de una bandera con significado antiguo y código muerto que nunca se eliminó.', leccion: 'Automatiza y verifica los despliegues, elimina código muerto y nunca reutilices flags; ten un interruptor de emergencia probado.', fuente: 'Orden de la SEC sobre Knight Capital Americas LLC (oct. 2013)' },
      { titulo: 'El lanzamiento de HealthCare.gov', cuando: 'Oct 2013', que: 'El portal de seguros médicos de EE. UU. colapsó el día del lanzamiento: pocos usuarios lograron registrarse en los primeros días.', causa: 'Integración tardía entre decenas de contratistas, pruebas de extremo a extremo y de carga casi inexistentes antes del lanzamiento y una fecha inamovible.', leccion: 'Integra y prueba de punta a punta temprano; un "big bang" con fecha fija y sin pruebas de carga es un riesgo conocido, no mala suerte.', fuente: 'Informes públicos del gobierno de EE. UU. y la GAO (2014)' }
    ],
    escenarios: [
      { sintoma: 'El equipo termina el sprint con la mitad de las historias "casi listas".', pasos: ['Revisar el tamaño de las historias: ¿alguna superaba la mitad del sprint?', 'Medir cuánto tiempo pasan esperando revisión o pruebas.', 'Revisar cuántas se empezaron en paralelo (WIP).'], solucion: 'Limitar el trabajo en curso, dividir historias verticalmente y priorizar terminar sobre empezar.' },
      { sintoma: 'Cada despliegue a producción genera al menos un incidente.', pasos: ['Medir el tamaño promedio de los cambios por despliegue.', 'Revisar la cobertura de pruebas automatizadas en el camino crítico.', 'Comparar staging con producción (datos, configuración, versiones).'], solucion: 'Despliegues más pequeños y frecuentes, pruebas automatizadas en el pipeline, canary o feature flags y rollback rápido.' }
    ]
  },

  'programacion-paradigmas': {
    conceptos: [
      ['Encapsulamiento', 'Ocultar el estado interno y exponer operaciones que mantienen las invariantes (no setters para todo).'],
      ['Polimorfismo', 'Tratar distintos tipos a través de una misma interfaz; reemplaza cadenas de if/switch por tipo.'],
      ['Composición sobre herencia', 'Construir comportamiento combinando objetos en lugar de jerarquías profundas, que acoplan y se vuelven frágiles.'],
      ['Inmutabilidad', 'Un objeto no cambia tras crearse. Elimina una clase entera de bugs de concurrencia y aliasing.'],
      ['Función pura', 'Mismo resultado para mismos argumentos y sin efectos colaterales. Fácil de probar y de razonar.'],
      ['Funciones de orden superior', 'Funciones que reciben o devuelven funciones (map, filter, reduce).'],
      ['Tipos de valor vs referencia', 'Copiar el valor o copiar la referencia al mismo objeto; define qué pasa al asignar y al comparar.'],
      ['Igualdad vs identidad', '`equals`/`==` compara contenido según se defina; identidad compara si es el mismo objeto en memoria.'],
      ['Excepción vs resultado', 'Señalar errores lanzando excepciones o devolviendo un tipo Result/Either; las excepciones no deben controlar el flujo normal.'],
      ['Null safety', 'Evitar el "error del billón de dólares": Optional, tipos anulables explícitos y validación en los bordes.'],
      ['Complejidad temporal', 'Cómo crece el costo con el tamaño de la entrada (O(1), O(log n), O(n), O(n²)).'],
      ['Programación declarativa', 'Describir qué se quiere (SQL, streams) en lugar de cómo calcularlo paso a paso.']
    ],
    profundidad: [
      { t: 'SOLID con ejemplos que importan', p: [
        ['**S** — una clase con una razón para cambiar: el cálculo de comisiones no debería cambiar porque cambió el formato del PDF.', '**O** — agregar un nuevo medio de pago sin modificar el código existente (estrategia por medio de pago).', '**L** — un subtipo no debe romper lo que promete el tipo base (un `CuentaSoloLectura` que lanza excepción en `debitar` viola LSP).', '**I** — interfaces pequeñas: un cliente no debería depender de 20 métodos para usar 2.', '**D** — el dominio depende de abstracciones (`RepositorioCuentas`), no de JDBC o de un SDK concreto.'],
        'SOLID es una herramienta para gestionar el cambio, no un fin. Aplicarlo de forma dogmática a código que nunca cambia produce indirección innecesaria.'
      ] },
      { t: 'Modelar errores', p: [
        'Distingue errores esperados del negocio (saldo insuficiente, cuenta bloqueada) de fallos técnicos (base caída, timeout). Los primeros son parte del dominio; los segundos se propagan y se manejan en el borde.',
        ['No captures `Exception` genérica para ignorarla: el error desaparece y aparece días después como dato corrupto.', 'Nunca uses `double` o `float` para dinero: usa decimal (BigDecimal, decimal) o enteros en centavos.', 'Valida en los bordes del sistema y mantén el núcleo con tipos que hacen imposibles los estados inválidos (un `Monto` que no puede ser negativo).']
      ], code: { lang: 'Java — dinero y errores de negocio explícitos', code: 'public record Monto(BigDecimal valor) {\n    public Monto {\n        if (valor.signum() < 0) throw new IllegalArgumentException("monto negativo");\n        valor = valor.setScale(2, RoundingMode.HALF_EVEN);\n    }\n}\n\nsealed interface ResultadoDebito permits Debitado, SaldoInsuficiente, CuentaBloqueada {}\nrecord Debitado(Monto nuevoSaldo) implements ResultadoDebito {}\nrecord SaldoInsuficiente(Monto disponible) implements ResultadoDebito {}\nrecord CuentaBloqueada(String motivo) implements ResultadoDebito {}' } },
      { t: 'Paradigma funcional en lenguajes mainstream', p: [
        'Java (streams, records), C# (LINQ, records), Python (comprensiones), JavaScript (map/filter) y Go permiten un estilo funcional parcial. El beneficio práctico es reducir estado mutable compartido.',
        ['Prefiere transformar colecciones a mutarlas en bucles anidados.', 'Cuidado con streams anidados ilegibles: la claridad gana a la cantidad de lambdas.', 'Los efectos (I/O, base de datos) van en los bordes; la lógica del medio, en funciones puras fáciles de probar.']
      ] },
      { t: 'Memoria y recolección de basura', p: [
        ['El stack guarda variables locales y llamadas; el heap, objetos de vida más larga.', 'Los GC generacionales asumen que la mayoría de objetos muere joven: crear muchos objetos de vida corta es barato; retenerlos (cachés sin límite, listeners no removidos) causa fugas.', 'Las pausas del GC afectan la latencia de cola (p99); en servicios sensibles se elige el colector y se reduce la asignación en el camino caliente.']
      ] }
    ],
    recurrentes: [
      { tema: 'Dinero con punto flotante', por: 'Aparece en código nuevo una y otra vez; 0.1 + 0.2 no es 0.3.', clave: 'Decimal de precisión fija o enteros en la unidad mínima, con redondeo explícito (HALF_EVEN para finanzas).' },
      { tema: 'Herencia profunda', por: 'Jerarquías de 4 o 5 niveles que nadie se atreve a tocar.', clave: 'Composición e interfaces; herencia solo para relaciones "es-un" estables.' },
      { tema: 'Null y valores ausentes', por: 'El NullPointerException sigue siendo de los errores más frecuentes en producción.', clave: 'Tipos opcionales explícitos, validación en los bordes y anotaciones o tipos no anulables por defecto.' },
      { tema: 'equals y hashCode', por: 'Objetos en HashMap/HashSet que "desaparecen" o se duplican.', clave: 'Si redefines equals, redefine hashCode con los mismos campos; usa records/data classes que lo generan.' },
      { tema: 'Excepciones tragadas', por: 'Los catch vacíos esconden fallos reales hasta que el daño es grande.', clave: 'Captura solo lo que puedes manejar; si no, registra con contexto y propaga.' }
    ],
    casos: [
      { titulo: 'Ariane 5 explota 37 segundos después del despegue', cuando: 'Jun 1996', que: 'El cohete Ariane 5 se autodestruyó en su vuelo inaugural tras una falla del sistema de referencia inercial.', causa: 'Código reutilizado del Ariane 4 convertía un número de punto flotante de 64 bits a un entero de 16 bits; con la trayectoria del Ariane 5 el valor no cabía y la excepción no manejada apagó el sistema (y su respaldo, que tenía el mismo código).', leccion: 'Reutilizar código exige revalidar sus supuestos con el nuevo contexto; la redundancia con software idéntico no protege de errores de software.', fuente: 'Informe de la junta de investigación ARIANE 5 Flight 501 (julio 1996)' },
      { titulo: 'Mars Climate Orbiter se pierde por un error de unidades', cuando: 'Sep 1999', que: 'La sonda de la NASA entró en la atmósfera de Marte en una trayectoria demasiado baja y se perdió.', causa: 'Un software de tierra producía resultados en unidades imperiales (libras-fuerza por segundo) y otro los consumía como unidades del sistema internacional (newton-segundos).', leccion: 'Los tipos y contratos explícitos (unidades en el tipo, no en un comentario) y las pruebas de integración entre equipos evitan errores silenciosos de interpretación.', fuente: 'Informe de la junta de investigación del Mars Climate Orbiter (NASA, nov. 1999)' }
    ],
    escenarios: [
      { sintoma: 'Los totales de un reporte no cuadran por centavos con los de la base de datos.', pasos: ['Buscar tipos `double`/`float` en el cálculo.', 'Revisar dónde y cómo se redondea (en cada paso o al final).', 'Comparar con el redondeo que exige la norma del negocio.'], solucion: 'Usar decimal con escala fija y un único punto de redondeo definido (HALF_EVEN), con pruebas de casos borde.' }
    ]
  },

  'gestion-competencias-rol': {
    conceptos: [
      ['Refinamiento', 'Sesión para aclarar, dividir y preparar historias antes de estimarlas.'],
      ['WIP', 'Work in progress: trabajo empezado y no terminado. Limitarlo acelera la entrega.'],
      ['Impedimento', 'Bloqueo que el equipo no puede resolver solo; se escala temprano, no al final del sprint.'],
      ['Stakeholder', 'Persona con interés o influencia en el resultado; hay que identificar quién decide y quién solo opina.'],
      ['RFC / documento de diseño', 'Propuesta escrita para discutir un cambio técnico antes de implementarlo.'],
      ['Postmortem sin culpa', 'Análisis de incidente centrado en el sistema y el proceso, no en la persona.'],
      ['1:1', 'Reunión periódica con el líder para feedback, carrera y bloqueos.'],
      ['Ownership', 'Responsabilidad de punta a punta sobre un resultado, incluido operarlo en producción.'],
      ['Comunicación asíncrona', 'Decisiones y contexto por escrito (tickets, documentos) para que no dependan de una reunión.'],
      ['Gestión de expectativas', 'Avisar riesgos y retrasos en cuanto se detectan, con alternativas.']
    ],
    profundidad: [
      { t: 'Escribir para que te entiendan', p: [
        'La mayor parte del trabajo de un ingeniero senior se transmite por escrito: tickets, pull requests, documentos de diseño, mensajes de incidente.',
        ['Empieza por la conclusión o la pregunta concreta; el contexto va después.', 'Un ticket útil tiene: qué pasa, qué se esperaba, cómo reproducirlo, impacto y evidencia (logs, capturas, IDs).', 'Una descripción de PR explica el porqué del cambio, cómo probarlo y los riesgos; el qué ya está en el diff.', 'En incidentes, actualiza cada 15–30 minutos aunque no haya novedades: el silencio genera más interrupciones.']
      ] },
      { t: 'Dar y recibir code review', p: [
        ['Revisa primero diseño y corrección, luego legibilidad; el estilo lo resuelve el linter.', 'Comenta sobre el código, no sobre la persona; pregunta en lugar de ordenar cuando no estás seguro.', 'Marca la severidad: bloqueante, sugerencia, detalle (nit).', 'Como autor, PRs pequeños con contexto reciben revisiones mejores y más rápidas.']
      ] },
      { t: 'Crecer de junior a senior', p: [
        ['**Junior**: completa tareas bien definidas con ayuda; aprende el sistema y las herramientas.', '**Semi senior**: entrega funcionalidades completas con autonomía; anticipa casos borde.', '**Senior**: diseña soluciones, reduce riesgo técnico, mentoriza y responde por la operación.', '**Staff/arquitecto**: influye en varios equipos, define estándares y resuelve problemas ambiguos de alcance organizacional.'],
        'El salto a senior no es saber más tecnologías: es reducir la ambigüedad para otros y hacerse cargo del resultado de punta a punta.'
      ] }
    ],
    recurrentes: [
      { tema: 'Avisar tarde un retraso', por: 'Es la queja más común de líderes y product owners.', clave: 'Comunica el riesgo apenas lo veas, con opciones: reducir alcance, mover fecha o pedir ayuda.' },
      { tema: 'Reuniones sin decisión', por: 'Consumen el tiempo de foco del equipo.', clave: 'Agenda, objetivo y decisión documentada; si no hay decisión que tomar, probablemente es un documento.' },
      { tema: 'Conocimiento en una sola persona', por: 'Bus factor de 1: vacaciones o rotación detienen al equipo.', clave: 'Pair programming, documentación de operación y rotación de responsabilidades.' },
      { tema: 'Decir que sí a todo', por: 'Lleva a compromisos imposibles y calidad baja.', clave: 'Negocia alcance con datos: qué se puede entregar bien en el tiempo disponible.' }
    ],
    casos: [
      { titulo: 'GitLab y la transparencia durante un incidente', cuando: 'Ene 2017', que: 'Durante la pérdida de datos de su base de producción, GitLab documentó el incidente en un documento público y transmitió en vivo la recuperación.', causa: 'La cultura de la empresa priorizaba la transparencia radical.', leccion: 'Comunicar con honestidad y frecuencia durante un incidente preserva la confianza incluso cuando el error es grave; el postmortem sin culpa permite corregir el proceso.', fuente: 'Postmortem público de GitLab (feb. 2017)' }
    ],
    escenarios: [
      { sintoma: 'Te asignan una historia ambigua con fecha comprometida.', pasos: ['Escribir las preguntas abiertas y los supuestos.', 'Validarlos con el product owner antes de estimar.', 'Proponer una primera entrega mínima que entregue valor.'], solucion: 'Acordar por escrito el alcance mínimo y los supuestos; reportar de inmediato si alguno cambia.' }
    ]
  }
});

/* ---------- Temas nuevos de Fundamentos ---------- */
RoadmapPlus.nuevo({
  id: 'estructuras-datos-algoritmos', num: 23, titulo: 'Estructuras de Datos y Algoritmos',
  dominio: 'Fundamentos', resumen: 'Complejidad, estructuras y algoritmos que todo ingeniero usa a diario y que aparecen en toda entrevista técnica.',
  nivel: 'Junior', dificultad: 3, tiempoEstimado: '25-40h', prereq: ['programacion-paradigmas'],
  tecnologias: ['Big-O', 'Hash maps', 'Árboles', 'Grafos', 'Ordenamiento', 'Búsqueda binaria', 'Programación dinámica'],
  matriz: { frecuencia: 'Alta', importancia: 'Crítica' },
  c: {
    definicion: 'Las estructuras de datos organizan información para que ciertas operaciones sean eficientes; los algoritmos son procedimientos para resolver problemas sobre esas estructuras. Elegir la estructura correcta suele importar más que optimizar el código: buscar en una lista es O(n), en un hash map O(1) en promedio.',
    problema: 'Un servicio que funciona con 1.000 registros se vuelve inutilizable con 1.000.000 si usa un algoritmo cuadrático. Las estructuras y algoritmos correctos determinan si un sistema escala o colapsa con datos reales, y son el lenguaje común de las entrevistas técnicas.',
    fundamentos: 'La notación Big-O describe cómo crece el costo en el peor caso o en promedio. Las estructuras básicas son arreglos (acceso por índice O(1)), listas enlazadas, pilas, colas, hash maps (búsqueda O(1) promedio), árboles balanceados (O(log n) ordenado), heaps (mínimo/máximo en O(1), inserción O(log n)) y grafos. Los algoritmos clave son ordenamiento (O(n log n)), búsqueda binaria (O(log n)), recorridos BFS y DFS, y programación dinámica para problemas con subproblemas repetidos.',
    arquitectura: 'En sistemas reales estas estructuras aparecen dentro de las herramientas: los índices de bases de datos son B-trees, los LRU caches combinan hash map y lista doblemente enlazada, las colas de prioridad ordenan tareas, los grafos modelan dependencias y redes de transferencias, y los Bloom filters evitan búsquedas costosas.',
    funcionamiento: 'Ante un problema, se identifica la operación dominante (buscar, insertar, ordenar, recorrer), se estima el tamaño de la entrada y se elige la estructura que hace barata esa operación. Luego se valida con la complejidad y, si importa, con mediciones reales, porque constantes y localidad de memoria también cuentan.',
    buenas: ['Pensar el tamaño realista de la entrada antes de elegir algoritmo.', 'Usar las colecciones estándar del lenguaje antes de implementar las propias.', 'Elegir hash map para búsquedas por clave y conjuntos para pertenencia.', 'Ordenar una vez y buscar muchas veces con búsqueda binaria.', 'Medir con datos de volumen real cuando el rendimiento importa.'],
    malas: ['Bucles anidados sobre colecciones grandes para buscar coincidencias.', 'Usar listas para comprobar pertenencia repetidamente.', 'Recursión profunda sin considerar el límite de pila.', 'Optimizar micro-detalles antes de corregir la complejidad.', 'Implementar a mano estructuras que ya ofrece la biblioteca estándar.'],
    errores: ['Confundir complejidad promedio con peor caso (hash maps con muchas colisiones).', 'Olvidar el costo de copiar o redimensionar arreglos dinámicos.', 'Ignorar la memoria: un algoritmo O(n) que carga todo en RAM puede fallar con datos grandes.'],
    patrones: ['Dos punteros', 'Ventana deslizante', 'Búsqueda binaria sobre la respuesta', 'BFS/DFS', 'Ordenamiento topológico', 'Memoización', 'Heap de k elementos'],
    antipatrones: ['Algoritmos cuadráticos ocultos en llamadas a librerías dentro de bucles', 'Estructuras propias sin pruebas', 'Optimización prematura sin medir'],
    ejemploReal: 'Detectar duplicados en un archivo de 5 millones de transacciones comparando cada una con todas las demás tarda horas (O(n²)); con un conjunto hash de identificadores tarda segundos (O(n)).',
    ejemploBanca: 'Un motor de conciliación bancaria cruza millones de movimientos del core con los del procesador de tarjetas indexando uno de los lados en un hash map por referencia, en lugar de buscar cada movimiento en una lista.',
    ejemploEmpresarial: 'Los sistemas de recomendación, rutas de mapas y detección de fraude usan grafos; los motores de búsqueda usan índices invertidos; las bases de datos usan B-trees y LSM-trees.',
    comparacion: { headers: ['Estructura', 'Buscar', 'Insertar', 'Uso típico'], rows: [['Arreglo', 'O(n) / O(1) por índice', 'O(n)', 'Datos secuenciales, acceso por posición'], ['Hash map', 'O(1) promedio', 'O(1) promedio', 'Búsqueda por clave, deduplicación'], ['Árbol balanceado', 'O(log n)', 'O(log n)', 'Datos ordenados, rangos'], ['Heap', 'O(1) el mínimo', 'O(log n)', 'Colas de prioridad, top-k']] },
    ventajas: ['Sistemas que escalan con el volumen real', 'Vocabulario común para diseñar y entrevistar', 'Diagnóstico rápido de cuellos de botella'],
    desventajas: ['Requiere práctica deliberada', 'La teoría sola no basta: hay que medir'],
    faq: [
      { q: '¿Necesito saber implementar un árbol rojo-negro?', a: 'No para el trabajo diario. Sí necesitas saber qué garantiza (O(log n) ordenado) y cuándo elegir un TreeMap frente a un HashMap.' },
      { q: '¿Por qué importan tanto en las entrevistas?', a: 'Porque muestran cómo descompones un problema, razonas sobre costo y comunicas trade-offs en poco tiempo.' },
      { q: '¿Cómo practico de forma eficiente?', a: 'Por patrones (ventana deslizante, dos punteros, BFS, programación dinámica), no resolviendo problemas al azar.' }
    ],
    codigo: { lang: 'Python — de O(n²) a O(n) con un conjunto', code: '# O(n^2): compara cada transacción con todas\ndef duplicados_lento(txs):\n    dup = []\n    for i in range(len(txs)):\n        for j in range(i + 1, len(txs)):\n            if txs[i].ref == txs[j].ref:\n                dup.append(txs[i].ref)\n    return dup\n\n# O(n): un solo recorrido con un set\ndef duplicados(txs):\n    vistos, dup = set(), set()\n    for t in txs:\n        if t.ref in vistos:\n            dup.add(t.ref)\n        vistos.add(t.ref)\n    return dup' }
  },
  entrevistas: [
    { nivel: 'Junior', pregunta: '¿Qué significa que un algoritmo sea O(n log n)?', respuesta: 'Que su costo crece proporcionalmente a n por el logaritmo de n; es el costo típico de un buen algoritmo de ordenamiento por comparación.' },
    { nivel: 'Junior', pregunta: '¿Cuándo usarías un hash map en lugar de una lista?', respuesta: 'Cuando necesito buscar o comprobar pertenencia por clave repetidamente: O(1) promedio frente a O(n).' },
    { nivel: 'Semi Senior', pregunta: '¿Cómo implementarías una caché LRU?', respuesta: 'Con un hash map de clave a nodo y una lista doblemente enlazada ordenada por uso: lectura, inserción y expulsión en O(1).' },
    { nivel: 'Semi Senior', pregunta: '¿Cómo encontrarías los 10 montos más altos de 100 millones de transacciones?', respuesta: 'Con un min-heap de tamaño 10 recorriendo una vez: O(n log 10) en tiempo y memoria constante, sin ordenar todo.' },
    { nivel: 'Senior', pregunta: '¿Cómo detectarías ciclos de dependencias entre microservicios?', respuesta: 'Modelando un grafo dirigido y aplicando DFS con estados (visitando/visitado) u ordenamiento topológico; si no se puede ordenar, hay ciclo.' },
    { nivel: 'Senior', pregunta: '¿Qué es un Bloom filter y dónde lo usarías?', respuesta: 'Estructura probabilística que dice "seguro no está" o "quizá está" con poca memoria; sirve para evitar consultas costosas, por ejemplo verificar si una tarjeta está en una lista negra antes de ir a la base.' },
    { nivel: 'Staff/Arquitecto', pregunta: '¿Por qué las bases de datos usan B-trees y algunas LSM-trees?', respuesta: 'B-trees optimizan lecturas y rangos con actualizaciones en sitio; LSM-trees optimizan escrituras secuenciales masivas a costa de compactaciones y lecturas más costosas.' },
    { nivel: 'Staff/Arquitecto', pregunta: '¿Cuándo la complejidad teórica no basta para decidir?', respuesta: 'Cuando las constantes, la localidad de caché de CPU, la memoria o la I/O dominan; por eso se mide con datos reales.' }
  ],
  ejercicios: ['Implementa una caché LRU con capacidad fija y pruebas de expulsión.', 'Encuentra el par de transacciones que suman un monto objetivo en O(n).', 'Dado un grafo de dependencias entre tareas, devuelve un orden válido de ejecución o reporta el ciclo.'],
  proyecto: { titulo: 'Motor de conciliación eficiente', desc: 'Concilia dos archivos de 1 millón de movimientos cada uno (core y procesador) detectando faltantes, sobrantes y diferencias de monto en menos de 10 segundos, con análisis de complejidad documentado.', tech: ['Python o Java', 'Hash maps', 'Streaming de archivos', 'Benchmarks'] },
  checklist: ['Puedo explicar Big-O y calcular la complejidad de mi código', 'Sé cuándo usar arreglo, hash map, árbol, heap o grafo', 'Implemento búsqueda binaria sin errores de borde', 'Conozco BFS, DFS y ordenamiento topológico', 'Reconozco problemas de programación dinámica', 'Implemento una caché LRU', 'Sé usar ventana deslizante y dos punteros'],
  recursos: [{ kind: 'Libro', label: 'Grokking Algorithms — Aditya Bhargava' }, { kind: 'Libro', label: 'The Algorithm Design Manual — Steven Skiena' }, { kind: 'Práctica', label: 'Listas de problemas por patrón (NeetCode, LeetCode)' }],
  relacionados: ['programacion-paradigmas', 'bases-relacionales', 'performance-caching'],
  plus: {
    conceptos: [
      ['Big-O', 'Cota superior del crecimiento del costo en función del tamaño de entrada; ignora constantes.'],
      ['Amortizado', 'Costo promedio por operación en una secuencia: agregar a un arreglo dinámico es O(1) amortizado aunque a veces redimensione.'],
      ['Hash map', 'Arreglo de cubetas indexado por el hash de la clave; O(1) promedio, O(n) en el peor caso con colisiones.'],
      ['Árbol balanceado', 'Mantiene altura O(log n) (rojo-negro, AVL, B-tree): datos ordenados y consultas por rango.'],
      ['Heap', 'Árbol casi completo donde el padre es menor (o mayor) que los hijos; base de las colas de prioridad.'],
      ['Grafo', 'Nodos y aristas, dirigidos o no, con peso o sin él. Se representa con listas de adyacencia.'],
      ['BFS', 'Recorrido por niveles con una cola; encuentra el camino más corto sin pesos.'],
      ['DFS', 'Recorrido en profundidad con pila o recursión; detecta ciclos y componentes.'],
      ['Ordenamiento topológico', 'Orden lineal de un grafo dirigido acíclico respetando dependencias.'],
      ['Dijkstra', 'Camino más corto con pesos no negativos usando un heap: O((V + E) log V).'],
      ['Programación dinámica', 'Resolver subproblemas que se repiten una sola vez y reutilizar el resultado (memoización o tabla).'],
      ['Bloom filter', 'Conjunto probabilístico sin falsos negativos y con falsos positivos controlados.']
    ],
    profundidad: [
      { t: 'Cómo resolver un problema en una entrevista', p: [
        ['**Aclarar**: tamaño de la entrada, rangos de valores, duplicados, casos vacíos.', '**Ejemplo**: resolver a mano un caso pequeño y uno borde.', '**Fuerza bruta**: describirla con su complejidad; demuestra que entiendes el problema.', '**Optimizar**: ¿qué trabajo se repite? ¿qué estructura lo evita? (hash, ordenar, heap, dos punteros).', '**Codificar** limpio y **probar** con los ejemplos, incluidos los bordes.', '**Analizar** tiempo y memoria al final.'],
        'Hablar en voz alta durante todo el proceso vale tanto como la solución: el entrevistador evalúa cómo razonas.'
      ] },
      { t: 'Patrones que resuelven la mayoría de problemas', p: [
        ['**Hash map de complementos**: pares que suman un objetivo en O(n).', '**Dos punteros** sobre datos ordenados: eliminar duplicados, fusionar listas.', '**Ventana deslizante**: subarreglo de longitud o suma máxima con una condición.', '**Búsqueda binaria** sobre arreglos ordenados o sobre el espacio de respuestas.', '**BFS** para caminos más cortos en grafos y matrices.', '**Heap de tamaño k** para top-k y mezclas de k listas.', '**Programación dinámica** cuando la solución combina soluciones de subproblemas solapados.']
      ], code: { lang: 'Java — ventana deslizante: máximo de transacciones en 60 segundos', code: 'int maxEnVentana(long[] timestamps, long ventanaMs) {\n    Arrays.sort(timestamps);\n    int inicio = 0, max = 0;\n    for (int fin = 0; fin < timestamps.length; fin++) {\n        while (timestamps[fin] - timestamps[inicio] >= ventanaMs) inicio++;\n        max = Math.max(max, fin - inicio + 1);\n    }\n    return max; // O(n log n) por el ordenamiento, O(n) la ventana\n}' } },
      { t: 'Estructuras dentro de las herramientas que ya usas', p: [
        ['**B-tree** en índices de PostgreSQL, MySQL y SQL Server.', '**LSM-tree** en Cassandra, RocksDB y otros motores orientados a escritura.', '**Skip list** en los sorted sets de Redis.', '**Heap** en schedulers y temporizadores.', '**Árboles de Merkle** en Git y en sincronización de réplicas.', '**Hash consistente** para distribuir claves entre nodos de caché o shards.']
      ] }
    ],
    recurrentes: [
      { tema: 'Bucles anidados escondidos', por: 'Un `list.contains()` o una consulta dentro de un bucle convierte O(n) en O(n²).', clave: 'Antes del bucle, construye un conjunto o un mapa con lo que vas a buscar.' },
      { tema: 'Top-k y percentiles', por: 'Rankings, montos más altos y latencia p99 aparecen en reportes y monitoreo.', clave: 'Heap de tamaño k para top-k; estructuras aproximadas (t-digest, HDR histogram) para percentiles a escala.' },
      { tema: 'Dependencias entre tareas', por: 'Pipelines, migraciones y builds necesitan un orden válido.', clave: 'Grafo dirigido y ordenamiento topológico; reporta el ciclo cuando exista.' },
      { tema: 'Búsqueda binaria con bordes', por: 'Es fácil de describir y famosa por implementarse mal (bucles infinitos, desbordamiento).', clave: 'Define la invariante del intervalo y usa `medio = inicio + (fin - inicio) / 2`.' }
    ],
    casos: [
      { titulo: 'Cloudflare cae globalmente por una expresión regular', cuando: 'Jul 2019', que: 'Una regla nueva del WAF contenía una expresión regular con retroceso catastrófico; al desplegarse globalmente llevó la CPU de los servidores al 100% y provocó errores 502 durante unos 27 minutos.', causa: 'Complejidad exponencial en el peor caso de un motor de regex con backtracking, desplegada a toda la red a la vez.', leccion: 'La complejidad del peor caso importa en entradas controladas por terceros; usa motores sin backtracking o límites de ejecución, y despliegues graduales.', fuente: 'Postmortem de Cloudflare, "Details of the Cloudflare outage on July 2, 2019"' }
    ],
    escenarios: [
      { sintoma: 'Un proceso batch que tardaba 5 minutos ahora tarda 6 horas tras duplicar el volumen.', pasos: ['Perfilar para encontrar la función dominante.', 'Buscar búsquedas lineales dentro de bucles o consultas por elemento.', 'Estimar la complejidad: si el tiempo se cuadruplicó al duplicar datos, es O(n²).'], solucion: 'Indexar en memoria con un hash map o resolver con un JOIN en la base, llevando el algoritmo a O(n) u O(n log n).' }
    ]
  }
});

RoadmapPlus.nuevo({
  id: 'concurrencia-paralelismo', num: 24, titulo: 'Concurrencia y Paralelismo',
  dominio: 'Fundamentos', resumen: 'Hilos, condiciones de carrera, locks, modelos asíncronos e idempotencia: la fuente de los bugs más difíciles de producción.',
  nivel: 'Semi Senior', dificultad: 4, tiempoEstimado: '20-30h', prereq: ['programacion-paradigmas'],
  tecnologias: ['Threads', 'Locks', 'async/await', 'Goroutines', 'Virtual threads', 'Atomics', 'Actores'],
  matriz: { frecuencia: 'Alta', importancia: 'Crítica' },
  c: {
    definicion: 'Concurrencia es estructurar un programa para que maneje varias tareas que progresan en periodos solapados; paralelismo es ejecutarlas literalmente al mismo tiempo en varios núcleos. Un servidor web es concurrente aunque tenga un solo núcleo; un cálculo distribuido en 16 núcleos es paralelo.',
    problema: 'Los servicios atienden miles de requests simultáneos que comparten datos: saldos, contadores, cachés. Sin control, dos operaciones intercalan sus pasos y producen resultados imposibles (dinero duplicado, inventario negativo) que aparecen solo bajo carga y rara vez se reproducen en pruebas.',
    fundamentos: 'Una condición de carrera ocurre cuando el resultado depende del orden de ejecución de operaciones concurrentes sobre estado compartido. Se previene con exclusión mutua (locks), operaciones atómicas, inmutabilidad o eliminando el estado compartido (paso de mensajes). Los problemas clásicos son deadlock (espera circular), livelock, inanición y visibilidad de memoria (un hilo no ve lo que escribió otro sin barreras de memoria).',
    arquitectura: 'En backend la concurrencia aparece en tres niveles: dentro del proceso (hilos, event loop, goroutines), entre procesos o réplicas del mismo servicio (varias instancias escribiendo la misma fila) y entre servicios (mensajes duplicados, reintentos). Los locks de memoria solo resuelven el primer nivel; los otros requieren la base de datos, locks distribuidos o diseño idempotente.',
    funcionamiento: 'Cada modelo resuelve la espera de I/O distinto: hilos del sistema operativo bloqueantes (costosos en memoria), event loop con async/await (un hilo, no bloquear nunca), goroutines y virtual threads (hilos ligeros gestionados por el runtime que se suspenden al esperar I/O). El estado compartido se protege con mutex, read-write locks, atómicos o canales.',
    buenas: ['Minimizar el estado compartido mutable; preferir inmutabilidad y mensajes.', 'Proteger invariantes con la herramienta del nivel correcto: lock en memoria, transacción en base, idempotencia entre servicios.', 'Mantener las secciones críticas pequeñas y sin I/O dentro.', 'Adquirir varios locks siempre en el mismo orden.', 'Usar estructuras concurrentes de la biblioteca estándar.', 'Poner timeouts en toda espera.'],
    malas: ['Proteger con `synchronized` en memoria algo que corre en varias réplicas.', 'Hacer llamadas de red dentro de un lock.', 'Bloquear el event loop con operaciones síncronas pesadas.', 'Compartir colecciones no thread-safe entre hilos.', 'Lanzar hilos o goroutines sin límite.'],
    errores: ['Creer que una operación como `contador++` es atómica.', 'Olvidar que las pruebas unitarias casi nunca reproducen carreras.', 'Usar double-checked locking sin las garantías de memoria del lenguaje.'],
    patrones: ['Productor-consumidor', 'Pool de workers', 'Actor', 'Read-write lock', 'Compare-and-swap', 'Bloqueo optimista', 'Idempotency key'],
    antipatrones: ['Lock global para todo', 'Sleep como mecanismo de sincronización', 'Hilos sin límite por request', 'Callbacks anidados sin manejo de errores'],
    ejemploReal: 'Un endpoint de canje de puntos validaba "si saldo >= costo" y luego descontaba en dos pasos; con dos clics rápidos el usuario canjeaba dos veces con saldo para uno. La corrección fue una actualización atómica condicionada en la base de datos.',
    ejemploBanca: 'Dos retiros simultáneos de la misma cuenta desde app y cajero deben serializarse: el core usa bloqueo de fila o actualización condicionada para que nunca se debite más del saldo disponible.',
    ejemploEmpresarial: 'Los sistemas de reservas (vuelos, entradas) resuelven la sobreventa con inventario atómico, reservas temporales con expiración y colas para eventos de alta demanda.',
    comparacion: { headers: ['Modelo', 'Cómo espera I/O', 'Riesgo principal', 'Ejemplos'], rows: [['Hilos del SO', 'Bloquea el hilo', 'Memoria y cambio de contexto', 'Java clásico, .NET síncrono'], ['Event loop', 'Callbacks / async', 'Bloquear el loop', 'Node.js, asyncio'], ['Hilos ligeros', 'El runtime suspende', 'Fugas sin cancelación', 'Go, virtual threads de Java'], ['Actores / mensajes', 'Buzón por actor', 'Diseño distinto', 'Akka, Orleans, Erlang']] },
    ventajas: ['Aprovechar el hardware y la espera de I/O', 'Mayor throughput con los mismos recursos'],
    desventajas: ['Bugs no deterministas difíciles de reproducir', 'Más complejidad de diseño y pruebas'],
    faq: [
      { q: '¿async/await hace que mi código corra en paralelo?', a: 'No necesariamente: permite que otras tareas avancen mientras una espera I/O. El paralelismo depende del runtime y de los núcleos.' },
      { q: '¿Un lock en memoria protege si tengo 3 réplicas?', a: 'No. Cada réplica tiene su propio lock; se necesita coordinación en la base de datos o un lock distribuido.' },
      { q: '¿Qué uso para un contador compartido?', a: 'Un tipo atómico en memoria, un INCR en Redis o un UPDATE atómico en la base, según dónde viva el contador.' }
    ],
    codigo: { lang: 'Go — pool de workers acotado con cancelación', code: 'func procesar(ctx context.Context, pagos <-chan Pago, workers int) error {\n    g, ctx := errgroup.WithContext(ctx)\n    for i := 0; i < workers; i++ {\n        g.Go(func() error {\n            for {\n                select {\n                case <-ctx.Done():\n                    return ctx.Err()\n                case p, ok := <-pagos:\n                    if !ok {\n                        return nil\n                    }\n                    if err := liquidar(ctx, p); err != nil {\n                        return err // cancela al resto\n                    }\n                }\n            }\n        })\n    }\n    return g.Wait()\n}' }
  },
  entrevistas: [
    { nivel: 'Junior', pregunta: '¿Qué es una condición de carrera?', respuesta: 'Un error donde el resultado depende del orden en que se intercalan operaciones concurrentes sobre estado compartido.' },
    { nivel: 'Junior', pregunta: '¿Cuál es la diferencia entre concurrencia y paralelismo?', respuesta: 'Concurrencia es manejar varias tareas solapadas en el tiempo; paralelismo es ejecutarlas simultáneamente en varios núcleos.' },
    { nivel: 'Semi Senior', pregunta: '¿Qué es un deadlock y cómo lo evitas?', respuesta: 'Espera circular entre tareas que retienen recursos que otra necesita. Se evita con orden global de adquisición, timeouts y secciones críticas pequeñas.' },
    { nivel: 'Semi Senior', pregunta: '¿Qué pasa si haces una llamada bloqueante dentro de un event loop?', respuesta: 'Se detienen todas las demás tareas del loop: la latencia de todo el servicio sube. Hay que usar la versión asíncrona o un pool de hilos aparte.' },
    { nivel: 'Senior', pregunta: '¿Cómo evitas el doble procesamiento de un pago con varias réplicas y reintentos?', respuesta: 'Clave de idempotencia persistida con restricción única en la base, procesando y registrando en la misma transacción; un reintento con la misma clave devuelve el resultado original.' },
    { nivel: 'Senior', pregunta: '¿Bloqueo optimista o pesimista?', respuesta: 'Optimista con baja contención y conflictos baratos de reintentar; pesimista cuando la contención es alta o el conflicto es caro.' },
    { nivel: 'Staff/Arquitecto', pregunta: '¿Cuándo un lock distribuido es mala idea?', respuesta: 'Cuando la corrección depende solo de él: pausas de GC o particiones de red pueden hacer que dos procesos crean tener el lock. Hace falta fencing token o que la base de datos haga cumplir la invariante.' },
    { nivel: 'Staff/Arquitecto', pregunta: '¿Qué ganan los virtual threads de Java?', respuesta: 'Escribir código bloqueante simple con la escalabilidad de modelos asíncronos para cargas de I/O; no aceleran cálculo intensivo de CPU.' }
  ],
  ejercicios: ['Escribe un test que reproduzca una pérdida de actualización con 100 hilos y corrígela de tres formas distintas.', 'Implementa un rate limiter thread-safe por cliente.', 'Implementa un procesador de cola con N workers, cancelación y apagado ordenado.'],
  proyecto: { titulo: 'Simulador de retiros concurrentes', desc: 'Servicio que recibe miles de retiros simultáneos sobre las mismas cuentas, con pruebas de carga que demuestran que el saldo nunca queda negativo ni se duplica un débito, comparando bloqueo optimista, pesimista e idempotencia.', tech: ['Java o Go', 'PostgreSQL', 'k6 o JMeter', 'Testcontainers'] },
  checklist: ['Puedo explicar condición de carrera, deadlock y visibilidad de memoria', 'Sé cuándo usar lock, atómico o mensaje', 'Entiendo el modelo de concurrencia de mi lenguaje', 'Diseño operaciones idempotentes', 'Sé por qué un lock en memoria no basta con varias réplicas', 'Pongo timeouts y cancelación en tareas concurrentes', 'Sé reproducir una carrera en una prueba'],
  recursos: [{ kind: 'Libro', label: 'Java Concurrency in Practice — Brian Goetz' }, { kind: 'Libro', label: 'Concurrency in Go — Katherine Cox-Buday' }, { kind: 'Artículo', label: 'How to do distributed locking — Martin Kleppmann' }],
  relacionados: ['programacion-paradigmas', 'bases-relacionales', 'mensajeria-kafka-distribuidos', 'go-backend'],
  plus: {
    conceptos: [
      ['Sección crítica', 'Fragmento de código que accede a estado compartido y debe ejecutarlo un solo hilo a la vez.'],
      ['Mutex', 'Lock de exclusión mutua: solo un hilo lo posee.'],
      ['Read-write lock', 'Varios lectores simultáneos o un escritor exclusivo.'],
      ['Atómico / CAS', 'Operación indivisible a nivel de hardware; compare-and-swap actualiza solo si el valor no cambió.'],
      ['Visibilidad de memoria', 'Un hilo puede no ver escrituras de otro sin sincronización (volatile, locks, atómicos).'],
      ['Deadlock', 'Espera circular: A espera a B y B espera a A.'],
      ['Livelock', 'Los hilos reaccionan entre sí sin avanzar nunca.'],
      ['Inanición', 'Un hilo nunca obtiene el recurso porque otros siempre se le adelantan.'],
      ['Backpressure', 'Mecanismo para que un consumidor lento frene al productor en lugar de acumular trabajo sin límite.'],
      ['Idempotencia', 'Ejecutar la misma operación varias veces produce el mismo efecto que una sola.'],
      ['Fencing token', 'Número creciente que acompaña a un lock para rechazar escrituras de un dueño antiguo.'],
      ['Thread pool', 'Conjunto acotado de hilos reutilizados que procesan tareas de una cola.']
    ],
    profundidad: [
      { t: 'Los tres niveles de concurrencia en un backend', p: [
        ['**Dentro del proceso**: locks, atómicos y estructuras concurrentes del lenguaje.', '**Entre réplicas**: la base de datos es el árbitro (transacciones, restricciones únicas, actualizaciones condicionadas).', '**Entre servicios**: los mensajes llegan duplicados, desordenados o tarde; solo la idempotencia y el versionado lo resuelven.'],
        'El error más común es resolver un problema del segundo o tercer nivel con una herramienta del primero.'
      ] },
      { t: 'Idempotencia bien implementada', p: [
        'El cliente envía una clave única por operación (`Idempotency-Key`). El servidor la guarda con restricción única junto al resultado, dentro de la misma transacción que el efecto.',
        ['Si la clave existe y terminó, devuelve el resultado guardado.', 'Si existe y está en curso, responde conflicto o espera.', 'La clave expira después de un tiempo razonable (24 horas en APIs de pago comunes).', 'Verifica que el cuerpo del reintento coincide con el original; si no, rechaza.']
      ], code: { lang: 'SQL — idempotencia con restricción única', code: 'CREATE TABLE operaciones_idempotentes (\n  clave        text PRIMARY KEY,\n  hash_request text NOT NULL,\n  respuesta    jsonb,\n  creada_en    timestamptz NOT NULL DEFAULT now()\n);\n\n-- En la misma transacción que el débito:\nINSERT INTO operaciones_idempotentes (clave, hash_request)\nVALUES (:clave, :hash)\nON CONFLICT (clave) DO NOTHING;\n-- 0 filas insertadas => es un reintento: devolver la respuesta guardada' } },
      { t: 'Async sin bloquear', p: [
        ['En Node.js y asyncio, una operación de CPU de 200 ms bloquea a todos los clientes durante 200 ms.', 'Mezclar llamadas síncronas (un driver bloqueante) en código asíncrono anula el beneficio.', 'Lanza tareas concurrentes con límite (semáforo) para no saturar dependencias.', 'Propaga cancelación y deadlines (CancellationToken, context.Context) para no seguir trabajando cuando el cliente ya se fue.']
      ] }
    ],
    recurrentes: [
      { tema: 'Leer-modificar-escribir', por: 'Es el patrón detrás de la mayoría de carreras: leer saldo, calcular, guardar.', clave: 'Hazlo atómico en el lugar donde vive el dato (UPDATE condicionado, INCR, CAS).' },
      { tema: 'Reintentos que duplican efectos', por: 'Timeouts de red hacen que el cliente reintente algo que ya se ejecutó.', clave: 'Toda operación con efectos reintentable debe ser idempotente.' },
      { tema: 'Pools agotados', por: 'Hilos o conexiones bloqueados esperando a una dependencia lenta tumban el servicio.', clave: 'Timeouts, límites de concurrencia por dependencia (bulkhead) y circuit breaker.' },
      { tema: 'Tareas en segundo plano sin control', por: 'Hilos o goroutines lanzados sin límite ni cancelación agotan memoria.', clave: 'Workers acotados, colas con límite y cancelación propagada.' }
    ],
    casos: [
      { titulo: 'Therac-25: condiciones de carrera con consecuencias fatales', cuando: '1985-1987', que: 'Una máquina de radioterapia administró sobredosis masivas de radiación a varios pacientes, con muertes.', causa: 'Condiciones de carrera en el software de control: si el operador editaba los parámetros rápidamente, el sistema podía quedar en un estado inconsistente; además se habían eliminado los interbloqueos de hardware confiando en el software.', leccion: 'Los errores de concurrencia son reales y graves; los sistemas críticos necesitan defensas independientes del software y análisis riguroso de estados concurrentes.', fuente: 'Leveson y Turner, "An Investigation of the Therac-25 Accidents", IEEE Computer (1993)' }
    ],
    escenarios: [
      { sintoma: 'Saldos negativos esporádicos que nadie logra reproducir en QA.', pasos: ['Buscar flujos de leer-validar-escribir sobre el saldo.', 'Revisar si hay varias réplicas o hilos ejecutándolos.', 'Escribir una prueba con muchas peticiones concurrentes sobre la misma cuenta.'], solucion: 'Actualización atómica condicionada o bloqueo de fila, más idempotencia en el endpoint.' },
      { sintoma: 'El servicio Node.js responde lento a todos cuando un usuario descarga un reporte.', pasos: ['Perfilar el event loop (event loop lag).', 'Buscar generación síncrona de archivos o cálculos pesados en el handler.'], solucion: 'Mover el trabajo pesado a un worker thread o a un proceso asíncrono con cola.' }
    ]
  }
});

RoadmapPlus.nuevo({
  id: 'clean-code-refactoring', num: 25, titulo: 'Clean Code, Refactoring y Code Review',
  dominio: 'Fundamentos', resumen: 'Escribir código que otros puedan leer, cambiar y revisar con seguridad: nombres, funciones, refactoring y revisión de código.',
  nivel: 'Junior', dificultad: 2, tiempoEstimado: '12-18h', prereq: ['programacion-paradigmas'],
  tecnologias: ['Refactoring', 'Code smells', 'Linters', 'Code review', 'Pruebas de regresión'],
  matriz: { frecuencia: 'Alta', importancia: 'Alta' },
  c: {
    definicion: 'Clean code es código que comunica su intención, es fácil de cambiar y difícil de usar mal. Refactoring es mejorar la estructura interna sin cambiar el comportamiento observable. Code review es la revisión del cambio por otra persona antes de integrarlo.',
    problema: 'El código se lee muchas más veces de las que se escribe. Código confuso multiplica el tiempo de cada cambio futuro, esconde bugs y concentra conocimiento en quien lo escribió. Sin refactoring continuo, el sistema se degrada hasta que nadie se atreve a tocarlo.',
    fundamentos: 'Las bases son nombres que revelan intención, funciones pequeñas que hacen una cosa, pocos parámetros, sin efectos ocultos, sin duplicación de conocimiento y con manejo de errores explícito. Refactorizar requiere pruebas que detecten si el comportamiento cambió; se hace en pasos pequeños y seguros.',
    arquitectura: 'El clean code a nivel de función se complementa con módulos cohesivos y bajo acoplamiento. Herramientas automáticas (formateadores, linters, análisis estático como SonarQube) resuelven el estilo para que la revisión humana se concentre en diseño y corrección.',
    funcionamiento: 'Ciclo típico: identificar un code smell, asegurar pruebas que cubran el comportamiento, aplicar un refactoring pequeño (extraer función, renombrar, mover), correr pruebas, commitear y repetir. En la revisión, el autor explica el porqué y el revisor verifica corrección, diseño, pruebas y riesgos.',
    buenas: ['Nombres de dominio (`calcularComisionTransferencia`, no `procesar2`).', 'Funciones que caben en una pantalla y hacen una cosa.', 'Refactorizar en commits separados de los cambios de comportamiento.', 'Dejar el código un poco mejor de lo que se encontró.', 'Automatizar formato y reglas con linters en el pipeline.'],
    malas: ['Comentarios que repiten lo que dice el código.', 'Funciones con banderas booleanas que cambian su comportamiento.', 'Refactors gigantes sin pruebas.', 'Revisar solo el estilo e ignorar la lógica.', 'Mezclar refactor y funcionalidad en el mismo PR enorme.'],
    errores: ['Abstraer demasiado pronto (DRY prematuro) y acoplar cosas que solo se parecían.', 'Confundir código corto con código claro.', 'Aprobar PRs grandes sin leerlos.'],
    patrones: ['Extraer función', 'Reemplazar condicional con polimorfismo', 'Introducir objeto parámetro', 'Guard clauses', 'Strangler para refactors grandes'],
    antipatrones: ['God class', 'Código muerto', 'Números mágicos', 'Comentarios desactualizados', 'Copy-paste con variaciones'],
    ejemploReal: 'Un método de 600 líneas de cálculo de intereses con 14 parámetros se dividió en funciones por regla de negocio con pruebas por caso; los siguientes cambios regulatorios pasaron de semanas a días.',
    ejemploBanca: 'Las reglas de comisiones y límites cambian por normativa con frecuencia; tenerlas en funciones pequeñas y probadas permite aplicar un cambio regulatorio con confianza y auditar qué regla produjo cada resultado.',
    ejemploEmpresarial: 'Google exige revisión de código para todos los cambios y mide el tiempo de revisión; varias empresas encontraron que la velocidad de revisión es de los mayores factores en la productividad del equipo.',
    comparacion: { headers: ['Smell', 'Síntoma', 'Refactoring'], rows: [['Función larga', 'Más de una responsabilidad', 'Extraer función'], ['Lista larga de parámetros', '5 o más argumentos', 'Objeto parámetro'], ['Switch por tipo repetido', 'El mismo switch en varios lugares', 'Polimorfismo'], ['Feature envy', 'Usa más datos de otra clase que de la suya', 'Mover método']] },
    ventajas: ['Cambios más rápidos y seguros', 'Menos bugs', 'Conocimiento compartido en el equipo'],
    desventajas: ['Requiere disciplina y tiempo continuo', 'Riesgo de discusiones subjetivas si no hay estándares'],
    faq: [
      { q: '¿Cuándo refactorizo?', a: 'Antes de agregar una funcionalidad a código difícil de cambiar, y en pasos pequeños; no en un "sprint de refactor" aislado.' },
      { q: '¿Comentar o no comentar?', a: 'Comenta el porqué (una decisión, una restricción externa), no el qué; si necesitas explicar el qué, mejora los nombres.' },
      { q: '¿Qué tan grande debe ser un PR?', a: 'Lo bastante pequeño para revisarlo bien en menos de una hora; como referencia, menos de 400 líneas cambiadas.' }
    ],
    codigo: { lang: 'C# — guard clauses en lugar de anidación', code: '// Antes: anidación profunda\npublic Resultado Transferir(Solicitud s) {\n    if (s != null) {\n        if (s.Monto > 0) {\n            if (cuentas.Existe(s.Origen)) {\n                return Ejecutar(s);\n            } else return Resultado.Error("origen");\n        } else return Resultado.Error("monto");\n    } else return Resultado.Error("vacía");\n}\n\n// Después: casos de error primero, camino feliz al final\npublic Resultado Transferir(Solicitud s) {\n    if (s is null) return Resultado.Error("vacía");\n    if (s.Monto <= 0) return Resultado.Error("monto");\n    if (!cuentas.Existe(s.Origen)) return Resultado.Error("origen");\n    return Ejecutar(s);\n}' }
  },
  entrevistas: [
    { nivel: 'Junior', pregunta: '¿Qué hace que un nombre sea bueno?', respuesta: 'Que revela la intención en el lenguaje del dominio, sin abreviaturas ambiguas ni detalles de implementación.' },
    { nivel: 'Junior', pregunta: '¿Qué es refactorizar?', respuesta: 'Cambiar la estructura del código sin cambiar su comportamiento observable, apoyándose en pruebas.' },
    { nivel: 'Semi Senior', pregunta: '¿Qué revisas primero en un code review?', respuesta: 'Que el cambio haga lo correcto y sea seguro (lógica, casos borde, errores, seguridad, pruebas); después diseño y legibilidad; el estilo lo verifica el linter.' },
    { nivel: 'Semi Senior', pregunta: '¿Cuándo DRY es una mala idea?', respuesta: 'Cuando unifica código que se parece por casualidad pero cambia por razones distintas; la duplicación es más barata que la abstracción equivocada.' },
    { nivel: 'Senior', pregunta: '¿Cómo refactorizas un módulo legado sin pruebas?', respuesta: 'Primero pruebas de caracterización que capturen el comportamiento actual, luego refactors pequeños, y para cambios grandes un enfoque strangler.' },
    { nivel: 'Senior', pregunta: '¿Cómo manejas un desacuerdo en una revisión?', respuesta: 'Separo preferencia de problema real, argumento con criterios (riesgo, legibilidad, estándar del equipo) y si sigue, lo resolvemos en conversación o con el estándar acordado.' },
    { nivel: 'Staff/Arquitecto', pregunta: '¿Cómo mejorarías la calidad de código en una organización grande?', respuesta: 'Estándares automatizados en el pipeline, guías de revisión, métricas de tiempo de revisión y ejemplos de referencia, más espacio explícito para pagar deuda.' },
    { nivel: 'Staff/Arquitecto', pregunta: '¿Cómo balanceas calidad y velocidad de entrega?', respuesta: 'La calidad interna es lo que mantiene la velocidad a mediano plazo; acepto deuda consciente y registrada, no deuda accidental.' }
  ],
  ejercicios: ['Toma una función de más de 100 líneas, escribe pruebas de caracterización y refactorízala en pasos con commits separados.', 'Revisa un PR real usando una lista de verificación de corrección, seguridad, pruebas y diseño.', 'Configura un linter y un formateador en el pipeline de un proyecto.'],
  proyecto: { titulo: 'Rescate de un módulo de comisiones', desc: 'Partiendo de un módulo legado de cálculo de comisiones (función única, sin pruebas), agrega pruebas de caracterización, refactoriza por reglas de negocio y documenta cada paso en un PR pequeño.', tech: ['Java o C#', 'JUnit/xUnit', 'SonarQube', 'Git'] },
  checklist: ['Escribo nombres que revelan intención', 'Mis funciones hacen una sola cosa', 'Identifico los code smells principales', 'Refactorizo con pruebas y en pasos pequeños', 'Hago revisiones de código útiles y respetuosas', 'Separo refactors de cambios de comportamiento'],
  recursos: [{ kind: 'Libro', label: 'Refactoring — Martin Fowler' }, { kind: 'Libro', label: 'Clean Code — Robert C. Martin' }, { kind: 'Guía', label: 'Google Engineering Practices: Code Review' }],
  relacionados: ['programacion-paradigmas', 'testing-calidad', 'gestion-competencias-rol'],
  plus: {
    conceptos: [
      ['Code smell', 'Señal superficial de un posible problema de diseño (función larga, clase enorme, parámetros excesivos).'],
      ['Prueba de caracterización', 'Prueba que captura el comportamiento actual de código legado antes de cambiarlo.'],
      ['Cohesión', 'Grado en que los elementos de un módulo pertenecen juntos.'],
      ['Acoplamiento', 'Grado en que un módulo depende de los detalles de otro.'],
      ['Regla del boy scout', 'Deja el código un poco más limpio de lo que lo encontraste.'],
      ['Guard clause', 'Retorno temprano para los casos de error que evita anidación.'],
      ['Comando-consulta', 'Separar funciones que cambian estado de las que devuelven datos.'],
      ['YAGNI', 'No construyas lo que aún no se necesita.'],
      ['Nit', 'Comentario de revisión menor y no bloqueante.']
    ],
    profundidad: [
      { t: 'Lista de verificación de code review', p: [
        ['**Corrección**: ¿hace lo que dice? ¿casos borde, nulos, vacíos, concurrencia?', '**Seguridad**: entrada validada, sin secretos, autorización, sin inyección.', '**Pruebas**: ¿cubren el cambio y fallarían si el código estuviera mal?', '**Diseño**: ¿está en la capa correcta? ¿introduce acoplamiento?', '**Operación**: logs, métricas, manejo de errores, migraciones reversibles.', '**Legibilidad**: nombres, tamaño de funciones, comentarios del porqué.']
      ] },
      { t: 'Refactorizar código legado con seguridad', p: [
        ['Encuentra un punto de prueba (seam) donde puedas observar el comportamiento.', 'Escribe pruebas de caracterización con entradas reales, incluidos casos raros.', 'Haz cambios mecánicos pequeños (renombrar, extraer) con ayuda del IDE.', 'Commitea cada paso con pruebas en verde.', 'Para reemplazos grandes, envuelve el módulo viejo y redirige gradualmente al nuevo (strangler).']
      ] }
    ],
    recurrentes: [
      { tema: 'PRs gigantes', por: 'Se aprueban sin leer y concentran el riesgo.', clave: 'Divide por pasos verticales y separa refactors de cambios funcionales.' },
      { tema: 'Abstracción prematura', por: 'Interfaces y genéricos para un solo uso que nadie entiende.', clave: 'Espera al tercer caso real antes de abstraer.' },
      { tema: 'Revisiones lentas', por: 'Un PR esperando días bloquea el flujo de todo el equipo.', clave: 'Acordar un tiempo objetivo de primera revisión (por ejemplo, un día hábil) y priorizar revisar sobre empezar algo nuevo.' }
    ],
    casos: [
      { titulo: 'Knight Capital y el código muerto', cuando: 'Ago 2012', que: 'Una funcionalidad de trading en desuso desde 2003 seguía en el código; una bandera reutilizada la reactivó en un servidor con el despliegue incompleto y generó pérdidas de unos 440 millones de dólares.', causa: 'Código muerto nunca eliminado y reutilización de una bandera con significado antiguo.', leccion: 'Eliminar código muerto es una tarea de seguridad, no estética; las banderas se retiran cuando ya no se usan.', fuente: 'Orden de la SEC sobre Knight Capital Americas LLC (oct. 2013)' }
    ],
    escenarios: [
      { sintoma: 'Cada cambio pequeño en un módulo rompe algo no relacionado.', pasos: ['Medir acoplamiento: ¿qué otros módulos dependen de sus detalles internos?', 'Revisar la cobertura de pruebas del módulo.', 'Identificar las responsabilidades mezcladas.'], solucion: 'Agregar pruebas de caracterización, separar responsabilidades y definir una interfaz estable para los consumidores.' }
    ]
  }
});
