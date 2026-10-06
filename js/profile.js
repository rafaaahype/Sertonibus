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
    const routeCitySelect = document.getElementById('profile-route-city');
    const profilePhotoData = document.getElementById('profile-photo-data');
    const profileMessage = document.getElementById('profile-message');

    // Popula os selects com as cidades e rotas disponíveis
    const populateCities = () => {
        if (originSelect && DB.ALL_CITIES) {
            originSelect.innerHTML = '<option value="">Selecione sua cidade...</option>';
            DB.ALL_CITIES.forEach(city => {
                const opt = document.createElement('option');
                opt.value = city;
                opt.textContent = city;
                originSelect.appendChild(opt);
            });
        }

        if (routeCitySelect && DB.ROUTE_CITIES) {
            routeCitySelect.innerHTML = '<option value="">Selecione a rota...</option>';
            DB.ROUTE_CITIES.forEach(city => {
                const opt = document.createElement('option');
                opt.value = city;
                opt.textContent = (city === DB.DESTINATION_CITY)
                    ? `${city} (Linha Municipal)`
                    : `${city} ↔ ${DB.DESTINATION_CITY}`;
                routeCitySelect.appendChild(opt);
            });
        }
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

        const userOrigin = user.origin || user.homeCity || '';
        if (userOrigin && originSelect) {
            const exists = Array.from(originSelect.options).some(opt => opt.value === userOrigin);
            if (!exists) {
                const opt = document.createElement('option');
                opt.value = userOrigin;
                opt.textContent = userOrigin;
                originSelect.appendChild(opt);
            }
            originSelect.value = userOrigin;
        } else if (originSelect) {
            originSelect.value = '';
        }

        if (routeCitySelect) {
            const userRoute = user.routeCity || user.origin || '';
            if (userRoute) {
                const exists = Array.from(routeCitySelect.options).some(opt => opt.value === userRoute);
                if (!exists) {
                    const opt = document.createElement('option');
                    opt.value = userRoute;
                    opt.textContent = userRoute;
                    routeCitySelect.appendChild(opt);
                }
                routeCitySelect.value = userRoute;
            } else {
                routeCitySelect.value = '';
            }
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
        const routeCity = routeCitySelect?.value.trim() || '';

        if (!origin && !routeCity) {
            profileMessage.textContent = 'Por favor, informe a cidade.';
            return;
        }

        const payload = {
            origin: origin || routeCity,
            profilePhoto: profilePhotoData.value
        };

        if (user?.role === 'student') {
            payload.homeCity = origin;
        } else if (user?.role === 'driver') {
            if (origin) payload.origin = origin;
            if (routeCity) payload.routeCity = routeCity;
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
