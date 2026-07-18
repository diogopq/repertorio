# Setlist — Repertório das Bandas

App single-file (HTML) para gerenciar o repertório de várias bandas, com busca de músicas no YouTube, player embutido e sincronização em tempo real via Firebase (funciona no celular e no computador ao mesmo tempo).

---

## 1. Criar o projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) → **Criar projeto** (pode desativar o Google Analytics, não é necessário).
2. No menu lateral, vá em **Build → Firestore Database** → **Criar banco de dados** → escolha **modo produção** → selecione a região mais próxima (ex: `southamerica-east1`).
3. Ainda no menu, vá em **Build → Authentication** → aba **Sign-in method** → ative o provedor **Anônimo**. (Isso permite que o app sincronize os dados sem exigir login/senha.)
4. Vá em **Configurações do projeto** (ícone de engrenagem) → role até **Seus apps** → clique no ícone **`</>`** (Web) → dê um nome (ex: "setlist-app") → **Registrar app**.
5. O Firebase vai mostrar um objeto `firebaseConfig` parecido com este:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

6. Copie esse objeto inteiro e cole no lugar do `firebaseConfig` no início do `<script type="module">` dentro de `repertorio-bandas.html`.

### Regras de segurança do Firestore

No Firebase, vá em **Firestore Database → Regras** e substitua pelo seguinte (já exige que o usuário esteja autenticado, o que acontece automaticamente via login anônimo):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bands/{bandId} {
      allow read, write: if request.auth != null;
      match /songs/{songId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

Clique em **Publicar**.

---

## 2. Criar a chave da YouTube Data API v3

1. Acesse [console.cloud.google.com](https://console.cloud.google.com) e selecione o **mesmo projeto** criado pelo Firebase (ele aparece automaticamente na lista de projetos do Google Cloud).
2. Vá em **APIs e serviços → Biblioteca**, procure por **YouTube Data API v3** e clique em **Ativar**.
3. Vá em **APIs e serviços → Credenciais → Criar credenciais → Chave de API**.
4. Copie a chave gerada e cole no lugar de `YOUTUBE_API_KEY` no `repertorio-bandas.html`.
5. (Recomendado) Clique em **Restringir chave** → em **Restrições de API**, selecione apenas **YouTube Data API v3** → em **Restrições de aplicativo**, escolha **Referenciadores HTTP** e adicione a URL onde o app vai ficar hospedado (ex: `https://seuusuario.github.io/*`). Isso evita que outras pessoas usem sua chave se descobrirem ela no código.

A cota gratuita é de 10.000 unidades/dia; cada busca gasta 100 unidades — dá para várias dezenas de buscas por dia sem custo.

---

## 2.1 Criar o Client ID do Google (exportar/importar playlists reais)

Essa parte é opcional — o app funciona normalmente sem ela, só os botões **"Exportar p/ YouTube Music"** e **"Importar playlist"** (com playlist privada) exigem esse login.

1. No mesmo projeto do Google Cloud (o de cima), vá em **APIs e serviços → Tela de consentimento OAuth**.
   - Tipo de usuário: **Externo**.
   - Preencha nome do app, e-mail de suporte e e-mail do desenvolvedor (pode ser o seu mesmo).
   - Em **Escopos**, adicione `https://www.googleapis.com/auth/youtube`.
   - Em **Usuários de teste**, adicione o seu próprio e-mail do Google (enquanto o app não for verificado pelo Google, só esses e-mails conseguem logar).
2. Vá em **APIs e serviços → Credenciais → Criar credenciais → ID do cliente OAuth**.
   - Tipo de aplicativo: **Aplicativo da Web**.
   - Em **Origens JavaScript autorizadas**, adicione exatamente `https://diogopq.github.io` (sem `/repertorio` no final — só a origem).
   - Crie e copie o **Client ID** gerado (termina em `.apps.googleusercontent.com`).
3. Cole esse valor em `GOOGLE_CLIENT_ID` no `index.html`.

**Sobre o aviso "app não verificado":** como o app não passou pela verificação do Google (processo pensado pra apps públicos, não faz sentido pra um app pessoal), ao clicar em "Conectar com Google" vai aparecer uma tela de aviso. Clique em **Avançado → Acessar [nome do app] (não seguro)** — é seguro porque o app é seu, só o Google ainda não "carimbou". Isso só aparece pra você mesmo (e outros e-mails que você cadastrar como testador).

**Sobre a sessão:** a conexão dura cerca de 1 hora; depois disso, se for exportar/importar de novo, é só clicar em "Conectar com Google" outra vez. Isso é intencional — não guardamos token de longa duração no navegador.

---

O app agora é um **PWA instalável** (não só um atalho), então precisa ir para o repositório com esta estrutura de arquivos — **mantenha os nomes e a pasta `icons/` exatamente assim**, pois `manifest.json` e `service-worker.js` referenciam esses caminhos:

```
seu-repositorio/
├── index.html            ← renomeie repertorio-bandas.html para este nome
├── manifest.json
├── service-worker.js
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    ├── icon-512-maskable.png
    └── apple-touch-icon.png
```

1. Crie um repositório novo no GitHub (pode ser privado ou público).
2. Suba todos os arquivos acima, renomeando `repertorio-bandas.html` para `index.html`.
3. Vá em **Settings → Pages** do repositório → em **Source**, selecione a branch `main` e a pasta `/ (root)` → **Save**.
4. Em alguns minutos o app estará disponível em `https://seuusuario.github.io/nome-do-repositorio/`.

> Se preferir manter privado, o GitHub Pages de repositórios privados exige conta GitHub Pro/Team/Enterprise. Alternativa gratuita: hospedar no **Firebase Hosting** do mesmo projeto (`firebase init hosting` + `firebase deploy`), que também é gratuito no plano Spark.

> PWA exige HTTPS — GitHub Pages e Firebase Hosting já servem em HTTPS por padrão, então não precisa configurar nada extra.

---

## 3.1 Instalar no Android (app de verdade, não atalho)

Depois de publicado com a estrutura acima:

1. Abra o link do app no **Chrome do Android**.
2. Espere a página carregar por completo (o service worker precisa registrar).
3. Vai aparecer um botão **"⬇ Instalar app"** na barra lateral do próprio app — toque nele. Se não aparecer automaticamente, use o menu **⋮ do Chrome → Instalar aplicativo** (ou "Adicionar à tela inicial", que no Chrome atual já instala como app quando o `manifest.json` é válido, em vez de criar apenas um atalho de navegador).
4. O app passa a abrir em janela própria, sem a barra de endereço do Chrome, com o ícone que você viu no app (fundo escuro, barras âmbar) na gaveta de aplicativos.

Isso funciona porque o app agora tem três coisas que o Android exige para considerar "instalável":
- `manifest.json` com ícones de 192px e 512px e `display: standalone`;
- um `service-worker.js` registrado;
- servido via HTTPS.

Sem essas três coisas, o Android só oferece "criar atalho" (um bookmark com ícone, que ainda abre dentro do navegador).

---

## 4. Usando o app

- **Nova banda**: botão "+ Nova banda" na lateral.
- **Adicionar música**: com a banda selecionada, clique em "+ Adicionar música" → busque pelo nome (usa a YouTube Data API), cole um link na aba "Colar link", ou importe uma playlist inteira na aba "Importar playlist".
- Depois de adicionar (busca ou link), o app já abre a tela de edição para você preencher **tom**, **link da cifra** e **observações**.
- Clique no ▶ de qualquer música para tocar; o player fica fixo embaixo e passa pra próxima automaticamente ao terminar. O botão **↗** abre a música no app do YouTube (necessário pra tocar com a tela do celular apagada).
- Use ↑/↓ para reordenar a ordem do setlist.

### Importar uma playlist do YouTube/YouTube Music

Na aba "Importar playlist" do modal de adicionar música, cole o link da playlist (ex: `https://music.youtube.com/playlist?list=PL...`). Playlists **públicas** funcionam só com a `YOUTUBE_API_KEY`; playlists **privadas** exigem estar conectado com o Google (botão "Conectar com Google" na lateral). O app lista as músicas encontradas com checkbox — desmarque as que não quer e clique em "Adicionar selecionadas ao repertório".

### Exportar o repertório de uma banda como playlist

Com uma banda selecionada, clique em "Exportar p/ YouTube Music" (exige estar conectado com o Google). O app cria uma playlist nova e privada na sua conta, com todas as músicas do repertório na ordem do setlist. Como toda playlist do YouTube é compartilhada entre YouTube e YouTube Music, ela aparece automaticamente nos dois.

## Estrutura de dados no Firestore

```
bands/{bandId}
  name: string
  order: number
  bands/{bandId}/songs/{songId}
    title: string
    artist: string
    videoId: string
    thumb: string
    tom: string
    cifra: string
    obs: string
    order: number
```

## Problemas comuns

- **"configure o firebaseConfig no código"**: o objeto `firebaseConfig` ainda tem os valores de exemplo (`COLE_SUA_API_KEY_AQUI`).
- **Busca não retorna nada / erro na busca**: confira se a `YOUTUBE_API_KEY` foi ativada para a "YouTube Data API v3" e se não estourou a cota diária.
- **"erro ao ler dados"**: normalmente é regra do Firestore. Confira se publicou as regras do passo 1 e se a autenticação anônima está ativada.
- **"requests from referer ... are blocked"**: a restrição de referenciador da `YOUTUBE_API_KEY` está errada — use `https://diogopq.github.io/*` (sem o `/repertorio` no meio, veja o passo 2).
- **Botão "Conectar com Google" não faz nada**: `GOOGLE_CLIENT_ID` ainda não foi preenchido — veja o passo 2.1.
- **Tela "Erro de autorização" ou "app bloqueado" ao conectar com Google**: confirme que adicionou seu e-mail em "Usuários de teste" na tela de consentimento OAuth (passo 2.1), e que a origem JavaScript autorizada está exatamente `https://diogopq.github.io` (sem barra `/repertorio` e sem barra final).
- **Exportar playlist falha com erro 401/403**: a conexão com o Google expirou (dura ~1h) — clique em "Conectar com Google" de novo. Se for 403 com mensagem de quota, você estourou o limite diário da API.
