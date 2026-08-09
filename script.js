// ข้อมูลงานเริ่มต้นของระบบ
let tasks = [
    { id: 1, title: 'ออกแบบโครงสร้างฐานข้อมูล SQL', category: 'IT Project', status: 'done' },
    { id: 2, title: 'จัดทำเอกสารนำเสนอโครงงาน', category: 'Assignment', status: 'inprogress' }
];

document.addEventListener('DOMContentLoaded', () => {
    // ตรวจสอบชื่อผู้ใช้งานจาก LocalStorage
    const currentUser = localStorage.getItem('currentUser') || 'ผู้ใช้งาน';
    const nameEl = document.getElementById('studentName');
    if (nameEl) {
        nameEl.innerText = currentUser;
    }
    renderTasks();
});

// ฟังก์ชันสลับแท็บเมนูในหน้า Dashboard ของนักศึกษา (ตัดเมนูเสียงออกเพราะรวมเข้ากับ modal แล้ว)
function switchTab(e, tabId) {
    e.preventDefault();
    document.querySelectorAll('.menu-item').forEach(el => el.classList.remove('active'));
    e.currentTarget.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
}

// เรนเดอร์ข้อมูลงานทั้งหมดลงในตารางและบอร์ด Kanban
function renderTasks() {
    const cntTotal = document.getElementById('cntTotal');
    const cntTodo = document.getElementById('cntTodo');
    const cntProgress = document.getElementById('cntProgress');
    const cntDone = document.getElementById('cntDone');

    if (cntTotal) cntTotal.innerText = tasks.length;
    if (cntTodo) cntTodo.innerText = tasks.filter(t => t.status === 'todo').length;
    if (cntProgress) cntProgress.innerText = tasks.filter(t => t.status === 'inprogress').length;
    if (cntDone) cntDone.innerText = tasks.filter(t => t.status === 'done').length;

    // เรนเดอร์ตารางสรุปงานล่าสุด
    const tableBody = document.getElementById('recentTableBody');
    if (tableBody) {
        let tableHtml = '';
        tasks.forEach(t => {
            let badgeClass = t.status;
            let statusText = t.status === 'todo' ? 'รอดำเนินการ' : t.status === 'inprogress' ? 'กำลังทำ' : 'เสร็จสิ้น';
            tableHtml += `
                <tr>
                    <td><strong>${t.title}</strong></td>
                    <td><span style="color: var(--text-muted);">${t.category}</span></td>
                    <td><span class="badge ${badgeClass}">${statusText}</span></td>
                    <td style="text-align: right;">
                        <button onclick="deleteTask(${t.id})" style="background:none; border:none; color:var(--danger); cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = tableHtml;
    }

    // เรนเดอร์บอร์ด Kanban แยกตามสถานะ
    renderKanbanCol('colTodo', 'numTodo', tasks.filter(t => t.status === 'todo'));
    renderKanbanCol('colProgress', 'numProgress', tasks.filter(t => t.status === 'inprogress'));
    renderKanbanCol('colDone', 'numDone', tasks.filter(t => t.status === 'done'));
}

function renderKanbanCol(colId, numId, list) {
    const numEl = document.getElementById(numId);
    const colEl = document.getElementById(colId);
    if (numEl) numEl.innerText = list.length;
    if (colEl) {
        let html = '';
        list.forEach(t => {
            html += `
                <div class="kanban-task-item" draggable="true" ondragstart="dragStart(event, ${t.id})">
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">${t.category}</div>
                    <div style="font-weight: 500;">${t.title}</div>
                </div>
            `;
        });
        colEl.innerHTML = html;
    }
}

// ระบบ Drag & Drop สำหรับย้ายสถานะงานใน Kanban
let draggedId = null;
function dragStart(e, id) {
    draggedId = id;
}
function allowDrop(e) {
    e.preventDefault();
}
function dropTask(e, newStatus) {
    e.preventDefault();
    if (draggedId !== null) {
        let task = tasks.find(t => t.id === draggedId);
        if (task) {
            task.status = newStatus;
            renderTasks();
        }
        draggedId = null;
    }
}

// จัดการ Modal เพิ่มงาน
function openTaskModal() {
    const modal = document.getElementById('taskModal');
    if (modal) modal.classList.add('show');
}
function closeTaskModal() {
    const modal = document.getElementById('taskModal');
    if (modal) modal.classList.remove('show');
    // รีเซ็ตข้อความเสียงใน Modal หากค้างอยู่
    const voiceBox = document.getElementById('voiceResultBox');
    if (voiceBox) voiceBox.innerHTML = 'คลิกปุ่มไมโครโฟนเพื่อพูดชื่อชิ้นงาน...';
}

function handleAddTask(e) {
    e.preventDefault();
    const titleInput = document.getElementById('inputTitle');
    const catInput = document.getElementById('inputCategory');
    
    if (titleInput && catInput) {
        const title = titleInput.value.trim();
        const category = catInput.value.trim() || 'ทั่วไป';

        if (title) {
            tasks.unshift({
                id: Date.now(),
                title: title,
                category: category,
                status: 'todo'
            });
            renderTasks();
            closeTaskModal();
            titleInput.value = '';
            catInput.value = '';
        }
    }
}

function deleteTask(id) {
    if (confirm('ต้องการลบงานนี้ใช่หรือไม่?')) {
        tasks = tasks.filter(t => t.id !== id);
        renderTasks();
    }
}

// ฟังก์ชันสั่งงานด้วยเสียงแบบทำงานร่วมกับ Modal เพิ่มงาน
let recognition = null;
function toggleSpeechRecognitionInModal() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert('เบราว์เซอร์ของคุณไม่รองรับการสั่งงานด้วยเสียง แนะนำให้ใช้งานผ่าน Google Chrome');
        return;
    }

    if (!recognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'th-TH';
        recognition.interimResults = false;

        recognition.onstart = () => {
            const resultBox = document.getElementById('voiceResultBox');
            if (resultBox) resultBox.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="color:var(--primary);"></i> กำลังฟังเสียงพูดของคุณ... กรุณาพูดชื่องาน';
        };

        recognition.onresult = (event) => {
            const speechText = event.results[0][0].transcript;
            const resultBox = document.getElementById('voiceResultBox');
            const titleInput = document.getElementById('inputTitle');
            const catInput = document.getElementById('inputCategory');

            if (titleInput) titleInput.value = speechText;

            // AI ช่วยวิเคราะห์หมวดหมู่อัตโนมัติจากเสียงพูด
            let detectedCategory = 'สั่งงานด้วยเสียง';
            if (speechText.includes('โค้ด') || speechText.includes('ระบบ') || speechText.includes('ฐานข้อมูล') || speechText.includes('เว็บ') || speechText.includes('IT')) {
                detectedCategory = 'IT Project';
            } else if (speechText.includes('การบ้าน') || speechText.includes('รายงาน') || speechText.includes('ส่งอาจารย์')) {
                detectedCategory = 'Assignment';
            }
            if (catInput) catInput.value = detectedCategory;

            if (resultBox) {
                resultBox.innerHTML = `🤖 <strong>AI วิเคราะห์สำเร็จ:</strong> "${speechText}" (หมวดหมู่: ${detectedCategory})`;
            }
        };

        recognition.onerror = () => {
            const resultBox = document.getElementById('voiceResultBox');
            if (resultBox) resultBox.innerText = 'เกิดข้อผิดพลาดในการฟังเสียง กรุณาลองใหม่อีกครั้ง';
        };
    }

    recognition.start();
}

// ฟังก์ชันออกจากระบบ
function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}