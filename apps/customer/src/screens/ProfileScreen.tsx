import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { theme } from '../theme';

export default function ProfileScreen({ navigation }: any) {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar}><Text style={{ fontSize: 30 }}>👤</Text></View>
                <Text style={styles.name}>Matheus (Passageiro)</Text>
                <Text style={styles.rating}>⭐ 4.95</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Minha Conta</Text>

                <TouchableOpacity style={styles.listItem}>
                    <Text style={styles.listText}>Meus Dados</Text>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.listItem}>
                    <Text style={styles.listText}>Formas de Pagamento</Text>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.listItem}>
                    <Text style={styles.listText}>Endereços Salvos</Text>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.listItem}>
                    <Text style={styles.listText}>Privacidade e LGPD</Text>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Login')}>
                <Text style={styles.logoutText}>Sair do Aplicativo</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { alignItems: 'center', padding: theme.spacing.xl, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.m },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.m },
    name: { fontSize: 24, fontWeight: '700', color: theme.colors.text },
    rating: { fontSize: 16, color: theme.colors.textSecondary, marginTop: theme.spacing.s, fontWeight: '600' },
    section: { backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing.m },
    sectionTitle: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', paddingVertical: theme.spacing.m },
    listItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.m, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    listText: { fontSize: 18, color: theme.colors.text },
    chevron: { fontSize: 22, color: theme.colors.textSecondary },
    logoutBtn: { margin: theme.spacing.xl, padding: theme.spacing.m, backgroundColor: theme.colors.danger, borderRadius: theme.radius.m, alignItems: 'center' },
    logoutText: { color: theme.colors.surface, fontSize: 16, fontWeight: '700' }
});
