import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Missing SUPABASE env vars for /api/cards/save');
}

const supabaseAdmin = createClient(
    SUPABASE_URL || '',
    SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
);

type Body = {
    userId: string;
    kind: 'identify' | 'diagnose';
    title?: string;
    card: any;
    source?: string; // 'voice' | 'chat' | 'button'
};

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as Body;
        const { userId, kind, title, card, source } = body;

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }
        if (kind !== 'identify' && kind !== 'diagnose') {
            return NextResponse.json({ error: 'Invalid kind' }, { status: 400 });
        }
        if (!card) {
            return NextResponse.json({ error: 'Missing card payload' }, { status: 400 });
        }

        // Validate UUID format to avoid DB errors
        const isValidUUID =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

        if (!isValidUUID) {
            return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('plant_cards')
            .insert([
                {
                    user_id: userId,
                    kind,
                    title: title || null,
                    card,
                    source: source || 'app',
                },
            ])
            .select('id, created_at')
            .single();

        if (error) {
            console.error('Save card error:', error);
            return NextResponse.json({ error: 'Failed to save card' }, { status: 500 });
        }

        return NextResponse.json({ success: true, saved: data });
    } catch (e: any) {
        console.error('Save card route error:', e);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}