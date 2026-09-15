import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { theme } from '../theme';

const MapView = Platform.OS === 'web' ? View : require('react-native-maps').default;

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
    const [isOnline, setIsOnline] = useState(false);
    const [offer, setOffer] = useState<any>(null); // Se houver oferta de corrida na tela

    const initialRegion = {
        latitude: -22.3789,
        longitude: -41.7766,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
    };

    // Simulação de receber corrida aleatoriamente após ficar online
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isOnline) {
            timer = setTimeout(() => {
                setOffer({
                    price: 'R$ 15,40',
                    pickup: 'Rua Principal, 120',
                    dropoff: 'Shopping Plaza',
                    distance: '2,5 km',
                    time: '5 min'
                });
            }, 5000);
        } else {
            setOffer(null);
        }
        return () => clearTimeout(timer);
    }, [isOnline]);

    return (
        <View style={styles.container}>
            {Platform.OS === 'web' ? (
                <View style={styles.webMapPlaceholder}>
                    <Text style={{ color: '#aaa', fontSize: 18 }}>[Mapa do Navegador]</Text>
                    <Text style={{ color: '#666', marginTop: 10 }}>O sistema de Mapas Nativos exige o Aplicativo Celular.</Text>
                </View>
            ) : (
                <MapView style={styles.map} initialRegion={initialRegion} showsUserLocation />
            )}

            {/* Driver Header HUD */}
            <View style={styles.headerHub}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Ganhos Hoje</Text>
                    <Text style={styles.statValue}>R$ 124,50</Text>
                </View>
                <TouchableOpacity style={styles.profileBtn}>
                    <Text style={styles.profileAvatar}>👨‍✈️</Text>
                </TouchableOpacity>
            </View>

            {/* Online Toggle Toggle */}
            {!offer && (
                <View style={styles.operationSheet}>
                    <Text style={styles.statusText}>
                        {isOnline ? 'Você está Online. Procurando viagens...' : 'Você está Offline.'}
                    </Text>
                    <TouchableOpacity
                        style={[styles.goOnlineBtn, isOnline && styles.goOfflineBtn]}
                        onPress={() => setIsOnline(!isOnline)}
                    >
                        <Text style={styles.goOnlineText}>{isOnline ? 'Ficar Offline' : 'Ficar Online'}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Incoming Ride Offer UI */}
            {offer && (
                <View style={styles.offerSheet}>
                    <View style={styles.offerHeader}>
                        <Text style={styles.offerPrice}>{offer.price}</Text>
                        <Text style={styles.offerSpecs}>{offer.distance} • {offer.time}</Text>
                    </View>

                    <View style={styles.locations}>
                        <View style={styles.locationRow}>
                            <View style={styles.dotPickup}></View>
                            <Text style={styles.locationText}>{offer.pickup}</Text>
                        </View>
                        <View style={styles.locationLine}></View>
                        <View style={styles.locationRow}>
                            <View style={styles.dotDropoff}></View>
                            <Text style={styles.locationText}>{offer.dropoff}</Text>
                        </View>
                    </View>

                    <View style={styles.offerActions}>
                        <TouchableOpacity style={styles.rejectBtn} onPress={() => setOffer(null)}>
                            <Text style={styles.rejectText}>Recusar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.acceptBtn} onPress={() => { setOffer(null); alert('Corrida Aceita! O GPS iniciará a rota na Etapa 3 completa.'); }}>
                            <Text style={styles.acceptText}>Tocar para Aceitar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    map: { width, height },
    webMapPlaceholder: { width, height, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
    headerHub: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    statBox: { backgroundColor: theme.colors.surface, padding: 12, borderRadius: theme.radius.m, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 4 },
    statLabel: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: '600' },
    statValue: { fontSize: 20, fontWeight: '800', color: theme.colors.text },
    profileBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center' },
    profileAvatar: { fontSize: 24 },

    operationSheet: {
        position: 'absolute', bottom: 30, left: 20, right: 20,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.l,
        borderRadius: theme.radius.l,
        alignItems: 'center',
        elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10
    },
    statusText: { fontSize: 16, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: theme.spacing.m },
    goOnlineBtn: { width: '100%', backgroundColor: theme.colors.primary, padding: 18, borderRadius: theme.radius.round, alignItems: 'center' },
    goOfflineBtn: { backgroundColor: theme.colors.danger },
    goOnlineText: { color: theme.colors.surface, fontSize: 18, fontWeight: '800' },

    offerSheet: {
        position: 'absolute', bottom: 10, left: 10, right: 10,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.l,
        borderRadius: theme.radius.l,
        elevation: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 15
    },
    offerHeader: { alignItems: 'center', marginBottom: theme.spacing.m },
    offerPrice: { fontSize: 42, fontWeight: '900', color: theme.colors.text },
    offerSpecs: { fontSize: 16, color: theme.colors.textSecondary, fontWeight: '600' },
    locations: { marginVertical: theme.spacing.m, backgroundColor: theme.colors.background, padding: theme.spacing.m, borderRadius: theme.radius.m },
    locationRow: { flexDirection: 'row', alignItems: 'center' },
    dotPickup: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.primary, marginRight: theme.spacing.s },
    dotDropoff: { width: 12, height: 12, borderRadius: 0, backgroundColor: theme.colors.accent, marginRight: theme.spacing.s },
    locationLine: { width: 2, height: 20, backgroundColor: theme.colors.border, marginLeft: 5, marginVertical: 4 },
    locationText: { fontSize: 16, color: theme.colors.text, fontWeight: '500' },

    offerActions: { flexDirection: 'row', gap: theme.spacing.m, marginTop: theme.spacing.m },
    rejectBtn: { flex: 1, backgroundColor: theme.colors.background, padding: 18, borderRadius: theme.radius.m, alignItems: 'center' },
    rejectText: { color: theme.colors.textSecondary, fontSize: 16, fontWeight: '700' },
    acceptBtn: { flex: 2, backgroundColor: theme.colors.primary, padding: 18, borderRadius: theme.radius.m, alignItems: 'center' },
    acceptText: { color: theme.colors.surface, fontSize: 16, fontWeight: '800' },
});
