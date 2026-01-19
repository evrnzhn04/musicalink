import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';
import { ProfileSong } from '../../types/spotify.types';
import { searchTracks } from '../../services/spotifyService';

interface SongSearchModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectSong: (song: ProfileSong) => void;
}

export function SongSearchModal({ visible, onClose, onSelectSong }: SongSearchModalProps) {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<ProfileSong[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSearch = async (): Promise<void> => {
        try {
            setIsLoading(true);
            const response = await searchTracks(searchQuery);
            setSearchResults(response);
        } catch (error) {
            console.error('handleSearch Error:', error);
            return;
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.length >= 2) {
                handleSearch();
            }

        }, 500);

        return () => clearTimeout(timer)
    }, [searchQuery])
    useEffect(() => {
        if (!visible) {
            setSearchQuery('');
            setSearchResults([]);
        }
    }, [visible]);
    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Şarkı Ara</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Icon name="close" size={28} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                {/* Search Input */}
                <TextInput
                    style={styles.searchInput}
                    placeholder="Şarkı veya sanatçı ara..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                />

                {/* Results */}
                <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.songItem} onPress={() => onSelectSong(item)}>
                            <Image source={{ uri: item.album_image_url }} style={styles.albumCover} />
                            <View style={styles.songInfo}>
                                <Text style={styles.songName}>{item.track_name}</Text>
                                <Text style={styles.artistName}>{item.artist_name}</Text>
                            </View>
                            <Icon name="add-circle" size={28} color={COLORS.primary} />
                        </TouchableOpacity>
                    )}
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.md },
    headerTitle: { color: COLORS.text, fontSize: FONT_SIZES.xl, fontWeight: 'bold' },
    searchInput: { backgroundColor: '#2A2A2A', color: COLORS.text, padding: SPACING.md, margin: SPACING.md, borderRadius: 8 },
    songItem: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
    albumCover: { width: 50, height: 50, borderRadius: 4 },
    songInfo: { flex: 1, marginLeft: SPACING.md },
    songName: { color: COLORS.text, fontSize: FONT_SIZES.md, fontWeight: 'bold' },
    artistName: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
});