// database.js
// Aqui simulamos o backend utilizando o LocalStorage do navegador.
// Isso permite que o sistema funcione perfeitamente sem precisar configurar um servidor.

const DB_USERS = 'sertonibus_users';
const DB_BOOKINGS = 'sertonibus_bookings';
const DB_CURRENT_USER = 'sertonibus_logged_user';
const DB_SHIFT_CONFIGS = 'sertonibus_shift_configs';
const DB_LAST_ADDRESS = 'sertonibus_last_address_'; // + id do estudante

// Capacidade padrão do ônibus quando o motorista ainda não definiu outra
const DEFAULT_CAPACITY = 5;

// Regra principal: só cabem 5 estudantes por ônibus
const MAX_CAPACITY = 5;

// Código exigido para criar uma conta de motorista (troque por um valor seu).
// Atenção: como o projeto roda só no navegador, esse código fica visível no código-fonte.
// Ele impede cadastros por engano ou curiosidade, mas não é segurança de verdade (isso exige um servidor).
const DRIVER_ACCESS_CODE = 'SERTONIBUS-MOTORISTA';

const DB = {
    // Retorna todos os usuários cadastrados
    getUsers: () => JSON.parse(localStorage.getItem(DB_USERS)) || [],
    
    // Salva os usuários
    saveUsers: (users) => localStorage.setItem(DB_USERS, JSON.stringify(users)),
    
    // Retorna todos os agendamentos de viagens
    getBookings: () => JSON.parse(localStorage.getItem(DB_BOOKINGS)) || [],
    
    // Salva os agendamentos
    saveBookings: (bookings) => localStorage.setItem(DB_BOOKINGS, JSON.stringify(bookings)),
    
    // Pega o usuário logado atualmente
    getLoggedUser: () => JSON.parse(localStorage.getItem(DB_CURRENT_USER)),
    
    // Define o usuário logado
    setLoggedUser: (user) => localStorage.setItem(DB_CURRENT_USER, JSON.stringify(user)),
    
    // Faz logout e limpa a sessão
    logout: () => {
        localStorage.removeItem(DB_CURRENT_USER);
        window.location.href = 'index.html';
    },

    // ==========================================
    // CONFIGURAÇÃO DE VAGAS POR TURNO (motorista)
    // Guardada por dia + horário: { capacity, description }
    // ==========================================
    getShiftConfig: (day, time) => {
        const all = JSON.parse(localStorage.getItem(DB_SHIFT_CONFIGS)) || {};
        const cfg = all[`${day}|${time}`] || {};
        return {
            capacity: Number.isInteger(cfg.capacity) && cfg.capacity > 0 ? cfg.capacity : DEFAULT_CAPACITY,
            description: cfg.description || ''
        };
    },

    saveShiftConfig: (day, time, config) => {
        const all = JSON.parse(localStorage.getItem(DB_SHIFT_CONFIGS)) || {};
        all[`${day}|${time}`] = { capacity: config.capacity, description: config.description };
        localStorage.setItem(DB_SHIFT_CONFIGS, JSON.stringify(all));
    },

    // ==========================================
    // ENDEREÇO DE EMBARQUE (último usado pelo estudante)
    // ==========================================
    getLastAddress: (userId) => JSON.parse(localStorage.getItem(DB_LAST_ADDRESS + userId)),

    saveLastAddress: (userId, address) =>
        localStorage.setItem(DB_LAST_ADDRESS + userId, JSON.stringify(address)),

    // Texto principal do endereço: "Rua X, 123 - Bairro"
    formatAddress: (addr) => {
        if (!addr || (!addr.street && !addr.neighborhood)) return '';
        return [addr.street, addr.neighborhood].filter(Boolean).join(' - ');
    },

    // Evita que texto digitado pelo usuário seja interpretado como HTML
    escapeHTML: (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]))
};
