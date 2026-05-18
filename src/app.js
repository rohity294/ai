let CERTS = [];
let LOGO_MAP = {};
let LOAD_ERROR = null;

async function loadData(){
  if (CERTS.length) return;
  try {
    const [certRes, logoRes] = await Promise.all([
      fetch('src/data/cert.json'),
      fetch('src/data/logo.json')
    ]);
    if (!certRes.ok) throw new Error('Failed to load cert.json');
    if (!logoRes.ok) throw new Error('Failed to load logo.json');
    CERTS = await certRes.json();
    LOGO_MAP = await logoRes.json();
  } catch (err) {
    console.error('Error loading data files:', err);
    LOAD_ERROR = (err && err.message) ? err.message : String(err);
    CERTS = [];
    LOGO_MAP = {};
  }
}

function groupByProvider(list){
  return list.reduce((acc, item)=>{
    (acc[item.provider] ||= []).push(item);
    return acc;
  }, {});
}

function renderHome(){
  const app = document.getElementById('app');
  if (LOAD_ERROR) {
    app.innerHTML = `
      <div class="about-card">
        <h2>Data load error</h2>
        <p class="small">Failed to load certification data: ${LOAD_ERROR}</p>
        <p class="small">Ensure the site is served over HTTP and that \`src/data/cert.json\` and \`src/data/logo.json\` are accessible.</p>
      </div>`;
    return;
  }
  const grouped = groupByProvider(CERTS);
  const hero = `
    <section class="hero">
      <div class="intro">
        <p class="small">A professional catalog of globally recognized certifications, organized by issuing organization for easy discovery and verification.</p>
      </div>
      <div class="stats small">
        <div><span class="metric-number">${CERTS.length}</span><span class="metric-label"> Certifications</span></div>
        <div style="margin-top:8px;color:var(--muted)">Grouped by provider</div>
      </div>
    </section>
  `;

  let body = hero;

  // iterate providers in the same order they first appear in `cert.json`
  Object.keys(grouped).forEach(provider=>{
    const items = grouped[provider];
    const sanitize = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    const providerClass = 'prov-' + sanitize(provider);
    // helper to detect MCT and levels
    const isMctName = (s) => /mct|microsoft certified trainer/i.test(s);
    const hasAssociate = (s) => /associate/i.test(s);
    const hasExpert = (s) => /expert/i.test(s);
    const hasProfessional = (s) => /professional/i.test(s);
    // preserve original order from cert.json; do not reorder items
    const cards = items.map(it=>{
      const logo = LOGO_MAP[provider] || `assets/logos/Logo_${provider}.png`;
      const isMct = isMctName(it.name);
      // level precedence: Expert > Professional > Associate
      let levelClass = '';
      if (hasExpert(it.name)) levelClass = ' level-expert';
      else if (hasProfessional(it.name)) levelClass = ' level-professional';
      else if (hasAssociate(it.name)) levelClass = ' level-associate';
      const extraClass = (isMct ? ' mct' : '') + levelClass;
      // provide accessible labeling; if this is an MCT card, include that in the aria-label
      const roleAttr = `role="article" aria-label="${isMct ? 'Microsoft Certified Trainer — ' : ''}${it.name}"`;
      return (`
      <article class="card ${providerClass}${extraClass}" tabindex="0" ${roleAttr}>
        <img class="cert-logo" src="${logo}" alt="${it.provider} logo" loading="lazy" />
        <div class="cert-name">${it.name}</div>
        <div class="cert-provider">${it.provider}</div>
        <div class="cert-desc">${it.desc}</div>
      </article>
      `);
    }).join('');

    const logoForProvider = LOGO_MAP[provider] || `assets/logos/Logo_${provider}.png`;
    body += `
      <section class="provider-section ${providerClass}">
        <div class="provider-header" role="region" aria-label="${provider}" tabindex="0">
          <img class="provider-header-logo" src="${logoForProvider}" alt="${provider} logo" loading="lazy" width="160" height="60" />
          <h2 class="sr-only">${provider}</h2>
          <div class="small" aria-hidden="true">${items.length} certification(s)</div>
        </div>
        <div class="grid">${cards}</div>
      </section>
    `;
  });

  app.innerHTML = body;
}

function renderAbout(){
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="about-card">
      <h2>About</h2>
      <p>Rohit Kumar Singh is a technology professional focused on cloud-native architectures, software engineering, AI fluency, and technical education. He applies machine learning and generative AI to improve engineering workflows and deliver practical solutions. This portfolio documents formal certifications earned across leading technology providers and programs.</p>
      <p class="small" style="margin-top:12px">The portfolio is curated for verification and professional presentation; it highlights credentials and their issuing organizations.</p>
    </section>
  `;
}

function renderContact(){
  const app = document.getElementById('app');
  app.innerHTML = `
    <section class="about-card">
      <h2>Contact</h2>
      <p class="small">Connect via LinkedIn:</p>
      <ul class="contact-list">
        <li><a href="https://www.linkedin.com/in/rohit-kumar-singh" target="_blank" rel="noopener noreferrer">https://www.linkedin.com/in/rohit-kumar-singh</a></li>
      </ul>
    </section>
  `;
}

async function router(){
  if (!CERTS.length) await loadData();
  const hash = location.hash.replace('#','') || '/';
  if(hash === '/' || hash === '' ) return renderHome();
  if(hash.startsWith('/about')) return renderAbout();
  if(hash.startsWith('/contact')) return renderContact();
  // fallback to home
  renderHome();
}

window.addEventListener('hashchange', ()=>{ router(); });
window.addEventListener('DOMContentLoaded', async ()=>{
  // attach basic nav link behavior (optional)
  document.querySelectorAll('[data-route]').forEach(a=>a.addEventListener('click', ()=>{}));
  await router();
});
