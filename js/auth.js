// auth.js
// Cadastro e login com validações consistentes de dados.

document.addEventListener('DOMContentLoaded', () => {
    const formRegister = document.getElementById('form-register');
    const formLogin = document.getElementById('form-login');

    document.querySelectorAll('[data-password-toggle]').forEach(toggle => {
        toggle.addEventListener('click', () => {
            const input = document.getElementById(toggle.dataset.passwordToggle);
            if (!input) return;
            const showing = input.type === 'text';
            input.type = showing ? 'password' : 'text';
            toggle.textContent = showing ? '👁' : '🙈';
            toggle.setAttribute('aria-label', showing ? 'Mostrar senha' : 'Ocultar senha');
            toggle.setAttribute('aria-pressed', String(!showing));
        });
    });

    const setAuthLoading = (form, loading, label) => {
        const button = form?.querySelector('.sertonibus-auth-submit');
        if (!button) return;
        button.disabled = loading;
        button.classList.toggle('is-loading', loading);
        const defaultLabel = button.querySelector('.sertonibus-submit-label');
        const loadingLabel = button.querySelector('.sertonibus-submit-loading');
        if (defaultLabel) defaultLabel.textContent = label || defaultLabel.textContent;
        if (loadingLabel) loadingLabel.setAttribute('aria-hidden', String(!loading));
    };

    const hashPassword = async (value) => {
        const data = new TextEncoder().encode(value);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
    };

    if (formRegister) {
        const roleSelect         = document.getElementById('role');
        const driverVerification = document.getElementById('driver-verification');
        const driverCodeInput    = document.getElementById('driver-code');
        const registrationField  = document.getElementById('student-registration-field');
        const registrationInput  = document.getElementById('registration');
        const cpfInput           = document.getElementById('cpf');
        const passwordError      = document.getElementById('password-error');
        const passwordInput      = document.getElementById('password');
        const passwordStrength   = document.getElementById('password-strength');
        const passwordStrengthLabel = document.getElementById('password-strength-label');
        const passwordStrengthHint  = document.getElementById('password-strength-hint');
        const passwordStrengthBar   = document.getElementById('password-strength-bar');
        const cpfError           = document.getElementById('cpf-error');
        const registrationError  = document.getElementById('registration-error');
        const homeCityField      = document.getElementById('home-city-field');
        const homeCitySelect     = document.getElementById('home-city');
        const routeCityField     = document.getElementById('route-city-field');
        const routeCitySelect    = document.getElementById('route-city');
        const DRIVER_AUTH_CODE   = 'SERTONIBUS-MOTORISTA';

        // Popula os selects de cidade a partir da lista central em database.js
        if (homeCitySelect && DB.ALL_CITIES) {
            DB.ALL_CITIES.forEach(city => {
                const opt = document.createElement('option');
                opt.value = city;
                opt.textContent = city;
                homeCitySelect.appendChild(opt);
            });
        }

        if (routeCitySelect && DB.ROUTE_CITIES) {
            DB.ROUTE_CITIES.forEach(city => {
                const opt = document.createElement('option');
                opt.value = city;
                opt.textContent = city;
                routeCitySelect.appendChild(opt);
            });
        }

        const showError = (element, message) => {
            if (!element) return;
            element.textContent = message;
            element.classList.remove('hidden');
        };

        const clearError = (element) => {
            if (!element) return;
            element.textContent = '';
            element.classList.add('hidden');
        };

        const markField = (input, valid) => {
            if (!input || !window.SertonibusUI) return;
            SertonibusUI.setFieldState(input, valid ? 'success' : 'error');
        };

        const updateDriverVerification = () => {
            const isDriver = roleSelect?.value === 'driver';
            driverVerification?.classList.toggle('hidden', !isDriver);

            if (driverCodeInput) {
                driverCodeInput.required = isDriver;
                if (!isDriver) driverCodeInput.value = '';
            }

            if (registrationField && registrationInput) {
                registrationField.classList.toggle('hidden', isDriver);
                registrationInput.required = !isDriver;
                if (isDriver) registrationInput.value = '';
            }

            // Campos de cidade
            if (homeCityField && homeCitySelect) {
                homeCityField.classList.toggle('hidden', isDriver);
                homeCitySelect.required = !isDriver;
                if (isDriver) homeCitySelect.value = '';
            }
            if (routeCityField && routeCitySelect) {
                routeCityField.classList.toggle('hidden', !isDriver);
                routeCitySelect.required = isDriver;
                if (!isDriver) routeCitySelect.value = '';
            }
        };

        roleSelect?.addEventListener('change', updateDriverVerification);
        updateDriverVerification();


        cpfInput?.addEventListener('input', () => {
            let value = cpfInput.value.replace(/\D/g, '').slice(0, 11);
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            cpfInput.value = value;
        });

        registrationInput?.addEventListener('input', () => {
            registrationInput.value = registrationInput.value.replace(/\D/g, '').slice(0, 12);
        });

        const updatePasswordStrength = () => {
            if (!passwordInput || !passwordStrength) return;

            const value = passwordInput.value;
            if (!value) {
                passwordStrength.classList.add('hidden');
                return;
            }

            passwordStrength.classList.remove('hidden');

            const hasSpace = /\s/.test(value);
            const lengthScore = Math.min(value.length / 12, 1) * 55;
            const varietyScore =
                (/\d/.test(value) ? 12 : 0) +
                (/[^A-Za-z0-9]/.test(value) ? 13 : 0) +
                (/[a-z]/.test(value) ? 7 : 0) +
                (/[A-Z]/.test(value) ? 7 : 0) +
                (value.length >= 10 ? 6 : 0);

            let percentage = Math.min(100, Math.round(lengthScore + varietyScore));
            if (hasSpace) percentage = Math.min(percentage, 15);

            const level = hasSpace ? 'Inválida' : percentage < 45 ? 'Fraca' : percentage < 75 ? 'Média' : 'Forte';
            const levelClass = level === 'Forte' ? 'text-emerald-600' : level === 'Média' ? 'text-amber-600' : 'text-red-600';
            const fillClass = level === 'Forte' ? 'bg-emerald-500' : level === 'Média' ? 'bg-amber-500' : 'bg-red-500';

            passwordStrengthLabel.textContent = level;
            passwordStrengthLabel.className = 'text-xs font-semibold ' + levelClass;
            passwordStrengthHint.textContent = hasSpace
                ? 'Remova os espaços da senha'
                : percentage < 45
                    ? 'Adicione mais caracteres, números e símbolos'
                    : percentage < 75
                        ? 'Está melhorando; aumente o comprimento e a variedade'
                        : 'Senha com boa complexidade';

            passwordStrengthBar.className = 'h-full rounded-full transition-all duration-300 ease-out ' + fillClass;
            passwordStrengthBar.style.width = percentage + '%';
        };

        passwordInput?.addEventListener('input', updatePasswordStrength);
        updatePasswordStrength();

        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();

            clearError(passwordError);
            clearError(cpfError);
            clearError(registrationError);

            const rawName     = document.getElementById('name')?.value.trim() || '';
            const name        = rawName.replace(/\s+/g, ' ');
            const rawUsername = document.getElementById('username')?.value.trim() || '';
            const username    = rawUsername.toLowerCase();
            const password    = document.getElementById('password')?.value || '';
            const cpf         = document.getElementById('cpf')?.value.trim() || '';
            const registration= document.getElementById('registration')?.value.trim() || '';
            const role        = document.getElementById('role')?.value || 'student';
            const driverCode  = document.getElementById('driver-code')?.value.trim() || '';
            const homeCity    = document.getElementById('home-city')?.value.trim() || '';
            const routeCity   = document.getElementById('route-city')?.value.trim() || '';

            if (!name || !username || !cpf) {
                alert('Preencha nome, nome de usuário e CPF para continuar.');
                if (!name)     markField(document.getElementById('name'), false);
                if (!username) markField(document.getElementById('username'), false);
                if (!cpf)      markField(cpfInput, false);
                return;
            }
            markField(document.getElementById('name'), true);
            markField(document.getElementById('username'), true);
            markField(cpfInput, true);

            if (!/^[A-Za-zÀ-ÖØ-öø-ÿ]+(?: [A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(name)) {
                markField(document.getElementById('name'), false);
                alert('Nome inválido: use apenas letras e espaços entre as palavras.');
                return;
            }

            if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
                markField(document.getElementById('username'), false);
                alert('Nome de usuário inválido. Use de 3 a 30 caracteres: apenas letras minúsculas, números, ponto, hífen ou sublinhado, sem espaços.');
                return;
            }

            let hasValidationError = false;
            const hasPasswordSpace      = /\s/.test(password);
            const hasMinimumLength      = password.length >= 7;
            const hasNumber             = /\d/.test(password);
            const hasSpecialCharacter   = /[^A-Za-z0-9]/.test(password);

            if (hasPasswordSpace) {
                showError(passwordError, 'A senha não pode conter espaços.');
                markField(passwordInput, false);
                hasValidationError = true;
            } else if (!hasMinimumLength || !hasNumber || !hasSpecialCharacter) {
                showError(passwordError, 'Senha fraca: use no mínimo 7 caracteres, incluindo pelo menos 1 número e 1 caractere especial.');
                markField(passwordInput, false);
                hasValidationError = true;
            } else {
                markField(passwordInput, true);
            }

            if (!/^[0-9.\-\s]+$/.test(cpf)) {
                showError(cpfError, 'CPF inválido: use apenas números e a formatação padrão.');
                markField(cpfInput, false);
                hasValidationError = true;
            }

            const cpfDigits = cpf.replace(/\D/g, '');
            if (cpfDigits.length !== 11 || /^(\d)\1{10}$/.test(cpfDigits)) {
                showError(cpfError, 'CPF inválido: informe um CPF válido com 11 números.');
                markField(cpfInput, false);
                hasValidationError = true;
            } else {
                markField(cpfInput, true);
            }

            const registrationDigits = registration.replace(/\D/g, '');
            if (role === 'student' && !/^\d{12}$/.test(registration)) {
                showError(registrationError, 'Matrícula inválida: informe exatamente 12 números.');
                markField(registrationInput, false);
                hasValidationError = true;
            } else if (role === 'student') {
                markField(registrationInput, true);
            }

            // Validação de cidade
            if (role === 'student' && !homeCity) {
                alert('Selecione sua cidade de origem para continuar.');
                markField(document.getElementById('home-city'), false);
                hasValidationError = true;
            }
            if (role === 'driver' && !routeCity) {
                alert('Selecione a cidade da sua rota para continuar.');
                markField(document.getElementById('route-city'), false);
                hasValidationError = true;
            }

            if (hasValidationError) return;

            if (role === 'driver' && driverCode !== DRIVER_AUTH_CODE) {
                alert('Código de autorização do motorista inválido.');
                return;
            }

            const users = DB.getUsers();

            const usernameExists = users.some(user =>
                String(user.username || '').trim().toLowerCase() === username
            );
            if (usernameExists) {
                alert('Este nome de usuário já existe. Escolha outro.');
                return;
            }

            if (users.some(user => String(user.cpf || '').replace(/\D/g, '') === cpfDigits)) {
                showError(cpfError, 'Este CPF já está cadastrado em outro usuário.');
                return;
            }

            if (role === 'student' && users.some(user => String(user.registration || '') === registrationDigits)) {
                showError(registrationError, 'Esta matrícula já está cadastrada em outro usuário.');
                return;
            }

            setAuthLoading(formRegister, true, 'Cadastrar');
            const passwordHash = await hashPassword(password);

            users.push({
                id:           Date.now().toString(),
                name,
                username,
                cpf:          cpfDigits,
                registration: role === 'student' ? registrationDigits : '',
                role,
                homeCity:     role === 'student' ? homeCity : '',
                routeCity:    role === 'driver'  ? routeCity : '',
                passwordHash
            });

            DB.saveUsers(users);
            SertonibusUI.showToast('Cadastro realizado com sucesso! Redirecionando para o login.', 'success', 2200);
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 650);
        });
    }


    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();

            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const username = usernameInput?.value.trim().toLowerCase() || '';
            const password = passwordInput?.value || '';

            if (!username || !password) {
                alert('Informe usuário e senha.');
                return;
            }

            const users = DB.getUsers();
            const passwordHash = await hashPassword(password);
            const user = users.find(item => {
                if (String(item.username || '').trim().toLowerCase() !== username) return false;
                if (item.passwordHash) return item.passwordHash === passwordHash;
                return item.password === password;
            });

            if (!user) {
                alert('Usuário ou senha incorretos.');
                return;
            }

            setAuthLoading(formLogin, true, 'Entrar');

            // Migra todos os cadastros antigos para hash na primeira autenticação.
            let migrated = false;
            for (const legacyUser of users) {
                if (!legacyUser.password || legacyUser.passwordHash) continue;
                legacyUser.passwordHash = await hashPassword(legacyUser.password);
                delete legacyUser.password;
                migrated = true;
            }
            if (migrated) DB.saveUsers(users);

            DB.setLoggedUser({ id: user.id });

            window.location.href = user.role === 'student' ? 'student.html' : 'driver.html';
        });
    }
});
