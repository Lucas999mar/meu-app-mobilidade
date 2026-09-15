import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../theme';

export default function LoginScreen({ navigation }: any) {
    const [phone, setPhone] = useState('');

    const handleLogin = () => {
        // Integração real conectará na API via HTTP POST e pegará o token JWT
        navigation.replace('Home');
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Bem-vindo</Text>
                <Text style={styles.subtitle}>Insira seu telefone para entrar ou cadastrar.</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.prefix}>+55</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="(00) 00000-0000"
                        placeholderTextColor={theme.colors.textSecondary}
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                    />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Continuar</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.surface },
    content: { flex: 1, padding: theme.spacing.l, justifyContent: 'center' },
    title: { fontSize: 32, fontWeight: '800', color: theme.colors.primary, marginBottom: theme.spacing.s },
    subtitle: { fontSize: 16, color: theme.colors.textSecondary, marginBottom: theme.spacing.xl },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.m,
        paddingHorizontal: theme.spacing.m,
        height: 56,
        marginBottom: theme.spacing.l,
    },
    prefix: { fontSize: 18, color: theme.colors.text, fontWeight: '600', marginRight: theme.spacing.s },
    input: { flex: 1, fontSize: 18, color: theme.colors.text },
    button: {
        backgroundColor: theme.colors.primary,
        height: 56,
        borderRadius: theme.radius.m,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: { color: theme.colors.surface, fontSize: 18, fontWeight: '700' },
});
