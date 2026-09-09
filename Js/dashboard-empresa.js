/**
 * ============================================================
 * EMPLEOJOVEN — DASHBOARD EMPRESA
 * ============================================================
 * Este archivo controla toda la lógica interactiva del panel
 * de empresas: filtrado de candidatos, búsqueda en tiempo real,
 * guardar favoritos, publicar vacantes y comunicación con PHP.
 * ============================================================
 */

// Espera a que el DOM esté completamente cargado antes de ejecutar
// cualquier script. Esto evita errores al intentar seleccionar
// elementos que aún no existen en la página.
document.addEventListener('DOMContentLoaded', () => {
  checkSession();        // 1. Verifica que la empresa esté logueada
  initSidebar();         // 2. Configura el sidebar (toggle en móvil)
  loadCandidates();      // 3. Carga los candidatos reales desde el backend
  initSearch();          // 4. Activa la búsqueda en tiempo real
  initCategoryFilter();  // 5. Configura los pills de categoría
  initBookmarks();       // 6. Activa el botón de guardar candidatos
  initVacancyActions();  // 7. Agrega interacción a las vacantes
  initVacancyEditor();   // 8. Permite ver, editar y cerrar vacantes
  initPublishJob();      // 9. Configura el botón "Publicar vacante"
  initCompanyProfile();  // 10. Configura la edición del perfil empresarial
  initAnimations();      // 11. Activa animaciones de entrada
  initLogout();          // 12. Conecta el cierre de sesión
});


/* ============================================================
   1. CHECK SESSION
   Verifica si hay una sesión activa de empresa.
   Si no hay sesión, redirige al login.
   Si hay sesión, carga los datos de la empresa en la UI.
   ============================================================ */

async function checkSession() {
  try {
    const res = await fetch('php/session.php');
    const data = await res.json();

    if (!data.loggedIn || !data.user || data.user.tipo_usuario !== 'empresa') {
      window.location.href = 'index.html';
      return;
    }

    renderCompany(data.user);
    companyProfileNeedsCompletion = Number(data.user.perfil_completado || 0) < 100;
    window.dispatchEvent(new CustomEvent('company-profile-status', {
      detail: { needsCompletion: companyProfileNeedsCompletion }
    }));
  } catch (err) {
    console.error('Error verificando sesión:', err);
    window.location.href = 'index.html';
  }
}

/**
 * Renderiza los datos de la empresa en el sidebar.
 * Actualiza: nombre, plan y foto de perfil.
 */
function renderCompany(company) {
  const nameEl = document.getElementById('companyName');
  const planEl = document.getElementById('companyPlan');
  const avatarEl = document.getElementById('companyAvatar');
  const titleEl = document.getElementById('pageTitle');
  const subtitleEl = document.getElementById('pageSubtitle');

  if (nameEl) nameEl.textContent = company.nombre || 'Empresa';
  if (planEl) planEl.textContent = company.plan || 'Cuenta Empresarial';
  if (avatarEl) {
    avatarEl.src = company.foto || '';
    avatarEl.alt = company.nombre || 'Empresa';
  }

  // Actualiza también el título y subtítulo de la página
  if (titleEl) {
    titleEl.textContent = 'Panel de Control';
  }
  if (subtitleEl) {
    subtitleEl.textContent = `Resumen general y búsqueda de talento para ${company.nombre}.`;
  }
}


/* ============================================================
   2. SIDEBAR
   Controla la apertura/cierre del sidebar en dispositivos
   móviles mediante el botón hamburguesa del header y overlay.
   En desktop el sidebar siempre está visible.
   ============================================================ */

let loadedCandidates = [];
let companyProfileNeedsCompletion = false;

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const menuToggle = document.getElementById('menuToggle');
  const closeBtn = document.getElementById('sidebarCloseBtn');

  if (!sidebar || !overlay || !menuToggle) {
    console.warn('Sidebar: faltan elementos del DOM');
    return;
  }

  const openSidebar = () => {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    document.body.classList.add('sidebar-open');
  };

  const closeSidebar = () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.classList.remove('sidebar-open');
  };

  // Toggle al hacer click en el botón hamburguesa del header
  menuToggle.addEventListener('click', () => {
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  // Botón 'X' dentro del sidebar en móvil
  closeBtn?.addEventListener('click', closeSidebar);

  // Cierra el sidebar al hacer click en el overlay oscuro
  overlay.addEventListener('click', closeSidebar);

  // Cierra el sidebar al navegar a un link (solo en móvil)
  sidebar.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 1024) {
        closeSidebar();
      }
    });
  });

  // Cierra el sidebar al redimensionar a desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      closeSidebar();
    }
  });
}

/* ============================================================
   3. SEARCH (Búsqueda en tiempo real)
   ============================================================ */

function initSearch() {
  const searchInput = document.getElementById('candidateSearch');
  const grid = document.getElementById('candidatesGrid');
  const noResults = document.getElementById('noResults');

  if (!searchInput || !grid) return;

  function normalize(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  searchInput.addEventListener('input', () => {
    const query = normalize(searchInput.value);
    let visibleCount = 0;
    const cards = [...grid.querySelectorAll('.candidate-card')];

    cards.forEach(card => {
      const cardText = normalize(card.textContent);
      const isMatch = cardText.includes(query);
      card.style.display = isMatch ? '' : 'none';
      if (isMatch) visibleCount++;
    });

    if (visibleCount === 0 && query.length > 0) {
      noResults?.classList.remove('hidden');
    } else {
      noResults?.classList.add('hidden');
    }
  });
}


/* ============================================================
   4. CATEGORY FILTER (Pills de categoría)
   ============================================================ */

function initCategoryFilter() {
  const pillsContainer = document.getElementById('filterPills');
  if (!pillsContainer) return;
  loadFilterPills(pillsContainer);
}

async function loadFilterPills(container) {
  try {
    const response = await fetch('php/categorias.php');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message);

    // Conservar el pill 'Todos' y añadir categorías dinámicas
    const existingPills = container.querySelectorAll('.pill:not([data-category="todos"])');
    existingPills.forEach(p => p.remove());

    result.data.forEach(category => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'pill';
      pill.dataset.category = categoryKey(category.nombre);
      pill.textContent = category.nombre;
      container.appendChild(pill);
    });

    initCategoryFilterListeners();
  } catch (error) {
    console.error('Error cargando categorías para filtros:', error);
  }
}

function initCategoryFilterListeners() {
  const pillsContainer = document.getElementById('filterPills');
  const grid = document.getElementById('candidatesGrid');
  if (!pillsContainer || !grid) return;

  const pills = pillsContainer.querySelectorAll('.pill');

  pills.forEach(pill => {
    const newPill = pill.cloneNode(true);
    pill.parentNode.replaceChild(newPill, pill);

    newPill.addEventListener('click', () => {
      pillsContainer.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      newPill.classList.add('active');

      const selectedCat = newPill.dataset.category;
      const cards = [...grid.querySelectorAll('.candidate-card')];
      let visibleCount = 0;

      cards.forEach(card => {
        if (selectedCat === 'todos') {
          card.style.display = '';
          visibleCount++;
        } else {
          const cardCategories = card.dataset.categories || '';
          const isMatch = cardCategories.includes(selectedCat);
          card.style.display = isMatch ? '' : 'none';
          if (isMatch) visibleCount++;
        }
      });

      const noResults = document.getElementById('noResults');
      if (visibleCount === 0) {
        noResults?.classList.remove('hidden');
      } else {
        noResults?.classList.add('hidden');
      }

      const searchInput = document.getElementById('candidateSearch');
      if (searchInput) searchInput.value = '';
    });
  });
}

function categoryKey(name) {
  return String(name).toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}


/* ============================================================
   5. CARGA DINÁMICA DE CANDIDATOS DESDE BACKEND
   ============================================================ */

async function loadCandidates() {
  const grid = document.getElementById('candidatesGrid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="candidates-loading">
      <span class="material-symbols-outlined">sync</span>
      <p>Cargando candidatos disponibles...</p>
    </div>
  `;

  try {
    const res = await fetch('php/candidatos.php');
    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Error al obtener candidatos');
    }

    loadedCandidates = result.data || [];
    renderCandidates(loadedCandidates);
  } catch (err) {
    console.error('Error cargando candidatos:', err);
    grid.innerHTML = `
      <div class="candidates-loading">
        <span class="material-symbols-outlined" style="animation:none;">error_outline</span>
        <p>No fue posible cargar los candidatos en este momento.</p>
      </div>
    `;
  }
}

function renderCandidates(candidates) {
  const grid = document.getElementById('candidatesGrid');
  const noResults = document.getElementById('noResults');
  if (!grid) return;

  if (!candidates || candidates.length === 0) {
    grid.innerHTML = `
      <div class="candidates-loading">
        <span class="material-symbols-outlined" style="animation:none;">group_off</span>
        <p>Aún no hay candidatos o postulantes registrados en la plataforma.</p>
      </div>
    `;
    noResults?.classList.add('hidden');
    return;
  }

  noResults?.classList.add('hidden');

  const fallbackPhoto = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGF39068ZsKH6PfCL0I-mj6qbC3hf9i3RVeP6zlkZcmeWG7_3hIdqrhdgKs9oj85-hgT4JHFEElJ0qHB9MalbICxMd0tPVzerCrXFk0ZJT9XVP-1cIE4gpZnUZP4p0yeUNU3zuMysW8andOrZAeYrrw30nULtU6TPsHAKCmj_ttyIGYZb-gn_dzGBDUg-nF0bL0rCgH9Am2qrrZESTKlK5drdCQPycZLMmLp_JcBy-VfViJaP6PXWg';

  grid.innerHTML = candidates.map(candidate => {
    const photo = candidate.foto_perfil || fallbackPhoto;
    const catSlug = categoryKey(candidate.categoria_nombre || 'general');
    
    // Extraer habilidades como tags
    const rawSkills = String(candidate.habilidades || '')
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 3);

    const skillsHtml = rawSkills.length > 0 
      ? rawSkills.map(skill => `<span>${escapeHtml(skill)}</span>`).join('')
      : `<span>${escapeHtml(candidate.categoria_nombre || 'General')}</span>`;

    const locationText = candidate.telefono ? `Tel: ${escapeHtml(candidate.telefono)}` : escapeHtml(candidate.correo);

    return `
      <article class="candidate-card" data-categories="${catSlug}" data-id="${candidate.id_usuario}">
        <div class="candidate-header">
          <div class="candidate-photo">
            <img src="${escapeHtml(photo)}" alt="${escapeHtml(candidate.nombre_completo)}" onerror="this.src='${fallbackPhoto}'">
          </div>
          <div class="candidate-meta">
            <h3>${escapeHtml(candidate.nombre_completo)}</h3>
            <p>${escapeHtml(candidate.cargo_profesion)}</p>
            <div class="candidate-location">
              <span class="material-symbols-outlined">badge</span>
              <span>${locationText}</span>
            </div>
          </div>
          <button class="bookmark-btn" data-candidate="${candidate.id_usuario}" aria-label="Guardar candidato">
            <span class="material-symbols-outlined">bookmark_border</span>
          </button>
        </div>
        <div class="candidate-skills">
          ${skillsHtml}
        </div>
        <button type="button" class="btn-view-cv">Ver CV Completo</button>
      </article>
    `;
  }).join('');

  initCandidateCardActions();
  initBookmarks();
}

function initCandidateCardActions() {
  const grid = document.getElementById('candidatesGrid');
  if (!grid) return;

  grid.querySelectorAll('.candidate-card').forEach(card => {
    // Click en toda la tarjeta
    card.addEventListener('click', (e) => {
      if (e.target.closest('.bookmark-btn')) return;
      const candidateId = card.dataset.id;
      openCandidateDetail(candidateId);
    });

    // Click en botón "Ver CV Completo"
    const btn = card.querySelector('.btn-view-cv');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const candidateId = card.dataset.id;
        openCandidateDetail(candidateId);
      });
    }
  });

  initCandidateModal();
}

/* ============================================================
   6. MODAL DE DETALLE Y CV DEL CANDIDATO
   ============================================================ */

function initCandidateModal() {
  const modal = document.getElementById('candidateDetailModal');
  const closeBtn = document.getElementById('closeCandidateDetailModal');
  const footerCloseBtn = document.getElementById('closeCandidateDetailBtn');

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

function openCandidateDetail(candidateId) {
  const candidate = loadedCandidates.find(c => String(c.id_usuario) === String(candidateId));
  if (!candidate) {
    showToast('No se encontró la información del candidato', 'error');
    return;
  }

  const modal = document.getElementById('candidateDetailModal');
  if (!modal) return;

  const fallbackPhoto = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGF39068ZsKH6PfCL0I-mj6qbC3hf9i3RVeP6zlkZcmeWG7_3hIdqrhdgKs9oj85-hgT4JHFEElJ0qHB9MalbICxMd0tPVzerCrXFk0ZJT9XVP-1cIE4gpZnUZP4p0yeUNU3zuMysW8andOrZAeYrrw30nULtU6TPsHAKCmj_ttyIGYZb-gn_dzGBDUg-nF0bL0rCgH9Am2qrrZESTKlK5drdCQPycZLMmLp_JcBy-VfViJaP6PXWg';

  const photoEl = document.getElementById('candidateDetailPhoto');
  const nameEl = document.getElementById('candidateDetailName');
  const roleEl = document.getElementById('candidateDetailRole');
  const contactBarEl = document.getElementById('candidateContactBar');
  const categoryEl = document.getElementById('candidateDetailCategory');
  const targetRoleEl = document.getElementById('candidateDetailTargetRole');
  const descEl = document.getElementById('candidateDetailDescription');
  const expEl = document.getElementById('candidateDetailExperience');
  const skillsEl = document.getElementById('candidateDetailSkills');
  const cvCard = document.getElementById('candidateCvCard');
  const cvFilename = document.getElementById('candidateCvFilename');
  const cvDownloadBtn = document.getElementById('candidateCvDownloadBtn');
  const noCvText = document.getElementById('candidateNoCvText');

  if (photoEl) {
    photoEl.src = candidate.foto_perfil || fallbackPhoto;
    photoEl.alt = candidate.nombre_completo;
  }
  if (nameEl) nameEl.textContent = candidate.nombre_completo || 'Candidato';
  if (roleEl) roleEl.textContent = candidate.cargo_profesion || 'Profesional disponible';

  // Barra de contacto
  if (contactBarEl) {
    let linksHtml = `<a href="mailto:${encodeURIComponent(candidate.correo)}" class="candidate-contact-link"><span class="material-symbols-outlined">mail</span> ${escapeHtml(candidate.correo)}</a>`;

    if (candidate.telefono) {
      const cleanPhone = candidate.telefono.replace(/\D/g, '');
      linksHtml += `<a href="tel:${escapeHtml(candidate.telefono)}" class="candidate-contact-link"><span class="material-symbols-outlined">call</span> ${escapeHtml(candidate.telefono)}</a>`;
      if (cleanPhone) {
        linksHtml += `<a href="https://wa.me/${cleanPhone}" target="_blank" rel="noopener noreferrer" class="candidate-contact-link btn-whatsapp"><span class="material-symbols-outlined">chat</span> WhatsApp</a>`;
      }
    }
    contactBarEl.innerHTML = linksHtml;
  }

  // Categoría & Cargo de interés
  if (categoryEl) {
    categoryEl.textContent = `Área: ${candidate.categoria_nombre || 'General'}`;
  }
  if (targetRoleEl) {
    targetRoleEl.textContent = `Interés: ${candidate.cargo_interes || candidate.cargo_profesion || 'General'}`;
  }

  // Descripción
  if (descEl) {
    descEl.textContent = candidate.descripcion_profesional || 'El candidato aún no ha añadido un resumen profesional.';
  }

  // Experiencia
  if (expEl) {
    expEl.textContent = candidate.experiencia || 'No registra experiencia laboral previa o no especificada.';
  }

  // Habilidades
  if (skillsEl) {
    const rawSkills = String(candidate.habilidades || '')
      .split(/[,;\n]/)
      .map(s => s.trim())
      .filter(Boolean);

    if (rawSkills.length > 0) {
      skillsEl.innerHTML = rawSkills
        .map(skill => `<span class="candidate-skill-chip">${escapeHtml(skill)}</span>`)
        .join('');
    } else {
      skillsEl.innerHTML = '<span class="candidate-detail-text">Sin habilidades específicas listadas.</span>';
    }
  }

  // Hoja de vida adjunta
  if (candidate.cv_nombre && candidate.cv_ruta) {
    if (cvCard) cvCard.style.display = 'flex';
    if (noCvText) noCvText.style.display = 'none';
    if (cvFilename) cvFilename.textContent = candidate.cv_nombre;
    if (cvDownloadBtn) cvDownloadBtn.href = candidate.cv_ruta;
  } else {
    if (cvCard) cvCard.style.display = 'none';
    if (noCvText) noCvText.style.display = 'block';
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text ?? '');
  return div.innerHTML;
}

function getSavedCandidates() {
  try {
    const saved = JSON.parse(localStorage.getItem('savedCandidates') || '[]');
    return Array.isArray(saved) ? saved.map(String) : [];
  } catch {
    return [];
  }
}

function updateSavedCandidatesCounter() {
  const counter = document.getElementById('savedCandidatesCount');
  if (!counter) return;

  const saved = getSavedCandidates();
  counter.textContent = String(saved.length);
}

function syncSavedCandidateButtons() {
  const saved = new Set(getSavedCandidates());

  document.querySelectorAll('.bookmark-btn').forEach(btn => {
    const candidateId = String(btn.dataset.candidate || '');
    const icon = btn.querySelector('.material-symbols-outlined');
    const isSaved = saved.has(candidateId);

    btn.classList.toggle('saved', isSaved);
    if (icon) {
      icon.textContent = isSaved ? 'bookmark' : 'bookmark_border';
      icon.style.fontVariationSettings = isSaved ? "'FILL' 1" : "'FILL' 0";
    }
  });

  updateSavedCandidatesCounter();
}

let isShowingSavedOnly = false;

function initBookmarks() {
  syncSavedCandidateButtons();

  // Enlace del sidebar: Filtrar candidatos guardados
  const savedLink = document.getElementById('savedCandidatesLink');
  if (savedLink && savedLink.dataset.bookmarksBound !== 'true') {
    savedLink.dataset.bookmarksBound = 'true';
    savedLink.addEventListener('click', (e) => {
    e.preventDefault();
    const grid = document.getElementById('candidatesGrid');
    const noResults = document.getElementById('noResults');
    if (!grid) return;

    isShowingSavedOnly = !isShowingSavedOnly;
    savedLink.classList.toggle('active', isShowingSavedOnly);

    const saved = new Set(getSavedCandidates());
    const cards = [...grid.querySelectorAll('.candidate-card')];
    let visibleCount = 0;

    cards.forEach(card => {
      const candidateId = String(card.dataset.id || '');
      const isVisible = !isShowingSavedOnly || saved.has(candidateId);
      card.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount++;
    });

    if (visibleCount === 0) {
      if (noResults) {
        noResults.classList.remove('hidden');
        noResults.querySelector('p').textContent = isShowingSavedOnly
          ? 'No tienes candidatos guardados en favoritos.'
          : 'No encontramos candidatos con esos criterios.';
      }
    } else {
      noResults?.classList.add('hidden');
    }

    // Si estamos en móvil, scrollear suavemente a los candidatos
    if (window.innerWidth < 1024) {
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    });
  }

  document.querySelectorAll('.bookmark-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const icon = btn.querySelector('.material-symbols-outlined');
      const candidateId = String(btn.dataset.candidate || '');
      const currentSaved = getSavedCandidates();
      const updatedSaved = currentSaved.includes(candidateId)
        ? currentSaved.filter(id => id !== candidateId)
        : [...currentSaved, candidateId];

      try {
        localStorage.setItem('savedCandidates', JSON.stringify([...new Set(updatedSaved)]));
      } catch {
        showToast('No se pudo guardar el candidato en este navegador', 'error');
        return;
      }

      const isSaved = updatedSaved.includes(candidateId);
      btn.classList.toggle('saved', isSaved);
      if (icon) {
        icon.textContent = isSaved ? 'bookmark' : 'bookmark_border';
        icon.style.fontVariationSettings = isSaved ? "'FILL' 1" : "'FILL' 0";
      }

      showToast(isSaved ? 'Candidato guardado en Candidatos (CVs)' : 'Candidato eliminado de guardados');
      updateSavedCandidatesCounter();

      // Si actualmente estamos filtrando por guardados, ocultar de inmediato si se desmarca
      if (isShowingSavedOnly && !isSaved) {
        const card = btn.closest('.candidate-card');
        if (card) card.style.display = 'none';
      }
    });
  });
}


/* ============================================================
   6. VACANCY ACTIONS
   Agrega interactividad a la lista de vacantes activas:
   - Click en una vacante muestra detalles
   - Hover effects visuales
   ============================================================ */

let currentVacanciesIncludeAll = false;

function initVacancyActions() {
  const list = document.getElementById('vacanciesList');
  const manageBtn = document.getElementById('manageVacanciesBtn');
  const menuBtn = document.getElementById('myVacanciesBtn');
  if (!list) return;

  list.addEventListener('click', event => {
    const item = event.target.closest('.vacancy-item');
    if (item) openVacancyEditor?.(item.dataset.vacancyId);
  });

  const showVacancies = async includeAll => {
    currentVacanciesIncludeAll = includeAll;
    await loadVacancies(includeAll);
    if (manageBtn) {
      manageBtn.textContent = includeAll ? 'Ver solo vacantes activas' : 'Gestionar todas las vacantes';
    }
  };

  if (manageBtn?.getAttribute('href') === 'mis-vacantes.html') {
    showVacancies(false);
    return;
  }

  manageBtn?.addEventListener('click', event => {
    event.preventDefault();
    showVacancies(!currentVacanciesIncludeAll);
  });

  menuBtn?.addEventListener('click', event => {
    event.preventDefault();
    showVacancies(true);
    document.getElementById('vacanciesArea')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  showVacancies(false);
}

async function loadVacancies(includeAll = false) {
  const list = document.getElementById('vacanciesList');
  const count = document.getElementById('vacanciesCount');
  if (!list || !count) return;

  list.innerHTML = '<div class="vacancies-empty">Cargando vacantes...</div>';

  try {
    const response = await fetch(`php/mis_vacantes.php?todas=${includeAll ? '1' : '0'}`);
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message);

    const vacancies = result.data;
    count.textContent = `${vacancies.length} ${includeAll ? 'Total' : 'Activas'}`;

    if (!vacancies.length) {
      list.innerHTML = `<div class="vacancies-empty"><span class="material-symbols-outlined">work_off</span><p>${includeAll ? 'Aún no has publicado vacantes.' : 'No tienes vacantes activas.'}</p></div>`;
      return;
    }

        list.innerHTML = vacancies.map(vacancy => {
      const isActive = vacancy.estado === 'activa';
      return `<button type="button" class="vacancy-item" data-vacancy-id="${vacancy.id_oferta}" data-vacancy-title="${escapeHtml(vacancy.cargo)}">
        <div class="vacancy-top">
          <div>
            <h3>${escapeHtml(vacancy.cargo)}</h3>
            <span class="vacancy-category">${escapeHtml(vacancy.categoria || 'Sin categoría')}</span>
          </div>
          <span class="status-badge ${isActive ? 'active' : 'review'}">
            ${isActive ? '<span class="status-dot"></span> Activa' : '<span class="material-symbols-outlined" style="font-size:14px;">lock</span> Cerrada'}
          </span>
        </div>
        <div class="vacancy-stats">
          <span class="material-symbols-outlined">calendar_today</span>
          <span>${formatVacancyDate(vacancy.fecha_publicacion)}</span>
        </div>
      </button>`;
    }).join('');
  } catch (error) {
    count.textContent = 'Sin datos';
    list.innerHTML = '<div class="vacancies-empty">No fue posible cargar las vacantes.</div>';
    console.error('Error cargando vacantes:', error);
  }
}

function formatVacancyDate(value) {
  const date = new Date(String(value).replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : `Publicada el ${date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}


/* ============================================================
   7. VACANCY EDITOR
   Permite ver, editar y cerrar una vacante existente.
   ============================================================ */

let openVacancyEditor = null;

function initVacancyEditor() {
  const modal = document.getElementById('vacancyEditorModal');
  const form = document.getElementById('vacancyEditorForm');
  const category = document.getElementById('editVacancyCategory');
  const closeBtn = document.getElementById('closeVacancyBtn');
  const saveBtn = document.getElementById('saveVacancyEditor');

  if (!modal || !form || !category || !closeBtn || !saveBtn) return;

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };

  const loadCategories = async selectedId => {
    const response = await fetch('php/categorias.php');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message);

    category.innerHTML = '<option value="">Selecciona una categoría</option>' + result.data.map(item =>
      `<option value="${item.id_categoria}">${escapeHtml(item.nombre)}</option>`).join('');
    category.value = String(selectedId);
  };

  const save = async (closeOffer = false) => {
    if (!form.reportValidity()) return;
    const payload = Object.fromEntries(new FormData(form).entries());
    if (closeOffer) payload.estado = 'cerrada';

    saveBtn.disabled = true;
    closeBtn.disabled = true;

    try {
      const response = await fetch('php/oferta_empresa.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);

      closeModal();
      await loadVacancies(currentVacanciesIncludeAll);
      showToast(result.message);
    } catch (error) {
      showToast(error.message || 'No fue posible guardar la vacante', 'error');
    } finally {
      saveBtn.disabled = false;
      closeBtn.disabled = false;
    }
  };

  openVacancyEditor = async id => {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');

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
      closeBtn.hidden = vacancy.estado === 'cerrada';
      await loadCategories(vacancy.id_categoria);
    } catch (error) {
      closeModal();
      showToast(error.message || 'No fue posible cargar la vacante', 'error');
    }
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    save();
  });

  closeBtn.addEventListener('click', () => {
    if (window.confirm('¿Deseas cerrar esta vacante? Dejará de mostrarse como activa.')) {
      save(true);
    }
  });

  document.getElementById('closeVacancyEditor')?.addEventListener('click', closeModal);
  document.getElementById('cancelVacancyEditor')?.addEventListener('click', closeModal);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });
}


/* ============================================================
   8. PUBLISH JOB (Publicar nueva vacante)
   Abre un modal para crear una nueva oferta laboral.
   Disponible tanto en el sidebar (desktop) como en el
   botón flotante (móvil).
   ============================================================ */

function initPublishJob() {
  const btnSidebar = document.getElementById('btnPublishJob');
  const btnMobile = document.getElementById('fabMobile');
  const modal = document.getElementById('jobModal');
  const form = document.getElementById('jobForm');
  const categorySelect = document.getElementById('jobCategory');
  const submitBtn = document.getElementById('submitJob');

  if (!modal || !form || !categorySelect) return;

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };

  const handlePublish = async () => {
    try {
      const profileResponse = await fetch('php/perfil_empresa.php');
      const profileResult = await profileResponse.json();
      const profile = profileResult.data || {};
      const profileComplete = profile.nombre_empresa?.trim()
        && profile.correo?.trim()
        && profile.telefono?.trim()
        && profile.descripcion?.trim()
        && profile.id_categoria;

      if (!profileResponse.ok || !profileResult.success || !profileComplete) {
        showToast('Completa los datos de tu empresa antes de publicar una vacante', 'error');
        document.getElementById('companyProfileBtn')?.click();
        return;
      }
    } catch (error) {
      showToast('No fue posible verificar los datos de tu empresa', 'error');
      return;
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('jobTitle')?.focus();

    if (categorySelect.dataset.loaded) return;

    try {
      const response = await fetch('php/categorias.php');
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);

      categorySelect.innerHTML = '<option value="">Selecciona una categoría</option>' + result.data.map(category =>
        `<option value="${category.id_categoria}">${escapeHtml(category.nombre)}</option>`
      ).join('');
      categorySelect.dataset.loaded = 'true';
    } catch (error) {
      categorySelect.innerHTML = '<option value="">No se pudieron cargar las categorías</option>';
      showToast(error.message || 'Error cargando categorías', 'error');
    }
  };

  btnSidebar?.addEventListener('click', handlePublish);
  btnMobile?.addEventListener('click', handlePublish);

  // Apertura automática si la URL incluye #publicar (ej. desde mis-vacantes.html)
  if (window.location.hash === '#publicar') {
    handlePublish();
    history.replaceState(null, document.title, window.location.pathname + window.location.search);
  }

  // Activar botón de filtros para enfocar búsqueda / filtros
  const filterBtn = document.getElementById('filterBtn');
  filterBtn?.addEventListener('click', () => {
    const searchInput = document.getElementById('candidateSearch');
    if (searchInput) {
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  document.getElementById('closeJobModal')?.addEventListener('click', closeModal);
  document.getElementById('cancelJobModal')?.addEventListener('click', closeModal);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const payload = Object.fromEntries(new FormData(form).entries());
    submitBtn.disabled = true;
    submitBtn.textContent = 'Publicando...';

    try {
      const response = await fetch('php/publicar_oferta.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);

      form.reset();
      closeModal();
      loadVacancies();
      showToast('Vacante publicada correctamente');
    } catch (error) {
      showToast(error.message || 'No fue posible publicar la vacante', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Publicar vacante';
    }
  });
}


/* ============================================================
   9. COMPANY PROFILE
   Permite editar el perfil empresarial.
   ============================================================ */

function initCompanyProfile() {
  const openBtn = document.getElementById('companyProfileBtn');
  const modal = document.getElementById('companyProfileModal');
  const form = document.getElementById('companyProfileForm');
  const categorySelect = document.getElementById('profileCompanyCategory');
  const logoInput = document.getElementById('profileCompanyLogo');
  const preview = document.getElementById('profileLogoPreview');
  const emptyPreview = document.getElementById('profileLogoEmpty');
  const saveBtn = document.getElementById('saveCompanyProfile');

  if (!openBtn || !modal || !form || !categorySelect || !logoInput || !preview || !emptyPreview || !saveBtn) return;

  const showLogo = url => {
    if (url) {
      preview.src = url;
      preview.classList.add('visible');
      emptyPreview.hidden = true;
    } else {
      preview.removeAttribute('src');
      preview.classList.remove('visible');
      emptyPreview.hidden = false;
    }
  };

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  };

  const loadCategories = async selectedId => {
    const response = await fetch('php/categorias.php');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message || 'No fue posible cargar las categorías');

    categorySelect.innerHTML = '<option value="">Selecciona una categoría</option>' + result.data.map(category =>
      `<option value="${category.id_categoria}">${escapeHtml(category.nombre)}</option>`).join('');
    categorySelect.value = String(selectedId || '');
  };

  const openModal = async event => {
    event.preventDefault();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');

    try {
      const response = await fetch('php/perfil_empresa.php');
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);

      const profile = result.data;
      document.getElementById('profileCompanyName').value = profile.nombre_empresa || '';
      document.getElementById('profileCompanyEmail').value = profile.correo || '';
      document.getElementById('profileCompanyPhone').value = profile.telefono || '';
      document.getElementById('profileCompanyDescription').value = profile.descripcion || '';
      showLogo(profile.logo || '');
      await loadCategories(profile.id_categoria);
    } catch (error) {
      showToast(error.message || 'No fue posible cargar el perfil', 'error');
    }
  };

  openBtn.addEventListener('click', openModal);

  const promptForCompletion = () => {
    if (!companyProfileNeedsCompletion) return;
    showToast('Completa los datos de tu empresa para poder publicar vacantes', 'error');
    openModal({ preventDefault() {} });
  };

  window.addEventListener('company-profile-status', event => {
    if (event.detail?.needsCompletion) promptForCompletion();
  }, { once: true });

  if (companyProfileNeedsCompletion) {
    setTimeout(promptForCompletion, 0);
  }

  document.getElementById('closeCompanyProfileModal')?.addEventListener('click', closeModal);
  document.getElementById('cancelCompanyProfile')?.addEventListener('click', closeModal);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });

  logoInput.addEventListener('change', () => {
    const file = logoInput.files[0];
    if (file) showLogo(URL.createObjectURL(file));
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';

    try {
      const response = await fetch('php/perfil_empresa.php', {
        method: 'POST',
        body: new FormData(form)
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);

      renderCompany(result.data);
      showLogo(result.data.logo || '');
      companyProfileNeedsCompletion = false;
      showToast('Perfil empresarial guardado correctamente');
      closeModal();
    } catch (error) {
      showToast(error.message || 'No fue posible guardar el perfil', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar perfil';
    }
  });
}


/* ============================================================
   UTILIDAD: escapeHtml
   ============================================================ */

function escapeHtml(value) {
  const element = document.createElement('div');
  element.textContent = value;
  return element.innerHTML;
}


/* ============================================================
   10. ANIMATIONS ON LOAD
   Aplica animaciones de entrada escalonadas a las tarjetas
   de candidatos y al widget de vacantes cuando la página
   carga. Usa IntersectionObserver para detectar cuando los
   elementos entran en el viewport.
   ============================================================ */

function initAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

  // Selecciona todas las tarjetas y les aplica animación escalonada
  document.querySelectorAll('.candidate-card, .vacancy-item').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = `opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`;
    observer.observe(el);
  });
}


/* ============================================================
   TOAST NOTIFICATION
   Muestra un mensaje temporal en la parte inferior de la
   pantalla. Se usa para confirmar acciones al usuario.

   Parámetros:
   - message: texto a mostrar
   - type: 'success' (verde) o 'error' (rojo)
   ============================================================ */

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastInner = document.getElementById('toastInner');
  const toastIcon = document.getElementById('toastIcon');
  const toastMessage = document.getElementById('toastMessage');

  if (!toast || !toastInner || !toastMessage) return;

  // Configura el contenido del toast
  toastMessage.textContent = message;
  toastIcon.textContent = type === 'success' ? 'check_circle' : 'error';
  toastInner.className = 'toast-inner ' + type;

  // Muestra el toast con animación
  toast.classList.add('show');

  // Oculta automáticamente después de 3 segundos
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}


/* ============================================================
   11. LOGOUT
   Cierra la sesión de la empresa y redirige al login.
   ============================================================ */

async function logout() {
  try {
    const res = await fetch('php/logout.php', { method: 'POST' });
    const data = await res.json();

    if (!data.success) {
      showToast(data.message || 'No fue posible cerrar sesión', 'error');
      return;
    }

    showToast('Sesión cerrada. Redirigiendo...');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
    showToast('Error de conexión con el servidor', 'error');
  }
}

function initLogout() {
  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn?.addEventListener('click', (event) => {
    event.preventDefault();
    logout();
  });
}