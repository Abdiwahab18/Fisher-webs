import express from 'express';
import { getFishSpecies } from '../controllers/fishSpeciesController.js';

const router = express.Router();

router.get('/', getFishSpecies);

export default router;
