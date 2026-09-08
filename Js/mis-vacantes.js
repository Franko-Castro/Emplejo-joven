document.addEventListener('DOMContentLoaded', () => {
  verifyCompanySession();
  initVacancyPage();
});

async function verifyCompanySession() {
  try {
    const response = await fetch('php/session.php');
    const result = await response.json();
    if (!result.loggedIn || result.user?.tipo_usuario !== 'empresa') window.location.href = 'index.html';
  } catch { window.location.href = 'index.html'; }
}

function initVacancyPage() {
  const list = document.getElementById('vacanciesList');
  const modal = document.getElementById('vacancyEditorModal');
  const form = document.getElementById('vacancyEditorForm');
  const category = document.getElementById('editVacancyCategory');
  const closeOfferBtn = document.getElementById('closeVacancyBtn');
  const saveBtn = document.getElementById('saveVacancyEditor');
  const closeModal = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); };

  list.addEventListener('click', event => {
    const item = event.target.closest('.vacancy-item');
    if (item) openEditor(item.dataset.vacancyId);
  });
  document.getElementById('closeVacancyEditor').addEventListener('click', closeModal);
  document.getElementById('cancelVacancyEditor').addEventListener('click', closeModal);
  modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });

  async function loadVacancies() {
    const count = document.getElementById('vacanciesCount');
    list.innerHTML = '<div class="vacancies-empty">Cargando vacantes...</div>';
    try {
      const response = await fetch('php/mis_vacantes.php?todas=1');
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);
      count.textContent = `${result.data.length} Total`;
      list.innerHTML = result.data.length ? result.data.map(vacancy => `<button type="button" class="vacancy-item" data-vacancy-id="${vacancy.id_oferta}"><span class="vacancy-top"><span><h3>${escapeHtml(vacancy.cargo)}</h3><span class="vacancy-category">${escapeHtml(vacancy.categoria)}</span></span><span class="status-badge ${vacancy.estado === 'activa' ? 'active' : 'review'}">${vacancy.estado === 'activa' ? '<span class="status-dot"></span>Activa' : '<span class="material-symbols-outlined">lock</span>Cerrada'}</span></span><span class="vacancy-stats"><span class="material-symbols-outlined">calendar_today</span><span>${formatDate(vacancy.fecha_publicacion)}</span></span></button>`).join('') : '<div class="vacancies-empty"><span class="material-symbols-outlined">work_off</span><p>Aún no has publicado vacantes.</p></div>';
    } catch { list.innerHTML = '<div class="vacancies-empty">No fue posible cargar tus vacantes.</div>'; }
  }

  async function openEditor(id) {
    modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
    try {
      const response = await fetch(`php/oferta_empresa.php?id=${encodeURIComponent(id)}`);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);
      const vacancy = result.data;
      document.getElementById('editVacancyId').value = vacancy.id_oferta;
      document.getElementById('editVacancyCargo').value = vacancy.cargo || '';
      document.getElementById('editVacancyDescription').value = vacancy.descripcion || '';
      document.getElementById('editVacancyExperience').value = vacancy.experiencia_requerida || '';
      document.getElementById('editVacancySkills').value = vacancy.habilidades_requeridas || '';
      document.getElementById('editVacancyContact').value = vacancy.datos_contacto || '';
      document.getElementById('editVacancyStatus').value = vacancy.estado;
      closeOfferBtn.hidden = vacancy.estado === 'cerrada';
      await loadCategories(vacancy.id_categoria);
    } catch (error) { closeModal(); showToast(error.message || 'No fue posible cargar la vacante', 'error'); }
  }

  async function loadCategories(selectedId) {
    const response = await fetch('php/categorias.php');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message);
    category.innerHTML = result.data.map(item => `<option value="${item.id_categoria}">${escapeHtml(item.nombre)}</option>`).join('');
    category.value = String(selectedId);
  }

  async function save(closeOffer = false) {
    if (!form.reportValidity()) return;
    const payload = Object.fromEntries(new FormData(form).entries());
    if (closeOffer) payload.estado = 'cerrada';
    saveBtn.disabled = closeOfferBtn.disabled = true;
    try {
      const response = await fetch('php/oferta_empresa.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);
      closeModal(); await loadVacancies(); showToast(result.message);
    } catch (error) { showToast(error.message || 'No fue posible guardar la vacante', 'error'); }
    finally { saveBtn.disabled = closeOfferBtn.disabled = false; }
  }
  form.addEventListener('submit', event => { event.preventDefault(); save(); });
  closeOfferBtn.addEventListener('click', () => { if (window.confirm('¿Deseas cerrar esta vacante?')) save(true); });
  loadVacancies();
}

function escapeHtml(value) { const element = document.createElement('div'); element.textContent = value; return element.innerHTML; }
function formatDate(value) { const date = new Date(String(value).replace(' ', 'T')); return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : `Publicada el ${date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`; }
function showToast(message, type = 'success') { const toast = document.getElementById('toast'); document.getElementById('toastMessage').textContent = message; document.getElementById('toastIcon').textContent = type === 'success' ? 'check_circle' : 'error'; document.getElementById('toastInner').className = `toast-inner ${type}`; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000); }
