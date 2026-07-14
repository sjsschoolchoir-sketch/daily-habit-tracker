import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const defaults = ["Wake up in the morning", "Freshen up", "Have a healthy breakfast", "Go to work", "Drink enough water", "Have meals on time", "Wind down for tomorrow"];
const localKey = "my-daily-flow-data-v1";
const dayKey = () => new Date().toLocaleDateString("en-CA");
const yesterdayKey = () => { const date = new Date(); date.setDate(date.getDate() - 1); return date.toLocaleDateString("en-CA"); };
const newData = () => ({ tasks: defaults.map((text, index) => ({ id: "task-" + index, text })), days: {} });
const configured = Object.values(firebaseConfig).every(Boolean);
let data = newData(), user, auth, db, authMode = "signin";
const qs = selector => document.querySelector(selector);
const saveLocal = () => localStorage.setItem(localKey, JSON.stringify(data));
const doneToday = () => data.days[dayKey()] || [];

function render() {
  const done = doneToday(), total = data.tasks.length, count = done.length;
  qs("#task-list").innerHTML = "";
  data.tasks.forEach(task => {
    const complete = done.includes(task.id), button = document.createElement("button");
    button.className = "task" + (complete ? " done" : ""); button.type = "button";
    button.innerHTML = '<span class="check">' + (complete ? "✓" : "") + '</span><span class="task-text"></span><span class="delete" title="Remove task" aria-label="Remove task">×</span>';
    button.querySelector(".task-text").textContent = task.text;
    button.onclick = async event => {
      if (event.target.classList.contains("delete")) {
        data.tasks = data.tasks.filter(item => item.id !== task.id);
        data.days[dayKey()] = done.filter(id => id !== task.id);
      } else data.days[dayKey()] = complete ? done.filter(id => id !== task.id) : done.concat(task.id);
      render(); await saveCloud();
    };
    qs("#task-list").append(button);
  });
  const percent = total ? Math.round(count * 100 / total) : 0;
  qs("#progress-copy").textContent = count + " of " + total + " complete";
  qs("#percentage").textContent = percent + "%"; qs("#progress-fill").style.width = percent + "%";
  qs("#encouragement").textContent = percent === 100 ? "Wonderful — you completed your full routine!" : count ? "Lovely progress. Keep going at your own pace." : "One good check-in at a time.";
  const previous = data.days[yesterdayKey()];
  qs("#yesterday-text").textContent = previous ? "You completed " + previous.length + " of " + total + " tasks." : "Your first day starts today.";
}
async function saveCloud() {
  if (!user) return;
  saveLocal();
  await setDoc(doc(db, "users", user.uid), { tasks: data.tasks, days: data.days, updatedAt: new Date().toISOString() });
}
async function loadCloud() {
  const saved = await getDoc(doc(db, "users", user.uid));
  const local = JSON.parse(localStorage.getItem(localKey) || "null");
  if (saved.exists()) data = saved.data();
  else if (local && local.tasks) { data = local; await saveCloud(); }
  else { data = newData(); await saveCloud(); }
  if (!data.days) data.days = {};
  if (!data.days[dayKey()]) data.days[dayKey()] = [];
  saveLocal();
}
function setAuthMode(mode) {
  authMode = mode;
  qs("#auth-submit").textContent = mode === "signin" ? "Sign in" : "Create account";
  qs("#toggle-auth-mode").textContent = mode === "signin" ? "Create an account" : "Sign in instead";
  qs(".auth-switch").firstChild.textContent = mode === "signin" ? "New here? " : "Already have an account? ";
  qs("#auth-message").textContent = "";
}
function authError(error) {
  const known = { "auth/invalid-credential": "That email or password is not correct.", "auth/email-already-in-use": "An account already uses this email. Try signing in.", "auth/weak-password": "Please use a password with at least 6 characters." };
  return known[error.code] || "Something went wrong. Please try again.";
}
const now = new Date();
qs("#weekday").textContent = now.toLocaleDateString("en-US", { weekday: "long" });
qs("#full-date").textContent = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
qs("#add-task-btn").onclick = () => { const form = qs("#add-task-form"); form.hidden = !form.hidden; if (!form.hidden) qs("#new-task").focus(); };
qs("#add-task-form").onsubmit = async event => { event.preventDefault(); const input = qs("#new-task"), text = input.value.trim(); if (!text) return; data.tasks.push({ id: "task-" + Date.now(), text }); input.value = ""; render(); await saveCloud(); };
qs("#toggle-auth-mode").onclick = () => setAuthMode(authMode === "signin" ? "signup" : "signin");
qs("#auth-form").onsubmit = async event => {
  event.preventDefault(); qs("#auth-message").textContent = "";
  const email = qs("#email").value.trim(), password = qs("#password").value;
  try { if (authMode === "signin") await signInWithEmailAndPassword(auth, email, password); else await createUserWithEmailAndPassword(auth, email, password); }
  catch (error) { qs("#auth-message").textContent = authError(error); }
};
qs("#sign-out-btn").onclick = () => signOut(auth);
if (!configured) {
  qs("#auth-message").textContent = "Setup needed: add your Firebase settings in firebase-config.js, then upload it to GitHub.";
  qs("#auth-submit").disabled = true; qs("#toggle-auth-mode").hidden = true;
} else {
  const app = initializeApp(firebaseConfig); auth = getAuth(app); db = getFirestore(app);
  onAuthStateChanged(auth, async currentUser => {
    user = currentUser;
    if (!user) { qs("#auth-screen").hidden = false; return; }
    try { await loadCloud(); qs("#account-email").textContent = user.email; render(); qs("#auth-screen").hidden = true; }
    catch (error) { qs("#auth-message").textContent = "Could not load saved tasks. Check Firebase setup and Firestore rules."; }
  });
}
