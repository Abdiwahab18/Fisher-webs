import pool from '../config/db.js';

export async function getAllFishSpecies() {
  const result = await pool.query('SELECT * FROM fish_species ORDER BY name ASC');
  return result.rows;
}

export async function getFishSpeciesById(id) {
  const result = await pool.query('SELECT * FROM fish_species WHERE id = $1', [id]);
  return result.rows[0];
}

export async function createFishSpecies({ name, description }) {
  const result = await pool.query(
    'INSERT INTO fish_species (name, description) VALUES ($1, $2) RETURNING *',
    [name, description]
  );
  return result.rows[0];
}
