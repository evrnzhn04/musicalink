import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, FlatList, Touchable, Dimensions } from 'react-native';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DefaultProfilePhoto } from '../../components/profile/DefaultProfilePhoto';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Entypo';
import { ProfileSong, TopArtist } from '../../types/spotify.types';
import { SongSearchModal } from '../../components/profile/SongSearchModal';
import { addProfileSong, deleteProfileSong, getProfileSongs } from '../../services/profileService';
import { getTopArtists } from '../../services/spotifyService';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SongActionSheet } from '../../components/profile/SongActionSheet';
import { EditProfileScreen } from '../../components/profile/EditProfileScreen';
import { getFollowerCount, getFollowingCount } from '../../services/followService';

type RootStackParamList = {
    Followers: { userId: string };
    Following: { userId: string };
};

export function ProfileScreen() {
    const { logout, user } = useAuth();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [profileSongs, setProfileSongs] = useState<ProfileSong[]>([]);
    const [topArtists, setTopArtists] = useState<TopArtist[]>([]);
    const [isSongModalVisible, setIsSongModalVisible] = useState(false);
    const [isActionSheetVisible, setIsActionSheetVisible] = useState(false);
    const [selectedSong, setSelectedSong] = useState<ProfileSong | null>(null);
    const [isReplacing, setIsReplacing] = useState(false);
    const [editScreenVisible, setEditScreenVisible] = useState(false);
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    const openModal = () => {
        setIsSongModalVisible(true);
    };
    const closeModal = () => {
        setIsSongModalVisible(false);
    };

    const onSelectSong = async (song: ProfileSong) => {
        if (isReplacing && selectedSong) {
            // Eski şarkının order değerini koru
            const songWithOrder = { ...song, order: selectedSong.order };
            await deleteProfileSong(selectedSong.spotify_track_id);
            const success = await addProfileSong(user!.id, songWithOrder);
            if (success) {
                setProfileSongs(prev => prev.map(s =>
                    s.spotify_track_id === selectedSong.spotify_track_id ? songWithOrder : s
                ));
            }
            setIsReplacing(false);
            setSelectedSong(null);
        } else {
            // Yeni şarkı ekle - order = mevcut şarkı sayısı
            const songWithOrder = { ...song, order: profileSongs.length };
            const success = await addProfileSong(user!.id, songWithOrder);
            if (success) {
                setProfileSongs(prev => [...prev, songWithOrder]);
            }
        }
        closeModal();
    };

    const handleSongPress = (song: ProfileSong) => {
        setSelectedSong(song);
        setIsActionSheetVisible(true);
    };

    useEffect(() => {
        const getSongs = async () => {
            try {
                const songs = await getProfileSongs(user?.id!)
                setProfileSongs(songs);
            } catch (error) {
                console.error('Fetch Profile songs error(ProfileScreen):', error);
                setProfileSongs([]);
            }
        }
        const fetchTopArtists = async () => {
            const artists = await getTopArtists(5);
            setTopArtists(artists);
        }
        getSongs()
        fetchTopArtists()
    }, []);

    useEffect(() => {
        const fetchFriendshipsCount = async () => {
            if (user?.id) {
                const followers = await getFollowerCount(user.id);
                const following = await getFollowingCount(user.id);
                setFollowerCount(followers);
                setFollowingCount(following);
            }
        };

        fetchFriendshipsCount();
    }, [user])

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <LinearGradient
                colors={[COLORS.primaryGradiendProfile, COLORS.background]}
                locations={[0, 0.5]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ flex: 1 }}
            >
                <SongSearchModal visible={isSongModalVisible} onClose={closeModal} onSelectSong={onSelectSong} />
                <EditProfileScreen visible={editScreenVisible} onClose={() => setEditScreenVisible(false)} />
                <View style={[styles.container, { paddingTop: insets.top }]}>
                    <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: insets.bottom + 20 }}
                        showsVerticalScrollIndicator={false}>
                        {/**Photo Area */}
                        <View style={styles.photoArea}>
                            {user?.avatar_url ? (<Image source={{ uri: user?.avatar_url }} style={styles.profilePhoto} />)
                                : (<DefaultProfilePhoto />)}
                        </View>

                        {/**Bio Area */}
                        <View style={styles.bioArea}>
                            <Text style={styles.textName}>{user?.display_name}</Text>
                            <Text style={styles.textUserName}>@{user?.username}</Text>

                            <Text style={styles.textBio}>{user?.bio}</Text>
                        </View>

                        {/**Friendship Area */}
                        <View style={styles.friendshipArea}>
                            <TouchableOpacity
                                style={{ justifyContent: 'center', alignItems: 'center', gap: 5 }}
                                onPress={() => user?.id && navigation.navigate('Following', { userId: user.id })}
                                activeOpacity={0.7}
                            >
                                <Text style={{ fontWeight: 'bold', color: COLORS.text, fontSize: 18 }}>{followingCount}</Text>
                                <Text style={{ fontWeight: 'bold', color: COLORS.textSecondary }}>TAKİP</Text>
                            </TouchableOpacity>
                            <View style={{ height: 30, width: 1, backgroundColor: COLORS.textSecondary }} />
                            <TouchableOpacity
                                style={{ justifyContent: 'center', alignItems: 'center', gap: 5 }}
                                onPress={() => user?.id && navigation.navigate('Followers', { userId: user.id })}
                                activeOpacity={0.7}
                            >
                                <Text style={{ fontWeight: 'bold', color: COLORS.text, fontSize: 18 }}>{followerCount}</Text>
                                <Text style={{ fontWeight: 'bold', color: COLORS.textSecondary }}>TAKİPÇİ</Text>
                            </TouchableOpacity>
                        </View>

                        {/**Edit Area */}
                        <View style={styles.editArea}>
                            <TouchableOpacity style={{
                                borderWidth: 1, borderColor: COLORS.textSecondary, backgroundColor: COLORS.background,
                                paddingHorizontal: 40, paddingVertical: 5, borderRadius: 30
                            }}
                                activeOpacity={0.6} onPress={() => setEditScreenVisible(true)}
                            >
                                <Text style={{ color: COLORS.textSecondary, fontWeight: 'bold', fontSize: FONT_SIZES.lg }}>Düzenle</Text>
                            </TouchableOpacity>
                        </View>

                        {/**Liked Songs Area */}
                        <View style={styles.likedSongsArea}>
                            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ color: COLORS.text, fontSize: FONT_SIZES.lg, fontWeight: 'bold' }}>Profil Şarkıların</Text>
                                <Text style={{ color: COLORS.text, fontSize: FONT_SIZES.md, fontWeight: 'bold' }}>{profileSongs.length}/4</Text>
                            </View>

                            {profileSongs.length === 0 ? (
                                <TouchableOpacity onPress={openModal} activeOpacity={0.9} style={{ width: '100%' }}>
                                    <View style={styles.emptySongsContainer}>
                                        <Icon name='music' color={COLORS.textSecondary} size={48} />
                                        <Text style={styles.emptyText}>Henüz şarkı eklemedin</Text>
                                        <Text style={styles.emptySubText}>Profiline en sevdiğin 4 şarkıyı ekle!</Text>
                                    </View>
                                </TouchableOpacity>
                            ) : (
                                <FlatList
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    data={[...profileSongs, ...Array(4 - profileSongs.length).fill({ type: 'add' })]}
                                    keyExtractor={(item, index) => item.spotify_track_id || `add-${index}`}
                                    renderItem={({ item }) => (
                                        item.type === 'add' ? (
                                            // + Kutusu
                                            <TouchableOpacity onPress={openModal} style={{ alignItems: 'center', marginRight: 15 }}>
                                                <View style={{ width: 120, height: 120, borderWidth: 1, borderColor: COLORS.textSecondary, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
                                                    <Icon name='plus' color={COLORS.textSecondary} size={32} />
                                                </View>
                                            </TouchableOpacity>
                                        ) : (
                                            // Şarkı kartı
                                            <TouchableOpacity onPress={() => handleSongPress(item)} style={{ marginRight: 15 }}>
                                                <Image
                                                    source={{ uri: item.album_image_url! }}
                                                    style={{ width: 120, height: 120, borderRadius: 10 }}
                                                />
                                                <Text style={{ color: COLORS.text, fontWeight: 'bold', width: 120, marginTop: 4 }}
                                                    numberOfLines={1}
                                                    ellipsizeMode="tail"
                                                >{item.track_name}</Text>
                                                <Text style={{ color: COLORS.textSecondary, fontWeight: 'bold', width: 120 }}
                                                    numberOfLines={1}
                                                    ellipsizeMode="tail"
                                                >{item.artist_name}</Text>
                                            </TouchableOpacity>
                                        )
                                    )}
                                    contentContainerStyle={{ paddingVertical: 10 }}
                                />
                            )}

                        </View>

                        {/* Top Sanatçılar */}
                        <View style={styles.likedSongsArea}>
                            <Text style={{ color: COLORS.text, fontSize: FONT_SIZES.lg, fontWeight: 'bold', marginBottom: 10 }}>
                                Top Sanatçıların
                            </Text>
                            {topArtists.length === 0 ? (
                                <Text style={{ color: COLORS.textSecondary }}>Yükleniyor...</Text>
                            ) : (
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
                                />
                            )}
                        </View>
                    </ScrollView>
                </View>
                <SongActionSheet
                    visible={isActionSheetVisible}
                    songName={selectedSong?.track_name || ''}
                    onClose={() => setIsActionSheetVisible(false)}
                    onReplace={() => {
                        setIsReplacing(true);
                        setIsActionSheetVisible(false);
                        openModal();
                    }}
                    onDelete={async () => {
                        if (selectedSong) {
                            await deleteProfileSong(selectedSong.spotify_track_id);
                            setProfileSongs(prev => prev.filter(s => s.spotify_track_id !== selectedSong.spotify_track_id));
                            setIsActionSheetVisible(false);
                        }
                    }}
                />
            </LinearGradient>

        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center' },
    photoArea: {
        width: '100%', minHeight: 50, justifyContent: 'center', alignItems: 'center',
        padding: 4
    },
    bioArea: {
        width: '90%', minHeight: 50, justifyContent: 'center', alignItems: 'center',
        marginTop: SPACING.xs
    },
    friendshipArea: {
        width: '100%', minHeight: 50, padding: 4, marginTop: SPACING.lg,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20,
    },
    editArea: {
        flexDirection: 'row', gap: 10, marginTop: SPACING.md,
    },
    likedSongsArea: {
        width: '100%', paddingHorizontal: 20, marginTop: SPACING.md, gap: 4,
    },
    emptySongsContainer: {
        width: '100%',
        minHeight: 120,  // sabit minimum
        padding: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.textSecondary,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md },
    emptySubText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
    textName: { color: COLORS.text, fontSize: FONT_SIZES.xxl, fontWeight: 'bold' },
    textUserName: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md },
    textBio: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md, marginTop: SPACING.lg, textAlign: 'center' },
    profilePhoto: { width: 150, height: 150, borderRadius: 75 }
});