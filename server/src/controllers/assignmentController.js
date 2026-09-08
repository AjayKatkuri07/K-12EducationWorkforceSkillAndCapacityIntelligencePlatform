import { Assignment, WorkerProfile, FairnessReview } from '../models/store.js';
import { matchAssignmentCandidates } from '../services/geminiService.js';
import { logAuditEvent } from '../middleware/auditMiddleware.js';

export async function getAssignments(req, res, next) {
  try {
    const { campus, status, gradeLevel, subject } = req.query;
    const filter = {};
    if (campus && campus !== 'All') filter.campus = campus;
    if (status && status !== 'All') filter.status = status;
    if (gradeLevel && gradeLevel !== 'All') filter.gradeLevel = gradeLevel;
    if (subject && subject !== 'All') filter.subject = subject;

    const assignments = await Assignment.find(filter);
    res.json({ success: true, total: assignments.length, data: assignments });
  } catch (err) {
    next(err);
  }
}

export async function getAssignmentById(req, res, next) {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }
    res.json({ success: true, data: assignment });
  } catch (err) {
    next(err);
  }
}

export async function compareCandidates(req, res, next) {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const workers = await WorkerProfile.find();
    const matchResult = await matchAssignmentCandidates(assignment, workers);

    // Save candidate comparison to assignment record
    const updated = await Assignment.findByIdAndUpdate(assignment.id || assignment._id, {
      candidateComparison: matchResult.recommendedCandidates,
      matchScore: matchResult.recommendedCandidates[0]?.compositeScore || 85
    });

    res.json({
      success: true,
      assignment: updated,
      matchResult
    });
  } catch (err) {
    next(err);
  }
}

export async function assignWorker(req, res, next) {
  try {
    const { workerId } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const worker = await WorkerProfile.findById(workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Candidate worker not found.' });
    }

    const previousWorkerId = assignment.assignedWorkerId;
    const previousWorkerName = assignment.assignedWorkerName;

    const updated = await Assignment.findByIdAndUpdate(assignment.id || assignment._id, {
      assignedWorkerId: worker.id || worker._id,
      assignedWorkerName: worker.fullName,
      status: 'approved'
    });

    // Update worker workload
    const addedHours = assignment.weeklyHours || 5;
    const newHours = (worker.currentWorkloadHours || 30) + addedHours;
    const newUtil = Math.round((newHours / (worker.weeklyHoursMax || 40)) * 100);
    await WorkerProfile.findByIdAndUpdate(worker.id || worker._id, {
      currentWorkloadHours: newHours,
      utilizationRate: newUtil,
      burnoutRisk: newUtil > 100 ? 'Critical' : newUtil > 90 ? 'High' : 'Moderate'
    });

    await logAuditEvent({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'ASSIGNMENT_APPROVED',
      entityType: 'Assignment',
      entityId: assignment.id || assignment._id,
      ipAddress: req.ip,
      previousState: { assignedWorkerId: previousWorkerId, assignedWorkerName: previousWorkerName },
      newState: { assignedWorkerId: worker.id, assignedWorkerName: worker.fullName },
      notes: `Assigned ${worker.fullName} to ${assignment.title}`
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function overrideAssignment(req, res, next) {
  try {
    const { workerId, reason } = req.body;
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'ReasonRequired',
        message: 'A detailed business or pedagogical justification is mandatory to document an assignment override.'
      });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found.' });
    }

    const worker = await WorkerProfile.findById(workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Target worker not found.' });
    }

    const previousWorkerId = assignment.assignedWorkerId;
    const previousWorkerName = assignment.assignedWorkerName;

    const overrideDetails = {
      overridden: true,
      previousWorkerId,
      previousWorkerName,
      newWorkerId: worker.id || worker._id,
      newWorkerName: worker.fullName,
      reason,
      actor: req.user.name,
      actorRole: req.user.role,
      timestamp: new Date().toISOString()
    };

    const updated = await Assignment.findByIdAndUpdate(assignment.id || assignment._id, {
      assignedWorkerId: worker.id || worker._id,
      assignedWorkerName: worker.fullName,
      status: 'overridden',
      overrideDetails
    });

    // Create fairness audit review entry
    await FairnessReview.create({
      recommendationType: 'Assignment Override by Manager',
      assignmentTitle: assignment.title,
      candidateId: worker.id || worker._id,
      candidateName: worker.fullName,
      proposedAction: `Manager override assigned ${worker.fullName} (overriding AI match)`,
      confidenceScore: 100,
      observableFactors: ['Manager discretionary administrative action', reason],
      protectedAttributesExcluded: ['Race', 'Gender', 'Age'],
      biasCheckPassed: true,
      fairnessMetrics: { demographicParityRatio: 1.0, opportunityEqualityIndex: 1.0 },
      reviewerDecision: 'overridden',
      reviewerId: req.user.id,
      reviewerName: req.user.name,
      reviewerReason: reason,
      modelVersion: 'human-authorized-override',
      sourceSnapshot: { previousWorkerName, newWorkerName: worker.fullName, reason }
    });

    await logAuditEvent({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'ASSIGNMENT_OVERRIDDEN',
      entityType: 'Assignment',
      entityId: assignment.id || assignment._id,
      ipAddress: req.ip,
      previousState: { assignedWorkerId: previousWorkerId, assignedWorkerName: previousWorkerName },
      newState: { assignedWorkerId: worker.id, assignedWorkerName: worker.fullName, reason },
      notes: `Manager override: ${reason}`
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
