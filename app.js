(async function () {
  const data = await fetch("data.json").then(r => r.json());
  const { especies, rarezas, eras, cats } = data;
  const ERA_ICON = { "Triásico": "triasico", "Jurásico": "jurasico", "Cretácico": "cretacico", "Pleistoceno": "pleistoceno" };
  const EMOJI = { "🦖": "dino", "🦣": "mam", "🌿": "planta", "🦎": "otro" };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const iconize = s => esc(s).replace(/🦖|🦣|🌿|🦎/gu, m => `<img src="icons/${EMOJI[m]}.png" alt="${cats[EMOJI[m]]}">`);
  const color = e => (eras[e] && eras[e].color) || "#4c5a45";

  // Menú móvil
  const burger = document.querySelector(".burger"), nav = document.querySelector(".top nav");
  burger.addEventListener("click", () => { const o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", o); });
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));

  // Eras
  document.getElementById("eras").innerHTML = Object.entries(eras).map(([n, e]) => `
    <div class="era" style="border-top-color:${e.color}">
      <header><img src="icons/${e.slug}.png" alt=""><h3>${n}</h3></header>
      <p class="rng">${e.rango} · ${e.lab}</p><p>${e.intro}</p></div>`).join("");

  // Filtros
  const state = { era: "", cat: "", q: "" };
  const fEra = document.getElementById("f-era"), fCat = document.getElementById("f-cat");
  const chip = (group, val, label, icon) =>
    `<button class="chip" data-g="${group}" data-v="${val}" aria-pressed="${state[group] === val}">${icon ? `<img src="icons/${icon}.png" alt="">` : ""}${label}</button>`;
  function drawChips() {
    fEra.innerHTML = chip("era", "", "Todas las eras") + Object.keys(eras).map(n => chip("era", n, n, ERA_ICON[n])).join("");
    fCat.innerHTML = chip("cat", "", "Todo") + Object.entries(cats).map(([k, v]) => chip("cat", k, v.replace(" prehistórico", ""), k)).join("");
  }
  document.querySelector(".filters").addEventListener("click", e => {
    const b = e.target.closest(".chip"); if (!b) return;
    state[b.dataset.g] = b.dataset.v; drawChips(); drawGrid();
  });
  document.getElementById("f-q").addEventListener("input", e => { state.q = e.target.value.trim().toLowerCase(); drawGrid(); });

  let current = [];
  function card(s, i, rz) {
    const tags = `<img src="icons/${s.cat}.png" alt="${cats[s.cat]}">` + (ERA_ICON[s.era] ? `<img src="icons/${ERA_ICON[s.era]}.png" alt="${s.era}">` : "");
    return `<button class="card" data-i="${i}" data-rz="${rz ? 1 : ""}" style="--c:${rz && s.era !== "Triásico" ? "#4c5a45" : color(s.era)}">
      <img class="art" src="${s.img}" alt="${esc(s.nombre)}" loading="lazy">
      ${rz ? `<span class="badge" title="Índice de rareza">${s.indice}</span>` : ""}
      <span class="tags">${tags}</span>
      <div class="meta"><div class="num">${rz ? s.id + " · " + s.era : "N.º " + s.id + " · " + s.era}</div>
      <h3>${esc(s.nombre)}</h3><div class="sci">${esc(s.cientifico)}</div>
      ${rz ? `<div class="pow">«${esc(s.poder)}»</div>` : ""}</div></button>`;
  }
  function drawGrid() {
    const q = state.q;
    current = especies.filter(s => (!state.era || s.era === state.era) && (!state.cat || s.cat === state.cat) &&
      (!q || (s.nombre + " " + s.cientifico).toLowerCase().includes(q)));
    document.getElementById("grid").innerHTML = current.map((s, i) => card(s, i, false)).join("") ||
      `<p class="center"><i>No hay ejemplares con esos filtros.</i></p>`;
    document.getElementById("count").textContent = `${current.length} ejemplar${current.length === 1 ? "" : "es"}`;
  }
  drawChips(); drawGrid();
  document.getElementById("grid-rz").innerHTML = rarezas.map((s, i) => card(s, i, true)).join("");

  // Ficha
  const dlg = document.getElementById("ficha");
  let list = [], idx = 0, isRz = false;
  function show() {
    const s = list[idx];
    dlg.querySelector(".fx").style.setProperty("--c", isRz && s.era !== "Triásico" ? "#4c5a45" : color(s.era));
    document.getElementById("fx-img").src = s.img; document.getElementById("fx-img").alt = s.nombre;
    document.getElementById("fx-num").textContent = isRz ? `Gabinete de Rarezas · ${s.id} · Índice de rareza ${s.indice}` : `Ejemplar n.º ${s.id} · ${s.era}`;
    document.getElementById("fx-name").textContent = s.nombre;
    document.getElementById("fx-sci").textContent = s.cientifico;
    const periodo = s.edad.startsWith(s.era) ? s.edad : `${s.era} · ${s.edad}`;
    document.getElementById("fx-dl").innerHTML = [["Categoría", cats[s.cat]], ["Cuándo vivió", periodo], ["Tamaño", s.tam], ["Alimentación", s.dieta], ["Dónde se halló", s.lugar]]
      .map(([a, b]) => `<dt>${a}</dt><dd>${esc(b)}</dd>`).join("");
    document.getElementById("fx-dato").textContent = s.dato;
    document.getElementById("fx-juego").innerHTML = isRz
      ? `<b>En el juego:</b> poder «${esc(s.poder)}». ${iconize(s.puntua)}`
      : `<b>En el juego:</b> puntúa ${iconize(s.puntua)} · Set ${s.set}`;
  }
  document.addEventListener("click", e => {
    const c = e.target.closest(".card"); if (!c) return;
    isRz = !!c.dataset.rz; list = isRz ? rarezas : current; idx = +c.dataset.i;
    show(); dlg.showModal();
  });
  dlg.querySelector(".close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", e => { if (e.target === dlg) dlg.close(); });
  document.getElementById("fx-prev").addEventListener("click", () => { idx = (idx - 1 + list.length) % list.length; show(); });
  document.getElementById("fx-next").addEventListener("click", () => { idx = (idx + 1) % list.length; show(); });
  document.addEventListener("keydown", e => {
    if (!dlg.open) return;
    if (e.key === "ArrowRight") document.getElementById("fx-next").click();
    if (e.key === "ArrowLeft") document.getElementById("fx-prev").click();
  });
})();
