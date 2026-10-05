// auth.js
// Este arquivo lida exclusivamente com a lógica de Cadastro e Login

document.addEventListener('DOMContentLoaded', () => {
    const formRegister = document.getElementById('form-register');
    const formLogin = document.getElementById('form-login');

    // ==========================================
    // LÓGICA DE CADASTRO
    // ==========================================
    if (formRegister) {
        formRegister.addEventListener('submit', (e) => {
            e.preventDefault(); // Impede o reload da página
            
            const name = document.getElementById('name').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;

            let users = DB.getUsers();
            
            // Verifica se o usuário já existe
            if (users.find(u => u.username === username)) {
                alert('Este nome de usuário já existe! Escolha outro.');
                return;
            }

            // Salva o novo usuário
            users.push({ 
                id: Date.now().toString(), // ID único baseado no tempo
                name, 
                username, 
                password, 
                role 
            });
            DB.saveUsers(users);
            
            alert('Cadastro realizado com sucesso! Faça login para continuar.');
            window.location.href = 'login.html'; // Redireciona para o login
        });
    }

    // ==========================================
    // LÓGICA DE LOGIN
    // ==========================================
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            let users = DB.getUsers();
            
            // Procura o usuário que bate com login e senha
            let user = users.find(u => u.username === username && u.password === password);

            if (user) {
                // Guarda quem logou
                DB.setLoggedUser({ id: user.id, name: user.name, role: user.role });
                
                // Redireciona de acordo com o papel
                if (user.role === 'student') {
                    window.location.href = 'student.html';
                } else {
                    window.location.href = 'driver.html';
                }
            } else {
                alert('Usuário ou senha incorretos!');
            }
        });
    }
});

