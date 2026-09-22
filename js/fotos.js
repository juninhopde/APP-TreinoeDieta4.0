/* ══════════════════════════════════════════════════════════
   IndexedDB — apenas para imagens.

   Por que só imagens: o estado em texto (diário, treinos,
   pesos) cabe folgado em localStorage e é muito mais simples
   de auditar e exportar. Imagens estouram o limite de ~5 MB
   em poucos registros, então vão para cá.
   ══════════════════════════════════════════════════════════ */

const FotoDB = (function () {
  const NOME = 'controle-fotos';
  const LOJA = 'fotos';
  let db = null;

  function abrir() {
    if (db) return Promise.resolve(db);
    return new Promise((ok, erro) => {
      if (!window.indexedDB) return erro(new Error('IndexedDB indisponível'));
      const req = indexedDB.open(NOME, 1);
      req.onupgradeneeded = ev => {
        const d = ev.target.result;
        if (!d.objectStoreNames.contains(LOJA)) {
          const loja = d.createObjectStore(LOJA, { keyPath: 'id' });
          loja.createIndex('data', 'data');
          loja.createIndex('tipo', 'tipo');
        }
      };
      req.onsuccess = () => { db = req.result; ok(db); };
      req.onerror = () => erro(req.error);
    });
  }

  function tx(modo) {
    return abrir().then(d => d.transaction(LOJA, modo).objectStore(LOJA));
  }

  return {
    /* registro: { id, data:'YYWW-MM-DD', tipo:'frente'|'lado'|'costas'|'refeicao', blob, peso } */
    salvar(reg) {
      return tx('readwrite').then(loja => new Promise((ok, erro) => {
        const r = loja.put(reg);
        r.onsuccess = () => ok(reg.id);
        r.onerror = () => erro(r.error);
      }));
    },

    obter(id) {
      return tx('readonly').then(loja => new Promise((ok, erro) => {
        const r = loja.get(id);
        r.onsuccess = () => ok(r.result || null);
        r.onerror = () => erro(r.error);
      }));
    },

    listar(tipo) {
      return tx('readonly').then(loja => new Promise((ok, erro) => {
        const r = loja.getAll();
        r.onsuccess = () => {
          let v = r.result || [];
          if (tipo) v = v.filter(x => x.tipo === tipo);
          v.sort((a, b) => a.data < b.data ? -1 : 1);
          ok(v);
        };
        r.onerror = () => erro(r.error);
      }));
    },

    apagar(id) {
      return tx('readwrite').then(loja => new Promise((ok, erro) => {
        const r = loja.delete(id);
        r.onsuccess = () => ok(true);
        r.onerror = () => erro(r.error);
      }));
    },

    tamanho() {
      if (navigator.storage && navigator.storage.estimate) {
        return navigator.storage.estimate().then(e => ({ uso: e.usage || 0, cota: e.quota || 0 }));
      }
      return Promise.resolve(null);
    }
  };
})();

/* ══════════════════════════════════════════════════════════
   Compressão de imagem antes de guardar ou enviar.
   Reduz o lado maior para `lado` px e recodifica em JPEG.
   ══════════════════════════════════════════════════════════ */

function comprimirImagem(arquivo, lado, qualidade) {
  lado = lado || 1024;
  qualidade = qualidade || 0.82;
  return new Promise((ok, erro) => {
    const img = new Image();
    const url = URL.createObjectURL(arquivo);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width: w, height: h } = img;
      const escala = Math.min(1, lado / Math.max(w, h));
      w = Math.round(w * escala); h = Math.round(h * escala);
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      cv.toBlob(b => b ? ok(b) : erro(new Error('falha ao comprimir')), 'image/jpeg', qualidade);
    };
    img.onerror = () => { URL.revokeObjectURL(url); erro(new Error('imagem inválida')); };
    img.src = url;
  });
}
