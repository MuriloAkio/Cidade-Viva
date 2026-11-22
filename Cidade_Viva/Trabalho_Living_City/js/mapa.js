const TIPOS = {
    descarte: { nome: 'Descarte irregular', icone: 'bx-trash' },
    ar:       { nome: 'Poluição do ar',     icone: 'bx-wind' },
    agua:     { nome: 'Poluição da água',   icone: 'bx-water' },
    queimada: { nome: 'Queimada',           icone: 'bxs-hot' }
};
const CIDADES = {
    'São Paulo':             { lat: -23.5507, lng: -46.6334, regiao: 'Grande São Paulo' },
    'Campinas':              { lat: -22.9099, lng: -47.0626, regiao: 'Campinas' },
    'Santos':                { lat: -23.9608, lng: -46.3336, regiao: 'Baixada Santista' },
    'Ribeirão Preto':        { lat: -21.1775, lng: -47.8103, regiao: 'Ribeirão Preto' },
    'São José do Rio Preto': { lat: -20.8113, lng: -49.3758, regiao: 'São José do Rio Preto' },
    'Sorocaba':              { lat: -23.5015, lng: -47.4526, regiao: 'Sorocaba' },
    'Bauru':                 { lat: -22.3246, lng: -49.0871, regiao: 'Bauru' },
    'Presidente Prudente':   { lat: -22.1256, lng: -51.3889, regiao: 'Presidente Prudente' }
};

const iso = d => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
const diasAtras = n => iso(Date.now() - n * 864e5);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* Dados de exemplo (a primeira é a ocorrência original do projeto) */
const seed = [
    [1, 'descarte', 'São Paulo', 6, 'Entulho e lixo doméstico acumulados na calçada.'],
    [2, 'ar', 'Campinas', 3, 'Fumaça escura constante vinda de uma indústria.'],
    [3, 'agua', 'Santos', 12, 'Mancha de óleo e mau cheiro no canal.'],
    [4, 'queimada', 'Ribeirão Preto', 2, 'Foco de fogo em área de canavial.'],
    [5, 'descarte', 'Sorocaba', 20, 'Descarte de pneus em terreno baldio.'],
    [6, 'agua', 'São José do Rio Preto', 45, 'Esgoto a céu aberto próximo ao córrego.'],
    [7, 'ar', 'Bauru', 9, 'Odor forte e poeira em suspensão na região.'],
    [8, 'queimada', 'Presidente Prudente', 28, 'Queima de vegetação à beira da estrada.']
].map(([id, tipo, cidade, d, desc]) => ({
    id, tipo, cidade, regiao: CIDADES[cidade].regiao,
    latitude: CIDADES[cidade].lat, longitude: CIDADES[cidade].lng, data: diasAtras(d), desc
}));

const lerMinhas = () => { try { return JSON.parse(localStorage.getItem('lcOcorrencias')) || []; } catch { return []; } };
let minhas = lerMinhas();
const todas = () => seed.concat(minhas);
const ehMinha = o => !!o.autor && o.autor === store.get()?.email;

let filtroTipo = 'todos', aba = 'todos';
const marcas = {};

/* ---------- Mapa ---------- */
let map = null, camada = null;
if (typeof L !== 'undefined') {
    const SP = L.latLngBounds([-25.4, -53.2], [-19.7, -44.0]);
    map = L.map('map', { scrollWheelZoom: false, maxBounds: SP.pad(0.3), minZoom: 6, maxZoom: 12 }).fitBounds(SP);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19, subdomains: 'abcd',
        attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);
    map.on('focus', () => map.scrollWheelZoom.enable());
    map.on('blur', () => map.scrollWheelZoom.disable());

    // Contorno do estado de São Paulo
    fetch('https://cdn.jsdelivr.net/gh/henriquemalvar/br-geojson@main/dist/estados.geojson')
        .then(r => r.json())
        .then(data => L.geoJSON(data, {
            filter: f => f.properties.sigla === 'SP',
            style: { color: '#113d9c', weight: 3, fillColor: '#1d59db', fillOpacity: 0.07 }
        }).addTo(map))
        .catch(() => {});

    camada = L.layerGroup().addTo(map);
} else {
    $('#map').innerHTML = '<div class="map-off">Não foi possível carregar o mapa. Verifique sua conexão com a internet.</div>';
}

const icone = map && L.icon({ iconUrl: 'assets/marcador.png', iconSize: [38, 45], iconAnchor: [19, 45], popupAnchor: [0, -40] });

/* ---------- Utilidades de exibição ---------- */
const relativo = d => {
    const n = Math.round((new Date(iso(Date.now()) + 'T00:00:00') - new Date(d + 'T00:00:00')) / 864e5);
    return n <= 0 ? 'hoje' : n === 1 ? 'ontem' : `há ${n} dias`;
};
const popup = o => `<div class="pop"><strong>${TIPOS[o.tipo].nome}</strong><br>
    Cidade: ${esc(o.cidade)}<br>Região: ${esc(o.regiao)}<br>Data: ${o.data.split('-').reverse().join('/')}
    ${o.desc ? `<br><small>${esc(o.desc)}</small>` : ''}</div>`;

function contar(el, to) {
    const t0 = performance.now();
    (function f(t) {
        const p = Math.min((t - t0) / 700, 1);
        el.textContent = Math.round(to * p);
        if (p < 1) requestAnimationFrame(f);
    })(t0);
}

/* ---------- Renderização ---------- */
function render() {
    const lista = todas();
    const visiveis = lista.filter(o => filtroTipo === 'todos' || o.tipo === filtroTipo);

    if (map) {
        camada.clearLayers();
        visiveis.forEach(o => {
            const m = L.marker([o.latitude, o.longitude], { icon: icone }).bindPopup(popup(o));
            m.addTo(camada);
            marcas[o.id] = m;
        });
    }

    // Indicadores (sempre sobre todas as ocorrências)
    const recentes = lista.filter(o => { const n = (Date.now() - new Date(o.data + 'T00:00:00')) / 864e5; return n >= 0 && n <= 30; });
    contar($('#totalOcorrencias'), lista.length);
    contar($('#totalRegioes'), new Set(lista.map(o => o.regiao)).size);
    contar($('#totalRelatos'), recentes.length);

    // Lista de relatos
    const el = $('#lista');
    const itens = visiveis.filter(o => aba === 'todos' || ehMinha(o)).sort((a, b) => b.data.localeCompare(a.data)).slice(0, 9);
    if (!itens.length) {
        el.innerHTML = `<p class="empty">${aba === 'meus'
            ? (store.get() ? 'Você ainda não registrou nenhuma ocorrência.' : 'Faça login para ver os seus relatos.')
            : 'Nenhum relato para este filtro.'}</p>`;
        return;
    }
    el.innerHTML = itens.map(o => `
        <article class="rel" data-id="${o.id}">
            <div class="ic"><i class="bx ${TIPOS[o.tipo].icone}"></i></div>
            <div><h3>${TIPOS[o.tipo].nome}${ehMinha(o) ? '<span class="tag">Seu relato</span>' : ''}</h3>
            <small>${esc(o.cidade)}${o.regiao !== o.cidade ? ' · ' + esc(o.regiao) : ''} · ${relativo(o.data)}</small>
            ${o.desc ? `<p>${esc(o.desc)}</p>` : ''}</div>
        </article>`).join('');
}

$('#lista').addEventListener('click', e => {
    const card = e.target.closest('.rel');
    if (!card || !map || !marcas[card.dataset.id]) return;
    $('#mapa').scrollIntoView();
    map.flyTo(marcas[card.dataset.id].getLatLng(), 9);
    marcas[card.dataset.id].openPopup();
});

/* ---------- Filtros ---------- */
$('#chips').innerHTML = [['todos', 'Todos', 'bx-filter-alt'], ...Object.entries(TIPOS).map(([k, t]) => [k, t.nome, t.icone])]
    .map(([k, n, i]) => `<button type="button" class="chip${k === 'todos' ? ' on' : ''}" data-k="${k}"><i class="bx ${i}"></i>${n}</button>`).join('');
$('#chips').addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    filtroTipo = b.dataset.k;
    document.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b));
    render();
});

function setAba(v) {
    aba = v;
    document.querySelectorAll('#seg button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    render();
}
$('#seg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setAba(b.dataset.v); });

/* ---------- Nova ocorrência ---------- */
const dlg = $('#dlg'), form = $('#formOc');
$('#oTipo').innerHTML = '<option value="">Selecione…</option>' + Object.entries(TIPOS).map(([k, t]) => `<option value="${k}">${t.nome}</option>`).join('');
$('#oCidade').innerHTML = '<option value="">Selecione…</option>' + Object.keys(CIDADES).map(c => `<option>${c}</option>`).join('');

function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('show'), 3200);
}
function abrirForm() {
    if (!store.get()) { location.href = 'index.html?next=mapa.html'; return; }
    form.reset();
    $('#oData').max = $('#oData').value = iso(Date.now());
    form.querySelectorAll('.field').forEach(f => f.classList.remove('erro'));
    setNav(1);
    dlg.showModal();
}
$('#r_ocorrencia').addEventListener('click', abrirForm);
$('#cancelar').addEventListener('click', () => dlg.close());
dlg.addEventListener('close', () => setNav(secAtual));
form.addEventListener('input', e => { if (e.target.closest('.field.erro')) check(e.target); });
form.addEventListener('submit', e => {
    e.preventDefault();
    if (!checkAll(form)) return;
    const c = CIDADES[$('#oCidade').value];
    const o = {
        id: 'u' + Date.now(), tipo: $('#oTipo').value, cidade: $('#oCidade').value, regiao: c.regiao,
        latitude: c.lat + (Math.random() - .5) * .06, longitude: c.lng + (Math.random() - .5) * .06,
        data: $('#oData').value, desc: $('#oDesc').value.trim(), autor: store.get().email
    };
    minhas.push(o);
    localStorage.setItem('lcOcorrencias', JSON.stringify(minhas));
    dlg.close();
    filtroTipo = 'todos';
    document.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.k === 'todos'));
    render();
    toast('Ocorrência registrada! Obrigado por colaborar.');
    if (map && marcas[o.id]) { map.flyTo(marcas[o.id].getLatLng(), 9); marcas[o.id].openPopup(); }
});

/* ---------- Barra de navegação ---------- */
const nav = $('#nav'), links = [...nav.querySelectorAll('a')];
let secAtual = 0;
function setNav(i) {
    nav.style.setProperty('--i', i);
    links.forEach((a, k) => a.classList.toggle('active', k === i));
}
links.forEach((a, i) => a.addEventListener('click', e => {
    if (a.getAttribute('href').endsWith('.html')) return;
    if (a.dataset.act === 'novo') { e.preventDefault(); abrirForm(); return; }
    if (a.dataset.act === 'meus') setAba('meus');
    secAtual = i; setNav(i);
}));
const mapaSec = { mapa: 0, relatos: 2, sobre: 4 };
const obs = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting && !dlg.open) { secAtual = mapaSec[en.target.id]; setNav(secAtual); }
}), { rootMargin: '-40% 0px -55% 0px' });
['mapa', 'relatos', 'sobre'].forEach(id => obs.observe($('#' + id)));

render();
