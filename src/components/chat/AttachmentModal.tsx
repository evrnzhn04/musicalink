import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONT_SIZES } from '../../utils/constants';

interface AttachmentModalProps {
    visible: boolean;
    onClose: () => void;
    onMusicPress: () => void;
    onGalleryPress: () => void;
    onCameraPress: () => void;
}

export function AttachmentModal({
    visible,
    onClose,
    onMusicPress,
    onGalleryPress,
    onCameraPress,
}: AttachmentModalProps) {
    const options = [
        {
            icon: 'musical-notes',
            label: 'Şarkı Seç',
            color: '#1DB954',
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
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.container}>
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
                                            <Icon name={option.icon} size={28} color="#FFF" />
                                        </View>
                                        <Text style={styles.optionLabel}>{option.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
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
        fontSize: FONT_SIZES.sm,
        color: COLORS.text,
    },
});
