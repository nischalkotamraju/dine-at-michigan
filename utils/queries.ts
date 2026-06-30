import { eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as Network from 'expo-network';
import { insertDataIntoSQLiteDB } from '~/services/database/database';
import { useDataSyncStore } from '~/store/useDataSyncStore';
import * as schema from '../services/database/schema';

export const fetchMenuData = async (
  drizzleDb: ExpoSQLiteDatabase<typeof schema>,
  forceSync: boolean = false,
) => {
  const SYNC_TIMEOUT_MS = 60000;

  // Check internet connection and time-based sync logic
  const networkState = await Network.getNetworkStateAsync();
  if (networkState.isConnected) {
    // Get sync store state directly (not using hook since this is not a React component)
    const syncStore = useDataSyncStore.getState();

    // Check if SQLite is empty (no locations) — always force sync in that case
    const localLocationCount = await drizzleDb.select().from(schema.location);
    const isLocalEmpty = localLocationCount.length === 0;

    // Sync with Supabase if 6 hours have passed since last sync, SQLite is empty, OR if manually forced
    if (forceSync || isLocalEmpty || syncStore.shouldSyncWithSupabase()) {
      try {
        const reason = forceSync ? 'Manual refresh requested' : isLocalEmpty ? 'Local database empty' : '6+ hours since last sync';
        console.log(`🔄 ${reason}, fetching fresh data from Supabase...`);
        await Promise.race([
          insertDataIntoSQLiteDB(drizzleDb),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Sync timeout')), SYNC_TIMEOUT_MS),
          ),
        ]);

        // Update the last sync time after successful sync
        syncStore.setLastSupabaseQueryTime(Date.now());
        console.log('✅ Successfully synced with Supabase and updated sync timestamp');
      } catch (error) {
        console.warn('Failed to sync with remote database, using cached data:', error);
        // Continue to return cached data even if sync fails
      }
    } else {
      const timeSinceLastSync = syncStore.getTimeSinceLastSync();
      const hoursUntilNextSync = Math.max(
        0,
        (6 * 60 * 60 * 1000 - timeSinceLastSync) / (60 * 60 * 1000), // 6 hours in milliseconds
      );
      console.log(
        `ℹ️  Using cached data (${(timeSinceLastSync / (60 * 60 * 1000)).toFixed(1)}h since last sync, next sync in ${hoursUntilNextSync.toFixed(1)}h)`,
      );
    }
  } else {
    console.log('📱 Offline mode: using cached SQLite data');
  }

  // Always return cached data from SQLite (works both online and offline)
  const [data, types] = await Promise.all([
    drizzleDb
      .select()
      .from(schema.location)
      .innerJoin(schema.location_type, eq(schema.location.type_id, schema.location_type.id))
      .orderBy(schema.location.display_order)
      .then((joinedData) =>
        joinedData.map(({ location, location_type }) => ({
          ...location,
          type: location_type.name,
        })),
      ),
    drizzleDb.select().from(schema.location_type).orderBy(schema.location_type.display_order),
  ]);

  return { locations: data, locationTypes: types };
};
