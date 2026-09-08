import { extractSkillsFromText, forecastWorkforceCapacity, matchAssignmentCandidates } from '../services/geminiService.js';
import { WorkerProfile, SkillTaxonomy } from '../models/store.js';
import { logAuditEvent } from '../middleware/auditMiddleware.js';

export async function extractSkills(req, res, next) {
  try {
    const { text } = req.body;
    if (!text || text.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least 10 characters of educator resume, syllabus, or credential text.'
      });
    }

    const taxonomy = await SkillTaxonomy.find();
    const result = await extractSkillsFromText(text, taxonomy);

    await logAuditEvent({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'AI_SKILL_INFERENCE',
      entityType: 'SkillInference',
      entityId: 'inference-run',
      ipAddress: req.ip,
      notes: `Extracted ${result.skills.length} skills with confidence ${result.confidenceScore}% (Model: ${result.modelVersion})`
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function forecastCapacityEndpoint(req, res, next) {
  try {
    const result = await forecastWorkforceCapacity(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function matchCandidatesEndpoint(req, res, next) {
  try {
    const { assignment } = req.body;
    if (!assignment) {
      return res.status(400).json({ success: false, message: 'Assignment object required.' });
    }
    const workers = await WorkerProfile.find();
    const result = await matchAssignmentCandidates(assignment, workers);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function calculateBurnoutSignals(req, res, next) {
  try {
    const workers = await WorkerProfile.find();
    const burnoutSignals = workers.map(w => {
      const maxHours = w.weeklyHoursMax || 40;
      const currentHours = w.currentWorkloadHours || 30;
      const util = Math.round((currentHours / maxHours) * 100);

      let status = 'Low';
      let score = 25;
      const signals = [];

      if (util >= 105) {
        status = 'Critical';
        score = 95;
        signals.push(`Extreme over-utilization at ${util}% capacity`);
      } else if (util >= 95) {
        status = 'High';
        score = 78;
        signals.push(`Workload approaching ceiling (${currentHours}h / ${maxHours}h max)`);
      } else if (util >= 85) {
        status = 'Moderate';
        score = 55;
        signals.push(`Balanced but elevated grading and prep load`);
      }

      if (w.studentCaseload && w.studentCaseload > 120) {
        signals.push(`Large student caseload: ${w.studentCaseload} students`);
        score = Math.min(100, score + 10);
      }

      const expiringCerts = (w.certifications || []).filter(c => c.status === 'expiring_soon' || c.status === 'expired');
      if (expiringCerts.length > 0) {
        signals.push(`${expiringCerts.length} certification(s) require urgent renewal`);
        score = Math.min(100, score + 8);
      }

      return {
        workerId: w.id || w._id,
        fullName: w.fullName,
        department: w.department,
        campus: w.campus,
        utilizationRate: util,
        burnoutRisk: status,
        burnoutScore: score,
        contributingSignals: signals
      };
    });

    res.json({ success: true, data: burnoutSignals });
  } catch (err) {
    next(err);
  }
}
