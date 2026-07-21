import { getAllFishSpecies } from '../models/fishSpeciesModel.js';

export async function getFishSpecies(req, res) {
  try {
    const species = await getAllFishSpecies();
    res.json(species);
  } catch (error) {
    console.error('getFishSpecies error:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
}
