import React, { useEffect, useState } from "react";
import { Image, Keyboard, KeyboardAvoidingView, Modal, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { launchImageLibrary } from "react-native-image-picker";
import { checkUserNameAvailable, updateProfile, uploadAvatar } from "../../services/profileService";
import { COLORS, FONT_SIZES, SPACING } from "../../utils/constants";
import CancelIcon from 'react-native-vector-icons/Ionicons';
import SaveIcon from 'react-native-vector-icons/Entypo';
import PhotoIcon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from "react-native-linear-gradient";
import { DefaultProfilePhoto } from "./DefaultProfilePhoto";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface EditProfileScreenProps {
    visible: boolean;
    onClose: () => void;
}
type FocusedField = 'userName' | 'name' | 'bio' | null;

export function EditProfileScreen({ visible, onClose }: EditProfileScreenProps) {
    const insets = useSafeAreaInsets();
    const { user, setUser } = useAuth();
    const [username, setUsername] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState<FocusedField>(null);
    const [errors, setErrors] = useState<{ userName: boolean; name: boolean }>({
        userName: false,
        name: false
    });

    useEffect(() => {
        if (visible && user) {
            setUsername(user.username);
            setDisplayName(user.display_name);
            setBio(user.bio || '');
            setAvatarUri(null);
        }
    }, [visible, user]);

    const pickImage = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
        });
        if (result.assets?.[0]?.uri) {
            setAvatarUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!user) return
        try {
            setIsLoading(true);

            //İsim müsait mi
            if (username !== user.username) {
                const isAvailable = await checkUserNameAvailable(username);
                if (!isAvailable) {       // ← NOT ekle
                    // Hata göster, isim alınmış
                    setErrors(prev => ({ ...prev, userName: true }));
                    setIsLoading(false);
                    return;
                }
            }

            //Yeni avatar seçildiyse yükle
            let finalAvatarUrl = user.avatar_url;
            if (avatarUri) {
                const uploadedUrl = await uploadAvatar(user.id, avatarUri)
                if (uploadedUrl) {
                    finalAvatarUrl = uploadedUrl;
                }
            }

            const updates = {
                username,
                display_name: displayName,
                bio,
                avatar_url: finalAvatarUrl,
            }

            const success = await updateProfile(user.id, updates);
            if (success) {
                setUser({
                    ...user,
                    ...updates,
                });
                onClose();
            }
        } catch (error) {
            console.error('Update profile error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent={true}
        >
            <LinearGradient
                colors={[COLORS.primaryGradiendProfile, COLORS.background]}
                locations={[0, 0.5]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ flex: 1, paddingTop: StatusBar.currentHeight || 24 }}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                            <View style={{ flex: 1, }}>
                                {/**Header */}
                                <View style={styles.header}>
                                    <TouchableOpacity onPress={onClose}>
                                        <CancelIcon name="close" size={28} color={COLORS.text} />
                                    </TouchableOpacity>
                                    <Text style={styles.title}>Profili Düzenle</Text>
                                    <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                                        <SaveIcon name="check" size={28} color={COLORS.text} />
                                    </TouchableOpacity>
                                </View>

                                {/**Photo Area */}
                                <View style={styles.photoArea}>
                                    <View>
                                        {user?.avatar_url ? (<Image source={{ uri: user?.avatar_url }} style={styles.profilePhoto} />)
                                            : (<DefaultProfilePhoto />)}
                                        <TouchableOpacity onPress={pickImage}
                                            style={{ position: 'absolute', right: 0, bottom: 0, zIndex: 10 }}
                                        >
                                            <PhotoIcon name="photo-camera" size={28} color={COLORS.text} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/**Bio Area */}
                                <View style={styles.bioArea}>
                                    {/**Username */}
                                    <View style={{ width: '90%', marginBottom: SPACING.md }}>
                                        <Text style={{ color: COLORS.textSecondary, fontWeight: 'bold', paddingLeft: 5 }}>Kullanıcı Adı</Text>
                                        <View style={{ width: '100%' }}>
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
                                                value={username}
                                                onChangeText={(text) => {
                                                    setUsername(text.toLowerCase());
                                                    if (text.trim()) setErrors(prev => ({ ...prev, userName: false }));  // ← Hata temizle
                                                }}
                                            />
                                        </View>
                                    </View>

                                    {/**İsim */}
                                    <View style={{ width: '90%', marginBottom: SPACING.md }}>
                                        <Text style={{ color: COLORS.textSecondary, fontWeight: 'bold', paddingLeft: 5 }}>İsim</Text>
                                        <View style={{ width: '100%' }}>
                                            <TextInput
                                                style={[
                                                    styles.input,
                                                    focusedField === 'name' && styles.inputFocused,
                                                    errors.name && styles.inputError  // ← Error stili
                                                ]}
                                                placeholder="İsim"
                                                placeholderTextColor="#888888"
                                                onFocus={() => setFocusedField('name')}
                                                onBlur={() => setFocusedField(null)}
                                                underlineColorAndroid="transparent"
                                                autoCapitalize="none"
                                                value={displayName}
                                                onChangeText={(text) => {
                                                    setDisplayName(text);
                                                    if (text.trim()) setErrors(prev => ({ ...prev, name: false }));  // ← Hata temizle
                                                }}
                                            />
                                        </View>
                                    </View>

                                    {/**Bio */}
                                    <View style={{ width: '90%', }}>
                                        <Text style={{ color: COLORS.textSecondary, fontWeight: 'bold', paddingLeft: 5 }}>Kendinden Bahset</Text>
                                        <View style={{ width: '100%' }}>
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
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </LinearGradient>
        </Modal>
    );
}

const styles = StyleSheet.create({
    header: {
        width: '100%', justifyContent: 'space-between', flexDirection: 'row',
        paddingHorizontal: 10, paddingVertical: 10
    },
    title: {
        color: COLORS.text, fontSize: FONT_SIZES.xl, fontWeight: 'bold',
    },
    photoArea: {
        width: '100%', minHeight: 50, justifyContent: 'center', alignItems: 'center',
        padding: 4, marginTop: SPACING.xl,
    },
    profilePhoto: { width: 150, height: 150, borderRadius: 75 },
    bioArea: {
        width: '100%', minHeight: 50, justifyContent: 'center', alignItems: 'center',
        marginTop: SPACING.xl,
    },
    input: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#3A3A3A',
        borderRadius: 8,
        backgroundColor: '#1E1E1E',
        color: '#FFFFFF',
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
});