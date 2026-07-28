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
- Tema claro/escuro com paleta preto/azul-escuro/vermelho/branco

## Próximos passos sugeridos (fora do escopo desta versão)

- Tela de convite/gestão de usuários da equipe (professor/recepcionista) dentro do app — hoje os papéis já são respeitados pelas regras do Firestore, mas a criação desses usuários precisa ser feita manualmente (ex.: pelo Firebase Console) até que essa tela exista
- Notificações push nativas (hoje os avisos aparecem no dashboard, mas não há push)
- Área do aluno, pagamentos online, assinatura recorrente, ranking de atletas, estoque, gestão de filiais (mencionados como visão de futuro no briefing)

## Verificação

- `npx tsc --noEmit` — checagem de tipos
- Fluxo completo testado manualmente via Playwright + Firebase Emulators: cadastro de academia, login, alunos, professores, turmas, mensalidades (incluindo pagamento), presença (check-in manual), financeiro e relatórios
- Não foi possível validar em simulador iOS/Android real neste ambiente (sem macOS/emulador disponível); recomenda-se testar com `expo run:ios` / `expo run:android` antes de publicar nas lojas
