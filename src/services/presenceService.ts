import { supabase } from '../api/supabase';

/**
 * Kullanıcının online durumunu günceller
 */
export async function updatePresence(userId: string, isOnline: boolean): Promise<void> {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                is_online: isOnline,
                last_seen: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) {
            console.error('Presence update error:', error);
        }
    } catch (error) {
        console.error('Presence update failed:', error);
    }
}

/**
 * Kullanıcının presence bilgisini getirir
 */
export async function getPresence(userId: string): Promise<{ isOnline: boolean; lastSeen: string | null }> {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('is_online, last_seen')
            .eq('id', userId)
            .single();

        if (error || !data) {
            return { isOnline: false, lastSeen: null };
        }

        return {
            isOnline: data.is_online || false,
            lastSeen: data.last_seen
        };
    } catch (error) {
        return { isOnline: false, lastSeen: null };
    }
}

/**
 * Kullanıcının presence değişikliklerini dinler
 */
export function subscribeToPresence(
    userId: string,
    callback: (isOnline: boolean, lastSeen: string | null) => void
): () => void {
    const channel = supabase
        .channel(`presence:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${userId}`
            },
            (payload) => {
                const data = payload.new as { is_online: boolean; last_seen: string | null };
                callback(data.is_online || false, data.last_seen);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Last seen'i okunabilir formata çevirir
 */
export function formatLastSeen(lastSeen: string | null): string {
    if (!lastSeen) return 'Çevrimdışı';

    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dk önce`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} saat önce`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} gün önce`;

    return lastSeenDate.toLocaleDateString('tr-TR');
}
