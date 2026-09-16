import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ onLogin }) => {
  const [phone, setPhone] = useState('');

  const handleLogin = async () => {
    if (phone.length > 8) {
      await AsyncStorage.setItem('farmer_id', phone);
      onLogin(phone);
    } else {
      alert('Please enter a valid phone number.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AgriTrack Login</Text>
      <Text style={styles.subtitle}>Enter your phone number to continue</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 0712345678"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, borderRadius: 5 }
});

export default LoginScreen;
