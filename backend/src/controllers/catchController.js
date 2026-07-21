import jwt from 'jsonwebtoken';
import {
  createFishCatch,
  getFishCatchesByUser,
  getAllFishCatches,
  getFishCatchById,
  updateFishCatch,
  deleteFishCatch,
  findActiveCatchBySpeciesAndUser,
  incrementCatchWeight
} from '../models/catchModel.js';
import { getFishSpeciesById } from '../models/fishSpeciesModel.js';

export async function getAllCatches(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    let user = null;
    if (token) {
      try {
        user = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        // Treat as guest
      }
    }

    if (user && user.role === 'fisherman') {
      const catches = await getFishCatchesByUser(user.id);
      return res.json(catches);
    }

    const catches = await getAllFishCatches();
    res.json(catches);
  } catch (error) {
    console.error('GET /api/catches error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
}

export async function getMyCatches(req, res) {
  try {
    const catches = await getFishCatchesByUser(req.user.id);
    res.json(catches);
  } catch (error) {
    console.error('GET /api/catches/my-catches error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
}

export async function getCatchById(req, res) {
  try {
    const catch_ = await getFishCatchById(req.params.id);
    if (!catch_) {
      return res.status(404).json({ message: 'Fish catch not found' });
    }
    res.json(catch_);
  } catch (error) {
    console.error('GET /api/catches/:id error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
}

export async function createCatch(req, res) {
  try {
    const { fish_species_id, weight, price, location, image, catch_date } = req.body;

    if (!fish_species_id) {
      return res.status(400).json({ message: 'Please select a fish species.' });
    }

    if (!weight || !price) {
      return res.status(400).json({ message: 'Weight and price are required' });
    }

    const species = await getFishSpeciesById(fish_species_id);
    if (!species) {
      return res.status(400).json({ message: 'Invalid fish species selected.' });
    }

    if (!image) {
      return res.status(400).json({ message: 'Catch image is required' });
    }

    if (typeof image !== 'string' || !image.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Only image files are allowed to be uploaded' });
    }

    if (!catch_date) {
      return res.status(400).json({ message: 'Catch date is required' });
    }

    const inputDate = new Date(catch_date);
    if (isNaN(inputDate.getTime())) {
      return res.status(400).json({ message: 'Invalid catch date' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDate = new Date();
    minDate.setDate(today.getDate() - 20);
    minDate.setHours(0, 0, 0, 0);

    const maxDate = new Date();
    maxDate.setHours(23, 59, 59, 999);

    if (inputDate < minDate) {
      return res.status(400).json({ message: 'Catch date cannot be older than 20 days ago' });
    }

    if (inputDate > maxDate) {
      return res.status(400).json({ message: 'Catch date cannot be in the future' });
    }

    const existingCatch = await findActiveCatchBySpeciesAndUser(req.user.id, fish_species_id);

    let savedCatch;
    if (existingCatch) {
      savedCatch = await incrementCatchWeight(existingCatch.id, parseFloat(weight), {
        price: price ? parseFloat(price) : null,
        location: location || null,
        image: image || null,
        catch_date: catch_date || null
      });
    } else {
      savedCatch = await createFishCatch({
        fish_species_id,
        weight: parseFloat(weight),
        price: parseFloat(price),
        location,
        image,
        catch_date,
        user_id: req.user.id
      });
    }

    const savedCatchDetail = await getFishCatchById(savedCatch.id);

    const io = req.app.get('io');
    if (io) {
      io.emit('catch-added', savedCatchDetail);
    }

    res.status(201).json(savedCatchDetail);
  } catch (error) {
    console.error('POST /api/catches error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
}

export async function updateCatch(req, res) {
  try {
    const { id } = req.params;
    const catch_ = await getFishCatchById(id);

    if (!catch_) {
      return res.status(404).json({ message: 'Fish catch not found' });
    }

    if (catch_.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { fish_species_id } = req.body;
    if (fish_species_id) {
      const species = await getFishSpeciesById(fish_species_id);
      if (!species) {
        return res.status(400).json({ message: 'Invalid fish species selected.' });
      }
    }

    const updatedCatch = await updateFishCatch(id, req.body);
    const updatedCatchDetail = await getFishCatchById(id);
    res.json(updatedCatchDetail);
  } catch (error) {
    console.error('PUT /api/catches/:id error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
}

export async function deleteCatch(req, res) {
  try {
    const { id } = req.params;
    const catch_ = await getFishCatchById(id);

    if (!catch_) {
      return res.status(404).json({ message: 'Fish catch not found' });
    }

    if (catch_.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await deleteFishCatch(id);
    res.json({ message: 'Fish catch deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/catches/:id error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
}
