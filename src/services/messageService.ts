import { supabase } from '../api/supabase';
import Config from 'react-native-config';

export interface Message {
    id: number;
    conversation_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    message_type: string;
    track_data: any;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
}

export interface ConversationPreview {
    id: string; // conversation_id
    otherUser: {
        id: string;
        username: string;
        display_name: string;
        avatar_url: string | null;
    };
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
}

/**
 * İki kullanıcı arasında benzersiz conversation_id oluştur
 * Küçük ID her zaman önce gelir (tutarlılık için)
 */
export function generateConversationId(userId1: string, userId2: string): string {
    return userId1 < userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`;
}

/**
 * Mesaj gönder
 */
export async function sendMessage(
    conversationId: string,
    senderId: string,
    receiverId: string,
    content: string,
    messageType: string = 'text',
    trackData: any = null
): Promise<Message | null> {
    const { data, error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            receiver_id: receiverId,
            content,
            message_type: messageType,
            track_data: trackData
        })
        .select()
        .single();

    if (error) {
        console.error('sendMessage error:', error);
        return null;
    }

    return data;
}

/**
 * Konuşmadaki mesajları getir
 */
export async function getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('getMessages error:', error);
        return [];
    }

    return data || [];
}

/**
 * Kullanıcının tüm konuşmalarını getir
 */
export async function getConversations(userId: string): Promise<ConversationPreview[]> {
    // Kullanıcının dahil olduğu tüm mesajları al
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

    if (error || !messages) {
        console.error('getConversations error:', error);
        return [];
    }

    // Conversation'ları grupla
    const conversationMap = new Map<string, Message[]>();
    messages.forEach(msg => {
        const existing = conversationMap.get(msg.conversation_id) || [];
        existing.push(msg);
        conversationMap.set(msg.conversation_id, existing);
    });

    // Her conversation için diğer kullanıcı bilgisini al
    const conversations: ConversationPreview[] = [];
    
    for (const [convId, msgs] of conversationMap) {
        const lastMsg = msgs[0]; // En son mesaj (desc sıralı)
        const otherUserId = lastMsg.sender_id === userId ? lastMsg.receiver_id : lastMsg.sender_id;
        
        // Diğer kullanıcının profilini al
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url')
            .eq('id', otherUserId)
            .single();

        if (profile) {
            // Okunmamış mesaj sayısı (karşı taraftan gelen)
            const unreadCount = msgs.filter(m => m.receiver_id === userId && !m.is_read).length;

            conversations.push({
                id: convId,
                otherUser: profile,
                lastMessage: lastMsg.content,
                lastMessageAt: lastMsg.created_at,
                unreadCount
            });
        }
    }

    // Son mesaj zamanına göre sırala
    return conversations.sort((a, b) => 
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
}

/**
 * Mesajları okundu olarak işaretle
 */
export async function markMessagesAsRead(conversationId: string, receiverId: string): Promise<boolean> {
    const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', receiverId)
        .eq('is_read', false);

    if (error) {
        console.error('markMessagesAsRead error:', error);
        return false;
    }

    return true;
}

/**
 * Realtime subscription için mesaj dinleyici
 */
export function subscribeToMessages(
    conversationId: string,
    onNewMessage: (message: Message) => void
) {
    const channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            },
            (payload) => {
                onNewMessage(payload.new as Message);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * Toplam okunmamış mesaj sayısını getir
 */
export async function getTotalUnreadCount(userId: string): Promise<number> {
    const { data, error, count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);

    if (error) {
        console.error('getTotalUnreadCount error:', error);
        return 0;
    }

    return count || 0;
}

/**
 * Okunmamış mesaj sayısı için realtime subscription
 */
export function subscribeToUnreadCount(
    userId: string,
    onUpdate: (count: number) => void
) {
    const channel = supabase
        .channel(`unread:${userId}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `receiver_id=eq.${userId}`
            },
            async () => {
                // Yeni mesaj geldiğinde veya okundu işaretlendiğinde sayıyı güncelle
                const count = await getTotalUnreadCount(userId);
                onUpdate(count);
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}
