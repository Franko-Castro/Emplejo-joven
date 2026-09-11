/**
 * ============================================
 * EMPLEOJOVEN — DASHBOARD POSTULANTE
 * ============================================
 */

let currentVacancies = [];
let currentUserData = null;
let savedJobsOnly = false;
let jobsGroupedByCategory = false;

// Cache de datos de perfil y categorías para evitar peticiones repetidas
let _cachedProfileData = null;
let _cachedCategories = null;

const SAVED_JOBS_KEY = 'empleos_guardados';

document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  initSidebar();
  initSearch();
  initSavedJobsInteractions();
  loadAvailableVacancies();
  initEvents();
  initProfileModal();
  initLogoutButton();
});

/* ============================================
   SESSION / AUTH
   ============================================ */

/**
 * Verifica si hay una sesión activa.
 */
async function checkSession() {
  try {
    const res = await fetch('php/session.php');
    const data = await res.json();
    if (!data.loggedIn || !data.user || data.user.tipo_usuario !== 'persona') {
      window.location.href = 'index.html';
      return;
    }
    currentUserData = data.user;
    renderUser(data.user);
  } catch (err) {
    console.error('Error verificando sesión:', err);
    window.location.href = 'index.html';
  }
}

/* ============================================
   EVENTS
   ============================================ */
let dashboardEvents = [];

async function initEvents() {
  const eventsList = document.getElementById('dashboardEventsList');
  const calendarList = document.getElementById('eventsCalendarList');
  const calendarModal = document.getElementById('eventsCalendarModal');
  if (!eventsList || !calendarList || !calendarModal) return;

  const formatEventDate = (value) => {
    const date = new Date(String(value).replace(' ', 'T'));
    return Number.isNaN(date.getTime()) ? 'Fecha por confirmar' : date.toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' });
  };
  const eventMarkup = (event, detailed = false) => `<article class="event-row ${detailed ? 'event-row-detailed' : ''}">
    <p class="event-date-label">${formatEventDate(event.fecha_evento)} · ${event.modalidad}</p>
    <h4>${escapeHtml(event.titulo)}</h4><p>${escapeHtml(event.descripcion)}</p>
    ${detailed ? `<p><strong>Organiza:</strong> ${escapeHtml(event.organizador || 'EmpleoJoven')}</p>` : ''}
    ${!detailed && event.enlace_inscripcion ? `<a class="event-calendar-link" href="${escapeAttr(event.enlace_inscripcion)}" target="_blank" rel="noopener">Inscribirme</a>` : ''}
  </article>`;

  try {
    const response = await fetch('php/eventos_publicos.php?limit=20');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message);
    dashboardEvents = result.data || [];
    eventsList.innerHTML = dashboardEvents.length
      ? dashboardEvents.slice(0, 2).map(event => eventMarkup(event)).join('<hr class="widget-divider">')
      : '<p class="event-row">No hay eventos próximos.</p>';
    calendarList.innerHTML = dashboardEvents.length
      ? dashboardEvents.map(event => eventMarkup(event, true)).join('<hr class="widget-divider">')
      : '<p>No hay eventos activos programados.</p>';
  } catch (error) {
    console.error('[DashboardEvents]', error);
    eventsList.innerHTML = '<p class="event-row">No fue posible cargar los eventos.</p>';
    calendarList.innerHTML = '<p>No fue posible cargar los eventos.</p>';
  }

  const close = () => { calendarModal.classList.remove('open'); calendarModal.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
  document.getElementById('openEventsCalendar').addEventListener('click', () => { calendarModal.classList.add('open'); calendarModal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; });
  document.getElementById('closeEventsCalendar').addEventListener('click', close);
  calendarModal.addEventListener('click', event => { if (event.target === calendarModal) close(); });
}

/**
 * Renderiza los datos del usuario en el dashboard.
 */
function renderUser(user) {
  currentUserData = user;

  // Título de bienvenida
  const welcomeTitle = document.getElementById('welcomeTitle');
  const welcomeSubtitle = document.getElementById('welcomeSubtitle');
  const displayName = user.nombre || user.nombre_completo || 'Usuario';

  if (welcomeTitle) {
    welcomeTitle.textContent = `¡Hola, ${displayName}! Encuentra tu próximo reto hoy.`;
  }
  if (welcomeSubtitle) {
    const pct = user.perfil_completado || 10;
    welcomeSubtitle.textContent = `Tu perfil está un ${pct}% completo. Estás listo para destacar.`;
  }

  // Foto de perfil en navbar
  const navUserPhoto = document.getElementById('navUserPhoto');
  if (navUserPhoto && user.foto) {
    navUserPhoto.src = user.foto;
    navUserPhoto.alt = displayName;
  }

  // Círculo de progreso
  const completionCircle = document.getElementById('completionCircle');
  const completionPercent = document.getElementById('completionPercent');
  const pct = user.perfil_completado || 10;
  if (completionCircle) {
    completionCircle.style.strokeDasharray = `${pct}, 100`;
  }
  if (completionPercent) {
    completionPercent.textContent = `${pct}%`;
  }

  // Sugerencia de acción según %
  const completionAction = document.getElementById('completionAction');
  if (completionAction) {
    if (pct < 50) {
      completionAction.textContent = 'Completar datos básicos →';
    } else if (pct < 80) {
      completionAction.textContent = 'Añadir experiencia y CV →';
    } else if (pct < 100) {
      completionAction.textContent = 'Completar perfil al 100% →';
    } else {
      completionAction.textContent = '¡Perfil 100% completo! 🎉';
    }
  }
}

/**
 * Inicializa el botón de cerrar sesión.
 */
function initLogoutButton() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Redirigir directamente - el PHP destruirá la sesión
      window.location.href = 'php/logout.php';
    });
  }
}

/**
 * Cierra la sesión.
 */
async function logout(logoutUrl) {
  try {
    const response = await fetch(logoutUrl, {
      method: 'POST',
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    window.location.replace(new URL('./', document.baseURI).href);
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
    // Si falla, intentar con GET como fallback
    window.location.assign(logoutUrl);
  }
}

/* ============================================
   SIDEBAR (Mobile Toggle)
   ============================================ */

function initSidebar() {
  const toggleBtn = document.getElementById('sidebarToggle');
  const closeBtn = document.getElementById('sidebarCloseBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (!sidebar) return;

  function open() {
    sidebar.classList.add('open');
    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    sidebar.classList.remove('open');
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  toggleBtn?.addEventListener('click', () => {
    sidebar.classList.contains('open') ? close() : open();
  });

  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);

  // Cerrar al hacer click en un link (mobile)
  sidebar.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 1024) close();
    });
  });

  // Cerrar al redimensionar a desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) close();
  });
}

/* ============================================
   SEARCH (Filtrado en tiempo real)
   ============================================ */

function initSearch() {
  const searchInput = document.getElementById('globalSearch');
  const jobList = document.getElementById('jobList');

  if (!searchInput || !jobList) return;

  function normalize(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  searchInput.addEventListener('input', () => {
    const query = normalize(searchInput.value);
    let visible = 0;
    const jobs = [...jobList.querySelectorAll('.job-item')];

    jobs.forEach(job => {
      const text = normalize(job.textContent);
      const match = text.includes(query);
      job.style.display = match ? '' : 'none';
      if (match) visible++;
    });

    if (visible === 0 && query.length > 0) {
      let noResults = jobList.querySelector('.no-results');
      if (!noResults) {
        noResults = document.createElement('div');
        noResults.className = 'no-results';
        noResults.style.cssText = 'text-align:center;padding:40px 20px;color:var(--text-muted);font-size:14px;';
        noResults.innerHTML = `
          <span class="material-symbols-outlined" style="font-size:48px;margin-bottom:12px;display:block;">search_off</span>
          No encontramos empleos con "<strong>${escapeHtml(searchInput.value)}</strong>"
        `;
        jobList.appendChild(noResults);
      } else {
        noResults.style.display = '';
        noResults.querySelector('strong').textContent = escapeHtml(searchInput.value);
      }
    } else {
      const noResults = jobList.querySelector('.no-results');
      if (noResults) noResults.style.display = 'none';
    }
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text ?? '');
  return div.innerHTML;
}

function escapeAttr(text) {
  return String(text ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ============================================
   VACANTES DISPONIBLES (BACKEND)
   ============================================ */

async function loadAvailableVacancies() {
  const container = document.getElementById('jobList');
  if (!container) return;
  container.innerHTML = `
    <div class="jobs-loading">
      <span class="material-symbols-outlined">sync</span>
      <p>Buscando las mejores ofertas disponibles para ti...</p>
    </div>
  `;
  try {
    const response = await fetch('php/vacantes_disponibles.php');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'Error al obtener vacantes');
    currentVacancies = result.data || [];
    renderAvailableVacancies(currentVacancies, false, false);
  } catch (error) {
    container.innerHTML = `
      <div class="jobs-loading">
        <span class="material-symbols-outlined">error_outline</span>
        <p>No fue posible cargar las vacantes en este momento.</p>
      </div>
    `;
    console.error('Error cargando vacantes:', error);
  }
}

function getSavedJobs() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_JOBS_KEY) || '[]');
    return Array.isArray(saved) ? saved.map(String) : [];
  } catch {
    return [];
  }
}

function saveJobsToStorage(ids) {
  localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify([...new Set(ids.map(String))]));
}

function isJobSaved(jobId) {
  return getSavedJobs().includes(String(jobId));
}

function toggleSavedJob(jobId) {
  const savedJobs = getSavedJobs();
  const id = String(jobId);
  const updated = savedJobs.includes(id)
    ? savedJobs.filter(item => item !== id)
    : [...savedJobs, id];

  saveJobsToStorage(updated);
  renderAvailableVacancies(currentVacancies, savedJobsOnly, jobsGroupedByCategory);
  showToast(updated.includes(id) ? 'Vacante guardada en Empleos Guardados' : 'Vacante removida de guardados', updated.includes(id) ? 'success' : 'success');
}

function initSavedJobsInteractions() {
  const sidebarSavedBtn = document.getElementById('sidebarSavedBtn');
  const sidebarHomeBtn = document.getElementById('sidebarHomeBtn');
  const bottomJobsBtn = document.getElementById('bottomJobsBtn');
  const topbarJobsBtn = document.getElementById('topbarJobsBtn');
  const topbarHomeBtn = document.getElementById('topbarHomeBtn');
  const bottomHomeBtn = document.getElementById('bottomHomeBtn');

  const showHomeView = (event) => {
    event.preventDefault();
    savedJobsOnly = false;
    jobsGroupedByCategory = false;
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) globalSearch.value = '';
    renderAvailableVacancies(currentVacancies, false, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  sidebarSavedBtn?.addEventListener('click', async (event) => {
    event.preventDefault();
    savedJobsOnly = true;
    jobsGroupedByCategory = false;
    const jobList = document.getElementById('jobList');
    if (!currentVacancies.length && jobList) {
      jobList.innerHTML = '<div class="jobs-loading"><span class="material-symbols-outlined">sync</span><p>Cargando empleos guardados...</p></div>';
      await loadAvailableVacancies();
    }
    renderAvailableVacancies(currentVacancies, true, false);
  });

  const showJobsView = async (event, grouped = false) => {
    event.preventDefault();
    savedJobsOnly = false;
    jobsGroupedByCategory = grouped;

    const jobList = document.getElementById('jobList');
    if (!currentVacancies.length && jobList) {
      jobList.innerHTML = '<div class="jobs-loading"><span class="material-symbols-outlined">sync</span><p>Cargando empleos...</p></div>';
      await loadAvailableVacancies();
    }
    renderAvailableVacancies(currentVacancies, false, grouped);
  };

  bottomJobsBtn?.addEventListener('click', (event) => showJobsView(event, true));
  topbarJobsBtn?.addEventListener('click', (event) => showJobsView(event, true));
  sidebarHomeBtn?.addEventListener('click', showHomeView);
  bottomHomeBtn?.addEventListener('click', showHomeView);
  topbarHomeBtn?.addEventListener('click', showHomeView);
}

function renderAvailableVacancies(vacancies, onlySaved = false, groupByCategory = false) {
  const container = document.getElementById('jobList');
  if (!container) return;

  const savedJobs = new Set(getSavedJobs());
  const visibleJobs = onlySaved ? (vacancies || []).filter(v => savedJobs.has(String(v.id_oferta))) : (vacancies || []);

  if (!visibleJobs.length) {
    container.innerHTML = `
      <div class="jobs-loading">
        <span class="material-symbols-outlined">${onlySaved ? 'bookmark_border' : 'work_off'}</span>
        <p>${onlySaved ? 'Aún no tienes empleos guardados.' : 'Aún no hay vacantes activas publicadas por las empresas.'}</p>
      </div>
    `;
    return;
  }

  const fallbackLogo = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEN3Hrty16niOb5EqSw3ZS-Sss3iopV6f7bmMWpTK0v0nLcuGLPz6jzlJxBpTsaTLXYSqrrownRpj34VqN05sUzP3q7Mo7kvDsQ1EVSPQffKW6z4fUPpDSWLmMNQWXcvNlZpADHigEuvlmuRZtqtlQNyspnpB2pAWIjWecrykbHi_2JdUN_D_9AQE49YpyNzPoL4BzmvXkJfj1rtPugk1SE_ln8uM0EBrb78dNW6U0MElwhp69aNAmW8_0UoZ3FZiTbg';

  if (!groupByCategory) {
    container.innerHTML = visibleJobs.map(vacancy => {
      const id = String(vacancy.id_oferta);
      const saved = savedJobs.has(id);
      const skills = String(vacancy.habilidades_requeridas || '')
        .split(/[,;\n]/)
        .map(skill => skill.trim())
        .filter(Boolean)
        .slice(0, 3);
      const tags = [vacancy.categoria, ...skills].filter(Boolean);
      const companyLogo = vacancy.logo || fallbackLogo;
      const companyName = vacancy.nombre_empresa || 'Empresa Confidencial';

      return `
        <article class="job-item" data-job-id="${vacancy.id_oferta}">
          <div class="job-main">
            <div class="job-logo">
              <img src="${escapeHtml(companyLogo)}" alt="${escapeHtml(companyName)}" onerror="this.src='${fallbackLogo}'">
            </div>
            <div class="job-info">
              <h3>${escapeHtml(vacancy.cargo)}</h3>
              <p>${escapeHtml(companyName)}</p>
              <div class="job-tags">
                ${tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}
              </div>
            </div>
          </div>
          <div class="job-actions">
            <button class="btn-primary-sm" type="button">Ver Detalle</button>
            <button class="save-job-btn ${saved ? 'saved' : ''}" type="button" data-job-id="${vacancy.id_oferta}" aria-label="${saved ? 'Quitar vacante guardada' : 'Guardar vacante'}">
              <span class="material-symbols-outlined">${saved ? 'bookmark' : 'bookmark_border'}</span>
              <span>${saved ? 'Guardado' : 'Guardar'}</span>
            </button>
            <span class="job-time">${formatJobDate(vacancy.fecha_publicacion)}</span>
          </div>
        </article>
      `;
    }).join('');

    initJobCards();
    initAnimations();
    return;
  }

  const groups = visibleJobs.reduce((acc, vacancy) => {
    const key = (vacancy.categoria || 'General').trim() || 'General';
    if (!acc[key]) acc[key] = [];
    acc[key].push(vacancy);
    return acc;
  }, {});

  container.innerHTML = Object.entries(groups).map(([category, jobs]) => `
    <div class="jobs-category-group">
      <div class="jobs-category-header">
        <h3>${escapeHtml(category)}</h3>
        <span>${jobs.length}</span>
      </div>
      <div class="jobs-category-list">
        ${jobs.map(vacancy => {
          const id = String(vacancy.id_oferta);
          const saved = savedJobs.has(id);
          const skills = String(vacancy.habilidades_requeridas || '')
            .split(/[,;\n]/)
            .map(skill => skill.trim())
            .filter(Boolean)
            .slice(0, 3);
          const tags = [vacancy.categoria, ...skills].filter(Boolean);
          const companyLogo = vacancy.logo || fallbackLogo;
          const companyName = vacancy.nombre_empresa || 'Empresa Confidencial';

          return `
            <article class="job-item" data-job-id="${vacancy.id_oferta}">
              <div class="job-main">
                <div class="job-logo">
                  <img src="${escapeHtml(companyLogo)}" alt="${escapeHtml(companyName)}" onerror="this.src='${fallbackLogo}'">
                </div>
                <div class="job-info">
                  <h3>${escapeHtml(vacancy.cargo)}</h3>
                  <p>${escapeHtml(companyName)}</p>
                  <div class="job-tags">
                    ${tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}
                  </div>
                </div>
              </div>
              <div class="job-actions">
                <button class="btn-primary-sm" type="button">Ver Detalle</button>
                <button class="save-job-btn ${saved ? 'saved' : ''}" type="button" data-job-id="${vacancy.id_oferta}" aria-label="${saved ? 'Quitar vacante guardada' : 'Guardar vacante'}">
                  <span class="material-symbols-outlined">${saved ? 'bookmark' : 'bookmark_border'}</span>
                  <span>${saved ? 'Guardado' : 'Guardar'}</span>
                </button>
                <span class="job-time">${formatJobDate(vacancy.fecha_publicacion)}</span>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');

  initJobCards();
  initAnimations();
}

function formatJobDate(value) {
  if (!value) return 'Reciente';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return 'Fecha reciente';
  return `Publicado el ${date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`;
}

/* ============================================
   JOB CARDS INTERACTIONS & MODAL
   ============================================ */

function initJobCards() {
  const jobList = document.getElementById('jobList');
  if (!jobList) return;

  jobList.querySelectorAll('.job-item').forEach(card => {
    // Click en la card completa
    card.addEventListener('click', () => {
      const jobId = card.dataset.jobId;
      openVacancyDetail(jobId);
    });

    // Botón "Ver Detalle"
    const btn = card.querySelector('.btn-primary-sm');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const jobId = card.dataset.jobId;
        openVacancyDetail(jobId);
      });
    }

    // Botón de guardar empleo
    const saveBtn = card.querySelector('.save-job-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const jobId = saveBtn.dataset.jobId;
        toggleSavedJob(jobId);
      });
    }
  });

  initVacancyModalEvents();
}

function initVacancyModalEvents() {
  const modal = document.getElementById('vacancyDetailModal');
  const closeBtn = document.getElementById('closeVacancyDetailModal');
  const footerCloseBtn = document.getElementById('closeDetailBtn');

  if (!modal) return;

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  closeBtn?.addEventListener('click', closeModal);
  footerCloseBtn?.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
}

function openVacancyDetail(jobId) {
  const vacancy = currentVacancies.find(v => String(v.id_oferta) === String(jobId));
  if (!vacancy) {
    showToast('No se encontró información de la vacante', 'error');
    return;
  }

  const modal = document.getElementById('vacancyDetailModal');
  if (!modal) return;

  const fallbackLogo = 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEN3Hrty16niOb5EqSw3ZS-Sss3iopV6f7bmMWpTK0v0nLcuGLPz6jzlJxBpTsaTLXYSqrrownRpj34VqN05sUzP3q7Mo7kvDsQ1EVSPQffKW6z4fUPpDSWLmMNQWXcvNlZpADHigEuvlmuRZtqtlQNyspnpB2pAWIjWecrykbHi_2JdUN_D_9AQE49YpyNzPoL4BzmvXkJfj1rtPugk1SE_ln8uM0EBrb78dNW6U0MElwhp69aNAmW8_0UoZ3FZiTbg';

  const logoEl = document.getElementById('detailCompanyLogo');
  const titleEl = document.getElementById('detailJobTitle');
  const companyEl = document.getElementById('detailCompanyName');
  const categoryEl = document.getElementById('detailCategory');
  const dateEl = document.getElementById('detailDate');
  const descEl = document.getElementById('detailDescription');
  const skillsEl = document.getElementById('detailSkills');
  const expEl = document.getElementById('detailExperience');
  const contactEl = document.getElementById('detailContactInfo');

  if (logoEl) {
    logoEl.src = vacancy.logo || fallbackLogo;
    logoEl.alt = vacancy.nombre_empresa || 'Empresa';
  }
  if (titleEl) titleEl.textContent = vacancy.cargo || 'Vacante';
  if (companyEl) companyEl.textContent = vacancy.nombre_empresa || 'Empresa Confidencial';
  
  if (categoryEl) {
    categoryEl.innerHTML = `<span class="material-symbols-outlined">category</span> ${escapeHtml(vacancy.categoria || 'General')}`;
  }
  if (dateEl) {
    dateEl.innerHTML = `<span class="material-symbols-outlined">schedule</span> ${formatJobDate(vacancy.fecha_publicacion)}`;
  }

  if (descEl) {
    descEl.textContent = vacancy.descripcion || 'Sin descripción detallada.';
  }

  if (skillsEl) {
    const rawSkills = String(vacancy.habilidades_requeridas || '')
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(Boolean);

    if (rawSkills.length > 0) {
      skillsEl.innerHTML = rawSkills
        .map(skill => `<span class="detail-skill-tag">${escapeHtml(skill)}</span>`)
        .join('');
    } else {
      skillsEl.innerHTML = '<span class="detail-text">No se especificaron habilidades particulares.</span>';
    }
  }

  if (expEl) {
    expEl.textContent = vacancy.experiencia_requerida || 'No se requiere experiencia previa o no especificada.';
  }

  if (contactEl) {
    const contactRaw = vacancy.datos_contacto || 'No se registraron datos de contacto.';
    const emailMatch = contactRaw.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = contactRaw.match(/(\+?\d[\d -]{7,}\d)/);

    let actionsHtml = '';
    if (emailMatch) {
      actionsHtml += `<a href="mailto:${emailMatch[0]}?subject=Postulaci%C3%B3n%20para%20${encodeURIComponent(vacancy.cargo)}" class="btn-contact-action"><span class="material-symbols-outlined">mail</span> Enviar correo</a>`;
    }
    if (phoneMatch) {
      const cleanPhone = phoneMatch[0].replace(/\D/g, '');
      actionsHtml += `<a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener noreferrer" class="btn-contact-action"><span class="material-symbols-outlined">chat</span> Contactar por WhatsApp</a>`;
    }

    contactEl.innerHTML = `
      <div>${escapeHtml(contactRaw)}</div>
      ${actionsHtml ? `<div class="contact-actions">${actionsHtml}</div>` : ''}
    `;
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

/* ============================================
   PERFIL DEL POSTULANTE / EMPLEADO (MODAL & UPDATE)
   ============================================ */

function initProfileModal() {
  const modal = document.getElementById('applicantProfileModal');
  const closeBtn = document.getElementById('closeApplicantProfileModal');
  const cancelBtn = document.getElementById('cancelApplicantProfile');
  const form = document.getElementById('applicantProfileForm');
  const photoInput = document.getElementById('profilePhotoInput');
  const photoPreview = document.getElementById('profilePhotoPreview');

  if (!modal) return;

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });

  // Preview de foto en tiempo real
  if (photoInput && photoPreview) {
    photoInput.addEventListener('change', () => {
      const file = photoInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          photoPreview.src = e.target.result;
          const label = document.getElementById('profilePhotoLabel');
          if (label) label.textContent = `Nueva foto seleccionada: ${file.name}`;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Triggers para abrir el modal de perfil
  const triggers = [
    document.getElementById('userAvatarBtn'),
    document.getElementById('sidebarProfileBtn'),
    document.getElementById('sidebarSettingsBtn'),
    document.getElementById('completionCard'),
    document.getElementById('completionAction'),
    document.getElementById('bottomProfileBtn')
  ];

  triggers.forEach(btn => {
    btn?.addEventListener('click', (e) => {
      e.preventDefault();
      openApplicantProfileModal();
    });
  });

  // Triggers enfocados en Hoja de Vida
  const cvTriggers = [
    document.getElementById('sidebarCvBtn'),
    document.getElementById('newCvBtn'),
    document.getElementById('bottomCvBtn')
  ];

  cvTriggers.forEach(btn => {
    btn?.addEventListener('click', (e) => {
      e.preventDefault();
      openApplicantProfileModal(true);
    });
  });

  // Envío del formulario
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('saveApplicantProfile');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-symbols-outlined">sync</span> Guardando...';
      }

      try {
        const formData = new FormData(form);
        const res = await fetch('php/perfil_postulante.php', {
          method: 'POST',
          body: formData
        });
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.message || 'Error al guardar los cambios');
        }

        showToast(result.message || 'Perfil actualizado exitosamente', 'success');

        // Invalidar caché para forzar recarga en la próxima apertura
        _cachedProfileData = null;

        // Actualizar datos locales y UI
        if (result.data) {
          renderUser({
            ...currentUserData,
            nombre: result.data.nombre_completo.split(' ')[0],
            nombre_completo: result.data.nombre_completo,
            correo: result.data.correo,
            foto: result.data.foto || currentUserData?.foto,
            perfil_completado: result.data.perfil_completado
          });
        }

        closeModal();
      } catch (err) {
        console.error('Error guardando perfil:', err);
        showToast(err.message || 'Error al conectar con el servidor', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  }
}

/**
 * Carga categorías en el selector de perfil (con caché en memoria)
 */
async function loadCategoriesIntoSelect() {
  const select = document.getElementById('profileCategory');
  if (!select) return;

  try {
    // Usar categorías cacheadas si ya están disponibles
    if (!_cachedCategories) {
      const res = await fetch('php/categorias.php');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        _cachedCategories = data.data;
      }
    }
    if (_cachedCategories) {
      const currentValue = select.dataset.selected || '';
      select.innerHTML = '<option value="">Selecciona tu área o sector...</option>' +
        _cachedCategories.map(cat => `
          <option value="${cat.id_categoria}" ${String(cat.id_categoria) === String(currentValue) ? 'selected' : ''}>
            ${escapeHtml(cat.nombre)}
          </option>
        `).join('');
    }
  } catch (err) {
    console.error('Error cargando categorías:', err);
  }
}

/**
 * Rellena los campos del formulario de perfil con los datos dados.
 */
function _fillProfileForm(p) {
  const fallbackPhoto = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGF39068ZsKH6PfCL0I-mj6qbC3hf9i3RVeP6zlkZcmeWG7_3hIdqrhdgKs9oj85-hgT4JHFEElJ0qHB9MalbICxMd0tPVzerCrXFk0ZJT9XVP-1cIE4gpZnUZP4p0yeUNU3zuMysW8andOrZAeYrrw30nULtU6TPsHAKCmj_ttyIGYZb-gn_dzGBDUg-nF0bL0rCgH9Am2qrrZESTKlK5drdCQPycZLMmLp_JcBy-VfViJaP6PXWg';

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  set('profileFullName', p.nombre_completo);
  set('profileEmail', p.correo);
  set('profilePhone', p.telefono);
  set('profileJobProfession', p.cargo_profesion);
  set('profileTargetRole', p.cargo_interes);
  set('profileDescription', p.descripcion_profesional);
  set('profileExperience', p.experiencia);
  set('profileSkills', p.habilidades);

  const category = document.getElementById('profileCategory');
  if (category && p.id_categoria) {
    category.dataset.selected = p.id_categoria;
    category.value = p.id_categoria;
  }

  const photoPreview = document.getElementById('profilePhotoPreview');
  const photoLabel = document.getElementById('profilePhotoLabel');
  if (photoPreview) photoPreview.src = p.foto_perfil || fallbackPhoto;
  if (photoLabel) photoLabel.textContent = p.foto_perfil ? 'Foto de perfil actual.' : 'Sin foto personalizada aún.';

  const cvContainer = document.getElementById('currentCvContainer');
  const cvName = document.getElementById('currentCvName');
  const cvLink = document.getElementById('currentCvLink');
  if (p.cv_nombre && p.cv_ruta) {
    if (cvContainer) cvContainer.style.display = 'flex';
    if (cvName) cvName.textContent = p.cv_nombre;
    if (cvLink) cvLink.href = p.cv_ruta;
  } else {
    if (cvContainer) cvContainer.style.display = 'none';
  }
}

/**
 * Abre y rellena el modal de edición de perfil.
 * Usa caché en memoria para que reabrirlo sea instantáneo.
 */
async function openApplicantProfileModal(focusCv = false) {
  const modal = document.getElementById('applicantProfileModal');
  if (!modal) return;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  const profileForm = document.getElementById('applicantProfileForm');
  const profileSubmit = document.getElementById('saveApplicantProfile');

  // Si ya tenemos datos en caché, rellenar inmediatamente sin deshabilitar el botón
  if (_cachedProfileData) {
    _fillProfileForm(_cachedProfileData);
    // Actualizar categorías si ya están cacheadas (sin petición de red)
    loadCategoriesIntoSelect();
  } else {
    // Primera vez: deshabilitar el formulario mientras carga
    profileForm?.setAttribute('aria-busy', 'true');
    if (profileSubmit) profileSubmit.disabled = true;

    try {
      const [profileResponse] = await Promise.all([
        fetch('php/perfil_postulante.php'),
        loadCategoriesIntoSelect()
      ]);
      const result = await profileResponse.json();

      if (profileResponse.ok && result.success && result.data) {
        _cachedProfileData = result.data;   // Guardar en caché
        _fillProfileForm(result.data);
      }
    } catch (err) {
      console.error('Error cargando datos del perfil:', err);
    } finally {
      profileForm?.removeAttribute('aria-busy');
      if (profileSubmit) profileSubmit.disabled = false;
    }
  }

  if (focusCv) {
    setTimeout(() => {
      const cvInput = document.getElementById('profileCvInput');
      cvInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      cvInput?.focus();
    }, 200);
  }
}

/* ============================================
   ANIMATIONS ON LOAD
   ============================================ */

function initAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.job-item, .widget, .completion-card').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`;
    observer.observe(el);
  });
}

/* ============================================
   TOAST NOTIFICATION
   ============================================ */

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastInner = document.getElementById('toastInner');
  const toastIcon = document.getElementById('toastIcon');
  const toastMessage = document.getElementById('toastMessage');

  if (!toast || !toastInner || !toastMessage) return;

  toastMessage.textContent = message;
  toastIcon.textContent = type === 'success' ? 'check_circle' : 'error';
  toastInner.className = 'toast-inner ' + type;

  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
