// database.js
// Simula o backend utilizando o LocalStorage do navegador.

const DB_USERS = 'sertonibus_users';
const DB_BOOKINGS = 'sertonibus_bookings';
const DB_CURRENT_USER = 'sertonibus_logged_user';
const DB_SHIFT_CONFIGS = 'sertonibus_shift_configs';
const DB_LAST_ADDRESS = 'sertonibus_last_address_';

// Regra padrão: 5 estudantes por ônibus.
const MAX_CAPACITY = 5;
const DEFAULT_CAPACITY = MAX_CAPACITY;

const DB = {
    // ==========================================
    // USUÁRIOS
    // ==========================================
    getUsers: () => {
        try {
            return JSON.parse(localStorage.getItem(DB_USERS)) || [];
        } catch (error) {
            console.error('Erro ao ler usuários:', error);
            return [];
        }
    },

    saveUsers: (users) => {
        localStorage.setItem(DB_USERS, JSON.stringify(users));
    },

    // ==========================================
    // AGENDAMENTOS
    // ==========================================
    getBookings: () => {
        try {
            return JSON.parse(localStorage.getItem(DB_BOOKINGS)) || [];
        } catch (error) {
            console.error('Erro ao ler agendamentos:', error);
            return [];
        }
    },

    saveBookings: (bookings) => {
        localStorage.setItem(DB_BOOKINGS, JSON.stringify(bookings));
    },

    // ==========================================
    // USUÁRIO LOGADO
    // ==========================================
    getLoggedUser: () => {
        try {
            return JSON.parse(localStorage.getItem(DB_CURRENT_USER));
        } catch (error) {
            console.error('Erro ao ler usuário logado:', error);
            return null;
        }
    },

    setLoggedUser: (user) => {
        localStorage.setItem(DB_CURRENT_USER, JSON.stringify(user));
    },

    logout: () => {
        localStorage.removeItem(DB_CURRENT_USER);
        window.location.href = 'index.html';
    },

    // ==========================================
    // CONFIGURAÇÃO DE VAGAS POR TURNO (motorista)
    // Guardada por dia + horário: { capacity, description }
    // ==========================================
    getShiftConfig: (day, time) => {
        try {
            const all = JSON.parse(localStorage.getItem(DB_SHIFT_CONFIGS)) || {};
            const cfg = all[`${day}|${time}`] || {};

            return {
                capacity: Number.isInteger(cfg.capacity) && cfg.capacity > 0
                    ? cfg.capacity
                    : DEFAULT_CAPACITY,
                description: typeof cfg.description === 'string'
                    ? cfg.description
                    : ''
            };
        } catch (error) {
            console.error('Erro ao ler configuração do turno:', error);
            return {
                capacity: DEFAULT_CAPACITY,
                description: ''
            };
        }
    },

    saveShiftConfig: (day, time, config) => {
        const all = JSON.parse(localStorage.getItem(DB_SHIFT_CONFIGS)) || {};
        all[`${day}|${time}`] = {
            capacity: config.capacity,
            description: config.description || ''
        };
        localStorage.setItem(DB_SHIFT_CONFIGS, JSON.stringify(all));
    },

    // ==========================================
    // ENDEREÇO DE EMBARQUE (último usado pelo estudante)
    // ==========================================
    getLastAddress: (userId) => {
        try {
            return JSON.parse(localStorage.getItem(DB_LAST_ADDRESS + userId));
        } catch (error) {
            console.error('Erro ao ler último endereço:', error);
            return null;
        }
    },

    saveLastAddress: (userId, address) => {
        localStorage.setItem(DB_LAST_ADDRESS + userId, JSON.stringify(address));
    },

    // Texto principal do endereço: "Rua X, 123 - Bairro"
    formatAddress: (addr) => {
        if (!addr || (!addr.street && !addr.neighborhood)) return '';
        return [addr.street, addr.neighborhood].filter(Boolean).join(' - ');
    },

    // Evita que texto digitado pelo usuário seja interpretado como HTML
    escapeHTML: (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]))
};
