import { useEffect, useState } from "react";
import { CurrentTrack } from "../../types/spotify.types";
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getCurrentlyPlaying, pausePlayback, resumePlayback, skipToNext, skipToPrevious } from "../../services/spotifyService";
import { COLORS, FONT_SIZES } from "../../utils/constants";
import { useAuth } from "../../contexts/AuthContext";
import Icon from 'react-native-vector-icons/Ionicons';
import PremiumIcon from 'react-native-vector-icons/MaterialIcons';

export function CurrentTrackArea() {
    const [currentTrack, setCurrentTrack] = useState<CurrentTrack | null>(null);
    const { spotifyUser } = useAuth();
    const isPremium = spotifyUser?.isPremium ?? false;
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    const handleControl = async (action: () => Promise<boolean>) => {
        if (!isPremium) {
            setShowPremiumModal(true);
            return;
        }

        await action();
        const track = await getCurrentlyPlaying();
        setCurrentTrack(track);
    }

    useEffect(() => {
        const fetchCurrentTrack = async () => {
            try {
                const track = await getCurrentlyPlaying();
                setCurrentTrack(track);
            } catch (error) {
                console.error('Fetch current track error (CurrentTrackArea):', error);
            }
        }

        fetchCurrentTrack();

        const interval = setInterval(fetchCurrentTrack, 15000);
        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        if (currentTrack && currentTrack.isPlaying) {
            const remaining = currentTrack.durationMs - currentTrack.progressMs;

            // Şarkı 1 saniye içinde bitecekse bekle, sonra kontrol et
            if (remaining > 0) {
                const timeout = setTimeout(async () => {
                    const track = await getCurrentlyPlaying();
                    setCurrentTrack(track);
                }, remaining + 1000);

                return () => clearTimeout(timeout);
            }
        }
    }, [currentTrack]);
    return currentTrack ? (
        <View style={styles.area}>
            <View style={{ flexDirection: 'row', gap: 10, flex: 3 }}>
                <Image source={{ uri: currentTrack?.albumImage }} style={{ width: 40, height: 40, borderRadius: 5 }} />
                <View>
                    <Text style={styles.currentName} numberOfLines={1}>{currentTrack?.name}</Text>
                    <Text style={styles.currentArtist} numberOfLines={1}>{currentTrack?.artist}</Text>
                </View>
            </View>

            <View style={styles.controlBtnArea}>
                {/**Go back */}
                <TouchableOpacity
                    onPress={() => handleControl(skipToPrevious)}
                >
                    <Icon name="play-skip-back" size={FONT_SIZES.xl} color={isPremium === true ? COLORS.text : COLORS.textSecondary} />
                </TouchableOpacity>

                {/**Pause/Play */}
                <TouchableOpacity
                    onPress={() => handleControl(currentTrack.isPlaying ? pausePlayback : resumePlayback)}
                >
                    <Icon name={currentTrack.isPlaying ? "pause" : "play"} size={FONT_SIZES.xl} color={isPremium === true ? COLORS.text : COLORS.textSecondary} />
                </TouchableOpacity>

                {/**Go next */}
                <TouchableOpacity
                    onPress={() => handleControl(skipToNext)}
                >
                    <Icon name="play-skip-forward" size={FONT_SIZES.xl} color={isPremium === true ? COLORS.text : COLORS.textSecondary} />
                </TouchableOpacity>
            </View>

            <Modal visible={showPremiumModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <PremiumIcon name="workspace-premium" size={65} color={COLORS.primary} />
                        <Text style={styles.modalHeader}>Spotify Premium Gerekli!</Text>
                        <Text style={styles.modalText}>Bu özellik için Spotify Premium gerekli!</Text>
                        <TouchableOpacity onPress={() => setShowPremiumModal(false)} style={styles.modalButton}>
                            <Text style={styles.modalButtonText}>Tamam</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </View>
    ) : (null)

}

const styles = StyleSheet.create({
    area: {
        width: '95%', flexDirection: 'row', padding: 8, backgroundColor: COLORS.primaryGradiendProfile,
        borderRadius: 10, position: 'absolute', bottom: 10, gap: 10
    },
    currentName: {
        color: COLORS.text, fontWeight: 'bold'
    },
    currentArtist: {
        color: COLORS.text,
    },
    controlBtnArea: {
        flexDirection: 'row', alignItems: "center", gap: 5,
        height: '100%', //backgroundColor: 'gray',
    },
    modalOverlay: {
        alignItems: 'center', justifyContent: 'center', flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)'
    },
    modalContent: {
        backgroundColor: COLORS.background, maxWidth: '90%',
        padding: 30, borderRadius: 20, gap: 20,
        alignItems: 'center', justifyContent: 'center',
        //borderWidth: 2, borderColor: COLORS.textSecondary
    },
    modalHeader: {
        color: COLORS.text, fontSize: FONT_SIZES.xxl, fontWeight: 'bold',
        textAlign: 'center'
    },
    modalText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md, fontWeight: 'bold' },
    modalButton: {
        alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 80, paddingVertical: 10,
        backgroundColor: COLORS.primary, borderRadius: 20,
        width: '90%', marginTop: 10
    },
    modalButtonText: { color: COLORS.background, fontSize: FONT_SIZES.lg, fontWeight: 'bold' },

})