const defaultTasks = ["Wake up in the morning", "Freshen up", "Have a healthy breakfast", "Go to work", "Drink enough water", "Have meals on time", "Wind down for tomorrow"];
const storageKey = "my-daily-flow-data-v1";
const todayKey = () => new Date().toLocaleDateString("en-CA");
const yesterdayKey = () => { const date = new Date(); date.setDate(date.getDate() - 1); return date.toLocaleDateString("en-CA"); };
const emptyData = () => ({ tasks: defaultTasks.map((text, index) => ({ id: "task-" + index, text })), days: {} });
let data = JSON.parse(localStorage.getItem(storageKey) || "null") || emptyData();
if (!data.tasks || !data.tasks.length) data.tasks = emptyData().tasks;
if (!data.days) data.days = {};
if (!data.days[todayKey()]) data.days[todayKey()] = [];

const select = selector => document.querySelector(selector);
const save = () => localStorage.setItem(storageKey, JSON.stringify(data));
const completed = () => data.days[todayKey()] || [];
function render() {
  const done = completed(), total = data.tasks.length, count = done.length;
  select("#task-list").innerHTML = "";
  data.tasks.forEach(task => {
    const isDone = done.includes(task.id), button = document.createElement("button");
    button.className = "task" + (isDone ? " done" : ""); button.type = "button";
    button.innerHTML = '<span class="check">' + (isDone ? "✓" : "") + '</span><span class="task-text"></span><span class="delete" title="Remove task" aria-label="Remove task">×</span>';
    button.querySelector(".task-text").textContent = task.text;
    button.onclick = event => {
      if (event.target.classList.contains("delete")) {
        data.tasks = data.tasks.filter(item => item.id !== task.id);
        data.days[todayKey()] = done.filter(id => id !== task.id);
      } else data.days[todayKey()] = isDone ? done.filter(id => id !== task.id) : done.concat(task.id);
      save(); render();
    };
    select("#task-list").append(button);
  });
  const percent = total ? Math.round(count * 100 / total) : 0;
  select("#progress-copy").textContent = count + " of " + total + " complete";
  select("#percentage").textContent = percent + "%";
  select("#progress-fill").style.width = percent + "%";
  select("#encouragement").textContent = percent === 100 ? "Wonderful — you completed your full routine!" : count ? "Lovely progress. Keep going at your own pace." : "One good check-in at a time.";
  const yesterday = data.days[yesterdayKey()];
  select("#yesterday-text").textContent = yesterday ? "You completed " + yesterday.length + " of " + total + " tasks." : "Your first day starts today.";
}
const now = new Date();
select("#weekday").textContent = now.toLocaleDateString("en-US", { weekday: "long" });
select("#full-date").textContent = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
select("#add-task-btn").onclick = () => {
  const form = select("#add-task-form"); form.hidden = !form.hidden;
  if (!form.hidden) select("#new-task").focus();
};
select("#add-task-form").onsubmit = event => {
  event.preventDefault();
  const input = select("#new-task"), text = input.value.trim();
  if (!text) return;
  data.tasks.push({ id: "task-" + Date.now(), text });
  input.value = ""; save(); render();
};
save(); render();
