// ---------- helpers ----------
const $ = (sel) => document.querySelector(sel);

function showScreen(id){
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $(`#${id}`).classList.add("active");
}

function saveState(state){
  localStorage.setItem("clarity_state", JSON.stringify(state));
}

function loadState(){
  const raw = localStorage.getItem("clarity_state");
  return raw ? JSON.parse(raw) : null;
}

function clearState(){
  localStorage.removeItem("clarity_state");
}

// ---------- state ----------
let state = {
  modeId: null,
  step: 0,
  answers: []
};

// ---------- DOM refs ----------
const modesGrid = $("#modes-grid");

const questionEl = $("#question");
const answerEl = $("#answer");
const progressEl = $("#progress");

const btnBackHome = $("#btn-back-home");
const btnSkip = $("#btn-skip");
const btnNext = $("#btn-next");

const summaryEl = $("#result-summary");
const insightEl = $("#result-insight");
const actionEl = $("#result-action");

const btnRestart = $("#btn-restart");
const btnCopy = $("#btn-copy");

// ---------- render home ----------
function renderModes(){
  modesGrid.innerHTML = "";

  MODES.forEach(mode => {
    const card = document.createElement("button");
    card.className = "card";
    card.type = "button";
    card.innerHTML = `
      <h3>${mode.title}</h3>
      <p>${mode.desc}</p>
    `;

    card.addEventListener("click", () => startMode(mode.id));
    modesGrid.appendChild(card);
  });
}

// ---------- flow ----------
function getCurrentMode(){
  return MODES.find(m => m.id === state.modeId);
}

function startMode(modeId){
  state.modeId = modeId;
  state.step = 0;
  state.answers = [];
  saveState(state);
  renderStep();
  showScreen("screen-flow");
}

function renderStep(){
  const mode = getCurrentMode();
  const total = mode.questions.length;

  questionEl.textContent = mode.questions[state.step];
  progressEl.textContent = `Pregunta ${state.step + 1} de ${total}`;

  answerEl.value = state.answers[state.step] ?? "";
  answerEl.focus();
}

function goNext(){
  const mode = getCurrentMode();
  const total = mode.questions.length;

  // save current answer
  state.answers[state.step] = answerEl.value.trim();
  saveState(state);

  if(state.step < total - 1){
    state.step += 1;
    saveState(state);
    renderStep();
  } else {
    buildResult();
    showScreen("screen-result");
  }
}

function skip(){
  answerEl.value = "";
  goNext();
}

// ---------- result (simple rule-based) ----------
function buildResult(){
  const mode = getCurrentMode();
  const filled = state.answers.filter(a => a && a.length > 0);

  // resumen simple: 2-3 frases a partir de respuestas no vacías
  const summary = filled.length
    ? filled.slice(0, 3).map(s => `• ${s}`).join("\n")
    : "No escribiste respuestas, pero ya es claridad: hoy era día de respirar.";

  // insight por modo (reglas simples)
  let insight = "";
  let action = "";

  if(mode.id === "ideas"){
    insight = "Tu mente está en modo fuegos artificiales. La claridad aparece cuando eliges un solo hilo y lo tiras suave.";
    action = "Elige 1 idea y dedica 10 minutos a escribir: objetivo, público y primer paso. Solo 10.";
  }

  if(mode.id === "bloqueo"){
    insight = "El bloqueo muchas veces es una señal: estás pidiendo menos presión o más sentido.";
    action = "Baja el listón a versión beta: haz 5 minutos. Si quieres seguir, sigues. Si no, también cuenta.";
  }

  if(mode.id === "decision"){
    insight = "Tu respuesta suele estar escondida en la sensación del ‘después’, no en el debate infinito del ‘y si…’.";
    action = "Escribe una frase: ‘Durante 7 días voy a probar A/B y mediré cómo me siento cada noche.’";
  }

  if(mode.id === "saturacion"){
    insight = "Estás cargando demasiado a la vez. La claridad no llega con más fuerza, llega con menos peso.";
    action = "Haz una mini-limpieza mental: escribe 5 cosas que puedes pausar 48h. Pausa 1 ahora mismo.";
  }

  summaryEl.textContent = summary;
  insightEl.textContent = insight;
  actionEl.textContent = action;
}

// ---------- events ----------
btnNext.addEventListener("click", goNext);
btnSkip.addEventListener("click", skip);

btnBackHome.addEventListener("click", () => {
  showScreen("screen-home");
});

btnRestart.addEventListener("click", () => {
  clearState();
  state = { modeId:null, step:0, answers:[] };
  showScreen("screen-home");
});

btnCopy.addEventListener("click", async () => {
  const text =
`CLARITY
Resumen:
${summaryEl.textContent}

Insight:
${insightEl.textContent}

Acción pequeña:
${actionEl.textContent}`;

  try{
    await navigator.clipboard.writeText(text);
    btnCopy.textContent = "Copiado ✓";
    setTimeout(() => btnCopy.textContent = "Copiar resultado", 1200);
  }catch(e){
    alert("No se pudo copiar. Selecciona el texto manualmente.");
  }
});

// Enter = siguiente (con Ctrl/⌘ para salto de línea)
answerEl.addEventListener("keydown", (e) => {
  if(e.key === "Enter" && (e.ctrlKey || e.metaKey)){
    // salto de línea
    return;
  }
  if(e.key === "Enter"){
    e.preventDefault();
    goNext();
  }
});

// ---------- init ----------
renderModes();

const saved = loadState();
if(saved && saved.modeId){
  state = saved;
  renderStep();
  showScreen("screen-flow");
} else {
  showScreen("screen-home");
}
