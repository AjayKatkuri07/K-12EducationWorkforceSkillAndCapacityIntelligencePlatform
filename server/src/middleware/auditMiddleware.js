import { v4 as uuidv4 } from 'uuid';
import { AuditLog } from '../models/store.js';

export async function logAuditEvent({
  actorId,
  actorName,
  actorRole,
  action,
  entityType,
  entityId,
  ipAddress,
  previousState = null,
  newState = null,
  notes = ''
}) {
  try {
    const log = await AuditLog.create({
      eventId: `EVT-${Math.floor(1000 + Math.random() * 9000)}`,
      actorId: actorId || 'system',
      actorName: actorName || 'Automated Engine',
      actorRole: actorRole || 'System',
      action,
      entityType,
      entityId: entityId || 'N/A',
      timestamp: new Date().toISOString(),
      ipAddress: ipAddress || '127.0.0.1',
      previousState,
      newState,
      notes
    });
    return log;
  } catch (err) {
    console.error('[AuditMiddleware] Failed to append audit log:', err.message);
  }
}
