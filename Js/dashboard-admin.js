/**
 * ============================================================
 * EMPLEOJOVEN — DASHBOARD DE ADMINISTRACIÓN (JAVASCRIPT)
 * ============================================================
 */

let cachedUsers = [];
let cachedOffers = [];
let cachedCategories = [];
let cachedEvents = [];
let confirmCallback = null;

document.addEventListener('DOMContentLoaded', () => {
  checkAdminSession();
  initSidebarNavigation();
  initTabPanels();
  initRefreshButton();
  initUsersSection();
  initOffersSection();
  initCategoriesSection();
  initEventsSection();
  initModals();
  initLogout();
});

/* ============================================================
   1. AUTH & SESSION CHECK
   ============================================================ */
async function checkAdminSession() {
  try {
    const res = await fetch('php/session.php');
    const data = await res.json();

    if (!data.loggedIn || !data.user || data.user.tipo_usuario !== 'admin') {
      window.location.href = 'index.html';
      return;
    }

    renderAdminInfo(data.user);
    loadAllDashboardData();
  } catch (err) {
    console.error('Error verificando sesión de admin:', err);
    window.location.href = 'index.html';
  }
}

function renderAdminInfo(user) {
  const nameEl = document.getElementById('adminUserName');
  const emailEl = document.getElementById('adminUserEmail');
  if (nameEl) nameEl.textContent = user.nombre || 'Administrador';
  if (emailEl) emailEl.textContent = user.correo || 'admin@empleojoven.com';
}

function loadAllDashboardData() {
  loadDashboardStats();
  loadUsers();
  loadOffers();
  loadCategories();
  loadEvents();
}

function initRefreshButton() {
  document.getElementById('refreshDataBtn')?.addEventListener('click', () => {
    loadAllDashboardData();
    showToast('Datos actualizados en tiempo real', 'success');
  });
}

/* ============================================================
   2. SIDEBAR & TAB NAVIGATION
   ============================================================ */
function initSidebarNavigation() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggleBtn = document.getElementById('sidebarToggle');
  const closeBtn = document.getElementById('sidebarCloseBtn');

  if (!sidebar) return;

  const openSidebar = () => {
    sidebar.classList.add('open');
    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeSidebar = () => {
    sidebar.classList.remove('open');
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  };

  toggleBtn?.addEventListener('click', openSidebar);
  closeBtn?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) closeSidebar();
  });
}

function initTabPanels() {
  const links = document.querySelectorAll('.sidebar-link[data-tab]');
  const panels = {
    resumen: document.getElementById('tabResumen'),
    usuarios: document.getElementById('tabUsuarios'),
    ofertas: document.getElementById('tabOfertas'),
    categorias: document.getElementById('tabCategorias'),
    eventos: document.getElementById('tabEventos')
  };

  const titles = {
    resumen: 'Resumen General',
    usuarios: 'Gestión de Usuarios',
    ofertas: 'Moderación de Ofertas Laborales',
    categorias: 'Gestión de Categorías',
    eventos: 'Gestión de Eventos'
  };

  function switchTab(tabId) {
    if (!panels[tabId]) return;

    links.forEach(link => {
      link.classList.toggle('active', link.dataset.tab === tabId);
    });

    Object.keys(panels).forEach(key => {
      if (panels[key]) {
        panels[key].classList.toggle('active', key === tabId);
      }
    });

    const titleEl = document.getElementById('topbarViewTitle');
    if (titleEl) titleEl.textContent = titles[tabId] || 'Panel de Administración';

    // Cierre en móvil
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth < 1024 && sidebar?.classList.contains('open')) {
      document.getElementById('sidebarCloseBtn')?.click();
    }
  }

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.dataset.tab;
      window.location.hash = tab;
      switchTab(tab);
    });
  });

  // Cargar pestaña inicial basada en hash
  const initialHash = window.location.hash.replace('#', '') || 'resumen';
  switchTab(initialHash);
}

/* ============================================================
   3. SECCIÓN: RESUMEN / STATS
   ============================================================ */
async function loadDashboardStats() {
  try {
    const res = await fetch('php/admin_stats.php');
    const result = await res.json();

    if (!res.ok || !result.success) throw new Error(result.message);

    const s = result.data.stats;
    const catDist = result.data.ofertas_por_categoria || [];
    const recentUsers = result.data.ultimos_usuarios || [];

    // KPI Counters
    document.getElementById('kpiTotalUsers').textContent = s.total_usuarios;
    document.getElementById('kpiUsersSub').textContent = `${s.total_postulantes} postulantes • ${s.total_empresas} empresas`;

    document.getElementById('kpiPostulantes').textContent = s.total_postulantes;
    document.getElementById('kpiCvsSub').textContent = `${s.total_cvs} Hojas de vida activas`;

    document.getElementById('kpiEmpresas').textContent = s.total_empresas;

    document.getElementById('kpiTotalOffers').textContent = s.total_ofertas;
    document.getElementById('kpiOffersSub').textContent = `${s.ofertas_activas} Activas • ${s.ofertas_cerradas} Cerradas`;

    // Sidebar Pills
    const countUsersSb = document.getElementById('countUsersSidebar');
    const countOffersSb = document.getElementById('countOffersSidebar');
    if (countUsersSb) countUsersSb.textContent = s.total_usuarios;
    if (countOffersSb) countOffersSb.textContent = s.total_ofertas;

    // Category Distribution Progress Bars
    const catContainer = document.getElementById('categoryDistributionList');
    if (catContainer) {
      if (catDist.length === 0) {
        catContainer.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;">Sin ofertas registradas todavía.</p>';
      } else {
        const maxOffers = Math.max(...catDist.map(c => Number(c.total_ofertas) || 1));
        catContainer.innerHTML = catDist.map(c => {
          const count = Number(c.total_ofertas) || 0;
          const pct = Math.round((count / maxOffers) * 100);
          return `
            <div class="category-dist-item">
              <div class="category-dist-info">
                <span>${escapeHtml(c.categoria)}</span>
                <span style="color:var(--primary);">${count} ${count === 1 ? 'oferta' : 'ofertas'}</span>
              </div>
              <div class="category-dist-bar-wrap">
                <div class="category-dist-bar" style="width: ${pct}%;"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Recent Users Activity
    const actContainer = document.getElementById('recentActivityList');
    if (actContainer) {
      if (recentUsers.length === 0) {
        actContainer.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem;">Sin usuarios recientes.</p>';
      } else {
        actContainer.innerHTML = recentUsers.map(u => {
          const icon = u.tipo_usuario === 'empresa' ? 'domain' : (u.tipo_usuario === 'persona' ? 'school' : 'shield_person');
          const dateStr = formatDateShort(u.fecha_creacion);
          return `
            <div class="recent-activity-row">
              <div class="activity-user-info">
                <div class="activity-avatar">
                  <span class="material-symbols-outlined" style="font-size:20px;">${icon}</span>
                </div>
                <div>
                  <div class="activity-title">${escapeHtml(u.nombre_identificador || u.correo)}</div>
                  <div class="activity-subtitle">${escapeHtml(u.correo)}</div>
                </div>
              </div>
              <span class="badge-role ${u.tipo_usuario}">${u.tipo_usuario}</span>
            </div>
          `;
        }).join('');
      }
    }

  } catch (err) {
    console.error('Error cargando estadísticas de admin:', err);
  }
}

/* ============================================
   4. SECCIÓN: GESTIÓN DE USUARIOS
   ============================================ */
function initUsersSection() {
  const searchInput = document.getElementById('userSearchInput');
  const roleFilter = document.getElementById('userRoleFilter');
  const statusFilter = document.getElementById('userStatusFilter');

  let searchTimeout = null;
  const triggerUserSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadUsers();
    }, 250);
  };

  searchInput?.addEventListener('input', triggerUserSearch);
  roleFilter?.addEventListener('change', loadUsers);
  statusFilter?.addEventListener('change', loadUsers);
}

async function loadUsers() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  const q = document.getElementById('userSearchInput')?.value || '';
  const tipo = document.getElementById('userRoleFilter')?.value || 'todos';
  const activo = document.getElementById('userStatusFilter')?.value || 'todos';

  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (tipo !== 'todos') params.append('tipo', tipo);
  if (activo !== 'todos') params.append('activo', activo);

  try {
    const res = await fetch(`php/admin_usuarios.php?${params.toString()}`);
    const result = await res.json();

    if (!res.ok || !result.success) throw new Error(result.message);

    cachedUsers = result.data || [];
    renderUsersTable(cachedUsers);
  } catch (err) {
    console.error('Error cargando usuarios:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-6" style="color:var(--danger);text-align:center;">
          No fue posible cargar el listado de usuarios.
        </td>
      </tr>
    `;
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:40px 20px;color:var(--text-muted);">
          <span class="material-symbols-outlined" style="font-size:40px;display:block;margin-bottom:8px;">group_off</span>
          No se encontraron usuarios con los filtros seleccionados.
        </td>
      </tr>
    `;
    return;
  }

  const fallbackAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGF39068ZsKH6PfCL0I-mj6qbC3hf9i3RVeP6zlkZcmeWG7_3hIdqrhdgKs9oj85-hgT4JHFEElJ0qHB9MalbICxMd0tPVzerCrXFk0ZJT9XVP-1cIE4gpZnUZP4p0yeUNU3zuMysW8andOrZAeYrrw30nULtU6TPsHAKCmj_ttyIGYZb-gn_dzGBDUg-nF0bL0rCgH9Am2qrrZESTKlK5drdCQPycZLMmLp_JcBy-VfViJaP6PXWg';

  tbody.innerHTML = users.map(u => {
    const isActive = Number(u.activo) === 1;
    const photo = u.foto_perfil || u.logo || fallbackAvatar;
    const phone = u.tel_persona || u.tel_empresa || 'Sin registrar';
    const roleIcon = u.tipo_usuario === 'persona' ? 'school' : (u.tipo_usuario === 'empresa' ? 'domain' : 'shield_person');

    return `
      <tr data-user-id="${u.id_usuario}">
        <td>
          <div class="user-cell">
            <img src="${escapeHtml(photo)}" alt="${escapeHtml(u.nombre)}" class="user-avatar-img" onerror="this.src='${fallbackAvatar}'">
            <div>
              <div class="user-cell-name">${escapeHtml(u.nombre)}</div>
              <div class="user-cell-email">${escapeHtml(u.correo)}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge-role ${u.tipo_usuario}">
            <span class="material-symbols-outlined" style="font-size:14px;">${roleIcon}</span>
            ${u.tipo_usuario}
          </span>
        </td>
        <td>
          <span style="font-size:0.84rem;">${escapeHtml(phone)}</span>
        </td>
        <td>
          <span style="font-size:0.82rem;color:var(--text-muted);">${formatDateShort(u.fecha_creacion)}</span>
        </td>
        <td>
          <span class="badge-status ${isActive ? 'active' : 'inactive'}">
            <span class="badge-dot"></span>
            ${isActive ? 'Activo' : 'Suspendido'}
          </span>
        </td>
        <td>
          <div class="table-actions-cell">
            <button type="button" class="btn-action-icon btn-view-user" data-id="${u.id_usuario}" title="Ver detalles completos">
              <span class="material-symbols-outlined" style="font-size:18px;">visibility</span>
            </button>
            ${u.tipo_usuario !== 'admin' ? `
              <button type="button" class="btn-action-icon ${isActive ? 'text-danger' : 'text-success'} btn-toggle-user" data-id="${u.id_usuario}" data-status="${isActive ? 0 : 1}" title="${isActive ? 'Suspender cuenta' : 'Activar cuenta'}">
                <span class="material-symbols-outlined" style="font-size:18px;">${isActive ? 'block' : 'check_circle'}</span>
              </button>
              <button type="button" class="btn-action-icon text-danger btn-delete-user" data-id="${u.id_usuario}" data-name="${escapeHtml(u.nombre)}" title="Eliminar cuenta">
                <span class="material-symbols-outlined" style="font-size:18px;">delete</span>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Event Listeners for actions
  tbody.querySelectorAll('.btn-view-user').forEach(btn => {
    btn.addEventListener('click', () => openUserDetailModal(btn.dataset.id));
  });

  tbody.querySelectorAll('.btn-toggle-user').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const nextStatus = Number(btn.dataset.status);
      toggleUserStatus(id, nextStatus);
    });
  });

  tbody.querySelectorAll('.btn-delete-user').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      openConfirmModal(
        '¿Eliminar Usuario?',
        `¿Estás seguro de que deseas eliminar a <strong>${name}</strong>? Se borrarán permanentemente todos sus datos, hojas de vida y publicaciones vinculadas.`,
        () => deleteUser(id)
      );
    });
  });
}

function openUserDetailModal(userId) {
  const user = cachedUsers.find(u => String(u.id_usuario) === String(userId));
  if (!user) return;

  const modal = document.getElementById('userDetailModal');
  const avatar = document.getElementById('modalUserAvatar');
  const name = document.getElementById('modalUserName');
  const subtitle = document.getElementById('modalUserSubtitle');
  const content = document.getElementById('modalUserContent');

  const fallbackAvatar = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGF39068ZsKH6PfCL0I-mj6qbC3hf9i3RVeP6zlkZcmeWG7_3hIdqrhdgKs9oj85-hgT4JHFEElJ0qHB9MalbICxMd0tPVzerCrXFk0ZJT9XVP-1cIE4gpZnUZP4p0yeUNU3zuMysW8andOrZAeYrrw30nULtU6TPsHAKCmj_ttyIGYZb-gn_dzGBDUg-nF0bL0rCgH9Am2qrrZESTKlK5drdCQPycZLMmLp_JcBy-VfViJaP6PXWg';

  avatar.src = user.foto_perfil || user.logo || fallbackAvatar;
  name.textContent = user.nombre;
  subtitle.textContent = `Rol: ${user.tipo_usuario.toUpperCase()} • ${user.correo}`;

  let bodyHtml = `
    <div class="detail-grid-row">
      <div class="detail-field-box">
        <div class="detail-field-label">Correo Electrónico</div>
        <div class="detail-field-value">${escapeHtml(user.correo)}</div>
      </div>
      <div class="detail-field-box">
        <div class="detail-field-label">Teléfono</div>
        <div class="detail-field-value">${escapeHtml(user.tel_persona || user.tel_empresa || 'No registrado')}</div>
      </div>
    </div>
    <div class="detail-grid-row">
      <div class="detail-field-box">
        <div class="detail-field-label">Categoría / Sector</div>
        <div class="detail-field-value">${escapeHtml(user.categoria_nombre || 'General')}</div>
      </div>
      <div class="detail-field-box">
        <div class="detail-field-label">Fecha de Registro</div>
        <div class="detail-field-value">${formatDateLong(user.fecha_creacion)}</div>
      </div>
    </div>
  `;

  if (user.tipo_usuario === 'persona') {
    bodyHtml += `
      <div class="detail-section-title"><span class="material-symbols-outlined">badge</span> Perfil Profesional</div>
      <div class="detail-field-box" style="margin-bottom:12px;">
        <div class="detail-field-label">Cargo / Profesión</div>
        <div class="detail-field-value">${escapeHtml(user.cargo_profesion || 'No especificado')}</div>
      </div>
      ${user.descripcion_profesional ? `
        <div class="detail-field-box" style="margin-bottom:12px;">
          <div class="detail-field-label">Descripción Profesional</div>
          <div class="detail-field-value">${escapeHtml(user.descripcion_profesional)}</div>
        </div>
      ` : ''}
      ${user.cv_nombre && user.cv_ruta ? `
        <div class="detail-section-title"><span class="material-symbols-outlined">description</span> Hoja de Vida (CV)</div>
        <div class="detail-field-box" style="display:flex;align-items:center;justify-content:space-between;">
          <span>${escapeHtml(user.cv_nombre)}</span>
          <a href="${escapeHtml(user.cv_ruta)}" target="_blank" class="btn-primary" style="padding:6px 14px;font-size:0.82rem;">
            <span class="material-symbols-outlined" style="font-size:16px;">download</span> Descargar CV
          </a>
        </div>
      ` : ''}
    `;
  } else if (user.tipo_usuario === 'empresa') {
    bodyHtml += `
      <div class="detail-section-title"><span class="material-symbols-outlined">business</span> Información Empresarial</div>
      <div class="detail-field-box">
        <div class="detail-field-label">Descripción de la Empresa</div>
        <div class="detail-field-value">${escapeHtml(user.desc_empresa || 'Sin descripción empresarial.')}</div>
      </div>
    `;
  }

  content.innerHTML = bodyHtml;
  openModal('userDetailModal');
}

async function toggleUserStatus(userId, newStatus) {
  try {
    const res = await fetch('php/admin_usuarios.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_status', id_usuario: userId, activo: newStatus })
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.message);

    showToast(result.message, 'success');
    loadUsers();
    loadDashboardStats();
  } catch (err) {
    showToast(err.message || 'Error al cambiar estado', 'error');
  }
}

async function deleteUser(userId) {
  try {
    const res = await fetch('php/admin_usuarios.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_user', id_usuario: userId })
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.message);

    showToast(result.message, 'success');
    loadUsers();
    loadOffers();
    loadDashboardStats();
  } catch (err) {
    showToast(err.message || 'Error al eliminar usuario', 'error');
  }
}

/* ============================================
   5. SECCIÓN: MODERACIÓN DE OFERTAS
   ============================================ */
function initOffersSection() {
  const searchInput = document.getElementById('offerSearchInput');
  const statusFilter = document.getElementById('offerStatusFilter');
  const categoryFilter = document.getElementById('offerCategoryFilter');

  let searchTimeout = null;
  const triggerOfferSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadOffers();
    }, 250);
  };

  searchInput?.addEventListener('input', triggerOfferSearch);
  statusFilter?.addEventListener('change', loadOffers);
  categoryFilter?.addEventListener('change', loadOffers);
}

async function loadOffers() {
  const tbody = document.getElementById('offersTableBody');
  if (!tbody) return;

  const q = document.getElementById('offerSearchInput')?.value || '';
  const estado = document.getElementById('offerStatusFilter')?.value || 'todos';
  const idCat = document.getElementById('offerCategoryFilter')?.value || '';

  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (estado !== 'todos') params.append('estado', estado);
  if (idCat) params.append('id_categoria', idCat);

  try {
    const res = await fetch(`php/admin_ofertas.php?${params.toString()}`);
    const result = await res.json();

    if (!res.ok || !result.success) throw new Error(result.message);

    cachedOffers = result.data || [];
    renderOffersTable(cachedOffers);
  } catch (err) {
    console.error('Error cargando ofertas:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-6" style="color:var(--danger);text-align:center;">
          No fue posible cargar las ofertas laborales.
        </td>
      </tr>
    `;
  }
}

function renderOffersTable(offers) {
  const tbody = document.getElementById('offersTableBody');
  if (!tbody) return;

  if (offers.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:40px 20px;color:var(--text-muted);">
          <span class="material-symbols-outlined" style="font-size:40px;display:block;margin-bottom:8px;">work_off</span>
          No se encontraron ofertas laborales con los filtros seleccionados.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = offers.map(o => {
    const isActive = o.estado === 'activa';
    return `
      <tr data-offer-id="${o.id_oferta}">
        <td>
          <div>
            <div style="font-weight:700;color:var(--text-primary);">${escapeHtml(o.cargo)}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);">${escapeHtml(o.nombre_empresa)}</div>
          </div>
        </td>
        <td>
          <span style="font-size:0.86rem;color:var(--primary-hover);font-weight:700;">${escapeHtml(o.categoria_nombre)}</span>
        </td>
        <td>
          <span style="font-size:0.82rem;color:var(--text-muted);">${formatDateShort(o.fecha_publicacion)}</span>
        </td>
        <td>
          <span style="font-size:0.82rem;">${escapeHtml(o.correo_empresa || o.datos_contacto)}</span>
        </td>
        <td>
          <span class="badge-status ${isActive ? 'active' : 'inactive'}">
            <span class="badge-dot"></span>
            ${isActive ? 'Activa' : 'Cerrada'}
          </span>
        </td>
        <td>
          <div class="table-actions-cell">
            <button type="button" class="btn-action-icon btn-view-offer" data-id="${o.id_oferta}" title="Ver vacante completa">
              <span class="material-symbols-outlined" style="font-size:18px;">visibility</span>
            </button>
            <button type="button" class="btn-action-icon ${isActive ? 'text-danger' : 'text-success'} btn-toggle-offer" data-id="${o.id_oferta}" data-status="${isActive ? 'cerrada' : 'activa'}" title="${isActive ? 'Cerrar vacante' : 'Activar vacante'}">
              <span class="material-symbols-outlined" style="font-size:18px;">${isActive ? 'lock' : 'lock_open'}</span>
            </button>
            <button type="button" class="btn-action-icon text-danger btn-delete-offer" data-id="${o.id_oferta}" data-title="${escapeHtml(o.cargo)}" title="Eliminar oferta">
              <span class="material-symbols-outlined" style="font-size:18px;">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-view-offer').forEach(btn => {
    btn.addEventListener('click', () => openOfferDetailModal(btn.dataset.id));
  });

  tbody.querySelectorAll('.btn-toggle-offer').forEach(btn => {
    btn.addEventListener('click', () => {
      toggleOfferStatus(btn.dataset.id, btn.dataset.status);
    });
  });

  tbody.querySelectorAll('.btn-delete-offer').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const title = btn.dataset.title;
      openConfirmModal(
        '¿Eliminar Oferta Laboral?',
        `¿Confirmas la eliminación definitiva de la vacante <strong>${title}</strong>?`,
        () => deleteOffer(id)
      );
    });
  });
}

function openOfferDetailModal(offerId) {
  const offer = cachedOffers.find(o => String(o.id_oferta) === String(offerId));
  if (!offer) return;

  document.getElementById('modalOfferTitle').textContent = offer.cargo;
  document.getElementById('modalOfferCompany').textContent = `Publicado por: ${offer.nombre_empresa} • Estado: ${offer.estado.toUpperCase()}`;

  const content = document.getElementById('modalOfferContent');
  content.innerHTML = `
    <div class="detail-grid-row">
      <div class="detail-field-box">
        <div class="detail-field-label">Categoría</div>
        <div class="detail-field-value">${escapeHtml(offer.categoria_nombre)}</div>
      </div>
      <div class="detail-field-box">
        <div class="detail-field-label">Fecha de Publicación</div>
        <div class="detail-field-value">${formatDateLong(offer.fecha_publicacion)}</div>
      </div>
    </div>
    <div class="detail-section-title"><span class="material-symbols-outlined">description</span> Descripción</div>
    <div class="detail-field-box" style="margin-bottom:14px;">
      <div class="detail-field-value" style="white-space:pre-line;">${escapeHtml(offer.descripcion)}</div>
    </div>
    <div class="detail-section-title"><span class="material-symbols-outlined">psychology</span> Habilidades Requeridas</div>
    <div class="detail-field-box" style="margin-bottom:14px;">
      <div class="detail-field-value">${escapeHtml(offer.habilidades_requeridas || 'Sin habilidades especificadas')}</div>
    </div>
    <div class="detail-section-title"><span class="material-symbols-outlined">workspace_premium</span> Experiencia Requerida</div>
    <div class="detail-field-box" style="margin-bottom:14px;">
      <div class="detail-field-value">${escapeHtml(offer.experiencia_requerida || 'Sin experiencia mínima')}</div>
    </div>
    <div class="detail-section-title"><span class="material-symbols-outlined">contact_mail</span> Datos de Contacto</div>
    <div class="detail-field-box">
      <div class="detail-field-value" style="white-space:pre-line;">${escapeHtml(offer.datos_contacto)}</div>
    </div>
  `;

  openModal('offerDetailModal');
}

async function toggleOfferStatus(offerId, newStatus) {
  try {
    const res = await fetch('php/admin_ofertas.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_status', id_oferta: offerId, estado: newStatus })
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.message);

    showToast(result.message, 'success');
    loadOffers();
    loadDashboardStats();
  } catch (err) {
    showToast(err.message || 'Error al cambiar estado de la oferta', 'error');
  }
}

async function deleteOffer(offerId) {
  try {
    const res = await fetch('php/admin_ofertas.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_offer', id_oferta: offerId })
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.message);

    showToast(result.message, 'success');
    loadOffers();
    loadDashboardStats();
  } catch (err) {
    showToast(err.message || 'Error al eliminar oferta', 'error');
  }
}

/* ============================================
   6. SECCIÓN: GESTIÓN DE CATEGORÍAS
   ============================================ */
function initCategoriesSection() {
  document.getElementById('btnOpenNewCategoryModal')?.addEventListener('click', () => {
    document.getElementById('categoryModalTitle').textContent = 'Nueva Categoría';
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryDesc').value = '';
    document.getElementById('categoryActive').checked = true;
    openModal('categoryModal');
  });

  const form = document.getElementById('categoryForm');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('categoryId').value;
    const nombre = document.getElementById('categoryName').value.trim();
    const descripcion = document.getElementById('categoryDesc').value.trim();
    const activo = document.getElementById('categoryActive').checked ? 1 : 0;

    const action = id ? 'update' : 'create';
    const payload = { action, id_categoria: id ? Number(id) : undefined, nombre, descripcion, activo };

    try {
      const res = await fetch('php/admin_categorias.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message);

      showToast(result.message, 'success');
      closeModal('categoryModal');
      loadCategories();
      loadDashboardStats();
    } catch (err) {
      showToast(err.message || 'Error al guardar categoría', 'error');
    }
  });
}

async function loadCategories() {
  const tbody = document.getElementById('categoriesTableBody');
  const selectFilter = document.getElementById('offerCategoryFilter');
  if (!tbody) return;

  try {
    const res = await fetch('php/admin_categorias.php');
    const result = await res.json();

    if (!res.ok || !result.success) throw new Error(result.message);

    cachedCategories = result.data || [];
    renderCategoriesTable(cachedCategories);

    // Actualizar select de filtro de ofertas
    if (selectFilter) {
      const current = selectFilter.value;
      selectFilter.innerHTML = '<option value="">Todas las categorías</option>' + cachedCategories.map(c => `
        <option value="${c.id_categoria}" ${String(c.id_categoria) === String(current) ? 'selected' : ''}>
          ${escapeHtml(c.nombre)}
        </option>
      `).join('');
    }

  } catch (err) {
    console.error('Error cargando categorías:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-6" style="color:var(--danger);text-align:center;">
          No fue posible cargar las categorías.
        </td>
      </tr>
    `;
  }
}

function renderCategoriesTable(categories) {
  const tbody = document.getElementById('categoriesTableBody');
  if (!tbody) return;

  if (categories.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:40px 20px;color:var(--text-muted);">
          Sin categorías registradas.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = categories.map(c => {
    const isActive = Number(c.activo) === 1;
    const totalOffers = Number(c.total_ofertas) || 0;
    const activeOffers = Number(c.ofertas_activas) || 0;

    return `
      <tr data-category-id="${c.id_categoria}">
        <td>
          <span style="font-weight:700;color:var(--text-primary);">${escapeHtml(c.nombre)}</span>
        </td>
        <td>
          <span style="font-size:0.84rem;color:var(--text-secondary);">${escapeHtml(c.descripcion || 'Sin descripción')}</span>
        </td>
        <td>
          <span style="font-weight:700;">${activeOffers} activas <small style="color:var(--text-muted);">(${totalOffers} total)</small></span>
        </td>
        <td>
          <span style="font-size:0.85rem;">${c.total_postulantes || 0} candidatos</span>
        </td>
        <td>
          <span class="badge-status ${isActive ? 'active' : 'inactive'}">
            <span class="badge-dot"></span>
            ${isActive ? 'Activa' : 'Inactiva'}
          </span>
        </td>
        <td>
          <div class="table-actions-cell">
            <button type="button" class="btn-action-icon btn-edit-category" data-id="${c.id_categoria}" title="Editar categoría">
              <span class="material-symbols-outlined" style="font-size:18px;">edit</span>
            </button>
            <button type="button" class="btn-action-icon ${isActive ? 'text-danger' : 'text-success'} btn-toggle-category" data-id="${c.id_categoria}" data-status="${isActive ? 0 : 1}" title="${isActive ? 'Desactivar categoría' : 'Activar categoría'}">
              <span class="material-symbols-outlined" style="font-size:18px;">${isActive ? 'visibility_off' : 'visibility'}</span>
            </button>
            <button type="button" class="btn-action-icon text-danger btn-delete-category" data-id="${c.id_categoria}" data-name="${escapeHtml(c.nombre)}" title="Eliminar categoría">
              <span class="material-symbols-outlined" style="font-size:18px;">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-edit-category').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = cachedCategories.find(c => String(c.id_categoria) === String(btn.dataset.id));
      if (!cat) return;
      document.getElementById('categoryModalTitle').textContent = 'Editar Categoría';
      document.getElementById('categoryId').value = cat.id_categoria;
      document.getElementById('categoryName').value = cat.nombre;
      document.getElementById('categoryDesc').value = cat.descripcion || '';
      document.getElementById('categoryActive').checked = Number(cat.activo) === 1;
      openModal('categoryModal');
    });
  });

  tbody.querySelectorAll('.btn-toggle-category').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const nextStatus = Number(btn.dataset.status);
      try {
        const res = await fetch('php/admin_categorias.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'toggle_status', id_categoria: id, activo: nextStatus })
        });
        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message);

        showToast(result.message, 'success');
        loadCategories();
      } catch (err) {
        showToast(err.message || 'Error al cambiar estado', 'error');
      }
    });
  });

  tbody.querySelectorAll('.btn-delete-category').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      openConfirmModal(
        '¿Eliminar Categoría?',
        `¿Confirmas la eliminación de la categoría <strong>${name}</strong>?`,
        async () => {
          try {
            const res = await fetch('php/admin_categorias.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'delete', id_categoria: id })
            });
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.message);

            showToast(result.message, 'success');
            loadCategories();
            loadDashboardStats();
          } catch (err) {
            showToast(err.message || 'Error al eliminar categoría', 'error');
          }
        }
      );
    });
  });
}

/* ============================================
   7. SECCIÓN: GESTIÓN DE EVENTOS
   ============================================ */
function initEventsSection() {
  const form = document.getElementById('eventForm');
  const resetForm = () => {
    form?.reset();
    document.getElementById('eventId').value = '';
    document.getElementById('eventModalTitle').textContent = 'Nuevo Evento';
    document.getElementById('eventActive').checked = true;
  };

  document.getElementById('btnOpenNewEventModal')?.addEventListener('click', () => { resetForm(); openModal('eventModal'); });
  document.getElementById('eventSearchInput')?.addEventListener('input', loadEvents);
  document.getElementById('eventStatusFilter')?.addEventListener('change', loadEvents);
  document.getElementById('eventModalityFilter')?.addEventListener('change', loadEvents);
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = document.getElementById('eventId').value;
    const payload = {
      action: id ? 'update' : 'create', id_evento: id ? Number(id) : undefined,
      titulo: document.getElementById('eventTitle').value.trim(), tipo_evento: document.getElementById('eventType').value.trim(),
      descripcion: document.getElementById('eventDescription').value.trim(), fecha_evento: document.getElementById('eventDate').value.replace('T', ' '),
      modalidad: document.getElementById('eventModality').value, ubicacion_enlace: document.getElementById('eventLocation').value.trim(),
      enlace_inscripcion: document.getElementById('eventRegistration').value.trim(), organizador: document.getElementById('eventOrganizer').value.trim(),
      activo: document.getElementById('eventActive').checked ? 1 : 0
    };
    try {
      const response = await fetch('php/admin_eventos.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);
      closeModal('eventModal'); loadEvents(); showToast(result.message, 'success');
    } catch (error) { showToast(error.message || 'No fue posible guardar el evento', 'error'); }
  });
}

async function loadEvents() {
  const tbody = document.getElementById('eventsTableBody');
  if (!tbody) return;
  const params = new URLSearchParams({ q: document.getElementById('eventSearchInput')?.value || '', activo: document.getElementById('eventStatusFilter')?.value || 'todos', modalidad: document.getElementById('eventModalityFilter')?.value || 'todos' });
  try {
    const response = await fetch(`php/admin_eventos.php?${params}`); const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message);
    cachedEvents = result.data || [];
    const activeCount = cachedEvents.filter(item => Number(item.activo) === 1).length;
    document.getElementById('countEventsSidebar').textContent = activeCount;
    renderEventsTable();
  } catch (error) { tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6">${escapeHtml(error.message || 'No fue posible cargar eventos')}</td></tr>`; }
}

function renderEventsTable() {
  const tbody = document.getElementById('eventsTableBody');
  if (!tbody) return;
  if (!cachedEvents.length) { tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6">No hay eventos que coincidan con los filtros.</td></tr>'; return; }
  tbody.innerHTML = cachedEvents.map(event => {
    const active = Number(event.activo) === 1;
    return `<tr><td><strong>${escapeHtml(event.titulo)}</strong><br><small>${escapeHtml(event.tipo_evento)}</small></td><td>${escapeHtml(event.modalidad)}</td><td>${formatDateLong(event.fecha_evento)}</td><td>${escapeHtml(event.organizador || 'EmpleoJoven')}</td><td><span class="badge-status ${active ? 'active' : 'inactive'}"><span class="badge-dot"></span>${active ? 'Activo' : 'Oculto'}</span></td><td><div class="table-actions-cell"><button class="btn-action-icon btn-edit-event" data-id="${event.id_evento}" title="Editar"><span class="material-symbols-outlined">edit</span></button><button class="btn-action-icon ${active ? 'text-danger' : 'text-success'} btn-toggle-event" data-id="${event.id_evento}" data-status="${active ? 0 : 1}" title="Cambiar visibilidad"><span class="material-symbols-outlined">${active ? 'visibility_off' : 'visibility'}</span></button><button class="btn-action-icon text-danger btn-delete-event" data-id="${event.id_evento}" title="Eliminar"><span class="material-symbols-outlined">delete</span></button></div></td></tr>`;
  }).join('');
  tbody.querySelectorAll('.btn-edit-event').forEach(button => button.addEventListener('click', () => editEvent(button.dataset.id)));
  tbody.querySelectorAll('.btn-toggle-event').forEach(button => button.addEventListener('click', () => changeEventStatus(button.dataset.id, Number(button.dataset.status))));
  tbody.querySelectorAll('.btn-delete-event').forEach(button => button.addEventListener('click', () => deleteEvent(button.dataset.id)));
}

function editEvent(id) {
  const event = cachedEvents.find(item => String(item.id_evento) === String(id)); if (!event) return;
  document.getElementById('eventModalTitle').textContent = 'Editar Evento'; document.getElementById('eventId').value = event.id_evento;
  document.getElementById('eventTitle').value = event.titulo; document.getElementById('eventType').value = event.tipo_evento;
  document.getElementById('eventDescription').value = event.descripcion; document.getElementById('eventDate').value = String(event.fecha_evento).replace(' ', 'T').slice(0, 16);
  document.getElementById('eventModality').value = event.modalidad; document.getElementById('eventLocation').value = event.ubicacion_enlace || '';
  document.getElementById('eventRegistration').value = event.enlace_inscripcion || ''; document.getElementById('eventOrganizer').value = event.organizador || '';
  document.getElementById('eventActive').checked = Number(event.activo) === 1; openModal('eventModal');
}

async function eventAction(payload) {
  const response = await fetch('php/admin_eventos.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.message); showToast(result.message, 'success'); loadEvents();
}
function changeEventStatus(id, activo) { eventAction({ action: 'toggle_status', id_evento: Number(id), activo }).catch(error => showToast(error.message, 'error')); }
function deleteEvent(id) { openConfirmModal('¿Eliminar evento?', 'Esta acción no se puede deshacer.', () => eventAction({ action: 'delete', id_evento: Number(id) }).catch(error => showToast(error.message, 'error'))); }

/* ============================================
   8. MODAL UTILITIES
   ============================================ */
function initModals() {
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        closeModal(backdrop.id);
      }
    });
  });

  document.querySelectorAll('.modal-close-btn, #closeUserDetailBtn, #closeOfferDetailBtn, #cancelCategoryBtn, #cancelEventBtn, #confirmCancelBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-backdrop');
      if (modal) closeModal(modal.id);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-backdrop.open').forEach(modal => closeModal(modal.id));
    }
  });

  // Confirm accept button
  document.getElementById('confirmAcceptBtn')?.addEventListener('click', () => {
    if (typeof confirmCallback === 'function') {
      confirmCallback();
    }
    closeModal('confirmModal');
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function openConfirmModal(title, message, onConfirm) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').innerHTML = message;
  confirmCallback = onConfirm;
  openModal('confirmModal');
}

/* ============================================
   8. LOGOUT
   ============================================ */
function initLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await fetch('php/logout.php', { method: 'POST', cache: 'no-store' });
    } catch {
    }
    window.location.replace(new URL('index.html', document.baseURI).href);
  });
}

/* ============================================
   9. HELPER UTILITIES
   ============================================ */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text ?? '');
  return div.innerHTML;
}

function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(String(dateStr).replace(' ', 'T'));
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function formatDateLong(dateStr) {
  if (!dateStr) return 'No registrada';
  const d = new Date(String(dateStr).replace(' ', 'T'));
  if (isNaN(d.getTime())) return 'No registrada';
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

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
  }, 3200);
}