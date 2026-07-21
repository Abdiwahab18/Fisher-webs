import pool from '../config/db.js';

export async function findActiveCatchBySpeciesAndUser(userId, fishSpeciesId) {
  const result = await pool.query(
    `SELECT fc.*, fs.name AS fish_name FROM fish_catches fc
     JOIN fish_species fs ON fc.fish_species_id = fs.id
     WHERE fc.user_id = $1 
       AND fc.fish_species_id = $2 
       AND fc.status = 'listed'
     ORDER BY fc.created_at DESC 
     LIMIT 1`,
    [userId, fishSpeciesId]
  );
  return result.rows[0];
}

export async function incrementCatchWeight(id, additionalWeight, { price, location, image, catch_date }) {
  const result = await pool.query(
    `UPDATE fish_catches
     SET weight = weight + $1,
         price = COALESCE($2, price),
         location = COALESCE($3, location),
         image = COALESCE($4, image),
         catch_date = COALESCE($5, catch_date),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $6
     RETURNING *`,
    [additionalWeight, price, location, image, catch_date, id]
  );
  return result.rows[0];
}

export async function createFishCatch({ fish_species_id, weight, price, location, image, catch_date, user_id }) {
  const result = await pool.query(
    'INSERT INTO fish_catches (fish_species_id, weight, price, location, image, catch_date, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [fish_species_id, weight, price, location, image, catch_date, user_id]
  );
  return result.rows[0];
}

export async function getFishCatchesByUser(user_id) {
  const result = await pool.query(
    `SELECT
      fc.*,
      fs.name AS fish_name,
      u.id AS fisherman_id,
      u.name AS fisherman_name,
      u.email AS fisherman_email,
      u.profile_picture AS fisherman_profile_picture
    FROM fish_catches fc
    JOIN fish_species fs ON fc.fish_species_id = fs.id
    LEFT JOIN users u ON fc.user_id = u.id
    WHERE fc.user_id = $1
    ORDER BY fc.created_at DESC`,
    [user_id]
  );
  return result.rows;
}

export async function getAllFishCatches() {
  const result = await pool.query(
    `SELECT
      fc.*,
      fs.name AS fish_name,
      u.id AS fisherman_id,
      u.name AS fisherman_name,
      u.email AS fisherman_email,
      u.profile_picture AS fisherman_profile_picture
    FROM fish_catches fc
    JOIN fish_species fs ON fc.fish_species_id = fs.id
    LEFT JOIN users u ON fc.user_id = u.id
    ORDER BY fc.created_at DESC`
  );
  return result.rows;
}

export async function getFishCatchById(id) {
  const result = await pool.query(
    `SELECT fc.*, fs.name AS fish_name 
     FROM fish_catches fc
     JOIN fish_species fs ON fc.fish_species_id = fs.id
     WHERE fc.id = $1`,
    [id]
  );
  return result.rows[0];
}

export async function updateFishCatch(id, { fish_species_id, weight, price, location, image, catch_date, status }) {
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (fish_species_id !== undefined) {
    updates.push(`fish_species_id = $${paramCount++}`);
    values.push(fish_species_id);
  }
  if (weight !== undefined) {
    updates.push(`weight = $${paramCount++}`);
    values.push(weight);
  }
  if (price !== undefined) {
    updates.push(`price = $${paramCount++}`);
    values.push(price);
  }
  if (location !== undefined) {
    updates.push(`location = $${paramCount++}`);
    values.push(location);
  }
  if (image !== undefined) {
    updates.push(`image = $${paramCount++}`);
    values.push(image);
  }
  if (catch_date !== undefined) {
    updates.push(`catch_date = $${paramCount++}`);
    values.push(catch_date);
  }
  if (status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    values.push(status);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const query = `UPDATE fish_catches SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  const result = await pool.query(query, values);
  return result.rows[0];
}

export async function reduceFishCatchWeight(id, weight) {
  const result = await pool.query(
    `UPDATE fish_catches
       SET weight = GREATEST(weight - $1, 0),
           status = CASE WHEN weight - $1 <= 0 THEN 'sold' ELSE status END,
           updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [weight, id]
  );
  return result.rows[0];
}

export async function restoreFishCatchWeight(id, weight) {
  const result = await pool.query(
    `UPDATE fish_catches
       SET weight = weight + $1,
           status = CASE WHEN weight + $1 > 0 AND status = 'sold' THEN 'listed' ELSE status END,
           updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [weight, id]
  );
  return result.rows[0];
}

export async function deleteFishCatch(id) {
  const result = await pool.query('DELETE FROM fish_catches WHERE id = $1 RETURNING *', [id]);
  return result.rows[0];
}
