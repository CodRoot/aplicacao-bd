/* ============================================================
   006_triggers.sql
   TRIGGERS DE VALIDAÇÃO E INTEGRIDADE
   ============================================================ */

-- ============================================================
-- TRIGGER 1: Impedir SALDO NEGATIVO na tabela Conta
-- ------------------------------------------------------------
-- Se alguém tentar deixar o saldo da conta negativo, a operação
-- é barrada no próprio banco.
-- ============================================================

CREATE OR REPLACE FUNCTION trg_impede_saldo_negativo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.Saldo_disponivel < 0 THEN
        RAISE EXCEPTION 'Operação negada: saldo não pode ficar negativo.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER tg_saldo_negativo
BEFORE UPDATE ON Conta
FOR EACH ROW
EXECUTE FUNCTION trg_impede_saldo_negativo();



-- ============================================================
-- TRIGGER 2: Impedir QUANTIDADE NEGATIVA na carteira
-- ------------------------------------------------------------
-- Garante que nenhuma posição de ativo fique com quantidade
-- negativa na tabela Posicao_Carteira.
-- ============================================================

CREATE OR REPLACE FUNCTION trg_impede_quantidade_negativa()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.Quantidade < 0 THEN
        RAISE EXCEPTION 'Quantidade de ativos não pode ser negativa.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER tg_quantidade_negativa
BEFORE UPDATE ON Posicao_Carteira
FOR EACH ROW
EXECUTE FUNCTION trg_impede_quantidade_negativa();



-- ============================================================
-- TRIGGER 3: Atualizar POSIÇÃO APÓS ORDEM
-- ------------------------------------------------------------
-- Toda vez que uma nova ordem é inserida na tabela Ordem,
-- atualiza automaticamente a quantidade na Posicao_Carteira.
-- (Obs.: se você já faz isso na sp_compra/sp_venda, pode deixar
-- este trigger só como complemento ou até comentar.)
-- ============================================================

CREATE OR REPLACE FUNCTION trg_atualiza_posicao_apos_ordem()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.Tipo_op = 'compra' THEN
        UPDATE Posicao_Carteira
        SET Quantidade = Quantidade + NEW.Quantidade
        WHERE ID_conta = NEW.ID_conta AND Ticker = NEW.Ticker;

    ELSIF NEW.Tipo_op = 'venda' THEN
        UPDATE Posicao_Carteira
        SET Quantidade = Quantidade - NEW.Quantidade
        WHERE ID_conta = NEW.ID_conta AND Ticker = NEW.Ticker;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER tg_ordem_posicao
AFTER INSERT ON Ordem
FOR EACH ROW
EXECUTE FUNCTION trg_atualiza_posicao_apos_ordem();
