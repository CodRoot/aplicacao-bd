
/* ============================================================
   VIEWS UTILIZADAS PELA APLICAÇÃO
   ------------------------------------------------------------
   As VIEWs abaixo simplificam o consumo dos dados pelo backend
   e pelo frontend, mantendo a lógica de joins e cálculos no
   próprio banco de dados.
   ============================================================ */


-- ============================================================
-- VIEW 1: vw_carteira_detalhada
-- Carteira detalhada por conta (com valorização)
-- ------------------------------------------------------------
-- Justificativa:
-- Usada na tela de "Consultar carteira atualizada". Encapsula
-- o join entre Conta, Cliente, Pessoa, Posicao_Carteira e Ativo,
-- incluindo cálculo de valorização absoluta e percentual.
-- ============================================================

CREATE OR REPLACE VIEW vw_carteira_detalhada AS
SELECT
    c.ID_conta,
    cli.CPF                            AS cpf_cliente,
    p.Primeiro_Nome || ' ' || p.Sobrenome AS nome_cliente,
    pc.Ticker,
    a.Nome                             AS nome_ativo,
    a.Setor,
    pc.Quantidade,
    pc.Preco_med_aquis,
    a.Preco_atual,
    (a.Preco_atual - pc.Preco_med_aquis) * pc.Quantidade AS valorizacao_absoluta,
    CASE
        WHEN pc.Preco_med_aquis > 0
        THEN (a.Preco_atual - pc.Preco_med_aquis) / pc.Preco_med_aquis * 100
        ELSE 0
    END AS valorizacao_percentual
FROM Conta c
JOIN Cliente cli         ON cli.CPF        = c.CPF_cliente
JOIN Pessoa  p           ON p.CPF          = cli.CPF
JOIN Posicao_Carteira pc ON pc.ID_conta    = c.ID_conta
JOIN Ativo   a           ON a.Ticker       = pc.Ticker;


-- Exemplo de uso:
-- SELECT * FROM vw_carteira_detalhada
-- WHERE ID_conta = :id_conta
-- ORDER BY nome_ativo;



-- ============================================================
-- VIEW 2: vw_conta_resumo
-- Resumo da conta (saldo, investido, patrimônio)
-- ------------------------------------------------------------
-- Justificativa:
-- Usada no dashboard do cliente (front). Evita repetir o
-- agrupamento e o cálculo de patrimônio em várias consultas.
-- ============================================================

CREATE OR REPLACE VIEW vw_conta_resumo AS
SELECT
    c.ID_conta,
    cli.CPF                            AS cpf_cliente,
    p.Primeiro_Nome || ' ' || p.Sobrenome AS nome_cliente,
    c.Saldo_disponivel                 AS saldo_dinheiro,
    COALESCE(SUM(pc.Quantidade * a.Preco_atual), 0) AS valor_investido,
    c.Saldo_disponivel
      + COALESCE(SUM(pc.Quantidade * a.Preco_atual), 0) AS patrimonio_total
FROM Conta c
JOIN Cliente cli         ON cli.CPF        = c.CPF_cliente
JOIN Pessoa  p           ON p.CPF          = cli.CPF
LEFT JOIN Posicao_Carteira pc ON pc.ID_conta = c.ID_conta
LEFT JOIN Ativo   a           ON a.Ticker   = pc.Ticker
GROUP BY c.ID_conta, cli.CPF, p.Primeiro_Nome, p.Sobrenome, c.Saldo_disponivel;


-- Exemplo de uso:
-- SELECT * FROM vw_conta_resumo
-- WHERE cpf_cliente = :cpf_cliente;



-- ============================================================
-- VIEW 3: vw_ordens_valor
-- Ordens com valor financeiro (fluxo de caixa)
-- ------------------------------------------------------------
-- Justificativa:
-- Base para relatórios de desempenho. Encapsula os joins e o
-- cálculo de fluxo de caixa (positivo para venda, negativo
-- para compra). Facilita calcular lucros/prejuízos por período.
-- ============================================================

CREATE OR REPLACE VIEW vw_ordens_valor AS
SELECT
    cli.CPF                            AS cpf_cliente,
    p.Primeiro_Nome || ' ' || p.Sobrenome AS nome_cliente,
    c.ID_conta,
    o.ID_ordem,
    o.Data_hora,
    o.Tipo_op,
    o.Ticker,
    a.Nome                             AS nome_ativo,
    o.Quantidade,
    o.Preco_exec,
    o.Status,
    o.Tipo_ordem,
    CASE WHEN o.Tipo_op = 'venda'
         THEN  o.Quantidade * o.Preco_exec
         ELSE -o.Quantidade * o.Preco_exec
    END AS fluxo_caixa
FROM Cliente cli
JOIN Pessoa p  ON p.CPF         = cli.CPF
JOIN Conta  c  ON c.CPF_cliente = cli.CPF
JOIN Ordem  o  ON o.ID_conta    = c.ID_conta
JOIN Ativo  a  ON a.Ticker      = o.Ticker;


-- Exemplos de uso:

-- Lucro/prejuízo por ativo no período:
-- SELECT
--     Ticker,
--     nome_ativo,
--     SUM(fluxo_caixa) AS lucro_prejuizo
-- FROM vw_ordens_valor
-- WHERE cpf_cliente = :cpf_cliente
--   AND Data_hora  >= :data_inicio
--   AND Data_hora  <  :data_fim
-- GROUP BY Ticker, nome_ativo
-- ORDER BY lucro_prejuizo DESC;

-- Resultado total no período:
-- SELECT
--     SUM(fluxo_caixa) AS lucro_prejuizo_total
-- FROM vw_ordens_valor
-- WHERE cpf_cliente = :cpf_cliente
--   AND Data_hora  >= :data_inicio
--   AND Data_hora  <  :data_fim;



-- ============================================================
-- VIEW 4: vw_estrutura_atendimento
-- Hierarquia Gerente → Assessores → Clientes
-- ------------------------------------------------------------
-- Justificativa:
-- Atende ao requisito de modelar a estrutura organizacional.
-- Útil para telas administrativas em que o gerente visualiza
-- sua equipe e os clientes de cada assessor.
-- ============================================================

CREATE OR REPLACE VIEW vw_estrutura_atendimento AS
SELECT
    g.CPF                                   AS cpf_gerente,
    pg.Primeiro_Nome || ' ' || pg.Sobrenome AS nome_gerente,
    ass.CPF                                 AS cpf_assessor,
    pa.Primeiro_Nome || ' ' || pa.Sobrenome AS nome_assessor,
    cli.CPF                                 AS cpf_cliente,
    pc.Primeiro_Nome || ' ' || pc.Sobrenome AS nome_cliente
FROM Gerente g
JOIN Pessoa   pg  ON pg.CPF          = g.CPF
JOIN Assessor ass ON ass.CPF_Gerente = g.CPF
JOIN Pessoa   pa  ON pa.CPF          = ass.CPF
JOIN Cliente  cli ON cli.CPF_Assessor = ass.CPF
JOIN Pessoa   pc  ON pc.CPF          = cli.CPF;


-- Exemplo de uso:
-- SELECT *
-- FROM vw_estrutura_atendimento
-- WHERE cpf_gerente = :cpf_gerente
-- ORDER BY nome_assessor, nome_cliente;
