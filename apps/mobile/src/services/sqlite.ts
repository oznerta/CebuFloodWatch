import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getLocalDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('cebufloodwatch_offline.db');
  await initOfflineTables(dbInstance);
  return dbInstance;
}

async function initOfflineTables(db: SQLite.SQLiteDatabase) {
  // 1. Offline Shelters Table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_shelters (
      id TEXT PRIMARY KEY,
      barangay_id TEXT,
      barangay_name TEXT,
      name TEXT,
      address TEXT,
      max_capacity INTEGER,
      current_occupancy INTEGER,
      status TEXT,
      contact_number TEXT,
      latitude REAL,
      longitude REAL,
      cached_at TEXT
    );
  `);

  // 2. Offline Safe High-Ground Corridors Table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_corridors (
      id TEXT PRIMARY KEY,
      origin_barangay TEXT,
      destination_shelter TEXT,
      route_name TEXT,
      distance_meters INTEGER,
      elevation_gain_meters INTEGER,
      hazard_avoidance_notes TEXT,
      waypoints_json TEXT,
      turn_steps_json TEXT,
      cached_at TEXT
    );
  `);

  // Populate initial seed data if empty
  const countRes = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM offline_shelters'
  );
  if (!countRes || countRes.count === 0) {
    await seedOfflineData(db);
  }
}

async function seedOfflineData(db: SQLite.SQLiteDatabase) {
  // Seed Metro Cebu Shelters
  const shelters = [
    {
      id: 'shelter_mabolo',
      barangay_id: 'mabolo',
      barangay_name: 'Mabolo',
      name: 'Mabolo Elementary School Gym',
      address: 'M.J. Cuenco Ave, Mabolo, Cebu City',
      max_capacity: 350,
      current_occupancy: 85,
      status: 'open',
      contact_number: '+63 32 231 1234',
      latitude: 10.3265,
      longitude: 123.918,
    },
    {
      id: 'shelter_kasambagan',
      barangay_id: 'kasambagan',
      barangay_name: 'Kasambagan',
      name: 'Kasambagan Sports Complex',
      address: 'Pres. Quirino St, Kasambagan, Cebu City',
      max_capacity: 250,
      current_occupancy: 240,
      status: 'full',
      contact_number: '+63 32 232 5678',
      latitude: 10.334,
      longitude: 123.914,
    },
    {
      id: 'shelter_guadalupe',
      barangay_id: 'guadalupe',
      barangay_name: 'Guadalupe',
      name: 'Guadalupe Barangay Gymnasium',
      address: 'Guadalupe Main Rd, Cebu City',
      max_capacity: 500,
      current_occupancy: 120,
      status: 'open',
      contact_number: '+63 32 254 9876',
      latitude: 10.328,
      longitude: 123.882,
    },
    {
      id: 'shelter_lahug',
      barangay_id: 'lahug',
      barangay_name: 'Lahug',
      name: 'Lahug High Ground Evacuation Center',
      address: 'Gorordo Ave, Lahug, Cebu City',
      max_capacity: 400,
      current_occupancy: 60,
      status: 'open',
      contact_number: '+63 32 231 9999',
      latitude: 10.336,
      longitude: 123.899,
    },
  ];

  for (const s of shelters) {
    await db.runAsync(
      `INSERT INTO offline_shelters (id, barangay_id, barangay_name, name, address, max_capacity, current_occupancy, status, contact_number, latitude, longitude, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id,
        s.barangay_id,
        s.barangay_name,
        s.name,
        s.address,
        s.max_capacity,
        s.current_occupancy,
        s.status,
        s.contact_number,
        s.latitude,
        s.longitude,
        new Date().toISOString(),
      ]
    );
  }

  // Seed Pre-Computed Safe Corridors (High Ground Routes)
  const corridors = [
    {
      id: 'corridor_mabolo_elem',
      origin_barangay: 'Mabolo',
      destination_shelter: 'Mabolo Elementary School Gym',
      route_name: 'Pope John Paul II to Juan Luna High-Ground Path',
      distance_meters: 850,
      elevation_gain_meters: 8,
      hazard_avoidance_notes: 'Avoids Suba river low-lying underpass by traversing northern ridge.',
      waypoints_json: JSON.stringify([
        { lat: 10.321, lng: 123.912 },
        { lat: 10.324, lng: 123.915 },
        { lat: 10.3265, lng: 123.918 },
      ]),
      turn_steps_json: JSON.stringify([
        'Head North on Pope John Paul II Ave toward Juan Luna Ave (350m)',
        'Turn Right onto Juan Luna Ave away from Suba creek basin (300m)',
        'Arrive safely at Mabolo Elementary School Gym on the left (200m)',
      ]),
    },
    {
      id: 'corridor_kasambagan_sports',
      origin_barangay: 'Kasambagan',
      destination_shelter: 'Kasambagan Sports Complex',
      route_name: 'Pres. Quirino Elevated Corridor',
      distance_meters: 620,
      elevation_gain_meters: 5,
      hazard_avoidance_notes: 'Maintains elevated sidewalks along Quirino; safe from Mahiga creek.',
      waypoints_json: JSON.stringify([
        { lat: 10.33, lng: 123.91 },
        { lat: 10.332, lng: 123.912 },
        { lat: 10.334, lng: 123.914 },
      ]),
      turn_steps_json: JSON.stringify([
        'Head East on Pres. Roxas St toward Pres. Quirino (220m)',
        'Turn Left onto Pres. Quirino St (280m)',
        'Destination Kasambagan Sports Complex will be on your right (120m)',
      ]),
    },
    {
      id: 'corridor_guadalupe_gym',
      origin_barangay: 'Guadalupe',
      destination_shelter: 'Guadalupe Barangay Gymnasium',
      route_name: 'Guadalupe Ridge Upper Pathway',
      distance_meters: 1100,
      elevation_gain_meters: 14,
      hazard_avoidance_notes: 'Routes along the eastern ridge well above Guadalupe river waterline.',
      waypoints_json: JSON.stringify([
        { lat: 10.321, lng: 123.879 },
        { lat: 10.325, lng: 123.881 },
        { lat: 10.328, lng: 123.882 },
      ]),
      turn_steps_json: JSON.stringify([
        'Head North on V. Rama Ave toward Guadalupe Main Rd (500m)',
        'Continue onto Guadalupe Main Rd upward incline (450m)',
        'Arrive at Guadalupe Barangay Gymnasium on your right (150m)',
      ]),
    },
  ];

  for (const c of corridors) {
    await db.runAsync(
      `INSERT INTO offline_corridors (id, origin_barangay, destination_shelter, route_name, distance_meters, elevation_gain_meters, hazard_avoidance_notes, waypoints_json, turn_steps_json, cached_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        c.id,
        c.origin_barangay,
        c.destination_shelter,
        c.route_name,
        c.distance_meters,
        c.elevation_gain_meters,
        c.hazard_avoidance_notes,
        c.waypoints_json,
        c.turn_steps_json,
        new Date().toISOString(),
      ]
    );
  }
}

export async function getOfflineShelters(): Promise<any[]> {
  const db = await getLocalDatabase();
  return await db.getAllAsync('SELECT * FROM offline_shelters ORDER BY name ASC');
}

export async function getOfflineCorridors(): Promise<any[]> {
  const db = await getLocalDatabase();
  const rows: any[] = await db.getAllAsync('SELECT * FROM offline_corridors ORDER BY route_name ASC');
  return rows.map((r) => ({
    ...r,
    turn_steps: r.turn_steps_json ? JSON.parse(r.turn_steps_json) : [],
    waypoints: r.waypoints_json ? JSON.parse(r.waypoints_json) : [],
  }));
}
