/* Ocorrências urbanas · usa $, store, check e checkAll de app.js */
(() => {
    const CATS = {
        'Iluminação Pública':     'bx-bulb',
        'Vias e Asfalto':         'bx-road',
        'Saneamento / Vazamento': 'bx-droplet',
        'Segurança':              'bx-shield-alt-2',
        'Outros':                 'bx-dots-horizontal-rounded'
    };
    const KEY = 'lcUrbanas', KEY_CONF = 'lcConfirmacoes';
    const LOGIN = 'index.html?next=ocorrencias.html';

    const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const ler = (k, v) => { try { return JSON.parse(localStorage.getItem(k)) ?? v; } catch { return v; } };
    const data = iso => new Date(iso).toLocaleDateString('pt-BR');

    const exemplos = (window.CIDADE_VIVA_DADOS || []).map(o => ({ ...o, base: o.confirmationCount || 0 }));
    let minhas = ler(KEY, []);
    let filtroCat = 'todos', aba = 'todos';

    const email = () => store.get()?.email;
    const confirmadas = () => email() ? ler(KEY_CONF + ':' + email(), []) : [];
    const todas = () => minhas.concat(exemplos).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const ehMinha = o => !!o.autor && o.autor === email();
    const total = (o, conf) => (o.base || 0) + (conf.includes(o.id) ? 1 : 0);

    function toast(msg) {
        const t = $('#toast'); t.textContent = msg; t.classList.add('show');
        clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('show'), 3200);
    }

    /* ---------- Renderização ---------- */
    function render() {
        const lista = todas(), conf = confirmadas();
        $('#kTotal').textContent = lista.length;
        $('#kConf').textContent = lista.reduce((s, o) => s + total(o, conf), 0);
        $('#kAberto').textContent = lista.filter(o => o.status !== 'Resolvida').length;
        $('#loginNote').hidden = !!store.get();

        const itens = lista.filter(o => (filtroCat === 'todos' || o.category === filtroCat) && (aba === 'todos' || ehMinha(o)));
        const el = $('#ocs');
        if (!itens.length) {
            el.innerHTML = `<p class="empty">${aba === 'meus'
                ? (store.get() ? 'Você ainda não registrou nenhuma ocorrência.' : 'Faça login para ver as suas ocorrências.')
                : 'Nenhuma ocorrência para este filtro.'}</p>`;
            return;
        }
        el.innerHTML = itens.map(o => {
            const n = total(o, conf), ja = conf.includes(o.id);
            return `
        <article class="oc${o.photoUrl ? '' : ' nophoto'}" data-id="${esc(o.id)}">
            ${o.photoUrl ? `<div class="ph"><img src="${esc(o.photoUrl)}" alt="Foto do local da ocorrência" loading="lazy"></div>` : ''}
            <div class="bd">
                <div class="pills">
                    <span class="pill"><i class="bx ${CATS[o.category] || CATS['Outros']}"></i>${esc(o.category)}</span>
                    <span class="pill ${o.status === 'Resolvida' ? 'done' : 'open'}"><i class="bx ${o.status === 'Resolvida' ? 'bx-check-circle' : 'bx-time-five'}"></i>${esc(o.status)}</span>
                    ${ehMinha(o) ? '<span class="tag" style="margin:0">Seu relato</span>' : ''}
                </div>
                <div class="loc"><i class="bx bx-map-pin"></i>${esc(o.location)}</div>
                <p class="desc">${esc(o.description)}</p>
                <div class="ft">
                    <span class="conf"><i class="bx bx-group"></i><span><strong>${n}</strong> ${n === 1 ? 'pessoa confirmou' : 'pessoas confirmaram'}</span></span>
                    <span class="acts">
                        <button type="button" class="btn btn-line mini" data-act="det"><i class="bx bx-show"></i> Detalhes</button>
                        <button type="button" class="btn ${ja ? 'btn-ok' : 'btn-blue'} mini" data-act="conf" ${ja ? 'disabled' : ''}><i class="bx ${ja ? 'bx-check' : 'bx-like'}"></i> ${ja ? 'Confirmado' : 'Confirmar'}</button>
                    </span>
                </div>
            </div>
        </article>`;
        }).join('');
    }

    /* ---------- Detalhes e confirmação ---------- */
    $('#ocs').addEventListener('click', e => {
        const b = e.target.closest('button[data-act]'); if (!b) return;
        const o = todas().find(x => x.id === b.closest('.oc').dataset.id); if (!o) return;
        if (b.dataset.act === 'det') return detalhes(o);
        if (!store.get()) { location.href = LOGIN; return; }
        const k = KEY_CONF + ':' + email(), c = ler(k, []);
        if (!c.includes(o.id)) { c.push(o.id); localStorage.setItem(k, JSON.stringify(c)); }
        render();
        toast('Obrigado! Sua confirmação foi registrada.');
    });

    function detalhes(o) {
        const n = total(o, confirmadas()), d = $('#dlgDet');
        d.innerHTML = `
            <h2>${esc(o.category)}</h2>
            <div class="pills" style="margin-bottom:14px">
                <span class="pill ${o.status === 'Resolvida' ? 'done' : 'open'}">${esc(o.status)}</span>
                <span class="pill"><i class="bx bx-group"></i>${n} ${n === 1 ? 'confirmação' : 'confirmações'}</span>
            </div>
            <div class="loc" style="display:flex;gap:6px;align-items:center;color:var(--muted);font-size:14px"><i class="bx bx-map-pin" style="color:var(--blue)"></i>${esc(o.location)}</div>
            <p style="margin-top:12px;line-height:1.6;color:#33436b">${esc(o.description)}</p>
            <small style="display:block;margin-top:10px;color:var(--muted)">Registrada em ${data(o.createdAt)}</small>
            ${o.photoUrl ? `<img class="det-photo" src="${esc(o.photoUrl)}" alt="Foto do local da ocorrência">` : ''}
            <div class="row"><button type="button" class="btn btn-blue" id="fecharDet">Fechar</button></div>`;
        $('#fecharDet').onclick = () => d.close();
        d.showModal();
    }

    /* ---------- Filtros ---------- */
    $('#chips').innerHTML = [['todos', 'Todas', 'bx-filter-alt'], ...Object.entries(CATS).map(([k, i]) => [k, k, i])]
        .map(([k, n, i]) => `<button type="button" class="chip${k === 'todos' ? ' on' : ''}" data-k="${esc(k)}"><i class="bx ${i}"></i>${esc(n)}</button>`).join('');
    $('#chips').addEventListener('click', e => {
        const b = e.target.closest('.chip'); if (!b) return;
        filtroCat = b.dataset.k;
        document.querySelectorAll('#chips .chip').forEach(c => c.classList.toggle('on', c === b));
        render();
    });
    function setAba(v) {
        aba = v;
        document.querySelectorAll('#seg button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
        render();
    }
    $('#seg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setAba(b.dataset.v); });
    document.querySelector('[data-act="meus"]').addEventListener('click', () => setAba('meus'));

    /* ---------- Formulário ---------- */
    const form = $('#formOc'), foto = $('#oFoto'), upload = $('#upload');
    $('#oCat').innerHTML = '<option value="">Selecione…</option>' + Object.keys(CATS).map(c => `<option>${c}</option>`).join('');

    function erroFoto(m) {
        const f = foto.closest('.field');
        f.classList.toggle('erro', !!m);
        $('.msg', f).textContent = m || '';
        return !m;
    }
    foto.addEventListener('change', () => {
        const f = foto.files[0];
        upload.classList.toggle('has', !!f);
        $('span', upload).innerHTML = f ? `<b>${esc(f.name)}</b>` : '<b>Clique para adicionar</b> uma foto';
        if (!f) return erroFoto('');
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return erroFoto('Escolha uma foto JPG, PNG ou WEBP.');
        if (f.size > 5 * 1024 * 1024) return erroFoto('A foto deve ter no máximo 5 MB.');
        erroFoto('');
    });
    // reduz a foto para caber no armazenamento do navegador
    const lerFoto = f => new Promise((ok, falha) => {
        const r = new FileReader();
        r.onerror = falha;
        r.onload = () => {
            const im = new Image();
            im.onerror = falha;
            im.onload = () => {
                const s = Math.min(1, 900 / Math.max(im.width, im.height));
                const c = document.createElement('canvas');
                c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
                c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
                ok(c.toDataURL('image/jpeg', .72));
            };
            im.src = r.result;
        };
        r.readAsDataURL(f);
    });

    form.addEventListener('input', e => { if (e.target.closest('.field.erro') && e.target !== foto) check(e.target); });
    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!store.get()) { location.href = LOGIN; return; }
        const okCampos = checkAll(form);
        if (!okCampos || foto.closest('.field').classList.contains('erro')) return;

        const btn = $('#enviar'); btn.disabled = true;
        let photoUrl;
        try { if (foto.files[0]) photoUrl = await lerFoto(foto.files[0]); }
        catch { erroFoto('Não foi possível ler a foto.'); btn.disabled = false; return; }

        const o = {
            id: 'u' + Date.now(), category: $('#oCat').value, location: $('#oLocal').value.trim(),
            description: $('#oDesc').value.trim(), photoUrl, status: 'Em aberto', base: 0,
            createdAt: new Date().toISOString(), autor: email()
        };
        minhas.unshift(o);
        try { localStorage.setItem(KEY, JSON.stringify(minhas)); }
        catch { delete o.photoUrl; try { localStorage.setItem(KEY, JSON.stringify(minhas)); } catch {} toast('Foto muito grande para salvar; ocorrência enviada sem ela.'); }

        form.reset();
        foto.dispatchEvent(new Event('change'));
        btn.disabled = false;
        filtroCat = 'todos';
        document.querySelectorAll('#chips .chip').forEach(c => c.classList.toggle('on', c.dataset.k === 'todos'));
        setAba('todos');
        toast('Ocorrência registrada! Obrigado por colaborar.');
    });

    render();
})();
