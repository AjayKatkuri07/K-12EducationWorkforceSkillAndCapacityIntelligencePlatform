import { AuditLog, SystemConfig } from '../models/store.js';
import { logAuditEvent } from '../middleware/auditMiddleware.js';

export async function getAuditLogs(req, res, next) {
  try {
    const { action, actorRole, entityType, search } = req.query;
    const filter = {};
    if (action && action !== 'All') filter.action = action;
    if (actorRole && actorRole !== 'All') filter.actorRole = actorRole;
    if (entityType && entityType !== 'All') filter.entityType = entityType;

    let logs = await AuditLog.find(filter);

    if (search) {
      const q = search.toLowerCase();
      logs = logs.filter(l =>
        l.actorName.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.entityType.toLowerCase().includes(q) ||
        (l.notes && l.notes.toLowerCase().includes(q))
      );
    }

    // Newest first
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      total: logs.length,
      data: logs
    });
  } catch (err) {
    next(err);
  }
}

export async function getSystemConfig(req, res, next) {
  try {
    let config = await SystemConfig.findOne();
    if (!config) {
      config = await SystemConfig.create({
        schoolGroupName: 'Oakridge Public Schools Academic Network',
        academicYear: '2026-2027',
        aiModel: 'gemini-1.5-flash',
        aiConfidenceThreshold: 75,
        fairnessStrictnessLevel: 'High',
        autoNotifyManagers: true,
        enableAuditEnforcement: true,
        campuses: [
          { id: 'cmp-high', name: 'Oakridge High Campus', location: '450 North Ridge Ave', grades: '9-12' },
          { id: 'cmp-mid', name: 'Oakridge Middle Campus', location: '120 Valley Way', grades: '6-8' },
          { id: 'cmp-elem', name: 'Lincoln Elementary Campus', location: '88 Meadowbrook Dr', grades: 'K-5' }
        ]
      });
    }
    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
}

export async function updateSystemConfig(req, res, next) {
  try {
    const config = await SystemConfig.findOne();
    const configId = config?.id || config?._id || 'cfg-default';

    const updated = await SystemConfig.findByIdAndUpdate(configId, req.body);

    await logAuditEvent({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'SYSTEM_SETTINGS_UPDATE',
      entityType: 'SystemConfig',
      entityId: configId,
      ipAddress: req.ip,
      previousState: config,
      newState: updated,
      notes: `Updated system configuration settings.`
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
