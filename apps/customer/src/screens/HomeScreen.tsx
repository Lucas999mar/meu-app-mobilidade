import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Animated, ActivityIndicator, Platform } from 'react-native';
import { socketService } from '../services/socket';
import { theme } from '../theme';

const MapView = Platform.OS === 'web' ? View : require('react-native-maps').default;
const Marker = Platform.OS === 'web' ? View : require('react-native-maps').Marker;

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [mode, setMode] = useState<'idle' | 'searching' | 'in_ride'>('idle');

    const initialRegion = {
        latitude: -22.3789,
        longitude: -41.7766,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
    };

    useEffect(() => {
        socketService.connect('TOKEN_CLIENTE');
        socketService.onDriverLocationUpdate((data) => {
            setDrivers((prev) => {
                const index = prev.findIndex((d) => d.driverId === data.driverId);
                if (index >= 0) {
                    const newDrivers = [...prev];
                    newDrivers[index] = data;
                    return newDrivers;
                }
                return [...prev, data];
            });
        });
        return () => socketService.disconnect();
    }, []);

    const requestRide = () => {
        setMode('searching');
        setTimeout(() => {
            setMode('in_ride');
            alert('Motorista Encontrado! Ele está a caminho.');
        }, 4000);
    };

    return (
        <View style={styles.container}>
            {Platform.OS === 'web' ? (
                <View style={styles.webMapPlaceholder}>
                    <Text style={{ color: '#aaa', fontSize: 18 }}>[Mapa do Navegador]</Text>
                    <Text style={{ color: '#666', marginTop: 10 }}>O sistema de Mapas Nativos exige o Aplicativo Celular.</Text>
                </View>
            ) : (
                <MapView style={styles.map} initialRegion={initialRegion} showsUserLocation>
                    {drivers.map((d, i) => (
                        <Marker
                            key={i}
                            coordinate={{ latitude: d.lat, longitude: d.lng }}
                            title="Motorista"
                        />
                    ))}
                </MapView>
            )}

            <View style={styles.bottomSheet}>
                {mode === 'idle' && (
                    <>
                        <View style={styles.sheetHandle} />
                        <Text style={styles.greeting}>Para onde, Matheus?</Text>
                        <TouchableOpacity style={styles.destInput} activeOpacity={0.8}>
                            <Text style={styles.destText}>Buscar destino</Text>
                        </TouchableOpacity>

                        <View style={styles.quickOptions}>
                            <View style={styles.quickCard}>
                                <Text style={styles.quickCardIcon}>🏠</Text>
                                <Text style={styles.quickCardTitle}>Casa</Text>
                            </View>
                            <View style={styles.quickCard}>
                                <Text style={styles.quickCardIcon}>💼</Text>
                                <Text style={styles.quickCardTitle}>Trabalho</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.actionBtn} onPress={requestRide}>
                            <Text style={styles.actionBtnText}>Simular Chamada</Text>
                        </TouchableOpacity>
                    </>
                )}

                {mode === 'searching' && (
                    <View style={styles.searchingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.searchingText}>Buscando motoristas próximos...</Text>
                    </View>
                )}

                {mode === 'in_ride' && (
                    <View style={styles.rideInfoContainer}>
                        <Text style={styles.rideTitle}>Motorista a caminho</Text>
                        <View style={styles.driverProfile}>
                            <View style={styles.driverAvatar}><Text>🚘</Text></View>
                            <View>
                                <Text style={styles.driverName}>Carlos Silva</Text>
                                <Text style={styles.vehicleInfo}>Chevrolet Onix - RIO1A23</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setMode('idle')}>
                            <Text style={styles.cancelBtnText}>Cancelar Corrida</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    map: { width, height: height * 0.75 },
    webMapPlaceholder: { width, height: height * 0.75, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        width,
        backgroundColor: theme.colors.surface,
        borderTopLeftRadius: theme.radius.l,
        borderTopRightRadius: theme.radius.l,
        padding: theme.spacing.l,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 8,
    },
    sheetHandle: { width: 40, height: 5, backgroundColor: theme.colors.border, borderRadius: theme.radius.round, alignSelf: 'center', marginBottom: theme.spacing.m },
    greeting: { fontSize: 24, fontWeight: '800', color: theme.colors.text, marginBottom: theme.spacing.m },
    destInput: { backgroundColor: theme.colors.background, padding: theme.spacing.m, borderRadius: theme.radius.m, marginBottom: theme.spacing.m },
    destText: { fontSize: 16, color: theme.colors.textSecondary, fontWeight: '500' },
    quickOptions: { flexDirection: 'row', gap: theme.spacing.m, marginBottom: theme.spacing.l },
    quickCard: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.m, borderRadius: theme.radius.m, alignItems: 'center' },
    quickCardIcon: { fontSize: 24, marginBottom: theme.spacing.s },
    quickCardTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
    actionBtn: { backgroundColor: theme.colors.primary, padding: theme.spacing.m, borderRadius: theme.radius.m, alignItems: 'center' },
    actionBtnText: { color: theme.colors.surface, fontSize: 16, fontWeight: '700' },
    searchingContainer: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
    searchingText: { fontSize: 18, color: theme.colors.text, marginTop: theme.spacing.m, fontWeight: '600' },
    rideInfoContainer: { paddingVertical: theme.spacing.m },
    rideTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.m },
    driverProfile: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.l },
    driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing.m },
    driverName: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
    vehicleInfo: { fontSize: 14, color: theme.colors.textSecondary },
    cancelBtn: { backgroundColor: theme.colors.danger, padding: theme.spacing.m, borderRadius: theme.radius.m, alignItems: 'center' },
    cancelBtnText: { color: theme.colors.surface, fontSize: 16, fontWeight: '600' }
});
