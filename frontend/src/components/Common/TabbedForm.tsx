import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Button, Surface, Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { TabDefinition, TabbedFormProps } from '../../types';
import { colors } from '../../theme/colors';
import { useResponsive } from '../../utils/responsive';

export const TabbedForm: React.FC<TabbedFormProps> = ({
  tabs,
  activeTab,
  onTabChange,
  children,
}) => {
  const { isMobile, isTablet } = useResponsive();
  const isDesktop = !isMobile;

  const s = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      margin: isMobile ? 8 : 16,
      borderRadius: isMobile ? 12 : 20,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    tabContainer: {
      paddingVertical: isMobile ? 8 : 12,
      paddingHorizontal: isMobile ? 12 : 20,
      borderTopLeftRadius: isMobile ? 12 : 20,
      borderTopRightRadius: isMobile ? 12 : 20,
    },
    tabScrollContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 4,
    },
    tabButton: {
      marginHorizontal: isMobile ? 1 : 2,
    },
    tabButtonGradient: {
      paddingHorizontal: isMobile ? 12 : 20,
      paddingVertical: isMobile ? 8 : 12,
      borderRadius: isMobile ? 12 : 16,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      minWidth: isMobile ? 90 : 120,
    },
    activeTabButton: {
      shadowOpacity: 0.25,
      elevation: 4,
    },
    tabLabel: {
      fontSize: isMobile ? 12 : 15,
      fontWeight: '600' as const,
      color: colors.text.primary,
      letterSpacing: 0.3,
      textAlign: 'center' as const,
    },
    activeTabLabel: {
      color: '#FFFFFF',
      fontWeight: '700' as const,
    },
    contentContainer: {
      flex: 1,
      padding: isMobile ? 16 : 24,
    },
  }), [isMobile, isTablet]);

  return (
    <LinearGradient
      colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
      style={s.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.6)']}
        style={s.tabContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabScrollContainer}
          bounces={false}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              disabled={tab.disabled}
              style={s.tabButton}
            >
              <LinearGradient
                colors={activeTab === tab.id ? colors.primary.gradient as [string, string] : ['transparent', 'transparent']}
                style={[
                  s.tabButtonGradient,
                  activeTab === tab.id && s.activeTabButton,
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[
                  s.tabLabel,
                  activeTab === tab.id && s.activeTabLabel,
                ]}>
                  {tab.label}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <View style={s.contentContainer}>
        {children}
      </View>
    </LinearGradient>
  );
};
