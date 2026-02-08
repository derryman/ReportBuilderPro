/**
 * IndexedDB-based offline storage for reports.
 * Used when the user saves a report without internet; reports are synced later.
 */

const DB_NAME = 'ReportBuilderProOffline';
const DB_VERSION = 1;
const STORE_REPORTS = 'reports';

export type OfflineReport = {
  localId: string;
  templateId: string;
  jobId: string | null;
  capturedData: Record<string, unknown>;
  timestamp: string;
  synced: boolean;
  createdAt: number;
  serverId?: string | null;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_REPORTS)) {
        db.createObjectStore(STORE_REPORTS, { keyPath: 'localId' });
      }
    };
  });
}

function getStore(mode: IDBTransactionMode = 'readwrite'): Promise<IDBObjectStore> {
  return openDB().then((db) => {
    const tx = db.transaction(STORE_REPORTS, mode);
    return Promise.resolve(tx.objectStore(STORE_REPORTS));
  });
}

/** Generate a local-only ID for reports saved offline */
export function generateLocalId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/** Save a report locally (offline). */
export async function saveReportOffline(payload: {
  templateId: string;
  jobId: string | null;
  capturedData: Record<string, unknown>;
  timestamp: string;
}): Promise<OfflineReport> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const report: OfflineReport = {
      localId: generateLocalId(),
      templateId: payload.templateId,
      jobId: payload.jobId,
      capturedData: payload.capturedData,
      timestamp: payload.timestamp,
      synced: false,
      createdAt: Date.now(),
      serverId: null,
    };
    const tx = db.transaction(STORE_REPORTS, 'readwrite');
    const store = tx.objectStore(STORE_REPORTS);
    const request = store.add(report);
    request.onsuccess = () => resolve(report);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

/** Get all reports from local storage (synced + unsynced). */
export async function getAllOfflineReports(): Promise<OfflineReport[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_REPORTS, 'readonly');
    const request = tx.objectStore(STORE_REPORTS).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

/** Get only reports that have not been synced yet. */
export async function getUnsyncedReports(): Promise<OfflineReport[]> {
  const all = await getAllOfflineReports();
  return all.filter((r) => !r.synced);
}

/** Mark a report as synced (and optionally set server ID). */
export async function markReportSynced(
  localId: string,
  serverId?: string
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_REPORTS, 'readwrite');
    const store = tx.objectStore(STORE_REPORTS);
    const getReq = store.get(localId);
    getReq.onsuccess = () => {
      const report = getReq.result as OfflineReport | undefined;
      if (!report) {
        db.close();
        resolve();
        return;
      }
      report.synced = true;
      if (serverId) report.serverId = serverId;
      store.put(report);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

/** Delete a report from local storage (e.g. after successful sync). */
export async function deleteOfflineReport(localId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_REPORTS, 'readwrite');
    const request = tx.objectStore(STORE_REPORTS).delete(localId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

/** Count of reports pending sync (for UI). */
export async function getUnsyncedCount(): Promise<number> {
  const list = await getUnsyncedReports();
  return list.length;
}
