# Módulo Incidencias (Asistencia)

## 1. Cómo funciona

Procesa los registros de **asistencia** (checadas) del reloj checador (ZKTeco) para generar el reporte de **incidencias** (faltas, retardos, etc.).

Flujo:

1. Se **sube el archivo CSV** exportado del checador (`/rh/incidencias`).
2. El sistema procesa las checadas por empleado y día (aplica filtro anti-rebote de > 5 min y calcula la jornada).
3. Se consulta el **reporte de incidencias** por rango de fechas y empleado.

## 2. Quiénes pueden usarlo

- **ADMIN y RH** (tienen el módulo `INCIDENCIAS` en su preset).
- Cualquier otro rol al que se le asigne el módulo `INCIDENCIAS` en Gestión de Accesos (Nivel A: `requireModule('INCIDENCIAS')`).

## 3. Manual del administrador

- **Cargar asistencia**: en `/rh/incidencias` → "Subir CSV", selecciona el archivo del checador.
- **Consultar**: filtra por rango de fechas y empleado para ver el reporte de incidencias.
- **Interpretar**: el sistema agrupa las checadas por empleado/fecha y calcula entrada/salida, detectando faltas y retardos.

## 4. Manual del usuario

- Módulo de consulta para RH/Admin. No hay acciones de autoservicio para el empleado.
