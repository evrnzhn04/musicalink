import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS, FONT_SIZES } from '../../utils/constants';

interface SpotifyPlayModalProps {
    visible: boolean;
    onClose: () => void;
    onShufflePlay: () => void;
    trackData?: {
        name: string;
        artist: string;
        image: string;
    };
}

export function SpotifyPlayModal({
    visible,
    onClose,
    onShufflePlay,
    trackData,
}: SpotifyPlayModalProps) {
    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Icon name="workspace-premium" size={65} color={COLORS.primary} />
                    <Text style={styles.modalHeader}>Spotify Premium Gerekli!</Text>

                    {trackData && (
                        <View style={styles.trackPreview}>
                            <Image source={{ uri: trackData.image }} style={styles.trackImage} />
                            <View style={styles.trackInfo}>
                                <Text style={styles.trackName} numberOfLines={1}>{trackData.name}</Text>
                                <Text style={styles.trackArtist} numberOfLines={1}>{trackData.artist}</Text>
                            </View>
                        </View>
                    )}

                    <Text style={styles.modalText}>
                        Bu şarkıyı arka planda çalmak için Spotify Premium gerekli.
                    </Text>

                    <TouchableOpacity onPress={onShufflePlay} style={styles.shuffleButton}>
                        <Icon name="shuffle" size={20} color="#000" />
                        <Text style={styles.shuffleButtonText}>Karışık Çalmaya Devam Et</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                        <Text style={styles.cancelButtonText}>İptal</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    modalContent: {
        backgroundColor: COLORS.background,
        width: '90%',
        padding: 30,
        borderRadius: 20,
        gap: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalHeader: {
        color: COLORS.text,
        fontSize: FONT_SIZES.xxl,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
        textAlign: 'center',
    },
    trackPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 12,
        borderRadius: 12,
        width: '100%',
        gap: 12,
    },
    trackImage: {
        width: 50,
        height: 50,
        borderRadius: 6,
    },
    trackInfo: {
        flex: 1,
    },
    trackName: {
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
    },
    trackArtist: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.sm,
    },
    shuffleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 14,
        backgroundColor: COLORS.primary,
        borderRadius: 25,
        width: '100%',
        marginTop: 8,
    },
    shuffleButtonText: {
        color: '#000',
        fontSize: FONT_SIZES.md,
        fontWeight: 'bold',
    },
    cancelButton: {
        paddingVertical: 12,
    },
    cancelButtonText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
    },
});
