/**
 * storage.ts — Datei-Uploads & URLs.
 *
 * Komponenten nutzen NUR diese Funktionen — nie supabase.storage direkt.
 * Holt den Client ausschließlich über getSupabaseClient() aus db.ts.
 *
 * STATUS: Phase 5 noch nicht gestartet → Stubs. Beim Supabase-Einbau werden
 * nur die Körper ersetzt (getSupabaseClient().storage.from(bucket)…).
 */

// import { getSupabaseClient } from "@/lib/db";

export interface UploadResult {
  path: string;
  publicUrl: string;
}

/** Generischer Upload in einen Bucket. Phase 5: storage.from(bucket).upload. */
export async function uploadFile(
  _bucket: string,
  _path: string,
  _file: File,
): Promise<UploadResult> {
  throw new Error("Storage ist noch nicht konfiguriert (Phase 5).");
}

/** Organisation-Logo hochladen (White-Label). Phase 5: Bucket 'branding'. */
export async function uploadLogo(_organizationId: string, _file: File): Promise<UploadResult> {
  throw new Error("Storage ist noch nicht konfiguriert (Phase 5).");
}

/** Avatar hochladen. Phase 5: Bucket 'avatars'. */
export async function uploadAvatar(_userId: string, _file: File): Promise<UploadResult> {
  throw new Error("Storage ist noch nicht konfiguriert (Phase 5).");
}

/** Öffentliche URL zu einem gespeicherten Pfad. Phase 5: getPublicUrl. */
export function getPublicUrl(_bucket: string, _path: string): string {
  return "";
}

/** Datei löschen. Phase 5: storage.from(bucket).remove. */
export async function deleteFile(_bucket: string, _path: string): Promise<void> {
  return Promise.resolve();
}
