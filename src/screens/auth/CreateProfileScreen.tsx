import 'react-native-get-random-values';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from "react-native"
import { DefaultProfilePhoto } from "../../components/profile/DefaultProfilePhoto"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import React, { useState } from "react";
import { COLORS, SPACING } from "../../utils/constants";
import { launchImageLibrary } from 'react-native-image-picker'
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from "../../contexts/AuthContext";
import { checkUserNameAvailable, createProfile, uploadAvatar } from "../../services/profileService";


type FocusedField = 'userName' | 'name' | 'bio' | null;

export const CreateProfileScreen = () => {
    const insets = useSafeAreaInsets();
    const [focusedField, setFocusedField] = useState<FocusedField>(null);

    const { logout, spotifyUser, setHasProfile, setUser, supabaseUserId } = useAuth();
    const [userName, setUserName] = useState(spotifyUser?.displayName.toLowerCase() || '');
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [errors, setErrors] = useState<{ userName: boolean; name: boolean }>({
        userName: false,
        name: false
    });


    const [avatarUri, setAvatarUri] = useState<string | null>(null);

    const pickImage = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
        });

        if (result.assets && result.assets[0]?.uri) {
            setAvatarUri(result.assets[0].uri)
        }
    }

    const handleCreateProfile = async () => {

        console.log('=== HANDLE CREATE PROFILE ===');
        console.log('userName:', userName);
        console.log('name:', name);
        console.log('spotifyUser:', spotifyUser);

        const newErrors = {
            userName: !userName.trim(),
            name: !name.trim(),
        };
        setErrors(newErrors);
        console.log('Errors:', newErrors);

        if (newErrors.userName || newErrors.name) {
            console.log('Validation failed');
            return;
        }

        try {
            console.log('Checking username...');
            // 1. Username müsait mi?
            const isAvailable = await checkUserNameAvailable(userName);
            console.log('isAvailable:', isAvailable);
            if (!isAvailable) {
                console.log('Bu kullanıcı adı alınmış');
                setErrors(prev => ({ ...prev, userName: true }));
                return;
            }
            console.log('Creating profile...');

            // 2. Avatar yükle (kullanıcı seçtiyse)
            let finalAvatarUrl = spotifyUser?.avatarUrl || null;
            if (avatarUri) {
                const uploadedUrl = await uploadAvatar(spotifyUser!.id, avatarUri);
                if (uploadedUrl) {
                    finalAvatarUrl = uploadedUrl;
                }
            }

            // Supabase Auth ID kontrolü
            if (!supabaseUserId) {
                Alert.alert('Hata', 'Oturum bilgisi bulunamadı. Lütfen yeniden giriş yapın.');
                return;
            }

            // 3. Profil oluştur - artık supabaseUserId kullan
            const success = await createProfile({
                id: supabaseUserId,
                username: userName,
                display_name: name,
                bio: bio,
                avatar_url: finalAvatarUrl,
                spotify_id: spotifyUser!.id,
                email: spotifyUser?.email || '',
            });
            console.log('createProfile result:', success);

            if (success) {
                console.log('Profil oluşturuldu!');
                setUser({
                    id: supabaseUserId,
                    spotify_id: spotifyUser!.id,
                    username: userName,
                    display_name: name,
                    bio: bio,
                    avatar_url: finalAvatarUrl,
                    email: spotifyUser?.email || '',
                });
                setHasProfile(true);
            }
        } catch (error) {
            console.error('Profil oluşturma hatası:', error);
        }
    };
    return (
        <View style={[styles.screen, { paddingTop: insets.top }]}>
            <TouchableOpacity onPress={logout} style={{ position: 'absolute', top: 30, left: 20, zIndex: 10 }}>
                <Icon name="arrow-back" size={25} color={'white'} />
            </TouchableOpacity>
            <Image source={require('../../images/create3.png')} style={styles.image} />

            <View style={styles.changePhotoArea}>
                {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={{ width: 100, height: 100, borderRadius: 50 }} />
                ) : spotifyUser?.avatarUrl ? (
                    <Image source={{ uri: spotifyUser.avatarUrl }} style={{ width: 100, height: 100, borderRadius: 50 }} />
                ) : (
                    <DefaultProfilePhoto size={100} />
                )}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={pickImage}>
                    <Text style={{ color: COLORS.text, marginTop: 5 }}>Değiştir</Text>
                </TouchableOpacity>
                {avatarUri &&
                    <>
                        <Text style={{ color: 'white', marginTop: 5 }}>|</Text>
                        <TouchableOpacity onPress={() => setAvatarUri(null)}>
                            <Text style={{ color: COLORS.text, marginTop: 5 }}>Sıfırla</Text>
                        </TouchableOpacity>
                    </>
                }
            </View>

            {/**Username */}
            <TextInput
                style={[
                    styles.input,
                    focusedField === 'userName' && styles.inputFocused,
                    errors.userName && styles.inputError  // ← Error stili
                ]}
                placeholder="Kullanıcı ismi"
                placeholderTextColor="#888888"
                onFocus={() => setFocusedField('userName')}
                onBlur={() => setFocusedField(null)}
                underlineColorAndroid="transparent"
                autoCapitalize="none"
                value={userName}
                onChangeText={(text) => {
                    setUserName(text.toLowerCase());
                    if (text.trim()) setErrors(prev => ({ ...prev, userName: false }));  // ← Hata temizle
                }}
            />
            <TextInput
                style={[
                    styles.input,
                    focusedField === 'name' && styles.inputFocused,
                    errors.name && styles.inputError
                ]}
                placeholder="İsim"
                placeholderTextColor="#888888"
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                underlineColorAndroid="transparent"
                value={name}
                onChangeText={(text) => {
                    setName(text);
                    if (text.trim()) setErrors(prev => ({ ...prev, name: false }));
                }}
            />
            <TextInput
                style={[
                    styles.input,
                    focusedField === 'bio' && styles.inputFocused, { maxHeight: 100 }
                ]}
                placeholder="Kendinden bahset"
                placeholderTextColor="#888888"
                onFocus={() => setFocusedField('bio')}
                onBlur={() => setFocusedField(null)}
                underlineColorAndroid="transparent"
                multiline={true}
                value={bio}
                onChangeText={setBio}
            />

            <TouchableOpacity style={styles.createButton} onPress={handleCreateProfile}>
                <Text style={{ fontWeight: 'bold', color: 'white', fontSize: 18 }}>Profili Oluştur</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1, alignItems: 'center', //justifyContent: 'center',
        backgroundColor: COLORS.background
    },
    image: {
        width: 195, height: 192, marginTop:40
    },
    changePhotoArea: {
        width: '100%', padding: 3,
        alignItems: 'center', justifyContent: 'center'
    },
    input: {
        width: '90%',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#3A3A3A',
        borderRadius: 8,
        backgroundColor: '#1E1E1E',
        color: '#FFFFFF',
        marginTop: SPACING.md,
    },
    inputFocused: {
        borderColor: '#00ff00ff',
        borderWidth: 1,
    },
    inputError: {
        borderColor: COLORS.error,
        borderWidth: 1,
    },
    createButton: {
        backgroundColor: COLORS.primary, marginTop: 40,
        paddingVertical: 10, paddingHorizontal: 60,
        borderRadius: 20
    }
})