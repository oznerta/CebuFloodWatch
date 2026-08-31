import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface DepEdSchool {
  name: string;
  address: string;
  barangay_name: string;
  max_capacity: number;
  current_occupancy: number;
  status: 'open' | 'closed' | 'full';
  contact_person: string;
  contact_number: string;
  supply_notes: string;
  latitude: number;
  longitude: number;
  classrooms?: number;
  enrollment?: number;
  school_id?: number;
}

async function seedDepEdShelters() {
  console.log('🏫 Starting DepEd School Evacuation Centers Seeding for Cebu City...');

  const jsonPath = path.resolve(__dirname, '../db/cebu_deped_shelters.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ File not found: ${jsonPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const schools: DepEdSchool[] = JSON.parse(rawData);

  console.log(`📋 Loaded ${schools.length} DepEd schools from ${jsonPath}`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // First ensure we have barangays in DB
    const bgyCheck = await client.query('SELECT count(*) FROM public.barangays;');
    const bgyCount = parseInt(bgyCheck.rows[0].count, 10);
    console.log(`📍 Verified ${bgyCount} Cebu City barangays in database.`);

    let inserted = 0;
    let updated = 0;

    for (const school of schools) {
      // Find the matching barangay by PostGIS spatial proximity or boundary containment
      const bgyRes = await client.query(
        `
        SELECT id, name
        FROM public.barangays
        ORDER BY 
          CASE WHEN boundary_geom IS NOT NULL AND ST_Contains(boundary_geom, ST_SetSRID(ST_Point($1, $2), 4326)) THEN 0 ELSE 1 END,
          COALESCE(boundary_geom <-> ST_SetSRID(ST_Point($1, $2), 4326), 999999) ASC
        LIMIT 1;
        `,
        [school.longitude, school.latitude]
      );

      let barangayId: string | null = null;
      let matchedBgyName = school.barangay_name;

      if (bgyRes.rows.length > 0) {
        barangayId = bgyRes.rows[0].id;
        matchedBgyName = bgyRes.rows[0].name;
      } else {
        // Fallback: search by name
        const bgyNameRes = await client.query(
          `SELECT id, name FROM public.barangays WHERE LOWER(name) LIKE LOWER($1) LIMIT 1`,
          [`%${school.barangay_name}%`]
        );
        if (bgyNameRes.rows.length > 0) {
          barangayId = bgyNameRes.rows[0].id;
          matchedBgyName = bgyNameRes.rows[0].name;
        }
      }

      if (!barangayId) {
        console.warn(`⚠️ Could not resolve barangay for school: ${school.name}. Skipping.`);
        continue;
      }

      // Check if shelter already exists by name
      const existing = await client.query(
        `SELECT id FROM public.evacuation_centers WHERE LOWER(name) = LOWER($1);`,
        [school.name]
      );

      const address = `${matchedBgyName}, Cebu City`;
      const contactPerson = `DepEd Incident Lead - ${school.name.slice(0, 30)}`;
      const contactNumber = '(032) 255-6984';

      if (existing.rows.length > 0) {
        // Update existing
        await client.query(
          `
          UPDATE public.evacuation_centers
          SET 
            barangay_id = $1,
            location_geom = ST_SetSRID(ST_Point($2, $3), 4326),
            address = $4,
            max_capacity = $5,
            status = $6,
            supply_notes = $7,
            contact_person = $8,
            contact_number = $9,
            updated_at = NOW()
          WHERE id = $10;
          `,
          [
            barangayId,
            school.longitude,
            school.latitude,
            address,
            school.max_capacity,
            school.status,
            school.supply_notes,
            contactPerson,
            contactNumber,
            existing.rows[0].id,
          ]
        );
        updated++;
      } else {
        // Insert new
        await client.query(
          `
          INSERT INTO public.evacuation_centers (
            barangay_id,
            name,
            location_geom,
            address,
            max_capacity,
            current_occupancy,
            status,
            supply_notes,
            contact_person,
            contact_number,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, ST_SetSRID(ST_Point($3, $4), 4326), $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
          );
          `,
          [
            barangayId,
            school.name,
            school.longitude,
            school.latitude,
            address,
            school.max_capacity,
            school.current_occupancy,
            school.status,
            school.supply_notes,
            contactPerson,
            contactNumber,
          ]
        );
        inserted++;
      }

      console.log(`  ✓ ${school.name} (Brgy. ${matchedBgyName}) -> Capacity: ${school.max_capacity} evacuees`);
    }

    await client.query('COMMIT');
    console.log(`\n🎉 DepEd Shelter Seeding Complete!`);
    console.log(`   ➕ Inserted: ${inserted}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   🏫 Total designated shelters in Cebu City: ${inserted + updated}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to seed DepEd shelters:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDepEdShelters();
