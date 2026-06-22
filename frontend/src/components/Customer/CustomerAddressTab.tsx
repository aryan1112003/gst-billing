import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { AddressForm } from '../Common/AddressForm';
import { CustomerAddressTabProps, DetailedAddress } from '../../types';

export const CustomerAddressTab: React.FC<CustomerAddressTabProps> = ({
  formData,
  onUpdate,
  errors,
}) => {
  const updateBillingAddress = (address: DetailedAddress) => {
    onUpdate({ billingAddress: address });
  };

  const updateShippingAddress = (address: DetailedAddress) => {
    onUpdate({ shippingAddress: address });
  };

  const copyBillingToShipping = () => {
    onUpdate({ shippingAddress: { ...formData.billingAddress } });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <AddressForm
        address={formData.billingAddress}
        onChange={updateBillingAddress}
        title="Billing Address"
      />
      
      <AddressForm
        address={formData.shippingAddress}
        onChange={updateShippingAddress}
        title="Shipping Address"
        copyFromBilling
        onCopyFromBilling={copyBillingToShipping}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});