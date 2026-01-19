// DefaultProfilePhoto.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS } from '../../utils/constants';

type Props = {
    size?: number;
};

export const DefaultProfilePhoto = ({ size = 150 }: Props) => {
    return (
        <View style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
            <Icon name="person" size={size * 0.5} color={COLORS.textSecondary} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.secondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});