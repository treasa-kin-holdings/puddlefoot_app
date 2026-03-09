// src/lib/gardenMedia.ts
import { supabase } from '@/lib/supabase';

export type GardenMediaKind =
    | 'overlay'
    | 'prediction'
    | 'photo'
    | 'export'
    | 'reference'
    | 'other';

export type GardenMediaRow = {
    id: string;
    user_id: string;
    kind: string | null;
    title: string | null;
    storage_bucket: string | null;
    storage_path: string | null;
    mime_type: string | null;
    width: number | null;
    height: number | null;
    taken_at: string | null;
    source_media_id: string | null;
    metadata: any | null;
    annotations: any | null;
    created_at: string | null;
    updated_at: string | null;
};

const BUCKET = 'garden-media';

function extFromMime(mime: string) {
    if (mime === 'image/png') return 'png';
    if (mime === 'image/jpeg') return 'jpg';
    if (mime === 'image/webp') return 'webp';
    // default
    return 'png';
}

function ymParts(d = new Date()) {
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return { yyyy, mm };
}

export function base64ToBlob(base64DataUrl: string): { blob: Blob; mime: string } {
    // expects: "data:image/png;base64,...."
    const [header, b64] = base64DataUrl.split(',');
    const mimeMatch = header.match(/data:(.*?);base64/);
    const mime = mimeMatch?.[1] ?? 'image/png';

    const bytes = atob(b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);

    return { blob: new Blob([arr], { type: mime }), mime };
}

export async function saveGardenMedia(args: {
    userId: string;
    blob: Blob;
    mimeType?: string; // if blob.type is unreliable
    kind: GardenMediaKind;
    title?: string;
    width?: number;
    height?: number;
    takenAt?: Date;
    sourceMediaId?: string;
    metadata?: Record<string, any>;
    annotations?: Record<string, any>;
}): Promise<GardenMediaRow> {
    const {
        userId,
        blob,
        kind,
        title,
        width,
        height,
        takenAt,
        sourceMediaId,
        metadata,
        annotations,
    } = args;

    const mime = args.mimeType ?? blob.type ?? 'image/png';
    const ext = extFromMime(mime);
    const { yyyy, mm } = ymParts();
    const filename = `${crypto.randomUUID()}.${ext}`;
    const storagePath = `${userId}/${yyyy}/${mm}/${filename}`;

    // 1) Upload file to Storage
    const uploadRes = await supabase.storage.from(BUCKET).upload(storagePath, blob, {
        contentType: mime,
        upsert: false,
    });

    if (uploadRes.error) {
        throw new Error(`Storage upload failed: ${uploadRes.error.message}`);
    }

    // 2) Insert DB row
    const insertPayload = {
        user_id: userId,
        kind,
        title: title ?? null,
        storage_bucket: BUCKET,
        storage_path: storagePath,
        mime_type: mime,
        width: typeof width === 'number' ? width : null,
        height: typeof height === 'number' ? height : null,
        taken_at: takenAt ? takenAt.toISOString() : null,
        source_media_id: sourceMediaId ?? null,
        metadata: metadata ?? null,
        annotations: annotations ?? null,
    };

    const { data, error } = await supabase
        .from('garden_media')
        .insert(insertPayload)
        .select('*')
        .single();

    if (error) {
        // If insert fails, we should clean up uploaded file to avoid orphaned storage.
        await supabase.storage.from(BUCKET).remove([storagePath]);
        throw new Error(`DB insert failed: ${error.message}`);
    }

    return data as GardenMediaRow;
}

export async function listGardenMedia(args: {
    userId: string;
    limit?: number;
    kind?: GardenMediaKind;
}): Promise<GardenMediaRow[]> {
    const { userId, limit = 60, kind } = args;

    let q = supabase
        .from('garden_media')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (kind) q = q.eq('kind', kind);

    const { data, error } = await q;
    if (error) throw new Error(`List failed: ${error.message}`);
    return (data ?? []) as GardenMediaRow[];
}

export async function signGardenMediaUrl(storagePath: string, expiresInSeconds = 600) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, expiresInSeconds);
    if (error) throw new Error(`Signed URL failed: ${error.message}`);
    return data.signedUrl;
}

export async function deleteGardenMediaRow(args: {
    row: GardenMediaRow;
}): Promise<void> {
    const { row } = args;

    // 1) Delete DB row first (if your policy expects it), then delete storage
    const { error: dbErr } = await supabase.from('garden_media').delete().eq('id', row.id);
    if (dbErr) throw new Error(`DB delete failed: ${dbErr.message}`);

    if (row.storage_path) {
        const { error: stErr } = await supabase.storage.from(BUCKET).remove([row.storage_path]);
        if (stErr) throw new Error(`Storage delete failed: ${stErr.message}`);
    }
}