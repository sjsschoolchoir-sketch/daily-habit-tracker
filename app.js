const defaultTasks = ["Wake up in the morning", "Freshen up", "Have a healthy breakfast", "Go to work", "Drink enough water", "Have meals on time", "Wind down for tomorrow"];
const key = "my-daily-flow-data-v1";
const todayKey = () => new Date().toLocaleDateString("en-CA");
const dateFor = offset => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toLocaleDateString("en-CA"); };
let data = JSON.parse(localStorage.getItem(key) || '{"tasks":[],"days":{}}');
if (!data.tasks.length) data.tasks = defaultTasks.map((text, id) => ({ id: `task-${id}`, text }));
if (!data.days[todayKey()]) data.days[todayKey()] = [];
const save = () => localStorage.setItem(key, JSON.stringify(data));

const taskList = document.querySelector("#task-list");
const progressFill = document.querySelector("#progress-fill");
const progressCopy = document.querySelector("#progress-copy");
const percentage = document.querySelector("#percentage");
function completed() { return data.days[todayKey()] || []; }
function render() {
  const done = completed(); const total = data.tasks.length; const count = done.length;
  taskList.innerHTML = "";
  data.tasks.forEach(task => {
    const isDone = done.includes(task.id); const button = document.createElement("button");
    button.className = `task ${isDone ? "done" : ""}`; button.type = "button";
    button.innerHTML = `<span class="check">${isDone ? "✓" : ""}</span><span class="task-text"></span><span class="delete" title="Remove task" aria-label="Remove ${task.text}">×</span>`;
    button.querySelector(".task-text").textContent = task.text;
    button.addEventListener("click", e => { if (e.target.classList.contains("delete")) { data.tasks = data.tasks.filter(x => x.id !== task.id); data.days[todayKey()] = done.filter(id => id !== task.id); save(); render(); return; } data.days[todayKey()] = isDone ? done.filter(id => id !== task.id) : [...done, task.id]; save(); render(); });
    taskList.append(button);
  });
  const percent = total ? Math.round(count / total * 100) : 0;
  progressCopy.textContent = `${count} of ${total} complete`; percentage.textContent = `${percent}%`; progressFill.style.width = `${percent}%`;
  document.querySelector("#encouragement").textContent = percent === 100 ? "Wonderful — you completed your full routine!" : count ? "Lovely progress. Keep going at your own pace." : "One good check-in at a time.";
}
const now = new Date(); document.querySelector("#weekday").textContent = now.toLocaleDateString("en-US", { weekday:"long" }); document.querySelector("#full-date").textContent = now.toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" });
const yesterday = data.days[dateFor(-1)]; document.querySelector("#yesterday-text").textContent = yesterday ? `You completed ${yesterday.length} of ${data.tasks.length} tasks.` : "Your first day starts today.";
document.querySelector("#add-task-btn").onclick = () => { const f = document.querySelector("#add-task-form"); f.hidden = !f.hidden; if (!f.hidden) document.querySelector("#new-task").focus(); };
document.querySelector("#add-task-form").onsubmit = e => { e.preventDefault(); const input = document.querySelector("#new-task"); const text = input.value.trim(); if (!text) return; data.tasks.push({ id: `task-${Date.now()}`, text }); input.value = ""; save(); render(); };
save(); render();
