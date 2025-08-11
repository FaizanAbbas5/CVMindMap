/* CV Mind Map - Cytoscape.js App */

(function(){
  const cyContainer = document.getElementById('cy');
  const addNodeBtn = document.getElementById('addNodeBtn');
  const nodeTypeSelect = document.getElementById('nodeTypeSelect');
  const colorPicker = document.getElementById('colorPicker');
  const randomColorBtn = document.getElementById('randomColorBtn');
  const shapeSelect = document.getElementById('shapeSelect');
  const connectModeBtn = document.getElementById('connectModeBtn');
  const editLabelBtn = document.getElementById('editLabelBtn');
  const duplicateBtn = document.getElementById('duplicateBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const layoutSelect = document.getElementById('layoutSelect');
  const runLayoutBtn = document.getElementById('runLayoutBtn');
  const fitBtn = document.getElementById('fitBtn');
  const saveBtn = document.getElementById('saveBtn');
  const loadBtn = document.getElementById('loadBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importInput = document.getElementById('importInput');
  const clearBtn = document.getElementById('clearBtn');
  const inlineEditor = document.getElementById('inlineEditor');
  const statusText = document.getElementById('statusText');
  const moreMenuBtn = document.getElementById('moreMenuBtn');
  const moreMenu = document.getElementById('moreMenu');
  const searchInput = document.getElementById('searchInput');
  const hideUnmatched = document.getElementById('hideUnmatched');
  const typeFilters = {
    experience: document.getElementById('fltExperience'),
    skill: document.getElementById('fltSkill'),
    project: document.getElementById('fltProject'),
    education: document.getElementById('fltEducation'),
    certification: document.getElementById('fltCertification')
  };
  // tags removed
  const quickAddToggle = document.getElementById('quickAddToggle');
  const quickAddPanel = document.getElementById('quickAddPanel');
  const qaCloseBtn = document.getElementById('qaCloseBtn');
  // tabs now instead of select
  const qaTabs = Array.from(document.querySelectorAll('.qa-tab'));
  const qaExperience = document.getElementById('qaExperience');
  const qaSkill = document.getElementById('qaSkill');
  const qaProject = document.getElementById('qaProject');
  const qaAddBtn = document.getElementById('qaAddBtn');
  const versionSelect = document.getElementById('versionSelect');
  const restoreVersionBtn = document.getElementById('restoreVersionBtn');
  const clearVersionsBtn = document.getElementById('clearVersionsBtn');
  const saveVersionBtn = document.getElementById('saveVersionBtn');

  const typeToColor = {
    experience: '#6c5ce7',
    skill: '#00d1b2',
    project: '#fdcb6e',
    education: '#00a8ff',
    certification: '#ff7675'
  };
  const typeToShape = {
    experience: 'round-rectangle',
    skill: 'ellipse',
    project: 'diamond',
    education: 'rectangle',
    certification: 'hexagon'
  };

  function randomPastel(){
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue} 70% 62%)`;
  }

  function newId(prefix){
    return `${prefix}_${Math.random().toString(36).slice(2,9)}`;
  }

  if(typeof window.cytoscape !== 'function'){
    if(statusText){ statusText.textContent = 'Error: Cytoscape.js failed to load (check internet/CDN).'; }
    return;
  }

  const cy = cytoscape({
    container: cyContainer,
    elements: [],
    wheelSensitivity: 0.2,
    minZoom: 0.2,
    maxZoom: 3,
    style: [
      {
        selector: 'core',
        style: {
          'active-bg-opacity': 0,
          'selection-box-opacity': 0
        }
      },
      {
        selector: 'node',
        style: {
          'background-color': ele => ele.data('color') || typeToColor[ele.data('type')] || '#a29bfe',
          'label': 'data(label)',
          'color': '#f8f9ff',
          'font-size': '12px',
          'text-wrap': 'wrap',
          'text-max-width': 220,
          'text-valign': 'center',
          'text-halign': 'center',
          'border-width': 2,
          'border-color': 'rgba(255,255,255,.25)',
          'overlay-opacity': 0,
          'width': 'label',
          'height': 'label',
          'padding': '12px',
          'shape': ele => ele.data('shape') || typeToShape[ele.data('type')] || 'round-rectangle',
          'shadow-blur': 16,
          'shadow-color': 'rgba(0,0,0,.45)',
          'shadow-opacity': 1,
          'shadow-offset-x': 0,
          'shadow-offset-y': 6
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-color': '#fff',
          'border-width': 3
        }
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'straight',
          'line-color': '#aab0c6',
          'width': 2,
          'target-arrow-color': '#aab0c6',
          'target-arrow-shape': 'triangle',
          'arrow-scale': 1,
          'label': 'data(label)',
          'color': '#cfd3e8',
          'font-size': '11px',
          'text-background-color': 'rgba(12,14,30,.7)',
          'text-background-opacity': 1,
          'text-background-padding': '2px',
          'text-rotation': 'autorotate'
        }
      },
      {
        selector: 'edge:selected',
        style: {
          'line-color': '#fff',
          'target-arrow-color': '#fff',
          'width': 3
        }
      }
    ],
    layout: { name: 'cose', animate: true, fit: true, padding: 50 }
  });

  function setStatus(msg){ statusText.textContent = msg; }
  window.addEventListener('error', (e)=>{
    try { setStatus(`Error: ${e.message}`); } catch(_) {}
  });
  
  // ---------- Undo/Redo History ----------
  const history = { past: [], future: [], versions: [] };
  const HISTORY_LIMIT = 100;
  function snapshot(){
    const data = serialize();
    history.past.push(JSON.stringify(data));
    if(history.past.length > HISTORY_LIMIT) history.past.shift();
    history.future = [];
    // manual versions only
  }
  function saveVersion(label){
    const version = { id: newId('v'), label: `${new Date().toLocaleTimeString()} - ${label}`, data: serialize() };
    history.versions.push(version);
    if(history.versions.length > 50) history.versions.shift();
  }
  function updateVersionSelect(){
    if(!versionSelect) return;
    versionSelect.innerHTML = '';
    history.versions.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = v.label;
      versionSelect.appendChild(opt);
    });
  }
  function undo(){
    if(history.past.length === 0) return;
    const current = JSON.stringify(serialize());
    history.future.push(current);
    const prev = history.past.pop();
    deserialize(JSON.parse(prev));
    setStatus('Undone.');
  }
  function redo(){
    if(history.future.length === 0) return;
    const current = JSON.stringify(serialize());
    history.past.push(current);
    const next = history.future.pop();
    deserialize(JSON.parse(next));
    setStatus('Redone.');
  }

  function addNode(pos){
    const type = nodeTypeSelect.value;
    const label = `${type[0].toUpperCase()}${type.slice(1)} ${(cy.nodes().length+1)}`;
    const color = colorPicker.value || typeToColor[type] || randomPastel();
    const id = newId('n');
    const node = cy.add({ group:'nodes', data:{ id, label, type, color, tags: [] }, position: pos || { x: cy.width()/2, y: cy.height()/2 } });
    cy.$(':selected').unselect();
    node.select();
    applySearchAndFilters();
    return node;
  }

  function duplicateSelected(){
    const sel = cy.$(':selected');
    if(sel.length === 0){ setStatus('Nothing selected to duplicate.'); return; }
    cy.startBatch();
    const idMap = new Map();
    const nodes = sel.filter('node');
    const edges = sel.filter('edge');
    nodes.forEach(n => {
      const data = { ...n.data(), id: newId('n') };
      const position = { x: n.position('x') + 40, y: n.position('y') + 40 };
      const nn = cy.add({ group:'nodes', data, position });
      idMap.set(n.id(), nn.id());
    });
    edges.forEach(e => {
      const src = idMap.get(e.source().id()) || e.source().id();
      const tgt = idMap.get(e.target().id()) || e.target().id();
      cy.add({ group:'edges', data:{ ...e.data(), id: newId('e'), source: src, target: tgt } });
    });
    cy.endBatch();
    snapshot();
    applySearchAndFilters();
    setStatus('Duplicated selection.');
  }

  function editLabelFor(ele){
    if(!ele || ele.empty()) return;
    const isNode = ele.is('node');
    const bb = ele.renderedBoundingBox();
    const rect = cyContainer.getBoundingClientRect();
    const left = rect.left + bb.x1 + (bb.w/2) - 120;
    const top = rect.top + bb.y1 - 10 + (isNode ? bb.h/2 : 0);
    inlineEditor.style.left = `${left}px`;
    inlineEditor.style.top = `${top}px`;
    inlineEditor.style.width = '240px';
    inlineEditor.value = ele.data('label') || '';
    inlineEditor.style.display = 'block';
    inlineEditor.focus();
    inlineEditor.select();

    function commit(){
      const val = inlineEditor.value.trim();
      ele.data('label', val || (isNode ? ele.data('type') : ''));
      inlineEditor.style.display = 'none';
      window.removeEventListener('mousedown', onOutside);
      inlineEditor.onkeydown = null;
      snapshot();
      applySearchAndFilters();
    }
    function onOutside(e){ if(e.target !== inlineEditor){ commit(); } }
    window.addEventListener('mousedown', onOutside);
    inlineEditor.onkeydown = (ev)=>{
      if(ev.key === 'Enter'){ commit(); }
      if(ev.key === 'Escape'){ inlineEditor.style.display='none'; window.removeEventListener('mousedown', onOutside); }
    };
  }

  let connectMode = false;
  let connectSource = null;
  function toggleConnectMode(){
    connectMode = !connectMode;
    connectSource = null;
    connectModeBtn.classList.toggle('primary', connectMode);
    setStatus(connectMode ? 'Connect mode: click source node, then target node.' : 'Connect mode off.');
  }

  function connectNodes(a, b){
    if(!a || !b || a.id() === b.id()) return;
    cy.add({ group:'edges', data:{ id: newId('e'), source: a.id(), target: b.id(), label: '' } });
    setStatus(`Connected ${a.data('label')} → ${b.data('label')}`);
    snapshot();
  }

  function deleteSelected(){
    const sel = cy.$(':selected');
    if(sel.length === 0){ setStatus('Nothing selected to delete.'); return; }
    sel.remove();
    snapshot();
    applySearchAndFilters();
  }

  function setSelectedColor(color){
    const sel = cy.$(':selected');
    sel.filter('node').forEach(n => n.data('color', color));
  }
  function setSelectedShape(shape){
    const sel = cy.$(':selected');
    sel.filter('node').forEach(n => n.data('shape', shape));
  }

  function serialize(){
    return cy.json().elements;
  }
  function deserialize(elements){
    cy.elements().remove();
    cy.add(elements);
    cy.layout({ name: 'cose', animate: true, padding: 50 }).run();
    cy.fit(undefined, 50);
  }

  function saveLocal(){
    const data = serialize();
    const json = JSON.stringify(data);
    localStorage.setItem('cv_mindmap_data', json);
    // also download a JSON file for the user
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cv_mindmap.json'; a.click();
    URL.revokeObjectURL(url);
    setStatus('Saved locally and downloaded JSON.');
  }
  function loadLocal(){
    const raw = localStorage.getItem('cv_mindmap_data');
    if(!raw){ setStatus('No save found.'); return; }
    try{ deserialize(JSON.parse(raw)); setStatus('Loaded.'); } catch(err){ console.error(err); setStatus('Load failed'); }
  }
  function exportFile(){
    const blob = new Blob([JSON.stringify(serialize(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'cv_mindmap.json'; a.click();
    URL.revokeObjectURL(url);
  }
  
  // ---------- Export PNG/SVG ----------
  function exportPng(){
    const png = cy.png({ full: true, scale: 2, bg: '#0f1226' });
    const a = document.createElement('a'); a.href = png; a.download = 'cv_mindmap.png'; a.click();
  }
  function exportSvg(){
    if(typeof cy.svg !== 'function'){ setStatus('SVG export module not loaded.'); return; }
    const svgContent = cy.svg({ full: true, scale: 1 });
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cv_mindmap.svg'; a.click();
    URL.revokeObjectURL(url);
  }
  
  // Manual version controls
  saveVersionBtn?.addEventListener('click', ()=>{
    const label = prompt('Version label?', 'Manual save');
    if(label !== null){ saveVersion(label.trim() || 'Manual save'); updateVersionSelect(); setStatus('Version saved.'); }
  });
  restoreVersionBtn?.addEventListener('click', ()=>{
    const id = versionSelect.value;
    const v = history.versions.find(x=>x.id===id);
    if(v){ deserialize(v.data); setStatus('Version restored.'); }
  });
  clearVersionsBtn?.addEventListener('click', ()=>{ history.versions = []; updateVersionSelect(); setStatus('Versions cleared.'); });
  function importFile(file){
    const reader = new FileReader();
    reader.onload = () => {
      try { deserialize(JSON.parse(reader.result)); setStatus('Imported.'); } catch(err){ console.error(err); setStatus('Import failed'); }
    };
    reader.readAsText(file);
  }

  function runLayout(){
    const name = layoutSelect.value;
    const options = {
      cose: { name:'cose', animate:true, padding:50 },
      breadthfirst: { name:'breadthfirst', animate:true, padding:50, spacingFactor:1.2 },
      concentric: { name:'concentric', animate:true, padding:50, minNodeSpacing:30 },
      circle: { name:'circle', animate:true, padding:50 },
      grid: { name:'grid', animate:true, padding:50 }
    }[name] || { name:'cose', animate:true, padding:50 };
    cy.layout(options).run();
  }
  
  // ---------- Search & Filter ----------
  function applySearchAndFilters(){
    const q = (searchInput?.value || '').toLowerCase().trim();
    const activeTypes = new Set(Object.entries(typeFilters || {}).filter(([, el]) => el?.checked).map(([k]) => k));
    const hide = !!hideUnmatched?.checked;

    const nodes = cy.nodes();
    nodes.forEach(n => {
      const typeOk = activeTypes.size === 0 || activeTypes.has(n.data('type'));
      const label = (n.data('label') || '').toLowerCase();
      const match = q === '' || label.includes(q);
      const visible = typeOk && (match || !hide);
      n.style('display', visible ? 'element' : 'none');
    });
    cy.edges().forEach(e => {
      const s = e.source().style('display') !== 'none';
      const t = e.target().style('display') !== 'none';
      e.style('display', (s && t) ? 'element' : 'none');
    });
  }

  // Auto-load last save; otherwise seed example
  (function init(){
    const raw = localStorage.getItem('cv_mindmap_data');
    if(raw){
      try{
        deserialize(JSON.parse(raw));
        cy.fit(undefined, 50);
        snapshot();
        applySearchAndFilters();
        setStatus('Loaded last save.');
        return;
      }catch(err){ console.error('Autoload failed:', err); }
    }
    const seedNodes = [
      { id: 'me', label: 'Your Name', type: 'experience', color: '#6c5ce7' },
      { id: 'exp1', label: 'Software Engineer @ Company', type: 'experience', color: '#6c5ce7' },
      { id: 'skill_js', label: 'JavaScript', type: 'skill', color: '#00d1b2' },
      { id: 'skill_py', label: 'Python', type: 'skill', color: '#00d1b2' },
      { id: 'proj1', label: 'Project: Mind Map', type: 'project', color: '#fdcb6e' },
      { id: 'edu', label: 'BSc Computer Science', type: 'education', color: '#00a8ff' }
    ];
    const seedEdges = [
      { id: 'e1', source: 'me', target: 'exp1', label: 'worked at' },
      { id: 'e2', source: 'me', target: 'skill_js', label: 'knows' },
      { id: 'e3', source: 'me', target: 'skill_py', label: 'knows' },
      { id: 'e4', source: 'skill_js', target: 'proj1', label: 'used in' },
      { id: 'e5', source: 'me', target: 'edu', label: 'studied' }
    ];
    cy.add(seedNodes.map(d=>({ group:'nodes', data:d })));
    cy.add(seedEdges.map(d=>({ group:'edges', data:d })));
    cy.layout({ name:'cose', animate:true, padding:50 }).run();
    cy.fit(undefined, 50);
    snapshot();
    setStatus('Example loaded. Use Save to keep your work.');
  })();

  // Interactions
  addNodeBtn.addEventListener('click', () => addNode());
  undoBtn?.addEventListener('click', undo);
  redoBtn?.addEventListener('click', redo);
  randomColorBtn.addEventListener('click', () => {
    const c = randomPastel();
    colorPicker.value = rgbToHex(c);
    setSelectedColor(colorPicker.value);
  });
  colorPicker.addEventListener('input', () => setSelectedColor(colorPicker.value));
  shapeSelect?.addEventListener('change', () => setSelectedShape(shapeSelect.value));
  connectModeBtn.addEventListener('click', toggleConnectMode);
  editLabelBtn.addEventListener('click', () => editLabelFor(cy.$(':selected').first()));
  duplicateBtn.addEventListener('click', duplicateSelected);
  deleteBtn.addEventListener('click', deleteSelected);
  runLayoutBtn.addEventListener('click', runLayout);
  fitBtn.addEventListener('click', () => cy.fit(undefined, 60));
  saveBtn.addEventListener('click', saveLocal);
  loadBtn.addEventListener('click', loadLocal);
  exportBtn.addEventListener('click', (e)=>{
    if(e.shiftKey) return exportPng();
    if(e.ctrlKey || e.metaKey) return exportSvg();
    exportFile();
  });
  importInput.addEventListener('change', (e)=>{ if(e.target.files[0]) importFile(e.target.files[0]); e.target.value=''; });
  clearBtn.addEventListener('click', ()=>{ cy.elements().remove(); setStatus('Cleared.'); snapshot(); });

  // More menu toggling and outside click close
  function toggleMore(open){
    if(!moreMenu) return;
    const willOpen = open ?? moreMenu.classList.contains('hidden');
    moreMenu.classList.toggle('hidden', !willOpen);
    moreMenuBtn?.classList.toggle('primary', willOpen);
  }
  moreMenuBtn?.addEventListener('click', ()=> toggleMore());
  window.addEventListener('mousedown', (e)=>{
    if(!moreMenu || moreMenu.classList.contains('hidden')) return;
    const within = moreMenu.contains(e.target) || moreMenuBtn.contains(e.target);
    if(!within) toggleMore(false);
  });

  cy.on('tap', (evt)=>{
    if(connectMode){
      const tgt = evt.target;
      if(tgt && tgt.is && tgt.is('node')){
        if(!connectSource){ connectSource = tgt; setStatus('Source selected. Now click target.'); }
        else { connectNodes(connectSource, tgt); connectSource = null; }
      }
    }
  });

  cy.on('cxttap', 'node', (evt)=>{
    // Right click to quickly add child and connect
    const parent = evt.target;
    const p = parent.position();
    const child = addNode({ x: p.x + 140, y: p.y + 40 });
    connectNodes(parent, child);
  });

  // Double-tap/double-click to edit label (works without extra extensions)
  let lastTapAt = 0;
  let lastTapId = null;
  cy.on('tap', 'node, edge', (evt)=>{
    if(connectMode) return; // connect handler already uses tap
    const now = performance.now();
    const id = evt.target.id();
    const isDouble = lastTapId === id && (now - lastTapAt) < 350;
    if(isDouble){ editLabelFor(evt.target); lastTapId = null; lastTapAt = 0; }
    else { lastTapId = id; lastTapAt = now; }
  });
  // Fallback: double-click on the canvas area should edit selected element if any
  cyContainer.addEventListener('dblclick', ()=>{
    const sel = cy.$(':selected');
    if(!sel.empty()) editLabelFor(sel.first());
  });
  cy.on('free', 'node', ()=> { setStatus('Node moved.'); snapshot(); });

  window.addEventListener('keydown', (e)=>{
    if(e.key === 'Delete' || e.key === 'Backspace'){
      if(document.activeElement === inlineEditor) return;
      deleteSelected(); snapshot();
    }
    if(e.ctrlKey && e.key.toLowerCase() === 's'){
      e.preventDefault(); saveLocal();
    }
    if(e.ctrlKey && e.key.toLowerCase() === 'z'){ e.preventDefault(); undo(); }
    if(e.ctrlKey && e.key.toLowerCase() === 'y'){ e.preventDefault(); redo(); }
  });

  function rgbToHex(input){
    if(input.startsWith('#')) return input;
    // handle hsl to hex
    if(input.startsWith('hsl')){
      const [h, s, l] = input.match(/\d+/g).map(Number);
      const c = (1 - Math.abs(2*l/100 - 1)) * (s/100);
      const x = c * (1 - Math.abs(((h/60) % 2) - 1));
      const m = l/100 - c/2;
      let r=0,g=0,b=0;
      if(0<=h && h<60){ [r,g,b] = [c,x,0]; }
      else if(60<=h && h<120){ [r,g,b] = [x,c,0]; }
      else if(120<=h && h<180){ [r,g,b] = [0,c,x]; }
      else if(180<=h && h<240){ [r,g,b] = [0,x,c]; }
      else if(240<=h && h<300){ [r,g,b] = [x,0,c]; }
      else { [r,g,b] = [c,0,x]; }
      r = Math.round((r+m)*255); g = Math.round((g+m)*255); b = Math.round((b+m)*255);
      return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
    }
    return '#6c5ce7';
  }
  
  // ---------- Quick Add Panel ----------
  function showQA(show){ quickAddPanel.classList.toggle('hidden', !show); }
  quickAddToggle?.addEventListener('click', ()=> showQA(quickAddPanel.classList.contains('hidden')));
  qaCloseBtn?.addEventListener('click', ()=> showQA(false));
  let qaCurrent = 'experience';
  function setQaTab(t){
    qaCurrent = t;
    qaTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.type === t));
    qaExperience.classList.toggle('hidden', t !== 'experience');
    qaSkill.classList.toggle('hidden', t !== 'skill');
    qaProject.classList.toggle('hidden', t !== 'project');
  }
  qaTabs.forEach(tab => tab.addEventListener('click', ()=> setQaTab(tab.dataset.type)));
  qaAddBtn?.addEventListener('click', ()=>{
    const t = qaCurrent;
    let label = '';
    if(t==='experience'){
      const role = document.getElementById('qaRole').value.trim();
      const company = document.getElementById('qaCompany').value.trim();
      const dates = document.getElementById('qaDates').value.trim();
      if(!role){ document.getElementById('qaRole').classList.add('invalid'); return; }
      document.getElementById('qaRole').classList.remove('invalid');
      label = [role, company && `@ ${company}`, dates && `(${dates})`].filter(Boolean).join(' ');
    } else if(t==='skill'){
      const name = document.getElementById('qaSkillName').value.trim();
      const level = document.getElementById('qaSkillLevel').value.trim();
      if(!name){ document.getElementById('qaSkillName').classList.add('invalid'); return; }
      document.getElementById('qaSkillName').classList.remove('invalid');
      label = [name, level && `- ${level}`].filter(Boolean).join(' ');
    } else if(t==='project'){
      const name = document.getElementById('qaProjectName').value.trim();
      const stack = document.getElementById('qaProjectStack').value.trim();
      const link = document.getElementById('qaProjectLink').value.trim();
      if(!name){ document.getElementById('qaProjectName').classList.add('invalid'); return; }
      document.getElementById('qaProjectName').classList.remove('invalid');
      label = [name, stack && `(${stack})`, link].filter(Boolean).join(' ');
    }
    const node = addNode();
    node.data('type', t);
    node.data('label', label || node.data('label'));
    // no tags
    snapshot();
    showQA(false);
  });

  // Initialize default tab
  setQaTab('experience');

  // ---------- Search controls listeners ----------
  function initSearchListeners(){
    const controls = [searchInput, hideUnmatched, ...Object.values(typeFilters)];
    controls.forEach(el => {
      if(!el) return;
      el.addEventListener('input', applySearchAndFilters);
      el.addEventListener('change', applySearchAndFilters);
    });
  }
  initSearchListeners();
})();


