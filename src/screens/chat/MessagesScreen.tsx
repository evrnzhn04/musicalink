import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { getConversations, ConversationPreview, deleteConversation } from '../../services/messageService';
import { DefaultProfilePhoto } from '../../components/profile/DefaultProfilePhoto';
import { DeleteConversationModal } from '../../components/chat/DeleteConversationModal';
import { getFollowers, getFollowing } from '../../services/followService';
import { supabase } from '../../api/supabase';

export function MessagesScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const { user } = useAuth();

    const [conversations, setConversations] = useState<ConversationPreview[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [selectedConv, setSelectedConv] = useState<ConversationPreview | null>(null);

    const loadConversations = useCallback(async () => {
        if (!user?.id) return;

        const convos = await getConversations(user.id);
        setConversations(convos);
        setIsLoading(false);
        setIsRefreshing(false);
    }, [user?.id]);

    const loadFriends = useCallback(async () => {
        if (!user?.id) return;

        // Followers ve Following'i birleştir (benzersiz kullanıcılar)
        const [followers, following] = await Promise.all([
            getFollowers(user.id),
            getFollowing(user.id)
        ]);

        // Benzersiz friend listesi oluştur
        const friendsMap = new Map();
        [...followers, ...following].forEach(friend => {
            if (friend && friend.id !== user.id) {
                friendsMap.set(friend.id, friend);
            }
        });

        // Mesajlaşılan kullanıcıların ID'lerini al
        const conversationUserIds = new Set(
            conversations.map(conv => conv.otherUser.id)
        );

        // Sadece mesajlaşılmayanları filtrele
        const filteredFriends = Array.from(friendsMap.values()).filter(
            friend => !conversationUserIds.has(friend.id)
        );

        setFriends(filteredFriends);
    }, [user?.id, conversations]);

    const loadAll = useCallback(async () => {
        await Promise.all([loadConversations(), loadFriends()]);
    }, [loadConversations, loadFriends]);

    // Sayfa odaklandığında yenile
    useFocusEffect(
        useCallback(() => {
            loadAll();
        }, [loadAll])
    );

    // Realtime subscription - yeni mesaj gelince listeyi güncelle
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel('messages_list')
            .on(
                'postgres_changes',
                {
                    event: '*', // INSERT, UPDATE, DELETE - tüm değişiklikleri dinle
                    schema: 'public',
                    table: 'messages',
                },
                () => {
                    // Herhangi bir değişiklik olduğunda listeyi yenile
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

    const handleDeleteConversation = (conv: ConversationPreview) => {
        setSelectedConv(conv);
        setDeleteModalVisible(true);
    };

    const handleConfirmDelete = async (deleteForBoth: boolean) => {
        if (!selectedConv || !user?.id) return;

        console.log('🗑️ Sohbet siliniyor:', selectedConv.id, 'DeleteForBoth:', deleteForBoth);

        const success = await deleteConversation(selectedConv.id, deleteForBoth, user.id);

        console.log('🗑️ Silme sonucu:', success);

        if (success) {
            setDeleteModalVisible(false);

            // Eğer kullanıcı şu anda silinen sohbetin ChatScreen'indeyse, geri git
            const navState = (navigation as any).getState();
            const currentRoute = navState?.routes[navState.index];

            if (currentRoute?.name === 'Chat' && currentRoute?.params?.otherUser?.id === selectedConv.otherUser.id) {
                console.log('📴 Silinen sohbet açık, ChatScreen kapanıyor');
                (navigation as any).goBack();
            }

            setSelectedConv(null);
            // Listeyi yenile
            await loadAll();
            console.log('✅ Liste yenilendi');
        } else {
            console.error('❌ Silme başarısız!');
        }
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
            onLongPress={() => handleDeleteConversation(item)}
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

    const renderFriend = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.friendItem}
            onPress={() => {
                (navigation as any).navigate('Chat', {
                    otherUser: item
                });
            }}
        >
            {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
                <DefaultProfilePhoto size={50} />
            )}

            <View style={styles.friendInfo}>
                <Text style={styles.userName}>{item.display_name}</Text>
                <Text style={styles.username}>@{item.username}</Text>
            </View>

            <TouchableOpacity style={styles.messageButton} onPress={() => {
                (navigation as any).navigate('Chat', {
                    otherUser: item
                });
            }}>
                <Text style={styles.messageButtonText}>Mesaj At</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderSectionHeader = ({ section }: any) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
    );

    // SectionList için veri hazırla
    const sections = [];

    if (conversations.length > 0) {
        sections.push({
            title: 'Mesajlar',
            data: conversations,
            renderItem: renderConversation
        });
    }

    if (friends.length > 0) {
        sections.push({
            title: 'Arkadaşlar',
            data: friends,
            renderItem: renderFriend
        });
    }

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

            {sections.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Henüz mesajınız yok</Text>
                    <Text style={styles.emptySubtext}>
                        Kullanıcı profillerinden mesaj göndermeye başlayın
                    </Text>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item, index) => item.id || `friend-${index}`}
                    renderItem={({ item, section }) => section.renderItem({ item })}
                    renderSectionHeader={renderSectionHeader}
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

            <DeleteConversationModal
                visible={deleteModalVisible}
                userName={selectedConv?.otherUser.display_name || ''}
                onCancel={() => setDeleteModalVisible(false)}
                onConfirm={handleConfirmDelete}
            />
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
    sectionHeader: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.background,
    },
    sectionTitle: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.sm,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    friendItem: {
        flexDirection: 'row',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.secondary,
        alignItems: 'center',
        gap: 12,
    },
    friendInfo: {
        flex: 1,
    },
    username: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.sm,
        marginTop: 2,
    },
    messageButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    messageButtonText: {
        color: '#FFF',
        fontSize: FONT_SIZES.sm,
        fontWeight: '600',
    },
});