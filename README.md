# 🏥 ObstetriCheck - Sistema de Passagem de Plantão e Evolução Obstétrica

Aplicação web modular, ágil e moderna desenvolvida para a rotina médica e assistencial da **Enfermaria de Obstetrícia**, centralizando checklists clínicos, identificação de riscos, prescrição médica, passagem de plantão oficial e geração da **Evolução Médica Oficial**.

---

## 🚀 Funcionalidades Principais

- **Checklists Especializados**:
  - **Puérpera**: Pós-parto normal e cesárea, avaliação de apojadura, globo de segurança de Pinard, ferida operatória, lóquios e rastreio de TEV e Rh (Matergan).
  - **Gestante**: Avaliação por idade gestacional (<20s até 42s), base de cálculo (Alegada, DUM, USG), dinâmica uterina, BCF, perdas vaginais e edemas.
  - **Curetagem**: Pós-abortamento, forro vaginal, orientações e critérios de alta.
  - **Admissão de Leitos Vagos**: Transição rápida para admissão com preenchimento da data e hora de entrada.
- **Auto-Detecção Inteligente de Pressão Arterial (PA)**:
  - Aceita digitação flexível (`120x80`, `160/111`, `140 90`, `160111`, etc.).
  - Classificação visual e clínica instantânea com alertas para **Normotensa**, **PA Elevada** e **Crise Hipertensiva / Zuspan (PAS ≥ 160 ou PAD ≥ 110)**.
- **Evolução Médica Oficial Padronizada**:
  - Estrutura 100% canônica: `HDA`, `COMORBIDADES`, `MUC`, `ALERGIA`, `EVOLUÇÃO`, `EXAME FÍSICO`, `SSVV`, `EXAMES COMPLEMENTARES`, `HD` e `CONDUTA`.
  - Início da HDA fixo e inalterável com a paridade da paciente: `HDA: PACIENTE G03P03(n03 C 00)A00...`.
  - Botão de **Auto-Gerar HDA** e modelos clínicos rápidos de 1 clique.
  - Cópia para o prontuário em 1 clique e botão de impressão formatada.
- **História Obstétrica Padronizada**:
  - Formato oficial: `G__P__(n__ C __)A__` com botões interativos de contagem e atalhos rápidos.
- **Passagem de Plantão Oficial**:
  - Espelho fiel do documento de posto com leitos ativos, diagnósticos, AVP, RN, intercorrências e pendências.
  - Visualização em tabela (para impressão) e em cards rápidos.
- **Sincronização Multi-Dispositivo com Supabase**:
  - Comunicação instantânea em tempo real entre celulares, tablets e computadores do hospital.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Banco de Dados & Realtime**: [Supabase](https://supabase.com/) (PostgreSQL + Realtime subscriptions)

---

## 📦 Como Executar Localmente

### 1. Clonar o repositório e instalar dependências
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd "Enfermaria Obst"
npm install
```

### 2. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse a aplicação no navegador em: `http://localhost:5173`

### 3. Compilar para produção
```bash
npm run build
```

---

## ⚡ Configuração do Supabase (Multi-Dispositivos)

Para sincronizar as evoluções e leitos entre vários dispositivos simultaneamente:

1. Crie uma conta ou projeto gratuito no [Supabase](https://supabase.com).
2. Acesse o **SQL Editor** no painel do Supabase, copie o conteúdo do arquivo [`supabase_schema.sql`](./supabase_schema.sql) e clique em **Run**.
3. Crie um arquivo `.env` na raiz do projeto com suas credenciais:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
   ```
4. Pronto! O sistema detectará as credenciais e ativará a sincronização em tempo real. Sem as chaves, o sistema continuará funcionando perfeitamente em modo offline com `localStorage`.

### Atualização: salvamento por campo (projetos criados antes de 26/09/2026)

Se o seu projeto Supabase já existia, rode também o arquivo [`supabase_migration_002_patch_bed.sql`](./supabase_migration_002_patch_bed.sql) no **SQL Editor**. Ele cria a função `patch_bed`, que permite a várias pessoas editarem o mesmo leito ao mesmo tempo sem uma apagar o que a outra digitou. Sem ela, o app funciona em modo de compatibilidade (menos protegido).

**Como a sincronização funciona:**
- Cada aparelho envia só os campos alterados; o servidor mescla.
- Alterações feitas sem internet ficam numa fila no aparelho (mesmo se a página for fechada) e são enviadas quando a conexão voltar. O selo **Offline** / **N pend.** no cabeçalho indica isso.
- Ao reconectar, desbloquear o celular ou a cada 2 minutos, o app busca o estado atual de todos os leitos.

---

## 📄 Licença
Uso hospitalar e assistencial interno.
