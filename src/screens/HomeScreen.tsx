import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS } from '../utils/constants';
import { useAuth } from '../contexts/AuthContext';
import { SpotifyUser } from '../types/auth.types';
import { getSpotifyProfile } from '../services/spotifyService';
import { DefaultProfilePhoto } from '../components/profile/DefaultProfilePhoto';
import { CurrentTrackArea } from '../components/music/CurrentTrackArea';
import { testLocalNotification } from '../services/notificationService';

export function HomeScreen() {
    const { logout, user } = useAuth();
    const [userProfile, setUserProfile] = useState<SpotifyUser | null>(null);


    useEffect(() => {
        const getProfile = async () => {
            try {
                const profile = await getSpotifyProfile();
                setUserProfile(profile);
            } catch (error) {
                console.log('Get Profile Error: ', error);
                setUserProfile(null);
            }
        }

        getProfile();
    }, []);
    return (
        <View style={styles.container}>
            {userProfile?.avatarUrl ? (
                <Image source={{ uri: user?.avatar_url! }} style={{ width: 200, height: 200, borderRadius: 100 }} />
            ) : (
                <DefaultProfilePhoto />
            )}
            <Text style={styles.title}>Hoş Geldin, {user?.display_name}</Text>
            <Text style={styles.subtitle}>Giriş Başarılı 🎉</Text>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Çıkış Yap</Text>
            </TouchableOpacity>

            <CurrentTrackArea />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    subtitle: {
        fontSize: 18,
        color: COLORS.textSecondary,
        marginTop: 10,
    },
    logoutButton: {
        marginTop: 40,
        backgroundColor: COLORS.error,
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 20,
    },
    logoutText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});