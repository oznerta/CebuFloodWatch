import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getOfflineDB(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('cebufloodwatch_offline.db');
    await initOfflineTables(db);
  }
  return db;
}

async function initOfflineTables(database: SQLite.SQLiteDatabase) {
  // Create offline shelters table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_shelters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      barangay_name TEXT NOT NULL,
      address TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      max_capacity INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      contact_number TEXT
    );

    CREATE TABLE IF NOT EXISTS offline_corridors (
      id TEXT PRIMARY KEY,
      origin_barangay TEXT NOT NULL,
      destination_shelter TEXT NOT NULL,
      route_name TEXT NOT NULL,
      is_blocked INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Seed default offline shelters if empty
  const count = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM offline_shelters'
  );

  if (count && count.count === 0) {
    await database.execAsync(`
      INSERT INTO offline_shelters (id, name, barangay_name, address, latitude, longitude, max_capacity, status, contact_number)
      VALUES 
      ('s1', 'Mabolo Elementary School Gym', 'Mabolo', 'M.J. Cuenco Ave, Mabolo', 10.3265, 123.9180, 350, 'open', '+63 917 123 4567'),
      ('s2', 'Kasambagan Sports Complex', 'Kasambagan', 'Pres. Quirino St, Kasambagan', 10.3340, 123.9140, 250, 'full', '+63 918 234 5678'),
      ('s3', 'Mambaling Multi-Purpose Hall', 'Mambaling', 'N. Bacalso Ave, Mambaling', 10.2930, 123.8760, 500, 'open', '+63 920 345 6789');

      INSERT INTO offline_corridors (id, origin_barangay, destination_shelter, route_name, is_blocked)
      VALUES
      ('c1', 'Mabolo', 'Mabolo Elementary School Gym', 'Route A: Via Pope John Paul II Ave to M.J. Cuenco', 0),
      ('c2', 'Kasambagan', 'Kasambagan Sports Complex', 'Route B: Via Juan Luna Ave to Quirino St', 0),
      ('c3', 'Mambaling', 'Mambaling Multi-Purpose Hall', 'Route C: Via F. Llamas St to N. Bacalso', 0);
    `);
  }
}

export async function getOfflineShelters() {
  const database = await getOfflineDB();
  return await database.getAllAsync('SELECT * FROM offline_shelters');
}

export async function getOfflineCorridors(barangayName?: string) {
  const database = await getOfflineDB();
  if (barangayName) {
    return await database.getAllAsync(
      'SELECT * FROM offline_corridors WHERE origin_barangay = ?',
      [barangayName]
    );
  }
  return await database.getAllAsync('SELECT * FROM offline_corridors');
}
