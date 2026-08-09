document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  setupAuthListeners();
  checkCurrentPage();
});

/* --- Theme Management --- */
function initTheme() {
  const savedTheme = localStorage.getItem("taskflow_theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("taskflow_theme", newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const btns = document.querySelectorAll("#themeToggleBtn");
  btns.forEach(btn => {
    btn.innerHTML = theme === "dark" ? '<i class="fas fa-sun" style="color: #f59e0b;"></i>' : '<i class="fas fa-moon"></i>';
  });
}

/* --- Mobile Drawer --- */
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("sidebarBackdrop");
  if (sidebar && backdrop) {
    sidebar.classList.toggle("active");
    backdrop.classList.toggle("active");
  }
}

/* --- Authentication System --- */
function setupAuthListeners() {
  const defaultUsers = [
    { username: "admin", password: "1234", name: "ผู้ดูแลระบบ", role: "admin" },
    { username: "std69319010014", password: "1234", name: "พีรพล รัชนี", role: "student" }
  ];

  if (!localStorage.getItem("taskflow_users")) {
    localStorage.setItem("taskflow_users", JSON.stringify(defaultUsers));
  }

  // Register Form
  const regForm = document.getElementById("registerForm");
  if (regForm) {
    regForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fname = document.getElementById("regFname").value.trim();
      const lname = document.getElementById("regLname").value.trim();
      const username = document.getElementById("regUsername").value.trim();
      const password = document.getElementById("regPassword").value;

      let users = JSON.parse(localStorage.getItem("taskflow_users"));
      if (users.some(u => u.username === username)) {
        alert("Username นี้ถูกใช้งานแล้วในระบบ!");
        return;
      }

      users.push({ username, password, name: `${fname} ${lname}`, role: "student" });
      localStorage.setItem("taskflow_users", JSON.stringify(users));
      alert("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
      window.location.href = "index.html";
    });
  }

  // Login Form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("loginUsername").value.trim();
      const password = document.getElementById("loginPassword").value;

      let users = JSON.parse(localStorage.getItem("taskflow_users"));
      const user = users.find(u => u.username === username && u.password === password);

      if (user) {
        localStorage.setItem("taskflow_current_user", JSON.stringify(user));
        if (user.role === "admin") {
          window.location.href = "admin-dashboard.html";
        } else {
          window.location.href = "student-dashboard.html";
        }
      } else {
        alert("Username หรือ Password ไม่ถูกต้อง!");
      }
    });
  }
}

function checkCurrentPage() {
  const currentUser = JSON.parse(localStorage.getItem("taskflow_current_user"));
  const profileEl = document.getElementById("userProfileName");
  if (profileEl && currentUser) {
    profileEl.textContent = currentUser.name;
  }

  if (document.getElementById("kanbanBoard")) {
    loadTasks();
    initDragAndDrop();
  }

  if (document.getElementById("adminUserTable")) {
    loadAdminData();
  }
}

function logout() {
  localStorage.removeItem("taskflow_current_user");
  window.location.href = "index.html";
}

/* --- Task Management & Kanban --- */
function getTasks() {
  const defaultTasks = [
    { id: 1, title: "ออกแบบ UI แดชบอร์ด", desc: "จัดทำดีไซน์ Glassmorphism สวยหรู", status: "todo" },
    { id: 2, title: "พัฒนาระบบ Drag & Drop", desc: "เชื่อมโยงข้อมูลคอลัมน์ Kanban", status: "doing" },
    { id: 3, title: "ทดสอบการใช้งาน Dark Mode", desc: "ตรวจสอบความถูกต้องของ CSS Variables", status: "done" }
  ];
  let tasks = JSON.parse(localStorage.getItem("taskflow_tasks"));
  if (!tasks) {
    tasks = defaultTasks;
    localStorage.setItem("taskflow_tasks", JSON.stringify(tasks));
  }
  return tasks;
}

function saveTasks(tasks) {
  localStorage.setItem("taskflow_tasks", JSON.stringify(tasks));
  loadTasks();
}

function loadTasks() {
  const tasks = getTasks();
  const todoCol = document.getElementById("colTodo");
  const doingCol = document.getElementById("colDoing");
  const doneCol = document.getElementById("colDone");

  if (!todoCol || !doingCol || !doneCol) return;

  todoCol.innerHTML = "";
  doingCol.innerHTML = "";
  doneCol.innerHTML = "";

  let counts = { todo: 0, doing: 0, done: 0, total: tasks.length };

  tasks.forEach(task => {
    counts[task.status]++;
    const card = document.createElement("div");
    card.className = "task-card";
    card.draggable = true;
    card.dataset.id = task.id;
    card.innerHTML = `
      <h5>${task.title}</h5>
      <p>${task.desc}</p>
      <span class="badge badge-${task.status}">${getStatusText(task.status)}</span>
    `;
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", task.id);
    });

    if (task.status === "todo") todoCol.appendChild(card);
    else if (task.status === "doing") doingCol.appendChild(card);
    else if (task.status === "done") doneCol.appendChild(card);
  });

  if (document.getElementById("statTotal")) document.getElementById("statTotal").textContent = counts.total;
  if (document.getElementById("statTodo")) document.getElementById("statTodo").textContent = counts.todo;
  if (document.getElementById("statDoing")) document.getElementById("statDoing").textContent = counts.doing;
  if (document.getElementById("statDone")) document.getElementById("statDone").textContent = counts.done;
}

function getStatusText(status) {
  if (status === "todo") return "รอดำเนินการ";
  if (status === "doing") return "กำลังทำ";
  return "เสร็จสิ้น";
}

function initDragAndDrop() {
  const cols = document.querySelectorAll(".kanban-dropzone");
  cols.forEach(col => {
    col.addEventListener("dragover", (e) => e.preventDefault());
    col.addEventListener("drop", (e) => {
      e.preventDefault();
      const taskId = parseInt(e.dataTransfer.getData("text/plain"));
      const newStatus = col.dataset.status;
      
      let tasks = getTasks();
      tasks = tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
      saveTasks(tasks);
    });
  });
}

function openTaskModal() {
  document.getElementById("taskModal").classList.add("active");
}

function closeTaskModal() {
  document.getElementById("taskModal").classList.remove("active");
}

function handleAddTask(e) {
  e.preventDefault();
  const title = document.getElementById("taskTitle").value.trim();
  const desc = document.getElementById("taskDesc").value.trim();
  const status = document.getElementById("taskStatus").value;

  let tasks = getTasks();
  const newTask = { id: Date.now(), title, desc, status };
  tasks.push(newTask);
  saveTasks(tasks);
  closeTaskModal();
  document.getElementById("taskForm").reset();
}

/* --- Web Speech API (สั่งงานด้วยเสียงภาษาไทย) --- */
function startVoiceCommand() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("เบราว์เซอร์ของคุณไม่รองรับการสั่งงานด้วยเสียง (แนะนำให้ใช้ Google Chrome)");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "th-TH";
  recognition.interimResults = false;

  recognition.onstart = () => {
    alert("กำลังฟังเสียง... กรุณาพูดชื่องานของคุณครับ");
  };

  recognition.onresult = (event) => {
    const speechText = event.results[0][0].transcript;
    document.getElementById("taskTitle").value = speechText;
    document.getElementById("taskDesc").value = "เพิ่มอัตโนมัติด้วยเสียงพูดภาษาไทย";
  };

  recognition.onerror = () => {
    alert("เกิดข้อผิดพลาดในการฟังเสียง กรุณาลองใหม่อีกครั้ง");
  };

  recognition.start();
}

/* --- Admin Management --- */
function loadAdminData() {
  const users = JSON.parse(localStorage.getItem("taskflow_users")) || [];
  const tbody = document.getElementById("adminUserTable");
  if (!tbody) return;

  tbody.innerHTML = "";
  users.forEach((u, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td><strong>${u.name}</strong></td>
      <td>${u.username}</td>
      <td><span class="badge ${u.role === 'admin' ? 'badge-doing' : 'badge-done'}">${u.role.toUpperCase()}</span></td>
    `;
    tbody.appendChild(tr);
  });
}