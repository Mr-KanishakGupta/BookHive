import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Typography, BorderRadius, Spacing } from '../theme/typography';

const QRScanner = ({ onScan }) => {
  const { colors } = useTheme();
  const [scanned, setScanned] = useState(false);

  // Since expo-camera may not be available in all environments,
  // we simulate a QR scanner UI
  const handleSimulatedScan = () => {
    setScanned(true);
    // Simulate scanning a book code
    setTimeout(() => {
      onScan?.({ data: '09COMAL001', type: 'qr' });
    }, 1000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.scanArea, { borderColor: colors.primary }]}>
        <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
        <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
        <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
        <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
        
        <View style={styles.centerContent}>
          <Ionicons name="qr-code" size={80} color={colors.primary} />
          <Text style={[Typography.bodySm, { color: colors.textSecondary, marginTop: Spacing.lg, textAlign: 'center' }]}>
            {scanned ? 'Processing...' : 'Position QR code within frame'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSimulatedScan}
        disabled={scanned}
        style={[styles.scanButton, { backgroundColor: colors.primary }]}
      >
        <Ionicons name="scan" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={[Typography.button, { color: '#fff' }]}>
          {scanned ? 'Scanning...' : 'Tap to Scan'}
        </Text>
      </TouchableOpacity>

      {scanned && (
        <TouchableOpacity
          onPress={() => setScanned(false)}
          style={[styles.resetButton, { borderColor: colors.primary }]}
        >
          <Text style={[Typography.buttonSm, { color: colors.primary }]}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  scanArea: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: Spacing.xxxl,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 3,
  },
  topLeft: {
    top: 0, left: 0,
    borderRightWidth: 0, borderBottomWidth: 0,
    borderTopLeftRadius: BorderRadius.md,
  },
  topRight: {
    top: 0, right: 0,
    borderLeftWidth: 0, borderBottomWidth: 0,
    borderTopRightRadius: BorderRadius.md,
  },
  bottomLeft: {
    bottom: 0, left: 0,
    borderRightWidth: 0, borderTopWidth: 0,
    borderBottomLeftRadius: BorderRadius.md,
  },
  bottomRight: {
    bottom: 0, right: 0,
    borderLeftWidth: 0, borderTopWidth: 0,
    borderBottomRightRadius: BorderRadius.md,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxxl,
    borderRadius: BorderRadius.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  resetButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
});

export default QRScanner;
