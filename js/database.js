// database.js
// Aqui simulamos o backend utilizando o LocalStorage do navegador.
// Isso permite que o sistema funcione perfeitamente sem precisar configurar um servidor.

const DB_USERS = 'sertonibus_users';
const DB_BOOKINGS = 'sertonibus_bookings';
const DB_CURRENT_USER = 'sertonibus_logged_user';

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

