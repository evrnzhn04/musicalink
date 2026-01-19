import Config from 'react-native-config';
import { supabase } from "../api/supabase";

const EDGE_FUNCTION_URL = `${Config.SUPABASE_URL}/functions/v1/follow-user`;

export async function followUser(myId: string, targetId: string): Promise<boolean> {
    try {
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'follow',
                requesterId: myId,
                receiverId: targetId
            })
        });

        const data = await response.json();
        console.log('Follow result:', data);
        return data.success;
    } catch (error) {
        console.error('followUser error:', error);
        return false;
    }
}

export async function unfollowUser(myId: string, targetId: string): Promise<boolean> {
    try {
        const response = await fetch(EDGE_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'unfollow',
                requesterId: myId,
                receiverId: targetId
            })
        });

        const data = await response.json();
        console.log('Unfollow result:', data);
        return data.success;
    } catch (error) {
        console.error('unfollowUser error:', error);
        return false;
    }
}

export async function getFollowerCount(userId: string): Promise<number> {
    const { count } = await supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('receiver_id', userId).eq('status', 'accepted');

    return count || 0;
}

export async function getFollowingCount(userId: string): Promise<number> {
    const { count } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('requester_id', userId)
        .eq('status', 'accepted');

    return count || 0;
}

export async function getFollowStatus(myId: string, targetId: string): Promise<'none' | 'following'> {
    const { data } = await supabase
        .from('friendships')
        .select('status')
        .eq('requester_id', myId)
        .eq('receiver_id', targetId)
        .single();

    return data ? 'following' : 'none';
}