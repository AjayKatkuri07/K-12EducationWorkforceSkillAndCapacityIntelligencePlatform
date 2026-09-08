import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { ENV } from '../config/env.js';
import { User, WorkerProfile } from '../models/store.js';
import { logAuditEvent } from '../middleware/auditMiddleware.js';

const loginSchema = z.object({
  email: z.string().email('Valid institutional email is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.')
});

export async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'InvalidCredentials',
        message: 'Invalid email or password.'
      });
    }

    if (!user.active) {
      return res.status(403).json({
        success: false,
        error: 'AccountDeactivated',
        message: 'Your account has been deactivated. Please contact HR Administration.'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'InvalidCredentials',
        message: 'Invalid email or password.'
      });
    }

    // Update last login
    await User.findByIdAndUpdate(user.id || user._id, { lastLogin: new Date().toISOString() });

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id || user._id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN }
    );

    // Audit log
    await logAuditEvent({
      actorId: user.id || user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'AUTH_LOGIN',
      entityType: 'User',
      entityId: user.id || user._id,
      ipAddress: req.ip,
      notes: `User signed in successfully with role ${user.role}`
    });

    // Associated worker profile if available
    const worker = await WorkerProfile.findOne({ email: user.email });

    res.json({
      success: true,
      token,
      user: {
        id: user.id || user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleTitle: user.roleTitle,
        campus: user.campus,
        department: user.department,
        avatar: user.avatar,
        workerId: worker ? worker.id : null
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User record not found.' });
    }
    const worker = await WorkerProfile.findOne({ email: user.email });
    res.json({
      success: true,
      user: {
        id: user.id || user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleTitle: user.roleTitle,
        campus: user.campus,
        department: user.department,
        avatar: user.avatar,
        workerId: worker ? worker.id : null
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function switchRoleDemo(req, res, next) {
  try {
    const { targetRole } = req.body;
    const allowed = ['Employee', 'TeamLead', 'WorkforcePlanner', 'HRAdmin'];
    if (!allowed.includes(targetRole)) {
      return res.status(400).json({ success: false, message: `Target role must be one of: ${allowed.join(', ')}` });
    }

    const user = await User.findOne({ role: targetRole, active: true });
    if (!user) {
      return res.status(404).json({ success: false, message: `No active demo user found for role ${targetRole}` });
    }

    const token = jwt.sign(
      {
        userId: user.id || user._id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      ENV.JWT_SECRET,
      { expiresIn: ENV.JWT_EXPIRES_IN }
    );

    const worker = await WorkerProfile.findOne({ email: user.email });

    await logAuditEvent({
      actorId: user.id || user._id,
      actorName: user.name,
      actorRole: user.role,
      action: 'ROLE_SWITCH_DEMO',
      entityType: 'User',
      entityId: user.id || user._id,
      ipAddress: req.ip,
      notes: `Role switched to ${targetRole} for testing/evaluation.`
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id || user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleTitle: user.roleTitle,
        campus: user.campus,
        department: user.department,
        avatar: user.avatar,
        workerId: worker ? worker.id : null
      }
    });
  } catch (err) {
    next(err);
  }
}
