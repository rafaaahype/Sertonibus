// student.js
// Lida com a criação e visualização das vagas pelo estudante,
// com roteamento regional baseado na cidade de origem do aluno (incluindo Cajazeiras).

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificação de Segurança (Proteger Rota)
    const user = DB.getLoggedUser();
    if (!user || user.role !== 'student') {
        window.location.href = 'login.html';
        return;
    }

    // 2. Preencher dados do cabeçalho
    document.getElementById('user-display').innerText = `Olá, ${user.name}`;
    document.getElementById('btn-logout').addEventListener('click', DB.logout);

    const formBooking         = document.getElementById('form-booking');
    const listContainer       = document.getElementById('my-bookings-list');
    const inputStreet         = document.getElementById('addr-street');
    const inputNeighborhood   = document.getElementById('addr-neighborhood');
    const inputReference      = document.getElementById('addr-reference');
    const driverPreviewName   = document.getElementById('driver-preview-name');
    const driverPreviewOrigin = document.getElementById('driver-preview-origin');
    const btnViewDriver       = document.getElementById('btn-view-driver');
    const publicProfileModal  = document.getElementById('public-profile-modal');
    const publicProfilePhoto  = document.getElementById('public-profile-photo');
    const publicProfilePlaceholder = document.getElementById('public-profile-placeholder');
    const publicProfileName   = document.getElementById('public-profile-name');
    const publicProfileOrigin = document.getElementById('public-profile-origin');
    const publicProfileRole   = document.getElementById('public-profile-role');
    const btnClosePublicProfile = document.getElementById('btn-close-public-profile');

    // Localização do aluno
    const locationLabel          = document.getElementById('current-location-label');
    const directionLabel         = document.getElementById('current-direction-label');
    const btnToggleSide          = document.getElementById('btn-toggle-side');
    const addrSectionLabel       = document.getElementById('addr-section-label');
    const noCityWarning          = document.getElementById('no-city-warning');
    const routeSelectorContainer = document.getElementById('route-selector-container');
    const routeSelector          = document.getElementById('route-selector');

    const homeCity = String(user.homeCity || user.origin || '').trim();
    const isFromCajazeiras = homeCity === DB.DESTINATION_CITY;
    let selectedDriver = null;

    // Se o aluno não tem cidade definida, avisa e bloqueia o formulário
    if (!homeCity) {
        if (noCityWarning) noCityWarning.classList.remove('hidden');
        if (formBooking)   formBooking.style.display = 'none';
    }

    // Configura o seletor de linha para alunos de Cajazeiras
    if (isFromCajazeiras && routeSelector && routeSelectorContainer && DB.ROUTE_CITIES) {
        routeSelectorContainer.classList.remove('hidden');
        routeSelector.innerHTML = '';
        DB.ROUTE_CITIES.forEach(city => {
            const opt = document.createElement('option');
            opt.value = city;
            opt.textContent = city;
            routeSelector.appendChild(opt);
        });
        routeSelector.addEventListener('change', () => {
            updateLocationUI();
            renderDriverPreview();
        });
    }

    function getActiveRouteCity() {
        if (isFromCajazeiras) {
            return routeSelector?.value || DB.ROUTE_CITIES[0];
        }
        return homeCity;
    }

    // ------------------------------------------------------------------
    // Banner de localização atual e botão de toggle
    // ------------------------------------------------------------------
    function updateLocationUI() {
        const side = DB.getStudentSide(user.id);
        const targetRoute = getActiveRouteCity();

        if (!isFromCajazeiras) {
            // Aluno que mora na cidade da rota (ex.: Cachoeira dos Índios)
            if (side === 'home') {
                if (locationLabel)    locationLabel.textContent   = `📍 Você está em: ${homeCity || 'sua cidade'}`;
                if (directionLabel)   directionLabel.textContent  = `Próxima viagem: Ida → ${DB.DESTINATION_CITY}`;
                if (btnToggleSide) {
                    btnToggleSide.textContent  = `Cheguei em ${DB.DESTINATION_CITY} ✓`;
                    btnToggleSide.className    = 'bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 shrink-0';
                }
                if (addrSectionLabel) addrSectionLabel.textContent = `Onde o ônibus deve te buscar em ${homeCity || 'sua cidade'}?`;
            } else {
                if (locationLabel)    locationLabel.textContent   = `📍 Você está em: ${DB.DESTINATION_CITY}`;
                if (directionLabel)   directionLabel.textContent  = `Próxima viagem: Volta → ${homeCity || 'sua cidade'}`;
                if (btnToggleSide) {
                    btnToggleSide.textContent  = `Voltei para ${homeCity || 'minha cidade'} ✓`;
                    btnToggleSide.className    = 'bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 shrink-0';
                }
                if (addrSectionLabel) addrSectionLabel.textContent = `Onde o ônibus deve te buscar em ${DB.DESTINATION_CITY}?`;
            }
        } else {
            // Aluno que mora em Cajazeiras e usa a linha de outra cidade
            if (side === 'home') {
                if (locationLabel)    locationLabel.textContent   = `📍 Você está em: ${DB.DESTINATION_CITY}`;
                if (directionLabel)   directionLabel.textContent  = `Próxima viagem: ${DB.DESTINATION_CITY} → ${targetRoute} (Linha de ${targetRoute})`;
                if (btnToggleSide) {
                    btnToggleSide.textContent  = `Cheguei em ${targetRoute} ✓`;
                    btnToggleSide.className    = 'bg-blue-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-blue-700 shrink-0';
                }
                if (addrSectionLabel) addrSectionLabel.textContent = `Onde o ônibus deve te buscar em ${DB.DESTINATION_CITY}?`;
            } else {
                if (locationLabel)    locationLabel.textContent   = `📍 Você está em: ${targetRoute}`;
                if (directionLabel)   directionLabel.textContent  = `Próxima viagem: ${targetRoute} → ${DB.DESTINATION_CITY} (Retorno)`;
                if (btnToggleSide) {
                    btnToggleSide.textContent  = `Voltei para ${DB.DESTINATION_CITY} ✓`;
                    btnToggleSide.className    = 'bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 shrink-0';
                }
                if (addrSectionLabel) addrSectionLabel.textContent = `Onde o ônibus deve te buscar em ${targetRoute}?`;
            }
        }
    }

    btnToggleSide?.addEventListener('click', async () => {
        const currentSide = DB.getStudentSide(user.id);
        const newSide     = currentSide === 'home' ? 'destination' : 'home';
        const targetRoute = getActiveRouteCity();

        let fromCity, toCity;
        if (!isFromCajazeiras) {
            fromCity = currentSide === 'home' ? (homeCity || 'sua cidade') : DB.DESTINATION_CITY;
            toCity   = currentSide === 'home' ? DB.DESTINATION_CITY : (homeCity || 'sua cidade');
        } else {
            fromCity = currentSide === 'home' ? DB.DESTINATION_CITY : targetRoute;
            toCity   = currentSide === 'home' ? targetRoute : DB.DESTINATION_CITY;
        }

        const confirmed = await SertonibusUI.confirmAction(
            `Confirmar que você saiu de ${fromCity} e chegou em ${toCity}?`,
            { title: 'Confirmar chegada', confirmText: 'Confirmar', cancelText: 'Cancelar', danger: false }
        );
        if (confirmed) {
            DB.setStudentSide(user.id, newSide);
            updateLocationUI();
            renderDriverPreview();
        }
    });

    updateLocationUI();

    // ------------------------------------------------------------------
    // Preview do motorista — filtrado pela rota ativa
    // ------------------------------------------------------------------
    function renderDriverPreview() {
        const activeRoute = getActiveRouteCity();
        const config = DB.getShiftConfig(
            activeRoute,
            document.getElementById('day').value,
            document.getElementById('time').value
        );
        selectedDriver = config.driverId ? DB.getUserById(config.driverId) : null;

        if (!selectedDriver || selectedDriver.role !== 'driver') {
            driverPreviewName.textContent   = 'Motorista ainda não definido';
            driverPreviewOrigin.textContent = `Nenhum motorista assumiu este turno para a linha de ${activeRoute} ainda.`;
            btnViewDriver.classList.add('hidden');
            return;
        }

        driverPreviewName.textContent   = selectedDriver.name || 'Motorista';
        driverPreviewOrigin.textContent = selectedDriver.routeCity
            ? `Rota: ${selectedDriver.routeCity} ↔ ${DB.DESTINATION_CITY}`
            : (selectedDriver.origin ? `Origem: ${selectedDriver.origin}` : 'Perfil sem localização informada.');
        btnViewDriver.classList.remove('hidden');
    }

    function openDriverProfile() {
        if (!selectedDriver) return;
        publicProfileName.textContent   = selectedDriver.name || '-';
        publicProfileOrigin.textContent = selectedDriver.routeCity
            ? `${selectedDriver.routeCity} ↔ ${DB.DESTINATION_CITY}`
            : (selectedDriver.origin || 'Não informado');
        publicProfileRole.textContent = 'Motorista';
        if (selectedDriver.profilePhoto) {
            publicProfilePhoto.src = selectedDriver.profilePhoto;
            publicProfilePhoto.classList.remove('hidden');
            publicProfilePlaceholder.classList.add('hidden');
        } else {
            publicProfilePhoto.src = '';
            publicProfilePhoto.classList.add('hidden');
            publicProfilePlaceholder.classList.remove('hidden');
        }
        publicProfileModal.classList.remove('hidden');
    }

    const closeDriverProfile = () => {
        if (!publicProfileModal || publicProfileModal.classList.contains('hidden') || publicProfileModal.classList.contains('closing')) return;
        publicProfileModal.classList.add('closing');
        setTimeout(() => {
            publicProfileModal.classList.add('hidden');
            publicProfileModal.classList.remove('closing');
        }, 380);
    };

    btnViewDriver?.addEventListener('click', openDriverProfile);
    btnClosePublicProfile?.addEventListener('click', closeDriverProfile);
    publicProfileModal?.addEventListener('click', (event) => {
        if (event.target === publicProfileModal) closeDriverProfile();
    });
    document.getElementById('day').addEventListener('change', renderDriverPreview);
    document.getElementById('time').addEventListener('change', renderDriverPreview);

    // Preenche o formulário com o último endereço usado (se houver)
    const lastAddress = DB.getLastAddress(user.id);
    if (lastAddress) {
        inputStreet.value       = lastAddress.street       || '';
        inputNeighborhood.value = lastAddress.neighborhood || '';
        inputReference.value    = lastAddress.reference    || '';
    }

    // ------------------------------------------------------------------
    // 3. Renderizar agendamentos do aluno
    // ------------------------------------------------------------------
    function renderBookings() {
        listContainer.innerHTML = '';
        const allBookings = DB.getBookings();
        const myBookings  = allBookings.filter(b => b.studentId === user.id);

        if (myBookings.length === 0) {
            listContainer.innerHTML = '<p class="text-gray-500 text-sm">Você ainda não agendou nenhuma viagem.</p>';
            return;
        }

        myBookings.forEach(b => {
            const addressText = DB.formatAddress(b.address);
            const addressHTML = addressText
                ? `<p class="text-xs text-gray-600">📍 Embarque: ${DB.escapeHTML(addressText)}</p>`
                : `<p class="text-xs text-gray-400">📍 Endereço de embarque não informado</p>`;
            const referenceHTML = b.address && b.address.reference
                ? `<p class="text-xs text-gray-600">Ref.: ${DB.escapeHTML(b.address.reference)}</p>`
                : '';

            const routeLine = b.routeCity || b.homeCity;
            const directionBadge = b.direction === 'return'
                ? `<span class="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">🏠 Volta (${DB.escapeHTML(routeLine)})</span>`
                : `<span class="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">🚌 Ida (${DB.escapeHTML(routeLine)})</span>`;

            const li = document.createElement('li');
            li.className = 'p-3 bg-gray-50 border rounded flex justify-between items-center gap-2';
            li.innerHTML = `
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap mb-0.5">
                        <p class="font-bold text-sm booking-day"></p>
                        ${directionBadge}
                    </div>
                    <p class="text-xs text-gray-600 booking-time"></p>
                    ${addressHTML}
                    ${referenceHTML}
                </div>
                <button type="button" class="cancel-booking text-red-500 hover:bg-red-50 p-1 rounded text-sm font-medium transition shrink-0">Cancelar</button>
            `;
            li.querySelector('.booking-day').textContent  = String(b.day  || '');
            li.querySelector('.booking-time').textContent = String(b.time || '');
            li.querySelector('.cancel-booking').addEventListener('click', () => window.cancelBooking(b.id));
            listContainer.appendChild(li);
        });
    }

    window.cancelBooking = async (id) => {
        const confirmed = await SertonibusUI.confirmAction(
            'Essa vaga será liberada para outro aluno. Deseja realmente cancelar o agendamento?',
            { title: 'Cancelar agendamento?', confirmText: 'Cancelar vaga', cancelText: 'Manter vaga', danger: true }
        );
        if (!confirmed) return;

        let bookings = DB.getBookings();
        const booking = bookings.find(b => String(b.id) === String(id));
        if (!booking || String(booking.studentId) !== String(user.id)) {
            alert('Não foi possível cancelar esta reserva.');
            return;
        }

        bookings = bookings.filter(b => String(b.id) !== String(id));
        DB.saveBookings(bookings);
        renderBookings();
    };

    // ------------------------------------------------------------------
    // 4. Enviar formulário (Garantir Vaga) — com direção baseada na localização
    // ------------------------------------------------------------------
    formBooking?.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!homeCity) {
            alert('Seu cadastro não possui cidade de origem. Atualize seu perfil.');
            return;
        }

        const activeRoute = getActiveRouteCity();
        const day  = document.getElementById('day').value;
        const time = document.getElementById('time').value;

        const address = {
            street:       inputStreet.value.trim().slice(0, 120),
            neighborhood: inputNeighborhood.value.trim().slice(0, 80),
            reference:    inputReference.value.trim().slice(0, 160)
        };

        if (!address.street || !address.neighborhood) {
            alert('Informe a rua/número e o bairro do seu embarque.');
            return;
        }

        // Calcula a direção em relação ao ônibus da linha:
        // - Para aluno de fora: home (na cidade) -> outbound (Ida para Cajazeiras)
        //                       destination (em Cajazeiras) -> return (Volta para cidade)
        // - Para aluno de Cajazeiras: home (em Cajazeiras) -> return (Volta para outra cidade)
        //                             destination (na outra cidade) -> outbound (Ida para Cajazeiras)
        let direction;
        const currentSide = DB.getStudentSide(user.id);
        if (!isFromCajazeiras) {
            direction = currentSide === 'destination' ? 'return' : 'outbound';
        } else {
            direction = currentSide === 'home' ? 'return' : 'outbound';
        }

        let bookings = DB.getBookings();

        // Regra: não agendar no mesmo dia + horário + rota + direção duas vezes
        const alreadyBooked = bookings.find(
            b => b.studentId === user.id &&
                 (b.routeCity === activeRoute || (!b.routeCity && b.homeCity === activeRoute)) &&
                 b.day === day && b.time === time && b.direction === direction
        );
        if (alreadyBooked) {
            alert('Você já possui uma vaga garantida para esta linha, dia, horário e direção.');
            return;
        }

        // Verifica capacidade para este turno + rota + direção
        const shiftConfig      = DB.getShiftConfig(activeRoute, day, time);
        const bookingsForShift = bookings.filter(
            b => (b.routeCity === activeRoute || (!b.routeCity && b.homeCity === activeRoute)) &&
                 b.day === day && b.time === time && b.direction === direction
        );

        if (bookingsForShift.length >= shiftConfig.capacity) {
            alert(`Ônibus da linha de ${activeRoute} está lotado para este horário. Escolha outro turno.`);
            return;
        }

        bookings.push({
            id:          crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            studentId:   user.id,
            studentName: user.name,
            homeCity,
            routeCity:   activeRoute,
            direction,
            day,
            time,
            address,
            timestamp:   Date.now()
        });

        DB.saveBookings(bookings);
        DB.saveLastAddress(user.id, address);

        const btn     = formBooking.querySelector('button[type="submit"]');
        const oldText = btn.innerText;
        btn.innerText = '✓ Vaga Garantida!';
        setTimeout(() => { btn.innerText = oldText; }, 2000);

        renderBookings();
    });

    // Inicia desenhando os dados
    renderDriverPreview();
    renderBookings();
});
