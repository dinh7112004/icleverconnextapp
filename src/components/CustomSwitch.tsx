import React, { useRef, useEffect } from 'react';
import { StyleSheet, Animated, Pressable, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CustomSwitchProps {
    value: boolean;
    onValueChange: (val: boolean) => void;
    activeColor?: string;
    inactiveColor?: string;
}

export default function CustomSwitch({ 
    value, 
    onValueChange, 
    activeColor, 
    inactiveColor 
}: CustomSwitchProps) {
    const { isDark, theme } = useTheme();
    const finalActiveColor = activeColor || theme.primary;
    const finalInactiveColor = inactiveColor || (isDark ? '#334155' : '#e2e8f0');
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: value ? 1 : 0,
            duration: 250,
            useNativeDriver: false,
        }).start();
    }, [value]);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 22], // Adjusted for 48px width and 24px diameter thumb
    });

    const backgroundColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [finalInactiveColor, finalActiveColor],
    });

    return (
        <Pressable onPress={() => onValueChange(!value)}>
            <Animated.View style={[styles.track, { backgroundColor }]}>
                <Animated.View 
                    style={[
                        styles.thumb, 
                        { transform: [{ translateX }] }
                    ]} 
                />
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    track: {
        width: 48,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    thumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2.5,
        elevation: 3,
    },
});
