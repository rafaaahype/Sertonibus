// driver.js
// Lida com a visualização dos passageiros (com endereço de embarque), a definição
// de vagas do ônibus e a divisão de ônibus caso a capacidade seja excedida

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

    const filterDay = document.getElementById('filter-day');
    const filterTime = document.getElementById('filter-time');
    
    const bus1List = document.getElementById('bus1-list');
    const bus2List = document.getElementById('bus2-list');
    const bus2Container = document.getElementById('bus2-container');
    const alertExtraBus = document.getElementById('alert-extra-bus');

    const formConfig = document.getElementById('form-config');
    const inputCapacity = document.getElementById('input-capacity');
    const inputDescription = document.getElementById('input-description');
    const bus1Capacity = document.getElementById('bus1-capacity-text');
    const bus1Description = document.getElementById('bus1-description');

    // Carrega no formulário a configuração salva para o turno selecionado
    function loadConfigForm() {
        const cfg = DB.getShiftConfig(filterDay.value, filterTime.value);
        inputCapacity.value = cfg.capacity;
        inputDescription.value = cfg.description;
    }

    // 3. Função que carrega e divide os passageiros
    function renderDashboard() {
        const day = filterDay.value;
        const time = filterTime.value;

        // A capacidade agora é definida pelo motorista para cada turno
        const { capacity, description } = DB.getShiftConfig(day, time);

        // Pega todos os agendamentos do banco que batem com o filtro
        let shiftBookings = DB.getBookings().filter(b => b.day === day && b.time === time);
        
        // Ordena pela ordem que agendaram (quem agendou primeiro, pega o Onibus 1)
        shiftBookings.sort((a, b) => a.timestamp - b.timestamp);

        // Resumo de vagas do Ônibus 1
        const occupied = Math.min(shiftBookings.length, capacity);
        const free = capacity - occupied;
        bus1Capacity.innerText = `Capacidade: ${capacity} ${capacity === 1 ? 'vaga' : 'vagas'} · ${occupied} ocupada(s) · ${free} livre(s)`;

        if (description) {
            bus1Description.innerText = description;
            bus1Description.classList.remove('hidden');
        } else {
            bus1Description.innerText = '';
            bus1Description.classList.add('hidden');
        }

        // Limpa as listas na tela
        bus1List.innerHTML = '';
        bus2List.innerHTML = '';
        
        // Se não tiver ninguém
        if (shiftBookings.length === 0) {
            bus1List.innerHTML = '<li class="p-2 text-gray-500 text-center text-sm">Nenhum aluno neste turno.</li>';
            bus2Container.classList.add('hidden');
            alertExtraBus.classList.add('hidden');
            return;
        }

        // Distribui os alunos
        shiftBookings.forEach((b, index) => {
            const addressText = DB.formatAddress(b.address);
            const addressHTML = addressText
                ? `<span class="block text-xs text-gray-500 mt-1">📍 ${DB.escapeHTML(addressText)}</span>`
                : `<span class="block text-xs text-gray-400 mt-1">📍 Endereço não informado</span>`;
            const referenceHTML = b.address && b.address.reference
                ? `<span class="block text-xs text-gray-500">Ref.: ${DB.escapeHTML(b.address.reference)}</span>`
                : '';

            const li = document.createElement('li');
            li.className = 'p-2 flex justify-between items-start text-sm gap-2';
            li.innerHTML = `<span>👤 ${DB.escapeHTML(b.studentName)}${addressHTML}${referenceHTML}</span> <span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Vaga ${index + 1}</span>`;

            // Lógica de separação (Se índice for < capacidade, vai pro ônibus 1)
            if (index < capacity) {
                bus1List.appendChild(li);
            } else {
                bus2List.appendChild(li); // Ônibus excedente
            }
        });

        // Se o número de passageiros passou da capacidade
        if (shiftBookings.length > capacity) {
            bus2Container.classList.remove('hidden');
            alertExtraBus.classList.remove('hidden');
        } else {
            // Se coube tudo no ônibus principal
            bus2Container.classList.add('hidden');
            alertExtraBus.classList.add('hidden');
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

        DB.saveShiftConfig(filterDay.value, filterTime.value, {
            capacity,
            description: inputDescription.value.trim()
        });

        // Feedback visual
        const btn = formConfig.querySelector('button[type="submit"]');
        const oldText = btn.innerText;
        btn.innerText = 'Salvo! ✓';
        setTimeout(() => { btn.innerText = oldText; }, 2000);

        renderDashboard();
    });

    // Refaz a tela toda vez que o motorista mudar as caixas de seleção
    function onShiftChange() {
        loadConfigForm();
        renderDashboard();
    }
    filterDay.addEventListener('change', onShiftChange);
    filterTime.addEventListener('change', onShiftChange);

    // Renderiza a primeira vez ao carregar a página
    onShiftChange();
});
