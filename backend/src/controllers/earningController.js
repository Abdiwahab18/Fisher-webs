import {
  getFishermanEarnings,
  getDailyEarnings,
  getMonthlyEarnings
} from '../models/earningModel.js';

export async function getSummary(req, res) {
  try {
    if (req.user.role !== 'fisherman' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const fishermanId = req.query.fisherman_id || req.user.id;
    
    if (req.user.role === 'fisherman' && parseInt(fishermanId) !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const earnings = await getFishermanEarnings(fishermanId);
    res.json(earnings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getDaily(req, res) {
  try {
    if (req.user.role !== 'fisherman' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const fishermanId = req.query.fisherman_id || req.user.id;
    const days = parseInt(req.query.days) || 30;

    if (req.user.role === 'fisherman' && parseInt(fishermanId) !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const earnings = await getDailyEarnings(fishermanId, days);
    res.json(earnings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function getMonthly(req, res) {
  try {
    if (req.user.role !== 'fisherman' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const fishermanId = req.query.fisherman_id || req.user.id;
    const months = parseInt(req.query.months) || 12;

    if (req.user.role === 'fisherman' && parseInt(fishermanId) !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const earnings = await getMonthlyEarnings(fishermanId, months);
    res.json(earnings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}
