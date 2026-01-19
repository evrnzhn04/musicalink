import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { COLORS } from "../../utils/constants";
import { useAuth } from "../../contexts/AuthContext";
import SpotifyIcon from 'react-native-vector-icons/Entypo';

export const LoginScreen = () => {
    const insets = useSafeAreaInsets();
    const { login } = useAuth();
    return (
        <View style={[styles.page, { paddingTop: insets.top }]}>
            <Image source={require('../../images/image-login-logoS.png')} style={styles.image} />
            <Text style={styles.headerText}>MusicaLink</Text>
            <Text style={styles.subHeaderText}>Müzikle Bağlan</Text>
            <TouchableOpacity style={styles.spotiLoginButton} onPress={login}>
                <SpotifyIcon name="spotify" size={25} color={'white'} />
                <Text style={{ fontWeight: 'bold', color: 'white', fontSize: 18 }}>Spotify ile Giriş Yap</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    page: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        backgroundColor: COLORS.background
    },
    image: {
        width: 320, height: 200,
        position: 'absolute', top: 70
    },
    headerText: {
        color: COLORS.text, marginTop: 40,
        fontWeight: 'bold', fontSize: 30
    },
    subHeaderText: {
        color: COLORS.textSecondary
    },
    spotiLoginButton: {
        backgroundColor: COLORS.primary, marginTop: 40,
        paddingVertical: 10, paddingHorizontal: 60,
        borderRadius: 20, flexDirection: 'row', gap: 5
    }
})