from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from models import DepositoRequest, RetiradaRequest, OrdemRequest
from db import fetch_all, fetch_one, call_procedure

app = FastAPI(title="Plataforma de Investimentos - API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
#   ROTAS DE CONTA / SALDO
# =========================

@app.get("/contas/{id_conta}/resumo")
def get_conta_resumo(id_conta: int):
    row = fetch_one(
        "SELECT * FROM vw_conta_resumo WHERE id_conta = %s",
        (id_conta,)
    )
    if not row:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    return row


@app.get("/contas/{id_conta}/carteira")
def get_carteira(id_conta: int):
    rows = fetch_all(
        "SELECT * FROM vw_carteira_detalhada WHERE id_conta = %s ORDER BY nome_ativo",
        (id_conta,)
    )
    return rows


# =========================
#   DEPÓSITO E RETIRADA
# =========================

@app.post("/contas/{id_conta}/deposito")
def deposito(id_conta: int, body: DepositoRequest):
    try:
        call_procedure("sp_deposito", (id_conta, body.valor))
        return {"message": "Depósito realizado com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/contas/{id_conta}/retirada")
def retirada(id_conta: int, body: RetiradaRequest):
    try:
        call_procedure("sp_retirada", (id_conta, body.valor))
        return {"message": "Retirada realizada com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
# =========================
#   COMPRA E VENDA HISTÓRICO
# =========================

@app.get("/contas/{id_conta}/historico")
def historico_conta(id_conta: int, limite: int = 10):
    """
    Histórico de operações (compras e vendas) de uma conta específica,
    usando diretamente a VIEW vw_ordens_valor.
    """
    query = """
        SELECT
            data_hora,
            tipo_op,
            ticker,
            nome_ativo,
            quantidade,
            preco_exec,
            fluxo_caixa
        FROM vw_ordens_valor
        WHERE id_conta = %s
        ORDER BY data_hora DESC
        LIMIT %s;
    """
    return fetch_all(query, (id_conta, limite))



# =========================
#   COMPRA E VENDA DE ATIVOS
# =========================

@app.post("/ordens/compra")
def comprar(ordem: OrdemRequest):
    try:
        call_procedure("sp_compra", (ordem.id_conta, ordem.ticker, ordem.quantidade))
        return {"message": "Compra executada com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/ordens/venda")
def vender(ordem: OrdemRequest):
    try:
        call_procedure("sp_venda", (ordem.id_conta, ordem.ticker, ordem.quantidade))
        return {"message": "Venda executada com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/ativos")
def listar_ativos():
    query = """
        SELECT a.Ticker, a.Nome, a.Preco_atual, a.Setor, 
               'ACAO' AS tipo
        FROM Acao c
        JOIN Ativo a ON a.Ticker = c.Ticker

        UNION ALL

        SELECT a.Ticker, a.Nome, a.Preco_atual, f.Seg_FII AS Setor,
               'FII' AS tipo
        FROM Fundo_Imobiliario f
        JOIN Ativo a ON a.Ticker = f.Ticker

        UNION ALL

        SELECT a.Ticker, a.Nome, a.Preco_atual, 'Debênture' AS Setor,
               'DEBENTURE' AS tipo
        FROM Debenture d
        JOIN Ativo a ON a.Ticker = d.Ticker

        ORDER BY tipo, Ticker;
    """
    return fetch_all(query)


@app.get("/ativos/filtro")
def filtrar_ativos(tipo: str = None, setor: str = None):
    base = """
        SELECT *
        FROM (
            SELECT a.Ticker, a.Nome, a.Preco_atual, a.Setor, 'ACAO' AS tipo
            FROM Acao c
            JOIN Ativo a ON a.Ticker = c.Ticker

            UNION ALL
            
            SELECT a.Ticker, a.Nome, a.Preco_atual, f.Seg_FII AS Setor, 'FII' AS tipo
            FROM Fundo_Imobiliario f
            JOIN Ativo a ON a.Ticker = f.Ticker

            UNION ALL
            
            SELECT a.Ticker, a.Nome, a.Preco_atual, 'Debênture' AS Setor, 'DEBENTURE' AS tipo
            FROM Debenture d
            JOIN Ativo a ON a.Ticker = d.Ticker
        ) AS ativos
        WHERE 1 = 1
    """

    params = []

    if tipo:
        base += " AND tipo = %s"
        params.append(tipo.upper())

    if setor:
        base += " AND setor ILIKE %s"
        params.append(f"%{setor}%")

    base += " ORDER BY tipo, Ticker"

    return fetch_all(base, params)


@app.get("/ativos/fii/setores")
def listar_setores_fii():
    query = "SELECT DISTINCT Seg_FII AS setor FROM Fundo_Imobiliario ORDER BY setor"
    return fetch_all(query)


@app.get("/ativos/acao/setores")
def listar_setores_acao():
    query = """
        SELECT DISTINCT Setor AS setor
        FROM Ativo
        JOIN Acao ON Acao.Ticker = Ativo.Ticker
        WHERE Setor IS NOT NULL
        ORDER BY setor;
    """
    return fetch_all(query)



# =========================
#   RELATÓRIO DE DESEMPENHO
# =========================

@app.get("/relatorio/{cpf_cliente}")
def relatorio_desempenho(cpf_cliente: str, inicio: str, fim: str):
    """
    Relatório de desempenho por CPF, usando vw_ordens_valor como base.
    Retorna:
      - lucro/prejuízo total no período
      - lucro/prejuízo por ativo
      - histórico detalhado de operações (com data_hora)
    """
    # 1) Resultado total no período
    total_query = """
        SELECT
            COALESCE(SUM(fluxo_caixa), 0) AS lucro_prejuizo_total
        FROM vw_ordens_valor
        WHERE cpf_cliente = %s
          AND data_hora >= %s
          AND data_hora <  %s;
    """

    total_rows = fetch_all(total_query, (cpf_cliente, inicio, fim))
    lucro_total = total_rows[0]["lucro_prejuizo_total"] if total_rows else 0

    # 2) Lucro/prejuízo por ativo
    por_ativo_query = """
        SELECT
            ticker,
            nome_ativo,
            SUM(fluxo_caixa) AS lucro_prejuizo
        FROM vw_ordens_valor
        WHERE cpf_cliente = %s
          AND data_hora >= %s
          AND data_hora <  %s
        GROUP BY ticker, nome_ativo
        ORDER BY lucro_prejuizo DESC;
    """

    detalhado = fetch_all(por_ativo_query, (cpf_cliente, inicio, fim))

    # 3) Histórico detalhado (cada operação, com data_hora)
    historico_query = """
        SELECT
            data_hora,
            tipo_op,
            ticker,
            nome_ativo,
            quantidade,
            preco_exec,
            fluxo_caixa
        FROM vw_ordens_valor
        WHERE cpf_cliente = %s
          AND data_hora >= %s
          AND data_hora <  %s
        ORDER BY data_hora;
    """

    historico = fetch_all(historico_query, (cpf_cliente, inicio, fim))

    return {
        "total": float(lucro_total or 0),
        "detalhado_por_ativo": [
            {
                "ticker": row["ticker"],
                "nome_ativo": row["nome_ativo"],
                "lucro_prejuizo": float(row["lucro_prejuizo"] or 0),
            }
            for row in detalhado
        ],
        "historico_operacoes": [
            {
                "data_hora": row["data_hora"],
                "tipo_op": row["tipo_op"],
                "ticker": row["ticker"],
                "nome_ativo": row["nome_ativo"],
                "quantidade": row["quantidade"],
                "preco_exec": float(row["preco_exec"] or 0),
                "fluxo_caixa": float(row["fluxo_caixa"] or 0),
            }
            for row in historico
        ],
    }
