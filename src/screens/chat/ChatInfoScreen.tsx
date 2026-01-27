import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';
import { DefaultProfilePhoto } from '../../components/profile/DefaultProfilePhoto';

type ChatInfoRouteParams = {
    ChatInfo: {
        otherUser: {
            id: string;
            username: string;
            display_name: string;
            avatar_url: string | null;
        };
    };
};

export function ChatInfoScreen() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<ChatInfoRouteParams, 'ChatInfo'>>();
    const { otherUser } = route.params;
    const insets = useSafeAreaInsets();

    return (
        <LinearGradient
            colors={[COLORS.primaryGradiendProfile, COLORS.background]}
            locations={[0, 0.5]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.container, { paddingTop: insets.top }]}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Sohbet Bilgisi</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* User Info */}
            <View style={styles.userSection}>
                {otherUser.avatar_url ? (
                    <Image source={{ uri: otherUser.avatar_url }} style={styles.avatar} />
                ) : (
                    <DefaultProfilePhoto size={100} />
                )}
                <Text style={styles.displayName}>{otherUser.display_name}</Text>
                <Text style={styles.username}>@{otherUser.username}</Text>
            </View>

            {/* Actions */}
            <View style={styles.actionsSection}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => (navigation as any).navigate('OtherProfile', { userId: otherUser.id })}
                >
                    <Icon name="person-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.actionText}>Profili Görüntüle</Text>
                    <Icon name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                    <Icon name="notifications-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.actionText}>Bildirimleri Sessize Al</Text>
                    <Icon name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionButton, styles.dangerButton]}>
                    <Icon name="ban-outline" size={24} color="#FF4444" />
                    <Text style={[styles.actionText, styles.dangerText]}>Kullanıcıyı Engelle</Text>
                    <Icon name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: FONT_SIZES.lg,
        fontWeight: '600',
    },
    userSection: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    displayName: {
        color: '#FFF',
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    username: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
    },
    actionsSection: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        gap: 12,
    },
    actionText: {
        flex: 1,
        color: '#FFF',
        fontSize: FONT_SIZES.md,
    },
    dangerButton: {
        marginTop: 24,
    },
    dangerText: {
        color: '#FF4444',
    },
});
