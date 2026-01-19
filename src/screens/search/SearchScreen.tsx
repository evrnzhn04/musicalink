import { useCallback, useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS, FONT_SIZES } from "../../utils/constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UserProfile } from "../../types/auth.types";
import { searchUsers } from "../../services/profileService";
import { DefaultProfilePhoto } from "../../components/profile/DefaultProfilePhoto";
import { useAuth } from "../../contexts/AuthContext";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

export function SearchScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserProfile[]>([]);

    useEffect(() => {
        const search = async () => {
            if (query.length >= 1) {
                const users = await searchUsers(query, user?.id);
                setResults(users);
            } else {
                setResults([]);
            }
        };

        // Debounce - 300ms bekle
        const timeout = setTimeout(search, 300);
        return () => clearTimeout(timeout);
    }, [query]);

    useFocusEffect(
        useCallback(() => {
            // Ekran açılınca sıfırla
            setQuery('');
            setResults([]);
        }, [])
    );

    const renderItem = ({ item }: { item: UserProfile }) => (
        <TouchableOpacity
            style={styles.userRow}
            onPress={() => (navigation as any).navigate('OtherProfile', { userId: item.id, profile: item })}
        >
            {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
            ) : (
                <DefaultProfilePhoto size={60} />
            )}
            <View>
                <Text style={styles.displayName}>{item.display_name}</Text>
                <Text style={styles.username}>@{item.username}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <TextInput
                style={styles.input}
                placeholder="Kullanıcı ismi"
                placeholderTextColor="#888888"
                underlineColorAndroid="transparent"
                autoCapitalize="none"
                value={query}
                onChangeText={setQuery}
            />

            <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                style={{ width: '100%', marginTop: 10, }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
    },
    input: {
        width: '90%', marginTop: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#3A3A3A',
        borderRadius: 8,
        backgroundColor: '#1E1E1E',
        color: '#FFFFFF',
    },

    userRow: {
        padding: 4, flexDirection: 'row', width: '90%',
        alignSelf: 'center', alignItems: 'center', gap: 20
    },
    avatar: {
        width: 60, height: 60, borderRadius: 30
    },
    displayName: {
        color: COLORS.text, fontSize: FONT_SIZES.md
    },
    username: {
        color: COLORS.textSecondary
    },
});