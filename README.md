# Plataforma de Investimentos

Sistema integrado de negociação de ativos financeiros, incluindo ações, FIIs e debêntures. A solução contempla:

- Gestão multi-perfil: **Cliente**, **Assessor** e **Gerente**
- Simulação de rendimentos
- Dashboard financeiro completo
- Relatórios de desempenho
- Módulos independentes: **Banco de Dados**, **Backend FastAPI** e **Frontend React**

## Sumário

1. Arquitetura Geral
2. Tecnologias Utilizadas
3. Requisitos
4. Estrutura do Repositório
5. Configuração do Banco de Dados
6. Configuração do Backend (FastAPI)
7. Configuração do Frontend (React)
8. Credenciais de Acesso
9. Endpoints Implementados
10. Licença

## Arquitetura Geral

A plataforma é organizada em três módulos independentes e integráveis:

PostgreSQL  ←→  FastAPI (Backend)  ←→  React + Vite (Frontend)

## Tecnologias Utilizadas

### Banco de Dados
- PostgreSQL 14+
- SQL (DDL, DML, Views, Functions, Procedures, Triggers)

### Backend
- Python 3.10+
- FastAPI
- Uvicorn
- Asyncpg / psycopg
- Pydantic

### Frontend
- Node.js 18+
- React 19
- Vite
- TailwindCSS
- Chart.js / react-chartjs-2

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

## Estrutura do Repositório

/
├── Banco_de_dados/
│   ├── criar_tabelas.sql
│   ├── popular_tabelas.sql
│   ├── views.sql
│   ├── procedures.sql
│   └── triggers.sql
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── ...
│
└── bd-frontend/
    ├── src/
    ├── package.json
    └── ...

## Configuração do Banco de Dados

### Criar o banco

createdb investdb

### Executar scripts

psql investdb -f criar_tabelas.sql
psql investdb -f popular_tabelas.sql
psql investdb -f views.sql
psql investdb -f procedures.sql
psql investdb -f triggers.sql

## Configuração do Backend (FastAPI)

### Setup

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

### Arquivo .env

DB_HOST=localhost  
DB_PORT=5432  
DB_NAME=investdb  
DB_USER=SEU_USUARIO_LOCAL  
DB_PASSWORD=

### Executar servidor

uvicorn main:app --reload

Docs: http://127.0.0.1:8000/docs

## Configuração do Frontend (React)

### Instalar dependências

npm install

### Configurar API base

src/api.js:

export const API_BASE = "http://127.0.0.1:8000";

### Rodar

npm run dev

## Credenciais de Acesso

| Perfil     | CPF           |
|------------|---------------|
| Cliente    | 11111111111   |
| Assessor   | 22222222222   |
| Gerente    | 44444444444   |

## Endpoints Implementados

- GET /contas/{id}/resumo  
- POST /ordens/compra  
- POST /simulacao  
- GET /assessor/{cpf}/clientes  
- GET /gerente/{cpf}/equipe  

## Licença

Projeto disponibilizado para uso educacional e demonstrativo.
