// salvar como scrap_portinfo.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { stringify } = require('csv-stringify/sync'); // npm i csv-stringify

async function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

async function extractFromPage(page) {
  // ajuste os seletores abaixo conforme o HTML real do site
  return await page.$$eval('li.products-lists__list-item', items => {
    return items.map(el => {
      // tente vários caminhos para nome/price porque cada site tem sua estrutura
      const name = el.querySelector('div > div:nth-child(2) > div:nth-child(1) > h3 > a')?.getAttribute('title')?.trim() || '';
      const price = el.querySelector('div > div:nth-child(2) > div:nth-child(2) > span')?.outerText?.trim() || '';
      const linkEl = el.querySelector('div > div:nth-child(2) > div:nth-child(1) > h3 > a').href || '';
      return { name, price, url: linkEl };
    });
  });
}

async function clickNextIfExists(page) {
  // tenta encontrar link/btn de "Próxima" ou "next"
  const nextSelectors = [
    'a[rel="next"]',
    'a.next',
    'button.next',
    'a.pagination-next',
    'li.pagination__next a',
    'a[aria-label="Próxima"]'
  ];
  for (const sel of nextSelectors) {
    const el = await page.$(sel);
    if (el) {
      try {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
          el.click()
        ]);
        return true;
      } catch (e) {
        // se click+nav falhar, tente click sem esperar nav
        try { await el.click(); await page.waitForTimeout(1500); } catch(_) {}
        return true;
      }
    }
  }
  return false;
}

async function infiniteScroll(page, scrollDelay = 500, maxScrolls = 50) {
  // para sites com lazyload/infinite scroll — rola até carregar tudo
  let previousHeight;
  for (let i=0;i<maxScrolls;i++){
    previousHeight = await page.evaluate('document.body.scrollHeight');
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await sleep(scrollDelay);
    const newHeight = await page.evaluate('document.body.scrollHeight');
    if (newHeight === previousHeight) break;
  }
}

(async () => {
const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
});
  const page = await browser.newPage();

  // Configurações de respeito ao site
  await page.setDefaultNavigationTimeout(30000);

  // URL inicial — ajuste para a categoria/pesquisa que lista todos os produtos
  let url = 'https://www.portinfo.com.br/categoria/informatica';
  await page.goto(url, { waitUntil: 'networkidle2' });

  const results = [];
  let pageIndex = 0;
  let keepGoing = true;

  while (keepGoing) {
    pageIndex++;
    console.log(`Coletando página ${pageIndex} — ${page.url()}`);

    // Se o site usar infinite scroll:
    await infiniteScroll(page, 600, 60);

    // Extraia produtos da página
    const found = await extractFromPage(page);
    console.log(` → encontrados ${found.length} items nesta página`);
    for (const item of found) {
      // limpeza básica: descartar vazios
      if (item.name || item.price) {
        results.push(item);
        console.log(` → item: ${item.name} - ${item.price} - ${item.url}`);
      }
    }

    // delay responsável entre páginas
    await sleep(800 + Math.random()*700);

    // tenta clicar "Próxima" — se não houver, para o loop
    const hasNext = await clickNextIfExists(page);
    if (!hasNext) {
      // alternativa: verificar se aparece o botão "Carregar mais"
      const loadMoreSel = 'button.load-more, button.carregar-mais, a.load-more';
      const loadMore = await page.$(loadMoreSel);
      if (loadMore) {
        try {
          await loadMore.click();
          await page.waitForTimeout(1500);
          continue;
        } catch(_) { 
            console.log('Erro ao clicar em "Carregar mais"');
            keepGoing = false; 
        }
      } else keepGoing = false;
    }
  }

  // remover duplicatas por URL ou nome
  const unique = [];
  const seen = new Set();
  for (const r of results) {
    const key = (r.url || r.name).trim();
    if (!key) continue;
    if (!seen.has(key)) { seen.add(key); unique.push(r); }
  }

  // gerar CSV
  const header = ['name','price','url'];
  const records = unique.map(r => [r.name, r.price, r.url]);
  const csv = stringify([header, ...records], { quoted: true });
  const outPath = path.resolve(process.cwd(), 'produtos_portinfo.csv');
  fs.writeFileSync(outPath, csv);
  console.log(`Salvo ${unique.length} produtos em ${outPath}`);

  await browser.close();
})();
