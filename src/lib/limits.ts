import { supabase } from './supabase';

export const LIMITS = {
    FREE: {
        GARDEN_PLANTS: 5,
        PLANT_CARDS: 10,
        DAILY_CHAT: 5,
        MONTHLY_ID: 3,
    },
    PREMIUM: {
        GARDEN_PLANTS: Infinity,
        PLANT_CARDS: Infinity,
        DAILY_CHAT: Infinity,
        MONTHLY_ID: Infinity,
    },
};

export type UserTier = 'free' | 'premium';

export async function getUserTier(userId: string): Promise<UserTier> {
    const now = new Date();

    const { data, error } = await supabase
        .from('user_tiers')
        .select('tier, subscription_status, billing_period_end')
        .eq('user_id', userId)
        .maybeSingle();

    // Any error => free (fail closed)
    if (error) return 'free';

    // New user handling: ensure default row exists (race-safe)
    if (!data) {
        const { error: upsertError } = await supabase
            .from('user_tiers')
            .upsert(
                {
                    user_id: userId,
                    tier: 'free',
                    subscription_status: 'inactive',
                    billing_period_end: null,
                },
                { onConflict: 'user_id' }
            );

        // even if this fails, fail closed
        if (upsertError) return 'free';
        return 'free';
    }

    const tier = (data.tier as UserTier) ?? 'free';
    const status = (data.subscription_status as 'active' | 'inactive') ?? 'inactive';
    const bpeRaw = data.billing_period_end as string | null;

    const billingOk =
        bpeRaw === null ||
        (Number.isFinite(Date.parse(bpeRaw)) && new Date(bpeRaw).getTime() > now.getTime());

    if (tier === 'premium' && status === 'active' && billingOk) return 'premium';
    return 'free';
}

// ---------- helpers: allow passing tier to avoid extra DB calls ----------
async function resolveTier(userId: string, tier?: UserTier) {
    return tier ?? (await getUserTier(userId));
}

export async function checkChatLimit(userId: string, tier?: UserTier): Promise<boolean> {
    const t = await resolveTier(userId, tier);
    if (t === 'premium') return true;

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

export async function checkIdentificationLimit(userId: string, tier?: UserTier): Promise<boolean> {
    const t = await resolveTier(userId, tier);
    if (t === 'premium') return true;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .in('feature', ['identification', 'diagnosis'])
        .gte('created_at', startOfMonth.toISOString());

    if (error) return false;
    return (count || 0) < LIMITS.FREE.MONTHLY_ID;
}

export async function checkGardenPlantLimit(userId: string, tier?: UserTier): Promise<boolean> {
    const t = await resolveTier(userId, tier);
    if (t === 'premium') return true;

    const { count, error } = await supabase
        .from('plants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (error) return false;
    return (count || 0) < LIMITS.FREE.GARDEN_PLANTS;
}

export async function checkPlantCardLimit(userId: string, tier?: UserTier): Promise<boolean> {
    const t = await resolveTier(userId, tier);
    if (t === 'premium') return true;

    const { count, error } = await supabase
        // IMPORTANT: fix table name
        .from('plant_cards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (error) return false;
    return (count || 0) < LIMITS.FREE.PLANT_CARDS;
}

/**
 * Premium-only capability gate (good for photo saving + derived overlays).
 */
export async function requirePremium(userId: string, tier?: UserTier): Promise<boolean> {
    return (await resolveTier(userId, tier)) === 'premium';
}

export async function logUsage(
    userId: string,
    feature: 'chat' | 'identification' | 'diagnosis',
    context: any = {}
) {
    await supabase.from('usage_logs').insert({
        user_id: userId,
        feature,
        context,
    });
}