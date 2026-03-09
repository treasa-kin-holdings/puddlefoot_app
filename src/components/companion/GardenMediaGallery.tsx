'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { listGardenMedia, signGardenMediaUrl, deleteGardenMediaRow, GardenMediaRow } from '@/lib/gardenMedia';
import { useCompanion } from '@/context/CompanionContext'; // adjust import to your actual hook
import { BRAND } from '@/lib/brand';

type Item = GardenMediaRow & { signedUrl?: string };

export default function GardenMediaGallery() {
    const { userId, tier, respondLocal } = useCompanion() as any; // adjust typing to your context
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Item | null>(null);

    const canWrite = useMemo(() => tier === 'premium', [tier]);

    useEffect(() => {
        if (!userId) return;

        let cancelled = false;

        (async () => {
            setLoading(true);
            try {
                const rows = await listGardenMedia({ userId, limit: 60 });
                const withUrls: Item[] = await Promise.all(
                    rows.map(async (r) => {
                        if (!r.storage_path) return r;
                        const signedUrl = await signGardenMediaUrl(r.storage_path, 600);
                        return { ...r, signedUrl };
                    })
                );
                if (!cancelled) setItems(withUrls);
            } catch (e: any) {
                console.error(e);
                respondLocal?.(`Hmm — I couldn't load your gallery. (${e?.message ?? 'unknown error'})`);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    const onDelete = async (item: Item) => {
        if (!canWrite) {
            respondLocal?.('Saving/deleting Garden Media is a Premium feature.');
            return;
        }
        try {
            await deleteGardenMediaRow({ row: item });
            setItems((prev) => prev.filter((x) => x.id !== item.id));
            if (selected?.id === item.id) setSelected(null);
            respondLocal?.('Deleted ✅');
        } catch (e: any) {
            console.error(e);
            respondLocal?.(`Delete failed. (${e?.message ?? 'unknown error'})`);
        }
    };

    return (
        <div className="p-3">
            <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Garden Gallery</div>
                <div className="text-xs opacity-70">
                    {loading ? 'Loading…' : `${items.length} item${items.length === 1 ? '' : 's'}`}
                </div>
            </div>

            {items.length === 0 && !loading ? (
                <div className="text-sm opacity-70">
                    Nothing saved yet. When {BRAND.assistantName} generates an overlay/prediction, tap <b>Save to Gallery</b>.
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-2">
                    {items.map((it) => (
                        <button
                            key={it.id}
                            className="relative rounded-lg overflow-hidden bg-black/5"
                            onClick={() => setSelected(it)}
                            title={it.title ?? it.kind ?? 'Garden Media'}
                        >
                            {it.signedUrl ? (
                                <img src={it.signedUrl} alt={it.title ?? 'Garden Media'} className="w-full h-28 object-cover" />
                            ) : (
                                <div className="w-full h-28 flex items-center justify-center text-xs opacity-60">No preview</div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 px-2 py-1 text-[11px] bg-black/50 text-white truncate">
                                {it.kind ?? 'media'}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {selected && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                    <div className="bg-white rounded-2xl overflow-hidden max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-3 border-b">
                            <div className="text-sm font-semibold">{selected.title ?? selected.kind ?? 'Garden Media'}</div>
                            <div className="flex gap-2">
                                {canWrite && (
                                    <button
                                        className="text-sm px-3 py-1 rounded-lg bg-red-600 text-white"
                                        onClick={() => onDelete(selected)}
                                    >
                                        Delete
                                    </button>
                                )}
                                <button className="text-sm px-3 py-1 rounded-lg bg-black/10" onClick={() => setSelected(null)}>
                                    Close
                                </button>
                            </div>
                        </div>

                        <div className="p-3">
                            {selected.signedUrl ? (
                                <img src={selected.signedUrl} alt={selected.title ?? 'Garden Media'} className="w-full h-auto rounded-xl" />
                            ) : (
                                <div className="text-sm opacity-70">No preview available.</div>
                            )}

                            <div className="mt-3 text-xs opacity-70">
                                <div><b>Kind:</b> {selected.kind ?? '—'}</div>
                                <div><b>Captured:</b> {selected.taken_at ? new Date(selected.taken_at).toLocaleString() : '—'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}