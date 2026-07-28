# FightManager

Aplicativo de gestão para academias de Jiu-Jitsu e Boxe, feito em [Expo](https://expo.dev) + TypeScript, rodando em Android, iPhone e Web a partir de um único código-fonte, com Firebase (Auth + Firestore + Storage) como backend.

## Stack

- **Expo Router** (navegação por arquivos, tabs + stacks)
- **TypeScript** em modo estrito
- **Firebase**: Authentication (e-mail/senha), Firestore (multi-tenant por academia), Storage (fotos)
- **react-native-chart-kit** para os gráficos de faturamento/lucro
- **expo-camera** + **react-native-qrcode-svg** para check-in por QR Code
- **expo-print** / **expo-file-system** / **expo-sharing** para exportação de relatórios em PDF/CSV (Excel)

## Estrutura

```
app/                     rotas (Expo Router)
  (auth)/                login, cadastro de academia, recuperação de senha
  (app)/
    (tabs)/               dashboard, alunos, mensalidades, presença, mais
      alunos/             lista, detalhe, formulário
      mensalidades/        lista, novo lançamento
      presenca/            check-in manual/QR, carteirinha do aluno
    agenda/                turmas e horários
    professores/           cadastro de professores
    financeiro/            receitas/despesas
    cobranca/              cobrança automática via WhatsApp
    relatorios/            exportação de relatórios
    configuracoes/         dados da academia, avisos, aparência
src/
  components/            kit de UI (Button, Card, Input, SelectField, etc.)
  contexts/               AuthContext, AcademiaContext
  services/               camada de acesso ao Firebase (por entidade)
  theme/                  cores, tipografia, espaçamento (dark/light)
  types/                  tipos das entidades (Student, Payment, ClassSession, etc.)
  utils/                  formatação, cobrança WhatsApp, exportação de relatórios
firestore.rules           regras de segurança (isolamento por academia + papéis)
storage.rules              regras de segurança do Storage
```

## Modelo de dados (Firestore)

Cada academia é isolada por `academiaId`:

```
users/{uid}                          -> academiaId, role (admin | professor | recepcionista)
academias/{academiaId}
  students/{id}
  teachers/{id}
  payments/{id}
  attendance/{id}
  classes/{id}
  finance/{id}
  notices/{id}
```

As regras em `firestore.rules` garantem que um usuário só acessa dados da própria academia, com permissões de escrita diferenciadas por papel (ex.: apenas `admin` edita professores, turmas, financeiro e avisos; `admin`/`professor`/`recepcionista` podem lançar mensalidades e presença).

## Configuração do Firebase

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com).
2. Ative **Authentication** (método E-mail/senha), **Firestore Database** e **Storage**.
3. Copie `.env.example` para `.env` e preencha com as credenciais do seu app Web (Configurações do projeto → Seus apps):

   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
   EXPO_PUBLIC_FIREBASE_APP_ID=
   ```

4. Publique as regras de segurança (requer [Firebase CLI](https://firebase.google.com/docs/cli)):

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules,storage:rules --project SEU_PROJECT_ID
   ```

### Desenvolvendo com os Emulators (opcional, recomendado)

Para testar sem afetar dados reais, use os Firebase Emulators. No `.env`, além das credenciais (podem ser fictícias em modo "demo"), defina:

```
EXPO_PUBLIC_USE_FIREBASE_EMULATOR=true
EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=localhost
```

E rode em um terminal separado:

```bash
firebase emulators:start --only auth,firestore,storage
```

A UI dos emulators fica em `http://localhost:4000`.

## Rodando o app

```bash
npm install
npm run web       # navegador
npm run android   # emulador/dispositivo Android (necessita Expo Go ou build de desenvolvimento)
npm run ios       # simulador/dispositivo iOS (necessita macOS)
```

## O que já está implementado

- Login/cadastro de academia/recuperação de senha, com isolamento multi-tenant
- Dashboard com estatísticas, gráfico de faturamento mensal e avisos
- Cadastro completo de alunos (foto, faixa, graduação, mensalidade, status etc.)
- Cadastro de professores
- Controle de mensalidades: pagamento, pagamento antecipado, forma de pagamento, recibo (compartilhável), histórico
- Cobrança automática por WhatsApp (individual e em lote) para mensalidades vencendo/vencidas
- Controle de presença: check-in manual e por QR Code (carteirinha do aluno), frequência semanal/mensal e alunos com baixa frequência
- Agenda de turmas (dias da semana, horário, professor, limite de alunos) com visão por dia
- Financeiro: receitas/despesas por categoria, lucro mensal/anual, fluxo de caixa, gráfico
- Relatórios com exportação em Excel (CSV) e PDF (financeiro)
- Configurações da academia (dados, redes sociais, Pix/dados bancários, horário) e avisos
- Gestão de equipe: o administrador cadastra convites (e-mail + papel) em Configurações → Equipe e compartilha o "código da academia"; o convidado se cadastra escolhendo "Tenho um convite" na tela de cadastro, e recebe automaticamente o papel (professor/recepcionista) definido no convite
- Tema claro/escuro com paleta preto/azul-escuro/vermelho/branco

### Segurança de papéis (Firestore Rules)

As regras (`firestore.rules`) impedem que um usuário se autodeclare `admin`/`professor`/`recepcionista` de uma academia arbitrária ao criar seu próprio perfil: a criação de `users/{uid}` só é aceita se (a) o usuário for o dono (`ownerUid`) da academia que está fundando como `admin`, ou (b) existir um convite válido, com o mesmo e-mail autenticado e o mesmo papel, na subcoleção `academias/{academiaId}/invites`. Isso foi validado com testes automatizados (`@firebase/rules-unit-testing`) cobrindo tentativas de escalonamento de privilégio direto via Firestore, sem passar pela UI do app.

## Próximos passos sugeridos (fora do escopo desta versão)

- Notificações push nativas (hoje os avisos aparecem no dashboard, mas não há push)
- Área do aluno, pagamentos online, assinatura recorrente, ranking de atletas, estoque, gestão de filiais (mencionados como visão de futuro no briefing)

## Verificação

- `npx tsc --noEmit` — checagem de tipos
- Fluxo completo testado manualmente via Playwright + Firebase Emulators: cadastro de academia, login, alunos, professores, turmas, mensalidades (incluindo pagamento), presença (check-in manual), financeiro, relatórios e convite/ingresso de um segundo usuário (professor) numa academia existente
- Regras de segurança do Firestore testadas com `@firebase/rules-unit-testing` (tentativas de auto-atribuição de papel/academia, redenção de convite de terceiros, escalonamento de papel via convite)
- Não foi possível validar em simulador iOS/Android real neste ambiente (sem macOS/emulador disponível); recomenda-se testar com `expo run:ios` / `expo run:android` antes de publicar nas lojas
