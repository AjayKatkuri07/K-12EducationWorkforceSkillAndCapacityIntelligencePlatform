import { Router } from 'express';
import { runSeed } from '../services/seedData.js';

const router = Router();

router.post('/reset', async (req, res, next) => {
  try {
    const data = await runSeed();
    res.json({ success: true, message: 'Database reset to initial sample state successfully.', count: { users: data.users.length, workers: data.workers.length } });
  } catch (err) {
    next(err);
  }
});

export default router;
