import {
  WorkerProfile,
  Assignment,
  CapacityForecast,
  SkillTaxonomy,
  AuditLog,
} from '../models/store.js';
import { logAuditEvent } from '../middleware/auditMiddleware.js';

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const normalize = (value) => String(value || '').trim().toLowerCase();

const csvEscape = (value) => {
  if (value === null || value === undefined) return '';
  return `"${String(value).replace(/"/g, '""')}"`;
};

export async function getInventoryReport(req, res, next) {
  try {
    const {
      campus,
      department,
      risk,
      status,
    } = req.query;

    let workers = await WorkerProfile.find();
    let assignments = await Assignment.find();
    const skills = await SkillTaxonomy.find();
    const forecasts = await CapacityForecast.find();

    // ---------------------------------------------------------
    // Filters
    // ---------------------------------------------------------

    if (campus) {
      workers = workers.filter(
        (w) => normalize(w.campus) === normalize(campus)
      );

      assignments = assignments.filter(
        (a) => normalize(a.campus) === normalize(campus)
      );
    }

    if (department) {
      workers = workers.filter(
        (w) => normalize(w.department) === normalize(department)
      );
    }

    if (risk) {
      workers = workers.filter(
        (w) =>
          normalize(w.burnoutRisk) === normalize(risk) ||
          normalize(w.riskLevel) === normalize(risk)
      );
    }

    if (status) {
      assignments = assignments.filter(
        (a) => normalize(a.status) === normalize(status)
      );
    }

    // ---------------------------------------------------------
    // Workforce KPIs
    // ---------------------------------------------------------

    const totalWorkers = workers.length;

    const totalFTE = workers.reduce(
      (sum, w) => sum + safeNumber(w.fte, 1),
      0
    );

    const totalWeeklyCapacity = workers.reduce(
      (sum, w) => sum + safeNumber(w.weeklyHoursMax),
      0
    );

    const totalWorkloadHours = workers.reduce(
      (sum, w) => sum + safeNumber(w.currentWorkloadHours),
      0
    );

    const averageUtilization =
      totalWorkers > 0
        ? workers.reduce(
            (sum, w) => sum + safeNumber(w.utilizationRate),
            0
          ) / totalWorkers
        : 0;

    const highRiskWorkers = workers.filter((w) => {
      const riskValue = normalize(w.burnoutRisk);
      return ['high', 'critical', 'severe'].includes(riskValue);
    }).length;

    const mediumRiskWorkers = workers.filter((w) => {
      const riskValue = normalize(w.burnoutRisk);
      return ['medium', 'moderate', 'warning'].includes(riskValue);
    }).length;

    const availableHours = Math.max(
      totalWeeklyCapacity - totalWorkloadHours,
      0
    );

    // ---------------------------------------------------------
    // Certifications
    // ---------------------------------------------------------

    let totalCerts = 0;
    let expiringCerts = 0;
    let expiredCerts = 0;

    workers.forEach((worker) => {
      (worker.certifications || []).forEach((cert) => {
        totalCerts++;

        const certStatus = normalize(cert.status);

        if (certStatus === 'expiring_soon') {
          expiringCerts++;
        }

        if (certStatus === 'expired') {
          expiredCerts++;
        }
      });
    });

    // ---------------------------------------------------------
    // Department statistics
    // ---------------------------------------------------------

    const departmentStats = {};

    workers.forEach((worker) => {
      const departmentName = worker.department || 'Unassigned';

      if (!departmentStats[departmentName]) {
        departmentStats[departmentName] = {
          headcount: 0,
          fte: 0,
          workloadHours: 0,
          averageUtilization: 0,
          highRisk: 0,
        };
      }

      const stats = departmentStats[departmentName];

      stats.headcount += 1;
      stats.fte += safeNumber(worker.fte, 1);
      stats.workloadHours += safeNumber(worker.currentWorkloadHours);
      stats.averageUtilization += safeNumber(worker.utilizationRate);

      const riskValue = normalize(worker.burnoutRisk);

      if (['high', 'critical', 'severe'].includes(riskValue)) {
        stats.highRisk += 1;
      }
    });

    Object.values(departmentStats).forEach((stats) => {
      stats.averageUtilization =
        stats.headcount > 0
          ? Number((stats.averageUtilization / stats.headcount).toFixed(2))
          : 0;

      stats.fte = Number(stats.fte.toFixed(2));
      stats.workloadHours = Number(stats.workloadHours.toFixed(2));
    });

    // ---------------------------------------------------------
    // Skill gap analysis
    // ---------------------------------------------------------

    const skillGaps = {};

    skills.forEach((skill) => {
      const threshold = safeNumber(
        skill.requiredProficiencyThreshold,
        3
      );

      const qualifiedWorkers = workers.filter((worker) =>
        (worker.skills || []).some(
          (workerSkill) =>
            normalize(workerSkill.name) === normalize(skill.name) &&
            safeNumber(workerSkill.proficiency) >= threshold
        )
      );

      const qualifiedStaffCount = qualifiedWorkers.length;

      let gapStatus = 'Adequate';

      if (qualifiedStaffCount <= 1) {
        gapStatus = 'Critical Shortage';
      } else if (qualifiedStaffCount <= 2) {
        gapStatus = 'Tight Capacity';
      }

      skillGaps[skill.name] = {
        category: skill.category,
        demand: skill.demandLevel,
        requiredProficiency: threshold,
        qualifiedStaffCount,
        gapStatus,
        evidence: qualifiedWorkers.map((worker) => ({
          workerId: worker.id,
          name: worker.fullName,
          proficiency:
            worker.skills?.find(
              (s) =>
                normalize(s.name) === normalize(skill.name)
            )?.proficiency || 0,
        })),
      };
    });

    // ---------------------------------------------------------
    // Capacity analytics
    // ---------------------------------------------------------

    const capacitySummary = forecasts.map((forecast) => ({
      id: forecast.id,
      campus: forecast.campus,
      academicTerm: forecast.academicTerm,
      projectedEnrolment:
        forecast.projectedEnrolment ||
        forecast.totalEnrolment ||
        0,
      currentStaffFTE: safeNumber(forecast.currentStaffFTE),
      requiredStaffFTE: safeNumber(forecast.requiredStaffFTE),
      deficitFTE: safeNumber(forecast.deficitFTE),
      deficitHours: safeNumber(forecast.deficitHours),
      riskLevel: forecast.riskLevel || 'unknown',
      trend: forecast.trend || null,
    }));

    const totalRequiredFTE = capacitySummary.reduce(
      (sum, item) => sum + item.requiredStaffFTE,
      0
    );

    const totalCapacityDeficitFTE = capacitySummary.reduce(
      (sum, item) => sum + item.deficitFTE,
      0
    );

    const criticalCapacityForecasts = capacitySummary.filter((item) =>
      ['critical', 'high'].includes(normalize(item.riskLevel))
    ).length;

    // ---------------------------------------------------------
    // Assignment analytics
    // ---------------------------------------------------------

    const assignmentStats = {
      total: assignments.length,
      assigned: assignments.filter(
        (a) =>
          a.assignedWorkerId ||
          normalize(a.status) === 'assigned'
      ).length,
      unassigned: assignments.filter(
        (a) =>
          !a.assignedWorkerId &&
          normalize(a.status) !== 'assigned'
      ).length,
      pending: assignments.filter((a) =>
        ['pending', 'pending_review'].includes(
          normalize(a.status)
        )
      ).length,
      approved: assignments.filter((a) =>
        ['approved', 'completed'].includes(
          normalize(a.status)
        )
      ).length,
    };

    // ---------------------------------------------------------
    // AI / decision indicators
    // ---------------------------------------------------------

    const assignmentsWithMatchScores = assignments.filter(
      (assignment) =>
        assignment.matchScore !== undefined &&
        assignment.matchScore !== null
    );

    const averageMatchScore =
      assignmentsWithMatchScores.length > 0
        ? assignmentsWithMatchScores.reduce(
            (sum, assignment) =>
              sum + safeNumber(assignment.matchScore),
            0
          ) / assignmentsWithMatchScores.length
        : 0;

    // ---------------------------------------------------------
    // Risk summary
    // ---------------------------------------------------------

    const riskSummary = {
      highBurnout: highRiskWorkers,
      mediumBurnout: mediumRiskWorkers,
      expiringCertifications: expiringCerts,
      expiredCertifications: expiredCerts,
      criticalCapacityForecasts,
      criticalSkillGaps: Object.values(skillGaps).filter(
        (skill) => skill.gapStatus === 'Critical Shortage'
      ).length,
    };

    res.json({
      success: true,
      data: {
        // Existing fields preserved
        totalWorkers,
        totalAssignments: assignments.length,
        totalCerts,
        expiringCerts,
        departmentStats,
        skillGaps,

        forecastSummaries: capacitySummary.map((forecast) => ({
          campus: forecast.campus,
          deficitFTE: forecast.deficitFTE,
          deficitHours: forecast.deficitHours,
          riskLevel: forecast.riskLevel,
        })),

        // New analytics
        workforce: {
          totalWorkers,
          totalFTE: Number(totalFTE.toFixed(2)),
          totalWeeklyCapacity: Number(
            totalWeeklyCapacity.toFixed(2)
          ),
          totalWorkloadHours: Number(
            totalWorkloadHours.toFixed(2)
          ),
          availableHours: Number(
            availableHours.toFixed(2)
          ),
          averageUtilization: Number(
            averageUtilization.toFixed(2)
          ),
        },

        certifications: {
          total: totalCerts,
          expiringSoon: expiringCerts,
          expired: expiredCerts,
          valid: Math.max(
            totalCerts - expiringCerts - expiredCerts,
            0
          ),
        },

        capacity: {
          forecasts: capacitySummary,
          totalRequiredFTE: Number(
            totalRequiredFTE.toFixed(2)
          ),
          totalDeficitFTE: Number(
            totalCapacityDeficitFTE.toFixed(2)
          ),
          criticalForecasts: criticalCapacityForecasts,
        },

        assignments: assignmentStats,

        decisionQuality: {
          recommendationsWithScores:
            assignmentsWithMatchScores.length,
          averageMatchScore: Number(
            averageMatchScore.toFixed(2)
          ),
        },

        riskSummary,

        filters: {
          campus: campus || null,
          department: department || null,
          risk: risk || null,
          status: status || null,
        },

        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function exportCSV(req, res, next) {
  try {
    const {
      reportType = 'workers',
      campus,
      department,
      risk,
      status,
    } = req.query;

    let csvContent = '';
    const filename = `k12_report_${reportType}_${Date.now()}.csv`;

    // ---------------------------------------------------------
    // Workers
    // ---------------------------------------------------------

    if (reportType === 'workers') {
      let data = await WorkerProfile.find();

      if (campus) {
        data = data.filter(
          (w) => normalize(w.campus) === normalize(campus)
        );
      }

      if (department) {
        data = data.filter(
          (w) =>
            normalize(w.department) === normalize(department)
        );
      }

      if (risk) {
        data = data.filter(
          (w) =>
            normalize(w.burnoutRisk) === normalize(risk)
        );
      }

      csvContent =
        'ID,StaffID,FullName,Email,RoleTitle,Department,Campus,FTE,WeeklyHoursMax,CurrentWorkloadHours,UtilizationRate,BurnoutRisk\n';

      data.forEach((worker) => {
        csvContent += [
          worker.id,
          worker.staffId,
          worker.fullName,
          worker.email,
          worker.roleTitle,
          worker.department,
          worker.campus,
          worker.fte,
          worker.weeklyHoursMax,
          worker.currentWorkloadHours,
          worker.utilizationRate,
          worker.burnoutRisk,
        ]
          .map(csvEscape)
          .join(',') + '\n';
      });

    // ---------------------------------------------------------
    // Assignments
    // ---------------------------------------------------------

    } else if (reportType === 'assignments') {
      let data = await Assignment.find();

      if (campus) {
        data = data.filter(
          (a) => normalize(a.campus) === normalize(campus)
        );
      }

      if (status) {
        data = data.filter(
          (a) => normalize(a.status) === normalize(status)
        );
      }

      csvContent =
        'ID,Title,Type,Campus,GradeLevel,Subject,WeeklyHours,StudentCount,AssignedWorker,Status,MatchScore\n';

      data.forEach((assignment) => {
        csvContent += [
          assignment.id,
          assignment.title,
          assignment.type,
          assignment.campus,
          assignment.gradeLevel,
          assignment.subject,
          assignment.weeklyHours,
          assignment.studentCount,
          assignment.assignedWorkerName || 'Unassigned',
          assignment.status,
          assignment.matchScore ?? '',
        ]
          .map(csvEscape)
          .join(',') + '\n';
      });

    // ---------------------------------------------------------
    // Capacity
    // ---------------------------------------------------------

    } else if (reportType === 'capacity') {
      let data = await CapacityForecast.find();

      if (campus) {
        data = data.filter(
          (f) => normalize(f.campus) === normalize(campus)
        );
      }

      if (risk) {
        data = data.filter(
          (f) => normalize(f.riskLevel) === normalize(risk)
        );
      }

      csvContent =
        'ID,Campus,AcademicTerm,ProjectedEnrolment,CurrentStaffFTE,RequiredStaffFTE,DeficitFTE,DeficitHours,RiskLevel,Trend\n';

      data.forEach((forecast) => {
        csvContent += [
          forecast.id,
          forecast.campus,
          forecast.academicTerm,
          forecast.projectedEnrolment ||
            forecast.totalEnrolment ||
            '',
          forecast.currentStaffFTE,
          forecast.requiredStaffFTE,
          forecast.deficitFTE,
          forecast.deficitHours,
          forecast.riskLevel,
          forecast.trend || '',
        ]
          .map(csvEscape)
          .join(',') + '\n';
      });

    // ---------------------------------------------------------
    // Audit
    // ---------------------------------------------------------

    } else if (reportType === 'audit') {
      const data = await AuditLog.find();

      csvContent =
        'ID,EventID,Timestamp,ActorName,ActorRole,Action,EntityType,EntityID,Notes\n';

      data.forEach((audit) => {
        csvContent += [
          audit.id,
          audit.eventId,
          audit.timestamp,
          audit.actorName,
          audit.actorRole,
          audit.action,
          audit.entityType,
          audit.entityId,
          audit.notes || '',
        ]
          .map(csvEscape)
          .join(',') + '\n';
      });

    } else {
      return res.status(400).json({
        success: false,
        error: 'InvalidReportType',
        message:
          'Supported report types: workers, assignments, capacity, audit',
      });
    }

    await logAuditEvent({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'DATA_EXPORT_CSV',
      entityType: 'Report',
      entityId: reportType,
      ipAddress: req.ip,
      notes: `Exported ${reportType} dataset in CSV format`,
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    res.send(csvContent);
  } catch (err) {
    next(err);
  }
}