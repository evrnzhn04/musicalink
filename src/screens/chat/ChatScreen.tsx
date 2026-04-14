import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
    AppState,
    AppStateStatus,
    Linking,
    PermissionsAndroid,
    ToastAndroid
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONT_SIZES, SPACING } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';
import {
    Message,
    sendMessage,
    getMessages,
    markMessagesAsRead,
    subscribeToMessages,
    generateConversationId
} from '../../services/messageService';
import { DefaultProfilePhoto } from '../../components/profile/DefaultProfilePhoto';
import { supabase } from '../../api/supabase';
import { getPresence, subscribeToPresence, formatLastSeen } from '../../services/presenceService';
import { AttachmentModal } from '../../components/chat/AttachmentModal';
import { SongSearchModal } from '../../components/profile/SongSearchModal';
import { SpotifyPlayModal } from '../../components/chat/SpotifyPlayModal';
import { playTrack } from '../../services/spotifyService';
import { InformationModal } from '../../components/common/InformaitonModal';
import AudioRecorderPlayer, {
    RecordBackType,
    PlayBackType
} from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import { decode } from 'base64-arraybuffer';

type ChatRouteParams = {
    Chat: {
        otherUser: {
            id: string;
            username: string;
            display_name: string;
            avatar_url: string | null;
        };
    };
};

const audioRecorderPlayer = AudioRecorderPlayer;

export function ChatScreen() {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<ChatRouteParams, 'Chat'>>();
    const { otherUser } = route.params;

    const { user, spotifyUser } = useAuth();
    const insets = useSafeAreaInsets();
    const flashListRef = useRef<any>(null);
    const hasLoadedMessages = useRef(false);
    const appState = useRef<AppStateStatus>(AppState.currentState);
    const isNearBottom = useRef(true); // Kullanıcı en altta mı?

    const [attachmentModalVisible, setAttachmentModalVisible] = useState(false);
    const [songModalVisible, setSongModalVisible] = useState(false);
    const [spotifyPlayModalVisible, setSpotifyPlayModalVisible] = useState(false);
    const [selectedTrackForPlay, setSelectedTrackForPlay] = useState<{ name: string; artist: string; image: string; uri: string } | null>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    // Presence state
    const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
    const [otherUserLastSeen, setOtherUserLastSeen] = useState<string | null>(null);

    const conversationId = user?.id ? generateConversationId(user.id, otherUser.id) : '';

    //InformationModal
    const [isInfo, setIsInfo] = useState(false);

    //Recording
    const [isRecording, setIsRecording] = useState(false);
    const [recordSecs, setRecordSecs] = useState(0);

    // Audio Playback State
    const [currentPlayingMessageId, setCurrentPlayingMessageId] = useState<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPlaybackPos, setCurrentPlaybackPos] = useState('00:00');

    // ... (Permissions and other code remain same)

    //Sesli mesajı oynat
    const playAudio = async (url: string, messageId: number) => {
        //console.log('▶️ playAudio called for ID:', messageId);
        try {
            // Eğer aynı mesaja tıklandıysa: Durdur/Devam Et
            if (currentPlayingMessageId === messageId) {
                if (isPlaying) {
                    //console.log('⏸️ Pausing...');
                    await audioRecorderPlayer.pausePlayer();
                    setIsPlaying(false);
                } else {
                    //console.log('▶️ Resuming...');
                    await audioRecorderPlayer.resumePlayer();
                    setIsPlaying(true);
                }
                return;
            }

            // Farklı bir mesajsa veya ilk kez çalınıyorsa:
            // Öncekini durdur
            try {
                //console.log('⏹️ Stopping previous...');
                await audioRecorderPlayer.stopPlayer();
                audioRecorderPlayer.removePlayBackListener();
            } catch (e) { }

            // Yeni durumu ayarla
            setCurrentPlayingMessageId(messageId);
            setIsPlaying(true);

            // Çalmaya başla
            //console.log('🎵 Starting new...');
            await audioRecorderPlayer.startPlayer(url);

            audioRecorderPlayer.addPlayBackListener((e: PlayBackType) => {

                //console.log('⏱️ Debug:', e.currentPosition, '/', e.duration);
                // Süre dolduysa
                if (e.duration > 0 && e.currentPosition === e.duration) {
                    //console.log('🏁 Finished');
                    audioRecorderPlayer.stopPlayer().catch(() => { });
                    setIsPlaying(false);
                    setCurrentPlayingMessageId(null);
                    setCurrentPlaybackPos('00:00');
                    return;
                }

                // Süreyi güncelle
                // console.log('⏱️ Playback pos:', e.currentPosition);
                setCurrentPlaybackPos(audioRecorderPlayer.mmss(Math.floor(e.currentPosition / 1000)));
                return;
            });
        } catch (error) {
            //console.log('❌ Oynatma hatası:', error);
            setIsPlaying(false);
            setCurrentPlayingMessageId(null);
        }
    };

    // İzin Kontrolü
    const checkPermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                // API 33 (Android 13) ve üzeri kontrolü
                if (Platform.Version >= 33) {
                    const grants = await PermissionsAndroid.requestMultiple([
                        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                        PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
                    ]);

                    if (
                        grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
                    ) {
                        //console.log('✅ İzinler verildi (Android 13+)');
                        return true;
                    }
                    //console.log('❌ İzinler reddedildi (Android 13+)');
                    return false;
                }

                // Android 12 ve altı için
                const grants = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                ]);

                if (
                    grants['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
                    grants['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
                    grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
                ) {
                    //console.log('✅ İzinler verildi');
                    return true;
                } else {
                    //console.log('❌ İzinler reddedildi');
                    return false;
                }
            } catch (err) {
                //console.warn(err);
                return false;
            }
        }
        return true;
    };

    // Kaydı Başlat
    const onStartRecord = async () => {
        //console.log('🔴 onStartRecord tetiklendi');
        const hasPermission = await checkPermissions();
        //console.log('🔍 İzin durumu:', hasPermission);

        if (hasPermission) {
            try {
                setIsRecording(true);
                //console.log('🎙️ startRecorder çağrılıyor (Kaliteli Mod)...');

                const audioSet = {
                    AudioEncoderAndroid: 3, // AAC
                    AudioSourceAndroid: 7, // VOICE_COMMUNICATION (Eko Önleme + Gürültü Azaltma)
                    AVEncoderAudioQualityKeyIOS: 96, // High
                    AVNumberOfChannelsKeyIOS: 2,
                    AVFormatIDKeyIOS: 'aac' as any,
                    AudioSamplingRate: 44100, // 44.1kHz (Standart Kalite)
                    AudioEncodingBitRate: 128000, // 128kbps
                };

                const result = await audioRecorderPlayer.startRecorder(undefined, audioSet);
                //console.log('🎙️ startRecorder sonucu (uri):', result);

                audioRecorderPlayer.addRecordBackListener((e: RecordBackType) => {
                    // console.log('⏱️ Kayıt süresi:', e.currentPosition);
                    setRecordSecs(Math.floor(e.currentPosition / 1000));
                    return;
                });
            } catch (error) {
                //console.error('❌ startRecorder hatası:', error);
                setIsRecording(false);
            }
        }
    };

    // Kaydı Bitir
    const onStopRecord = async () => {
        //console.log('⬛ onStopRecord tetiklendi. isRecording:', isRecording);
        if (!isRecording) return;

        try {
            //console.log('🛑 stopRecorder çağrılıyor...');
            const result = await audioRecorderPlayer.stopRecorder();
            //console.log('🛑 stopRecorder sonucu (dosya yolu):', result);

            audioRecorderPlayer.removeRecordBackListener();

            const currentDuration = recordSecs;
            setIsRecording(false);
            setRecordSecs(0);

            // Dosyayı Yükle ve Gönder
            //console.log('🚀 uploadAndSendAudio çağrılıyor. Süre:', currentDuration);
            await uploadAndSendAudio(result, currentDuration);
        } catch (error) {
            //console.error('❌ onStopRecord hatası:', error);
        }
    };

    // Ses Dosyasını Yükle ve Mesaj Gönder
    const uploadAndSendAudio = async (uri: string, duration: number) => {
        try {
            //console.log('📤 uploadAndSendAudio başladı. Ham URI:', uri);

            // Android için dosya yolu düzeltmesi
            const filepath = Platform.OS === 'android' ? uri : uri.replace('file://', '');
            //console.log('📂 İşlenmiş dosya yolu:', filepath);

            // Dosyayı base64 oku
            //console.log('📖 Dosya okunuyor...');
            const base64 = await RNFS.readFile(filepath, 'base64');
            //console.log('📖 Dosya okundu. Base64 uzunluğu:', base64.length);

            const fileData = decode(base64);

            // Dosya adı
            const fileName = `voice_${user?.id}_${Date.now()}.m4a`;
            //console.log('🏷️ Oluşturulan dosya adı:', fileName);

            // Supabase'e yükle
            //console.log('☁️ Supabase upload başlıyor...');
            const { data, error: uploadError } = await supabase
                .storage
                .from('voice-messages')
                .upload(fileName, fileData, {
                    contentType: 'audio/m4a'
                });

            if (uploadError) {
                //console.error('❌ Upload error:', uploadError);
                return;
            }
            //console.log('✅ Upload başarılı:', data);

            // Public URL al
            const { data: { publicUrl } } = supabase
                .storage
                .from('voice-messages')
                .getPublicUrl(fileName);
            //console.log('🔗 Public URL:', publicUrl);

            // Mesaj gönder
            //console.log('📨 sendMessage çağrılıyor...');
            const sent = await sendMessage(
                conversationId,
                user?.id || '',
                otherUser.id,
                '🎤 Sesli Mesaj',
                'audio',
                { audio_url: publicUrl, duration: duration }
            );

            //if (sent) console.log('✅ Mesaj başarıyla gönderildi!');
            //else console.log('⚠️ Mesaj gönderilemedi (sendMessage null döndü)');

        } catch (err: any) {
            ToastAndroid.show("Ses gönderilemedi!", ToastAndroid.SHORT);
            console.error('❌ Ses gönderme hatası (Catch):', err);
            console.error('❌ Hata detayı:', err.message);
        }
    };


    // AppState listener
    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                //console.log('📱 App foregrounda geldi, mesajlar okundu işaretleniyor');
                if (user?.id && conversationId) {
                    markMessagesAsRead(conversationId, user.id);
                }
            }

            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [conversationId, user?.id]);

    // Mesajları yükle
    useEffect(() => {
        if (!conversationId) return;

        const loadMessages = async () => {
            setIsLoading(true);
            const msgs = await getMessages(conversationId, user?.id);
            setMessages(msgs);
            setIsLoading(false);

            // Mesajları okundu olarak işaretle - SADECE app foreground'daysa
            if (user?.id) {
                if (AppState.currentState === 'active') {
                    await markMessagesAsRead(conversationId, user.id);
                    //console.log('✅ Mesajlar okundu işaretlendi (app active)');
                } else {
                    //console.log('⏸️ App background, mesajlar okundu işaretlenmedi');
                }
            }

        };

        loadMessages();
    }, [conversationId, user?.id]);

    // Karşı tarafın presence bilgisini al ve dinle
    useEffect(() => {
        if (!otherUser.id) return;

        // İlk yükleme
        const loadPresence = async () => {
            const presence = await getPresence(otherUser.id);
            setIsOtherUserOnline(presence.isOnline);
            setOtherUserLastSeen(presence.lastSeen);
        };
        loadPresence();

        // Realtime subscription
        const unsubscribe = subscribeToPresence(otherUser.id, (isOnline, lastSeen) => {
            setIsOtherUserOnline(isOnline);
            setOtherUserLastSeen(lastSeen);
        });

        // Last seen text'i güncellemek için interval (her 30 saniyede)
        const intervalId = setInterval(() => {
            // State'i tetiklemek için timestamp'ı güncelle
            setOtherUserLastSeen(prev => prev);
        }, 30000);

        return () => {
            unsubscribe();
            clearInterval(intervalId);
        };
    }, [otherUser.id]);

    // Realtime subscription - INSERT
    useEffect(() => {
        if (!conversationId) return;

        const unsubscribe = subscribeToMessages(conversationId, (newMessage) => {
            setMessages(prev => {
                const exists = prev.some(m => m.id === newMessage.id);
                if (exists) return prev;
                return [...prev, newMessage];
            });

            if (newMessage.receiver_id === user?.id) {
                // SADECE app foreground'daysa okundu işaretle
                if (AppState.currentState === 'active') {
                    markMessagesAsRead(conversationId, user.id);
                    //console.log('✅ Yeni mesaj okundu işaretlendi (app active)');
                } else {
                    //console.log('⏸️ Yeni mesaj geldi ama app background, okundu işaretlenmedi');
                }
            }
        });

        return unsubscribe;
    }, [conversationId, user?.id]);

    // Realtime subscription - UPDATE (görüldü durumu için)
    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`read_status:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const updated = payload.new as Message;
                    setMessages(prev => prev.map(m =>
                        m.id === updated.id ? { ...m, is_read: updated.is_read, hidden_for: updated.hidden_for } : m
                    ));

                    // hidden_for güncellemesi için de kontrol et
                    if (user?.id && updated.hidden_for?.includes(user.id)) {
                        //console.log('🔒 Mesaj gizlendi, listeyi yeniden yükle');
                        getMessages(conversationId, user?.id).then(msgs => {
                            //console.log('📬 UPDATE sonrası mesaj sayısı:', msgs.length);
                            setMessages(msgs);

                            if (hasLoadedMessages.current && msgs.length === 0) {
                                //console.log('📴 Tüm mesajlar gizlendi, ChatScreen kapanıyor');
                                setTimeout(() => {
                                    (navigation as any).goBack();
                                }, 500);
                            }
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'messages'
                    // Filter kaldırdık çünkü DELETE eventinde conversation_id gelmeyebilir (REPLICA IDENTITY FULL değilse)
                    // RLS zaten sadece bizim görebileceğimiz silmeleri gönderecek
                },
                (payload) => {
                    const deletedId = payload.old?.id;
                    //console.log('🗑️ DELETE event alındı wait filter:', deletedId);

                    // Silinen mesaj bu sohbette mi? (State'deki mesajlardan kontrol et)
                    // Not: messages state'ine closure içinde erişemeyebiliriz, getMessages ile kontrol daha sağlıklı
                    // Ama performans için önce basit bir "yenile" yapalım

                    // Güvenli yöntem: Her silme işleminde (bizim ilgilendiğimiz mesajlardan biri olabilir)
                    // Conversation ID kontrol edemiyoruz, o yüzden her DELETE'de bu sohbeti kontrol et

                    getMessages(conversationId, user?.id).then(msgs => {
                        // Eğer mesaj sayısı değiştiyse güncelle
                        setMessages(prev => {
                            if (prev.length !== msgs.length) {
                                //console.log('🗑️ Mesaj sayısı değişti, güncelleniyor. Yeni:', msgs.length);
                                return msgs;
                            }
                            return prev;
                        });

                        // Auto-close check
                        if (hasLoadedMessages.current && msgs.length === 0) {
                            //console.log('📴 (Global DELETE) Tüm mesajlar silindi, ChatScreen kapanıyor');
                            setTimeout(() => {
                                // Sadece ekran hala odaktaysa ve geri gidilebiliyorsa git
                                if (navigation.isFocused() && navigation.canGoBack()) {
                                    navigation.goBack();
                                } else {
                                    //console.log('⚠️ ChatScreen zaten kapalı veya geri gidilemiyor');
                                }
                            }, 500);
                        }
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId]);

    // Mesajlar yüklendiğinde flag'i set et
    useEffect(() => {
        if (messages.length > 0 && !isLoading) {
            if (!hasLoadedMessages.current) {
                //console.log('✅ hasLoadedMessages flag set edildi');
                hasLoadedMessages.current = true;
            }
        }
    }, [messages.length, isLoading]);

    // Mesaj gönder
    const handleSend = async () => {
        if (!inputText.trim() || !user?.id || isSending) return;

        setIsSending(true);
        const content = inputText.trim();
        setInputText('');

        const tempId = Date.now();
        const tempMessage: Message = {
            id: tempId,
            conversation_id: conversationId,
            sender_id: user.id,
            receiver_id: otherUser.id,
            content,
            message_type: 'text',
            track_data: null,
            is_read: false,
            read_at: null,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMessage]);

        const sent = await sendMessage(
            conversationId,
            user.id,
            otherUser.id,
            content
        );

        if (sent) {
            setMessages(prev => prev.map(m =>
                m.id === tempId ? sent : m
            ));
        } else {
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }

        setIsSending(false);
    };

    // Tarih formatı - Göreli tarih
    const formatRelativeDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Bugün';
        if (diffDays === 1) return 'Dün';
        if (diffDays < 7) return `${diffDays} gün önce`;
        if (diffDays < 14) return 'Bir hafta önce';
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;
        return date.toLocaleDateString('tr-TR');
    };

    // Mesaj render - Yeni tasarım
    const renderMessage = useCallback(({ item, index }: { item: Message, index: number }) => {
        const isMe = item.sender_id === user?.id;

        // Tarih ayıracı - farklı günlerde göster
        let showDateSeparator = false;
        if (index === 0) {
            showDateSeparator = true;
        } else {
            const prevItem = messages[index - 1];
            const curDate = new Date(item.created_at).toDateString();
            const prevDate = new Date(prevItem.created_at).toDateString();
            if (curDate !== prevDate) showDateSeparator = true;
        }

        // Gruplama mantığı - Aynı kişi 1dk içinde mesaj attıysa
        let showAvatar = true;
        let showTime = true;

        if (index < messages.length - 1) {
            const nextItem = messages[index + 1];
            const isSameSenderAsNext = nextItem.sender_id === item.sender_id;
            if (isSameSenderAsNext) {
                const curTime = new Date(item.created_at).getTime();
                const nextTime = new Date(nextItem.created_at).getTime();
                if (nextTime - curTime < 60000) {
                    showAvatar = false;
                    showTime = false;
                }
            }
        }

        // Kuyruk mantığı
        let isLastInGroup = true;
        if (index < messages.length - 1) {
            const nextItem = messages[index + 1];
            const isSameSenderAsNext = nextItem.sender_id === item.sender_id;
            if (isSameSenderAsNext) {
                const curTime = new Date(item.created_at).getTime();
                const nextTime = new Date(nextItem.created_at).getTime();
                if (nextTime - curTime < 60000) isLastInGroup = false;
            }
        }

        // Şarkı mesajı
        if (item.message_type === 'track' && item.track_data) {
            return (
                <View style={{ marginBottom: showTime ? 12 : 4 }}>
                    {/* Tarih Ayıracı */}
                    {showDateSeparator && (
                        <View style={styles.dateSeparator}>
                            <View style={styles.dateBadge}>
                                <Text style={styles.dateBadgeText}>
                                    {formatRelativeDate(item.created_at)}
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={[
                        styles.messageRow,
                        isMe ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }
                    ]}>
                        {/* Diğer kullanıcının avatarı */}
                        {!isMe && (
                            <View style={styles.avatarContainer}>
                                {showAvatar ? (
                                    otherUser.avatar_url ? (
                                        <Image source={{ uri: otherUser.avatar_url }} style={styles.messageAvatar} />
                                    ) : (
                                        <DefaultProfilePhoto size={28} />
                                    )
                                ) : (
                                    <View style={styles.avatarPlaceholder} />
                                )}
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.trackMessageContainer}
                            onPress={() => openSpotifyTrack({
                                name: item.track_data.name,
                                artist: item.track_data.artist,
                                image: item.track_data.image,
                                uri: item.track_data.uri
                            })}
                            activeOpacity={0.7}
                        >
                            <Image
                                source={{ uri: item.track_data.image }}
                                style={styles.trackImage}
                            />
                            <View style={styles.trackInfo}>
                                <Text style={styles.trackName} numberOfLines={1}>
                                    {item.track_data.name}
                                </Text>
                                <Text style={styles.trackArtist} numberOfLines={1}>
                                    {item.track_data.artist}
                                </Text>
                            </View>
                            <Icon name="play-circle" size={50} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Saat ve Görüldü - sadece grubun sonunda göster */}
                    {showTime && (
                        <View style={[
                            styles.messageFooter,
                            isMe ? { alignSelf: 'flex-end', marginRight: 8 } : { alignSelf: 'flex-start', marginLeft: 8 }
                        ]}>
                            <Text style={styles.messageTime}>
                                {new Date(item.created_at).toLocaleTimeString('tr-TR', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </Text>
                            {isMe && item.is_read && (
                                <View style={styles.readIndicator}>
                                    <Text style={styles.readText}>Görüldü</Text>
                                    <Icon name="checkmark-done" size={14} color="#1DB954" />
                                </View>
                            )}
                        </View>
                    )}
                </View>
            );
        }

        // Sesli Mesaj
        if (item.message_type === 'audio' && item.track_data) {
            return (
                <View style={{ marginBottom: showTime ? 12 : 4, width: '100%' }}>
                    {/* Tarih Ayıracı */}
                    {showDateSeparator && (
                        <View style={styles.dateSeparator}>
                            <View style={styles.dateBadge}>
                                <Text style={styles.dateBadgeText}>{formatRelativeDate(item.created_at)}</Text>
                            </View>
                        </View>
                    )}

                    <View style={[
                        styles.messageRow,
                        isMe ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
                        { marginBottom: showAvatar ? 16 : 4 }
                    ]}>
                        {!isMe && (
                            <View style={styles.avatarContainer}>
                                {showAvatar ? (
                                    otherUser.avatar_url ? <Image source={{ uri: otherUser.avatar_url }} style={styles.messageAvatar} /> : <DefaultProfilePhoto size={28} />
                                ) : <View style={styles.avatarPlaceholder} />}
                            </View>
                        )}

                        <View style={styles.messageContentContainer}>
                            <View style={[
                                styles.messageBubble,
                                isMe ? styles.myBubble : styles.theirBubble,
                                {
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 10,
                                    minWidth: 180,
                                    borderTopLeftRadius: 18,
                                    borderTopRightRadius: 18,
                                    borderBottomLeftRadius: isMe ? 18 : (isLastInGroup ? 4 : 18),
                                    borderBottomRightRadius: isMe ? (isLastInGroup ? 4 : 18) : 18
                                }
                            ]}>
                                <TouchableOpacity onPress={() => playAudio(item.track_data.audio_url, item.id)}>
                                    <Icon
                                        name={currentPlayingMessageId === item.id && isPlaying ? "pause" : "play"}
                                        size={28}
                                        color={COLORS.text}
                                    />
                                </TouchableOpacity>
                                <View style={{ marginLeft: 12 }}>
                                    <Text style={{ color: COLORS.text, fontWeight: 'bold', fontSize: 13 }}>Sesli Mesaj</Text>
                                    <Text style={{ color: COLORS.text, fontSize: 11, marginTop: 2, opacity: 0.8 }}>
                                        {currentPlayingMessageId === item.id
                                            ? `${currentPlaybackPos} / ${item.track_data.duration} sn`
                                            : `${item.track_data.duration} sn`
                                        }
                                    </Text>
                                </View>
                            </View>

                            {/* Saat ve Görüldü */}
                            {showTime && (
                                <View style={[
                                    styles.messageFooter,
                                    isMe ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }
                                ]}>
                                    <Text style={styles.messageTime}>
                                        {new Date(item.created_at).toLocaleTimeString('tr-TR', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                    {isMe && item.is_read && (
                                        <View style={styles.readIndicator}>
                                            <Text style={styles.readText}>Görüldü</Text>
                                            <Icon name="checkmark-done" size={14} color="#1DB954" />
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <>
                {/* Tarih Ayıracı */}
                {showDateSeparator && (
                    <View style={styles.dateSeparator}>
                        <View style={styles.dateBadge}>
                            <Text style={styles.dateBadgeText}>
                                {formatRelativeDate(item.created_at)}
                            </Text>
                        </View>
                    </View>
                )}

                <View style={[
                    styles.messageRow,
                    isMe ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
                    { marginBottom: showAvatar ? 16 : 4 }
                ]}>
                    {/* Diğer kullanıcının avatarı - sadece grubun sonunda */}
                    {!isMe && (
                        <View style={styles.avatarContainer}>
                            {showAvatar ? (
                                otherUser.avatar_url ? (
                                    <Image source={{ uri: otherUser.avatar_url }} style={styles.messageAvatar} />
                                ) : (
                                    <DefaultProfilePhoto size={28} />
                                )
                            ) : (
                                <View style={styles.avatarPlaceholder} />
                            )}
                        </View>
                    )}

                    <View style={styles.messageContentContainer}>
                        {/* Mesaj Balonu */}
                        <View style={[
                            styles.messageBubble,
                            isMe ? styles.myBubble : styles.theirBubble,
                            isMe ? {
                                borderTopLeftRadius: 18,
                                borderBottomLeftRadius: 18,
                                borderTopRightRadius: 18,
                                borderBottomRightRadius: isLastInGroup ? 4 : 18
                            } : {
                                borderTopRightRadius: 18,
                                borderBottomRightRadius: 18,
                                borderTopLeftRadius: 18,
                                borderBottomLeftRadius: isLastInGroup ? 4 : 18
                            }
                        ]}>
                            <Text style={styles.messageBody}>
                                {item.content}
                            </Text>
                        </View>

                        {/* Saat ve Read indicator - grubun sonunda göster */}
                        {showTime && (
                            <View style={[
                                styles.messageFooter,
                                isMe ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }
                            ]}>
                                <Text style={styles.messageTime}>
                                    {new Date(item.created_at).toLocaleTimeString('tr-TR', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </Text>
                                {isMe && item.is_read && (
                                    <View style={styles.readIndicator}>
                                        <Text style={styles.readText}>Görüldü</Text>
                                        <Icon name="checkmark-done" size={14} color="#1DB954" />
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </>
        );
    }, [messages, user?.id, otherUser.avatar_url, currentPlayingMessageId, isPlaying, currentPlaybackPos]);

    // Spotify'da şarkı aç (Web API ile)
    const openSpotifyTrack = async (trackData: { name: string; artist: string; image: string; uri: string }) => {
        // Web API ile şarkı çalmayı dene
        const result = await playTrack(trackData.uri);

        switch (result) {
            case 'success':
                // Başarılı - şarkı arka planda çalıyor
                //console.log('Şarkı başarıyla çalındı:', trackData.name);
                break;
            case 'not_premium':
                // Premium değil - modal göster
                setSelectedTrackForPlay(trackData);
                setSpotifyPlayModalVisible(true);
                break;
            case 'no_device':
                // Aktif cihaz yok - Spotify'ı aç
                //console.log('Aktif cihaz yok, Spotify açılıyor');
                await Linking.openURL(trackData.uri);
                break;
            case 'error':
            default:
                // Genel hata - Spotify'ı aç
                //console.log('API hatası, Spotify açılıyor');
                await Linking.openURL(trackData.uri);
                break;
        }
    };

    // Karışık çalmaya devam et (Spotify'ı aç)
    const handleShufflePlay = async () => {
        if (selectedTrackForPlay) {
            await Linking.openURL(selectedTrackForPlay.uri);
        }
        setSpotifyPlayModalVisible(false);
        setSelectedTrackForPlay(null);
    };

    // Presence durumuna göre status text
    const statusText = isOtherUserOnline ? 'Çevrimiçi' : formatLastSeen(otherUserLastSeen);
    const statusColor = isOtherUserOnline ? '#1DB954' : COLORS.textSecondary;

    return (
        <KeyboardAvoidingView
            style={[styles.container, { paddingTop: insets.top }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="chevron-back" size={28} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.headerUser}>
                    {otherUser.avatar_url ? (
                        <Image source={{ uri: otherUser.avatar_url }} style={styles.headerAvatar} />
                    ) : (
                        <DefaultProfilePhoto size={40} />
                    )}
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerName}>{otherUser.display_name}</Text>
                        <Text style={[styles.headerStatus, { color: statusColor }]}>
                            {statusText}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity onPress={() => (navigation as any).navigate('ChatInfo', { otherUser })}>
                    <Icon name="information-circle-outline" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Messages - FlashList */}
            <View style={styles.listContainer}>
                <FlashList
                    ref={flashListRef}
                    data={messages}
                    extraData={{ currentPlayingMessageId, isPlaying, currentPlaybackPos }}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderMessage}
                    drawDistance={250}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
                    onScroll={(event) => {
                        const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
                        const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
                        // Eğer en alttan 100px içindeyse "yakın" sayılır
                        isNearBottom.current = distanceFromBottom < 100;
                    }}
                    onContentSizeChange={() => {
                        // Sadece kullanıcı en alttayken veya ilk yüklemede scroll et
                        if (messages.length > 0 && isNearBottom.current) {
                            flashListRef.current?.scrollToEnd({ animated: true });
                        }
                    }}
                />
            </View>

            {/* Input Area */}
            <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
                <View style={styles.inputPill}>
                    {isRecording ? (
                        <View style={styles.recordingContainer}>
                            <Icon name="mic" size={20} color="#FF4444" style={styles.recordingIcon} />
                            <Text style={styles.recordingText}>
                                Kaydediliyor... {audioRecorderPlayer.mmss(recordSecs)}
                            </Text>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity style={styles.iconButton} onPress={() => setAttachmentModalVisible(true)}>
                                <Icon name="add" size={24} color="#888" />
                            </TouchableOpacity>

                            <TextInput
                                style={styles.textInput}
                                value={inputText}
                                onChangeText={setInputText}
                                placeholder="Mesaj yazın..."
                                placeholderTextColor="#666"
                                multiline
                            />
                        </>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.iconButton,
                            isRecording && { backgroundColor: '#FF4444', borderRadius: 20 }
                        ]}
                        onLongPress={onStartRecord}
                        onPressOut={onStopRecord}
                        delayLongPress={300}
                    >
                        <Icon
                            name={isRecording ? "mic" : "mic-outline"}
                            size={isRecording ? 24 : 22}
                            color={isRecording ? "#FFF" : "#888"}
                            style={isRecording ? { transform: [{ scale: 1.1 }] } : undefined}
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={[
                        styles.sendCircle,
                        !inputText.trim() && { opacity: 0.7 }
                    ]}
                    onPress={handleSend}
                    disabled={!inputText.trim() || isSending}
                >
                    <Icon name="arrow-up" size={24} color="#000" />
                </TouchableOpacity>
            </View>

            {/* Attachment Modal */}
            <AttachmentModal
                visible={attachmentModalVisible}
                onClose={() => setAttachmentModalVisible(false)}
                onMusicPress={() => {
                    setAttachmentModalVisible(false);
                    setSongModalVisible(true);
                }}
                onGalleryPress={() => {
                    setAttachmentModalVisible(false);
                    setIsInfo(true);
                    //console.log('Galeri özelliği henüz hazır değil');
                }}
                onCameraPress={() => {
                    setAttachmentModalVisible(false);
                    setIsInfo(true);
                    //console.log('Kamera özelliği henüz hazır değil');
                }}
            />

            {/* Song Search Modal */}
            <SongSearchModal
                visible={songModalVisible}
                onClose={() => setSongModalVisible(false)}
                onSelectSong={async (track) => {
                    setSongModalVisible(false);
                    // Şarkı bilgilerini JSON olarak sakla
                    const trackData = {
                        id: track.spotify_track_id,
                        name: track.track_name,
                        artist: track.artist_name,
                        image: track.album_image_url,
                        uri: `spotify:track:${track.spotify_track_id}`,
                    };

                    if (!user?.id) return;

                    setIsSending(true);
                    const sent = await sendMessage(
                        conversationId,
                        user.id,
                        otherUser.id,
                        `🎵 ${track.track_name} - ${track.artist_name}`,
                        'track',
                        trackData
                    );

                    if (sent) {
                        setMessages(prev => [...prev, sent]);
                    }
                    setIsSending(false);
                }}
            />

            {/* Spotify Play Modal - Premium değilse göster */}
            <SpotifyPlayModal
                visible={spotifyPlayModalVisible}
                onClose={() => {
                    setSpotifyPlayModalVisible(false);
                    setSelectedTrackForPlay(null);
                }}
                onShufflePlay={handleShufflePlay}
                trackData={selectedTrackForPlay || undefined}
            />

            <InformationModal visible={isInfo} onClose={() => setIsInfo(false)} />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A0A0A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#0A0A0A',
    },
    headerUser: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginLeft: 8,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    headerInfo: {
        flex: 1, marginLeft: 10
    },
    headerName: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    headerStatus: {
        fontSize: 11,
        color: '#1DB954',
        flex: 1,
    },
    recordingContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    recordingText: {
        color: COLORS.text,//'#FF4444'
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
    recordingIcon: {
        opacity: 0.8,
    },
    dateSeparator: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    dateBadge: {
        backgroundColor: '#1E1E1E',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 12,
    },
    dateBadgeText: {
        color: '#888',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    listContainer: {
        flex: 1,
    },
    messageRow: {
        flexDirection: 'row',
        paddingHorizontal: 12,
    },
    avatarContainer: {
        width: 32,
        marginRight: 8,
        justifyContent: 'flex-end',
    },
    messageAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    avatarPlaceholder: {
        width: 28,
        height: 28,
    },
    messageContentContainer: {
        maxWidth: '75%',
    },
    messageBubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 18,
    },
    myBubble: {
        backgroundColor: '#0D7A3B', // Koyu modern yeşil
    },
    theirBubble: {
        backgroundColor: '#1E1E1E', // Koyu gri
    },
    messageBody: {
        color: '#FFF',
        fontSize: 15,
        lineHeight: 20,
    },
    messageFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 6,
    },
    messageTime: {
        fontSize: 11,
        color: '#666',
    },
    readIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    readText: {
        fontSize: 11,
        color: '#666',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
        backgroundColor: '#050505',
        gap: 12,
    },
    inputPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: 30,
        paddingHorizontal: 6,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: '#333',
    },
    iconButton: {
        padding: 8,
    },
    textInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 15,
        paddingHorizontal: 5,
        paddingVertical: 4,
        maxHeight: 100,
    },
    sendCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#1DB954',
        justifyContent: 'center',
        alignItems: 'center',
    },
    trackMessageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 8,
        gap: 12,
        width: '85%',
        maxWidth: '85%',
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
        color: '#FFF',
        fontSize: FONT_SIZES.md,
        fontWeight: '600',
    },
    trackArtist: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.sm,
    },
});
