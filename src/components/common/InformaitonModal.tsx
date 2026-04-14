import { Image, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { COLORS, FONT_SIZES } from "../../utils/constants";

interface InformationModalProps {
    visible: boolean;
    onClose: () => void;
}

export function InformationModal({ visible, onClose }: InformationModalProps) {
    return (
        <Modal
            visible={visible}
            transparent animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Image source={require('../../images/sorry.png')} style={styles.icon} />
                        <Text style={styles.modalHeader}>Bu Özellik Yakında Gelecek!</Text>
                        <Text style={styles.modalText}>
                            Üzerinde Çalışıyorum.
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                            <Text style={styles.cancelButtonText}>İptal</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        alignItems: 'center', justifyContent: 'center', flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)'
    },
    modalContent: {
        backgroundColor: COLORS.background,
        width: '90%',
        padding: 30,
        borderRadius: 20,
        gap: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        width: 100, height: 100
    },
    modalHeader: {
        color: COLORS.text,
        fontSize: FONT_SIZES.xxl,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
        textAlign: 'center',
    },
    cancelButton: {
        paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10,
        borderWidth: 1, borderColor: COLORS.textSecondary
    },
    cancelButtonText: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZES.md,
    },
})