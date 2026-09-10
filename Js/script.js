/**
 * ============================================
 * EMPLEOJOVEN — INTERACTIVE SCRIPTS
 * ============================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initAuthTabs();
  initRoleCards();
  initPasswordToggles();
  initForms();
  initScrollReveal();
  initSmoothScroll();
  initHeroCarousel();
  initFeaturedJobs();
  initLandingEvents();
  initEventDetailsModal();
  initLandingSearch();
  initRegisterPromptModal();
});

/* ============================================
   MOBILE MENU
   ============================================ */

function initMobileMenu() {
  const btn = document.getElementById('mobileMenuBtn');
  const closeBtn = document.getElementById('closeMobileMenu');
  const menu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('mobileOverlay');

  if (!btn || !menu || !overlay) return;

  const links = menu.querySelectorAll('a');

  function open() {
    menu.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    menu.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay.addEventListener('click', close);
  links.forEach(link => link.addEventListener('click', close));
}

/* ============================================
   FEATURED JOBS — Carga dinámica desde la BD
   ============================================ */

// Íconos por categoría
const CATEGORY_ICONS = {
  'tecnología':       'computer',
  'tecnologia':       'computer',
  'marketing':        'campaign',
  'diseño':           'design_services',
  'diseno':           'design_services',
  'ventas':           'storefront',
  'administración':   'business_center',
  'administracion':   'business_center',
  'salud':            'health_and_safety',
  'educación':        'school',
  'educacion':        'school',
  'logística':        'local_shipping',
  'logistica':        'local_shipping',
  'finanzas':         'account_balance',
  'construcción':     'construction',
  'construccion':     'construction',
};

const ICON_COLORS = ['primary', 'secondary', 'tertiary'];

function getCategoryIcon(categoria) {
  const key = (categoria || '').toLowerCase().trim();
  return CATEGORY_ICONS[key] || 'work';
}

function getTimeSince(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7)  return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} semana${days < 14 ? '' : 's'}`;
  return `Hace ${Math.floor(days / 30)} mes${days < 60 ? '' : 'es'}`;
}

function buildJobCard(job, index) {
  const icon     = getCategoryIcon(job.categoria);
  const colorCls = ICON_COLORS[index % ICON_COLORS.length];
  const delay    = index < 3 ? `reveal-delay-${index + 1}` : '';
  const timeAgo  = getTimeSince(job.fecha_publicacion);

  return `
    <div class="job-card reveal visible ${delay}" data-id="${job.id_oferta}" data-title="${escapeAttr(job.cargo)}" data-company="${escapeAttr(job.nombre_empresa)}">
      <div class="job-card-header">
        <div class="job-icon ${colorCls}">
          <span class="material-symbols-outlined">${icon}</span>
        </div>
        <span class="job-badge fulltime">${escapeHtml(job.categoria)}</span>
      </div>
      <h3>${escapeHtml(job.cargo)}</h3>
      <p class="job-company">${escapeHtml(job.nombre_empresa)}</p>
      ${timeAgo ? `<div class="job-time-ago">${timeAgo}</div>` : ''}
      <button class="job-btn job-btn-apply" aria-label="Ver detalles de ${escapeAttr(job.cargo)}">
        <span class="material-symbols-outlined" style="font-size:17px">lock</span>
        <span>Ver detalles</span>
      </button>
    </div>`;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escapeAttr(str) {
  return String(str ?? '').replace(/"/g,'&quot;');
}

async function initFeaturedJobs() {
  const skeletonGrid = document.getElementById('jobsSkeletonGrid');
  const jobsGrid     = document.getElementById('jobsGrid');
  const noJobsMsg    = document.getElementById('noJobsMessage');

  if (!jobsGrid) return;

  try {
    const res  = await fetch('php/vacantes_publicas.php?limit=6');
    const json = await res.json();

    // Ocultar skeleton
    if (skeletonGrid) skeletonGrid.hidden = true;

    if (!json.success || !json.data || json.data.length === 0) {
      if (noJobsMsg) noJobsMsg.hidden = false;
      return;
    }

    // Renderizar tarjetas
    jobsGrid.innerHTML = json.data.map((job, i) => buildJobCard(job, i)).join('');
    jobsGrid.hidden = false;

    // Activar reveal
    requestAnimationFrame(() => {
      jobsGrid.querySelectorAll('.reveal').forEach(el => {
        const obs = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              obs.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
        obs.observe(el);
      });
    });

    // Attach click listeners for register prompt
    jobsGrid.querySelectorAll('.job-btn-apply').forEach(btn => {
      btn.addEventListener('click', () => {
        const card    = btn.closest('.job-card');
        const title   = card?.dataset.title   || '—';
        const company = card?.dataset.company || '—';
        openRegisterPrompt(title, company);
      });
    });

  } catch (err) {
    console.error('[FeaturedJobs]', err);
    if (skeletonGrid) skeletonGrid.hidden = true;
    if (noJobsMsg)    noJobsMsg.hidden    = false;
  }
}

/* ============================================
   LANDING EVENTS (Carga dinámica)
   ============================================ */

async function initLandingEvents() {
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;

  try {
    const response = await fetch('php/eventos_publicos.php?limit=6');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.message);

    if (!result.data?.length) {
      grid.innerHTML = '<div class="events-empty">No hay eventos activos programados por ahora. Vuelve pronto.</div>';
      return;
    }

    grid.innerHTML = result.data.map((event, index) => {
      const date = new Date(String(event.fecha_evento).replace(' ', 'T'));
      const day = Number.isNaN(date.getTime()) ? '--' : date.toLocaleDateString('es-CO', { day: '2-digit' });
      const month = Number.isNaN(date.getTime()) ? 'próximo' : date.toLocaleDateString('es-CO', { month: 'short' });
      const formattedDate = Number.isNaN(date.getTime()) ? 'Fecha por confirmar' : date.toLocaleDateString('es-CO', { dateStyle: 'full' });
      const time = Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      const registration = `<button type="button" class="event-link primary event-read-more" data-event-index="${index}">Leer más <span class="material-symbols-outlined">arrow_forward</span></button>`;

      return `<article class="event-card reveal visible reveal-delay-${Math.min(index + 1, 3)}">
        <div class="event-date ${index % 2 ? 'secondary' : 'primary'}"><span class="day">${day}</span><span class="month">${escapeHtml(month)}</span></div>
        <div class="event-content"><span class="event-tag primary">${escapeHtml(event.tipo_evento)}</span><h3>${escapeHtml(event.titulo)}</h3>
          <p>${escapeHtml(event.descripcion)}</p><small class="event-meta">${escapeHtml(formattedDate)}${time ? ` · ${escapeHtml(time)}` : ''} · ${escapeHtml(event.modalidad)}</small>${registration}</div>
      </article>`;
    }).join('');

    grid.querySelectorAll('.event-read-more').forEach(button => {
      button.addEventListener('click', () => openEventDetails(result.data[Number(button.dataset.eventIndex)]));
    });

  } catch (error) {
    console.error('[LandingEvents]', error);
    grid.innerHTML = '<div class="events-empty">No fue posible cargar los eventos. Intenta nuevamente más tarde.</div>';
  }
}

function openEventDetails(event) {
  const modal = document.getElementById('eventDetailsModal');
  if (!modal || !event) return;

  document.getElementById('eventDetailsTitle').textContent = event.titulo || 'Evento';
  document.getElementById('eventDetailsType').textContent = event.tipo_evento || 'Actividad';
  document.getElementById('eventDetailsDescription').textContent = event.descripcion || 'No hay descripción disponible.';
  document.getElementById('eventDetailsDate').textContent = formatLandingEventDate(event.fecha_evento);
  document.getElementById('eventDetailsModality').textContent = event.modalidad || 'Por confirmar';
  document.getElementById('eventDetailsOrganizer').textContent = event.organizador || 'EmpleoJoven';
  modal.classList.add('event-details-open');
  document.body.style.overflow = 'hidden';
}

function closeEventDetails() {
  const modal = document.getElementById('eventDetailsModal');
  if (!modal) return;
  modal.classList.remove('event-details-open');
  document.body.style.overflow = '';
}

function formatLandingEventDate(value) {
  const date = new Date(String(value || '').replace(' ', 'T'));
  return Number.isNaN(date.getTime())
    ? 'Fecha por confirmar'
    : date.toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'short' });
}

function initEventDetailsModal() {
  const modal = document.getElementById('eventDetailsModal');
  if (!modal) return;
  document.getElementById('eventDetailsClose')?.addEventListener('click', closeEventDetails);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeEventDetails();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeEventDetails();
  });
}

/* ============================================
   LANDING SEARCH (Búsqueda en Header)
   ============================================ */

function initLandingSearch() {
  const searchInput = document.getElementById('jobSearch');
  const searchBtn = document.getElementById('searchButton');
  const jobsSection = document.getElementById('trabajos');

  if (!searchInput) return;

  function filterLandingJobs() {
    const query = searchInput.value.toLowerCase().trim();
    const jobsGrid = document.getElementById('jobsGrid');
    const noJobsMsg = document.getElementById('noJobsMessage');
    if (!jobsGrid) return;

    const cards = jobsGrid.querySelectorAll('.job-card');
    let visibleCount = 0;

    cards.forEach(card => {
      const text = (card.textContent || '').toLowerCase();
      const match = text.includes(query);
      card.style.display = match ? '' : 'none';
      if (match) visibleCount++;
    });

    if (noJobsMsg) {
      noJobsMsg.hidden = visibleCount > 0;
      if (visibleCount === 0 && query.length > 0) {
        noJobsMsg.textContent = `No encontramos vacantes que coincidan con "${searchInput.value}".`;
      } else if (visibleCount === 0) {
        noJobsMsg.textContent = 'No hay vacantes disponibles en este momento. ¡Vuelve pronto!';
      }
    }
  }

  searchInput.addEventListener('input', () => {
    filterLandingJobs();
  });

  const triggerSearch = (e) => {
    e?.preventDefault();
    filterLandingJobs();
    if (jobsSection) {
      const offset = 90;
      const top = jobsSection.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  searchBtn?.addEventListener('click', triggerSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') triggerSearch(e);
  });
}

/* ============================================
   REGISTER PROMPT MODAL & REGISTRATION TRIGGERS
   ============================================ */

function openRegisterPrompt(title, company) {
  const modal      = document.getElementById('registerPromptModal');
  const rpJobTitle = document.getElementById('rpJobTitle');
  const rpJobComp  = document.getElementById('rpJobCompany');
  if (!modal) return;

  if (rpJobTitle) rpJobTitle.textContent = title;
  if (rpJobComp)  rpJobComp.textContent  = company;

  document.body.style.overflow = 'hidden';
  // .rp-open activa display:flex + opacity:1 via CSS
  modal.classList.add('rp-open');
}

function closeRegisterPrompt() {
  const modal = document.getElementById('registerPromptModal');
  if (!modal) return;
  modal.classList.remove('rp-open');
  document.body.style.overflow = '';
  // CSS transition dura 0.28s, no se necesita manipular hidden
}

function scrollToHero(tab, role = null) {
  closeRegisterPrompt();
  const hero = document.querySelector('.hero');
  if (hero) hero.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Switch the auth tab after closing animation
  setTimeout(() => {
    if (tab === 'register') {
      document.getElementById('tabRegister')?.click();
      if (role) {
        const roleRadio = document.querySelector(`input[name="regRole"][value="${role}"]`);
        if (roleRadio) {
          roleRadio.checked = true;
          roleRadio.dispatchEvent(new Event('change'));
        }
      }
    } else {
      document.getElementById('tabLogin')?.click();
    }
    // Focus the email input
    setTimeout(() => {
      const emailEl = tab === 'register'
        ? (role === 'empresa' ? document.getElementById('regNombreEmpresa') : document.getElementById('regNombre')) || document.getElementById('regEmail')
        : document.getElementById('loginEmail');
      emailEl?.focus();
    }, 200);
  }, 300);
}

function initRegisterPromptModal() {
  const modal = document.getElementById('registerPromptModal');

  document.getElementById('rpCloseBtn')?.addEventListener('click', closeRegisterPrompt);
  document.getElementById('rpRegisterBtn')?.addEventListener('click', () => scrollToHero('register'));
  document.getElementById('rpLoginBtn')?.addEventListener('click',   () => scrollToHero('login'));

  // "Ver todas" buttons scroll to hero and open register tab
  ['verTodasBtn', 'verTodasMobileBtn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', (e) => {
      e.preventDefault();
      scrollToHero('register');
    });
  });

  // Navigation, mobile menu and footer registration links
  document.getElementById('navRegisterBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    scrollToHero('register');
  });

  document.getElementById('mobileRegisterBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    scrollToHero('register');
  });

  document.getElementById('footerRegisterBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    scrollToHero('register', 'joven');
  });

  document.getElementById('footerPublishBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    scrollToHero('register', 'empresa');
  });

  // Close on backdrop click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeRegisterPrompt();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) closeRegisterPrompt();
    });
  }
}


/* ============================================
   AUTH TABS (Login / Register)
   ============================================ */

function initAuthTabs() {
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const panelLogin = document.getElementById('panelLogin');
  const panelRegister = document.getElementById('panelRegister');
  const goToRegister = document.getElementById('goToRegister');
  const goToLogin = document.getElementById('goToLogin');

  if (!tabLogin || !tabRegister) return;

  function showLogin() {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    panelLogin.classList.remove('hidden');
    panelRegister.classList.add('hidden');
    // Re-trigger animation
    panelLogin.style.animation = 'none';
    panelLogin.offsetHeight; // force reflow
    panelLogin.style.animation = '';
  }

  function showRegister() {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    panelRegister.classList.remove('hidden');
    panelLogin.classList.add('hidden');
    // Re-trigger animation
    panelRegister.style.animation = 'none';
    panelRegister.offsetHeight; // force reflow
    panelRegister.style.animation = '';
  }

  tabLogin.addEventListener('click', showLogin);
  tabRegister.addEventListener('click', showRegister);
  goToRegister?.addEventListener('click', showRegister);
  goToLogin?.addEventListener('click', showLogin);
}

/* ============================================
   ROLE CARDS VISUAL FEEDBACK
   ============================================ */

function initRoleCards() {
  // Login role cards
  document.querySelectorAll('input[name="loginRole"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.querySelectorAll('input[name="loginRole"]').forEach(r => {
        const card = r.closest('.role-card');
        card.classList.remove('active-joven', 'active-empresa');
        if (r.checked) {
          card.classList.add(r.value === 'joven' ? 'active-joven' : 'active-empresa');
        }
      });
    });
  });

  // Register role cards
  document.querySelectorAll('input[name="regRole"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const regYouthFields = document.getElementById('regYouthFields');
      const regCompanyFields = document.getElementById('regCompanyFields');
      const regNombre = document.getElementById('regNombre');
      const regApellido = document.getElementById('regApellido');
      const regNombreEmpresa = document.getElementById('regNombreEmpresa');

      document.querySelectorAll('input[name="regRole"]').forEach(r => {
        const card = r.closest('.role-card');
        card.classList.remove('active-joven', 'active-empresa');
        if (r.checked) {
          card.classList.add(r.value === 'joven' ? 'active-joven' : 'active-empresa');
          
          if (r.value === 'joven') {
            regYouthFields?.classList.remove('hidden');
            regCompanyFields?.classList.add('hidden');
            if (regNombre) regNombre.required = true;
            if (regApellido) regApellido.required = true;
            if (regNombreEmpresa) regNombreEmpresa.required = false;
          } else {
            regYouthFields?.classList.add('hidden');
            regCompanyFields?.classList.remove('hidden');
            if (regNombre) regNombre.required = false;
            if (regApellido) regApellido.required = false;
            if (regNombreEmpresa) regNombreEmpresa.required = true;
          }
        }
      });
    });
  });
}

/* ============================================
   PASSWORD TOGGLE VISIBILITY
   ============================================ */

function initPasswordToggles() {
  document.querySelectorAll('.input-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('.material-symbols-outlined');

      if (!input || !icon) return;

      if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = 'visibility';
      } else {
        input.type = 'password';
        icon.textContent = 'visibility_off';
      }
    });
  });
}

/* ============================================
   FORMS — VALIDATION & SUBMIT
   ============================================ */

function initForms() {
  // Login Form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = document.getElementById('loginEmail')?.value || '';
      const password = document.getElementById('loginPassword')?.value || '';
      const role = document.querySelector('input[name="loginRole"]:checked')?.value || 'joven';
      const tipoUsuario = role === 'joven' ? 'persona' : 'empresa';

      // Desactivar botón temporalmente
      const submitBtn = loginForm.querySelector('.btn-submit');
      if (submitBtn) submitBtn.disabled = true;

      fetch('php/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          correo: email,
          password: password,
          tipo_usuario: tipoUsuario
        })
      })
      .then(response => response.json())
      .then(data => {
        if (submitBtn) submitBtn.disabled = false;
        if (data.success) {
          showToast('¡Inicio de sesión exitoso! Redirigiendo...', 'success');
          setTimeout(() => {
            const loggedRole = data.data?.tipo_usuario || (role === 'joven' ? 'persona' : 'empresa');
            if (loggedRole === 'admin') {
              window.location.href = 'dashboard-admin.html';
            } else if (loggedRole === 'persona') {
              window.location.href = 'dashboard-postulante.html';
            } else {
              window.location.href = 'dashboard-empresa.html';
            }
          }, 1500);
        } else {
          showToast(data.message || 'Error al iniciar sesión', 'error');
        }
      })
      .catch(error => {
        if (submitBtn) submitBtn.disabled = false;
        console.error('Error:', error);
        showToast('Error de conexión con el servidor', 'error');
      });
    });
  }

  // Register Form
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const password = document.getElementById('regPassword')?.value || '';
      const confirm = document.getElementById('regConfirmPassword')?.value || '';
      const role = document.querySelector('input[name="regRole"]:checked')?.value || 'joven';

      // Validate passwords match
      if (password !== confirm) {
        showToast('Las contraseñas no coinciden', 'error');
        const confirmInput = document.getElementById('regConfirmPassword');
        if (confirmInput) {
          confirmInput.classList.add('has-error');
          setTimeout(() => confirmInput.classList.remove('has-error'), 600);
        }
        return;
      }

      // Validate minimum length
      if (password.length < 8) {
        showToast('La contraseña debe tener al menos 8 caracteres', 'error');
        return;
      }

      const email = document.getElementById('regEmail')?.value || '';
      const tipoUsuario = role === 'joven' ? 'persona' : 'empresa';

      let nombreCompleto = '';
      let nombreEmpresa = '';

      if (role === 'joven') {
        const nombre = document.getElementById('regNombre')?.value || '';
        const apellido = document.getElementById('regApellido')?.value || '';
        nombreCompleto = `${nombre} ${apellido}`.trim();
      } else {
        nombreEmpresa = document.getElementById('regNombreEmpresa')?.value || '';
      }

      // Desactivar botón temporalmente
      const submitBtn = registerForm.querySelector('.btn-submit');
      if (submitBtn) submitBtn.disabled = true;

      fetch('php/registro.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          correo: email,
          confirmacion_correo: email,
          password: password,
          confirmacion_password: confirm,
          tipo_usuario: tipoUsuario,
          nombre_completo: nombreCompleto,
          nombre_empresa: nombreEmpresa
        })
      })
      .then(response => response.json())
      .then(data => {
        if (submitBtn) submitBtn.disabled = false;
        if (data.success) {
          showToast('¡Cuenta creada exitosamente! Redirigiendo...', 'success');
          setTimeout(() => {
            if (role === 'joven') {
              window.location.href = 'dashboard-postulante.html';
            } else {
              window.location.href = 'dashboard-empresa.html';
            }
          }, 1500);
        } else {
          showToast(data.message || 'Error al registrar el usuario', 'error');
        }
      })
      .catch(error => {
        if (submitBtn) submitBtn.disabled = false;
        console.error('Error:', error);
        showToast('Error de conexión con el servidor', 'error');
      });
    });
  }
}

/* ============================================
   TOAST NOTIFICATION
   ============================================ */

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastInner = document.getElementById('toastInner');
  const toastIcon = document.getElementById('toastIcon');
  const toastMessage = document.getElementById('toastMessage');

  if (!toast || !toastInner || !toastIcon || !toastMessage) return;

  toastMessage.textContent = message;
  toastIcon.textContent = type === 'success' ? 'check_circle' : 'error';

  toastInner.className = 'toast-inner ' + type;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

/* ============================================
   SCROLL REVEAL (Intersection Observer)
   ============================================ */

function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}

/* ============================================
   SMOOTH SCROLL (Anchor Links)
   ============================================ */

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const target = document.querySelector(targetId);
      if (target) {
        const offset = 100; // account for fixed navbar
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

/* ============================================
   PARALLAX HERO (Optional enhancement)
   ============================================ */

window.addEventListener('scroll', () => {
  const heroBg = document.querySelector('.hero-bg');
  if (!heroBg) return;
  const scrolled = window.pageYOffset;
  const rate = scrolled * 0.3;
  heroBg.style.transform = `translateY(${rate}px)`;
});

/* ============================================
   HERO BACKGROUND CAROUSEL
   ============================================ */

function initHeroCarousel() {
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length <= 1) return;

  const loadSlide = slide => {
    if (!slide || slide.dataset.loaded === 'true') return;
    const imageUrl = slide.dataset.background;
    if (!imageUrl) {
      slide.dataset.loaded = 'true';
      return;
    }
    slide.style.backgroundImage = `url('${imageUrl}')`;
    slide.dataset.loaded = 'true';
  };

  loadSlide(slides[0]);
  loadSlide(slides[1]);

  let currentIndex = 0;
  setInterval(() => {
    slides[currentIndex].classList.remove('active');
    currentIndex = (currentIndex + 1) % slides.length;
    loadSlide(slides[currentIndex]);
    loadSlide(slides[(currentIndex + 1) % slides.length]);
    slides[currentIndex].classList.add('active');
  }, 6000);
}