import { WorkerProfile, SkillTaxonomy } from '../models/store.js';
import { logAuditEvent } from '../middleware/auditMiddleware.js';

export async function getWorkers(req, res, next) {
  try {
    const { department, campus, burnoutRisk, search } = req.query;
    const filter = {};

    if (department && department !== 'All') filter.department = department;
    if (campus && campus !== 'All') filter.campus = campus;
    if (burnoutRisk && burnoutRisk !== 'All') filter.burnoutRisk = burnoutRisk;

    let workers = await WorkerProfile.find(filter);

    if (search) {
      const q = search.toLowerCase();
      workers = workers.filter(w =>
        w.fullName.toLowerCase().includes(q) ||
        w.roleTitle.toLowerCase().includes(q) ||
        w.department.toLowerCase().includes(q) ||
        w.staffId.toLowerCase().includes(q) ||
        w.skills.some(s => s.name.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      total: workers.length,
      data: workers
    });
  } catch (err) {
    next(err);
  }
}

export async function getWorkerById(req, res, next) {
  try {
    const worker = await WorkerProfile.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    }
    res.json({ success: true, data: worker });
  } catch (err) {
    next(err);
  }
}

export async function updateWorker(req, res, next) {
  try {
    const workerId = req.params.id;
    const existing = await WorkerProfile.findById(workerId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const updated = await WorkerProfile.findByIdAndUpdate(workerId, req.body);

    await logAuditEvent({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'WORKER_PROFILE_UPDATE',
      entityType: 'WorkerProfile',
      entityId: workerId,
      ipAddress: req.ip,
      previousState: { currentWorkloadHours: existing.currentWorkloadHours, skillsCount: existing.skills?.length },
      newState: { currentWorkloadHours: updated.currentWorkloadHours, skillsCount: updated.skills?.length },
      notes: `Updated worker record for ${existing.fullName}`
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function addCertification(req, res, next) {
  try {
    const workerId = req.params.id;
    const worker = await WorkerProfile.findById(workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const { name, issuer, issueDate, expiryDate, code } = req.body;
    const newCert = {
      id: `crt-${Date.now()}`,
      name,
      issuer,
      issueDate,
      expiryDate,
      status: new Date(expiryDate) < new Date() ? 'expired' : 'valid',
      code: code || `CRT-${Math.floor(1000 + Math.random() * 9000)}`
    };

    const certs = [...(worker.certifications || []), newCert];
    const updated = await WorkerProfile.findByIdAndUpdate(workerId, { certifications: certs });

    await logAuditEvent({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'CERTIFICATION_ADDED',
      entityType: 'WorkerProfile',
      entityId: workerId,
      ipAddress: req.ip,
      notes: `Added certification ${name} to worker ${worker.fullName}`
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function getSkillTaxonomy(req, res, next) {
  try {
    const skills = await SkillTaxonomy.find();
    res.json({ success: true, data: skills });
  } catch (err) {
    next(err);
  }
}
