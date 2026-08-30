import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importBarangaysToDatabase() {
  console.log('🗺️ Importing authentic 80 Cebu City Barangays into Supabase PostGIS...');
  const geojsonPath = path.resolve(__dirname, '../../../web/public/data/cebu_city_barangays.geojson');
  
  if (!fs.existsSync(geojsonPath)) {
    console.error('GeoJSON file missing:', geojsonPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(geojsonPath, 'utf8');
  const data = JSON.parse(raw);
  const features = data.features || [];

  console.log(`Found ${features.length} barangay spatial polygons to import.`);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let inserted = 0;
    for (const feat of features) {
      const props = feat.properties || {};
      const geom = feat.geometry;
      const name = props.adm4_name || props.adm4_en || props.name;
      const psgcCode = props.adm4_pcode || `PH0702217_${name.replace(/\s+/g, '')}`;
      const lat = props.center_lat || 10.3157;
      const lon = props.center_lon || 123.8854;

      const geomJson = JSON.stringify(geom);

      await client.query(
        `INSERT INTO public.barangays (name, psgc_code, boundary_geom, center_geom, risk_level)
         VALUES (
           $1,
           $2,
           ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON($3), 4326)),
           ST_SetSRID(ST_Point($4, $5), 4326),
           'medium'
         )
         ON CONFLICT (name) DO UPDATE SET
           psgc_code = EXCLUDED.psgc_code,
           boundary_geom = EXCLUDED.boundary_geom,
           center_geom = EXCLUDED.center_geom;`,
        [name, psgcCode, geomJson, lon, lat]
      );
      inserted++;
    }

    await client.query('COMMIT');
    console.log(`🎉 Successfully imported all ${inserted} authentic Cebu City Barangays into PostGIS!`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to import barangays:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

importBarangaysToDatabase();
