import { useEffect, useState } from "react";
import { getContaResumo, postDeposito, postRetirada } from "../api";

export default function DepositosRetiradas({ idConta }) {
  const [contaResumo, setContaResumo] = useState(null);
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState("deposito"); // deposito ou retirada

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  // carregar saldo da conta
  useEffect(() => {
    async function loadResumo() {
      try {
        const resumo = await getContaResumo(idConta);
        setContaResumo(resumo);
      } catch (e) {
        setErro("Erro ao carregar saldo da conta.");
      }
    }
    loadResumo();
  }, [idConta]);

  const valorNum = valor ? parseFloat(valor) : 0;
  const saldoAtual = contaResumo?.saldo_dinheiro ?? 0;

  // projeção:
  const saldoProjetado =
    tipo === "deposito"
      ? saldoAtual + valorNum
      : saldoAtual - valorNum;

  const retiradaInvalida =
    tipo === "retirada" &&
    valorNum > 0 &&
    valorNum > saldoAtual;

  // enviar depósito/retirada
  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setMensagem("");

    if (!valorNum || valorNum <= 0) {
      setErro("Digite um valor válido.");
      return;
    }
    if (retiradaInvalida) {
      setErro("Valor de retirada maior que o saldo disponível.");
      return;
    }

    try {
      setLoading(true);

      if (tipo === "deposito") {
        await postDeposito(idConta, valorNum);
        setMensagem("Depósito realizado com sucesso.");
      } else {
        await postRetirada(idConta, valorNum);
        setMensagem("Retirada realizada com sucesso.");
      }

      // recarregar resumo da conta
      const resumo = await getContaResumo(idConta);
      setContaResumo(resumo);

      setValor("");
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(v) {
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  return (
    <div className="page">
      <h1>Depósito / Retirada</h1>

      {erro && <div className="alert alert-error">{erro}</div>}
      {mensagem && <div className="alert alert-success">{mensagem}</div>}

      {/* saldo atual */}
      {contaResumo && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-label">Saldo atual</div>
          <div className="card-value destaque">
            {formatCurrency(saldoAtual)}
          </div>
        </div>
      )}

      <form className="form" onSubmit={handleSubmit}>
        
        {/* Tipo */}
        <div className="form-row">
          <label>Operação</label>
          <select
            className="form-input"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="deposito">Depósito</option>
            <option value="retirada">Retirada</option>
          </select>
        </div>

        {/* Valor */}
        <div className="form-row">
          <label>Valor</label>
          <input
            type="number"
            className="form-input"
            value={valor}
            min="0"
            onChange={(e) => setValor(e.target.value)}
          />
        </div>

        {/* Projeção */}
        {valorNum > 0 && (
          <div className="form-row">
            <label>Saldo após operação</label>
            <div
              className={
                retiradaInvalida
                  ? "alert alert-error"
                  : "alert"
              }
            >
              {retiradaInvalida
                ? "Retirada maior que o saldo disponível."
                : formatCurrency(saldoProjetado)}
            </div>
          </div>
        )}

        <button
          className="btn-primary"
          type="submit"
          disabled={loading || retiradaInvalida}
        >
          {loading ? "Processando..." : "Confirmar Operação"}
        </button>
      </form>
    </div>
  );
}
