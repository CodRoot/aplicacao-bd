-- ============================================================
-- 1) PROCEDURE - DEPÓSTIO
-- ============================================================

CREATE OR REPLACE PROCEDURE sp_deposito(
    p_id_conta INT,
    p_valor NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_valor <= 0 THEN
        RAISE EXCEPTION 'Valor do depósito deve ser positivo';
    END IF;

    UPDATE Conta
    SET Saldo_disponivel = Saldo_disponivel + p_valor
    WHERE ID_conta = p_id_conta;

    INSERT INTO Transacao_Financeira(Data_hora, Valor, Tipo_transacao, ID_conta)
    VALUES (NOW(), p_valor, 'deposito', p_id_conta);
END;
$$;

-- ============================================================
-- 2) PROCEDURE - RETIRADA
-- ============================================================

CREATE OR REPLACE PROCEDURE sp_retirada(
    p_id_conta INT,
    p_valor NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_saldo NUMERIC;
BEGIN
    IF p_valor <= 0 THEN
        RAISE EXCEPTION 'Valor da retirada deve ser positivo';
    END IF;

    SELECT Saldo_disponivel INTO v_saldo
    FROM Conta
    WHERE ID_conta = p_id_conta;

    IF v_saldo < p_valor THEN
        RAISE EXCEPTION 'Saldo insuficiente para retirada';
    END IF;

    UPDATE Conta
    SET Saldo_disponivel = Saldo_disponivel - p_valor
    WHERE ID_conta = p_id_conta;

    INSERT INTO Transacao_Financeira(Data_hora, Valor, Tipo_transacao, ID_conta)
    VALUES (NOW(), -p_valor, 'retirada', p_id_conta);
END;
$$;


-- ============================================================
-- 3) PROCEDURE - COMPRA DE ATIVO
-- ============================================================

CREATE OR REPLACE PROCEDURE sp_compra(
    p_id_conta INT,
    p_ticker VARCHAR,
    p_quantidade INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_preco NUMERIC;
    v_saldo NUMERIC;
    v_custo_total NUMERIC;
    v_qtd_antiga INT;
    v_preco_medio NUMERIC;
BEGIN
    IF p_quantidade <= 0 THEN
        RAISE EXCEPTION 'Quantidade deve ser positiva';
    END IF;

    SELECT Preco_atual INTO v_preco
    FROM Ativo
    WHERE Ticker = p_ticker;

    v_custo_total := v_preco * p_quantidade;

    SELECT Saldo_disponivel INTO v_saldo
    FROM Conta
    WHERE ID_conta = p_id_conta;

    IF v_saldo < v_custo_total THEN
        RAISE EXCEPTION 'Saldo insuficiente para compra';
    END IF;

    -- REGISTRA ORDEM
    INSERT INTO Ordem(Ticker, Tipo_op, Preco_exec, Status, Quantidade, Tipo_ordem, Data_hora, ID_conta)
    VALUES (p_ticker, 'compra', v_preco, 'executada', p_quantidade, 'a mercado', NOW(), p_id_conta);

    -- DESCONTO NO SALDO
    UPDATE Conta
    SET Saldo_disponivel = Saldo_disponivel - v_custo_total
    WHERE ID_conta = p_id_conta;

    -- VERIFICA POSIÇÃO EXISTENTE
    SELECT Quantidade, Preco_med_aquis 
    INTO v_qtd_antiga, v_preco_medio
    FROM Posicao_Carteira
    WHERE ID_conta = p_id_conta AND Ticker = p_ticker;

    IF NOT FOUND THEN
        -- NOVA POSIÇÃO
        INSERT INTO Posicao_Carteira(ID_conta, Ticker, Quantidade, Preco_med_aquis)
        VALUES(p_id_conta, p_ticker, p_quantidade, v_preco);
    ELSE
        -- AJUSTE DE PREÇO MÉDIO
        v_preco_medio :=
            ((v_qtd_antiga * v_preco_medio) + (p_quantidade * v_preco))
            / (v_qtd_antiga + p_quantidade);

        UPDATE Posicao_Carteira
        SET Quantidade = v_qtd_antiga + p_quantidade,
            Preco_med_aquis = v_preco_medio
        WHERE ID_conta = p_id_conta AND Ticker = p_ticker;
    END IF;

END;
$$;


-- ============================================================
-- 4) PROCEDURE - VENDA DE ATIVO
-- ============================================================

CREATE OR REPLACE PROCEDURE sp_venda(
    p_id_conta INT,
    p_ticker VARCHAR,
    p_quantidade INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_preco NUMERIC;
    v_qtd_atual INT;
    v_receita NUMERIC;
BEGIN
    IF p_quantidade <= 0 THEN
        RAISE EXCEPTION 'Quantidade deve ser positiva';
    END IF;

    -- BUSCA QUANTIDADE ATUAL (COM TRATAMENTO PARA NULO)
    SELECT Quantidade INTO v_qtd_atual
    FROM Posicao_Carteira
    WHERE ID_conta = p_id_conta AND Ticker = p_ticker;

    -- Se não encontrou registro, define como 0
    IF v_qtd_atual IS NULL THEN
        v_qtd_atual := 0;
    END IF;

    -- VALIDAÇÃO
    IF v_qtd_atual < p_quantidade THEN
        RAISE EXCEPTION 'Quantidade insuficiente para venda. Você possui % unidades.', v_qtd_atual;
    END IF;

    -- BUSCA PREÇO
    SELECT Preco_atual INTO v_preco
    FROM Ativo WHERE Ticker = p_ticker;

    v_receita := v_preco * p_quantidade;

    -- REGISTRA ORDEM
    INSERT INTO Ordem(Ticker, Tipo_op, Preco_exec, Status, Quantidade, Tipo_ordem, Data_hora, ID_conta)
    VALUES (p_ticker, 'venda', v_preco, 'executada', p_quantidade, 'a mercado', NOW(), p_id_conta);

    -- CRÉDITO NO SALDO
    UPDATE Conta
    SET Saldo_disponivel = Saldo_disponivel + v_receita
    WHERE ID_conta = p_id_conta;

    -- ATUALIZA POSIÇÃO
    IF v_qtd_atual - p_quantidade = 0 THEN
        -- Se vendeu tudo, remove o registro da carteira para limpar
        DELETE FROM Posicao_Carteira
        WHERE ID_conta = p_id_conta AND Ticker = p_ticker;
    ELSE
        -- Se sobrou, apenas desconta
        UPDATE Posicao_Carteira
        SET Quantidade = v_qtd_atual - p_quantidade
        WHERE ID_conta = p_id_conta AND Ticker = p_ticker;
    END IF;

END;
$$;

-- ============================================================
-- 5) PROCEDURE - RENDIMENTO DIÁRIO AUTOMÁTICO
-- ============================================================

CREATE OR REPLACE PROCEDURE sp_aplica_rendimento_diario()
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE Ativo
    SET Preco_atual = Preco_atual * (1 + Rent_diaria_fixa)
    WHERE Rent_diaria_fixa IS NOT NULL;
END;
$$;
