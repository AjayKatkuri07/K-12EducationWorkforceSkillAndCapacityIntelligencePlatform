import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { User } from '../models/store.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'AuthenticationRequired',
        message: 'No authorization token provided. Please sign in.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'InvalidToken',
        message: 'Session token has expired or is invalid. Please sign in again.'
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.active) {
      return res.status(403).json({
        success: false,
        error: 'UserInactive',
        message: 'Account not found or deactivated.'
      });
    }

    // Attach user and role to request
    req.user = {
      id: user.id || user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      campus: user.campus,
      department: user.department
    };

    next();
  } catch (err) {
    next(err);
  }
}
