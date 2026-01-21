import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, FONT_SIZES } from '../../utils/constants';

interface DeleteConversationModalProps {
    visible: boolean;
    userName: string;
    onCancel: () => void;
    onConfirm: (deleteForBoth: boolean) => void;
}

export function DeleteConversationModal({
    visible,
    userName,
    onCancel,
    onConfirm
}: DeleteConversationModalProps) {
    const [deleteForBoth, setDeleteForBoth] = useState(false);

    const handleConfirm = () => {
        onConfirm(deleteForBoth);
        setDeleteForBoth(false); // Reset
    };

    const handleCancel = () => {
        setDeleteForBoth(false); // Reset
        onCancel();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <Pressable style={styles.overlay} onPress={handleCancel}>
                <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                    <Text style={styles.title}>Sohbeti Sil</Text>
                    <Text style={styles.description}>
                        {userName} ile olan sohbeti silmek istediğinize emin misiniz?
                    </Text>

                    {/* Checkbox: İkiniz için de sil */}
                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => setDeleteForBoth(!deleteForBoth)}
                    >
                        <View style={[styles.checkbox, deleteForBoth && styles.checkboxChecked]}>
                            {deleteForBoth && <Icon name="checkmark" size={16} color="#FFF" />}
                        </View>
                        <Text style={styles.checkboxLabel}>İkiniz için de sil</Text>
                    </TouchableOpacity>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                            <Text style={styles.cancelButtonText}>İptal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton} onPress={handleConfirm}>
                            <Text style={styles.deleteButtonText}>Sil</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    title: {
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 12,
    },
    description: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        marginBottom: 20,
        lineHeight: 20,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingVertical: 8,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.textSecondary,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    checkboxLabel: {
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: COLORS.background,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
        fontWeight: '600',
    },
    deleteButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: COLORS.error,
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: FONT_SIZES.md,
        color: '#FFF',
        fontWeight: 'bold',
    },
});
