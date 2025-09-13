const API = '/api/concepts'; //URL base de la API 

//Seleccionamos los elementos del DOM
const $form = document.getElementById('concept-form');
const $titulo = document.getElementById('titulo');
const $desarrollo = document.getElementById('desarrollo');
const $lista = document.getElementById('lista');
const $btnRefresh = document.getElementById('btn-refresh');
const $btnDeleteAll = document.getElementById('btn-delete-all');

// Función genérica para hacer fetch y manejar errores en JSON
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!res.ok) {
    let msg = 'Error HTTP';
    try { const j = await res.json(); msg = j.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// Dibuja la lista de conceptos en pantalla
function render(items) {
  $lista.innerHTML = '';
  if (!items.length) {
    $lista.innerHTML = '<li class="item">No hay conceptos cargados.</li>';
    return;
  }
  for (const c of items) {
    const li = document.createElement('li');
    li.className = 'item';
    li.innerHTML = `
      <div>
        <div class="id">#${c.id} • ${new Date(c.createdAt).toLocaleString()}</div>
        <h3>${c.titulo}</h3>
        <p>${c.desarrollo}</p>
      </div>
      <div><button class="btn-del" data-id="${c.id}">Eliminar</button></div>
    `;
    $lista.appendChild(li);
  }
}

// Obtiene lista actualizada desde la API
async function refresh() {
  try { render(await fetchJSON(API)); } catch (e) { alert(e.message); }
}

// Agregar un nuevo concepto
$form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const titulo = $titulo.value.trim();
  const desarrollo = $desarrollo.value.trim();
  if (!titulo || !desarrollo) return;
  try {
    await fetchJSON(API, { method: 'POST', body: JSON.stringify({ titulo, desarrollo }) });
    $form.reset();
    await refresh();
  } catch (e) { alert(e.message); }
});

// Refrescar lista manualmente
$btnRefresh.addEventListener('click', refresh);

// Eliminar todos los conceptos
$btnDeleteAll.addEventListener('click', async () => {
  if (!confirm('¿Eliminar todos los conceptos?')) return;
  try { await fetchJSON(API, { method: 'DELETE' }); await refresh(); } catch (e) { alert(e.message); }
});

//Eliminar un concepto individual
$lista.addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn-del');
  if (!btn) return;
  const id = btn.getAttribute('data-id');
  if (!confirm(`¿Eliminar concepto #${id}?`)) return;
  try { await fetchJSON(`${API}/${id}`, { method: 'DELETE' }); await refresh(); } catch (e) { alert(e.message); }
});

refresh();
