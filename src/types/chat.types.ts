export interface Message {
    id: number;
    conversationId: string;
    senderId: string;
    receiverId: string;
    content: string;
    messageType: 'text' | 'image' | 'track';
    trackData: TrackData | null;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
}

export interface TrackData {
    id: string;
    name: string;
    artist: string;
    albumName: string;
    albumImage: string;
    previewUrl: string | null;
}

export interface Conversation {
    id: string;
    friendId: string;
    friendName: string;
    friendAvatar: string | null;
    lastMessage: string | null;
    lastMessageTime: string | null;
    unreadCount: number;
}