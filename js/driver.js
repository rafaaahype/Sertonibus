// driver.js
// Lida com a visualização dos passageiros e a divisão de ônibus caso a capacidade seja excedida

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

    // 3. Função que carrega e divide os passageiros
    function renderDashboard() {
        const day = filterDay.value;
        const time = filterTime.value;

        // Pega todos os agendamentos do banco que batem com o filtro
        let shiftBookings = DB.getBookings().filter(b => b.day === day && b.time === time);
        
        // Ordena pela ordem que agendaram (quem agendou primeiro, pega o Onibus 1)
        shiftBookings.sort((a, b) => a.timestamp - b.timestamp);

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
            const li = document.createElement('li');
            li.className = 'p-2 flex justify-between items-center text-sm';
            li.innerHTML = `<span>👤 ${b.studentName}</span> <span class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Vaga ${index + 1}</span>`;

            // Lógica de separação (Se índice for < 5, vai pro ônibus 1)
            if (index < MAX_CAPACITY) {
                bus1List.appendChild(li);
            } else {
                bus2List.appendChild(li); // Ônibus excedente
            }
        });

        // Se o número de passageiros passou da capacidade
        if (shiftBookings.length > MAX_CAPACITY) {
            bus2Container.classList.remove('hidden');
            alertExtraBus.classList.remove('hidden');
        } else {
            // Se coube tudo no ônibus principal
            bus2Container.classList.add('hidden');
            alertExtraBus.classList.add('hidden');
        }
    }

    // Refaz a lista toda vez que o motorista mudar as caixas de seleção
    filterDay.addEventListener('change', renderDashboard);
    filterTime.addEventListener('change', renderDashboard);

    // Renderiza a primeira vez ao carregar a página
    renderDashboard();
});

