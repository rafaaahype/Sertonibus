// database.js
// Aqui simulamos o backend utilizando o LocalStorage do navegador.
// Isso permite que o sistema funcione perfeitamente sem precisar configurar um servidor.

const DB_USERS = 'sertonibus_users';
const DB_BOOKINGS = 'sertonibus_bookings';
const DB_CURRENT_USER = 'sertonibus_logged_user';

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
    }
};

