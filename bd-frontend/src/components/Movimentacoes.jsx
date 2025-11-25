// src/components/Movimentacoes.jsx
import { useState } from "react";
import { postDeposito, postRetirada } from "../api";

export default function Movimentacoes({ idConta }) {
  const [valor, setValor] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [tipo, setTipo] = useState("deposito");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMensagem("");
    setErro("");

    const v = parseFloat(valor);
    if (!v || v <= 0) {
      setErro("Informe um valor válido.");
      return;
    }

    try {
      setLoading(true);
      if (tipo === "deposito") {
        await postDeposito(idConta, v);
        setMensagem("Depósito realizado com sucesso.");
      } else {
        await postRetirada(idConta, v);
        setMensagem("Retirada realizada com sucesso.");
      }
      setValor("");
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>Depósito / Retirada</h1>
      <p>Conta #{idConta}</p>

      {erro && <div className="alert alert-error">{erro}</div>}
      {mensagem && <div className="alert alert-success">{mensagem}</div>}

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-row">
          <label>Tipo de operação</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="form-input"
          >
            <option value="deposito">Depósito</option>
            <option value="retirada">Retirada</option>
          </select>
        </div>

        <div className="form-row">
          <label>Valor (R$)</label>
          <input
            type="number"
            className="form-input"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            step="0.01"
            min="0"
          />
        </div>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Processando..." : "Confirmar"}
        </button>
      </form>
    </div>
  );
}
