import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import {
    Card,
    Text,
    Chip,
    FAB,
    ActivityIndicator,
    Button,
    Portal,
    Dialog,
    Paragraph,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { Searchbar } from 'react-native-paper';
import { MainLayout } from '../../components/Layout/MainLayout';

interface TripSheet {
    id: number;
    tripNumber: string;
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
    fromLocation: string;
    toLocation: string;
    departureDate: string;
    returnDate?: string;
    purpose?: string;
    distanceKm: number;
    fuelCost: number;
    status: string;
    createdAt: string;
}

const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
        'planned': '#9E9E9E',
        'in-transit': '#FF9800',
        'completed': '#4CAF50',
        'cancelled': '#F44336',
        'active': '#4CAF50',
        'inactive': '#9E9E9E',
        'under-maintenance': '#FF9800',
        'expired': '#F44336',
        'recalled': '#9E9E9E',
        'consumed': '#2196F3',
        'import': '#2196F3',
        'export': '#4CAF50',
        'at-port': '#FFC107',
        'cleared': '#4CAF50',
        'delivered': '#2196F3',
        'refunded': '#F44336',
    };
    return colors[status] || '#9E9E9E';
};

export const TripSheetsScreen: React.FC = () => {
    const navigation = useNavigation() as any;
    const { colors: themeColors } = useTheme();
    const [records, setRecords] = useState<TripSheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<TripSheet | null>(null);

    const fetchRecords = useCallback(async (pageNum = 1, search = '') => {
        try {
            const response = await api.tripSheets.getAll({
                page: pageNum,
                limit: 10,
                search,
            });

            if (pageNum === 1) {
                setRecords(response.data);
            } else {
                setRecords(prev => [...prev, ...response.data]);
            }

            setHasMore(response.data.length === 10);
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to fetch trip sheets:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchRecords(1, searchQuery);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setLoading(true);
        fetchRecords(1, query);
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchRecords(page + 1, searchQuery);
        }
    };

    const handleDelete = async () => {
        if (!selectedRecord) return;

        try {
            await api.tripSheets.delete(selectedRecord.id.toString());
            setRecords(prev => prev.filter(r => r.id !== selectedRecord.id));
            setDeleteDialogVisible(false);
            setSelectedRecord(null);
        } catch (error) {
            console.error('Failed to delete trip sheet:', error);
        }
    };

    const handleNavigate = (route: string) => {
        navigation.navigate(route);
    };

    const renderCard = ({ item }: { item: TripSheet }) => (
        <Card
            style={[styles.card, { backgroundColor: themeColors.surface.card }]}
            onPress={() => navigation.navigate('TripSheetForm' as any, { tripSheetId: item.id } as any)}
        >
            <Card.Content>
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        <Text variant="titleMedium" style={{ color: themeColors.primary.main, fontWeight: 'bold' }}>
                            {item.tripNumber}
                        </Text>
                        <Text variant="bodySmall" style={{ color: themeColors.text.muted }}>
                            {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Chip
                            mode="flat"
                            style={{ backgroundColor: getStatusColor(item.status) }}
                            textStyle={{ color: '#fff', fontSize: 10 }}
                        >
                            {item.status.toUpperCase()}
                        </Chip>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.row}>
                        <Text variant="bodyMedium" style={{ color: themeColors.text.primary, fontWeight: '600' }}>
                            {item.vehicleNumber}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text variant="bodySmall" style={{ color: themeColors.text.secondary }}>
                            Driver: {item.driverName} ({item.driverPhone})
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text variant="bodySmall" style={{ color: themeColors.text.secondary }}>
                            {item.fromLocation} → {item.toLocation}
                        </Text>
                    </View>

                    <View style={styles.row}>
                        <Text variant="bodySmall" style={{ color: themeColors.text.secondary }}>
                            Departure: {new Date(item.departureDate).toLocaleDateString()}
                        </Text>
                        <Text variant="bodySmall" style={{ color: themeColors.text.secondary }}>
                            {item.distanceKm} km
                        </Text>
                    </View>
                </View>

                <View style={styles.cardFooter}>
                    <Chip
                        mode="flat"
                        style={{ backgroundColor: getStatusColor(item.status) }}
                        textStyle={{ color: '#fff', fontSize: 10 }}
                    >
                        {item.status.toUpperCase()}
                    </Chip>
                    <Button
                        mode="text"
                        textColor={themeColors.error.main}
                        onPress={() => {
                            setSelectedRecord(item);
                            setDeleteDialogVisible(true);
                        }}
                    >
                        Delete
                    </Button>
                </View>
            </Card.Content>
        </Card>
    );

    return (
        <MainLayout currentRoute="TripSheets" title="Trip Sheets" onNavigate={handleNavigate}>
            <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                <View style={styles.content}>
                    <Searchbar
                        placeholder="Search trip sheets..."
                        onChangeText={handleSearch}
                        value={searchQuery}
                        style={[styles.searchbar, { backgroundColor: themeColors.surface.card }]}
                        inputStyle={{ color: themeColors.text.primary }}
                        iconColor={themeColors.text.muted}
                        placeholderTextColor={themeColors.text.muted}
                    />

                    {loading && page === 1 ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={themeColors.primary.main} />
                        </View>
                    ) : (
                        <FlatList
                            data={records}
                            renderItem={renderCard}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={styles.listContent}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={handleRefresh}
                                    colors={[themeColors.primary.main]}
                                    tintColor={themeColors.primary.main}
                                />
                            }
                            onEndReached={handleLoadMore}
                            onEndReachedThreshold={0.5}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <Text variant="bodyLarge" style={{ color: themeColors.text.muted }}>
                                        No trip sheets found
                                    </Text>
                                    <Button
                                        mode="contained"
                                        onPress={() => navigation.navigate('TripSheetForm' as any)}
                                        style={styles.emptyButton}
                                        buttonColor={themeColors.primary.main}
                                    >
                                        Create First Trip Sheet
                                    </Button>
                                </View>
                            }
                        />
                    )}
                </View>

                <FAB
                    icon="plus"
                    style={[styles.fab, { backgroundColor: themeColors.primary.main }]}
                    color="#FFFFFF"
                    onPress={() => navigation.navigate('TripSheetForm' as any)}
                />

                <Portal>
                    <Dialog
                        visible={deleteDialogVisible}
                        onDismiss={() => setDeleteDialogVisible(false)}
                        style={{ backgroundColor: themeColors.surface.card }}
                    >
                        <Dialog.Title style={{ color: themeColors.text.primary }}>Delete Trip Sheet</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph style={{ color: themeColors.text.secondary }}>
                                Are you sure you want to delete trip sheet {selectedRecord?.tripNumber}?
                            </Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setDeleteDialogVisible(false)} textColor={themeColors.primary.main}>Cancel</Button>
                            <Button onPress={handleDelete} textColor={themeColors.error.main}>
                                Delete
                            </Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </View>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    searchbar: {
        margin: 16,
        elevation: 2,
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    card: {
        marginBottom: 16,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        marginLeft: 8,
    },
    cardBody: {
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyButton: {
        marginTop: 16,
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
});
