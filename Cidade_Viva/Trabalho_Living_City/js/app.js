const $ = (s, r = document) => r.querySelector(s);

/* Sessão simples (sem backend): fica no navegador. Senhas nunca são guardadas. */
const store = {
    get() {
        try { return JSON.parse(localStorage.getItem('lcUser') || sessionStorage.getItem('lcUser')); }
        catch { return null; }
    },
    set(user, persist) { (persist ? localStorage : sessionStorage).setItem('lcUser', JSON.stringify(user)); },
    clear() { localStorage.removeItem('lcUser'); sessionStorage.removeItem('lcUser'); }
};

/* Validação de um campo; mostra a mensagem dentro de .field */
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function check(inp) {
    const v = inp.value.trim();
    let m = '';
    if (inp.required && !v) m = inp.dataset.req || 'Campo obrigatório';
    else if (inp.type === 'email' && !emailRe.test(v)) m = 'Digite um e-mail válido';
    else if (inp.minLength > 0 && inp.value.length < inp.minLength) m = `Mínimo de ${inp.minLength} caracteres`;
    else if (inp.type === 'date' && inp.max && v > inp.max) m = 'Data inválida';
    else if (inp.dataset.match && inp.value !== $(inp.dataset.match).value) m = inp.dataset.matchMsg || 'Os valores não coincidem';
    const f = inp.closest('.field');
    f.classList.toggle('erro', !!m);
    $('.msg', f).textContent = m;
    return !m;
}
const checkAll = form => [...form.querySelectorAll('[required]')].map(check).every(Boolean);
window.LC = { $, store, check, checkAll };

/* Botão do cabeçalho: Log In / Sair */
const btn = $('#btnLogin');
if (btn) {
    const u = store.get();
    if (u) {
        btn.innerHTML = '<i class="bx bx-log-out"></i> Sair';
        btn.title = u.nome;
        btn.addEventListener('click', e => { e.preventDefault(); store.clear(); location.reload(); });
    }
}

/* Olhinho de mostrar/ocultar senha */
document.querySelectorAll('.eye').forEach(b => b.addEventListener('click', () => {
    const i = b.previousElementSibling;
    const show = i.type === 'password';
    i.type = show ? 'text' : 'password';
    b.innerHTML = `<i class="bx ${show ? 'bx-hide' : 'bx-show'}"></i>`;
}));

/* Formulários de acesso */
const params = new URLSearchParams(location.search);
const nextParam = params.get('next');
const destino = /^[\w-]+\.html$/.test(nextParam || '') ? nextParam : 'mapa.html';
if (nextParam && $('#nextNote')) $('#nextNote').hidden = false;

const nasc = $('#nascimento');
if (nasc) nasc.max = new Date().toISOString().slice(0, 10);

document.querySelectorAll('form[data-action]').forEach(form => {
    form.noValidate = true;
    form.addEventListener('input', e => { if (e.target.closest('.field.erro')) check(e.target); });
    form.addEventListener('submit', e => {
        e.preventDefault();
        if (!checkAll(form)) return;
        const email = form.elements.email.value.trim();
        const act = form.dataset.action;
        if (act === 'login') {
            store.set({ nome: email.split('@')[0], email }, $('#lembrar')?.checked);
            location.href = destino;
        } else if (act === 'cadastro') {
            store.set({ nome: form.elements.nome.value.trim(), email }, true);
            location.href = destino;
        } else if (act === 'reset') {
            $('#okMsg').hidden = false;
            form.querySelector('button[type=submit]').disabled = true;
        }
    });
});
