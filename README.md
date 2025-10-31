# Scraping Portinfo - Puppeteer

Web scraping automatizado do site Portinfo para extrair produtos, preços e links de páginas de categorias.

## Funcionalidades

- Extração automática de produtos com nome, preço e URL
- Suporte para navegação por paginação (botão "Próxima")
- Suporte para carregamento infinito (infinite scroll)
- Remoção automática de duplicatas
- Exportação dos dados em formato CSV
- Delays randomizados para respeitar o servidor

## Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn

## Instalação

1. Clone ou baixe este repositório

2. Instale as dependências:

```bash
npm install
```

As dependências instaladas serão:
- `puppeteer` - Automação de browser headless
- `csv-stringify` - Geração de arquivos CSV

## Configuração

Antes de executar o script, você pode personalizar as seguintes configurações no arquivo `scrap_portinfo.js`:

### 1. URL da Categoria

Na linha 74, altere a URL para a categoria desejada:

```javascript
let url = 'https://www.portinfo.com.br/categoria/informatica';
```

Exemplos de outras categorias:
- `https://www.portinfo.com.br/categoria/perifericos`
- `https://www.portinfo.com.br/categoria/hardware`

### 2. Modo Headless

Por padrão, o navegador abre visualmente (`headless: false`). Para executar em modo invisível, altere na linha 65:

```javascript
headless: true
```

### 3. Parâmetros de Scroll

Na linha 86, você pode ajustar os parâmetros do scroll infinito:

```javascript
await infiniteScroll(page, 600, 60);
// parâmetros: (página, delay_em_ms, max_tentativas)
```

## Execução

Para executar o scraper:

```bash
node scrap_portinfo.js
```

O script irá:
1. Abrir o navegador
2. Navegar pela categoria especificada
3. Extrair produtos de cada página
4. Avançar para próximas páginas automaticamente
5. Gerar um arquivo `produtos_portinfo.csv` no diretório atual

## Saída

O arquivo `produtos_portinfo.csv` será gerado com as seguintes colunas:

- `name` - Nome do produto
- `price` - Preço do produto
- `url` - Link para a página do produto

## Observações

- O script utiliza delays entre requisições para ser respeitoso com o servidor
- Seletores CSS podem precisar de ajuste caso o site mude sua estrutura
- Produtos duplicados são automaticamente removidos
- O tempo de execução varia conforme a quantidade de produtos na categoria

## Solução de Problemas

### Erro "Module not found"
Execute `npm install` para instalar as dependências.

### Produtos não sendo extraídos
Os seletores CSS podem ter mudado. Verifique a função `extractFromPage()` no código e ajuste conforme necessário.

### Timeout errors
Aumente o `setDefaultNavigationTimeout` na linha 71 para valores maiores (ex: 60000 para 60 segundos).