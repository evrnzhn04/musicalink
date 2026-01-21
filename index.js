/**
 * @format
 */

import 'react-native-url-polyfill/auto';
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

import notifee, { AndroidImportance } from '@notifee/react-native';

// Background & Quit durumunda bildirim gelmesi için gerekli
messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('🔔 Background mesaj alındı:', remoteMessage);

    // Kanal oluştur
    const channelId = await notifee.createChannel({
        id: 'messages',
        name: 'Mesajlar',
        importance: AndroidImportance.HIGH,
        sound: 'default',
    });

    // Bildirimi Notifee ile göster
    const { title, body } = remoteMessage.notification || {};
    if (title && body) {
        await notifee.displayNotification({
            title,
            body,
            data: remoteMessage.data,
            android: {
                channelId,
                importance: AndroidImportance.HIGH,
                pressAction: {
                    id: 'default',
                },
            },
        });
        console.log('✅ Background bildirim gösterildi!');
    }
});

AppRegistry.registerComponent(appName, () => App);
