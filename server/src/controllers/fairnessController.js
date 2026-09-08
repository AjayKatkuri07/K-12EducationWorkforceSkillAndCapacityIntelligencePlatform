import { FairnessReview } from '../models/store.js';
import { logAuditEvent } from '../middleware/auditMiddleware.js';

export async function getFairnessReviews(req, res, next) {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status && status !== 'All') filter.reviewerDecision = status;
    if (type && type !== 'All') filter.recommendationType = type;

    const reviews = await FairnessReview.find(filter);
    res.json({ success: true, total: reviews.length, data: reviews });
  } catch (err) {
    next(err);
  }
}

export async function submitFairnessDecision(req, res, next) {
  try {
    const { decision, reason } = req.body;
    const allowed = ['approved', 'rejected', 'overridden'];
    if (!allowed.includes(decision)) {
      return res.status(400).json({ success: false, message: `Decision must be one of: ${allowed.join(', ')}` });
    }

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'A mandatory justification reason (min 5 characters) must be supplied for human-in-the-loop review compliance.'
      });
    }

    const reviewId = req.params.id;
    const review = await FairnessReview.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Fairness review entry not found.' });
    }

    const updated = await FairnessReview.findByIdAndUpdate(reviewId, {
      reviewerDecision: decision,
      reviewerId: req.user.id,
      reviewerName: req.user.name,
      reviewerReason: reason,
      reviewedAt: new Date().toISOString()
    });

    await logAuditEvent({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'FAIRNESS_DECISION_RECORDED',
      entityType: 'FairnessReview',
      entityId: reviewId,
      ipAddress: req.ip,
      previousState: { reviewerDecision: review.reviewerDecision },
      newState: { reviewerDecision: decision, reviewerReason: reason },
      notes: `Human Reviewer (${req.user.name}) recorded ${decision} on recommendation ${review.proposedAction}`
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}
