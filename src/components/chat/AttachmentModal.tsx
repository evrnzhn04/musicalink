import React, { useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import SpotifyIcon from 'react-native-vector-icons/Entypo';
import { COLORS, FONT_SIZES } from '../../utils/constants';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue, useAnimatedStyle, withSpring,
    withTiming, runOnJS, SlideInDown
} from 'react-native-reanimated';

interface AttachmentModalProps {
    visible: boolean;
    onClose: () => void;
    onMusicPress: () => void;
    onGalleryPress: () => void;
    onCameraPress: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function AttachmentModal({
    visible,
    onClose,
    onMusicPress,
    onGalleryPress,
    onCameraPress,
}: AttachmentModalProps) {
    const translateY = useSharedValue(0);
    useEffect(() => {
        if (visible) translateY.value = 0;
    }, [visible]);
    const pan = Gesture.Pan()
        .onChange((event) => {
            // Sadece aşağı çekmeye izin ver
            if (event.translationY > 0) {
                translateY.value = event.translationY;
            }
        })
        .onEnd(() => {
            // 100 birimden fazla çekildiyse kapat, yoksa geri zıplat
            if (translateY.value > 100) {
                translateY.value = withTiming(SCREEN_HEIGHT, {}, () => {
                    runOnJS(onClose)();
                });
            } else {
                translateY.value = withSpring(0);
            }
        });
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const options = [
        {
            icon: 'spotify',
            label: 'Şarkı Seç',
            color: COLORS.surface,
            onPress: onMusicPress,
        },
        {
            icon: 'images',
            label: 'Galeri',
            color: '#007AFF',
            onPress: onGalleryPress,
        },
        {
            icon: 'camera',
            label: 'Kamera',
            color: '#FF6B6B',
            onPress: onCameraPress,
        },
    ];

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <GestureHandlerRootView style={{ flex: 1 }}>
                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback>
                            <GestureDetector gesture={pan}>
                                <Animated.View
                                    entering={SlideInDown}
                                    style={[styles.container, animatedStyle]}
                                >
                                    <View style={styles.handle} />
                                    <Text style={styles.title}>Ekle</Text>
                                    <View style={styles.optionsRow}>
                                        {options.map((option, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                style={styles.optionButton}
                                                onPress={option.onPress}
                                            >
                                                <View style={[styles.iconCircle, { backgroundColor: option.color }]}>
                                                    {option.icon === 'spotify' ? (<SpotifyIcon name='spotify' size={58} color={'#1DB954'} />)
                                                        : (<Icon name={option.icon} size={28} color="#FFF" />)
                                                    }
                                                </View>
                                                <Text style={styles.optionLabel}>{option.label}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </Animated.View>
                            </GestureDetector>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </GestureHandlerRootView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 40,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#444',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: FONT_SIZES.lg,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 24,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    optionButton: {
        alignItems: 'center',
        gap: 8,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionLabel: {
        fontSize: FONT_SIZES.sm, fontWeight: 'bold',
        color: COLORS.text,
    },
});
