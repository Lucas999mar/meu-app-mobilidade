'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = 'http://localhost:3000/api';

// Sidebar items
const sidebarItems = [
    { id: 'dashboard', icon: '📊', label: 'Visão Geral' },
    { id: 'rides', icon: '🚗', label: 'Corridas' },
    { id: 'drivers', icon: '👤', label: 'Motoristas' },
    { id: 'customers', icon: '👥', label: 'Clientes' },
    { id: 'tariffs', icon: '💰', label: 'Tarifas' },
    { id: 'categories', icon: '🏷️', label: 'Categorias' },
    { id: 'cities', icon: '🏙️', label: 'Cidades' },
    { id: 'simulator', icon: '🧮', label: 'Simulador (Teste)' },
    { id: 'demo', icon: '🧪', label: 'Demo: Corrida' },
];

// Status translations
const statusLabels: Record<string, string> = {
    requested: 'Solicitada',
    searching_driver: 'Buscando Motorista',
    driver_assigned: 'Motorista Atribuído',
    en_route_pickup: 'A Caminho',
    arrived_pickup: 'Chegou',
    in_ride: 'Em Viagem',
    completed: 'Concluída',
    cancelled: 'Cancelada',
    no_driver: 'Sem Motorista',
    available: 'Disponível',
    offline: 'Offline',
    reserved: 'Reservado',
    in_ride_driver: 'Em Corrida',
    paused: 'Pausado',
};

const statusClass = (status: string) => {
    if (['completed', 'available'].includes(status)) return 'completed';
    if (['in_ride', 'en_route_pickup', 'arrived_pickup', 'driver_assigned'].includes(status)) return 'in-ride';
    if (['searching_driver', 'requested', 'reserved', 'paused'].includes(status)) return 'searching';
    if (['cancelled', 'no_driver', 'offline'].includes(status)) return 'cancelled';
    return '';
};

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [token, setToken] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [demoLog, setDemoLog] = useState<string[]>([]);

    // States for Simulator
    const [simKm, setSimKm] = useState(5);
    const [simMin, setSimMin] = useState(15);
    const [simCat, setSimCat] = useState('b1000000-0000-0000-0000-000000000001');
    const [simResult, setSimResult] = useState<any>(null);

    // Login
    const handleLogin = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/auth/login/phone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: '+5522999990001', code: '1234' }),
            });
            const result = await res.json();
            if (result.token) {
                setToken(result.token);
                setIsLoggedIn(true);
                loadDashboard(result.token);
            }
        } catch (err) {
            console.error('Erro no login:', err);
        } finally {
            setLoading(false);
        }
    };

    const apiCall = useCallback(async (endpoint: string, method = 'GET', body?: any) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        return res.json();
    }, [token]);

    const loadDashboard = async (tkn?: string) => {
        try {
            setLoading(true);
            const authToken = tkn || token;
            const res = await fetch(`${API_URL}/admin/dashboard`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            const dashboard = await res.json();
            setData(dashboard);
        } catch (err) {
            console.error('Erro ao carregar dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadRides = async () => {
        setLoading(true);
        try {
            const rides = await apiCall('/admin/rides');
            setData(rides);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadDrivers = async () => {
        setLoading(true);
        try {
            const drivers = await apiCall('/drivers');
            setData(drivers);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const customers = await apiCall('/customers');
            setData(customers);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadTariffs = async () => {
        setLoading(true);
        try {
            const tariffs = await apiCall('/tariffs');
            setData(tariffs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        setLoading(true);
        try {
            const categories = await apiCall('/tariffs/categories');
            setData(categories);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadCities = async () => {
        setLoading(true);
        try {
            const cities = await apiCall('/tariffs/cities');
            setData(cities);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        setData(null);

        switch (tab) {
            case 'dashboard': loadDashboard(); break;
            case 'rides': loadRides(); break;
            case 'drivers': loadDrivers(); break;
            case 'customers': loadCustomers(); break;
            case 'tariffs': loadTariffs(); break;
            case 'categories': loadCategories(); break;
            case 'cities': loadCities(); break;
            case 'simulator':
                setSimResult(null);
                if (!data) loadCategories();
                break;
        }
    };

    const handleSimulate = async () => {
        try {
            const cityId = 'a1000000-0000-0000-0000-000000000001'; // Macaé hardcoded para o simulador
            const res = await apiCall(`/tariffs/simulate?cityId=${cityId}&categoryId=${simCat}&distanceKm=${simKm}&durationMin=${simMin}`);
            setSimResult(res);
        } catch (e) {
            console.error(e);
        }
    };

    // === Demo: Corrida Completa ===
    const runDemoRide = async () => {
        setDemoLog([]);
        const log = (msg: string) => setDemoLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

        try {
            // 1. Login cliente
            log('🔑 Logando como cliente (Maria Silva)...');
            const clientLogin = await fetch(`${API_URL}/auth/login/phone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: '+5522999990010', code: '1234' }),
            }).then(r => r.json());
            log(`✅ Token do cliente obtido`);

            // 2. Login motorista
            log('🔑 Logando como motorista (Carlos)...');
            const driverLogin = await fetch(`${API_URL}/auth/login/phone`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: '+5522999990020', code: '1234' }),
            }).then(r => r.json());
            log(`✅ Token do motorista obtido`);

            // 3. Motorista fica disponível e atualiza localização
            log('📍 Motorista atualizando localização...');
            await fetch(`${API_URL}/drivers/e1000000-0000-0000-0000-000000000020/location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverLogin.token}` },
                body: JSON.stringify({ lat: -22.3768, lng: -41.7883, heading: 0, speed: 0, accuracy: 10 }),
            });
            await fetch(`${API_URL}/drivers/e1000000-0000-0000-0000-000000000020/availability`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverLogin.token}` },
                body: JSON.stringify({ availability: 'available' }),
            });
            log('✅ Motorista disponível em Macaé');

            // 4. Cotação
            log('💰 Solicitando cotação...');
            const quote = await fetch(`${API_URL}/rides/quote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientLogin.token}` },
                body: JSON.stringify({
                    customerId: 'd1000000-0000-0000-0000-000000000010',
                    cityId: 'a1000000-0000-0000-0000-000000000001',
                    categoryId: 'b1000000-0000-0000-0000-000000000001',
                    originAddress: 'Centro, Macaé',
                    originLat: -22.3768,
                    originLng: -41.7883,
                    destinationAddress: 'Praia de Cavaleiros, Macaé',
                    destinationLat: -22.3640,
                    destinationLng: -41.7750,
                }),
            }).then(r => r.json());
            log(`✅ Cotação: ${quote.formattedTotal} (${(quote.distance_meters / 1000).toFixed(1)}km)`);

            // 5. Solicitar corrida
            log('🚗 Solicitando corrida...');
            const ride = await fetch(`${API_URL}/rides/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientLogin.token}` },
                body: JSON.stringify({
                    customerId: 'd1000000-0000-0000-0000-000000000010',
                    quoteId: quote.id,
                    paymentMethod: 'pix',
                    idempotencyKey: `demo-${Date.now()}`,
                }),
            }).then(r => r.json());
            log(`✅ Corrida ${ride.id?.substring(0, 8)}... criada | PIN: ${ride.pin_code}`);

            // 6. Despacho
            log('📡 Despachando para motoristas...');
            const dispatch = await fetch(`${API_URL}/rides/${ride.id}/dispatch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            }).then(r => r.json());
            log(`✅ ${dispatch.count || 0} oferta(s) enviada(s)`);

            if (dispatch.offers && dispatch.offers.length > 0) {
                // 7. Aceitar oferta
                log('🤝 Motorista aceitando oferta...');
                const accepted = await fetch(`${API_URL}/rides/${dispatch.offers[0].id}/accept`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverLogin.token}` },
                    body: JSON.stringify({ driverId: 'e1000000-0000-0000-0000-000000000020' }),
                }).then(r => r.json());
                log(`✅ Oferta aceita! Motorista: ${accepted.driver_name || 'Carlos'}`);

                // 8. Chegar ao embarque
                log('📍 Motorista chegou ao embarque...');
                await fetch(`${API_URL}/rides/${ride.id}/arrive`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverLogin.token}` },
                    body: JSON.stringify({ driverId: 'e1000000-0000-0000-0000-000000000020' }),
                });
                log('✅ Motorista no ponto de embarque');

                // 9. Iniciar viagem (PIN)
                log(`🔑 Validando PIN: ${ride.pin_code}...`);
                await fetch(`${API_URL}/rides/${ride.id}/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverLogin.token}` },
                    body: JSON.stringify({
                        driverId: 'e1000000-0000-0000-0000-000000000020',
                        pinCode: ride.pin_code,
                    }),
                });
                log('✅ PIN validado! Viagem em andamento 🚀');

                // 10. Concluir
                log('🏁 Concluindo corrida...');
                const completed = await fetch(`${API_URL}/rides/${ride.id}/complete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${driverLogin.token}` },
                    body: JSON.stringify({ driverId: 'e1000000-0000-0000-0000-000000000020' }),
                }).then(r => r.json());
                log(`🎉 CORRIDA CONCLUÍDA!`);
                log(`   Total cobrado: ${completed.receipt?.formattedTotal}`);
                log(`   Ganho motorista: ${completed.receipt?.formattedDriverEarning}`);
                log(`   Comissão plataforma: R$ ${((completed.receipt?.platformCommission || 0) / 100).toFixed(2)}`);
            } else {
                log('⚠️ Nenhum motorista disponível na área. Despacho retornou vazio.');
                log('   Possível causa: motorista sem localização registrada com PostGIS ou fora do raio.');
            }

            log('');
            log('✅ Demonstração completa! Atualize o dashboard para ver os dados.');
        } catch (error: any) {
            log(`❌ Erro: ${error.message}`);
        }
    };

    // === RENDER ===

    if (!isLoggedIn) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minHeight: '100vh', background: 'var(--bg-primary)',
            }}>
                <div className="fade-in" style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '48px', maxWidth: 400, width: '100%',
                    textAlign: 'center',
                }}>
                    <div style={{
                        width: 64, height: 64, margin: '0 auto 20px',
                        background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
                        borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32, boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
                    }}>🚗</div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Mobilidade Regional</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
                        Painel Administrativo
                    </p>
                    <div className="demo-badge" style={{ marginBottom: 24, justifyContent: 'center' }}>
                        ⚠️ AMBIENTE DE DEMONSTRAÇÃO
                    </div>
                    <button className="btn btn-primary" onClick={handleLogin} disabled={loading}
                        style={{ width: '100%', padding: '14px', fontSize: 16 }}>
                        {loading ? '⏳ Conectando...' : '🔑 Entrar como Admin'}
                    </button>
                    <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                        Login automático com usuário Admin Demo (OTP: 1234)
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="app-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">🚗</div>
                    <div>
                        <div className="sidebar-brand-text">Mobilidade</div>
                        <div className="sidebar-brand-sub">Regional</div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {sidebarItems.map(item => (
                        <button
                            key={item.id}
                            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => handleTabChange(item.id)}
                        >
                            <span className="nav-item-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginTop: 16 }}>
                    <div className="demo-badge" style={{ width: '100%', justifyContent: 'center' }}>
                        ⚠️ DEMONSTRAÇÃO
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                {/* Dashboard */}
                {activeTab === 'dashboard' && (
                    <div className="fade-in">
                        <div className="page-header">
                            <div>
                                <h1 className="page-title">Visão Geral</h1>
                                <p className="page-subtitle">Macaé/RJ — Dados em tempo real</p>
                            </div>
                            <button className="btn btn-secondary btn-sm" onClick={() => loadDashboard()}>
                                🔄 Atualizar
                            </button>
                        </div>

                        {loading && <div className="loading"><div className="loading-spinner" /></div>}

                        {data && (
                            <>
                                <div className="kpi-grid">
                                    <div className="kpi-card">
                                        <div className="kpi-card-header">
                                            <span className="kpi-card-label">Receita Total</span>
                                            <div className="kpi-card-icon green">💰</div>
                                        </div>
                                        <div className="kpi-card-value currency">{data.overview?.formattedRevenue || 'R$ 0,00'}</div>
                                        <div className="kpi-card-change positive">
                                            {data.overview?.totalCompleted || 0} corrida(s) concluída(s)
                                        </div>
                                    </div>

                                    <div className="kpi-card">
                                        <div className="kpi-card-header">
                                            <span className="kpi-card-label">Hoje — Concluídas</span>
                                            <div className="kpi-card-icon blue">✅</div>
                                        </div>
                                        <div className="kpi-card-value">{data.today?.completed || 0}</div>
                                        <div className="kpi-card-change positive">Receita: {data.today?.formattedRevenue}</div>
                                    </div>

                                    <div className="kpi-card">
                                        <div className="kpi-card-header">
                                            <span className="kpi-card-label">Ativas Agora</span>
                                            <div className="kpi-card-icon yellow">🚗</div>
                                        </div>
                                        <div className="kpi-card-value">{data.today?.active || 0}</div>
                                        <div className="kpi-card-change">Em tempo real</div>
                                    </div>

                                    <div className="kpi-card">
                                        <div className="kpi-card-header">
                                            <span className="kpi-card-label">Canceladas Hoje</span>
                                            <div className="kpi-card-icon red">❌</div>
                                        </div>
                                        <div className="kpi-card-value">{data.today?.cancelled || 0}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    <div className="table-container">
                                        <div className="table-header">
                                            <span className="table-title">Corridas por Status</span>
                                        </div>
                                        <table>
                                            <thead>
                                                <tr><th>Status</th><th>Quantidade</th></tr>
                                            </thead>
                                            <tbody>
                                                {data.ridesByStatus && Object.entries(data.ridesByStatus).map(([status, count]) => (
                                                    <tr key={status}>
                                                        <td>
                                                            <span className={`status-badge ${statusClass(status)}`}>
                                                                {statusLabels[status] || status}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontWeight: 700 }}>{count as number}</td>
                                                    </tr>
                                                ))}
                                                {(!data.ridesByStatus || Object.keys(data.ridesByStatus).length === 0) && (
                                                    <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                                                        Nenhuma corrida ainda
                                                    </td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="table-container">
                                        <div className="table-header">
                                            <span className="table-title">Motoristas</span>
                                        </div>
                                        <table>
                                            <thead>
                                                <tr><th>Status</th><th>Quantidade</th></tr>
                                            </thead>
                                            <tbody>
                                                {data.driversByAvailability && Object.entries(data.driversByAvailability).map(([status, count]) => (
                                                    <tr key={status}>
                                                        <td>
                                                            <span className={`status-badge ${statusClass(status)}`}>
                                                                {statusLabels[status] || status}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontWeight: 700 }}>{count as number}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Rides */}
                {activeTab === 'rides' && (
                    <div className="fade-in">
                        <div className="page-header">
                            <div>
                                <h1 className="page-title">Corridas</h1>
                                <p className="page-subtitle">Histórico de todas as corridas</p>
                            </div>
                            <button className="btn btn-secondary btn-sm" onClick={loadRides}>🔄 Atualizar</button>
                        </div>

                        {loading && <div className="loading"><div className="loading-spinner" /></div>}

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th><th>Cliente</th><th>Motorista</th>
                                        <th>Origem</th><th>Destino</th><th>Status</th>
                                        <th>Valor</th><th>Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(data) && data.map((ride: any) => (
                                        <tr key={ride.id}>
                                            <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                                {ride.id?.substring(0, 8)}...
                                            </td>
                                            <td>{ride.customer_name || '—'}</td>
                                            <td>{ride.driver_name || '—'}</td>
                                            <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {ride.origin_address}
                                            </td>
                                            <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {ride.destination_address}
                                            </td>
                                            <td>
                                                <span className={`status-badge ${statusClass(ride.status)}`}>
                                                    {statusLabels[ride.status] || ride.status}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 700 }}>
                                                R$ {((ride.total_charged || ride.contracted_fare || 0) / 100).toFixed(2)}
                                            </td>
                                            <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                {new Date(ride.created_at).toLocaleString('pt-BR')}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!Array.isArray(data) || data.length === 0) && !loading && (
                                        <tr><td colSpan={8}>
                                            <div className="empty-state">
                                                <div className="empty-state-icon">🚗</div>
                                                <p>Nenhuma corrida registrada. Execute a Demo para criar sua primeira corrida!</p>
                                            </div>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Drivers */}
                {activeTab === 'drivers' && (
                    <div className="fade-in">
                        <div className="page-header">
                            <div>
                                <h1 className="page-title">Motoristas</h1>
                                <p className="page-subtitle">Gestão de motoristas e veículos</p>
                            </div>
                        </div>

                        {loading && <div className="loading"><div className="loading-spinner" /></div>}

                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr><th>Nome</th><th>Telefone</th><th>Veículo</th><th>Categoria</th><th>Cidade</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(data) && data.map((d: any) => (
                                        <tr key={d.id}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.name}</td>
                                            <td>{d.phone}</td>
                                            <td>{d.brand} {d.model} — {d.plate}</td>
                                            <td>{d.category_name || '—'}</td>
                                            <td>{d.city_name || '—'}</td>
                                            <td>
                                                <span className={`status-badge ${statusClass(d.availability)}`}>
                                                    {statusLabels[d.availability] || d.availability}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Customers */}
                {activeTab === 'customers' && (
                    <div className="fade-in">
                        <div className="page-header">
                            <h1 className="page-title">Clientes</h1>
                        </div>
                        {loading && <div className="loading"><div className="loading-spinner" /></div>}
                        <div className="table-container">
                            <table>
                                <thead><tr><th>Nome</th><th>Telefone</th><th>Email</th><th>Ativo</th><th>Cadastro</th></tr></thead>
                                <tbody>
                                    {Array.isArray(data) && data.map((c: any) => (
                                        <tr key={c.id}>
                                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                                            <td>{c.phone}</td>
                                            <td>{c.email || '—'}</td>
                                            <td><span className={`status-badge ${c.is_active ? 'completed' : 'cancelled'}`}>
                                                {c.is_active ? 'Ativo' : 'Inativo'}</span></td>
                                            <td style={{ fontSize: 12 }}>{new Date(c.created_at).toLocaleDateString('pt-BR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tariffs */}
                {activeTab === 'tariffs' && (
                    <div className="fade-in">
                        <div className="page-header">
                            <h1 className="page-title">Tarifas</h1>
                        </div>
                        {loading && <div className="loading"><div className="loading-spinner" /></div>}
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Cidade</th><th>Categoria</th><th>Bandeirada</th><th>R$/km</th>
                                        <th>R$/min</th><th>Mínima</th><th>Comissão</th><th>Versão</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(data) && data.map((t: any) => (
                                        <tr key={t.id}>
                                            <td>{t.city_name}</td>
                                            <td style={{ fontWeight: 600 }}>{t.category_name}</td>
                                            <td>R$ {(t.base_fare / 100).toFixed(2)}</td>
                                            <td>R$ {(t.per_km / 100).toFixed(2)}</td>
                                            <td>R$ {(t.per_minute / 100).toFixed(2)}</td>
                                            <td>R$ {(t.minimum_fare / 100).toFixed(2)}</td>
                                            <td>{(parseFloat(t.platform_commission_rate) * 100).toFixed(0)}%</td>
                                            <td style={{ fontFamily: 'monospace' }}>v{t.version}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Dashboard Overview */}
                {activeTab === 'dashboard' && (
                    <div className="fade-in">
                        <div className="page-header">
                            <div>
                                <h1 className="page-title">Visão Geral Corporativa</h1>
                                <p className="page-subtitle">Desempenho da Frota e Financeiro em tempo real</p>
                            </div>
                        </div>

                        <div className="kpi-grid">
                            <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                                <div className="kpi-card-header"><span className="kpi-card-label">Receita Bruta (Hoje)</span></div>
                                <div className="kpi-card-value">R$ 14.590,00</div>
                            </div>
                            <div className="kpi-card" style={{ borderLeft: '4px solid var(--success)' }}>
                                <div className="kpi-card-header"><span className="kpi-card-label">Corridas Concluídas</span></div>
                                <div className="kpi-card-value">1.254</div>
                            </div>
                            <div className="kpi-card" style={{ borderLeft: '4px solid var(--info)' }}>
                                <div className="kpi-card-header"><span className="kpi-card-label">Ticket Médio</span></div>
                                <div className="kpi-card-value">R$ 11,63</div>
                            </div>
                            <div className="kpi-card" style={{ borderLeft: '4px solid var(--danger)' }}>
                                <div className="kpi-card-header"><span className="kpi-card-label">Taxa de Cancelamento</span></div>
                                <div className="kpi-card-value">2.4%</div>
                            </div>
                        </div>

                        <div className="table-container" style={{ padding: 24, marginTop: 24 }}>
                            <h2 style={{ marginBottom: 16 }}>Motoristas Ativos no Mapa</h2>
                            <div style={{ height: 300, backgroundColor: '#eaebed', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <p style={{ color: '#888' }}>🗺️ Monitoramento Operacional de Frota</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Categories Manager */}
                {activeTab === 'categories' && (
                    <div className="fade-in">
                        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h1 className="page-title">Categorias de Veículos</h1>
                                <p className="page-subtitle">Organize os tipos de serviços que seu app oferece</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => alert('No modelo completo isso abirá um Modal para inserir NOME e ÍCONE da Categoria!')}>
                                + Nova Categoria
                            </button>
                        </div>
                        {loading && <div className="loading"><div className="loading-spinner" /></div>}

                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Ícone</th>
                                        <th>Nome da Categoria</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(data) && data.map((cat: any) => (
                                        <tr key={cat.id}>
                                            <td style={{ fontSize: 24 }}>{cat.name.includes('eco') ? '🚗' : cat.name.includes('exec') ? '🚙' : '🏍️'}</td>
                                            <td>{cat.display_name}</td>
                                            <td>
                                                <span className={`status-badge ${cat.is_active ? 'completed' : 'cancelled'}`}>
                                                    {cat.is_active ? 'Ativa' : 'Inativa'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }}>Editar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Cities Manager */}
                {activeTab === 'cities' && (
                    <div className="fade-in">
                        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h1 className="page-title">Cidades de Operação</h1>
                                <p className="page-subtitle">Gerencie as regiões geográficas mapeadas onde o App funciona</p>
                            </div>
                            <button className="btn btn-primary" onClick={() => alert('Abriria o editor de cerca virtual (Polígono ou Raio em KM)!')}>
                                + Adicionar Cidade
                            </button>
                        </div>
                        {loading && <div className="loading"><div className="loading-spinner" /></div>}

                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Estado / Fuso</th>
                                        <th>Status Geográfico</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(data) && data.map((city: any) => (
                                        <tr key={city.id}>
                                            <td style={{ fontWeight: 'bold' }}>🏙️ {city.name}</td>
                                            <td style={{ color: 'var(--text-secondary)' }}>{city.state} — {city.timezone}</td>
                                            <td>
                                                <span className={`status-badge ${city.is_active ? 'completed' : 'cancelled'}`}>
                                                    {city.is_active ? 'Mapeada' : 'Fechada'}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }}>Editar Perímetro</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tariff Simulator */}
                {activeTab === 'simulator' && (
                    <div className="fade-in">
                        <div className="page-header">
                            <div>
                                <h1 className="page-title">🧮 Simulador de Tarifas</h1>
                                <p className="page-subtitle">Teste como o motor calcula percursos e ganhos (Etapa 4)</p>
                            </div>
                        </div>

                        <div className="table-container" style={{ padding: 24, maxWidth: 600, marginBottom: 24 }}>
                            <div className="form-group">
                                <label className="form-label">Quilometragem (Km)</label>
                                <input type="number" className="form-input" value={simKm} onChange={e => setSimKm(Number(e.target.value))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tempo de Viagem (Minutos)</label>
                                <input type="number" className="form-input" value={simMin} onChange={e => setSimMin(Number(e.target.value))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Categoria de Serviço</label>
                                <select className="form-input" value={simCat} onChange={e => setSimCat(e.target.value)}>
                                    <option value="b1000000-0000-0000-0000-000000000001">Econômico (Carro)</option>
                                    <option value="b1000000-0000-0000-0000-000000000002">Conforto</option>
                                    <option value="b1000000-0000-0000-0000-000000000003">Executivo</option>
                                    <option value="b1000000-0000-0000-0000-000000000004">Moto</option>
                                </select>
                            </div>

                            <button className="btn btn-primary" onClick={handleSimulate} style={{ width: '100%', marginTop: 12 }}>
                                Calcular Valores
                            </button>
                        </div>

                        {simResult && !simResult.error && (
                            <div className="kpi-grid">
                                <div className="kpi-card" style={{ borderLeft: '4px solid var(--success)' }}>
                                    <div className="kpi-card-header"><span className="kpi-card-label">Passageiro Paga</span></div>
                                    <div className="kpi-card-value">{simResult.simulation.totalFare}</div>
                                </div>
                                <div className="kpi-card" style={{ borderLeft: '4px solid var(--info)' }}>
                                    <div className="kpi-card-header"><span className="kpi-card-label">Motorista Recebe</span></div>
                                    <div className="kpi-card-value">{simResult.simulation.driverEarning}</div>
                                </div>
                                <div className="kpi-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                                    <div className="kpi-card-header"><span className="kpi-card-label">Plataforma (Lucro)</span></div>
                                    <div className="kpi-card-value">{simResult.simulation.platformCommission}</div>
                                </div>
                            </div>
                        )}

                        {simResult && simResult.error && (
                            <div className="kpi-card" style={{ color: 'var(--danger)' }}>Erro: {simResult.error}</div>
                        )}
                    </div>
                )}

                {/* Demo */}
                {activeTab === 'demo' && (
                    <div className="fade-in">
                        <div className="page-header">
                            <div>
                                <h1 className="page-title">🧪 Demo: Corrida Completa</h1>
                                <p className="page-subtitle">
                                    Simula o ciclo completo: cotação → solicitação → despacho → aceite → embarque (PIN) → conclusão → recibo
                                </p>
                            </div>
                        </div>

                        <button className="btn btn-primary" onClick={runDemoRide} style={{ marginBottom: 24 }}>
                            🚀 Iniciar Demonstração
                        </button>

                        <div className="table-container" style={{ padding: 24 }}>
                            <h3 style={{ marginBottom: 16 }}>📋 Log da Demonstração</h3>
                            <div style={{
                                background: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)',
                                padding: 16, fontFamily: 'monospace', fontSize: 13,
                                maxHeight: 500, overflowY: 'auto', lineHeight: 1.8,
                            }}>
                                {demoLog.length === 0 && (
                                    <span style={{ color: 'var(--text-muted)' }}>
                                        Clique em "Iniciar Demonstração" para executar uma corrida completa...
                                    </span>
                                )}
                                {demoLog.map((line, i) => (
                                    <div key={i} style={{
                                        color: line.includes('❌') ? 'var(--danger)' :
                                            line.includes('✅') || line.includes('🎉') ? 'var(--success)' :
                                                line.includes('⚠️') ? 'var(--warning)' : 'var(--text-primary)',
                                    }}>{line}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
