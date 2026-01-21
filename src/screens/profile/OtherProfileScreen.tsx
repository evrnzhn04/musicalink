import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DefaultProfilePhoto } from '../../components/profile/DefaultProfilePhoto';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { ProfileSong, TopArtist } from '../../types/spotify.types';
import { getProfileSongs, getTopArtistsFromDB, getProfileBySupabaseId } from '../../services/profileService';
import { getFollowerCount, getFollowingCount, followUser, unfollowUser, getFollowStatus } from '../../services/followService';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile } from '../../types/auth.types';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

type OtherProfileRouteParams = {
    OtherProfile: {
        userId?: string;
        profile?: UserProfile;
    };
};

export function OtherProfileScreen() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<OtherProfileRouteParams, 'OtherProfile'>>();
    const params = route.params;

    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(params.profile || null);
    const [profileSongs, setProfileSongs] = useState<ProfileSong[]>([]);
    const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(true);

    useEffect(() => {
        const initData = async () => {
            setIsPageLoading(true);
            try {
                let targetProfile = currentProfile;

                // 1. Profil datası yoksa (id ile gelindiyse) çek
                if (!targetProfile && params.userId) {
                    const fetched = await getProfileBySupabaseId(params.userId);
                    if (fetched) {
                        targetProfile = fetched;
                        setCurrentProfile(fetched);
                    }
                }

                if (!targetProfile) {
                    setIsPageLoading(false);
                    return; // Hata veya bulunamadı
                }

                // 2. Diğer verileri çek
                const [songs, followers, following, artists] = await Promise.all([
                    getProfileSongs(targetProfile.id),
                    getFollowerCount(targetProfile.id),
                    getFollowingCount(targetProfile.id),
                    getTopArtistsFromDB(targetProfile.id)
                ]);

                setProfileSongs(songs);
                setFollowerCount(followers);
                setFollowingCount(following);
                setTopArtists(artists);

                // 3. Takip durumu
                if (user?.id) {
                    const status = await getFollowStatus(user.id, targetProfile.id);
                    setIsFollowing(status === 'following');
                }

            } catch (error) {
                console.error('OtherProfile init error:', error);
            } finally {
                setIsPageLoading(false);
            }
        };

        initData();
    }, [params.userId, params.profile, user?.id]);

    const handleFollowPress = async () => {
        if (!user?.id || isLoading || !currentProfile) return;

        setIsLoading(true);

        // Optimistic update - önce UI'ı güncelle
        const wasFollowing = isFollowing;
        setIsFollowing(!wasFollowing);
        setFollowerCount(prev => wasFollowing ? prev - 1 : prev + 1);

        const success = wasFollowing
            ? await unfollowUser(user.id, currentProfile.id)
            : await followUser(user.id, currentProfile.id);

        // Hata varsa geri al
        if (!success) {
            setIsFollowing(wasFollowing);
            setFollowerCount(prev => wasFollowing ? prev + 1 : prev - 1);
        }

        setIsLoading(false);
    };

    const handleMessagePress = () => {
        if (!currentProfile) return;
        (navigation as any).navigate('Chat', {
            otherUser: {
                id: currentProfile.id,
                username: currentProfile.username,
                display_name: currentProfile.display_name,
                avatar_url: currentProfile.avatar_url
            }
        });
    };

    if (isPageLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <Text style={{ color: COLORS.text }}>Yükleniyor...</Text>
            </View>
        );
    }

    if (!currentProfile) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <Text style={{ color: COLORS.text }}>Kullanıcı bulunamadı.</Text>
            </View>
        );
    }

    return (
        <LinearGradient
            colors={[COLORS.primaryGradiendProfile, COLORS.background]}
            locations={[0, 0.5]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ flex: 1 }}
        >
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Back Button */}
                <TouchableOpacity
                    style={[styles.backButton, { top: insets.top + 10 }]}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={28} color={COLORS.text} />
                </TouchableOpacity>

                <ScrollView
                    contentContainerStyle={{ alignItems: 'center', paddingBottom: insets.bottom + 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Photo Area */}
                    <View style={styles.photoArea}>
                        {currentProfile.avatar_url ? (
                            <Image source={{ uri: currentProfile.avatar_url }} style={styles.profilePhoto} />
                        ) : (
                            <DefaultProfilePhoto />
                        )}
                    </View>

                    {/* Bio Area */}
                    <View style={styles.bioArea}>
                        <Text style={styles.textName}>{currentProfile.display_name}</Text>
                        <Text style={styles.textUserName}>@{currentProfile.username}</Text>
                        {currentProfile.bio && (
                            <Text style={styles.textBio}>{currentProfile.bio}</Text>
                        )}
                    </View>

                    {/* Friendship Area */}
                    <View style={styles.friendshipArea}>
                        <View style={{ justifyContent: 'center', alignItems: 'center', gap: 5 }}>
                            <Text style={{ fontWeight: 'bold', color: COLORS.text, fontSize: 18 }}>{followingCount}</Text>
                            <Text style={{ fontWeight: 'bold', color: COLORS.textSecondary }}>TAKİP</Text>
                        </View>
                        <View style={{ height: 30, width: 1, backgroundColor: COLORS.textSecondary }} />
                        <View style={{ justifyContent: 'center', alignItems: 'center', gap: 5 }}>
                            <Text style={{ fontWeight: 'bold', color: COLORS.text, fontSize: 18 }}>{followerCount}</Text>
                            <Text style={{ fontWeight: 'bold', color: COLORS.textSecondary }}>TAKİPÇİ</Text>
                        </View>
                    </View>

                    {/* Follow & Message Buttons */}
                    <View style={styles.followArea}>
                        <TouchableOpacity
                            style={[
                                styles.followButton,
                                isFollowing && styles.followingButton
                            ]}
                            activeOpacity={0.6}
                            onPress={handleFollowPress}
                            disabled={isLoading}
                        >
                            <Text style={[
                                styles.followButtonText,
                                isFollowing && styles.followingButtonText
                            ]}>
                                {isFollowing ? 'Takip Ediliyor' : 'Takip Et'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.messageButton}
                            activeOpacity={0.6}
                            onPress={handleMessagePress}
                        >
                            <Icon name="chatbubble-outline" size={25} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Profile Songs Area */}
                    {profileSongs.length > 0 && (
                        <View style={styles.songsArea}>
                            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={styles.sectionTitle}>Profil Şarkıları</Text>
                                <Text style={{ color: COLORS.text, fontSize: FONT_SIZES.md, fontWeight: 'bold' }}></Text>
                            </View>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={profileSongs}
                                keyExtractor={(item) => item.spotify_track_id}
                                renderItem={({ item }) => (
                                    <View style={{ marginRight: 15 }}>
                                        <Image
                                            source={{ uri: item.album_image_url! }}
                                            style={{ width: 120, height: 120, borderRadius: 10 }}
                                        />
                                        <Text style={styles.songName} numberOfLines={1} ellipsizeMode="tail">
                                            {item.track_name}
                                        </Text>
                                        <Text style={styles.artistName} numberOfLines={1} ellipsizeMode="tail">
                                            {item.artist_name}
                                        </Text>
                                    </View>
                                )}
                                contentContainerStyle={{ paddingVertical: 10 }}
                            />
                        </View>
                    )}

                    {/* Top Artists Area */}
                    {topArtists.length > 0 && (
                        <View style={styles.songsArea}>
                            <Text style={styles.sectionTitle}>Top Sanatçıları</Text>
                            <FlatList
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                data={topArtists}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <View style={{ alignItems: 'center', marginRight: 15 }}>
                                        <Image
                                            source={{ uri: item.imageUrl }}
                                            style={{ width: 80, height: 80, borderRadius: 40 }}
                                        />
                                        <Text style={{ color: COLORS.text, marginTop: 5, width: 80, textAlign: 'center' }}
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                        >{item.name}</Text>
                                    </View>
                                )}
                                contentContainerStyle={{ paddingVertical: 10 }}
                            />
                        </View>
                    )}
                </ScrollView>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center'
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 10,
        padding: 8,
    },
    photoArea: {
        width: '100%',
        minHeight: 50,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
        marginTop: 40,
    },
    bioArea: {
        width: '90%',
        minHeight: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: SPACING.xs
    },
    friendshipArea: {
        width: '100%',
        minHeight: 50,
        padding: 4,
        marginTop: SPACING.lg,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 20,
    },
    followArea: {
        flexDirection: 'row',
        gap: 10,
        marginTop: SPACING.md,
    },
    followButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 40,
        paddingVertical: 10,
        borderRadius: 30,
    },
    messageButton: {
        backgroundColor: COLORS.secondary,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: COLORS.textSecondary,
    },
    followingButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.textSecondary,
    },
    followButtonText: {
        color: COLORS.text,
        fontWeight: 'bold',
        fontSize: FONT_SIZES.lg,
    },
    followingButtonText: {
        color: COLORS.textSecondary,
    },
    songsArea: {
        width: '100%',
        paddingHorizontal: 20,
        marginTop: SPACING.lg,
        gap: 4,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: FONT_SIZES.lg,
        fontWeight: 'bold',
    },
    songName: {
        color: COLORS.text,
        fontWeight: 'bold',
        width: 120,
        marginTop: 4,
    },
    artistName: {
        color: COLORS.textSecondary,
        fontWeight: 'bold',
        width: 120,
    },
    textName: {
        color: COLORS.text,
        fontSize: FONT_SIZES.xxl,
        fontWeight: 'bold'
    },
    textUserName: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md
    },
    textBio: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
        marginTop: SPACING.lg,
        textAlign: 'center'
    },
    profilePhoto: {
        width: 150,
        height: 150,
        borderRadius: 75
    },
});
