import { CapacityForecast, WorkerProfile, StudentCohort } from '../models/store.js';
import { forecastWorkforceCapacity } from '../services/geminiService.js';
import { logAuditEvent } from '../middleware/auditMiddleware.js';

export async function getCapacityOverview(req, res, next) {
  try {
    const workers = await WorkerProfile.find();
    const forecasts = await CapacityForecast.find();
    const cohorts = await StudentCohort.find();

    const totalStaffCount = workers.length;
    const totalFTE = workers.reduce((acc, w) => acc + (w.fte || 1.0), 0);
    const avgUtilization = workers.length > 0
      ? Math.round(workers.reduce((acc, w) => acc + (w.utilizationRate || 0), 0) / workers.length)
      : 0;

    const criticalBurnoutCount = workers.filter(w => w.burnoutRisk === 'Critical' || w.burnoutRisk === 'High').length;
    const totalDeficitHours = forecasts.reduce((acc, f) => acc + (f.deficitHours > 0 ? f.deficitHours : 0), 0);
    const totalDeficitFTE = forecasts.reduce((acc, f) => acc + (f.deficitFTE > 0 ? f.deficitFTE : 0), 0);

    const totalStudents = cohorts.reduce((acc, c) => acc + (c.studentCount || 0), 0) || 2960;
    const avgAttendance = cohorts.length > 0
      ? (cohorts.reduce((acc, c) => acc + (c.attendanceRate || 0), 0) / cohorts.length).toFixed(1)
      : 95.2;
    const totalInterventions = cohorts.reduce((acc, c) => acc + (c.interventionCount || 0), 0) || 261;

    // Campus breakdown
    const campusBreakdown = [
      { campus: 'Oakridge High Campus', enrolment: 1420, staffFTE: 68, deficitFTE: 6.0, status: 'Critical Deficit' },
      { campus: 'Oakridge Middle Campus', enrolment: 890, staffFTE: 44, deficitFTE: 2.0, status: 'Moderate Deficit' },
      { campus: 'Lincoln Elementary Campus', enrolment: 650, staffFTE: 34, deficitFTE: -1.0, status: 'Balanced' }
    ];

    res.json({
      success: true,
      data: {
        totalStaffCount,
        totalFTE: Number(totalFTE.toFixed(1)),
        avgUtilization,
        criticalBurnoutCount,
        totalDeficitHours,
        totalDeficitFTE: Number(totalDeficitFTE.toFixed(1)),
        totalStudents,
        avgAttendance: Number(avgAttendance),
        totalInterventions,
        campusBreakdown,
        forecasts,
        cohorts
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getForecasts(req, res, next) {
  try {
    const { campus } = req.query;
    const filter = {};
    if (campus && campus !== 'All') filter.campus = campus;
    const forecasts = await CapacityForecast.find(filter);
    res.json({ success: true, data: forecasts });
  } catch (err) {
    next(err);
  }
}

export async function generateForecast(req, res, next) {
  try {
    const { campus, enrolment, enrolmentGrowth, currentStaffFTE, iepInterventionCaseload } = req.body;

    const result = await forecastWorkforceCapacity({
      campus: campus || 'Oakridge High Campus',
      enrolment: Number(enrolment) || 1450,
      enrolmentGrowth: Number(enrolmentGrowth) || 8.5,
      currentStaffFTE: Number(currentStaffFTE) || 68,
      iepInterventionCaseload: Number(iepInterventionCaseload) || 150
    });

    // Save to forecasts
    const saved = await CapacityForecast.create(result);

    await logAuditEvent({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'CAPACITY_FORECAST_GENERATED',
      entityType: 'CapacityForecast',
      entityId: saved.id || saved._id,
      ipAddress: req.ip,
      newState: { deficitHours: result.deficitHours, deficitFTE: result.deficitFTE },
      notes: `Generated new capacity forecast for ${campus} using AI engine.`
    });

    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
}
