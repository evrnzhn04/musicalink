import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { CreateProfileScreen } from '../screens/auth/CreateProfileScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { MessagesScreen } from '../screens/chat/MessagesScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { OtherProfileScreen } from '../screens/profile/OtherProfileScreen';
import { COLORS } from '../utils/constants';
import { SearchScreen } from '../screens/search/SearchScreen';
import { getUniqueSenderCount, subscribeToUnreadCount } from '../services/messageService';
import { FollowersScreen } from '../screens/friends/FollowersScreen';
import { FollowingScreen } from '../screens/friends/FollowingScreen';
import { ChatInfoScreen } from '../screens/chat/ChatInfoScreen';

export const navigationRef = createNavigationContainerRef();

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    // Okunmamış mesaj sayısını al ve dinle
    useEffect(() => {
        if (!user?.id) return;

        // İlk yükleme
        const loadUnread = async () => {
            const count = await getUniqueSenderCount(user.id);
            setUnreadCount(count);
        };
        loadUnread();

        // Realtime subscription
        const unsubscribe = subscribeToUnreadCount(user.id, (count) => {
            setUnreadCount(count);
        });

        return unsubscribe;
    }, [user?.id]);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: { backgroundColor: COLORS.background, borderTopColor: '#333' },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: '#888',
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    title: 'Anasayfa',
                    tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />
                }}
            />
            <Tab.Screen
                name="Search"
                component={SearchScreen}
                options={{
                    title: 'Ara',
                    tabBarIcon: ({ color, size }) => <Icon name="search" size={size} color={color} />
                }}
            />
            <Tab.Screen
                name="Match"
                component={MessagesScreen}
                options={{
                    title: 'Eşleşmeler',
                    tabBarIcon: ({ color, size }) => <Icon name="headset" size={size} color={color} />
                }}
            />
            <Tab.Screen
                name="Messages"
                component={MessagesScreen}
                options={{
                    title: 'Mesajlar',
                    tabBarIcon: ({ color, size }) => <Icon name="chatbubbles" size={size} color={color} />,
                    tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
                    tabBarBadgeStyle: {
                        backgroundColor: '#0D7A3B',
                        color: '#FFF',
                        fontSize: 10,
                        fontWeight: 'bold'
                    }
                }}
            />

            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color, size }) => <Icon name="person" size={size} color={color} />
                }}
            />
        </Tab.Navigator>
    );
}

function MainStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="OtherProfile" component={OtherProfileScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            <Stack.Screen name="ChatInfo" component={ChatInfoScreen} />
            <Stack.Screen name="Followers" component={FollowersScreen} />
            <Stack.Screen name="Following" component={FollowingScreen} />
        </Stack.Navigator>
    );
}

export function AppNavigator() {
    const { isLoading, isAuthenticated, hasProfile } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer ref={navigationRef}>
            {!isAuthenticated ? (
                <LoginScreen />
            ) : !hasProfile ? (
                <CreateProfileScreen />
            ) : (
                <MainStack />
            )}
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    loading: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }
});