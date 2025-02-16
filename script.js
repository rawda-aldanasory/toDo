let todoList = [];
let currentTodoId = null;

// DOM elements
const todoForm = document.getElementById("todoForm");
const submitBtn = todoForm.querySelector('button[type="submit"]');
const taskInput = document.getElementById("taskInput");
const taskDate = document.getElementById("taskDate");
const taskComplete = document.getElementById("taskComplete");
const searchInput = document.getElementById("searchInput");
const taskImage = document.getElementById("taskImage");
const imagePreview = document.getElementById("imagePreview");
const currentTasks = document.getElementById('currentTasks');
const completedTasks = document.getElementById('completedTasks');
const currentTasksCount = document.getElementById('currentTasksCount');
const completedTasksCount = document.getElementById('completedTasksCount');

// Handle image input change
taskImage.addEventListener("change", function(e) {
    const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = "block";
        reader.readAsDataURL(file);
    }
});

// Handle form submission
todoForm.addEventListener("submit", function(e) {
    e.preventDefault();

    const taskData = {
        title: taskInput.value.trim(),
        date: taskDate.value.trim(),
        completed: taskComplete.checked,
        priority: document.getElementById("taskPriority").value,
        category: document.getElementById("taskCategory").value,
        description: document.getElementById("taskDescription").value.trim(),
        imageData: imagePreview.style.display === "block" ? imagePreview.src : null
    };

    try {
        currentTodoId ? 
            updateTask(taskData) : 
            addTask(taskData);
        
        saveTodoList();
        resetForm();
    } catch (error) {
        console.error("Error saving task:", error);
    }
});

// Add a new task
function addTask(taskData) {
    const newTask = {
        id: Date.now(),
        ...taskData,
        createdAt: new Date().toISOString()
    };
    todoList.push(newTask);
    renderTodos();
}

// Update an existing task
function updateTask(taskData) {
    todoList = todoList.map(todo => 
        todo.id === currentTodoId ? 
        { ...todo, ...taskData, imageData: taskData.imageData || todo.imageData } : 
        todo
    );
    currentTodoId = null;
    renderTodos();
}

// Render todos with proper counts
function renderTodos(filteredTasks = todoList) {
    const fragments = {
        current: document.createDocumentFragment(),
        completed: document.createDocumentFragment()
    };
    
    let counts = { current: 0, completed: 0 };
    
    // Clear existing content
    currentTasks.innerHTML = '';
    completedTasks.innerHTML = '';

    filteredTasks.forEach(todo => {
        const taskElement = createTaskElement(todo);
        const target = todo.completed ? 'completed' : 'current';
        fragments[target].appendChild(taskElement);
        counts[target]++;
    });

    // empty state messages
    if (counts.current === 0) {
        fragments.current.appendChild(createEmptyMessage('No current tasks'));
    }
    if (counts.completed === 0) {
        fragments.completed.appendChild(createEmptyMessage('No completed tasks'));
    }

    // Update DOM
    currentTasks.appendChild(fragments.current);
    completedTasks.appendChild(fragments.completed);
    
    // Update counts
    currentTasksCount.textContent = counts.current;
    completedTasksCount.textContent = counts.completed;
}

// Create task element
function createTaskElement(todo) {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex flex-column';
    
    const taskContent = document.createElement('div');
    taskContent.className = 'd-flex justify-content-between align-items-start w-100 mb-2';
    
    // Task info 
    const taskInfo = document.createElement('div');
    taskInfo.className = 'task-info';
    taskInfo.innerHTML = `
        <div class="d-flex align-items-center gap-2">
            <span class="task-name ${todo.completed ? 'text-decoration-line-through' : ''}">${escapeHtml(todo.title)}</span>
            <span class="badge ${getPriorityBadgeClass(todo.priority)}">${todo.priority}</span>
            <span class="badge bg-info">${todo.category}</span>
        </div>
        ${todo.description ? `<p class="text-muted small mb-1">${escapeHtml(todo.description)}</p>` : ''}
        <div class="text-muted small">
            <i class="bi bi-calendar"></i> ${todo.date}
            ${isTaskOverdue(todo.date) ? '<span class="text-danger ms-2">Overdue!</span>' : ''}
        </div>
    `;

    // Toggle
    const actions = document.createElement('div');
    actions.className = 'btn-group';
    
    const toggleBtn = createButton(
        todo.completed ? 'Undo' : 'Done',
        todo.completed ? 'warning' : 'success',
        () => toggleComplete(todo.id)
    );
    
    const editBtn = createButton('Edit', 'warning', () => editTask(todo));
    editBtn.disabled = todo.completed;
    
    const deleteBtn = createButton('Delete', 'danger', () => deleteTask(todo.id));

    actions.append(toggleBtn, editBtn, deleteBtn);
    taskContent.append(taskInfo, actions);
    li.appendChild(taskContent);

    // Add image 
    if (todo.imageData) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'task-image-container mb-2';
        imgContainer.innerHTML = `
            <img src="${todo.imageData}" class="task-image img-thumbnail" style="max-height: 150px;" alt="Task attachment">
        `;
        li.appendChild(imgContainer);
    }

    return li;
}

// Helper functions
function createButton(text, variant, onClick) {
    const button = document.createElement('button');
    button.className = `btn btn-${variant} btn-sm`;
    button.textContent = text;
    button.addEventListener('click', onClick);
    return button;
}

function createEmptyMessage(message) {
    const li = document.createElement('li');
    li.className = 'list-group-item text-center text-muted py-3';
    li.textContent = message;
    return li;
}

function getPriorityBadgeClass(priority) {
    const classes = {
        high: 'bg-danger',
        medium: 'bg-warning',
        low: 'bg-success'
    };
    return classes[priority.toLowerCase()] || 'bg-secondary';
}

function isTaskOverdue(date) {
    return date && new Date(date) < new Date().setHours(0, 0, 0, 0);
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// CRUD Operations
function deleteTask(id) {
        todoList = todoList.filter(todo => todo.id !== id);
        if (currentTodoId === id) currentTodoId = null;
        saveTodoList();
        renderTodos();
}

function toggleComplete(id) {
    todoList = todoList.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodoList();
    renderTodos();
}

function editTask(todo) {
    currentTodoId = todo.id;
    taskInput.value = todo.title;
    taskDate.value = todo.date;
    taskComplete.checked = todo.completed;
    document.getElementById("taskPriority").value = todo.priority;
    document.getElementById("taskCategory").value = todo.category;
    document.getElementById("taskDescription").value = todo.description;
    
    if (todo.imageData) {
        imagePreview.src = todo.imageData;
        imagePreview.style.display = "block";
    } else {
        imagePreview.src = "";
        imagePreview.style.display = "none";
    }

    submitBtn.textContent = "Update Task";
    taskInput.focus();
}

// Search functionality
searchInput.addEventListener("input", debounce((e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredTasks = todoList.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm) ||
        task.category.toLowerCase().includes(searchTerm)
    );
    renderTodos(filteredTasks);
}, 300));

// Utility functions
function resetForm() {
    todoForm.reset();
    imagePreview.src = "";
    imagePreview.style.display = "none";
    currentTodoId = null;
    submitBtn.textContent = "Add Task";
}

function saveTodoList() {
    try {
        localStorage.setItem("todoList", JSON.stringify(todoList));
    } catch (error) {
        console.error("Error saving to localStorage:", error);
        // alert("There was an error saving your tasks. Please ensure you have enough storage space.");
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize app
function loadTodos() {
    try {
        const storedTodos = localStorage.getItem("todoList");
        if (storedTodos) {
            todoList = JSON.parse(storedTodos);
        }
    } catch (error) {
        console.error("Error loading todos:", error);
        todoList = [];
    }
    renderTodos();
}

// Start the application
loadTodos();