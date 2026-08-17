const { PrismaClient } = require('@prisma/client');
const { calcularAntiguedad, obtenerFactorPorAntiguedad } = require('../../utils/salaryCalculator');
const emailService = require('../email.service');

const prisma = new PrismaClient();

// Calcula los días naturales entre dos fechas (inclusive).
function calcDias(inicio, fin) {
  const a = new Date(inicio);
  const b = new Date(fin);
  return Math.max(0, Math.round((b - a) / 86400000) + 1);
}

// Inicio del periodo de vacaciones vigente (último aniversario laboral).
function getPeriodoActualStart(fechaAlta) {
  const alta = new Date(fechaAlta);
  const hoy = new Date();
  let aniv = new Date(hoy.getFullYear(), alta.getMonth(), alta.getDate());
  if (aniv > hoy) {
    aniv = new Date(hoy.getFullYear() - 1, alta.getMonth(), alta.getDate());
  }
  return aniv;
}

// Formatea una fecha a DD/MM/YYYY para los emails.
function formatDateForEmail(date) {
  const d = new Date(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// Construye el payload de email para una solicitud.
function buildEmailPayload(vacation, employee) {
  return {
    empleadoNombre: [employee.nombres, employee.apellidoPaterno].filter(Boolean).join(' ') || 'Empleado',
    fechaInicio: formatDateForEmail(vacation.fechaInicio),
    fechaFin: formatDateForEmail(vacation.fechaFin),
    dias: calcDias(vacation.fechaInicio, vacation.fechaFin),
    motivo: vacation.motivo
  };
}

// Obtiene los destinatarios RH/ADMIN activos para notificaciones.
async function getRHDestinatarios() {
  return prisma.user.findMany({
    where: { role: { in: ['RH', 'ADMIN'] }, isActive: true },
    select: { email: true, name: true }
  });
}

class VacationService {
  /**
   * Resuelve el empleado asociado al usuario autenticado.
   */
  static async getEmployeeByUser(userId) {
    return prisma.employee.findUnique({ where: { userId } });
  }

  /**
   * Calcula el saldo de vacaciones de un empleado según su antigüedad (LFT).
   * diasDisponibles = días que corresponden - días ya usados (solicitudes APROBADAS)
   * dentro del periodo vigente (desde el último aniversario laboral).
   */
  static async getBalance(employeeId) {
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new Error('Empleado no encontrado');

    const antiguedad = calcularAntiguedad(employee.fechaAlta);
    const diasCorresponden = obtenerFactorPorAntiguedad(antiguedad).diasVacaciones;

    const periodoInicio = getPeriodoActualStart(employee.fechaAlta);
    const periodoFin = new Date(periodoInicio);
    periodoFin.setFullYear(periodoFin.getFullYear() + 1);

    const approved = await prisma.vacationRequest.findMany({
      where: {
        employeeId,
        estatus: 'APROBADA',
        fechaInicio: { gte: periodoInicio, lt: periodoFin }
      },
      select: { fechaInicio: true, fechaFin: true }
    });

    const diasUsados = approved.reduce((acc, r) => acc + calcDias(r.fechaInicio, r.fechaFin), 0);

    return {
      antiguedad,
      diasCorresponden,
      diasUsados,
      diasDisponibles: diasCorresponden - diasUsados,
      periodoInicio,
      periodoFin
    };
  }

  static async create(data, user) {
    const { fechaInicio, fechaFin, motivo } = data || {};

    if (!fechaInicio || !fechaFin) {
      throw new Error('fechaInicio y fechaFin son obligatorias');
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      throw new Error('Fechas inválidas');
    }
    if (fin < inicio) {
      throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
    }

    const employee = await prisma.employee.findUnique({
      where: { userId: user.id },
      include: { reportaA: { include: { user: { select: { email: true, name: true } } } } }
    });
    if (!employee) {
      throw new Error('No tienes un expediente de empleado asociado');
    }

    // Validar saldo disponible de vacaciones (según antigüedad LFT)
    const requestedDays = calcDias(inicio, fin);
    const balance = await this.getBalance(employee.id);
    if (requestedDays > balance.diasDisponibles) {
      throw new Error(`Días insuficientes: solicitas ${requestedDays} día(s) pero solo tienes ${balance.diasDisponibles} disponible(s)`);
    }

    // Resolver jefe directo: si existe (y tiene cuenta) → PENDIENTE + notifica al jefe;
    // si no → va directo a RH (AUTORIZADA) + notifica a RH.
    const jefeUser = employee.reportaA?.user || null;
    const estatus = jefeUser ? 'PENDIENTE' : 'AUTORIZADA';

    const vacation = await prisma.vacationRequest.create({
      data: {
        employeeId: employee.id,
        fechaInicio: inicio,
        fechaFin: fin,
        motivo: motivo || null,
        estatus
      },
      include: {
        empleado: { select: { id: true, nombres: true, apellidoPaterno: true, clave: true } }
      }
    });

    // Notificaciones (asíncronas, no bloqueantes)
    const payload = buildEmailPayload(vacation, employee);
    if (jefeUser) {
      emailService.sendVacationRequestToJefe(jefeUser.email, jefeUser.name || 'Jefe', payload).catch(() => {});
    } else {
      const rhUsers = await getRHDestinatarios();
      for (const rh of rhUsers) emailService.sendVacationPendingRH(rh.email, rh.name, payload).catch(() => {});
    }

    return vacation;
  }

  static async list(filters = {}, user) {
    const where = {};

    // Scoping Nivel B: ADMIN/RH ven todas; el resto solo las propias.
    if (user.role !== 'ADMIN' && user.role !== 'RH') {
      const employee = await this.getEmployeeByUser(user.id);
      if (!employee) return [];
      where.employeeId = employee.id;
    }

    if (filters.estatus) where.estatus = filters.estatus;

    return prisma.vacationRequest.findMany({
      where,
      include: {
        empleado: { select: { id: true, nombres: true, apellidoPaterno: true, clave: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async myRequests(user) {
    const employee = await this.getEmployeeByUser(user.id);
    if (!employee) return [];

    return prisma.vacationRequest.findMany({
      where: { employeeId: employee.id },
      include: {
        empleado: { select: { id: true, nombres: true, apellidoPaterno: true, clave: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getById(id) {
    const vacation = await prisma.vacationRequest.findUnique({
      where: { id },
      include: {
        empleado: {
          select: {
            id: true,
            nombres: true,
            apellidoPaterno: true,
            apellidoMaterno: true,
            clave: true,
            fechaAlta: true,
            departamento: { select: { nombre: true } },
            puesto: { select: { nombre: true } },
            reportaA: { select: { nombres: true, apellidoPaterno: true } }
          }
        },
        jefeAutorizadoPor: { select: { id: true, name: true } },
        aprobadoPor: { select: { id: true, name: true, role: true } }
      }
    });

    if (!vacation) return null;

    const balance = await this.getBalance(vacation.employeeId);
    return { ...vacation, balance };
  }

  static async getPendingForJefe(user) {
    const employee = await this.getEmployeeByUser(user.id);
    if (!employee) return [];

    return prisma.vacationRequest.findMany({
      where: {
        estatus: 'PENDIENTE',
        empleado: { reportaAId: employee.id }
      },
      include: {
        empleado: { select: { id: true, nombres: true, apellidoPaterno: true, clave: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async authorizeByJefe(id, user, comentario) {
    const vacation = await prisma.vacationRequest.findUnique({
      where: { id },
      include: { empleado: { select: { id: true, nombres: true, apellidoPaterno: true, reportaAId: true } } }
    });
    if (!vacation) throw new Error('Solicitud no encontrada');
    if (vacation.estatus !== 'PENDIENTE') {
      throw new Error('Solo se pueden autorizar solicitudes pendientes');
    }

    // Validar que el usuario autenticado sea el jefe directo del solicitante.
    const employee = await this.getEmployeeByUser(user.id);
    if (!employee || vacation.empleado.reportaAId !== employee.id) {
      throw new Error('No eres el jefe directo de este empleado');
    }

    const updated = await prisma.vacationRequest.update({
      where: { id },
      data: {
        estatus: 'AUTORIZADA',
        jefeAutorizadoPorId: user.id,
        jefeAutorizadoAt: new Date(),
        comentarioJefe: comentario || null
      }
    });

    // Notificar a RH
    const rhUsers = await getRHDestinatarios();
    const payload = buildEmailPayload(updated, vacation.empleado);
    for (const rh of rhUsers) emailService.sendVacationPendingRH(rh.email, rh.name, payload).catch(() => {});

    return updated;
  }

  static async approve(id, user, comentario) {
    const vacation = await prisma.vacationRequest.findUnique({ where: { id } });
    if (!vacation) throw new Error('Solicitud no encontrada');
    if (vacation.estatus !== 'AUTORIZADA') {
      throw new Error('Solo se pueden aprobar solicitudes autorizadas por el jefe');
    }

    const updated = await prisma.vacationRequest.update({
      where: { id },
      data: {
        estatus: 'APROBADA',
        aprobadoPorId: user.id,
        aprobadoAt: new Date(),
        comentarioAprobacion: comentario || null
      }
    });

    // Notificar al empleado
    const employee = await prisma.employee.findUnique({ where: { id: vacation.employeeId }, include: { user: true } });
    if (employee?.user?.email) {
      const payload = buildEmailPayload(updated, employee);
      emailService.sendVacationResultToEmployee(employee.user.email, employee.user.name || 'Empleado', payload, 'APROBADA', comentario).catch(() => {});
    }

    return updated;
  }

  static async reject(id, user, comentario) {
    const vacation = await prisma.vacationRequest.findUnique({
      where: { id },
      include: { empleado: { select: { id: true, nombres: true, apellidoPaterno: true, reportaAId: true } } }
    });
    if (!vacation) throw new Error('Solicitud no encontrada');
    if (!['PENDIENTE', 'AUTORIZADA'].includes(vacation.estatus)) {
      throw new Error('Esta solicitud ya no puede rechazarse');
    }

    // RH/ADMIN pueden rechazar; el jefe solo las PENDIENTE de sus subordinados.
    if (user.role !== 'ADMIN' && user.role !== 'RH') {
      const employee = await this.getEmployeeByUser(user.id);
      const isJefe = employee && vacation.empleado.reportaAId === employee.id && vacation.estatus === 'PENDIENTE';
      if (!isJefe) throw new Error('No tienes permisos para rechazar esta solicitud');
    }

    const updated = await prisma.vacationRequest.update({
      where: { id },
      data: { estatus: 'RECHAZADA', comentarioAprobacion: comentario || null }
    });

    // Notificar al empleado
    const employeeRec = await prisma.employee.findUnique({ where: { id: vacation.employeeId }, include: { user: true } });
    if (employeeRec?.user?.email) {
      const payload = buildEmailPayload(updated, employeeRec);
      emailService.sendVacationResultToEmployee(employeeRec.user.email, employeeRec.user.name || 'Empleado', payload, 'RECHAZADA', comentario).catch(() => {});
    }

    return updated;
  }

  static async cancel(id, user) {
    const vacation = await prisma.vacationRequest.findUnique({ where: { id } });
    if (!vacation) throw new Error('Solicitud no encontrada');

    // Ownership (Nivel B): solo el solicitante o ADMIN/RH.
    if (user.role !== 'ADMIN' && user.role !== 'RH') {
      const employee = await this.getEmployeeByUser(user.id);
      if (!employee || vacation.employeeId !== employee.id) {
        throw new Error('No puedes cancelar esta solicitud');
      }
    }

    if (vacation.estatus !== 'PENDIENTE') {
      throw new Error('Solo se pueden cancelar solicitudes pendientes');
    }

    return prisma.vacationRequest.update({
      where: { id },
      data: { estatus: 'CANCELADA' }
    });
  }
}

module.exports = VacationService;
