import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fallback for development without keys to prevent crash
if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase keys missing. Using mock client.');
}

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        // Mock minimal interface used in app
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        },
        from: () => ({
            select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), gte: () => ({}) }) }),
            insert: async () => ({ error: null }),
            upload: async () => ({ data: null, error: null }),
        }),
        storage: {
            from: () => ({
                upload: async () => ({ data: { path: 'mock-path' }, error: null }),
                getPublicUrl: (path: string) => ({ data: { publicUrl: `https://mock-supabase.co/storage/v1/object/public/plant-images/${path}` } }),
            })
        }
    } as any;
