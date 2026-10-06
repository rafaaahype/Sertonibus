// profile.js
// Perfil editável do usuário logado.

document.addEventListener('DOMContentLoaded', () => {
    const userSession = DB.getLoggedUser();
    if (!userSession) return;

    const profileButton = document.getElementById('btn-profile');
    const modal = document.getElementById('profile-modal');
    const form = document.getElementById('form-profile');
    const closeButton = document.getElementById('btn-close-profile');
    const photoInput = document.getElementById('profile-photo');
    const photoPreview = document.getElementById('profile-photo-preview');
    const photoPlaceholder = document.getElementById('profile-photo-placeholder');
    const nameDisplay = document.getElementById('profile-name');
    const usernameDisplay = document.getElementById('profile-username');
    const cpfDisplay = document.getElementById('profile-cpf');
    const registrationDisplay = document.getElementById('profile-registration');
    const roleDisplay = document.getElementById('profile-role');
    const originSelect = document.getElementById('profile-origin');
    const profilePhotoData = document.getElementById('profile-photo-data');
    const profileMessage = document.getElementById('profile-message');

    // Popula o select de cidades com as cidades disponíveis (incluindo Cajazeiras)
    const populateCities = () => {
        if (!originSelect || !DB.ALL_CITIES) return;
        originSelect.innerHTML = '<option value="">Selecione sua cidade...</option>';
        DB.ALL_CITIES.forEach(city => {
            const opt = document.createElement('option');
            opt.value = city;
            opt.textContent = city;
            originSelect.appendChild(opt);
        });
    };

    populateCities();

    const openProfile = () => {
        const user = DB.getUserById(userSession.id);
        if (!user) return;

        nameDisplay.textContent = user.name || '-';
        usernameDisplay.textContent = user.username || '-';
        cpfDisplay.textContent = user.cpf || '-';
        registrationDisplay.textContent = user.registration || 'Não se aplica';
        roleDisplay.textContent = user.role === 'driver' ? 'Motorista' : 'Aluno / Passageiro';

        const userCity = user.homeCity || user.routeCity || user.origin || '';
        
        // Garante que a cidade atual do usuário esteja presente nas opções caso seja diferente
        if (userCity && originSelect) {
            const exists = Array.from(originSelect.options).some(opt => opt.value === userCity);
            if (!exists) {
                const opt = document.createElement('option');
                opt.value = userCity;
                opt.textContent = userCity;
                originSelect.appendChild(opt);
            }
            originSelect.value = userCity;
        } else if (originSelect) {
            originSelect.value = '';
        }

        profilePhotoData.value = user.profilePhoto || '';

        if (user.profilePhoto) {
            photoPreview.src = user.profilePhoto;
            photoPreview.classList.remove('hidden');
            photoPlaceholder?.classList.add('hidden');
        } else {
            photoPreview.src = '';
            photoPreview.classList.add('hidden');
            photoPlaceholder?.classList.remove('hidden');
        }

        profileMessage.textContent = '';
        modal.classList.remove('hidden');
    };

    const closeProfile = () => {
        if (!modal || modal.classList.contains('hidden') || modal.classList.contains('closing')) return;
        modal.classList.add('closing');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('closing');
        }, 380);
    };

    profileButton?.addEventListener('click', openProfile);
    closeButton?.addEventListener('click', closeProfile);

    modal?.addEventListener('click', (event) => {
        if (event.target === modal) closeProfile();
    });

    photoInput?.addEventListener('change', () => {
        const file = photoInput.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            profileMessage.textContent = 'Selecione uma imagem válida.';
            photoInput.value = '';
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            profileMessage.textContent = 'A foto deve ter no máximo 2 MB.';
            photoInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            profilePhotoData.value = reader.result;
            photoPreview.src = reader.result;
            photoPreview.classList.remove('hidden');
            photoPlaceholder?.classList.add('hidden');
            profileMessage.textContent = '';
        };
        reader.readAsDataURL(file);
    });

    form?.addEventListener('submit', (event) => {
        event.preventDefault();

        const user = DB.getUserById(userSession.id);
        const origin = originSelect?.value.trim() || '';

        if (!origin) {
            profileMessage.textContent = 'Por favor, selecione uma cidade.';
            return;
        }

        const payload = {
            origin,
            profilePhoto: profilePhotoData.value
        };

        if (user?.role === 'student') {
            payload.homeCity = origin;
        } else if (user?.role === 'driver') {
            payload.routeCity = origin;
        }

        const saved = DB.updateUserProfile(userSession.id, payload);

        if (!saved) {
            profileMessage.textContent = 'Não foi possível salvar o perfil.';
            return;
        }

        profileMessage.textContent = 'Perfil atualizado com sucesso!';
        setTimeout(() => {
            closeProfile();
            window.location.reload();
        }, 850);
    });
});
