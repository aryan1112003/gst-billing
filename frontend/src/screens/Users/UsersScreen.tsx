import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Searchbar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { MainLayout } from '../../components/Layout/MainLayout';
import { EnhancedTable } from '../../components/Common/EnhancedTable';
import { TableColumn, PaginationState } from '../../types';
import { colors } from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
import { usersAPI } from '../../services/api';
import { confirmDelete, showDeleteSuccess, showDeleteError } from '../../utils/deleteConfirm';
import { useResponsive } from '../../utils/responsive';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'agency' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const UsersScreen: React.FC = ({ navigation }: any) => {
  const { isMobile, isTablet, isDesktop, rs } = useResponsive();
  const { colors: themeColors, isDarkMode } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    entriesPerPage: 10,
  });

  useEffect(() => {
    fetchUsers();
  }, [pagination.currentPage, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll({
        page: pagination.currentPage,
        limit: pagination.entriesPerPage,
        search: searchQuery
      });

      // Map backend fields to frontend expectations
      const roleMap: Record<number, string> = {
        1: 'admin',
        2: 'agency',
        3: 'user'
      };

      const userData = (response.data || []).map((user: any) => ({
        ...user,
        id: String(user.id),
        username: user.name || user.username || '-',
        role: user.role || roleMap[user.roleId] || 'user'
      }));
      setUsers(userData);

      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          totalPages: response.pagination.totalPages || 1,
          totalEntries: response.pagination.total || 0,
        }));
      }
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      Alert.alert('Error', err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn<User>[] = [
    {
      key: 'username',
      label: 'Username',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => {
        const roleColors: Record<string, string> = {
          admin: '#e74c3c',
          agency: '#3498db',
          user: '#95a5a6',
        };
        return (
          <View style={[s.badge, { backgroundColor: roleColors[value as string] || '#95a5a6' }]}>
            <Text style={s.badgeText}>{String(value).toUpperCase()}</Text>
          </View>
        );
      },
    },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <View style={[s.badge, { backgroundColor: value ? '#27ae60' : '#e74c3c' }]}>
          <Text style={s.badgeText}>{value ? 'Active' : 'Inactive'}</Text>
        </View>
      ),
    },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleRowAction = async (action: string, user: User) => {
    if (action === 'edit') {
      navigation.navigate('UserForm', { userId: user.id });
    } else if (action === 'delete') {
      confirmDelete(user.username || user.email, async () => {
        try {
          setLoading(true);
          await usersAPI.delete(String(user.id));
          await fetchUsers();
          showDeleteSuccess('User');
        } catch (err: any) {
          console.error('Failed to delete user:', err);
          showDeleteError(err.message || 'Unknown error', 'user');
        } finally {
          setLoading(false);
        }
      }, 'User');
    }
  };

  const handleNavigate = (route: string) => {
    navigation.navigate(route);
  };

  const s = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: isMobile ? 6 : 16,
      borderRadius: isMobile ? 4 : 12,
      margin: isMobile ? 16 : 0,
      marginBottom: isMobile ? 2 : 8,
      marginHorizontal: isMobile ? 16 : 0,
      elevation: isMobile ? 1 : 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: isMobile ? 1 : 2 },
      shadowOpacity: isMobile ? 0.03 : 0.1,
      shadowRadius: isMobile ? 1 : 4,
      borderWidth: 1,
      gap: isMobile ? 6 : 0,
    },
    searchContainer: {
      flex: 1,
    },
    searchbar: {
      backgroundColor: colors.neutral[50],
      borderRadius: 4,
      elevation: 0,
      height: 28,
    },
    searchInput: {
      fontSize: 12,
      color: colors.text.primary,
      minHeight: 0,
      paddingVertical: 0,
    },
    addButton: {
      backgroundColor: colors.primary.main,
      borderRadius: 4,
      elevation: 1,
      shadowColor: colors.primary.main,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      paddingHorizontal: 8,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text.primary,
      flex: 1,
    },
    addButtonDesktop: {
      backgroundColor: colors.primary.main,
      borderRadius: 8,
      elevation: 2,
      shadowColor: colors.primary.main,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    addButtonTextDesktop: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
    },
  }), [isMobile, isTablet]);

  return (
    <MainLayout currentRoute="Users" onNavigate={handleNavigate}>
      <View style={s.container}>
        <View style={[
          s.header,
          {
            backgroundColor: isDarkMode ? themeColors.surface.primary : '#FFFFFF',
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : colors.neutral[100],
          }
        ]}>
          {isMobile ? (
            <>
              <View style={s.searchContainer}>
                <Searchbar
                  placeholder="Search users..."
                  onChangeText={handleSearch}
                  value={searchQuery}
                  style={[
                    s.searchbar,
                    { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : colors.neutral[50] }
                  ]}
                  inputStyle={[s.searchInput, { color: themeColors.text.primary }]}
                  iconColor={themeColors.text.muted}
                  placeholderTextColor={themeColors.text.muted}
                />
              </View>
              <TouchableOpacity
                style={s.addButton}
                onPress={() => navigation.navigate('UserForm')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={16} color="#FFFFFF" />
                <Text style={s.addButtonText}>Add</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[s.title, { color: themeColors.text.primary }]}>Users</Text>
              <TouchableOpacity
                style={s.addButtonDesktop}
                onPress={() => navigation.navigate('UserForm')}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                <Text style={s.addButtonTextDesktop}>Add User</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <EnhancedTable
          data={users}
          columns={columns}
          loading={loading}
          pagination={pagination}
          searchable={true}
          onSearch={handleSearch}
          onPageChange={handlePageChange}
          onRowAction={handleRowAction}
        />
      </View>
    </MainLayout>
  );
};

