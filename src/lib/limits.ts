import { supabase } from './supabase';

export const LIMITS = {
    FREE: {
        PLANTS: 5,
        DAILY_CHAT: 5,
        MONTHLY_ID: 3,
    },
    PREMIUM: {
        PLANTS: Infinity,
        DAILY_CHAT: Infinity,
        MONTHLY_ID: Infinity,
    },
};

export async function getUserTier(userId: string): Promise<'free' | 'premium'> {
    // FORCING PREMIUM FOR TESTING
    return 'premium';

    // const { data, error } = await supabase
    //     .from('user_tiers')
    //     .select('tier')
    //     .eq('user_id', userId)
    //     .single();

    // if (error || !data) return 'free'; // Default to free on error/missing
    // return data.tier as 'free' | 'premium';
}

export async function checkPlantLimit(userId: string): Promise<boolean> {
    const tier = await getUserTier(userId);
    if (tier === 'premium') return true;

    const { count, error } = await supabase
        .from('plants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (error) return false; // Fail safe? Or fail open? Let's fail safe (restrict).
    return (count || 0) < LIMITS.FREE.PLANTS;
}

export async function checkChatLimit(userId: string): Promise<boolean> {
    const tier = await getUserTier(userId);
    if (tier === 'premium') return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('feature', 'chat')
        .gte('created_at', today.toISOString());

    if (error) return false;
    return (count || 0) < LIMITS.FREE.DAILY_CHAT;
}

export async function checkIdentificationLimit(userId: string): Promise<boolean> {
    const tier = await getUserTier(userId);
    if (tier === 'premium') return true;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('feature', 'identification')
        .gte('created_at', startOfMonth.toISOString());

    if (error) return false;
    return (count || 0) < LIMITS.FREE.MONTHLY_ID;
}

export async function logUsage(userId: string, feature: 'chat' | 'identification' | 'diagnosis', context: any = {}) {
    await supabase.from('usage_logs').insert({
        user_id: userId,
        feature,
        context
    });
}
