/* matrimony.js
   Host this on GitHub and serve via jsDelivr:
   https://cdn.jsdelivr.net/gh/YOUR_GITHUB_USERNAME/REPO_NAME@latest/matrimony.js
*/

/* ---------- Utilities ---------- */
(function(){
  const $ = (s, el=document) => el.querySelector(s);
  const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
  const uid = (n=8) => Math.random().toString(36).slice(2,2+n);

  // DOM refs
  const profilesGrid = document.getElementById('profilesGrid');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const btnLogin = document.getElementById('btnLogin');
  const btnHome = document.getElementById('btnHome');
  const openCreate = document.getElementById('openCreate');
  const clearData = document.getElementById('clearData');
  const modalRoot = document.getElementById('modalRoot');
  const yearEl = document.getElementById('year');

  if(yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- LocalStorage keys ---------- */
  const LS_USER = 'im_user';
  const LS_PROFILES = 'im_profiles';

  function loadProfiles(){ try{ return JSON.parse(localStorage.getItem(LS_PROFILES) || '[]') }catch(e){return []} }
  function saveProfiles(list){ localStorage.setItem(LS_PROFILES, JSON.stringify(list)) }
  function loadUser(){ try{ return JSON.parse(localStorage.getItem(LS_USER) || 'null') }catch(e){return null} }
  function saveUser(u){ localStorage.setItem(LS_USER, JSON.stringify(u)) }

  let profiles = loadProfiles();
  let currentUser = loadUser();

  /* ---------- Seed demo if empty ---------- */
  if(!profiles || profiles.length === 0){
    profiles = [
      { id: uid(6), name: 'Priya Sharma', age: 26, city: 'Delhi', education: 'MBA', short: 'Friendly, family-oriented. Looking for a caring partner.', photo: '', religion:'Hindu' },
      { id: uid(6), name: 'Rohit Verma', age: 29, city: 'Mumbai', education: 'Software Engineer', short: 'Career-minded and ambitious. Loves travel.', photo: '', religion:'Hindu' },
      { id: uid(6), name: 'Anjali Gupta', age: 24, city: 'Lucknow', education: 'Teacher', short: 'Loves books and music. Simple living.', photo: '', religion:'Hindu' },
    ];
    saveProfiles(profiles);
  }

  /* ---------- Helpers ---------- */
  function escapeHtml(s=''){ return String(s).replace(/[&<>"']/g, (m)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function initials(name='U'){ return (name.split(' ').map(n=>n[0]).slice(0,2).join('')||'U').toUpperCase(); }

  /* ---------- Render & SEO ---------- */
  function updateLDJSON(){
    const container = document.getElementById('ldjson');
    if(!container) return;
    const people = profiles.map(p => ({
      "@context":"https://schema.org",
      "@type":"Person",
      "name": p.name,
      "image": p.photo || '',
      "jobTitle": p.education || '',
      "address": { "@type":"PostalAddress", "addressLocality": p.city || '' },
      "description": p.short || ''
    }));
    container.textContent = people.map(x => JSON.stringify(x)).join('\n');
  }

  function profileCardHTML(p){
    const img = p.photo ? `<img src="${p.photo}" alt="Photo of ${escapeHtml(p.name)}" class="avatar" loading="lazy">` :
               `<div class="avatar" style="display:flex;align-items:center;justify-content:center;color:#fff;background:linear-gradient(90deg,#e63946,#ff7b7b);font-weight:700">${initials(p.name)}</div>`;
    return `
      <div class="profile" data-id="${p.id}" itemscope itemtype="https://schema.org/Person">
        ${img}
        <div class="pinfo">
          <h3 itemprop="name">${escapeHtml(p.name)}</h3>
          <p class="muted"><span itemprop="jobTitle">${escapeHtml(p.education||'')}</span> • <span itemprop="address" itemscope itemtype="https://schema.org/PostalAddress"><span itemprop="addressLocality">${escapeHtml(p.city||'')}</span></span></p>
          <div class="tags">${escapeHtml(p.age || '')} yrs • ${escapeHtml(p.religion || '')}</div>
        </div>
        <div class="pactions">
          <button class="small-btn view-btn" data-action="view" aria-label="View profile">View</button>
          <button class="small-btn connect-btn" data-action="connect" aria-label="Connect">Connect</button>
        </div>
      </div>
    `;
  }

  function renderProfiles(list=profiles){
    if(!profilesGrid) return;
    profilesGrid.innerHTML = list.map(profileCardHTML).join('');
    // attach handlers
    Array.from(profilesGrid.querySelectorAll('.profile')).forEach(card=>{
      const id = card.getAttribute('data-id');
      const viewBtn = card.querySelector('[data-action="view"]');
      const connectBtn = card.querySelector('[data-action="connect"]');
      if(viewBtn) viewBtn.addEventListener('click', ()=> openView(id));
      if(connectBtn) connectBtn.addEventListener('click', ()=> connectAction(id));
    });
    updateLDJSON();
  }
  renderProfiles();

  /* ---------- Search ---------- */
  function performSearch(){
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    if(!q){ renderProfiles(); return; }
    const res = profiles.filter(p => (p.name||'').toLowerCase().includes(q) || (p.city||'').toLowerCase().includes(q) || (p.education||'').toLowerCase().includes(q));
    renderProfiles(res);
  }
  if(searchBtn) searchBtn.addEventListener('click', performSearch);
  if(searchInput) searchInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter') performSearch(); });

  /* ---------- Modal ---------- */
  function showModal(contentHTML){
    if(!modalRoot) return;
    modalRoot.style.display = 'block';
    modalRoot.innerHTML = `<div class="modal-back" role="dialog" aria-modal="true" style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.35);z-index:60">
      <div class="modal" style="width:100%;max-width:720px;background:#fff;border-radius:14px;padding:18px;box-shadow:0 12px 40px rgba(10,15,30,0.12);position:relative">
        ${contentHTML}
        <button class="close" style="position:absolute;right:12px;top:12px;border:0;background:transparent;font-size:18px;cursor:pointer">✕</button>
      </div>
    </div>`;
    const close = modalRoot.querySelector('.close');
    close && close.addEventListener('click', closeModal);
    modalRoot.querySelector('.modal-back').addEventListener('click', (ev)=>{ if(ev.target.classList.contains('modal-back')) closeModal(); });
  }
  function closeModal(){ if(!modalRoot) return; modalRoot.style.display='none'; modalRoot.innerHTML=''; }

  /* ---------- Auth UI ---------- */
  if(btnLogin) btnLogin.addEventListener('click', ()=> showAuth());
  if(btnHome) btnHome.addEventListener('click', ()=> { renderProfiles(); window.scrollTo({top:0,behavior:'smooth'}); });

  function showAuth(msg){
    const hint = msg ? `<div class="notice">${escapeHtml(msg)}</div>` : '';
    const html = `
      <div style="display:flex;gap:18px;flex-direction:column;">
        <h3 style="margin:0">Login / Signup</h3>
        ${hint}
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:260px;">
            <label>Login (email)</label>
            <input id="loginEmail" placeholder="you@example.com" style="width:100%;padding:8px;border-radius:8px;border:1px solid #eee" />
            <label style="margin-top:8px">Password</label>
            <input id="loginPass" type="password" placeholder="password" style="width:100%;padding:8px;border-radius:8px;border:1px solid #eee" />
            <div style="display:flex;gap:8px;margin-top:10px;">
              <button id="doLogin" class="primary" style="padding:8px 12px;background:#e63946;color:#fff;border-radius:8px;border:0">Login</button>
              <button id="toSignup" class="ghost" style="padding:8px 12px;border-radius:8px;border:1px solid #eee">Signup</button>
            </div>
          </div>
          <div style="flex:1;min-width:260px;">
            <label>Signup</label>
            <input id="signupName" placeholder="Full name" style="width:100%;padding:8px;border-radius:8px;border:1px solid #eee" />
            <input id="signupEmail" placeholder="Email" style="margin-top:8px;width:100%;padding:8px;border-radius:8px;border:1px solid #eee" />
            <input id="signupPass" type="password" placeholder="Password" style="margin-top:8px;width:100%;padding:8px;border-radius:8px;border:1px solid #eee" />
            <div style="display:flex;gap:8px;margin-top:10px;">
              <button id="doSignup" class="primary" style="padding:8px 12px;background:#2a9d8f;color:#fff;border-radius:8px;border:0">Create Account</button>
              <button id="demoLogin" class="ghost" style="padding:8px 12px;border-radius:8px;border:1px solid #eee">Quick Demo Login</button>
            </div>
          </div>
        </div>
      </div>
    `;
    showModal(html);
    setTimeout(()=>{
      const elDoLogin = document.getElementById('doLogin');
      const elDoSignup = document.getElementById('doSignup');
      const elDemoLogin = document.getElementById('demoLogin');
      const elToSignup = document.getElementById('toSignup');

      elDoLogin && elDoLogin.addEventListener('click', ()=>{
        const email = (document.getElementById('loginEmail')||{}).value.trim();
        const pass = (document.getElementById('loginPass')||{}).value.trim();
        if(!email || !pass) return alert('Please fill both fields');
        const user = { id: uid(6), name: email.split('@')[0], email, avatar: '' };
        currentUser = user; saveUser(user); closeModal(); renderUserState(); alert('Logged in as ' + user.name);
      });

      elToSignup && elToSignup.addEventListener('click', ()=> { (document.getElementById('signupName')||{}).focus(); });

      elDoSignup && elDoSignup.addEventListener('click', ()=>{
        const name = (document.getElementById('signupName')||{}).value.trim();
        const email = (document.getElementById('signupEmail')||{}).value.trim();
        const pass = (document.getElementById('signupPass')||{}).value.trim();
        if(!name || !email || !pass) return alert('Complete all fields');
        const user = { id: uid(6), name, email, avatar: '' };
        currentUser = user; saveUser(user); closeModal(); renderUserState(); alert('Account created. Welcome ' + name);
      });

      elDemoLogin && elDemoLogin.addEventListener('click', ()=>{
        const user = { id:'demo', name:'DemoUser', email:'demo@inspire.com', avatar:'' };
        currentUser = user; saveUser(user); closeModal(); renderUserState(); alert('Logged in as DemoUser');
      });
    },40);
  }

  function renderUserState(){
    if(!btnLogin) return;
    if(currentUser){
      btnLogin.textContent = `Hi, ${currentUser.name.split(' ')[0]} • Logout`;
      btnLogin.classList.remove('primary');
      btnLogin.onclick = ()=> { if(confirm('Logout?')){ currentUser=null; saveUser(null); btnLogin.textContent='Login / Signup'; btnLogin.classList.add('primary'); btnLogin.onclick = ()=> showAuth(); } };
    } else {
      btnLogin.textContent = 'Login / Signup';
      btnLogin.classList.add('primary');
      btnLogin.onclick = ()=> showAuth();
    }
  }
  renderUserState();

  /* ---------- Create / Edit Profile ---------- */
  openCreate && openCreate.addEventListener('click', ()=>{
    if(!currentUser) return showAuth('Please login/signup before creating a profile.');
    showModal(renderProfileForm());
  });

  function renderProfileForm(existing){
    const isEdit = !!existing;
    const html = `
      <div>
        <h3>${isEdit ? 'Edit Profile' : 'Create Profile'}</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
          <div><label>Full name</label><input id="pf_name" value="${existing?escapeHtml(existing.name):escapeHtml((currentUser && currentUser.name) || '')}" style="width:100%;padding:8px;border-radius:8px;border:1px solid #eee" /></div>
          <div><label>Age</label><input id="pf_age" type="number" min="18" value="${existing?escapeHtml(existing.age||'25'):'25'}" style="width:100%;padding:8px;border-radius:8px;border:1px solid #eee" /></div>
          <div><label>City</label><input id="pf_city" value="${existing?escapeHtml(existing.city||'') : ''}" style="width:100%;padding:8px;border-radius:8px;border:1px solid #eee" /></div>
          <div><label>Education / Profession</label><input id="pf_edu" value="${existing?escapeHtml(existing.education||'') : ''}" style="width:100%;padding:8px;border-radius:8px;border:1px solid #eee" /></div>
          <div style="grid-column:1/3"><label>Short description</label><textarea id="pf_short" rows="3" style="width:100%;padding:8px;border-radius:8px;border:1px solid #eee">${existing?escapeHtml(existing.short||'') : ''}</textarea></div>
          <div style="grid-column:1/3"><label>Upload photo</label><input id="pf_photo" type="file" accept="image/*" /><div id="pf_preview" style="margin-top:8px">${existing && existing.photo ? `<img src="${existing.photo}" alt="preview" style="width:120px;height:120px;border-radius:8px;object-fit:cover">` : ''}</div></div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">
          <button id="pf_save" style="padding:8px 12px;background:#e63946;color:#fff;border:0;border-radius:8px">Save</button>
          <button id="pf_cancel" style="padding:8px 12px;border-radius:8px;border:1px solid #eee">Cancel</button>
        </div>
      </div>
    `;
    setTimeout(()=>{
      const pfPhoto = document.getElementById('pf_photo');
      if(pfPhoto) pfPhoto.addEventListener('change', handlePreview);
      document.getElementById('pf_cancel') && document.getElementById('pf_cancel').addEventListener('click', closeModal);
      document.getElementById('pf_save') && document.getElementById('pf_save').addEventListener('click', ()=>{
        const name = (document.getElementById('pf_name')||{}).value.trim();
        const age = (document.getElementById('pf_age')||{}).value.trim();
        const city = (document.getElementById('pf_city')||{}).value.trim();
        const edu = (document.getElementById('pf_edu')||{}).value.trim();
        const short = (document.getElementById('pf_short')||{}).value.trim();
        const previewEl = document.querySelector('#pf_preview img');
        const photo = previewEl ? previewEl.src : '';
        if(!name) return alert('Please enter name');
        const newP = { id: existing?existing.id:uid(6), name, age, city, education:edu, short, photo };
        if(existing){
          profiles = profiles.map(x=> x.id===existing.id ? newP : x);
        } else {
          profiles.unshift(newP);
        }
        saveProfiles(profiles);
        renderProfiles();
        closeModal();
        alert('Profile saved');
      });
    },40);
    return html;
  }

  function handlePreview(e){
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = (ev)=> {
      const cont = document.getElementById('pf_preview');
      if(cont) cont.innerHTML = `<img src="${ev.target.result}" alt="preview" style="width:120px;height:120px;border-radius:8px;object-fit:cover">`;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- View profile ---------- */
  function openView(id){
    const p = profiles.find(x=>x.id===id);
    if(!p) return alert('Profile not found');
    showModal(renderProfileView(p));
  }

  function renderProfileView(p){
    const img = p.photo ? `<img src="${p.photo}" alt="${escapeHtml(p.name)}" style="width:160px;height:160px;border-radius:10px;object-fit:cover">` :
               `<div style="width:160px;height:160px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:linear-gradient(90deg,#e63946,#ff7b7b);color:#fff;font-weight:700;font-size:28px">${initials(p.name)}</div>`;
    const html = `
      <div style="display:flex;gap:14px;align-items:flex-start">
        <div style="flex-shrink:0">${img}</div>
        <div style="flex:1">
          <h2 style="margin:0">${escapeHtml(p.name)}</h2>
          <div class="muted" style="margin-top:6px">${escapeHtml(p.age)} years • ${escapeHtml(p.city)} • ${escapeHtml(p.education||'')}</div>
          <p style="margin-top:12px">${escapeHtml(p.short||'No description provided.')}</p>
          <div style="margin-top:14px;display:flex;gap:8px">
            <button id="connectNow" style="padding:8px 12px;background:#2a9d8f;color:#fff;border:0;border-radius:8px">Connect</button>
            <button id="shareProfile" style="padding:8px 12px;border-radius:8px;border:1px solid #eee">Share</button>
            <button id="editProfile" style="padding:8px 12px;border-radius:8px;border:1px solid #eee">Edit</button>
          </div>
        </div>
      </div>
    `;
    setTimeout(()=>{
      const c = document.getElementById('connectNow');
      const s = document.getElementById('shareProfile');
      const e = document.getElementById('editProfile');
      c && c.addEventListener('click', ()=>{ closeModal(); connectAction(p.id); });
      s && s.addEventListener('click', ()=>{ copyToClipboard(`Profile of ${p.name} — ${p.short}`); alert('Profile summary copied to clipboard'); });
      e && e.addEventListener('click', ()=>{ closeModal(); showModal(renderProfileForm(p)); });
    },40);
    return html;
  }

  function connectAction(id){
    const p = profiles.find(x=>x.id===id);
    if(!p) return;
    if(!currentUser) return showAuth('Please login or signup to connect with profiles.');
    alert(`Connection request sent to ${p.name}. (Demo local action)`);
  }

  function copyToClipboard(text){
    try{
      navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text) : (function(){ const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta); })();
    }catch(e){}
  }

  /* ---------- Clear Demo Data ---------- */
  clearData && clearData.addEventListener('click', ()=>{
    if(!confirm('Clear all demo profiles and reset?')) return;
    profiles=[]; saveProfiles(profiles); localStorage.removeItem(LS_PROFILES); localStorage.removeItem(LS_USER); currentUser=null; saveUser(null);
    renderProfiles(); renderUserState();
    alert('Data cleared. Refresh page to reload demo seed.');
  });

  // ensure initial render
  renderProfiles();
})();
