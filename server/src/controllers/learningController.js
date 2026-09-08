import { LearningPath, WorkerProfile } from '../models/store.js';
import { logAuditEvent } from '../middleware/auditMiddleware.js';

export async function getLearningPaths(req, res, next) {
  try {
    const { workerId, status, type } = req.query;
    const filter = {};
    if (workerId) filter.workerId = workerId;
    if (status && status !== 'All') filter.status = status;
    if (type && type !== 'All') filter.type = type;

    const paths = await LearningPath.find(filter);
    res.json({ success: true, total: paths.length, data: paths });
  } catch (err) {
    next(err);
  }
}

export async function enrollWorker(req, res, next) {
  try {
    const { workerId, title, type, provider, durationHours, skillsTargeted, deadline } = req.body;
    const worker = await WorkerProfile.findById(workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const newPath = await LearningPath.create({
      workerId: worker.id || worker._id,
      workerName: worker.fullName,
      title,
      type: type || 'Professional Development',
      provider: provider || 'Oakridge District Academy',
      durationHours: Number(durationHours) || 10,
      progressPercent: 0,
      status: 'enrolled',
      skillsTargeted: skillsTargeted || [],
      assignedBy: req.user.name,
      outcomeRecorded: false,
      deadline: deadline || '2026-12-31'
    });

    await logAuditEvent({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'LEARNING_PATH_ENROLL',
      entityType: 'LearningPath',
      entityId: newPath.id || newPath._id,
      ipAddress: req.ip,
      notes: `Enrolled ${worker.fullName} in ${title}`
    });

    res.json({ success: true, data: newPath });
  } catch (err) {
    next(err);
  }
}

export async function updateProgress(req, res, next) {
  try {
    const pathId = req.params.id;
    const { progressPercent, status, outcomeNotes } = req.body;

    const existing = await LearningPath.findById(pathId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Learning record not found.' });
    }

    const updated = await LearningPath.findByIdAndUpdate(pathId, {
      progressPercent: progressPercent !== undefined ? Number(progressPercent) : existing.progressPercent,
      status: status || existing.status,
      outcomeNotes: outcomeNotes || existing.outcomeNotes,
      outcomeRecorded: (status === 'completed' || Number(progressPercent) === 100) ? true : existing.outcomeRecorded
    });

    // If completed, add or verify skill in worker profile
    if (status === 'completed' && existing.skillsTargeted?.length > 0) {
      const worker = await WorkerProfile.findById(existing.workerId);
      if (worker) {
        const skills = [...(worker.skills || [])];
        existing.skillsTargeted.forEach(targetSkillName => {
          const idx = skills.findIndex(s => s.name.toLowerCase() === targetSkillName.toLowerCase());
          if (idx !== -1) {
            skills[idx].proficiency = Math.min(5, skills[idx].proficiency + 1);
            skills[idx].verified = true;
            skills[idx].evidence = `Completed ${existing.title} (${existing.provider})`;
          } else {
            skills.push({
              id: `sk-${Date.now()}`,
              name: targetSkillName,
              category: 'Pedagogical Excellence',
              proficiency: 3,
              verified: true,
              evidence: `Certified via ${existing.title}`
            });
          }
        });
        await WorkerProfile.findByIdAndUpdate(worker.id || worker._id, { skills });
      }
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
