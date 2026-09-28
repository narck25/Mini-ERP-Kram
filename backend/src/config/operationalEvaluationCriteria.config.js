/**
 * operationalEvaluationCriteria.config.js
 * ─────────────────────────────────────────────────────────────
 * Criterios fijos (no editables desde UI) del formato oficial de RH
 * "Evaluación de Desempeño Operativo KRAM" — 6 puestos operativos,
 * evaluación trimestral por el jefe directo, escala 1-5 por criterio.
 *
 * Cada puesto tiene 3 secciones con ponderación fija:
 *   - rh:        30% (Recursos Humanos — asistencia, disciplina, presentación)
 *   - actitud:   20% (Mentalidad y Actitud)
 *   - desempeno: 50% (Desempeño y Productividad — KPIs del puesto)
 *
 * El peso de cada criterio está en puntos porcentuales directos (ej. 10 =
 * 10 pts de 100), de forma que los pesos de una sección ya suman su
 * ponderación (30/20/50) y la suma de las 3 secciones da 100.
 *
 * Puntos obtenidos por criterio = (calificación 1-5 ÷ 5) × peso.
 */

const PUESTOS = {
  'Ayudante General': {
    label: 'Ayudante General',
    rh: [
      { key: 'puntualidad', label: 'Puntualidad y asistencia', criterio: 'Llega a tiempo y no registra faltas injustificadas en el trimestre.', peso: 10 },
      { key: 'horarioCompleto', label: 'Cumplimiento de horario completo', criterio: 'Permanece en su puesto durante la jornada acordada sin abandonos sin autorización.', peso: 8 },
      { key: 'incidenciasDisciplinarias', label: 'Incidencias disciplinarias', criterio: 'Ausencia de llamadas de atención, reportes o conflictos documentados en el período.', peso: 7 },
      { key: 'uniformeEpp', label: 'Uso correcto de uniformes y EPP', criterio: 'Porta correctamente uniforme, calzado y equipo de protección requeridos.', peso: 5 },
    ],
    actitud: [
      { key: 'disposicion', label: 'Disposición y actitud de servicio', criterio: 'Muestra buena disposición al recibir instrucciones y apoya sin necesidad de ser solicitado.', peso: 7 },
      { key: 'trabajoEquipo', label: 'Trabajo en equipo', criterio: 'Colabora con sus compañeros, comparte carga de trabajo y no genera fricciones.', peso: 6 },
      { key: 'proactividad', label: 'Proactividad', criterio: 'Identifica tareas pendientes y actúa sin esperar indicación constante.', peso: 4 },
      { key: 'adaptabilidad', label: 'Adaptabilidad al cambio', criterio: 'Acepta ajustes en funciones o procesos sin resistencia.', peso: 3 },
    ],
    desempeno: [
      { key: 'productividadGeneral', label: 'Productividad general', criterio: 'Volumen de tareas completadas en tiempo vs. lo asignado en el período.', peso: 12 },
      { key: 'calidadTrabajo', label: 'Calidad del trabajo', criterio: 'Tareas ejecutadas sin errores, retrabajos mínimos.', peso: 10 },
      { key: 'apoyoAlmacen', label: 'Apoyo a almacén y surtido', criterio: 'Cumplimiento en actividades de surtido, carga, acomodo y limpieza asignadas.', peso: 10 },
      { key: 'seguimientoInstrucciones', label: 'Seguimiento de instrucciones', criterio: 'Ejecuta indicaciones correctamente desde la primera vez.', peso: 9 },
      { key: 'ordenLimpieza', label: 'Orden y limpieza en área de trabajo', criterio: 'Mantiene su área ordenada y limpia durante y al finalizar la jornada.', peso: 9 },
    ],
  },
  'Chofer': {
    label: 'Chofer',
    rh: [
      { key: 'puntualidad', label: 'Puntualidad y asistencia', criterio: 'Registra entrada a tiempo; sin faltas injustificadas en el trimestre.', peso: 10 },
      { key: 'incidenciasViales', label: 'Incidencias viales o disciplinarias', criterio: 'Sin infracciones de tránsito, accidentes o reportes de conducta inapropiada.', peso: 10 },
      { key: 'bitacoraUnidad', label: 'Registro en bitácora de unidad', criterio: 'Completa la bitácora de gasolina, mantenimientos y revisiones periódicas sin omisiones.', peso: 10 },
    ],
    actitud: [
      { key: 'atencionClientes', label: 'Atención y cortesía con clientes', criterio: 'Trato amable, profesional y respetuoso durante las visitas y entregas.', peso: 8 },
      { key: 'responsabilidad', label: 'Responsabilidad y confiabilidad', criterio: 'Maneja la mercancía y el vehículo con cuidado; es confiable con valores y documentos.', peso: 7 },
      { key: 'comunicacionOficina', label: 'Comunicación con oficina', criterio: 'Reporta oportunamente incidencias, faltantes o cambios en ruta sin necesidad de que lo busquen.', peso: 5 },
    ],
    desempeno: [
      { key: 'entregasCompletas', label: '% Entregas completas y conformes', criterio: 'Pedidos entregados sin faltante ni error respecto a la factura.', peso: 15 },
      { key: 'firmasRecibido', label: '% Firmas de recibido recabadas', criterio: 'Documentos de entrega firmados en cada parada sin excepción.', peso: 10 },
      { key: 'reporteIncidenciasDia', label: 'Reporte de incidencias en el día', criterio: 'Todas las incidencias o faltantes comunicados el mismo día de la ruta.', peso: 8 },
      { key: 'exactitudConteo', label: 'Exactitud en conteo de pedidos/blisters', criterio: 'Conteo correcto al recibir embarque del almacén, sin diferencias.', peso: 9 },
      { key: 'planificacionRuta', label: 'Planificación y cumplimiento de ruta', criterio: 'Secuencia de ruta optimizada; entrega todos los puntos programados.', peso: 8 },
    ],
  },
  'Almacenista': {
    label: 'Almacenista',
    rh: [
      { key: 'puntualidad', label: 'Puntualidad y asistencia', criterio: 'Sin retardos ni faltas injustificadas en el trimestre.', peso: 10 },
      { key: 'incidenciasDisciplinarias', label: 'Incidencias disciplinarias', criterio: 'Ausencia de reportes, llamadas de atención o conflictos formales.', peso: 10 },
      { key: 'eppSeguridad', label: 'Uso de EPP y normas de seguridad', criterio: 'Cumple con protocolo de seguridad e higiene dentro del almacén.', peso: 10 },
    ],
    actitud: [
      { key: 'trabajoEquipoAlmacen', label: 'Trabajo en equipo en almacén', criterio: 'Apoya a compañeros en surtido y tareas compartidas sin ser solicitado.', peso: 7 },
      { key: 'disposicionPositiva', label: 'Disposición y actitud positiva', criterio: 'Recibe instrucciones y cambios con buena actitud; no genera ambiente negativo.', peso: 6 },
      { key: 'iniciativa', label: 'Iniciativa y proactividad', criterio: 'Detecta faltantes, desorden o errores y actúa sin esperar indicación.', peso: 4 },
      { key: 'comunicacionEfectiva', label: 'Comunicación efectiva', criterio: 'Reporta novedades al supervisor de forma clara y oportuna.', peso: 3 },
    ],
    desempeno: [
      { key: 'pedidosSurtidos', label: '% Pedidos surtidos correctamente', criterio: 'Pedidos entregados sin error de producto, cantidad o presentación.', peso: 14 },
      { key: 'exactitudInventario', label: '% Exactitud en conteo de inventario', criterio: 'Conteos físicos sin diferencia respecto al sistema.', peso: 12 },
      { key: 'cumplimientoInventarios', label: 'Cumplimiento de inventarios programados', criterio: 'Inventarios realizados en fecha y forma acordada.', peso: 10 },
      { key: 'ordenLimpiezaArea', label: 'Orden y limpieza del área', criterio: 'Área limpia, señalizada y con producto acomodado según PEPS.', peso: 7 },
      { key: 'tiempoSurtido', label: 'Tiempo de surtido por pedido', criterio: 'Velocidad y eficiencia en el proceso de surtido dentro del estándar.', peso: 7 },
    ],
  },
  'Preventista': {
    label: 'Preventista',
    rh: [
      { key: 'puntualidad', label: 'Puntualidad y asistencia', criterio: 'Inicio de ruta a tiempo; sin faltas injustificadas.', peso: 10 },
      { key: 'presentacionPersonal', label: 'Presentación personal', criterio: 'Porta uniforme completo y mantiene imagen profesional en visitas a tiendas.', peso: 10 },
      { key: 'incidenciasDisciplinarias', label: 'Incidencias disciplinarias', criterio: 'Sin reportes de conducta inapropiada con clientes o internamente.', peso: 10 },
    ],
    actitud: [
      { key: 'orientacionCliente', label: 'Orientación al cliente', criterio: 'Construye relación de confianza con los encargados de tienda; los clientes lo solicitan.', peso: 8 },
      { key: 'autogestion', label: 'Autogestión y disciplina de ruta', criterio: 'Organiza su tiempo y ruta sin supervisión constante.', peso: 6 },
      { key: 'comunicacionOficina', label: 'Comunicación con oficina', criterio: 'Avisa puntualmente cambios de visita, pedidos especiales e incidencias.', peso: 3 },
      { key: 'perseverancia', label: 'Perseverancia ante el rechazo', criterio: 'Mantiene actitud positiva ante pedidos negados o negociaciones difíciles.', peso: 3 },
    ],
    desempeno: [
      { key: 'coberturaRuta', label: '% Cobertura de ruta de visitas', criterio: 'Tiendas visitadas vs. tiendas programadas en la ruta del trimestre.', peso: 15 },
      { key: 'pedidosPorVisita', label: '# Pedidos recolectados por visita', criterio: 'Volumen promedio de pedidos levantados por punto de venta visitado.', peso: 12 },
      { key: 'pedidosSinError', label: '% Pedidos capturados sin error', criterio: 'Pedidos registrados en sistema sin corrección posterior.', peso: 10 },
      { key: 'avisosATiempo', label: '% Avisos de visita y entrega a tiempo', criterio: 'Notificaciones al gerente realizadas con la anticipación acordada.', peso: 8 },
      { key: 'diligencias', label: 'Diligencias y gestiones completadas', criterio: 'Compras de papelería, suministros y encargos resueltos en tiempo.', peso: 5 },
    ],
  },
  'Promotor': {
    label: 'Promotor',
    rh: [
      { key: 'puntualidadPV', label: 'Puntualidad y asistencia a puntos de venta', criterio: 'Llega a tiempo a cada punto asignado; sin ausencias injustificadas.', peso: 10 },
      { key: 'presentacionUniforme', label: 'Presentación personal y uniforme', criterio: 'Imagen correcta y alineada con la marca en todo momento.', peso: 10 },
      { key: 'incidenciasDisciplinarias', label: 'Incidencias disciplinarias', criterio: 'Sin reportes de conducta inapropiada en tienda o con clientes.', peso: 10 },
    ],
    actitud: [
      { key: 'actitudServicio', label: 'Actitud de servicio y entusiasmo', criterio: 'Transmite energía y entusiasmo por el producto; motiva la compra.', peso: 7 },
      { key: 'adaptabilidad', label: 'Adaptabilidad', criterio: 'Se ajusta a diferentes formatos de tienda, horarios y tipos de cliente.', peso: 5 },
      { key: 'trabajoEquipo', label: 'Trabajo en equipo con preventista/almacén', criterio: 'Coordina actividades con el equipo de ventas y logística.', peso: 5 },
      { key: 'iniciativaPV', label: 'Iniciativa en punto de venta', criterio: 'Propone mejoras en exhibición o detecta oportunidades sin indicación.', peso: 3 },
    ],
    desempeno: [
      { key: 'coberturaPV', label: 'Cobertura de puntos de venta asignados', criterio: '% de puntos visitados y atendidos vs. los programados.', peso: 14 },
      { key: 'calidadExhibicion', label: 'Calidad de exhibición del producto', criterio: 'Planograma cumplido, producto visible, bien acomodado y surtido.', peso: 12 },
      { key: 'reporteActividades', label: 'Reporte de actividades y visitas', criterio: 'Reportes enviados completos y en tiempo al supervisor.', peso: 10 },
      { key: 'deteccionIncidencias', label: 'Detección y reporte de incidencias en tienda', criterio: 'Faltantes, caducidades o problemas de exhibición reportados el mismo día.', peso: 8 },
      { key: 'impactoRotacion', label: 'Impacto en rotación de producto', criterio: 'Contribución observada en la salida del producto en su punto de venta.', peso: 6 },
    ],
  },
  'Degustador': {
    label: 'Degustador',
    rh: [
      { key: 'puntualidadEvento', label: 'Puntualidad y asistencia a evento/punto', criterio: 'Presente en tiempo y lugar asignado sin excepciones.', peso: 10 },
      { key: 'presentacionHigiene', label: 'Presentación personal e higiene', criterio: 'Uniforme impecable, higiene personal y manejo adecuado de alimentos.', peso: 12 },
      { key: 'incidenciasDisciplinarias', label: 'Incidencias disciplinarias', criterio: 'Sin reportes de conducta inadecuada con consumidores o personal de tienda.', peso: 8 },
    ],
    actitud: [
      { key: 'dinamismo', label: 'Actitud y dinamismo en degustación', criterio: 'Genera acercamiento con el consumidor de forma amigable y proactiva.', peso: 8 },
      { key: 'conocimientoProducto', label: 'Conocimiento del producto', criterio: 'Domina características, beneficios y diferenciadores del producto que degusta.', peso: 7 },
      { key: 'resiliencia', label: 'Resiliencia y tolerancia a la negativa', criterio: 'Mantiene actitud positiva cuando el consumidor rechaza la degustación.', peso: 3 },
      { key: 'trabajoEquipo', label: 'Trabajo en equipo con promotor/preventista', criterio: 'Coordina con el equipo en tienda para maximizar el impacto de la activación.', peso: 2 },
    ],
    desempeno: [
      { key: 'degustacionesPorTurno', label: '# Degustaciones realizadas por turno', criterio: 'Volumen de personas atendidas en degustación vs. meta del período.', peso: 14 },
      { key: 'tasaConversion', label: 'Tasa de conversión observada', criterio: 'Consumidores que compraron el producto tras la degustación (estimado o conteo).', peso: 12 },
      { key: 'calidadMontaje', label: 'Calidad en preparación y montaje', criterio: 'Área de degustación presentada correctamente, con higiene y materiales completos.', peso: 10 },
      { key: 'reporteActivaciones', label: 'Reporte de activaciones entregado', criterio: 'Reporte de degustación entregado al supervisor al finalizar el turno, completo.', peso: 8 },
      { key: 'cumplimientoGuion', label: 'Cumplimiento del guión / pitch de venta', criterio: 'Aplica correctamente el argumentario del producto en cada interacción.', peso: 6 },
    ],
  },
};

const PUESTOS_ELEGIBLES = Object.keys(PUESTOS);

/**
 * Alias de puestos reales (catálogo de producción, `plantilla_empleados_UNIFICADA.csv`)
 * que no coinciden letra por letra con los 6 nombres canónicos de arriba pero
 * corresponden al mismo rol operativo — confirmado con RH puesto por puesto
 * (2026-09-28). Cada valor es el nombre EXACTO tal como quedó en `JobPosition.nombre`
 * al importarse (mayúsculas, sin acentos donde el CSV no los llevaba).
 *
 * No es matching difuso: solo estas cadenas exactas resuelven al puesto canónico.
 */
const ALIASES = {
  'Chofer': ['CHOFER REPARTO', 'AYUDANTE DE CHOFER', 'AUXILIAR DE REPARTO'],
  'Almacenista': ['AUXILIAR DE DEVOLUCIONES', 'ENCARGADA DE ALMACEN'],
  'Degustador': ['DEGUSTADORA'],
  'Ayudante General': ['AYUDANTE DE ALMACEN', 'AUXILIAR DE ALMACEN', 'AYUDANTE DE ALMACEN CUN'],
  'Preventista': ['KAM SUR (KEY ACCOUNT MANAGER SUR)', 'KAM (KEY ACCOUNT MANAGER)'],
};

// Mapa invertido nombre-alias (normalizado) → puesto canónico, para lookup O(1).
const CANONICAL_BY_ALIAS = Object.entries(ALIASES).reduce((acc, [canonico, alias]) => {
  alias.forEach((nombre) => { acc[nombre.trim().toLowerCase()] = canonico; });
  return acc;
}, {});

const SECCION_PONDERACION = { rh: 30, actitud: 20, desempeno: 50 };

const MINIMO_APROBATORIO = 90; // % — según el PDF, mínimo para ser elegible a incremento salarial

const RESULTADO_LABELS = {
  PENDIENTE: 'Pendiente',
  APROBADO_DISTINCION: 'Aprobado',
  EN_DESARROLLO: 'En Desarrollo',
  NO_APROBADO: 'No Aprobado',
};

/**
 * Busca la plantilla de criterios de un puesto por nombre, normalizando
 * espacios y mayúsculas/minúsculas (el nombre real en JobPosition.nombre
 * puede no coincidir exactamente en capitalización).
 */
function getTemplateByPuestoNombre(nombre) {
  if (!nombre) return null;
  const normalizado = nombre.trim().toLowerCase();
  const key = PUESTOS_ELEGIBLES.find((k) => k.toLowerCase() === normalizado) || CANONICAL_BY_ALIAS[normalizado];
  return key ? PUESTOS[key] : null;
}

/**
 * Calcula el resultado (PENDIENTE excluido) a partir de un % 0-100,
 * según la tabla de resultados del PDF.
 */
function calcularResultado(porcentaje) {
  if (porcentaje >= MINIMO_APROBATORIO) return 'APROBADO_DISTINCION';
  if (porcentaje >= 75) return 'EN_DESARROLLO';
  return 'NO_APROBADO';
}

module.exports = {
  PUESTOS,
  PUESTOS_ELEGIBLES,
  ALIASES,
  SECCION_PONDERACION,
  MINIMO_APROBATORIO,
  RESULTADO_LABELS,
  getTemplateByPuestoNombre,
  calcularResultado,
};
