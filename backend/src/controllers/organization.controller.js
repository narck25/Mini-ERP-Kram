/**
 * organization.controller.js — Wrapper
 * Delegado a department.controller.js y position.controller.js.
 */
const deptCtrl = require('./department.controller');
const posCtrl = require('./position.controller');

exports.getAllDepartments = deptCtrl.getAllDepartments;
exports.getDepartmentById = deptCtrl.getDepartmentById;
exports.createDepartment = deptCtrl.createDepartment;
exports.updateDepartment = deptCtrl.updateDepartment;
exports.deleteDepartment = deptCtrl.deleteDepartment;
exports.getJobPositionsByDepartment = deptCtrl.getJobPositionsByDepartment;
exports.getAllJobPositions = posCtrl.getAllJobPositions;
exports.getJobPositionById = posCtrl.getJobPositionById;
exports.createJobPosition = posCtrl.createJobPosition;
exports.updateJobPosition = posCtrl.updateJobPosition;
exports.deleteJobPosition = posCtrl.deleteJobPosition;
exports.getOrganizationStats = posCtrl.getOrganizationStats;