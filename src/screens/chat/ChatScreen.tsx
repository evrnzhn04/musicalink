import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import {
    Message,
    sendMessage,
    getMessages,
    markMessagesAsRead,
    subscribeToMessages,
    generateConversationId
} from '../../services/messageService';
import { DefaultProfilePhoto } from '../../components/profile/DefaultProfilePhoto';
import { supabase } from '../../api/supabase';
import { getPresence, subscribeToPresence, formatLastSeen } from '../../services/presenceService';

type ChatRouteParams = {
    Chat: {
        otherUser: {
            id: string;
            username: string;
            display_name: string;
            avatar_url: string | null;
        };
    };
};

export function ChatScreen() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<ChatRouteParams, 'Chat'>>();
    const { otherUser } = route.params;

    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const flashListRef = useRef<any>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    // Presence state
    const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
    const [otherUserLastSeen, setOtherUserLastSeen] = useState<string | null>(null);

    const conversationId = user?.id ? generateConversationId(user.id, otherUser.id) : '';

    // Mesajları yükle
    useEffect(() => {
        if (!conversationId) return;

        const loadMessages = async () => {
            setIsLoading(true);
            const msgs = await getMessages(conversationId);
            setMessages(msgs);
            setIsLoading(false);

            // Mesajları okundu olarak işaretle
            if (user?.id) {
                await markMessagesAsRead(conversationId, user.id);
            }
        };

        loadMessages();
    }, [conversationId, user?.id]);

    // Karşı tarafın presence bilgisini al ve dinle
    useEffect(() => {
        if (!otherUser.id) return;

        // İlk yükleme
        const loadPresence = async () => {
            const presence = await getPresence(otherUser.id);
            setIsOtherUserOnline(presence.isOnline);
            setOtherUserLastSeen(presence.lastSeen);
        };
        loadPresence();

        // Realtime subscription
        const unsubscribe = subscribeToPresence(otherUser.id, (isOnline, lastSeen) => {
            setIsOtherUserOnline(isOnline);
            setOtherUserLastSeen(lastSeen);
        });

        // Last seen text'i güncellemek için interval (her 30 saniyede)
        const intervalId = setInterval(() => {
            // State'i tetiklemek için timestamp'ı güncelle
            setOtherUserLastSeen(prev => prev);
        }, 30000);

        return () => {
            unsubscribe();
            clearInterval(intervalId);
        };
    }, [otherUser.id]);

    // Realtime subscription - INSERT
    useEffect(() => {
        if (!conversationId) return;

        const unsubscribe = subscribeToMessages(conversationId, (newMessage) => {
            setMessages(prev => {
                const exists = prev.some(m => m.id === newMessage.id);
                if (exists) return prev;
                return [...prev, newMessage];
            });

            if (newMessage.receiver_id === user?.id) {
                markMessagesAsRead(conversationId, user.id);
            }
        });

        return unsubscribe;
    }, [conversationId, user?.id]);

    // Realtime subscription - UPDATE (görüldü durumu için)
    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`read_status:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const updated = payload.new as Message;
                    setMessages(prev => prev.map(m =>
                        m.id === updated.id ? { ...m, is_read: updated.is_read } : m
                    ));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    // Mesaj gönder
    const handleSend = async () => {
        if (!inputText.trim() || !user?.id || isSending) return;

        setIsSending(true);
        const content = inputText.trim();
        setInputText('');

        const tempId = Date.now();
        const tempMessage: Message = {
            id: tempId,
            conversation_id: conversationId,
            sender_id: user.id,
            receiver_id: otherUser.id,
            content,
            message_type: 'text',
            track_data: null,
            is_read: false,
            read_at: null,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMessage]);

        const sent = await sendMessage(
            conversationId,
            user.id,
            otherUser.id,
            content
        );

        if (sent) {
            setMessages(prev => prev.map(m =>
                m.id === tempId ? sent : m
            ));
        } else {
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }

        setIsSending(false);
    };

    // Tarih formatı - Göreli tarih
    const formatRelativeDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Bugün';
        if (diffDays === 1) return 'Dün';
        if (diffDays < 7) return `${diffDays} gün önce`;
        if (diffDays < 14) return 'Bir hafta önce';
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
        return date.toLocaleDateString('tr-TR');
    };

    // Mesaj render - Yeni tasarım
    const renderMessage = useCallback(({ item, index }: { item: Message, index: number }) => {
        const isMe = item.sender_id === user?.id;

        // Tarih ayıracı - farklı günlerde göster
        let showDateSeparator = false;
        if (index === 0) {
            showDateSeparator = true;
        } else {
            const prevItem = messages[index - 1];
            const curDate = new Date(item.created_at).toDateString();
            const prevDate = new Date(prevItem.created_at).toDateString();
            if (curDate !== prevDate) showDateSeparator = true;
        }

        // Gruplama mantığı - Aynı kişi 1dk içinde mesaj attıysa
        let showAvatar = true;
        let showTime = true;

        if (index < messages.length - 1) {
            const nextItem = messages[index + 1];
            const isSameSenderAsNext = nextItem.sender_id === item.sender_id;
            if (isSameSenderAsNext) {
                const curTime = new Date(item.created_at).getTime();
                const nextTime = new Date(nextItem.created_at).getTime();
                if (nextTime - curTime < 60000) {
                    showAvatar = false;
                    showTime = false;
                }
            }
        }

        // Kuyruk mantığı
        let isLastInGroup = true;
        if (index < messages.length - 1) {
            const nextItem = messages[index + 1];
            const isSameSenderAsNext = nextItem.sender_id === item.sender_id;
            if (isSameSenderAsNext) {
                const curTime = new Date(item.created_at).getTime();
                const nextTime = new Date(nextItem.created_at).getTime();
                if (nextTime - curTime < 60000) isLastInGroup = false;
            }
        }

        return (
            <>
                {/* Tarih Ayıracı */}
                {showDateSeparator && (
                    <View style={styles.dateSeparator}>
                        <View style={styles.dateBadge}>
                            <Text style={styles.dateBadgeText}>
                                {formatRelativeDate(item.created_at)}
                            </Text>
                        </View>
                    </View>
                )}

                <View style={[
                    styles.messageRow,
                    isMe ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
                    { marginBottom: showAvatar ? 16 : 4 }
                ]}>
                    {/* Diğer kullanıcının avatarı - sadece grubun sonunda */}
                    {!isMe && (
                        <View style={styles.avatarContainer}>
                            {showAvatar ? (
                                otherUser.avatar_url ? (
                                    <Image source={{ uri: otherUser.avatar_url }} style={styles.messageAvatar} />
                                ) : (
                                    <DefaultProfilePhoto size={28} />
                                )
                            ) : (
                                <View style={styles.avatarPlaceholder} />
                            )}
                        </View>
                    )}

                    <View style={styles.messageContentContainer}>
                        {/* Mesaj Balonu */}
                        <View style={[
                            styles.messageBubble,
                            isMe ? styles.myBubble : styles.theirBubble,
                            isMe ? {
                                borderTopLeftRadius: 18,
                                borderBottomLeftRadius: 18,
                                borderTopRightRadius: 18,
                                borderBottomRightRadius: isLastInGroup ? 4 : 18
                            } : {
                                borderTopRightRadius: 18,
                                borderBottomRightRadius: 18,
                                borderTopLeftRadius: 18,
                                borderBottomLeftRadius: isLastInGroup ? 4 : 18
                            }
                        ]}>
                            <Text style={styles.messageBody}>
                                {item.content}
                            </Text>
                        </View>

                        {/* Saat ve Read indicator - grubun sonunda göster */}
                        {showTime && (
                            <View style={[
                                styles.messageFooter,
                                isMe ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }
                            ]}>
                                <Text style={styles.messageTime}>
                                    {new Date(item.created_at).toLocaleTimeString('tr-TR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </Text>
                                {isMe && item.is_read && (
                                    <View style={styles.readIndicator}>
                                        <Text style={styles.readText}>Görüldü</Text>
                                        <Icon name="checkmark-done" size={14} color="#1DB954" />
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </>
        );
    }, [messages, user?.id, otherUser.avatar_url]);

    // Presence durumuna göre status text
    const statusText = isOtherUserOnline ? 'Çevrimiçi' : formatLastSeen(otherUserLastSeen);
    const statusColor = isOtherUserOnline ? '#1DB954' : COLORS.textSecondary;

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.headerUser}>
                    {otherUser.avatar_url ? (
                        <Image source={{ uri: otherUser.avatar_url }} style={styles.headerAvatar} />
                    ) : (
                        <DefaultProfilePhoto size={40} />
                    )}
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerName}>{otherUser.display_name}</Text>
                        <Text style={[styles.headerStatus, { color: statusColor }]}>
                            {statusText}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity>
                    <Icon name="information-circle-outline" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Messages - FlashList */}
            <View style={styles.listContainer}>
                <FlashList
                    ref={flashListRef}
                    data={messages}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderMessage}
                    drawDistance={250}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
                    onContentSizeChange={() => {
                        if (messages.length > 0) {
                            flashListRef.current?.scrollToEnd({ animated: true });
                        }
                    }}
                />
            </View>

            {/* Input Area */}
            <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
                <View style={styles.inputPill}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Icon name="add" size={24} color="#888" />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.textInput}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Mesaj yazın..."
                        placeholderTextColor="#666"
                        multiline
                    />

                    <TouchableOpacity style={styles.iconButton}>
                        <Icon name="mic-outline" size={22} color="#888" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[
                        styles.sendCircle,
                        !inputText.trim() && { opacity: 0.7 }
                    ]}
                    onPress={handleSend}
                    disabled={!inputText.trim() || isSending}
                >
                    <Icon name="arrow-up" size={24} color="#000" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#0A0A0A',
    },
    headerUser: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginLeft: 8,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    headerInfo: {
        flex: 1, marginLeft: 10
    },
    headerName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    headerStatus: {
        fontSize: 11,
        color: '#1DB954',
        flex: 1,
    },
    dateSeparator: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    dateBadge: {
        backgroundColor: '#1E1E1E',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
    },
    dateBadgeText: {
        color: '#888',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    listContainer: {
        flex: 1,
    },
    messageRow: {
        flexDirection: 'row',
        paddingHorizontal: 12,
    },
    avatarContainer: {
        width: 32,
        marginRight: 8,
        justifyContent: 'flex-end',
    },
    messageAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    avatarPlaceholder: {
        width: 28,
        height: 28,
    },
    messageContentContainer: {
        maxWidth: '75%',
    },
    messageBubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    myBubble: {
        backgroundColor: '#0D7A3B', // Koyu modern yeşil
    },
    theirBubble: {
        backgroundColor: '#1E1E1E', // Koyu gri
    },
    messageBody: {
        color: '#FFF',
        fontSize: 15,
        lineHeight: 20,
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 6,
    },
    messageTime: {
        fontSize: 11,
        color: '#666',
    },
    readIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    readText: {
        fontSize: 11,
        color: '#666',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
        backgroundColor: '#050505',
        gap: 12,
    },
    inputPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 30,
        paddingHorizontal: 6,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#333',
    },
    iconButton: {
        padding: 8,
    },
    textInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 15,
        paddingHorizontal: 5,
        paddingVertical: 4,
        maxHeight: 100,
    },
    sendCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1DB954',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
