import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput as RNTextInput,
} from 'react-native';
import { Text, Searchbar, Surface } from 'react-native-paper';
import {
  COUNTRY_CODES,
  CountryCode,
  DEFAULT_COUNTRY,
  validatePhoneWithCountry,
  parsePhoneWithCountry,
} from '../../utils/phoneValidation';

interface PhoneInputProps {
  value?: string;
  onChangePhone: (fullPhone: string, isValid: boolean) => void;
  label?: string;
  required?: boolean;
  defaultCountry?: CountryCode;
  error?: string;
  style?: any;
  disabled?: boolean;
  /** Border/accent color for active state */
  activeColor?: string;
  /** Border color for idle state */
  borderColor?: string;
  /** Background color for country selector */
  selectorBg?: string;
  /** Text colors */
  textColor?: string;
  labelColor?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value = '',
  onChangePhone,
  label = 'Phone Number',
  required = false,
  defaultCountry = DEFAULT_COUNTRY,
  error: externalError,
  style,
  disabled = false,
  activeColor = '#068B5E',
  borderColor = '#CACCCF',
  selectorBg = '#F3F4F5',
  textColor = '#2E3135',
  labelColor = '#43474B',
}) => {
  // Initialize from value prop — parse dial code + number
  const getInitial = (v: string) => {
    if (!v) return { country: defaultCountry, number: '' };
    const parsed = parsePhoneWithCountry(v);
    return { country: parsed.country || defaultCountry, number: parsed.number };
  };

  const initial = getInitial(value);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(initial.country);
  const [phoneNumber, setPhoneNumber] = useState<string>(initial.number);
  const [showPicker, setShowPicker] = useState(false);
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const internalChange = useRef(false);

  // Sync from parent when value changes externally (e.g. async edit-mode data load)
  useEffect(() => {
    if (internalChange.current) {
      internalChange.current = false;
      return;
    }
    if (value && !phoneNumber) {
      const { country, number } = parsePhoneWithCountry(value);
      if (number) {
        setPhoneNumber(number);
        if (country) setSelectedCountry(country);
      }
    }
  }, [value]);

  const validation = touched || externalError
    ? validatePhoneWithCountry(phoneNumber, selectedCountry)
    : { valid: true };

  const showError = !!(externalError || (!validation.valid && touched && phoneNumber.length > 0));
  const errorMsg = externalError || (showError ? validation.error : undefined);
  const showValid = touched && validation.valid && phoneNumber.length > 0 && !externalError;

  const borderCol = showError ? '#f43f5e' : focused ? activeColor : borderColor;

  const digits = phoneNumber.replace(/\D/g, '');
  const remaining = selectedCountry.maxLength - digits.length;
  const digitHint =
    selectedCountry.minLength === selectedCountry.maxLength
      ? `${selectedCountry.minLength} digits required`
      : `${selectedCountry.minLength}–${selectedCountry.maxLength} digits required`;

  const handlePhoneChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, selectedCountry.maxLength);
    setPhoneNumber(clean);
    setTouched(true);
    const result = validatePhoneWithCountry(clean, selectedCountry);
    const full = clean ? `${selectedCountry.dialCode}${clean}` : '';
    internalChange.current = true;
    onChangePhone(full, result.valid);
  };

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setShowPicker(false);
    setSearch('');
    const result = validatePhoneWithCountry(phoneNumber, country);
    const full = phoneNumber ? `${country.dialCode}${phoneNumber}` : '';
    internalChange.current = true;
    onChangePhone(full, result.valid);
  };

  const filtered = COUNTRY_CODES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search)
  );

  return (
    <View style={[styles.container, style]}>
      {/* Label */}
      <Text style={[styles.label, { color: labelColor }]}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      {/* Input row */}
      <View
        style={[
          styles.inputRow,
          { borderColor: borderCol },
          disabled && styles.disabled,
        ]}
      >
        {/* Country selector button */}
        <TouchableOpacity
          style={[styles.countryBtn, { backgroundColor: selectorBg }]}
          onPress={() => !disabled && setShowPicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <View style={styles.dialWrapper}>
            <Text style={[styles.dialCode, { color: textColor }]}>
              {selectedCountry.dialCode}
            </Text>
          </View>
          <Text style={[styles.chevron, { color: labelColor }]}>▾</Text>
        </TouchableOpacity>

        {/* Vertical separator */}
        <View style={[styles.divider, { backgroundColor: borderColor }]} />

        {/* Phone number input */}
        <RNTextInput
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setTouched(true); }}
          keyboardType="phone-pad"
          placeholder={`e.g. ${'X'.repeat(selectedCountry.minLength)}`}
          placeholderTextColor="#ABADB0"
          style={[styles.phoneField, { color: textColor }]}
          maxLength={selectedCountry.maxLength}
          editable={!disabled}
        />

        {/* Digit counter — shows remaining when typing */}
        {focused && (
          <View style={styles.counterBox}>
            <Text style={[
              styles.counter,
              { color: remaining === 0 ? activeColor : remaining < 0 ? '#f43f5e' : '#ABADB0' },
            ]}>
              {digits.length}/{selectedCountry.maxLength}
            </Text>
          </View>
        )}
      </View>

      {/* Hint / error / valid text */}
      {errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : showValid ? (
        <Text style={[styles.validText, { color: activeColor }]}>
          ✓ Valid {selectedCountry.name} number
        </Text>
      ) : (
        <Text style={[styles.hintText, { color: labelColor }]}>{digitHint}</Text>
      )}

      {/* Country picker modal */}
      <Modal visible={showPicker} animationType="slide" transparent statusBarTranslucent>
        <View style={styles.modalOverlay}>
          <Surface style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                onPress={() => { setShowPicker(false); setSearch(''); }}
                style={styles.closeHit}
              >
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <Searchbar
              placeholder="Search country or dial code"
              value={search}
              onChangeText={setSearch}
              style={styles.searchbar}
              inputStyle={{ fontSize: 14 }}
            />

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => {
                const isSelected = item.code === selectedCountry.code;
                return (
                  <TouchableOpacity
                    style={[styles.countryItem, isSelected && { backgroundColor: `${activeColor}14` }]}
                    onPress={() => handleCountrySelect(item)}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.itemFlag}>{item.flag}</Text>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, isSelected && { color: activeColor, fontWeight: '600' }]}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemDigits}>
                        {item.minLength === item.maxLength
                          ? `${item.minLength} digits`
                          : `${item.minLength}–${item.maxLength} digits`}
                      </Text>
                    </View>
                    <Text style={[styles.itemDial, { color: isSelected ? activeColor : '#5C6066' }]}>
                      {item.dialCode}
                    </Text>
                    {isSelected && (
                      <Text style={[styles.checkmark, { color: activeColor }]}>✓</Text>
                    )}
                  </TouchableOpacity>
                );
              }}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
            />
          </Surface>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 5 },
  required: { color: '#f43f5e' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: '#fff',
    overflow: 'hidden',
    minHeight: 48,
  },
  disabled: { opacity: 0.55 },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 5,
    minWidth: 90,
  },
  flag: { fontSize: 20 },
  dialWrapper: { flexDirection: 'row', alignItems: 'center' },
  dialCode: { fontSize: 14, fontWeight: '600', letterSpacing: 0.2 },
  chevron: { fontSize: 10, marginLeft: 2 },
  divider: { width: 1, alignSelf: 'stretch', marginVertical: 8 },
  phoneField: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  counterBox: {
    paddingRight: 10,
    justifyContent: 'center',
  },
  counter: { fontSize: 11, fontWeight: '500' },
  hintText: { fontSize: 11, marginTop: 4, opacity: 0.7 },
  errorText: { fontSize: 12, color: '#f43f5e', marginTop: 4 },
  validText: { fontSize: 12, marginTop: 4 },
  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '82%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8EAEC',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#191919' },
  closeHit: { padding: 6 },
  closeBtn: { fontSize: 18, color: '#6B6E71' },
  searchbar: {
    margin: 12,
    marginBottom: 4,
    elevation: 0,
    borderWidth: 1,
    borderColor: '#E8EAEC',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  list: { flexGrow: 0 },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: 0.3,
    borderBottomColor: '#F0F1F2',
  },
  itemFlag: { fontSize: 24, width: 34, textAlign: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, color: '#191919' },
  itemDigits: { fontSize: 11, color: '#929598', marginTop: 1 },
  itemDial: { fontSize: 14, fontWeight: '600', minWidth: 42, textAlign: 'right' },
  checkmark: { fontSize: 15, marginLeft: 6, fontWeight: '700' },
});
