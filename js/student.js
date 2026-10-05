// student.js
// Lida com a criação e visualização das vagas pelo estudante

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

    const formBooking = document.getElementById('form-booking');
    const listContainer = document.getElementById('my-bookings-list');

    // 3. Função para desenhar as viagens na tela
    function renderBookings() {
        listContainer.innerHTML = '';
        const allBookings = DB.getBookings();
        
        // Filtra apenas as viagens deste aluno
        const myBookings = allBookings.filter(b => b.studentId === user.id);
        
        if(myBookings.length === 0) {
            listContainer.innerHTML = '<p class="text-gray-500 text-sm">Você ainda não agendou nenhuma viagem.</p>';
            return;
        }

        // Desenha cada item na lista
        myBookings.forEach(b => {
            const li = document.createElement('li');
            li.className = 'p-3 bg-gray-50 border rounded flex justify-between items-center';
            li.innerHTML = `
                <div>
                    <p class="font-bold text-sm">${b.day}</p>
                    <p class="text-xs text-gray-600">${b.time}</p>
                </div>
                <button onclick="cancelBooking('${b.id}')" class="text-red-500 hover:bg-red-50 p-1 rounded text-sm font-medium transition">Cancelar</button>
            `;
            listContainer.appendChild(li);
        });
    }

    // Função global para o botão "Cancelar" chamar
    window.cancelBooking = (id) => {
        let bookings = DB.getBookings();
        bookings = bookings.filter(b => b.id !== id); // Remove pelo ID
        DB.saveBookings(bookings);
        renderBookings(); // Atualiza a tela
    };

    // 4. Lógica de enviar o formulário (Garantir Vaga)
    formBooking.addEventListener('submit', (e) => {
        e.preventDefault();
        const day = document.getElementById('day').value;
        const time = document.getElementById('time').value;

        let bookings = DB.getBookings();
        
        // Regra de negócio: Não deixar agendar no mesmo dia e mesmo horário duas vezes
        const alreadyBooked = bookings.find(b => b.studentId === user.id && b.day === day && b.time === time);
        if(alreadyBooked) {
            alert('Você já possui uma vaga garantida para este dia e horário.');
            return;
        }

        // Salva a reserva com um timestamp (importante para saber quem chegou primeiro)
        bookings.push({
            id: Date.now().toString(),
            studentId: user.id,
            studentName: user.name,
            day, 
            time,
            timestamp: Date.now() 
        });

        DB.saveBookings(bookings);
        
        // Feedback visual
        const btn = formBooking.querySelector('button');
        const oldText = btn.innerText;
        btn.innerText = "Vaga Garantida! ✓";
        setTimeout(() => { btn.innerText = oldText; }, 2000);

        renderBookings();
    });

    // Inicia desenhando os dados
    renderBookings();
});

