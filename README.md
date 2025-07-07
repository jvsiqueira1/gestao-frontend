# Gestão de Gastos Pessoais – Frontend

Este é o frontend do sistema de gestão de gastos pessoais, desenvolvido em [Next.js](https://nextjs.org) com TypeScript e integração total com Stripe para assinaturas.

## Funcionalidades
- Cadastro e login de usuários
- Dashboard financeiro
- Gestão de categorias, receitas e despesas
- Assinatura mensal via Stripe (reativação, cancelamento, bloqueio de acesso)
- Controle de acesso por status de assinatura
- Tema escuro/claro

## Pré-requisitos
- Node.js 18+
- NPM, Yarn, PNPM ou Bun
- Backend rodando (consulte o README do backend)
- Conta Stripe (modo teste)

## Instalação
```bash
cd frontend
npm install # ou yarn, pnpm, bun
```

## Variáveis de Ambiente
Crie um arquivo `.env.local` na pasta `frontend` com:
```
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Rodando o Projeto
```bash
npm run dev
# ou yarn dev, pnpm dev, bun dev
```
Acesse [http://localhost:3000](http://localhost:3000)

## Integração com Stripe
- O botão de assinatura cria uma sessão de checkout Stripe (modo assinatura)
- Após o pagamento, o backend atualiza o status do usuário via webhook
- Usuários com assinatura cancelada/paga pendente só acessam a página de perfil

## Fluxo de Autenticação e Assinatura
- O contexto de autenticação (`AuthContext`) gerencia login, logout e atualização do usuário
- O status da assinatura é checado em todas as páginas protegidas
- O frontend exibe alertas e bloqueia navegação conforme o status

## Principais Comandos
- `npm run dev` – inicia o servidor de desenvolvimento
- `npm run build` – build de produção
- `npm run start` – inicia o servidor em produção

## Dicas de Desenvolvimento
- Edite as páginas em `app/`
- Componentes reutilizáveis em `components/`
- Contextos em `context/`
- Integração com Stripe em `lib/api.ts`

## Testando o Stripe localmente
- Use o Stripe CLI: `stripe listen --forward-to localhost:4000/api/stripe/webhook`
- Use cartões de teste: [Stripe Docs](https://stripe.com/docs/testing)

---

> Dúvidas ou sugestões? Abra uma issue ou entre em contato!
