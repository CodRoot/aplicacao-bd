# Plataforma de Investimentos
Sistema completo de negociação de ativos (ações, FIIs, debêntures), com saldo, carteira atualizada, ordens de compra/venda, relatórios, rendimento diário automático e dashboard moderno.

Este repositório contém **3 partes**:

1. **Banco de Dados PostgreSQL** (DDL + Inserts + Views + Procedures + Triggers)
2. **Backend Python (FastAPI + async PostgreSQL)**
3. **Frontend React (Vite + Tailwind + Charts)**

## Requisitos
### Banco de Dados
- PostgreSQL 14 ou superior
- psql configurado no PATH

### Backend
- Python 3.10+
- pip
- virtualenv (recomendado)

### Frontend
- Node.js 18+
- npm

## Banco de Dados (PostgreSQL)
### Criar o banco
```bash
createdb investdb
```

### Executar scripts
```bash
psql investdb -f 001_criacao_tabelas.sql
psql investdb -f 002_populacao_banco.sql
psql investdb -f 003_views.sql
psql investdb -f 005_procedures.sql
psql investdb -f 006_triggers.sql
```

## Backend (FastAPI)
### Setup
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Arquivo .env
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=investdb
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_AQUI
```

### Rodar servidor
```bash
uvicorn main:app --reload
```

Docs:
```
http://127.0.0.1:8000/docs
```

## Frontend (React)
### Instalar dependências
```bash
npm install
```

### Configurar backend em `src/api.js`
```javascript
export const API_BASE = "http://127.0.0.1:8000";
```

### Rodar
```bash
npm run dev
```

## Estrutura recomendada
```
/
├── bd/
├── backend/
└── bd-frontend/
```

## Testes recomendados
- GET /contas/{id}/resumo
- GET /contas/{id}/carteira
- POST /contas/{id}/deposito
- POST /ordens/compra
- GET /relatorio/{cpf}

