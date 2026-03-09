'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        // Supabase client will pick up the session from the URL automatically.
        // We just need a real route so Next doesn't 404.
        router.replace('/');
    }, [router]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="text-sm text-neutral-700">Signing you in…</div>
        </div>
    );
}