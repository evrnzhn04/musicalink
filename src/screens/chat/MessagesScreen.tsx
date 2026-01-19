import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { getConversations, ConversationPreview } from '../../services/messageService';
import { DefaultProfilePhoto } from '../../components/profile/DefaultProfilePhoto';
import { supabase } from '../../api/supabase';

export function MessagesScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { user } = useAuth();

    const [conversations, setConversations] = useState<ConversationPreview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadConversations = useCallback(async () => {
        if (!user?.id) return;

        const convos = await getConversations(user.id);
        setConversations(convos);
        setIsLoading(false);
        setIsRefreshing(false);
    }, [user?.id]);

    // Sayfa odaklandığında yenile
    useFocusEffect(
        useCallback(() => {
            loadConversations();
        }, [loadConversations])
    );

    // Realtime subscription - yeni mesaj gelince listeyi güncelle
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel('messages_list')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`
                },
                () => {
                    // Yeni mesaj geldiğinde listeyi yenile
                    loadConversations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, loadConversations]);

    const onRefresh = () => {
        setIsRefreshing(true);
        loadConversations();
    };

    const handleConversationPress = (conv: ConversationPreview) => {
        (navigation as any).navigate('Chat', {
            otherUser: conv.otherUser
        });
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = diff / (1000 * 60 * 60);

        if (hours < 24) {
            return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        } else if (hours < 48) {
            return 'Dün';
        } else {
            return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
        }
    };

    const renderConversation = ({ item }: { item: ConversationPreview }) => (
        <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => handleConversationPress(item)}
        >
            {item.otherUser.avatar_url ? (
                <Image source={{ uri: item.otherUser.avatar_url }} style={styles.avatar} />
            ) : (
                <DefaultProfilePhoto size={50} />
            )}

            <View style={styles.conversationInfo}>
                <View style={styles.conversationHeader}>
                    <Text style={styles.userName}>{item.otherUser.display_name}</Text>
                    <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
                </View>
                <View style={styles.messageRow}>
                    <Text
                        style={[styles.lastMessage, item.unreadCount > 0 && styles.unreadMessage]}
                        numberOfLines={1}
                    >
                        {item.lastMessage}
                    </Text>
                    {item.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <Text style={styles.title}>Mesajlar</Text>

            {conversations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Henüz mesajınız yok</Text>
                    <Text style={styles.emptySubtext}>
                        Kullanıcı profillerinden mesaj göndermeye başlayın
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderConversation}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                        />
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        color: COLORS.text,
        fontSize: FONT_SIZES.xxl,
        fontWeight: 'bold',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
    },
    list: {
        paddingHorizontal: SPACING.md,
    },
    conversationItem: {
        flexDirection: 'row',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.secondary,
        gap: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    conversationInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
    },
    time: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.sm,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMessage: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.sm,
        flex: 1,
    },
    unreadMessage: {
        color: COLORS.text,
        fontWeight: '500',
    },
    unreadBadge: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadCount: {
        color: COLORS.text,
        fontSize: FONT_SIZES.xs,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    emptyText: {
        color: COLORS.text,
        fontSize: FONT_SIZES.lg,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtext: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
        textAlign: 'center',
    },
});