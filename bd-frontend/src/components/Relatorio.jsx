// src/components/Relatorio.jsx
import { useState } from "react";
import { getRelatorio } from "../api";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// registra os módulos do Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// função padrão de formatação
function formatCurrency(v) {
  return v != null
    ? Number(v).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })
    : "-";
}

export default function Relatorio({ cpfCliente }) {
  const [inicio, setInicio] = useState("2025-01-01");
  const [fim, setFim] = useState("2025-12-31");
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleBuscar(e) {
    e.preventDefault();
    setErro("");

    if (!cpfCliente) {
      setErro("Informe o CPF do cliente na barra lateral.");
      return;
    }

    try {
      setLoading(true);
      const res = await getRelatorio(cpfCliente, inicio, fim);
      setDados(res);
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  // monta o gráfico
  const chartData =
    dados && dados.detalhado_por_ativo
      ? {
          labels: dados.detalhado_por_ativo.map((r) => r.ticker),
          datasets: [
            {
              label: "Lucro / Prejuízo",
              data: dados.detalhado_por_ativo.map((r) => r.lucro_prejuizo),
              backgroundColor: dados.detalhado_por_ativo.map((r) =>
                r.lucro_prejuizo > 0
                  ? "rgba(34, 197, 94, 0.6)"
                  : r.lucro_prejuizo < 0
                  ? "rgba(248, 113, 113, 0.6)"
                  : "rgba(148, 163, 184, 0.6)"
              ),
              borderColor: dados.detalhado_por_ativo.map((r) =>
                r.lucro_prejuizo > 0
                  ? "rgba(34, 197, 94, 1)"
                  : r.lucro_prejuizo < 0
                  ? "rgba(248, 113, 113, 1)"
                  : "rgba(148, 163, 184, 1)"
              ),
              borderWidth: 1,
              borderRadius: 6,
            },
          ],
        }
      : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        labels: { color: "#e5e7eb" },
      },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            formatCurrency(typeof ctx.parsed.y === "number" ? ctx.parsed.y : 0),
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#cbd5e1" },
        grid: { color: "rgba(30,41,59,0.6)" },
      },
      y: {
        ticks: {
          color: "#cbd5e1",
          callback: (value) =>
            typeof value === "number"
              ? value.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  maximumFractionDigits: 0,
                })
              : value,
        },
        grid: { color: "rgba(30,41,59,0.6)" },
      },
    },
  };

  return (
    <div className="page">
      <h1>Relatório de Desempenho</h1>
      <p>CPF: {cpfCliente || <em>(não informado)</em>}</p>

      {erro && <div className="alert alert-error">{erro}</div>}

      <form className="form" onSubmit={handleBuscar}>
        <div className="form-row">
          <label>Data início</label>
          <input
            type="date"
            className="form-input"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
          />
        </div>

        <div className="form-row">
          <label>Data fim</label>
          <input
            type="date"
            className="form-input"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
          />
        </div>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Carregando..." : "Gerar relatório"}
        </button>
      </form>

      {!dados && <p>Preencha CPF e datas para gerar.</p>}

      {dados && (
        <>
          {/* ----------- RESUMO ----------- */}
          <h2>Resumo</h2>
          <div className="cards">
            <div className="card">
              <div className="card-label">Resultado total no período</div>
              <div
                className={
                  dados.total > 0
                    ? "card-value positivo"
                    : dados.total < 0
                    ? "card-value negativo"
                    : "card-value"
                }
              >
                {formatCurrency(dados.total)}
              </div>
            </div>
          </div>

          {/* ----------- GRÁFICO ----------- */}
          {chartData && chartData.labels.length > 0 && (
            <div className="chart-container">
              <h2>Lucro / Prejuízo por Ativo</h2>
              <Bar data={chartData} options={chartOptions} />
            </div>
          )}

          {/* ----------- TABELA POR ATIVO ----------- */}
          <h2 style={{ marginTop: 30 }}>Por ativo (tabela)</h2>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Ativo</th>
                  <th>Lucro / Prejuízo</th>
                </tr>
              </thead>
              <tbody>
                {dados.detalhado_por_ativo.length === 0 && (
                  <tr>
                    <td colSpan="3" className="empty">
                      Nenhuma operação no período.
                    </td>
                  </tr>
                )}

                {dados.detalhado_por_ativo.map((row) => (
                  <tr key={row.ticker}>
                    <td>{row.ticker}</td>
                    <td>{row.nome_ativo}</td>
                    <td
                      className={
                        row.lucro_prejuizo > 0
                          ? "positivo"
                          : row.lucro_prejuizo < 0
                          ? "negativo"
                          : ""
                      }
                    >
                      {formatCurrency(row.lucro_prejuizo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ----------- HISTÓRICO DE OPERAÇÕES ----------- */}
          <h2 style={{ marginTop: 30 }}>Histórico de Operações</h2>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Operação</th>
                  <th>Ticker</th>
                  <th>Qtd</th>
                  <th>Preço Exec</th>
                  <th>Fluxo</th>
                </tr>
              </thead>

              <tbody>
                {dados.historico_operacoes.length === 0 && (
                  <tr>
                    <td colSpan="6" className="empty">
                      Nenhuma operação no período.
                    </td>
                  </tr>
                )}

                {dados.historico_operacoes.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      {new Date(row.data_hora).toLocaleString("pt-BR")}
                    </td>
                    <td>{row.tipo_op}</td>
                    <td>{row.ticker}</td>
                    <td>{row.quantidade}</td>
                    <td>{formatCurrency(row.preco_exec)}</td>
                    <td>{formatCurrency(row.fluxo_caixa)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
