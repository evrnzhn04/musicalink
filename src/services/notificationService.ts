import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { supabase } from '../api/supabase';
import { Platform, PermissionsAndroid } from 'react-native';
import { navigationRef } from '../navigation/AppNavigator';

// FCM Token'ı al
export async function getFCMToken(): Promise<string | null> {
    try {
        const token = await messaging().getToken();
        console.log('FCM Token:', token);
        return token;
    } catch (error) {
        console.error('FCM Token alma hatası:', error);
        return null;
    }
}

// Token'ı Supabase'e kaydet
export async function saveFCMToken(userId: string, token: string): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('fcm_tokens')
            .upsert({
                user_id: userId,
                token: token,
                device_type: Platform.OS,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,token'
            });

        if (error) {
            console.error('FCM Token kaydetme hatası:', error);
            return false;
        }

        console.log('FCM Token başarıyla kaydedildi');
        return true;
    } catch (error) {
        console.error('FCM Token kaydetme hatası:', error);
        return false;
    }
}

// Bildirim izni iste
export async function requestNotificationPermission(): Promise<boolean> {
    try {
        if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );
            
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log('✅ Android 13+ bildirim izni verildi');
                return true;
            } else {
                console.log('❌ Android 13+ bildirim izni reddedildi');
                return false;
            }
        }

        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            console.log('Bildirim izni verildi:', authStatus);
        } else {
            console.log('Bildirim izni reddedildi');
        }

        return enabled;
    } catch (error) {
        console.error('Bildirim izni hatası:', error);
        return false;
    }
}

// Local bildirim göster (Foreground için)
async function displayNotification(title: string, body: string, data?: any) {
    // Kanal oluştur (Android için)
    const channelId = await notifee.createChannel({
        id: 'messages',
        name: 'Mesajlar',
        importance: AndroidImportance.HIGH,
        sound: 'default',
    });

    // Bildirimi göster
    await notifee.displayNotification({
        title,
        body,
        data,
        android: {
            channelId,
            importance: AndroidImportance.HIGH,
            pressAction: {
                id: 'default',
            },
        },
    });
}

// Foreground bildirim handler
messaging().onMessage(async remoteMessage => {
    console.log('Foreground mesaj alındı:', remoteMessage);

    const { title, body } = remoteMessage.notification || {};
    const data = remoteMessage.data || {};

    // Eğer şu an bu kullanıcıyla sohbet ekranındaysak bildirim gösterme
    if (navigationRef.isReady()) {
        const currentRoute = navigationRef.getCurrentRoute();
        // Chat ekranında ve parametrelerdeki otherUser.id, bildirim gönderen id (senderId) ile eşleşiyorsa
        if (currentRoute?.name === 'Chat') {
            const params = currentRoute.params as any;
            const currentChatUserId = params?.otherUser?.id;
            const notificationSenderId = data.senderId || data.sender_id; // Data payload'una göre değişebilir

            if (currentChatUserId && notificationSenderId && currentChatUserId === notificationSenderId) {
                console.log('🔇 Şu an bu kullanıcı ile sohbet açık, bildirim gösterilmiyor.');
                return;
            }
        }
    }

    if (title && body) {
        await displayNotification(title, body, data);
    }
});

// Background bildirim handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background mesaj alındı:', remoteMessage);
    // Background'da otomatik gösterilir, ek işlem gerekmez
});

// Bildirime tıklanınca
notifee.onForegroundEvent(({ type, detail }) => {
    if (type === 1) { // PRESS event
        console.log('Bildirime tıklandı:', detail.notification?.data);
        // Buraya navigasyon kodu eklenecek
    }
});

// Notification service'i başlat
export async function setupNotificationService(userId: string) {
    try {
        console.log('🔔 Notification Service başlatılıyor...');

        // 1. İzin iste
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
            console.log('⚠️ Bildirim izni yok');
            return false;
        }

        // KANAL OLUŞTURMA (Her zaman çağrılmalı)
        await notifee.createChannel({
            id: 'messages',
            name: 'Mesajlar',
            importance: AndroidImportance.HIGH,
            sound: 'default',
        });

        // 2. FCM Token al
        const token = await getFCMToken();
        if (!token) {
            console.log('⚠️ FCM Token alınamadı');
            return false;
        }

        // 3. Token'ı Supabase'e kaydet
        await saveFCMToken(userId, token);

        // 4. Token yenilenince güncelle
        messaging().onTokenRefresh(async newToken => {
            console.log('🔄 FCM Token yenilendi:', newToken);
            await saveFCMToken(userId, newToken);
        });

        console.log('✅ Notification Service hazır!');
        return true;
    } catch (error) {
        console.error('❌ Notification Service hatası:', error);
        return false;
    }
}

// Test bildirimi gönder
export async function testLocalNotification() {
    try {
        console.log('🔔 Test bildirimi tetikleniyor...');
        
        // Kanalın olduğundan emin ol
        const channelId = await notifee.createChannel({
            id: 'messages',
            name: 'Mesajlar',
            importance: AndroidImportance.HIGH,
            sound: 'default',
        });
        
        console.log('📢 Kanal oluşturuldu:', channelId);

        // Bildirimi göster
        await notifee.displayNotification({
            title: 'Test Bildirimi 🔔',
            body: 'Bu bildirim buton ile oluşturuldu! Eğer bunu görüyorsan cihazın bildirimleri alabiliyor demektir.',
            android: {
                channelId,
                importance: AndroidImportance.HIGH,
                pressAction: {
                    id: 'default',
                },
            },
        });
        
        console.log('✅ Bildirim gönderildi!');
    } catch (error) {
        console.error('❌ Test bildirimi hatası:', error);
    }
}

