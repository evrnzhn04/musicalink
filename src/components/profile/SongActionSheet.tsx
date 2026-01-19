import React, { useRef } from 'react';
import { Animated, Modal, PanResponder, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { COLORS, FONT_SIZES, SPACING } from "../../utils/constants";
import Icon from 'react-native-vector-icons/Ionicons';

interface SongActionProps {
    visible: boolean;
    songName: string;
    onClose: () => void;
    onReplace: () => void;
    onDelete: () => void;
}

export function SongActionSheet({ visible, songName, onClose, onReplace, onDelete }: SongActionProps) {
    const pan = useRef(new Animated.ValueXY()).current;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gesture) => {
                if (gesture.dy > 0) {
                    pan.setValue({ x: 0, y: gesture.dy });
                }
            },
            onPanResponderRelease: (_, gesture) => {
                if (gesture.dy > 50) {
                    onClose();
                    pan.setValue({ x: 0, y: 0 });
                } else {
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: false,
                    }).start();
                }
            },
        })
    ).current;

    return (
        <Modal visible={visible} transparent animationType="slide">
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <Animated.View
                        style={[styles.sheet, { transform: [{ translateY: pan.y }] }]}
                    >
                        <View {...panResponder.panHandlers}>
                            <View style={styles.handle} />
                        </View>
                        <Text style={styles.songName}>{songName}</Text>

                        <TouchableOpacity style={styles.button} onPress={onReplace}>
                            <Icon name="swap-horizontal" size={24} color={COLORS.text} />
                            <Text style={styles.buttonText}>Değiştir</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.buttonDelete} onPress={onDelete}>
                            <Icon name="trash" size={24} color="#ff4444" />
                            <Text style={styles.buttonTextDelete}>Kaldır</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.0)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: SPACING.lg },
    handle: { width: 40, height: 4, backgroundColor: COLORS.textSecondary, borderRadius: 2, alignSelf: 'center', marginBottom: SPACING.md },
    songName: { color: COLORS.text, fontSize: FONT_SIZES.lg, fontWeight: 'bold', textAlign: 'center', marginBottom: SPACING.md },
    button: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
    buttonText: { color: COLORS.text, fontSize: FONT_SIZES.md, },
    buttonDelete: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md, gap: SPACING.md },
    buttonTextDelete: { color: '#ff4444', fontSize: FONT_SIZES.md },
});