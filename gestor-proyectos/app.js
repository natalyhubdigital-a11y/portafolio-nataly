/* =========================================================
   Gestor de Proyectos — HTML + CSS + JS, datos en localStorage
   ========================================================= */

// Credenciales de acceso (definidas en el código, uso local)
const USUARIO = 'Naty';
const CONTRASENA = 'noviembre2026';

const KEY_TAREAS = 'gp_tareas';
const KEY_SESION = 'gp_sesion';
const ESTADOS = ['Pendiente', 'En proceso', 'Completada'];
const DIAS_PROXIMAS = 7; // "próximas entregas" = próximos 7 días

let tareas = [];
let vistaActual = 'resumen';
let modoTareas = 'tabla';
let mesCal = new Date();
mesCal.setDate(1);

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/* ---------- Utilidades de fecha ---------- */
function fechaISO(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
function hoyISO() { return fechaISO(new Date()); }
function sumarDias(n) { const d = new Date(); d.setDate(d.getDate() + n); return fechaISO(d); }
function formatoFecha(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function estaVencida(t) { return t.estado !== 'Completada' && t.fecha && t.fecha < hoyISO(); }

function escapar(txt) {
  return String(txt ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
function nuevoId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

/* ---------- Datos ---------- */
function cargar() {
  const guardado = localStorage.getItem(KEY_TAREAS);
  if (guardado === null) {
    tareas = datosEjemplo();
    guardar();
  } else {
    try { tareas = JSON.parse(guardado) || []; } catch { tareas = []; }
  }
}
function guardar() { localStorage.setItem(KEY_TAREAS, JSON.stringify(tareas)); }

function datosEjemplo() {
  const p1 = 'Sitio web Café Aroma';
  const p2 = 'Campaña redes Moda Luna';
  return [
    { proyecto: p1, nombre: 'Definir mapa del sitio', responsable: 'Naty', fecha: sumarDias(-6), prioridad: 'Alta', estado: 'Completada', notas: 'Aprobado por el cliente.' },
    { proyecto: p1, nombre: 'Diseño de página de inicio', responsable: 'Carlos', fecha: sumarDias(-2), prioridad: 'Alta', estado: 'En proceso', notas: 'Falta versión móvil.' },
    { proyecto: p1, nombre: 'Redactar textos del menú', responsable: 'Laura', fecha: sumarDias(4), prioridad: 'Media', estado: 'Pendiente', notas: '' },
    { proyecto: p2, nombre: 'Calendario de publicaciones', responsable: 'Naty', fecha: sumarDias(-1), prioridad: 'Media', estado: 'Completada', notas: 'Diciembre listo.' },
    { proyecto: p2, nombre: 'Sesión de fotos de temporada', responsable: 'Laura', fecha: sumarDias(2), prioridad: 'Alta', estado: 'En proceso', notas: 'Confirmar locación.' },
    { proyecto: p2, nombre: 'Informe de métricas mensual', responsable: 'Carlos', fecha: sumarDias(12), prioridad: 'Baja', estado: 'Pendiente', notas: '' },
  ].map((t) => ({ id: nuevoId(), ...t }));
}

function proyectos() { return [...new Set(tareas.map((t) => t.proyecto))].sort((a, b) => a.localeCompare(b)); }
function responsables() { return [...new Set(tareas.map((t) => t.responsable))].sort((a, b) => a.localeCompare(b)); }

function contar(lista) {
  const total = lista.length;
  const completadas = lista.filter((t) => t.estado === 'Completada').length;
  return {
    total,
    pendientes: lista.filter((t) => t.estado === 'Pendiente').length,
    enProceso: lista.filter((t) => t.estado === 'En proceso').length,
    completadas,
    vencidas: lista.filter(estaVencida).length,
    pct: total ? Math.round((completadas / total) * 100) : 0,
  };
}

/* ---------- Sesión ---------- */
function iniciarApp() {
  const logueado = localStorage.getItem(KEY_SESION) === '1';
  $('#login').hidden = logueado;
  $('#app').hidden = !logueado;
  if (logueado) { cargar(); renderTodo(); }
}

$('#login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const u = $('#login-user').value.trim();
  const p = $('#login-pass').value;
  if (u === USUARIO && p === CONTRASENA) {
    localStorage.setItem(KEY_SESION, '1');
    $('#login-error').hidden = true;
    $('#login-form').reset();
    iniciarApp();
  } else {
    $('#login-error').hidden = false;
  }
});

$('#logout').addEventListener('click', () => {
  localStorage.removeItem(KEY_SESION);
  iniciarApp();
});

/* ---------- Navegación ---------- */
$('#tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-view]');
  if (!btn) return;
  vistaActual = btn.dataset.view;
  $$('.tab').forEach((b) => b.classList.toggle('active', b === btn));
  $$('.view').forEach((v) => { v.hidden = v.id !== `view-${vistaActual}`; });
  window.scrollTo(0, 0);
});

$$('[data-action="nueva"]').forEach((b) => b.addEventListener('click', () => abrirModal()));

/* ---------- Render general ---------- */
function renderTodo() {
  renderSelects();
  renderResumen();
  renderTareas();
  renderCalendario();
  renderReporte();
}

function opciones(lista, actual, textoTodos) {
  return `<option value="">${textoTodos}</option>` + lista
    .map((v) => `<option value="${escapar(v)}"${v === actual ? ' selected' : ''}>${escapar(v)}</option>`)
    .join('');
}

function renderSelects() {
  const ps = proyectos();
  const rs = responsables();
  // Mantiene la selección si el valor sigue existiendo
  const fp = $('#f-proyecto').value, fr = $('#f-responsable').value, rp = $('#r-proyecto').value;
  $('#f-proyecto').innerHTML = opciones(ps, ps.includes(fp) ? fp : '', 'Todos');
  $('#f-responsable').innerHTML = opciones(rs, rs.includes(fr) ? fr : '', 'Todos');
  $('#r-proyecto').innerHTML = opciones(ps, ps.includes(rp) ? rp : '', 'Todos los proyectos');
  $('#lista-proyectos').innerHTML = ps.map((p) => `<option value="${escapar(p)}">`).join('');
  $('#lista-responsables').innerHTML = rs.map((r) => `<option value="${escapar(r)}">`).join('');
}

/* ---------- Resumen ---------- */
function renderResumen() {
  const c = contar(tareas);
  const items = [
    ['Total de tareas', c.total, 'var(--primary)'],
    ['Pendientes', c.pendientes, 'var(--muted)'],
    ['En proceso', c.enProceso, 'var(--warning)'],
    ['Completadas', c.completadas, 'var(--success)'],
    ['Vencidas', c.vencidas, 'var(--danger)'],
    ['% completado', c.pct + '%', 'var(--info)'],
  ];
  $('#stats').innerHTML = items
    .map(([lbl, num, color]) => `<div class="stat" style="--c:${color}"><div class="num">${num}</div><div class="lbl">${lbl}</div></div>`)
    .join('');
  $('#pct-label').textContent = c.pct + '%';
  $('#pct-bar').style.width = c.pct + '%';

  const ps = proyectos();
  $('#by-project').innerHTML = ps.length ? ps.map((p) => {
    const cp = contar(tareas.filter((t) => t.proyecto === p));
    return `<div class="project-row">
      <div class="top"><strong>${escapar(p)}</strong><span>${cp.pct}%</span></div>
      <div class="progress"><div style="width:${cp.pct}%"></div></div>
      <div class="meta">${cp.total} tareas · ${cp.completadas} completadas · ${cp.enProceso} en proceso · ${cp.pendientes} pendientes${cp.vencidas ? ` · <span class="overdue-text">${cp.vencidas} vencidas</span>` : ''}</div>
    </div>`;
  }).join('') : '<p class="empty">Aún no hay proyectos. Crea tu primera tarea.</p>';
}

/* ---------- Tareas: tabla y kanban ---------- */
function tareasFiltradas() {
  const fp = $('#f-proyecto').value, fr = $('#f-responsable').value, fe = $('#f-estado').value;
  return tareas
    .filter((t) => (!fp || t.proyecto === fp) && (!fr || t.responsable === fr) && (!fe || t.estado === fe))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function selectorEstado(t) {
  return `<select data-estado="${t.id}" aria-label="Estado">${ESTADOS
    .map((s) => `<option${s === t.estado ? ' selected' : ''}>${s}</option>`).join('')}</select>`;
}

function etiquetaFecha(t) {
  const venc = estaVencida(t);
  return `<span class="${venc ? 'overdue-text' : ''}">${formatoFecha(t.fecha)}</span>${venc ? ' <span class="badge b-vencida">Vencida</span>' : ''}`;
}

function renderTareas() {
  const lista = tareasFiltradas();

  $('#tabla-body').innerHTML = lista.map((t) => `
    <tr>
      <td>${escapar(t.proyecto)}</td>
      <td><div class="task-name">${escapar(t.nombre)}</div>${t.notas ? `<div class="muted" style="font-size:.8rem">${escapar(t.notas)}</div>` : ''}</td>
      <td>${escapar(t.responsable)}</td>
      <td>${etiquetaFecha(t)}</td>
      <td><span class="badge p-${t.prioridad}">${t.prioridad}</span></td>
      <td>${selectorEstado(t)}</td>
      <td><div class="row-actions">
        <button class="btn btn-ghost btn-sm" data-editar="${t.id}">Editar</button>
        <button class="btn btn-danger btn-sm" data-eliminar="${t.id}">Eliminar</button>
      </div></td>
    </tr>`).join('');
  $('#tabla-vacia').hidden = lista.length > 0;

  $('#kanban').innerHTML = ESTADOS.map((estado) => {
    const col = lista.filter((t) => t.estado === estado);
    return `<div class="k-col">
      <h3>${estado} <span>${col.length}</span></h3>
      <div class="k-list">${col.map((t) => `
        <div class="k-card${estaVencida(t) ? ' overdue' : ''}">
          <div class="proj">${escapar(t.proyecto)}</div>
          <div class="task-name">${escapar(t.nombre)}</div>
          <div class="meta"><span>${escapar(t.responsable)}</span> · ${etiquetaFecha(t)} <span class="badge p-${t.prioridad}">${t.prioridad}</span></div>
          <div class="foot">${selectorEstado(t)}<button class="btn btn-ghost btn-sm" data-editar="${t.id}">Editar</button></div>
        </div>`).join('') || '<p class="empty">Sin tareas</p>'}
      </div>
    </div>`;
  }).join('');
}

['#f-proyecto', '#f-responsable', '#f-estado'].forEach((s) => $(s).addEventListener('change', renderTareas));
$('#f-limpiar').addEventListener('click', () => {
  $('#f-proyecto').value = ''; $('#f-responsable').value = ''; $('#f-estado').value = '';
  renderTareas();
});

$$('.seg').forEach((b) => b.addEventListener('click', () => {
  modoTareas = b.dataset.mode;
  $$('.seg').forEach((x) => x.classList.toggle('active', x === b));
  $('#tabla-wrap').hidden = modoTareas !== 'tabla';
  $('#kanban').hidden = modoTareas !== 'kanban';
}));

// Delegación de eventos: cambio de estado, editar y eliminar
document.addEventListener('change', (e) => {
  const id = e.target.dataset.estado;
  if (!id) return;
  const t = tareas.find((x) => x.id === id);
  if (t) { t.estado = e.target.value; guardar(); renderTodo(); aviso(`Estado actualizado: ${t.estado}`); }
});
document.addEventListener('click', (e) => {
  const ed = e.target.closest('[data-editar]');
  if (ed) { abrirModal(ed.dataset.editar); return; }
  const el = e.target.closest('[data-eliminar]');
  if (el) eliminarTarea(el.dataset.eliminar);
});

function eliminarTarea(id) {
  const t = tareas.find((x) => x.id === id);
  if (!t || !confirm(`¿Eliminar la tarea "${t.nombre}"?`)) return false;
  tareas = tareas.filter((x) => x.id !== id);
  guardar();
  renderTodo();
  aviso('Tarea eliminada');
  return true;
}

/* ---------- Modal crear/editar ---------- */
const modal = $('#modal');

function abrirModal(id, fechaPorDefecto) {
  const t = id ? tareas.find((x) => x.id === id) : null;
  $('#modal-title').textContent = t ? 'Editar tarea' : 'Nueva tarea';
  $('#t-id').value = t ? t.id : '';
  $('#t-proyecto').value = t ? t.proyecto : ($('#f-proyecto').value || '');
  $('#t-nombre').value = t ? t.nombre : '';
  $('#t-responsable').value = t ? t.responsable : '';
  $('#t-fecha').value = t ? t.fecha : (fechaPorDefecto || hoyISO());
  $('#t-prioridad').value = t ? t.prioridad : 'Media';
  $('#t-estado').value = t ? t.estado : 'Pendiente';
  $('#t-notas').value = t ? t.notas : '';
  $('#t-eliminar').hidden = !t;
  modal.showModal();
}

$('#task-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const datos = {
    proyecto: $('#t-proyecto').value.trim(),
    nombre: $('#t-nombre').value.trim(),
    responsable: $('#t-responsable').value.trim(),
    fecha: $('#t-fecha').value,
    prioridad: $('#t-prioridad').value,
    estado: $('#t-estado').value,
    notas: $('#t-notas').value.trim(),
  };
  if (!datos.proyecto || !datos.nombre || !datos.responsable || !datos.fecha) return;
  const id = $('#t-id').value;
  if (id) {
    Object.assign(tareas.find((x) => x.id === id), datos);
    aviso('Tarea actualizada');
  } else {
    tareas.push({ id: nuevoId(), ...datos });
    aviso('Tarea creada');
  }
  guardar();
  modal.close();
  renderTodo();
});

$('#t-cancelar').addEventListener('click', () => modal.close());
$('#t-eliminar').addEventListener('click', () => {
  if (eliminarTarea($('#t-id').value)) modal.close();
});

/* ---------- Calendario ---------- */
function renderCalendario() {
  const y = mesCal.getFullYear(), m = mesCal.getMonth();
  const titulo = mesCal.toLocaleDateString('es', { month: 'long', year: 'numeric' });
  $('#cal-title').textContent = titulo.charAt(0).toUpperCase() + titulo.slice(1);

  const primerDia = new Date(y, m, 1);
  const offset = (primerDia.getDay() + 6) % 7; // semana inicia en lunes
  const inicio = new Date(y, m, 1 - offset);
  const hoy = hoyISO();

  let html = '';
  for (let i = 0; i < 42; i++) {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    if (i === 35 && d.getMonth() !== m) break; // evita una sexta fila vacía
    const iso = fechaISO(d);
    const delDia = tareas.filter((t) => t.fecha === iso);
    const clases = ['cal-day', d.getMonth() !== m ? 'other' : '', iso === hoy ? 'today' : ''].join(' ');
    html += `<div class="${clases}" data-dia="${iso}">
      <span class="d">${d.getDate()}</span>
      ${delDia.map((t) => `<button class="cal-task s-${t.estado.replace(' ', '-')}${estaVencida(t) ? ' overdue' : ''}"
          data-editar="${t.id}" title="${escapar(t.proyecto)} — ${escapar(t.nombre)} (${t.estado})">${escapar(t.nombre)}</button>`).join('')}
    </div>`;
  }
  $('#cal-grid').innerHTML = html;
}

$('#cal-prev').addEventListener('click', () => { mesCal.setMonth(mesCal.getMonth() - 1); renderCalendario(); });
$('#cal-next').addEventListener('click', () => { mesCal.setMonth(mesCal.getMonth() + 1); renderCalendario(); });
$('#cal-hoy').addEventListener('click', () => { mesCal = new Date(); mesCal.setDate(1); renderCalendario(); });
// Doble clic en un día vacío crea una tarea con esa fecha
$('#cal-grid').addEventListener('dblclick', (e) => {
  const dia = e.target.closest('[data-dia]');
  if (dia && !e.target.closest('[data-editar]')) abrirModal(null, dia.dataset.dia);
});

/* ---------- Reportes ---------- */
function generarReporte() {
  const proyecto = $('#r-proyecto').value;
  const lista = tareas.filter((t) => !proyecto || t.proyecto === proyecto)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const c = contar(lista);
  const hoy = hoyISO(), limite = sumarDias(DIAS_PROXIMAS);
  const conProyecto = !proyecto;
  const linea = (t) => `• ${t.nombre}${conProyecto ? ` [${t.proyecto}]` : ''} — ${t.responsable} — ${formatoFecha(t.fecha)}`;
  const bloque = (titulo, arr) => `${titulo} (${arr.length})\n${arr.length ? arr.map(linea).join('\n') : '• Ninguna'}`;

  const completadas = lista.filter((t) => t.estado === 'Completada');
  const pendientes = lista.filter((t) => t.estado !== 'Completada' && !estaVencida(t));
  const vencidas = lista.filter(estaVencida);
  const proximas = lista.filter((t) => t.estado !== 'Completada' && t.fecha >= hoy && t.fecha <= limite);

  return [
    `REPORTE DE AVANCE — ${proyecto || 'Todos los proyectos'}`,
    `Fecha: ${formatoFecha(hoy)}`,
    '',
    `Avance: ${c.pct}% (${c.completadas} de ${c.total} tareas completadas)`,
    '',
    bloque('✅ Completadas', completadas),
    '',
    bloque('🕒 Pendientes y en proceso', pendientes),
    '',
    bloque('⚠️ Vencidas', vencidas),
    '',
    bloque(`📅 Próximas entregas (${DIAS_PROXIMAS} días)`, proximas),
  ].join('\n');
}

function renderReporte() { $('#r-texto').value = generarReporte(); }
$('#r-proyecto').addEventListener('change', renderReporte);

function asunto() {
  return `Reporte de avance — ${$('#r-proyecto').value || 'Todos los proyectos'} (${formatoFecha(hoyISO())})`;
}

$('#r-copiar').addEventListener('click', async () => {
  const texto = generarReporte();
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const ta = $('#r-texto');
    ta.select();
    document.execCommand('copy');
  }
  aviso('Reporte copiado al portapapeles');
});

$('#r-whatsapp').addEventListener('click', () => {
  if (!confirm('Se abrirá WhatsApp con el reporte listo. Elige el contacto y confirma el envío allí. ¿Continuar?')) return;
  window.open('https://wa.me/?text=' + encodeURIComponent(generarReporte()), '_blank', 'noopener');
});

$('#r-correo').addEventListener('click', () => {
  if (!confirm('Se abrirá tu aplicación de correo con el asunto y el cuerpo preparados. Agrega el destinatario y confirma el envío. ¿Continuar?')) return;
  window.location.href = `mailto:?subject=${encodeURIComponent(asunto())}&body=${encodeURIComponent(generarReporte())}`;
});

/* ---------- Exportar Excel (todas las tareas, sin filtros) ---------- */
$('#r-excel').addEventListener('click', () => {
  if (typeof XLSX === 'undefined') {
    alert('No se pudo cargar SheetJS. Revisa tu conexión a internet e inténtalo de nuevo.');
    return;
  }
  const filas = [...tareas]
    .sort((a, b) => a.proyecto.localeCompare(b.proyecto) || a.fecha.localeCompare(b.fecha))
    .map((t) => ({
      Proyecto: t.proyecto,
      Tarea: t.nombre,
      Responsable: t.responsable,
      'Fecha límite': formatoFecha(t.fecha),
      Prioridad: t.prioridad,
      Estado: t.estado,
      Vencida: estaVencida(t) ? 'Sí' : 'No',
      Notas: t.notas,
    }));
  const hoja = XLSX.utils.json_to_sheet(filas, {
    header: ['Proyecto', 'Tarea', 'Responsable', 'Fecha límite', 'Prioridad', 'Estado', 'Vencida', 'Notas'],
  });
  hoja['!cols'] = [{ wch: 28 }, { wch: 34 }, { wch: 16 }, { wch: 13 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 40 }];
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Tareas');
  XLSX.writeFile(libro, `gestor-proyectos-${hoyISO()}.xlsx`);
  aviso(`Excel descargado (${filas.length} tareas)`);
});

/* ---------- Aviso breve ---------- */
let avisoTimer;
function aviso(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(avisoTimer);
  avisoTimer = setTimeout(() => { el.hidden = true; }, 2200);
}

iniciarApp();
