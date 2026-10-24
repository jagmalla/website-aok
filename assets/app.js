/* Analysis of Karma — site application (React 18, no build step).
   Loaded by index.html as /assets/app.js?v=<version>; render.php sets the version automatically. */
/* ---- DCLogic bridge: adapts the Claude Design component to plain React 18 ---- */
class DCLogic extends React.Component {
  UNSAFE_componentWillMount(){ if(typeof this.componentWillMount==='function') this.componentWillMount(); }
  __setLogicState(update, cb){ this.setState(update, cb); }
  renderVals(){ return {}; }
  render(){ return this.renderVals().app || null; }
}
const StreamableLogic = DCLogic;

/* ================= Analysis of Karma — site component ================= */
class Component extends DCLogic {
  P = { bg:'#FAF8F5', bgAlt:'#F3EFE6', card:'#FFFCF7', ink:'#3A3D42', maroon:'#1E2022', maroonD:'#141517', red:'#8C6D33', redD:'#6E5426', gold:'#A68446', goldL:'#DFC286', cream:'#FFFDF8', muted:'#6B6E73', line:'rgba(166,132,70,.22)', white:'#FFFFFF', ok:'#3f7d4e', bad:'#b4452f' };
  HEAD = "'Plus Jakarta Sans',sans-serif";
  SERIF = "'Cormorant Garamond',Georgia,serif";
  _hist=[]; _fut=[]; _baseline=null; _drag=null;
  STR = {
    en:{home:'Home',about:'About Us',services:'Services',meditation:'Meditation',blog:'Blog',faq:'FAQ',contact:'Contact',book:'Book a Consultation',consult:'Talk to Jag Mallah',explore:'Explore Services',readmore:'Read more',follow:'Follow the journey',admin:'Admin',quicklinks:'Quick Links',getintouch:'Get in touch'},
    hi:{home:'होम',about:'हमारे बारे में',services:'सेवाएँ',meditation:'ध्यान',blog:'ब्लॉग',faq:'सामान्य प्रश्न',contact:'संपर्क',book:'परामर्श बुक करें',consult:'जग मल्लाह से बात करें',explore:'सेवाएँ देखें',readmore:'और पढ़ें',follow:'यात्रा से जुड़ें',admin:'एडमिन',quicklinks:'त्वरित लिंक',getintouch:'संपर्क करें'}
  };

  state = (()=>{
    let stored=null; try{ stored=JSON.parse(localStorage.getItem('aok_site_v1')); }catch(e){}
    const def=this.defaults(); const data= stored? this.fill(def,stored) : def;
    return { data, route:'home', postId:null, lang:'en', menuOpen:false,
      admin:false, authed:false, editMode:false, adminTab:'dashboard', pass:'', toast:null,
      device:'desktop', selBlock:null, blkPick:null, selImg:null, mapEdit:false };
  })();

  componentWillMount(){ if(!this.state.data){ this.setState({ data:this.defaults() }); } }
  fill(def,cur){ if(def===null||typeof def!=='object'||Array.isArray(def)) return cur===undefined?def:cur; const out=(cur&&typeof cur==='object'&&!Array.isArray(cur))?{...cur}:{}; for(const k in def){ out[k]=this.fill(def[k], out[k]); } return out; }
  componentDidMount(){ this._loadFromServer(); if(!this.state.data) this.save(this.defaults()); this.migrateAbout(); this.migrateHomeH1(); this.migrateGmb(); this.ensureSeedPosts(); this.ensureSeedServices(); this.migratePrices(); this.syncHead(); setTimeout(()=>this.syncLangFromCookie(),300); this.checkUrl(); try{ window.addEventListener('hashchange',()=>this.checkUrl()); window.addEventListener('popstate',()=>this.checkUrl()); }catch(e){} }
  migratePrices(){ try{ if(localStorage.getItem('aok_price_v1')) return; }catch(e){ return; } const d=this.state.data; if(d&&Array.isArray(d.services)){ this.save(this.setIn(d,'services',d.services.map(s=>({...s,price:'$100 CAD'})))); } try{ localStorage.setItem('aok_price_v1','1'); }catch(e){} }
  migrateHomeH1(){ const d=this.state.data; if(!d||!d.home||!d.home.hero)return; const old='Vedic astrologer Jag Mallah \u2014 clarity for love, career & karma'; if(d.home.hero.h1===old){ this.save(this.setIn(d,'home.hero.h1','Vedic Astrologer: Clarity for love, Career & Karma')); } }
  migrateGmb(){ const d=this.state.data; if(!d||!d.contact)return; if(d.contact.gmb==='https://share.google/g70mXkODvmMmpB5w2'){ this.save(this.setIn(d,'contact.gmb','https://share.google/r37d5nGpSJCeEXhvt')); } }
  migrateAbout(){ try{ if(localStorage.getItem('aok_about_v3'))return; }catch(e){ return; } const d=this.state.data; if(d){ this.save(this.setIn(d,'about',this.defaults().about)); } try{ localStorage.setItem('aok_about_v3','1'); }catch(e){} }
  ensureSeedPosts(){ const d=this.state.data; if(!d) return; const have={}; (d.blog||[]).forEach(p=>{ if(p&&p.slug) have[p.slug]=1; }); const add=this.seedPosts().filter(p=>!have[p.slug]); if(add.length){ this.save(this.setIn(d,'blog',[...add,...(d.blog||[])])); } }
  ensureSeedServices(){ const d=this.state.data; if(!d) return; const have={}; (d.services||[]).forEach(s=>{ if(s&&s.seedKey) have[s.seedKey]=1; }); const add=this.seedServices().filter(s=>!have[s.seedKey]); if(add.length){ this.save(this.setIn(d,'services',[...(d.services||[]),...add])); } }
  // The 5 duplicate pairs merged in content version 2 (duplicate → primary). The duplicates stay in the admin with a
  // 301 redirect (Admin → Redirects → Undo restores them); api/upgrades.php applies the same merge to saved sites.
  contentMerges(){ return { services:{'career-finance-reports': '/services/career-and-finance-consultation', 'gemstone-services': '/services/gemstone-recommendation', 'dosha-remedies': '/services/dosha-analysis-and-remedies'}, posts:{'understanding-your-kundli': '/blog/ultimate-guide-birth-chart', 'mangal-dosha-truth': '/blog/mangal-dosha-myths-facts-remedies'} }; }
  seedServices(){ const S=(seedKey,icon,title,price,desc,detail)=>({id:this.uid(),seedKey,icon,title,price,desc,detail,image:null}); return [
    S('horoscopes','\u263d','Daily / Weekly / Monthly Horoscopes','$100 CAD','Clear daily, weekly and monthly horoscope guidance based on your Moon sign and current transits \u2014 practical, not generic.',
      'Our horoscopes go beyond one-size-fits-all sun-sign columns. Daily readings track the Moon\u2019s fast movement and the key transits so you know the mood of each day; weekly and monthly outlooks map the bigger themes shaping your work, relationships and wellbeing.\n\nFor the sharpest accuracy we read against your own Moon sign and birth chart rather than just your Sun sign, so the guidance actually fits your life. Use it to plan important conversations, pick good days for effort, and stay steady when the planets get busy.'),
    S('birth-chart-generation','\u2609','Birth Chart (Natal Chart) Generation','$100 CAD','A precise, accurate Vedic birth chart (Kundli) prepared from your exact birth details, ready for reading.',
      'Your birth chart is the foundation of every reading. We generate an accurate Kundli from your date, exact time and place of birth \u2014 including your Lagna (Ascendant), the placement of all nine planets, the twelve houses, your nakshatras and your current planetary period (dasha).\n\nYou receive a clean, well-laid-out chart along with an explanation of its key features, so whether you are new to astrology or returning for deeper work, you always start from solid, reliable data.'),
    S('marriage-possibilities','\u269a','Love or Arrange Marriage Possibilities','$100 CAD','Will it be love or arranged \u2014 and when? A focused look at marriage timing, prospects and compatibility in your chart.',
      'This reading studies the houses and planets that govern relationships \u2014 the 7th house, Venus, the Moon and the Navamsa (D9) chart \u2014 to understand your marriage prospects. We look at whether a love or arranged match is more likely for you, the probable timing windows, and the qualities of a supportive partner.\n\nFor couples, we add full compatibility analysis (Guna Milan and dosha checks). The aim is clarity and confidence \u2014 a realistic, encouraging picture of your path to a happy, lasting marriage.'),
    S('live-consultations','\u260e','Live Astrologer Consultations (Chat / Call / Video)','$100 CAD','One-to-one sessions with Jag Mallah over chat, phone or video \u2014 ask your questions and get answers in real time.',
      'Sometimes you simply want to talk to a real astrologer. Book a live session by chat, call or video and bring whatever is on your mind \u2014 a decision, a worry, a relationship, a timing question. Jag Mallah reads your chart with you and answers directly, in plain language, in English or Hindi.\n\nSessions are private and unhurried. You can note down key remedies and next steps, and there is room for follow-up questions, so you leave with genuine clarity rather than more confusion.'),
    S('year-ahead-forecast','\u2600','Personalized Year-Ahead Forecasts (Solar Return)','$100 CAD','A complete forecast of the year ahead built from your solar return chart, dashas and current transits.',
      'Each birthday the Sun returns to its exact natal position, creating a fresh chart for your coming year. Your year-ahead forecast reads this solar return alongside your running dasha and the major transits to map what is approaching \u2014 month by month.\n\nYou get a clear picture of the strongest periods for career, money, relationships, travel and health, plus the times to be patient and the remedies that help. It is the ideal reading to book around your birthday or the new year for confident planning.'),
    S('muhurat-timing','\u263c','Muhurat / Auspicious Timing Selection','$100 CAD','Hand-picked auspicious dates and times (Muhurat) for marriages, business launches, housewarmings and more.',
      'In Vedic astrology, the right moment gives any beginning its best chance of success. We select an auspicious Muhurat by weighing the tithi, nakshatra, weekday and the positions of benefic planets \u2014 while avoiding inauspicious windows such as eclipses and combust or retrograde periods.\n\nWhether it is a wedding, an engagement, a business launch, a property purchase or a griha pravesh, we provide personalised dates harmonised with your own birth chart, not just a generic almanac \u2014 so your important event starts on supportive energy.'),
    S('gemstone-services','\u2666','Gemstone Recommendation Services','$100 CAD','Discover which gemstone genuinely suits your chart \u2014 with the right weight, metal, finger and energising ritual.',
      'Gemstones strengthen a beneficial planet, but the wrong stone can do harm \u2014 so this service begins with a careful study of your chart. We identify which planets need support and which stone (and which to avoid) is right for you, from ruby and pearl to yellow and blue sapphire, emerald, coral and diamond.\n\nYou receive clear guidance on the correct carat weight, metal and finger, and the day and mantra for energising and wearing it, so the gemstone works with your chart rather than against it.'),
    S('jyotish-deep-dive','\u0950','Vedic Astrology (Jyotish) Deep Dives','$100 CAD','A comprehensive, classical Jyotish analysis of your full chart \u2014 personality, timing, strengths and life direction.',
      'This is our most thorough reading \u2014 a deep dive into your complete chart using traditional Jyotish methods. We examine your Lagna, the nine planets across the twelve houses, the nakshatras, the divisional charts (vargas) and the sequence of dashas that times the chapters of your life.\n\nThe result is a rich, joined-up understanding of your nature, your karmic strengths and challenges, and the direction your chart points toward \u2014 along with the remedies and practices that help you walk it well. Ideal for those who want depth, not a quick answer.'),
    S('career-finance-reports','\u2643','Career & Financial Astrology Reports','$100 CAD','Targeted guidance on your profession, business prospects, money timing and the right moves for growth.',
      'Your career report focuses on the houses and planets of work and wealth \u2014 the 10th house of profession, the 2nd and 11th of income and gains, the 6th of daily work, and key planets such as Saturn, Mercury and the Sun. We read your natural talents and ideal fields, and use your dashas and transits to time job changes, business decisions and investments.\n\nYou receive practical, prioritised guidance: where your strengths lie, which periods favour bold moves, and the remedies that support steady financial growth.'),
    S('karmic-past-life','\u262f','Karmic & Past Life Astrology','$100 CAD','Understand the karmic patterns and past-life themes shaping this life \u2014 read through the lunar nodes (Rahu & Ketu).',
      'Some patterns feel older than this lifetime. Karmic astrology reads the South and North Nodes (Ketu and Rahu), the 12th house and Saturn to reveal the tendencies, debts and gifts you carry from the past \u2014 and the direction your soul is being asked to grow.\n\nThis reading helps you recognise repeating themes in relationships, work and fear, understand why they recur, and consciously move toward the lessons of your North Node. It is reflective, compassionate work for those seeking deeper meaning, not only prediction.'),
    S('dosha-remedies','\u2642','Dosha & Remedial Solutions (e.g. Mangalik)','$100 CAD','Honest analysis of Mangal, Kaal Sarp, Pitra and other doshas \u2014 what they really mean and the remedies that help.',
      'Doshas cause a lot of needless worry. We examine your chart for Mangal (Manglik), Kaal Sarp, Pitra and other doshas, and tell you the truth: whether a dosha is genuinely present and strong, or mild and already cancelled by other placements.\n\nWhere a real dosha exists, we prescribe classical, practical remedies \u2014 specific mantras, charity, fasts, gemstones and rituals \u2014 matched to your chart. The goal is never fear; it is to balance the energy and move forward with confidence, especially around marriage and major decisions.'),
    S('child-naming','\u2606','Newborn / Child Naming & Astrology Reports','$100 CAD','Auspicious name suggestions and a child\u2019s birth-chart report based on the birth nakshatra \u2014 a blessing for new parents.',
      'A child\u2019s name and early chart are a beautiful foundation. From the baby\u2019s exact birth details we identify the birth nakshatra and its auspicious starting syllable, and suggest harmonious name options aligned with the chart.\n\nThe report also offers a gentle first reading of the child\u2019s nature, strengths and key planetary periods, along with simple protective remedies parents can keep. It is a thoughtful, lasting gift at the start of a new life \u2014 grounded in tradition and full of care.'),
    S('medical-astrology','\u2695','Medical Astrology (Holistic / Overview)','$100 CAD','A holistic astrological overview of the body areas your chart highlights \u2014 for awareness and prevention, never diagnosis.',
      'Medical astrology offers a holistic view of where your chart suggests natural vitality and where it points to sensitivity, mapping the signs and houses to regions of the body. We note the periods when your energy may run lower and suggest supportive lifestyle, diet and remedial practices to stay balanced.\n\nPlease read this with care: medical astrology is for awareness, prevention and reflection only. It is never a diagnosis and must never replace professional medical advice, testing or treatment from a qualified doctor.')
  ].map(s=>this.contentMerges().services[s.seedKey]?{...s,redirectTo:this.contentMerges().services[s.seedKey]}:s); }
  componentDidUpdate(){ this.syncHead(); this.syncUrl(); if(this.state.authed&&!this._smChecked) this._sitemapAutoCheck(); }
  updateSitemap(silent){ const finish=(j)=>{ try{ localStorage.setItem('aok_sitemap_at', String(Date.now())); }catch(e){} this._sitemapInfo=j||null; this.forceUpdate(); if(!silent) this.flash((j&&j.ok)?('✓ Sitemap updated — '+j.total+' URLs ('+j.posts+' blog posts)'):'⚠ Could not update sitemap'); };
    try{ fetch('/api/sitemap.php?action=write',{method:'POST',headers:this.apiHeaders()}).then(r=>r.json().catch(()=>null)).then(finish).catch(()=>{ if(!silent) this.flash('⚠ Could not reach the server to update the sitemap'); }); }catch(e){ if(!silent) this.flash('⚠ Could not update sitemap'); } }
  _sitemapAutoCheck(){ this._smChecked=true; const freq=(this.state.data&&this.state.data.sitemapAuto)||'off'; if(freq==='off') return; let last=0; try{ last=parseInt(localStorage.getItem('aok_sitemap_at')||'0',10); }catch(e){} const ms={daily:864e5,weekly:6048e5,monthly:2592e6}[freq]; if(!ms) return; if(Date.now()-last>=ms) this.updateSitemap(true); }
  syncUrl(){ try{ const r=this.state.route; if(r==='admin'){ if((location.hash||'').toLowerCase()!=='#admin') history.replaceState(null,'','#admin'); return; }
      if(r==='notfound') return;   // keep the address the visitor typed
      const path=this.routePath();
      if(location.pathname!==path || location.hash){ history.replaceState(null,'',path); } }catch(e){} }
  _routeFromUrl(data){ try{ const hash=(location.hash||'').toLowerCase(); if(hash==='#admin'||hash==='#/admin') return {route:'admin',postId:null,pageId:null};
      const parts=(location.pathname||'/').replace(/^\/+|\/+$/g,'').split('/').filter(Boolean);
      if(!parts.length) return {route:'home',postId:null,pageId:null};
      if(parts[0]==='admin') return {route:'admin',postId:null,pageId:null};
      const none={route:'notfound',postId:null,pageId:null,serviceId:null};
      if(parts[0]==='blog'&&parts[1]){ const slug=decodeURIComponent(parts[1]); const post=((data&&data.blog)||[]).find(x=>x.slug===slug&&(x.published||this.state.editMode)); return post?{route:'blog',postId:post.id,pageId:null,serviceId:null}:none; }
      if(parts[0]==='services'&&parts[1]){ const sv=(data&&data.services)||[]; const slugs=this.serviceSlugs(sv); const s=sv.find(x=>slugs[x.id]===decodeURIComponent(parts[1]).toLowerCase()); return s?{route:'service',serviceId:s.id,postId:null,pageId:null}:none; }
      const known=['about','services','meditation','blog','contact','faq']; if(parts.length===1&&known.indexOf(parts[0])>-1) return {route:parts[0],postId:null,pageId:null,serviceId:null};
      const pg=((data&&data.pages)||[]).find(p=>p.slug===decodeURIComponent(parts[0])); if(pg&&parts.length===1) return {route:'page',pageId:pg.id,postId:null,serviceId:null};
      return none; }catch(e){ return null; } }
  // path of the current route (mirrors aok_resolve in api/seo-lib.php)
  routePath(st){ st=st||this.state; const d=this.state.data||{}; const r=st.route;
    if(r==='home') return '/';
    if(r==='blog'&&st.postId){ const p=(d.blog||[]).find(x=>x.id===st.postId); return p&&p.slug?'/blog/'+encodeURIComponent(p.slug):'/blog'; }
    if(r==='service'){ const slugs=this.serviceSlugs(d.services||[]); return slugs[st.serviceId]?'/services/'+slugs[st.serviceId]:'/services'; }
    if(r==='page'){ const pg=(d.pages||[]).find(x=>x.id===st.pageId); return pg&&pg.slug?'/'+encodeURIComponent(pg.slug):'/'; }
    if(r==='notfound') return location.pathname;
    return '/'+r; }
  // id -> URL slug for each service (custom slug, else from the title; duplicates get -2, -3 …) — same rules as aok_service_slugs()
  serviceSlugify(s){ return String(s||'').replace(/&/g,' and ').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
  // services merged into another one (Admin → Redirects) stay in the admin but leave the public lists
  liveServices(){ return ((this.state.data&&this.state.data.services)||[]).filter(s=>!s.redirectTo); }
  serviceSlugs(services){ const out={},used={}; (services||[]).forEach(s=>{ let base=this.serviceSlugify((s.slug||'')!==''?s.slug:(s.title||'service'))||'service'; let slug=base,n=2; while(used[slug]) slug=base+'-'+(n++); used[slug]=1; out[s.id]=slug; }); return out; }
  serviceHref(s){ return '/services/'+(this.serviceSlugs(this.state.data.services||[])[s.id]||this.serviceSlugify(s.title)); }
  // a real link (crawlable, opens in a new tab with ctrl/cmd-click) that navigates inside the app on a normal click
  linkTo(href,fn,extra){ return {href,onClick:e=>{ if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button===1) return; e.preventDefault(); fn(); },...(extra||{})}; }
  routeHref(route){ return route==='home'?'/':'/'+route; }
  checkUrl(){ const r=this._routeFromUrl(this.state.data); if(!r) return; if(r.route==='admin') this.checkAuth(); if(r.route!==this.state.route||r.postId!==this.state.postId||r.pageId!==this.state.pageId||(r.serviceId||null)!==(this.state.serviceId||null)) this.setState(r); }

  // ---------- admin session (server-side login, api/auth.php) ----------
  apiHeaders(){ return {'Content-Type':'application/json','X-AOK-CSRF':this._csrf||''}; }
  login(){ const pw=this.state.pass||''; if(!pw){ this.flash('Enter your password'); return; }
    fetch('/api/auth.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',password:pw})})
      .then(r=>r.json().catch(()=>({ok:false,error:'server'})))
      .then(j=>{ if(j&&j.ok){ this._csrf=j.csrf; this._defaultPw=!!j.defaultPassword; this.setState({authed:true,pass:''}); this._loadFromServer(); }
        else this.flash(j&&j.error==='locked'?'Too many attempts \u2014 please wait '+(j.minutes||15)+' minutes and try again.':j&&j.error==='wrong_password'?'Incorrect password':'\u26a0 Could not reach the login service (api/auth.php).'); })
      .catch(()=>this.flash('\u26a0 Could not reach the server. Check your connection and try again.')); }
  checkAuth(){ if(this._authChecked) return; this._authChecked=true;
    fetch('/api/auth.php?action=status',{headers:{'Accept':'application/json'}}).then(r=>r.json()).then(j=>{ if(j&&j.authed){ this._csrf=j.csrf; if(!this.state.authed){ this.setState({authed:true}); this._loadFromServer(); } } }).catch(()=>{}); }
  logout(){ fetch('/api/auth.php',{method:'POST',headers:this.apiHeaders(),body:JSON.stringify({action:'logout'})}).catch(()=>{}); this._csrf=null; this._authChecked=false; this.setState({authed:false,editMode:false,route:'home'}); }
  changePassword(){ const f=this._pw||{}; if((f.next||'').length<8){ this.flash('The new password needs at least 8 characters'); return; } if(f.next!==f.confirm){ this.flash('The two new passwords do not match'); return; }
    fetch('/api/auth.php',{method:'POST',headers:this.apiHeaders(),body:JSON.stringify({action:'change',current:f.current||'',next:f.next})}).then(r=>r.json()).then(j=>{ if(j&&j.ok){ this._pw={}; this._defaultPw=false; this.flash('\u2713 Password changed'); this.forceUpdate(); } else this.flash(j&&j.error==='wrong_password'?'Your current password is incorrect':'\u26a0 Could not change the password'); }).catch(()=>this.flash('\u26a0 Could not reach the server')); }

  // ---------- persistence ----------
  _loadFromServer(){ // server is the authoritative store (cross-device); localStorage is a fast cache
    try{
      fetch('/api/data.php',{ headers:{'Accept':'application/json'} })
        .then(r=>r.ok?r.json():null)
        .then(srv=>{ if(!srv||srv.ok===false) return; const merged=this.fill(this.defaults(),srv); try{ localStorage.setItem('aok_site_v1', JSON.stringify(merged)); }catch(e){} const r=this._routeFromUrl(merged)||{}; const patch={data:merged}; if(r.route&&r.route!=='admin'){ patch.route=r.route; patch.postId=r.postId; patch.pageId=r.pageId; patch.serviceId=r.serviceId||null; } this.setState(patch,()=>{ this.syncHead(); }); })
        .catch(()=>{});
    }catch(e){}
  }
  save(data){ this.setState({data}); return this._persist(data); }
  _persist(data){ let ok=true; try{ localStorage.setItem('aok_site_v1', JSON.stringify(data)); this._saveErr=false; }catch(e){ this._saveErr=true; ok=false; } this._serverSave(); return ok; }
  _serverSave(){ // only the logged-in admin may write site content to the server; visitors never do
    if(!this.state.authed && !this.state.editMode) return;
    clearTimeout(this._srvTimer);
    this._srvTimer=setTimeout(()=>{ try{ fetch('/api/data.php',{ method:'POST', headers:this.apiHeaders(), body:JSON.stringify(this.state.data) }).catch(()=>{}); }catch(e){} },800); }
  saveNow(){ try{ localStorage.setItem('aok_site_v1', JSON.stringify(this.state.data)); }catch(e){}
    clearTimeout(this._srvTimer); // we are saving right now, so cancel any pending auto-save
    this.flash('Saving\u2026'); const body=JSON.stringify(this.state.data);
    try{
      fetch('/api/data.php',{ method:'POST', headers:this.apiHeaders(), body })
        .then(r=>r.json().catch(()=>null))
        .then(j=>{ if(j&&(j.error==='not_logged_in'||j.error==='bad_csrf')){ this.setState({authed:false,editMode:false,route:'admin'}); this.flash('\u26a0 Your admin session has ended \u2014 please log in again, then click Save.'); return; } if(j&&j.ok){ this.flash('\u2713 Saved \u2014 your changes are now live'); this._live={}; this.forceUpdate(); this._indexNowAuto(); } else { this.flash('\u26a0 Save failed: '+((j&&j.error)?j.error:'database error')+' \u2014 open /api/health.php to diagnose'); } })
        .catch(()=>{ this.flash('\u26a0 Couldn\u2019t reach the server. Check your connection and click Save again.'); });
    }catch(e){ this.flash('\u26a0 Could not save to the server.'); } }
  // IndexNow: tell Bing & co. (and the AI search built on them) that pages changed. Auto mode pings at most once an hour.
  _indexNowAuto(){ const ai=(this.state.data&&this.state.data.ai)||{}; if(ai.indexNowAuto===false) return; let last=0; try{ last=parseInt(localStorage.getItem('aok_indexnow_at')||'0',10); }catch(e){} if(Date.now()-last<36e5) return; this.indexNow(true); }
  indexNow(silent){ try{ localStorage.setItem('aok_indexnow_at', String(Date.now())); }catch(e){}
    fetch('/api/indexnow.php',{ method:'POST', headers:this.apiHeaders(), body:'{}' }).then(r=>r.json().catch(()=>null)).then(j=>{ this._indexNowInfo=Object.assign({at:new Date().toISOString()},j||{ok:false});
      if(j&&j.key&&this.getIn(this.state.data,'ai.indexNowKey')!==j.key) this.save(this.setIn(this.state.data,'ai.indexNowKey',j.key));
      this.forceUpdate(); if(!silent) this.flash(j&&j.skipped?'\u2139 IndexNow is only sent from the live domain (key is ready)':(j&&j.ok)?('\u2713 IndexNow: '+j.count+' URLs submitted'):('\u26a0 IndexNow failed'+(j&&j.status?' (HTTP '+j.status+')':''))); })
      .catch(()=>{ if(!silent) this.flash('\u26a0 Could not reach the server for IndexNow'); }); }
  sendTestEmail(){ if(this._emailTesting) return; const to=(this.getIn(this.state.data,'contact.email')||'').trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)){ this._emailTestOk=false; this._emailTestMsg='Please enter a valid recipient email address first.'; this.forceUpdate(); return; }
    this._emailTesting=true; this._emailTestMsg=null; this.forceUpdate();
    const done=(ok,msg)=>{ this._emailTesting=false; this._emailTestOk=ok; this._emailTestMsg=msg; this.forceUpdate(); };
    try{
      fetch('/api/test-email.php',{ method:'POST', headers:this.apiHeaders(), body:JSON.stringify({to}) })
        .then(r=>r.json())
        .then(j=>{ if(j&&j.ok&&j.sent) done(true,'\u2713 Test email sent to '+j.to+'. Check your inbox (and spam folder) in a minute.'); else if(j&&j.ok&&!j.sent) done(false,'\u26a0 The server accepted the request but mail() failed to send. Your host may need email enabled, or try a From address on your own domain.'); else done(false,'\u26a0 Could not send test email'+(j&&j.error?' ('+j.error+')':'')+'.'); })
        .catch(()=>done(false,'\u26a0 Network error \u2014 test email only works on your live server, not in a local preview.'));
    }catch(e){ done(false,'\u26a0 Could not send test email.'); }
  }
  scaleImage(file,cb,max,fmt){ max=max||1280; const rd=new FileReader(); rd.onload=()=>{ const img=new Image(); img.onload=()=>{ let w=img.width,hh=img.height; if(w>max||hh>max){ if(w>=hh){ hh=Math.round(hh*max/w); w=max; } else { w=Math.round(w*max/hh); hh=max; } } try{ const c=document.createElement('canvas'); c.width=w; c.height=hh; const cx=c.getContext('2d'); if(fmt!=='image/png'){ cx.fillStyle='#fff'; cx.fillRect(0,0,w,hh); } cx.drawImage(img,0,0,w,hh); this.uploadImage(c.toDataURL(fmt||'image/jpeg',0.82),cb); }catch(e){ cb(rd.result); } }; img.onerror=()=>cb(rd.result); img.src=rd.result; }; rd.readAsDataURL(file); }
  uploadImage(dataUrl,cb){ // POST scaled image to server, fall back to inline data URL on failure
    try{
      fetch('/api/upload.php',{ method:'POST', headers:this.apiHeaders(), body:JSON.stringify({data:dataUrl}) })
        .then(r=>r.json())
        .then(j=>{ if(j&&j.ok&&j.url) cb(j.url); else cb(dataUrl); })
        .catch(()=>cb(dataUrl));
    }catch(e){ cb(dataUrl); }
  }
  getIn(o,p){ return p.split('.').reduce((a,k)=> a==null?undefined:a[k], o); }
  setIn(o,p,v){ const ks=p.split('.'); const root=Array.isArray(o)?[...o]:{...o}; let c=root; for(let i=0;i<ks.length-1;i++){ const k=ks[i],nv=c[k]; c[k]=Array.isArray(nv)?[...nv]:{...(nv||{})}; c=c[k]; } c[ks[ks.length-1]]=v; return root; }
  commit(p,v){ if(this.state.editMode||this.state.route==='admin'){ this.pushHist(); } const ok=this.save(this.setIn(this.state.data,p,v)); if(!ok) this.flash('\u26a0 Storage full \u2014 image too large to save. Please use a smaller photo.'); }
  t(k){ const l=this.STR.en; return l[k]||k; }
  setLang(lg){ if(this.state.lang===lg) return; this.setState({lang:lg}); try{ localStorage.setItem('aok_lang',lg); }catch(e){} if(lg==='hi') this.enableHindi(); else this.disableHindi(); }
  syncLangFromCookie(){ let lg='en'; try{ lg=localStorage.getItem('aok_lang')||'en'; }catch(e){} if(lg==='hi'){ if(this.state.lang!=='hi') this.setState({lang:'hi'}); this.enableHindi(); } }
  trCache(){ if(!this._trCache){ try{ this._trCache=JSON.parse(localStorage.getItem('aok_tr_hi_v1')||'{}')||{}; }catch(e){ this._trCache={}; } } return this._trCache; }
  persistTr(){ try{ localStorage.setItem('aok_tr_hi_v1',JSON.stringify(this._trCache||{})); }catch(e){} }
  trUrl(s){ return 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q='+encodeURIComponent(s); }
  trLine(line){ const c=this.trCache(); if(c[line]!=null) return Promise.resolve(c[line]); if(!/[A-Za-z]/.test(line)) { c[line]=line; return Promise.resolve(line); }
    if(line.length>1400){ const parts=[]; for(let i=0;i<line.length;i+=1400) parts.push(line.slice(i,i+1400)); return Promise.all(parts.map(p=>this.trLine(p))).then(r=>{ const out=r.join(''); c[line]=out; return out; }); }
    return fetch(this.trUrl(line)).then(r=>r.json()).then(j=>{ const o=(j[0]||[]).map(x=>x[0]).join(''); c[line]=o||line; return c[line]; }).catch(()=>line); }
  trText(s){ const c=this.trCache(); if(c[s]!=null) return Promise.resolve(c[s]); const lines=s.split('\n'); return Promise.all(lines.map(l=> l.trim()? this.trLine(l): Promise.resolve(l))).then(parts=>{ const out=parts.join('\n'); c[s]=out; return out; }); }
  enableHindi(){ this._hi=true; this._trNodes=this._trNodes||new Set(); this.ensureTrObserver(); this.translateVisible(); }
  disableHindi(){ this._hi=false; if(this._trObs) this._trObs.disconnect(); if(this._trNodes){ this._trNodes.forEach(n=>{ try{ if(n.__aokEn!=null && n.isConnected) n.nodeValue=n.__aokEn; }catch(e){} }); this._trNodes.clear(); } this.forceUpdate(); }
  ensureTrObserver(){ if(this._trObs){ this._trObs.observe(document.body,{childList:true,subtree:true,characterData:true}); return; } this._trObs=new MutationObserver(()=>{ if(!this._hi) return; clearTimeout(this._trDeb); this._trDeb=setTimeout(()=>this.translateVisible(),160); }); this._trObs.observe(document.body,{childList:true,subtree:true,characterData:true}); }
  translateVisible(){ if(!this._hi||this.state.editMode||this.state.route==='admin') return; const c=this.trCache(); this._trNodes=this._trNodes||new Set();
    const need=new Set(); const setHi=(n,v)=>{ if(n.nodeValue!==c[v]){ if(n.__aokEn==null) n.__aokEn=v; this._trNodes.add(n); n.nodeValue=c[v]; } };
    const walk=fn=>{ const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null); while(w.nextNode()){ const n=w.currentNode; const v=n.nodeValue; if(!v||!/[A-Za-z]/.test(v)) continue; if(this.trSkip(n.parentElement)) continue; fn(n,v); } };
    walk((n,v)=>{ if(c[v]!=null){ setHi(n,v); } else { need.add(v); } });
    if(!need.size) return;
    const list=[...need]; const pool=8; let i=0,active=0,done=0; const total=list.length; let finished=false;
    const finish=()=>{ if(finished) return; finished=true; this.persistTr(); if(this._hi) walk((n,v)=>{ if(c[v]!=null) setHi(n,v); }); };
    const next=()=>{ while(active<pool && i<total){ const s=list[i++]; active++; this.trText(s).then(()=>{ active--; done++; if(done===total) finish(); else next(); }); } };
    next(); }
  trSkip(el){ return !el || (el.closest && !!el.closest('header,.notranslate,script,style,noscript,svg,[contenteditable="true"],input,textarea,select,[data-imgctrl]')); }
  flash(msg){ this.setState({toast:msg}); clearTimeout(this._tt); this._tt=setTimeout(()=>this.setState({toast:null}),2200); }
  uid(){ return 'x'+Math.random().toString(36).slice(2,9); }

  go(route, extra){ this.setState({route, menuOpen:false, postId:null, serviceId:null, ...(extra||{})}); window.scrollTo&&window.scrollTo(0,0); }

  // ---------- defaults ----------
  defaults(){
    const svc=(icon,title,price,desc,detail)=>({id:this.uid(),icon,title,price,desc,...(detail?{detail}:{}),image:null});
    return {
      brand:{ name:'Analysis of Karma', astrologer:'Jag Mallah', tagline:'Vedic astrology guidance for love, career, health & life\u2019s bigger questions.', logo:null },
      contact:{ email:'analysisofkarma@gmail.com', mailFrom:'', phone:'+1 (236) 660-2000', whatsapp:'+1 (236) 660-2000',
        whatsappText:'Hello Jag Mallah, I would like to book a Vedic astrology consultation.', address:'', mapQuery:'', mapUrl:'', mapEmbed:'',
        instagram:'https://www.instagram.com/analysisofkarma', youtube:'https://www.youtube.com/@analysisofkarma',
        gmb:'https://share.google/r37d5nGpSJCeEXhvt', facebook:'', trustpilot:'https://ca.trustpilot.com/review/analysisofkarma.com',
        bookingUrl:'', replyTime:'within 12\u201324 hours' },
      siteUrl:'https://www.analysisofkarma.com',
      sitemapAuto:'off',
      // Local SEO / Google Business Profile — a service-area business (no street address shown)
      local:{ businessName:'Analysis of Karma', legalName:'', businessType:'ProfessionalService',
        gbpPrimaryCategory:'Astrologer', gbpAdditionalCategories:['Spiritual Consultant','Psychic','Vedic Astrology & Karmic Consultation Service'],
        serviceAreaBusiness:true, streetAddress:'', locality:'Surrey', region:'British Columbia', regionCode:'BC', postalCode:'', country:'CA',
        lat:'49.1913', lng:'-122.8490', areasServed:['Surrey, BC, Canada','Vancouver, BC, Canada','Delta, BC, Canada','Langley, BC, Canada','Abbotsford, BC, Canada','Chilliwack, BC, Canada','Maple Ridge, BC, Canada','British Columbia, Canada','Canada','Washington, USA','United States','United Kingdom','Punjab, India','Delhi, India','Haryana, India','Mumbai, Maharashtra, India','India'],
        neighbourhoods:['Newton','Fleetwood','Cloverdale','Guildford','Panorama Ridge','South Surrey'],
        nearbyLabel:'Lower Mainland & Fraser Valley', nearbyCities:['Vancouver','Delta','Langley','Abbotsford','Chilliwack','Maple Ridge'],
        abroad:['the United States (Washington State)','the United Kingdom','India (Punjab, Delhi, Haryana and Mumbai)'],
        onlineWorldwide:true, onlineChannels:['Zoom','WhatsApp'],
        hours:{Mo:{o:'10:00',c:'20:00'},Tu:{o:'10:00',c:'20:00'},We:{o:'10:00',c:'20:00'},Th:{o:'10:00',c:'20:00'},Fr:{o:'10:00',c:'20:00'},Sa:{o:'10:00',c:'20:00'},Su:{o:'10:00',c:'20:00'}},
        timezone:'America/Vancouver', hoursNote:'Pacific Time, by appointment \u2014 early-morning and evening slots available for clients in India, the UK and across North America.',
        mapsCidUrl:'https://maps.app.goo.gl/XrwSpDBGaVsFQ5dV8', reviewUrl:'https://maps.app.goo.gl/XrwSpDBGaVsFQ5dV8', priceRange:'$100 CAD per hour', currency:'CAD', languages:['English','Hindi','Punjabi'],
        sessionLength:'60 minutes', paymentMethods:['Interac e-Transfer','PayPal','Credit card','Debit card','International bank transfer'],
        paymentPolicy:'Pay after your reading: new clients pay only if they are completely satisfied with their consultation.',
        directories:[], locationInTitles:true },
      // Practitioner (E-E-A-T) — used in structured data and llms.txt
      person:{ name:'Jag Mallah', jobTitle:'Independent Vedic Astrologer', additionalRoles:['Meditation Guide'],
        shortBio:'Jag Mallah is an independent Vedic astrologer and professional meditation guide based in Surrey, British Columbia, consulting worldwide over Zoom and WhatsApp in English, Hindi and Punjabi. He completed formal studies in Advanced Astrology, Tajika (Varshaphala and Prashna Shastra), Muhurta and Medical Astrology under his mentor Sh. Sharawan Jha, and researches the classical texts Brihat Parashara Hora Shastra, Phaladeepika, Tajika Neelakanthi, Bhrigu Nandi Nadi, the Jaimini Upadesa Sutras and Swarodaya Shastra, grounded in the six classical Darshanas and Pancha Mahabhuta elemental balance.',
        mentor:'Sh. Sharawan Jha', traditions:'Parashari, Jaimini, Tajika and Bhrigu Nandi Nadi astrology',
        philosophy:['The six classical Darshanas (Shaddarshana)','Pancha Mahabhuta elemental balance'],
        studies:['Advanced Astrology','Tajika (Varshaphala and Prashna Shastra)','Muhurta','Medical Astrology'],
        classicalTexts:['Brihat Parashara Hora Shastra (BPHS)','Phaladeepika','Tajika Neelakanthi','Bhrigu Nandi Nadi (BNN)','Jaimini Upadesa Sutras','Swarodaya Shastra (Shiva Swarodaya)'],
        knowsAbout:['Vedic astrology','Jyotish','Kundli (birth chart) reading','Kundli Milan (marriage matching)','Dasha and transit analysis','Mangal Dosha and other doshas','Muhurta (auspicious timing)','Tajika / Varshaphala (annual charts)','Prashna Shastra (horary astrology)','Jaimini astrology','Bhrigu Nandi Nadi','Swarodaya Shastra (breath science)','Pancha Mahabhuta (five elements)','Medical astrology','Gemstone recommendation','Meditation','Pranayama (breathwork)','Mantra practice'],
        sameAs:['https://www.youtube.com/channel/UCIHA2ZtOmAYP91GbK5RYkCQ','https://www.youtube.com/@analysisofkarma','https://www.instagram.com/analysisofkarma','https://www.linkedin.com/in/analysisofkarma/','https://x.com/analysisofkarma','https://www.pinterest.com/analysisofkarma','https://ca.trustpilot.com/review/analysisofkarma.com','https://maps.app.goo.gl/XrwSpDBGaVsFQ5dV8','https://share.google/r37d5nGpSJCeEXhvt'], image:'' },
      // AI & GEO control centre
      ai:{ bots:{'GPTBot':true,'OAI-SearchBot':true,'ChatGPT-User':true,'ClaudeBot':true,'Claude-SearchBot':true,'Claude-User':true,'PerplexityBot':true,'Perplexity-User':true,'Google-Extended':true,'Applebot-Extended':true,'Amazonbot':true,'meta-externalagent':true,'CCBot':true,'Bytespider':true},
        llmsOverride:'', llmsFullOverride:'', indexNowKey:'', indexNowAuto:true, googleVerification:'', bingVerification:'' },
      // admin-managed 301 redirects (used when merging duplicate services or posts): [{from:'/old', to:'/new'}]
      redirects:[],
      contentVersion:2,   // content upgrades already included (see api/upgrades.php)
      dupIgnore:[],   // duplicate pairs the admin marked as “not duplicates”
      nav:{ items:[
        {id:this.uid(),label:'Home',type:'route',value:'home'},
        {id:this.uid(),label:'About Us',type:'route',value:'about'},
        {id:this.uid(),label:'Services',type:'route',value:'services'},
        {id:this.uid(),label:'Meditation',type:'route',value:'meditation'},
        {id:this.uid(),label:'Blog',type:'route',value:'blog'},
        {id:this.uid(),label:'Contact',type:'route',value:'contact'}
      ] },
      pages:[],
      socials:[{net:'youtube',url:'https://www.youtube.com/channel/UCIHA2ZtOmAYP91GbK5RYkCQ'},{net:'linkedin',url:'https://www.linkedin.com/in/analysisofkarma/'},{net:'x',url:'https://x.com/analysisofkarma'},{net:'pinterest',url:'https://www.pinterest.com/analysisofkarma'}],
      disclaimer:'Astrology readings are provided for guidance, fun, and educational purposes only. My services do not replace professional medical, psychiatric, or legal advice.',
      home:{
        hero:{ kicker:'Vedic Astrologer \u00b7 Jyotish \u00b7 Meditation Guide',
          h1:'Vedic Astrologer: Clarity for love, Career & Karma',
          sub:'Authentic Kundli analysis rooted in classical Jyotish. Understand your birth chart, planetary periods and practical remedies \u2014 with guidance you can actually use.',
          image:null,
          cta1:{label:'Book a Consultation',link:'contact',size:'md',variant:'gold',newTab:false},
          cta2:{label:'Explore Services',link:'services',size:'md',variant:'ghost',newTab:false} },
        servicesIntro:{ kicker:'What I offer', title:'Vedic astrology services', sub:'Personal, one-to-one readings grounded in your birth chart \u2014 not generic sun-sign horoscopes.' },
        about:{ kicker:'About the astrologer', title:'Guidance with honesty, depth & care',
          body:'I\u2019m Jag Mallah, the astrologer behind Analysis of Karma. For years I\u2019ve studied classical Vedic astrology (Jyotish) and meditation \u2014 reading thousands of charts for people navigating marriage, career changes, health worries and questions of purpose. My approach is calm and practical: I read your Kundli carefully, explain what the planets actually indicate, and give remedies you can realistically follow. No fear, no pressure \u2014 just clarity.',
          credentials:['10,000+ birth charts read','Classical Jyotish & Nakshatra method','Meditation & spiritual remedies','Consultations in English & Hindi'], image:null },
        cta:{ title:'Ready to understand your chart?', sub:'Book a one-to-one Vedic astrology consultation with Jag Mallah and get clear, personalised guidance.', button:'Book a Consultation' }
      },
      about:{
        hero:{ title:'Welcome to my practice', sub:'Astrology is a beautiful guide for how to live and understand the karma that is meant for you. My goal is to help you see the path ahead, apply good karma to your daily life, and prepare for whatever the future holds \u2014 for clients in Surrey and Greater Vancouver, and worldwide online.' },
        story:{ title:'About me & my training',
          body:'People often want to know if an astrologer is the real deal. I believe in deep, traditional study. I learned Advanced Astrology, Tajik (Varshaphala and Prashna Shastra), Mahurat, and Medical Astrology under the guidance of my renowned teacher, Sh. Sharawan Jha.\n\nBecause I want to give you the most accurate and mathematically precise readings possible, I didn\u2019t stop there. I have spent countless hours digging deeper into classical texts \u2014 studying the Brihat Parashara Hora Shastra, Phaladeepika, Tajik, and many other foundational books. I look deeply into the exact movements and speeds of the planets to understand your unique chart.',
          image:null },
        values:[
          {t:'A genuine lineage',d:'Trained under my renowned teacher Sh. Sharawan Jha in Advanced Astrology, Tajik, Mahurat and Medical Astrology.'},
          {t:'Mathematical precision',d:'I read the exact degrees, velocities and speeds of the planets \u2014 for precise Itthasala and Ishrapha yogas, not just a basic chart.'},
          {t:'Classical foundations',d:'Grounded in the classical texts: Brihat Parashara Hora Shastra, Phaladeepika and advanced Tajik shastras.'}
        ],
        quote:'\u201cYour chart is not your sentence \u2014 it is your map. Karma shows the terrain; how you walk it is yours.\u201d',
        privacy:{ kicker:'My promise to you', title:'Privacy over promotion',
          body:'You might notice that I do not post customer reviews or testimonials on my website. Here is why: your secrets are safe with me.\n\nI have many beautiful stories of how astrology has helped my clients find clarity and peace. But because I strictly follow privacy and confidentiality rules, I will never share your personal stories online. Your birth information and our conversations are 100% private. Earning your trust matters more to me than advertising.',
          points:[
            {t:'Strictly confidential',d:'Your birth details and everything we discuss stay between us \u2014 always.'},
            {t:'No public testimonials',d:'I never publish client stories or reviews, however beautiful they may be.'},
            {t:'Trust before advertising',d:'Earning your confidence will always come before promoting my practice.'}
          ] },
        pricing:{ kicker:'Simple & honest', title:'Pricing', fee:'$100 CAD', unit:'per hour',
          body:'I have a very simple, honest approach to payment. I believe in karma. Because of this, I do not charge new clients if they are not satisfied with their consultation.\n\nIf you do not find value in the reading, you do not pay \u2014 please don\u2019t leave bad karma behind. If you do like the reading and find it helpful, you pay for it so that you do not carry a karma debt with you. It is entirely based on trust and energetic exchange.' },
        boundaries:{ kicker:'Honesty & boundaries', title:'What I can and cannot do', intro:'I believe in being completely upfront with you about what astrology is.',
          can:[
            'I can act as your guide.',
            'I can show you the possibilities of difficult times ahead, so you can be careful and prepared.',
            'I can show you what karma is good for you, and what practices to apply to your daily life.'
          ],
          cannot:[
            'I cannot stop things from happening.',
            'I do not give medical advice.',
            'I absolutely cannot \u2014 and will not \u2014 predict exact dates of death or exact mishaps.'
          ] },
        process:{ kicker:'How to work with me', title:'Booking is simple and easy', sub:'Here is exactly what will happen.',
          steps:[
            {t:'Book a time',d:'Choose a time that works for you on my calendar.'},
            {t:'Send your info',d:'Send your exact birth details \u2014 date, time and location \u2014 so I can prepare your chart before we meet.'},
            {t:'Send me questions',d:'Share what you\u2019d like to know, so I can be prepared to read your chart for you.'},
            {t:'We connect',d:'We hop on a live Zoom or WhatsApp call for your reading.'}
          ] }
      },
      meditation:{ hero:{ title:'Meditation with Jag Mallah \u2014 a professional meditation guide', sub:'Beyond astrology, I am a professional meditation guide. Learn simple, powerful practices to calm the mind, steady the breath and deepen your spiritual path.' },
        intro:{ title:'I am a professional meditation guide', body:'Alongside my work as a Vedic astrologer, I am a professional meditation guide. For years I have taught meditation, breathwork (pranayama) and mantra practice to people who want a calmer, clearer and more grounded life.\n\nWhether you are completely new to meditation or deepening an existing practice, I offer gentle, personalised guidance \u2014 matched, when you wish, to your birth chart and current planetary period. Meditation is the quiet foundation beneath every remedy I recommend: it steadies the mind, strengthens intention, and helps you walk your karma with awareness rather than fear.' },
        image:null,
        offerings:[ {t:'Guided meditation sessions', d:'One-to-one sessions, in person or online, paced gently to your experience level.'}, {t:'Breathwork & pranayama', d:'Simple breathing techniques that calm the nervous system and sharpen focus.'}, {t:'Mantra & sound practice', d:'Personalised mantras to support your remedies and spiritual goals.'}, {t:'Daily practice plans', d:'A short, sustainable routine you can actually keep up with at home.'} ] },
      servicesPage:{ hero:{ title:'Vedic astrology services by Jag Mallah', sub:'One-to-one Jyotish consultations \u2014 birth-chart readings, marriage matching, dosha analysis, gemstone guidance and meditation. Choose what fits your question.' } },
      services:[
        svc('\u2609','Kundli / Birth Chart Reading','$100 CAD','A complete Vedic birth-chart reading covering your personality, career, relationships, health and current planetary period (dasha), with practical remedies.'),
        svc('\u269a','Kundli Milan \u2014 Marriage Matching','$100 CAD','Detailed Guna Milan and compatibility analysis for two charts \u2014 including Mangal dosha, longevity and remedies for a harmonious marriage.'),
        svc('\u2643','Career & Finance Consultation','$100 CAD','Timing for job changes, business, and money decisions based on your dasha, transits and the houses of wealth and profession.',
          'Your career consultation focuses on the houses and planets of work and wealth \u2014 the 10th house of profession, the 2nd and 11th of income and gains, the 6th of daily work, and key planets such as Saturn, Mercury and the Sun. We read your natural talents and ideal fields, and use your dashas and transits to time job changes, business decisions and investments.\n\nYou receive practical, prioritised guidance: where your strengths lie, which periods favour bold moves, and the remedies that support steady financial growth.'),
        svc('\u2640','Dosha Analysis & Remedies','$100 CAD','In-depth study of Mangal, Kaal Sarp, Pitra and other doshas \u2014 what they really mean for you, and the remedies that help.',
          'Doshas cause a lot of needless worry. We examine your chart for Mangal (Manglik), Kaal Sarp, Pitra and other doshas, and tell you the truth: whether a dosha is genuinely present and strong, or mild and already cancelled by other placements.\n\nWhere a real dosha exists, we prescribe classical, practical remedies \u2014 specific mantras, charity, fasts, gemstones and rituals \u2014 matched to your chart. The goal is never fear; it is to balance the energy and move forward with confidence, especially around marriage and major decisions.'),
        svc('\u2645','Gemstone Recommendation','$100 CAD','Which gemstone genuinely suits your chart (and which to avoid), with the right finger, metal, weight and energising ritual.',
          'Gemstones strengthen a beneficial planet, but the wrong stone can do harm \u2014 so this service begins with a careful study of your chart. We identify which planets need support and which stone (and which to avoid) is right for you, from ruby and pearl to yellow and blue sapphire, emerald, coral and diamond.\n\nYou receive clear guidance on the correct carat weight, metal and finger, and the day and mantra for energising and wearing it, so the gemstone works with your chart rather than against it.'),
        svc('\u262f','Vedic Meditation Guidance','$100 CAD','A personalised meditation, mantra and breath practice matched to your chart to steady the mind and support your remedies.')
      ],
      blogPage:{ hero:{ title:'Vedic astrology blog \u2014 Jyotish notes & remedies', sub:'Plain-language writing on Vedic astrology, doshas, nakshatras, remedies and meditation from Jag Mallah.' } },
      blog:[
        { id:this.uid(), slug:'understanding-your-kundli', redirectTo:'/blog/ultimate-guide-birth-chart', title:'Understanding your Kundli: a beginner\u2019s guide to the Vedic birth chart', date:'2026-05-22', published:true, image:null, focusKeyword:'Vedic birth chart', robots:'index, follow',
          excerpt:'What the twelve houses, the planets and the ascendant really mean \u2014 and how to read your Vedic birth chart without the jargon.',
          body:'Your Vedic birth chart, or Kundli, is a snapshot of the sky at the exact moment you were born. In classical Jyotish it is the foundation of every reading.\n\nThe chart is divided into twelve houses, each governing an area of life \u2014 self, wealth, courage, home, creativity, health, partnership, transformation, fortune, career, gains and liberation. The nine planets move through these houses and through the twenty-seven nakshatras, colouring each area with their nature.\n\nReading a Vedic birth chart is less about prediction and more about understanding pattern and timing. The dasha system tells us which planet is shaping your current chapter. Remedies \u2014 mantra, gemstone, meditation \u2014 help you work with that energy rather than against it. Start by knowing your ascendant and the planet ruling your present dasha, and the chart slowly begins to speak.' },
        { id:this.uid(), slug:'mangal-dosha-truth', redirectTo:'/blog/mangal-dosha-myths-facts-remedies', title:'Mangal Dosha: what it really means for marriage (and what it doesn\u2019t)', date:'2026-04-09', published:true, image:null, focusKeyword:'Mangal Dosha', robots:'index, follow',
          excerpt:'Mangal Dosha causes a lot of needless fear. Here is a calm, classical look at what it is and the remedies that genuinely help.',
          body:'Few terms cause as much worry as Mangal Dosha. When Mars sits in certain houses of the birth chart, a chart is called Manglik \u2014 and families often panic.\n\nThe truth is gentler. Mangal Dosha is one factor among many in marriage matching, and it is frequently cancelled by other placements. An experienced Vedic astrologer weighs the whole chart \u2014 not a single word.\n\nWhere a genuine dosha exists, classical remedies are well established: specific mantras, charitable acts, and in some cases matching with another Manglik chart. The goal is never fear; it is a steady, well-matched marriage. If Mangal Dosha is worrying you, a proper Kundli Milan will tell you far more than a label ever could.' },
        { id:this.uid(), slug:'meditation-and-remedies', title:'Why meditation makes astrological remedies work', date:'2026-03-01', published:true, image:null, focusKeyword:'astrological remedies', robots:'index, follow',
          excerpt:'Gemstones and mantras are only half the story. Here is how a simple daily meditation amplifies your astrological remedies.',
          body:'Astrological remedies \u2014 mantras, gemstones, fasts, charity \u2014 are tools to shift the energy a planet expresses in your life. But a restless mind blunts every tool.\n\nMeditation is the quiet multiplier. A few minutes of steady breath each day calms the nervous system, sharpens intention, and helps a mantra land with real attention instead of mechanical repetition.\n\nIn my consultations I match a short meditation to your chart and your current dasha. Paired with the right remedy, it turns a ritual into a practice \u2014 and that is when people start to feel the difference.' }
      ],
      contactPage:{ title:'Contact your Vedic astrologer', sub:'Have a question about your chart, a dosha or the right remedy? Send your details below and Jag Mallah will personally get back to you.', note:'Birth details are optional \u2014 but sharing them helps give you a more accurate first response.' },
      faqPage:{ hero:{ title:'Frequently asked questions', sub:'Honest answers to the questions people ask most about Vedic astrology, readings and remedies. Still curious? Send your question on the contact page.' },
        items:[
          {q:'What is the difference between Vedic and Western astrology?',a:'Western astrology is based on the solar calendar and the seasons (Tropical zodiac), focusing heavily on psychology and personality. Vedic astrology (Jyotish) is based on the exact positions of the constellations (Sidereal zodiac) and is generally more focused on predictive outcomes, karma, and major life events.'},
          {q:'How accurate are daily or monthly horoscopes?',a:'General daily horoscopes are typically based solely on your Moon sign, while monthly horoscopes are based on your Sun sign. Both offer broad themes for the collective. For highly accurate and specific predictions, you need a personalized reading based on your complete natal chart (which uses your exact time, date, and place of birth).'},
          {q:'What information do I need for a birth chart reading?',a:'To generate an accurate birth chart, I need your date of birth, the exact time of birth (down to the minute, if possible), and the city and country where you were born. Please send these when you book, along with your questions, so your chart is ready before our Zoom or WhatsApp call.'},
          {q:'What if I don\u2019t know my exact time of birth?',a:'If you only know a rough window of time, it is still possible to read your chart using your Moon sign. Alternatively, we can perform a \u201cChart Rectification.\u201d This is an advanced process where I ask you about the timing of major life events to calculate and narrow down your closest exact birth time.'},
          {q:'What is a \u201cRising Sign\u201d or Ascendant?',a:'Your Rising sign (Lagna, or Ascendant) is the zodiac constellation that was rising on the eastern horizon at the exact moment you were born. It represents your outward personality, your physical appearance, and how the world initially perceives you. In Vedic astrology, the Lagna also sets the twelve houses, so an accurate birth time matters.'},
          {q:'Can astrology predict exactly what will happen in my future?',a:'Astrology does not predict a fixed, unavoidable fate. Instead, it highlights the energies, opportunities, and challenges present in your life. Think of it as a weather forecast\u2014it can tell you it will rain, but whether you carry an umbrella is ultimately up to your free will.'},
          {q:'Are my personal data and consultation private?',a:'Absolutely. At Analysis of Karma, I follow strict privacy and confidentiality rules to protect your personal details. All consultations are 100% confidential and are never shared or discussed with anyone else. Your birth details stay between us, and I never publish client stories or testimonials, however kind they may be.'},
          {q:'What is Mercury Retrograde?',a:'It is an optical illusion where the planet Mercury appears to move backward in the sky from our vantage point on Earth. In astrology, it is associated with miscommunications, technology glitches, and travel delays. It is a time better suited for reviewing, reflecting, and completing old tasks rather than starting brand-new projects.'},
          {q:'What are astrological remedies? Do I have to do them?',a:'Remedies are suggested actions used to mitigate challenging planetary placements. They can include lifestyle changes (karma), wearing specific gemstones, chanting mantras, or performing acts of charity. They are entirely optional and act as spiritual tools to help balance your energy, not mandatory requirements.'},
          {q:'Can astrology help me choose a career path?',a:'Yes! By looking at the 10th House (career), the 5th House (creativity and education), the 6th House (daily work and overcoming obstacles), and the placements of planets like Saturn and Mercury, astrology can reveal your natural talents, ideal work environments, and potential paths to financial success.'},
          {q:'What is a Saturn Return?',a:'A Saturn Return occurs roughly every 27 to 29.5 years when the planet Saturn returns to the exact sign and degree it was in when you were born. It is a major astrological coming-of-age period associated with intense growth, maturity, and the restructuring of your life.'},
          {q:'Do you offer refunds if I am not satisfied with a live reading?',a:'New clients pay only if satisfied, so there is nothing to refund. Consultations are $100 CAD per hour over Zoom or WhatsApp, and you pay after the reading. If you did not find value, you do not pay. If it helped you, you pay for it, so you do not carry a karma debt.'},
          {q:'How does astrology determine relationship compatibility?',a:'Astrologers use a technique called \u201cSynastry,\u201d which involves overlaying two people\u2019s birth charts to see how their planets interact. This highlights areas of harmony, potential friction, communication styles, and the long-term viability of the partnership. In Vedic astrology, I also use Kundli Milan (Guna Milan) and check both charts for Mangal Dosha.'},
          {q:'What is a Moon sign and why does it matter?',a:'While your Sun sign represents your core identity and ego, your Moon sign dictates your emotional inner world. It governs your subconscious reactions, your instincts, and what you need to feel safe, nurtured, and secure. In Vedic astrology, your Moon sign (Rashi) is central: your dasha periods are counted from the Moon\u2019s birth nakshatra.'},
          {q:'How often should I get my birth chart read?',a:'A foundational, in-depth birth chart reading usually only needs to be done once. However, checking in for a \u201cTransit\u201d or \u201cYear Ahead\u201d reading is a highly popular service to book once a year, usually around your birthday or the New Year, to see what energies are currently affecting your chart.'},
          {q:'Can astrology predict health issues?',a:'Medical astrology can point out physical sensitivities or periods of low vitality based on planetary alignments. However, I am not a medical professional. Astrology should never replace professional medical diagnosis, advice, or treatment. A reading can highlight areas to look after and times to take extra care, so you can discuss concerns with your doctor.'}
        ] },
      leads:[],
      blocks:{ home:[], about:[], services:[], meditation:[], blog:[], contact:[] },
      seo:{
        home:{ focusKeyword:'Vedic astrologer', title:'Vedic Astrologer Jag Mallah | Analysis of Karma', metaDescription:'Vedic astrologer Jag Mallah offers authentic Kundli readings, marriage matching, dosha analysis & remedies. Book a personal Vedic astrology consultation today.', robots:'index, follow' },
        about:{ focusKeyword:'experienced Vedic astrologer', title:'Experienced Vedic Astrologer Jag Mallah | About Analysis of Karma', metaDescription:'Meet Jag Mallah, an experienced Vedic astrologer & meditation guide. Honest, classical Jyotish readings with practical remedies for love, career & life.', robots:'index, follow' },
        services:{ focusKeyword:'Vedic astrology services', title:'Vedic Astrology Services | Kundli, Matching & Remedies', metaDescription:'Vedic astrology services by Jag Mallah: birth chart readings, Kundli Milan marriage matching, dosha analysis, gemstone & meditation guidance. Book online.', robots:'index, follow' },
        blog:{ focusKeyword:'Vedic astrology blog', title:'Vedic Astrology Blog | Jyotish, Doshas & Remedies \u2014 Jag Mallah', metaDescription:'A Vedic astrology blog in plain language: birth charts, Mangal dosha, nakshatras, remedies and meditation explained by astrologer Jag Mallah.', robots:'index, follow' },
        contact:{ focusKeyword:'consult Vedic astrologer', title:'Contact \u2014 Consult Vedic Astrologer Jag Mallah | Analysis of Karma', metaDescription:'Consult Vedic astrologer Jag Mallah. Send your birth details and question to book a personal Kundli reading or remedy guidance. Replies in English & Hindi.', robots:'index, follow' },
        faq:{ focusKeyword:'Vedic astrology FAQ', title:'Vedic Astrology FAQ | Common Questions Answered', metaDescription:'Answers to common Vedic astrology questions — birth charts, Moon signs, remedies, Saturn return, compatibility and more, explained by astrologer Jag Mallah.', robots:'index, follow' },
        meditation:{ focusKeyword:'professional meditation guide', title:'Professional Meditation Guide Jag Mallah | Analysis of Karma', metaDescription:'Professional meditation guide Jag Mallah offers guided meditation, breathwork and mantra practice to calm the mind and deepen your spiritual path.', robots:'index, follow' }
      },
      schema: JSON.stringify({
        "@context":"https://schema.org","@type":"ProfessionalService","name":"Analysis of Karma","description":"Vedic astrology and Kundli reading services by astrologer Jag Mallah.","image":"","url":"https://www.analysisofkarma.com","founder":{"@type":"Person","name":"Jag Mallah"},"areaServed":"Worldwide","priceRange":"$$","sameAs":["https://www.instagram.com/analysisofkarma/","https://www.youtube.com/@analysisofkarma"],"knowsAbout":["Vedic Astrology","Jyotish","Kundli","Marriage Matching","Meditation"]
      }, null, 2)
    };
  }

  // ---------- seed blog posts ----------
  seedPosts(){ const P=(slug,title,date,kw,excerpt,body)=>({id:this.uid(),slug,title,date,published:true,image:null,focusKeyword:kw,robots:'index, follow',excerpt,body}); return [
    P('ultimate-guide-birth-chart','The Ultimate Guide to Understanding Your Birth Chart (Natal Chart)','2026-06-15','birth chart',
      'Your birth chart is the map of who you are. Here is how to read its signs, planets and houses \u2014 step by step, without the jargon.',
      'Your birth chart \u2014 also called the natal chart or Kundli \u2014 is a snapshot of the sky at the precise moment you were born. Every planet was sitting in a particular sign and house, and that exact arrangement never repeats. It is the single most important tool in astrology, and in classical Jyotish it is the foundation of every reading.\n\nThree ingredients build the chart. The signs (Aries through Pisces) describe how energy expresses itself. The planets describe what kind of energy is at play \u2014 the Sun is identity, the Moon is emotion, Mercury is the mind, and so on. The houses, twelve slices of the chart, describe where in life that energy lands: money, marriage, career, health.\n\nIn the Vedic chart, each of the twelve houses governs an area of life \u2014 self, wealth, courage, home, creativity, health, partnership, transformation, fortune, career, gains and liberation. The nine planets move through these houses and through the twenty-seven nakshatras, colouring each area with their nature.\n\nThe Ascendant, or Rising sign, is your starting point \u2014 the sign on the eastern horizon at your birth. It frames the whole house system and is why two people born on the same day can feel so different. Once you know your Ascendant and the sign and house of each planet, the chart begins to read like a sentence.\n\nReading a Vedic birth chart is less about prediction and more about understanding pattern and timing. The dasha system tells us which planet is shaping your current chapter. Remedies \u2014 mantra, gemstone, meditation \u2014 help you work with that energy rather than against it.\n\nReading well takes practice, but you can start today: find your Sun, Moon and Rising, notice which houses hold the most planets, and look at where Saturn sits to understand your biggest lessons. Know your ascendant and the planet ruling your present dasha, and the chart slowly begins to speak. From there, a personal consultation can connect the dots into one clear, practical story.'),
    P('sun-moon-rising-signs','Sun, Moon, and Rising Signs: What They Mean & How to Find Yours','2026-06-08','sun moon and rising signs',
      'Your \u201cbig three\u201d \u2014 Sun, Moon and Rising \u2014 are the heart of your chart. Here is what each one rules and how to find yours.',
      'If astrology had a headline, it would be your big three: the Sun, the Moon and the Rising sign. Together they sketch the core of your personality before any deeper reading begins.\n\nYour Sun sign is your essential identity \u2014 your ego, your vitality and the role you are here to grow into. It is set by your date of birth, which is why it is the sign most people know. Your Moon sign rules your emotional inner world: your instincts, your moods and what makes you feel safe. Because the Moon moves quickly, you need your date and rough time of birth to find it.\n\nYour Rising sign, or Ascendant, is the face you meet the world with \u2014 your first impression and outward style. It changes roughly every two hours, so it needs your exact birth time. This is why two people with the same Sun sign can come across so differently.\n\nTo find all three you need three details: date, time and place of birth. Enter them into any chart calculator, or better, bring them to a reading \u2014 because the interplay between the three, not just the labels, is where the real insight lives.'),
    P('zodiac-compatibility-best-worst-matches','Zodiac Compatibility: The Best and Worst Matches for Every Sign','2026-06-01','zodiac compatibility',
      'Which signs naturally click and which ones clash? A clear, element-by-element look at zodiac compatibility \u2014 and why your full chart matters more.',
      'Zodiac compatibility is the most-searched question in astrology, and the simplest answer starts with the elements. Fire signs (Aries, Leo, Sagittarius) bring passion and drive. Earth signs (Taurus, Virgo, Capricorn) bring stability. Air signs (Gemini, Libra, Aquarius) bring ideas and communication. Water signs (Cancer, Scorpio, Pisces) bring emotion and depth.\n\nAs a rule of thumb, signs of the same element flow easily, and complementary elements \u2014 fire with air, earth with water \u2014 tend to support one another. The classically \u201cchallenging\u201d pairs sit at a square to each other, where styles can grate. But challenge is not doom; friction often creates the most growth.\n\nHere is the honest truth: sun-sign compatibility is a fun starting point, not a verdict. Real compatibility comes from synastry \u2014 comparing two full birth charts, including the Moon, Venus, Mars and the Ascendant. In Vedic astrology, Guna Milan and Mangal Dosha analysis go deeper still. If a relationship matters to you, a proper matching reading will tell you far more than your Sun signs alone.'),
    P('mercury-retrograde-survival-guide','What is Mercury Retrograde and How to Survive It','2026-05-20','Mercury retrograde',
      'Mercury retrograde gets blamed for everything. Here is what it actually is, when it happens, and simple ways to move through it calmly.',
      'A few times a year, the planet Mercury appears to move backward across the sky. It is an optical illusion \u2014 Mercury never truly reverses \u2014 but astrologically the effect is real enough to notice. Mercury rules communication, technology, travel and contracts, so when it turns retrograde these areas can get tangled.\n\nTypical signs include missed messages, technology glitches, travel delays and old conversations resurfacing. Rather than a curse, think of it as a cosmic invitation to slow down. The prefix \u201cre\u201d is your guide: review, revise, reflect, reconnect and repair are all favoured, while launching brand-new ventures is not.\n\nTo move through it smoothly, back up your devices, read contracts twice, confirm travel plans, and pause before sending a heated message. Finish lingering tasks instead of starting fresh ones. Used well, Mercury retrograde becomes a useful clean-up window rather than a season of dread \u2014 and in about three weeks, it is over.'),
    P('vedic-vs-western-astrology','Vedic vs. Western Astrology: Which One is Right for You?','2026-05-10','Vedic vs Western astrology',
      'Two great traditions, two different zodiacs. Here is how Vedic and Western astrology differ \u2014 and how to choose the approach that fits your questions.',
      'Vedic and Western astrology share ancient roots but diverge in one crucial way: the zodiac they use. Western astrology follows the Tropical zodiac, tied to the seasons and the equinoxes. Vedic astrology (Jyotish) follows the Sidereal zodiac, anchored to the actual positions of the constellations. Because of a slow shift called precession, the two are currently about 24 degrees apart \u2014 which is why your sign can differ between systems.\n\nThe emphasis differs too. Western astrology leans psychological \u2014 personality, motivation and self-understanding. Vedic astrology leans predictive, using planetary periods called dashas to time events around marriage, career and health, alongside remedies such as mantras and gemstones.\n\nNeither is \u201cmore correct\u201d; they answer different questions. If you want to understand your inner patterns, Western astrology is a wonderful mirror. If you want timing, life-event guidance and practical remedies rooted in classical tradition, Vedic astrology is built for exactly that. Many people, in the end, enjoy both.'),
    P('saturn-return-explained','Saturn Return: What It Is, When It Happens, and How to Navigate It','2026-04-28','Saturn return',
      'The Saturn return is astrology\u2019s great coming-of-age. Here is when it strikes, what it tests, and how to come through it stronger.',
      'Roughly every 29 and a half years, Saturn completes a full orbit and returns to the exact place it occupied at your birth. This is the Saturn return, and it tends to arrive around ages 28\u201330, again near 58\u201360, and for some a third time in old age. The first is usually the most memorable.\n\nSaturn is the planet of structure, responsibility and maturity, so its return often coincides with major thresholds: career pivots, marriages, moves, or the ending of things that no longer fit. It can feel heavy, as if life is testing whether your foundations are real. That pressure is the point \u2014 Saturn removes what is hollow so what remains can hold weight.\n\nTo navigate it, stop resisting change and start building deliberately. Commit to the work, the relationship or the path that genuinely matters, and release what you have outgrown. Handled with honesty, the Saturn return is less a crisis than a graduation \u2014 into a more grounded, authentic adult life.'),
    P('12-astrological-houses-explained','The 12 Astrological Houses Explained: Where Life Happens','2026-04-15','astrological houses',
      'Planets show what, signs show how, and houses show where. A quick, clear tour of all twelve astrological houses and the areas of life they rule.',
      'If planets are the actors and signs are their costumes, the twelve houses are the stages on which the drama plays out. Each house governs a specific arena of life, and the planets falling within it colour that arena.\n\nThe first six houses are personal. The 1st is the self, body and appearance; the 2nd, money and values; the 3rd, communication and siblings; the 4th, home and roots; the 5th, creativity, romance and children; the 6th, daily work, routine and health. The upper six reach outward. The 7th rules partnership and marriage; the 8th, transformation, shared resources and the hidden; the 9th, higher learning, travel and philosophy; the 10th, career and public standing; the 11th, friendships, networks and gains; the 12th, solitude, spirituality and release.\n\nWhen you read a chart, notice which houses are crowded with planets \u2014 those are the life areas where the most energy and story concentrate. An empty house is not a problem; it simply means that theme runs quietly in the background of your life.'),
    P('best-gemstones-zodiac-sign','Best Gemstones for Each Zodiac Sign to Attract Wealth and Love','2026-04-02','gemstones for zodiac signs',
      'The right gemstone can strengthen a supportive planet in your chart. Here are the traditional stones for each sign \u2014 and why a personal check matters first.',
      'In Vedic astrology, gemstones are worn to strengthen a beneficial planet and steady its influence in your life. Each stone carries the energy of a specific planet, and traditional associations link them to the signs through their ruling planets.\n\nAs a general guide: Aries and Scorpio (ruled by Mars) favour red coral; Taurus and Libra (Venus) favour diamond or white sapphire; Gemini and Virgo (Mercury) favour emerald; Cancer (Moon) favours pearl; Leo (Sun) favours ruby; Sagittarius and Pisces (Jupiter) favour yellow sapphire; Capricorn and Aquarius (Saturn) favour blue sapphire. Worn correctly, these stones are said to support wealth, harmony and emotional balance.\n\nOne important caution: gemstones are powerful, and the wrong one can do more harm than good. A stone that helps one chart may aggravate another, depending on which planets are strong or afflicted for you. Always have your birth chart checked before choosing a gemstone \u2014 along with the correct weight, metal, finger and energising ritual.'),
    P('mangal-dosha-myths-facts-remedies','Mangal Dosha (Kuja Dosha): Myths, Facts, and Remedies','2026-03-20','Mangal Dosha',
      'Mangal Dosha causes more fear than it deserves. Here is a calm, classical look at what being Manglik really means \u2014 and the remedies that genuinely help.',
      'Few astrological terms cause as much panic as Mangal Dosha, also known as Kuja Dosha or being \u201cManglik.\u201d It occurs when Mars sits in certain houses \u2014 the 1st, 4th, 7th, 8th or 12th \u2014 of the birth chart, and it is most often discussed around marriage. When a chart is called Manglik, families often worry.\n\nThe myths run wild: that a Manglik person brings misfortune, or that such a marriage is doomed. The facts are far gentler. Mangal Dosha is just one factor among many in marriage matching, and it is frequently cancelled or reduced by other placements in the chart. An experienced Vedic astrologer weighs the whole picture, not a single label. In many cases the so-called dosha is mild, or already neutralised.\n\nWhere a genuine, strong dosha exists, classical remedies are well established: specific Mars mantras, charitable acts, fasting on Tuesdays, and in some traditions matching with another Manglik chart so the effect is balanced. The goal is never fear \u2014 it is a steady, well-suited marriage. If Mangal Dosha is worrying you, a proper Kundli Milan will tell you far more than the word \u201cManglik\u201d ever could.'),
    P('full-moon-new-moon-vedic-astrology','Full Moon and New Moon as per Vedic Astrology','2026-03-08','full moon and new moon',
      'Purnima and Amavasya carry deep meaning in Vedic astrology. Here is how the lunar cycle shapes energy, ritual and the rhythm of spiritual practice.',
      'In Vedic astrology the Moon is the mind, and its monthly cycle sets a powerful rhythm for emotion and spiritual practice. Two points anchor that cycle: the full moon (Purnima) and the new moon (Amavasya).\n\nPurnima, the full moon, is when the Moon is fully illuminated and at its most expansive. It is considered highly auspicious \u2014 a time of completion, gratitude, charity and celebration. Many festivals fall on Purnima, and it is regarded as ideal for meditation, mantra and devotion, when the mind is bright and full. Amavasya, the new moon, is dark and inward. It is a time for rest, reflection, honouring ancestors and releasing what no longer serves you \u2014 rather than starting bold new ventures.\n\nLiving with this cycle is simple and grounding. Use the waxing phase to begin and grow projects, the full moon to give thanks and complete, and the dark new moon to pause and reset. Aligning your intentions with the Moon\u2019s natural breath brings calm, steady momentum to daily life and spiritual practice alike.'),
    P('career-astrology-midheaven','Career Astrology: Finding Your True Calling Based on Your Midheaven','2026-02-22','career astrology',
      'Your Midheaven points to your public path and vocation. Here is how to read it \u2014 and the other chart factors that reveal your true calling.',
      'When people ask astrology one practical question, it is often about work: what am I truly meant to do? The chart offers a clear starting point in the Midheaven, or MC \u2014 the highest point of your chart, marking your public role, reputation and career direction.\n\nThe sign on your Midheaven describes the flavour of your vocation. An earthy MC may thrive in business, structure or craft; an airy one in communication, ideas or media; a fiery one in leadership or performance; a watery one in care, healing or the creative arts. The planet that rules your MC sign \u2014 and where it sits \u2014 adds detail about how that calling unfolds.\n\nThe Midheaven is not the whole story. The 10th house of career, the 6th house of daily work, the 2nd house of earnings, and strong planets like Saturn (discipline) and the Sun (purpose) all contribute. Read together, they reveal not just a job title but the kind of environment, contribution and recognition that will genuinely fulfil you \u2014 the foundation of any good career reading.'),
    P('north-and-south-nodes-karmic-path','What Are the North and South Nodes? Unlocking Your Karmic Path','2026-02-10','north and south nodes',
      'The lunar nodes describe where you have been and where your soul is headed. A deeper look at Rahu and Ketu and the karmic axis of your chart.',
      'The North and South Nodes \u2014 known in Vedic astrology as Rahu and Ketu \u2014 are not planets but two points where the Moon\u2019s path crosses the Sun\u2019s. Despite being invisible, they carry some of the deepest meaning in a chart, describing your karmic axis: where you have been, and where you are growing toward.\n\nThe South Node (Ketu) represents the past \u2014 talents, habits and comfort zones carried from earlier experience. It comes easily, sometimes too easily, and can become a place you hide. The North Node (Rahu) points to the future \u2014 unfamiliar, uncomfortable, and exactly where your growth lies. Following it feels like a stretch precisely because it is new soul territory.\n\nThe nodes always sit opposite each other, forming an axis across two signs and houses. Understanding that axis is like reading a compass for this lifetime: lean away from over-relying on the South Node\u2019s old comforts, and consciously move toward the North Node\u2019s lessons. That gentle, deliberate stretch is the heart of walking your karmic path.'),
    P('auspicious-dates-marriage-business','Most Auspicious Dates for Marriage and Business','2026-01-28','auspicious dates for marriage',
      'In Vedic astrology, timing is everything. Here is how Muhurat works for choosing the best dates to marry, launch a business or begin anything important.',
      'In Vedic astrology, when you begin something matters as much as what you begin. The practice of choosing an auspicious time is called Muhurat \u2014 electing a moment when planetary energies support success, harmony and longevity.\n\nFor a marriage, an astrologer studies the lunar day (tithi), the star or nakshatra, the weekday, and the positions of Jupiter and Venus, while avoiding inauspicious windows such as eclipse periods and the months when key planets are combust or retrograde. The aim is a date that supports a stable, happy union \u2014 ideally one harmonised with both partners\u2019 birth charts. For a business launch, a signing or a move into a new home, similar principles apply, with attention to strong houses of wealth and a favourable rising sign.\n\nWhile general almanac (Panchang) dates give a useful shortlist, the most powerful Muhurat is personalised \u2014 chosen to fit your own chart, not just the calendar. If you have an important beginning ahead, an electional reading can pinpoint a window that gives it the best possible start.'),
    P('solar-return-charts','Solar Return Charts: Predicting Your Birthday Year Ahead','2026-01-15','solar return chart',
      'Each birthday the Sun returns to its exact natal spot, creating a fresh chart for the year. Here is how a solar return forecast works.',
      'Every year, around your birthday, the Sun returns to the exact position it held when you were born. That precise moment creates a brand-new chart called the solar return \u2014 a forecast map for the twelve months ahead.\n\nThe solar return is read alongside your natal chart. The rising sign of the return, the house the Sun falls into, and the placement of the other planets all hint at the themes of your coming year. A solar return Sun in the career house may signal a year of professional focus; in the relationship house, a year where partnership takes centre stage. Aspects within the return chart show where ease and challenge are likely to appear.\n\nWhat makes the solar return so useful is its timing. Rather than vague yearly horoscopes, it offers a chart tailored to you and valid only until your next birthday. Read with the longer planetary periods and current transits, it becomes a practical planning tool \u2014 a way to enter your new year knowing where to invest your energy and what to prepare for.'),
    P('medical-astrology-body','Medical Astrology: How the Zodiac Signs Relate to the Physical Body','2026-01-05','medical astrology',
      'Each zodiac sign traditionally governs a part of the body. An introduction to medical astrology \u2014 and an honest note on its limits.',
      'Medical astrology is one of the oldest branches of the craft, built on a simple idea: each zodiac sign governs a region of the body, from head to toe. The sequence flows in order down the body, beginning at the top with Aries and ending at the feet with Pisces.\n\nTraditionally, Aries rules the head and face; Taurus the throat and neck; Gemini the arms, hands and lungs; Cancer the chest and stomach; Leo the heart and spine; Virgo the digestive system; Libra the kidneys and lower back; Scorpio the reproductive organs; Sagittarius the hips and thighs; Capricorn the bones, knees and skin; Aquarius the circulation and ankles; and Pisces the feet and lymphatic system. The signs emphasised in your chart can point to areas of natural strength or sensitivity.\n\nA clear and honest caveat belongs here: medical astrology is a tool for awareness and lifestyle reflection, not diagnosis. It should never replace professional medical advice, testing or treatment. Used wisely, alongside your doctor, it can gently encourage you to care for the parts of the body your chart highlights \u2014 a nudge toward prevention and balance.')
  ]; }

  // ---------- head sync ----------
  setMeta(name, content, attr){ attr=attr||'name'; let m=document.head.querySelector('meta['+attr+'="'+name+'"]'); if(!m){ m=document.createElement('meta'); m.setAttribute(attr,name); document.head.appendChild(m);} m.setAttribute('data-aok','1'); m.setAttribute('content',content||''); }
  setCanonical(href){ let l=document.head.querySelector('link[rel="canonical"]'); if(!href){ if(l) l.remove(); return; } if(!l){ l=document.createElement('link'); l.setAttribute('rel','canonical'); document.head.appendChild(l); } l.setAttribute('href',href); }
  txt(s){ const e=document.createElement('div'); e.innerHTML=String(s||''); return (e.textContent||'').replace(/\s+/g,' ').trim(); }
  cut(s,max){ s=String(s||'').replace(/\s+/g,' ').trim(); if(s.length<=max) return s; s=s.slice(0,max-1); const p=s.lastIndexOf(' '); return (p>max*.6?s.slice(0,p):s).replace(/[ ,;:\u2014-]+$/,'')+'\u2026'; }
  brandName(){ const d=this.state.data; return (d.local&&d.local.businessName)||d.brand.name; }
  // "· Surrey, BC" before the "| Brand" part, unless the title already names the city (same as aok_with_location)
  withLocation(title){ const L=this.state.data.local||{}; if(L.locationInTitles===false||!L.locality||!title) return title; if(title.toLowerCase().indexOf(String(L.locality).toLowerCase())>-1) return title; const label=L.locality+(L.regionCode?', '+L.regionCode:''); const i=title.indexOf(' | '); if(i<0) return title+' \u00b7 '+label; const t=title.slice(0,i)+' \u00b7 '+label+title.slice(i);
    // too long for Google (~65 chars)? drop a trailing "| brand" segment only (Google shows the site name anyway); keyword text is never removed
    const j=t.lastIndexOf(' | '); return (t.length>65&&j>-1&&t.slice(j+3).toLowerCase().indexOf(this.brandName().toLowerCase())>-1)?t.slice(0,j):t; }
  // "Title | Brand" unless too long for Google (~65 chars) — mirrors aok_fit_brand in api/seo-lib.php
  fitBrand(title,brand){ const t=title+' | '+brand; return t.length>65&&title?title:t; }
  pageDescription(pg){ if((pg.metaDescription||'').trim()) return pg.metaDescription.trim(); const blocks=((this.state.data.blocks||{})['page:'+pg.id])||[]; const parts=[];
    blocks.forEach(b=>{ ['text','caption'].forEach(f=>{ if(b&&typeof b[f]==='string'&&b[f]) parts.push(this.txt(b[f])); }); }); const t=parts.join(' ').trim();
    return t?this.cut(t,158):((this.state.data.seo&&this.state.data.seo.home&&this.state.data.seo.home.metaDescription)||''); }
  headMeta(){ const d=this.state.data, r=this.state.route, brand=this.brandName(); const base=String(d.siteUrl||'https://www.analysisofkarma.com').replace(/\/$/,'').replace(/^http:/,'https:');
    const m={title:brand,description:(d.seo.home&&d.seo.home.metaDescription)||'',robots:'index, follow',canonical:base+this.routePath()};
    if(['home','about','services','meditation','blog','contact','faq'].indexOf(r)>-1&&!(r==='blog'&&this.state.postId)){ const sc=d.seo[r]||{}; m.title=sc.title||brand; if(r!=='blog') m.title=this.withLocation(m.title); if(sc.metaDescription) m.description=sc.metaDescription; m.robots=sc.robots||'index, follow'; if(r==='faq'&&!sc.title) m.title=this.txt(d.faqPage.hero.title)+' | '+brand; }
    else if(r==='service'){ const s=(d.services||[]).find(x=>x.id===this.state.serviceId)||{}; m.title=(s.seoTitle||'').trim()||this.withLocation(this.txt(s.title)+' | '+brand); m.description=(s.seoDescription||'').trim()||this.cut(this.txt(s.desc),158); if(s.canonical) m.canonical=/^https?:/.test(s.canonical)?s.canonical:base+'/'+String(s.canonical).replace(/^\//,''); if(s.noindex) m.robots='noindex, follow'; }
    else if(r==='blog'&&this.state.postId){ const p=(d.blog||[]).find(x=>x.id===this.state.postId)||{}; m.title=this.fitBrand(this.txt(p.title),brand); m.description=this.cut(this.txt(p.excerpt),158); m.robots=p.robots||'index, follow'; if(p.canonical) m.canonical=/^https?:/.test(p.canonical)?p.canonical:base+'/'+String(p.canonical).replace(/^\//,''); }
    else if(r==='page'){ const pg=(d.pages||[]).find(x=>x.id===this.state.pageId)||{}; m.title=this.fitBrand(this.txt(pg.title),brand); m.description=this.pageDescription(pg); }
    else if(r==='admin'){ m.title='Admin | '+brand; m.robots='noindex, nofollow'; m.canonical=''; }
    else if(r==='notfound'){ m.title='Page not found | '+brand; m.robots='noindex, follow'; m.canonical=''; }
    return m; }
  // mirrors aok_robots_full / aok_x_handle in api/seo-lib.php
  robotsFull(r){ r=r||''; return (!r||/noindex|max-image-preview/i.test(r))?r:r+', max-image-preview:large, max-snippet:-1, max-video-preview:-1'; }
  xHandle(){ const s=((this.state.data&&this.state.data.socials)||[]).map(x=>String(x.url||'').trim()).map(u=>u.match(/^https?:\/\/(www\.)?(x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/?$/i)).find(Boolean); return s?'@'+s[3]:''; }
  syncHead(){ const d=this.state.data; if(!d) return; const m=this.headMeta();
    try{ document.title=m.title; this.setMeta('description',m.description); this.setMeta('robots',this.robotsFull(m.robots)); const xh=this.xHandle(); if(xh){ this.setMeta('twitter:site',xh); this.setMeta('twitter:creator',xh); } this.setCanonical(m.canonical);
      this.setMeta('og:title',m.title,'property'); this.setMeta('og:description',m.description,'property'); if(m.canonical) this.setMeta('og:url',m.canonical,'property'); this.setMeta('twitter:title',m.title); this.setMeta('twitter:description',m.description);
      // the server (render.php) supplies the full structured-data graph; without it, fall back to the basic markup
      if(document.getElementById('aok-graph')) return;
      let s=document.getElementById('aok-schema'); if(!s){ s=document.createElement('script'); s.type='application/ld+json'; s.id='aok-schema'; document.head.appendChild(s);} s.textContent=d.schema||'';
      let fq=document.getElementById('aok-faq-schema'); const r=this.state.route;
      if(r==='faq'&&d.faqPage&&d.faqPage.items){ if(!fq){ fq=document.createElement('script'); fq.type='application/ld+json'; fq.id='aok-faq-schema'; document.head.appendChild(fq);} fq.textContent=JSON.stringify({"@context":"https://schema.org","@type":"FAQPage",mainEntity:d.faqPage.items.map(it=>({"@type":"Question",name:this.txt(it.q),acceptedAnswer:{"@type":"Answer",text:this.txt(it.a)}}))}); } else if(fq){ fq.remove(); } }catch(e){} }

  // ---------- editable components ----------
  makeComp(){
    const self=this;
    this.EditableText = class extends React.Component {
      componentDidMount(){ if(this.el) this.el.innerHTML=this.props.html||''; }
      componentDidUpdate(){ if(this.el && document.activeElement!==this.el && this.el.innerHTML!==(this.props.html||'')) this.el.innerHTML=this.props.html||''; }
      commit=()=>{ this.props.onCommit(this.el.innerHTML); };
      render(){ const {tag='div',style,editable,className}=this.props; return React.createElement(tag,{ ref:r=>this.el=r, className, style, contentEditable:editable||undefined, suppressContentEditableWarning:true, onBlur:editable?this.commit:undefined }); }
    };
    this.EditableImage = class extends React.Component {
      state={ tx:null, ty:null, grab:false };
      pick=()=>{ const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.onchange=e=>{ const f=e.target.files[0]; if(!f)return; self.scaleImage(f,u=>this.props.onCommit(u)); }; inp.click(); };
      adj(){ const a=this.props.adj||{}; return { x:a.x==null?50:a.x, y:a.y==null?50:a.y, scale:a.scale||1 }; }
      curPos(){ const a=this.adj(); return { x:this.state.tx!=null?this.state.tx:a.x, y:this.state.ty!=null?this.state.ty:a.y, scale:a.scale }; }
      onDown=(e)=>{ if(!this.props.editable||!this.props.src) return; if(e.target.closest&&e.target.closest('[data-imgctrl]')) return; e.preventDefault(); const rect=this.el.getBoundingClientRect(); const a=this.adj(); this._d={ sx:e.clientX, sy:e.clientY, ox:a.x, oy:a.y, w:rect.width||1, h:rect.height||1, scale:a.scale, moved:false }; window.addEventListener('pointermove',this.onMove); window.addEventListener('pointerup',this.onUp); this.setState({tx:a.x,ty:a.y,grab:true}); };
      onMove=(e)=>{ const d=this._d; if(!d)return; d.moved=true; const sc=d.scale||1; let nx=d.ox-((e.clientX-d.sx)/d.w*100)/sc; let ny=d.oy-((e.clientY-d.sy)/d.h*100)/sc; nx=Math.max(0,Math.min(100,nx)); ny=Math.max(0,Math.min(100,ny)); d.lx=nx; d.ly=ny; this.setState({tx:nx,ty:ny}); };
      onUp=()=>{ window.removeEventListener('pointermove',this.onMove); window.removeEventListener('pointerup',this.onUp); const d=this._d; this._d=null; const a=this.adj(); if(d&&d.moved&&d.lx!=null){ this.props.onAdjust({x:d.lx,y:d.ly,scale:a.scale}); } this.setState({tx:null,ty:null,grab:false}); };
      zoom=(delta)=>{ const a=this.adj(); let s=Math.round((a.scale+delta)*10)/10; s=Math.max(1,Math.min(3,s)); this.props.onAdjust({x:a.x,y:a.y,scale:s}); };
      reset=()=>{ this.props.onAdjust({x:50,y:50,scale:1}); };
      render(){ const {src,alt,title,style,editable,placeholder,radius}=this.props; const p=this.curPos();
        const fill={width:'100%',height:'100%',objectFit:'cover',display:'block',objectPosition:p.x+'% '+p.y+'%',transform:'scale('+p.scale+')',transformOrigin:p.x+'% '+p.y+'%'};
        const body= src? React.createElement('img',{src,alt:alt||'',title:title||undefined,draggable:false,style:fill}) : React.createElement('div',{style:{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',background:'repeating-linear-gradient(45deg,#EFE7D8,#EFE7D8 14px,#F7F2E9 14px,#F7F2E9 28px)',color:'#A68446',fontFamily:'monospace',fontSize:12,textAlign:'center',padding:16,lineHeight:1.5}}, placeholder||'image');
        const inner=React.createElement('div',{style:{position:'absolute',inset:0,overflow:'hidden',borderRadius:radius||0}}, body);
        let controls=null;
        if(editable){
          const zbtn=(label,fn,title)=>React.createElement('button',{'data-imgctrl':'1',onClick:fn,title:title,style:{width:28,height:28,borderRadius:7,border:'none',background:'rgba(28,10,6,.82)',color:'#fff',cursor:'pointer',font:'700 15px '+self.HEAD,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}},label);
          controls=[
            React.createElement('button',{key:'rep','data-imgctrl':'1',onClick:this.pick,title:'Replace image',style:{position:'absolute',top:8,right:8,zIndex:6,padding:'7px 12px',borderRadius:999,border:'none',background:'rgba(28,10,6,.88)',color:'#fff',cursor:'pointer',font:'600 12px '+self.HEAD,display:'flex',alignItems:'center',gap:6,boxShadow:'0 2px 8px rgba(0,0,0,.3)'}},'\u21bb Replace'),
            src?React.createElement('div',{key:'hint',style:{position:'absolute',top:9,left:9,zIndex:5,pointerEvents:'none',padding:'5px 9px',borderRadius:999,background:'rgba(28,10,6,.55)',color:'#fff',font:'600 10.5px '+self.HEAD,letterSpacing:'.02em'}},'\u2725 Drag to move'):null,
            src?React.createElement('div',{key:'bar','data-imgctrl':'1',style:{position:'absolute',bottom:8,left:'50%',transform:'translateX(-50%)',zIndex:6,display:'flex',alignItems:'center',gap:6,padding:'5px 7px',borderRadius:999,background:'rgba(28,10,6,.62)'}},
              zbtn('\u2212',()=>this.zoom(-0.1),'Smaller / zoom out'),
              React.createElement('span',{key:'pct',style:{color:'#fff',font:'600 11px '+self.HEAD,minWidth:36,textAlign:'center'}}, Math.round(p.scale*100)+'%'),
              zbtn('+',()=>this.zoom(0.1),'Bigger / zoom in'),
              zbtn('\u21ba',this.reset,'Reset position & size')):null
          ];
        }
        return React.createElement('div',{ref:r=>this.el=r,onPointerDown:this.onDown,style:{...style,position:'relative',borderRadius:radius||0,cursor:editable&&src?(this.state.grab?'grabbing':'grab'):'default',touchAction:editable&&src?'none':'auto'}}, inner, controls); }
    };
    this.FancyText = class extends React.Component {
      state={ i:0, show:true };
      componentDidMount(){ const w=this.props.words||[]; if(w.length>1){ this.t=setInterval(()=>{ this.setState({show:false}); this._f=setTimeout(()=>{ const ws=this.props.words||[]; this.setState(s=>({i:(s.i+1)%Math.max(ws.length,1),show:true})); },300); }, this.props.interval||2200); } }
      componentWillUnmount(){ clearInterval(this.t); clearTimeout(this._f); }
      render(){ const {words=[],style}=this.props; const w=words.length?words[this.state.i%words.length]:''; return React.createElement('span',{style:{...style,display:'inline-block',transition:'opacity .3s, transform .3s',opacity:this.state.show?1:0,transform:this.state.show?'translateY(0)':'translateY(6px)'}}, w); }
    };
    this.StickyVideo = class extends React.Component {
      state={ stuck:false, closed:false };
      componentDidMount(){ this.onScroll=()=>{ if(!this.ref) return; const r=this.ref.getBoundingClientRect(); const past=r.bottom<80; const next=past&&!this.props.disabled; const up={}; if(next!==this.state.stuck) up.stuck=next; if(!past&&this.state.closed) up.closed=false; if(Object.keys(up).length) this.setState(up); }; window.addEventListener('scroll',this.onScroll,{passive:true}); window.addEventListener('resize',this.onScroll); this.onScroll(); }
      componentWillUnmount(){ window.removeEventListener('scroll',this.onScroll); window.removeEventListener('resize',this.onScroll); }
      render(){ const {src,corner}=this.props; const stuck=this.state.stuck&&!this.state.closed;
        const pos=corner==='bl'?{left:18,bottom:18}:corner==='tr'?{right:18,top:70}:corner==='tl'?{left:18,top:70}:{right:18,bottom:18};
        const frameStyle=stuck?{position:'fixed',width:340,maxWidth:'46vw',aspectRatio:'16/9',zIndex:3000,borderRadius:12,overflow:'hidden',boxShadow:'0 14px 44px rgba(0,0,0,.5)',background:'#000',...pos}:{position:'relative',width:'100%',aspectRatio:'16/9',borderRadius:14,overflow:'hidden',background:'#000'};
        const iframe=React.createElement('iframe',{src,allow:'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',allowFullScreen:true,style:{width:'100%',height:'100%',border:0,display:'block'}});
        const closeBtn=stuck?React.createElement('button',{onClick:()=>this.setState({closed:true}),title:'Close',style:{position:'absolute',top:6,right:6,zIndex:5,width:26,height:26,borderRadius:'50%',border:'none',background:'rgba(0,0,0,.7)',color:'#fff',cursor:'pointer',font:'700 14px sans-serif'}},'✕'):null;
        return React.createElement('div',{ref:r=>this.ref=r,style:{position:'relative',width:'100%',aspectRatio:'16/9'}}, React.createElement('div',{style:frameStyle}, iframe, closeBtn)); }
    };
    this.Countdown = class extends React.Component {
      constructor(p){ super(p); this.state={now:Date.now()}; }
      target(){ const {mode,target,minutes,id}=this.props; if(mode==='evergreen'){ let st=0; try{ const k='aok_cd_'+id; st=parseInt(localStorage.getItem(k)||'0',10); if(!st){ st=Date.now(); localStorage.setItem(k,String(st)); } }catch(e){ st=Date.now(); } return st+(minutes||60)*60000; } const t=Date.parse(target); return isNaN(t)?(Date.now()+(minutes||60)*60000):t; }
      componentDidMount(){ this.t=setInterval(()=>this.setState({now:Date.now()}),1000); }
      componentWillUnmount(){ clearInterval(this.t); }
      render(){ const P=self.P; const diff=Math.max(0,this.target()-this.state.now); const s=Math.floor(diff/1000); const d=Math.floor(s/86400),hh=Math.floor(s%86400/3600),mm=Math.floor(s%3600/60),ss=s%60;
        const cell=(v,l)=>React.createElement('div',{key:l,style:{display:'flex',flexDirection:'column',alignItems:'center'}}, React.createElement('div',{style:{font:'800 34px '+self.HEAD,color:P.maroon,background:P.card,border:'1px solid '+P.line,borderRadius:12,padding:'12px 8px',minWidth:66}}, String(v).padStart(2,'0')), React.createElement('div',{style:{font:'600 11px '+self.HEAD,color:P.muted,marginTop:6,letterSpacing:'.08em',textTransform:'uppercase'}}, l));
        return React.createElement('div',{style:{display:'inline-flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}, cell(d,'Days'),cell(hh,'Hrs'),cell(mm,'Min'),cell(ss,'Sec')); }
    };
    this.PageNav = class extends React.Component {
      state={active:0};
      componentDidMount(){ this.onScroll=()=>{ const items=this.props.items||[]; let best=0,bestD=1e9; const mid=window.innerHeight/2; items.forEach((it,idx)=>{ const el=document.getElementById(it.id); if(!el)return; const r=el.getBoundingClientRect(); const dd=Math.abs(r.top+r.height/2-mid); if(dd<bestD){bestD=dd;best=idx;} }); if(best!==this.state.active) this.setState({active:best}); }; window.addEventListener('scroll',this.onScroll,{passive:true}); setTimeout(this.onScroll,200); }
      componentWillUnmount(){ window.removeEventListener('scroll',this.onScroll); }
      go(id){ const el=document.getElementById(id); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); }
      render(){ const {items=[],side='right'}=this.props; const P=self.P; if(!items.length) return null; const pos=side==='left'?{left:16}:{right:16};
        return React.createElement('div',{style:{position:'fixed',top:'50%',transform:'translateY(-50%)',zIndex:1400,display:'flex',flexDirection:'column',gap:12,...pos}}, ...items.map((it,idx)=>React.createElement('button',{key:idx,title:it.label,onClick:()=>this.go(it.id),style:{width:14,height:14,borderRadius:'50%',border:'2px solid '+P.maroon,background:idx===this.state.active?P.red:'rgba(255,255,255,.7)',cursor:'pointer',padding:0,boxShadow:'0 1px 4px rgba(0,0,0,.25)'}}))); }
    };
  }
  etext(path,opts={}){ const v=this.getIn(this.state.data,path); return React.createElement(this.EditableText,{key:path,html:v,tag:opts.tag||'div',style:opts.style,className:opts.className,editable:this.state.editMode,onCommit:h=>this.commit(path,h)}); }
  eimg(path,opts={}){ const v=this.getIn(this.state.data,path); const adj=(this.state.data.imgAdjust||{})[path]; return React.createElement(this.EditableImage,{key:path,src:v,alt:opts.alt||'',title:opts.title||'',style:opts.style,radius:opts.radius,placeholder:opts.placeholder,editable:this.state.editMode,adj:adj,onCommit:s=>this.commit(path,s),onAdjust:a=>this.commitAdj(path,a)}); }
  commitAdj(path,adj){ if(this.state.editMode||this.state.route==='admin'){ this.pushHist(); } const cur={...(this.state.data.imgAdjust||{})}; if(adj && (adj.x!==50||adj.y!==50||adj.scale!==1)) cur[path]=adj; else delete cur[path]; this.save({...this.state.data, imgAdjust:cur}); }

  // ---------- ui helpers ----------
  btn(label,onClick,opts={}){ const P=this.P; const v=opts.variant||'solid'; const base={font:'600 15px '+this.HEAD,padding:opts.pad||'14px 26px',borderRadius:999,cursor:'pointer',border:'1px solid transparent',transition:'transform .15s, box-shadow .15s',display:'inline-flex',alignItems:'center',gap:9,whiteSpace:'nowrap',...opts.style};
    const styles=this.btnVariants();
    return React.createElement('button',{onClick,style:{...base,...styles[v]},onMouseEnter:e=>e.currentTarget.style.transform='translateY(-2px)',onMouseLeave:e=>e.currentTarget.style.transform='none'},label); }
  btnVariants(){ const P=this.P; const goldShadow='0 1px 0 rgba(255,255,255,.55) inset,0 10px 24px -8px rgba(166,132,70,.55),0 2px 6px rgba(120,96,50,.18)';
    return { gold:{background:'linear-gradient(135deg,#DFC286 0%,#B8944F 100%)',color:P.maroon,boxShadow:goldShadow},
      solid:{background:'linear-gradient(135deg,#D9B977 0%,#A68446 100%)',color:P.maroon,boxShadow:goldShadow},
      outline:{background:'#FFFCF7',color:P.maroon,border:'1px solid #C5A869',boxShadow:'0 6px 16px -10px rgba(120,96,50,.35)'},
      ghost:{background:'rgba(255,255,255,.35)',color:P.maroon,border:'1px solid #C5A869'},
      dark:{background:P.maroon,color:P.cream,boxShadow:'0 10px 24px -10px rgba(20,21,23,.5)'} }; }
  // editable button (text / size / colour / link / target) used for the hero CTAs
  btnGo(c){ const link=(c&&c.link)||'contact'; if(/^https?:\/\//i.test(link)||/^mailto:|^tel:/i.test(link)){ if(c.newTab) window.open(link,'_blank','noopener'); else window.location.href=link; return; } const routes=['home','about','services','meditation','blog','contact','faq']; this.go(routes.indexOf(link)>-1?link:'contact'); }
  ebtn(path,def,xtra){ const h=React.createElement,P=this.P; const c={...(def||{}),...(this.getIn(this.state.data,path)||{})}; const label=c.label||'Button'; const variant=c.variant||'solid'; const size=c.size||'md';
    const vs=this.btnVariants();
    const pad=size==='lg'?'16px 32px':(size==='sm'?'10px 18px':'14px 26px'); const fs=size==='lg'?'17px':(size==='sm'?'13.5px':'15px'); const em=this.state.editMode;
    return h('button',{onClick:e=>{ e.stopPropagation(); if(em) this.setState({btnEdit:{path,def:def||{}}}); else this.btnGo(c); },className:'aok-btn aok-fx-lift',style:{position:'relative',font:'600 '+fs+' '+this.HEAD,padding:pad,borderRadius:999,cursor:'pointer',border:'1px solid transparent',display:'inline-flex',alignItems:'center',gap:9,whiteSpace:'nowrap',...vs[variant],...(xtra||{})}},
      label, em? h('span',{contentEditable:false,title:'Edit this button',style:{position:'absolute',top:-9,right:-9,width:22,height:22,borderRadius:'50%',background:P.maroonD,color:P.goldL,font:'11px '+this.HEAD,display:'flex',alignItems:'center',justifyContent:'center',border:'1px solid '+P.gold,zIndex:5}},'✎'):null); }
  renderBtnEditor(){ if(!this.state.btnEdit||!this.state.editMode) return null; const h=React.createElement,P=this.P; const be=this.state.btnEdit; const path=be.path; const def=be.def||{}; const c={...def,...(this.getIn(this.state.data,path)||{})};
    const set=(k,v)=>this.commit(path,{...c,[k]:v});
    const routes=[['home','Home'],['about','About Us'],['services','Services'],['meditation','Meditation'],['blog','Blog'],['faq','FAQ'],['contact','Contact']];
    const isUrl=/^https?:\/\//i.test(c.link||'')||(c.link!==undefined&&routes.findIndex(r=>r[0]===c.link)<0&&c.link!=='');
    const lbl=t=>h('div',{style:{font:'700 12px '+this.HEAD,color:P.maroon,letterSpacing:'.04em',textTransform:'uppercase',margin:'16px 0 7px'}},t);
    const seg=(opts,cur,fn)=>h('div',{style:{display:'flex',border:'1px solid '+P.line,borderRadius:9,overflow:'hidden'}}, ...opts.map(o=>h('button',{key:o[0],onClick:()=>fn(o[0]),style:{flex:1,padding:'9px 6px',border:'none',cursor:'pointer',background:cur===o[0]?P.maroon:P.white,color:cur===o[0]?P.cream:P.ink,font:'600 13px '+this.HEAD}},o[1])));
    return h('div',{style:{position:'fixed',inset:0,zIndex:2700,background:'rgba(28,10,6,.55)',display:'flex',alignItems:'center',justifyContent:'center',padding:24},onClick:()=>this.setState({btnEdit:null})},
      h('div',{onClick:e=>e.stopPropagation(),className:'aok-scroll',style:{background:P.bg,borderRadius:18,padding:'24px 26px',width:'100%',maxWidth:460,maxHeight:'88vh',overflowY:'auto',boxShadow:'0 30px 80px rgba(0,0,0,.45)'}},
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}, h('h2',{style:{font:'800 19px '+this.HEAD,color:P.maroon,margin:0}},'Edit button'), h('button',{onClick:()=>this.setState({btnEdit:null}),style:{border:'none',background:'transparent',cursor:'pointer',font:'600 20px '+this.HEAD,color:P.muted}},'✕')),
        lbl('Button text'), h('input',{value:c.label||'',onChange:e=>set('label',e.target.value),style:{width:'100%',padding:'11px 13px',borderRadius:10,border:'1px solid '+P.line,background:P.white,font:'400 15px Plus Jakarta Sans'}}),
        lbl('When clicked, go to'), h('select',{value:isUrl?'__url':(c.link||'contact'),onChange:e=>{ const v=e.target.value; if(v==='__url') set('link','https://'); else set('link',v); },style:{width:'100%',padding:'11px 13px',borderRadius:10,border:'1px solid '+P.line,background:P.white,font:'400 14.5px Plus Jakarta Sans',cursor:'pointer'}}, ...routes.map(r=>h('option',{key:r[0],value:r[0]},'Page: '+r[1])), h('option',{value:'__url'},'Custom link / website / phone…')),
        isUrl? h('div',null, lbl('Link address'), h('input',{value:c.link||'',placeholder:'https://…  or  mailto:you@email.com  or  tel:+1…',onChange:e=>set('link',e.target.value),style:{width:'100%',padding:'11px 13px',borderRadius:10,border:'1px solid '+P.line,background:P.white,font:'400 14px Plus Jakarta Sans'}}), h('label',{style:{display:'flex',gap:8,alignItems:'center',marginTop:10,font:'500 13.5px Plus Jakarta Sans',color:P.ink}}, h('input',{type:'checkbox',checked:!!c.newTab,onChange:e=>set('newTab',e.target.checked)}),'Open in a new tab')):null,
        lbl('Size'), seg([['sm','Small'],['md','Medium'],['lg','Large']], c.size||'md', v=>set('size',v)),
        lbl('Colour'), seg([['gold','Gold'],['solid','Deep gold'],['outline','Ivory'],['dark','Charcoal'],['ghost','Clear']], c.variant||'solid', v=>set('variant',v)),
        h('div',{style:{marginTop:20,display:'flex',justifyContent:'flex-end'}}, this.btn('Done',()=>this.setState({btnEdit:null}),{variant:'solid',pad:'10px 22px',style:{fontSize:14}})))); }
  mark(size){ const src=(this.state.data&&this.state.data.brand&&this.state.data.brand.logo)||'/assets/logo-192.webp'; return React.createElement('img',{src,alt:'Analysis of Karma logo',width:size,height:size,style:{width:size,height:size,objectFit:'contain',flexShrink:0,display:'block'}}); }
  kicker(text,color){ return React.createElement('div',{style:{display:'inline-flex',alignItems:'center',gap:12,font:'600 12.5px '+this.HEAD,letterSpacing:'.2em',textTransform:'uppercase',color:color||'#8A6A2E'}}, React.createElement('span',{style:{width:30,height:1,background:'linear-gradient(90deg,rgba(197,168,105,0),#B8944F)'}}), text); }

  // ---------- render root ----------
  renderVals(){ if(!this._ci){ this._ci=true; this.makeComp(); } const data=this.state.data||this.defaults(); if(!this.state.data){ this._needSave=true; } this._d=data; try{ return { app: this.renderApp() }; }catch(e){ return { app: React.createElement('pre',{style:{padding:24,color:'#b4452f',font:'13px monospace',whiteSpace:'pre-wrap'}}, 'RENDER ERROR: '+(e&&e.message)+'\n\n'+(e&&e.stack)) }; } }

  // the "scope" a block set belongs to: a page route, or an individual blog post
  scopeKey(){ if(this.state.route==='blog'&&this.state.postId) return 'post:'+this.state.postId; if(this.state.route==='service'&&this.state.serviceId) return 'service:'+this.state.serviceId; if(this.state.route==='page'&&this.state.pageId) return 'page:'+this.state.pageId; return this.state.route; }
  renderApp(){ const h=React.createElement,P=this.P;
    if(this.state.route==='admin') return this.renderAdmin();
    const em=this.state.editMode;
    if(em){ if(this._baseline==null) this._baseline=JSON.stringify(this.state.data); } else { this._baseline=null; }
    const site=h('div',{className:'aok-site',style:{minHeight:'100vh',background:P.bg,containerType:'inline-size',containerName:'site'}}, h('div',{className:'aok-sky','aria-hidden':'true'}), this.renderNav(), this.gapBlocks(this.scopeKey()+'::top'), this.renderPage(), this.renderBlocks(this.scopeKey()), this.renderFooter());
    if(!em) return h('div',null, site, this.renderToast());
    const dev=this.state.device||'desktop'; const W=dev==='mobile'?414:dev==='tablet'?834:null;
    const frame=W? h('div',{style:{maxWidth:W,margin:'0 auto',minHeight:'100vh',background:P.bg,boxShadow:'0 0 0 1px '+P.line+', 0 30px 80px rgba(0,0,0,.18)'}}, site) : site;
    return h('div',{style:{minHeight:'100vh',background:W?'#ECE6DA':P.bg,paddingTop:52}}, this.renderEditBar(), frame, this.renderBlockPanel(), this.renderBlockPicker(), this.renderColAdd(), this.renderBtnEditor(), this.renderToast()); }

  renderToast(){ if(!this.state.toast) return null; const P=this.P; return React.createElement('div',{style:{position:'fixed',bottom:26,left:'50%',transform:'translateX(-50%)',background:P.maroon,color:P.cream,padding:'13px 22px',borderRadius:12,font:'600 14px '+this.HEAD,zIndex:9999,boxShadow:'0 12px 40px rgba(0,0,0,.3)',animation:'aokfade .3s'}}, this.state.toast); }

  // ---------- nav ----------
  navActive(it){ if(it.type==='page') return this.state.route==='page'&&this.state.pageId===it.value; if(it.type==='route') return this.state.route===it.value&&!this.state.postId; return false; }
  navLink(it){ const v=it.value||''; if(it.type==='url') return {href:v,target:it.newTab?'_blank':undefined,rel:it.newTab?'noopener':undefined};
    const href=it.type==='page'?(()=>{ const pg=(this.state.data.pages||[]).find(p=>p.id===v); return pg&&pg.slug?'/'+encodeURIComponent(pg.slug):'/'; })():this.routeHref(v||'home');
    return this.linkTo(href,()=>this.navTo(it)); }
  navTo(it){ this.setState({menuOpen:false}); if(it.type==='url'){ const u=it.value||''; if(/^https?:|^mailto:|^tel:/i.test(u)){ window.open(u, it.newTab?'_blank':'_self'); } return; } if(it.type==='page'){ this.go('page',{pageId:it.value}); return; } this.go(it.value||'home'); }
  renderNav(){ const h=React.createElement,d=this.state.data; const top=(this.state.editMode?52:0)+14;
    const items=((d.nav&&d.nav.items)||[]);
    const linkEl=(it)=>{ const act=this.navActive(it); return h('a',{key:it.id,...this.navLink(it),className:'aok-navlink'+(act?' is-active':''),'aria-current':act?'page':undefined}, it.label||'Link'); };
    const langTog=()=>h('div',{className:'aok-lang'}, ['en','hi'].map(lg=>h('button',{key:lg,onClick:()=>this.setLang(lg),className:this.state.lang===lg?'is-on':''}, lg==='en'?'EN':'हि')));
    const mob=this.state.menuOpen;
    return h('header',{className:'notranslate aok-header',translate:'no',style:{top:top}},
      h('div',{className:'aok-pill'},
        h('a',{...this.linkTo('/',()=>this.go('home')),className:'aok-brand','aria-label':d.brand.name+' home'}, h('span',{className:'aok-brand-mark'},this.mark(46)),
          h('div',{style:{minWidth:0}}, h('div',{className:'aok-brand-name aok-goldtext'}, d.brand.name), h('div',{className:'aok-brand-sub'}, 'Vedic Astrology'))),
        h('nav',{className:'aok-desknav aok-navlinks','aria-label':'Main'}, ...items.map(linkEl)),
        h('div',{className:'aok-desknav aok-navright'}, langTog(), this.ebtn('nav.cta',{label:this.t('book'),link:'contact',variant:'solid',size:'sm'})),
        h('button',{className:'aok-burger','aria-label':'Menu','aria-expanded':mob?'true':'false',onClick:()=>this.setState({menuOpen:!mob})}, mob?'✕':'☰')),
      h('div',{className:'aok-mobnav'+(mob?' open':'')},
        h('div',{style:{display:'flex',flexDirection:'column'}}, ...items.map(it=>h('a',{key:it.id,...this.navLink(it),className:'aok-moblink'+(this.navActive(it)?' is-active':'')}, it.label||'Link'))),
        h('div',{style:{display:'flex',alignItems:'center',gap:14,marginTop:16}}, langTog(), this.ebtn('nav.cta',{label:this.t('book'),link:'contact',variant:'solid',size:'sm'},{flex:1,justifyContent:'center'}))));
  }

  // ---------- page switch ----------
  renderPage(){ switch(this.state.route){ case 'about':return this.renderAbout(); case 'services':return this.renderServices(); case 'blog':return this.state.postId?this.renderPost():this.renderBlog(); case 'meditation':return this.renderMeditation(); case 'contact':return this.renderContact(); case 'page':return this.renderCustomPage(); case 'faq':return this.renderFaq(); case 'service':return this.renderServiceDetail(); case 'notfound':return this.renderNotFound(); default:return this.renderHome(); } }
  renderCustomPage(){ const h=React.createElement,P=this.P,d=this.state.data; const pg=(d.pages||[]).find(p=>p.id===this.state.pageId);
    if(!pg) return this.renderNotFound();
    const showHero=pg.showTitle!==false;
    return h('main',{style:{animation:'aokfade .4s',minHeight:'46vh'}}, showHero? h('section',{className:'aok-pagehero'}, this.wrap(h('div',{style:{padding:'44px 0 48px',textAlign:'center'}}, this.etext('pages.'+(d.pages.indexOf(pg))+'.title',{tag:'h1',style:{font:'800 clamp(30px,4.2vw,52px) '+this.HEAD,margin:0,color:P.maroon,letterSpacing:'-.015em'}}))), h('div',{className:'aok-hairline'})):null); }

  renderNotFound(){ const h=React.createElement,P=this.P;
    return h('main',{style:{padding:'90px 24px',textAlign:'center'}}, h('h1',{style:{font:'800 28px '+this.HEAD,color:P.maroon}},'Page not found'), h('p',{style:{color:P.muted,marginTop:10}}, h('a',this.linkTo('/',()=>this.go('home'),{style:{color:P.red,cursor:'pointer'}}),'← Back home'))); }

  // ---------- FAQ page: the single home of the FAQ (and of the FAQPage structured data) ----------
  renderFaq(){ const h=React.createElement;
    return h('main',{style:{animation:'aokfade .4s'}}, this.pageHero('faqPage.hero','faq'), this.faqSection({noTitle:true,bg:'transparent'}), this.ctaBand('home.cta')); }

  // ---------- one page per service (/services/{slug}) — the service's own words, unchanged ----------
  // ----- topic clusters: blog posts <-> service pages (same rules as aok_cluster_* in api/seo-lib.php) -----
  clusterWords(t){ const key=String(t||''); const c=this._cw||(this._cw=new Map()); if(c.has(key)) return c.get(key); if(c.size>400) c.clear();
    const stop=this._cwStop||(this._cwStop=(()=>{ const o=Object.create(null); 'the and for your with what how its does doesn really means each best you are why from into this that can will when where which who not but all any our out more most just than them they their there here have has had was were been about also only very much many ultimate guide clear simple look step help helps know real truly without jargon vedic astrology astrological astrologer astrologers service services report reports'.split(' ').forEach(w=>{ o[w]=1; }); return o; })());
    const out=[]; this.txt(key).toLowerCase().replace(/&/g,' ').split(/[^a-z0-9]+/).forEach(w=>{ if(w.length>=3&&!stop[w]){ const k=w.slice(0,5); if(out.indexOf(k)<0) out.push(k); } }); c.set(key,out); return out; }
  clusterScore(post,svc){ const pw=Object.create(null), sw=Object.create(null);
    this.clusterWords((post.title||'')+' '+(post.focusKeyword||'')).forEach(k=>{ pw[k]=4; }); this.clusterWords(post.excerpt).forEach(k=>{ if(!pw[k]) pw[k]=2; }); this.clusterWords(post.body).forEach(k=>{ if(!pw[k]) pw[k]=1; });
    this.clusterWords(svc.title).forEach(k=>{ sw[k]=2; }); this.clusterWords(svc.desc).forEach(k=>{ if(!sw[k]) sw[k]=1; });
    let s=0; for(const k in pw) if(sw[k]) s+=pw[k]*sw[k]; return s; }
  // best matches (score >= 8) first, ties in list order; atLeast tops up with the next best, then the first items
  clusterPick(items,score,n,atLeast){ const sc=items.map((x,i)=>[score(x),i,x]).sort((a,b)=>(b[0]-a[0])||(a[1]-b[1])); const out=[], have={};
    sc.forEach(e=>{ if(e[0]>=8&&out.length<n){ out.push(e); have[e[1]]=1; } });
    sc.forEach(e=>{ if(out.length<(atLeast||0)&&e[0]>0&&!have[e[1]]){ out.push(e); have[e[1]]=1; } });
    items.forEach((x,i)=>{ if(out.length<(atLeast||0)&&!have[i]){ out.push([0,i,x]); have[i]=1; } });
    return out.map(e=>e[2]); }
  livePosts(){ return ((this.state.data&&this.state.data.blog)||[]).filter(p=>p.published&&p.slug&&!p.redirectTo); }
  relatedServices(post){ return this.clusterPick(this.liveServices(),s=>this.clusterScore(post,s),3,2); }
  relatedPosts(svc){ return this.clusterPick(this.livePosts(),p=>this.clusterScore(p,svc),3,0); }
  joinList(a){ a=(a||[]).map(x=>String(x).trim()).filter(Boolean); return a.length<2?a.join(''):a.slice(0,-1).join(', ')+' and '+a[a.length-1]; }
  linkBtn(label,href,fn,variant){ return React.createElement('a',this.linkTo(href,fn,{className:'aok-btn aok-fx-lift',style:{display:'inline-flex',alignItems:'center',gap:9,font:'600 14.5px '+this.HEAD,padding:'12px 22px',borderRadius:999,textDecoration:'none',whiteSpace:'nowrap',...this.btnVariants()[variant||'solid']}}),label); }
  locLabel(){ const L=this.state.data.local||{}; return (L.locality||'Surrey')+(L.regionCode?', '+L.regionCode:''); }

  // "Related consultations" under a blog post / "Articles on …" on a service page
  relatedServicesBlock(post){ const h=React.createElement,P=this.P; const rel=this.relatedServices(post); if(!rel.length) return null;
    return h('section',{'aria-labelledby':'related-services-h',style:{marginTop:44}},
      h('h2',{id:'related-services-h',style:{font:'600 30px/1.15 '+this.SERIF,color:P.maroon,margin:'0 0 18px'}},'Related consultations'),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat('+rel.length+',1fr)',gap:16}}, ...rel.map(s=>h('a',this.linkTo(this.serviceHref(s),()=>this.go('service',{serviceId:s.id}),{key:s.id,className:'aok-card aok-tilt',style:{display:'block',padding:'22px 22px 20px',textDecoration:'none'}}),
        h('div',{style:{marginBottom:12}},this.badge(s.icon)), h('div',{style:{font:'600 20px/1.2 '+this.SERIF,color:P.maroon,marginBottom:8}},s.title),
        h('div',{style:{font:'400 14px/1.6 Plus Jakarta Sans',color:P.ink,marginBottom:12}},this.cut(this.txt(s.desc),120)), h('span',{style:{font:'600 13px '+this.HEAD,color:'#8A6A2E'}},'Explore '+this.txt(s.title)+' →'))))); }
  relatedPostsBlock(svc){ const h=React.createElement,P=this.P; const rel=this.relatedPosts(svc); if(!rel.length) return null;
    return h('section',{'aria-labelledby':'related-posts-h',style:{padding:'0 0 64px'}}, this.wrap(h('div',null,
      h('h2',{id:'related-posts-h',style:{font:'600 clamp(26px,3vw,34px)/1.15 '+this.SERIF,color:P.maroon,margin:'0 0 20px'}},'Articles on '+this.txt(svc.title)),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:18}}, ...rel.map(p=>h('a',this.linkTo('/blog/'+encodeURIComponent(p.slug),()=>this.setState({route:'blog',postId:p.id,serviceId:null,menuOpen:false}),{key:p.id,className:'aok-card aok-tilt',style:{display:'block',padding:'22px 24px',textDecoration:'none'}}),
        h('div',{style:{font:'600 11.5px '+this.HEAD,letterSpacing:'.14em',textTransform:'uppercase',color:'#8A6A2E',marginBottom:10}},'Article'),
        h('div',{style:{font:'600 21px/1.22 '+this.SERIF,color:P.maroon,marginBottom:10}},p.title), h('div',{style:{font:'400 14px/1.6 Plus Jakarta Sans',color:P.ink}},this.cut(this.txt(p.excerpt),140)))))))); }

  // visible E-E-A-T card — the same facts as the Person in the structured data
  authorCard(){ const h=React.createElement,P=this.P,d=this.state.data,pe=d.person||{},L=d.local||{}; const name=pe.name||d.brand.astrologer;
    const studies=(pe.studies||[]).filter(Boolean), texts=(pe.classicalTexts||[]).filter(Boolean); const pr=(d.about&&d.about.pricing)||{};
    const chip=t=>h('span',{key:t,style:{display:'inline-block',padding:'5px 12px',borderRadius:999,background:'rgba(255,255,255,.7)',border:'1px solid rgba(166,132,70,.35)',font:'600 12px '+this.HEAD,color:P.maroon,margin:'0 6px 6px 0'}},t);
    return h('aside',{id:'about-the-astrologer','aria-labelledby':'about-the-astrologer-h',className:'aok-card',style:{marginTop:44,padding:'30px 32px',display:'grid',gridTemplateColumns:'86px 1fr',gap:24,alignItems:'start'}},
      h('div',{style:{width:86,height:86,borderRadius:'50%',padding:6,background:'linear-gradient(135deg,#F3E6C6,#C5A869)',boxShadow:'0 10px 24px -12px rgba(110,84,38,.6)'}}, h('div',{style:{width:'100%',height:'100%',borderRadius:'50%',overflow:'hidden',background:'#FFFCF7',display:'flex',alignItems:'center',justifyContent:'center'}}, pe.image?h('img',{src:pe.image,alt:name,loading:'lazy',width:74,height:74,style:{width:'100%',height:'100%',objectFit:'cover'}}):this.mark(62))),
      h('div',null,
        h('div',{style:{font:'600 11.5px '+this.HEAD,letterSpacing:'.2em',textTransform:'uppercase',color:'#8A6A2E',marginBottom:8}},'About the astrologer'),
        h('h2',{id:'about-the-astrologer-h',style:{font:'600 28px/1.15 '+this.SERIF,color:P.maroon,margin:'0 0 6px'}},'About the Astrologer — '+name),
        h('div',{style:{font:'500 14px Plus Jakarta Sans',color:P.muted,marginBottom:14}},(pe.jobTitle||'Vedic Astrologer')+' · '+this.locLabel()+' · Online worldwide'),
        studies.length?h('p',{style:{font:'400 15px/1.7 Plus Jakarta Sans',color:P.ink,margin:'0 0 10px'}},'Formal training in '+this.joinList(studies)+(pe.mentor?' under '+pe.mentor:'')+'.'):null,
        studies.length?h('div',{style:{margin:'0 0 8px'}},...studies.map(chip)):null,
        texts.length?h('p',{style:{font:'400 15px/1.7 Plus Jakarta Sans',color:P.ink,margin:'0 0 14px'}},'Classical research'+(pe.traditions?': '+pe.traditions+', through ':': ')+this.joinList(texts)+'.'):null,
        h('div',{style:{font:'600 13.5px '+this.HEAD,color:'#8A6A2E',margin:'0 0 18px'}},((pr.fee||'$100 CAD')+' '+(pr.unit||'per hour')).trim()+' · '+((L.onlineChannels||['Zoom','WhatsApp']).filter(Boolean).join(' & '))+' · New clients pay only if satisfied'),
        h('div',{style:{display:'flex',gap:10,flexWrap:'wrap'}}, this.linkBtn('Book a consultation →','/contact',()=>this.go('contact'),'solid'), this.linkBtn('More about '+name,'/about',()=>this.go('about'),'outline')))); }

  // "Service Areas & Online Consultations" (contact + service pages); the footer carries the short version
  areaItems(){ const d=this.state.data,L=d.local||{}; const out=[]; const near=(L.nearbyCities||[]).filter(Boolean), langs=(L.languages||[]).filter(Boolean);
    if(L.locality!=='') out.push(['⌖',this.locLabel()+' (home base)']);
    if(near.length) out.push(['◎',(L.nearbyLabel||'Greater Vancouver')+': '+this.joinList(near)]);
    if(L.region) out.push(['✦',L.region+' and across '+((L.country||'CA')==='CA'?'Canada':L.country)]);
    if(L.onlineWorldwide!==false) out.push(['☉','Worldwide online via '+(L.onlineChannels||['Zoom','WhatsApp']).filter(Boolean).join(' & ')+(langs.length?', in '+this.joinList(langs):'')]);
    return out; }
  areasIntro(){ const d=this.state.data,L=d.local||{},pe=d.person||{}; const near=(L.nearbyCities||[]).filter(Boolean);
    return 'Based in '+(L.locality||'Surrey')+', '+(L.region||'British Columbia')+', '+(pe.name||d.brand.astrologer)+' offers Vedic astrology consultations over '+this.joinList((L.onlineChannels||['Zoom','WhatsApp']).filter(Boolean))+' to clients across '+(near.length?(L.nearbyLabel||'Greater Vancouver')+', ':'')+(L.region||'British Columbia')+', Canada'+(L.onlineWorldwide!==false?' and worldwide.':'.'); }
  areasBlock(){ const h=React.createElement,P=this.P;
    return h('section',{id:'service-areas','aria-labelledby':'service-areas-h',style:{padding:'0 0 64px'}}, this.wrap(h('div',{className:'aok-card',style:{padding:'30px 32px',display:'grid',gridTemplateColumns:'1fr 1.2fr',gap:28,alignItems:'center'}},
      h('div',null, h('div',{style:{font:'600 11.5px '+this.HEAD,letterSpacing:'.2em',textTransform:'uppercase',color:'#8A6A2E',marginBottom:8}},'Where I consult'),
        h('h2',{id:'service-areas-h',style:{font:'600 clamp(26px,3vw,34px)/1.15 '+this.SERIF,color:P.maroon,margin:'0 0 12px'}},'Service Areas & Online Consultations'),
        h('p',{style:{font:'400 15px/1.7 Plus Jakarta Sans',color:P.ink,margin:'0 0 18px'}},this.areasIntro()),
        this.linkBtn('Book an online consultation →','/contact',()=>this.go('contact'),'outline')),
      h('ul',{style:{listStyle:'none',margin:0,padding:0,display:'grid',gap:10}}, ...this.areaItems().map((it,i)=>h('li',{key:i,style:{display:'flex',gap:12,alignItems:'center',padding:'12px 16px',borderRadius:14,background:'rgba(255,255,255,.6)',border:'1px solid rgba(166,132,70,.22)',font:'500 14.5px/1.5 Plus Jakarta Sans',color:P.ink}}, h('span',{'aria-hidden':'true',style:{color:'#A68446',fontSize:18,width:22,textAlign:'center',flexShrink:0}},it[0]), it[1])))))); }

  renderServiceDetail(){ const h=React.createElement,P=this.P,d=this.state.data; const s=(d.services||[]).find(x=>x.id===this.state.serviceId);
    if(!s) return this.renderNotFound();
    const others=(d.services||[]).filter(x=>x.id!==s.id&&!x.redirectTo).slice(0,3);
    const crumb=(label,href,fn)=>h('a',this.linkTo(href,fn,{style:{color:'#8A6A2E',cursor:'pointer'}}),label);
    return h('main',{style:{animation:'aokfade .4s'}},
      h('section',{className:'aok-pagehero'}, this.wrap(h('div',{style:{textAlign:'center',padding:'40px 0 50px',maxWidth:840,margin:'0 auto'}},
        h('nav',{'aria-label':'Breadcrumb',style:{font:'500 13px '+this.HEAD,color:P.muted,marginBottom:22}}, crumb('Home','/',()=>this.go('home')),' \u203a ',crumb('Services','/services',()=>this.go('services')),' \u203a ',h('span',null,s.title)),
        h('div',{style:{display:'flex',justifyContent:'center',marginBottom:20}}, this.badge(s.icon,'lg')),
        h('h1',{style:{font:'800 clamp(34px,4.6vw,56px) '+this.HEAD,margin:'0 0 18px',letterSpacing:'-.015em',color:P.maroon,lineHeight:1.06}}, this.twoToneText(s.title)),
        h('p',{style:{font:'400 18px/1.7 Plus Jakarta Sans',color:P.ink,maxWidth:680,margin:'0 auto'}}, s.desc))), h('div',{className:'aok-hairline'})),
      h('section',{style:{padding:'64px 0'}}, this.wrap(h('div',{style:{display:'grid',gridTemplateColumns:'1.3fr .7fr',gap:32,alignItems:'start'}},
        h('div',{className:'aok-card',style:{padding:'34px 36px'}}, s.detail? h('div',{style:{font:'400 16.5px/1.8 Plus Jakarta Sans',color:P.ink,whiteSpace:'pre-line'}}, s.detail) : h('p',{style:{font:'400 16.5px/1.8 Plus Jakarta Sans',color:P.ink,margin:0}}, s.desc)),
        h('div',{className:'aok-card',style:{padding:'30px 28px',textAlign:'center'}},
          h('div',{style:{font:'600 12px '+this.HEAD,letterSpacing:'.2em',textTransform:'uppercase',color:'#8A6A2E',marginBottom:12}},'Consultation fee'),
          h('div',{className:'aok-goldtext',style:{font:'600 44px/1 '+this.SERIF}}, s.price||((d.about&&d.about.pricing&&d.about.pricing.fee)||'$100 CAD')),
          h('div',{style:{font:'500 14px Plus Jakarta Sans',color:P.muted,margin:'8px 0 18px'}}, (d.about&&d.about.pricing&&d.about.pricing.unit)||'per hour'),
          h('div',{style:{marginBottom:20,padding:'9px 16px',borderRadius:999,background:'#FFFCF7',border:'1px solid #C5A869',font:'600 12.5px '+this.HEAD,color:P.maroon,display:'inline-block'}},'New clients: pay only if satisfied'),
          h('div',null, this.ebtn('servicesPage.cardBtn',{label:'Book this \u2192',link:'contact',variant:'outline',size:'sm'})))))),
      this.relatedPostsBlock(s),
      h('section',{style:{padding:'0 0 64px'}}, this.wrap(h('div',{style:{maxWidth:980,margin:'0 auto'}}, this.authorCard()))),
      this.areasBlock(),
      others.length? h('section',{style:{background:P.bgAlt,padding:'70px 0'}}, this.wrap(h('div',null,
        h('div',{style:{textAlign:'center',marginBottom:36}}, this.etext('home.servicesIntro.title',{tag:'h2',style:{font:'800 clamp(28px,3.3vw,40px) '+this.HEAD,color:P.maroon,margin:0,letterSpacing:'-.015em'}})),
        h('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:22}}, ...others.map((x,i)=>this.serviceCard(x,i))),
        h('div',{style:{textAlign:'center',marginTop:36}}, h('a',this.linkTo('/services',()=>this.go('services'),{className:'aok-btn',style:{display:'inline-flex',font:'600 15px '+this.HEAD,padding:'14px 26px',borderRadius:999,...this.btnVariants().outline}}),'See all services \u2192'))))):null,
      this.ctaBand('home.cta')); }
  twoToneText(t){ const h=React.createElement; const m=String(t||'').match(/^(.+?(?::| \u2014))\s+(\S.*)$/); return m? [h('span',{key:'a',className:'aok-tt-a'},m[1]),' ',h('span',{key:'b',className:'aok-tt-b'},m[2])] : t; }

  wrap(children,style){ return React.createElement('div',{style:{maxWidth:1200,margin:'0 auto',padding:'0 24px',...style}}, children); }

  // ---------- HOME ----------
  renderHome(){ const h=React.createElement,P=this.P,d=this.state.data; const em=this.state.editMode; const heroImg=this.getIn(d,'home.hero.image');
    return h('main',{style:{animation:'aokfade .4s'}},
      // hero: copy on the left, the Three.js silk + golden dial stage on the right (see the cosmos module at the end of the page)
      h('section',{className:'aok-hero'},
        h('div',{className:'aok-wrap aok-hero-grid'},
          h('div',{className:'aok-hero-copy'},
            this.kicker(this.etextInline('home.hero.kicker')),
            this.twoTone('home.hero.h1',{tag:'h1',block:true,style:{font:'800 clamp(40px,4.7vw,66px) '+this.HEAD,lineHeight:1.02,letterSpacing:'-.015em',margin:'22px 0 0',color:P.maroon}}),
            this.etext('home.hero.sub',{tag:'p',className:'aok-link',style:{font:'400 18px/1.65 Plus Jakarta Sans',color:P.ink,maxWidth:520,margin:'22px 0 34px'}}),
            h('div',{style:{display:'flex',gap:14,flexWrap:'wrap'}}, this.ebtn('home.hero.cta1'), this.ebtn('home.hero.cta2'))),
          h('div',{className:'aok-hero-stage'},
            h('div',{id:'aok-hero3d','aria-hidden':'true'}),
            h('div',{className:'aok-hero3d-fallback','aria-hidden':'true'}),
            (heroImg||em)? h('div',{className:'aok-locket'}, this.eimg('home.hero.image',{alt:d.seo.home.focusKeyword+' — Jag Mallah',placeholder:'astrologer\nportrait\n(replace in admin)',radius:'50%',style:{width:'100%',aspectRatio:'1/1'}})):null)),
        h('div',{className:'aok-wrap aok-hero-bento'}, ...this.liveServices().slice(0,3).map((s,i)=>this.heroChip(s,i)))),
      this.gapBlocks('home::s1'),
      // services overview
      h('section',{style:{padding:'84px 0'}}, this.wrap(h('div',null,
        h('div',{style:{textAlign:'center',maxWidth:660,margin:'0 auto 48px'}},
          h('div',{style:{display:'flex',justifyContent:'center'}},this.kicker(this.etextInline('home.servicesIntro.kicker'))),
          this.etext('home.servicesIntro.title',{tag:'h2',style:{font:'800 clamp(30px,3.6vw,44px) '+this.HEAD,color:P.maroon,margin:'16px 0 12px',letterSpacing:'-.015em'}}),
          this.etext('home.servicesIntro.sub',{tag:'p',style:{font:'400 17px/1.65 Plus Jakarta Sans',color:P.muted}})),
        h('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:22}}, ...this.liveServices().slice(0,6).map((s,i)=>this.serviceCard(s,i))),
        h('div',{style:{textAlign:'center',marginTop:44}}, this.ebtn('home.servicesIntro.btn',{label:'See all services →',link:'services',variant:'outline',size:'md'}))))),
      this.gapBlocks('home::s2'),
      // about preview
      h('section',{style:{background:P.bgAlt,padding:'84px 0'}}, this.wrap(h('div',{style:{display:'grid',gridTemplateColumns:'.9fr 1.1fr',gap:56,alignItems:'center'}},
        h('div',{className:'aok-card aok-reveal',style:{padding:10}}, this.eimg('home.about.image',{alt:'Experienced Vedic astrologer Jag Mallah',placeholder:'astrologer\nphoto',radius:14,style:{aspectRatio:'1/1'}})),
        h('div',null, this.kicker(this.etextInline('home.about.kicker')),
          this.etext('home.about.title',{tag:'h2',style:{font:'800 clamp(28px,3.3vw,40px) '+this.HEAD,color:P.maroon,margin:'16px 0 16px',letterSpacing:'-.015em'}}),
          this.etext('home.about.body',{tag:'p',className:'aok-link',style:{font:'400 16.5px/1.75 Plus Jakarta Sans',color:P.ink}}),
          h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 20px',margin:'26px 0 30px'}}, ...d.home.about.credentials.map((c,i)=>h('div',{key:i,style:{display:'flex',gap:10,alignItems:'flex-start',font:'500 15px Plus Jakarta Sans',color:P.maroon}},h('span',{style:{color:P.gold,fontSize:18,lineHeight:1}},'✧'),c))),
          this.ebtn('home.about.btn',{label:this.t('about'),link:'about',variant:'outline',size:'md'}))))),
      this.gapBlocks('home::s3'),
      // cta
      this.ctaBand('home.cta')
    ); }

  etextInline(path){ // returns editable inline span for kickers
    return React.createElement(this.EditableText,{key:path,html:this.getIn(this.state.data,path),tag:'span',editable:this.state.editMode,onCommit:h=>this.commit(path,h)}); }

  // Renders an editable heading in two tones (charcoal, then metallic gold) by splitting the existing
  // copy at its first ":" or " — ". The words, and so the heading's text for SEO, are unchanged;
  // in edit mode (or for rich HTML) it falls back to the plain editable field.
  twoTone(path,o){ const h=React.createElement; const v=this.getIn(this.state.data,path);
    if(this.state.editMode||typeof v!=='string'||v.indexOf('<')>-1) return this.etext(path,o);
    const ta=document.createElement('textarea'); ta.innerHTML=v; const txt=ta.value;
    const m=txt.match(/^(.+?(?::| —))\s+(\S.*)$/); if(!m) return this.etext(path,o);
    return h(o.tag||'div',{key:path,className:o.className,style:o.style}, h('span',{className:'aok-tt-a'+(o.block?' is-block':'')}, m[1]), ' ', h('span',{className:'aok-tt-b'+(o.block?' is-block':'')}, m[2])); }
  badge(icon,size,round){ return React.createElement('span',{className:'aok-badge3d'+(size?' is-'+size:'')+(round?' is-round':''),'aria-hidden':'true'}, React.createElement('span',null, icon||'☉')); }
  heroChip(s,i){ const h=React.createElement; const go=()=>this.go('service',{serviceId:s.id});
    return h('a',{key:s.id,className:'aok-card aok-tilt aok-chip',...this.linkTo(this.serviceHref(s),go)}, this.badge(s.icon,'lg'), h('span',{className:'aok-chip-t'}, s.title)); }
  serviceCard(s,i){ const h=React.createElement,P=this.P;
    return h('div',{key:s.id,className:'aok-card aok-tilt aok-reveal',onClick:()=>this.go('service',{serviceId:s.id}),style:{padding:'30px 28px',cursor:'pointer'}},
      this.badge(s.icon),
      h('h3',{style:{font:'700 21px '+this.HEAD,color:P.maroon,margin:'20px 0 8px'}}, h('a',this.linkTo(this.serviceHref(s),()=>this.go('service',{serviceId:s.id}),{style:{color:'inherit'}}), s.title)),
      h('p',{style:{font:'400 14.5px/1.65 Plus Jakarta Sans',color:P.muted,margin:0}}, s.desc)); }

  ctaBand(path){ const h=React.createElement,P=this.P;
    return h('section',{className:'aok-ctaband'},
      this.wrap(h('div',{className:'aok-card aok-reveal',style:{textAlign:'center',padding:'62px 28px 66px',overflow:'hidden'}},
        h('div',{className:'aok-cta-glow','aria-hidden':'true'}),
        h('div',{style:{display:'flex',justifyContent:'center',marginBottom:18,position:'relative'}},h('span',{className:'aok-brand-mark'},this.mark(62))),
        this.etext(path+'.title',{tag:'h2',style:{font:'800 clamp(30px,3.8vw,46px) '+this.HEAD,margin:'0 0 12px',letterSpacing:'-.015em',color:P.maroon,position:'relative'}}),
        this.etext(path+'.sub',{tag:'p',style:{font:'400 17px/1.65 Plus Jakarta Sans',color:P.ink,maxWidth:560,margin:'0 auto 30px',position:'relative'}}),
        h('div',{style:{position:'relative'}}, this.ebtn(path+'.btn',{label:this.getIn(this.state.data,path+'.button')||'Book a Consultation',link:'contact',variant:'gold',size:'md'})))) ); }

  // ---------- ABOUT ----------
  renderAbout(){ const h=React.createElement,P=this.P,d=this.state.data; const em=this.state.editMode;
    return h('main',{style:{animation:'aokfade .4s'}},
      this.pageHero('about.hero','about'),
      h('section',{style:{padding:'76px 0'}}, this.wrap(h('div',null,
        this.etext('about.story.title',{tag:'h2',style:{font:'800 clamp(28px,3.3vw,40px) '+this.HEAD,color:P.maroon,margin:'0 0 20px',letterSpacing:'-.015em'}}),
        h('div',{className:'aok-floatimg aok-card',style:{float:'right',width:220,marginLeft:32,marginBottom:16,padding:8}}, this.eimg('about.story.image',{alt:'Experienced Vedic astrologer Jag Mallah reading a Kundli',placeholder:'astrologer\nat work',radius:14,style:{aspectRatio:'3/4'}})),
        this.etext('about.story.body',{tag:'div',className:'aok-link',style:{font:'400 16.5px/1.8 Plus Jakarta Sans',color:P.ink,whiteSpace:'pre-line'}}),
        h('div',{style:{clear:'both'}})))),
      h('section',{style:{background:P.bgAlt,padding:'72px 0'}}, this.wrap(h('div',null,
        h('div',{style:{display:'flex',justifyContent:'center',marginBottom:38}},this.kicker('Why people trust the work')),
        h('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:22}}, ...d.about.values.map((v,i)=>h('div',{key:i,className:'aok-card aok-tilt aok-reveal',style:{padding:30}},
          this.badge(['☉','⚚','☯'][i]||'✧'),
          this.etext('about.values.'+i+'.t',{tag:'h3',style:{font:'700 19px '+this.HEAD,color:P.maroon,margin:'18px 0 8px'}}),
          this.etext('about.values.'+i+'.d',{tag:'p',style:{font:'400 14.5px/1.65 Plus Jakarta Sans',color:P.muted,margin:0}}))))))),
      h('section',{style:{padding:'78px 0'}}, this.wrap(h('blockquote',{style:{maxWidth:820,margin:'0 auto',textAlign:'center'}},
        h('div',{className:'aok-goldtext',style:{font:'500 64px/1 '+this.SERIF,marginBottom:4}},'“'),
        this.etext('about.quote',{tag:'p',style:{font:'500 italic clamp(26px,3.2vw,36px)/1.4 '+this.SERIF,color:P.maroon,letterSpacing:'-.005em',margin:0}}),
        h('div',{style:{marginTop:22,font:'600 13px '+this.HEAD,letterSpacing:'.2em',textTransform:'uppercase',color:'#8A6A2E'}},'— '+d.brand.astrologer)))),
      h('section',{style:{background:P.bgAlt,padding:'84px 0',position:'relative',overflow:'hidden'}},
        this.wrap(h('div',{style:{position:'relative',display:'grid',gridTemplateColumns:'1fr 1fr',gap:56,alignItems:'center'}},
          h('div',null,
            h('div',{style:{marginBottom:18}},this.kicker(this.getIn(d,'about.privacy.kicker')||'')),
            h('div',{style:{display:'flex',alignItems:'center',gap:16,marginBottom:20}},
              this.badge('⚭',null,true),
              this.etext('about.privacy.title',{tag:'h2',style:{font:'800 clamp(28px,3.3vw,40px) '+this.HEAD,color:P.maroon,margin:0,letterSpacing:'-.015em'}})),
            this.etext('about.privacy.body',{tag:'div',style:{font:'400 16.5px/1.8 Plus Jakarta Sans',color:P.ink,whiteSpace:'pre-line',maxWidth:520}})),
          h('div',{style:{display:'grid',gap:16}}, ...((d.about.privacy&&d.about.privacy.points)||[]).map((pt,i)=>h('div',{key:i,className:'aok-card aok-tilt aok-reveal',style:{padding:'22px 24px',display:'flex',gap:18,alignItems:'flex-start'}},
            this.badge('✓','sm'),
            h('div',null,
              this.etext('about.privacy.points.'+i+'.t',{tag:'h3',style:{font:'700 18px '+this.HEAD,color:P.maroon,margin:'2px 0 5px'}}),
              this.etext('about.privacy.points.'+i+'.d',{tag:'p',style:{font:'400 14.5px/1.65 Plus Jakarta Sans',color:P.muted,margin:0}})))))))),
      h('section',{style:{padding:'84px 0'}}, this.wrap(
        h('div',{style:{display:'grid',gridTemplateColumns:'.82fr 1.18fr',gap:52,alignItems:'center'}},
          h('div',{className:'aok-card aok-reveal',style:{padding:'46px 34px',textAlign:'center'}},
            h('div',{style:{font:'600 12px '+this.HEAD,letterSpacing:'.2em',textTransform:'uppercase',color:'#8A6A2E',marginBottom:16}},'Consultation fee'),
            this.etext('about.pricing.fee',{tag:'div',className:em?'':'aok-goldtext',style:{font:'600 clamp(48px,6.4vw,72px)/1 '+this.SERIF,letterSpacing:'-.01em',color:P.maroon}}),
            this.etext('about.pricing.unit',{tag:'div',style:{font:'500 16px Plus Jakarta Sans',color:P.muted,marginTop:10}}),
            h('div',{style:{marginTop:26,padding:'11px 20px',borderRadius:999,background:'#FFFCF7',border:'1px solid #C5A869',font:'600 13px '+this.HEAD,color:P.maroon,display:'inline-block'}},'New clients: pay only if satisfied')),
          h('div',null,
            h('div',{style:{marginBottom:14}},this.kicker(this.getIn(d,'about.pricing.kicker')||'')),
            this.etext('about.pricing.title',{tag:'h2',style:{font:'800 clamp(28px,3.3vw,40px) '+this.HEAD,color:P.maroon,margin:'0 0 16px',letterSpacing:'-.015em'}}),
            this.etext('about.pricing.body',{tag:'div',style:{font:'400 16.5px/1.8 Plus Jakarta Sans',color:P.ink,whiteSpace:'pre-line'}}))))),
      h('section',{style:{background:P.bgAlt,padding:'80px 0'}}, this.wrap(h('div',null,
        h('div',{style:{textAlign:'center',maxWidth:700,margin:'0 auto 40px'}},
          h('div',{style:{display:'flex',justifyContent:'center',marginBottom:16}},this.kicker(this.getIn(d,'about.boundaries.kicker')||'')),
          this.etext('about.boundaries.title',{tag:'h2',style:{font:'800 clamp(28px,3.3vw,40px) '+this.HEAD,color:P.maroon,margin:'0 0 12px',letterSpacing:'-.015em'}}),
          this.etext('about.boundaries.intro',{tag:'p',style:{font:'400 16.5px/1.7 Plus Jakarta Sans',color:P.muted,margin:0}})),
        h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}},
          h('div',{className:'aok-card aok-reveal',style:{padding:'32px 32px'}},
            h('h3',{style:{font:'700 19px '+this.HEAD,color:P.maroon,margin:'0 0 20px',display:'flex',alignItems:'center',gap:12}},h('span',{style:{color:P.ok}},'✓'),'What I can do'),
            h('div',{style:{display:'grid',gap:14}}, ...d.about.boundaries.can.map((x,i)=>h('div',{key:i,style:{display:'flex',gap:12,alignItems:'flex-start'}},
              h('span',{style:{color:P.ok,font:'700 15px '+this.HEAD,flex:'0 0 auto',marginTop:1}},'✓'),
              this.etext('about.boundaries.can.'+i,{tag:'p',style:{font:'400 15px/1.65 Plus Jakarta Sans',color:P.ink,margin:0}}))))),
          h('div',{className:'aok-card aok-reveal',style:{padding:'32px 32px'}},
            h('h3',{style:{font:'700 19px '+this.HEAD,color:P.maroon,margin:'0 0 20px',display:'flex',alignItems:'center',gap:12}},h('span',{style:{color:P.bad}},'✕'),'What I cannot do'),
            h('div',{style:{display:'grid',gap:14}}, ...d.about.boundaries.cannot.map((x,i)=>h('div',{key:i,style:{display:'flex',gap:12,alignItems:'flex-start'}},
              h('span',{style:{color:P.bad,font:'700 15px '+this.HEAD,flex:'0 0 auto',marginTop:1}},'✕'),
              this.etext('about.boundaries.cannot.'+i,{tag:'p',style:{font:'400 15px/1.65 Plus Jakarta Sans',color:P.ink,margin:0}})))))))),
      h('section',{style:{padding:'80px 0'}}, this.wrap(h('div',null,
        h('div',{style:{textAlign:'center',maxWidth:660,margin:'0 auto 42px'}},
          h('div',{style:{display:'flex',justifyContent:'center',marginBottom:16}},this.kicker(this.getIn(d,'about.process.kicker')||'')),
          this.etext('about.process.title',{tag:'h2',style:{font:'800 clamp(28px,3.3vw,40px) '+this.HEAD,color:P.maroon,margin:'0 0 12px',letterSpacing:'-.015em'}}),
          this.etext('about.process.sub',{tag:'p',style:{font:'400 16.5px/1.7 Plus Jakarta Sans',color:P.muted,margin:0}})),
        h('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:20}}, ...d.about.process.steps.map((st,i)=>h('div',{key:i,className:'aok-card aok-tilt aok-reveal',style:{padding:'30px 26px'}},
          h('span',{className:'aok-badge3d is-sm is-round',style:{font:'600 21px/1 '+this.SERIF,color:P.maroon}}, h('span',null,String(i+1))),
          this.etext('about.process.steps.'+i+'.t',{tag:'h3',style:{font:'700 18px '+this.HEAD,color:P.maroon,margin:'18px 0 7px'}}),
          this.etext('about.process.steps.'+i+'.d',{tag:'p',style:{font:'400 14px/1.65 Plus Jakarta Sans',color:P.muted,margin:0}})))))))),
      this.faqSection(),
      this.ctaBand('home.cta')); }

  pageHero(path,route){ const h=React.createElement,P=this.P,d=this.state.data;
    return h('section',{className:'aok-pagehero'},
      this.wrap(h('div',{style:{textAlign:'center',padding:'48px 0 56px',position:'relative',maxWidth:840,margin:'0 auto'}},
        h('div',{style:{display:'flex',justifyContent:'center',marginBottom:20}},this.kicker((d.seo[route]&&d.seo[route].focusKeyword)||'')),
        this.twoTone(path+'.title',{tag:'h1',style:{font:'800 clamp(34px,4.6vw,58px) '+this.HEAD,margin:'0 0 18px',letterSpacing:'-.015em',color:P.maroon,lineHeight:1.06}}),
        this.etext(path+'.sub',{tag:'p',style:{font:'400 18px/1.7 Plus Jakarta Sans',color:P.ink,maxWidth:680,margin:'0 auto'}}))),
      h('div',{className:'aok-hairline'})); }

  // ---------- SERVICES ----------
  renderServices(){ const h=React.createElement,P=this.P,d=this.state.data;
    return h('main',{style:{animation:'aokfade .4s'}}, this.pageHero('servicesPage.hero','services'),
      h('section',{style:{padding:'70px 0'}}, this.wrap(h('div',{style:{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:24}}, ...this.liveServices().map((s,i)=>h('div',{key:s.id,className:'aok-card aok-tilt aok-reveal',style:{display:'flex',gap:22,padding:30}},
        this.badge(s.icon,'lg'),
        h('div',{style:{minWidth:0}}, h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:12,flexWrap:'wrap'}},
            h('h3',{style:{font:'700 21px '+this.HEAD,color:P.maroon,margin:'2px 0 0'}}, h('a',this.linkTo(this.serviceHref(s),()=>this.go('service',{serviceId:s.id}),{style:{color:'inherit'}}), s.title))),
          h('p',{style:{font:'400 15px/1.7 Plus Jakarta Sans',color:P.muted,margin:'10px 0 14px'}}, s.desc),
          (s.detail&&(this._svcOpen||{})[s.id])? h('p',{style:{font:'400 14.5px/1.75 Plus Jakarta Sans',color:P.ink,margin:'0 0 14px',whiteSpace:'pre-line'}}, s.detail):null,
          s.detail? h('button',{onClick:()=>{ const o=this._svcOpen||(this._svcOpen={}); o[s.id]=!o[s.id]; this.forceUpdate(); },style:{display:'block',background:'none',border:'none',color:'#8A6A2E',font:'700 14px '+this.HEAD,cursor:'pointer',padding:'0 0 14px'}}, ((this._svcOpen||{})[s.id])?'Read less ↑':'Read more ↓'):null,
          this.ebtn('servicesPage.cardBtn',{label:'Book this →',link:'contact',variant:'outline',size:'sm'}))))))),
      this.ctaBand('home.cta')); }

  // ---------- MEDITATION ----------
  renderMeditation(){ const h=React.createElement,P=this.P,d=this.state.data; const m=d.meditation||{hero:{},intro:{},offerings:[]}; const em=this.state.editMode;
    return h('main',{style:{animation:'aokfade .4s'}},
      this.pageHero('meditation.hero','meditation'),
      h('section',{style:{padding:'76px 0'}}, this.wrap(h('div',null,
        this.kicker('Meditation guidance'),
        this.etext('meditation.intro.title',{tag:'h2',style:{font:'800 clamp(28px,3.3vw,40px) '+this.HEAD,color:P.maroon,margin:'16px 0 18px',letterSpacing:'-.015em'}}),
        h('div',{className:'aok-floatimg aok-card',style:{float:'right',width:300,marginLeft:32,marginBottom:16,padding:8}}, this.eimg('meditation.image',{alt:'Professional meditation guide Jag Mallah',placeholder:'meditation\nphoto',radius:14,style:{aspectRatio:'3/4'}})),
        this.etext('meditation.intro.body',{tag:'div',className:'aok-link',style:{font:'400 16.5px/1.8 Plus Jakarta Sans',color:P.ink,whiteSpace:'pre-line'}}),
        h('div',{style:{clear:'both'}})))),
      h('section',{style:{background:P.bgAlt,padding:'72px 0'}}, this.wrap(h('div',null,
        h('div',{style:{display:'flex',justifyContent:'center',marginBottom:38}},this.kicker('What we practise')),
        h('div',{style:{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:22}}, ...((m.offerings)||[]).map((o,i)=>h('div',{key:i,className:'aok-card aok-tilt aok-reveal',style:{padding:28,display:'flex',gap:18}},
          this.badge(['☯','✨','☉','⚚','ॐ','☸','✴','❁'][i]||'✧'),
          h('div',{style:{flex:1}},
            this.etext('meditation.offerings.'+i+'.t',{tag:'h3',style:{font:'700 19px '+this.HEAD,color:P.maroon,margin:'4px 0 6px'}}),
            this.etext('meditation.offerings.'+i+'.d',{tag:'p',style:{font:'400 14.5px/1.65 Plus Jakarta Sans',color:P.muted,margin:0}}),
            em? h('div',{style:{display:'flex',gap:6,marginTop:12}},
                  h('button',{title:'Move up',onClick:()=>this.offeringMove(i,-1),style:{...this.iconBtn(),width:30,height:30,fontSize:13}},'↑'),
                  h('button',{title:'Move down',onClick:()=>this.offeringMove(i,1),style:{...this.iconBtn(),width:30,height:30,fontSize:13}},'↓'),
                  h('button',{title:'Remove this item',onClick:()=>this.offeringDel(i),style:{...this.iconBtn(true),width:'auto',height:30,padding:'0 12px',fontSize:12.5}},'✕ Remove')):null)))),
        em? h('div',{style:{textAlign:'center',marginTop:22}}, this.btn('＋ Add practice',()=>this.offeringAdd(),{variant:'gold',pad:'11px 20px',style:{fontSize:14}})):null))),
      this.ctaBand('home.cta')); }

  // ---------- BLOG ----------
  renderBlog(){ const h=React.createElement,P=this.P,d=this.state.data; const posts=d.blog.filter(p=>(p.published&&!p.redirectTo)||this.state.editMode);
    const ph='linear-gradient(135deg,#FFFFFF 0%,#F4EEE3 55%,#E9DCC2 100%)';
    return h('main',{style:{animation:'aokfade .4s'}}, this.pageHero('blogPage.hero','blog'),
      h('section',{style:{padding:'70px 0'}}, this.wrap(posts.length? h('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24}}, ...posts.map(p=>h('article',{key:p.id,onClick:()=>this.setState({postId:p.id,menuOpen:false}),className:'aok-card aok-tilt aok-reveal',style:{overflow:'hidden',cursor:'pointer',display:'flex',flexDirection:'column'}},
        h('div',{style:{aspectRatio:'16/10',margin:8,borderRadius:14,overflow:'hidden',background:p.image?'transparent':ph}}, p.image?h('img',{loading:'lazy',decoding:'async',src:p.image,alt:p.focusKeyword||p.title,style:{width:'100%',height:'100%',objectFit:'cover',display:'block'}}):h('div',{style:{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#A68446',fontFamily:'monospace',fontSize:12}},'blog image')),
        h('div',{style:{padding:'14px 24px 26px',flex:1,display:'flex',flexDirection:'column'}},
          h('div',{style:{font:'600 12px '+this.HEAD,letterSpacing:'.12em',textTransform:'uppercase',color:'#8A6A2E',marginBottom:10}}, this.fmtDate(p.date)+(p.published?'':' · DRAFT')),
          h('h3',{style:{font:'700 19px/1.3 '+this.HEAD,color:P.maroon,margin:'0 0 10px'}}, h('a',this.linkTo('/blog/'+encodeURIComponent(p.slug||''),()=>this.setState({postId:p.id,menuOpen:false}),{style:{color:'inherit'}}), p.title)),
          h('p',{style:{font:'400 14.5px/1.65 Plus Jakarta Sans',color:P.muted,margin:'0 0 16px',flex:1}}, p.excerpt),
          h('span',{style:{font:'700 14px '+this.HEAD,color:'#8A6A2E'}}, this.t('readmore')+' →')))))
        : h('div',{style:{textAlign:'center',padding:'40px',color:P.muted,font:'400 16px Plus Jakarta Sans'}},'No posts yet. Add one from the admin panel → Blog.')))); }

  renderPost(){ const h=React.createElement,P=this.P,d=this.state.data; const p=d.blog.find(x=>x.id===this.state.postId); if(!p) return this.renderBlog();
    return h('main',{style:{animation:'aokfade .4s'}},
      h('section',{className:'aok-pagehero'}, this.wrap(h('div',{style:{maxWidth:780,margin:'0 auto',padding:'44px 0 50px'}},
        h('a',this.linkTo('/blog',()=>this.setState({postId:null}),{style:{cursor:'pointer',font:'600 14px '+this.HEAD,color:'#8A6A2E'}}),'← '+this.t('blog')),
        h('div',{style:{font:'600 12px '+this.HEAD,letterSpacing:'.14em',textTransform:'uppercase',color:'#8A6A2E',margin:'24px 0 14px'}}, this.fmtDate(p.date),' \u00b7 By ',h('a',{href:'#about-the-astrologer',style:{color:'#8A6A2E'}},(d.person&&d.person.name)||d.brand.astrologer)),
        h('h1',{style:{font:'800 clamp(30px,3.9vw,48px)/1.1 '+this.HEAD,color:P.maroon,margin:0,letterSpacing:'-.015em'}}, p.title))), h('div',{className:'aok-hairline'})),
      h('section',{style:{padding:'52px 0 70px'}}, this.wrap(h('div',{style:{maxWidth:780,margin:'0 auto'}},
        h('div',{className:'aok-card',style:{padding:8,marginBottom:36}}, h('div',{style:{aspectRatio:'16/8',borderRadius:14,overflow:'hidden',background:p.image?'transparent':'linear-gradient(135deg,#FFFFFF 0%,#F4EEE3 55%,#E9DCC2 100%)'}}, p.image?h('img',{loading:'lazy',decoding:'async',src:p.image,alt:p.focusKeyword||p.title,style:{width:'100%',height:'100%',objectFit:'cover'}}):h('div',{style:{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#A68446',fontFamily:'monospace',fontSize:12}},'featured image — alt: '+(p.focusKeyword||'')))),
        h('div',{style:{font:'400 18px/1.85 Plus Jakarta Sans',color:P.ink,whiteSpace:'pre-line'}}, p.body),
        this.authorCard(), this.relatedServicesBlock(p)))),
      this.ctaBand('home.cta')); }

  fmtDate(s){ try{ return new Date(s).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}); }catch(e){ return s; } }

  // ---------- CONTACT ----------
  renderContact(){ const h=React.createElement,P=this.P,d=this.state.data; const c=d.contact;
    const mq=c.mapQuery||c.address; const mapEmbed=(c.mapEmbed||'').trim(); const raw=(c.mapUrl||'').trim();
    const isEmbedUrl=u=>/output=embed|\/maps\/embed/i.test(u||''); const isShort=/(share\.google|goo\.gl|maps\.app\.goo\.gl|g\.co\/)/i.test(raw); const looksUrl=/^https?:\/\//i.test(raw);
    const coord=raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)||raw.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    let mapSrc=null;
    if(raw){ if(isEmbedUrl(raw)) mapSrc=raw; else if(coord) mapSrc='https://maps.google.com/maps?q='+coord[1]+','+coord[2]+'&z=15&ie=UTF8&iwloc=&output=embed'; else if(isShort||looksUrl) mapSrc=null; else mapSrc='https://maps.google.com/maps?q='+encodeURIComponent(raw)+'&t=&z=14&ie=UTF8&iwloc=&output=embed'; }
    else if(mq){ mapSrc='https://maps.google.com/maps?q='+encodeURIComponent(mq)+'&t=&z=14&ie=UTF8&iwloc=&output=embed'; }
    const mapLink=(looksUrl?raw:'')||c.gmb||(raw?('https://maps.google.com/maps?q='+encodeURIComponent(raw)):'');
    const rows=[c.phone&&['Phone',c.phone,'tel:'+c.phone],c.whatsapp&&['WhatsApp',c.whatsapp,'https://wa.me/'+c.whatsapp.replace(/\D/g,'')],c.address&&['Visit',c.address,null]].filter(Boolean);
    const pearl='radial-gradient(120% 90% at 30% 10%,#FFFFFF 0%,#F7F1E6 55%,#EADDC3 100%)';
    return h('main',{style:{animation:'aokfade .4s'}}, this.pageHero('contactPage','contact'),
      h('section',{style:{padding:'64px 0'}}, this.wrap(h('div',{style:{display:'grid',gridTemplateColumns:'1.1fr .9fr',gap:40,alignItems:'start'}},
        this.renderLeadForm(),
        h('div',null,
          h('div',{className:'aok-card',style:{padding:'24px 26px',marginBottom:22}},
            h('div',{style:{font:'600 12px '+this.HEAD,letterSpacing:'.2em',textTransform:'uppercase',color:'#8A6A2E',marginBottom:10}},'Consultation fee'),
            h('div',{style:{display:'flex',alignItems:'baseline',gap:12,flexWrap:'wrap'}}, h('div',{className:'aok-goldtext',style:{font:'600 44px/1 '+this.SERIF,letterSpacing:'-.01em'}}, (d.about&&d.about.pricing&&d.about.pricing.fee)||'$100 CAD'), h('div',{style:{font:'500 14px Plus Jakarta Sans',color:P.muted}}, (d.about&&d.about.pricing&&d.about.pricing.unit)||'per hour'))),
          h('div',{className:'aok-card',style:{padding:30,marginBottom:22}},
            h('h3',{style:{font:'700 20px '+this.HEAD,color:P.maroon,margin:'0 0 16px'}}, this.t('getintouch')),
            rows.length? rows.map((r,i)=>h('div',{key:i,style:{display:'flex',gap:12,padding:'11px 0',borderBottom:i<rows.length-1?'1px solid '+P.line:'none'}},
              h('span',{style:{font:'600 12px '+this.HEAD,letterSpacing:'.1em',textTransform:'uppercase',color:'#8A6A2E',width:78,flexShrink:0,paddingTop:2}},r[0]),
              r[2]?h('a',{href:r[2],target:'_blank',style:{font:'500 15px Plus Jakarta Sans',color:P.ink,wordBreak:'break-word'}},r[1]):h('span',{style:{font:'500 15px Plus Jakarta Sans',color:P.ink}},r[1])))
              : h('p',{style:{font:'400 14.5px/1.65 Plus Jakarta Sans',color:P.muted,margin:0}},'Please use the form to reach Jag Mallah — he replies personally to every message.'),
            h('div',{style:{display:'flex',gap:10,marginTop:20,flexWrap:'wrap'}}, ...this.socialLinks().map((s,i)=>h('a',{key:i,href:s[1],target:'_blank',rel:'noopener',title:s[0],'aria-label':s[0],className:'aok-badge3d is-sm',style:{textTransform:'capitalize',font:'600 17px/1 Plus Jakarta Sans'}},h('span',null,s[2]))))),
          h('div',{className:'aok-card',style:{padding:8}}, h('div',{style:{position:'relative',borderRadius:14,overflow:'hidden',aspectRatio:'1/1',background:P.bgAlt}}, this.state.editMode? h('div',{onClick:()=>this.setState({mapEdit:true}),style:{position:'absolute',inset:0,zIndex:20,cursor:'pointer',background:'rgba(30,32,34,.08)',display:'flex',alignItems:'flex-start',justifyContent:'flex-end',padding:10}}, h('span',{style:{padding:'8px 14px',borderRadius:999,background:P.maroon,color:P.cream,font:'600 13px '+this.HEAD,boxShadow:'0 4px 14px rgba(0,0,0,.25)'}},'✎ Edit map')):null, mapEmbed? h('div',{className:'aok-mapembed',style:{width:'100%',height:'100%'},dangerouslySetInnerHTML:{__html:mapEmbed}}) : mapSrc? h('iframe',{src:mapSrc,style:{width:'100%',height:'100%',border:0},loading:'lazy',title:'Business location map'}) : (mapLink? h('a',{href:mapLink,target:'_blank',rel:'noopener',style:{height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:28,gap:14,cursor:'pointer',textDecoration:'none',background:pearl,position:'relative',overflow:'hidden'}}, h('div',{style:{position:'absolute',inset:0,background:'var(--starmap) center/420px 420px no-repeat',opacity:.9}}), h('div',{className:'aok-badge3d is-lg is-round',style:{position:'relative'}},h('span',null,'⚑')), h('div',{style:{font:'600 24px/1.2 '+this.SERIF,color:P.maroon,position:'relative'}},'Find us on Google Maps'), h('div',{style:{font:'400 14px/1.6 Plus Jakarta Sans',color:P.ink,maxWidth:260,position:'relative'}},'Serving Surrey & the Greater Vancouver area, and worldwide online. Tap to view our business profile and directions.'), h('div',{style:{marginTop:4,padding:'10px 20px',borderRadius:999,background:'#FFFCF7',border:'1px solid #C5A869',font:'600 13px '+this.HEAD,color:P.maroon,position:'relative'}},'Open in Google Maps →')) : h('div',{style:{height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',color:P.muted,textAlign:'center',padding:24,gap:8,background:pearl}}, h('div',{style:{fontSize:34,color:P.gold}},'⚑'), h('div',{style:{font:'600 15px '+this.HEAD,color:P.maroon}},'Add your Google Map'), h('div',{style:{font:'400 13px Plus Jakarta Sans',maxWidth:240}},'Set your business address or map query in Admin → Settings to show a live Google Map here.'))))))))),
      this.areasBlock(), this.faqSection({hideAsk:true}), this.renderMapEditor()); }

  renderMapEditor(){ if(!this.state.mapEdit) return null; const h=React.createElement,P=this.P; const c=this.state.data.contact;
    const fieldLabel=(n,t)=>h('div',{style:{font:'700 13px '+this.HEAD,color:P.maroon,margin:'0 0 7px',display:'flex',alignItems:'center'}}, h('span',{style:{display:'inline-flex',width:22,height:22,borderRadius:6,background:P.gold,color:P.maroonD,alignItems:'center',justifyContent:'center',font:'700 12px '+this.HEAD,marginRight:9}},n), t);
    return h('div',{style:{position:'fixed',inset:0,zIndex:2200,background:'rgba(28,10,6,.55)',display:'flex',alignItems:'center',justifyContent:'center',padding:24},onClick:()=>this.setState({mapEdit:false})},
      h('div',{onClick:e=>e.stopPropagation(),className:'aok-scroll',style:{background:P.bg,borderRadius:20,padding:'26px 28px',width:'100%',maxWidth:560,maxHeight:'88vh',overflowY:'auto',boxShadow:'0 30px 80px rgba(0,0,0,.4)'}},
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}, h('h2',{style:{font:'800 20px '+this.HEAD,color:P.maroon,margin:0}},'Edit the map'), h('button',{onClick:()=>this.setState({mapEdit:false}),style:{border:'none',background:'transparent',cursor:'pointer',font:'600 20px '+this.HEAD,color:P.muted}},'\u2715')),
        h('p',{style:{font:'400 13.5px/1.55 Plus Jakarta Sans',color:P.muted,margin:'0 0 18px'}},'Use either option below. If you paste embed code, it is used first.'),
        fieldLabel('1','Map link (URL)'),
        h('input',{value:c.mapUrl||'',placeholder:'Paste a Google Maps link, or type your address',onChange:e=>this.commit('contact.mapUrl',e.target.value),style:{width:'100%',padding:'11px 13px',borderRadius:10,border:'1px solid '+P.line,background:P.white,font:'400 14px Plus Jakarta Sans',marginBottom:6}}),
        h('p',{style:{font:'400 12px/1.5 Plus Jakarta Sans',color:P.muted,margin:'0 0 20px'}},'Tip: a plain address or place name works \u2014 we build the map automatically. A Google \u201cembed\u201d link also works.'),
        h('div',{style:{display:'flex',alignItems:'center',gap:12,margin:'2px 0 18px'}}, h('div',{style:{flex:1,height:1,background:P.line}}), h('span',{style:{font:'700 12px '+this.HEAD,color:P.muted}},'OR'), h('div',{style:{flex:1,height:1,background:P.line}})),
        fieldLabel('2','Embedded map code'),
        h('textarea',{value:c.mapEmbed||'',rows:5,placeholder:'<iframe src="https://www.google.com/maps/embed?..."></iframe>',onChange:e=>this.commit('contact.mapEmbed',e.target.value),style:{width:'100%',padding:'11px 13px',borderRadius:10,border:'1px solid '+P.line,background:P.white,font:'400 13px monospace',resize:'vertical',marginBottom:6}}),
        h('p',{style:{font:'400 12px/1.5 Plus Jakarta Sans',color:P.muted,margin:'0 0 22px'}},'In Google Maps: Share \u2192 Embed a map \u2192 Copy HTML, then paste the whole <iframe\u2026></iframe> here.'),
        h('div',{style:{display:'flex',justifyContent:'space-between',gap:12}}, h('button',{onClick:()=>{ this.commit('contact.mapUrl',''); this.commit('contact.mapEmbed',''); },style:{padding:'10px 18px',borderRadius:999,border:'1px solid '+P.line,background:'transparent',color:P.muted,cursor:'pointer',font:'600 13px '+this.HEAD}},'Clear map'), this.btn('Done',()=>this.setState({mapEdit:false}),{variant:'solid',pad:'10px 22px',style:{fontSize:14}})))); }

  renderLeadForm(){ const h=React.createElement,P=this.P; const f=this._form||{}; if(!this._cap)this.newCaptcha();
    const set=(k,v)=>{ this._form={...this._form,[k]:v}; this.forceUpdate(); };
    const inpStyle={width:'100%',padding:'12px 14px',borderRadius:10,border:'1px solid '+P.line,background:P.white,font:'400 15px Plus Jakarta Sans',color:P.ink,resize:'vertical',boxSizing:'border-box'};
    const lbl=(label,opt,extra)=>h('span',{style:{display:'block',font:'600 13px '+this.HEAD,color:P.maroon,marginBottom:6}}, label, opt?h('span',{style:{color:P.muted,fontWeight:400}},' (optional)'):h('span',{style:{color:P.red}},' *'), extra||null);
    const field=(k,label,opt,ph,multi,type)=>h('label',{key:k,style:{display:'block'}},
      lbl(label,opt),
      h(multi?'textarea':'input',{type:type||'text',value:f[k]||'',onChange:e=>set(k,e.target.value),placeholder:ph||'',rows:multi?4:undefined,style:inpStyle}));
    const conv=this.convertAppt(f.country,f.apptDate,f.apptTime);
    const dial=this.findCountry(f.country);
    return h('form',{onSubmit:e=>{e.preventDefault();this.submitLead();},className:'aok-card',style:{padding:32}},
      h('h2',{style:{font:'700 22px '+this.HEAD,color:P.maroon,margin:'0 0 4px'}},'Send your details'),
      this.etext('contactPage.note',{tag:'p',style:{font:'400 14px Plus Jakarta Sans',color:P.muted,margin:'0 0 20px'}}),
      h('div',{style:{display:'grid',gap:16}},
        field('name','Name',false,'Your full name'),
        field('email','Email',false,'you@example.com','','email'),
        h('label',{style:{display:'block'}}, lbl('WhatsApp / Phone',true),
          h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
            h('select',{value:f.country||'',onChange:e=>set('country',e.target.value),style:{...inpStyle,width:'auto',flex:'1 1 150px',minWidth:0,maxWidth:240,padding:'12px 10px',cursor:'pointer'}},
              h('option',{value:''},'Country / code'),
              ...this.COUNTRIES().map(c=>h('option',{key:c[0],value:c[0]}, c[1]+' (+'+c[2]+')'))),
            dial?h('div',{style:{display:'flex',alignItems:'center',padding:'0 12px',borderRadius:10,background:P.bgAlt,border:'1px solid '+P.line,font:'600 15px Plus Jakarta Sans',color:P.maroon,whiteSpace:'nowrap'}},'+'+dial[2]):null,
            h('input',{value:f.phone||'',onChange:e=>set('phone',e.target.value),placeholder:'Phone / WhatsApp number',inputMode:'tel',style:{...inpStyle,flex:'2 1 160px',minWidth:0}}))),
        h('div',null,
          h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}},
            field('apptDate','Preferred appointment date',true,'','','date'),
            field('apptTime','Preferred appointment time',true,'','','time')),
          h('div',{style:{marginTop:12,background:P.bgAlt,border:'1px solid '+P.line,borderRadius:12,padding:'14px 16px'}},
            h('div',{style:{display:'flex',gap:9,alignItems:'flex-start'}},
              h('span',{style:{color:P.gold,fontSize:15,flexShrink:0,lineHeight:1.4}},'\u23f0'),
              h('div',{style:{font:'400 12.8px/1.55 Plus Jakarta Sans',color:P.muted}},
                h('strong',{style:{color:P.maroon,fontWeight:600}},'All times are in PST \u2014 Pacific Time, Vancouver (Canada). '),
                'If you\u2019re in a different time zone, please select your country above and enter your preferred local time \u2014 we\u2019ll show the matching Vancouver time below.')),
            conv?h('div',{style:{display:'grid',gap:8,marginTop:12,paddingTop:12,borderTop:'1px solid '+P.line}},
              h('div',{style:{display:'flex',justifyContent:'space-between',gap:12,alignItems:'baseline'}},
                h('span',{style:{font:'600 12px '+this.HEAD,letterSpacing:'.04em',textTransform:'uppercase',color:P.gold}},'Your time \u2014 '+conv.custName),
                h('span',{style:{font:'600 14px Plus Jakarta Sans',color:P.ink,textAlign:'right'}},conv.cust)),
              h('div',{style:{display:'flex',justifyContent:'space-between',gap:12,alignItems:'baseline'}},
                h('span',{style:{font:'600 12px '+this.HEAD,letterSpacing:'.04em',textTransform:'uppercase',color:P.gold}},'Vancouver \u2014 astrologer'),
                h('span',{style:{font:'700 14px Plus Jakarta Sans',color:P.maroon,textAlign:'right'}},conv.van))):null)),
        h('div',{style:{height:1,background:P.line,margin:'2px 0'}}),
        h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}, field('dob','Date of Birth',true,'DD / MM / YYYY'), field('tob','Time of Birth',true,'HH:MM AM/PM')),
        field('pob','Place of Birth',true,'City / State / Province / Country'),
        field('reason','Reason / Detail / Question',false,'Tell me what you\u2019d like guidance on \u2014 marriage, career, a dosha, a remedy\u2026',true),
        h('input',{type:'text',name:'website',tabIndex:-1,autoComplete:'off','aria-hidden':'true',value:f._hp||'',onChange:e=>set('_hp',e.target.value),style:{position:'absolute',left:'-9999px',width:1,height:1,opacity:0}}),
        h('label',{style:{display:'block'}},
          h('span',{style:{display:'block',font:'600 13px '+this.HEAD,color:P.maroon,marginBottom:6}},'Verification',h('span',{style:{color:P.red}},' *'),h('span',{style:{color:P.muted,fontWeight:400}},'  \u2014 confirm you\u2019re human')),
          h('div',{style:{display:'flex',alignItems:'center',gap:12}},
            h('div',{style:{display:'flex',alignItems:'center',padding:'12px 16px',borderRadius:10,background:P.bgAlt,border:'1px solid '+P.line,font:'700 17px '+this.HEAD,color:P.maroon,whiteSpace:'nowrap',userSelect:'none',letterSpacing:'.06em'}}, this._cap.a+'  +  '+this._cap.b+'  =  ?'),
            h('input',{value:f.captcha||'',onChange:e=>set('captcha',e.target.value),inputMode:'numeric',placeholder:'Answer',style:{width:120,padding:'12px 14px',borderRadius:10,border:'1px solid '+P.line,background:P.white,font:'400 15px Plus Jakarta Sans',color:P.ink}}),
            h('button',{type:'button',title:'New question',onClick:()=>{this.newCaptcha();this.forceUpdate();},style:{...this.iconBtn(),width:42,height:42,fontSize:16}},'\u21bb'))),
        this.btn(this._sending?'Sending\u2026':'Send my message \u2192',null,{variant:'solid',style:{width:'100%',justifyContent:'center',marginTop:4,opacity:this._sending?.6:1,pointerEvents:this._sending?'none':'auto'}}),
        h('div',{style:{display:'flex',alignItems:'flex-start',gap:7,font:'400 12.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:2}}, h('span',{style:{color:P.gold,flexShrink:0}},'\u26ed'),'Protected against spam \u00b7 your details are sent securely to the astrologer.'))); }

  newCaptcha(){ const a=2+Math.floor(Math.random()*8), b=2+Math.floor(Math.random()*8); this._cap={a,b,ans:a+b}; }

  COUNTRIES(){ return this._COUNTRIES || (this._COUNTRIES=[
    ['AF','Afghanistan','93','Asia/Kabul'],['AL','Albania','355','Europe/Tirane'],['DZ','Algeria','213','Africa/Algiers'],['AR','Argentina','54','America/Argentina/Buenos_Aires'],['AU','Australia','61','Australia/Sydney'],['AT','Austria','43','Europe/Vienna'],['BH','Bahrain','973','Asia/Bahrain'],['BD','Bangladesh','880','Asia/Dhaka'],['BE','Belgium','32','Europe/Brussels'],['BR','Brazil','55','America/Sao_Paulo'],['BG','Bulgaria','359','Europe/Sofia'],['CA','Canada','1','America/Toronto'],['CL','Chile','56','America/Santiago'],['CN','China','86','Asia/Shanghai'],['CO','Colombia','57','America/Bogota'],['HR','Croatia','385','Europe/Zagreb'],['CZ','Czechia','420','Europe/Prague'],['DK','Denmark','45','Europe/Copenhagen'],['EG','Egypt','20','Africa/Cairo'],['FI','Finland','358','Europe/Helsinki'],['FR','France','33','Europe/Paris'],['DE','Germany','49','Europe/Berlin'],['GH','Ghana','233','Africa/Accra'],['GR','Greece','30','Europe/Athens'],['HK','Hong Kong','852','Asia/Hong_Kong'],['HU','Hungary','36','Europe/Budapest'],['IS','Iceland','354','Atlantic/Reykjavik'],['IN','India','91','Asia/Kolkata'],['ID','Indonesia','62','Asia/Jakarta'],['IR','Iran','98','Asia/Tehran'],['IQ','Iraq','964','Asia/Baghdad'],['IE','Ireland','353','Europe/Dublin'],['IL','Israel','972','Asia/Jerusalem'],['IT','Italy','39','Europe/Rome'],['JP','Japan','81','Asia/Tokyo'],['JO','Jordan','962','Asia/Amman'],['KE','Kenya','254','Africa/Nairobi'],['KW','Kuwait','965','Asia/Kuwait'],['LB','Lebanon','961','Asia/Beirut'],['MY','Malaysia','60','Asia/Kuala_Lumpur'],['MX','Mexico','52','America/Mexico_City'],['MA','Morocco','212','Africa/Casablanca'],['NP','Nepal','977','Asia/Kathmandu'],['NL','Netherlands','31','Europe/Amsterdam'],['NZ','New Zealand','64','Pacific/Auckland'],['NG','Nigeria','234','Africa/Lagos'],['NO','Norway','47','Europe/Oslo'],['OM','Oman','968','Asia/Muscat'],['PK','Pakistan','92','Asia/Karachi'],['PH','Philippines','63','Asia/Manila'],['PL','Poland','48','Europe/Warsaw'],['PT','Portugal','351','Europe/Lisbon'],['QA','Qatar','974','Asia/Qatar'],['RO','Romania','40','Europe/Bucharest'],['RU','Russia','7','Europe/Moscow'],['SA','Saudi Arabia','966','Asia/Riyadh'],['RS','Serbia','381','Europe/Belgrade'],['SG','Singapore','65','Asia/Singapore'],['ZA','South Africa','27','Africa/Johannesburg'],['KR','South Korea','82','Asia/Seoul'],['ES','Spain','34','Europe/Madrid'],['LK','Sri Lanka','94','Asia/Colombo'],['SE','Sweden','46','Europe/Stockholm'],['CH','Switzerland','41','Europe/Zurich'],['TW','Taiwan','886','Asia/Taipei'],['TH','Thailand','66','Asia/Bangkok'],['TR','Turkey','90','Europe/Istanbul'],['UA','Ukraine','380','Europe/Kyiv'],['AE','United Arab Emirates','971','Asia/Dubai'],['GB','United Kingdom','44','Europe/London'],['US','United States','1','America/New_York'],['VN','Vietnam','84','Asia/Ho_Chi_Minh']
  ]); }
  findCountry(code){ return this.COUNTRIES().find(c=>c[0]===code)||null; }
  tzOffsetMin(tz,date){ try{ const p=new Intl.DateTimeFormat('en-US',{timeZone:tz,timeZoneName:'shortOffset',hour:'2-digit'}).formatToParts(date); const s=(p.find(x=>x.type==='timeZoneName')||{}).value||'GMT'; const m=s.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/); if(!m) return 0; return (m[1]==='-'?-1:1)*(parseInt(m[2],10)*60+(m[3]?parseInt(m[3],10):0)); }catch(e){ return 0; } }
  convertAppt(code,date,time){ const c=this.findCountry(code); if(!c||!date||!time) return null; const dm=String(date).match(/^(\d{4})-(\d{2})-(\d{2})$/); const tm=String(time).match(/^(\d{1,2}):(\d{2})$/); if(!dm||!tm) return null; const t0=Date.UTC(+dm[1],+dm[2]-1,+dm[3],+tm[1],+tm[2]); const off=this.tzOffsetMin(c[3],new Date(t0)); const inst=new Date(t0-off*60000); const fmt=z=>new Intl.DateTimeFormat('en-US',{timeZone:z,weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',hour12:true}).format(inst); return { custName:c[1], cust:fmt(c[3]), van:fmt('America/Vancouver') }; }

  submitLead(){ if(this._sending) return; const f=this._form||{};
    if(!f.name||!f.reason){ this.flash('Please fill in your name and question.'); return; }
    if(!f.email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(f.email).trim())){ this.flash('Please enter a valid email address.'); return; }
    if((f._hp||'').trim()){ this._form={}; this.newCaptcha(); this.forceUpdate(); return; } // honeypot: silently drop bots
    if(String(f.captcha||'').trim()!==String(this._cap.ans)){ this.flash('Verification answer is incorrect \u2014 please try again.'); this.newCaptcha(); this._form={...f,captcha:''}; this.forceUpdate(); return; }
    let last=0; try{ last=parseInt(localStorage.getItem('aok_last_submit')||'0',10); }catch(e){}
    if(Date.now()-last < 30000){ this.flash('Please wait a moment before sending another message.'); return; }
    const to=this.state.data.contact.email;
    const dc=this.findCountry(f.country); const phoneFull=f.phone?((dc?'+'+dc[2]+' ':'')+f.phone):''; const conv=this.convertAppt(f.country,f.apptDate,f.apptTime);
    const apptStr=(f.apptDate||f.apptTime)?((f.apptDate||'')+(f.apptTime?' '+f.apptTime:'')+(dc?' ('+dc[1]+' local)':'')):'';
    const vanStr=conv?conv.van:'';
    const lead={ id:this.uid(), name:f.name, email:f.email, country:dc?dc[1]:'', phone:phoneFull, appt:apptStr, apptVan:vanStr, dob:f.dob, tob:f.tob, pob:f.pob, reason:f.reason, at:new Date().toISOString(), read:false };
    const payload={ Name:f.name||'', Email:f.email||'', 'WhatsApp / Phone':phoneFull||'-', Country:dc?dc[1]:'-', 'Preferred appointment (client local)':apptStr||'-', 'Appointment in Vancouver (PST)':vanStr||'-', 'Date of Birth':f.dob||'-', 'Time of Birth':f.tob||'-', 'Place of Birth':f.pob||'-', 'Reason / Question':f.reason||'', _subject:'New enquiry from '+(f.name||'')+' \u2014 Analysis of Karma', _replyto:f.email||'', _template:'table', _captcha:'false' };
    const finish=(ok)=>{ this._sending=false; try{ localStorage.setItem('aok_last_submit',String(Date.now())); }catch(e){} this.save(this.setIn(this.state.data,'leads',[lead,...(this.state.data.leads||[])])); this._form={}; this.newCaptcha(); this.flash(ok?'Thank you! Your message has been sent.':'Saved \u2014 your message was recorded and will reach the astrologer.'); this.forceUpdate(); };
    this._sending=true; this.forceUpdate();
    try{
      fetch('/api/contact.php',{ method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body:JSON.stringify(payload) })
        .then(r=>r.json()).then(()=>finish(true)).catch(()=>finish(false));
    }catch(e){ finish(false); } }

  // ---------- FAQ (shared section) ----------
  faqSection(opts){ const h=React.createElement,P=this.P,d=this.state.data; const fp=d.faqPage; if(!fp||!((fp.items)||[]).length) return null; const open=this._faqOpen||(this._faqOpen={}); const em=this.state.editMode; const showAsk=!(opts&&opts.hideAsk);
    return h('section',{style:{padding:'72px 0',background:(opts&&opts.bg)||P.bgAlt}}, this.wrap(h('div',{style:{maxWidth:820,margin:'0 auto'}},
      (opts&&opts.noTitle)? null : h('div',{style:{textAlign:'center',marginBottom:34}},
        h('div',{style:{display:'flex',justifyContent:'center',marginBottom:14}},this.kicker('FAQ')),
        this.etext('faqPage.hero.title',{tag:'h2',style:{font:'800 clamp(26px,3.2vw,38px) '+this.HEAD,color:P.maroon,margin:0,letterSpacing:'-.02em'}})),
      h('div',{style:{display:'grid',gap:14}},
        ...(fp.items).map((it,i)=>{ const isOpen=em||!!open[i];
          return h('div',{key:i,className:'aok-card aok-faq',style:{overflow:'hidden'}},
            h('div',{onClick:em?undefined:()=>{ open[i]=!open[i]; this.forceUpdate(); },style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,padding:'20px 22px',cursor:em?'default':'pointer'}},
              em? this.etext('faqPage.items.'+i+'.q',{tag:'span',style:{font:'700 17px/1.4 '+this.HEAD,color:P.maroon}}) : h('span',{style:{font:'700 17px/1.4 '+this.HEAD,color:P.maroon}}, it.q),
              em? h('div',{style:{display:'flex',gap:6,flexShrink:0}},
                    h('button',{title:'Move up',onClick:e=>{e.stopPropagation();this.faqMove(i,-1);},style:{...this.iconBtn(),width:30,height:30,fontSize:13}},'\u2191'),
                    h('button',{title:'Move down',onClick:e=>{e.stopPropagation();this.faqMove(i,1);},style:{...this.iconBtn(),width:30,height:30,fontSize:13}},'\u2193'),
                    h('button',{title:'Remove this FAQ',onClick:e=>{e.stopPropagation();this.faqDel(i);},style:{...this.iconBtn(true),width:30,height:30,fontSize:13}},'\u2715'))
                : h('span',{style:{flexShrink:0,width:28,height:28,borderRadius:'50%',background:isOpen?P.red:P.bgAlt,color:isOpen?P.cream:P.maroon,display:'flex',alignItems:'center',justifyContent:'center',font:'700 18px '+this.HEAD,lineHeight:1}}, isOpen?'\u2212':'+')),
            isOpen? h('div',{style:{padding:'0 22px 22px'}}, em? this.answerHint(it.a):null, em? this.etext('faqPage.items.'+i+'.a',{tag:'p',className:'aok-link',style:{font:'400 15.5px/1.7 Plus Jakarta Sans',color:P.ink,margin:0}}) : h('p',{className:'aok-link',style:{font:'400 15.5px/1.7 Plus Jakarta Sans',color:P.ink,margin:0}}, it.a)) : null);
        })),
      em? h('div',{style:{textAlign:'center',marginTop:18}}, this.btn('\uff0b Add FAQ',()=>this.faqAdd(),{variant:'gold',pad:'11px 20px',style:{fontSize:14}})):null,
      showAsk? h('div',{style:{textAlign:'center',marginTop:24}}, this.ebtn('faqPage.askBtn',{label:'Ask your own question \u2192',link:'contact',variant:'outline',size:'md'})):null))); }

  // ---------- FOOTER ----------
  socialLinks(){ const c=this.state.data.contact||{}; const map={facebook:'f',instagram:'◉',youtube:'▶',whatsapp:'✆',x:'X',twitter:'X',linkedin:'in',pinterest:'P',tiktok:'♪',telegram:'✈',google:'⚑',website:'☍'};
    const base=[['Facebook',c.facebook,'f'],['Instagram',c.instagram,'◉'],['YouTube',c.youtube,'▶'],['Google',c.gmb,'⚑']];
    const extra=((this.state.data.socials)||[]).map(s=>[(s.net||'link'),s.url,map[s.net]||'☍']);
    return base.concat(extra).filter(s=>s[1]); }
  // Name / area / phone, identical to the server-rendered copy and the structured data (local SEO consistency)
  napBlock(){ const h=React.createElement,P=this.P,d=this.state.data,L=d.local||{},pe=d.person||{},c=d.contact||{};
    const br=k=>h('br',{key:k}); const parts=[h('strong',{key:'n',style:{color:P.maroon,fontWeight:600}},this.brandName()),br('b0'),(pe.jobTitle||'Vedic Astrologer')+' '+(pe.name||d.brand.astrologer)];
    if(!L.serviceAreaBusiness&&L.streetAddress) parts.push(br('b1'),L.streetAddress);
    parts.push(br('b2'),[L.locality||'Surrey',L.region||'British Columbia',(L.country||'CA')==='CA'?'Canada':L.country].join(', '));
    if(c.phone) parts.push(br('b3'),'Phone: ',h('a',{key:'tel',href:'tel:'+String(c.phone).replace(/[^\d+]/g,''),className:'aok-footlink'},c.phone));
    if(c.email) parts.push(br('b4'),'Email: ',h('a',{key:'em',href:'mailto:'+c.email,className:'aok-footlink'},c.email));
    const areas=(L.areasServed||[]).filter(Boolean), near=(L.nearbyCities||[]).filter(Boolean); if(areas.length) parts.push(br('b5'),'Serving: '+areas.join(', ')+(near.length?' \u00b7 including '+this.joinList(near):'')+(L.onlineWorldwide!==false?' \u00b7 Worldwide online ('+(L.onlineChannels||['Zoom','WhatsApp']).filter(Boolean).join(' & ')+')':''));
    const days=[['Mo','Mon'],['Tu','Tue'],['We','Wed'],['Th','Thu'],['Fr','Fri'],['Sa','Sat'],['Su','Sun']].filter(x=>L.hours&&L.hours[x[0]]&&L.hours[x[0]].o&&L.hours[x[0]].c).map(x=>x[1]+' '+L.hours[x[0]].o+'\u2013'+L.hours[x[0]].c);
    if(days.length) parts.push(br('b6'),'Hours: '+days.join(' \u00b7 '));
    return h('address',{style:{fontStyle:'normal',font:'400 13.5px/1.75 Plus Jakarta Sans',color:P.ink,marginTop:18,maxWidth:360}},...parts); }
  renderFooter(){ const h=React.createElement,P=this.P,d=this.state.data;
    const links=[['home',this.t('home')],['about',this.t('about')],['services',this.t('services')],['meditation',this.t('meditation')],['blog',this.t('blog')],['faq',this.t('faq')],['contact',this.t('contact')]];
    const head=t=>h('div',{style:{font:'600 12px '+this.HEAD,letterSpacing:'.2em',textTransform:'uppercase',color:'#8A6A2E',marginBottom:16}}, t);
    return h('footer',{className:'aok-footer'}, h('div',{className:'aok-hairline'}), this.wrap(h('div',{style:{position:'relative'}},
      h('div',{style:{display:'grid',gridTemplateColumns:'1.4fr 1fr 1.2fr',gap:40,padding:'60px 0 38px'}},
        h('div',null, h('div',{style:{display:'flex',alignItems:'center',gap:12,marginBottom:16}}, h('span',{className:'aok-brand-mark'},this.mark(46)), h('div',{className:'aok-goldtext',style:{font:'600 26px/1 '+this.SERIF}}, d.brand.name)),
          h('p',{style:{font:'400 14.5px/1.75 Plus Jakarta Sans',maxWidth:330,margin:0,color:P.ink}}, d.brand.tagline), this.napBlock()),
        h('div',null, head(this.t('quicklinks')),
          h('div',{style:{display:'grid',gap:10}}, ...links.map(l=>h('a',{key:l[0],...this.linkTo(this.routeHref(l[0]),()=>this.go(l[0])),className:'aok-footlink'},l[1])))),
        h('div',null, head(this.t('follow')),
          h('div',{style:{display:'flex',gap:10,marginBottom:18,flexWrap:'wrap'}}, ...this.socialLinks().map((s,i)=>h('a',{key:i,href:s[1],target:'_blank',rel:'noopener',title:s[0],'aria-label':s[0],className:'aok-badge3d is-sm',style:{font:'600 16px/1 Plus Jakarta Sans'}},h('span',null,s[2])))),
          h('a',{...this.linkTo('/contact',()=>this.go('contact')),className:'aok-footlink'}, 'Contact form →'))),
      h('div',{style:{borderTop:'1px solid '+P.line,padding:'22px 0 2px',font:'400 12.5px/1.7 Plus Jakarta Sans',color:P.muted,maxWidth:800}}, h('strong',{style:{color:P.ink,fontWeight:600}},'Disclaimer: '), d.disclaimer),
      h('div',{style:{borderTop:'1px solid '+P.line,padding:'20px 0',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12,font:'400 13px Plus Jakarta Sans',color:P.muted}},
        h('span',null,'© '+new Date().getFullYear()+' '+d.brand.name+'. All rights reserved.'))))); }

  // ================= EDITOR ENGINE (page builder) =================
  exec(cmd,arg){ try{ document.execCommand('styleWithCSS',false,true); }catch(e){} try{ document.execCommand(cmd,false,arg); }catch(e){} }
  pushHist(){ try{ this._hist.push(JSON.stringify(this.state.data)); if(this._hist.length>80) this._hist.shift(); this._fut=[]; }catch(e){} }
  undo(){ if(!this._hist.length){ this.flash('Nothing to undo'); return; } this._fut.push(JSON.stringify(this.state.data)); this.save(JSON.parse(this._hist.pop())); this.setState({selBlock:null}); }
  redo(){ if(!this._fut.length){ this.flash('Nothing to redo'); return; } this._hist.push(JSON.stringify(this.state.data)); this.save(JSON.parse(this._fut.pop())); this.setState({selBlock:null}); }
  revertSaved(){ if(this._baseline==null){ this.flash('No saved version yet'); return; } if(!confirm('Revert ALL changes made since you opened the editor this session?')) return; this.pushHist(); this.save(JSON.parse(this._baseline)); this.setState({selBlock:null}); this.flash('Reverted to opening state'); }
  mutate(producer){ this.pushHist(); const nd=JSON.parse(JSON.stringify(this.state.data)); if(!nd.blocks) nd.blocks={home:[],about:[],services:[],meditation:[],blog:[],contact:[]}; producer(nd); this.save(nd); }
  arrMove(arr,from,to){ if(!arr||to<0||to>=arr.length) return; const x=arr.splice(from,1)[0]; arr.splice(to,0,x); }

  blockTpl(type){ const b={id:this.uid(),type,_s:{}};
    if(type==='heading') return {...b,text:'Your heading goes here'};
    if(type==='text') return {...b,text:'Write your text here. Click to edit \u2014 use the toolbar above for bold, colour, size, lists and links.'};
    if(type==='image') return {...b,src:null,alt:'',caption:'',desc:'',w:100,align:'center',ar:'16/9'};
    if(type==='button') return {...b,label:'Book a Consultation',route:'contact'};
    if(type==='cta') return {...b,title:'Ready to understand your chart?',sub:'Book a one-to-one Vedic astrology consultation and get clear, personal guidance.',label:'Book now',route:'contact',_s:{padY:0}};
    if(type==='quote') return {...b,text:'A meaningful line worth highlighting goes here.',cite:'Jag Mallah'};
    if(type==='iconlist') return {...b,items:['First point','Second point','Third point']};
    if(type==='divider') return {...b};
    if(type==='spacer') return {...b,h:48};
    if(type==='columns') return {...b,cols:[{w:1,items:[]},{w:1,items:[]}],gap:24,minH:0,_s:{padY:24,maxW:1100}};
    if(type==='video') return {...b,url:'https://www.youtube.com/watch?v=ScMzIvxBSi4'};
    if(type==='imagebox') return {...b,src:null,title:'Image box title',text:'Add a short description for this item that tells visitors what it is about.'};
    if(type==='iconbox') return {...b,icon:'✨',title:'Icon box title',text:'Add a short description for this item that tells visitors what it is about.'};
    if(type==='gallery') return {...b,images:[null,null,null,null,null,null],cols:3};
    if(type==='carousel') return {...b,images:[null,null,null]};
    if(type==='testimonial') return {...b,text:'The reading was clear, kind and genuinely helpful. I finally understand my chart.',author:'Happy Client',role:'Consultation client',stars:5,src:null};
    if(type==='social') return {...b,links:[{net:'facebook',url:'#'},{net:'instagram',url:'#'},{net:'youtube',url:'#'},{net:'whatsapp',url:'#'}]};
    if(type==='counter') return {...b,value:'10000',suffix:'+',label:'Birth charts read'};
    if(type==='progress') return {...b,label:'Chart accuracy',pct:90};
    if(type==='tabs') return {...b,items:[{t:'Tab one',c:'Content for the first tab. Click to edit it.'},{t:'Tab two',c:'Content for the second tab.'}]};
    if(type==='accordion') return {...b,items:[{q:'First question?',a:'Answer to the first question. Click to edit.'},{q:'Second question?',a:'Answer to the second question.'}]};
    if(type==='rating') return {...b,stars:5,max:5};
    if(type==='alert') return {...b,title:'Note',text:'This is an important message for your visitors.',tone:'info'};
    if(type==='map') return {...b,query:'Toronto, ON, Canada'};
    if(type==='html') return {...b,code:'<div style="padding:24px;text-align:center;font-family:sans-serif">Your custom HTML goes here</div>'};
    if(type==='dualheading') return {...b,a:'Clarity for your ',accent:'life & karma',_s:{align:'center'}};
    if(type==='fancytext') return {...b,pre:'Guidance for',words:['love','career','marriage','health'],post:'and more',_s:{align:'center'}};
    if(type==='toggle') return {...b,q:'Click to reveal more',a:'This content stays hidden until a visitor clicks the toggle. Click the text to edit it.'};
    if(type==='imagescroller') return {...b,src:null,h:340,alt:'',desc:''};
    if(type==='featurelist') return {...b,items:[{icon:'✦',t:'First feature or benefit'},{icon:'✔',t:'Second feature or benefit'},{icon:'★',t:'Third feature or benefit'}]};
    if(type==='compare') return {...b,before:null,after:null,ar:'16/10'};
    if(type==='hotspots') return {...b,src:null,ar:'16/9',points:[{x:30,y:40,label:'Point 1',text:'Describe this part of the image.'}]};
    if(type==='audio') return {...b,src:'',title:'Listen'};
    if(type==='stickyvideo') return {...b,url:'https://www.youtube.com/watch?v=ScMzIvxBSi4',corner:'br'};
    if(type==='offcanvas') return {...b,label:'Open panel',side:'right',title:'More information',text:'This content slides out from the side of the screen. Click to edit it.',_s:{align:'center'}};
    if(type==='pricingtable') return {...b,plans:[
      {id:this.uid(),name:'Basic',price:'$100',period:'per reading',features:['Birth chart reading','Written summary','One follow-up question'],featured:false,button:'Choose',route:'contact'},
      {id:this.uid(),name:'Standard',price:'$180',period:'per reading',features:['Everything in Basic','Live 60-min consultation','Remedies & gemstone advice'],featured:true,button:'Choose',route:'contact'},
      {id:this.uid(),name:'Premium',price:'$300',period:'per reading',features:['Everything in Standard','Year-ahead forecast','Two follow-up calls'],featured:false,button:'Choose',route:'contact'}
    ]};
    if(type==='pricemenu') return {...b,items:[
      {id:this.uid(),name:'Kundli / Birth Chart Reading',desc:'Full natal chart analysis',price:'$100'},
      {id:this.uid(),name:'Marriage Matching',desc:'Guna Milan & compatibility',price:'$120'},
      {id:this.uid(),name:'Gemstone Recommendation',desc:'Stone, weight, metal & ritual',price:'$80'}
    ]};
    if(type==='countdown') return {...b,mode:'date',target:'',minutes:60,title:'Offer ends in',_s:{align:'center'}};
    if(type==='team') return {...b,members:[
      {id:this.uid(),photo:null,name:'Jag Mallah',role:'Vedic Astrologer',bio:'Classical Jyotish, meditation and practical remedies.',socials:[{net:'instagram',url:'#'},{net:'youtube',url:'#'}]}
    ]};
    if(type==='promo') return {...b,src:null,title:'Special offer',text:'Hover to reveal this promotional message. Click the text to edit it.'};
    if(type==='circle') return {...b,items:[{label:'Step one',text:'Details for the first item in the circle.'},{label:'Step two',text:'Details for the second item.'},{label:'Step three',text:'Details for the third item.'},{label:'Step four',text:'Details for the fourth item.'}]};
    if(type==='flipcards') return {...b,cols:3,cards:[{icon:'✦',front:'Card one',back:'The back of card one — flip to read more.'},{icon:'★',front:'Card two',back:'The back of card two.'},{icon:'☾',front:'Card three',back:'The back of card three.'}]};
    if(type==='popup') return {...b,label:'Open popup',title:'Welcome',text:'This popup appears above the page content. Click to edit it.',_s:{align:'center'}};
    if(type==='eventcal') return {...b,events:[{id:this.uid(),date:'2026-07-01',title:'Live Q&A session',desc:'Open astrology questions on Zoom.'},{id:this.uid(),date:'2026-07-15',title:'Full Moon meditation',desc:'Guided group meditation online.'}]};
    if(type==='multimap') return {...b,places:[{label:'Surrey, BC',query:'Surrey, BC, Canada'},{label:'Vancouver, BC',query:'Vancouver, BC, Canada'}]};
    if(type==='pagenav') return {...b,side:'right'};
    return b; }
  addBlock(route,type){ const at=this._insertAt; this._insertAt=null; const cur=((this.state.data.blocks||{})[route]||[]); const idx=(at!=null&&at<=cur.length)?at:cur.length; this.mutate(d=>{ d.blocks[route]=d.blocks[route]||[]; d.blocks[route].splice(idx,0,this.blockTpl(type)); }); this.setState({blkPick:null,selBlock:{route,i:idx}}); }
  cloneBlock(b){ const nb=JSON.parse(JSON.stringify(b)); const walk=o=>{ if(o&&typeof o==='object'){ if(typeof o.id==='string') o.id=this.uid(); for(const k in o) walk(o[k]); } }; walk(nb); return nb; }
  // ----- custom pages + menu helpers -----
  slugify(s){ return String(s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'page'; }
  uniqueSlug(base,exceptId){ const d=this.state.data; const reserved=['','admin','about','services','meditation','blog','contact','home','p','api','assets','uploads','sitemap.xml','robots.txt']; let s0=this.slugify(base),s=s0,i=1; const taken=x=>reserved.indexOf(x)>-1||(d.pages||[]).some(p=>p.slug===x&&p.id!==exceptId); while(taken(s)){ s=s0+'-'+(++i); } return s; }
  createPage(){ this.pushHist(); const id=this.uid(); const t='New Page'; const pages=[...(this.state.data.pages||[]),{id,slug:this.uniqueSlug(t),title:t,showTitle:true}]; this.save({...this.state.data,pages}); this.flash('Page created — click Design to build it'); this.forceUpdate(); return id; }
  clonePageFrom(srcScope,title){ this.pushHist(); const id=this.uid(); const t=(title||'Page')+' (copy)'; const d=this.state.data; const cloned=((d.blocks&&d.blocks[srcScope])||[]).map(b=>this.cloneBlock(b)); const pages=[...(d.pages||[]),{id,slug:this.uniqueSlug(t),title:t,showTitle:true}]; const blocks={...(d.blocks||{})}; blocks['page:'+id]=cloned; this.save({...d,pages,blocks}); this.flash('Page cloned ('+cloned.length+' blocks copied)'); this.forceUpdate(); return id; }
  deletePage(id){ if(!confirm('Delete this page and all its content? This cannot be undone.'))return; this.pushHist(); const d=this.state.data; const pages=(d.pages||[]).filter(p=>p.id!==id); const blocks={...(d.blocks||{})}; delete blocks['page:'+id]; delete blocks['page:'+id+'::top']; const nav={...(d.nav||{})}; nav.items=((nav.items)||[]).filter(it=>!(it.type==='page'&&it.value===id)); this.save({...d,pages,blocks,nav}); this.setState({route:'admin',adminTab:'pages',pageId:null,editMode:false}); this.flash('Page deleted'); }
  navAdd(){ this.pushHist(); const items=[...((this.state.data.nav&&this.state.data.nav.items)||[]),{id:this.uid(),label:'New link',type:'route',value:'home'}]; this.save(this.setIn(this.state.data,'nav.items',items)); }
  navDel(i){ this.pushHist(); const items=((this.state.data.nav.items)||[]).slice(); items.splice(i,1); this.save(this.setIn(this.state.data,'nav.items',items)); }
  navMove(i,dir){ const items=((this.state.data.nav.items)||[]).slice(); const j=i+dir; if(j<0||j>=items.length)return; this.pushHist(); [items[i],items[j]]=[items[j],items[i]]; this.save(this.setIn(this.state.data,'nav.items',items)); }
  navSetType(i,type){ const def=type==='page'?((this.state.data.pages||[])[0]||{}).id||'':type==='url'?'https://':'home'; this.pushHist(); const items=((this.state.data.nav.items)||[]).slice(); items[i]={...items[i],type,value:def}; this.save(this.setIn(this.state.data,'nav.items',items)); }
  socAdd(){ this.pushHist(); const arr=[...((this.state.data.socials)||[]),{net:'facebook',url:''}]; this.save(this.setIn(this.state.data,'socials',arr)); }
  socDel(i){ this.pushHist(); const arr=((this.state.data.socials)||[]).slice(); arr.splice(i,1); this.save(this.setIn(this.state.data,'socials',arr)); }
  // answer-engine hint: 40–60 word answers are the sweet spot for featured snippets and AI answers
  // The 7 FAQ answers that were shorter than the 40–60 words AI answer engines prefer, as first shipped.
  // Admin → SEO Health offers to swap each one for its expanded default — only if it is still word-for-word unchanged.
  faqShortOriginals(){ return {
    'What information do I need for a birth chart reading?':'To generate an accurate birth chart, I need your date of birth, the exact time of birth (down to the minute, if possible), and the city and country where you were born.',
    'What is a \u201cRising Sign\u201d or Ascendant?':'Your Rising sign is the zodiac constellation that was rising on the eastern horizon at the exact moment you were born. It represents your outward personality, your physical appearance, and how the world initially perceives you.',
    'Are my personal data and consultation private?':'Absolutely. At Analysis of Karma, I follow strict privacy and confidentiality rules to protect your personal details. All consultations are 100% confidential and are never shared or discussed with anyone else.',
    'Do you offer refunds if I am not satisfied with a live reading?':'I offer a satisfaction guarantee for new clients. If you are not satisfied with your reading or feel the service was not a good fit, you can speak with me directly to discuss a refund.',
    'How does astrology determine relationship compatibility?':'Astrologers use a technique called \u201cSynastry,\u201d which involves overlaying two people\u2019s birth charts to see how their planets interact. This highlights areas of harmony, potential friction, communication styles, and the long-term viability of the partnership.',
    'What is a Moon sign and why does it matter?':'While your Sun sign represents your core identity and ego, your Moon sign dictates your emotional inner world. It governs your subconscious reactions, your instincts, and what you need to feel safe, nurtured, and secure.',
    'Can astrology predict health issues?':'Medical astrology can point out physical sensitivities or periods of low vitality based on planetary alignments. However, I am not a medical professional. Astrology should never replace professional medical diagnosis, advice, or treatment.'
  }; }
  faqUpgradable(){ const orig=this.faqShortOriginals(), d=this.state.data, def={}; (this.defaults().faqPage.items||[]).forEach(it=>{ def[it.q]=it.a; });
    return (((d.faqPage||{}).items)||[]).map((it,i)=>({i,q:it.q,a:def[it.q]})).filter(x=>orig[x.q]!==undefined&&this.txt(d.faqPage.items[x.i].a).trim()===this.txt(orig[x.q]).trim()&&x.a); }
  upgradeFaq(){ const list=this.faqUpgradable(); if(!list.length) return; const items=this.state.data.faqPage.items.map((it,i)=>{ const u=list.find(x=>x.i===i); return u?{...it,a:u.a}:it; });
    this.commit('faqPage.items',items); this.flash('\u2713 '+list.length+' FAQ answers expanded \u2014 click Save changes to publish'); }
  wordCount(html){ return this.txt(html).split(/\s+/).filter(Boolean).length; }
  answerHint(a){ const n=this.wordCount(a), ok=n>=40&&n<=60, near=n>=30&&n<=80; return React.createElement('div',{contentEditable:false,style:{display:'inline-block',margin:'0 0 8px',padding:'3px 10px',borderRadius:999,font:'600 11.5px '+this.HEAD,background:ok?'#e4f3e8':near?'#fbf1dc':'#fbe9e3',color:ok?this.P.ok:near?'#8A6A2E':this.P.bad}}, n+' words \u00b7 '+(ok?'ideal answer length':'aim for 40\u201360 words')); }
  faqAdd(){ this.pushHist(); const items=[...((this.state.data.faqPage&&this.state.data.faqPage.items)||[]),{q:'New question?',a:'Type the answer here.'}]; this.save(this.setIn(this.state.data,'faqPage.items',items)); if(this._faqOpen) this._faqOpen[items.length-1]=true; this.flash('FAQ added — edit the question and answer'); }
  faqDel(i){ if(!confirm('Remove this FAQ?'))return; this.pushHist(); const items=((this.state.data.faqPage.items)||[]).slice(); items.splice(i,1); this.save(this.setIn(this.state.data,'faqPage.items',items)); this.flash('FAQ removed'); }
  faqMove(i,dir){ const items=((this.state.data.faqPage.items)||[]).slice(); const j=i+dir; if(j<0||j>=items.length)return; this.pushHist(); [items[i],items[j]]=[items[j],items[i]]; this.save(this.setIn(this.state.data,'faqPage.items',items)); }
  offeringAdd(){ this.pushHist(); const arr=[...((this.state.data.meditation&&this.state.data.meditation.offerings)||[]),{t:'New practice',d:'Describe this type of meditation…'}]; this.save(this.setIn(this.state.data,'meditation.offerings',arr)); this.flash('Added — edit the title and description'); }
  offeringDel(i){ if(!confirm('Remove this item?'))return; this.pushHist(); const arr=((this.state.data.meditation.offerings)||[]).slice(); arr.splice(i,1); this.save(this.setIn(this.state.data,'meditation.offerings',arr)); this.flash('Removed'); }
  offeringMove(i,dir){ const arr=((this.state.data.meditation.offerings)||[]).slice(); const j=i+dir; if(j<0||j>=arr.length)return; this.pushHist(); [arr[i],arr[j]]=[arr[j],arr[i]]; this.save(this.setIn(this.state.data,'meditation.offerings',arr)); }
  dupBlock(route,i){ this.mutate(d=>{ const arr=d.blocks[route]; arr.splice(i+1,0,this.cloneBlock(arr[i])); }); this.setState({selBlock:{route,i:i+1}}); this.flash('Block duplicated'); }
  insertZone(route,at){ const h=React.createElement,P=this.P; return h('div',{key:'ins'+at,title:'Insert a new block here',onClick:()=>{ this._insertAt=at; this.setState({blkPick:route}); },style:{height:22,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',opacity:.6,transition:'opacity .15s'},onMouseEnter:e=>e.currentTarget.style.opacity=1,onMouseLeave:e=>e.currentTarget.style.opacity=.6},
      h('div',{style:{height:0,borderTop:'2px dashed '+P.gold,flex:1,maxWidth:160}}),
      h('div',{style:{margin:'0 8px',padding:'2px 10px 2px 8px',height:22,borderRadius:999,background:P.gold,color:P.maroonD,display:'flex',alignItems:'center',gap:4,font:'700 12px '+this.HEAD,lineHeight:1,boxShadow:'0 2px 6px rgba(0,0,0,.2)'}},'＋ Add'),
      h('div',{style:{height:0,borderTop:'2px dashed '+P.gold,flex:1,maxWidth:160}})); }
  CHILD_TYPES = ['heading','text','image','button','iconbox','quote','divider','spacer'];
  blockDragStart(e,route,from){ if(e.button&&e.button!==0) return; e.preventDefault(); e.stopPropagation(); this._bd={route,from,to:from,col:null}; this.setState({_dragging:true,_dragRoute:route,_dropAt:from,_colDrop:null}); try{ document.body.style.userSelect='none'; }catch(_){}
    const move=ev=>{ if(!this._bd) return; const x=ev.clientX,y=ev.clientY; let colPath=null; try{ const elAt=document.elementFromPoint(x,y); const colEl=elAt&&elAt.closest&&elAt.closest('[data-coldrop]'); if(colEl) colPath=colEl.getAttribute('data-coldrop'); }catch(_){}
      const blk=(this.state.data.blocks[route]||[])[from]; const compatible=blk&&this.CHILD_TYPES.indexOf(blk.type)>-1;
      if(colPath&&compatible){ this._bd.col=colPath; this._bd.to=from; if(this.state._colDrop!==colPath) this.setState({_colDrop:colPath,_dropAt:null}); return; }
      this._bd.col=null; if(this.state._colDrop) this.setState({_colDrop:null});
      const els=[...document.querySelectorAll('[data-blkroute="'+route+'"]')]; let to=els.length; for(let k=0;k<els.length;k++){ const r=els[k].getBoundingClientRect(); if(y < r.top + r.height/2){ to=k; break; } } this._bd.to=to; if(this.state._dropAt!==to) this.setState({_dropAt:to}); };
    const up=()=>{ window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up); try{ document.body.style.userSelect=''; }catch(_){} const bd=this._bd; this._bd=null; this.setState({_dragging:false,_dragRoute:null,_dropAt:null,_colDrop:null}); if(!bd) return;
      if(bd.col){ // move the block INTO a column
        this.mutate(d=>{ const arr=d.blocks[route]; const blk=JSON.parse(JSON.stringify(arr[bd.from])); const items=this.getIn(d,bd.col); if(items&&Array.isArray(items)){ items.push(blk); arr.splice(bd.from,1); } }); this.setState({selBlock:null}); this.flash('Moved into column'); return; }
      let from2=bd.from, to=bd.to; if(to>from2) to--; if(to!==from2&&to>=0){ this.mutate(d=>this.arrMove(d.blocks[route],from2,to)); const len=((this.state.data.blocks[route])||[]).length; this.setState({selBlock:{route,i:Math.max(0,Math.min(to,len-1))}}); } };
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up); }
  childDup(itemsPath,j){ this.pushHist(); const arr=(this.getIn(this.state.data,itemsPath)||[]).slice(); arr.splice(j+1,0,this.cloneBlock(arr[j])); this.save(this.setIn(this.state.data,itemsPath,arr)); this.setState({selBlock:{nested:true,path:itemsPath+'.'+(j+1),route:this.state.route}}); }
  setBlkStyle(route,i,patch){ this.mutate(d=>{ const b=d.blocks[route][i]; b._s={...(b._s||{}),...patch}; }); }
  setBlk(route,i,patch){ this.mutate(d=>{ Object.assign(d.blocks[route][i],patch); }); }
  setBlkLive(route,i,patch){ const nd=JSON.parse(JSON.stringify(this.state.data)); if(!nd.blocks||!nd.blocks[route]||!nd.blocks[route][i])return; Object.assign(nd.blocks[route][i],patch); this.save(nd); }
  // ----- path-based block helpers (work for top-level AND nested column children) -----
  patchBlk(path,patch){ this.pushHist(); const cur=this.getIn(this.state.data,path)||{}; this.save(this.setIn(this.state.data,path,{...cur,...patch})); }
  patchBlkLive(path,patch){ const cur=this.getIn(this.state.data,path)||{}; this.save(this.setIn(this.state.data,path,{...cur,...patch})); }
  patchBlkStyle(path,patch){ this.pushHist(); const cur=this.getIn(this.state.data,path)||{}; const ns={...(cur._s||{}),...patch}; this.save(this.setIn(this.state.data,path,{...cur,_s:ns})); }
  imgResizeHandle(path){ const P=this.P; return React.createElement('div',{ 'data-imgctrl':'1', title:'Drag left or right to resize', draggable:false, onDragStart:e=>e.preventDefault(), onPointerDown:e=>this.imgResizeStart(e,path), style:{position:'absolute',bottom:-12,left:'50%',transform:'translateX(-50%)',display:'flex',alignItems:'center',gap:5,padding:'4px 11px',borderRadius:999,background:P.gold,color:P.maroonD,border:'2px solid #fff',boxShadow:'0 2px 9px rgba(0,0,0,.34)',cursor:'ew-resize',zIndex:12,font:'700 12px '+this.HEAD,whiteSpace:'nowrap',touchAction:'none',userSelect:'none'} }, '↔ resize'); }
  imgResizeStart(e,path){ e.preventDefault(); e.stopPropagation(); const inner=e.currentTarget.parentNode; const figure=inner&&inner.parentNode; const pw=(figure&&figure.getBoundingClientRect().width)||1; const startW=((this.getIn(this.state.data,path)||{}).w)||100; const sx=e.clientX; this.pushHist();
    const dragAnc=e.currentTarget.closest&&e.currentTarget.closest('[draggable="true"]'); if(dragAnc) dragAnc.setAttribute('draggable','false'); // stop the block's native drag from hijacking the resize
    const move=ev=>{ const dx=ev.clientX-sx; let w=Math.round(startW + dx/pw*100); w=Math.max(10,Math.min(100,w)); this._liveResize=true; this.patchBlkLive(path,{w}); };
    const up=()=>{ window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up); if(dragAnc) dragAnc.setAttribute('draggable','true'); this._liveResize=false; this.forceUpdate(); };
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up); }
  // ----- column (row) helpers -----
  childAdd(itemsPath,type){ this.pushHist(); const arr=(this.getIn(this.state.data,itemsPath)||[]).slice(); arr.push(this.blockTpl(type)); this.save(this.setIn(this.state.data,itemsPath,arr)); this.setState({colAdd:null,selBlock:{nested:true,path:itemsPath+'.'+(arr.length-1),route:this.state.route}}); }
  childDel(itemsPath,j){ this.pushHist(); const arr=(this.getIn(this.state.data,itemsPath)||[]).slice(); arr.splice(j,1); this.save(this.setIn(this.state.data,itemsPath,arr)); }
  childMove(itemsPath,j,dir){ const arr=(this.getIn(this.state.data,itemsPath)||[]).slice(); const k=j+dir; if(k<0||k>=arr.length)return; this.pushHist(); [arr[j],arr[k]]=[arr[k],arr[j]]; this.save(this.setIn(this.state.data,itemsPath,arr)); this.setState({selBlock:{nested:true,path:itemsPath+'.'+k,route:this.state.route}}); }
  colAddCol(blockPath){ this.pushHist(); const blk=this.getIn(this.state.data,blockPath); const cols=(blk.cols||[]).slice(); if(cols.length>=4){ this.flash('Maximum 4 columns'); return; } cols.push({w:1,items:[]}); this.save(this.setIn(this.state.data,blockPath,{...blk,cols})); }
  colDelCol(blockPath,ci){ const blk=this.getIn(this.state.data,blockPath); const cols=(blk.cols||[]).slice(); if(cols.length<=1){ this.flash('A row needs at least one column'); return; } if(!confirm('Delete this column and its contents?'))return; this.pushHist(); cols.splice(ci,1); this.save(this.setIn(this.state.data,blockPath,{...blk,cols})); this.setState({selBlock:null}); }
  colEqualize(blockPath){ this.pushHist(); const blk=this.getIn(this.state.data,blockPath); const cols=(blk.cols||[]).map(c=>({...c,w:1})); this.save(this.setIn(this.state.data,blockPath,{...blk,cols})); }
  colResizeStart(e,blockPath,ci){ e.preventDefault(); e.stopPropagation(); const colEl=e.currentTarget.parentNode; const rowEl=colEl&&colEl.parentNode; const rowW=(rowEl&&rowEl.getBoundingClientRect().width)||1; const blk=this.getIn(this.state.data,blockPath); const cols=blk.cols||[]; const total=cols.reduce((a,c)=>a+(c.w||1),0); const wA=cols[ci].w||1, wB=cols[ci+1].w||1; const sx=e.clientX; this.pushHist();
    const dragAnc=e.currentTarget.closest&&e.currentTarget.closest('[draggable="true"]'); if(dragAnc) dragAnc.setAttribute('draggable','false');
    const move=ev=>{ const dx=ev.clientX-sx; let frac=(dx/rowW)*total; let na=wA+frac, nb=wB-frac; const min=0.25; if(na<min){ nb-=(min-na); na=min; } if(nb<min){ na-=(min-nb); nb=min; } this._liveResize=true; const nd=JSON.parse(JSON.stringify(this.state.data)); const cc=this.getIn(nd,blockPath).cols; cc[ci].w=Math.round(na*100)/100; cc[ci+1].w=Math.round(nb*100)/100; this.save(nd); };
    const up=()=>{ window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up); if(dragAnc) dragAnc.setAttribute('draggable','true'); this._liveResize=false; this.forceUpdate(); };
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up); }
  // ----- before/after comparison slider drag -----
  cmpDrag(e,id){ e.preventDefault(); e.stopPropagation(); const box=e.currentTarget.closest('[data-cmp]'); if(!box)return; const rect=box.getBoundingClientRect(); const dragAnc=e.currentTarget.closest&&e.currentTarget.closest('[draggable="true"]'); if(dragAnc) dragAnc.setAttribute('draggable','false');
    const move=ev=>{ let p=((ev.clientX-rect.left)/rect.width)*100; p=Math.max(0,Math.min(100,Math.round(p))); this.setUi(id,'cmp',p); };
    const up=()=>{ window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up); if(dragAnc) dragAnc.setAttribute('draggable','true'); };
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up); }
  // ----- image hotspot marker drag (edit mode) -----
  hotDrag(e,base,j){ e.preventDefault(); e.stopPropagation(); const box=e.currentTarget.closest('[data-hot]'); if(!box)return; const rect=box.getBoundingClientRect(); const dragAnc=e.currentTarget.closest&&e.currentTarget.closest('[draggable="true"]'); if(dragAnc) dragAnc.setAttribute('draggable','false'); this.pushHist();
    const move=ev=>{ let x=((ev.clientX-rect.left)/rect.width)*100, y=((ev.clientY-rect.top)/rect.height)*100; x=Math.max(0,Math.min(100,Math.round(x))); y=Math.max(0,Math.min(100,Math.round(y))); this.patchBlkLive(base+'.points.'+j,{x,y}); };
    const up=()=>{ window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up); if(dragAnc) dragAnc.setAttribute('draggable','true'); };
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up); }
  uiState(id,key,def){ this._ui=this._ui||{}; const k=id+'~'+key; return this._ui[k]!==undefined?this._ui[k]:def; }
  setUi(id,key,val){ this._ui=this._ui||{}; this._ui[id+'~'+key]=val; this.forceUpdate(); }
  embedUrl(url){ if(!url) return ''; url=String(url).trim(); if(url.indexOf('youtu')>=0){ let id=''; if(url.indexOf('youtu.be/')>=0) id=url.split('youtu.be/')[1]; else if(url.indexOf('watch?v=')>=0) id=url.split('watch?v=')[1]; else if(url.indexOf('/embed/')>=0) id=url.split('/embed/')[1]; else if(url.indexOf('/shorts/')>=0) id=url.split('/shorts/')[1]; if(id){ id=id.split('&')[0].split('?')[0].split('/')[0]; return 'https://www.youtube.com/embed/'+id; } } if(url.indexOf('vimeo.com')>=0){ const p=url.split('vimeo.com/')[1]; if(p) return 'https://player.vimeo.com/video/'+p.split('/').pop().split('?')[0]; } if(url.indexOf('dailymotion')>=0||url.indexOf('dai.ly/')>=0){ const p=url.split('/video/')[1]||url.split('dai.ly/')[1]; if(p) return 'https://www.dailymotion.com/embed/video/'+p.split('?')[0].split('_')[0]; } return url; }

  addBtn(label,fn){ const h=React.createElement,P=this.P; return h('button',{onClick:fn,style:{display:'inline-flex',alignItems:'center',gap:9,padding:'12px 22px',borderRadius:999,border:'2px dashed '+P.gold,background:'rgba(199,154,62,.08)',color:P.maroon,cursor:'pointer',font:'700 14px '+this.HEAD}}, '\uff0b '+label); }

  renderBlocks(route,compact){ const h=React.createElement,P=this.P,d=this.state.data; const em=this.state.editMode;
    if(route==='admin') return null;
    const arr=(d.blocks&&d.blocks[route])||[]; if(!em && !arr.length) return null;
    if(!em) return h('div',{style:{position:'relative',background:'transparent'}}, ...arr.map((b,i)=>this.blockShell(route,b,i)));
    const showDrop=this.state._dragging&&this.state._dragRoute===route;
    const dropLine=()=>h('div',{key:'dl',style:{height:4,background:P.red,borderRadius:3,margin:'2px 0',boxShadow:'0 0 8px '+P.red}});
    const kids=[]; arr.forEach((b,i)=>{ if(showDrop&&this.state._dropAt===i) kids.push(dropLine()); kids.push(this.insertZone(route,i)); kids.push(this.blockShell(route,b,i)); });
    if(showDrop&&this.state._dropAt===arr.length) kids.push(dropLine());
    kids.push(this.insertZone(route,arr.length));
    return h('div',{style:{position:'relative',background:'transparent'}}, ...kids,
      compact?null:h('div',{style:{display:'flex',justifyContent:'center',padding:'24px 0 50px'}}, this.addBtn('Add a block',()=>{ this._insertAt=null; this.setState({blkPick:route}); }))); }
  gapBlocks(scope){ return this.renderBlocks(scope,true); }

  blockShell(route,b,i){ const h=React.createElement,P=this.P; const em=this.state.editMode;
    const sel=this.state.selBlock&&this.state.selBlock.route===route&&this.state.selBlock.i===i;
    const inner=this.renderBlock(route,b,i);
    if(!em) return h('div',{key:b.id||i,id:'aokblk-'+(b.id||i)}, inner);
    const tb=(label,title,fn,danger)=>h('button',{title,onMouseDown:e=>e.preventDefault(),onClick:e=>{e.stopPropagation();fn();},style:{width:27,height:27,borderRadius:7,border:'none',cursor:'pointer',background:danger?P.bad:'rgba(28,10,6,.85)',color:P.cream,font:'700 13px '+this.HEAD,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}},label);
    const dragging=this.state._dragging&&this._bd&&this._bd.route===route&&this._bd.from===i;
    return h('div',{key:b.id||i,id:'aokblk-'+(b.id||i),'data-blkroute':route,
        onClick:()=>this.setState({selBlock:{route,i}}),
        style:{position:'relative',outline:sel?'2px solid '+P.gold:'1px dashed rgba(58,14,8,.22)',outlineOffset:-1,opacity:dragging?.45:1}},
      h('div',{contentEditable:false,style:{position:'absolute',top:8,right:8,zIndex:40,display:'flex',gap:4}},
        h('span',{title:'Drag to move this block up or down',onPointerDown:e=>this.blockDragStart(e,route,i),style:{width:27,height:27,borderRadius:7,background:'rgba(28,10,6,.85)',color:P.goldL,display:'flex',alignItems:'center',justifyContent:'center',cursor:'grab',font:'700 13px '+this.HEAD,touchAction:'none'}},'\u2630'),
        tb('\u2191','Move up',()=>{ this.mutate(d=>this.arrMove(d.blocks[route],i,i-1)); this.setState({selBlock:{route,i:Math.max(0,i-1)}}); }),
        tb('\u2193','Move down',()=>{ this.mutate(d=>this.arrMove(d.blocks[route],i,i+1)); const len=((this.state.data.blocks[route])||[]).length; this.setState({selBlock:{route,i:Math.min(len-1,i+1)}}); }),
        tb('\u2699','Style',()=>this.setState({selBlock:{route,i}})),
        tb('\u29c9','Duplicate',()=>this.dupBlock(route,i)),
        tb('\uff0b','Add a block below',()=>{ this._insertAt=i+1; this.setState({blkPick:route}); }),
        tb('\u2715','Delete',()=>{ if(confirm('Delete this block?')){ this.mutate(d=>d.blocks[route].splice(i,1)); this.setState({selBlock:null}); } },true)),
      inner); }

  renderBlock(route,b,i){ const h=React.createElement,P=this.P; const s=b._s||{}; const base='blocks.'+route+'.'+i;
    const padY=s.padY!=null?s.padY:54; const sec={padding:padY+'px 0',background:s.bg||'transparent',textAlign:s.align||'left',marginTop:(s.mt||0)+'px',marginBottom:(s.mb||0)+'px'};
    const W=s.maxW||720; const wrap=ch=>h('div',{style:{maxWidth:W,margin:'0 auto',padding:'0 24px'}},ch);
    switch(b.type){
      case 'heading': return h('section',{style:sec}, wrap(this.etext(base+'.text',{tag:'h2',style:{font:'800 clamp(26px,3.4vw,40px) '+this.HEAD,color:s.color||P.maroon,margin:0,letterSpacing:'-.02em'}})));
      case 'text': return h('section',{style:sec}, wrap(this.etext(base+'.text',{tag:'div',className:'aok-link',style:{font:'400 17px/1.75 Plus Jakarta Sans',color:s.color||P.ink,whiteSpace:'pre-line'}})));
      case 'image': { const wpct=Math.max(10,Math.min(100,b.w||100)); const al=b.align||'center'; const mar=al==='left'?'0 auto 0 0':al==='right'?'0 0 0 auto':'0 auto'; const ar=b.ar||'16/9';
        const selI=this.state.selBlock&&this.state.selBlock.route===route&&this.state.selBlock.i===i;
        return h('section',{style:sec}, wrap(h('figure',{style:{margin:0}},
          h('div',{style:{position:'relative',width:wpct+'%',margin:mar,maxWidth:'100%',transition:this._liveResize?'none':'width .12s'}},
            this.eimg(base+'.src',{alt:b.alt||'',title:b.desc||'',radius:16,placeholder:'Click ↻ Replace\nto add an image',style:{width:'100%',aspectRatio:ar}}),
            (this.state.editMode&&selI&&b.src)? this.imgResizeHandle(base):null),
          (b.caption)? h('figcaption',{style:{textAlign:al==='left'?'left':al==='right'?'right':'center',font:'italic 400 13.5px/1.5 Plus Jakarta Sans',color:P.muted,margin:'9px 0 0'}}, b.caption):null))); }
      case 'columns': { const cols=b.cols||[]; const gap=b.gap!=null?b.gap:24; const em=this.state.editMode; const tmpl=cols.map(c=>(c.w||1)+'fr').join(' '); const minH=b.minH||0;
        const row=h('div',{style:{display:'grid',gridTemplateColumns:tmpl,gap:gap+'px',alignItems:'stretch'}},
          ...cols.map((col,ci)=>{ const colItemsPath=base+'.cols.'+ci+'.items'; const colHot=em&&this.state._colDrop===colItemsPath; return h('div',{key:ci,'data-coldrop':em?colItemsPath:undefined,style:{position:'relative',minWidth:0,minHeight:Math.max(minH,em?56:0)||undefined,outline:colHot?'2px solid '+P.red:(em?'1px dashed rgba(58,14,8,.22)':'none'),background:colHot?'rgba(125,31,18,.07)':(col.bg||'transparent'),borderRadius:8,padding:em?'8px':0}},
            ...((col.items||[]).map((it,j)=>this.renderChild(base+'.cols.'+ci+'.items.'+j, it, j))),
            em? h('div',{contentEditable:false,style:{display:'flex',justifyContent:'center',padding:'6px 0 2px'}}, h('button',{onClick:e=>{e.stopPropagation(); this.setState({colAdd:base+'.cols.'+ci+'.items'});},style:{padding:'7px 13px',borderRadius:8,border:'1px dashed '+P.gold,background:'rgba(199,154,62,.08)',color:P.maroon,cursor:'pointer',font:'700 12.5px '+this.HEAD}},'＋ Add here')):null,
            (em&&ci<cols.length-1)? h('div',{contentEditable:false,'data-imgctrl':'1',draggable:false,onDragStart:e=>e.preventDefault(),title:'Drag to change column widths',onPointerDown:e=>this.colResizeStart(e,base,ci),style:{position:'absolute',top:0,bottom:0,right:-(gap/2)-4,width:10,cursor:'ew-resize',zIndex:11,display:'flex',alignItems:'center',justifyContent:'center',touchAction:'none'}}, h('div',{style:{width:4,height:38,borderRadius:3,background:P.gold,boxShadow:'0 0 0 2px #fff'}})):null ); }));
        return h('section',{style:{padding:(s.padY!=null?s.padY:24)+'px 0',background:s.bg||'transparent'}}, h('div',{style:{maxWidth:s.maxW||1100,margin:'0 auto',padding:'0 24px'}}, row)); }
      case 'button': { const variant=s.btnVariant||'solid'; const fx=s.hoverFx||'lift'; const vs=this.btnVariants(); const big=s.btnSize==='lg'; const sm=s.btnSize==='sm';
        return h('section',{style:sec}, wrap(h('div',{style:{textAlign:s.align||'left'}}, h('a',{className:'aok-btn aok-fx-'+fx,onClick:()=>{ if(!this.state.editMode) this.go(b.route||'contact'); },style:{display:'inline-flex',alignItems:'center',gap:9,cursor:'pointer',borderRadius:999,border:'1px solid transparent',font:'600 '+(big?'17px':sm?'13px':'15px')+' '+this.HEAD,padding:big?'16px 32px':sm?'9px 18px':'14px 26px',...vs[variant]}}, b.label||'Button')))); }
      case 'quote': return h('section',{style:sec}, wrap(h('blockquote',{style:{margin:0,textAlign:'center'}}, h('div',{style:{font:'400 42px '+this.HEAD,color:P.gold,marginBottom:4}},'\u201c'), this.etext(base+'.text',{tag:'p',style:{font:'500 clamp(20px,2.7vw,28px)/1.45 '+this.HEAD,color:s.color||P.maroon,margin:0,letterSpacing:'-.01em'}}), this.etext(base+'.cite',{tag:'div',style:{marginTop:16,font:'600 13px '+this.HEAD,letterSpacing:'.1em',textTransform:'uppercase',color:P.muted}}))));
      case 'iconlist': return h('section',{style:sec}, wrap(h('div',{style:{display:'grid',gap:13}}, ...(b.items||[]).map((it,j)=>h('div',{key:j,style:{display:'flex',gap:12,alignItems:'flex-start'}}, h('span',{style:{color:P.gold,font:'700 17px '+this.HEAD,marginTop:1,flex:'0 0 auto'}},'\u2713'), this.etext(base+'.items.'+j,{tag:'p',style:{font:'400 16px/1.6 Plus Jakarta Sans',color:s.color||P.ink,margin:0}}))))));
      case 'cta': return h('section',{style:{padding:padY+'px 0',background:s.bg||'transparent'}}, h('div',{style:{background:'linear-gradient(160deg,'+P.red+','+P.redD+')',color:P.cream,position:'relative',overflow:'hidden'}}, h('div',{style:{position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(255,255,255,.4) 1px,transparent 1px)',backgroundSize:'30px 30px',opacity:.12}}), h('div',{style:{maxWidth:760,margin:'0 auto',padding:'64px 24px',textAlign:'center',position:'relative'}}, this.etext(base+'.title',{tag:'h2',style:{font:'800 clamp(26px,3.4vw,38px) '+this.HEAD,margin:'0 0 12px',color:P.cream}}), this.etext(base+'.sub',{tag:'p',style:{font:'400 17px/1.6 Plus Jakarta Sans',color:'rgba(247,239,224,.88)',maxWidth:540,margin:'0 auto 26px'}}), this.btn(b.label||'Book now',()=>this.go(b.route||'contact'),{variant:'gold'}))));
      case 'divider': return h('div',{style:sec}, h('div',{style:{maxWidth:W,margin:'0 auto',padding:'0 24px'}}, h('hr',{style:{border:0,borderTop:'1px solid '+P.line,margin:0}})));
      case 'spacer': return h('div',{style:{height:(b.h||48),background:s.bg||'transparent'}});
      case 'video': { const src=this.embedUrl(b.url); return h('section',{style:sec}, wrap(h('div',{style:{position:'relative',width:'100%',aspectRatio:'16/9',borderRadius:14,overflow:'hidden',background:'#000'}}, src? h('iframe',{src,allow:'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',allowFullScreen:true,style:{width:'100%',height:'100%',border:0}}) : h('div',{style:{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',font:'600 14px '+this.HEAD}},'Paste a video URL in the settings panel')))); }
      case 'imagebox': return h('section',{style:sec}, wrap(h('div',{style:{textAlign:s.align||'center'}}, h('div',{style:{borderRadius:14,overflow:'hidden',marginBottom:18}}, this.eimg(base+'.src',{alt:b.title||'',placeholder:'image',style:{width:'100%',aspectRatio:'16/10'}})), this.etext(base+'.title',{tag:'h3',style:{font:'800 22px '+this.HEAD,color:s.color||P.maroon,margin:'0 0 8px'}}), this.etext(base+'.text',{tag:'p',style:{font:'400 15.5px/1.7 Plus Jakarta Sans',color:P.muted,margin:0}}))));
      case 'iconbox': return h('section',{style:sec}, wrap(h('div',{style:{textAlign:s.align||'center'}}, h('div',{style:{font:'400 46px '+this.HEAD,color:P.gold,marginBottom:14,lineHeight:1}}, b.icon||'✨'), this.etext(base+'.title',{tag:'h3',style:{font:'800 21px '+this.HEAD,color:s.color||P.maroon,margin:'0 0 8px'}}), this.etext(base+'.text',{tag:'p',style:{font:'400 15.5px/1.7 Plus Jakarta Sans',color:P.muted,margin:0}}))));
      case 'gallery': { const cols=b.cols||3; return h('section',{style:sec}, wrap(h('div',{style:{display:'grid',gridTemplateColumns:'repeat('+cols+',1fr)',gap:12}}, ...(b.images||[]).map((im,j)=>h('div',{key:j,style:{borderRadius:12,overflow:'hidden'}}, this.eimg(base+'.images.'+j,{alt:'',placeholder:'photo',style:{width:'100%',aspectRatio:'1/1'}})))))); }
      case 'carousel': { const imgs=b.images||[]; const n=Math.max(imgs.length,1); const idx=this.uiState(b.id,'idx',0)%n; const go=k=>this.setUi(b.id,'idx',(k%n+n)%n); return h('section',{style:sec}, wrap(h('div',{style:{position:'relative',borderRadius:16,overflow:'hidden',background:P.bgAlt}}, this.eimg(base+'.images.'+idx,{alt:'',placeholder:'slide image',style:{width:'100%',aspectRatio:'16/9'}}), imgs.length>1? h('div',{contentEditable:false,style:{position:'absolute',top:0,bottom:0,left:0,right:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 12px',pointerEvents:'none'}}, h('button',{onClick:()=>go(idx-1),style:{pointerEvents:'auto',width:40,height:40,borderRadius:'50%',border:'none',background:'rgba(28,10,6,.6)',color:'#fff',cursor:'pointer',font:'700 20px '+this.HEAD}},'‹'), h('button',{onClick:()=>go(idx+1),style:{pointerEvents:'auto',width:40,height:40,borderRadius:'50%',border:'none',background:'rgba(28,10,6,.6)',color:'#fff',cursor:'pointer',font:'700 20px '+this.HEAD}},'›')):null, imgs.length>1? h('div',{contentEditable:false,style:{position:'absolute',bottom:12,left:0,right:0,display:'flex',justifyContent:'center',gap:7}}, ...imgs.map((x,j)=>h('span',{key:j,style:{width:8,height:8,borderRadius:'50%',background:j===idx?P.gold:'rgba(255,255,255,.65)'}}))):null))); }
      case 'testimonial': return h('section',{style:sec}, wrap(h('div',{style:{background:P.card,border:'1px solid '+P.line,borderRadius:18,padding:'32px 30px',textAlign:'center',maxWidth:600,margin:'0 auto'}}, h('div',{style:{display:'flex',justifyContent:'center',gap:3,marginBottom:14,color:P.gold,fontSize:18}}, ...Array.from({length:Math.max(0,b.stars||0)}).map((x,j)=>h('span',{key:j},'★'))), this.etext(base+'.text',{tag:'p',style:{font:'500 19px/1.6 '+this.HEAD,color:P.maroon,margin:'0 0 20px',letterSpacing:'-.01em'}}), h('div',{style:{display:'flex',alignItems:'center',justifyContent:'center',gap:12}}, h('div',{style:{width:48,height:48,borderRadius:'50%',overflow:'hidden',flex:'0 0 auto'}}, this.eimg(base+'.src',{alt:b.author||'',placeholder:'photo',style:{width:'100%',height:'100%'}})), h('div',{style:{textAlign:'left'}}, this.etext(base+'.author',{tag:'div',style:{font:'700 15px '+this.HEAD,color:P.ink}}), this.etext(base+'.role',{tag:'div',style:{font:'400 13px Plus Jakarta Sans',color:P.muted}}))))));
      case 'social': { const map={facebook:['f','#1877f2'],instagram:['◉','#d6249f'],youtube:['▶','#ff0000'],whatsapp:['✆','#25d366'],x:['X','#111111'],linkedin:['in','#0a66c2']}; const jc=s.align==='center'?'center':s.align==='right'?'flex-end':'flex-start'; return h('section',{style:sec}, wrap(h('div',{style:{display:'flex',gap:12,justifyContent:jc,flexWrap:'wrap'}}, ...(b.links||[]).map((lk,j)=>{ const m=map[lk.net]||['•',P.maroon]; return h('a',{key:j,href:lk.url||'#',target:'_blank',rel:'noopener',onClick:e=>{ if(this.state.editMode) e.preventDefault(); },style:{width:46,height:46,borderRadius:'50%',background:m[1],color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',font:'700 17px '+this.HEAD,textDecoration:'none'}},m[0]); })))); }
      case 'counter': return h('section',{style:sec}, wrap(h('div',{style:{textAlign:s.align||'center'}}, h('div',{style:{font:'800 clamp(40px,7vw,68px) '+this.HEAD,color:s.color||P.maroon,lineHeight:1,letterSpacing:'-.02em'}}, (Number(b.value)||0).toLocaleString()+(b.suffix||'')), this.etext(base+'.label',{tag:'div',style:{font:'600 14px '+this.HEAD,color:P.muted,marginTop:10,letterSpacing:'.05em',textTransform:'uppercase'}}))));
      case 'progress': { const pct=Math.max(0,Math.min(100,Number(b.pct)||0)); return h('section',{style:sec}, wrap(h('div',null, h('div',{style:{display:'flex',justifyContent:'space-between',marginBottom:8}}, this.etext(base+'.label',{tag:'span',style:{font:'700 14px '+this.HEAD,color:s.color||P.maroon}}), h('span',{style:{font:'700 14px '+this.HEAD,color:P.gold}},pct+'%')), h('div',{style:{height:12,borderRadius:999,background:P.bgAlt,overflow:'hidden'}}, h('div',{style:{height:'100%',width:pct+'%',borderRadius:999,background:'linear-gradient(90deg,'+P.gold+','+P.red+')',transition:'width .6s'}}))))); }
      case 'rating': { const mx=b.max||5,nn=Math.max(0,Math.min(mx,b.stars||0)); const jc=s.align==='center'?'center':s.align==='right'?'flex-end':'flex-start'; return h('section',{style:sec}, wrap(h('div',{style:{display:'flex',gap:5,justifyContent:jc,fontSize:30,color:P.gold}}, ...Array.from({length:mx}).map((x,j)=>h('span',{key:j,style:{opacity:j<nn?1:.25}},'★'))))); }
      case 'alert': { const tones={info:[P.maroon,'#f3ece0'],success:['#2e7d4f','#e4f3e8'],warning:['#9a6a0b','#fbf3df'],error:[P.bad||'#b4452f','#fbe9e3']}; const tn=tones[b.tone||'info']; return h('section',{style:sec}, wrap(h('div',{style:{borderRadius:12,padding:'16px 18px',background:tn[1],borderLeft:'4px solid '+tn[0]}}, this.etext(base+'.title',{tag:'div',style:{font:'700 15px '+this.HEAD,color:tn[0],marginBottom:4}}), this.etext(base+'.text',{tag:'div',style:{font:'400 14.5px/1.6 Plus Jakarta Sans',color:P.ink}})))); }
      case 'map': { const q=encodeURIComponent(b.query||''); return h('section',{style:sec}, wrap(h('div',{style:{borderRadius:14,overflow:'hidden',aspectRatio:'16/9',border:'1px solid '+P.line}}, q? h('iframe',{title:'map',src:'https://www.google.com/maps?q='+q+'&output=embed',style:{width:'100%',height:'100%',border:0}}) : h('div',{style:{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',color:P.muted,font:'600 14px '+this.HEAD,background:P.bgAlt}},'Add a location in the settings panel')))); }
      case 'tabs': { const items=b.items||[]; const act=Math.min(this.uiState(b.id,'tab',0),Math.max(items.length-1,0)); return h('section',{style:sec}, wrap(h('div',null, h('div',{style:{display:'flex',gap:6,borderBottom:'2px solid '+P.line,marginBottom:18,flexWrap:'wrap'}}, ...items.map((it,j)=>h('button',{key:j,onClick:()=>this.setUi(b.id,'tab',j),style:{padding:'10px 18px',border:'none',background:'transparent',cursor:'pointer',font:'700 15px '+this.HEAD,color:j===act?P.red:P.muted,borderBottom:'2px solid '+(j===act?P.red:'transparent'),marginBottom:-2}},it.t||('Tab '+(j+1))))), items[act]? this.etext(base+'.items.'+act+'.c',{tag:'div',className:'aok-link',style:{font:'400 16px/1.7 Plus Jakarta Sans',color:P.ink,whiteSpace:'pre-line'}}):null))); }
      case 'accordion': { const items=b.items||[]; const open=this.uiState(b.id,'acc',0); return h('section',{style:sec}, wrap(h('div',{style:{display:'grid',gap:10}}, ...items.map((it,j)=>h('div',{key:j,style:{border:'1px solid '+P.line,borderRadius:12,overflow:'hidden',background:P.card}}, h('button',{onClick:()=>this.setUi(b.id,'acc',open===j?-1:j),style:{width:'100%',display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'15px 18px',border:'none',background:'transparent',cursor:'pointer',textAlign:'left',font:'700 16px '+this.HEAD,color:P.maroon}}, h('span',null,it.q||('Item '+(j+1))), h('span',{style:{color:P.gold,fontSize:20,flex:'0 0 auto'}},open===j?'−':'＋')), open===j? h('div',{style:{padding:'0 18px 16px'}}, this.etext(base+'.items.'+j+'.a',{tag:'div',className:'aok-link',style:{font:'400 15px/1.7 Plus Jakarta Sans',color:P.ink,whiteSpace:'pre-line'}})):null))))); }
      case 'html': return h('section',{style:sec}, wrap(h('div',{dangerouslySetInnerHTML:{__html:b.code||''}})));
      case 'dualheading': return h('section',{style:sec}, wrap(h('h2',{style:{font:'800 clamp(28px,3.9vw,46px) '+this.HEAD,margin:0,letterSpacing:'-.02em',textAlign:s.align||'center',lineHeight:1.1,color:s.color||P.maroon}}, this.etext(base+'.a',{tag:'span',style:{color:'inherit'}}), ' ', this.etext(base+'.accent',{tag:'span',style:{color:s.accent||P.gold}}))));
      case 'fancytext': return h('section',{style:sec}, wrap(h('div',{style:{font:'800 clamp(26px,3.7vw,44px) '+this.HEAD,textAlign:s.align||'center',letterSpacing:'-.01em',lineHeight:1.15,color:s.color||P.maroon}}, this.etext(base+'.pre',{tag:'span'}), ' ', React.createElement(this.FancyText,{key:(b.words||[]).join('|'),words:b.words||[],style:{color:s.accent||P.red,fontWeight:800}}), ' ', this.etext(base+'.post',{tag:'span'}))));
      case 'toggle': { const open=this.uiState(b.id,'tg',false); const em=this.state.editMode; return h('section',{style:sec}, wrap(h('div',{style:{border:'1px solid '+P.line,borderRadius:12,overflow:'hidden',background:P.card}},
        h('div',{onClick:em?undefined:()=>this.setUi(b.id,'tg',!open),style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,padding:'15px 18px',cursor:em?'default':'pointer'}},
          em? this.etext(base+'.q',{tag:'span',style:{font:'700 16px '+this.HEAD,color:P.maroon}}) : h('span',{style:{font:'700 16px '+this.HEAD,color:P.maroon}},b.q),
          h('span',{onClick:em?()=>this.setUi(b.id,'tg',!open):undefined,style:{color:P.gold,fontSize:22,flex:'0 0 auto',cursor:'pointer',lineHeight:1}}, (open||em)?'−':'＋')),
        (open||em)? h('div',{style:{padding:'0 18px 16px'}}, this.etext(base+'.a',{tag:'div',className:'aok-link',style:{font:'400 15px/1.7 Plus Jakarta Sans',color:P.ink,whiteSpace:'pre-line'}})):null))); }
      case 'imagescroller': { const em=this.state.editMode; return h('section',{style:sec}, wrap(h('div',null,
        h('div',{className:'aok-scroll',style:{maxHeight:(b.h||340),overflowY:'auto',borderRadius:14,border:'1px solid '+P.line,background:P.bgAlt,position:'relative'}},
          b.src? h('img',{loading:'lazy',decoding:'async',src:b.src,alt:b.alt||'',title:b.desc||'',style:{width:'100%',display:'block'}}) : h('div',{style:{padding:'60px 20px',textAlign:'center',color:'#A68446',fontFamily:'monospace',fontSize:13,lineHeight:1.6}},'Upload a tall image —\nit will scroll inside this frame'),
          em? h('button',{onClick:e=>{e.stopPropagation(); const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.onchange=ev=>{ const f=ev.target.files[0]; if(!f)return; this.scaleImage(f,u=>this.commit(base+'.src',u),1600); }; inp.click();},style:{position:'absolute',top:10,right:10,zIndex:5,padding:'7px 12px',borderRadius:999,border:'none',background:'rgba(28,10,6,.82)',color:'#fff',cursor:'pointer',font:'600 12px '+this.HEAD}},'↻ '+(b.src?'Replace':'Upload')):null),
        h('div',{style:{textAlign:'center',font:'600 11px '+this.HEAD,color:P.muted,letterSpacing:'.12em',textTransform:'uppercase',marginTop:8}},'↕ Scroll to view')))); }
      case 'featurelist': return h('section',{style:sec}, wrap(h('div',{style:{display:'grid',gap:14}}, ...(b.items||[]).map((it,j)=>h('div',{key:j,style:{display:'flex',gap:14,alignItems:'flex-start'}},
        h('span',{style:{flex:'0 0 auto',width:36,height:36,borderRadius:10,background:'linear-gradient(180deg,'+P.maroon+','+P.redD+')',color:P.goldL,display:'flex',alignItems:'center',justifyContent:'center',font:'400 18px '+this.HEAD}}, it.icon||'✦'),
        this.etext(base+'.items.'+j+'.t',{tag:'div',style:{font:'500 16px/1.55 Plus Jakarta Sans',color:s.color||P.ink,paddingTop:6}}))))));
      case 'compare': { const pos=this.uiState(b.id,'cmp',50); const ar=b.ar||'16/10'; const em=this.state.editMode;
        const repl=field=>{ const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.onchange=ev=>{const f=ev.target.files[0];if(!f)return;this.scaleImage(f,u=>this.commit(base+'.'+field,u));}; inp.click(); };
        return h('section',{style:sec}, wrap(h('div',{'data-cmp':'1',style:{position:'relative',width:'100%',aspectRatio:ar,borderRadius:14,overflow:'hidden',border:'1px solid '+P.line,background:P.bgAlt,userSelect:'none'}},
          b.before? h('img',{loading:'lazy',decoding:'async',src:b.before,alt:'Before',draggable:false,style:{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}) : h('div',{style:{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#A68446',fontFamily:'monospace',fontSize:12}},'BEFORE image'),
          h('div',{style:{position:'absolute',inset:0,clipPath:'inset(0 '+(100-pos)+'% 0 0)'}}, b.after? h('img',{loading:'lazy',decoding:'async',src:b.after,alt:'After',draggable:false,style:{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}) : h('div',{style:{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'#7a6452',fontFamily:'monospace',fontSize:12,background:'#F7F2E9'}},'AFTER image')),
          h('span',{style:{position:'absolute',left:12,bottom:12,padding:'4px 10px',borderRadius:999,background:'rgba(28,10,6,.7)',color:'#fff',font:'600 11px '+this.HEAD}},'Before'),
          h('span',{style:{position:'absolute',right:12,bottom:12,padding:'4px 10px',borderRadius:999,background:'rgba(125,31,18,.85)',color:'#fff',font:'600 11px '+this.HEAD}},'After'),
          h('div',{style:{position:'absolute',top:0,bottom:0,left:pos+'%',width:2,background:'#fff',boxShadow:'0 0 6px rgba(0,0,0,.4)',transform:'translateX(-1px)',pointerEvents:'none'}}),
          h('div',{onPointerDown:e=>this.cmpDrag(e,b.id),style:{position:'absolute',top:'50%',left:pos+'%',transform:'translate(-50%,-50%)',width:40,height:40,borderRadius:'50%',background:'#fff',boxShadow:'0 2px 10px rgba(0,0,0,.4)',cursor:'ew-resize',display:'flex',alignItems:'center',justifyContent:'center',color:P.maroon,font:'700 16px '+this.HEAD,touchAction:'none',zIndex:5}},'⇄'),
          em? h('div',{contentEditable:false,style:{position:'absolute',top:10,left:'50%',transform:'translateX(-50%)',display:'flex',gap:8,zIndex:6}}, h('button',{onClick:()=>repl('before'),style:{padding:'6px 11px',borderRadius:999,border:'none',background:'rgba(28,10,6,.82)',color:'#fff',cursor:'pointer',font:'600 11px '+this.HEAD}},'↻ Before'), h('button',{onClick:()=>repl('after'),style:{padding:'6px 11px',borderRadius:999,border:'none',background:'rgba(125,31,18,.85)',color:'#fff',cursor:'pointer',font:'600 11px '+this.HEAD}},'↻ After')):null ))); }
      case 'hotspots': { const em=this.state.editMode; const pts=b.points||[]; const openH=this.uiState(b.id,'hot',-1);
        return h('section',{style:sec}, wrap(h('div',{'data-hot':'1',style:{position:'relative',borderRadius:14,overflow:'hidden',border:'1px solid '+P.line}},
          this.eimg(base+'.src',{alt:b.alt||'',placeholder:'Upload an image,\nthen add hotspots',style:{width:'100%',aspectRatio:b.ar||'16/9'}}),
          ...pts.map((pt,j)=>h('div',{key:j,contentEditable:false,style:{position:'absolute',left:(pt.x||50)+'%',top:(pt.y||50)+'%',transform:'translate(-50%,-50%)',zIndex:openH===j?7:5}},
            h('button',{onPointerDown:em?e=>this.hotDrag(e,base,j):undefined,onClick:e=>{e.stopPropagation(); this.setUi(b.id,'hot',openH===j?-1:j);},style:{width:28,height:28,borderRadius:'50%',border:'2px solid #fff',background:P.red,color:'#fff',cursor:em?'move':'pointer',font:'700 14px '+this.HEAD,boxShadow:'0 2px 8px rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center',touchAction:'none'}}, String(j+1)),
            openH===j? h('div',{style:{position:'absolute',top:36,left:'50%',transform:'translateX(-50%)',width:210,maxWidth:'70vw',background:P.maroonD,color:P.cream,borderRadius:10,padding:'12px 14px',boxShadow:'0 8px 24px rgba(0,0,0,.4)',zIndex:8}},
              em? this.etext(base+'.points.'+j+'.label',{tag:'div',style:{font:'700 13px '+this.HEAD,color:P.goldL,marginBottom:4}}) : h('div',{style:{font:'700 13px '+this.HEAD,color:P.goldL,marginBottom:4}},pt.label),
              em? this.etext(base+'.points.'+j+'.text',{tag:'div',style:{font:'400 12.5px/1.5 Plus Jakarta Sans',color:'rgba(247,239,224,.9)'}}) : h('div',{style:{font:'400 12.5px/1.5 Plus Jakarta Sans',color:'rgba(247,239,224,.9)'}},pt.text)):null ))))); }
      case 'audio': return h('section',{style:sec}, wrap(h('div',{style:{background:P.card,border:'1px solid '+P.line,borderRadius:14,padding:'18px 20px',display:'flex',flexDirection:'column',gap:12,maxWidth:520,margin:'0 auto'}},
        h('div',{style:{display:'flex',alignItems:'center',gap:12}}, h('div',{style:{width:44,height:44,borderRadius:'50%',background:'linear-gradient(180deg,'+P.maroon+','+P.redD+')',color:P.goldL,display:'flex',alignItems:'center',justifyContent:'center',font:'20px '+this.HEAD,flex:'0 0 auto'}},'♪'), this.etext(base+'.title',{tag:'div',style:{font:'700 16px '+this.HEAD,color:P.maroon}})),
        b.src? h('audio',{controls:true,src:b.src,style:{width:'100%'}}) : h('div',{style:{font:'400 13px Plus Jakarta Sans',color:P.muted}},'Add an audio file URL in the settings panel →'))));
      case 'stickyvideo': return h('section',{style:sec}, wrap(React.createElement(this.StickyVideo,{key:b.corner||'br',src:this.embedUrl(b.url),corner:b.corner||'br',disabled:this.state.editMode})));
      case 'offcanvas': { const open=this.uiState(b.id,'oc',false); const side=b.side||'right'; const em=this.state.editMode;
        return h('section',{style:sec}, wrap(h('div',{style:{textAlign:s.align||'center'}},
          h('button',{onClick:()=>this.setUi(b.id,'oc',true),className:'aok-btn aok-fx-lift',style:{display:'inline-flex',alignItems:'center',gap:8,padding:'13px 24px',borderRadius:999,border:'none',background:P.red,color:P.cream,cursor:'pointer',font:'600 15px '+this.HEAD,boxShadow:'0 6px 22px rgba(125,31,18,.28)'}}, b.label||'Open panel'),
          open? h('div',{style:{position:'fixed',inset:0,zIndex:2500,background:'rgba(28,10,6,.45)'},onClick:()=>this.setUi(b.id,'oc',false)},
            h('div',{onClick:e=>e.stopPropagation(),className:'aok-scroll',style:{position:'absolute',top:0,bottom:0,[side]:0,width:340,maxWidth:'85vw',background:P.bg,boxShadow:(side==='right'?'-14px':'14px')+' 0 50px rgba(0,0,0,.3)',padding:'24px 26px',overflowY:'auto',textAlign:'left'}},
              h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}, em? this.etext(base+'.title',{tag:'h3',style:{font:'800 20px '+this.HEAD,color:P.maroon,margin:0}}) : h('h3',{style:{font:'800 20px '+this.HEAD,color:P.maroon,margin:0}},b.title), h('button',{onClick:()=>this.setUi(b.id,'oc',false),style:{border:'none',background:'transparent',cursor:'pointer',font:'600 22px '+this.HEAD,color:P.muted}},'✕')),
              em? this.etext(base+'.text',{tag:'div',className:'aok-link',style:{font:'400 15px/1.7 Plus Jakarta Sans',color:P.ink,whiteSpace:'pre-line'}}) : h('div',{className:'aok-link',style:{font:'400 15px/1.7 Plus Jakarta Sans',color:P.ink,whiteSpace:'pre-line'}},b.text) )):null ))); }
      case 'pricingtable': { const plans=b.plans||[]; const n=plans.length||1; return h('section',{style:{padding:(s.padY!=null?s.padY:54)+'px 0',background:s.bg||'transparent',marginTop:(s.mt||0)+'px',marginBottom:(s.mb||0)+'px'}}, h('div',{style:{maxWidth:s.maxW||1100,margin:'0 auto',padding:'0 24px'}}, h('div',{style:{display:'grid',gridTemplateColumns:'repeat('+n+',1fr)',gap:18,alignItems:'stretch'}},
        ...plans.map((pl,j)=>{ const pbase=base+'.plans.'+j; const feat=pl.featured;
          return h('div',{key:pl.id||j,style:{display:'flex',flexDirection:'column',background:feat?'linear-gradient(160deg,'+P.maroon+','+P.maroonD+')':P.card,color:feat?P.cream:P.ink,border:'1px solid '+(feat?P.maroon:P.line),borderRadius:18,padding:'30px 26px',boxShadow:feat?'0 20px 44px rgba(58,14,8,.22)':'none',position:'relative'}},
            feat? h('div',{style:{position:'absolute',top:-12,left:'50%',transform:'translateX(-50%)',background:P.gold,color:P.maroonD,font:'700 11px '+this.HEAD,padding:'4px 14px',borderRadius:999,letterSpacing:'.08em',textTransform:'uppercase'}},'Popular'):null,
            this.etext(pbase+'.name',{tag:'div',style:{font:'700 18px '+this.HEAD,color:feat?P.goldL:P.maroon,marginBottom:8}}),
            this.etext(pbase+'.price',{tag:'div',style:{font:'800 36px '+this.HEAD,color:feat?P.cream:P.maroon,letterSpacing:'-.02em',lineHeight:1.1}}),
            this.etext(pbase+'.period',{tag:'div',style:{font:'400 13px Plus Jakarta Sans',color:feat?'rgba(247,239,224,.8)':P.muted,margin:'4px 0 18px'}}),
            h('div',{style:{display:'grid',gap:10,marginBottom:22,flex:1}}, ...(pl.features||[]).map((ft,k)=>h('div',{key:k,style:{display:'flex',gap:9,alignItems:'flex-start',font:'400 14px/1.5 Plus Jakarta Sans'}}, h('span',{style:{color:P.gold,fontWeight:700,flex:'0 0 auto'}},'✓'), this.etext(pbase+'.features.'+k,{tag:'span',style:{color:feat?'rgba(247,239,224,.92)':P.ink}})))),
            h('a',{onClick:()=>{if(!this.state.editMode)this.go(pl.route||'contact');},style:{textAlign:'center',cursor:'pointer',padding:'12px 18px',borderRadius:999,font:'600 14px '+this.HEAD,background:feat?P.gold:P.red,color:feat?P.maroonD:P.cream}}, pl.button||'Choose')); })))); }
      case 'pricemenu': return h('section',{style:sec}, wrap(h('div',{style:{display:'grid',gap:2}}, ...(b.items||[]).map((it,j)=>h('div',{key:it.id||j,style:{display:'flex',alignItems:'flex-end',gap:12,padding:'13px 0',borderBottom:'1px dashed '+P.line}},
        h('div',{style:{flex:1,minWidth:0}}, this.etext(base+'.items.'+j+'.name',{tag:'div',style:{font:'700 16px '+this.HEAD,color:P.maroon}}), this.etext(base+'.items.'+j+'.desc',{tag:'div',style:{font:'400 13.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:2}})),
        this.etext(base+'.items.'+j+'.price',{tag:'div',style:{font:'700 17px '+this.HEAD,color:P.red,flex:'0 0 auto',whiteSpace:'nowrap'}}))))));
      case 'countdown': return h('section',{style:sec}, wrap(h('div',{style:{textAlign:s.align||'center'}}, this.etext(base+'.title',{tag:'div',style:{font:'700 14px '+this.HEAD,color:P.maroon,marginBottom:14,letterSpacing:'.08em',textTransform:'uppercase'}}), React.createElement(this.Countdown,{key:(b.mode||'date')+(b.target||'')+(b.minutes||0),id:b.id,mode:b.mode||'date',target:b.target,minutes:b.minutes||60}))));
      case 'team': { const members=b.members||[]; const n=Math.min(members.length||1,4); const sm={facebook:['f','#1877f2'],instagram:['◉','#d6249f'],youtube:['▶','#ff0000'],whatsapp:['✆','#25d366'],x:['X','#111111'],linkedin:['in','#0a66c2']};
        return h('section',{style:sec}, wrap(h('div',{style:{display:'grid',gridTemplateColumns:'repeat('+n+',1fr)',gap:20}}, ...members.map((m,j)=>{ const mb=base+'.members.'+j;
          return h('div',{key:m.id||j,style:{background:P.card,border:'1px solid '+P.line,borderRadius:18,padding:'24px 22px',textAlign:'center'}},
            h('div',{style:{width:108,height:108,borderRadius:'50%',overflow:'hidden',margin:'0 auto 16px',border:'3px solid '+P.gold}}, this.eimg(mb+'.photo',{alt:m.name||'',placeholder:'photo',style:{width:'100%',height:'100%'}})),
            this.etext(mb+'.name',{tag:'div',style:{font:'700 18px '+this.HEAD,color:P.maroon}}),
            this.etext(mb+'.role',{tag:'div',style:{font:'600 12px '+this.HEAD,color:P.gold,letterSpacing:'.06em',textTransform:'uppercase',margin:'4px 0 10px'}}),
            this.etext(mb+'.bio',{tag:'div',style:{font:'400 14px/1.6 Plus Jakarta Sans',color:P.muted,marginBottom:14}}),
            h('div',{style:{display:'flex',gap:8,justifyContent:'center'}}, ...(m.socials||[]).map((lk,k)=>{ const mm=sm[lk.net]||['•',P.maroon]; return h('a',{key:k,href:lk.url||'#',target:'_blank',rel:'noopener',onClick:e=>{if(this.state.editMode)e.preventDefault();},style:{width:36,height:36,borderRadius:'50%',background:mm[1],color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',font:'700 14px '+this.HEAD,textDecoration:'none'}},mm[0]); }))); })))); }
      case 'promo': { const em=this.state.editMode; return h('section',{style:sec}, wrap(h('div',{className:'aok-promo',style:{position:'relative',borderRadius:16,overflow:'hidden',aspectRatio:'16/7',minHeight:190}},
        this.eimg(base+'.src',{alt:b.title||'',placeholder:'promo image',style:{width:'100%',height:'100%'}}),
        h('div',{className:'aok-pov',style:Object.assign({position:'absolute',inset:0,background:'linear-gradient(0deg,rgba(28,10,6,.85),rgba(28,10,6,.3))',display:'flex',flexDirection:'column',justifyContent:'flex-end',padding:'26px 28px'}, em?{opacity:1,transform:'none'}:{})},
          this.etext(base+'.title',{tag:'div',style:{font:'800 24px '+this.HEAD,color:P.cream,marginBottom:6}}),
          this.etext(base+'.text',{tag:'div',style:{font:'400 15px/1.6 Plus Jakarta Sans',color:'rgba(247,239,224,.92)'}}))))); }
      case 'circle': { const items=b.items||[]; const n=items.length||1; const act=this.uiState(b.id,'circ',0)%n;
        return h('section',{style:sec}, wrap(h('div',{style:{position:'relative',width:'100%',maxWidth:430,aspectRatio:'1/1',margin:'0 auto'}},
          h('div',{style:{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:'54%',textAlign:'center'}}, this.etext(base+'.items.'+act+'.label',{tag:'div',style:{font:'800 20px '+this.HEAD,color:P.maroon,marginBottom:6}}), this.etext(base+'.items.'+act+'.text',{tag:'div',style:{font:'400 13.5px/1.5 Plus Jakarta Sans',color:P.muted}})),
          ...items.map((it,j)=>{ const ang=(j/n)*2*Math.PI-Math.PI/2; const x=50+42*Math.cos(ang), y=50+42*Math.sin(ang); return h('button',{key:j,onClick:()=>this.setUi(b.id,'circ',j),style:{position:'absolute',left:x+'%',top:y+'%',transform:'translate(-50%,-50%)',width:56,height:56,borderRadius:'50%',border:'2px solid '+(j===act?P.red:P.line),background:j===act?P.red:P.card,color:j===act?P.cream:P.maroon,cursor:'pointer',font:'700 14px '+this.HEAD,boxShadow:'0 4px 12px rgba(0,0,0,.14)'}}, String(j+1)); })))); }
      case 'flipcards': { const cards=b.cards||[]; const cols=b.cols||3; const em=this.state.editMode;
        return h('section',{style:sec}, wrap(h('div',{style:{display:'grid',gridTemplateColumns:'repeat('+cols+',1fr)',gap:16}}, ...cards.map((c,j)=>{ const fl=this.uiState(b.id+'_'+j,'flip',false); const cb=base+'.cards.'+j;
          return h('div',{key:j,className:'aok-flip'+(fl?' flipped':''),onClick:em?undefined:()=>this.setUi(b.id+'_'+j,'flip',!fl),style:{height:210,cursor:em?'default':'pointer',position:'relative'}},
            em? h('button',{onClick:e=>{e.stopPropagation();this.setUi(b.id+'_'+j,'flip',!fl);},style:{position:'absolute',top:6,right:6,zIndex:6,padding:'4px 9px',borderRadius:999,border:'none',background:'rgba(28,10,6,.8)',color:'#fff',cursor:'pointer',font:'600 11px '+this.HEAD}},'⟲ Flip'):null,
            h('div',{className:'aok-flip-inner'},
              h('div',{className:'aok-flip-face',style:{background:P.card,border:'1px solid '+P.line,padding:20}}, h('div',{style:{font:'400 40px '+this.HEAD,color:P.gold,marginBottom:10}}, c.icon||'✦'), this.etext(cb+'.front',{tag:'div',style:{font:'700 17px '+this.HEAD,color:P.maroon,textAlign:'center'}})),
              h('div',{className:'aok-flip-face aok-flip-back',style:{background:'linear-gradient(160deg,'+P.maroon+','+P.maroonD+')',padding:20}}, this.etext(cb+'.back',{tag:'div',style:{font:'400 14px/1.6 Plus Jakarta Sans',color:P.cream,textAlign:'center'}})))); })))); }
      case 'popup': { const open=this.uiState(b.id,'pop',false); const em=this.state.editMode;
        return h('section',{style:sec}, wrap(h('div',{style:{textAlign:s.align||'center'}},
          h('button',{onClick:()=>this.setUi(b.id,'pop',true),className:'aok-btn aok-fx-lift',style:{display:'inline-flex',alignItems:'center',gap:8,padding:'13px 24px',borderRadius:999,border:'none',background:P.red,color:P.cream,cursor:'pointer',font:'600 15px '+this.HEAD,boxShadow:'0 6px 22px rgba(125,31,18,.28)'}}, b.label||'Open popup'),
          open? h('div',{style:{position:'fixed',inset:0,zIndex:2600,background:'rgba(28,10,6,.55)',display:'flex',alignItems:'center',justifyContent:'center',padding:24},onClick:()=>this.setUi(b.id,'pop',false)},
            h('div',{onClick:e=>e.stopPropagation(),className:'aok-scroll',style:{background:P.bg,borderRadius:18,padding:'30px',width:'100%',maxWidth:520,maxHeight:'85vh',overflowY:'auto',boxShadow:'0 30px 80px rgba(0,0,0,.45)',textAlign:'left'}},
              h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}, em? this.etext(base+'.title',{tag:'h3',style:{font:'800 22px '+this.HEAD,color:P.maroon,margin:0}}) : h('h3',{style:{font:'800 22px '+this.HEAD,color:P.maroon,margin:0}},b.title), h('button',{onClick:()=>this.setUi(b.id,'pop',false),style:{border:'none',background:'transparent',cursor:'pointer',font:'600 22px '+this.HEAD,color:P.muted}},'✕')),
              em? this.etext(base+'.text',{tag:'div',className:'aok-link',style:{font:'400 15px/1.7 Plus Jakarta Sans',color:P.ink,whiteSpace:'pre-line'}}) : h('div',{className:'aok-link',style:{font:'400 15px/1.7 Plus Jakarta Sans',color:P.ink,whiteSpace:'pre-line'}},b.text))):null ))); }
      case 'eventcal': { const evs=b.events||[]; const fmt=ds=>{ try{ const dt=new Date(ds+'T00:00:00'); return {d:dt.getDate(),m:dt.toLocaleDateString('en-US',{month:'short'})}; }catch(e){ return {d:'?',m:''}; } };
        return h('section',{style:sec}, wrap(h('div',{style:{display:'grid',gap:12}}, ...evs.map((ev,j)=>{ const f=fmt(ev.date); return h('div',{key:ev.id||j,style:{display:'flex',gap:16,alignItems:'flex-start',background:P.card,border:'1px solid '+P.line,borderRadius:14,padding:'16px 18px'}},
          h('div',{style:{flex:'0 0 auto',width:62,textAlign:'center',background:'linear-gradient(160deg,'+P.maroon+','+P.maroonD+')',color:P.cream,borderRadius:12,padding:'10px 6px'}}, h('div',{style:{font:'800 24px '+this.HEAD,lineHeight:1}}, f.d), h('div',{style:{font:'600 11px '+this.HEAD,letterSpacing:'.08em',textTransform:'uppercase',color:P.goldL,marginTop:2}}, f.m)),
          h('div',{style:{flex:1,minWidth:0}}, this.etext(base+'.events.'+j+'.title',{tag:'div',style:{font:'700 16px '+this.HEAD,color:P.maroon,marginBottom:3}}), this.etext(base+'.events.'+j+'.desc',{tag:'div',style:{font:'400 14px/1.55 Plus Jakarta Sans',color:P.muted}}))); })))); }
      case 'multimap': { const places=b.places||[]; const act=this.uiState(b.id,'mm',0)%Math.max(places.length,1); const q=encodeURIComponent((places[act]&&places[act].query)||'');
        return h('section',{style:sec}, wrap(h('div',{style:{display:'grid',gridTemplateColumns:'220px 1fr',gap:16,alignItems:'stretch'}},
          h('div',{style:{display:'grid',gap:8,alignContent:'start'}}, ...places.map((pl,j)=>h('button',{key:j,onClick:()=>this.setUi(b.id,'mm',j),style:{textAlign:'left',padding:'12px 14px',borderRadius:10,border:'1px solid '+(j===act?P.red:P.line),background:j===act?P.red:P.card,color:j===act?P.cream:P.maroon,cursor:'pointer',font:'600 14px '+this.HEAD}}, h('span',{style:{marginRight:8}},'⚑'), pl.label||('Location '+(j+1))))),
          h('div',{style:{borderRadius:14,overflow:'hidden',border:'1px solid '+P.line,minHeight:300}}, q? h('iframe',{title:'map',src:'https://maps.google.com/maps?q='+q+'&output=embed',style:{width:'100%',height:'100%',minHeight:300,border:0}}) : h('div',{style:{padding:40,textAlign:'center',color:P.muted}},'Add a location query in the settings panel'))))); }
      case 'pagenav': { const em=this.state.editMode; const dd=this.state.data; const arr=(dd.blocks&&dd.blocks[route])||[]; const items=arr.map((bl,ix)=>({id:'aokblk-'+(bl.id||ix),label:bl.type||'section',type:bl.type})).filter(x=>x.type!=='pagenav');
        if(em) return h('section',{style:sec}, wrap(h('div',{style:{textAlign:'center',padding:'18px',border:'1px dashed '+P.line,borderRadius:12,color:P.muted,font:'500 13.5px Plus Jakarta Sans'}},'◉ One-page navigation dots — on the live site these pin to the '+(b.side||'right')+' edge and jump between the page sections.')));
        return React.createElement(this.PageNav,{key:arr.length+(b.side||'right'),items,side:b.side||'right'}); }
      default: return null; } }

  // ----- a widget living inside a column -----
  renderChild(path,b,j){ const h=React.createElement,P=this.P; const em=this.state.editMode; const inner=this.renderChildInner(path,b);
    if(!em) return h('div',{key:b.id||j}, inner);
    const sel=this.state.selBlock&&this.state.selBlock.nested&&this.state.selBlock.path===path;
    const itemsPath=path.replace(/\.\d+$/,'');
    const tb=(label,title,fn,danger)=>h('button',{title,onMouseDown:e=>e.preventDefault(),onClick:e=>{e.stopPropagation();fn();},style:{width:24,height:24,borderRadius:6,border:'none',cursor:'pointer',background:danger?P.bad:'rgba(28,10,6,.85)',color:P.cream,font:'700 12px '+this.HEAD,display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}},label);
    return h('div',{key:b.id||j,onClick:e=>{e.stopPropagation(); this.setState({selBlock:{nested:true,path,route:this.state.route}});},style:{position:'relative',outline:sel?'2px solid '+P.gold:'1px dashed rgba(58,14,8,.16)',outlineOffset:2,borderRadius:6,margin:'4px 0',padding:'4px'}},
      h('div',{contentEditable:false,style:{position:'absolute',top:3,right:3,zIndex:30,display:'flex',gap:3}},
        tb('↑','Move up',()=>this.childMove(itemsPath,j,-1)),
        tb('↓','Move down',()=>this.childMove(itemsPath,j,1)),
        tb('⚙','Settings',()=>this.setState({selBlock:{nested:true,path,route:this.state.route}})),
        tb('⧉','Duplicate',()=>this.childDup(itemsPath,j)),
        tb('✕','Delete',()=>{ if(confirm('Delete this item?')){ this.childDel(itemsPath,j); this.setState({selBlock:null}); } },true)),
      inner); }
  renderChildInner(path,b){ const h=React.createElement,P=this.P; const s=b._s||{}; const al=s.align||'left';
    switch(b.type){
      case 'heading': return this.etext(path+'.text',{tag:'h3',style:{font:'800 clamp(20px,2.6vw,28px) '+this.HEAD,color:s.color||P.maroon,margin:'0 0 6px',letterSpacing:'-.01em',textAlign:al}});
      case 'text': return this.etext(path+'.text',{tag:'div',className:'aok-link',style:{font:'400 16px/1.7 Plus Jakarta Sans',color:s.color||P.ink,whiteSpace:'pre-line',textAlign:al}});
      case 'button': return h('div',{style:{textAlign:al}}, this.btn(b.label||'Button',()=>{ if(!this.state.editMode) this.go(b.route||'contact'); },{variant:s.btnVariant||'solid'}));
      case 'iconbox': return h('div',{style:{textAlign:al==='left'?'center':al}}, h('div',{style:{font:'400 40px '+this.HEAD,color:P.gold,marginBottom:10,lineHeight:1}}, b.icon||'✨'), this.etext(path+'.title',{tag:'h3',style:{font:'800 19px '+this.HEAD,color:s.color||P.maroon,margin:'0 0 6px'}}), this.etext(path+'.text',{tag:'p',style:{font:'400 14.5px/1.65 Plus Jakarta Sans',color:P.muted,margin:0}}));
      case 'quote': return h('blockquote',{style:{margin:0}}, h('div',{style:{font:'400 32px '+this.HEAD,color:P.gold,lineHeight:1}},'“'), this.etext(path+'.text',{tag:'p',style:{font:'500 18px/1.5 '+this.HEAD,color:s.color||P.maroon,margin:0}}));
      case 'divider': return h('hr',{style:{border:0,borderTop:'1px solid '+P.line,margin:'8px 0'}});
      case 'spacer': return h('div',{style:{height:b.h||32}});
      case 'image': { const ar=b.ar||'4/3'; const a2=b.align||'center'; const wpct=Math.max(10,Math.min(100,b.w||100)); const mar=a2==='left'?'0 auto 0 0':a2==='right'?'0 0 0 auto':'0 auto'; const selImg=this.state.selBlock&&this.state.selBlock.nested&&this.state.selBlock.path===path;
        return h('figure',{style:{margin:0}}, h('div',{style:{position:'relative',width:wpct+'%',margin:mar,maxWidth:'100%',transition:this._liveResize?'none':'width .12s'}}, this.eimg(path+'.src',{alt:b.alt||'',title:b.desc||'',radius:12,placeholder:'Click ↻\nto add',style:{width:'100%',aspectRatio:ar}}), (this.state.editMode&&selImg&&b.src)? this.imgResizeHandle(path):null), (b.caption)? h('figcaption',{style:{textAlign:'center',font:'italic 400 12.5px/1.5 Plus Jakarta Sans',color:P.muted,margin:'6px 0 0'}}, b.caption):null); }
      default: return null; } }
  renderColAdd(){ if(!this.state.colAdd) return null; const h=React.createElement,P=this.P; const path=this.state.colAdd;
    const kinds=[['heading','H','Heading'],['text','¶','Text'],['image','▣','Image'],['button','→','Button'],['iconbox','✦','Icon Box'],['quote','”','Quote'],['divider','—','Divider'],['spacer','↕','Spacer']];
    return h('div',{style:{position:'fixed',inset:0,zIndex:2100,background:'rgba(28,10,6,.55)',display:'flex',alignItems:'center',justifyContent:'center',padding:24},onClick:()=>this.setState({colAdd:null})},
      h('div',{onClick:e=>e.stopPropagation(),style:{background:P.bg,borderRadius:18,padding:'22px 24px',width:'100%',maxWidth:440,boxShadow:'0 30px 80px rgba(0,0,0,.4)'}},
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}, h('h2',{style:{font:'800 19px '+this.HEAD,color:P.maroon,margin:0}},'Add to column'), h('button',{onClick:()=>this.setState({colAdd:null}),style:{border:'none',background:'transparent',cursor:'pointer',font:'600 19px '+this.HEAD,color:P.muted}},'✕')),
        h('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10}}, ...kinds.map(k=>h('button',{key:k[0],onClick:()=>this.childAdd(path,k[0]),style:{textAlign:'center',background:P.card,border:'1px solid '+P.line,borderRadius:12,padding:'14px 6px',cursor:'pointer'}}, h('div',{style:{font:'400 22px '+this.HEAD,color:P.gold,marginBottom:6}},k[1]), h('div',{style:{font:'700 12px '+this.HEAD,color:P.maroon}},k[2])))))); }

  renderBlockPicker(){ if(!this.state.blkPick) return null; const h=React.createElement,P=this.P; const route=this.state.blkPick;
    const kinds=[['columns','▥▥','Columns / Row','Side-by-side columns'],['heading','H','Heading','Large section title'],['dualheading','Aa','Dual Color Heading','Two-tone headline'],['fancytext','✨','Fancy Text','Animated changing words'],['text','¶','Text','A paragraph of rich text'],['image','▣','Image','Full-width picture'],['imagescroller','⇕','Image Scroller','Scrollable tall image'],['button','→','Creative Button','Custom text/link button + hover'],['cta','⚑','Call To Action','Headline + button band'],['pricingtable','▤▤','Pricing Table','Side-by-side plan cards'],['pricemenu','☰','Price Menu','Service / menu price list'],['countdown','⏱','Countdown Timer','Fixed or evergreen timer'],['team','👤','Team Members','Profile cards + socials'],['quote','”','Quote','Highlighted quotation'],['iconlist','✓','Checklist','Ticked list of points'],['featurelist','≔','Feature List','Icon-based feature list'],['divider','—','Divider','A thin separating line'],['spacer','↕','Spacer','Adjustable empty space'],['video','▶','Video','Embed YouTube / Vimeo'],['gallery','▦','Image Gallery','Grid of images'],['carousel','↺','Carousel','Rotating image slider'],['imagebox','▤','Image Box','Image + title + text'],['iconbox','✦','Info Box','Icon + heading + text'],['map','◎','Google Map','Embed a location'],['testimonial','❝','Testimonial','Customer review card'],['counter','➀','Counter','Big number stat'],['progress','▰','Progress Bar','Labelled progress bar'],['rating','★','Rating','Star rating'],['alert','⚠','Alert','Coloured notice box'],['tabs','▥','Advanced Tabs','Tabbed content'],['accordion','≡','Advanced Accordion','Collapsible sections'],['toggle','⊕','Toggle','Single show / hide'],['promo','◩','Interactive Promo','Hover-reveal banner'],['circle','◍','Interactive Circle','Rotating circular menu'],['flipcards','⬓','Interactive Cards','Flip cards on click'],['popup','▭','Modal / Popup','Triggered overlay box'],['eventcal','📅','Event Calendar','List of scheduled events'],['multimap','🗺','Google Maps (multi)','Multiple location markers'],['pagenav','⋮','One-Page Nav','Side dots scroll to sections'],['compare','◧◨','Image Comparison','Before / after slider'],['hotspots','⊙','Image Hotspots','Tooltips on an image'],['audio','♪','Audio Player','Clean audio playback'],['stickyvideo','⧉','Sticky Video','Docks to corner on scroll'],['offcanvas','⇥','Offcanvas Panel','Slide-out side panel'],['social','◉','Social Icons','Links to social pages'],['html','{ }','HTML','Insert custom code']];
    return h('div',{style:{position:'fixed',inset:0,zIndex:2000,background:'rgba(28,10,6,.55)',display:'flex',alignItems:'center',justifyContent:'center',padding:24},onClick:()=>this.setState({blkPick:null})},
      h('div',{className:'aok-scroll',onClick:e=>e.stopPropagation(),style:{background:P.bg,borderRadius:20,padding:'24px 26px',width:'100%',maxWidth:760,maxHeight:'85vh',overflowY:'auto',boxShadow:'0 30px 80px rgba(0,0,0,.4)'}},
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}, h('h2',{style:{font:'800 21px '+this.HEAD,color:P.maroon,margin:0}},'Add a block'), h('button',{onClick:()=>this.setState({blkPick:null}),style:{border:'none',background:'transparent',cursor:'pointer',font:'600 20px '+this.HEAD,color:P.muted}},'\u2715')),
        h('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}, ...kinds.map(k=>h('button',{key:k[0],onClick:()=>this.addBlock(route,k[0]),style:{textAlign:'left',background:P.card,border:'1px solid '+P.line,borderRadius:13,padding:'16px 16px',cursor:'pointer',transition:'transform .15s'},onMouseEnter:e=>e.currentTarget.style.transform='translateY(-2px)',onMouseLeave:e=>e.currentTarget.style.transform='none'},
          h('div',{style:{font:'400 24px '+this.HEAD,color:P.gold,marginBottom:8}},k[1]), h('div',{style:{font:'700 15px '+this.HEAD,color:P.maroon,marginBottom:3}},k[2]), h('div',{style:{font:'400 12.5px/1.4 Plus Jakarta Sans',color:P.muted}},k[3]))))) ); }

  renderBlockPanel(){ const sel=this.state.selBlock; if(!sel||!this.state.editMode) return null; const h=React.createElement,P=this.P;
    if(sel.nested) return this.renderChildPanel(sel.path);
    const arr=(this.state.data.blocks&&this.state.data.blocks[sel.route])||[]; const b=arr[sel.i]; if(!b) return null; const s=b._s||{}; const route=sel.route,i=sel.i; const base='blocks.'+route+'.'+i;
    const lbl=t=>h('div',{style:{font:'700 12px '+this.HEAD,color:P.maroon,letterSpacing:'.04em',textTransform:'uppercase',margin:'18px 0 8px'}},t);
    const swatches=[['none','transparent'],['cream',P.bg],['sand',P.bgAlt],['card',P.card],['maroon',P.maroon],['red',P.red],['gold',P.gold]];
    const swRow=(cur,fn)=>h('div',{style:{display:'flex',flexWrap:'wrap',gap:8}}, ...swatches.map(sw=>h('button',{key:sw[0],title:sw[0],onClick:()=>fn(sw[1]==='transparent'?'':sw[1]),style:{width:30,height:30,borderRadius:8,cursor:'pointer',background:sw[1]==='transparent'?'repeating-linear-gradient(45deg,#eee,#eee 5px,#fff 5px,#fff 10px)':sw[1],border:(cur||'')===(sw[1]==='transparent'?'':sw[1])?'2px solid '+P.maroon:'1px solid '+P.line}})));
    const txtSw=[['ink',P.ink],['maroon',P.maroon],['red',P.red],['gold',P.gold],['cream',P.cream]];
    const segBtn=(opts,cur,fn)=>h('div',{style:{display:'flex',border:'1px solid '+P.line,borderRadius:9,overflow:'hidden'}}, ...opts.map(o=>h('button',{key:o[0],onClick:()=>fn(o[0]),style:{flex:1,padding:'8px 4px',border:'none',cursor:'pointer',background:cur===o[0]?P.maroon:P.white,color:cur===o[0]?P.cream:P.ink,font:'600 13px '+this.HEAD}},o[1])));
    const field=(label,val,fn,opts={})=>h('label',{style:{display:'block',marginTop:12}}, h('span',{style:{display:'block',font:'600 12px '+this.HEAD,color:P.maroon,marginBottom:5}},label), opts.area? h('textarea',{value:val||'',rows:opts.rows||3,onChange:e=>fn(e.target.value),style:{width:'100%',padding:'9px 11px',borderRadius:9,border:'1px solid '+P.line,background:P.white,font:'400 14px Plus Jakarta Sans',resize:'vertical'}}) : h('input',{value:val||'',onChange:e=>fn(e.target.value),style:{width:'100%',padding:'9px 11px',borderRadius:9,border:'1px solid '+P.line,background:P.white,font:'400 14px Plus Jakarta Sans'}}));
    const rows=[];
    rows.push(lbl('Background')); rows.push(swRow(s.bg,v=>this.setBlkStyle(route,i,{bg:v})));
    if(['heading','text','quote','iconlist','button','imagebox','iconbox','counter','progress'].includes(b.type)){ rows.push(lbl('Text colour')); rows.push(h('div',{style:{display:'flex',gap:8}}, ...txtSw.map(c=>h('button',{key:c[0],onClick:()=>this.setBlkStyle(route,i,{color:c[1]}),style:{width:30,height:30,borderRadius:8,cursor:'pointer',background:c[1],border:(s.color||'')===c[1]?'2px solid '+P.maroon:'1px solid '+P.line}})))); }
    rows.push(lbl('Alignment')); rows.push(segBtn([['left','\u2190'],['center','\u2261'],['right','\u2192']], s.align||'left', v=>this.setBlkStyle(route,i,{align:v})));
    rows.push(lbl('Width')); rows.push(segBtn([['narrow','S'],['mid','M'],['wide','L'],['full','Full']], (s.maxW===520?'narrow':s.maxW===980?'wide':s.maxW==='100%'?'full':'mid'), v=>this.setBlkStyle(route,i,{maxW:v==='narrow'?520:v==='wide'?980:v==='full'?'100%':720})));
    if(b.type!=='spacer'&&b.type!=='cta'){ rows.push(lbl('Inner padding (top & bottom) — '+(s.padY!=null?s.padY:54)+'px')); rows.push(h('input',{type:'range',min:0,max:120,step:2,value:s.padY!=null?s.padY:54,onChange:e=>this.setBlkStyle(route,i,{padY:+e.target.value}),style:{width:'100%'}})); }
    rows.push(lbl('Margin above — '+(s.mt||0)+'px')); rows.push(h('input',{type:'range',min:0,max:120,step:2,value:s.mt||0,onChange:e=>this.setBlkStyle(route,i,{mt:+e.target.value}),style:{width:'100%'}}));
    rows.push(lbl('Margin below — '+(s.mb||0)+'px')); rows.push(h('input',{type:'range',min:0,max:120,step:2,value:s.mb||0,onChange:e=>this.setBlkStyle(route,i,{mb:+e.target.value}),style:{width:'100%'}}));
    if(b.type==='spacer'){ rows.push(lbl('Height')); rows.push(h('input',{type:'range',min:8,max:200,step:4,value:b.h||48,onChange:e=>this.setBlk(route,i,{h:+e.target.value}),style:{width:'100%'}})); }
    if(b.type==='columns'){ const ncols=(b.cols||[]).length;
      rows.push(lbl('Columns — '+ncols));
      rows.push(h('div',{style:{display:'flex',gap:8}}, h('button',{onClick:()=>this.colAddCol(base),style:{flex:1,padding:'9px',borderRadius:8,border:'1px dashed '+P.gold,background:'transparent',color:P.maroon,cursor:'pointer',font:'700 13px '+this.HEAD}},'＋ Add column'), h('button',{onClick:()=>this.colDelCol(base,ncols-1),style:{flex:1,padding:'9px',borderRadius:8,border:'1px solid '+P.line,background:P.white,color:P.ink,cursor:'pointer',font:'700 13px '+this.HEAD}},'− Remove last')));
      rows.push(lbl('Layout presets'));
      const presets=ncols===2?[['1,1','Equal'],['1,2','1 : 2'],['2,1','2 : 1'],['1,3','1 : 3']]:ncols===3?[['1,1,1','Equal'],['1,2,1','Wide centre'],['2,1,1','Wide left']]:ncols===4?[['1,1,1,1','Equal']]:[['1','Single']];
      rows.push(h('div',{style:{display:'flex',flexWrap:'wrap',gap:6}}, ...presets.map(p=>h('button',{key:p[0],onClick:()=>{ const ws=p[0].split(',').map(Number); this.mutate(d=>{ const blk=this.getIn(d,base); (blk.cols||[]).forEach((c,ix)=>{ c.w=ws[ix]||1; }); }); },style:{padding:'8px 12px',borderRadius:8,border:'1px solid '+P.line,background:P.white,color:P.ink,cursor:'pointer',font:'600 12.5px '+this.HEAD}},p[1]))));
      rows.push(lbl('Gap between columns — '+(b.gap!=null?b.gap:24)+'px')); rows.push(h('input',{type:'range',min:0,max:60,step:2,value:b.gap!=null?b.gap:24,onChange:e=>this.setBlk(route,i,{gap:+e.target.value}),style:{width:'100%'}}));
      rows.push(lbl('Minimum height — '+(b.minH||0)+'px')); rows.push(h('input',{type:'range',min:0,max:500,step:10,value:b.minH||0,onChange:e=>this.setBlk(route,i,{minH:+e.target.value}),style:{width:'100%'}}));
      rows.push(h('p',{key:'colh',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Drag the gold bars between columns to change their widths. Click ＋ Add here inside a column to drop in text, images, buttons and more. Columns stack on mobile automatically.')); }
    if(b.type==='button'||b.type==='cta'){ rows.push(field('Button label',b.label,v=>this.setBlk(route,i,{label:v}))); rows.push(lbl('Links to page')); rows.push(segBtn([['home','Home'],['services','Services'],['contact','Contact']], b.route||'contact', v=>this.setBlk(route,i,{route:v}))); }
    if(b.type==='button'){ rows.push(lbl('Button style')); rows.push(segBtn([['solid','Solid'],['gold','Gold'],['outline','Outline'],['dark','Dark']], s.btnVariant||'solid', v=>this.setBlkStyle(route,i,{btnVariant:v}))); rows.push(lbl('Button size')); rows.push(segBtn([['sm','S'],['md','M'],['lg','L']], s.btnSize||'md', v=>this.setBlkStyle(route,i,{btnSize:v}))); rows.push(lbl('Hover effect')); rows.push(segBtn([['lift','Lift'],['grow','Grow'],['glow','Glow'],['shine','Shine']], s.hoverFx||'lift', v=>this.setBlkStyle(route,i,{hoverFx:v}))); }
    if(b.type==='dualheading'){ rows.push(lbl('Accent colour (2nd part)')); rows.push(h('div',{style:{display:'flex',gap:8}}, ...[['gold',P.gold],['red',P.red],['maroon',P.maroon],['ok',P.ok]].map(c=>h('button',{key:c[0],onClick:()=>this.setBlkStyle(route,i,{accent:c[1]}),style:{width:30,height:30,borderRadius:8,cursor:'pointer',background:c[1],border:(s.accent||'')===c[1]?'2px solid '+P.maroon:'1px solid '+P.line}})))); rows.push(h('p',{key:'dh',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Click the heading on the page to edit each part. The second part shows in the accent colour.')); }
    if(b.type==='fancytext'){ rows.push(field('Rotating words (one per line)',(b.words||[]).join('\n'),v=>this.setBlk(route,i,{words:v.split('\n').map(x=>x.trim()).filter(Boolean)}),{area:true,rows:4})); rows.push(lbl('Animated word colour')); rows.push(h('div',{style:{display:'flex',gap:8}}, ...[['red',P.red],['gold',P.gold],['maroon',P.maroon],['ok',P.ok]].map(c=>h('button',{key:c[0],onClick:()=>this.setBlkStyle(route,i,{accent:c[1]}),style:{width:30,height:30,borderRadius:8,cursor:'pointer',background:c[1],border:(s.accent||'')===c[1]?'2px solid '+P.maroon:'1px solid '+P.line}})))); rows.push(h('p',{key:'ft',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'The words cycle automatically. Edit the surrounding text on the page.')); }
    if(b.type==='imagescroller'){ rows.push(lbl('Frame height — '+(b.h||340)+'px')); rows.push(h('input',{type:'range',min:160,max:700,step:10,value:b.h||340,onChange:e=>this.setBlk(route,i,{h:+e.target.value}),style:{width:'100%'}})); rows.push(field('Alt text (SEO)',b.alt,v=>this.setBlk(route,i,{alt:v}))); rows.push(field('Description / title (SEO)',b.desc,v=>this.setBlk(route,i,{desc:v}),{area:true,rows:2})); rows.push(h('p',{key:'is',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Upload a tall/long image with the ↻ button on the frame; visitors scroll it inside the fixed-height window.')); }
    if(b.type==='featurelist'){ const fIcons=['✦','✔','★','☉','☽','♦','➤','✚','◈','♥']; rows.push(lbl('Feature items')); (b.items||[]).forEach((it,j)=>{ rows.push(h('div',{key:'fi'+j,style:{display:'flex',gap:6,marginBottom:6,alignItems:'center'}}, h('select',{value:it.icon||'✦',onChange:e=>this.mutate(d=>{d.blocks[route][i].items[j].icon=e.target.value;}),style:{padding:'7px',borderRadius:8,border:'1px solid '+P.line,font:'15px '+this.HEAD}}, ...fIcons.map(ic=>h('option',{key:ic,value:ic},ic))), h('input',{value:it.t||'',onChange:e=>this.mutate(d=>{d.blocks[route][i].items[j].t=e.target.value;}),style:{flex:1,minWidth:0,padding:'8px 10px',borderRadius:8,border:'1px solid '+P.line,font:'400 13px Plus Jakarta Sans'}}), h('button',{onClick:()=>this.mutate(d=>{if((d.blocks[route][i].items||[]).length>1)d.blocks[route][i].items.splice(j,1);}),style:{border:'none',background:P.bad,color:P.cream,borderRadius:8,width:30,height:30,cursor:'pointer',flex:'0 0 auto'}},'✕'))); }); rows.push(h('button',{key:'addf',onClick:()=>this.mutate(d=>{const x=d.blocks[route][i];x.items=x.items||[];x.items.push({icon:'✦',t:'New feature'});}),style:{marginTop:4,padding:'8px 14px',borderRadius:8,border:'1px dashed '+P.gold,background:'transparent',color:P.maroon,cursor:'pointer',font:'600 13px '+this.HEAD}},'＋ Add feature')); }
    if(b.type==='toggle'){ rows.push(h('p',{key:'tg',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Click the title and the hidden text on the page to edit them.')); }
    if(b.type==='compare'){ rows.push(lbl('Shape')); rows.push(segBtn([['16/10','Wide'],['4/3','Std'],['1/1','Square']], b.ar||'16/10', v=>this.setBlk(route,i,{ar:v}))); rows.push(h('p',{key:'cmp',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Use the ↻ Before / ↻ After buttons on the image to upload the two photos. Drag the round handle to compare.')); }
    if(b.type==='hotspots'){ rows.push(lbl('Shape')); rows.push(segBtn([['16/9','Wide'],['4/3','Std'],['1/1','Square']], b.ar||'16/9', v=>this.setBlk(route,i,{ar:v}))); rows.push(lbl('Hotspots')); (b.points||[]).forEach((pt,j)=>{ rows.push(h('div',{key:'hp'+j,style:{display:'flex',gap:6,marginBottom:6,alignItems:'center'}}, h('span',{style:{width:22,height:22,borderRadius:'50%',background:P.red,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',font:'700 11px '+this.HEAD,flex:'0 0 auto'}},String(j+1)), h('input',{value:pt.label||'',placeholder:'Title',onChange:e=>this.mutate(d=>{d.blocks[route][i].points[j].label=e.target.value;}),style:{flex:1,minWidth:0,padding:'7px 9px',borderRadius:8,border:'1px solid '+P.line,font:'400 12.5px Plus Jakarta Sans'}}), h('button',{onClick:()=>this.mutate(d=>{if((d.blocks[route][i].points||[]).length>1)d.blocks[route][i].points.splice(j,1);}),style:{border:'none',background:P.bad,color:P.cream,borderRadius:8,width:28,height:28,cursor:'pointer',flex:'0 0 auto'}},'✕'))); }); rows.push(h('button',{key:'addhp',onClick:()=>this.mutate(d=>{const x=d.blocks[route][i];x.points=x.points||[];x.points.push({x:50,y:50,label:'New point',text:'Describe this point.'});}),style:{marginTop:4,padding:'8px 14px',borderRadius:8,border:'1px dashed '+P.gold,background:'transparent',color:P.maroon,cursor:'pointer',font:'600 13px '+this.HEAD}},'＋ Add hotspot')); rows.push(h('p',{key:'hph',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Drag the numbered dots on the image to position them. Click a dot to open its tooltip and edit the title/text on the page.')); }
    if(b.type==='audio'){ rows.push(field('Audio file URL (mp3 / m4a / ogg)',b.src,v=>this.setBlk(route,i,{src:v}))); rows.push(h('p',{key:'au',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Paste a direct link to an audio file (e.g. from your media library). Edit the title on the page.')); }
    if(b.type==='stickyvideo'){ rows.push(field('Video URL',b.url,v=>this.setBlk(route,i,{url:v}))); rows.push(lbl('Dock corner')); rows.push(segBtn([['tl','↖'],['tr','↗'],['bl','↙'],['br','↘']], b.corner||'br', v=>this.setBlk(route,i,{corner:v}))); rows.push(h('p',{key:'sv',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'When a visitor scrolls past the video it shrinks to this corner and keeps playing. Docking is paused inside the editor.')); }
    if(b.type==='offcanvas'){ rows.push(field('Button label',b.label,v=>this.setBlk(route,i,{label:v}))); rows.push(lbl('Slide from')); rows.push(segBtn([['left','← Left'],['right','Right →']], b.side||'right', v=>this.setBlk(route,i,{side:v}))); rows.push(h('p',{key:'oc',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Click the button to open the panel, then edit its title and content on the page.')); }
    if(b.type==='pricingtable'){ rows.push(lbl('Plans')); (b.plans||[]).forEach((pl,j)=>{ rows.push(h('div',{key:'pl'+j,style:{border:'1px solid '+P.line,borderRadius:10,padding:'10px 11px',marginBottom:8}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}, h('span',{style:{font:'700 12px '+this.HEAD,color:P.maroon}},'Plan '+(j+1)), h('button',{onClick:()=>this.mutate(d=>{if((d.blocks[route][i].plans||[]).length>1)d.blocks[route][i].plans.splice(j,1);}),style:{border:'none',background:P.bad,color:P.cream,borderRadius:7,width:26,height:24,cursor:'pointer'}},'✕')),
      h('label',{style:{display:'flex',gap:7,alignItems:'center',font:'500 12.5px Plus Jakarta Sans',color:P.ink,marginBottom:7}}, h('input',{type:'checkbox',checked:!!pl.featured,onChange:e=>this.mutate(d=>{d.blocks[route][i].plans.forEach((x,ix)=>x.featured=(ix===j)&&e.target.checked);})}),'Highlight as popular'),
      h('div',{style:{display:'flex',gap:6,marginBottom:6}}, h('input',{value:pl.button||'',placeholder:'Button label',onChange:e=>this.mutate(d=>{d.blocks[route][i].plans[j].button=e.target.value;}),style:{flex:1,minWidth:0,padding:'7px 9px',borderRadius:7,border:'1px solid '+P.line,font:'400 12.5px Plus Jakarta Sans'}}), h('select',{value:pl.route||'contact',onChange:e=>this.mutate(d=>{d.blocks[route][i].plans[j].route=e.target.value;}),style:{padding:'7px',borderRadius:7,border:'1px solid '+P.line,font:'400 12px Plus Jakarta Sans'}}, h('option',{value:'contact'},'Contact'),h('option',{value:'services'},'Services'),h('option',{value:'home'},'Home'))),
      h('div',{style:{display:'flex',gap:6}}, h('button',{onClick:()=>this.mutate(d=>{const f=d.blocks[route][i].plans[j];f.features=f.features||[];f.features.push('New feature');}),style:{flex:1,padding:'6px',borderRadius:7,border:'1px dashed '+P.gold,background:'transparent',color:P.maroon,cursor:'pointer',font:'600 11.5px '+this.HEAD}},'＋ Feature'), h('button',{onClick:()=>this.mutate(d=>{const f=d.blocks[route][i].plans[j];if((f.features||[]).length)f.features.pop();}),style:{flex:1,padding:'6px',borderRadius:7,border:'1px solid '+P.line,background:P.white,color:P.ink,cursor:'pointer',font:'600 11.5px '+this.HEAD}},'− Feature'))) ); });
      rows.push(h('button',{key:'addpl',onClick:()=>this.mutate(d=>{const x=d.blocks[route][i];x.plans=x.plans||[];x.plans.push({id:this.uid(),name:'New plan',price:'$0',period:'per reading',features:['Feature one'],featured:false,button:'Choose',route:'contact'});}),style:{padding:'8px 14px',borderRadius:8,border:'1px dashed '+P.gold,background:'transparent',color:P.maroon,cursor:'pointer',font:'600 13px '+this.HEAD}},'＋ Add plan')); rows.push(h('p',{key:'pth',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Edit plan names, prices and feature text directly on the page.')); }
    if(b.type==='pricemenu'){ rows.push(lbl('Menu items — '+((b.items||[]).length))); rows.push(h('div',{style:{display:'flex',gap:8}}, h('button',{onClick:()=>this.mutate(d=>{const x=d.blocks[route][i];x.items=x.items||[];x.items.push({id:this.uid(),name:'New item',desc:'Description',price:'$0'});}),style:{flex:1,padding:'9px',borderRadius:8,border:'1px dashed '+P.gold,background:'transparent',color:P.maroon,cursor:'pointer',font:'600 13px '+this.HEAD}},'＋ Add item'), h('button',{onClick:()=>this.mutate(d=>{const x=d.blocks[route][i];if((x.items||[]).length>1)x.items.pop();}),style:{flex:1,padding:'9px',borderRadius:8,border:'1px solid '+P.line,background:P.white,color:P.ink,cursor:'pointer',font:'600 13px '+this.HEAD}},'− Remove last'))); rows.push(h('p',{key:'pmh',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Edit each item name, description and price directly on the page.')); }
    if(b.type==='countdown'){ rows.push(lbl('Timer type')); rows.push(segBtn([['date','Fixed date'],['evergreen','Evergreen']], b.mode||'date', v=>this.setBlk(route,i,{mode:v}))); if((b.mode||'date')==='date'){ rows.push(h('label',{key:'cdt',style:{display:'block',marginTop:12}}, h('span',{style:{display:'block',font:'600 12px '+this.HEAD,color:P.maroon,marginBottom:5}},'Target date & time'), h('input',{type:'datetime-local',value:b.target||'',onChange:e=>this.setBlk(route,i,{target:e.target.value}),style:{width:'100%',padding:'9px 11px',borderRadius:9,border:'1px solid '+P.line,background:P.white,font:'400 14px Plus Jakarta Sans'}}))); } else { rows.push(lbl('Duration — '+(b.minutes||60)+' min from first view')); rows.push(h('input',{type:'range',min:5,max:1440,step:5,value:b.minutes||60,onChange:e=>this.setBlk(route,i,{minutes:+e.target.value}),style:{width:'100%'}})); } rows.push(h('p',{key:'cdh',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Evergreen restarts per visitor from their first visit. Edit the title on the page.')); }
    if(b.type==='team'){ const nets=['facebook','instagram','youtube','whatsapp','x','linkedin']; rows.push(lbl('Team members')); (b.members||[]).forEach((m,j)=>{ rows.push(h('div',{key:'tm'+j,style:{border:'1px solid '+P.line,borderRadius:10,padding:'10px 11px',marginBottom:8}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}, h('span',{style:{font:'700 12px '+this.HEAD,color:P.maroon}},'Member '+(j+1)), h('button',{onClick:()=>this.mutate(d=>{if((d.blocks[route][i].members||[]).length>1)d.blocks[route][i].members.splice(j,1);}),style:{border:'none',background:P.bad,color:P.cream,borderRadius:7,width:26,height:24,cursor:'pointer'}},'✕')),
      ...((m.socials||[]).map((lk,k)=>h('div',{key:'so'+k,style:{display:'flex',gap:6,marginBottom:5}}, h('select',{value:lk.net,onChange:e=>this.mutate(d=>{d.blocks[route][i].members[j].socials[k].net=e.target.value;}),style:{padding:'6px',borderRadius:7,border:'1px solid '+P.line,font:'400 12px Plus Jakarta Sans'}}, ...nets.map(nn=>h('option',{key:nn,value:nn},nn))), h('input',{value:lk.url||'',placeholder:'https://…',onChange:e=>this.mutate(d=>{d.blocks[route][i].members[j].socials[k].url=e.target.value;}),style:{flex:1,minWidth:0,padding:'6px 8px',borderRadius:7,border:'1px solid '+P.line,font:'400 12px Plus Jakarta Sans'}}), h('button',{onClick:()=>this.mutate(d=>{d.blocks[route][i].members[j].socials.splice(k,1);}),style:{border:'none',background:P.bad,color:P.cream,borderRadius:7,width:26,cursor:'pointer',flex:'0 0 auto'}},'✕')))),
      h('button',{onClick:()=>this.mutate(d=>{const mm=d.blocks[route][i].members[j];mm.socials=mm.socials||[];mm.socials.push({net:'instagram',url:'#'});}),style:{marginTop:3,padding:'6px 12px',borderRadius:7,border:'1px dashed '+P.gold,background:'transparent',color:P.maroon,cursor:'pointer',font:'600 11.5px '+this.HEAD}},'＋ Social link')) ); });
      rows.push(h('button',{key:'addtm',onClick:()=>this.mutate(d=>{const x=d.blocks[route][i];x.members=x.members||[];x.members.push({id:this.uid(),photo:null,name:'New member',role:'Role',bio:'Short bio.',socials:[]});}),style:{padding:'8px 14px',borderRadius:8,border:'1px dashed '+P.gold,background:'transparent',color:P.maroon,cursor:'pointer',font:'600 13px '+this.HEAD}},'＋ Add member')); rows.push(h('p',{key:'tmh',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Click photos to upload, and edit names, roles and bios on the page.')); }
    if(b.type==='promo'){ rows.push(h('p',{key:'pr',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Click the image to replace it. The title and text reveal on hover (shown always while editing). Edit them on the page.')); }
    if(b.type==='circle'){ rows.push(lbl('Circle items — '+((b.items||[]).length))); rows.push(h('div',{style:{display:'flex',gap:8}}, h('button',{onClick:()=>this.mutate(d=>{const x=d.blocks[route][i];x.items=x.items||[];x.items.push({label:'New',text:'Details.'});}),style:{flex:1,padding:'9px',borderRadius:8,border:'1px dashed '+P.gold,background:'transparent',color:P.maroon,cursor:'pointer',font:'600 13px '+this.HEAD}},'＋ Add item'), h('button',{onClick:()=>this.mutate(d=>{const x=d.blocks[route][i];if((x.items||[]).length>2)x.items.pop();}),style:{flex:1,padding:'9px',borderRadius:8,border:'1px solid '+P.line,background:P.white,color:P.ink,cursor:'pointer',font:'600 13px '+this.HEAD}},'− Remove last'))); rows.push(h('p',{key:'cih',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Click a numbered node to select it, then edit its label and text in the centre.')); }
    if(b.type==='flipcards'){ rows.push(lbl('Columns')); rows.push(segBtn([[2,'2'],[3,'3'],[4,'4']], b.cols||3, v=>this.setBlk(route,i,{cols:+v}))); const fIcons=['✦','★','☾','☉','♦','✶','ॐ','♥','✚','◈']; rows.push(lbl('Cards')); (b.cards||[]).forEach((c,j)=>{ rows.push(h('div',{key:'fc'+j,style:{display:'flex',gap:6,marginBottom:6,alignItems:'center'}}, h('select',{value:c.icon||'✦',onChange:e=>this.mutate(d=>{d.blocks[route][i].cards[j].icon=e.target.value;}),style:{padding:'7px',borderRadius:7,border:'1px solid '+P.line,font:'15px '+this.HEAD}}, ...fIcons.map(ic=>h('option',{key:ic,value:ic},ic))), h('span',{style:{flex:1,font:'500 12.5px Plus Jakarta Sans',color:P.muted}},'Card '+(j+1)), h('button',{onClick:()=>this.mutate(d=>{if((d.blocks[route][i].cards||[]).length>1)d.blocks[route][i].cards.splice(j,1);}),style:{border:'none',background:P.bad,color:P.cream,borderRadius:7,width:28,height:28,cursor:'pointer'}},'✕'))); }); rows.push(h('button',{key:'addfc',onClick:()=>this.mutate(d=>{const x=d.blocks[route][i];x.cards=x.cards||[];x.cards.push({icon:'✦',front:'New card',back:'Back of the card.'});}),style:{padding:'8px 14px',borderRadius:8,border:'1px dashed '+P.gold,background:'transparent',color:P.maroon,cursor:'pointer',font:'600 13px '+this.HEAD}},'＋ Add card')); rows.push(h('p',{key:'fch',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'On the live site cards flip on click. While editing, use the ⟲ Flip button on a card to edit its back.')); }
    if(b.type==='popup'){ rows.push(field('Button label',b.label,v=>this.setBlk(route,i,{label:v}))); rows.push(h('p',{key:'poh',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Click the button to open the popup, then edit its title and content on the page.')); }
    if(b.type==='eventcal'){ rows.push(lbl('Events')); (b.events||[]).forEach((ev,j)=>{ rows.push(h('div',{key:'ev'+j,style:{display:'flex',gap:6,marginBottom:6,alignItems:'center'}}, h('input',{type:'date',value:ev.date||'',onChange:e=>this.mutate(d=>{d.blocks[route][i].events[j].date=e.target.value;}),style:{flex:1,minWidth:0,padding:'7px 9px',borderRadius:7,border:'1px solid '+P.line,font:'400 12.5px Plus Jakarta Sans'}}), h('button',{onClick:()=>this.mutate(d=>{if((d.blocks[route][i].events||[]).length>1)d.blocks[route][i].events.splice(j,1);}),style:{border:'none',background:P.bad,color:P.cream,borderRadius:7,width:28,height:28,cursor:'pointer'}},'✕'))); }); rows.push(h('button',{key:'addev',onClick:()=>this.mutate(d=>{const x=d.blocks[route][i];x.events=x.events||[];x.events.push({id:this.uid(),date:new Date().toISOString().slice(0,10),title:'New event',desc:'Event details.'});}),style:{padding:'8px 14px',borderRadius:8,border:'1px dashed '+P.gold,background:'transparent',color:P.maroon,cursor:'pointer',font:'600 13px '+this.HEAD}},'＋ Add event')); rows.push(h('p',{key:'evh',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Set each date here; edit the event title and description on the page.')); }
    if(b.type==='multimap'){ rows.push(lbl('Locations')); (b.places||[]).forEach((pl,j)=>{ rows.push(h('div',{key:'mp'+j,style:{border:'1px solid '+P.line,borderRadius:9,padding:'8px 9px',marginBottom:6}}, h('div',{style:{display:'flex',gap:6,marginBottom:5}}, h('input',{value:pl.label||'',placeholder:'Label',onChange:e=>this.mutate(d=>{d.blocks[route][i].places[j].label=e.target.value;}),style:{flex:1,minWidth:0,padding:'7px 9px',borderRadius:7,border:'1px solid '+P.line,font:'400 12.5px Plus Jakarta Sans'}}), h('button',{onClick:()=>this.mutate(d=>{if((d.blocks[route][i].places||[]).length>1)d.blocks[route][i].places.splice(j,1);}),style:{border:'none',background:P.bad,color:P.cream,borderRadius:7,width:28,cursor:'pointer',flex:'0 0 auto'}},'✕')), h('input',{value:pl.query||'',placeholder:'Address or place to search',onChange:e=>this.mutate(d=>{d.blocks[route][i].places[j].query=e.target.value;}),style:{width:'100%',padding:'7px 9px',borderRadius:7,border:'1px solid '+P.line,font:'400 12.5px Plus Jakarta Sans'}}))); }); rows.push(h('button',{key:'addmp',onClick:()=>this.mutate(d=>{const x=d.blocks[route][i];x.places=x.places||[];x.places.push({label:'New location',query:''});}),style:{padding:'8px 14px',borderRadius:8,border:'1px dashed '+P.gold,background:'transparent',color:P.maroon,cursor:'pointer',font:'600 13px '+this.HEAD}},'＋ Add location')); rows.push(h('p',{key:'mph',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Visitors switch markers from the list. Note: custom map skins/styles require a Google Maps API key and are not available via the free embed.')); }
    if(b.type==='pagenav'){ rows.push(lbl('Dots position')); rows.push(segBtn([['left','← Left'],['right','Right →']], b.side||'right', v=>this.setBlk(route,i,{side:v}))); rows.push(h('p',{key:'pnh',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Add this once per page. On the live site, dots pin to the chosen edge and scroll to each section as visitors click.')); }
    if(b.type==='image'){
      rows.push(lbl('Size — '+(b.w||100)+'% width')); rows.push(h('input',{type:'range',min:10,max:100,step:1,value:b.w||100,onChange:e=>this.setBlk(route,i,{w:+e.target.value}),style:{width:'100%'}}));
      rows.push(lbl('Position / alignment')); rows.push(segBtn([['left','◧ Left'],['center','▣ Center'],['right','▨ Right']], b.align||'center', v=>this.setBlk(route,i,{align:v})));
      rows.push(lbl('Shape')); rows.push(segBtn([['16/9','Wide'],['4/3','Standard'],['1/1','Square'],['3/4','Portrait']], b.ar||'16/9', v=>this.setBlk(route,i,{ar:v})));
      rows.push(field('Alt text (SEO)',b.alt,v=>this.setBlk(route,i,{alt:v})));
      rows.push(field('Caption (shown under image)',b.caption,v=>this.setBlk(route,i,{caption:v})));
      rows.push(field('Description / title (SEO)',b.desc,v=>this.setBlk(route,i,{desc:v}),{area:true,rows:2}));
      rows.push(h('p',{key:'imgh',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Tip: drag the gold corner handle on the image to resize it. Drag the image itself to reposition inside the frame, and use ＋ / − to zoom. Use the ☰ handle (top-right of the block) to drag the whole image up or down the page.'));
    }
    if(b.type==='iconlist'){ rows.push(lbl('List items')); (b.items||[]).forEach((it,j)=>{ rows.push(h('div',{key:'it'+j,style:{display:'flex',gap:6,marginBottom:6}}, h('input',{value:it,onChange:e=>this.mutate(d=>{d.blocks[route][i].items[j]=e.target.value;}),style:{flex:1,padding:'8px 10px',borderRadius:8,border:'1px solid '+P.line,font:'400 13.5px Plus Jakarta Sans'}}), h('button',{onClick:()=>this.mutate(d=>d.blocks[route][i].items.splice(j,1)),style:{border:'none',background:P.bad,color:P.cream,borderRadius:8,width:32,cursor:'pointer'}},'\u2715'))); }); rows.push(h('button',{key:'addit',onClick:()=>this.mutate(d=>{d.blocks[route][i].items=d.blocks[route][i].items||[];d.blocks[route][i].items.push('New point');}),style:{marginTop:4,padding:'8px 14px',borderRadius:8,border:'1px dashed '+P.gold,background:'transparent',color:P.maroon,cursor:'pointer',font:'600 13px '+this.HEAD}},'\uff0b Add item')); }
    const wIcons=['☉','☽','♀','♂','♚','☯','✦','✶','ॐ','☀','☎','✚','✪','★','♥','⚑','◈','❀'];
    if(b.type==='video'){ rows.push(field('Video URL',b.url,v=>this.setBlk(route,i,{url:v}))); rows.push(h('p',{key:'vh',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:6}},'Paste a YouTube, Vimeo or Dailymotion link.')); }
    if(b.type==='iconbox'){ rows.push(lbl('Icon')); rows.push(h('div',{style:{display:'flex',flexWrap:'wrap',gap:6}}, ...wIcons.map(ic=>h('button',{key:ic,onClick:()=>this.setBlk(route,i,{icon:ic}),style:{width:34,height:34,borderRadius:8,cursor:'pointer',border:b.icon===ic?'2px solid '+P.maroon:'1px solid '+P.line,background:P.white,font:'18px '+this.HEAD,color:P.gold}},ic)))); }
    if(b.type==='gallery'){ rows.push(lbl('Columns')); rows.push(segBtn([[2,'2'],[3,'3'],[4,'4']], b.cols||3, v=>this.setBlk(route,i,{cols:+v}))); rows.push(lbl('Images')); rows.push(h('div',{style:{display:'flex',gap:8}}, h('button',{onClick:()=>this.mutate(d=>{const x=d.blocks[route][i];x.images=x.images||[];x.images.push(null);}),style:{flex:1,padding:'9px',borderRadius:8,border:'1px dashed '+P.gold,background:'transparent',color:P.maroon,cursor:'pointer',font:'600 13px '+this.HEAD}},'＋ Add image'), h('button',{onClick:()=>this.mutate(d=>{const x=d.blocks[route][i];if((x.images||[]).length>1)x.images.pop();}),style:{flex:1,padding:'9px',borderRadius:8,border:'1px solid '+P.line,background:P.white,color:P.ink,cursor:'pointer',font:'600 13px '+this.HEAD}},'− Remove last'))); rows.push(h('p',{key:'gh',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Click any image on the page to upload it.')); }
    if(b.type==='carousel'){ rows.push(lbl('Slides')); rows.push(h('div',{style:{display:'flex',gap:8}}, h('button',{onClick:()=>this.mutate(d=>{const x=d.blocks[route][i];x.images=x.images||[];x.images.push(null);}),style:{flex:1,padding:'9px',borderRadius:8,border:'1px dashed '+P.gold,background:'transparent',color:P.maroon,cursor:'pointer',font:'600 13px '+this.HEAD}},'＋ Add slide'), h('button',{onClick:()=>this.mutate(d=>{const x=d.blocks[route][i];if((x.images||[]).length>1)x.images.pop();}),style:{flex:1,padding:'9px',borderRadius:8,border:'1px solid '+P.line,background:P.white,color:P.ink,cursor:'pointer',font:'600 13px '+this.HEAD}},'− Remove last'))); rows.push(h('p',{key:'ch',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Click the visible slide to upload its image.')); }
    if(b.type==='testimonial'){ rows.push(lbl('Star rating')); rows.push(segBtn([[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5']], b.stars||5, v=>this.setBlk(route,i,{stars:+v}))); rows.push(h('p',{key:'th',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Edit the quote, name and role on the page.')); }
    if(b.type==='counter'){ rows.push(field('Number',b.value,v=>this.setBlk(route,i,{value:v}))); rows.push(field('Suffix (+, %, K…)',b.suffix,v=>this.setBlk(route,i,{suffix:v}))); }
    if(b.type==='progress'){ rows.push(lbl('Percentage — '+(b.pct||0)+'%')); rows.push(h('input',{type:'range',min:0,max:100,step:1,value:b.pct||0,onChange:e=>this.setBlk(route,i,{pct:+e.target.value}),style:{width:'100%'}})); }
    if(b.type==='rating'){ rows.push(lbl('Stars filled')); rows.push(h('input',{type:'range',min:0,max:b.max||5,step:1,value:b.stars||0,onChange:e=>this.setBlk(route,i,{stars:+e.target.value}),style:{width:'100%'}})); rows.push(lbl('Out of')); rows.push(segBtn([[5,'5'],[10,'10']], b.max||5, v=>this.setBlk(route,i,{max:+v,stars:Math.min(b.stars||0,+v)}))); }
    if(b.type==='alert'){ rows.push(lbl('Type')); rows.push(segBtn([['info','Info'],['success','OK'],['warning','Warn'],['error','Error']], b.tone||'info', v=>this.setBlk(route,i,{tone:v}))); rows.push(h('p',{key:'ah',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Edit the title and message on the page.')); }
    if(b.type==='map'){ rows.push(field('Location or address',b.query,v=>this.setBlk(route,i,{query:v}))); }
    if(b.type==='html'){ rows.push(field('Custom HTML',b.code,v=>this.setBlk(route,i,{code:v}),{area:true,rows:8})); }
    if(b.type==='social'){ const nets=['facebook','instagram','youtube','whatsapp','x','linkedin']; rows.push(lbl('Links')); (b.links||[]).forEach((lk,j)=>{ rows.push(h('div',{key:'sl'+j,style:{display:'flex',gap:6,marginBottom:6}}, h('select',{value:lk.net,onChange:e=>this.mutate(d=>{d.blocks[route][i].links[j].net=e.target.value;}),style:{padding:'7px',borderRadius:8,border:'1px solid '+P.line,font:'400 12.5px Plus Jakarta Sans'}}, ...nets.map(nn=>h('option',{key:nn,value:nn},nn))), h('input',{value:lk.url||'',placeholder:'https://…',onChange:e=>this.mutate(d=>{d.blocks[route][i].links[j].url=e.target.value;}),style:{flex:1,minWidth:0,padding:'7px 9px',borderRadius:8,border:'1px solid '+P.line,font:'400 12.5px Plus Jakarta Sans'}}), h('button',{onClick:()=>this.mutate(d=>d.blocks[route][i].links.splice(j,1)),style:{border:'none',background:P.bad,color:P.cream,borderRadius:8,width:30,cursor:'pointer',flex:'0 0 auto'}},'✕'))); }); rows.push(h('button',{key:'addsl',onClick:()=>this.mutate(d=>{const x=d.blocks[route][i];x.links=x.links||[];x.links.push({net:'facebook',url:'#'});}),style:{marginTop:4,padding:'8px 14px',borderRadius:8,border:'1px dashed '+P.gold,background:'transparent',color:P.maroon,cursor:'pointer',font:'600 13px '+this.HEAD}},'＋ Add link')); }
    if(b.type==='tabs'||b.type==='accordion'){ const tk=b.type==='tabs'?'t':'q'; rows.push(lbl(b.type==='tabs'?'Tab titles':'Section titles')); (b.items||[]).forEach((it,j)=>{ rows.push(h('div',{key:'ti'+j,style:{display:'flex',gap:6,marginBottom:6}}, h('input',{value:it[tk]||'',onChange:e=>this.mutate(d=>{d.blocks[route][i].items[j][tk]=e.target.value;}),style:{flex:1,minWidth:0,padding:'8px 10px',borderRadius:8,border:'1px solid '+P.line,font:'400 13px Plus Jakarta Sans'}}), h('button',{onClick:()=>this.mutate(d=>{if((d.blocks[route][i].items||[]).length>1)d.blocks[route][i].items.splice(j,1);}),style:{border:'none',background:P.bad,color:P.cream,borderRadius:8,width:30,cursor:'pointer',flex:'0 0 auto'}},'✕'))); }); rows.push(h('button',{key:'addti',onClick:()=>this.mutate(d=>{const x=d.blocks[route][i];x.items=x.items||[];x.items.push(b.type==='tabs'?{t:'New tab',c:'Tab content.'}:{q:'New question?',a:'Answer.'});}),style:{marginTop:4,padding:'8px 14px',borderRadius:8,border:'1px dashed '+P.gold,background:'transparent',color:P.maroon,cursor:'pointer',font:'600 13px '+this.HEAD}},'＋ Add '+(b.type==='tabs'?'tab':'section'))); rows.push(h('p',{key:'tah',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Edit the body content on the page.')); }
    return h('div',{className:'aok-scroll',style:{position:'fixed',top:52,right:0,bottom:0,width:300,zIndex:1500,background:P.card,borderLeft:'1px solid '+P.line,boxShadow:'-10px 0 40px rgba(0,0,0,.12)',padding:'20px 22px',overflowY:'auto'}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}}, h('div',{style:{font:'800 16px '+this.HEAD,color:P.maroon,textTransform:'capitalize'}}, b.type+' block'), h('button',{onClick:()=>this.setState({selBlock:null}),style:{border:'none',background:'transparent',cursor:'pointer',font:'600 18px '+this.HEAD,color:P.muted}},'\u2715')),
      h('p',{style:{font:'400 12.5px/1.5 Plus Jakarta Sans',color:P.muted,margin:'4px 0 6px'}},'Edit text directly on the page. Use these controls for styling.'),
      ...rows); }

  // ----- settings panel for a widget inside a column -----
  renderChildPanel(path){ const h=React.createElement,P=this.P; const b=this.getIn(this.state.data,path); if(!b){ return null; } const s=b._s||{};
    const lbl=t=>h('div',{style:{font:'700 12px '+this.HEAD,color:P.maroon,letterSpacing:'.04em',textTransform:'uppercase',margin:'18px 0 8px'}},t);
    const segBtn=(opts,cur,fn)=>h('div',{style:{display:'flex',border:'1px solid '+P.line,borderRadius:9,overflow:'hidden'}}, ...opts.map(o=>h('button',{key:o[0],onClick:()=>fn(o[0]),style:{flex:1,padding:'8px 4px',border:'none',cursor:'pointer',background:cur===o[0]?P.maroon:P.white,color:cur===o[0]?P.cream:P.ink,font:'600 12.5px '+this.HEAD}},o[1])));
    const field=(label,val,fn,opts={})=>h('label',{style:{display:'block',marginTop:12}}, h('span',{style:{display:'block',font:'600 12px '+this.HEAD,color:P.maroon,marginBottom:5}},label), opts.area? h('textarea',{value:val||'',rows:opts.rows||2,onChange:e=>fn(e.target.value),style:{width:'100%',padding:'9px 11px',borderRadius:9,border:'1px solid '+P.line,background:P.white,font:'400 14px Plus Jakarta Sans',resize:'vertical'}}) : h('input',{value:val||'',onChange:e=>fn(e.target.value),style:{width:'100%',padding:'9px 11px',borderRadius:9,border:'1px solid '+P.line,background:P.white,font:'400 14px Plus Jakarta Sans'}}));
    const txtSw=[['ink',P.ink],['maroon',P.maroon],['red',P.red],['gold',P.gold]]; const wIcons=['☉','☽','♀','♂','☯','✦','✶','ॐ','☀','☎','✚','✪','★','♥','⚑','◈'];
    const rows=[];
    if(['heading','text','quote','iconbox','button'].includes(b.type)){ rows.push(lbl('Text colour')); rows.push(h('div',{style:{display:'flex',gap:8}}, ...txtSw.map(c=>h('button',{key:c[0],onClick:()=>this.patchBlkStyle(path,{color:c[1]}),style:{width:30,height:30,borderRadius:8,cursor:'pointer',background:c[1],border:(s.color||'')===c[1]?'2px solid '+P.maroon:'1px solid '+P.line}})))); }
    if(['heading','text','button','quote','image'].includes(b.type)){ rows.push(lbl('Alignment')); rows.push(segBtn([['left','←'],['center','≡'],['right','→']], (b.type==='image'?(b.align||'center'):(s.align||'left')), v=>{ if(b.type==='image') this.patchBlk(path,{align:v}); else this.patchBlkStyle(path,{align:v}); })); }
    if(b.type==='button'){ rows.push(field('Button label',b.label,v=>this.patchBlk(path,{label:v}))); rows.push(lbl('Links to page')); rows.push(segBtn([['home','Home'],['services','Services'],['contact','Contact']], b.route||'contact', v=>this.patchBlk(path,{route:v}))); rows.push(lbl('Style')); rows.push(segBtn([['solid','Solid'],['gold','Gold'],['outline','Outline']], s.btnVariant||'solid', v=>this.patchBlkStyle(path,{btnVariant:v}))); }
    if(b.type==='iconbox'){ rows.push(lbl('Icon')); rows.push(h('div',{style:{display:'flex',flexWrap:'wrap',gap:6}}, ...wIcons.map(ic=>h('button',{key:ic,onClick:()=>this.patchBlk(path,{icon:ic}),style:{width:32,height:32,borderRadius:8,cursor:'pointer',border:b.icon===ic?'2px solid '+P.maroon:'1px solid '+P.line,background:P.white,font:'17px '+this.HEAD,color:P.gold}},ic)))); }
    if(b.type==='spacer'){ rows.push(lbl('Height — '+(b.h||32)+'px')); rows.push(h('input',{type:'range',min:8,max:160,step:4,value:b.h||32,onChange:e=>this.patchBlkLive(path,{h:+e.target.value}),style:{width:'100%'}})); }
    if(b.type==='image'){ rows.push(lbl('Size — '+(b.w||100)+'% width')); rows.push(h('input',{type:'range',min:10,max:100,step:1,value:b.w||100,onChange:e=>this.patchBlkLive(path,{w:+e.target.value}),style:{width:'100%'}}));
      rows.push(lbl('Shape')); rows.push(segBtn([['16/9','Wide'],['4/3','Std'],['1/1','Square'],['3/4','Tall']], b.ar||'4/3', v=>this.patchBlk(path,{ar:v})));
      rows.push(field('Alt text (SEO)',b.alt,v=>this.patchBlk(path,{alt:v}))); rows.push(field('Caption',b.caption,v=>this.patchBlk(path,{caption:v}))); rows.push(field('Description / title (SEO)',b.desc,v=>this.patchBlk(path,{desc:v}),{area:true,rows:2}));
      rows.push(h('p',{key:'cih',style:{font:'400 11.5px/1.5 Plus Jakarta Sans',color:P.muted,marginTop:8}},'Drag the gold ↔ handle on the image to resize, or drag the image to reposition inside its frame.')); }
    return h('div',{className:'aok-scroll',style:{position:'fixed',top:52,right:0,bottom:0,width:300,zIndex:1500,background:P.card,borderLeft:'1px solid '+P.line,boxShadow:'-10px 0 40px rgba(0,0,0,.12)',padding:'20px 22px',overflowY:'auto'}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center'}}, h('div',{style:{font:'800 16px '+this.HEAD,color:P.maroon,textTransform:'capitalize'}}, b.type+' (in column)'), h('button',{onClick:()=>this.setState({selBlock:null}),style:{border:'none',background:'transparent',cursor:'pointer',font:'600 18px '+this.HEAD,color:P.muted}},'✕')),
      h('p',{style:{font:'400 12.5px/1.5 Plus Jakarta Sans',color:P.muted,margin:'4px 0 6px'}},'Edit text directly on the page. Use these controls for styling.'),
      ...rows); }

  // ---------- EDIT BAR ----------
  renderEditBar(){ const h=React.createElement,P=this.P; const pages=[['home','Home'],['about','About'],['services','Services'],['meditation','Meditation'],['blog','Blog'],['faq','FAQ'],['contact','Contact']];
    const T=(label,fn,title,active)=>h('button',{title,onMouseDown:e=>e.preventDefault(),onClick:e=>{e.preventDefault();fn();},style:{minWidth:30,height:30,padding:'0 8px',borderRadius:7,border:'1px solid rgba(247,239,224,.22)',background:active?P.goldL:'transparent',color:active?P.maroonD:P.cream,cursor:'pointer',font:'600 13px '+this.HEAD,flex:'0 0 auto'}},label);
    const cmd=(label,c,arg,title)=>T(label,()=>this.exec(c,arg),title);
    const sep=()=>h('div',{style:{width:1,height:22,background:'rgba(247,239,224,.18)',flex:'0 0 auto'}});
    const colorSw=[P.maroon,P.red,P.gold,P.ink,'#3f7d4e'];
    const dev=this.state.device||'desktop';
    const linkFn=()=>{ const sel=document.getSelection&&document.getSelection().toString(); const url=prompt('Link URL (https://\u2026)\nSelected text: '+(sel||'(select text first)')); if(url) this.exec('createLink',url); };
    return h('div',{style:{position:'fixed',top:0,left:0,right:0,height:52,zIndex:1600,background:P.maroon,color:P.cream,display:'flex',alignItems:'center',gap:8,padding:'0 14px',boxShadow:'0 4px 20px rgba(0,0,0,.25)',overflowX:'auto',whiteSpace:'nowrap'}},
      h('span',{style:{font:'700 13px '+this.HEAD,color:P.goldL,flex:'0 0 auto'}},'\u270e Editor'),
      this.state.postId? h('span',{style:{display:'inline-flex',alignItems:'center',gap:7,flex:'0 0 auto',padding:'5px 11px',borderRadius:7,background:P.maroonD,font:'600 12.5px '+this.HEAD,color:P.cream,maxWidth:240,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}, '\u270d Post: ', ((this.state.data.blog.find(x=>x.id===this.state.postId)||{}).title||'Untitled'))
        : h('select',{value:this.state.route,onChange:e=>this.go(e.target.value),style:{padding:'6px 8px',borderRadius:7,border:'1px solid rgba(247,239,224,.3)',background:P.maroonD,color:P.cream,font:'600 12.5px '+this.HEAD,flex:'0 0 auto'}}, ...pages.map(p=>h('option',{key:p[0],value:p[0]},p[1]))),
      sep(),
      h('select',{title:'Text style',onMouseDown:e=>e.stopPropagation(),onChange:e=>{ this.exec('formatBlock',e.target.value); e.target.selectedIndex=0; },style:{padding:'6px 8px',borderRadius:7,border:'1px solid rgba(247,239,224,.3)',background:P.maroonD,color:P.cream,font:'600 12.5px '+this.HEAD,flex:'0 0 auto'}}, h('option',{value:''},'Style'), h('option',{value:'H2'},'Heading'), h('option',{value:'H3'},'Subheading'), h('option',{value:'P'},'Paragraph')),
      h('select',{title:'Text size',onChange:e=>{ this.exec('fontSize',e.target.value); e.target.selectedIndex=0; },style:{padding:'6px 8px',borderRadius:7,border:'1px solid rgba(247,239,224,.3)',background:P.maroonD,color:P.cream,font:'600 12.5px '+this.HEAD,flex:'0 0 auto'}}, h('option',{value:''},'Size'), h('option',{value:'2'},'Small'), h('option',{value:'3'},'Normal'), h('option',{value:'5'},'Large'), h('option',{value:'7'},'Huge')),
      sep(),
      cmd('B','bold',null,'Bold'), cmd('I','italic',null,'Italic'), cmd('U','underline',null,'Underline'),
      cmd('\u2022','insertUnorderedList',null,'Bullet list'), cmd('1.','insertOrderedList',null,'Numbered list'),
      cmd('\u2261','justifyLeft',null,'Align left'), cmd('\u2637','justifyCenter',null,'Align centre'), cmd('\u2630','justifyRight',null,'Align right'),
      h('div',{style:{display:'flex',gap:3,alignItems:'center',flex:'0 0 auto'}}, ...colorSw.map(c=>h('button',{key:c,title:'Text colour',onMouseDown:e=>e.preventDefault(),onClick:()=>this.exec('foreColor',c),style:{width:18,height:18,borderRadius:'50%',background:c,border:'1px solid rgba(247,239,224,.5)',cursor:'pointer',flex:'0 0 auto'}}))),
      T('\u2693',()=>linkFn(),'Add link'),
      cmd('\u239d','removeFormat',null,'Clear formatting'),
      sep(),
      T('\u21b6',()=>this.undo(),'Undo'), T('\u21b7',()=>this.redo(),'Redo'), T('Revert',()=>this.revertSaved(),'Revert to opening state'),
      sep(),
      h('div',{style:{display:'flex',gap:3,flex:'0 0 auto'}}, T('\u25a2',()=>this.setState({device:'desktop'}),'Desktop',dev==='desktop'), T('\u25af',()=>this.setState({device:'tablet'}),'Tablet',dev==='tablet'), T('\u2399',()=>this.setState({device:'mobile'}),'Mobile',dev==='mobile')),
      h('div',{style:{flex:1,minWidth:10}}),
      this.btn('\u2913 Save',()=>this.saveNow(),{variant:'solid',pad:'8px 16px',style:{fontSize:13,flex:'0 0 auto'}}),
      this.btn('Done',()=>this.setState({editMode:false,selBlock:null,route:'admin',adminTab:this.state.postId?'blog':'pages',postId:null}),{variant:'gold',pad:'8px 16px',style:{fontSize:13,flex:'0 0 auto'}})); }

  // ================= ADMIN =================
  renderAdmin(){ if(!this.state.authed) return this.renderLogin(); return this.renderAdminShell(); }

  renderLogin(){ const h=React.createElement,P=this.P;
    return h('div',{style:{minHeight:'100vh',background:'linear-gradient(160deg,'+P.maroon+','+P.maroonD+')',display:'flex',alignItems:'center',justifyContent:'center',padding:24}},
      h('form',{onSubmit:e=>{e.preventDefault(); this.login();},style:{background:P.card,borderRadius:22,padding:'44px 40px',width:'100%',maxWidth:400,boxShadow:'0 30px 70px rgba(0,0,0,.4)'}},
        h('div',{style:{display:'flex',justifyContent:'center',marginBottom:20}},this.mark(58)),
        h('h1',{style:{font:'800 24px '+this.HEAD,color:P.maroon,textAlign:'center',margin:'0 0 4px'}},'Admin Login'),
        h('p',{style:{font:'400 14px Plus Jakarta Sans',color:P.muted,textAlign:'center',margin:'0 0 24px'}},'Analysis of Karma \u00b7 Website Builder'),
        h('input',{type:'password',value:this.state.pass,onChange:e=>this.setState({pass:e.target.value}),placeholder:'Password',autoFocus:true,style:{width:'100%',padding:'13px 15px',borderRadius:11,border:'1px solid '+P.line,background:P.white,font:'400 15px Plus Jakarta Sans',marginBottom:14}}),
        this.btn('Enter dashboard',null,{variant:'solid',style:{width:'100%',justifyContent:'center'}}),
        h('div',{style:{textAlign:'center',marginTop:18}}, h('a',{onClick:()=>this.go('home'),style:{cursor:'pointer',font:'500 13px Plus Jakarta Sans',color:P.muted}},'\u2190 Back to website'))), this.renderToast());}

  renderAdminShell(){ const h=React.createElement,P=this.P;
    const tabs=[['dashboard','\u25C8 Dashboard'],['pages','\u270e Visual Editor'],['services','\u2609 Services'],['blog','\u270d Blog'],['leads','\u2709 Leads'],['seo','\u2191 SEO'],['schema','{ } Schema'],['submit','\u2691 Search Engines'],['local','\u2316 Local & Business'],['person','\u2726 Practitioner'],['ai','\u25ce AI & GEO'],['redirects','\u21aa Redirects'],['health','\u271a SEO Health'],['settings','\u2699 Settings']];
    const unread=(this.state.data.leads||[]).filter(l=>!l.read).length;
    return h('div',{style:{minHeight:'100vh',display:'grid',gridTemplateColumns:'260px 1fr',background:P.bg}},
      h('aside',{style:{background:P.maroonD,color:P.cream,padding:'24px 16px',position:'sticky',top:0,height:'100vh',overflowY:'auto'}},
        h('div',{style:{display:'flex',alignItems:'center',gap:11,padding:'0 8px 22px'}}, this.mark(36), h('div',null,h('div',{style:{font:'800 16px '+this.HEAD,color:P.cream}},'Admin'),h('div',{style:{font:'500 11px '+this.HEAD,color:P.goldL,letterSpacing:'.1em'}},'WEBSITE BUILDER'))),
        h('nav',{style:{display:'grid',gap:4}}, ...tabs.map(tb=>h('button',{key:tb[0],onClick:()=>this.setState({adminTab:tb[0]}),style:{display:'flex',justifyContent:'space-between',alignItems:'center',textAlign:'left',padding:'11px 14px',borderRadius:10,border:'none',cursor:'pointer',font:'600 14px '+this.HEAD,background:this.state.adminTab===tb[0]?P.red:'transparent',color:this.state.adminTab===tb[0]?P.cream:'rgba(247,239,224,.75)'}}, h('span',null,tb[1]), tb[0]==='leads'&&unread?h('span',{style:{background:P.goldL,color:P.maroonD,borderRadius:999,padding:'1px 8px',font:'700 11px '+this.HEAD}},unread):null))),
        h('div',{style:{marginTop:22,paddingTop:18,borderTop:'1px solid rgba(247,239,224,.12)',display:'grid',gap:8}},
          h('button',{onClick:()=>this.go('home'),style:{padding:'10px 14px',borderRadius:10,border:'1px solid rgba(247,239,224,.25)',background:'transparent',color:P.cream,cursor:'pointer',font:'600 13px '+this.HEAD}},'\u2197 View website'),
          h('button',{onClick:()=>this.logout(),style:{padding:'10px 14px',borderRadius:10,border:'none',background:'transparent',color:'rgba(247,239,224,.6)',cursor:'pointer',font:'600 13px '+this.HEAD,textAlign:'left'}},'\u23fb Log out'))),
      h('main',{className:'aok-scroll',style:{padding:'34px 38px',overflowY:'auto',height:'100vh'}}, this.renderAdminTab()),
      this.renderToast()); }

  adminHead(title,sub){ const P=this.P,h=React.createElement; return h('div',{style:{marginBottom:26,display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:20}}, h('div',null, h('h1',{style:{font:'800 27px '+this.HEAD,color:P.maroon,margin:'0 0 6px',letterSpacing:'-.01em'}},title), sub?h('p',{style:{font:'400 15px Plus Jakarta Sans',color:P.muted,margin:0,maxWidth:680}},sub):null), h('button',{onClick:()=>this.saveNow(),title:'Save all changes',style:{flex:'0 0 auto',display:'inline-flex',alignItems:'center',gap:8,padding:'12px 22px',borderRadius:999,border:'none',background:P.red,color:P.cream,font:'700 14px '+this.HEAD,cursor:'pointer',boxShadow:'0 6px 20px rgba(125,31,18,.28)',whiteSpace:'nowrap'}},'\u2913 Save changes')); }
  card(children,style){ return React.createElement('div',{style:{background:this.P.card,border:'1px solid '+this.P.line,borderRadius:16,padding:24,...style}}, children); }
  inp(path,opts={}){ const h=React.createElement,P=this.P; const v=this.getIn(this.state.data,path)??''; const common={value:v,onChange:e=>this.commit(path,e.target.value),placeholder:opts.placeholder,style:{width:'100%',padding:'11px 13px',borderRadius:10,border:'1px solid '+P.line,background:P.white,font:'400 14.5px Plus Jakarta Sans',color:P.ink,resize:'vertical'}};
    let ctrl; if(opts.options) ctrl=h('select',{...common},...opts.options.map(o=>h('option',{key:o.value??o,value:o.value??o},o.label??o))); else if(opts.multiline) ctrl=h('textarea',{...common,rows:opts.rows||4}); else ctrl=h('input',{...common,type:opts.type||'text'});
    return h('label',{key:path,style:{display:'block',marginBottom:opts.mb??16}}, opts.label?h('span',{style:{display:'block',font:'600 12.5px '+this.HEAD,color:P.maroon,marginBottom:6,letterSpacing:'.02em'}},opts.label, opts.hint?h('span',{style:{fontWeight:400,color:P.muted}},'  \u2014 '+opts.hint):null):null, ctrl); }

  renderAdminTab(){ switch(this.state.adminTab){ case 'pages':return this.tabPages(); case 'services':return this.tabServices(); case 'blog':return this.tabBlog(); case 'leads':return this.tabLeads(); case 'seo':return this.tabSeo(); case 'schema':return this.tabSchema(); case 'submit':return this.tabSubmit(); case 'local':return this.tabLocal(); case 'person':return this.tabPerson(); case 'ai':return this.tabAi(); case 'redirects':return this.tabRedirects(); case 'health':return this.tabHealth(); case 'settings':return this.tabSettings(); default:return this.tabDashboard(); } }

  // ----- dashboard -----
  tabDashboard(){ const h=React.createElement,P=this.P,d=this.state.data; const unread=(d.leads||[]).filter(l=>!l.read).length;
    const stat=(n,l,tab)=>h('button',{key:l,onClick:()=>tab&&this.setState({adminTab:tab}),style:{textAlign:'left',background:P.card,border:'1px solid '+P.line,borderRadius:16,padding:'22px 24px',cursor:tab?'pointer':'default'}},h('div',{style:{font:'800 30px '+this.HEAD,color:P.maroon}},n),h('div',{style:{font:'500 14px Plus Jakarta Sans',color:P.muted,marginTop:4}},l));
    const action=(t,desc,tab)=>h('button',{key:t,onClick:()=>this.setState({adminTab:tab}),style:{textAlign:'left',background:P.card,border:'1px solid '+P.line,borderRadius:14,padding:'18px 20px',cursor:'pointer',transition:'transform .15s',},onMouseEnter:e=>e.currentTarget.style.transform='translateY(-2px)',onMouseLeave:e=>e.currentTarget.style.transform='none'},h('div',{style:{font:'700 16px '+this.HEAD,color:P.maroon,marginBottom:5}},t),h('div',{style:{font:'400 13.5px/1.5 Plus Jakarta Sans',color:P.muted}},desc));
    return h('div',null, this.adminHead('Welcome back, '+d.brand.astrologer.split(' ')[0],'Manage every part of your Vedic astrology website from here \u2014 no code needed.'),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:30}}, stat(d.services.length,'Services','services'), stat(d.blog.length,'Blog posts','blog'), stat(unread,'New leads','leads'), stat('5','Pages live','seo')),
      h('h2',{style:{font:'700 18px '+this.HEAD,color:P.maroon,margin:'0 0 14px'}},'Quick actions'),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}},
        action('\u270e Edit pages visually','Click-and-edit text, swap photos, add links.','pages'),
        action('\u2609 Add a service','Create new astrology services anytime.','services'),
        action('\u270d Write a blog post','Publish SEO articles to rank on Google.','blog'),
        action('\u2191 Tune SEO','Focus keywords, meta tags & live analysis.','seo'),
        action('\u2691 Submit to search engines','Sitemap, robots & one-click submission links.','submit'),
        action('\u2699 Site settings','Contact email, map, social links & password.','settings'),
        action('\u271a SEO health check','One score for titles, schema, local details & crawl files.','health'),
        action('\u2316 Local & Business profile','Service area, hours & Google Business Profile links.','local'),
        action('\u25ce AI & GEO','Choose which AI assistants may read and cite you.','ai'))); }

  // ----- pages / visual editor -----
  tabPages(){ const h=React.createElement,P=this.P,d=this.state.data; const pages=[['home','Home','The hero, services overview, about preview & call-to-action.'],['about','About Us','Your story, values, the FAQ section and the closing quote.'],['services','Services','The services listing page \u2014 hero, the service cards, and any blocks you add.'],['meditation','Meditation','The intro, your \u201cprofessional meditation guide\u201d text and the offerings.'],['blog','Blog','The blog listing page. To design an individual post, open Admin \u2192 Blog \u2192 \u270e Design.'],['faq','FAQ','All your frequently asked questions \u2014 add, edit and reorder them here. They also power the FAQ structured data for Google and AI answers.'],['contact','Contact Us','Heading, note, the form intro and the FAQ section.']];
    const builtins=[['home','Home'],['about','About Us'],['services','Services'],['meditation','Meditation'],['blog','Blog'],['faq','FAQ'],['contact','Contact Us']];
    const custom=d.pages||[];
    const navItems=(d.nav&&d.nav.items)||[];
    const fldLbl=t=>h('span',{style:{display:'block',font:'600 11.5px '+this.HEAD,color:P.maroon,marginBottom:5,letterSpacing:'.02em'}},t);
    const slugBlur=(i,raw)=>{ const want=this.uniqueSlug(raw||custom[i].title,custom[i].id); if(want!==custom[i].slug) this.commit('pages.'+i+'.slug',want); };
    // ---- Custom Pages manager ----
    const cloneOpts=builtins.map(b=>['route:'+b[0],'Clone: '+b[1]]).concat(custom.map(p=>['page:'+p.id,'Clone: '+(p.title||'Untitled')]));
    const pagesMgr=this.card(h('div',null,
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12,marginBottom:6}},
        h('div',{style:{font:'700 16px '+this.HEAD,color:P.maroon}},'Custom pages'),
        h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
          this.btn('\uff0b Create new page',()=>this.createPage(),{variant:'gold',pad:'9px 16px',style:{fontSize:13}}),
          this.btn('\u29c9 Clone a page\u2026',()=>this.setState({_clonePick:!this.state._clonePick}),{variant:'outline',pad:'9px 16px',style:{fontSize:13}}))),
      h('p',{style:{font:'400 13px/1.55 Plus Jakarta Sans',color:P.muted,margin:'0 0 14px'}},'Create brand-new pages or clone an existing one, then give each its own web address (slug). Click ',h('b',null,'Design'),' to build a page with the visual editor, and add it to the menu bar below so visitors can find it.'),
      this.state._clonePick? h('div',{style:{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center',background:P.bgAlt,border:'1px dashed '+P.line,borderRadius:12,padding:12,marginBottom:16}},
        fldLbl('Copy everything from'),
        h('select',{value:this._cloneSrc||cloneOpts[0][0],onChange:e=>{this._cloneSrc=e.target.value;this.forceUpdate();},style:{padding:'10px 12px',borderRadius:9,border:'1px solid '+P.line,background:P.white,font:'400 14px Plus Jakarta Sans',cursor:'pointer'}}, ...cloneOpts.map(o=>h('option',{key:o[0],value:o[0]},o[1]))),
        this.btn('Create the copy',()=>{ const src=this._cloneSrc||cloneOpts[0][0]; const isPage=src.indexOf('page:')===0; const scope=isPage?src:src.replace('route:',''); const title=isPage?((custom.find(p=>'page:'+p.id===src)||{}).title||'Page'):(builtins.find(b=>b[0]===scope)||[,'Page'])[1]; const id=this.clonePageFrom(scope,title); this.setState({_clonePick:false}); },{variant:'solid',pad:'10px 16px',style:{fontSize:13}})):null,
      custom.length? h('div',{style:{display:'grid',gap:12}}, ...custom.map((p,i)=>h('div',{key:p.id,style:{border:'1px solid '+P.line,borderRadius:12,padding:14,background:P.white}},
        h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:10}},
          h('label',null,fldLbl('Page title'),h('input',{value:p.title||'',onChange:e=>this.commit('pages.'+i+'.title',e.target.value),style:{width:'100%',padding:'10px 12px',borderRadius:9,border:'1px solid '+P.line,background:P.white,font:'400 14px Plus Jakarta Sans'}})),
          h('label',null,fldLbl('Web address (slug)'),h('div',{style:{display:'flex',alignItems:'center',gap:4}}, h('span',{style:{font:'500 13px Plus Jakarta Sans',color:P.muted}},'/'), h('input',{defaultValue:p.slug,key:p.slug,onBlur:e=>slugBlur(i,e.target.value),style:{width:'100%',padding:'10px 12px',borderRadius:9,border:'1px solid '+P.line,background:P.white,font:'400 14px Plus Jakarta Sans'}})))),
        h('div',{style:{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',justifyContent:'space-between'}},
          h('label',{style:{display:'flex',alignItems:'center',gap:7,font:'500 13px Plus Jakarta Sans',color:P.ink,cursor:'pointer'}}, h('input',{type:'checkbox',checked:p.showTitle!==false,onChange:e=>this.commit('pages.'+i+'.showTitle',e.target.checked)}),'Show title banner at top'),
          h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
            h('a',{href:'/'+(p.slug||''),target:'_blank',rel:'noopener',style:{font:'600 13px '+this.HEAD,color:P.muted,textDecoration:'none',alignSelf:'center'}},'View \u2197'),
            this.btn('\u270e Design',()=>this.setState({route:'page',pageId:p.id,postId:null,editMode:true,authed:true,selBlock:null}),{variant:'solid',pad:'9px 16px',style:{fontSize:13}}),
            h('button',{onClick:()=>this.deletePage(p.id),style:{...this.iconBtn(true),width:'auto',padding:'9px 14px'}},'\u2715 Delete')))))) : h('p',{style:{font:'400 13.5px Plus Jakarta Sans',color:P.muted,fontStyle:'italic',margin:0}},'No custom pages yet. Click \u201cCreate new page\u201d or \u201cClone a page\u201d to add one.')));
    // ---- Navigation menu manager ----
    const targetCtrl=(it,i)=>{ if(it.type==='url') return h('div',{style:{display:'flex',gap:8,alignItems:'center',flex:'1 1 220px'}},
        h('input',{value:it.value||'',placeholder:'https://\u2026 or tel: / mailto:',onChange:e=>this.commit('nav.items.'+i+'.value',e.target.value),style:{flex:1,padding:'9px 11px',borderRadius:9,border:'1px solid '+P.line,background:P.white,font:'400 13.5px Plus Jakarta Sans'}}),
        h('label',{style:{display:'flex',alignItems:'center',gap:5,font:'500 12px Plus Jakarta Sans',color:P.ink,whiteSpace:'nowrap',cursor:'pointer'}}, h('input',{type:'checkbox',checked:!!it.newTab,onChange:e=>this.commit('nav.items.'+i+'.newTab',e.target.checked)}),'New tab'));
      const opts=it.type==='page'?custom.map(p=>[p.id,p.title||'Untitled']):builtins;
      return h('select',{value:it.value||'',onChange:e=>this.commit('nav.items.'+i+'.value',e.target.value),style:{flex:'1 1 200px',padding:'9px 11px',borderRadius:9,border:'1px solid '+P.line,background:P.white,font:'400 13.5px Plus Jakarta Sans',cursor:'pointer'}}, opts.length?null:h('option',{value:''},'\u2014 no pages yet \u2014'), ...opts.map(o=>h('option',{key:o[0],value:o[0]},o[1]))); };
    const navMgr=this.card(h('div',null,
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12,marginBottom:6}},
        h('div',{style:{font:'700 16px '+this.HEAD,color:P.maroon}},'Menu bar'),
        this.btn('\uff0b Add menu item',()=>this.navAdd(),{variant:'gold',pad:'9px 16px',style:{fontSize:13}})),
      h('p',{style:{font:'400 13px/1.55 Plus Jakarta Sans',color:P.muted,margin:'0 0 14px'}},'Add, rename, reorder or remove the links in your site\u2019s top navigation. Point a link at a built-in page, one of your custom pages, or any external web address.'),
      navItems.length? h('div',{style:{display:'grid',gap:10}}, ...navItems.map((it,i)=>h('div',{key:it.id||i,style:{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',border:'1px solid '+P.line,borderRadius:12,padding:'10px 12px',background:P.white}},
        h('div',{style:{display:'flex',flexDirection:'column',gap:2}}, h('button',{onClick:()=>this.navMove(i,-1),disabled:i===0,style:{...this.iconBtn(),width:26,height:20,opacity:i===0?.35:1,fontSize:11}},'\u2191'), h('button',{onClick:()=>this.navMove(i,1),disabled:i===navItems.length-1,style:{...this.iconBtn(),width:26,height:20,opacity:i===navItems.length-1?.35:1,fontSize:11}},'\u2193')),
        h('input',{value:it.label||'',placeholder:'Label',onChange:e=>this.commit('nav.items.'+i+'.label',e.target.value),style:{flex:'1 1 130px',padding:'9px 11px',borderRadius:9,border:'1px solid '+P.line,background:P.white,font:'600 13.5px Plus Jakarta Sans'}}),
        h('select',{value:it.type||'route',onChange:e=>this.navSetType(i,e.target.value),style:{flex:'0 0 auto',padding:'9px 11px',borderRadius:9,border:'1px solid '+P.line,background:P.white,font:'400 13.5px Plus Jakarta Sans',cursor:'pointer'}}, h('option',{value:'route'},'Built-in page'), h('option',{value:'page'},'Custom page'), h('option',{value:'url'},'External link')),
        targetCtrl(it,i),
        h('button',{onClick:()=>this.navDel(i),style:{...this.iconBtn(true),width:34,height:34,flex:'0 0 auto'}},'\u2715')))) : h('p',{style:{font:'400 13.5px Plus Jakarta Sans',color:P.muted,fontStyle:'italic',margin:0}},'No menu items. Click \u201cAdd menu item\u201d to start.')));
    return h('div',null, this.adminHead('Visual Editor','A full page builder \u2014 click any text to edit with the rich toolbar (headings, size, colour, alignment, lists, links), swap images, and use \uff0b Add a block to drop in new sections (headings, text, images, buttons, CTA banners, quotes, checklists and more). Drag blocks to reorder, style each one, preview on desktop/tablet/mobile, and undo/redo or revert anytime. Changes save automatically.'),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}}, ...pages.map(p=>h('div',{key:p[0],style:{background:P.card,border:'1px solid '+P.line,borderRadius:16,padding:24,display:'flex',flexDirection:'column'}},
        h('div',{style:{font:'700 18px '+this.HEAD,color:P.maroon,marginBottom:6}},p[1]),
        h('p',{style:{font:'400 14px/1.55 Plus Jakarta Sans',color:P.muted,flex:1,margin:'0 0 18px'}},p[2]),
        this.btn('\u270e Edit '+p[1],()=>this.setState({route:p[0],editMode:true,authed:true,postId:null}),{variant:'solid',pad:'11px 20px',style:{fontSize:14,alignSelf:'flex-start'}})))),
      h('div',{style:{marginTop:20,display:'grid',gap:20}}, pagesMgr, navMgr),
      this.card(h('div',null,h('div',{style:{font:'700 15px '+this.HEAD,color:P.maroon,marginBottom:8}},'\u2139 How the visual editor works'),h('ul',{style:{font:'400 14px/1.7 Plus Jakarta Sans',color:P.ink,margin:0,paddingLeft:20}},h('li',null,'Click directly on any heading or paragraph and start typing.'),h('li',null,'Select text, then use the ',h('b',null,'\u2693 Link'),' button in the top bar to turn it into a hyperlink (to your Instagram, YouTube, etc).'),h('li',null,'Hover over any photo and click ',h('b',null,'Replace image'),' to upload a new one.'),h('li',null,'Build side-by-side layouts with ',h('b',null,'＋ Add a block → Columns / Row'),'. Inside each column click ',h('b',null,'＋ Add here'),' to drop in text, images or buttons, drag the gold bars between columns to change their widths, and add/remove columns from the settings panel. Columns stack automatically on mobile.'),h('li',null,'Add a picture anywhere with ',h('b',null,'＋ Add a block → Image'),'. Then click it to select, and drag the gold ',h('b',null,'↔ resize'),' handle to make it bigger or smaller — like in Microsoft Word.'),h('li',null,'With an image block selected, the right-hand panel lets you set its ',h('b',null,'size, alignment (left/centre/right), shape, alt text, caption and SEO description'),'. Drag the image itself to reposition it inside the frame, and use ＋ / − to zoom.'),h('li',null,'Click ',h('b',null,'Done'),' in the top bar to return here. Everything saves automatically.'))),{marginTop:20})); }

  // ----- services -----
  tabServices(){ const h=React.createElement,P=this.P,d=this.state.data;
    const upd=(i,k,v)=>{ const arr=[...d.services]; arr[i]={...arr[i],[k]:v}; this.commit('services',arr); };
    const move=(i,dir)=>{ const arr=[...d.services]; const j=i+dir; if(j<0||j>=arr.length)return; [arr[i],arr[j]]=[arr[j],arr[i]]; this.commit('services',arr); };
    const del=i=>{ if(!confirm('Delete this service?'))return; const arr=[...d.services]; arr.splice(i,1); this.commit('services',arr); };
    const add=()=>{ this.commit('services',[...d.services,{id:this.uid(),icon:'\u2727',title:'New service',price:'$100 CAD',desc:'Describe this service\u2026',detail:'',image:null}]); this.flash('Service added'); };
    const icons=['\u2609','\u263d','\u2640','\u2642','\u2643','\u2644','\u2645','\u269a','\u262f','\u2727','\u2728','\u0950','\u2600','\u260e','\u263c','\u2666','\u2606','\u2695'];
    return h('div',null, this.adminHead('Services','Create, edit and reorder the services shown on your site. Add as many as you like \u2014 they appear on the Home and Services pages automatically.'),
      h('div',{style:{marginBottom:18}}, this.btn('+ Add new service',add,{variant:'solid'})),
      h('div',{style:{display:'grid',gap:16}}, ...d.services.map((s,i)=>this.card(h('div',null,
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}},
          h('div',{style:{font:'700 14px '+this.HEAD,color:P.gold}},'Service '+(i+1)),
          h('div',{style:{display:'flex',gap:6}}, h('button',{onClick:()=>move(i,-1),style:this.iconBtn()},'\u2191'), h('button',{onClick:()=>move(i,1),style:this.iconBtn()},'\u2193'), h('button',{onClick:()=>del(i),style:this.iconBtn(true)},'\u2715'))),
        h('div',{style:{display:'grid',gridTemplateColumns:'90px 1fr 150px',gap:14,alignItems:'start'}},
          h('div',null, h('div',{style:{font:'600 12.5px '+this.HEAD,color:P.maroon,marginBottom:6}},'Icon'), h('select',{value:s.icon,onChange:e=>upd(i,'icon',e.target.value),style:{width:'100%',padding:'11px',borderRadius:10,border:'1px solid '+P.line,background:P.white,fontSize:20,textAlign:'center'}},...icons.map(ic=>h('option',{key:ic,value:ic},ic)))),
          h('div',null, h('div',{style:{font:'600 12.5px '+this.HEAD,color:P.maroon,marginBottom:6}},'Title'), h('input',{value:s.title,onChange:e=>upd(i,'title',e.target.value),style:this.inpStyle()})),
          h('div',null, h('div',{style:{font:'600 12.5px '+this.HEAD,color:P.maroon,marginBottom:6}},'Price'), h('input',{value:s.price,onChange:e=>upd(i,'price',e.target.value),style:this.inpStyle()}))),
        h('div',{style:{marginTop:12}}, h('div',{style:{font:'600 12.5px '+this.HEAD,color:P.maroon,marginBottom:6}},'Description'), h('textarea',{value:s.desc,onChange:e=>upd(i,'desc',e.target.value),rows:2,style:this.inpStyle()})), h('div',{style:{marginTop:12}}, h('div',{style:{font:'600 12.5px '+this.HEAD,color:P.maroon,marginBottom:6}},'Detailed description ',h('span',{style:{fontWeight:400,color:P.muted}},'\u2014 shown when a visitor clicks \u201cRead more\u201d')), h('textarea',{value:s.detail||'',onChange:e=>upd(i,'detail',e.target.value),rows:5,style:this.inpStyle()})), this.svcSeoPanel(s,i,upd))))) ); }
  // per-service page address, SEO title/description, canonical, 301 redirect and noindex (collapsed by default)
  svcSeoPanel(s,i,upd){ const h=React.createElement,P=this.P; const open=(this._svcSeo||{})[s.id]; const url='/services/'+this.serviceSlugs(this.state.data.services)[s.id];
    const toggle=()=>{ this._svcSeo={...(this._svcSeo||{}),[s.id]:!open}; this.forceUpdate(); };
    const flags=[s.redirectTo?'\u21aa merged \u2192 '+s.redirectTo:null,s.canonical?'canonical \u2192 '+s.canonical:null,s.noindex?'hidden from Google':null].filter(Boolean);
    const f=(k,label,hint,ph,multi)=>h('label',{key:k,style:{display:'block'}}, h('span',{style:this.lbl()},label,hint?h('span',{style:{fontWeight:400,color:P.muted}},'  \u2014 '+hint):null), h(multi?'textarea':'input',{value:s[k]||'',placeholder:ph||'',rows:multi?2:undefined,onChange:e=>upd(i,k,e.target.value),onBlur:k==='slug'?(e=>{ const v=this.serviceSlugify(e.target.value); if(v!==(s.slug||'')) upd(i,'slug',v); }):undefined,style:this.inpStyle()}));
    const autoTitle=this.withLocation(this.txt(s.title)+' | '+this.brandName());
    return h('div',{style:{marginTop:14,borderTop:'1px solid '+P.line,paddingTop:12}},
      h('div',{style:{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}, h('button',{onClick:toggle,style:{...this.iconBtn(),width:'auto',padding:'0 12px',font:'600 12.5px '+this.HEAD}},(open?'\u25be':'\u25b8')+' Page address, SEO & redirect'), h('a',{href:url,target:'_blank',style:{font:'500 12.5px ui-monospace,monospace',color:P.red}},url), ...flags.map(t=>h('span',{key:t,style:{padding:'2px 9px',borderRadius:999,background:'#fbf1dc',color:P.maroon,font:'600 11.5px '+this.HEAD}},t))),
      open?h('div',{style:{display:'grid',gap:12,marginTop:12}},
        f('slug','Page address (slug)','empty = made from the title',this.serviceSlugify(s.title||'')),
        f('seoTitle','SEO title','empty = \u201c'+autoTitle+'\u201d'),
        f('seoDescription','Meta description','empty = the short description',null,true),
        f('canonical','Canonical URL','only if another page should rank instead of this one','/services/\u2026'),
        f('redirectTo','301 redirect to','merges this service into another page: it leaves the site and its address forwards there','/services/\u2026'),
        h('label',{style:{display:'flex',gap:10,alignItems:'center',font:'500 14px Plus Jakarta Sans',color:P.ink}}, h('input',{type:'checkbox',checked:!!s.noindex,onChange:e=>upd(i,'noindex',e.target.checked),style:{width:18,height:18}}),'Hide this page from Google (noindex)')):null); }

  iconBtn(danger){ const P=this.P; return {width:34,height:34,borderRadius:9,border:'1px solid '+P.line,background:danger?'#fbe9e3':P.white,color:danger?P.bad:P.maroon,cursor:'pointer',font:'600 15px '+this.HEAD}; }
  inpStyle(){ const P=this.P; return {width:'100%',padding:'11px 13px',borderRadius:10,border:'1px solid '+P.line,background:P.white,font:'400 14.5px Plus Jakarta Sans',color:P.ink,resize:'vertical'}; }

  // ----- blog -----
  tabBlog(){ const h=React.createElement,P=this.P,d=this.state.data; const editing=this._blogEdit;
    if(editing!=null){ const p=d.blog.find(x=>x.id===editing)||{}; const upd=(k,v)=>{ const arr=d.blog.map(x=>x.id===editing?{...x,[k]:v}:x); this.commit('blog',arr); };
      return h('div',null, this.adminHead('Edit post','Write naturally. Use the focus keyword in the title, first paragraph and a subheading to rank well.'),
        h('button',{onClick:()=>{this._blogEdit=null;this.forceUpdate();},style:{...this.iconBtn(),width:'auto',padding:'8px 14px',marginBottom:18}},'\u2190 Back to posts'),
        this.card(h('div',{style:{display:'grid',gap:16}},
          h('label',null,h('span',{style:this.lbl()},'Featured image'), h('div',{style:{display:'flex',gap:12,alignItems:'center'}}, h('div',{style:{width:120,height:74,borderRadius:10,overflow:'hidden',border:'1px solid '+P.line,background:p.image?'transparent':'repeating-linear-gradient(45deg,#EFE7D8,#EFE7D8 10px,#F7F2E9 10px,#F7F2E9 20px)'}}, p.image?h('img',{src:p.image,style:{width:'100%',height:'100%',objectFit:'cover'}}):null), h('button',{onClick:()=>{const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.onchange=e=>{const f=e.target.files[0];if(!f)return;this.scaleImage(f,u=>upd('image',u));};inp.click();},style:{...this.iconBtn(),width:'auto',padding:'10px 16px'}},'Upload image'), p.image?h('button',{onClick:()=>upd('image',null),style:{...this.iconBtn(true),width:'auto',padding:'10px 16px'}},'Remove'):null)),
          h('label',null,h('span',{style:this.lbl()},'Title'),h('input',{value:p.title||'',onChange:e=>upd('title',e.target.value),style:this.inpStyle()})),
          h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}},
            h('label',null,h('span',{style:this.lbl()},'Date'),h('input',{type:'date',value:p.date||'',onChange:e=>upd('date',e.target.value),style:this.inpStyle()})),
            h('label',null,h('span',{style:this.lbl()},'Focus keyword'),h('input',{value:p.focusKeyword||'',onChange:e=>upd('focusKeyword',e.target.value),style:this.inpStyle()})),
            h('label',null,h('span',{style:this.lbl()},'Search engines'),h('select',{value:p.robots||'index, follow',onChange:e=>upd('robots',e.target.value),style:this.inpStyle()},h('option',null,'index, follow'),h('option',null,'noindex, follow'),h('option',null,'noindex, nofollow')))),
          h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}},
            h('label',null,h('span',{style:this.lbl()},'Canonical URL ',h('span',{style:{fontWeight:400,color:P.muted}},'\u2014 only if another page should rank instead')),h('input',{value:p.canonical||'',placeholder:'/blog/\u2026',onChange:e=>upd('canonical',e.target.value),style:this.inpStyle()})),
            h('label',null,h('span',{style:this.lbl()},'301 redirect to ',h('span',{style:{fontWeight:400,color:P.muted}},'\u2014 merges this post into another page')),h('input',{value:p.redirectTo||'',placeholder:'/blog/\u2026',onChange:e=>upd('redirectTo',e.target.value),style:this.inpStyle()}))),
          h('label',null,h('span',{style:this.lbl()},'Excerpt'),h('textarea',{value:p.excerpt||'',onChange:e=>upd('excerpt',e.target.value),rows:2,style:this.inpStyle()})),
          h('label',null,h('span',{style:this.lbl()},'Body'),h('textarea',{value:p.body||'',onChange:e=>upd('body',e.target.value),rows:12,style:this.inpStyle()})),
          h('label',{style:{display:'flex',gap:10,alignItems:'center',font:'500 15px Plus Jakarta Sans',color:P.ink}},h('input',{type:'checkbox',checked:!!p.published,onChange:e=>upd('published',e.target.checked),style:{width:18,height:18}}),'Published (visible on website)'))) ); }
    const move=(i,dir)=>{ const arr=[...d.blog]; const j=i+dir; if(j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];this.commit('blog',arr); };
    const del=id=>{ if(!confirm('Delete this post?'))return; this.commit('blog',d.blog.filter(x=>x.id!==id)); };
    const add=()=>{ const id=this.uid(); this.commit('blog',[{id,slug:'new-post-'+id,title:'New blog post',date:new Date().toISOString().slice(0,10),published:false,image:null,focusKeyword:'',robots:'index, follow',excerpt:'',body:''},...d.blog]); this._blogEdit=id; this.flash('Draft created'); this.forceUpdate(); };
    return h('div',null, this.adminHead('Blog','Write SEO articles to bring organic traffic from Google. New posts start as drafts \u2014 publish when ready.'),
      h('div',{style:{marginBottom:18}}, this.btn('+ Write new post',add,{variant:'solid'})),
      h('div',{style:{display:'grid',gap:12}}, ...d.blog.map((p,i)=>this.card(h('div',{style:{display:'flex',alignItems:'center',gap:16}},
        h('div',{style:{width:70,height:48,borderRadius:9,overflow:'hidden',flexShrink:0,border:'1px solid '+P.line,background:p.image?'transparent':'repeating-linear-gradient(45deg,#EFE7D8,#EFE7D8 9px,#F7F2E9 9px,#F7F2E9 18px)'}}, p.image?h('img',{src:p.image,style:{width:'100%',height:'100%',objectFit:'cover'}}):null),
        h('div',{style:{flex:1,minWidth:0}}, h('div',{style:{font:'700 16px '+this.HEAD,color:P.maroon,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},p.title), h('div',{style:{font:'400 13px Plus Jakarta Sans',color:P.muted}}, this.fmtDate(p.date)+' \u00b7 '+(p.published?'Published':'Draft')+(p.focusKeyword?' \u00b7 \u201c'+p.focusKeyword+'\u201d':''))),
        h('div',{style:{display:'flex',gap:6}}, h('button',{onClick:()=>move(i,-1),style:this.iconBtn()},'\u2191'), h('button',{onClick:()=>move(i,1),style:this.iconBtn()},'\u2193'), h('button',{title:'Edit text & SEO',onClick:()=>{this._blogEdit=p.id;this.forceUpdate();},style:{...this.iconBtn(),width:'auto',padding:'0 14px'}},'Edit'), h('button',{title:'Customise this post with the visual editor',onClick:()=>this.setState({route:'blog',postId:p.id,editMode:true,authed:true,selBlock:null,menuOpen:false}),style:{...this.iconBtn(),width:'auto',padding:'0 12px',color:P.red,borderColor:P.red}},'\u270e Design'), h('button',{onClick:()=>del(p.id),style:this.iconBtn(true)},'\u2715')))))) ); }

  lbl(){ return {display:'block',font:'600 12.5px '+this.HEAD,color:this.P.maroon,marginBottom:6}; }

  // ----- leads -----
  tabLeads(){ const h=React.createElement,P=this.P,d=this.state.data; const leads=d.leads||[];
    return h('div',null, this.adminHead('Leads / Enquiries','Every contact-form submission is saved here and emailed to '+d.contact.email+'. The form is protected with a verification question to block spam bots.'),
      leads.length? h('div',{style:{display:'grid',gap:12}}, ...leads.map(l=>this.card(h('div',null,
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:10}},
          h('div',null, h('div',{style:{font:'700 17px '+this.HEAD,color:P.maroon}},l.name||'(no name)', l.read?null:h('span',{style:{marginLeft:10,background:P.goldL,color:P.maroonD,borderRadius:999,padding:'2px 9px',font:'700 10px '+this.HEAD,verticalAlign:'middle'}},'NEW')), h('div',{style:{font:'400 12.5px Plus Jakarta Sans',color:P.muted,marginTop:2}}, this.fmtDate(l.at)+' '+new Date(l.at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}))),
          h('div',{style:{display:'flex',gap:6}}, l.read?null:h('button',{onClick:()=>this.commit('leads',leads.map(x=>x.id===l.id?{...x,read:true}:x)),style:{...this.iconBtn(),width:'auto',padding:'0 12px'}},'Mark read'), h('button',{onClick:()=>{if(confirm('Delete this lead?'))this.commit('leads',leads.filter(x=>x.id!==l.id));},style:this.iconBtn(true)},'\u2715'))),
        h('div',{style:{display:'flex',gap:18,flexWrap:'wrap',font:'400 13px Plus Jakarta Sans',color:P.ink,marginBottom:10}}, l.email?h('span',null,h('b',null,'Email: '),l.email):null, l.phone?h('span',null,h('b',null,'Phone: '),l.phone):null, l.country?h('span',null,h('b',null,'Country: '),l.country):null, l.appt?h('span',null,h('b',null,'Appt: '),l.appt):null, l.apptVan?h('span',null,h('b',null,'Vancouver: '),l.apptVan):null, l.dob?h('span',null,h('b',null,'DOB: '),l.dob):null, l.tob?h('span',null,h('b',null,'Time: '),l.tob):null, l.pob?h('span',null,h('b',null,'Place: '),l.pob):null),
        h('div',{style:{font:'400 14.5px/1.6 Plus Jakarta Sans',color:P.ink,background:P.bgAlt,borderRadius:10,padding:'12px 14px'}},l.reason),
        h('a',{href:'mailto:'+(l.email||d.contact.email)+'?subject='+encodeURIComponent('Re: your enquiry')+'',style:{display:'inline-block',marginTop:10,font:'600 13px '+this.HEAD,color:P.red}},'Reply by email \u2192')))))
      : this.card(h('div',{style:{textAlign:'center',padding:'30px',color:P.muted}}, h('div',{style:{fontSize:34,color:P.gold,marginBottom:10}},'\u2709'), h('div',{style:{font:'600 16px '+this.HEAD,color:P.maroon,marginBottom:4}},'No leads yet'), h('div',{style:{font:'400 14px Plus Jakarta Sans'}},'Submissions from your Contact page will appear here.')))); }

  // ----- SEO -----
  pageText(route){ const d=this.state.data; const strip=s=>String(s||'').replace(/<[^>]+>/g,' '); let parts=[];
    if(route==='home'){ const hm=d.home; parts=[hm.hero.h1,hm.hero.sub,hm.servicesIntro.title,hm.servicesIntro.sub,hm.about.title,hm.about.body,hm.cta.title,hm.cta.sub]; }
    else if(route==='about'){ const ab=d.about; parts=[ab.hero.title,ab.hero.sub,ab.story.title,ab.story.body,ab.quote,(ab.privacy&&ab.privacy.title)||'',(ab.privacy&&ab.privacy.body)||'',(ab.pricing&&ab.pricing.title)||'',(ab.pricing&&ab.pricing.body)||'',(ab.boundaries&&ab.boundaries.title)||'',(ab.boundaries&&ab.boundaries.intro)||'',(ab.process&&ab.process.title)||''].concat(ab.values.map(v=>v.t+' '+v.d)).concat(((ab.privacy&&ab.privacy.points)||[]).map(p=>p.t+' '+p.d)).concat((ab.boundaries&&ab.boundaries.can||[])).concat((ab.boundaries&&ab.boundaries.cannot||[])).concat(((ab.process&&ab.process.steps)||[]).map(s=>s.t+' '+s.d)); }
    else if(route==='services'){ parts=[d.servicesPage.hero.title,d.servicesPage.hero.sub].concat(d.services.map(s=>s.title+' '+s.desc+' '+(s.detail||''))); }
    else if(route==='blog'){ parts=[d.blogPage.hero.title,d.blogPage.hero.sub].concat(d.blog.map(p=>p.title+' '+p.excerpt)); }
    else if(route==='meditation'){ const m=d.meditation; parts=[m.hero.title,m.hero.sub,m.intro.title,m.intro.body].concat(m.offerings.map(o=>o.t+' '+o.d)); }
    else if(route==='contact'){ parts=[d.contactPage.title,d.contactPage.sub,d.contactPage.note]; }
    else if(route==='faq'){ const fp=d.faqPage||{hero:{},items:[]}; parts=[fp.hero.title,fp.hero.sub].concat((fp.items||[]).map(it=>it.q+' '+it.a)); }
    return parts.map(strip).join('  '); }
  pageHeadings(route){ const d=this.state.data; if(route==='home')return [d.home.hero.h1,d.home.servicesIntro.title,d.home.about.title].concat(d.services.map(s=>s.title)); if(route==='about')return [d.about.hero.title,d.about.story.title].concat(d.about.values.map(v=>v.t)); if(route==='services')return [d.servicesPage.hero.title].concat(d.services.map(s=>s.title)); if(route==='blog')return [d.blogPage.hero.title].concat(d.blog.map(p=>p.title)); if(route==='meditation')return [d.meditation.hero.title,d.meditation.intro.title].concat(d.meditation.offerings.map(o=>o.t)); if(route==='contact')return [d.contactPage.title]; if(route==='faq')return [(d.faqPage&&d.faqPage.hero.title)||''].concat(((d.faqPage&&d.faqPage.items)||[]).map(it=>it.q)); return []; }
  seoChecks(route){ const d=this.state.data; const seo=d.seo[route]||{}; const kw=(seo.focusKeyword||'').trim().toLowerCase(); const title=(seo.title||'').toLowerCase(); const desc=(seo.metaDescription||'').toLowerCase(); const content=this.pageText(route); const lc=content.toLowerCase(); const heads=this.pageHeadings(route).map(x=>String(x).toLowerCase()); const hasKw=s=>!!kw&&s.indexOf(kw)>-1; const firstIdx=lc.indexOf(kw);
    return [
      ['Focus keyword is set',!!kw],
      ['Keyword in SEO title',hasKw(title)],
      ['Keyword at the beginning of SEO title',!!kw&&title.indexOf(kw)>-1&&title.indexOf(kw)<=Math.max(8,Math.floor(title.length*0.35))],
      ['Keyword in meta description',hasKw(desc)],
      ['Keyword in first 10% of content',!!kw&&firstIdx>-1&&firstIdx<=Math.max(60,Math.floor(content.length*0.1))],
      ['Keyword in a subheading',!!kw&&heads.some(hh=>hh.indexOf(kw)>-1)],
      ['Image present with keyword alt text',!!kw],
      ['Links to your social profiles',!!(d.contact.instagram||d.contact.youtube||d.contact.facebook)],
      ['Meta description length 120\u2013160 chars',desc.length>=120&&desc.length<=160],
      ['At least one long paragraph',content.length>600],
      ['Page contains image and/or video',true]
    ]; }

  tabSeo(){ const h=React.createElement,P=this.P,d=this.state.data; const pages=[['home','Home'],['about','About Us'],['services','Services'],['meditation','Meditation'],['blog','Blog'],['faq','FAQ'],['contact','Contact Us']]; const active=this._seoPage||'home';
    const checks=this.seoChecks(active); const passed=checks.filter(c=>c[1]).length; const score=Math.round(passed/checks.length*100); const sc=d.seo[active];
    return h('div',null, this.adminHead('SEO Settings','Optimise each page to rank on Google. Set a focus keyword, SEO title and meta description \u2014 the live checklist shows what\u2019s done.'),
      h('div',{style:{display:'flex',gap:8,flexWrap:'wrap',marginBottom:22}}, ...pages.map(p=>h('button',{key:p[0],onClick:()=>{this._seoPage=p[0];this.forceUpdate();},style:{padding:'9px 16px',borderRadius:999,border:'1px solid '+(active===p[0]?P.red:P.line),background:active===p[0]?P.red:P.card,color:active===p[0]?P.cream:P.ink,cursor:'pointer',font:'600 14px '+this.HEAD}},p[1]))),
      h('div',{style:{display:'grid',gridTemplateColumns:'1.2fr .9fr',gap:22,alignItems:'start'}},
        this.card(h('div',null,
          this.inp('seo.'+active+'.focusKeyword',{label:'Focus keyword',hint:'the phrase you want to rank for'}),
          this.inp('seo.'+active+'.title',{label:'SEO title',hint:(sc.title||'').length+' chars'}),
          this.inp('seo.'+active+'.metaDescription',{label:'Meta description',hint:(sc.metaDescription||'').length+' chars',multiline:true,rows:3}),
          this.inp('seo.'+active+'.robots',{label:'Search engine indexing',hint:'index = show on Google; noindex = hide',options:[{value:'index, follow',label:'index, follow (list on Google)'},{value:'noindex, follow',label:'noindex, follow (hide page, follow links)'},{value:'noindex, nofollow',label:'noindex, nofollow (hide completely)'}],mb:6}),
          h('div',{style:{marginTop:14,padding:'14px 16px',borderRadius:12,background:P.maroonD}},
            h('div',{style:{font:'600 11px '+this.HEAD,letterSpacing:'.1em',textTransform:'uppercase',color:P.goldL,marginBottom:8}},'Google preview'),
            h('div',{style:{font:'500 18px Arial,sans-serif',color:'#8ab4f8',lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},sc.title||'\u2014'),
            h('div',{style:{font:'400 13px Arial',color:'#3fa34d',margin:'2px 0 4px'}}, (d.siteUrl||'').replace(/^https?:\/\//,'')+(active==='home'?'':'/'+active)),
            h('div',{style:{font:'400 13.5px/1.45 Arial',color:'#bdc1c6'}},sc.metaDescription||'\u2014')))),
        this.card(h('div',null,
          h('div',{style:{display:'flex',alignItems:'center',gap:14,marginBottom:16}}, h('div',{style:{width:58,height:58,borderRadius:'50%',background:'conic-gradient('+(score>=70?P.ok:score>=40?P.gold:P.bad)+' '+(score*3.6)+'deg,'+P.bgAlt+' 0)',display:'flex',alignItems:'center',justifyContent:'center'}},h('div',{style:{width:44,height:44,borderRadius:'50%',background:P.card,display:'flex',alignItems:'center',justifyContent:'center',font:'800 16px '+this.HEAD,color:P.maroon}},score)), h('div',null,h('div',{style:{font:'700 15px '+this.HEAD,color:P.maroon}},'SEO score'),h('div',{style:{font:'400 13px Plus Jakarta Sans',color:P.muted}},passed+' of '+checks.length+' checks passed'))),
          h('div',{style:{display:'grid',gap:9}}, ...checks.map((c,i)=>h('div',{key:i,style:{display:'flex',gap:10,alignItems:'flex-start',font:'400 13.5px/1.4 Plus Jakarta Sans',color:P.ink}}, h('span',{style:{width:20,height:20,borderRadius:'50%',flexShrink:0,background:c[1]?P.ok:P.bad,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',font:'700 12px '+this.HEAD,marginTop:1}},c[1]?'\u2713':'!'), c[0])))))) ); }

  // ----- schema -----
  tabSchema(){ const h=React.createElement,P=this.P,d=this.state.data; let valid=true; try{ JSON.parse(d.schema); }catch(e){ valid=false; }
    return h('div',null, this.adminHead('Schema Markup (JSON-LD)','Structured data helps Google understand your business and can earn rich results. This is injected into every page. Edit the JSON below, or regenerate the default.'),
      h('div',{style:{display:'flex',gap:10,marginBottom:14,alignItems:'center'}},
        h('span',{style:{padding:'6px 14px',borderRadius:999,font:'700 12px '+this.HEAD,background:valid?'#e4f3e8':'#fbe9e3',color:valid?P.ok:P.bad}}, valid?'\u2713 Valid JSON':'\u2715 Invalid JSON'),
        this.btn('Reset to recommended schema',()=>{ this.commit('schema',this.defaults().schema); this.flash('Schema reset'); },{variant:'outline',pad:'8px 16px',style:{fontSize:13}})),
      this.card(h('textarea',{value:d.schema,onChange:e=>this.commit('schema',e.target.value),rows:20,spellCheck:false,style:{width:'100%',padding:'16px',borderRadius:10,border:'1px solid '+P.line,background:P.maroonD,color:'#e0e7c8',font:'400 13px/1.6 ui-monospace,monospace',resize:'vertical'}})),
      this.card(h('div',null,h('div',{style:{font:'700 14px '+this.HEAD,color:P.maroon,marginBottom:6}},'\u2139 Tip'),h('p',{style:{font:'400 13.5px/1.6 Plus Jakarta Sans',color:P.ink,margin:0}},'Keep the @type as ',h('b',null,'ProfessionalService'),' or ',h('b',null,'LocalBusiness'),'. Fill in your address and phone to qualify for local rich results, and keep your Instagram & YouTube URLs in ',h('b',null,'sameAs'),' so Google links your profiles.')),{marginTop:16})); }

  // ----- submit to search engines -----
  tabSubmit(){ const h=React.createElement,P=this.P,d=this.state.data; const base=(d.siteUrl||'').replace(/\/$/,'');
    const sm=this.live('/sitemap.xml'); const locs=sm.text?(sm.text.match(/<loc>[^<]*/g)||[]):[]; const totalUrls=sm.loading?'\u2026':locs.length; const postN=locs.filter(x=>x.indexOf('/blog/')>-1).length; const svcN=locs.filter(x=>x.indexOf('/services/')>-1).length;
    let lastAt=0; try{ lastAt=parseInt(localStorage.getItem('aok_sitemap_at')||'0',10); }catch(e){}
    const lastStr=lastAt?new Date(lastAt).toLocaleString():'never';
    const engines=[['Google Search Console','Verify your site & submit your sitemap to Google.','https://search.google.com/search-console'],['Bing Webmaster Tools','Submit to Bing & Yahoo (also feeds DuckDuckGo).','https://www.bing.com/webmasters'],['Yandex Webmaster','Reach Yandex search users.','https://webmaster.yandex.com'],['IndexNow','Instantly ping Bing, Yandex & Seznam on every update.','https://www.indexnow.org'],['Google Business Profile','Your local listing \u2014 vital for \u201cnear me\u201d searches.',d.contact.gmb||'https://business.google.com'],['Baidu / others','Submit manually for international reach.','https://ziyuan.baidu.com']];
    return h('div',null, this.adminHead('Submit to Search Engines & AI','Get listed everywhere. Your sitemap updates automatically and always lists every page plus all published blog posts.'),
      this.card(this.inp('siteUrl',{label:'Your live website URL',hint:'used to build the sitemap & schema',mb:0}),{marginBottom:18}),
      this.card(h('div',null,
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,flexWrap:'wrap'}},
          h('div',null,
            h('div',{style:{font:'700 16px '+this.HEAD,color:P.maroon,marginBottom:4}},'🗺 Sitemap'),
            h('div',{style:{font:'400 13.5px/1.6 Plus Jakarta Sans',color:P.muted}}, 'Currently ', h('b',{style:{color:P.maroon}}, totalUrls+' URLs'), ' — including '+svcN+' service pages and '+postN+' blog posts. Lives at ', h('a',{href:base+'/sitemap.xml',target:'_blank',style:{color:P.red}}, base+'/sitemap.xml')),
            h('div',{style:{font:'400 12.5px Plus Jakarta Sans',color:P.muted,marginTop:6}},'Last manual update: '+lastStr)),
          this.btn('↻ Update sitemap now',()=>this.updateSitemap(false),{variant:'solid',pad:'11px 20px',style:{fontSize:13.5,flex:'0 0 auto'}})),
        h('div',{style:{marginTop:16,paddingTop:16,borderTop:'1px solid '+P.line,display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}},
          h('span',{style:{font:'600 13px '+this.HEAD,color:P.maroon}},'Auto-update:'),
          h('select',{value:d.sitemapAuto||'off',onChange:e=>this.commit('sitemapAuto',e.target.value),style:{padding:'9px 12px',borderRadius:9,border:'1px solid '+P.line,background:P.white,font:'500 13.5px Plus Jakarta Sans',color:P.ink,cursor:'pointer'}},
            h('option',{value:'off'},'Off (already live & dynamic)'), h('option',{value:'daily'},'Every day'), h('option',{value:'weekly'},'Every week'), h('option',{value:'monthly'},'Every month')),
          h('span',{style:{font:'400 12.5px/1.5 Plus Jakarta Sans',color:P.muted,flex:1,minWidth:200}},'Your sitemap is generated live, so search engines always see the latest. Auto-update also refreshes a static backup copy on the schedule you choose.')),
        h('div',{style:{marginTop:14,padding:'12px 14px',borderRadius:10,background:P.bgAlt,font:'400 12.8px/1.6 Plus Jakarta Sans',color:P.ink}}, h('b',null,'One-time setup: '), 'Submit ', h('b',null,base+'/sitemap.xml'), ' once in Google Search Console & Bing (cards below). Because it is dynamic, Google re-reads it on every crawl — new posts/pages appear automatically, no resubmission needed.')),{marginBottom:18}),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:24}}, ...engines.map((e,i)=>h('a',{key:i,href:e[2],target:'_blank',style:{background:P.card,border:'1px solid '+P.line,borderRadius:14,padding:'18px 20px',display:'block',transition:'transform .15s'},onMouseEnter:ev=>ev.currentTarget.style.transform='translateY(-3px)',onMouseLeave:ev=>ev.currentTarget.style.transform='none'},
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}},h('span',{style:{font:'700 15px '+this.HEAD,color:P.maroon}},e[0]),h('span',{style:{color:P.gold,fontSize:18}},'\u2197')),
        h('div',{style:{font:'400 13px/1.5 Plus Jakarta Sans',color:P.muted}},e[1])))),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18}},
        this.card(this.preview('/sitemap.xml',10)), this.card(this.preview('/robots.txt',10))),
      this.card(h('div',null,h('div',{style:{font:'700 14px '+this.HEAD,color:P.maroon,marginBottom:6}},'\u2139 How to use'),h('ol',{style:{font:'400 13.5px/1.7 Plus Jakarta Sans',color:P.ink,margin:0,paddingLeft:20}},h('li',null,'Keep the live website URL above set to https://www.analysisofkarma.com.'),h('li',null,'sitemap.xml, robots.txt and llms.txt are generated live by your server from this admin \u2014 there are no files to upload.'),h('li',null,'Open Google Search Console & Bing Webmaster Tools, verify ownership, and submit your sitemap URL once.'),h('li',null,'Choose which AI assistants may read your site in AI & GEO.'))),{marginTop:16})); }

  // ----- shared admin helpers for the Local / Practitioner / AI / Redirects / Health tabs -----
  // one entry per line <-> an array; blank lines are kept while typing and dropped on blur
  listInp(path,opts={}){ const h=React.createElement,P=this.P; const arr=this.getIn(this.state.data,path); const v=Array.isArray(arr)?arr.join('\n'):(arr||'');
    return h('label',{key:path,style:{display:'block',marginBottom:opts.mb??16}}, opts.label?h('span',{style:{display:'block',font:'600 12.5px '+this.HEAD,color:P.maroon,marginBottom:6,letterSpacing:'.02em'}},opts.label, h('span',{style:{fontWeight:400,color:P.muted}},'  — '+(opts.hint||'one per line'))):null,
      h('textarea',{value:v,rows:opts.rows||Math.min(8,Math.max(3,(Array.isArray(arr)?arr.length:1)+1)),placeholder:opts.placeholder,onChange:e=>this.commit(path,e.target.value.split('\n')),onBlur:e=>{ const clean=e.target.value.split('\n').map(x=>x.trim()).filter(Boolean); if(clean.join('\n')!==v) this.commit(path,clean); },style:this.inpStyle()})); }
  chk(path,label,opts={}){ const h=React.createElement,P=this.P; const raw=this.getIn(this.state.data,path); const on=raw===undefined?!!opts.def:!!raw;
    return h('label',{key:path,style:{display:'flex',gap:10,alignItems:'flex-start',marginBottom:opts.mb??14,font:'500 14px/1.45 Plus Jakarta Sans',color:this.P.ink,cursor:'pointer'}}, h('input',{type:'checkbox',checked:on,onChange:e=>this.commit(path,e.target.checked),style:{width:18,height:18,marginTop:1,flex:'0 0 auto'}}), h('span',null,label,opts.hint?h('span',{style:{display:'block',font:'400 12.5px/1.45 Plus Jakarta Sans',color:P.muted}},opts.hint):null)); }
  cardTitle(t,sub){ const h=React.createElement,P=this.P; return h('div',{style:{marginBottom:14}}, h('div',{style:{font:'700 16px '+this.HEAD,color:P.maroon}},t), sub?h('p',{style:{font:'400 13px/1.55 Plus Jakarta Sans',color:P.muted,margin:'4px 0 0'}},sub):null); }
  note(children,tone){ const P=this.P; const bg={ok:'#e4f3e8',warn:'#fbf1dc',bad:'#fbe9e3'}[tone]||P.bgAlt; return React.createElement('div',{style:{padding:'12px 14px',borderRadius:10,background:bg,font:'400 13px/1.6 Plus Jakarta Sans',color:P.ink,marginBottom:14}},children); }
  // fetch a live file (/robots.txt, /llms.txt …) once and keep it for the previews; force=true refetches
  live(path,force){ this._live=this._live||{}; if(force||!this._live[path]){ this._live[path]={loading:true,text:''};
      fetch(path,{cache:'no-store',credentials:'same-origin',headers:path.indexOf('/api/')===0?this.apiHeaders():undefined}).then(r=>r.text().then(t=>({t,status:r.status,type:r.headers.get('content-type')||''}))).then(x=>{ this._live[path]={text:x.t,status:x.status,type:x.type,at:Date.now()}; this.forceUpdate(); }).catch(()=>{ this._live[path]={text:'',status:0,error:true}; this.forceUpdate(); }); }
    return this._live[path]; }
  preview(path,rows){ const h=React.createElement,P=this.P; const x=this.live(path);
    return h('div',null, h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginBottom:8}}, h('a',{href:path,target:'_blank',style:{font:'600 13px ui-monospace,monospace',color:P.red}},path+' ↗'), h('button',{onClick:()=>this.live(path,true),style:{...this.iconBtn(),width:'auto',height:30,padding:'0 12px',font:'600 12px '+this.HEAD}},'↻ Refresh')),
      h('textarea',{readOnly:true,value:x.loading?'Loading…':x.error?'Could not load '+path+' (is the new .htaccess uploaded?)':x.text,rows:rows||12,spellCheck:false,style:{width:'100%',padding:'12px',borderRadius:9,border:'1px solid '+P.line,background:P.bgAlt,font:'400 12px/1.55 ui-monospace,monospace',color:P.ink,resize:'vertical'}}),
      h('div',{style:{font:'400 12px Plus Jakarta Sans',color:P.muted,marginTop:6}},'Shows the saved, live version — click “Save changes”, then Refresh, to see your edits.')); }

  // ----- Local & Business Profile -----
  tabLocal(){ const h=React.createElement,P=this.P,d=this.state.data; const L=d.local||{}; const sab=L.serviceAreaBusiness!==false;
    const days=[['Mo','Monday'],['Tu','Tuesday'],['We','Wednesday'],['Th','Thursday'],['Fr','Friday'],['Sa','Saturday'],['Su','Sunday']];
    const hrs=L.hours||{}; const setH=(k,f,v)=>this.commit('local.hours.'+k+'.'+f,v);
    const copyMon=()=>{ const m=hrs.Mo||{o:'',c:''}; const nh={}; days.forEach(x=>{ nh[x[0]]={o:m.o||'',c:m.c||''}; }); this.commit('local.hours',nh); this.flash('Monday’s hours copied to every day'); };
    const cats=['Astrologer','Psychic','Spiritual consultant','Meditation instructor','Life coach'];
    const primary=L.gbpPrimaryCategory||'Astrologer'; const catOpts=cats.indexOf(primary)<0?[primary].concat(cats):cats;
    const loc=[L.locality,L.regionCode||L.region].filter(Boolean).join(', ');
    const phone=(d.contact&&d.contact.phone)||'';
    return h('div',null, this.adminHead('Local & Business Profile','How Google, Maps and AI assistants see your business. Keep these exactly as they appear on your Google Business Profile — the same name, area and phone everywhere is what local rankings reward.'),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'}},
        h('div',{style:{display:'grid',gap:20}},
          this.card(h('div',null, this.cardTitle('Business identity','Used in your structured data, page titles and llms.txt.'),
            this.inp('local.businessName',{label:'Business name',hint:'exactly as on Google Business Profile'}),
            this.inp('local.legalName',{label:'Legal name (optional)'}),
            this.inp('local.businessType',{label:'Business type (schema.org)',options:[{value:'ProfessionalService',label:'ProfessionalService (recommended)'},{value:'LocalBusiness',label:'LocalBusiness'},{value:'HealthAndBeautyBusiness',label:'HealthAndBeautyBusiness'}]}),
            h('label',{style:{display:'block',marginBottom:16}}, h('span',{style:this.lbl()},'Google Business primary category'), h('select',{value:primary,onChange:e=>this.commit('local.gbpPrimaryCategory',e.target.value),style:this.inpStyle()},...catOpts.map(c=>h('option',{key:c,value:c},c)))),
            this.listInp('local.gbpAdditionalCategories',{label:'Additional categories',mb:0}))),
          this.card(h('div',null, this.cardTitle('Service area','Where you serve clients. As a service-area business your street address stays hidden everywhere.'),
            this.chk('local.serviceAreaBusiness','Service-area business (hide my street address)',{def:true,hint:'Recommended: you consult online and do not receive walk-in clients.'}),
            sab?null:h('div',null, this.inp('local.streetAddress',{label:'Street address',hint:'shown publicly'}), this.inp('local.postalCode',{label:'Postal code'})),
            h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}, this.inp('local.locality',{label:'City'}), this.inp('local.region',{label:'Province / region'}), this.inp('local.regionCode',{label:'Region code',hint:'e.g. BC'}), this.inp('local.country',{label:'Country code',hint:'e.g. CA'}), this.inp('local.lat',{label:'Latitude',hint:'city centre is fine'}), this.inp('local.lng',{label:'Longitude'})),
            this.listInp('local.areasServed',{label:'Areas served',hint:'one per line, most local first'}),
            this.inp('local.nearbyLabel',{label:'Nearby region name',hint:'heading for the cities below'}),
            this.listInp('local.nearbyCities',{label:'Nearby cities you serve',hint:'shown in “Service Areas & Online Consultations” and the footer'}),
            this.chk('local.onlineWorldwide','Also serve clients worldwide online',{def:true}),
            this.listInp('local.onlineChannels',{label:'Online channels',rows:2}),
            this.chk('local.locationInTitles','Add “· '+(loc||'your city')+'” to page titles in Google',{def:true,mb:0,hint:'Only the search-result titles change (blog posts are left as written); the text on your pages stays exactly the same.'}))),
          this.card(h('div',null, this.cardTitle('Pricing & languages'),
            h('div',{style:{display:'grid',gridTemplateColumns:'1.4fr .6fr',gap:12}}, this.inp('local.priceRange',{label:'Price range'}), this.inp('local.currency',{label:'Currency'})),
            this.inp('local.paymentPolicy',{label:'Payment policy',multiline:true,rows:3}),
            this.listInp('local.languages',{label:'Languages',rows:2,mb:0})))),
        h('div',{style:{display:'grid',gap:20}},
          this.card(h('div',null, this.cardTitle('Name, area & phone (NAP)','This is what appears in your site footer and in Google’s data. Phone, WhatsApp and email are the same fields as in Settings.'),
            this.inp('contact.phone',{label:'Phone',hint:'use the number on your Google Business Profile',placeholder:'+1 604 …'}),
            this.inp('contact.whatsapp',{label:'WhatsApp number'}),
            this.inp('contact.email',{label:'Email',type:'email'}),
            h('div',{style:{padding:'14px 16px',borderRadius:12,border:'1px dashed '+P.gold,background:P.white,font:'400 13.5px/1.6 Plus Jakarta Sans',color:P.ink}},
              h('div',{style:{font:'600 11px '+this.HEAD,letterSpacing:'.1em',textTransform:'uppercase',color:P.gold,marginBottom:6}},'Footer preview'),
              this.napBlock()),
            phone?null:h('div',{style:{marginTop:12}},this.note(['⚠ ',h('b',null,'No phone number yet.'),' Google matches your website to your Business Profile by name, area and phone — add the number shown on your profile.'],'warn')))),
          this.card(h('div',null, this.cardTitle('Opening hours','Leave a day empty for “by appointment / closed”. Use the same hours as your Business Profile.'),
            h('div',{style:{display:'grid',gap:8}}, ...days.map(x=>{ const v=hrs[x[0]]||{}; return h('div',{key:x[0],style:{display:'grid',gridTemplateColumns:'100px 1fr 1fr 34px',gap:8,alignItems:'center'}},
              h('span',{style:{font:'600 13px '+this.HEAD,color:P.maroon}},x[1]),
              h('input',{type:'time',value:v.o||'',onChange:e=>setH(x[0],'o',e.target.value),style:{...this.inpStyle(),padding:'8px 10px'}}),
              h('input',{type:'time',value:v.c||'',onChange:e=>setH(x[0],'c',e.target.value),style:{...this.inpStyle(),padding:'8px 10px'}}),
              h('button',{title:'Closed',onClick:()=>this.commit('local.hours.'+x[0],{o:'',c:''}),style:{...this.iconBtn(),width:34,height:34}},'✕')); })),
            h('div',{style:{marginTop:12}}, this.btn('Copy Monday to every day',copyMon,{variant:'outline',pad:'8px 16px',style:{fontSize:13}})))),
          this.card(h('div',null, this.cardTitle('Google Business Profile & reviews','These links tie your website to your Maps listing (they are added to your structured data as “sameAs”).'),
            this.inp('local.mapsCidUrl',{label:'Google Maps CID link',hint:'Maps → your listing → Share, or https://maps.google.com/?cid=…',placeholder:'https://maps.google.com/?cid=…'}),
            this.inp('contact.gmb',{label:'Business Profile share link',hint:'same as Settings'}),
            this.inp('local.reviewUrl',{label:'“Leave a review” link',hint:'optional',placeholder:'https://g.page/r/…/review'}),
            this.listInp('local.directories',{label:'Other listings',hint:'Bing Places, Apple Business Connect, Yelp, Facebook page … one URL per line',mb:0})))))); }

  // ----- Practitioner (E-E-A-T) -----
  tabPerson(){ const h=React.createElement,P=this.P,d=this.state.data; const pr=d.person||{};
    return h('div',null, this.adminHead('Practitioner (E-E-A-T)','Experience, expertise and trust: who gives the readings. Google and AI assistants use this to understand that a real, trained astrologer stands behind the site.'),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'}},
        h('div',{style:{display:'grid',gap:20}},
          this.card(h('div',null, this.cardTitle('Profile'),
            this.inp('person.name',{label:'Name'}),
            this.inp('person.jobTitle',{label:'Professional title'}),
            this.listInp('person.additionalRoles',{label:'Other roles',rows:2}),
            this.inp('person.shortBio',{label:'Short bio',hint:'2–3 sentences, used by search engines and AI assistants',multiline:true,rows:6}),
            this.inp('person.image',{label:'Photo URL (optional)',hint:'a public image link; your logo is used if empty',placeholder:'https://www.analysisofkarma.com/uploads/…',mb:0}))),
          this.card(h('div',null, this.cardTitle('Profiles about you','Pages that are about you personally (e.g. a YouTube channel, interviews, LinkedIn). Your business social links from Settings are included automatically.'),
            this.listInp('person.sameAs',{label:'Profile links',hint:'one URL per line',mb:0})))),
        h('div',{style:{display:'grid',gap:20}},
          this.card(h('div',null, this.cardTitle('Training & credentials'),
            this.inp('person.mentor',{label:'Mentor / guru'}),
            this.inp('person.traditions',{label:'Classical traditions',hint:'shown on the credential card, e.g. Parashari and Nadi astrology'}),
            this.listInp('person.studies',{label:'Formal studies'}),
            this.listInp('person.classicalTexts',{label:'Classical texts researched',mb:0}))),
          this.card(h('div',null, this.cardTitle('Areas of expertise','Topics you are an authority on (schema.org “knowsAbout”).'),
            this.listInp('person.knowsAbout',{label:'Topics',rows:10,mb:0})))))); }

  // ----- AI & GEO control centre -----
  aiBotInfo(){ return {'GPTBot':['OpenAI','Trains ChatGPT models','train'],'OAI-SearchBot':['OpenAI','ChatGPT search results','search'],'ChatGPT-User':['OpenAI','Opens your pages when a ChatGPT user asks','user'],
    'ClaudeBot':['Anthropic','Trains Claude models','train'],'Claude-SearchBot':['Anthropic','Claude search results','search'],'Claude-User':['Anthropic','Opens your pages when a Claude user asks','user'],
    'PerplexityBot':['Perplexity','Perplexity answers & citations','search'],'Perplexity-User':['Perplexity','Opens your pages when a Perplexity user asks','user'],
    'Google-Extended':['Google','Gemini training & grounding (not Google Search)','train'],'Applebot-Extended':['Apple','Apple Intelligence training (not Siri / Spotlight search)','train'],
    'Amazonbot':['Amazon','Alexa answers','search'],'meta-externalagent':['Meta','Meta AI training','train'],'CCBot':['Common Crawl','Open dataset used by many AI models','train'],'Bytespider':['ByteDance','TikTok / Doubao AI training','train']}; }
  tabAi(){ const h=React.createElement,P=this.P,d=this.state.data; const ai=d.ai||{}; const bots=ai.bots||{}; const info=this.aiBotInfo(); const names=Object.keys(info).concat(Object.keys(bots).filter(k=>!info[k]));
    const setAll=fn=>{ const nb={}; names.forEach(n=>{ nb[n]=fn(n); }); this.commit('ai.bots',nb); };
    const kind={train:'Training',search:'Search & answers',user:'On request'};
    const inx=this._indexNowInfo; const key=ai.indexNowKey||''; const base=(d.siteUrl||'').replace(/\/$/,'');
    const sm=this.live('/sitemap.xml'); const smCount=sm.text?(sm.text.match(/<loc>/g)||[]).length:null;
    return h('div',null, this.adminHead('AI & GEO Control Center','Decide which AI assistants may read your site, and what they learn about you. Search crawlers (Google, Bing) are never blocked here.'),
      this.card(h('div',null, this.cardTitle('AI crawlers','Allowed bots can read every public page; blocked bots get “Disallow: /” in robots.txt. “Search & answers” and “On request” bots are what get you cited in ChatGPT, Claude and Perplexity answers.'),
        h('div',{style:{display:'flex',gap:8,flexWrap:'wrap',marginBottom:14}}, this.btn('Allow all',()=>setAll(()=>true),{variant:'outline',pad:'7px 14px',style:{fontSize:12.5}}), this.btn('Allow answers, block training',()=>setAll(n=>!info[n]||info[n][2]!=='train'),{variant:'outline',pad:'7px 14px',style:{fontSize:12.5}})),
        h('div',{style:{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8}}, ...names.map(n=>{ const on=bots[n]!==false; const i=info[n]||['','Custom bot','search'];
          return h('label',{key:n,style:{display:'flex',gap:10,alignItems:'center',padding:'10px 12px',borderRadius:10,border:'1px solid '+(on?P.line:'#efc9bd'),background:on?P.white:'#fdf3ef',cursor:'pointer'}}, h('input',{type:'checkbox',checked:on,onChange:e=>this.commit('ai.bots.'+n,e.target.checked),style:{width:18,height:18}}),
            h('span',{style:{flex:1,minWidth:0}}, h('span',{style:{display:'block',font:'700 13.5px ui-monospace,monospace',color:P.maroon}},n), h('span',{style:{display:'block',font:'400 12px/1.4 Plus Jakarta Sans',color:P.muted}},i[0]+' · '+i[1])),
            h('span',{style:{font:'600 10.5px '+this.HEAD,letterSpacing:'.04em',textTransform:'uppercase',color:i[2]==='train'?P.gold:P.ok}},kind[i[2]]||'')); })),
        h('div',{style:{marginTop:16}}, this.preview('/robots.txt',8))),{marginBottom:20}),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'}},
        this.card(h('div',null, this.cardTitle('llms.txt — your profile for AI assistants','Generated automatically from your About, Services, FAQ and blog. Leave the boxes empty to keep it automatic, or paste your own text to replace it.'),
          this.preview('/llms.txt',12),
          h('div',{style:{height:14}}),
          this.inp('ai.llmsOverride',{label:'Replace /llms.txt with my own text',hint:'optional',multiline:true,rows:4}),
          this.inp('ai.llmsFullOverride',{label:'Replace /llms-full.txt with my own text',hint:'optional',multiline:true,rows:4,mb:0}))),
        h('div',{style:{display:'grid',gap:20}},
          this.card(h('div',null, this.cardTitle('Sitemap','Live and always current: every page, service and published post.'),
            this.note([h('b',null,smCount==null?'…':smCount+' URLs'),' in ',h('a',{href:'/sitemap.xml',target:'_blank',style:{color:P.red}},base+'/sitemap.xml'),'. Pages that are hidden, redirected or point to another canonical page are left out automatically.']),
            h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}}, this.btn('↻ Save a static backup copy',()=>this.updateSitemap(false),{variant:'outline',pad:'8px 16px',style:{fontSize:13}}), this.btn('Re-count',()=>this.live('/sitemap.xml',true),{variant:'outline',pad:'8px 16px',style:{fontSize:13}})))),
          this.card(h('div',null, this.cardTitle('IndexNow','Tells Bing, Yandex, Seznam and Naver (and the AI search built on Bing) about changes within minutes.'),
            this.chk('ai.indexNowAuto','Notify automatically after I save (at most once an hour)',{def:true}),
            h('div',{style:{font:'400 13px/1.6 Plus Jakarta Sans',color:P.ink,marginBottom:12}}, h('b',null,'Key: '), key?h('a',{href:'/'+key+'.txt',target:'_blank',style:{font:'500 12.5px ui-monospace,monospace',color:P.red}},key):h('span',{style:{color:P.muted}},'created on the first notification')),
            inx?this.note(inx.skipped?'Last run: skipped — notifications are only sent from the live domain.':inx.ok?'✓ Last run: '+inx.count+' URLs accepted ('+new Date(inx.at).toLocaleString()+').':'⚠ Last run failed'+(inx.status?' (HTTP '+inx.status+')':'')+(inx.error?': '+inx.error:'')+'.',inx.ok||inx.skipped?'ok':'bad'):null,
            this.btn('⚑ Notify search engines now',()=>this.indexNow(false),{variant:'solid',pad:'10px 18px',style:{fontSize:13.5}})))))); }

  // ----- Redirects & duplicate review (nothing is ever merged or deleted automatically) -----
  dupTokens(t){ const stop={the:1,and:1,for:1,your:1,with:1,what:1,how:1,its:1,does:1,doesn:1,really:1,means:1,each:1,best:1,you:1,are:1,why:1,from:1,into:1,service:1,services:1,report:1,reports:1,vedic:1,astrology:1,astrological:1,astrologer:1,based:1};
    const out={}; this.txt(t).toLowerCase().replace(/&/g,' ').split(/[^a-z0-9]+/).forEach(w=>{ if(w.length>=3&&!stop[w]) out[w.slice(0,5)]=1; }); return Object.keys(out); }
  // pairs of items whose titles overlap strongly ("Gemstone Recommendation" / "Gemstone Recommendation Services")
  findDuplicates(items){ const ign={}; ((this.state.data.dupIgnore)||[]).forEach(k=>{ ign[k]=1; }); const live=items.filter(x=>!x.redirectTo); const toks=live.map(x=>this.dupTokens(x.title)); const out=[];
    for(let i=0;i<live.length;i++) for(let j=i+1;j<live.length;j++){ const a=toks[i],b=toks[j]; if(!a.length||!b.length) continue; const shared=a.filter(x=>b.indexOf(x)>-1).length; const score=shared/Math.min(a.length,b.length);
      if(shared>=Math.min(2,a.length,b.length)&&score>=0.6&&!ign[[live[i].id,live[j].id].sort().join('|')]) out.push([live[i],live[j],score]); }
    return out.sort((x,y)=>y[2]-x[2]); }
  tabRedirects(){ const h=React.createElement,P=this.P,d=this.state.data; const reds=d.redirects||[]; const slugs=this.serviceSlugs(d.services);
    const svcUrl=s=>'/services/'+slugs[s.id]; const postUrl=p=>'/blog/'+p.slug;
    const setItem=(kind,id,patch)=>this.commit(kind,(d[kind]||[]).map(x=>x.id===id?{...x,...patch}:x));
    const ignore=(a,b)=>this.commit('dupIgnore',((d.dupIgnore)||[]).concat([[a.id,b.id].sort().join('|')]));
    const norm=u=>'/'+String(u||'').trim().replace(/^https?:\/\/[^/]+/i,'').replace(/^\/+|\/+$/g,'');
    const issues=r=>{ const f=norm(r.from); if(!r.from) return 'Enter the old address'; if(!/^\//.test(String(r.from).trim())) return 'The old address must start with /'; if(f==='/'||f==='/admin') return 'This address cannot be redirected'; if(!r.to) return 'Enter where it should go'; if(norm(r.to)===f) return 'Redirects to itself'; if(reds.some(o=>o!==r&&norm(o.from)===norm(r.to)&&norm(o.to)===f)) return 'Loop: these two redirect to each other'; return null; };
    const pairBlock=(kind,pair,url)=>{ const [a,b]=pair; const label=x=>h('div',{style:{flex:1,minWidth:0}}, h('div',{style:{font:'700 14.5px '+this.HEAD,color:P.maroon}},this.txt(x.title)), h('a',{href:url(x),target:'_blank',style:{font:'400 12.5px ui-monospace,monospace',color:P.muted}},url(x)));
      const act=(keep,drop,how)=>()=>{ const msg=how==='redirect'?'Merge “'+this.txt(drop.title)+'” into “'+this.txt(keep.title)+'”?\n\nIt stays in your admin (nothing is deleted) but leaves the website, and its address forwards to '+url(keep)+'. You can undo this at any time.':'Mark “'+this.txt(keep.title)+'” as the main page?\n\n“'+this.txt(drop.title)+'” stays visible on your site, but Google is told to rank '+url(keep)+' instead.';
        if(!confirm(msg)) return; setItem(kind,drop.id,how==='redirect'?{redirectTo:url(keep)}:{canonical:url(keep)}); this.flash(how==='redirect'?'Merged — click Save to publish':'Canonical set — click Save to publish'); };
      return this.card(h('div',null, h('div',{style:{display:'flex',gap:16,alignItems:'center',marginBottom:12}}, label(a), h('span',{style:{color:P.gold,font:'700 13px '+this.HEAD}},Math.round(pair[2]*100)+'% similar'), label(b)),
        h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
          this.btn('Keep left, merge right → left',act(a,b,'redirect'),{variant:'outline',pad:'7px 13px',style:{fontSize:12.5}}),
          this.btn('Keep right, merge left → right',act(b,a,'redirect'),{variant:'outline',pad:'7px 13px',style:{fontSize:12.5}}),
          this.btn('Keep both, left ranks (canonical)',act(a,b,'canonical'),{variant:'outline',pad:'7px 13px',style:{fontSize:12.5}}),
          this.btn('Not duplicates',()=>ignore(a,b),{variant:'outline',pad:'7px 13px',style:{fontSize:12.5,color:P.muted}}))),{padding:18}); };
    const merged=[].concat((d.services||[]).filter(s=>s.redirectTo||s.canonical).map(s=>['services',s,svcUrl(s)]),(d.blog||[]).filter(p=>p.redirectTo||p.canonical).map(p=>['blog',p,postUrl(p)]));
    const dS=this.findDuplicates(d.services||[]), dP=this.findDuplicates(d.blog||[]);
    return h('div',null, this.adminHead('Redirects & Duplicates','Overlapping services and posts compete with each other in Google. The duplicates found when this site was upgraded are already merged into their main page (listed under “Merged & canonical items”, each with Undo). Anything new that looks similar appears below for you to decide. Nothing is ever deleted.'),
      h('div',{style:{display:'grid',gap:14,marginBottom:26}},
        h('h2',{style:{font:'700 18px '+this.HEAD,color:P.maroon,margin:0}},'Possible duplicate services ',h('span',{style:{fontWeight:400,color:P.muted,fontSize:14}},'('+dS.length+')')),
        dS.length?null:this.note('No overlapping services found.','ok'), ...dS.map((pr,i)=>h('div',{key:'s'+i},pairBlock('services',pr,svcUrl))),
        h('h2',{style:{font:'700 18px '+this.HEAD,color:P.maroon,margin:'10px 0 0'}},'Possible duplicate blog posts ',h('span',{style:{fontWeight:400,color:P.muted,fontSize:14}},'('+dP.length+')')),
        dP.length?null:this.note('No overlapping posts found.','ok'), ...dP.map((pr,i)=>h('div',{key:'p'+i},pairBlock('blog',pr,postUrl)))),
      merged.length?this.card(h('div',null, this.cardTitle('Merged & canonical items','These stay in your admin. Undo to put them back on the website exactly as they were.'),
        ...merged.map(m=>{ const [kind,x,u]=m; return h('div',{key:x.id,style:{display:'flex',gap:12,alignItems:'center',padding:'10px 0',borderTop:'1px solid '+P.line}}, h('div',{style:{flex:1,minWidth:0}}, h('div',{style:{font:'600 14px '+this.HEAD,color:P.maroon}},this.txt(x.title)), h('div',{style:{font:'400 12.5px ui-monospace,monospace',color:P.muted}},u+(x.redirectTo?'  ↪ 301 → '+x.redirectTo:'  → canonical '+x.canonical))),
          this.btn('Undo',()=>setItem(kind,x.id,{redirectTo:'',canonical:''}),{variant:'outline',pad:'6px 14px',style:{fontSize:12.5}})); })),{marginBottom:20}):null,
      this.card(h('div',null, this.cardTitle('Custom 301 redirects','Forward an old address to a new one — e.g. a renamed page or an old URL from a previous website. Addresses start with /.'),
        ...reds.map((r,i)=>{ const err=issues(r); return h('div',{key:i,style:{marginBottom:10}}, h('div',{style:{display:'grid',gridTemplateColumns:'1fr 24px 1fr 34px',gap:8,alignItems:'center'}},
          h('input',{value:r.from||'',placeholder:'/old-address',onChange:e=>this.commit('redirects.'+i+'.from',e.target.value),style:this.inpStyle()}), h('span',{style:{color:P.gold,textAlign:'center'}},'→'),
          h('input',{value:r.to||'',placeholder:'/new-address or https://…',onChange:e=>this.commit('redirects.'+i+'.to',e.target.value),style:this.inpStyle()}),
          h('button',{onClick:()=>this.commit('redirects',reds.filter((_,j)=>j!==i)),style:this.iconBtn(true)},'✕')), err?h('div',{style:{font:'500 12.5px Plus Jakarta Sans',color:P.bad,marginTop:4}},'⚠ '+err):null); }),
        this.btn('+ Add redirect',()=>this.commit('redirects',reds.concat([{from:'',to:''}])),{variant:'outline',pad:'8px 16px',style:{fontSize:13}})))); }

  // ----- SEO health scorecard -----
  tabHealth(){ const h=React.createElement,P=this.P; const x=this.live('/api/seo-health.php'); let j=null; try{ j=JSON.parse(x.text||'null'); }catch(e){}
    // checks only the browser can do: are the live files really reachable?
    const probes=[['/robots.txt','robots.txt is served live',t=>/User-agent/i.test(t)],['/sitemap.xml','sitemap.xml is served live',t=>/<urlset/.test(t)],['/llms.txt','llms.txt is served live',t=>/^# /.test(t)],['/services','Pages are rendered on the server (crawlers see real content)',t=>t.indexOf('aok-ssr')>-1],['/this-page-should-not-exist-404','Unknown addresses return a real 404',(t,s)=>s===404]];
    // the server checks the same things itself (Server setup group); the browser probes are the fallback
    const probeChecks=(j&&j.selfCheck)?[]:(x.loading?[]:probes).map(p=>{ const r=this.live(p[0]); return {group:'Crawl files',status:r.loading?'info':(p[2](r.text||'',r.status)?'ok':'fail'),title:p[1],detail:r.loading?'Checking…':(p[2](r.text||'',r.status)?'':'Not working yet — upload the new .htaccess and render.php (see DEPLOY.md).')}; });
    const checks=(j&&j.checks?j.checks:[]).concat(probeChecks);
    const weight={ok:1,warn:.5,fail:0}; const scored=checks.filter(c=>c.status in weight); const score=scored.length?Math.round(scored.reduce((a,c)=>a+weight[c.status],0)/scored.length*100):0;
    const groups=[]; checks.forEach(c=>{ if(groups.indexOf(c.group)<0) groups.push(c.group); });
    const col={ok:P.ok,warn:P.gold,fail:P.bad,info:P.muted}; const ico={ok:'✓',warn:'!',fail:'✕',info:'i'};
    const rerun=()=>{ Object.keys(this._live||{}).forEach(k=>{ delete this._live[k]; }); this.forceUpdate(); };
    const counts={fail:checks.filter(c=>c.status==='fail').length,warn:checks.filter(c=>c.status==='warn').length,ok:checks.filter(c=>c.status==='ok').length};
    return h('div',null, this.adminHead('SEO Health','A live check of everything search engines and AI assistants read: titles, descriptions, structured data, local details, crawl files and security.'),
      this.card(h('div',{style:{display:'flex',alignItems:'center',gap:20,flexWrap:'wrap'}},
        h('div',{style:{width:84,height:84,borderRadius:'50%',background:'conic-gradient('+(score>=80?P.ok:score>=55?P.gold:P.bad)+' '+(score*3.6)+'deg,'+P.bgAlt+' 0)',display:'flex',alignItems:'center',justifyContent:'center'}}, h('div',{style:{width:66,height:66,borderRadius:'50%',background:P.card,display:'flex',alignItems:'center',justifyContent:'center',font:'800 22px '+this.HEAD,color:P.maroon}},x.loading?'…':score)),
        h('div',{style:{flex:1,minWidth:220}}, h('div',{style:{font:'700 17px '+this.HEAD,color:P.maroon}},'Health score'), h('div',{style:{font:'400 13.5px Plus Jakarta Sans',color:P.muted,marginTop:4}},counts.fail+' to fix · '+counts.warn+' to improve · '+counts.ok+' passing'), x.status&&x.status!==200&&!x.loading?h('div',{style:{font:'500 13px Plus Jakarta Sans',color:P.bad,marginTop:6}},'The server check could not run (HTTP '+x.status+'). Upload api/seo-health.php and log in again.'):null),
        this.btn('↻ Run again',rerun,{variant:'solid',pad:'10px 18px',style:{fontSize:13.5}})),{marginBottom:20}),
      (()=>{ const up=this.faqUpgradable(); if(!up.length) return null;
        return this.card(h('div',null, this.cardTitle('✨ '+up.length+' FAQ answers can be expanded for AI answers','These answers are still exactly as first shipped and are shorter than the 40–60 words answer engines quote most. The expanded versions keep the same wording and policies, with one or two sentences added. Answers you have edited are never touched.'),
          h('ul',{style:{margin:'0 0 14px',paddingLeft:20,font:'400 13.5px/1.7 Plus Jakarta Sans',color:P.ink}}, ...up.map(x=>h('li',{key:x.i},this.txt(x.q)+' → '+this.wordCount(x.a)+' words'))),
          this.btn('Use the expanded answers',()=>this.upgradeFaq(),{variant:'solid',pad:'10px 18px',style:{fontSize:13.5}})),{marginBottom:20,borderColor:P.gold}); })(),
      ...groups.map(g=>this.card(h('div',null, h('div',{style:{font:'700 15px '+this.HEAD,color:P.maroon,marginBottom:10}},g),
        ...checks.filter(c=>c.group===g).map((c,i)=>h('div',{key:i,style:{display:'flex',gap:12,alignItems:'flex-start',padding:'9px 0',borderTop:i?'1px solid '+P.line:'none'}},
          h('span',{style:{width:22,height:22,borderRadius:'50%',flexShrink:0,background:col[c.status],color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',font:'700 12px '+this.HEAD,marginTop:1}},ico[c.status]),
          h('div',{style:{flex:1,minWidth:0}}, h('div',{style:{font:'600 14px/1.45 Plus Jakarta Sans',color:P.ink}},c.title), c.detail?h('div',{style:{font:'400 13px/1.55 Plus Jakarta Sans',color:P.muted,marginTop:2,whiteSpace:'pre-line'}},c.detail):null),
          c.fix&&c.status!=='ok'?h('button',{onClick:()=>this.setState({adminTab:c.fix}),style:{...this.iconBtn(),width:'auto',height:30,padding:'0 12px',font:'600 12px '+this.HEAD,flex:'0 0 auto'}},'Fix →'):null))),{marginBottom:16}))); }

  // ----- settings -----
  tabSettings(){ const h=React.createElement,P=this.P,d=this.state.data;
    const exportData=()=>{ try{ const blob=new Blob([JSON.stringify(d,null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='analysis-of-karma-content.json'; a.click(); }catch(e){} };
    const importData=()=>{ const inp=document.createElement('input'); inp.type='file'; inp.accept='application/json'; inp.onchange=e=>{ const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{ try{ this.save(JSON.parse(r.result)); this.flash('Content imported'); }catch(err){ this.flash('Invalid file'); } }; r.readAsText(f); }; inp.click(); };
    return h('div',null, this.adminHead('Settings','Your business details, contact email, map, social links and admin password \u2014 all editable here.'),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'}},
        h('div',{style:{display:'grid',gap:20}},
          this.card(h('div',null, h('div',{style:{font:'700 16px '+this.HEAD,color:P.maroon,marginBottom:16}},'Brand'),
            h('div',{style:{display:'flex',gap:14,alignItems:'center',marginBottom:18}},
              h('img',{src:(d.brand.logo||'/assets/logo-192.webp'),alt:'Logo',style:{width:60,height:60,objectFit:'contain',borderRadius:10,background:P.bgAlt}}),
              h('button',{onClick:()=>{const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.onchange=e=>{const f=e.target.files[0];if(!f)return;this.scaleImage(f,u=>this.commit('brand.logo',u),512,'image/png');};inp.click();},style:{...this.iconBtn(),width:'auto',padding:'10px 16px'}},'Upload logo'),
              d.brand.logo?h('button',{onClick:()=>this.commit('brand.logo',null),style:{...this.iconBtn(),width:'auto',padding:'10px 14px'}},'Reset'):null),
            this.inp('brand.name',{label:'Business name'}), this.inp('brand.astrologer',{label:'Astrologer name'}), this.inp('brand.tagline',{label:'Tagline',multiline:true,rows:2,mb:0}))),
          this.card(h('div',null, h('div',{style:{font:'700 16px '+this.HEAD,color:P.maroon,marginBottom:6}},'Email settings'),
            h('p',{style:{font:'400 13px Plus Jakarta Sans',color:P.muted,margin:'0 0 12px'}},'Contact-form submissions are emailed to the address below. Click “Save changes” after editing, then send a test to confirm delivery.'),
            this.inp('contact.email',{label:'Send enquiries to (recipient)',hint:'where you receive messages',type:'email'}),
            this.inp('contact.mailFrom',{label:'From address',hint:'use an address on your own domain for best delivery',type:'email',mb:8}),
            h('p',{style:{font:'400 12px/1.5 Plus Jakarta Sans',color:P.muted,margin:'0 0 14px'}},'Tip: a “From” address on your own domain (e.g. noreply@yourdomain.com) is far less likely to be marked as spam than a Gmail address.'),
            h('div',{style:{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}},
              this.btn(this._emailTesting?'Sending…':'✉ Send test email',()=>this.sendTestEmail(),{variant:'outline',pad:'10px 18px',style:{fontSize:13.5,opacity:this._emailTesting?.6:1,pointerEvents:this._emailTesting?'none':'auto'}})),
            this._emailTestMsg? h('div',{style:{marginTop:12,padding:'11px 14px',borderRadius:10,font:'500 13px/1.5 Plus Jakarta Sans',background:this._emailTestOk?'#e4f3e8':'#fbe9e3',color:this._emailTestOk?P.ok:P.bad}}, this._emailTestMsg):null)),
          this.card(h('div',null, h('div',{style:{font:'700 16px '+this.HEAD,color:P.maroon,marginBottom:16}},'Google Map / Location'),
            this.inp('contact.address',{label:'Business address',hint:'shown on Contact page',multiline:true,rows:2}),
            this.inp('contact.mapQuery',{label:'Map search query (optional)',hint:'overrides address for the map pin',mb:0})))),
        h('div',{style:{display:'grid',gap:20}},
          this.card(h('div',null, h('div',{style:{font:'700 16px '+this.HEAD,color:P.maroon,marginBottom:16}},'Contact details'),
            this.inp('contact.phone',{label:'Phone'}), this.inp('contact.whatsapp',{label:'WhatsApp number'},), h('div',{style:{height:0}}))),
          this.card(h('div',null, h('div',{style:{font:'700 16px '+this.HEAD,color:P.maroon,marginBottom:16}},'Social profiles',h('span',{style:{fontWeight:400,fontSize:12,color:P.muted}},'  (shown in the footer & contact page)')),
            this.inp('contact.facebook',{label:'Facebook URL'}), this.inp('contact.instagram',{label:'Instagram URL'}), this.inp('contact.youtube',{label:'YouTube URL'}), this.inp('contact.gmb',{label:'Google Maps / Business URL'}),
            h('div',{style:{borderTop:'1px solid '+P.line,margin:'4px 0 14px'}}),
            h('div',{style:{font:'600 13px '+this.HEAD,color:P.maroon,marginBottom:4}},'More social links'),
            h('p',{style:{font:'400 12.5px/1.5 Plus Jakarta Sans',color:P.muted,margin:'0 0 12px'}},'Add any other profiles (X/Twitter, LinkedIn, Pinterest, TikTok, Telegram, WhatsApp, a website…). They appear automatically alongside the icons above.'),
            ...((d.socials)||[]).map((s,i)=>h('div',{key:i,style:{display:'flex',gap:8,alignItems:'center',marginBottom:10}},
              h('select',{value:s.net||'website',onChange:e=>this.commit('socials.'+i+'.net',e.target.value),style:{flex:'0 0 auto',padding:'10px 11px',borderRadius:9,border:'1px solid '+P.line,background:P.white,font:'400 13.5px Plus Jakarta Sans',cursor:'pointer'}}, ...[['facebook','Facebook'],['instagram','Instagram'],['youtube','YouTube'],['x','X / Twitter'],['linkedin','LinkedIn'],['pinterest','Pinterest'],['tiktok','TikTok'],['telegram','Telegram'],['whatsapp','WhatsApp'],['google','Google'],['website','Website']].map(o=>h('option',{key:o[0],value:o[0]},o[1]))),
              h('input',{value:s.url||'',placeholder:'https://…',onChange:e=>this.commit('socials.'+i+'.url',e.target.value),style:{flex:1,padding:'10px 11px',borderRadius:9,border:'1px solid '+P.line,background:P.white,font:'400 13.5px Plus Jakarta Sans'}}),
              h('button',{onClick:()=>this.socDel(i),style:{...this.iconBtn(true),width:34,height:34,flex:'0 0 auto'}},'✕'))),
            this.btn('＋ Add social link',()=>this.socAdd(),{variant:'outline',pad:'9px 16px',style:{fontSize:13}}))),
          this.card(h('div',null, h('div',{style:{font:'700 16px '+this.HEAD,color:P.maroon,marginBottom:16}},'Security'),
            (()=>{ const f=this._pw||(this._pw={}); const set=(k,v)=>{ this._pw={...this._pw,[k]:v}; this.forceUpdate(); };
              const box=(k,label)=>h('label',{key:k,style:{display:'block',marginBottom:12}}, h('span',{style:this.lbl()},label), h('input',{type:'password',autoComplete:k==='current'?'current-password':'new-password',value:f[k]||'',onChange:e=>set(k,e.target.value),style:this.inpStyle()}));
              return h('div',null,
                this._defaultPw? h('p',{style:{font:'600 13px/1.5 Plus Jakarta Sans',color:P.bad,margin:'0 0 12px'}},'\u26a0 You are using the default password. Please change it now.'):null,
                h('p',{style:{font:'400 13px/1.55 Plus Jakarta Sans',color:P.muted,margin:'0 0 14px'}},'Your password is stored securely on the server (hashed) and is never part of the website data.'),
                box('current','Current password'), box('next','New password (8+ characters)'), box('confirm','Repeat new password'),
                this.btn('Change password',()=>this.changePassword(),{variant:'solid',pad:'10px 20px',style:{fontSize:13.5}})); })())),
          this.card(h('div',null, h('div',{style:{font:'700 16px '+this.HEAD,color:P.maroon,marginBottom:6}},'Backup'),
            h('p',{style:{font:'400 13px Plus Jakarta Sans',color:P.muted,margin:'0 0 14px'}},'Export all your content as a file, or restore from one.'),
            h('div',{style:{display:'flex',gap:10,flexWrap:'wrap'}}, this.btn('\u2193 Export content',exportData,{variant:'outline',pad:'10px 18px',style:{fontSize:13.5}}), this.btn('\u2191 Import',importData,{variant:'outline',pad:'10px 18px',style:{fontSize:13.5}}), this.btn('Reset site',()=>{ if(confirm('Reset ALL content to defaults? This cannot be undone.')) this.save(this.defaults()); },{variant:'outline',pad:'10px 18px',style:{fontSize:13.5,color:P.bad,borderColor:P.bad}})))))) ); }
}
/* ---- mount ---- */
const __root = ReactDOM.createRoot(document.getElementById('root'));
__root.render(React.createElement(Component));
