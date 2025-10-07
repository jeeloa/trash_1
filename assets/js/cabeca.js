



// Variáveis globais
let currentFilter = 'all';
let dragSrcEl = null;

// Carregar tarefas do localStorage ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    loadTasks();
    updateStats();
    
    // Adicionar tarefa ao pressionar Enter
    document.getElementById('taskInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTask();
    }
    });
    
    // Buscar tarefas
    document.getElementById('searchInput').addEventListener('input', function() {
    filterTasks();
    });
    
    // Inicializar drag and drop
    initDragAndDrop();
    
    // Carregar tema
    loadTheme();
});

// Tarefas iniciais com tema de princesa
const initialTasks = [
    "Dar nomes novos pra cada um dos ratinhos 🐭💙",
    "Escrever novas histórias sobre Maui… e revisar as partes em que ele 'exagera'",
    "Visitar a Fada Madrinha e agradecer por tudo...",
    "Escovar o cabelo até o Pascal se cansar de contar 🦎💁‍♀️",
    "Levar a Luna a passear (minha rottweiler)",
    "Revisar documentos reais sem congelar a caneta",
    "Ajudar Charlotte a escolher vestido pra mais um baile <em>'sem motivo'</em> 👗🐸",
    "Parar com o hábito de comer comidas de estranhos que batem a porta 🍎❄️"
];

function loadTasks() {
    const taskList = document.getElementById('taskList');
    const savedTasks = localStorage.getItem('princessTasks');
    
    if (savedTasks) {
    // Carregar tarefas salvas
    taskList.innerHTML = savedTasks;
    // Reaplicar eventos
    document.querySelectorAll('.task-text').forEach(el => {
        el.addEventListener('click', function() { toggleTask(this); });
    });
    document.querySelectorAll('.delete-btn').forEach(el => {
        el.addEventListener('click', function() { deleteTask(this); });
    });
    document.querySelectorAll('.edit-btn').forEach(el => {
        el.addEventListener('click', function() { editTask(this); });
    });
    document.querySelectorAll('.focus-btn').forEach(el => {
        el.addEventListener('click', function() { focusTask(this); });
    });
    } else {
    // Carregar tarefas iniciais
    initialTasks.forEach(task => {
        addTaskElement(task, false, new Date().toISOString());
    });
    saveTasks();
    }
    
    updateEmptyState();
    filterTasks();
    initDragAndDrop();
}

function addTask() {
    const input = document.getElementById('taskInput');
    const taskText = input.value.trim();

    if (taskText === "") {
    input.focus();
    return;
    }

    addTaskElement(taskText, false, new Date().toISOString());
    input.value = "";
    input.focus();
    
    saveTasks();
    updateStats();
    updateEmptyState();
    filterTasks();
    
    // Som de adição
    playSound('add');
}

function addTaskElement(taskText, completed, createdAt) {
    const taskList = document.getElementById('taskList');
    const li = document.createElement('li');
    li.setAttribute('draggable', 'true');
    li.dataset.createdAt = createdAt;
    
    const date = new Date(createdAt);
    const formattedDate = `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`;
    
    li.innerHTML = `
    <div class="task-content">
        <span class="task-text">${taskText}</span>
        <span class="task-date">Criada em: ${formattedDate}</span>
    </div>
    <div class="task-actions">
        <button class="action-btn focus-btn" aria-label="Modo foco">
        <i class="fas fa-bullseye"></i>
        </button>
        <button class="action-btn edit-btn" aria-label="Editar tarefa">
        <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn delete-btn" aria-label="Excluir tarefa">
        <i class="fas fa-trash"></i>
        </button>
    </div>
    `;
    
    if (completed) {
    li.classList.add('completed');
    }
    
    taskList.appendChild(li);
    
    // Adicionar eventos
    li.querySelector('.task-text').addEventListener('click', function() { toggleTask(this); });
    li.querySelector('.delete-btn').addEventListener('click', function() { deleteTask(this); });
    li.querySelector('.edit-btn').addEventListener('click', function() { editTask(this); });
    li.querySelector('.focus-btn').addEventListener('click', function() { focusTask(this); });
    
    // Efeito visual ao adicionar
    li.classList.add('bounce');
    setTimeout(() => li.classList.remove('bounce'), 600);
}

function toggleTask(element) {
    const li = element.closest('li');
    li.classList.toggle('completed');
    saveTasks();
    updateStats();
    filterTasks();
    
    // Som de conclusão
    if (li.classList.contains('completed')) {
    playSound('complete');
    createConfetti();
    } else {
    playSound('undo');
    }
}

function deleteTask(element) {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) {
    return;
    }
    
    const li = element.closest('li');
    li.style.opacity = '0';
    li.style.transform = 'translateX(50px)';
    
    setTimeout(() => {
    li.remove();
    saveTasks();
    updateStats();
    updateEmptyState();
    filterTasks();
    }, 300);
    
    // Som de exclusão
    playSound('delete');
}

function editTask(element) {
    const li = element.closest('li');
    const taskText = li.querySelector('.task-text');
    const currentText = taskText.textContent;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    input.classList.add('edit-input');
    
    taskText.replaceWith(input);
    input.focus();
    
    function saveEdit() {
    const newText = input.value.trim();
    if (newText !== "" && newText !== currentText) {
        const newTaskText = document.createElement('span');
        newTaskText.classList.add('task-text');
        newTaskText.textContent = newText;
        newTaskText.addEventListener('click', function() { toggleTask(this); });
        
        input.replaceWith(newTaskText);
        saveTasks();
        
        // Som de edição
        playSound('edit');
    } else {
        const oldTaskText = document.createElement('span');
        oldTaskText.classList.add('task-text');
        oldTaskText.textContent = currentText;
        oldTaskText.addEventListener('click', function() { toggleTask(this); });
        
        input.replaceWith(oldTaskText);
    }
    }
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        saveEdit();
    }
    });
}

function focusTask(element) {
    const li = element.closest('li');
    const taskText = li.querySelector('.task-text').textContent;
    
    const focusMode = document.createElement('div');
    focusMode.classList.add('focus-mode');
    focusMode.innerHTML = `
    <div class="focus-task">
        <h3>Modo Foco</h3>
        <p>${taskText}</p>
        <div class="focus-actions">
        <button onclick="completeFocusedTask(this)" class="action-btn">
            <i class="fas fa-check"></i> Concluir
        </button>
        <button onclick="closeFocusMode()" class="action-btn">
            <i class="fas fa-times"></i> Fechar
        </button>
        </div>
    </div>
    `;
    
    document.body.appendChild(focusMode);
    
    // Som de modo foco
    playSound('focus');
}

function completeFocusedTask(element) {
    const focusMode = element.closest('.focus-mode');
    const taskText = focusMode.querySelector('p').textContent;
    
    // Encontrar a tarefa correspondente e marcá-la como concluída
    document.querySelectorAll('#taskList li').forEach(li => {
    if (li.querySelector('.task-text').textContent === taskText) {
        li.classList.add('completed');
    }
    });
    
    closeFocusMode();
    saveTasks();
    updateStats();
    filterTasks();
    
    // Som de conclusão
    playSound('complete');
    createConfetti();
}

function closeFocusMode() {
    const focusMode = document.querySelector('.focus-mode');
    if (focusMode) {
    focusMode.remove();
    }
}

function setFilter(filter) {
    currentFilter = filter;
    
    // Atualizar botões ativos
    document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    filterTasks();
}

function filterTasks() {
    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const tasks = document.querySelectorAll('#taskList li');
    
    tasks.forEach(task => {
    const taskText = task.querySelector('.task-text').textContent.toLowerCase();
    const isCompleted = task.classList.contains('completed');
    const matchesSearch = taskText.includes(searchText);
    
    let shouldShow = matchesSearch;
    
    if (currentFilter === 'active') {
        shouldShow = shouldShow && !isCompleted;
    } else if (currentFilter === 'completed') {
        shouldShow = shouldShow && isCompleted;
    }
    
    task.style.display = shouldShow ? 'flex' : 'none';
    });
    
    updateEmptyState();
}

function initDragAndDrop() {
    const tasks = document.querySelectorAll('#taskList li');
    
    tasks.forEach(task => {
    task.addEventListener('dragstart', handleDragStart);
    task.addEventListener('dragover', handleDragOver);
    task.addEventListener('dragenter', handleDragEnter);
    task.addEventListener('dragleave', handleDragLeave);
    task.addEventListener('drop', handleDrop);
    task.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    dragSrcEl = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
    this.classList.add('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
    e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('over');
}

function handleDragLeave(e) {
    this.classList.remove('over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
    e.stopPropagation();
    }
    
    if (dragSrcEl !== this) {
    dragSrcEl.innerHTML = this.innerHTML;
    this.innerHTML = e.dataTransfer.getData('text/html');
    
    // Reaplicar eventos
    this.querySelector('.task-text').addEventListener('click', function() { toggleTask(this); });
    this.querySelector('.delete-btn').addEventListener('click', function() { deleteTask(this); });
    this.querySelector('.edit-btn').addEventListener('click', function() { editTask(this); });
    this.querySelector('.focus-btn').addEventListener('click', function() { focusTask(this); });
    
    dragSrcEl.querySelector('.task-text').addEventListener('click', function() { toggleTask(this); });
    dragSrcEl.querySelector('.delete-btn').addEventListener('click', function() { deleteTask(this); });
    dragSrcEl.querySelector('.edit-btn').addEventListener('click', function() { editTask(this); });
    dragSrcEl.querySelector('.focus-btn').addEventListener('click', function() { focusTask(this); });
    
    saveTasks();
    
    // Som de reorganização
    playSound('reorder');
    }
    
    return false;
}

function handleDragEnd(e) {
    document.querySelectorAll('#taskList li').forEach(task => {
    task.classList.remove('over');
    task.classList.remove('dragging');
    });
}

function exportTasks() {
    const tasks = [];
    document.querySelectorAll('#taskList li').forEach(li => {
    tasks.push({
        text: li.querySelector('.task-text').textContent,
        completed: li.classList.contains('completed'),
        createdAt: li.dataset.createdAt
    });
    });
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "tarefas_princesa.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    
    // Som de exportação
    playSound('export');
}

function importTasks() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(event) {
        try {
        const tasks = JSON.parse(event.target.result);
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = '';
        
        tasks.forEach(task => {
            addTaskElement(task.text, task.completed, task.createdAt);
        });
        
        saveTasks();
        updateStats();
        updateEmptyState();
        filterTasks();
        
        // Som de importação
        playSound('import');
        } catch (error) {
        alert("Erro ao importar tarefas. Verifique se o arquivo é válido.");
        }
    };
    
    reader.readAsText(file);
    };
    
    input.click();
}

function saveTasks() {
    const taskList = document.getElementById('taskList').innerHTML;
    localStorage.setItem('princessTasks', taskList);
}

function updateStats() {
    const totalTasks = document.querySelectorAll('#taskList li').length;
    const completedTasks = document.querySelectorAll('#taskList li.completed').length;
    
    document.getElementById('totalTasks').textContent = `Total: ${totalTasks} tarefa${totalTasks !== 1 ? 's' : ''}`;
    document.getElementById('completedTasks').textContent = `Concluídas: ${completedTasks}`;
}

function updateEmptyState() {
    const emptyState = document.getElementById('emptyState');
    const visibleTasks = document.querySelectorAll('#taskList li[style="display: flex;"]').length;
    const searchText = document.getElementById('searchInput').value;
    
    if (visibleTasks === 0 && searchText === "") {
    emptyState.classList.add('show');
    } else if (visibleTasks === 0 && searchText !== "") {
    emptyState.innerHTML = `
        <i class="fas fa-search"></i>
        <p>Nenhuma tarefa encontrada para "${searchText}"</p>
        <p>Tente alterar os termos da busca.</p>
    `;
    emptyState.classList.add('show');
    } else {
    emptyState.classList.remove('show');
    }
}

function loadTheme() {
    const isDarkMode = localStorage.getItem('princessDarkMode') === 'true';
    
    if (isDarkMode) {
    document.body.classList.add('dark-mode');
    document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    body.classList.toggle('dark-mode');
    
    if (body.classList.contains('dark-mode')) {
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    localStorage.setItem('princessDarkMode', 'true');
    } else {
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    localStorage.setItem('princessDarkMode', 'false');
    }
    
    // Som de alternância de tema
    playSound('theme');
}

function playSound(type) {
    // Em um ambiente real, você usaria arquivos de áudio
    // Aqui estamos apenas simulando com logs
    console.log(`Tocando som: ${type}`);
}

function createConfetti() {
    for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.background = getRandomColor();
    confetti.style.animation = `confetti ${Math.random() * 3 + 2}s linear forwards`;
    document.body.appendChild(confetti);
    
    setTimeout(() => {
        confetti.remove();
    }, 5000);
    }
}

function getRandomColor() {
    const colors = ['#8a2be2', '#ff69b4', '#ffd700', '#2ed573', '#ff4757', '#8ec5fc'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Adicionar evento ao botão de tema
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
