import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/store.js';
import { logAuditEvent } from '../middleware/auditMiddleware.js';

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email('Valid institutional email is required.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['Employee', 'TeamLead', 'WorkforcePlanner', 'HRAdmin']),
  roleTitle: z.string().optional(),
  campus: z.string().optional(),
  department: z.string().optional()
});

export async function getUsers(req, res, next) {
  try {
    const { role, campus, search } = req.query;
    const filter = {};
    if (role && role !== 'All') filter.role = role;
    if (campus && campus !== 'All') filter.campus = campus;

    let users = await User.find(filter);

    if (search) {
      const q = search.toLowerCase();
      users = users.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q) ||
        u.roleTitle?.toLowerCase().includes(q)
      );
    }

    // Omit password hashes
    const sanitized = users.map(u => ({
      id: u.id || u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      roleTitle: u.roleTitle,
      campus: u.campus,
      department: u.department,
      active: u.active,
      avatar: u.avatar,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt
    }));

    res.json({ success: true, total: sanitized.length, data: sanitized });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const data = createUserSchema.parse(req.body);

    const existing = await User.findOne({ email: data.email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A user with this institutional email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(data.password, salt);

    const newUser = await User.create({
      name: data.name,
      email: data.email.toLowerCase().trim(),
      passwordHash,
      role: data.role,
      roleTitle: data.roleTitle || 'Educational Staff',
      campus: data.campus || 'Oakridge High Campus',
      department: data.department || 'General Faculty',
      active: true,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999999)}?auto=format&fit=crop&q=80&w=200`,
      lastLogin: null
    });

    await logAuditEvent({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: newUser.id || newUser._id,
      ipAddress: req.ip,
      notes: `Created user ${newUser.name} with role ${newUser.role}`
    });

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id || newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        active: newUser.active
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatus(req, res, next) {
  try {
    const { active } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updated = await User.findByIdAndUpdate(userId, { active: Boolean(active) });

    await logAuditEvent({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: userId,
      ipAddress: req.ip,
      notes: `${active ? 'Activated' : 'Deactivated'} account for ${user.name}`
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    const allowed = ['Employee', 'TeamLead', 'WorkforcePlanner', 'HRAdmin'];
    if (!allowed.includes(role)) {
      return res.status(400).json({ success: false, message: `Role must be one of: ${allowed.join(', ')}` });
    }

    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updated = await User.findByIdAndUpdate(userId, { role });

    await logAuditEvent({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'USER_ROLE_CHANGED',
      entityType: 'User',
      entityId: userId,
      ipAddress: req.ip,
      previousState: { role: user.role },
      newState: { role },
      notes: `Updated role for ${user.name} from ${user.role} to ${role}`
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
