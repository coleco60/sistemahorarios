// Sistema de Gestão de Horários - Ciências Econômicas UESC
// Arquivo principal JavaScript - Versão Completa Atualizada
// Declare como variável global no topo do arquivo
let currentSlot = null;


// Estrutura de dados global
let appData = {
    professores: {},
    disciplinas: {},
    turmas: {},
    salas: {},
    horarios: {}
};

// Variáveis globais para o modo de edição
let currentEditingItemId = null;
let currentEditingFormId = null;

// ... (código existente) ...

// Variáveis globais para o usuário e UI de autenticação
let currentUser = null; // Para armazenar o objeto do usuário logado

// Referências aos elementos da UI de autenticação
const authFormsSection = document.getElementById('authForms');
const loggedInAppContent = document.getElementById('loggedInAppContent');
const authStatusIndicator = document.getElementById('authStatusIndicator');
const userStatusElement = document.getElementById('userStatus');

// Referências aos botões e campos de autenticação
const btnRegister = document.getElementById('btnRegister');
const registerEmailInput = document.getElementById('registerEmail');
const registerPasswordInput = document.getElementById('registerPassword');

const btnLogin = document.getElementById('btnLogin');
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');

const btnGoogleLogin = document.getElementById('btnGoogleLogin');
const btnLogout = document.getElementById('btnLogout');

// ... (resto do seu código) ...


// Configurações dos horários
const HORARIOS_CONFIG = {
    matutino: {
        dias: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'],
        blocos: [
            { id: 1, inicio: '07:30', fim: '08:20' },
            { id: 2, inicio: '08:20', fim: '09:10' },
            { id: 3, inicio: '09:10', fim: '10:00' },
            { id: 4, inicio: '10:00', fim: '10:50' },
            { id: 5, inicio: '10:50', fim: '11:40' },
            { id: 6, inicio: '11:40', fim: '12:30' }
        ],
        semestres: Array.from({length: 9}, (_, i) => i + 1)
    },
    noturno: {
        dias: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'],
        blocos: {
            'segunda': [
                { id: 1, inicio: '18:40', fim: '19:30' },
                { id: 2, inicio: '19:30', fim: '20:20' },
                { id: 3, inicio: '20:20', fim: '21:10' },
                { id: 4, inicio: '21:10', fim: '22:00' }
            ],
            'terca': [
                { id: 1, inicio: '18:40', fim: '19:30' },
                { id: 2, inicio: '19:30', fim: '20:20' },
                { id: 3, inicio: '20:20', fim: '21:10' },
                { id: 4, inicio: '21:10', fim: '22:00' }
            ],
            'quarta': [
                { id: 1, inicio: '18:40', fim: '19:30' },
                { id: 2, inicio: '19:30', fim: '20:20' },
                { id: 3, inicio: '20:20', fim: '21:10' },
                { id: 4, inicio: '21:10', fim: '22:00' }
            ],
            'quinta': [
                { id: 1, inicio: '18:40', fim: '19:30' },
                { id: 2, inicio: '19:30', fim: '20:20' },
                { id: 3, inicio: '20:20', fim: '21:10' },
                { id: 4, inicio: '21:10', fim: '22:00' }
            ],
            'sexta': [
                { id: 1, inicio: '18:40', fim: '19:30' },
                { id: 2, inicio: '19:30', fim: '20:20' },
                { id: 3, inicio: '20:20', fim: '21:10' },
                { id: 4, inicio: '21:10', fim: '22:00' }
            ],
            'sabado': [
                { id: 1, inicio: '07:30', fim: '08:20' },
                { id: 2, inicio: '08:20', fim: '09:10' },
                { id: 3, inicio: '09:10', fim: '10:00' },
                { id: 4, inicio: '10:00', fim: '10:50' },
                { id: 5, inicio: '10:50', fim: '11:40' },
                { id: 6, inicio: '11:40', fim: '12:30' }
            ]
        },
        semestres: Array.from({length: 10}, (_, i) => i + 1)
    }
};

const CODIGOS_TURMA = {
    matutino: {
        regular: ['T02'],
        extra: ['T04', 'T06']
    },
    noturno: {
        regular: ['T01'],
        extra: ['T03', 'T05']
    }
};




// Funções utilitárias
function toArray(obj) {
    return obj ? Object.values(obj) : [];
}

function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

function formatDateTime(date) {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function showAlert(message, type = 'info') {
    const alertsContainer = document.getElementById('alerts-container');
    const alert = document.createElement('div');
    alert.className = `alert ${type}`;

    const icon = type === 'success' ? 'fas fa-check-circle' :
                 type === 'error' ? 'fas fa-exclamation-circle' :
                 type === 'warning' ? 'fas fa-exclamation-triangle' :
                 'fas fa-info-circle';

    alert.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
        <button class="alert-close">&times;</button>
    `;

    alertsContainer.appendChild(alert);

    setTimeout(() => {
        if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
        }
    }, 5000);

    alert.querySelector('.alert-close').addEventListener('click', () => {
        alert.parentNode.removeChild(alert);
    });
}

function clearForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        const multiSelects = form.querySelectorAll('select[multiple]');
        multiSelects.forEach(select => {
            Array.from(select.options).forEach(option => option.selected = false);
        });
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.checked = false);
        if (formId === 'disciplina-form') {
            const semestresContainer = document.getElementById('disciplina-semestres-container');
            if (semestresContainer) {
                semestresContainer.innerHTML = '';
            }
        }
    }
}

function cancelEditing() {
    const formConfig = {
        'professor-form': { submitBtnId: 'submit-professor', defaultText: 'Cadastrar Professor' },
        'disciplina-form': { submitBtnId: 'submit-disciplina', defaultText: 'Cadastrar Disciplina' },
        'turma-form': { submitBtnId: 'submit-turma', defaultText: 'Cadastrar Turma' },
        'sala-form': { submitBtnId: 'submit-sala', defaultText: 'Cadastrar Sala' }
    };

    if (currentEditingFormId && formConfig[currentEditingFormId]) {
        clearForm(currentEditingFormId);
        const submitBtn = document.getElementById(formConfig[currentEditingFormId].submitBtnId);
        if (submitBtn) {
            submitBtn.textContent = formConfig[currentEditingFormId].defaultText;
        }
        const formActions = document.querySelector(`#${currentEditingFormId} .form-actions`);
        const cancelBtn = formActions ? formActions.querySelector('.cancel-edit-btn') : null;
        if (cancelBtn) {
            cancelBtn.remove();
        }
    }
    currentEditingItemId = null;
    currentEditingFormId = null;
    showAlert('Edição cancelada.', 'info');
}


// ... (código existente - Funções utilitárias, etc.) ...

// ===========================================
// FUNÇÕES DE AUTENTICAÇÃO
// ===========================================

async function handleRegister() {
    const email = registerEmailInput.value;
    const password = registerPasswordInput.value;

    if (!email || !password) {
        showAlert('Por favor, preencha o e-mail e a senha para registro.', 'error');
        return;
    }

    try {
        await window.authCreateUserWithEmailAndPassword(window.firebaseAuth, email, password);
        showAlert('Conta criada com sucesso! Você está logado.', 'success');
        // A UI será atualizada automaticamente pelo observador de estado de autenticação
    } catch (error) {
        console.error("Erro no registro:", error);
        let errorMessage = "Erro ao criar conta.";
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Este e-mail já está em uso.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'E-mail inválido.';
                break;
            case 'auth/weak-password':
                errorMessage = 'A senha é muito fraca (mínimo 6 caracteres).';
                break;
            default:
                errorMessage = 'Erro desconhecido: ' + error.message;
        }
        showAlert(errorMessage, 'error');
    }
}

async function handleLogin() {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;

    if (!email || !password) {
        showAlert('Por favor, preencha o e-mail e a senha para login.', 'error');
        return;
    }

    try {
        await window.authSignInWithEmailAndPassword(window.firebaseAuth, email, password);
        showAlert('Login realizado com sucesso!', 'success');
        // A UI será atualizada automaticamente pelo observador de estado de autenticação
    } catch (error) {
        console.error("Erro no login:", error);
        let errorMessage = "Erro ao fazer login.";
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'E-mail inválido.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Sua conta foi desativada.';
                break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                errorMessage = 'E-mail ou senha incorretos.';
                break;
            default:
                errorMessage = 'Erro desconhecido: ' + error.message;
        }
        showAlert(errorMessage, 'error');
    }
}

async function handleGoogleLogin() {
    const provider = new window.authGoogleAuthProvider();
    try {
        await window.authSignInWithPopup(window.firebaseAuth, provider);
        showAlert('Login com Google realizado com sucesso!', 'success');
        // A UI será atualizada automaticamente pelo observador de estado de autenticação
    } catch (error) {
        console.error("Erro no login com Google:", error);
        if (error.code === 'auth/popup-closed-by-user') {
            showAlert('Login com Google cancelado.', 'info');
        } else {
            showAlert('Erro ao fazer login com Google: ' + error.message, 'error');
        }
    }
}

async function handleLogout() {
    try {
        await window.authSignOut(window.firebaseAuth);
        showAlert('Você foi desconectado.', 'info');
        // A UI será atualizada automaticamente pelo observador de estado de autenticação
    } catch (error) {
        console.error("Erro ao fazer logout:", error);
        showAlert('Erro ao fazer logout: ' + error.message, 'error');
    }
}

// ... (código existente - Funções de Autenticação, initAuthUIListeners) ...

/**
 * Atualiza a interface do usuário com base no estado de autenticação.
 * @param {firebase.User|null} user O objeto do usuário autenticado, ou null se não houver usuário.
 */
function updateAppUI(user) {
    currentUser = user; // Armazena o usuário atual globalmente

    if (user) {
        // Usuário logado
        authFormsSection.style.display = 'none'; // Esconde os formulários
        loggedInAppContent.style.display = 'block'; // Mostra o conteúdo da aplicação
        authStatusIndicator.textContent = `Logado como: ${user.email || user.displayName}`;
        userStatusElement.textContent = `Bem-vindo(a), ${user.email || user.displayName}!`;
        // Limpa os campos de login/registro
        registerEmailInput.value = '';
        registerPasswordInput.value = '';
        loginEmailInput.value = '';
        loginPasswordInput.value = '';

        // Opcional: Recarregar dados do RTDB após o login se eles fossem específicos do usuário
        // No seu caso, os listeners do Firebase já carregam tudo independente do usuário, então está OK.
        // Mas se tivesse dados específicos (ex: 'users/UID/professores'), você chamaria aqui.
        // updateDashboardCounts(); // Garante que a dashboard seja atualizada
        // renderProfessoresList(); // Garante que as listas sejam renderizadas se a página de cadastros estiver ativa

    } else {
        // Usuário não logado
        authFormsSection.style.display = 'block'; // Mostra os formulários
        loggedInAppContent.style.display = 'none'; // Esconde o conteúdo da aplicação
        authStatusIndicator.textContent = 'Não logado';
        userStatusElement.textContent = ''; // Limpa o status do usuário
    }
    console.log("UI atualizada. Usuário:", user ? user.uid : "Nenhum");
}
//
function setupAuthStateObserver() {
    window.authOnAuthStateChanged(window.firebaseAuth, (user) => {
        updateAppUI(user);
        // Opcional: Se initFirebaseListeners só deve rodar uma vez,
        // mas precisa dos dados carregados antes da UI ser renderizada.
        // No seu caso, initFirebaseListeners já é chamado em DOMContentLoaded
        // e os listeners são persistentes, então não precisa chamar aqui novamente.
        // Mas é importante que a primeira chamada de updateAppUI tenha sido feita
        // para que a UI reflita o estado antes de qualquer outra renderização.
    });
    console.log("Observador de estado de autenticação do Firebase configurado.");
}

// ... (resto do seu código) ...


// ... (resto do seu código) ...
// ... (código existente - Funções de Autenticação) ...

function initAuthUIListeners() {
    btnRegister.addEventListener('click', handleRegister);
    btnLogin.addEventListener('click', handleLogin);
    btnGoogleLogin.addEventListener('click', handleGoogleLogin);
    btnLogout.addEventListener('click', handleLogout);

    console.log("Listeners da UI de autenticação inicializados.");
}

// ... (resto do seu código) ...


// Navegação
function initNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSection = button.getAttribute('data-section');
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetSection).classList.add('active');

            if (targetSection === 'dashboard') {
                updateDashboardCounts();
            }
            if (targetSection === 'cadastros') {
                renderProfessoresList();
                renderDisciplinasList();
                renderTurmasList();
                renderSalasList();
            }
            if (targetSection === 'horarios') {
                updateHorarioSelects();
                const selectedTurmaId = document.getElementById('horario-turma').value;
                if (selectedTurmaId) {
                    renderHorariosGrid(selectedTurmaId);
                } else {
                    document.getElementById('horarios-grid').innerHTML = '<p class="no-activity">Selecione uma turma para visualizar os horários</p>';
                }
            }
            if (targetSection === 'impressao') {
                updatePrintSelects();
            }
        });
    });
}

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(targetTab + '-tab').classList.add('active');
        });
    });
}

// Dashboard
function updateDashboardCounts() {
    document.getElementById('professores-count').textContent = toArray(appData.professores).length;
    document.getElementById('disciplinas-count').textContent = toArray(appData.disciplinas).length;
    document.getElementById('turmas-count').textContent = toArray(appData.turmas).length;
    document.getElementById('salas-count').textContent = toArray(appData.salas).length;
}


// Professores
function initProfessores() {
    const form = document.getElementById('professor-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('professor-nome').value.trim();
        const email = document.getElementById('professor-email').value.trim();
        const disciplinasSelect = document.getElementById('professor-disciplinas');
        const disciplinas = Array.from(disciplinasSelect.selectedOptions).map(option => option.value);

        if (!nome) {
            showAlert('Nome do professor é obrigatório', 'error');
            return;
        }

        const professorData = { // Dados a serem enviados para o Firebase
            nome,
            email,
            disciplinas
        };

        try {
            if (currentEditingItemId) {
                // MODO DE EDIÇÃO: Atualiza o professor existente
                const professorRef = window.dbRef(window.firebaseDB, `professores/${currentEditingItemId}`);
                professorData.updatedAt = window.dbServerTimestamp; // Adiciona timestamp de atualização
                await window.dbUpdate(professorRef, professorData); // Usa dbUpdate para atualizar campos específicos

                showAlert('Professor atualizado com sucesso!', 'success');
            } else {
                // MODO DE CRIAÇÃO: Adiciona um novo professor
                const professorListRef = window.dbRef(window.firebaseDB, 'professores');
                professorData.createdAt = window.dbServerTimestamp; // Adiciona timestamp de criação
                await window.dbPush(professorListRef, professorData);

                showAlert('Professor cadastrado com sucesso!', 'success');
            }

            cancelEditing(); // Reseta o formulário e o estado de edição após o sucesso
        } catch (error) {
            console.error('Erro ao salvar professor:', error);
            showAlert('Erro ao salvar professor: ' + error.message, 'error');
        }
    });

    // Search functionality
    const searchInput = document.getElementById('search-professores');
    searchInput.addEventListener('input', () => {
        renderProfessoresList(searchInput.value);
    });
}

function renderProfessoresList(searchTerm = '') {
    const container = document.getElementById('professores-list');
    const professoresArray = toArray(appData.professores); // Converte para array para filtrar
    const filteredProfessores = professoresArray.filter(professor =>
        professor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (professor.email && professor.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (filteredProfessores.length === 0) {
        container.innerHTML = '<p class="no-activity">Nenhum professor encontrado</p>';
        return;
    }

    container.innerHTML = filteredProfessores.map(professor => {
        const disciplinasNomes = professor.disciplinas && professor.disciplinas.length > 0
            ? professor.disciplinas.map(id => {
                const disciplina = appData.disciplinas[id]; // Acessa pelo ID do objeto
                // NOVO: Exibir todos os turnos e semestres da disciplina
                const turnosDisplay = disciplina?.turnos?.map(t => `${t.charAt(0).toUpperCase() + t.slice(1)} ${disciplina.semestresPorTurno?.[t]}º`)?.join(', ') || 'N/A';
                return disciplina ? `${disciplina.nome} (${disciplina.codigo}) - ${turnosDisplay}` : 'Disciplina não encontrada';
            }).join(', ')
            : 'Nenhuma';

        return `
            <div class="item-card">
                <div class="item-info">
                    <h4>${professor.nome}</h4>
                    <p>Email: ${professor.email || 'Não informado'}</p>
                    <p>Disciplinas: ${disciplinasNomes}</p>
                </div>
                <div class="item-actions">
                    <button class="btn btn-secondary btn-small" onclick="editProfessor('${professor.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deleteProfessor('${professor.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function editProfessor(id) {
    const professor = appData.professores[id];
    if (!professor) {
        showAlert('Professor não encontrado para edição.', 'error');
        return;
    }

    currentEditingItemId = id;
    currentEditingFormId = 'professor-form';

    document.getElementById('professor-nome').value = professor.nome;
    document.getElementById('professor-email').value = professor.email || '';

    const disciplinasSelect = document.getElementById('professor-disciplinas');
    Array.from(disciplinasSelect.options).forEach(option => {
        option.selected = professor.disciplinas && professor.disciplinas.includes(option.value);
    });

    document.getElementById('submit-professor').textContent = 'Salvar Alterações';

    const formActions = document.querySelector('#professor-form .form-actions');
    let cancelBtn = formActions.querySelector('.cancel-edit-btn');
    if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-secondary cancel-edit-btn';
        cancelBtn.textContent = 'Cancelar Edição';
        cancelBtn.addEventListener('click', cancelEditing);
        formActions.insertBefore(cancelBtn, document.getElementById('submit-professor').nextSibling);
    }
}

async function deleteProfessor(id) {
    if (confirm('Tem certeza que deseja excluir este professor? Isso removerá todos os horários associados a ele.')) {
        try {
            const professorRef = window.dbRef(window.firebaseDB, `professores/${id}`);
            await window.dbRemove(professorRef);

            const horariosParaRemover = toArray(appData.horarios).filter(h => h.idProfessor === id);
            for (const horario of horariosParaRemover) {
                const horarioRef = window.dbRef(window.firebaseDB, `horarios/${horario.id}`);
                await window.dbRemove(horarioRef);
            }

            showAlert('Professor excluído com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao excluir professor:', error);
            showAlert('Erro ao excluir professor: ' + error.message, 'error');
        }
    }
}

// Disciplinas
function initDisciplinas() {
    const form = document.getElementById('disciplina-form');
    const turnoSelect = document.getElementById('disciplina-turno'); // Agora é multi-select
    const semestresContainer = document.getElementById('disciplina-semestres-container'); // NOVO: contêiner para semestres dinâmicos

    // NOVO: Update semestre options dynamically when turno(s) changes
    turnoSelect.addEventListener('change', () => {
        semestresContainer.innerHTML = ''; // Limpa os semestres anteriores
        const selectedTurnos = Array.from(turnoSelect.selectedOptions).map(option => option.value);

        if (selectedTurnos.length === 0) {
            semestresContainer.innerHTML = '<p class="no-activity">Selecione ao menos um turno.</p>';
            return;
        }

        selectedTurnos.forEach(turno => {
            const semestresDisponiveis = HORARIOS_CONFIG[turno].semestres;
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            formGroup.innerHTML = `
                <label for="disciplina-semestre-${turno}">Semestre para o Turno ${turno.charAt(0).toUpperCase() + turno.slice(1)}</label>
                <select id="disciplina-semestre-${turno}" data-turno="${turno}" required>
                    <option value="">Selecione o semestre</option>
                    ${semestresDisponiveis.map(sem => `<option value="${sem}">${sem}º Semestre</option>`).join('')}
                </select>
            `;
            semestresContainer.appendChild(formGroup);
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('disciplina-nome').value.trim();
        const codigo = document.getElementById('disciplina-codigo').value.trim();
        const cargaHoraria = parseInt(document.getElementById('disciplina-carga').value);
        const tipo = document.getElementById('disciplina-tipo').value;
    if (!tipo) {
        showAlert('Selecione o tipo da disciplina (Obrigatória/Optativa).', 'error');
        return;
    }
        
        const selectedTurnos = Array.from(turnoSelect.selectedOptions).map(option => option.value);

        if (!nome || !codigo || isNaN(cargaHoraria) || selectedTurnos.length === 0) {
            showAlert('Nome, código, carga horária e ao menos um turno são obrigatórios.', 'error');
            return;
        }

        const semestresPorTurno = {};
        let allSemestresValid = true;
        selectedTurnos.forEach(turno => {
            const semestreSelect = document.getElementById(`disciplina-semestre-${turno}`);
            const semestre = parseInt(semestreSelect.value);
            if (isNaN(semestre)) {
                allSemestresValid = false;
            }
            semestresPorTurno[turno] = semestre;
        });

        if (!allSemestresValid) {
            showAlert('Todos os semestres selecionados devem ser válidos.', 'error');
            return;
        }

        // NOVO: Validação de código único globalmente (ignora o próprio ID em edição)
        const disciplinasArray = toArray(appData.disciplinas);
        if (disciplinasArray.some(d =>
            d.codigo === codigo &&
            d.id !== currentEditingItemId
        )) {
            showAlert('Código da disciplina já existe. Disciplinas devem ter códigos únicos globalmente.', 'error');
            return;
        }

        const disciplinaData = {
        nome,
        codigo,
        cargaHoraria,
        tipo, // NOVO CAMPO ADICIONADO
        turnos: selectedTurnos,
        semestresPorTurno: semestresPorTurno
    };


        try {
            if (currentEditingItemId) {
                // MODO DE EDIÇÃO
                const disciplinaRef = window.dbRef(window.firebaseDB, `disciplinas/${currentEditingItemId}`);
                const updateData = {
        nome: disciplinaData.nome,
        codigo: disciplinaData.codigo,
        cargaHoraria: disciplinaData.cargaHoraria,
        tipo: disciplinaData.tipo, // Novo campo
        turnos: disciplinaData.turnos,
        semestresPorTurno: disciplinaData.semestresPorTurno,
        updatedAt: { '.sv': 'timestamp' } // Formato especial para timestamp
    };

    await window.dbUpdate(disciplinaRef, updateData);
    showAlert('Disciplina atualizada com sucesso!', 'success');

            } else {
                // MODO DE CRIAÇÃO
                const disciplinaListRef = window.dbRef(window.firebaseDB, 'disciplinas');
                const newDisciplina = {
        nome: disciplinaData.nome,
        codigo: disciplinaData.codigo,
        cargaHoraria: disciplinaData.cargaHoraria,
        tipo: disciplinaData.tipo,
        turnos: disciplinaData.turnos,
        semestresPorTurno: disciplinaData.semestresPorTurno,
        createdAt: { '.sv': 'timestamp' } // Formato especial
    };

    await window.dbPush(disciplinaListRef, newDisciplina);
    showAlert('Disciplina cadastrada com sucesso!', 'success');
}
            cancelEditing(); // Reseta o formulário e o estado de edição
        } catch (error) {
            console.error('Erro ao salvar disciplina:', error);
            showAlert('Erro ao salvar disciplina: ' + error.message, 'error');
        }
    });

    // Search functionality
    const searchInput = document.getElementById('search-disciplinas');
    searchInput.addEventListener('input', () => {
        renderDisciplinasList(searchInput.value);
    });
}

function renderDisciplinasList(searchTerm = '') {
    const container = document.getElementById('disciplinas-list');
    const disciplinasArray = toArray(appData.disciplinas);
    
    // 1. Filtragem segura
    const filteredDisciplinas = disciplinasArray.filter(d => {
        const matchesSearch = d.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             d.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch && d.turnos && d.tipo;
    });

    if (filteredDisciplinas.length === 0) {
        container.innerHTML = '<p class="no-activity">Nenhuma disciplina encontrada</p>';
        return;
    }

    // 2. Inicialização garantida da estrutura
    const turnosDisponiveis = ['matutino', 'noturno'];
    const disciplinasPorTurnoETipo = {};
    
    turnosDisponiveis.forEach(turno => {
        disciplinasPorTurnoETipo[turno] = {
            Obrigatoria: [],
            Optativa: []
        };
    });

    // 3. Agrupamento à prova de erros
    filteredDisciplinas.forEach(disciplina => {
        if (!disciplina.turnos || !disciplina.tipo) return;
        
        disciplina.turnos.forEach(turno => {
            if (turnosDisponiveis.includes(turno)) {
                const tipo = disciplina.tipo === 'Obrigatoria' ? 'Obrigatoria' : 'Optativa';
                disciplinasPorTurnoETipo[turno][tipo].push(disciplina);
            }
        });
    });

    // 4. Renderização organizada
    let html = '';
    
    turnosDisponiveis.forEach(turno => {
        const turnoCapitalized = turno.charAt(0).toUpperCase() + turno.slice(1);
        const obrigatorias = disciplinasPorTurnoETipo[turno]['Obrigatoria'];
        const optativas = disciplinasPorTurnoETipo[turno]['Optativa'];

        // Ordena por semestre
        obrigatorias.sort((a, b) => (a.semestresPorTurno?.[turno] || 0) - (b.semestresPorTurno?.[turno] || 0));
        optativas.sort((a, b) => (a.semestresPorTurno?.[turno] || 0) - (b.semestresPorTurno?.[turno] || 0));

        if (obrigatorias.length > 0 || optativas.length > 0) {
            html += `
            <div class="turno-container">
                <h3 class="turno-header">Turno ${turnoCapitalized}</h3>
                
                ${obrigatorias.length > 0 ? `
                <div class="disciplina-tipo-group">
                    <h4 class="tipo-header obrigatoria">Obrigatórias</h4>
                    <div class="disciplina-list">
                        ${obrigatorias.map(d => renderDisciplinaCard(d, turno)).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${optativas.length > 0 ? `
                <div class="disciplina-tipo-group">
                    <h4 class="tipo-header optativa">Optativas</h4>
                    <div class="disciplina-list">
                        ${optativas.map(d => renderDisciplinaCard(d, turno)).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
            `;
        }
    });

    container.innerHTML = html || '<p class="no-activity">Nenhuma disciplina encontrada para os critérios</p>';
}

function renderDisciplinaCard(disciplina, turno) {
    const semestre = disciplina.semestresPorTurno?.[turno] || 'N/A';
    
    return `
    <div class="disciplina-card ${disciplina.tipo.toLowerCase()}">
        <div class="disciplina-main-info">
            <span class="disciplina-codigo">${disciplina.codigo || 'Sem código'}</span>
            <h5 class="disciplina-nome">${disciplina.nome}</h5>
            <div class="disciplina-meta">
                <span class="semestre">${semestre}º Semestre</span>
                <span class="carga-horaria">${disciplina.cargaHoraria || 0}h</span>
            </div>
        </div>
        <div class="disciplina-actions">
            <button class="btn-edit" onclick="editDisciplina('${disciplina.id}')">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn-delete" onclick="deleteDisciplina('${disciplina.id}')">
                <i class="fas fa-trash"></i> Excluir
            </button>
        </div>
    </div>
    `;
}

async function editDisciplina(id) {
    const disciplina = appData.disciplinas[id];
    if (!disciplina) {
        showAlert('Disciplina não encontrada para edição.', 'error');
        return;
    }

    currentEditingItemId = id;
    currentEditingFormId = 'disciplina-form';

    document.getElementById('disciplina-nome').value = disciplina.nome;
    document.getElementById('disciplina-codigo').value = disciplina.codigo;
    document.getElementById('disciplina-carga').value = disciplina.cargaHoraria;
    document.getElementById('disciplina-tipo').value = disciplina.tipo || 'Obrigatoria';

    const turnoSelect = document.getElementById('disciplina-turno');
    Array.from(turnoSelect.options).forEach(option => {
        option.selected = disciplina.turnos && disciplina.turnos.includes(option.value);
    });

    const event = new Event('change'); // Dispara o evento 'change' para gerar os campos de semestre dinamicamente
    turnoSelect.dispatchEvent(event);

    // Preenche os valores dos semestres dinâmicos APÓS eles serem criados
    setTimeout(() => {
        if (disciplina.turnos && disciplina.semestresPorTurno) {
            disciplina.turnos.forEach(turno => {
                const semestreInput = document.getElementById(`disciplina-semestre-${turno}`);
                if (semestreInput) {
                    semestreInput.value = disciplina.semestresPorTurno[turno];
                }
            });
        }
    }, 50); // Pequeno delay para garantir que os elementos estejam no DOM

    document.getElementById('submit-disciplina').textContent = 'Salvar Alterações';

    const formActions = document.querySelector('#disciplina-form .form-actions');
    let cancelBtn = formActions.querySelector('.cancel-edit-btn');
    if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-secondary cancel-edit-btn';
        cancelBtn.textContent = 'Cancelar Edição';
        cancelBtn.addEventListener('click', cancelEditing);
        formActions.insertBefore(cancelBtn, document.getElementById('submit-disciplina').nextSibling);
    }
}

async function deleteDisciplina(id) {
    if (confirm('Tem certeza que deseja excluir esta disciplina?')) {
        try {
            const disciplinaRef = window.dbRef(window.firebaseDB, `disciplinas/${id}`);
            await window.dbRemove(disciplinaRef);
            showAlert('Disciplina excluída com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao excluir disciplina:', error);
            showAlert('Erro ao excluir disciplina: ' + error.message, 'error');
        }
    }
}


// Turmas
function initTurmas() {
    const form = document.getElementById('turma-form');
    const turnoSelect = document.getElementById('turma-turno');
    const semestreSelect = document.getElementById('turma-semestre');
    const tipoSelect = document.getElementById('turma-tipo');
    const codigoSelect = document.getElementById('turma-codigo');

    // Update semestre options when turno changes
    turnoSelect.addEventListener('change', () => {
        const turno = turnoSelect.value;
        semestreSelect.innerHTML = '<option value="">Selecione o semestre</option>';

        if (turno) {
            const semestres = HORARIOS_CONFIG[turno].semestres;
            semestres.forEach(sem => {
                const option = document.createElement('option');
                option.value = sem;
                option.textContent = `${sem}º Semestre`;
                semestreSelect.appendChild(option);
            });
        }
        updateCodigoOptions();
    });

    // Update codigo options when turno or tipo changes
    tipoSelect.addEventListener('change', updateCodigoOptions);

    function updateCodigoOptions() {
        const turno = turnoSelect.value;
        const tipo = tipoSelect.value;
        codigoSelect.innerHTML = '<option value="">Selecione o código</option>';

        if (turno && tipo) {
            const codigos = CODIGOS_TURMA[turno][tipo];
            codigos.forEach(codigo => {
                const option = document.createElement('option');
                option.value = codigo;
                option.textContent = codigo;
                codigoSelect.appendChild(option);
            });
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const turno = document.getElementById('turma-turno').value;
        const semestre = parseInt(document.getElementById('turma-semestre').value);
        const tipo = document.getElementById('turma-tipo').value;
        const codigo = document.getElementById('turma-codigo').value;

        if (!turno || isNaN(semestre) || !tipo || !codigo) {
            showAlert('Todos os campos são obrigatórios e numéricos devem ser válidos', 'error');
            return;
        }

        // Check if turma already exists (and ignore self if editing)
        const turmasArray = toArray(appData.turmas);
        if (turmasArray.some(t =>
            t.turno === turno &&
            t.semestreCurricular === semestre &&
            t.codigo === codigo &&
            t.id !== currentEditingItemId // Ignora a própria turma se estiver em modo de edição
        )) {
            showAlert('Turma já existe com estes parâmetros', 'error');
            return;
        }

        const nome = `${semestre}º Semestre ${turno.charAt(0).toUpperCase() + turno.slice(1)} - ${codigo}`;

        const turmaData = {
            nome,
            turno,
            semestreCurricular: semestre,
            tipo,
            codigo
        };

        try {
    if (currentEditingItemId) {
        // MODO DE EDIÇÃO
        const turmaRef = window.dbRef(window.firebaseDB, `turmas/${currentEditingItemId}`);
        await window.dbUpdate(turmaRef, {
            ...turmaData,
            updatedAt: window.dbServerTimestamp()
        });
        showAlert('Turma atualizada com sucesso!', 'success');
    } else {
        // MODO DE CRIAÇÃO
        const turmaListRef = window.dbRef(window.firebaseDB, 'turmas');
        await window.dbPush(turmaListRef, {
            ...turmaData,
            createdAt: window.dbServerTimestamp(),
            updatedAt: window.dbServerTimestamp()
        });
        showAlert('Turma cadastrada com sucesso!', 'success');
    }
    cancelEditing();
} catch (error) {
    console.error('Erro ao salvar turma:', error);
    showAlert('Erro ao salvar turma: ' + error.message, 'error');
}
    });

    // Search functionality
    const searchInput = document.getElementById('search-turmas');
    searchInput.addEventListener('input', () => {
        renderTurmasList(searchInput.value);
    });
}

function renderTurmasList(searchTerm = '') {
    const container = document.getElementById('turmas-list');
    const turmasArray = toArray(appData.turmas); // Converte para array
    const filteredTurmas = turmasArray.filter(turma =>
        turma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turma.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredTurmas.length === 0) {
        container.innerHTML = '<p class="no-activity">Nenhuma turma encontrada</p>';
        return;
    }

    container.innerHTML = filteredTurmas.map(turma => `
        <div class="item-card">
            <div class="item-info">
                <h4>${turma.nome}</h4>
                <p>Turno: ${turma.turno}</p>
                <p>Tipo: ${turma.tipo} (${turma.codigo})</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-secondary btn-small" onclick="editTurma('${turma.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteTurma('${turma.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function editTurma(id) {
    const turma = appData.turmas[id];
    if (!turma) {
        showAlert('Turma não encontrada para edição.', 'error');
        return;
    }

    currentEditingItemId = id;
    currentEditingFormId = 'turma-form';

    document.getElementById('turma-turno').value = turma.turno;

    // Trigger change event for turno to update semestre options
    const turnoSelect = document.getElementById('turma-turno');
    let event = new Event('change');
    turnoSelect.dispatchEvent(event);
    document.getElementById('turma-semestre').value = turma.semestreCurricular;

    document.getElementById('turma-tipo').value = turma.tipo;

    // Trigger change event for tipo (and potentially turno again) to update codigo options
    const tipoSelect = document.getElementById('turma-tipo');
    event = new Event('change'); // Create a new event object for dispatch
    tipoSelect.dispatchEvent(event);
    document.getElementById('turma-codigo').value = turma.codigo;

    document.getElementById('submit-turma').textContent = 'Salvar Alterações';

    const formActions = document.querySelector('#turma-form .form-actions');
    let cancelBtn = formActions.querySelector('.cancel-edit-btn');
    if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-secondary cancel-edit-btn';
        cancelBtn.textContent = 'Cancelar Edição';
        cancelBtn.addEventListener('click', cancelEditing);
        formActions.insertBefore(cancelBtn, document.getElementById('submit-turma').nextSibling);
    }
}

async function deleteTurma(id) {
    if (confirm('Tem certeza que deseja excluir esta turma? Isso removerá todos os horários associados a ela.')) {
        try {
            const turmaRef = window.dbRef(window.firebaseDB, `turmas/${id}`);
            await window.dbRemove(turmaRef);

            const horariosParaRemover = toArray(appData.horarios).filter(h => h.idTurma === id);
            for (const horario of horariosParaRemover) {
                const horarioRef = window.dbRef(window.firebaseDB, `horarios/${horario.id}`);
                await window.dbRemove(horarioRef);
            }

            showAlert('Turma excluída com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao excluir turma:', error);
            showAlert('Erro ao excluir turma: ' + error.message, 'error');
        }
    }
}

// Salas
function initSalas() {
    const form = document.getElementById('sala-form');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('sala-nome').value.trim();
        const capacidade = parseInt(document.getElementById('sala-capacidade').value) || 0;
        const recursosCheckboxes = form.querySelectorAll('input[type="checkbox"]:checked');
        const recursos = Array.from(recursosCheckboxes).map(cb => cb.value);

        if (!nome) {
            showAlert('Nome da sala é obrigatório', 'error');
            return;
        }

        // Check if sala already exists (and ignore self if editing)
        const salasArray = toArray(appData.salas);
        if (salasArray.some(s =>
            s.nome === nome &&
            s.id !== currentEditingItemId // Ignora a própria sala se estiver em modo de edição
        )) {
            showAlert('Sala já existe com este nome', 'error');
            return;
        }

        const salaData = {
            nome,
            capacidade,
            recursos
        };

        try {
            if (currentEditingItemId) {
                // MODO DE EDIÇÃO
                const salaRef = window.dbRef(window.firebaseDB, `salas/${currentEditingItemId}`);
                salaData.updatedAt = window.dbServerTimestamp;
                await window.dbUpdate(salaRef, salaData);

                showAlert('Sala atualizada com sucesso!', 'success');
            } else {
                // MODO DE CRIAÇÃO
                const salaListRef = window.dbRef(window.firebaseDB, 'salas');
                salaData.createdAt = window.dbServerTimestamp;
                await window.dbPush(salaListRef, salaData);

                showAlert('Sala cadastrada com sucesso!', 'success');
            }
            cancelEditing(); // Reseta o formulário e o estado de edição
        } catch (error) {
            console.error('Erro ao salvar sala:', error);
            showAlert('Erro ao salvar sala: ' + error.message, 'error');
        }
    });

    // Search functionality
    const searchInput = document.getElementById('search-salas');
    searchInput.addEventListener('input', () => {
        renderSalasList(searchInput.value);
    });
}

function renderSalasList(searchTerm = '') {
    const container = document.getElementById('salas-list');
    const salasArray = toArray(appData.salas); // Converte para array
    const filteredSalas = salasArray.filter(sala =>
        sala.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filteredSalas.length === 0) {
        container.innerHTML = '<p class="no-activity">Nenhuma sala encontrada</p>';
        return;
    }

    container.innerHTML = filteredSalas.map(sala => `
        <div class="item-card">
            <div class="item-info">
                <h4>${sala.nome}</h4>
                <p>Capacidade: ${sala.capacidade || 'Não informada'}</p>
                <p>Recursos: ${sala.recursos.length > 0 ? sala.recursos.join(', ') : 'Nenhum'}</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-secondary btn-small" onclick="editSala('${sala.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteSala('${sala.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function editSala(id) {
    const sala = appData.salas[id];
    if (!sala) {
        showAlert('Sala não encontrada para edição.', 'error');
        return;
    }

    currentEditingItemId = id;
    currentEditingFormId = 'sala-form';

    document.getElementById('sala-nome').value = sala.nome;
    document.getElementById('sala-capacidade').value = sala.capacidade;

    const recursosCheckboxes = document.querySelectorAll('#sala-form input[name="recurso"]');
    recursosCheckboxes.forEach(checkbox => {
        checkbox.checked = sala.recursos && sala.recursos.includes(checkbox.value);
    });

    document.getElementById('submit-sala').textContent = 'Salvar Alterações';

    const formActions = document.querySelector('#sala-form .form-actions');
    let cancelBtn = formActions.querySelector('.cancel-edit-btn');
    if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn btn-secondary cancel-edit-btn';
        cancelBtn.textContent = 'Cancelar Edição';
        cancelBtn.addEventListener('click', cancelEditing);
        formActions.insertBefore(cancelBtn, document.getElementById('submit-sala').nextSibling);
    }
}

async function deleteSala(id) {
    if (confirm('Tem certeza que deseja excluir esta sala? Isso removerá todos os horários que a utilizam.')) {
        try {
            const salaRef = window.dbRef(window.firebaseDB, `salas/${id}`);
            await window.dbRemove(salaRef);

            const horariosQueUsamSala = toArray(appData.horarios).filter(h => h.idSala === id);
            for (const horario of horariosQueUsamSala) {
                const horarioRef = window.dbRef(window.firebaseDB, `horarios/${horario.id}`);
                await window.dbRemove(horarioRef);
            }

            showAlert('Sala excluída com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao excluir sala:', error);
            showAlert('Erro ao excluir sala: ' + error.message, 'error');
        }
    }
}


// Update select options across the app
function updateSelectOptions() {
    // Update professor disciplinas select
    const professorDisciplinasSelect = document.getElementById('professor-disciplinas');
    professorDisciplinasSelect.innerHTML = '';
    toArray(appData.disciplinas).forEach(disciplina => {
        // NOVO: Exibir todos os turnos e semestres da disciplina
        const turnosDisplay = disciplina.turnos && disciplina.semestresPorTurno
            ? disciplina.turnos.map(t => `${t.charAt(0).toUpperCase() + t.slice(1)} ${disciplina.semestresPorTurno[t]}º`).join(', ')
            : 'N/A';
        const option = document.createElement('option');
        option.value = disciplina.id;
        option.textContent = `${disciplina.nome} (${disciplina.codigo}) - ${turnosDisplay}`; // Exibe os turnos e semestres
        professorDisciplinasSelect.appendChild(option);
    });

    // Update horario selects
    updateHorarioSelects();

    // Update print selects
    updatePrintSelects();
}

// script.js - PARTE 3 (continuação)

function updateHorarioSelects() {
    const turmaSelect = document.getElementById('horario-turma');
    turmaSelect.innerHTML = '<option value="">Selecione uma turma</option>';
    toArray(appData.turmas).forEach(turma => {
        const option = document.createElement('option');
        option.value = turma.id;
        option.textContent = turma.nome;
        turmaSelect.appendChild(option);
    });

    // Atualizar selects do modal de horário
    const modalDisciplinaSelect = document.getElementById('modal-disciplina');
    modalDisciplinaSelect.innerHTML = '<option value="">Selecione a disciplina</option>';
    toArray(appData.disciplinas).forEach(disciplina => {
        // NOVO: Exibir todos os turnos e semestres da disciplina
        const turnosDisplay = disciplina.turnos && disciplina.semestresPorTurno
            ? disciplina.turnos.map(t => `${t.charAt(0).toUpperCase() + t.slice(1)} ${disciplina.semestresPorTurno[t]}º`).join(', ')
            : 'N/A'; // Se não houver turnos/semestres, exibe N/A
        const option = document.createElement('option');
        option.value = disciplina.id;
        option.textContent = `${disciplina.nome} (${disciplina.codigo}) - ${turnosDisplay}`; // Exibe os turnos e semestres
        modalDisciplinaSelect.appendChild(option);
    });

    const modalProfessorSelect = document.getElementById('modal-professor');
    modalProfessorSelect.innerHTML = '<option value="">Selecione o professor</option>';
    toArray(appData.professores).forEach(professor => {
        const option = document.createElement('option');
        option.value = professor.id;
        option.textContent = professor.nome;
        modalProfessorSelect.appendChild(option);
    });

    const modalSalaSelect = document.getElementById('modal-sala');
    modalSalaSelect.innerHTML = '<option value="">Selecione a sala</option>';
    toArray(appData.salas).forEach(sala => {
        const option = document.createElement('option');
        option.value = sala.id;
        option.textContent = sala.nome;
        modalSalaSelect.appendChild(option);
    });
}



// Horários - Funcionalidades avançadas
function initHorarios() {
    const turmaSelect = document.getElementById('horario-turma');
    const novoHorarioBtn = document.getElementById('btn-novo-horario');
    const limparHorariosBtn = document.getElementById('btn-limpar-horarios');
    const modal = document.getElementById('horario-modal');
    const modalForm = document.getElementById('horario-form');
    const btnDeleteHorarioModal = document.getElementById('btn-delete-horario-modal'); // NOVO

    let currentSlot = null; // Slot atual sendo editado

    // Event listeners
    turmaSelect.addEventListener('change', () => {
        if (turmaSelect.value) {
            renderHorariosGrid(turmaSelect.value);
        } else {
            document.getElementById('horarios-grid').innerHTML = '<p class="no-activity">Selecione uma turma para visualizar os horários</p>';
        }
    });

    novoHorarioBtn.addEventListener('click', () => {
        if (!turmaSelect.value) {
            showAlert('Selecione uma turma primeiro', 'warning');
            return;
        }
        // Quando adicionando um novo horário, limpamos o currentSlot e predefinimos o modal para adição
        currentSlot = null;
        document.getElementById('horario-form').reset();
        document.getElementById('horario-modal-title').textContent = 'Adicionar Horário'; // NOVO: Título padrão
        btnDeleteHorarioModal.style.display = 'none'; // NOVO: Esconde botão de exclusão
        const selectedTurma = appData.turmas[turmaSelect.value];
        if (selectedTurma) {
            updateModalSelects(selectedTurma); // Atualiza os selects do modal para a turma
        }
        openHorarioModal();
    });

    limparHorariosBtn.addEventListener('click', async () => {
        const turmaId = turmaSelect.value;
        if (!turmaId) {
            showAlert('Selecione uma turma primeiro', 'warning');
            return;
        }

        if (confirm('Tem certeza que deseja limpar todos os horários desta turma?')) {
            try {
                const horariosDaTurma = toArray(appData.horarios).filter(h => h.idTurma === turmaId);
                const updates = {};
                horariosDaTurma.forEach(horario => {
                    updates[`horarios/${horario.id}`] = null;
                });
                await window.dbUpdate(window.dbRef(window.firebaseDB, '/'), updates);

                showAlert('Horários limpos com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao limpar horários:', error);
                showAlert('Erro ao limpar horários: ' + error.message, 'error');
            }
        }
    });

    // Modal events
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-close')) {
            closeHorarioModal();
        }
    });

    modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveHorario();
    });

    // NOVO: Listener para o botão de exclusão dentro do modal
    btnDeleteHorarioModal.addEventListener('click', async () => {
        if (currentSlot && confirm('Tem certeza que deseja excluir este horário?')) {
            await deleteHorario(currentSlot.turmaId, currentSlot.dia, currentSlot.bloco);
            closeHorarioModal(); // Fecha o modal após a exclusão
        }
    });
}

function renderHorariosGrid(turmaId) {
    const turma = appData.turmas[turmaId];
    if (!turma) return;

    const container = document.getElementById('horarios-grid');
    const config = HORARIOS_CONFIG[turma.turno];

    // Função para gerar cor única baseada no ID da disciplina
    const getCorPorDisciplina = (idDisciplina) => {
        if (!idDisciplina) return '#f0f0f0'; // Cor padrão se não houver disciplina
        const hash = idDisciplina.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        const hue = hash % 360; // Gera um tom de cor entre 0-359
        return `hsl(${hue}, 70%, 85%)`; // Cores pastel para melhor legibilidade
    };

    let html = '<table class="grade-horarios">';
    html += '<thead><tr><th>Horário</th>';
    config.dias.forEach(dia => html += `<th>${formatDiaName(dia)}</th>`);
    html += '</tr></thead><tbody>';

    if (turma.turno === 'matutino') {
        config.blocos.forEach(bloco => {
            html += `<tr><td class="horario-label">${bloco.inicio} - ${bloco.fim}</td>`;
            config.dias.forEach(dia => {
                const horario = toArray(appData.horarios).find(h => 
                    h.idTurma === turmaId && h.diaSemana === dia && h.bloco === bloco.id
                );
                const corFundo = horario ? getCorPorDisciplina(horario.idDisciplina) : '#ffffff';
                html += `<td class="horario-slot ${horario ? 'ocupado' : ''}" 
                            style="background-color: ${corFundo};"
                            data-turma-id="${turmaId}" 
                            data-dia="${dia}" 
                            data-bloco="${bloco.id}" 
                            onclick="editHorarioSlot('${turmaId}', '${dia}', ${bloco.id})">`;

                if (horario) {
                    const disciplina = appData.disciplinas[horario.idDisciplina];
                    const professor = appData.professores[horario.idProfessor];
                    const sala = appData.salas[horario.idSala];
                    html += `<div class="horario-info">
                                <div class="disciplina">${disciplina?.nome || 'N/A'}</div>
                                <div class="professor">${professor?.nome || 'N/A'}</div>
                                <div class="sala">${sala?.nome || 'N/A'}</div>
                             </div>`;
                } else {
                    html += '<div class="horario-vazio">+</div>';
                }
                html += '</td>';
            });
            html += '</tr>';
        });
    } else {
        // Lógica para turno noturno (similar, mas com blocos por dia)
        const maxBlocos = Math.max(...config.dias.map(dia => config.blocos[dia].length));
        for (let i = 0; i < maxBlocos; i++) {
            html += '<tr>';
            const horariosLabels = config.dias.map(dia => {
                const bloco = config.blocos[dia][i];
                return bloco ? `${bloco.inicio} - ${bloco.fim}` : '';
            }).filter(h => h);
            const horarioUnico = [...new Set(horariosLabels)];
            html += `<td class="horario-label">${horarioUnico.join(' / ')}</td>`;

            config.dias.forEach(dia => {
                const bloco = config.blocos[dia][i];
                if (bloco) {
                    const horario = toArray(appData.horarios).find(h => 
                        h.idTurma === turmaId && h.diaSemana === dia && h.bloco === bloco.id
                    );
                    const corFundo = horario ? getCorPorDisciplina(horario.idDisciplina) : '#ffffff';
                    html += `<td class="horario-slot ${horario ? 'ocupado' : ''}" 
                                style="background-color: ${corFundo};"
                                data-turma-id="${turmaId}" 
                                data-dia="${dia}" 
                                data-bloco="${bloco.id}" 
                                onclick="editHorarioSlot('${turmaId}', '${dia}', ${bloco.id})">`;

                    // Dentro do else (turno noturno) da função renderHorariosGrid():
if (horario) {
    const disciplina = appData.disciplinas[horario.idDisciplina];
    const professor = appData.professores[horario.idProfessor];
    const sala = appData.salas[horario.idSala];  // Adicionado esta linha
    html += `<div class="horario-info">
                <div class="disciplina">${disciplina?.nome || 'N/A'}</div>
                <div class="professor">${professor?.nome || 'N/A'}</div>
                <div class="sala">${sala?.nome || 'N/A'}</div>  <!-- Adicionado esta linha -->
             </div>`;
} else {
    html += '<div class="horario-vazio">+</div>';
}
                    html += '</td>';
                } else {
                    html += '<td class="horario-slot disabled"></td>';
                }
            });
            html += '</tr>';
        }
    }
    html += '</tbody></table>';
    container.innerHTML = html;
}

function formatDiaName(dia) {
    const nomes = {
        'segunda': 'Segunda',
        'terca': 'Terça',
        'quarta': 'Quarta',
        'quinta': 'Quinta',
        'sexta': 'Sexta',
        'sabado': 'Sábado'
    };
    return nomes[dia] || dia;
}

function getHorarioSlot(turmaId, dia, bloco) {
    return toArray(appData.horarios).find(h =>
        h.idTurma === turmaId &&
        h.diaSemana === dia &&
        h.bloco === bloco
    );
}

function editHorarioSlot(turmaId, dia, bloco) {
    const turma = appData.turmas[turmaId];
    if (!turma) return;

    currentSlot = { turmaId, dia, bloco };

    const existingHorario = getHorarioSlot(turmaId, dia, bloco);
    const modalTitle = document.getElementById('horario-modal-title');
    const btnDeleteHorarioModal = document.getElementById('btn-delete-horario-modal');

    if (existingHorario) {
        // MODO EDIÇÃO: Preenche o formulário e ajusta o modal
        modalTitle.textContent = 'Editar Horário';
        document.getElementById('modal-disciplina').value = existingHorario.idDisciplina;
        document.getElementById('modal-professor').value = existingHorario.idProfessor;
        document.getElementById('modal-sala').value = existingHorario.idSala;
        btnDeleteHorarioModal.style.display = 'inline-block'; // Mostra o botão de exclusão
        
    } else {
        // MODO ADIÇÃO: Reseta o formulário e ajusta o modal
        modalTitle.textContent = 'Adicionar Horário';
        document.getElementById('horario-form').reset();
        btnDeleteHorarioModal.style.display = 'none'; // Esconde o botão de exclusão
    }

    updateModalSelects(turma); // Atualiza os selects do modal

    // NOVO: Assegura que o professor e sala sejam pré-selecionados ao editar
    if (existingHorario) {
        // Atrasar um pouco para dar tempo de updateModalSelects criar as opções
        setTimeout(() => {
            const disciplinaSelect = document.getElementById('modal-disciplina');
            // Se uma disciplina já foi selecionada, dispara o change para popular o professor
            if (disciplinaSelect.value) {
                const event = new Event('change');
                disciplinaSelect.dispatchEvent(event); 
            }
            // Setar os valores após a atualização dos selects (e o possível disparo do change)
            document.getElementById('modal-professor').value = existingHorario.idProfessor;
            document.getElementById('modal-sala').value = existingHorario.idSala;
        }, 50); // Pequeno delay
    }

    openHorarioModal();
}

function openHorarioModal() {
    const modal = document.getElementById('horario-modal');
    modal.classList.add('active');
}

function closeHorarioModal() {
    const modal = document.getElementById('horario-modal');
    modal.classList.remove('active');
    currentSlot = null;
    document.getElementById('horario-form').reset();

    // NOVO: Resetar título do modal para o padrão
    document.getElementById('horario-modal-title').textContent = 'Adicionar Horário';
    // NOVO: Esconder o botão de exclusão
    document.getElementById('btn-delete-horario-modal').style.display = 'none';
}

function updateModalSelects(turma) {
    // Update disciplinas select - only for the turma's semester and turno
    const disciplinaSelect = document.getElementById('modal-disciplina');
    disciplinaSelect.innerHTML = '<option value="">Selecione a disciplina</option>';

    // AQUI ESTÁ A MUDANÇA CRÍTICA: Lógica de filtro para disciplinas válidas
    const disciplinasValidas = toArray(appData.disciplinas).filter(d =>
        d.turnos && d.turnos.includes(turma.turno) &&
        d.semestresPorTurno && d.semestresPorTurno[turma.turno] === turma.semestreCurricular
    );

    disciplinasValidas.forEach(disciplina => {
        const option = document.createElement('option');
        option.value = disciplina.id;
        // Exibe o nome da disciplina e o semestre específico para o turno da turma selecionada
        option.textContent = `${disciplina.nome} (${disciplina.codigo}) - ${disciplina.semestresPorTurno[turma.turno]}º Semestre`;
        disciplinaSelect.appendChild(option);
    });

    // Update professores select - only those who can teach the selected disciplina
    const professorSelect = document.getElementById('modal-professor');
    professorSelect.innerHTML = '<option value="">Selecione o professor</option>';

    disciplinaSelect.onchange = () => {
        const disciplinaId = disciplinaSelect.value;
        professorSelect.innerHTML = '<option value="">Selecione o professor</option>';

        if (disciplinaId) {
            const professoresValidos = toArray(appData.professores).filter(p =>
                p.disciplinas && p.disciplinas.includes(disciplinaId)
            );

            professoresValidos.forEach(professor => {
                const option = document.createElement('option');
                option.value = professor.id;
                option.textContent = professor.nome;
                professorSelect.appendChild(option);
            });
        }
        // Se já havia um professor selecionado (em modo de edição), tente selecioná-lo novamente
        // Isso é feito em editHorarioSlot com um setTimeout para evitar race conditions
    };
    // Se já havia uma disciplina selecionada, dispara o change para popular o professor (útil em edições)
    if (disciplinaSelect.value) {
        const event = new Event('change');
        disciplinaSelect.dispatchEvent(event);
    }

    // Update salas select
    const salaSelect = document.getElementById('modal-sala');
    salaSelect.innerHTML = '<option value="">Selecione a sala</option>';

    toArray(appData.salas).forEach(sala => {
        const option = document.createElement('option');
        option.value = sala.id;
        option.textContent = sala.nome;
        salaSelect.appendChild(option);
    });
    // Se já havia uma sala selecionada (em modo de edição), tente selecioná-la novamente
    // Isso é feito em editHorarioSlot com um setTimeout
}

// script.js - PARTE 4 (continuação)

async function saveHorario() {
    if (!currentSlot) return;

    const disciplinaId = document.getElementById('modal-disciplina').value;
    const professorId = document.getElementById('modal-professor').value;
    const salaId = document.getElementById('modal-sala').value;

    if (!disciplinaId || !professorId || !salaId) {
        showAlert('Todos os campos são obrigatórios', 'error');
        return;
    }

    // Validações de conflito
    const conflitos = validateHorarioConflicts(currentSlot, professorId, salaId);

    if (conflitos.length > 0) {
        showAlert(`Conflitos detectados: ${conflitos.join(', ')}`, 'error');
        return;
    }

    try {
        // Encontra o ID do horário existente para este slot, se houver
        const existingHorario = toArray(appData.horarios).find(h =>
            h.idTurma === currentSlot.turmaId &&
            h.diaSemana === currentSlot.dia &&
            h.bloco === currentSlot.bloco
        );

        const horarioData = {
            diaSemana: currentSlot.dia,
            bloco: currentSlot.bloco,
            idTurma: currentSlot.turmaId,
            idDisciplina: disciplinaId,
            idProfessor: professorId,
            idSala: salaId,
            updatedAt: { '.sv': 'timestamp' }  // Formato correto para timestamp
        };

        if (existingHorario) {
            // Atualiza o horário existente no Firebase
            const horarioRef = window.dbRef(window.firebaseDB, `horarios/${existingHorario.id}`);
            await window.dbUpdate(horarioRef, horarioData);
        } else {
            // Adiciona um novo horário no Firebase
            const horarioListRef = window.dbRef(window.firebaseDB, 'horarios');
            const newHorario = {
                ...horarioData,
                createdAt: { '.sv': 'timestamp' }  // Formato correto para timestamp
            };
            await window.dbPush(horarioListRef, newHorario);
        }

        closeHorarioModal();
        showAlert('Horário salvo com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar horário:', error);
        showAlert('Erro ao salvar horário: ' + error.message, 'error');
    }
}

function validateHorarioConflicts(slot, professorId, salaId) {
    const conflitos = [];
    const horariosArray = toArray(appData.horarios);

    // Obtém a turma atual para determinar o turno
    const turmaAtual = appData.turmas[slot.turmaId];
    if (!turmaAtual) return conflitos;

    // Verifica conflitos de professor
    const professorConflict = horariosArray.find(h => {
        const turmaExistente = appData.turmas[h.idTurma];
        return h.idProfessor === professorId &&
               h.diaSemana === slot.dia &&
               h.bloco === slot.bloco &&
               turmaExistente?.turno === turmaAtual.turno && // Só conflita se for no mesmo turno
               !(h.idTurma === slot.turmaId && h.diaSemana === slot.dia && h.bloco === slot.bloco);
    });

    if (professorConflict) {
        const turmaConflito = appData.turmas[professorConflict.idTurma];
        conflitos.push(`Professor já alocado na turma ${turmaConflito?.nome || 'N/A'} no mesmo turno`);
    }

    // Verifica conflitos de sala
    const salaConflict = horariosArray.find(h => {
        const turmaExistente = appData.turmas[h.idTurma];
        return h.idSala === salaId &&
               h.diaSemana === slot.dia &&
               h.bloco === slot.bloco &&
               turmaExistente?.turno === turmaAtual.turno && // Só conflita se for no mesmo turno
               !(h.idTurma === slot.turmaId && h.diaSemana === slot.dia && h.bloco === slot.bloco);
    });

    if (salaConflict) {
        const turmaConflito = appData.turmas[salaConflict.idTurma];
        conflitos.push(`Sala já ocupada pela turma ${turmaConflito?.nome || 'N/A'} no mesmo turno`);
    }

    return conflitos;
}

// Função INFALÍVEL para determinar turnos
function determinarTurnoInfalivel(item) {
    // Se for sábado, sempre noturno (de acordo com sua configuração)
    if (item.diaSemana === 'sabado' || item.dia === 'sabado') {
        return 'noturno';
    }
    
    // Se o bloco for numérico (matutino: 1-6)
    if (typeof item.bloco === 'number' && item.bloco >= 1 && item.bloco <= 6) {
        return 'matutino';
    }
    
    // Todos os outros casos são noturnos
    return 'noturno';
}


// Delete horario (right-click or delete button)
async function deleteHorario(turmaId, dia, bloco) {
    // A confirmação é feita no caller (initHorarios ou contextmenu)
    try {
        const horarioToDelete = toArray(appData.horarios).find(h =>
            h.idTurma === turmaId &&
            h.diaSemana === dia &&
            h.bloco === bloco
        );

        if (horarioToDelete) {
            const horarioRef = window.dbRef(window.firebaseDB, `horarios/${horarioToDelete.id}`);
            await window.dbRemove(horarioRef);
            showAlert('Horário excluído com sucesso!', 'success');
            // renderHorariosGrid será chamado pelo listener do Firebase
        } else {
            showAlert('Horário não encontrado para exclusão.', 'warning');
        }
    } catch (error) {
        console.error('Erro ao excluir horário:', error);
        showAlert('Erro ao excluir horário: ' + error.message, 'error');
    }
}

// Add right-click context menu for deleting horarios
document.addEventListener('contextmenu', (e) => {
    // Verifica se o clique foi dentro de um slot de horário ocupado
    const slotElement = e.target.closest('.horario-slot.ocupado');
    if (slotElement) {
        e.preventDefault(); // Impede o menu de contexto padrão do navegador

        const dia = slotElement.getAttribute('data-dia');
        const bloco = parseInt(slotElement.getAttribute('data-bloco'));
        // Pega a turma ID do próprio elemento do slot, que foi adicionado em renderHorariosGrid
        const turmaId = slotElement.getAttribute('data-turma-id');

        if (turmaId && confirm('Tem certeza que deseja excluir este horário?')) {
            deleteHorario(turmaId, dia, bloco);
        } else {
            showAlert('Selecione uma turma para gerenciar horários.', 'info');
        }
    }
});

// [As funções de Professores, Disciplinas, Turmas e Salas permanecem as mesmas...]

// ============ NOVA FUNCIONALIDADE: IMPRESSÃO DE DISCIPLINAS ============




function atualizarListaDisciplinas() {
    const turnoSelecionado = document.getElementById('print-turno').value;
    generateDisciplinasPrint(turnoSelecionado); // Agora passa o turno explicitamente
}


async function generateDisciplinasPrint(turnoSelecionado) {
    const preview = document.getElementById('print-preview');
    preview.innerHTML = '<div class="loading-pdf">Gerando PDF, aguarde...</div>';
    preview.style.display = 'block';

    // Adiciona um pequeno delay para garantir que o DOM seja atualizado
    await new Promise(resolve => setTimeout(resolve, 100));

    // Filtra as disciplinas que estão alocadas em horários
    const disciplinasOfertadas = {};
    
    toArray(appData.horarios).forEach(horario => {
        const disciplina = appData.disciplinas[horario.idDisciplina];
        const turma = appData.turmas[horario.idTurma];
        const professor = appData.professores[horario.idProfessor];
        
        if (disciplina && turma && professor) {
            if (turnoSelecionado === 'todos' || turma.turno === turnoSelecionado) {
                const semestre = disciplina.semestresPorTurno?.[turma.turno] || 0;
                
                if (!disciplinasOfertadas[disciplina.id]) {
                    disciplinasOfertadas[disciplina.id] = {
                        ...disciplina,
                        semestre,
                        turno: turma.turno,
                        turmas: [],
                        professores: new Set()
                    };
                }
                
                if (!disciplinasOfertadas[disciplina.id].turmas.includes(turma.nome)) {
                    disciplinasOfertadas[disciplina.id].turmas.push(turma.nome);
                }
                disciplinasOfertadas[disciplina.id].professores.add(professor.nome);
            }
        }
    });

    // Converter para array e ordenar por semestre
    const disciplinasArray = Object.values(disciplinasOfertadas)
        .sort((a, b) => a.semestre - b.semestre || a.nome.localeCompare(b.nome));
    
    // Agrupar por semestre
    const disciplinasPorSemestre = {};
    disciplinasArray.forEach(disciplina => {
        if (!disciplinasPorSemestre[disciplina.semestre]) {
            disciplinasPorSemestre[disciplina.semestre] = [];
        }
        disciplinasPorSemestre[disciplina.semestre].push(disciplina);
    });

    // Gerar HTML
    let html = `
        <div class="print-header">
            <h2>Lista de Disciplinas Ofertadas - Ciências Econômicas UESC</h2>
            <p>Turno: ${turnoSelecionado === 'todos' ? 'Todos' : turnoSelecionado.charAt(0).toUpperCase() + turnoSelecionado.slice(1)}</p>
            <p>Semestre: ${new Date().getFullYear()}.${new Date().getMonth() < 6 ? 1 : 2}</p>
            <p>Gerado em: ${formatDateTime(new Date())}</p>
        </div>
        <div class="disciplinas-container">
    `;

    // Ordena os semestres numericamente
    const semestresOrdenados = Object.keys(disciplinasPorSemestre)
        .map(Number)
        .sort((a, b) => a - b);

    semestresOrdenados.forEach((semestre, index) => {
        const bgColor = index % 2 === 0 ? '#f5f5f5' : '#ffffff';
        
        html += `
            <div class="semestre-group" style="background-color: ${bgColor};">
                <h3 class="semestre-title">${semestre}º Semestre</h3>
                <table class="print-table disciplinas-table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Disciplina</th>
                            <th>Turmas</th>
                            <th>Professor(es)</th>
                            <th>C.H.</th>
                            <th>Turno</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        disciplinasPorSemestre[semestre].forEach(disciplina => {
            html += `
                <tr>
                    <td>${disciplina.codigo}</td>
                    <td>${disciplina.nome}</td>
                    <td>${disciplina.turmas.join(', ')}</td>
                    <td>${Array.from(disciplina.professores).join(', ')}</td>
                    <td>${disciplina.cargaHoraria}h</td>
                    <td>${disciplina.turno.charAt(0).toUpperCase() + disciplina.turno.slice(1)}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
    });

    html += `
        </div>
        <div class="print-footer no-print">
            <button class="btn btn-primary" onclick="printPage()">
                <i class="fas fa-print"></i>
                Imprimir
            </button>
            <button class="btn btn-secondary" onclick="closePrintPreview()">
                <i class="fas fa-times"></i>
                Fechar
            </button>
        </div>
    `;
    
    preview.innerHTML = html;
    
    // Força um redesenho do DOM antes de gerar o PDF
    await new Promise(resolve => {
        setTimeout(() => {
            preview.scrollIntoView({ behavior: 'auto' });
            resolve();
        }, 300);
    });
}

// Atualize a função initImpressao para incluir o novo botão
// ============ NOVAS FUNÇÕES DE IMPRESSÃO ============

// ============ SISTEMA DE IMPRESSÃO ============

function initImpressao() {
    // Verifica se estamos na página de impressão
    if (!document.getElementById('impressao')) return;

    // Atualiza os selects
    updatePrintSelects();

    // Configura os botões
    document.getElementById('btn-print-turma')?.addEventListener('click', () => {
        const turmaId = document.getElementById('print-turma').value;
        if (!turmaId) {
            showAlert('Selecione uma turma primeiro', 'warning');
            return;
        }
        generateTurmaPrint(turmaId);
    });

    document.getElementById('btn-print-professor')?.addEventListener('click', () => {
        const professorId = document.getElementById('print-professor').value;
        if (!professorId) {
            showAlert('Selecione um professor primeiro', 'warning');
            return;
        }
        generateProfessorPrint(professorId);
    });

    document.getElementById('btn-print-disciplinas')?.addEventListener('click', () => {
        const turno = document.getElementById('print-turno').value;
        generateDisciplinasPrint(turno);
    });

    console.log('Sistema de impressão inicializado');
}

function updatePrintSelects() {
    // Atualiza select de turmas
    const turmaSelect = document.getElementById('print-turma');
    if (turmaSelect) {
        turmaSelect.innerHTML = '<option value="">Selecione uma turma</option>';
        toArray(appData.turmas).forEach(turma => {
            const option = document.createElement('option');
            option.value = turma.id;
            option.textContent = turma.nome;
            turmaSelect.appendChild(option);
        });
    }

    // Atualiza select de professores
    const professorSelect = document.getElementById('print-professor');
    if (professorSelect) {
        professorSelect.innerHTML = '<option value="">Selecione um professor</option>';
        toArray(appData.professores).forEach(professor => {
            const option = document.createElement('option');
            option.value = professor.id;
            option.textContent = professor.nome;
            professorSelect.appendChild(option);
        });
    }
}

function printPage() {
    const preview = document.getElementById('print-preview');
    if (!preview || preview.innerHTML.trim() === '') {
        showAlert('Nada para imprimir. Gere uma visualização primeiro.', 'warning');
        return;
    }
    window.print();
}

function closePrintPreview() {
    document.getElementById('print-preview').innerHTML = '';
}

function initPrintButtons() {
    // Configura os botões de impressão específicos
    const printTurmaBtn = document.getElementById('btn-print-turma');
    const printProfessorBtn = document.getElementById('btn-print-professor');
    const printDisciplinasBtn = document.getElementById('btn-print-disciplinas');
    const printTurnoSelect = document.getElementById('print-turno');

    if (printTurmaBtn) {
        printTurmaBtn.addEventListener('click', () => {
            const turmaId = document.getElementById('print-turma').value;
            if (!turmaId) {
                showAlert('Selecione uma turma', 'warning');
                return;
            }
            generateTurmaPrint(turmaId);
        });
    }

    if (printProfessorBtn) {
        printProfessorBtn.addEventListener('click', () => {
            const professorId = document.getElementById('print-professor').value;
            if (!professorId) {
                showAlert('Selecione um professor', 'warning');
                return;
            }
            generateProfessorPrint(professorId);
        });
    }

    if (printDisciplinasBtn && printTurnoSelect) {
        const handleDisciplinasClick = () => {
            const turnoSelecionado = printTurnoSelect.value;
            generateDisciplinasPrint(turnoSelecionado);
        };

        printDisciplinasBtn.addEventListener('click', handleDisciplinasClick);
        printTurnoSelect.addEventListener('change', handleDisciplinasClick);
    }
}
function generateTurmaPrint(turmaId) {
    const turma = appData.turmas[turmaId];
    if (!turma) return;
    
    const preview = document.getElementById('print-preview');
    preview.classList.remove('hidden');
    
    const config = HORARIOS_CONFIG[turma.turno];
    const horariosData = toArray(appData.horarios).filter(h => h.idTurma === turmaId);
    
    // Mapeamento de cores para disciplinas
    const coresDisciplinas = {};
    const coresDisponiveis = [
        'disciplina-color-1', // Azul claro
        'disciplina-color-2', // Laranja claro
        'disciplina-color-3', // Verde claro
        'disciplina-color-4', // Rosa claro
        'disciplina-color-5'  // Ciano claro
    ];
    
    let indiceCor = 0;
    
    // Primeiro, mapeamos todas as disciplinas para cores
    horariosData.forEach(horario => {
        if (!coresDisciplinas[horario.idDisciplina]) {
            coresDisciplinas[horario.idDisciplina] = coresDisponiveis[indiceCor];
            indiceCor = (indiceCor + 1) % coresDisponiveis.length;
        }
    });

    let html = `
        <div class="print-header">
            <h2>Horário de Aulas - ${turma.nome}</h2>
            <p>Curso: Ciências Econômicas - UESC</p>
            <p>Gerado em: ${formatDateTime(new Date())}</p>
        </div>
        
        <table class="grade-horarios print-table">
            <thead>
                <tr>
                    <th>Horário</th>
    `;
    
    config.dias.forEach(dia => {
        html += `<th>${formatDiaName(dia)}</th>`;
    });
    
    html += '</tr></thead><tbody>';
    
    if (turma.turno === 'matutino') {
        config.blocos.forEach(bloco => {
            html += `<tr><td class="horario-label">${bloco.inicio} - ${bloco.fim}</td>`;
            
            config.dias.forEach(dia => {
                const horario = horariosData.find(h => h.diaSemana === dia && h.bloco === bloco.id);
                
                if (horario) {
                    const disciplina = appData.disciplinas[horario.idDisciplina];
                    const professor = appData.professores[horario.idProfessor];
                    const sala = appData.salas[horario.idSala];
                    const corDisciplina = coresDisciplinas[horario.idDisciplina];
                    
                    html += `
                        <td class="horario-cell ${corDisciplina}">
                            <div class="print-horario-info">
                                <div class="disciplina">${disciplina?.nome || 'N/A'}</div>
                                <div class="professor">${professor?.nome || 'N/A'}</div>
                                <div class="sala">Sala: ${sala?.nome || 'N/A'}</div>
                            </div>
                        </td>
                    `;
                } else {
                    html += '<td class="horario-cell"></td>';
                }
            });
            
            html += '</tr>';
        });
    } else {
        // Noturno
        const maxBlocos = Math.max(...config.dias.map(dia => config.blocos[dia].length));
        
        for (let i = 0; i < maxBlocos; i++) {
            html += '<tr>';
            
            const horarios = config.dias.map(dia => {
                const bloco = config.blocos[dia][i];
                return bloco ? `${bloco.inicio} - ${bloco.fim}` : '';
            }).filter(h => h);
            
            const horarioUnico = [...new Set(horarios)];
            html += `<td class="horario-label">${horarioUnico.join(' / ')}</td>`;
            
            config.dias.forEach(dia => {
                const bloco = config.blocos[dia][i];
                
                if (bloco) {
                    const horario = horariosData.find(h => h.diaSemana === dia && h.bloco === bloco.id);
                    
                    if (horario) {
                        const disciplina = appData.disciplinas[horario.idDisciplina];
                        const professor = appData.professores[horario.idProfessor];
                        const sala = appData.salas[horario.idSala];
                        const corDisciplina = coresDisciplinas[horario.idDisciplina];
                        
                        html += `
                            <td class="horario-cell ${corDisciplina}">
                                <div class="print-horario-info">
                                    <div class="disciplina">${disciplina?.nome || 'N/A'}</div>
                                    <div class="professor">${professor?.nome || 'N/A'}</div>
                                    <div class="sala">Sala: ${sala?.nome || 'N/A'}</div>
                                </div>
                            </td>
                        `;
                    } else {
                        html += '<td class="horario-cell"></td>';
                    }
                } else {
                    html += '<td class="horario-cell disabled"></td>';
                }
            });
            
            html += '</tr>';
        }
    }
    
    html += '</tbody></table>';
    
   
    
    html += `
        <div class="print-footer">
            <button class="btn btn-primary" onclick="printPage()">
                <i class="fas fa-print"></i>
                Imprimir
            </button>
            <button class="btn btn-secondary" onclick="closePrintPreview()">
                <i class="fas fa-times"></i>
                Fechar
            </button>
        </div>
    `;
    
    preview.innerHTML = html;
    preview.scrollIntoView({ behavior: 'smooth' });
}

function generateTurnoPrint(turno) {
    const preview = document.getElementById('print-preview');
    preview.classList.remove('hidden');
    
    const config = HORARIOS_CONFIG[turno];
    const turmasDoTurno = toArray(appData.turmas).filter(t => t.turno === turno);
    
    let html = `
        <div class="print-header">
            <h2>Horário de Aulas - Turno ${turno.charAt(0).toUpperCase() + turno.slice(1)}</h2>
            <p>Curso: Ciências Econômicas - UESC</p>
            <p>Gerado em: ${formatDateTime(new Date())}</p>
        </div>
    `;
    
    // Para cada turma do turno
    turmasDoTurno.forEach(turma => {
        const horariosData = toArray(appData.horarios).filter(h => h.idTurma === turma.id);
        
        // Mapeamento de cores para disciplinas (por turma)
        const coresDisciplinas = {};
        const coresDisponiveis = [
            'disciplina-color-1', // Azul claro
            'disciplina-color-2', // Laranja claro
            'disciplina-color-3', // Verde claro
            'disciplina-color-4', // Rosa claro
            'disciplina-color-5'  // Ciano claro
        ];
        
        let indiceCor = 0;
        
        // Mapear cores para as disciplinas desta turma
        horariosData.forEach(horario => {
            if (!coresDisciplinas[horario.idDisciplina]) {
                coresDisciplinas[horario.idDisciplina] = coresDisponiveis[indiceCor];
                indiceCor = (indiceCor + 1) % coresDisponiveis.length;
            }
        });

        html += `
            <div class="turma-section">
                <h3 class="turma-title">Turma: ${turma.nome}</h3>
                <table class="grade-horarios print-table">
                    <thead>
                        <tr>
                            <th>Horário</th>
        `;
        
        config.dias.forEach(dia => {
            html += `<th>${formatDiaName(dia)}</th>`;
        });
        
        html += '</tr></thead><tbody>';
        
        if (turno === 'matutino') {
            config.blocos.forEach(bloco => {
                html += `<tr><td class="horario-label">${bloco.inicio} - ${bloco.fim}</td>`;
                
                config.dias.forEach(dia => {
                    const horario = horariosData.find(h => h.diaSemana === dia && h.bloco === bloco.id);
                    
                    if (horario) {
                        const disciplina = appData.disciplinas[horario.idDisciplina];
                        const professor = appData.professores[horario.idProfessor];
                        const sala = appData.salas[horario.idSala];
                        const corDisciplina = coresDisciplinas[horario.idDisciplina];
                        
                        html += `
                            <td class="horario-cell ${corDisciplina}">
                                <div class="print-horario-info">
                                    <div class="disciplina">${disciplina?.nome || 'N/A'}</div>
                                    <div class="professor">${professor?.nome || 'N/A'}</div>
                                    <div class="sala">${sala?.nome || 'N/A'}</div>
                                </div>
                            </td>
                        `;
                    } else {
                        html += '<td class="horario-cell"></td>';
                    }
                });
                
                html += '</tr>';
            });
        } else {
            // Noturno
            const maxBlocos = Math.max(...config.dias.map(dia => config.blocos[dia].length));
            
            for (let i = 0; i < maxBlocos; i++) {
                html += '<tr>';
                
                const horarios = config.dias.map(dia => {
                    const bloco = config.blocos[dia][i];
                    return bloco ? `${bloco.inicio} - ${bloco.fim}` : '';
                }).filter(h => h);
                
                const horarioUnico = [...new Set(horarios)];
                html += `<td class="horario-label">${horarioUnico.join(' / ')}</td>`;
                
                config.dias.forEach(dia => {
                    const bloco = config.blocos[dia][i];
                    
                    if (bloco) {
                        const horario = horariosData.find(h => h.diaSemana === dia && h.bloco === bloco.id);
                        
                        if (horario) {
                            const disciplina = appData.disciplinas[horario.idDisciplina];
                            const professor = appData.professores[horario.idProfessor];
                            const sala = appData.salas[horario.idSala];
                            const corDisciplina = coresDisciplinas[horario.idDisciplina];
                            
                            html += `
                                <td class="horario-cell ${corDisciplina}">
                                    <div class="print-horario-info">
                                        <div class="disciplina">${disciplina?.nome || 'N/A'}</div>
                                        <div class="professor">${professor?.nome || 'N/A'}</div>
                                        <div class="sala">${sala?.nome || 'N/A'}</div>
                                    </div>
                                </td>
                            `;
                        } else {
                            html += '<td class="horario-cell"></td>';
                        }
                    } else {
                        html += '<td class="horario-cell disabled"></td>';
                    }
                });
                
                html += '</tr>';
            }
        }
        
        html += '</tbody></table></div>'; // Fecha turma-section
    });
    
    html += `
        <div class="print-footer">
            <button class="btn btn-primary" onclick="printPage()">
                <i class="fas fa-print"></i>
                Imprimir
            </button>
            <button class="btn btn-secondary" onclick="closePrintPreview()">
                <i class="fas fa-times"></i>
                Fechar
            </button>
        </div>
    `;
    
    preview.innerHTML = html;
    preview.scrollIntoView({ behavior: 'smooth' });
}

// script.js - PARTE 6

function generateProfessorPrint(professorId) {
    const professor = appData.professores[professorId];
    if (!professor) return;
    
    const preview = document.getElementById('print-preview');
    preview.classList.remove('hidden');
    
    const horariosData = toArray(appData.horarios).filter(h => h.idProfessor === professorId);
    
    // Group by turno
    const horariosPorTurno = {
        matutino: horariosData.filter(h => {
            const turma = appData.turmas[h.idTurma];
            return turma?.turno === 'matutino';
        }),
        noturno: horariosData.filter(h => {
            const turma = appData.turmas[h.idTurma];
            return turma?.turno === 'noturno';
        })
    };
    
    let html = `
        <div class="print-header">
            <h2>Horário do Professor - ${professor.nome}</h2>
            <p>Curso: Ciências Econômicas - UESC</p>
            <p>Email: ${professor.email || 'Não informado'}</p>
            <p>Gerado em: ${formatDateTime(new Date())}</p>
        </div>
    `;
    
    // Matutino
    if (horariosPorTurno.matutino.length > 0) {
        html += '<h3>Turno Matutino</h3>';
        html += generateProfessorTurnoTable('matutino', horariosPorTurno.matutino);
    }
    
    // Noturno
    if (horariosPorTurno.noturno.length > 0) {
        html += '<h3>Turno Noturno</h3>';
        html += generateProfessorTurnoTable('noturno', horariosPorTurno.noturno);
    }
    
    if (horariosData.length === 0) {
        html += '<p class="no-activity">Este professor não possui horários cadastrados.</p>';
    }
    
    html += `
        <div class="print-footer">
            <button class="btn btn-primary" onclick="printPage()">
                <i class="fas fa-print"></i>
                Imprimir
            </button>
            <button class="btn btn-secondary" onclick="closePrintPreview()">
                <i class="fas fa-times"></i>
                Fechar
            </button>
        </div>
    `;
    
    preview.innerHTML = html;
    preview.scrollIntoView({ behavior: 'smooth' });
}

function generateProfessorTurnoTable(turno, horariosData) {
    const config = HORARIOS_CONFIG[turno];
    
    let html = `
        <table class="grade-horarios print-table">
            <thead>
                <tr>
                    <th>Horário</th>
    `;
    
    config.dias.forEach(dia => {
        html += `<th>${formatDiaName(dia)}</th>`;
    });
    
    html += '</tr></thead><tbody>';
    
    if (turno === 'matutino') {
        config.blocos.forEach(bloco => {
            html += `<tr><td class="horario-label">${bloco.inicio} - ${bloco.fim}</td>`;
            
            config.dias.forEach(dia => {
                const horario = horariosData.find(h => h.diaSemana === dia && h.bloco === bloco.id);
                html += '<td class="horario-cell">';
                
                if (horario) {
                    const disciplina = appData.disciplinas[horario.idDisciplina];
                    const turma = appData.turmas[horario.idTurma];
                    const sala = appData.salas[horario.idSala];
                    
                    html += `
                        <div class="print-horario-info">
                            <div class="disciplina">${disciplina?.nome || 'N/A'}</div>
                            <div class="turma">${turma?.nome || 'N/A'}</div>
                            <div class="sala">Sala: ${sala?.nome || 'N/A'}</div>
                        </div>
                    `;
                }
                
                html += '</td>';
            });
            
            html += '</tr>';
        });
    } else {
        // Noturno
        const maxBlocos = Math.max(...config.dias.map(dia => config.blocos[dia].length));
        
        for (let i = 0; i < maxBlocos; i++) {
            html += '<tr>';
            
            const horarios = config.dias.map(dia => {
                const bloco = config.blocos[dia][i];
                return bloco ? `${bloco.inicio} - ${bloco.fim}` : '';
            }).filter(h => h);
            
            const horarioUnico = [...new Set(horarios)];
            html += `<td class="horario-label">${horarioUnico.join(' / ')}</td>`;
            
            config.dias.forEach(dia => {
                const bloco = config.blocos[dia][i];
                html += '<td class="horario-cell">';
                
                if (bloco) {
                    const horario = horariosData.find(h => h.diaSemana === dia && h.bloco === bloco.id);
                    
                    if (horario) {
                        const disciplina = appData.disciplinas[horario.idDisciplina];
                        const turma = appData.turmas[horario.idTurma];
                        const sala = appData.salas[horario.idSala];
                        
                        html += `
                            <div class="print-horario-info">
                                <div class="disciplina">${disciplina?.nome || 'N/A'}</div>
                                <div class="turma">${turma?.nome || 'N/A'}</div>
                                <div class="sala">Sala: ${sala?.nome || 'N/A'}</div>
                            </div>
                        `;
                    }
                }
                
                html += '</td>';
            });
            
            html += '</tr>';
        }
    }
    
    html += '</tbody></table>';
    return html;
}

async function gerarPDF(nomeArquivo = 'lista_disciplinas.pdf', elementoId = 'print-preview') {
    try {
        const { jsPDF } = window.jspdf;
        const elemento = document.getElementById(elementoId);
        
        if (!elemento || elemento.innerHTML.includes('loading-pdf')) {
            showAlert('Aguarde a conclusão da geração do conteúdo', 'warning');
            return;
        }

        // Mostrar elemento temporariamente se estiver oculto
        const estiloOriginal = elemento.style.display;
        elemento.style.display = 'block';

        // Adiciona um delay para garantir que o conteúdo esteja renderizado
        await new Promise(resolve => setTimeout(resolve, 500));

        // Configurações para melhor qualidade
        const canvas = await html2canvas(elemento, {
            scale: 2,
            logging: false,
            useCORS: true,
            scrollY: 0,
            windowWidth: elemento.scrollWidth,
            windowHeight: elemento.scrollHeight,
            allowTaint: true
        });

        // Restaurar estilo original
        elemento.style.display = estiloOriginal;

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190; // Largura com margens
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Adiciona primeira página
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        
        // Adiciona páginas adicionais se necessário
        let alturaRestante = imgHeight - (pdf.internal.pageSize.getHeight() - 20);
        let posicao = -10;

        while (alturaRestante > 0) {
            pdf.addPage();
            posicao += alturaRestante;
            pdf.addImage(imgData, 'PNG', 10, posicao, imgWidth, imgHeight);
            alturaRestante -= pdf.internal.pageSize.getHeight() - 20;
        }

        pdf.save(nomeArquivo);
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showAlert('Erro ao gerar PDF: ' + error.message, 'error');
    }
}

function gerarHorarioTurmaPDF() {
    const turmaId = document.getElementById('print-turma').value;
    if (!turmaId) {
        showAlert('Selecione uma turma primeiro', 'warning');
        return;
    }
    generateTurmaPrint(turmaId);
    setTimeout(() => gerarPDF('horario_turma.pdf', 'print-preview'), 500);
}

function gerarHorarioProfessorPDF() {
    const professorId = document.getElementById('print-professor').value;
    if (!professorId) {
        showAlert('Selecione um professor primeiro', 'warning');
        return;
    }
    generateProfessorPrint(professorId);
    setTimeout(() => gerarPDF('horario_professor.pdf', 'print-preview'), 500);
}

async function gerarListaDisciplinasPDF() {
    const turno = document.getElementById('print-turno').value;
    
    // Primeiro gera o conteúdo
    await generateDisciplinasPrint(turno);
    
    // Depois gera o PDF com um pequeno delay
    setTimeout(() => {
        gerarPDF(`disciplinas_${turno}.pdf`, 'print-preview');
    }, 1000);
}




// script.js - PARTE 7


function initFirebaseListeners() {
    // Listener para Professores
    window.dbOnValue(window.dbRef(window.firebaseDB, 'professores'), (snapshot) => {
        appData.professores = snapshot.val() || {};
        // Adiciona o 'id' de cada professor, que é a chave do Firebase
        Object.keys(appData.professores).forEach(key => {
            appData.professores[key].id = key;
        });
        renderProfessoresList();
        updateSelectOptions();
        updateDashboardCounts();
        console.log("Professores atualizados pelo Firebase.");
    });

    // Listener para Disciplinas
    window.dbOnValue(window.dbRef(window.firebaseDB, 'disciplinas'), (snapshot) => {
        appData.disciplinas = snapshot.val() || {};
        // Adiciona o 'id' de cada disciplina
        Object.keys(appData.disciplinas).forEach(key => {
            appData.disciplinas[key].id = key;
        });
        renderDisciplinasList();
        updateSelectOptions();
        updateDashboardCounts();
        console.log("Disciplinas atualizadas pelo Firebase.");
    });

    // Listener para Turmas
    window.dbOnValue(window.dbRef(window.firebaseDB, 'turmas'), (snapshot) => {
        appData.turmas = snapshot.val() || {};
        // Adiciona o 'id' de cada turma
        Object.keys(appData.turmas).forEach(key => {
            appData.turmas[key].id = key;
        });
        renderTurmasList();
        updateSelectOptions();
        updateDashboardCounts();
        console.log("Turmas atualizadas pelo Firebase.");
    });

    // Listener para Salas
    window.dbOnValue(window.dbRef(window.firebaseDB, 'salas'), (snapshot) => {
        appData.salas = snapshot.val() || {};
        // Adiciona o 'id' de cada sala
        Object.keys(appData.salas).forEach(key => {
            appData.salas[key].id = key;
        });
        renderSalasList();
        updateSelectOptions();
        updateDashboardCounts();
        console.log("Salas atualizadas pelo Firebase.");
    });

    // Listener para Horários
    window.dbOnValue(window.dbRef(window.firebaseDB, 'horarios'), (snapshot) => {
        appData.horarios = snapshot.val() || {};
        // Adiciona o 'id' de cada horário
        Object.keys(appData.horarios).forEach(key => {
            appData.horarios[key].id = key;
        });
        // Renderiza a grade de horários da turma atualmente selecionada, se houver
        const selectedTurmaId = document.getElementById('horario-turma').value;
        if (selectedTurmaId) {
            renderHorariosGrid(selectedTurmaId);
        }
        console.log("Horários atualizados pelo Firebase.");
    });

    console.log("Listeners do Firebase inicializados. Dados serão sincronizados automaticamente.");
    } 

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initAuthUIListeners();
    setupAuthStateObserver();
    initNavigation();
    initTabs();
    initProfessores();
    initDisciplinas();
    initTurmas();
    initSalas();
    initHorarios();
    
    // Inicializa apenas se estiver na página de impressão
    if (document.getElementById('impressao')) {
        initImpressao();
        initPrintButtons();
    }

    // ===========================================
// EXPOSIÇÃO DE FUNÇÕES PARA O ESCOPO GLOBAL (window)
// NECESSÁRIO QUANDO USANDO type="module" NOS SCRIPTS
// ===========================================

// Funções de Utilitárias e UI chamadas diretamente do HTML
window.showAlert = showAlert; // Se showAlert for chamada de onclick
window.cancelEditing = cancelEditing; // Se cancelEditing for chamada de onclick

// Funções de CRUD/Edição chamadas diretamente do HTML
window.editProfessor = editProfessor;
window.deleteProfessor = deleteProfessor;
window.editDisciplina = editDisciplina;
window.deleteDisciplina = deleteDisciplina;
window.editTurma = editTurma;
window.deleteTurma = deleteTurma;
window.editSala = editSala;
window.deleteSala = deleteSala;

// Funções de Horários chamadas diretamente do HTML
window.editHorarioSlot = editHorarioSlot;

// Funções de Geração de PDF e Impressão chamadas diretamente do HTML
// EXATAMENTE O QUE PRECISAMOS PARA printPage e closePrintPreview:
window.printPage = printPage; // Torna sua função printPage global
window.closePrintPreview = closePrintPreview; // Torna sua função closePrintPreview global

// Estas também são chamadas do HTML, então precisam ser globais:
window.gerarHorarioTurmaPDF = gerarHorarioTurmaPDF;
window.gerarHorarioProfessorPDF = gerarHorarioProfessorPDF;
window.gerarListaDisciplinasPDF = gerarListaDisciplinasPDF;
// A função gerarPDF em si é chamada pelas suas funções gerarHorarioTurmaPDF, etc.
// Se ela também for chamada diretamente de algum onclick no HTML, adicione:
// window.gerarPDF = gerarPDF;

    
    initFirebaseListeners();
    console.log('Sistema inicializado!');
});



