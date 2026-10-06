// driver.js
// Lida com a visualização dos passageiros por direção (Ida / Volta),
// a definição de vagas e a rota regional dinâmica do motorista.

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificação de Segurança
    const user = DB.getLoggedUser();
    if (!user || user.role !== 'driver') {
        window.location.href = 'login.html';
        return;
    }

    // 2. Preencher dados do cabeçalho
    document.getElementById('user-display').innerText = user.name;
    document.getElementById('btn-logout').addEventListener('click', DB.logout);

    const filterRoute = document.getElementById('filter-route');
    const filterDay   = document.getElementById('filter-day');
    const filterTime  = document.getElementById('filter-time');
    const routeLabel  = document.getElementById('route-label');

    const busOutboundList        = document.getElementById('bus-outbound-list');
    const busReturnList          = document.getElementById('bus-return-list');
    const busOutboundCapacity    = document.getElementById('bus-outbound-capacity');
    const busReturnCapacity      = document.getElementById('bus-return-capacity');
    const busOutboundDescription = document.getElementById('bus-outbound-description');
    const busReturnDescription   = document.getElementById('bus-return-description');
    const alertExtraBus          = document.getElementById('alert-extra-bus');

    const formConfig       = document.getElementById('form-config');
    const inputCapacity    = document.getElementById('input-capacity');
    const inputDescription = document.getElementById('input-description');

    const publicProfileModal        = document.getElementById('public-profile-modal');
    const publicProfilePhoto        = document.getElementById('public-profile-photo');
    const publicProfilePlaceholder  = document.getElementById('public-profile-placeholder');
    const publicProfileName         = document.getElementById('public-profile-name');
    const publicProfileRegistration = document.getElementById('public-profile-registration');
    const publicProfileOrigin       = document.getElementById('public-profile-origin');
    const publicProfileRole         = document.getElementById('public-profile-role');
    const btnClosePublicProfile     = document.getElementById('btn-close-public-profile');

    // Popula o seletor de rotas para que o motorista possa alternar a linha atendida
    if (filterRoute && DB.ROUTE_CITIES) {
        filterRoute.innerHTML = '';
        DB.ROUTE_CITIES.forEach(city => {
            const opt = document.createElement('option');
            opt.value = city;
            opt.textContent = (city === DB.DESTINATION_CITY)
                ? `${city} (Linha Municipal)`
                : `${city} ↔ ${DB.DESTINATION_CITY}`;
            filterRoute.appendChild(opt);
        });

        const initialRoute = user.routeCity || user.origin || DB.ROUTE_CITIES[0];
        if (Array.from(filterRoute.options).some(o => o.value === initialRoute)) {
            filterRoute.value = initialRoute;
        }
    }

    function getSelectedRoute() {
        return filterRoute?.value || user.routeCity || user.origin || DB.ROUTE_CITIES[0];
    }

    function updateRouteBanner() {
        const activeRoute = getSelectedRoute();
        if (routeLabel) {
            routeLabel.textContent = (activeRoute === DB.DESTINATION_CITY)
                ? `${activeRoute} (Linha Municipal / Polo)`
                : `${activeRoute} ↔ ${DB.DESTINATION_CITY}`;
        }
    }

    function openStudentProfile(studentId) {
        const student = DB.getUserById(studentId);
        if (!student) return;
        publicProfileName.textContent         = student.name         || '-';
        publicProfileRegistration.textContent = student.registration || 'Não informada';
        publicProfileOrigin.textContent       = student.homeCity     || student.origin || 'Não informado';
        publicProfileRole.textContent         = 'Aluno / Passageiro';
        if (student.profilePhoto) {
            publicProfilePhoto.src = student.profilePhoto;
            publicProfilePhoto.classList.remove('hidden');
            publicProfilePlaceholder.classList.add('hidden');
        } else {
            publicProfilePhoto.src = '';
            publicProfilePhoto.classList.add('hidden');
            publicProfilePlaceholder.classList.remove('hidden');
        }
        publicProfileModal.classList.remove('hidden');
    }

    const closeStudentProfile = () => {
        if (!publicProfileModal || publicProfileModal.classList.contains('hidden') || publicProfileModal.classList.contains('closing')) return;
        publicProfileModal.classList.add('closing');
        setTimeout(() => {
            publicProfileModal.classList.add('hidden');
            publicProfileModal.classList.remove('closing');
        }, 380);
    };

    btnClosePublicProfile?.addEventListener('click', closeStudentProfile);
    publicProfileModal?.addEventListener('click', (event) => {
        if (event.target === publicProfileModal) closeStudentProfile();
    });

    // Carrega no formulário a configuração salva para a rota e turno selecionados
    function loadConfigForm() {
        const activeRoute = getSelectedRoute();
        const cfg = DB.getShiftConfig(activeRoute, filterDay.value, filterTime.value);
        inputCapacity.value    = cfg.capacity;
        inputDescription.value = cfg.description;
    }

    // ------------------------------------------------------------------
    // Renderiza o painel: passageiros separados por direção (Ida / Volta)
    // ------------------------------------------------------------------
    function renderDashboard() {
        const activeRoute = getSelectedRoute();
        const day  = filterDay.value;
        const time = filterTime.value;

        updateRouteBanner();

        const { capacity, description } = DB.getShiftConfig(activeRoute, day, time);

        // Filtra agendamentos vinculados a esta rota (moradores da rota ou de Cajazeiras usando esta linha)
        const allBookings = DB.getBookings().filter(b =>
            (b.routeCity === activeRoute || (!b.routeCity && b.homeCity === activeRoute)) &&
            b.day === day &&
            b.time === time
        );
        const outboundList  = allBookings.filter(b => b.direction !== 'return');   // ida
        const returnList    = allBookings.filter(b => b.direction === 'return');   // volta

        // Limpa as listas
        busOutboundList.innerHTML = '';
        busReturnList.innerHTML   = '';

        // Descrição e capacidade — Ida
        const outOccupied = Math.min(outboundList.length, capacity);
        const outFree     = capacity - outOccupied;
        busOutboundCapacity.textContent = `Capacidade: ${capacity} · ${outOccupied} ocupada(s) · ${outFree} livre(s)`;

        // Descrição e capacidade — Volta
        const retOccupied = Math.min(returnList.length, capacity);
        const retFree     = capacity - retOccupied;
        busReturnCapacity.textContent = `Capacidade: ${capacity} · ${retOccupied} ocupada(s) · ${retFree} livre(s)`;

        // Descrição do ônibus (compartilhada nos dois lados)
        [busOutboundDescription, busReturnDescription].forEach(el => {
            if (!el) return;
            if (description) {
                el.textContent = description;
                el.classList.remove('hidden');
            } else {
                el.textContent = '';
                el.classList.add('hidden');
            }
        });

        // Alerta de excesso de capacidade
        const overCapacity = outboundList.length > capacity || returnList.length > capacity;
        alertExtraBus?.classList.toggle('hidden', !overCapacity);

        function buildPassengerItem(b, index) {
            const addressText = DB.formatAddress(b.address);
            const addressHTML = addressText
                ? `<span class="block text-xs text-gray-500 mt-1">📍 ${DB.escapeHTML(addressText)}</span>`
                : `<span class="block text-xs text-gray-400 mt-1">📍 Endereço não informado</span>`;
            const referenceHTML = b.address && b.address.reference
                ? `<span class="block text-xs text-gray-500">Ref.: ${DB.escapeHTML(b.address.reference)}</span>`
                : '';
            const originBadge = (b.homeCity && b.homeCity !== activeRoute)
                ? `<span class="inline-block text-[11px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded ml-1">Origem: ${DB.escapeHTML(b.homeCity)}</span>`
                : '';

            const li = document.createElement('li');
            li.className = 'p-2 flex justify-between items-start text-sm gap-2';
            li.innerHTML = `
                <span>👤 ${DB.escapeHTML(b.studentName)}${originBadge}${addressHTML}${referenceHTML}</span>
                <span class="flex items-center gap-2 shrink-0">
                    <button type="button" class="view-student-profile text-blue-600 hover:text-blue-800 text-xs font-semibold underline" data-student-id="${DB.escapeHTML(b.studentId)}">Ver perfil</button>
                    <span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Vaga ${index + 1}</span>
                </span>
            `;
            li.querySelector('.view-student-profile')?.addEventListener('click', () => openStudentProfile(b.studentId));
            return li;
        }

        // Preenche lista de ida
        if (outboundList.length === 0) {
            busOutboundList.innerHTML = '<li class="p-2 text-gray-400 text-center text-sm">Nenhum aluno neste turno.</li>';
        } else {
            outboundList.sort((a, b) => a.timestamp - b.timestamp)
                        .forEach((b, i) => busOutboundList.appendChild(buildPassengerItem(b, i)));
        }

        // Preenche lista de volta
        if (returnList.length === 0) {
            busReturnList.innerHTML = '<li class="p-2 text-gray-400 text-center text-sm">Nenhum aluno neste turno.</li>';
        } else {
            returnList.sort((a, b) => a.timestamp - b.timestamp)
                      .forEach((b, i) => busReturnList.appendChild(buildPassengerItem(b, i)));
        }
    }

    // Salvar vagas e descrição do turno selecionado
    formConfig.addEventListener('submit', (e) => {
        e.preventDefault();

        const capacity = parseInt(inputCapacity.value, 10);
        if (!Number.isInteger(capacity) || capacity < 1 || capacity > 100) {
            alert('Informe um número de vagas entre 1 e 100.');
            return;
        }

        const activeRoute = getSelectedRoute();
        const day         = filterDay.value;
        const time        = filterTime.value;
        const currentConfig = DB.getShiftConfig(activeRoute, day, time);
        if (currentConfig.driverId && String(currentConfig.driverId) !== String(user.id)) {
            alert('Este turno para esta rota já está associado a outro motorista.');
            return;
        }

        DB.saveShiftConfig(activeRoute, day, time, {
            capacity,
            description: inputDescription.value.trim().slice(0, 200)
        });

        // Persiste a rota ativa no perfil do motorista
        DB.updateUserProfile(user.id, { routeCity: activeRoute });

        const btn     = formConfig.querySelector('button[type="submit"]');
        const oldText = btn.innerText;
        btn.innerText = 'Salvo! ✓';
        setTimeout(() => { btn.innerText = oldText; }, 2000);

        renderDashboard();
    });

    function onShiftChange() {
        loadConfigForm();
        renderDashboard();
    }

    filterRoute?.addEventListener('change', onShiftChange);
    filterDay.addEventListener('change',    onShiftChange);
    filterTime.addEventListener('change',   onShiftChange);

    // Renderiza na primeira carga
    onShiftChange();
});
