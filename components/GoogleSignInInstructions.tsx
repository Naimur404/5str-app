import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GoogleSignInInstructionsProps {
  visible: boolean;
  onClose: () => void;
}

export default function GoogleSignInInstructions({ visible, onClose }: GoogleSignInInstructionsProps) {
  const { colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <View style={styles.iconContainer}>
            <Ionicons name="information-circle" size={60} color={colors.tint} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            Complete Sign In
          </Text>

          <Text style={[styles.message, { color: colors.icon }]}>
            After signing in with Google, you'll see a success page in your browser.
          </Text>

          <Text style={[styles.message, { color: colors.icon }]}>
            Simply <Text style={[styles.bold, { color: colors.text }]}>close the browser tab</Text> or tap the{' '}
            <Text style={[styles.bold, { color: colors.text }]}>back button</Text> to return to the app.
          </Text>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.tint }]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  bold: {
    fontWeight: '600',
  },
  button: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
