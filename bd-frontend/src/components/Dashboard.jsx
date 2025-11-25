// src/components/Dashboard.jsx
import { useEffect, useState } from "react";
import { getContaResumo, getCarteira } from "../api";

function formatCurrency(v) {
  return v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-";
}

function formatPercent(v) {
  return v != null ? `${v.toFixed(2)}%` : "-";
}

export default function Dashboard({ idConta }) {
  const [resumo, setResumo] = useState(null);
  const [carteira, setCarteira] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErro("");
      try {
        const [r, c] = await Promise.all([
          getContaResumo(idConta),
          getCarteira(idConta),
        ]);
        setResumo(r);
        setCarteira(c);
      } catch (e) {
        setErro(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (idConta) {
      load();
    }
  }, [idConta]);

  return (
    <div className="page">
      <h1>Dashboard da Conta #{idConta}</h1>

      {erro && <div className="alert alert-error">{erro}</div>}
      {loading && <div className="alert">Carregando...</div>}

      {resumo && (
        <div className="cards">
          <div className="card">
            <div className="card-label">Saldo em Dinheiro</div>
            <div className="card-value">
              {formatCurrency(resumo.saldo_dinheiro)}
            </div>
          </div>
          <div className="card">
            <div className="card-label">Valor Investido</div>
            <div className="card-value">
              {formatCurrency(resumo.valor_investido)}
            </div>
          </div>
          <div className="card">
            <div className="card-label">Patrimônio Total</div>
            <div className="card-value destaque">
              {formatCurrency(resumo.patrimonio_total)}
            </div>
          </div>
        </div>
      )}

      <h2>Carteira de Ativos</h2>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Ativo</th>
              <th>Setor</th>
              <th>Quantidade</th>
              <th>Preço Médio</th>
              <th>Preço Atual</th>
              <th>Valorização</th>
              <th>Valorização %</th>
            </tr>
          </thead>
          <tbody>
            {carteira.length === 0 && (
              <tr>
                <td colSpan="8" className="empty">
                  Nenhum ativo na carteira.
                </td>
              </tr>
            )}
            {carteira.map((item) => (
              <tr key={item.ticker}>
                <td>{item.ticker}</td>
                <td>{item.nome_ativo}</td>
                <td>{item.setor}</td>
                <td>{item.quantidade}</td>
                <td>{formatCurrency(item.preco_med_aquis)}</td>
                <td>{formatCurrency(item.preco_atual)}</td>
                <td
                  className={
                    item.valorizacao_absoluta > 0
                      ? "positivo"
                      : item.valorizacao_absoluta < 0
                      ? "negativo"
                      : ""
                  }
                >
                  {formatCurrency(item.valorizacao_absoluta)}
                </td>
                <td
                  className={
                    item.valorizacao_percentual > 0
                      ? "positivo"
                      : item.valorizacao_percentual < 0
                      ? "negativo"
                      : ""
                  }
                >
                  {formatPercent(item.valorizacao_percentual)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
