from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
from models import DepositoRequest, RetiradaRequest, OrdemRequest
from db import fetch_all, fetch_one, call_procedure
from pydantic import BaseModel

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





class SimulacaoRequest(BaseModel):
    ticker: str
    valor_inicial: float
    meses: int


@app.post("/simulacao")
def simular_rendimento(dados: SimulacaoRequest):
    # 1. Buscar a rentabilidade diária do ativo no banco
    ativo = fetch_one("SELECT Rent_diaria_fixa FROM Ativo WHERE Ticker = %s", (dados.ticker,))

    if not ativo:
        raise HTTPException(status_code=404, detail="Ativo não encontrado")

    taxa_diaria = ativo["rent_diaria_fixa"]

    if taxa_diaria is None:
        raise HTTPException(status_code=400, detail="Este ativo não tem rentabilidade fixa definida para simulação.")

    # 2. Cálculo de Juros Compostos
    # Considerando média de 21 dias úteis por mês
    dias_totais = dados.meses * 21
    valor_final = dados.valor_inicial * ((1 + float(taxa_diaria)) ** dias_totais)

    return {
        "ticker": dados.ticker,
        "valor_inicial": dados.valor_inicial,
        "meses": dados.meses,
        "valor_final_estimado": round(valor_final, 2),
        "rentabilidade_total_percentual": round(((valor_final - dados.valor_inicial) / dados.valor_inicial) * 100, 2)
    }

# =========================
#   ÁREA DO ASSESSOR
# =========================

@app.get("/assessor/{cpf_assessor}/clientes")
def listar_carteira_clientes(cpf_assessor: str):
    """
    Retorna a lista de clientes atendidos por um assessor,
    incluindo saldo e patrimônio total de cada um.
    (Baseado na Consulta 10 do SQL)
    """
    query = """
        SELECT
            cli.CPF                                     AS cpf_cliente,
            pcli.Primeiro_Nome || ' ' || pcli.Sobrenome AS nome_cliente,
            c.ID_conta,
            c.Saldo_disponivel,
            COALESCE(SUM(pc.Quantidade * a.Preco_atual),0) AS valor_investido,
            c.Saldo_disponivel + COALESCE(SUM(pc.Quantidade * a.Preco_atual),0) AS patrimonio_total
        FROM Assessor ass
        JOIN Cliente  cli  ON cli.CPF_Assessor = ass.CPF
        JOIN Pessoa   pcli ON pcli.CPF       = cli.CPF
        JOIN Conta    c    ON c.CPF_cliente  = cli.CPF
        LEFT JOIN Posicao_Carteira pc ON pc.ID_conta = c.ID_conta
        LEFT JOIN Ativo a            ON a.Ticker    = pc.Ticker
        WHERE ass.CPF = %s
        GROUP BY cli.CPF, pcli.Primeiro_Nome, pcli.Sobrenome, c.ID_conta, c.Saldo_disponivel
        ORDER BY nome_cliente;
    """
    return fetch_all(query, (cpf_assessor,))


# =========================
#   ÁREA DO GERENTE
# =========================

@app.get("/gerente/{cpf_gerente}/equipe")
def listar_equipe_gerente(cpf_gerente: str):
    """
    Retorna a hierarquia: Gerente -> Assessores -> Clientes.
    (Baseado na Consulta 11 do SQL)
    """
    query = """
        SELECT
            ass.CPF                                   AS cpf_assessor,
            pa.Primeiro_Nome || ' ' || pa.Sobrenome   AS nome_assessor,
            cli.CPF                                   AS cpf_cliente,
            pc.Primeiro_Nome || ' ' || pc.Sobrenome   AS nome_cliente
        FROM Gerente g
        JOIN Assessor ass ON ass.CPF_Gerente = g.CPF
        JOIN Pessoa   pa  ON pa.CPF         = ass.CPF
        JOIN Cliente  cli ON cli.CPF_Assessor = ass.CPF
        JOIN Pessoa   pc  ON pc.CPF         = cli.CPF
        WHERE g.CPF = %s
        ORDER BY nome_assessor, nome_cliente;
    """
    return fetch_all(query, (cpf_gerente,))