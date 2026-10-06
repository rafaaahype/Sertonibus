// database.js
// Aqui simulamos o backend utilizando o LocalStorage do navegador.
// Isso permite que o sistema funcione perfeitamente sem precisar configurar um servidor.

const DB_USERS          = 'sertonibus_users';
const DB_BOOKINGS       = 'sertonibus_bookings';
const DB_CURRENT_USER   = 'sertonibus_logged_user';
const DB_SHIFT_CONFIGS  = 'sertonibus_shift_configs';
const DB_LAST_ADDRESS   = 'sertonibus_last_address_'; // + id do estudante
const DB_STUDENT_SIDE   = 'sertonibus_side_';         // + id do estudante ('home' | 'destination')

// Capacidade padrão do ônibus quando o motorista ainda não definiu outra
const DEFAULT_CAPACITY = 5;

// Cidade de destino (hub universitário) — ponto de chegada/saída de todas as rotas
const DESTINATION_CITY = 'Cajazeiras - PB';

// Cidades com rotas de ônibus disponíveis (linhas intermunicipais e polo)
const ROUTE_CITIES = [
    'Cajazeiras - PB',
    'Bom Jesus - PB',
    'Cachoeira dos Índios - PB',
    'Santa Helena - PB',
    'Poço de José de Moura - PB',
];

// Todas as cidades disponíveis para seleção de origem (incluindo Cajazeiras)
const ALL_CITIES = [
    'Cajazeiras - PB',
    'Bom Jesus - PB',
    'Cachoeira dos Índios - PB',
    'Santa Helena - PB',
    'Poço de José de Moura - PB',
];

const safeJSON = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        return parsed ?? fallback;
    } catch {
        return fallback;
    }
};

const safeStorageSet = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
};

// Inicializa o sistema com dados vazios caso ainda não exista nada salvo.
const initializeEmptyData = () => {
    if (!localStorage.getItem(DB_USERS))         safeStorageSet(DB_USERS, []);
    if (!localStorage.getItem(DB_BOOKINGS))      safeStorageSet(DB_BOOKINGS, []);
    if (!localStorage.getItem(DB_SHIFT_CONFIGS)) safeStorageSet(DB_SHIFT_CONFIGS, {});
};

initializeEmptyData();

const DB = {
    // Constantes de rota expostas para os outros módulos
    DESTINATION_CITY,
    ROUTE_CITIES,
    ALL_CITIES,

    getUsers:    () => safeJSON(DB_USERS, []),
    saveUsers:   (users) => safeStorageSet(DB_USERS, Array.isArray(users) ? users : []),
    getBookings: () => safeJSON(DB_BOOKINGS, []),
    saveBookings:(bookings) => safeStorageSet(DB_BOOKINGS, Array.isArray(bookings) ? bookings : []),

    getLoggedUser: () => {
        const session = safeJSON(DB_CURRENT_USER, null);
        if (!session || typeof session.id !== 'string' || !session.id) return null;
        return DB.getUserById(session.id);
    },

    getUserById: (userId) => {
        const users = safeJSON(DB_USERS, []);
        return users.find(user => String(user.id) === String(userId)) || null;
    },

    updateUserProfile: (userId, profileData) => {
        const users = safeJSON(DB_USERS, []);
        const index = users.findIndex(user => String(user.id) === String(userId));
        if (index === -1) return false;

        const origin       = String(profileData?.origin       ?? users[index].origin       ?? '').trim().slice(0, 100);
        const homeCity     = profileData?.homeCity !== undefined ? String(profileData.homeCity).trim() : users[index].homeCity;
        const routeCity    = profileData?.routeCity !== undefined ? String(profileData.routeCity).trim() : users[index].routeCity;
        const profilePhoto = String(profileData?.profilePhoto ?? users[index].profilePhoto ?? '');
        if (profilePhoto.length > 3000000) return false;

        users[index] = { ...users[index], origin, homeCity, routeCity, profilePhoto };
        return safeStorageSet(DB_USERS, users);
    },

    setLoggedUser: (user) => safeStorageSet(DB_CURRENT_USER, { id: String(user.id) }),

    logout: () => {
        localStorage.removeItem(DB_CURRENT_USER);
        window.location.href = 'index.html';
    },

    // ------------------------------------------------------------------
    // Localização atual do aluno: 'home' (cidade de origem) | 'destination' (Cajazeiras)
    // ------------------------------------------------------------------
    getStudentSide: (userId) =>
        localStorage.getItem(DB_STUDENT_SIDE + String(userId)) || 'home',

    setStudentSide: (userId, side) => {
        if (side !== 'home' && side !== 'destination') return false;
        localStorage.setItem(DB_STUDENT_SIDE + String(userId), side);
        return true;
    },

    // ------------------------------------------------------------------
    // Configuração de turno — chave inclui a cidade da rota para evitar
    // conflito entre motoristas de cidades diferentes no mesmo horário.
    // getShiftConfig(routeCity, day, time) / saveShiftConfig(routeCity, day, time, config)
    // ------------------------------------------------------------------
    getShiftConfig: (routeCity, day, time) => {
        const all = safeJSON(DB_SHIFT_CONFIGS, {});
        const cfg = all[`${routeCity}|${day}|${time}`] || {};
        return {
            capacity:    Number.isInteger(cfg.capacity) && cfg.capacity >= 1 && cfg.capacity <= 100
                            ? cfg.capacity : DEFAULT_CAPACITY,
            description: String(cfg.description || '').slice(0, 200),
            driverId:    typeof cfg.driverId === 'string' ? cfg.driverId : ''
        };
    },

    saveShiftConfig: (routeCity, day, time, config) => {
        const currentUser = DB.getLoggedUser();
        if (!currentUser || currentUser.role !== 'driver') return false;

        const all      = safeJSON(DB_SHIFT_CONFIGS, {});
        const key      = `${routeCity}|${day}|${time}`;
        const existing = all[key] || {};
        if (existing.driverId && String(existing.driverId) !== String(currentUser.id)) return false;

        const safeCapacity    = Number.isInteger(config?.capacity) ? Math.min(100, Math.max(1, config.capacity)) : DEFAULT_CAPACITY;
        const safeDescription = String(config?.description || '').trim().slice(0, 200);
        all[key] = { capacity: safeCapacity, description: safeDescription, driverId: String(currentUser.id) };
        return safeStorageSet(DB_SHIFT_CONFIGS, all);
    },

    getLastAddress: (userId) => safeJSON(DB_LAST_ADDRESS + String(userId), null),

    saveLastAddress: (userId, address) =>
        safeStorageSet(DB_LAST_ADDRESS + String(userId), {
            street:       String(address?.street       || '').trim().slice(0, 120),
            neighborhood: String(address?.neighborhood || '').trim().slice(0, 80),
            reference:    String(address?.reference    || '').trim().slice(0, 160)
        }),

    formatAddress: (addr) => {
        if (!addr || (!addr.street && !addr.neighborhood)) return '';
        return [addr.street, addr.neighborhood].filter(Boolean).join(' - ');
    },

    escapeHTML: (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]))
};
