(() => {
  const root = document.getElementById('overlayList');
  if (!root) return;
  const defaults = { theme: 'pink', scale: '1', density: 'normal', sound: '1', soundVolume: '0.7', motion: '1', glow: '1', radius: 'soft', labels: '1', text: '1', opacity: '1', align: 'center', border: 'glow', style: 'auto', title: '', subtitle: '', footer: '', event: '' };
  const themes = { pink: 'Pink / Violet', cyan: 'Cyan / Blue', gold: 'Gold / Ember', green: 'Emerald / Mint', mono: 'White / Graphite' };
  const motions = { '0.7': 'Calm', '1': 'Normal', '1.35': 'Energic', '1.7': 'Fast' };
  const styles = { auto: 'Adaptiv', neon: 'Neon', minimal: 'Minimal', arcade: 'Arcade' };
  const read = slug => { try { return { ...defaults, ...JSON.parse(localStorage.getItem(`tiklivetools_overlay_${slug}`) || '{}') }; } catch { return { ...defaults }; } };
  const write = (slug, value) => localStorage.setItem(`tiklivetools_overlay_${slug}`, JSON.stringify(value));
  function apply(card, settings) {
    const iframe = card.querySelector('iframe'), code = card.querySelector('code'), open = card.querySelector('.open-preview');
    if (!iframe || !code) return;
    const local = new URL(iframe.src, location.href);
    Object.entries(settings).forEach(([key, value]) => local.searchParams.set(key, value));
    iframe.src = local.toString();
    const publicUrl = new URL(code.dataset.baseUrl || code.textContent, location.href);
    Object.entries(settings).forEach(([key, value]) => publicUrl.searchParams.set(key, value));
    code.textContent = publicUrl.toString(); code.title = publicUrl.toString();
    if (open) open.href = publicUrl.toString();
  }
  function openEditor(card, slug) {
    const current = read(slug), modal = document.createElement('div');
    modal.className = 'overlay-settings-backdrop';
    modal.innerHTML = `<section class="overlay-settings" role="dialog" aria-modal="true"><button type="button" class="overlay-settings-close" aria-label="Închide">×</button><span class="settings-kicker">OVERLAY CUSTOMIZER</span><h3>Customize · ${slug}</h3><p>Setările se păstrează local pentru acest overlay și se aplică și linkului copiat.</p><div class="settings-texts"><label>Titlu personalizat<input data-setting="title" maxlength="48" placeholder="Folosește titlul implicit"></label><label>Subtitlu / mesaj<input data-setting="subtitle" maxlength="80" placeholder="Text afișat sub overlay"></label><label>Footer / etichetă<input data-setting="footer" maxlength="60" placeholder="Ex: Mulțumesc pentru suport!"></label><label>Mesaj eveniment<input data-setting="event" maxlength="80" placeholder="Folosit pentru Actions / alerte"></label></div><div class="settings-grid"><label>Paletă<select data-setting="theme">${Object.entries(themes).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}</select></label><label>Stil vizual<select data-setting="style">${Object.entries(styles).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}</select></label><label>Dimensiune <output data-scale-value></output><input data-setting="scale" type="range" min="0.65" max="1.35" step="0.05"></label><label>Mărime text <output data-text-value></output><input data-setting="text" type="range" min="0.8" max="1.3" step="0.05"></label><label>Viteză animații<select data-setting="motion">${Object.entries(motions).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}</select></label><label>Intensitate glow <output data-glow-value></output><input data-setting="glow" type="range" min="0.25" max="1.5" step="0.05"></label><label>Opacitate elemente <output data-opacity-value></output><input data-setting="opacity" type="range" min="0.65" max="1" step="0.05"></label><label>Aliniere<select data-setting="align"><option value="center">Centrat</option><option value="left">Stânga</option><option value="right">Dreapta</option></select></label><label>Chenar<select data-setting="border"><option value="glow">Glow</option><option value="line">Linie discretă</option><option value="none">Fără chenar</option></select></label><label>Formă colțuri<select data-setting="radius"><option value="soft">Soft</option><option value="round">Rotunjit</option><option value="square">Modern drept</option></select></label><label>Densitate<select data-setting="density"><option value="normal">Normal</option><option value="compact">Compact</option><option value="airy">Aerisit</option></select></label></div><label class="settings-check"><input data-setting="sound" type="checkbox"> Efecte sonore la eveniment</label><label>Volum efecte sonore <output data-volume-value></output><input data-setting="soundVolume" type="range" min="0" max="1" step="0.05"></label><label class="settings-check"><input data-setting="labels" type="checkbox"> Afișează etichetele și textele</label><div class="overlay-settings-actions"><button type="button" data-save-settings>Salvează setările</button><button type="button" class="secondary" data-reset-settings>Resetează</button></div></section>`;
    document.body.append(modal);
    const get = key => modal.querySelector(`[data-setting="${key}"]`), output = modal.querySelector('[data-scale-value]'), glowOutput = modal.querySelector('[data-glow-value]'), textOutput = modal.querySelector('[data-text-value]'), opacityOutput = modal.querySelector('[data-opacity-value]'), volumeOutput = modal.querySelector('[data-volume-value]');
    ['title','subtitle','footer','event'].forEach(key => get(key).value = current[key] || ''); get('theme').value = current.theme; get('style').value = current.style; get('scale').value = current.scale; get('text').value = current.text; get('motion').value = current.motion; get('glow').value = current.glow; get('opacity').value = current.opacity; get('align').value = current.align; get('border').value = current.border; get('soundVolume').value = current.soundVolume; get('radius').value = current.radius; get('density').value = current.density; get('sound').checked = current.sound !== '0'; get('labels').checked = current.labels !== '0';
    const refreshValues = () => { output.textContent = `${Math.round(Number(get('scale').value) * 100)}%`; glowOutput.textContent = `${Math.round(Number(get('glow').value) * 100)}%`; textOutput.textContent = `${Math.round(Number(get('text').value) * 100)}%`; opacityOutput.textContent = `${Math.round(Number(get('opacity').value) * 100)}%`; volumeOutput.textContent = `${Math.round(Number(get('soundVolume').value) * 100)}%`; }; ['scale','glow','text','opacity','soundVolume'].forEach(key => get(key).oninput = refreshValues); refreshValues();
    const close = () => modal.remove(); modal.querySelector('.overlay-settings-close').onclick = close; modal.onclick = event => { if (event.target === modal) close(); };
    modal.querySelector('[data-reset-settings]').onclick = () => { Object.keys(defaults).forEach(key => { if(get(key)?.type === 'checkbox') get(key).checked = defaults[key] !== '0'; else if(get(key)) get(key).value = defaults[key]; }); refreshValues(); };
    modal.querySelector('[data-save-settings]').onclick = () => { const settings = { title: get('title').value.trim(), subtitle: get('subtitle').value.trim(), footer: get('footer').value.trim(), event: get('event').value.trim(), theme: get('theme').value, style: get('style').value, scale: get('scale').value, text: get('text').value, motion: get('motion').value, glow: get('glow').value, opacity: get('opacity').value, align: get('align').value, border: get('border').value, soundVolume: get('soundVolume').value, radius: get('radius').value, density: get('density').value, sound: get('sound').checked ? '1' : '0', labels: get('labels').checked ? '1' : '0' }; write(slug, settings); apply(card, settings); close(); };
  }
  function enhance() {
    root.querySelectorAll('.overlay-card').forEach(card => {
      if (card.dataset.customized) return;
      const slug = card.querySelector('.overlay-head span')?.textContent?.trim(), code = card.querySelector('code');
      if (!slug || !code) return;
      card.dataset.customized = '1'; code.dataset.baseUrl = code.textContent;
      const button = document.createElement('button'); button.type = 'button'; button.className = 'secondary'; button.textContent = 'Customize'; button.onclick = () => openEditor(card, slug); card.querySelector('.overlay-actions')?.append(button); apply(card, read(slug));
    });
  }
  new MutationObserver(enhance).observe(root, { childList: true }); enhance(); window.addEventListener('hashchange', () => setTimeout(enhance, 80));
})();
