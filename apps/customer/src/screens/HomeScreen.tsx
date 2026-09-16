import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Animated, ActivityIndicator, Platform, TextInput } from 'react-native';
import { socketService } from '../services/socket';
import { theme } from '../theme';

const MapView = Platform.OS === 'web' ? View : require('react-native-maps').default;
const Marker = Platform.OS === 'web' ? View : require('react-native-maps').Marker;

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
    const [drivers, setDrivers] = useState<any[]>([]);
    const [mode, setMode] = useState<'idle' | 'searching' | 'in_ride'>('idle');

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

    // === DEMO ONLY - IN A REAL APP, NAVIGATE USING REACT NAVIGATION ===
    const requestRide = () => {
        setMode('searching');
        setTimeout(() => {
            setMode('in_ride');
            alert('Encontramos seu motorista!');
        }, 3000);
    };

    return (
        <View style={styles.container}>
            {Platform.OS === 'web' ? (
                <View style={styles.webMapPlaceholder}>
                    <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        src="https://www.openstreetmap.org/export/embed.html?bbox=-41.85%2C-22.42%2C-41.70%2C-22.32&amp;layer=mapnik"
                    />
                </View>
            ) : (
                <MapView style={styles.map} initialRegion={{ latitude: -22.3789, longitude: -41.7766, latitudeDelta: 0.04, longitudeDelta: 0.04 }} showsUserLocation>
                    {drivers.map((d, i) => (
                        <Marker
                            key={i}
                            coordinate={{ latitude: d.lat, longitude: d.lng }}
                            title="Motorista"
                        />
                    ))}
                </MapView>
            )}

            {/* Top Absolute UI */}
            <View style={styles.topContainer}>
                <TouchableOpacity style={styles.brandPill}>
                    <Text style={styles.brandPillText}>MOBI DÃO EXPRESS</Text>
                </TouchableOpacity>
                <View style={styles.topActions}>
                    <TouchableOpacity style={styles.iconCircle}>
                        <Text style={{ fontSize: 16 }}>🎟️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconCircle}>
                        <Text style={{ fontSize: 16 }}>🔔</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom Sheet UI */}
            <View style={styles.bottomSheetWrapper}>
                <View style={styles.bottomSheet}>
                    <View style={styles.sheetHandle} />

                    {mode === 'idle' && (
                        <>
                            <Text style={styles.greeting}>Boa noite, Lucas</Text>

                            <View style={styles.searchBar}>
                                <Text style={styles.searchIcon}>🔍</Text>
                                <TextInput style={styles.searchInput} placeholder="Buscar destino" placeholderTextColor="#666" />
                            </View>

                            <View style={styles.missionContainer}>
                                <Text style={styles.missionText}>Missão: Faça mais 10 corridas até 26/9 e ganhe R$ 0,15</Text>
                                <View style={styles.progressRow}>
                                    <View style={styles.coinIcon}><Text style={{ fontSize: 10 }}>💰</Text></View>
                                    <View style={styles.progressBarBg}>
                                        <View style={styles.progressBarFill} />
                                    </View>
                                    <Text style={styles.progressText}>0 de 10</Text>
                                </View>
                            </View>

                            <View style={styles.quickOptions}>
                                <TouchableOpacity style={styles.quickBtn}>
                                    <Text style={styles.quickBtnIcon}>🏠</Text>
                                    <Text style={styles.quickBtnText}>Casa</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.quickBtn}>
                                    <Text style={styles.quickBtnIcon}>💼</Text>
                                    <Text style={styles.quickBtnText}>Trabalho</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.simulateBtn} onPress={requestRide}>
                                <Text style={styles.simulateBtnText}>Simular Chamada</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {mode === 'searching' && (
                        <View style={styles.searchingContainer}>
                            <ActivityIndicator size="large" color="#000" />
                            <Text style={styles.searchingText}>Buscando motoristas próximos...</Text>
                        </View>
                    )}

                    {mode === 'in_ride' && (
                        <View style={styles.searchingContainer}>
                            <Text style={styles.searchingText}>Motorista a caminho!</Text>
                            <TouchableOpacity style={[styles.simulateBtn, { marginTop: 20, backgroundColor: '#FF4444' }]} onPress={() => setMode('idle')}>
                                <Text style={styles.simulateBtnText}>Cancelar Corrida</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Bottom Navigation Fake */}
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.navItem}>
                        <Text style={styles.navIconActive}>🏠</Text>
                        <Text style={styles.navTextActive}>Início</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Text style={styles.navIcon}>⏱️</Text>
                        <Text style={styles.navText}>Atividade</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <Text style={styles.navIcon}>👤</Text>
                        <Text style={styles.navText}>Conta</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    map: { width, height: height },
    webMapPlaceholder: { width, height: height, backgroundColor: '#e5e5e5' },

    // Top UI
    topContainer: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    brandPill: { backgroundColor: '#FF7F50', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2 },
    brandPillText: { fontWeight: '900', fontSize: 16, color: '#000', letterSpacing: 0.5 },
    topActions: { flexDirection: 'row', gap: 12 },
    iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2 },

    // Bottom Area
    bottomSheetWrapper: { position: 'absolute', bottom: 0, width: width },
    bottomSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 10, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.1, shadowRadius: 15 },
    sheetHandle: { width: 40, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

    greeting: { fontSize: 20, fontWeight: '700', color: '#1A1A1A', marginBottom: 16 },

    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 16, height: 50, marginBottom: 16 },
    searchIcon: { fontSize: 18, marginRight: 10 },
    searchInput: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1A1A1A' },

    missionContainer: { marginBottom: 20 },
    missionText: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 8 },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    coinIcon: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center' },
    progressBarBg: { flex: 1, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3 },
    progressBarFill: { width: '0%', height: '100%', backgroundColor: '#FFD700', borderRadius: 3 },
    progressText: { fontSize: 12, color: '#666', fontWeight: '500' },

    quickOptions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    quickBtn: { flex: 1, backgroundColor: '#F8F8F8', borderRadius: 12, padding: 12, alignItems: 'center', flexDirection: 'column', gap: 8, borderWidth: 1, borderColor: '#F0F0F0' },
    quickBtnIcon: { fontSize: 24 },
    quickBtnText: { fontSize: 14, fontWeight: '700', color: '#333' },

    simulateBtn: { backgroundColor: '#000', borderRadius: 12, height: 54, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    simulateBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

    searchingContainer: { paddingVertical: 40, alignItems: 'center' },
    searchingText: { marginTop: 20, fontSize: 16, fontWeight: '600', color: '#333' },

    // Fake Bottom Navigation
    bottomNav: { flexDirection: 'row', backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingBottom: Platform.OS === 'ios' ? 24 : 12, paddingTop: 12 },
    navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    navIconActive: { fontSize: 20, color: '#FF7F50' },
    navTextActive: { fontSize: 10, fontWeight: '700', color: '#FF7F50', marginTop: 4 },
    navIcon: { fontSize: 20, color: '#999', opacity: 0.6 },
    navText: { fontSize: 10, fontWeight: '600', color: '#999', marginTop: 4 }
});
