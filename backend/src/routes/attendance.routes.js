const express = require('express');
const router = express.Router();
const { AttendanceController, upload } = require('../controllers/attendance.controller');
const AuthMiddleware = require('../middlewares/auth.middleware');

/**
 * @route   POST /upload
 * @desc    Upload and process CSV file from ZKTeco checador
 * @access  Protected (Module: INCIDENCIAS or Role: RH/ADMIN)
 */
router.post(
  '/upload',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('INCIDENCIAS'),
  upload.single('csvFile'),
  AttendanceController.uploadCSV
);

/**
 * @route   GET /my
 * @desc    Get the authenticated user's own attendance records by date range
 * @access  Protected (cualquier usuario autenticado, sin necesitar el módulo INCIDENCIAS)
 */
router.get(
  '/my',
  AuthMiddleware.verifyToken,
  AttendanceController.getMyRecords
);

/**
 * @route   GET /
 * @desc    Get attendance records by date range
 * @access  Protected (Module: INCIDENCIAS or Role: RH/ADMIN)
 */
router.get(
  '/',
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireModule('INCIDENCIAS'),
  AttendanceController.getRecords
);

module.exports = router;
