import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MainLayout } from '../components/Layout/MainLayout';
import { colors } from '../theme/colors';
import { useResponsive } from '../utils/responsive';

interface PlaceholderScreenProps {
    title: string;
    route?: string;
    navigation: any;
}

export const PlaceholderScreen: React.FC<PlaceholderScreenProps> = ({ title, route, navigation }) => {
    const { rs } = useResponsive();

    const handleNavigate = (targetRoute: string) => {
        navigation.navigate(targetRoute);
    };

    return (
        <MainLayout currentRoute={route || title} onNavigate={handleNavigate}>
            <View style={[styles.container, { padding: rs(16, 20, 24) }]}>
                <View style={styles.header}>
                    <Text style={styles.title}>{title}</Text>
                </View>
                <View style={styles.content}>
                    <Text style={styles.message}>
                        The {title} module is currently under development.
                    </Text>
                </View>
            </View>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text.primary,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 40,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    message: {
        fontSize: 18,
        color: colors.text.secondary,
        textAlign: 'center',
    },
});
