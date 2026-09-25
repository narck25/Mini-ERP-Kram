/**
 * Criterios fijos de la evaluación de periodo de prueba (30/60/90 días).
 *
 * Copia exacta de las secciones 4 y 4.1 del formato de RH
 * "Evaluación Desempeño 30/60/90 Kram.pdf" — mismas 6 competencias y 3
 * hábitos para todo el personal administrativo, sin variación por puesto
 * (a diferencia de la evaluación operativa trimestral, que sí varía por
 * puesto — ver Fase 2 en el plan).
 *
 * Fijos en código a propósito (no editables desde la UI): si RH necesita
 * ajustar la redacción o agregar un criterio, es un cambio de código, no
 * de configuración en pantalla.
 */

const COMPETENCIAS = [
  {
    key: 'aptitudTecnica',
    label: 'Aptitud Técnica y Dominio del Puesto',
    criterio: 'Demuestra conocimiento práctico en las herramientas, normativas y procedimientos operativos requeridos para el desempeño de sus funciones. Producción limpia y sin errores recurrentes.'
  },
  {
    key: 'trabajoEquipo',
    label: 'Trabajo en Equipo y Colaboración',
    criterio: 'Se integra positivamente con sus pares y otras áreas. Muestra disposición para apoyar, compartir información relevante y alinearse a las metas globales de Comercializadora Kram.'
  },
  {
    key: 'comunicacion',
    label: 'Comunicación Efectiva y Asertiva',
    criterio: 'Expresa ideas y datos con claridad, oportunidad y respeto tanto de forma verbal como escrita. Informa activamente a su líder sobre avances y eventuales desviaciones.'
  },
  {
    key: 'liderazgo',
    label: 'Liderazgo, Autogestión y Proactividad',
    criterio: 'Administra eficientemente su tiempo y prioridades sin necesidad de supervisión excesiva. Propone soluciones proactivas ante imprevistos cotidianos.'
  },
  {
    key: 'resolucionConflictos',
    label: 'Resolución de Conflictos y Adaptabilidad',
    criterio: 'Mantiene la serenidad y la objetividad bajo presión. Se adapta con rapidez a los cambios organizacionales, imprevistos o nuevos flujos de trabajo con actitud constructiva.'
  },
  {
    key: 'apegoCultura',
    label: 'Apego a Cultura y Valores Kram',
    criterio: 'Cumple con puntualidad, código de conducta, imagen corporativa, políticas internas de la empresa y respeto hacia la estructura organizacional.'
  }
];

const HABITOS = [
  {
    key: 'asistencia',
    label: 'Asistencia y Puntualidad',
    criterio: 'Cumple con los horarios establecidos y políticas de registro de asistencia.'
  },
  {
    key: 'ordenLimpieza',
    label: 'Orden y Limpieza',
    criterio: 'Mantiene su área de trabajo organizada, limpia y cuida sus herramientas.'
  },
  {
    key: 'cumplimientoNormas',
    label: 'Cumplimiento de Normas',
    criterio: 'Respeta las políticas internas, reglamentos y normativas de seguridad de la empresa.'
  }
];

// Mínimo requerido por el PDF: cada competencia "Satisfactorio (3+)", y el
// promedio general de competencias mínimo 3.0.
const CALIFICACION_MINIMA_COMPETENCIA = 3;

// Mapeo del dictamen institucional del PDF -> valores ya existentes del
// enum ProbationEvaluationResult (no se agrega un enum nuevo).
const DICTAMEN_LABELS = {
  APROBADO: 'Aprobado Satisfactoriamente',
  EXTENDIDO: 'Aprobado Condicionado (PIP 30 días)',
  NO_APROBADO: 'No Satisfactorio'
};

module.exports = { COMPETENCIAS, HABITOS, CALIFICACION_MINIMA_COMPETENCIA, DICTAMEN_LABELS };
