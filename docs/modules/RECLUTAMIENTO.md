# Módulo Reclutamiento

## 1. Cómo funciona

Gestiona el proceso de **requisición de personal** hasta la contratación:

1. Un empleado **solicita una vacante** (requisición de personal).
2. **RH aprueba** la requisición.
3. La vacante pasa a estado "Buscando".
4. Se **registran candidatos** y se organizan en un tablero **Kanban** con tres columnas: *En revisión*, *Seleccionado* y *Descartado*.
5. Se emiten **votos** (visto bueno / no seleccionado) y se **selecciona** al candidato para iniciar contratación.

Incluye además: perfil técnico detallado, actividades de la vacante, comentarios y documentos del candidato (CV y pruebas psicométricas).

## 2. Quiénes pueden usarlo

| Rol | Qué puede hacer |
|-----|-----------------|
| **Empleado (solicitante)** | Crear requisiciones ("Solicitar vacante"), ver "Mis solicitudes", votar candidatos si es el solicitante de la vacante. |
| **RH** | Aprobar, cerrar y cancelar vacantes; crear vacantes; gestionar candidatos, votos, perfil técnico y comentarios. |
| **ADMIN** | Igual que RH (bypass). |

## 3. Manual del administrador (RH/Admin)

- **Crear vacante**: `/rh/reclutamiento` → "Crear vacante" (o desde una requisición aprobada).
- **Aprobar/cerrar/cancelar**: en el detalle de la vacante (`/reclutamiento/vacantes/[id]`).
- **Gestionar candidatos**: en la pestaña *Candidatos* (Kanban). Arrastra entre columnas para votar (visto bueno / descartar) o devolver a revisión.
- **Subir CV y pruebas**: en cada candidato.
- **Perfil técnico** y **actividades**: secciones del detalle de la vacante.
- **Comentarios**: historial de comentarios de la vacante.

## 4. Manual del usuario (solicitante)

- **Solicitar una vacante**: `/reclutamiento/solicitar-vacante`. Completa el perfil, justificación y requisitos.
- **Ver mis solicitudes**: `/reclutamiento/mis-solicitudes`.
- **Votar candidatos**: si eres el solicitante, puedes mover candidatos a "Seleccionado" o "Descartado" en el Kanban.
