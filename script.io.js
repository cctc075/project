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

/* --- Task Management & Kanban (Updated with Category, Priority & Due Date) --- */
function getTasks() {
  const defaultTasks = [
    { id: 1, title: "ออกแบบ UI แดชบอร์ด", desc: "จัดทำดีไซน์ Glassmorphism สวยหรู", status: "todo", category: "frontend", priority: "high", dueDate: "2026-06-15" },
    { id: 2, title: "พัฒนาระบบ Drag & Drop", desc: "เชื่อมโยงข้อมูลคอลัมน์ Kanban", status: "doing", category: "backend", priority: "medium", dueDate: "2026-06-20" },
    { id: 3, title: "ทดสอบการใช้งาน Dark Mode", desc: "ตรวจสอบความถูกต้องของ CSS Variables", status: "done", category: "testing", priority: "normal", dueDate: "2026-06-10" }
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
  const today = new Date().toISOString().split("T")[0]; // วันที่ปัจจุบัน (พ.ศ. 2569 / ค.ศ. 2026)

  tasks.forEach(task => {
    counts[task.status]++;
    const card = document.createElement("div");
    card.className = "task-card";
    card.draggable = true;
    card.dataset.id = task.id;

    // ระบบเช็กวันกำหนดส่ง (Due Date Alert)
    let dueDateAlert = "";
    if (task.dueDate && task.status !== "done") {
      if (task.dueDate < today) {
        dueDateAlert = `<span class="badge" style="background: #fee2e2; color: #dc2626; border: 1px solid #f87171;">⚠️ เลยกำหนด!</span>`;
        card.style.borderColor = "#dc2626"; // เน้นขอบการ์ดสีแดง
      } else {
        // คำนวณระยะห่างวัน (ใกล้ถึงกำหนดภายใน 2 วัน)
        const diffTime = new Date(task.dueDate) - new Date(today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 2 && diffDays >= 0) {
          dueDateAlert = `<span class="badge" style="background: #fef3c7; color: #d97706; border: 1px solid #fbbf24;">⏰ ใกล้หมดเขต</span>`;
          card.style.borderColor = "#d97706"; // เน้นขอบการ์ดสีส้ม
        }
      }
    }

    let priorityBadge = "";
    if (task.priority === "high") priorityBadge = `<span class="badge" style="background: #fee2e2; color: #dc2626; margin-left: 6px;">ด่วน 🔥</span>`;
    else if (task.priority === "medium") priorityBadge = `<span class="badge" style="background: #fef3c7; color: #d97706; margin-left: 6px;">ปานกลาง</span>`;

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
        <span class="badge" style="background: var(--primary-light); color: var(--primary); font-size: 11px;">${getCategoryText(task.category)}</span>
        <div style="display: flex; gap: 4px;">${dueDateAlert} ${priorityBadge}</div>
      </div>
      <h5>${task.title}</h5>
      <p>${task.desc}</p>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted); margin-top: 10px; padding-top: 8px; border-top: 1px dashed var(--border-color);">
        <span><i class="far fa-calendar-alt"></i> ${task.dueDate || 'ไม่ระบุ'}</span>
        <span class="badge badge-${task.status}">${getStatusText(task.status)}</span>
      </div>
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

function getCategoryText(cat) {
  const map = { frontend: "Frontend UI", backend: "Backend & DB", document: "เอกสารโครงงาน", testing: "ทดสอบระบบ" };
  return map[cat] || "ทั่วไป";
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
  const category = document.getElementById("taskCategory").value;
  const priority = document.getElementById("taskPriority").value;
  const dueDate = document.getElementById("taskDueDate").value;
  const status = document.getElementById("taskStatus").value;

  let tasks = getTasks();
  const newTask = { id: Date.now(), title, desc, category, priority, dueDate, status };
  tasks.push(newTask);
  saveTasks(tasks);
  closeTaskModal();
  document.getElementById("taskForm").reset();
}

/* --- Web Speech API (สั่งงานด้วยเสียงภาษาไทยแบบไร้รอยต่อ) --- */
function startVoiceCommand() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("เบราว์เซอร์ของคุณไม่รองรับการสั่งงานด้วยเสียง (แนะนำให้ใช้ Google Chrome)");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "th-TH";
  recognition.interimResults = false;

  const micBtn = document.querySelector("button[title='สั่งงานด้วยเสียงภาษาไทย']");

  recognition.onstart = () => {
    if (micBtn) {
      micBtn.style.background = "var(--danger)";
      micBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }
  };

  recognition.onresult = (event) => {
    const speechText = event.results[0][0].transcript;
    document.getElementById("taskTitle").value = speechText;
    document.getElementById("taskDesc").value = "เพิ่มอัตโนมัติด้วยเสียงพูดภาษาไทย";
  };

  recognition.onerror = () => {
    console.warn("Speech recognition error");
  };

  recognition.onsend = recognition.onend = () => {
    if (micBtn) {
      micBtn.style.background = "";
      micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    }
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