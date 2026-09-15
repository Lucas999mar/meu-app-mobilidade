import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { theme } from '../theme';

export default function ProfileScreen({ navigation }: any) {
    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar}><Text style={{ fontSize: 30 }}>👨‍✈️</Text></View>
                <Text style={styles.name}>Carlos Silva (Motorista)</Text>
                <Text style={styles.rating}>⭐ 4.98 • 1.250 Corridas</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gestão de Ganhos</Text>

                <TouchableOpacity style={styles.listItem}>
                    <View>
                        <Text style={styles.listText}>Repasses Financeiros</Text>
                        <Text style={styles.listSub}>Conta: Asaas / Pix</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.listItem}>
                    <View>
                        <Text style={styles.listText}>Meu Veículo</Text>
                        <Text style={styles.listSub}>Chevrolet Onix - RIO1A23</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.listItem}>
                    <Text style={styles.listText}>Documentação</Text>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.listItem}>
                    <Text style={styles.listText}>Ajuda e Suporte</Text>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={() => alert('Sair')}>
                <Text style={styles.logoutText}>Ficar Offline e Sair</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { alignItems: 'center', padding: theme.spacing.xl, backgroundColor: theme.colors.surface, marginBottom: theme.spacing.m, borderBottomWidth: 1, borderColor: theme.colors.border },
    avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.m },
    name: { fontSize: 24, fontWeight: '700', color: theme.colors.text },
    rating: { fontSize: 16, color: theme.colors.primary, marginTop: theme.spacing.s, fontWeight: '700' },
    section: { backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing.m },
    sectionTitle: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', paddingVertical: theme.spacing.m },
    listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.m, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    listText: { fontSize: 18, color: theme.colors.text, fontWeight: '500' },
    listSub: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 },
    chevron: { fontSize: 24, color: theme.colors.textSecondary },
    logoutBtn: { margin: theme.spacing.xl, padding: theme.spacing.m, backgroundColor: theme.colors.danger, borderRadius: theme.radius.m, alignItems: 'center' },
    logoutText: { color: theme.colors.surface, fontSize: 16, fontWeight: '700' }
});
