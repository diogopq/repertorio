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

## 3. Publicar no GitHub Pages

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
- **Adicionar música**: com a banda selecionada, clique em "+ Adicionar música" → busque pelo nome (usa a YouTube Data API) ou cole um link do YouTube/YouTube Music na aba "Colar link".
- Depois de adicionar, o app já abre a tela de edição para você preencher **tom**, **link da cifra** e **observações**.
- Clique no ▶ de qualquer música para tocar; o player fica fixo embaixo e passa pra próxima automaticamente ao terminar.
- Use ↑/↓ para reordenar a ordem do setlist.

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
