(() => {
  const root = document.getElementById('overlayList');
  if (!root) return;
  const defaults = { theme: 'pink', scale: '1', density: 'normal', sound: '1' };
  const themes = { pink: 'Pink / Violet', cyan: 'Cyan / Blue', gold: 'Gold / Ember', green: 'Emerald / Mint', mono: 'White / Graphite' };
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
    modal.innerHTML = `<section class="overlay-settings" role="dialog" aria-modal="true"><button type="button" class="overlay-settings-close" aria-label="Închide">×</button><span class="settings-kicker">OVERLAY CUSTOMIZER</span><h3>Customize · ${slug}</h3><p>Setările se păstrează local pentru acest overlay și se aplică și linkului copiat.</p><label>Temă<select data-setting="theme">${Object.entries(themes).map(([key, label]) => `<option value="${key}">${label}</option>`).join('')}</select></label><label>Dimensiune <output data-scale-value></output><input data-setting="scale" type="range" min="0.65" max="1.35" step="0.05"></label><label>Densitate<select data-setting="density"><option value="normal">Normal</option><option value="compact">Compact</option><option value="airy">Aerisit</option></select></label><label class="settings-check"><input data-setting="sound" type="checkbox"> Efecte sonore la eveniment</label><div class="overlay-settings-actions"><button type="button" data-save-settings>Salvează setările</button><button type="button" class="secondary" data-reset-settings>Resetează</button></div></section>`;
    document.body.append(modal);
    const get = key => modal.querySelector(`[data-setting="${key}"]`), output = modal.querySelector('[data-scale-value]');
    get('theme').value = current.theme; get('scale').value = current.scale; get('density').value = current.density; get('sound').checked = current.sound !== '0';
    const refreshScale = () => { output.textContent = `${Math.round(Number(get('scale').value) * 100)}%`; }; get('scale').oninput = refreshScale; refreshScale();
    const close = () => modal.remove(); modal.querySelector('.overlay-settings-close').onclick = close; modal.onclick = event => { if (event.target === modal) close(); };
    modal.querySelector('[data-reset-settings]').onclick = () => { get('theme').value = defaults.theme; get('scale').value = defaults.scale; get('density').value = defaults.density; get('sound').checked = true; refreshScale(); };
    modal.querySelector('[data-save-settings]').onclick = () => { const settings = { theme: get('theme').value, scale: get('scale').value, density: get('density').value, sound: get('sound').checked ? '1' : '0' }; write(slug, settings); apply(card, settings); close(); };
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
