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

interface TimeEntry {
    id: number;
    entryNumber: string;
    customerName: string;
    projectName: string;
    workDate: string;
    hours: number;
    description?: string;
    billable: boolean | number;
    billed: boolean | number;
    hourlyRate: number;
}

const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
        'draft': '#9E9E9E', 'sent': '#2196F3', 'received': '#4CAF50', 'cancelled': '#F44336',
        'planned': '#9E9E9E', 'in-progress': '#FF9800', 'completed': '#4CAF50',
        'active': '#4CAF50', 'paused': '#FF9800', 'inactive': '#F44336',
        'pending': '#FF9800', 'approved': '#4CAF50', 'rejected': '#F44336',
    };
    return colors[status] || '#9E9E9E';
};

export const TimeTrackingScreen: React.FC = () => {
    const navigation = useNavigation() as any;
    const { colors: themeColors } = useTheme();
    const [records, setRecords] = useState<TimeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<TimeEntry | null>(null);

    const fetchRecords = useCallback(async (pageNum = 1, search = '') => {
        try {
            const response = await api.timeTracking.getAll({
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
            console.error('Failed to fetch time entries:', error);
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
            await api.timeTracking.delete(selectedRecord.id.toString());
            setRecords(prev => prev.filter(r => r.id !== selectedRecord.id));
            setDeleteDialogVisible(false);
            setSelectedRecord(null);
        } catch (error) {
            console.error('Failed to delete time entry:', error);
        }
    };

    const handleNavigate = (route: string) => {
        navigation.navigate(route);
    };

    const isTruthy = (val: boolean | number | undefined) => val === true || val === 1;

    const renderCard = ({ item }: { item: TimeEntry }) => {
        const amount = Number(item.hours) * Number(item.hourlyRate);
        return (
            <Card
                style={[styles.card, { backgroundColor: themeColors.surface.card }]}
                onPress={() => navigation.navigate('TimeEntryForm' as any, { timeEntryId: item.id } as any)}
            >
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <View style={styles.headerLeft}>
                            <Text variant="titleMedium" style={{ color: themeColors.primary.main, fontWeight: 'bold' }}>
                                {item.entryNumber}
                            </Text>
                            <Text variant="bodySmall" style={{ color: themeColors.text.muted }}>
                                {item.projectName}
                            </Text>
                        </View>
                        <View style={styles.headerRight}>
                            <Text variant="titleMedium" style={{ color: themeColors.primary.main, fontWeight: 'bold' }}>
                                {item.hours}h
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cardBody}>
                        <View style={styles.row}>
                            <Text variant="bodyMedium" style={{ color: themeColors.text.primary, fontWeight: '600' }}>
                                {item.customerName}
                            </Text>
                            <Text variant="bodySmall" style={{ color: themeColors.text.secondary }}>
                                {item.workDate ? new Date(item.workDate).toLocaleDateString() : 'N/A'}
                            </Text>
                        </View>
                        <View style={styles.row}>
                            <Text variant="bodySmall" style={{ color: themeColors.text.secondary }}>
                                ₹{Number(item.hourlyRate).toFixed(2)}/hr × {item.hours}h
                            </Text>
                            <Text variant="bodyMedium" style={{ color: themeColors.primary.main, fontWeight: '600' }}>
                                ₹{amount.toFixed(2)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <View style={styles.chipRow}>
                            <Chip
                                mode="flat"
                                style={{ backgroundColor: isTruthy(item.billable) ? '#4CAF50' : '#9E9E9E', marginRight: 6 }}
                                textStyle={{ color: '#fff', fontSize: 10 }}
                            >
                                {isTruthy(item.billable) ? 'BILLABLE' : 'NON-BILLABLE'}
                            </Chip>
                            {isTruthy(item.billed) && (
                                <Chip
                                    mode="flat"
                                    style={{ backgroundColor: '#2196F3' }}
                                    textStyle={{ color: '#fff', fontSize: 10 }}
                                >
                                    BILLED
                                </Chip>
                            )}
                        </View>
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
    };

    return (
        <MainLayout currentRoute="TimeTracking" title="Time Tracking" onNavigate={handleNavigate}>
            <View style={[styles.container, { backgroundColor: themeColors.background.main }]}>
                <View style={styles.content}>
                    <Searchbar
                        placeholder="Search time entries..."
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
                                        No time entries found
                                    </Text>
                                    <Button
                                        mode="contained"
                                        onPress={() => navigation.navigate('TimeEntryForm' as any)}
                                        style={styles.emptyButton}
                                        buttonColor={themeColors.primary.main}
                                    >
                                        Create First Time Entry
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
                    onPress={() => navigation.navigate('TimeEntryForm' as any)}
                />

                <Portal>
                    <Dialog
                        visible={deleteDialogVisible}
                        onDismiss={() => setDeleteDialogVisible(false)}
                        style={{ backgroundColor: themeColors.surface.card }}
                    >
                        <Dialog.Title style={{ color: themeColors.text.primary }}>Delete Time Entry</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph style={{ color: themeColors.text.secondary }}>
                                Are you sure you want to delete {selectedRecord?.entryNumber}?
                            </Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setDeleteDialogVisible(false)} textColor={themeColors.primary.main}>Cancel</Button>
                            <Button onPress={handleDelete} textColor={themeColors.error.main}>Delete</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </View>
        </MainLayout>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1 },
    searchbar: { margin: 16, elevation: 2 },
    listContent: { padding: 16, paddingBottom: 80 },
    card: { marginBottom: 16, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    headerLeft: { flex: 1 },
    headerRight: { marginLeft: 8 },
    cardBody: { marginBottom: 12 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyButton: { marginTop: 16 },
    fab: { position: 'absolute', margin: 16, right: 0, bottom: 0 },
});
