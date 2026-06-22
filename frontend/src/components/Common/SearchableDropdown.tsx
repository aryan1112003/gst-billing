import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import {
  TextInput,
  Menu,
  Divider,
  Text,
  TouchableRipple,
} from 'react-native-paper';
import { SearchableDropdownProps, DropdownOption } from '../../types';
import { useResponsive } from '../../utils/responsive';

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onSelect,
  placeholder,
  searchable = true,
}) => {
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isMobile, isTablet, width } = useResponsive();

  const selectedOption = options.find(option => option.value === value);
  const displayValue = selectedOption ? selectedOption.label : '';

  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleSelect = (selectedValue: string) => {
    onSelect(selectedValue);
    setVisible(false);
    setSearchQuery('');
  };

  const s = useMemo(() => StyleSheet.create({
    container: {
      position: 'relative',
      marginBottom: 12,
    },
    input: {
      backgroundColor: '#FFFFFF',
      fontSize: isMobile ? 14 : 16,
    },
    menuContent: {
      backgroundColor: '#FFFFFF',
      maxHeight: isMobile ? 250 : 300,
      minWidth: isMobile ? width * 0.8 : 200,
      maxWidth: isMobile ? width * 0.9 : 400,
    },
    searchContainer: {
      padding: isMobile ? 6 : 8,
    },
    searchInput: {
      backgroundColor: '#F8F9FA',
      fontSize: isMobile ? 12 : 14,
    },
    optionsList: {
      maxHeight: isMobile ? 150 : 200,
    },
    optionItem: {
      paddingHorizontal: isMobile ? 12 : 16,
      paddingVertical: isMobile ? 10 : 12,
    },
    optionText: {
      fontSize: isMobile ? 14 : 16,
    },
  }), [isMobile, isTablet, width]);

  const renderOption = ({ item }: { item: DropdownOption }) => (
    <TouchableRipple
      onPress={() => handleSelect(item.value)}
      style={s.optionItem}
    >
      <Text style={s.optionText}>{item.label}</Text>
    </TouchableRipple>
  );

  return (
    <View style={s.container}>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <TextInput
            mode="outlined"
            value={displayValue}
            placeholder={placeholder}
            editable={false}
            right={
              <TextInput.Icon
                icon={visible ? 'chevron-up' : 'chevron-down'}
                onPress={() => setVisible(!visible)}
              />
            }
            onPress={() => setVisible(true)}
            style={s.input}
          />
        }
        contentStyle={s.menuContent}
      >
        {searchable && (
          <>
            <View style={s.searchContainer}>
              <TextInput
                mode="outlined"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search..."
                dense
                style={s.searchInput}
              />
            </View>
            <Divider />
          </>
        )}

        <View style={s.optionsList}>
          <FlatList
            data={filteredOptions}
            renderItem={renderOption}
            keyExtractor={(item) => item.value}
            nestedScrollEnabled
          />
        </View>
      </Menu>
    </View>
  );
};
