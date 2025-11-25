/* ============================================================
   CONSULTAS SQL UTILIZADAS PELA APLICAÇÃO
   Minimundo: Plataforma de Investimentos
   Banco: PostgreSQL
   ------------------------------------------------------------
   Convenção de parâmetros usados nas cláusulas WHERE:
     :cpf_cliente   → CPF do cliente logado
     :id_conta      → conta selecionada
     :cpf_assessor  → CPF do assessor
     :cpf_gerente   → CPF do gerente
     :data_inicio   → início do período (timestamp/date)
     :data_fim      → fim do período (timestamp/date)
     :nome_busca    → texto parcial do nome do ativo
     :setor_filtro  → setor do ativo (ou NULL)
     :rent_minima   → rentabilidade mínima diária (ou NULL)
   Em código, estes parâmetros são preenchidos pela aplicação.
   ============================================================ */


-- ============================================================
-- CONSULTA 1
-- BUSCA DE ATIVOS COM FILTROS (NOME, SETOR, RENTABILIDADE)
-- ------------------------------------------------------------
-- Justificativa:
-- Atende ao requisito funcional "Comprar ativos".
-- Permite ao cliente pesquisar ativos pelo nome e aplicar filtros
-- de setor e rentabilidade diária mínima, simulando a tela de
-- busca de ativos da plataforma.
-- ============================================================

SELECT
    a.Ticker,
    a.Nome,
    a.Setor,
    a.Preco_atual,
    a.Rent_diaria_fixa
FROM Ativo a
WHERE
    a.Nome ILIKE '%' || :nome_busca || '%'               -- texto digitado
    AND (:setor_filtro IS NULL OR a.Setor = :setor_filtro)
    AND (:rent_minima IS NULL OR a.Rent_diaria_fixa >= :rent_minima)
ORDER BY a.Nome;



-- ============================================================
-- CONSULTA 2
-- RESUMO DE CONTA (SALDO EM DINHEIRO, VALOR INVESTIDO, PATRIMÔNIO)
-- ------------------------------------------------------------
-- Justificativa:
-- Apoia a visualização do "dashboard" do cliente, trazendo
-- saldo de conta, valor investido em ativos e patrimônio total.
-- Usada tanto para consulta rápida quanto para relatório.
-- ============================================================

SELECT
    c.ID_conta,
    c.Saldo_disponivel AS saldo_dinheiro,
    COALESCE(SUM(pc.Quantidade * a.Preco_atual), 0) AS valor_investido,
    c.Saldo_disponivel + COALESCE(SUM(pc.Quantidade * a.Preco_atual), 0) AS patrimonio_total
FROM Conta c
LEFT JOIN Posicao_Carteira pc ON pc.ID_conta = c.ID_conta
LEFT JOIN Ativo a            ON a.Ticker   = pc.Ticker
WHERE c.ID_conta = :id_conta
GROUP BY c.ID_conta, c.Saldo_disponivel;



-- ============================================================
-- CONSULTA 3
-- CARTEIRA DETALHADA DE UMA CONTA (COM VALORIZAÇÃO POR ATIVO)
-- ------------------------------------------------------------
-- Justificativa:
-- Atende ao requisito "Consultar carteira atualizada".
-- Mostra, para cada ativo da carteira do cliente:
--   - quantidade, preço médio, preço atual
--   - valorização absoluta e percentual.
-- ============================================================

SELECT
    pc.ID_conta,
    pc.Ticker,
    a.Nome,
    pc.Quantidade,
    pc.Preco_med_aquis,
    a.Preco_atual,
    (a.Preco_atual - pc.Preco_med_aquis) * pc.Quantidade AS valorizacao_absoluta,
    CASE
        WHEN pc.Preco_med_aquis > 0
        THEN (a.Preco_atual - pc.Preco_med_aquis) / pc.Preco_med_aquis * 100
        ELSE 0
    END AS valorizacao_percentual
FROM Posicao_Carteira pc
JOIN Ativo a ON a.Ticker = pc.Ticker
WHERE pc.ID_conta = :id_conta
ORDER BY a.Nome;



-- ============================================================
-- CONSULTA 4
-- HISTÓRICO DE ORDENS DE UM CLIENTE EM UM PERÍODO
-- ------------------------------------------------------------
-- Justificativa:
-- Parte do requisito "Gerar relatório de desempenho" e também
-- suporta a funcionalidade de histórico de negociações.
-- Exibe ordens de todas as contas de um cliente entre duas datas.
-- ============================================================

SELECT
    p.Primeiro_Nome || ' ' || p.Sobrenome AS cliente,
    c.ID_conta,
    o.ID_ordem,
    o.Data_hora,
    o.Tipo_op,
    o.Ticker,
    a.Nome               AS nome_ativo,
    o.Quantidade,
    o.Preco_exec,
    o.Status,
    o.Tipo_ordem
FROM Cliente cli
JOIN Pessoa  p  ON p.CPF         = cli.CPF
JOIN Conta   c  ON c.CPF_cliente = cli.CPF
JOIN Ordem   o  ON o.ID_conta    = c.ID_conta
JOIN Ativo   a  ON a.Ticker      = o.Ticker
WHERE cli.CPF       = :cpf_cliente
  AND o.Data_hora  >= :data_inicio
  AND o.Data_hora  <  :data_fim
ORDER BY o.Data_hora;



-- ============================================================
-- CONSULTA 5
-- LUCRO / PREJUÍZO POR ATIVO EM UM PERÍODO
-- ------------------------------------------------------------
-- Justificativa:
-- Atende diretamente ao requisito "Gerar relatório de desempenho",
-- calculando o resultado financeiro por ativo, a partir das ordens
-- de compra e venda.
-- Hipótese:
--   Tipo_op = 'compra'  → saída de caixa
--   Tipo_op = 'venda'   → entrada de caixa
-- ============================================================

SELECT
    o.Ticker,
    a.Nome,
    SUM(CASE WHEN o.Tipo_op = 'venda'
             THEN o.Quantidade * o.Preco_exec
             ELSE 0 END) AS total_vendas,
    SUM(CASE WHEN o.Tipo_op = 'compra'
             THEN o.Quantidade * o.Preco_exec
             ELSE 0 END) AS total_compras,
    SUM(CASE WHEN o.Tipo_op = 'venda'
             THEN  o.Quantidade * o.Preco_exec
             ELSE -o.Quantidade * o.Preco_exec
        END) AS lucro_prejuizo
FROM Cliente cli
JOIN Conta  c ON c.CPF_cliente = cli.CPF
JOIN Ordem  o ON o.ID_conta    = c.ID_conta
JOIN Ativo  a ON a.Ticker      = o.Ticker
WHERE cli.CPF      = :cpf_cliente
  AND o.Data_hora >= :data_inicio
  AND o.Data_hora <  :data_fim
GROUP BY o.Ticker, a.Nome
ORDER BY lucro_prejuizo DESC;



-- ============================================================
-- CONSULTA 6
-- RESULTADO CONSOLIDADO DA CARTEIRA EM UM PERÍODO
-- ------------------------------------------------------------
-- Justificativa:
-- Complementa o relatório de desempenho trazendo o resultado
-- total (lucro/prejuízo global) do cliente em um período.
-- Utiliza a mesma lógica de fluxo de caixa da consulta 5.
-- ============================================================

SELECT
    cli.CPF,
    p.Primeiro_Nome || ' ' || p.Sobrenome AS cliente,
    SUM(CASE WHEN o.Tipo_op = 'venda'
             THEN  o.Quantidade * o.Preco_exec
             ELSE -o.Quantidade * o.Preco_exec
        END) AS lucro_prejuizo_total
FROM Cliente cli
JOIN Pessoa p  ON p.CPF         = cli.CPF
JOIN Conta  c  ON c.CPF_cliente = cli.CPF
JOIN Ordem  o  ON o.ID_conta    = c.ID_conta
WHERE cli.CPF      = :cpf_cliente
  AND o.Data_hora >= :data_inicio
  AND o.Data_hora <  :data_fim
GROUP BY cli.CPF, p.Primeiro_Nome, p.Sobrenome;



-- ============================================================
-- CONSULTA 7
-- LISTAR APENAS OS ATIVOS DISPONÍVEIS PARA VENDA
-- ------------------------------------------------------------
-- Justificativa:
-- Atende ao requisito "Vender ativos".
-- Retorna somente os ativos nos quais a conta possui quantidade
-- positiva, para serem exibidos na tela de venda.
-- ============================================================

SELECT
    pc.ID_conta,
    pc.Ticker,
    a.Nome,
    pc.Quantidade,
    pc.Preco_med_aquis,
    a.Preco_atual
FROM Posicao_Carteira pc
JOIN Ativo a ON a.Ticker = pc.Ticker
WHERE pc.ID_conta   = :id_conta
  AND pc.Quantidade > 0
ORDER BY a.Nome;



-- ============================================================
-- CONSULTA 8
-- EXTRATO DE TRANSAÇÕES FINANCEIRAS (DEPÓSITOS, RETIRADAS,
-- DIVIDENDOS) EM UM PERÍODO
-- ------------------------------------------------------------
-- Justificativa:
-- Complementa o controle financeiro da conta, mostrando todas
-- as movimentações de caixa (depósitos, retiradas, dividendos)
-- no intervalo definido pelo usuário.
-- ============================================================

SELECT
    tf.ID_transacao,
    tf.Data_hora,
    tf.Tipo_transacao,
    tf.Valor
FROM Transacao_Financeira tf
WHERE tf.ID_conta   = :id_conta
  AND tf.Data_hora >= :data_inicio
  AND tf.Data_hora <  :data_fim
ORDER BY tf.Data_hora;



-- ============================================================
-- CONSULTA 9
-- APLICAÇÃO DE RENDIMENTO DIÁRIO AUTOMÁTICO AOS ATIVOS
-- ------------------------------------------------------------
-- Justificativa:
-- Atende ao requisito "Aplicar rendimento diário automático".
-- Essa consulta é executada pelo sistema (job diário) para
-- atualizar o preço atual de cada ativo, considerando
-- a rentabilidade diária fixa.
-- ============================================================

UPDATE Ativo
SET Preco_atual = Preco_atual * (1 + Rent_diaria_fixa)
WHERE Rent_diaria_fixa IS NOT NULL;



-- ============================================================
-- CONSULTA 10
-- CLIENTES DE UM ASSESSOR COM SALDO E PATRIMÔNIO
-- ------------------------------------------------------------
-- Justificativa:
-- Atende ao requisito de gestão interna da corretora: permite
-- ao assessor visualizar a situação das contas de seus clientes,
-- incluindo saldo em dinheiro, valor investido e patrimônio.
-- ============================================================

SELECT
    ass.CPF                 AS cpf_assessor,
    pa.Primeiro_Nome || ' ' || pa.Sobrenome AS nome_assessor,
    cli.CPF                 AS cpf_cliente,
    pcli.Primeiro_Nome || ' ' || pcli.Sobrenome AS nome_cliente,
    c.ID_conta,
    c.Saldo_disponivel,
    COALESCE(SUM(pc.Quantidade * a.Preco_atual),0) AS valor_investido,
    c.Saldo_disponivel + COALESCE(SUM(pc.Quantidade * a.Preco_atual),0) AS patrimonio_total
FROM Assessor ass
JOIN Pessoa   pa   ON pa.CPF          = ass.CPF
JOIN Cliente  cli  ON cli.CPF_Assessor = ass.CPF
JOIN Pessoa   pcli ON pcli.CPF       = cli.CPF
JOIN Conta    c    ON c.CPF_cliente  = cli.CPF
LEFT JOIN Posicao_Carteira pc ON pc.ID_conta = c.ID_conta
LEFT JOIN Ativo a            ON a.Ticker    = pc.Ticker
WHERE ass.CPF = :cpf_assessor
GROUP BY ass.CPF, pa.Primeiro_Nome, pa.Sobrenome,
         cli.CPF, pcli.Primeiro_Nome, pcli.Sobrenome,
         c.ID_conta, c.Saldo_disponivel
ORDER BY nome_cliente, c.ID_conta;



-- ============================================================
-- CONSULTA 11
-- ESTRUTURA HIERÁRQUICA GERENTE → ASSESSORES → CLIENTES
-- ------------------------------------------------------------
-- Justificativa:
-- Atende ao requisito de dados da estrutura organizacional.
-- Permite ao gerente visualizar sua equipe de assessores e a
-- carteira de clientes de cada assessor.
-- ============================================================

SELECT
    g.CPF                                     AS cpf_gerente,
    pg.Primeiro_Nome || ' ' || pg.Sobrenome   AS nome_gerente,
    ass.CPF                                   AS cpf_assessor,
    pa.Primeiro_Nome || ' ' || pa.Sobrenome   AS nome_assessor,
    cli.CPF                                   AS cpf_cliente,
    pc.Primeiro_Nome || ' ' || pc.Sobrenome   AS nome_cliente
FROM Gerente g
JOIN Pessoa   pg  ON pg.CPF         = g.CPF
JOIN Assessor ass ON ass.CPF_Gerente = g.CPF
JOIN Pessoa   pa  ON pa.CPF         = ass.CPF
JOIN Cliente  cli ON cli.CPF_Assessor = ass.CPF
JOIN Pessoa   pc  ON pc.CPF         = cli.CPF
WHERE g.CPF = :cpf_gerente
ORDER BY nome_assessor, nome_cliente;