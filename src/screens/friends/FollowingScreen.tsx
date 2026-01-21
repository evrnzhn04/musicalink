import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';
import { DefaultProfilePhoto } from '../../components/profile/DefaultProfilePhoto';
import { getFollowing } from '../../services/followService';

interface UserProfile {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
}

type RootStackParamList = {
    Following: { userId: string };
    OtherProfile: { userId: string };
};

export function FollowingScreen() {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProp<RootStackParamList, 'Following'>>();
    const { userId } = route.params;

    const [following, setFollowing] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadFollowing = async () => {
            setIsLoading(true);
            const data = await getFollowing(userId);
            setFollowing(data);
            setIsLoading(false);
        };
        loadFollowing();
    }, [userId]);

    const renderUser = ({ item }: { item: UserProfile }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() => navigation.navigate('OtherProfile', { userId: item.id })}
            activeOpacity={0.7}
        >
            {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
                <DefaultProfilePhoto size={50} />
            )}
            <View style={styles.userInfo}>
                <Text style={styles.displayName}>{item.display_name}</Text>
                <Text style={styles.username}>@{item.username}</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="chevron-back" size={28} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Takip Edilenler</Text>
                <View style={{ width: 28 }} />
            </View>

            {/* List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : following.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="people-outline" size={64} color={COLORS.textSecondary} />
                    <Text style={styles.emptyText}>Henüz kimseyi takip etmiyorsun</Text>
                </View>
            ) : (
                <FlatList
                    data={following}
                    keyExtractor={(item) => item.id}
                    renderItem={renderUser}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
    },
    headerTitle: {
        color: COLORS.text,
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: SPACING.md,
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
    },
    listContent: {
        padding: SPACING.md,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    userInfo: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    displayName: {
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
    },
    username: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.sm,
    },
});
