document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('form-estudo');
  const listaRevisoes = document.getElementById('lista-revisoes');
  const btnTema = document.getElementById('toggle-tema');
  const btnExportar = document.getElementById('btn-exportar-pdf');
  const seletorFiltro = document.getElementById('filtro-status');
  const painelResumo = document.querySelector('#painel-resumo strong');
  const boasVindas = document.getElementById('boas-vindas');

  const STORAGE_KEY = 'revisoesEstudo';
  const NOME_KEY = 'nomeUsuario';

  // Pergunta nome
  function perguntarNome() {
    let nome = localStorage.getItem(NOME_KEY);
    if (!nome) {
      nome = prompt("👋 Olá! Qual é o seu nome?");
      if (!nome || nome.trim().length < 2) nome = "Estudante";
      localStorage.setItem(NOME_KEY, nome);
    }
    boasVindas.textContent = `📘 Bem-vindo, ${nome}!`;
    if (painelResumo) painelResumo.textContent = `📊 Resumo da semana de ${nome}:`;
    return nome;
  }

  const nomeUsuario = perguntarNome();

  // Toast visual
  function mostrarToast(mensagem) {
    const toast = document.createElement('div');
    toast.textContent = mensagem;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.background = '#0077cc';
    toast.style.color = '#fff';
    toast.style.padding = '1rem';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    toast.style.zIndex = '9999';
    toast.style.fontWeight = '600';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function salvarRevisoes(revisoes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(revisoes));
  }

  function carregarRevisoes() {
    const dados = localStorage.getItem(STORAGE_KEY);
    return dados ? JSON.parse(dados) : [];
  }

  function atualizarResumo(revisoes) {
    const total = revisoes.reduce((acc, rev) => acc + rev.datas.length, 0);
    const feitas = revisoes.reduce((acc, rev) => acc + rev.status.filter(s => s === 'revisado').length, 0);
    const hoje = new Date();
    const fimSemana = new Date();
    fimSemana.setDate(hoje.getDate() + 7);

    const pendentesSemana = revisoes.reduce((acc, rev) => {
      rev.datas.forEach((data, i) => {
        const dataRev = new Date(data.split('/').reverse().join('-'));
        if (dataRev >= hoje && dataRev <= fimSemana && rev.status[i] === 'pendente') {
          acc++;
        }
      });
      return acc;
    }, 0);

    document.getElementById('total-revisoes').textContent = `Total de revisões: ${total}`;
    document.getElementById('pendentes-semana').textContent = `Pendentes desta semana: ${pendentesSemana}`;
    document.getElementById('revisadas').textContent = `Revisões feitas: ${feitas}`;
  }

  function exibirRevisoes(revisoes, filtro = 'todos') {
    listaRevisoes.innerHTML = '';
    atualizarResumo(revisoes);
    const hoje = new Date().toLocaleDateString('pt-BR');

    revisoes.forEach((revisao, indexRevisao) => {
      revisao.datas.forEach((data, i) => {
        const status = revisao.status[i];
        if (filtro !== 'todos' && status !== filtro) return;

        const item = document.createElement('div');
        item.classList.add('revisao-item');
        if (data === hoje && status === 'pendente') {
          item.style.borderLeft = '6px solid orange';
          item.style.backgroundColor = 'rgba(255,165,0,0.08)';
        }

        const titulo = document.createElement('h3');
        titulo.textContent = `${revisao.titulo} — Revisão ${i + 1}`;

        const dataEl = document.createElement('p');
        dataEl.textContent = `📅 Revisar em: ${data}`;

        const statusEl = document.createElement('p');
        statusEl.textContent = status === 'revisado' ? '✅ Revisado' : '🕐 Pendente';
        statusEl.style.fontWeight = 'bold';
        statusEl.style.color = status === 'revisado' ? 'green' : '#cc8800';

        const btnRevisar = document.createElement('button');
        btnRevisar.textContent = status === 'revisado' ? '✔️' : 'Marcar como revisado';
        btnRevisar.disabled = status === 'revisado';
        btnRevisar.addEventListener('click', () => {
          revisoes[indexRevisao].status[i] = 'revisado';
          salvarRevisoes(revisoes);
          exibirRevisoes(revisoes, seletorFiltro.value);
          mostrarToast(`✅ ${nomeUsuario}, revisão marcada como feita!`);
        });

        const btnExcluir = document.createElement('button');
        btnExcluir.textContent = '🗑️ Excluir conteúdo';
        btnExcluir.style.backgroundColor = '#cc0000';
        btnExcluir.style.marginLeft = '1rem';
        btnExcluir.addEventListener('click', () => {
          if (confirm(`Deseja excluir "${revisao.titulo}"?`)) {
            revisoes.splice(indexRevisao, 1);
            salvarRevisoes(revisoes);
            exibirRevisoes(revisoes, seletorFiltro.value);
            mostrarToast(`🗑️ ${nomeUsuario}, conteúdo excluído.`);
          }
        });

        if (revisao.descricao) {
          const nota = document.createElement('p');
          nota.textContent = `🧠 ${revisao.descricao}`;
          item.appendChild(nota);
        }

        item.appendChild(titulo);
        item.appendChild(dataEl);
        item.appendChild(statusEl);
        item.appendChild(btnRevisar);
        item.appendChild(btnExcluir);
        listaRevisoes.appendChild(item);
      });
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const titulo = document.getElementById('titulo').value.trim();
    const data = document.getElementById('data').value;
    const descricao = document.getElementById('descricao').value.trim();

    if (!titulo || !data) return alert("Preencha o título e a data.");
    const base = new Date(data);
    if (base > new Date()) return alert("Data futura inválida.");

    const intervalos = [1, 4, 7, 15, 30];
    const datas = intervalos.map(d => {
      const nova = new Date(base);
      nova.setDate(nova.getDate() + d);
      return nova.toLocaleDateString('pt-BR');
    });

    const nova = {
      titulo,
      descricao,
      datas,
      status: Array(5).fill('pendente')
    };

    const revisoes = carregarRevisoes();
    revisoes.push(nova);
    salvarRevisoes(revisoes);
    exibirRevisoes(revisoes, seletorFiltro.value);
    form.reset();
    mostrarToast(`✅ ${nomeUsuario}, conteúdo salvo!`);
  });

  seletorFiltro.addEventListener('change', () => {
    exibirRevisoes(carregarRevisoes(), seletorFiltro.value);
  });

  btnExportar.addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const revisoes = carregarRevisoes();
    let y = 10;

    doc.setFontSize(16);
    doc.text(`Revisões - ${nomeUsuario}`, 10, y);
    y += 10;

    revisoes.forEach(rev => {
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`📘 ${rev.titulo}`, 10, y);
      y += 7;

      rev.datas.forEach((data, i) => {
        const status = rev.status[i] === 'revisado' ? '✅' : '🕐';
        doc.text(`- ${data} - Revisão ${i + 1} - ${status}`, 15, y);
        y += 6;
      });

      if (rev.descricao) {
        doc.setTextColor(100);
        doc.text(`🧠 ${rev.descricao}`, 15, y);
        y += 8;
      }

      y += 5;
      if (y > 270) {
        doc.addPage();
        y = 10;
      }
    });

    doc.save(`revisoes-${nomeUsuario.toLowerCase()}.pdf`);
  });

  // Notificações
  function pedirPermissao() {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }

  function notificarHoje(revisoes) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const hoje = new Date().toLocaleDateString('pt-BR');

    revisoes.forEach(rev => {
      rev.datas.forEach((data, i) => {
        if (data === hoje && rev.status[i] === 'pendente') {
          new Notification(`${nomeUsuario}, revisão pendente`, {
            body: `📘 ${rev.titulo} - Revisão ${i + 1}`,
            icon: 'https://cdn-icons-png.flaticon.com/512/2709/2709691.png'
          });
        }
      });
    });
  }

  // Modo escuro
  function aplicarTema(escuro) {
    document.body.classList.toggle('dark-mode', escuro);
    localStorage.setItem('temaPreferido', escuro ? 'escuro' : 'claro');
  }

  function inicializarTema() {
    const temaSalvo = localStorage.getItem('temaPreferido');
    const usarEscuro = temaSalvo === 'escuro' || (!temaSalvo && window.matchMedia('(prefers-color-scheme: dark)').matches);
    aplicarTema(usarEscuro);
  }

  btnTema.addEventListener('click', () => {
    const escuro = !document.body.classList.contains('dark-mode');
    aplicarTema(escuro);
  });

  // Backup e Importação
  const btnBackup = document.createElement('button');
  btnBackup.textContent = '💾 Backup JSON';
  btnBackup.style.marginRight = '1rem';
  btnExportar.before(btnBackup);

  const btnImportar = document.createElement('input');
  btnImportar.type = 'file';
  btnImportar.accept = '.json';
  btnImportar.style.marginBottom = '1rem';
  btnExportar.before(btnImportar);

  btnBackup.addEventListener('click', () => {
    const blob = new Blob([localStorage.getItem(STORAGE_KEY)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "backup_revisoes.json";
    a.click();
    mostrarToast(`📁 Backup exportado com sucesso, ${nomeUsuario}!`);
  });

  btnImportar.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const dados = JSON.parse(event.target.result);
        salvarRevisoes(dados);
        exibirRevisoes(dados, seletorFiltro.value);
        mostrarToast(`📥 Dados importados com sucesso, ${nomeUsuario}!`);
      } catch {
        alert("Arquivo inválido.");
      }
    };
    reader.readAsText(file);
  });

  // Inicialização final
  inicializarTema();
  pedirPermissao();
  const revisoesSalvas = carregarRevisoes();
  exibirRevisoes(revisoesSalvas, seletorFiltro.value);
  notificarHoje(revisoesSalvas);
});
