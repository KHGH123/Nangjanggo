import React from 'react';
import { ScrollView, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { FOOD_TAGS } from '@/features/food/constants/foodTags';
import { colors } from '@/shared/constants/colors';

export default function TagSelector({ value, onChange }) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {FOOD_TAGS.map(t => {
                const selected = value === t.value;
                return (
                    <TouchableOpacity
                        key={t.value}
                        style={[styles.chip, selected && { borderColor: t.color, backgroundColor: t.color + '18' }]}
                        onPress={() => onChange(selected ? null : t.value)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.dot, { backgroundColor: t.color }]} />
                        <Text style={[styles.label, selected && { color: t.color, fontWeight: '700' }]}>
                            {t.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 2,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.white,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    label: {
        fontSize: 13,
        color: colors.text,
    },
});
