import { WorkerProfile, Assignment, CapacityForecast, SkillTaxonomy, AuditLog } from '../models/store.js';
import { logAuditEvent } from '../middleware/auditMiddleware.js';

export async function getInventoryReport(req, res, next) {
  try {
    const workers = await WorkerProfile.find();
    const assignments = await Assignment.find();
    const skills = await SkillTaxonomy.find();
    const forecasts = await CapacityForecast.find();

    // Aggregations
    const departmentStats = {};
    const skillGaps = {};
    let totalCerts = 0;
    let expiringCerts = 0;

    workers.forEach(w => {
      departmentStats[w.department] = (departmentStats[w.department] || 0) + 1;

      (w.certifications || []).forEach(c => {
        totalCerts++;
        if (c.status === 'expiring_soon' || c.status === 'expired') expiringCerts++;
      });
    });

    skills.forEach(s => {
      const qualified = workers.filter(w => (w.skills || []).some(ws => ws.name.toLowerCase() === s.name.toLowerCase() && ws.proficiency >= (s.requiredProficiencyThreshold || 3))).length;
      skillGaps[s.name] = {
        category: s.category,
        demand: s.demandLevel,
        qualifiedStaffCount: qualified,
        gapStatus: qualified <= 1 ? 'Critical Shortage' : qualified <= 2 ? 'Tight Capacity' : 'Adequate'
      };
    });

    res.json({
      success: true,
      data: {
        totalWorkers: workers.length,
        totalAssignments: assignments.length,
        totalCerts,
        expiringCerts,
        departmentStats,
        skillGaps,
        forecastSummaries: forecasts.map(f => ({
          campus: f.campus,
          deficitFTE: f.deficitFTE,
          deficitHours: f.deficitHours,
          riskLevel: f.riskLevel
        }))
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function exportCSV(req, res, next) {
  try {
    const { reportType } = req.query; // 'workers' | 'assignments' | 'capacity' | 'audit'

    let csvContent = '';
    let filename = `k12_report_${reportType || 'data'}_${Date.now()}.csv`;

    if (reportType === 'assignments') {
      const data = await Assignment.find();
      csvContent = 'ID,Title,Type,Campus,GradeLevel,Subject,WeeklyHours,StudentCount,AssignedWorker,Status,MatchScore\n';
      data.forEach(a => {
        csvContent += `"${a.id}","${a.title}","${a.type}","${a.campus}","${a.gradeLevel}","${a.subject}",${a.weeklyHours},${a.studentCount},"${a.assignedWorkerName || 'Unassigned'}","${a.status}",${a.matchScore || ''}\n`;
      });
    } else if (reportType === 'capacity') {
      const data = await CapacityForecast.find();
      csvContent = 'ID,Campus,AcademicTerm,ProjectedEnrolment,CurrentStaffFTE,RequiredStaffFTE,DeficitFTE,DeficitHours,RiskLevel\n';
      data.forEach(f => {
        csvContent += `"${f.id}","${f.campus}","${f.academicTerm}",${f.projectedEnrolment || f.totalEnrolment},${f.currentStaffFTE},${f.requiredStaffFTE},${f.deficitFTE},${f.deficitHours},"${f.riskLevel}"\n`;
      });
    } else if (reportType === 'audit') {
      const data = await AuditLog.find();
      csvContent = 'ID,EventID,Timestamp,ActorName,ActorRole,Action,EntityType,EntityID,Notes\n';
      data.forEach(a => {
        csvContent += `"${a.id}","${a.eventId}","${a.timestamp}","${a.actorName}","${a.actorRole}","${a.action}","${a.entityType}","${a.entityId}","${(a.notes || '').replace(/"/g, '""')}"\n`;
      });
    } else {
      // Default: workers
      const data = await WorkerProfile.find();
      csvContent = 'ID,StaffID,FullName,Email,RoleTitle,Department,Campus,FTE,WeeklyHoursMax,CurrentWorkloadHours,UtilizationRate,BurnoutRisk\n';
      data.forEach(w => {
        csvContent += `"${w.id}","${w.staffId}","${w.fullName}","${w.email}","${w.roleTitle}","${w.department}","${w.campus}",${w.fte},${w.weeklyHoursMax},${w.currentWorkloadHours},${w.utilizationRate},"${w.burnoutRisk}"\n`;
      });
    }

    await logAuditEvent({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'DATA_EXPORT_CSV',
      entityType: 'Report',
      entityId: reportType || 'workers',
      ipAddress: req.ip,
      notes: `Exported ${reportType || 'workers'} dataset in CSV format`
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
}
