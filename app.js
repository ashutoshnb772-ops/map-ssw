/**
 * SupplySide Global 2026 - Accurate Multi-Level Wayfinding & Navigation Engine
 * Floor Level Awareness (Level 1 Bayside vs Level 2 Shoreline) & Real Escalator Routing
 */

// State Management
const AppState = {
  exhibitors: [],
  boothsMap: new Map(),
  filteredExhibitors: [],
  startLocation: null,
  destLocation: null,
  activeLevel: 'all', // '1', '2', 'll', 'all'
  activeMode: 'canvas',
  activeRoute: null,
  
  // Visit Schedule & Day Planner
  visitSchedule: [],
  activeScheduleDay: 'all', // 'all', '1', '2', '3'
  editingScheduleId: null,

  // Canvas Transform
  panX: 40,
  panY: 30,
  scale: 0.85,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
  hoveredBooth: null,
  animFrameId: null,
  animDashOffset: 0
};

// DOM Elements
const DOM = {
  startInput: document.getElementById('startLocationInput'),
  destInput: document.getElementById('destLocationInput'),
  startSuggestions: document.getElementById('startSuggestions'),
  destSuggestions: document.getElementById('destSuggestions'),
  clearStartBtn: document.getElementById('clearStartBtn'),
  clearDestBtn: document.getElementById('clearDestBtn'),
  btnSwap: document.getElementById('btnSwapLocations'),
  btnFindRoute: document.getElementById('btnFindRoute'),
  btnClearRoute: document.getElementById('btnClearRoute'),
  routeSummaryCard: document.getElementById('routeSummaryCard'),
  routeTime: document.getElementById('routeTime'),
  routeDistance: document.getElementById('routeDistance'),
  stepsList: document.getElementById('stepsList'),
  btnVoice: document.getElementById('btnVoiceGuidance'),
  
  // Directory & Tabs
  tabRouting: document.getElementById('tabRouting'),
  tabDirectory: document.getElementById('tabDirectory'),
  tabSchedule: document.getElementById('tabSchedule'),
  paneRouting: document.getElementById('routingTab'),
  paneDirectory: document.getElementById('directoryTab'),
  paneSchedule: document.getElementById('scheduleTab'),
  directorySearch: document.getElementById('directorySearchInput'),
  aisleFilters: document.getElementById('aisleFilters'),
  exhibitorCardsList: document.getElementById('exhibitorCardsList'),

  // Schedule Tab Elements
  scheduleCountBadge: document.getElementById('scheduleCountBadge'),
  scheduleProgressText: document.getElementById('scheduleProgressText'),
  scheduleProgressPercent: document.getElementById('scheduleProgressPercent'),
  scheduleProgressBar: document.getElementById('scheduleProgressBar'),
  scheduleSearchInput: document.getElementById('scheduleSearchInput'),
  scheduleSuggestions: document.getElementById('scheduleSuggestions'),
  dayFilterBar: document.getElementById('dayFilterBar'),
  scheduledCardsList: document.getElementById('scheduledCardsList'),
  btnRouteScheduledDay: document.getElementById('btnRouteScheduledDay'),
  btnExportSchedule: document.getElementById('btnExportSchedule'),
  btnClearDaySchedule: document.getElementById('btnClearDaySchedule'),
  countAllDays: document.getElementById('countAllDays'),
  countDay1: document.getElementById('countDay1'),
  countDay2: document.getElementById('countDay2'),
  countDay3: document.getElementById('countDay3'),
  
  // Header & Modes
  modeBtns: document.querySelectorAll('.mode-btn'),
  levelBtns: document.querySelectorAll('.level-btn'),
  btnToggleSidebar: document.getElementById('btnToggleSidebar'),
  navSidebar: document.getElementById('navSidebar'),
  
  // Stages & Frames
  interactiveMapStage: document.getElementById('interactiveMapStage'),
  externalFrameContainer: document.getElementById('externalFrameContainer'),
  externalIframe: document.getElementById('externalIframe'),
  mapCanvas: document.getElementById('mapCanvas'),
  
  // Controls & Modals
  btnZoomIn: document.getElementById('btnZoomIn'),
  btnZoomOut: document.getElementById('btnZoomOut'),
  btnResetView: document.getElementById('btnResetView'),
  btnLocateMe: document.getElementById('btnLocateMe'),
  boothModal: document.getElementById('boothActionModal'),
  modalBoothNumber: document.getElementById('modalBoothNumber'),
  modalCompanyName: document.getElementById('modalCompanyName'),
  btnCloseModal: document.getElementById('btnCloseBoothModal'),
  btnModalSetStart: document.getElementById('btnModalSetStart'),
  btnModalSetDest: document.getElementById('btnModalSetDest'),
  btnModalAddSchedule: document.getElementById('btnModalAddSchedule'),

  // Schedule Modal
  scheduleModal: document.getElementById('scheduleModal'),
  btnCloseScheduleModal: document.getElementById('btnCloseScheduleModal'),
  btnCancelScheduleModal: document.getElementById('btnCancelScheduleModal'),
  btnSaveScheduleItem: document.getElementById('btnSaveScheduleItem'),
  schedModalBooth: document.getElementById('schedModalBooth'),
  schedModalCompany: document.getElementById('schedModalCompany'),
  schedModalLocation: document.getElementById('schedModalLocation'),
  schedItemBooth: document.getElementById('schedItemBooth'),
  schedItemName: document.getElementById('schedItemName'),
  schedTimeInput: document.getElementById('schedTimeInput'),
  schedQuickTime: document.getElementById('schedQuickTime'),
  schedNotesInput: document.getElementById('schedNotesInput'),

  toast: document.getElementById('toastNotification')
};

const ctx = DOM.mapCanvas.getContext('2d');

// Realistic Multi-Hall Convention Center Model
const HallModel = {
  width: 2900,
  height: 1100,
  
  // Halls and Levels Breakdown
  halls: {
    level1_west: { name: 'Level 1 West Wing', minAisle: 200, maxAisle: 1300, minX: 120, maxX: 480 },
    level1_bayside: { name: 'Level 1 Bayside Main Hall', minAisle: 1800, maxAisle: 6800, minX: 560, maxX: 2200 },
    level2_shoreline: { name: 'Level 2 Shoreline Hall', minAisle: 7000, maxAisle: 8100, minX: 2280, maxX: 2740 }
  },
  
  // All 75 Aisles
  aisles: [
    200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300,
    1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900,
    3000, 3100, 3200, 3300, 3400, 3500, 3600, 3700, 3800, 3900, 4000, 4100,
    4200, 4300, 4400, 4500, 4600, 4700, 4800, 4900, 5000, 5100, 5200, 5300,
    5400, 5500, 5600, 5700, 5800, 5900, 6000, 6100, 6200, 6300, 6400, 6500,
    6600, 6700, 6800, 7000, 7100, 7200, 7300, 7400, 7500, 7600, 7700, 7800,
    7900, 8000, 8100
  ],
  
  crossConcourses: [
    { name: 'North Concourse', y: 300 },
    { name: 'Central Concourse', y: 550 },
    { name: 'South Concourse', y: 780 }
  ],
  
  // Realistic Hubs, Entrances, Dining & Stages
  landmarks: [
    { 
      id: 'bayside-main-entrance',
      name: 'Bayside Main Entrance', 
      shortName: 'Main Entrance',
      aisle: 3500,
      x: 1060, 
      y: 970, 
      width: 200, 
      height: 55, 
      icon: 'fa-door-open', 
      type: 'entrance', 
      level: '1',
      aliases: ['main entrance', 'entrance', 'bayside entrance', 'entry', 'doors', 'front entrance', 'lobby entrance', 'main doors']
    },
    { 
      id: 'bayside-registration-lobby',
      name: 'Bayside Registration Lobby', 
      shortName: 'Registration Lobby',
      aisle: 3500,
      x: 1030, 
      y: 1035, 
      width: 260, 
      height: 50, 
      icon: 'fa-id-card', 
      type: 'service', 
      level: '1',
      aliases: ['registration', 'registration lobby', 'bayside registration', 'badge pickup', 'check-in', 'badge', 'badges']
    },
    { 
      id: 'main-food-court',
      name: 'Main Food Court & Dining Pavilion', 
      shortName: 'Food Court',
      aisle: 6000,
      x: 1820, 
      y: 840, 
      width: 280, 
      height: 130, 
      icon: 'fa-utensils', 
      type: 'amenity', 
      level: '1',
      aliases: ['food court', 'main food court', 'dining pavilion', 'dining hall', 'cafeteria', 'lunch area']
    },
    { 
      id: 'south-concessions-cafe',
      name: 'South Concessions & Cafe', 
      shortName: 'South Cafe',
      aisle: 3200,
      x: 920, 
      y: 870, 
      width: 140, 
      height: 90, 
      icon: 'fa-coffee', 
      type: 'amenity', 
      level: '1',
      aliases: ['south concessions', 'south cafe', 'coffee shop', 'cafe lounge']
    },
    { 
      id: 'first-time-showcase',
      name: 'First-Time Exhibitor Showcase', 
      shortName: 'New Exhibitors',
      aisle: 4100,
      x: 1210, 
      y: 75, 
      width: 220, 
      height: 75, 
      icon: 'fa-star', 
      type: 'stage', 
      level: '1',
      aliases: ['first-time exhibitor showcase', 'first time showcase', 'new exhibitor showcase', 'new exhibitors']
    },
    { 
      id: 'main-innovation-stage',
      name: 'Main Innovation Stage', 
      shortName: 'Innovation Stage',
      aisle: 5500,
      x: 1720, 
      y: 840, 
      width: 190, 
      height: 85, 
      icon: 'fa-microphone', 
      type: 'stage', 
      level: '1',
      aliases: ['main innovation stage', 'innovation stage', 'main stage', 'speaker stage', 'keynote stage']
    },
    { 
      id: 'grand-escalators',
      name: '🪜 Grand Escalators (Level 1 ⇄ Level 2)', 
      shortName: 'Grand Escalators',
      aisle: 6900,
      x: 2200, 
      y: 500, 
      width: 130, 
      height: 95, 
      icon: 'fa-stairs', 
      type: 'escalator', 
      level: 'both',
      aliases: ['escalator', 'grand escalators', 'escalators', 'stairs', 'level change', 'to shoreline', 'to bayside', 'elevator']
    },
    { 
      id: 'shoreline-innovation-pavilion',
      name: 'Shoreline Innovation Pavilion', 
      shortName: 'Shoreline Stage',
      aisle: 7600,
      x: 2430, 
      y: 350, 
      width: 170, 
      height: 110, 
      icon: 'fa-lightbulb', 
      type: 'stage', 
      level: '2',
      aliases: ['shoreline innovation pavilion', 'shoreline stage', 'level 2 stage', 'shoreline pavilion']
    },
    { 
      id: 'shoreline-concessions',
      name: 'Shoreline Concessions & Lounge', 
      shortName: 'Shoreline Lounge',
      aisle: 8000,
      x: 2580, 
      y: 860, 
      width: 150, 
      height: 90, 
      icon: 'fa-utensils', 
      type: 'amenity', 
      level: '2',
      aliases: ['shoreline concessions', 'shoreline food', 'shoreline dining', 'shoreline cafe', 'shoreline lounge']
    },
    { 
      id: 'shoreline-registration-info',
      name: 'Shoreline Registration & Information', 
      shortName: 'Shoreline Info',
      aisle: 7100,
      x: 2380, 
      y: 1000, 
      width: 240, 
      height: 50, 
      icon: 'fa-circle-info', 
      type: 'service', 
      level: '2',
      aliases: ['shoreline registration', 'shoreline info', 'information desk', 'help desk', 'customer service']
    },
    { 
      id: 'bayside-restrooms-west',
      name: 'Bayside West Restrooms', 
      shortName: 'Restrooms (West)',
      aisle: 2800,
      x: 790, 
      y: 970, 
      width: 120, 
      height: 55, 
      icon: 'fa-restroom', 
      type: 'restroom', 
      level: '1',
      aliases: ['restroom', 'bathroom', 'toilets', 'washroom', 'wc', 'bayside restrooms']
    },
    { 
      id: 'bayside-restrooms-east',
      name: 'Bayside East Restrooms (Food Court)', 
      shortName: 'Restrooms (East)',
      aisle: 6500,
      x: 2130, 
      y: 870, 
      width: 120, 
      height: 60, 
      icon: 'fa-restroom', 
      type: 'restroom', 
      level: '1',
      aliases: ['east restrooms', 'food court restroom', 'dining restroom']
    }
  ]
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  setupCanvasDimensions();
  setupEventListeners();
  await loadExhibitorsData();
  loadScheduleFromStorage();
  renderScheduleView();
  startCanvasRenderLoop();
  
  // Clean initial state: start with empty inputs and clean map
  clearRoute();
});

/**
 * Handle Canvas Resize
 */
function setupCanvasDimensions() {
  const rect = DOM.interactiveMapStage.getBoundingClientRect();
  DOM.mapCanvas.width = rect.width * window.devicePixelRatio;
  DOM.mapCanvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  
  // Center map on initial load
  AppState.scale = Math.min((rect.width - 40) / HallModel.width, (rect.height - 40) / HallModel.height) * 1.1;
  AppState.panX = (rect.width - HallModel.width * AppState.scale) / 2;
  AppState.panY = (rect.height - HallModel.height * AppState.scale) / 2;
}

window.addEventListener('resize', () => {
  setupCanvasDimensions();
});

/**
 * Calculate Precise X Coordinate for any Aisle
 */
function getAisleX(aisle) {
  if (aisle <= 1300) {
    return 120 + ((aisle - 200) / (1300 - 200)) * 360;
  } else if (aisle <= 6800) {
    return 560 + ((aisle - 1800) / (6800 - 1800)) * 1640;
  } else {
    return 2280 + ((aisle - 7000) / (8100 - 7000)) * 440;
  }
}

/**
 * Determine Floor Level for an Aisle
 */
function getAisleLevel(aisle) {
  if (aisle >= 7000) return '2'; // Shoreline Hall (Level 2)
  return '1'; // Bayside Hall (Level 1)
}

/**
 * Calculate Precise World Y Coordinate for a Booth along its Aisle
 * In the real Mandalay Bay Convention Center floor plan:
 * - South (Front Entrance / Registration / Lobby F & E) is at the BOTTOM (y ≈ 880).
 * - North (Back Wall / West Russell Rd) is at the TOP (y ≈ 200).
 * - Booth numbering starts at the South with low numbers (01-25) at the bottom,
 *   and increases towards the North with high numbers (70-95) at the top.
 */
function getBoothY(aisle, pos) {
  if (aisle >= 7000) {
    // Shoreline / Bayside A Hall (Level 2 / East Wing) is offset southwards,
    // spanning y = 440 (North) to y = 980 (South)
    return 980 - (pos / 92) * 540;
  } else {
    // Level 1 Bayside Main Hall spanning y = 200 (North) to y = 880 (South)
    return 880 - (pos / 92) * 680;
  }
}

/**
 * Load 1,611 exhibitors & build exact coordinate map
 */
async function loadExhibitorsData() {
  try {
    const res = await fetch('exhibitors.json');
    if (!res.ok) throw new Error('Could not load exhibitors.json');
    AppState.exhibitors = await res.json();
    AppState.filteredExhibitors = [...AppState.exhibitors];

    // Build fast coordinate index for all booths
    AppState.exhibitors.forEach(item => {
      const boothStr = String(item.booth).trim();
      const num = parseInt(boothStr, 10);
      if (!isNaN(num)) {
        const aisle = Math.floor(num / 100) * 100;
        const pos = num % 100;
        const aisle_x = getAisleX(aisle);
        const level = getAisleLevel(aisle);
        const isEven = (pos % 2 === 0);
        const booth_x = aisle_x + (isEven ? 16 : -16);
        const booth_y = getBoothY(aisle, pos);

        AppState.boothsMap.set(boothStr, {
          booth: boothStr,
          name: item.name,
          aisle,
          pos,
          level,
          aisle_x,
          booth_x,
          booth_y,
          isEven
        });
      }
    });

    renderExhibitorsList(AppState.filteredExhibitors.slice(0, 100));
  } catch (err) {
    console.warn('Exhibitors load error:', err);
  }
}

/**
 * Set Initial Accurate Route Demo
 */
function setDefaultAccurateRoute(startBoothNum, destBoothNum) {
  const startEx = AppState.exhibitors.find(e => e.booth === startBoothNum) || 
    { name: 'A.T.P. CO., LTD.', booth: startBoothNum };
  const destEx = AppState.exhibitors.find(e => e.booth === destBoothNum) || 
    { name: 'Vesta Nutra', booth: destBoothNum };

  AppState.startLocation = startEx;
  AppState.destLocation = destEx;

  DOM.startInput.value = `${startEx.name} (Booth #${startEx.booth})`;
  DOM.destInput.value = `${destEx.name} (Booth #${destEx.booth})`;
  DOM.clearStartBtn.style.display = 'block';
  DOM.clearDestBtn.style.display = 'block';

  calculateAndRenderRoute();
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
  // Tabs
  DOM.tabRouting.addEventListener('click', () => switchTab('routing'));
  DOM.tabDirectory.addEventListener('click', () => switchTab('directory'));
  DOM.tabSchedule.addEventListener('click', () => switchTab('schedule'));

  // Mobile sidebar toggle
  DOM.btnToggleSidebar.addEventListener('click', () => {
    DOM.navSidebar.classList.toggle('open');
  });

  // Map Mode Switcher
  DOM.modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      AppState.activeMode = mode;
      
      if (mode === 'canvas') {
        DOM.interactiveMapStage.style.display = 'block';
        DOM.externalFrameContainer.style.display = 'none';
        showToast('Switched to Live Route Pathfinding Map');
      } else if (mode === 'official') {
        DOM.interactiveMapStage.style.display = 'none';
        DOM.externalFrameContainer.style.display = 'block';
        DOM.externalIframe.src = 'https://www.supplysideglobal.com/floor-plan/';
        showToast('Loading Official SupplySide.com Floor Plan');
      } else if (mode === 'a2z') {
        DOM.interactiveMapStage.style.display = 'none';
        DOM.externalFrameContainer.style.display = 'block';
        DOM.externalIframe.src = 'https://exhibitor.supplysideglobal.com/supplysideglobal26/Public/eventmap.aspx?shMode=E';
        showToast('Loading A2Z Interactive Event Map');
      }
    });
  });

  // Level selector
  DOM.levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      DOM.levelBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const lvl = btn.dataset.level;
      AppState.activeLevel = lvl;
      showToast(`Viewing Level ${lvl.toUpperCase()}`);
      
      // Auto-zoom to selected level area
      if (lvl === '1') {
        AppState.panX = -200;
        AppState.scale = 0.95;
      } else if (lvl === '2') {
        AppState.panX = -1700;
        AppState.scale = 1.1;
      } else {
        setupCanvasDimensions();
      }
    });
  });

  // Start & Dest Autocomplete
  setupAutocomplete(DOM.startInput, DOM.startSuggestions, DOM.clearStartBtn, (item) => {
    AppState.startLocation = item;
    DOM.startInput.value = item.isLandmark ? item.name : `${item.name} (Booth #${item.booth})`;
    DOM.startSuggestions.style.display = 'none';
    calculateAndRenderRoute();
  });

  setupAutocomplete(DOM.destInput, DOM.destSuggestions, DOM.clearDestBtn, (item) => {
    AppState.destLocation = item;
    DOM.destInput.value = item.isLandmark ? item.name : `${item.name} (Booth #${item.booth})`;
    DOM.destSuggestions.style.display = 'none';
    calculateAndRenderRoute();
  });

  // Clear buttons
  DOM.clearStartBtn.addEventListener('click', () => {
    DOM.startInput.value = '';
    AppState.startLocation = null;
    DOM.clearStartBtn.style.display = 'none';
    clearActiveRouteOnly();
    showToast('Starting location cleared');
  });

  DOM.clearDestBtn.addEventListener('click', () => {
    DOM.destInput.value = '';
    AppState.destLocation = null;
    DOM.clearDestBtn.style.display = 'none';
    clearActiveRouteOnly();
    showToast('Destination cleared');
  });

  // Swap Locations
  DOM.btnSwap.addEventListener('click', () => {
    const tempLoc = AppState.startLocation;
    const tempVal = DOM.startInput.value;

    AppState.startLocation = AppState.destLocation;
    DOM.startInput.value = DOM.destInput.value;

    AppState.destLocation = tempLoc;
    DOM.destInput.value = tempVal;

    DOM.clearStartBtn.style.display = DOM.startInput.value ? 'block' : 'none';
    DOM.clearDestBtn.style.display = DOM.destInput.value ? 'block' : 'none';

    calculateAndRenderRoute();
  });

  // Quick Landmark Chips
  document.querySelectorAll('.chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      const landmarkName = chip.dataset.loc;
      const lm = resolveLandmark(landmarkName);
      if (lm) {
        AppState.startLocation = { name: lm.name, booth: lm.name, isLandmark: true, landmark: lm };
        DOM.startInput.value = lm.name;
        DOM.clearStartBtn.style.display = 'block';
        showToast(`Current location set to ${lm.shortName}`);
        calculateAndRenderRoute();
      }
    });
  });

  // Find Route Button
  DOM.btnFindRoute.addEventListener('click', calculateAndRenderRoute);

  // Clear Route Button
  DOM.btnClearRoute.addEventListener('click', clearRoute);

  // Directory Search
  DOM.directorySearch.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      AppState.filteredExhibitors = [...AppState.exhibitors];
    } else {
      AppState.filteredExhibitors = AppState.exhibitors.filter(ex => 
        ex.name.toLowerCase().includes(q) || ex.booth.toLowerCase().includes(q)
      );
    }
    renderExhibitorsList(AppState.filteredExhibitors.slice(0, 100));
  });

  // Aisle Filters
  DOM.aisleFilters.addEventListener('click', (e) => {
    if (!e.target.classList.contains('filter-pill')) return;
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    e.target.classList.add('active');
    
    const filter = e.target.dataset.filter;
    if (filter === 'all') {
      AppState.filteredExhibitors = [...AppState.exhibitors];
    } else {
      AppState.filteredExhibitors = AppState.exhibitors.filter(ex => {
        const num = parseInt(ex.booth, 10);
        const fNum = parseInt(filter, 10);
        return !isNaN(num) && num >= fNum && num < fNum + 1000;
      });
    }
    renderExhibitorsList(AppState.filteredExhibitors.slice(0, 100));
  });

  // Voice Guidance
  DOM.btnVoice.addEventListener('click', speakDirections);

  // Canvas Mouse Controls
  setupCanvasInteractivity();

  // Floating Map Controls
  DOM.btnZoomIn.addEventListener('click', () => zoomCanvas(1.25));
  DOM.btnZoomOut.addEventListener('click', () => zoomCanvas(0.8));
  DOM.btnResetView.addEventListener('click', () => {
    setupCanvasDimensions();
    showToast('Map view reset to full expo floor');
  });
  DOM.btnLocateMe.addEventListener('click', () => {
    if (AppState.startLocation) {
      focusBoothOnCanvas(AppState.startLocation.booth);
      showToast(`Centered on current location (Booth ${AppState.startLocation.booth})`);
    } else {
      showToast('Set your current location in the panel first.');
    }
  });

  // Modal actions
  DOM.btnCloseModal.addEventListener('click', () => {
    DOM.boothModal.style.display = 'none';
  });

  DOM.btnModalSetStart.addEventListener('click', () => {
    if (AppState.modalBooth) {
      AppState.startLocation = AppState.modalBooth;
      DOM.startInput.value = `${AppState.modalBooth.name} (Booth #${AppState.modalBooth.booth})`;
      DOM.clearStartBtn.style.display = 'block';
      DOM.boothModal.style.display = 'none';
      switchTab('routing');
      showToast(`Starting point set to Booth ${AppState.modalBooth.booth}`);
      calculateAndRenderRoute();
    }
  });

  DOM.btnModalSetDest.addEventListener('click', () => {
    if (AppState.modalBooth) {
      AppState.destLocation = AppState.modalBooth;
      DOM.destInput.value = `${AppState.modalBooth.name} (Booth #${AppState.modalBooth.booth})`;
      DOM.clearDestBtn.style.display = 'block';
      DOM.boothModal.style.display = 'none';
      switchTab('routing');
      showToast(`Destination set to Booth ${AppState.modalBooth.booth}`);
      calculateAndRenderRoute();
    }
  });

  DOM.btnModalAddSchedule.addEventListener('click', () => {
    if (AppState.modalBooth) {
      openScheduleModal(AppState.modalBooth.booth, AppState.modalBooth.name);
    }
  });

  // Schedule Quick Add Autocomplete
  setupAutocomplete(DOM.scheduleSearchInput, DOM.scheduleSuggestions, { style: {} }, (item) => {
    DOM.scheduleSearchInput.value = '';
    DOM.scheduleSuggestions.style.display = 'none';
    openScheduleModal(item.booth, item.name);
  });

  // Schedule Day Filter Bar
  DOM.dayFilterBar.addEventListener('click', (e) => {
    const pill = e.target.closest('.day-pill');
    if (!pill) return;
    document.querySelectorAll('.day-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    AppState.activeScheduleDay = pill.dataset.day;
    renderScheduleView();
  });

  // Schedule Batch Actions
  DOM.btnRouteScheduledDay.addEventListener('click', routeScheduledDayBooths);
  DOM.btnExportSchedule.addEventListener('click', exportScheduleItinerary);
  DOM.btnClearDaySchedule.addEventListener('click', clearDaySchedule);

  // Schedule Modal Buttons
  DOM.btnCloseScheduleModal.addEventListener('click', closeScheduleModal);
  DOM.btnCancelScheduleModal.addEventListener('click', closeScheduleModal);
  DOM.btnSaveScheduleItem.addEventListener('click', saveScheduleItem);
  DOM.schedQuickTime.addEventListener('change', (e) => {
    if (e.target.value) DOM.schedTimeInput.value = e.target.value;
  });
}

/**
 * Extract clean numeric booth digits from string (e.g. "Booth #2120" -> "2120")
 */
function extractBoothDigits(text) {
  if (!text) return '';
  const match = String(text).match(/(?:booth\s*#?|#)?\s*(\d{2,5})/i);
  return match ? match[1] : '';
}

/**
 * Resolve input string or object to matching Landmark
 */
function resolveLandmark(inputVal) {
  if (!inputVal) return null;
  if (typeof inputVal === 'object') {
    if (inputVal.isLandmark && inputVal.landmark) return inputVal.landmark;
    if (inputVal.isLandmark) {
      inputVal = inputVal.name || inputVal.booth;
    } else {
      // It's an exhibitor or booth object, definitely not a landmark
      return null;
    }
  }
  
  const raw = String(inputVal).trim().toLowerCase();
  if (!raw) return null;

  // Never match landmarks if explicit booth digits or booth tags are provided
  if (/\b(?:booth|#)\s*\d{2,5}\b/i.test(raw) || /\(\s*booth\s*#\d+\s*\)/i.test(raw)) {
    return null;
  }
  if (/^\d{2,5}$/.test(raw)) {
    return null;
  }

  // 1. Direct exact id match or exact name match
  for (const lm of HallModel.landmarks) {
    if (lm.id === raw || lm.name.toLowerCase() === raw || lm.shortName.toLowerCase() === raw) {
      return lm;
    }
  }

  // 2. Exact alias match or multi-word phrase match
  for (const lm of HallModel.landmarks) {
    if (lm.aliases) {
      for (const alias of lm.aliases) {
        if (raw === alias) {
          return lm;
        }
        if (alias.length >= 6 && raw.includes(alias)) {
          return lm;
        }
      }
    }
  }

  // 3. Exact full landmark name match
  for (const lm of HallModel.landmarks) {
    const lName = lm.name.toLowerCase();
    const lShort = lm.shortName.toLowerCase();
    if (raw === lName || raw === lShort) {
      return lm;
    }
  }

  return null;
}

/**
 * Resolve input string or object to exact Location / Exhibitor object
 */
function resolveExhibitor(inputVal) {
  if (!inputVal) return null;
  if (typeof inputVal === 'object') {
    if (inputVal.isLandmark) return inputVal;
    if (inputVal.booth) {
      const cleanB = extractBoothDigits(inputVal.booth);
      if (cleanB && AppState.boothsMap.has(cleanB)) {
        return AppState.boothsMap.get(cleanB);
      }
      return inputVal;
    }
  }

  const clean = String(inputVal).trim();
  const cleanDigits = extractBoothDigits(clean);

  // 1. If explicit booth digits are present, resolve by booth number FIRST!
  if (cleanDigits) {
    if (AppState.boothsMap.has(cleanDigits)) {
      return AppState.boothsMap.get(cleanDigits);
    }
    const foundByBooth = AppState.exhibitors.find(e => e.booth === cleanDigits);
    if (foundByBooth) return foundByBooth;
  }

  // 2. Check if it's an official Landmark (Food Court, Entrance, Registration, etc.)
  const lm = resolveLandmark(clean);
  if (lm) {
    return { 
      name: lm.name, 
      booth: lm.name, 
      isLandmark: true, 
      landmark: lm, 
      level: lm.level === 'both' ? '1' : lm.level 
    };
  }

  // 3. Try matching company name (e.g. Kerry, Cargill, etc.)
  const lower = clean.toLowerCase();
  const foundByName = AppState.exhibitors.find(e => 
    e.name.toLowerCase() === lower || e.name.toLowerCase().includes(lower)
  );
  if (foundByName) return foundByName;

  if (cleanDigits) {
    return { name: `Exhibitor Booth #${cleanDigits}`, booth: cleanDigits };
  }

  return null;
}

/**
 * Setup Canvas Pan, Zoom and Hover Interaction
 */
function setupCanvasInteractivity() {
  const canvas = DOM.mapCanvas;

  canvas.addEventListener('mousedown', (e) => {
    AppState.isDragging = true;
    AppState.dragStartX = e.clientX - AppState.panX;
    AppState.dragStartY = e.clientY - AppState.panY;
  });

  window.addEventListener('mousemove', (e) => {
    if (AppState.isDragging) {
      AppState.panX = e.clientX - AppState.dragStartX;
      AppState.panY = e.clientY - AppState.dragStartY;
    } else {
      checkCanvasHover(e);
    }
  });

  window.addEventListener('mouseup', () => {
    AppState.isDragging = false;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const newScale = Math.max(0.3, Math.min(3.5, AppState.scale * zoomFactor));
    AppState.panX = mouseX - (mouseX - AppState.panX) * (newScale / AppState.scale);
    AppState.panY = mouseY - (mouseY - AppState.panY) * (newScale / AppState.scale);
    AppState.scale = newScale;
  }, { passive: false });

  canvas.addEventListener('click', () => {
    if (AppState.hoveredBooth) {
      openBoothModal(AppState.hoveredBooth.booth, AppState.hoveredBooth.name);
    }
  });
}

function zoomCanvas(factor) {
  const rect = DOM.mapCanvas.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const newScale = Math.max(0.3, Math.min(3.5, AppState.scale * factor));
  AppState.panX = centerX - (centerX - AppState.panX) * (newScale / AppState.scale);
  AppState.panY = centerY - (centerY - AppState.panY) * (newScale / AppState.scale);
  AppState.scale = newScale;
}

/**
 * Check which booth or landmark is hovered by mouse
 */
function checkCanvasHover(e) {
  const rect = DOM.mapCanvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const worldX = (mouseX - AppState.panX) / AppState.scale;
  const worldY = (mouseY - AppState.panY) / AppState.scale;

  let found = null;
  let minDist = 22;

  if (AppState.activeRoute) {
    const sc = AppState.activeRoute.startCoord;
    const dc = AppState.activeRoute.destCoord;
    const dStart = Math.hypot(worldX - sc.booth_x, worldY - sc.booth_y);
    const dDest = Math.hypot(worldX - dc.booth_x, worldY - dc.booth_y);

    if (dStart < 25) {
      found = {
        booth: sc.booth,
        name: `🟢 START (L${sc.level}): ${AppState.activeRoute.startName}`,
        x: sc.booth_x,
        y: sc.booth_y
      };
    } else if (dDest < 25) {
      found = {
        booth: dc.booth,
        name: `🔴 DESTINATION (L${dc.level}): ${AppState.activeRoute.destName}`,
        x: dc.booth_x,
        y: dc.booth_y
      };
    }
  }

  // Check if hovering over any landmark rectangle
  if (!found) {
    for (const lm of HallModel.landmarks) {
      if (worldX >= lm.x && worldX <= lm.x + lm.width && worldY >= lm.y && worldY <= lm.y + lm.height) {
        found = {
          booth: lm.name,
          name: `${lm.name} (Level ${lm.level === 'both' ? '1-2' : lm.level})`,
          x: lm.x + lm.width / 2,
          y: lm.y + lm.height / 2,
          isLandmark: true
        };
        break;
      }
    }
  }

  if (!found) {
    for (const [boothNum, data] of AppState.boothsMap.entries()) {
      const d = Math.hypot(worldX - data.booth_x, worldY - data.booth_y);
      if (d < minDist) {
        minDist = d;
        found = {
          booth: data.booth,
          name: `L${data.level} - ${data.name}`,
          x: data.booth_x,
          y: data.booth_y
        };
      }
    }
  }

  AppState.hoveredBooth = found;
  DOM.mapCanvas.style.cursor = found ? 'pointer' : (AppState.isDragging ? 'grabbing' : 'grab');
}

/**
 * Get Exact World Coordinate for any Booth or Landmark
 */
function getExactBoothCoord(target) {
  if (!target) return null;

  // 1. Check if target is explicitly marked as Landmark
  if (typeof target === 'object' && target.isLandmark) {
    const lm = target.landmark || resolveLandmark(target);
    if (lm) {
      const aisle_x = getAisleX(lm.aisle || 3500);
      const booth_x = lm.x + lm.width / 2;
      const booth_y = lm.y + lm.height / 2;
      return {
        isLandmark: true,
        landmark: lm,
        booth: lm.name,
        name: lm.name,
        aisle: lm.aisle || 3500,
        pos: 50,
        level: lm.level === 'both' ? '1' : lm.level,
        aisle_x: aisle_x,
        booth_x: booth_x,
        booth_y: booth_y,
        isEven: true
      };
    }
  }

  // 2. Check Exhibitor in boothsMap (by booth number) FIRST
  let boothStr = '';
  if (typeof target === 'object' && target.booth) {
    boothStr = String(target.booth);
  } else {
    boothStr = String(target);
  }
  const cleanNum = extractBoothDigits(boothStr);
  if (cleanNum && AppState.boothsMap.has(cleanNum)) {
    return AppState.boothsMap.get(cleanNum);
  }

  // 3. Check Landmark by name/id (only if no booth number was found)
  const lm = resolveLandmark(target);
  if (lm) {
    const aisle_x = getAisleX(lm.aisle || 3500);
    const booth_x = lm.x + lm.width / 2;
    const booth_y = lm.y + lm.height / 2;
    return {
      isLandmark: true,
      landmark: lm,
      booth: lm.name,
      name: lm.name,
      aisle: lm.aisle || 3500,
      pos: 50,
      level: lm.level === 'both' ? '1' : lm.level,
      aisle_x: aisle_x,
      booth_x: booth_x,
      booth_y: booth_y,
      isEven: true
    };
  }

  // 4. Fallback numeric aisle/pos
  const num = parseInt(cleanNum, 10);
  if (!isNaN(num)) {
    const aisle = Math.floor(num / 100) * 100;
    const pos = num % 100;
    const aisle_x = getAisleX(aisle);
    const level = getAisleLevel(aisle);
    const isEven = (pos % 2 === 0);
    const booth_x = aisle_x + (isEven ? 16 : -16);
    const booth_y = getBoothY(aisle, pos);
    return {
      booth: cleanNum,
      name: `Booth #${cleanNum}`,
      aisle,
      pos,
      level,
      aisle_x,
      booth_x,
      booth_y,
      isEven
    };
  }

  return null;
}

function focusBoothOnCanvas(boothStr) {
  const coord = getExactBoothCoord(boothStr);
  if (!coord) return;

  const rect = DOM.mapCanvas.getBoundingClientRect();
  AppState.scale = 1.35;
  AppState.panX = rect.width / 2 - coord.booth_x * AppState.scale;
  AppState.panY = rect.height / 2 - coord.booth_y * AppState.scale;
}

/**
 * Calculate & Render Shortest Walkable Route (With Multi-Floor Escalator Navigation)
 */
function calculateAndRenderRoute() {
  const startRaw = DOM.startInput.value.trim();
  const destRaw = DOM.destInput.value.trim();

  if (!startRaw || !destRaw) {
    clearActiveRouteOnly();
    if (!startRaw && !destRaw) {
      showToast('Please enter both your start and destination booths.');
    } else if (!startRaw) {
      showToast('Please enter your current location or booth #.');
      DOM.startInput.focus();
    } else {
      showToast('Please enter your destination booth or exhibitor.');
      DOM.destInput.focus();
    }
    return;
  }

  // 1. Resolve exact Start and Destination
  const startEx = resolveExhibitor(startRaw) || AppState.startLocation || { name: startRaw, booth: extractBoothNumber(startRaw) };
  const destEx = resolveExhibitor(destRaw) || AppState.destLocation || { name: destRaw, booth: extractBoothNumber(destRaw) };

  AppState.startLocation = startEx;
  AppState.destLocation = destEx;

  // 2. Get Exact Coordinates & Levels
  const startCoord = getExactBoothCoord(startEx);
  const destCoord = getExactBoothCoord(destEx);

  if (!startCoord || !destCoord) {
    showToast('Could not resolve location on the floor plan.');
    return;
  }

  const startName = startEx.name;
  const destName = destEx.name;
  const isStartEast = (startCoord.aisle >= 7000);
  const isDestEast = (destCoord.aisle >= 7000);
  const isInterHall = (isStartEast !== isDestEast);
  const isMultiLevel = isInterHall;

  // 3. True Convention Pathfinding:
  const waypoints = [];
  const steps = [];

  // Official Connector Foyer Transition Points (Connecting West Bayside & East Shoreline Halls)
  const lobbyCPt = { x: 2180, y: 550 }; // Lobby C Exit on Central Concourse
  const lobbyBPt = { x: 2215, y: 780 }; // Lobby B Entrance into Shoreline / Bayside A Hall

  let distanceFt = 0;

  if (isInterHall) {
    if (!isStartEast && isDestEast) {
      // WEST HALL (e.g. Booth 2120) TO EAST HALL (e.g. Booth 7776)
      // 1. Depart booth into start aisle walkway
      waypoints.push({ x: startCoord.booth_x, y: startCoord.booth_y });
      waypoints.push({ x: startCoord.aisle_x, y: startCoord.booth_y });
      // 2. Walk to Central Cross-Concourse (y = 550)
      waypoints.push({ x: startCoord.aisle_x, y: 550 });
      // 3. Walk East along Central Concourse to Lobby C
      waypoints.push({ x: lobbyCPt.x, y: 550 });
      // 4. Walk South down Connector Concourse (New Products Zone) toward Lobby B
      waypoints.push({ x: lobbyCPt.x, y: lobbyBPt.y });
      waypoints.push({ x: lobbyBPt.x, y: lobbyBPt.y });
      // 5. Turn East into East Hall concourse toward destination aisle
      waypoints.push({ x: destCoord.aisle_x, y: lobbyBPt.y });
      // 6. Proceed down destination aisle to booth
      waypoints.push({ x: destCoord.aisle_x, y: destCoord.booth_y });
      waypoints.push({ x: destCoord.booth_x, y: destCoord.booth_y });

      // Turn-by-Turn Steps matching official ExpoFP routing
      const startTag = startCoord.isLandmark ? '' : ` (Booth #${startCoord.booth})`;
      steps.push({
        icon: 'fa-solid fa-location-dot',
        text: `Start at <strong>${escapeHtml(startName)}</strong>${startTag}.`,
        subtext: `Located in Bayside Main Hall &bull; Near Aisle ${startCoord.aisle}`
      });

      steps.push({
        icon: 'fa-solid fa-arrow-up',
        text: `Walk along <strong>Aisle ${startCoord.aisle}</strong> toward the Central Cross-Concourse.`,
        subtext: `Proceed to main aisle junction`
      });

      steps.push({
        icon: 'fa-solid fa-arrow-right',
        text: `Turn <strong>East (Right)</strong> onto <strong>Central Concourse</strong> toward Lobby C.`,
        subtext: `Follow main concourse corridor toward east exit`
      });

      steps.push({
        icon: 'fa-solid fa-arrow-turn-down',
        text: `Turn <strong>South (Right)</strong> into the <strong>Connector Concourse (New Products Zone)</strong>.`,
        subtext: `Walk through connector breezeway from Lobby C to Lobby B`
      });

      steps.push({
        icon: 'fa-solid fa-arrow-turn-right',
        text: `Turn <strong>East (Left)</strong> at <strong>Lobby B</strong> into <strong>Shoreline / Bayside A Hall</strong>.`,
        subtext: `Enter East exhibit hall through Lobby B foyer`
      });

      const destWalkTarget = destCoord.isLandmark ? destName : `Booth #${destCoord.booth}`;
      steps.push({
        icon: 'fa-solid fa-diamond-turn-right',
        text: `Proceed along <strong>Aisle ${destCoord.aisle}</strong> toward ${destWalkTarget}.`,
        subtext: `Walk down designated aisle`
      });

      const destTag = destCoord.isLandmark ? '' : ` (Booth #${destCoord.booth})`;
      steps.push({
        icon: 'fa-solid fa-flag-checkered',
        text: `Arrive at destination: <strong>${escapeHtml(destName)}</strong>${destTag}.`,
        subtext: `Destination reached on your ${destCoord.isEven ? 'right' : 'left'}`
      });

    } else {
      // EAST HALL (e.g. Booth 7776) TO WEST HALL (e.g. Booth 2120)
      waypoints.push({ x: startCoord.booth_x, y: startCoord.booth_y });
      waypoints.push({ x: startCoord.aisle_x, y: startCoord.booth_y });
      waypoints.push({ x: startCoord.aisle_x, y: lobbyBPt.y });
      waypoints.push({ x: lobbyBPt.x, y: lobbyBPt.y });
      waypoints.push({ x: lobbyCPt.x, y: lobbyBPt.y });
      waypoints.push({ x: lobbyCPt.x, y: 550 });
      waypoints.push({ x: destCoord.aisle_x, y: 550 });
      waypoints.push({ x: destCoord.aisle_x, y: destCoord.booth_y });
      waypoints.push({ x: destCoord.booth_x, y: destCoord.booth_y });

      const startTag = startCoord.isLandmark ? '' : ` (Booth #${startCoord.booth})`;
      steps.push({
        icon: 'fa-solid fa-location-dot',
        text: `Start at <strong>${escapeHtml(startName)}</strong>${startTag}.`,
        subtext: `Located in Shoreline / Bayside A Hall &bull; Near Aisle ${startCoord.aisle}`
      });

      steps.push({
        icon: 'fa-solid fa-arrow-left',
        text: `Walk toward <strong>Lobby B Exit</strong>.`,
        subtext: `Proceed west toward connector foyer`
      });

      steps.push({
        icon: 'fa-solid fa-arrow-turn-up',
        text: `Turn <strong>North</strong> through the <strong>Connector Concourse (New Products Zone)</strong> toward Lobby C.`,
        subtext: `Transition corridor between halls`
      });

      steps.push({
        icon: 'fa-solid fa-arrow-left',
        text: `Turn <strong>West (Left)</strong> onto <strong>Central Concourse</strong> into Bayside Main Hall.`,
        subtext: `Proceed west along Central Concourse toward Aisle ${destCoord.aisle}`
      });

      const destWalkTarget = destCoord.isLandmark ? destName : `Booth #${destCoord.booth}`;
      steps.push({
        icon: 'fa-solid fa-diamond-turn-right',
        text: `Turn into <strong>Aisle ${destCoord.aisle}</strong> and proceed toward ${destWalkTarget}.`,
        subtext: `Destination on your ${destCoord.isEven ? 'right' : 'left'}`
      });

      const destTag = destCoord.isLandmark ? '' : ` (Booth #${destCoord.booth})`;
      steps.push({
        icon: 'fa-solid fa-flag-checkered',
        text: `Arrive at destination: <strong>${escapeHtml(destName)}</strong>${destTag}.`,
        subtext: `Destination reached in Bayside Main Hall`
      });
    }

  } else {
    // SAME-HALL ROUTING (Within West Hall or Within East Hall)
    const concourses = isStartEast
      ? [{ y: 550, name: 'North Concourse' }, { y: 750, name: 'Central Concourse' }, { y: 920, name: 'South Concourse' }]
      : HallModel.crossConcourses;

    let bestConcourse = concourses[1];
    let minWalkDistance = Infinity;

    concourses.forEach(cc => {
      const walkCost = Math.abs(startCoord.booth_y - cc.y) + Math.abs(destCoord.booth_y - cc.y);
      if (walkCost < minWalkDistance) {
        minWalkDistance = walkCost;
        bestConcourse = cc;
      }
    });

    waypoints.push({ x: startCoord.booth_x, y: startCoord.booth_y });
    waypoints.push({ x: startCoord.aisle_x, y: startCoord.booth_y });
    waypoints.push({ x: startCoord.aisle_x, y: bestConcourse.y });
    waypoints.push({ x: destCoord.aisle_x, y: bestConcourse.y });
    waypoints.push({ x: destCoord.aisle_x, y: destCoord.booth_y });
    waypoints.push({ x: destCoord.booth_x, y: destCoord.booth_y });

    const startTag = startCoord.isLandmark ? '' : ` (Booth #${startCoord.booth})`;
    steps.push({
      icon: 'fa-solid fa-location-dot',
      text: `Start at <strong>${escapeHtml(startName)}</strong>${startTag}.`,
      subtext: `Level ${startCoord.level} &bull; Near Aisle ${startCoord.aisle}`
    });

    const distToConcourse = Math.round(Math.abs(startCoord.booth_y - bestConcourse.y) * 0.786);
    const walkDir = bestConcourse.y > startCoord.booth_y ? 'South' : 'North';
    steps.push({
      icon: walkDir === 'South' ? 'fa-solid fa-arrow-down' : 'fa-solid fa-arrow-up',
      text: `Walk ${walkDir} down <strong>Aisle ${startCoord.aisle}</strong> to the ${bestConcourse.name}.`,
      subtext: `~${distToConcourse} ft straight ahead`
    });

    if (startCoord.aisle !== destCoord.aisle) {
      const turnConcourse = destCoord.aisle_x > startCoord.aisle_x ? 'Right' : 'Left';
      steps.push({
        icon: turnConcourse === 'Right' ? 'fa-solid fa-arrow-turn-right' : 'fa-solid fa-arrow-turn-left',
        text: `Turn <strong>${turnConcourse}</strong> onto <strong>${bestConcourse.name}</strong> toward Aisle ${destCoord.aisle}.`,
        subtext: `Walk along designated concourse corridor`
      });

      const destWalkTarget = destCoord.isLandmark ? destName : `Booth #${destCoord.booth}`;
      steps.push({
        icon: 'fa-solid fa-diamond-turn-right',
        text: `Turn into <strong>Aisle ${destCoord.aisle}</strong> and proceed toward ${destWalkTarget}.`,
        subtext: `~${Math.round(Math.abs(destCoord.booth_y - bestConcourse.y) * 0.786)} ft`
      });
    }

    const destTag = destCoord.isLandmark ? '' : ` (Booth #${destCoord.booth})`;
    steps.push({
      icon: 'fa-solid fa-flag-checkered',
      text: `Arrive at <strong>${escapeHtml(destName)}</strong>${destTag}.`,
      subtext: destCoord.isLandmark
        ? `Destination reached on Level ${destCoord.level} near Aisle ${destCoord.aisle}`
        : `Destination reached on your ${destCoord.isEven ? 'right' : 'left'}`
    });
  }

  // Calculate Accurate Physical Convention Feet & Real Walking Time
  let totalLengthPx = 0;
  for (let i = 1; i < waypoints.length; i++) {
    totalLengthPx += Math.hypot(waypoints[i].x - waypoints[i-1].x, waypoints[i].y - waypoints[i-1].y);
  }
  const FEET_PER_PX = 0.786;
  distanceFt = Math.round(totalLengthPx * FEET_PER_PX);
  const totalSeconds = Math.round(distanceFt / 4.2);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeFormatted = minutes > 0 ? `${minutes} min ${seconds > 0 ? seconds + 's' : ''}` : `${seconds}s`;

  AppState.activeRoute = {
    startName,
    destName,
    startCoord,
    destCoord,
    isMultiLevel,
    waypoints,
    distanceFt,
    timeFormatted,
    steps
  };

  // Render Route Summary Card
  DOM.routeTime.innerHTML = `<i class="fa-regular fa-clock"></i> ${timeFormatted}`;
  DOM.routeDistance.innerHTML = `<i class="fa-solid fa-person-walking"></i> ${distanceFt} ft`;

  DOM.stepsList.innerHTML = steps.map(s => `
    <li class="step-item">
      <div class="step-icon-badge"><i class="${s.icon}"></i></div>
      <div class="step-content">
        <div>${s.text}</div>
        <span class="step-dist">${s.subtext}</span>
      </div>
    </li>
  `).join('');

  DOM.routeSummaryCard.style.display = 'flex';

  // Center route on canvas
  focusRouteOnCanvas(waypoints);
  showToast(isMultiLevel ? `Multi-Floor Route: Level ${startCoord.level} ➔ Level ${destCoord.level} (${distanceFt} ft)` : `Route plotted: ${distanceFt} ft (${timeFormatted})`);
}

function focusRouteOnCanvas(waypoints) {
  const xs = waypoints.map(p => p.x);
  const ys = waypoints.map(p => p.y);
  const minX = Math.min(...xs) - 100;
  const maxX = Math.max(...xs) + 100;
  const minY = Math.min(...ys) - 100;
  const maxY = Math.max(...ys) + 100;

  const w = maxX - minX;
  const h = maxY - minY;

  const rect = DOM.mapCanvas.getBoundingClientRect();
  AppState.scale = Math.min(rect.width / w, rect.height / h, 1.4);
  AppState.panX = rect.width / 2 - ((minX + maxX) / 2) * AppState.scale;
  AppState.panY = rect.height / 2 - ((minY + maxY) / 2) * AppState.scale;
}

/**
 * Clear Active Route Only (Preserves input fields if needed)
 */
function clearActiveRouteOnly() {
  AppState.activeRoute = null;
  if (DOM.routeSummaryCard) {
    DOM.routeSummaryCard.style.display = 'none';
  }
  if (DOM.stepsList) {
    DOM.stepsList.innerHTML = '';
  }
}

/**
 * Clear All Inputs and Active Route
 */
function clearRoute() {
  DOM.startInput.value = '';
  DOM.destInput.value = '';
  if (DOM.clearStartBtn) DOM.clearStartBtn.style.display = 'none';
  if (DOM.clearDestBtn) DOM.clearDestBtn.style.display = 'none';
  AppState.startLocation = null;
  AppState.destLocation = null;
  clearActiveRouteOnly();
}

/**
 * Speech Synthesis Read Aloud
 */
function speakDirections() {
  if (!('speechSynthesis' in window)) {
    showToast('Voice guidance not supported on this device.');
    return;
  }

  if (!AppState.activeRoute || !AppState.activeRoute.steps) {
    showToast('Please calculate a route first.');
    return;
  }

  window.speechSynthesis.cancel();
  const narration = AppState.activeRoute.steps.map((s, idx) => {
    const cleanText = s.text.replace(/<[^>]*>?/gm, '');
    return `Step ${idx + 1}: ${cleanText}. ${s.subtext}.`;
  }).join(' ');

  const utterance = new SpeechSynthesisUtterance(narration);
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
  showToast('Voice directions playing...');
}

/* ==========================================================================
   CANVAS RENDERING ENGINE
   ========================================================================== */
function startCanvasRenderLoop() {
  function render() {
    drawCanvasMap();
    AppState.animDashOffset -= 0.65;
    AppState.animFrameId = requestAnimationFrame(render);
  }
  render();
}

function drawCanvasMap() {
  const w = DOM.mapCanvas.width / window.devicePixelRatio;
  const h = DOM.mapCanvas.height / window.devicePixelRatio;

  ctx.clearRect(0, 0, w, h);

  ctx.save();
  ctx.translate(AppState.panX, AppState.panY);
  ctx.scale(AppState.scale, AppState.scale);

  // 1. Draw Level 1 Floor (Bayside) & Level 2 Floor (Shoreline) Division
  // Level 1 Section (x: 40 to 2240)
  ctx.fillStyle = '#0a0f1d';
  ctx.strokeStyle = 'rgba(2, 132, 199, 0.35)';
  ctx.lineWidth = 2;
  roundRect(ctx, 40, 40, 2180, HallModel.height - 80, 20, true, true);

  // Level 1 Header Banner
  ctx.fillStyle = 'rgba(2, 132, 199, 0.15)';
  roundRect(ctx, 60, 50, 400, 36, 6, true, false);
  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 14px Outfit, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LEVEL 1: BAYSIDE EXHIBIT HALL', 80, 74);

  // Level 2 Section (x: 2260 to 2840)
  ctx.fillStyle = '#0a1124';
  ctx.strokeStyle = 'rgba(253, 81, 1, 0.4)';
  ctx.lineWidth = 2;
  roundRect(ctx, 2260, 40, 580, HallModel.height - 80, 20, true, true);

  // Level 2 Header Banner
  ctx.fillStyle = 'rgba(253, 81, 1, 0.15)';
  roundRect(ctx, 2280, 50, 440, 36, 6, true, false);
  ctx.fillStyle = '#fb923c';
  ctx.font = '700 14px Outfit, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LEVEL 2: SHORELINE EXHIBIT HALL', 2300, 74);

  // 1.5 Draw Connecting Concourse (New Products Zone & Lobby C ⇄ Lobby B Breezeway)
  ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 2160, 520, 110, 290, 8, true, true);

  ctx.fillStyle = '#34d399';
  ctx.font = '700 10px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CONNECTOR FOYER', 2215, 640);
  ctx.font = '500 9px Inter, sans-serif';
  ctx.fillText('New Products Zone', 2215, 656);
  ctx.fillText('Lobby C ⇄ Lobby B', 2215, 670);

  // Lobby C Label
  ctx.fillStyle = '#38bdf8';
  ctx.font = '700 11px Outfit, sans-serif';
  ctx.fillText('LOBBY C', 2180, 512);

  // Lobby B Label
  ctx.fillStyle = '#fb923c';
  ctx.font = '700 11px Outfit, sans-serif';
  ctx.fillText('LOBBY B', 2215, 830);

  // 2. Draw Walkable Cross-Concourses
  HallModel.crossConcourses.forEach(cc => {
    // Level 1 Concourse
    ctx.fillStyle = 'rgba(2, 132, 199, 0.08)';
    ctx.fillRect(80, cc.y - 25, 2120, 50);

    // Level 2 Concourse
    ctx.fillStyle = 'rgba(253, 81, 1, 0.08)';
    ctx.fillRect(2280, cc.y - 25, 540, 50);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(80, cc.y);
    ctx.lineTo(2180, cc.y);
    ctx.moveTo(2280, cc.y);
    ctx.lineTo(2800, cc.y);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // 3. Draw All 75 Aisles & Real Booth Rectangles
  HallModel.aisles.forEach(aisleNum => {
    const x = getAisleX(aisleNum);
    const isLevel2 = (aisleNum >= 7000);

    // Aisle Walkway Strip
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fillRect(x - 14, 120, 28, HallModel.height - 240);

    // Aisle Number Header & Footer
    ctx.fillStyle = isLevel2 ? '#fb923c' : 'rgba(253, 81, 1, 0.75)';
    ctx.font = '700 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${aisleNum}`, x, 110);
    ctx.fillText(`${aisleNum}`, x, HallModel.height - 100);

    // Booth Blocks along aisle
    ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;

    for (let pos = 10; pos <= 88; pos += 4) {
      const by = getBoothY(aisleNum, pos);
      roundRect(ctx, x - 26, by - 6, 11, 12, 2, true, true);
      roundRect(ctx, x + 15, by - 6, 11, 12, 2, true, true);
    }
  });

  // 4. Draw Landmarks & Escalator Hub
  HallModel.landmarks.forEach(lm => {
    if (lm.type === 'escalator') {
      // Escalator Hub between Level 1 and Level 2
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      roundRect(ctx, lm.x, lm.y, lm.width, lm.height, 10, true, true);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '700 12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ESCALATOR HUB', lm.x + lm.width / 2, lm.y + 40);
      ctx.font = '500 11px Inter, sans-serif';
      ctx.fillText('L1 ⇄ L2 TRANSITION', lm.x + lm.width / 2, lm.y + 65);

    } else {
      let fillColor = 'rgba(2, 132, 199, 0.15)';
      let strokeColor = '#0284c7';

      if (lm.type === 'entrance') {
        fillColor = 'rgba(16, 185, 129, 0.18)';
        strokeColor = '#10b981';
      } else if (lm.type === 'amenity') {
        fillColor = 'rgba(245, 158, 11, 0.18)';
        strokeColor = '#f59e0b';
      } else if (lm.type === 'stage') {
        fillColor = 'rgba(253, 81, 1, 0.18)';
        strokeColor = '#fd5101';
      } else if (lm.type === 'restroom') {
        fillColor = 'rgba(99, 102, 241, 0.18)';
        strokeColor = '#6366f1';
      } else if (lm.type === 'service') {
        fillColor = 'rgba(56, 189, 248, 0.18)';
        strokeColor = '#38bdf8';
      }

      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.8;
      roundRect(ctx, lm.x, lm.y, lm.width, lm.height, 10, true, true);

      // Category badge
      ctx.fillStyle = strokeColor;
      ctx.font = '700 10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(lm.type.toUpperCase(), lm.x + lm.width / 2, lm.y + 18);

      // Landmark name
      ctx.fillStyle = '#f8fafc';
      ctx.font = '700 12px Outfit, sans-serif';
      ctx.fillText(lm.name, lm.x + lm.width / 2, lm.y + lm.height / 2 + 8);
    }
  });

  // 5. Draw Active Route Line & Walking Path
  if (AppState.activeRoute) {
    const pts = AppState.activeRoute.waypoints;

    // Glowing Neon Underline Effect
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    // Solid Bright Neon Core Line
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    // Marching Dashed Animation
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 8]);
    ctx.lineDashOffset = AppState.animDashOffset;
    ctx.stroke();
    ctx.setLineDash([]);

    // START PIN (Pulsing Emerald Green)
    const startPinLabel = AppState.activeRoute.startCoord.isLandmark
      ? `START (L${AppState.activeRoute.startCoord.level}): ${AppState.activeRoute.startName}`
      : `START (L${AppState.activeRoute.startCoord.level}): ${AppState.activeRoute.startName} (#${AppState.activeRoute.startCoord.booth})`;

    drawPulsingBeacon(
      ctx, 
      pts[0].x, 
      pts[0].y, 
      '#10b981', 
      startPinLabel
    );

    // DESTINATION PIN (Vivid Crimson Flag)
    const destPinLabel = AppState.activeRoute.destCoord.isLandmark
      ? `DEST (L${AppState.activeRoute.destCoord.level}): ${AppState.activeRoute.destName}`
      : `DEST (L${AppState.activeRoute.destCoord.level}): ${AppState.activeRoute.destName} (#${AppState.activeRoute.destCoord.booth})`;

    drawDestinationBeacon(
      ctx, 
      pts[pts.length - 1].x, 
      pts[pts.length - 1].y, 
      '#f43f5e', 
      destPinLabel
    );
  }

  // 5.5 Draw Planned Visit Booth Beacons from AppState.visitSchedule
  AppState.visitSchedule.forEach(item => {
    if (AppState.activeScheduleDay !== 'all' && item.day !== AppState.activeScheduleDay) return;
    const coord = getExactBoothCoord(item.booth);
    if (coord) {
      drawScheduledBoothBeacon(ctx, coord.booth_x, coord.booth_y, item);
    }
  });

  // 6. Draw Hovered Booth Bubble
  if (AppState.hoveredBooth && !AppState.isDragging) {
    const hb = AppState.hoveredBooth;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1.5;
    roundRect(ctx, hb.x - 110, hb.y - 50, 220, 42, 8, true, true);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(hb.isLandmark ? 'VENUE AMENITY / FACILITY' : `BOOTH #${hb.booth}`, hb.x, hb.y - 33);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '500 11px Inter, sans-serif';
    const shortName = hb.name.length > 26 ? hb.name.substring(0, 24) + '...' : hb.name;
    ctx.fillText(shortName, hb.x, hb.y - 17);
  }

  ctx.restore();
}

/**
 * Draw Start Location Pulsing Beacon with Floating Card
 */
function drawPulsingBeacon(ctx, x, y, color, label) {
  const pulse = (Math.sin(Date.now() / 250) + 1) / 2;

  ctx.beginPath();
  ctx.arc(x, y, 16 + pulse * 10, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  const labelWidth = Math.min(270, Math.max(150, label.length * 7));
  roundRect(ctx, x - labelWidth / 2, y - 48, labelWidth, 32, 6, true, true);

  ctx.fillStyle = '#10b981';
  ctx.font = '700 11px Outfit, sans-serif';
  ctx.textAlign = 'center';
  const cleanLabel = label.length > 34 ? label.substring(0, 32) + '...' : label;
  ctx.fillText(cleanLabel, x, y - 28);
}

/**
 * Draw Destination Beacon with Floating Card
 */
function drawDestinationBeacon(ctx, x, y, color, label) {
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(x, y, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  const labelWidth = Math.min(270, Math.max(150, label.length * 7));
  roundRect(ctx, x - labelWidth / 2, y - 48, labelWidth, 32, 6, true, true);

  ctx.fillStyle = '#f43f5e';
  ctx.font = '700 11px Outfit, sans-serif';
  ctx.textAlign = 'center';
  const cleanLabel = label.length > 34 ? label.substring(0, 32) + '...' : label;
  ctx.fillText(cleanLabel, x, y - 28);
}

/**
 * Canvas Round Rectangle Helper
 */
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

/**
 * Autocomplete Logic
 */
function setupAutocomplete(input, listElem, clearBtn, onSelect) {
  input.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    clearBtn.style.display = val ? 'block' : 'none';

    if (!val) {
      listElem.style.display = 'none';
      clearActiveRouteOnly();
      return;
    }

    // 1. Search Landmark matches (Food Court, Main Entrance, Registration, etc.)
    const matchedLandmarks = HallModel.landmarks.filter(lm => {
      const nameMatch = lm.name.toLowerCase().includes(val) || lm.shortName.toLowerCase().includes(val);
      const aliasMatch = lm.aliases && lm.aliases.some(a => a.includes(val) || val.includes(a));
      return nameMatch || aliasMatch;
    });

    // 2. Search Exhibitor matches
    const matchedExhibitors = AppState.exhibitors.filter(ex => 
      ex.name.toLowerCase().includes(val) || ex.booth.toLowerCase().includes(val)
    ).slice(0, 7);

    if (matchedLandmarks.length === 0 && matchedExhibitors.length === 0) {
      listElem.innerHTML = `<div class="suggestion-item"><span class="sugg-name">No booths or landmarks matching "${escapeHtml(val)}"</span></div>`;
      listElem.style.display = 'block';
      return;
    }

    let html = '';

    // Landmark items at top
    matchedLandmarks.forEach(lm => {
      const typeLabel = lm.type === 'entrance' ? 'ENTRANCE' :
                        lm.type === 'amenity' ? 'AMENITY' :
                        lm.type === 'stage' ? 'STAGE' :
                        lm.type === 'service' ? 'SERVICE' :
                        lm.type === 'escalator' ? 'ESCALATOR' : 'FACILITY';
      html += `
        <div class="suggestion-item suggestion-landmark" data-landmark-id="${lm.id}" data-name="${escapeHtml(lm.name)}">
          <span class="sugg-name">
            <i class="fa-solid ${lm.icon}" style="color: var(--brand-orange); margin-right: 8px;"></i>
            ${highlightMatch(lm.name, val)}
          </span>
          <span class="sugg-booth sugg-landmark-badge">${typeLabel} (L${lm.level === 'both' ? '1-2' : lm.level})</span>
        </div>
      `;
    });

    // Exhibitor items
    matchedExhibitors.forEach(m => {
      html += `
        <div class="suggestion-item" data-booth="${m.booth}" data-name="${escapeHtml(m.name)}">
          <span class="sugg-name">${highlightMatch(m.name, val)}</span>
          <span class="sugg-booth">Booth ${m.booth} (L${getAisleLevel(parseInt(m.booth, 10))})</span>
        </div>
      `;
    });

    listElem.innerHTML = html;
    listElem.style.display = 'block';
  });

  listElem.addEventListener('click', (e) => {
    const item = e.target.closest('.suggestion-item');
    if (!item) return;

    if (item.dataset.landmarkId) {
      const lm = HallModel.landmarks.find(l => l.id === item.dataset.landmarkId);
      if (lm) {
        onSelect({
          name: lm.name,
          booth: lm.name,
          isLandmark: true,
          landmark: lm
        });
        input.value = lm.name;
        clearBtn.style.display = 'block';
      }
    } else if (item.dataset.booth) {
      onSelect({
        booth: item.dataset.booth,
        name: item.dataset.name
      });
      input.value = `${item.dataset.name} (Booth #${item.dataset.booth})`;
      clearBtn.style.display = 'block';
    }
    listElem.style.display = 'none';
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !listElem.contains(e.target)) {
      listElem.style.display = 'none';
    }
  });
}

/**
 * Render Exhibitor Directory Cards
 */
function renderExhibitorsList(list) {
  if (list.length === 0) {
    DOM.exhibitorCardsList.innerHTML = `<div class="loading-spinner">No exhibitors found.</div>`;
    return;
  }

  DOM.exhibitorCardsList.innerHTML = list.map(item => `
    <div class="exhibitor-card" data-booth="${item.booth}" data-name="${escapeHtml(item.name)}">
      <div class="exhibitor-card-info">
        <span class="exhibitor-card-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
        <span class="exhibitor-card-booth"><i class="fa-solid fa-tag"></i> Booth ${item.booth} &bull; Level ${getAisleLevel(parseInt(item.booth, 10))}</span>
      </div>
      <div class="exhibitor-card-actions">
        <button class="card-action-btn btn-action-start" title="Set as Current Location">
          <i class="fa-solid fa-location-dot"></i>
        </button>
        <button class="card-action-btn btn-action-dest" title="Navigate to this Booth">
          <i class="fa-solid fa-diamond-turn-right"></i>
        </button>
        <button class="card-action-btn btn-action-schedule" title="Add to Visit Plan">
          <i class="fa-regular fa-calendar-plus"></i>
        </button>
      </div>
    </div>
  `).join('');

  DOM.exhibitorCardsList.querySelectorAll('.exhibitor-card').forEach(card => {
    const booth = card.dataset.booth;
    const name = card.dataset.name;

    card.querySelector('.btn-action-start').addEventListener('click', (e) => {
      e.stopPropagation();
      AppState.startLocation = { booth, name };
      DOM.startInput.value = `${name} (Booth #${booth})`;
      DOM.clearStartBtn.style.display = 'block';
      switchTab('routing');
      showToast(`Start location set to Booth ${booth}`);
      calculateAndRenderRoute();
    });

    card.querySelector('.btn-action-dest').addEventListener('click', (e) => {
      e.stopPropagation();
      AppState.destLocation = { booth, name };
      DOM.destInput.value = `${name} (Booth #${booth})`;
      DOM.clearDestBtn.style.display = 'block';
      switchTab('routing');
      focusBoothOnCanvas(booth);
      showToast(`Destination set to Booth ${booth}`);
      calculateAndRenderRoute();
    });

    card.querySelector('.btn-action-schedule').addEventListener('click', (e) => {
      e.stopPropagation();
      openScheduleModal(booth, name);
    });

    card.addEventListener('click', () => {
      openBoothModal(booth, name);
    });
  });
}

function openBoothModal(booth, name) {
  const lm = resolveLandmark(booth) || resolveLandmark(name);
  if (lm) {
    AppState.modalBooth = { booth: lm.name, name: lm.name, isLandmark: true, landmark: lm };
    DOM.modalBoothNumber.textContent = `${lm.name} (Level ${lm.level === 'both' ? '1 & 2' : lm.level})`;
    DOM.modalCompanyName.textContent = `Official Amenity / Service Hub &bull; Near Aisle ${lm.aisle}`;
    DOM.boothModal.style.display = 'flex';
    return;
  }
  AppState.modalBooth = { booth, name };
  DOM.modalBoothNumber.textContent = `Booth #${booth} (Level ${getAisleLevel(parseInt(booth, 10))})`;
  DOM.modalCompanyName.textContent = name;
  DOM.boothModal.style.display = 'flex';
}

function switchTab(tab) {
  DOM.tabRouting.classList.remove('active');
  DOM.tabDirectory.classList.remove('active');
  DOM.tabSchedule.classList.remove('active');
  DOM.paneRouting.classList.remove('active');
  DOM.paneDirectory.classList.remove('active');
  DOM.paneSchedule.classList.remove('active');

  if (tab === 'routing') {
    DOM.tabRouting.classList.add('active');
    DOM.paneRouting.classList.add('active');
  } else if (tab === 'directory') {
    DOM.tabDirectory.classList.add('active');
    DOM.paneDirectory.classList.add('active');
  } else if (tab === 'schedule') {
    DOM.tabSchedule.classList.add('active');
    DOM.paneSchedule.classList.add('active');
    renderScheduleView();
  }
}

function extractBoothNumber(text) {
  if (!text) return '';
  const match = text.match(/(?:booth\s*#?|#)?\s*(\d{2,5})/i);
  return match ? match[1] : text.trim();
}

function highlightMatch(text, query) {
  if (!query) return escapeHtml(text);
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return escapeHtml(text).replace(regex, '<mark>$1</mark>');
}

function showToast(msg) {
  DOM.toast.textContent = msg;
  DOM.toast.style.display = 'block';
  setTimeout(() => {
    DOM.toast.style.display = 'none';
  }, 3200);
}

function escapeHtml(str) {
  return (str || '').replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
  });
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* ==========================================================================
   VISIT SCHEDULE & DAY PLANNER ENGINE
   ========================================================================== */

/**
 * Load schedule from LocalStorage
 */
function loadScheduleFromStorage() {
  try {
    const raw = localStorage.getItem('supplyside_2026_visit_schedule');
    if (raw) {
      AppState.visitSchedule = JSON.parse(raw);
    } else {
      // Preload helpful sample visits so the user immediately sees the multi-day plan in action
      AppState.visitSchedule = [
        {
          id: 'sample-1',
          booth: '3845',
          name: 'Vesta Nutra',
          day: '1',
          time: '10:00',
          notes: 'Discuss specialty botanical extracts & private label supply',
          visited: false,
          level: '1',
          createdAt: Date.now() - 3600000
        },
        {
          id: 'sample-2',
          booth: '7776',
          name: 'A.T.P. CO., LTD.',
          day: '1',
          time: '14:30',
          notes: 'Review dosage forms and packaging OEM capabilities',
          visited: false,
          level: '2',
          createdAt: Date.now() - 1800000
        },
        {
          id: 'sample-3',
          booth: '1982',
          name: 'Caloy Oils | Gustav Heess',
          day: '2',
          time: '11:15',
          notes: 'Contract pricing for high-grade plant seed oils',
          visited: false,
          level: '1',
          createdAt: Date.now()
        }
      ];
      saveScheduleToStorage();
    }
  } catch (e) {
    console.warn('Could not load visit schedule:', e);
    AppState.visitSchedule = [];
  }
}

/**
 * Save schedule to LocalStorage
 */
function saveScheduleToStorage() {
  try {
    localStorage.setItem('supplyside_2026_visit_schedule', JSON.stringify(AppState.visitSchedule));
  } catch (e) {
    console.warn('Could not save visit schedule:', e);
  }
}

/**
 * Open Add/Edit Schedule Modal
 */
function openScheduleModal(booth, name, editItem = null) {
  const cleanBooth = extractBoothNumber(booth);
  const ex = AppState.exhibitors.find(e => e.booth === cleanBooth) || { name: name || `Booth #${cleanBooth}`, booth: cleanBooth };
  const level = getAisleLevel(parseInt(cleanBooth, 10));

  DOM.schedModalBooth.textContent = `Booth #${cleanBooth}`;
  DOM.schedModalCompany.textContent = ex.name;
  DOM.schedModalLocation.textContent = `Level ${level} • ${level === '2' ? 'Shoreline Exhibit Hall' : 'Bayside Main Hall'}`;
  DOM.schedItemBooth.value = cleanBooth;
  DOM.schedItemName.value = ex.name;

  if (editItem) {
    AppState.editingScheduleId = editItem.id;
    const radio = document.querySelector(`input[name="visitDayRadio"][value="${editItem.day}"]`);
    if (radio) radio.checked = true;
    DOM.schedTimeInput.value = editItem.time || '';
    DOM.schedQuickTime.value = '';
    DOM.schedNotesInput.value = editItem.notes || '';
    DOM.btnSaveScheduleItem.innerHTML = '<i class="fa-solid fa-check"></i> Update Visit Plan';
  } else {
    AppState.editingScheduleId = null;
    const targetDay = AppState.activeScheduleDay === 'all' ? '1' : AppState.activeScheduleDay;
    const radio = document.querySelector(`input[name="visitDayRadio"][value="${targetDay}"]`);
    if (radio) radio.checked = true;
    DOM.schedTimeInput.value = '';
    DOM.schedQuickTime.value = '';
    DOM.schedNotesInput.value = '';
    DOM.btnSaveScheduleItem.innerHTML = '<i class="fa-solid fa-calendar-check"></i> Save to Visit Plan';
  }

  DOM.boothModal.style.display = 'none';
  DOM.scheduleModal.style.display = 'flex';
}

function closeScheduleModal() {
  DOM.scheduleModal.style.display = 'none';
  AppState.editingScheduleId = null;
}

/**
 * Save / Update Item in Visit Schedule
 */
function saveScheduleItem() {
  const booth = DOM.schedItemBooth.value.trim();
  const name = DOM.schedItemName.value.trim();
  const dayRadio = document.querySelector('input[name="visitDayRadio"]:checked');
  const day = dayRadio ? dayRadio.value : '1';
  const time = DOM.schedTimeInput.value.trim();
  const notes = DOM.schedNotesInput.value.trim();
  const level = getAisleLevel(parseInt(booth, 10));

  if (!booth) {
    showToast('Invalid booth selection.');
    return;
  }

  if (AppState.editingScheduleId) {
    const item = AppState.visitSchedule.find(i => i.id === AppState.editingScheduleId);
    if (item) {
      item.day = day;
      item.time = time;
      item.notes = notes;
      showToast(`Updated visit plan for ${name}`);
    }
  } else {
    const existingIndex = AppState.visitSchedule.findIndex(i => i.booth === booth && i.day === day);
    if (existingIndex >= 0) {
      AppState.visitSchedule[existingIndex].time = time || AppState.visitSchedule[existingIndex].time;
      AppState.visitSchedule[existingIndex].notes = notes || AppState.visitSchedule[existingIndex].notes;
      showToast(`Updated existing Day ${day} visit for ${name}`);
    } else {
      AppState.visitSchedule.push({
        id: 'visit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        booth,
        name,
        day,
        time,
        notes,
        visited: false,
        level,
        createdAt: Date.now()
      });
      showToast(`Added ${name} (Booth #${booth}) to Day ${day} Visit Plan`);
    }
  }

  saveScheduleToStorage();
  closeScheduleModal();
  renderScheduleView();
}

/**
 * Toggle Visited Status
 */
function toggleVisitStatus(id) {
  const item = AppState.visitSchedule.find(i => i.id === id);
  if (item) {
    item.visited = !item.visited;
    saveScheduleToStorage();
    renderScheduleView();
    showToast(item.visited ? `Marked ${item.name} as Visited ✅` : `Marked ${item.name} as Pending`);
  }
}

/**
 * Delete Schedule Item
 */
function deleteScheduleItem(id) {
  const item = AppState.visitSchedule.find(i => i.id === id);
  const name = item ? item.name : 'Booth';
  AppState.visitSchedule = AppState.visitSchedule.filter(i => i.id !== id);
  saveScheduleToStorage();
  renderScheduleView();
  showToast(`Removed ${name} from schedule`);
}

/**
 * Render Schedule View
 */
function renderScheduleView() {
  const allItems = AppState.visitSchedule;
  const activeDay = AppState.activeScheduleDay;

  // Counts
  const countAll = allItems.length;
  const count1 = allItems.filter(i => i.day === '1').length;
  const count2 = allItems.filter(i => i.day === '2').length;
  const count3 = allItems.filter(i => i.day === '3').length;

  DOM.countAllDays.textContent = countAll;
  DOM.countDay1.textContent = count1;
  DOM.countDay2.textContent = count2;
  DOM.countDay3.textContent = count3;
  DOM.scheduleCountBadge.textContent = countAll;

  // Progress metrics
  const displayItems = activeDay === 'all' ? allItems : allItems.filter(i => i.day === activeDay);
  const visitedCount = displayItems.filter(i => i.visited).length;
  const totalCount = displayItems.length;
  const percent = totalCount > 0 ? Math.round((visitedCount / totalCount) * 100) : 0;

  DOM.scheduleProgressText.textContent = `${visitedCount} / ${totalCount} Booths Visited`;
  DOM.scheduleProgressPercent.textContent = `${percent}%`;
  DOM.scheduleProgressBar.style.width = `${percent}%`;

  // Sort: pending first, then by time, then name
  const sorted = [...displayItems].sort((a, b) => {
    if (a.visited !== b.visited) return a.visited ? 1 : -1;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    return a.name.localeCompare(b.name);
  });

  if (sorted.length === 0) {
    const dayLabel = activeDay === 'all' ? 'any day' : `Day ${activeDay}`;
    DOM.scheduledCardsList.innerHTML = `
      <div class="schedule-empty-state">
        <i class="fa-solid fa-calendar-plus schedule-empty-icon"></i>
        <div class="schedule-empty-title">No booths scheduled for ${dayLabel}</div>
        <p class="schedule-empty-desc">
          Add exhibitors you want to meet from the Exhibitors directory or click any booth directly on the floor map!
        </p>
        <button class="btn-empty-browse" id="btnBrowseFromEmpty">
          <i class="fa-solid fa-store"></i> Browse 1,611 Exhibitors
        </button>
      </div>
    `;

    const browseBtn = document.getElementById('btnBrowseFromEmpty');
    if (browseBtn) {
      browseBtn.addEventListener('click', () => switchTab('directory'));
    }
    return;
  }

  DOM.scheduledCardsList.innerHTML = sorted.map(item => {
    const dayNames = { '1': 'Day 1 (Wed)', '2': 'Day 2 (Thu)', '3': 'Day 3 (Fri)' };
    return `
      <div class="scheduled-card ${item.visited ? 'visited' : ''}" data-id="${item.id}" data-booth="${item.booth}">
        <div class="sched-checkbox-wrap">
          <button class="sched-check-btn" title="${item.visited ? 'Mark as Pending' : 'Mark as Visited'}">
            <i class="fa-solid fa-check"></i>
          </button>
        </div>
        <div class="sched-content">
          <div class="sched-header">
            <span class="sched-day-tag">${dayNames[item.day] || 'Day ' + item.day}</span>
            ${item.time ? `<span class="sched-time-tag"><i class="fa-regular fa-clock"></i> ${formatTimeDisplay(item.time)}</span>` : ''}
          </div>
          <div class="sched-company" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
          <div class="sched-meta">
            <span><i class="fa-solid fa-tag"></i> Booth #${item.booth}</span>
            <span>&bull;</span>
            <span>Level ${item.level} (${item.level === '2' ? 'Shoreline' : 'Bayside'})</span>
          </div>
          ${item.notes ? `<div class="sched-note"><i class="fa-regular fa-note-sticky"></i> "${escapeHtml(item.notes)}"</div>` : ''}
        </div>
        <div class="sched-actions">
          <button class="sched-action-btn sched-action-nav" title="Navigate to Booth #${item.booth}">
            <i class="fa-solid fa-diamond-turn-right"></i>
          </button>
          <button class="sched-action-btn sched-action-edit" title="Edit Visit Details">
            <i class="fa-regular fa-pen-to-square"></i>
          </button>
          <button class="sched-action-btn sched-action-del" title="Remove from Visit Plan">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Attach card event listeners
  DOM.scheduledCardsList.querySelectorAll('.scheduled-card').forEach(card => {
    const id = card.dataset.id;
    const booth = card.dataset.booth;
    const item = AppState.visitSchedule.find(i => i.id === id);

    card.querySelector('.sched-check-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleVisitStatus(id);
    });

    card.querySelector('.sched-action-nav').addEventListener('click', (e) => {
      e.stopPropagation();
      if (item) {
        AppState.destLocation = { name: item.name, booth: item.booth };
        DOM.destInput.value = `${item.name} (Booth #${item.booth})`;
        DOM.clearDestBtn.style.display = 'block';

        if (!DOM.startInput.value.trim()) {
          AppState.startLocation = { name: 'Main Bayside Entrance', booth: '1000' };
          DOM.startInput.value = 'Main Bayside Entrance (Aisle #1000)';
          DOM.clearStartBtn.style.display = 'block';
        }

        switchTab('routing');
        focusBoothOnCanvas(item.booth);
        calculateAndRenderRoute();
        showToast(`Navigating to ${item.name} (Booth #${item.booth})`);
      }
    });

    card.querySelector('.sched-action-edit').addEventListener('click', (e) => {
      e.stopPropagation();
      if (item) {
        openScheduleModal(item.booth, item.name, item);
      }
    });

    card.querySelector('.sched-action-del').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteScheduleItem(id);
    });

    card.addEventListener('click', () => {
      focusBoothOnCanvas(booth);
    });
  });
}

function formatTimeDisplay(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Route All Scheduled Booths for the Selected Day in Sequence
 */
function routeScheduledDayBooths() {
  const activeDay = AppState.activeScheduleDay === 'all' ? '1' : AppState.activeScheduleDay;
  const dayItems = AppState.visitSchedule.filter(i => i.day === activeDay && !i.visited);

  if (dayItems.length === 0) {
    showToast(`No pending booths scheduled for Day ${activeDay}.`);
    return;
  }

  if (dayItems.length === 1) {
    const single = dayItems[0];
    AppState.destLocation = { name: single.name, booth: single.booth };
    DOM.destInput.value = `${single.name} (Booth #${single.booth})`;
    DOM.clearDestBtn.style.display = 'block';
    if (!DOM.startInput.value.trim()) {
      AppState.startLocation = { name: 'Main Bayside Entrance', booth: '1000' };
      DOM.startInput.value = 'Main Bayside Entrance (Aisle #1000)';
      DOM.clearStartBtn.style.display = 'block';
    }
    switchTab('routing');
    focusBoothOnCanvas(single.booth);
    calculateAndRenderRoute();
    showToast(`Routing to scheduled booth #${single.booth}`);
    return;
  }

  const first = dayItems[0];
  const second = dayItems[1];
  AppState.startLocation = { name: first.name, booth: first.booth };
  DOM.startInput.value = `${first.name} (Booth #${first.booth})`;
  DOM.clearStartBtn.style.display = 'block';

  AppState.destLocation = { name: second.name, booth: second.booth };
  DOM.destInput.value = `${second.name} (Booth #${second.booth})`;
  DOM.clearDestBtn.style.display = 'block';

  switchTab('routing');
  calculateAndRenderRoute();
  showToast(`Day ${activeDay}: Routing leg 1 (${first.name} ➔ ${second.name}). ${dayItems.length} stops planned.`);
}

/**
 * Clear All Visits for Currently Filtered Day
 */
function clearDaySchedule() {
  const activeDay = AppState.activeScheduleDay;
  if (activeDay === 'all') {
    if (AppState.visitSchedule.length === 0) return;
    if (confirm('Are you sure you want to clear your entire visit plan for all days?')) {
      AppState.visitSchedule = [];
      saveScheduleToStorage();
      renderScheduleView();
      showToast('All scheduled visits cleared');
    }
  } else {
    const remaining = AppState.visitSchedule.filter(i => i.day !== activeDay);
    AppState.visitSchedule = remaining;
    saveScheduleToStorage();
    renderScheduleView();
    showToast(`Day ${activeDay} schedule cleared`);
  }
}

/**
 * Export Schedule Itinerary to Text File & Clipboard
 */
function exportScheduleItinerary() {
  if (AppState.visitSchedule.length === 0) {
    showToast('Your visit schedule is currently empty.');
    return;
  }

  const days = ['1', '2', '3'];
  const dayNames = {
    '1': 'DAY 1: Wednesday, October 28, 2026',
    '2': 'DAY 2: Thursday, October 29, 2026',
    '3': 'DAY 3: Friday, October 30, 2026'
  };

  let report = `=====================================================\n`;
  report += `SUPPLYSIDE GLOBAL 2026 - MY EXPO VISIT ITINERARY\n`;
  report += `Mandalay Bay Convention Center, Las Vegas\n`;
  report += `Total Scheduled Visits: ${AppState.visitSchedule.length} Exhibitors\n`;
  report += `=====================================================\n\n`;

  days.forEach(d => {
    const items = AppState.visitSchedule.filter(i => i.day === d);
    report += `-----------------------------------------------------\n`;
    report += `${dayNames[d]} (${items.length} visits)\n`;
    report += `-----------------------------------------------------\n`;

    if (items.length === 0) {
      report += `  (No booths scheduled for this day)\n\n`;
    } else {
      items.forEach((it, idx) => {
        const status = it.visited ? '[VISITED]' : '[PENDING]';
        const time = it.time ? `at ${formatTimeDisplay(it.time)}` : '';
        report += `${idx + 1}. ${status} ${it.name} ${time}\n`;
        report += `   Booth #${it.booth} | Level ${it.level} (${it.level === '2' ? 'Shoreline Hall' : 'Bayside Hall'})\n`;
        if (it.notes) {
          report += `   Notes: ${it.notes}\n`;
        }
        report += `\n`;
      });
    }
  });

  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `SupplySide_Global_2026_My_Schedule.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (navigator.clipboard) {
    navigator.clipboard.writeText(report).catch(() => {});
  }

  showToast('Itinerary exported & copied to clipboard! 📋');
}

/**
 * Draw Scheduled Booth Beacon (Star / Badge on Map Canvas)
 */
function drawScheduledBoothBeacon(ctx, x, y, item) {
  const isVisited = item.visited;

  ctx.save();

  // Glow halo
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.fillStyle = isVisited ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.35)';
  ctx.fill();

  // Pin Circle
  ctx.beginPath();
  ctx.arc(x, y, 9, 0, Math.PI * 2);
  ctx.fillStyle = isVisited ? '#10b981' : '#f59e0b';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();

  // Day number or check inside circle
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 9px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isVisited ? '✓' : `D${item.day}`, x, y);

  ctx.restore();
}
