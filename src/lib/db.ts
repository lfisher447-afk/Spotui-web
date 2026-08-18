import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Track, Playlist, AppSettings } from '../types';

interface SpotuiDB extends DBSchema {
  tracks: {
    key: string;
    value: Track;
    indexes: { 'by-source': string; 'by-added': number };
  };
  playlists: {
    key: string;
    value: Playlist;
    indexes: { 'by-created': number };
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'spotui-signal-room-v3';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SpotuiDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SpotuiDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tracks')) {
          const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
          trackStore.createIndex('by-source', 'source');
          trackStore.createIndex('by-added', 'addedAt');
        }
        if (!db.objectStoreNames.contains('playlists')) {
          const playlistStore = db.createObjectStore('playlists', { keyPath: 'id' });
          playlistStore.createIndex('by-created', 'createdAt');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

export async function saveTrack(track: Track): Promise<void> {
  const db = await getDB();
  await db.put('tracks', track);
}

export async function saveTracksBatch(tracks: Track[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('tracks', 'readwrite');
  for (const track of tracks) {
    await tx.store.put(track);
  }
  await tx.done;
}

export async function getAllTracks(): Promise<Track[]> {
  const db = await getDB();
  return db.getAllFromIndex('tracks', 'by-added');
}

export async function deleteTrack(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('tracks', id);
}

export async function savePlaylist(playlist: Playlist): Promise<void> {
  const db = await getDB();
  await db.put('playlists', playlist);
}

export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getDB();
  return db.getAll('playlists');
}

export async function deletePlaylist(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('playlists', id);
}

export async function getStoredSettings(): Promise<Partial<AppSettings> | null> {
  const db = await getDB();
  return (await db.get('settings', 'app_config')) || null;
}

export async function saveStoredSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'app_config');
}

export async function exportFullVault(): Promise<string> {
  const tracks = await getAllTracks();
  const playlists = await getAllPlaylists();
  const settings = await getStoredSettings();

  const exportData = {
    version: 'spotui-v3',
    timestamp: Date.now(),
    tracks: tracks.map((t) => ({ ...t, blob: null })), // metadata JSON
    playlists,
    settings,
  };

  return JSON.stringify(exportData, null, 2);
}

export async function getStorageMetrics() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      usageMB: ((estimate.usage || 0) / (1024 * 1024)).toFixed(2),
      quotaMB: ((estimate.quota || 0) / (1024 * 1024)).toFixed(2),
      percent: estimate.quota ? (((estimate.usage || 0) / estimate.quota) * 100).toFixed(1) : '0',
    };
  }
  return { usageMB: '0.00', quotaMB: 'Unlimited', percent: '0' };
}
