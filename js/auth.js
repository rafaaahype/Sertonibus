// auth.js
// Este arquivo lida exclusivamente com a lógica de Cadastro e Login

// Remove espaços das pontas (inclusive espaços invisíveis, como o de largura zero)
const clean = (text) => text.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

document.addEventListener('DOMContentLoaded', () => {
    const formRegister = document.getElementById('form-register');
    const formLogin = document.getElementById('form-login');

    // ==========================================
    // LÓGICA DE CADASTRO
    // ==========================================
    if (formRegister) {
        const roleSelect = document.getElementById('role');
        const driverCodeField = document.getElementById('driver-code-field');
        const driverCodeInput = document.getElementById('driver-code');

        // O campo do código só aparece (e só é obrigatório) quando o perfil é Motorista.
        // O conteúdo do código é livre: não existe um código fixo para validar.
        const syncDriverCodeField = () => {
            const isDriver = roleSelect.value === 'driver';
            driverCodeField.classList.toggle('hidden', !isDriver);
            driverCodeInput.required = isDriver;
            if (!isDriver) driverCodeInput.value = '';
        };
        roleSelect.addEventListener('change', syncDriverCodeField);
        syncDriverCodeField();

        formRegister.addEventListener('submit', (e) => {
            e.preventDefault(); // Impede o reload da página

            // Nome sem espaços nas pontas e sem espaços duplicados no meio
            const name = clean(document.getElementById('name').value).replace(/\s+/g, ' ');
            const username = clean(document.getElementById('username').value);
            const password = document.getElementById('password').value;
            const role = roleSelect.value;

            if (!name) {
                alert('Informe seu nome completo. Ele não pode ficar vazio nem conter apenas espaços.');
                document.getElementById('name').focus();
                return;
            }

            if (!username) {
                alert('Informe um nome de usuário. Ele não pode ficar vazio nem conter apenas espaços.');
                document.getElementById('username').focus();
                return;
            }

            if (!clean(password)) {
                alert('A senha não pode conter apenas espaços.');
                document.getElementById('password').focus();
                return;
            }

            // Só existem dois perfis válidos
            if (role !== 'student' && role !== 'driver') {
                alert('Perfil inválido.');
                return;
            }

            let users = DB.getUsers();

            // Verifica se o usuário já existe (ignorando espaços nas pontas, inclusive em contas antigas)
            if (users.find(u => clean(u.username) === username)) {
                alert('Este nome de usuário já existe! Escolha outro.');
                document.getElementById('username').focus();
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
            
            const username = clean(document.getElementById('username').value);
            const password = document.getElementById('password').value;

            let users = DB.getUsers();
            
            // Procura o usuário que bate com login e senha (espaços nas pontas do usuário são ignorados)
            let user = users.find(u => clean(u.username) === username && u.password === password);

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

