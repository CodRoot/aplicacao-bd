import { useEffect, useMemo, useState } from "react";
import {
  postCompra,
  postVenda,
  listarAtivos,
  listarSetoresAcao,
  listarSetoresFII,
  getContaResumo,
} from "../api";

export default function Ordens({ idConta }) {
  const [tipoOperacao, setTipoOperacao] = useState("compra"); // compra / venda
  const [tipoAtivo, setTipoAtivo] = useState("");             // ACAO / FII / DEBENTURE / ""
  const [setorFiltro, setSetorFiltro] = useState("");

  const [setoresAcao, setSetoresAcao] = useState([]);
  const [setoresFII, setSetoresFII] = useState([]);

  const [ativos, setAtivos] = useState([]);
  const [tickerSelecionado, setTickerSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState("");

  const [contaResumo, setContaResumo] = useState(null);       // saldo em dinheiro etc.
  const [precoSelecionado, setPrecoSelecionado] = useState(null);

  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // Carregar ativos e resumo
  // =========================

  useEffect(() => {
    async function loadAtivos() {
      try {
        const lista = await listarAtivos();
        setAtivos(lista);
      } catch (e) {
        setErro(e.message);
      }
    }
    loadAtivos();
  }, []);

  useEffect(() => {
    async function loadResumo() {
      if (!idConta) return;
      try {
        const resumo = await getContaResumo(idConta);
        setContaResumo(resumo);
      } catch (e) {
        // Não travar a tela por causa disso, só loga o erro
        console.error(e);
      }
    }
    loadResumo();
  }, [idConta]);

  // =========================
  // Carregar setores (ação/FII)
  // =========================

  useEffect(() => {
    async function loadSectors() {
      if (tipoAtivo === "ACAO") {
        const lista = await listarSetoresAcao();
        setSetoresAcao(lista.map((x) => x.setor));
      } else {
        setSetoresAcao([]);
      }

      if (tipoAtivo === "FII") {
        const lista = await listarSetoresFII();
        setSetoresFII(lista.map((x) => x.setor));
      } else {
        setSetoresFII([]);
      }
    }
    loadSectors();
  }, [tipoAtivo]);

  // =========================
  // Filtro de ativos
  // =========================

  const ativosFiltrados = useMemo(() => {
    return ativos.filter((a) => {
      if (tipoAtivo && a.tipo !== tipoAtivo) return false;
      if (setorFiltro && a.setor !== setorFiltro) return false;
      return true;
    });
  }, [ativos, tipoAtivo, setorFiltro]);

  // =========================
  // Atualizar preço selecionado
  // =========================

  useEffect(() => {
    if (!tickerSelecionado) {
      setPrecoSelecionado(null);
      return;
    }
    const ativo = ativos.find((a) => a.ticker === tickerSelecionado);
    if (ativo && ativo.preco_atual != null) {
      setPrecoSelecionado(parseFloat(ativo.preco_atual));
    } else {
      setPrecoSelecionado(null);
    }
  }, [tickerSelecionado, ativos]);

  // =========================
  // Cálculo do valor total
  // =========================

  const quantidadeNum = quantidade ? parseInt(quantidade, 10) : 0;
  const valorTotal =
    precoSelecionado != null && quantidadeNum > 0
      ? precoSelecionado * quantidadeNum
      : null;

  const saldoDisponivel = contaResumo?.saldo_dinheiro ?? null;

  const saldoInsuficiente =
    tipoOperacao === "compra" &&
    valorTotal != null &&
    saldoDisponivel != null &&
    valorTotal > saldoDisponivel;

  // =========================
  // Enviar ordem
  // =========================

  async function handleSubmit(e) {
    e.preventDefault();
    setMensagem("");
    setErro("");

    if (!tickerSelecionado) {
      setErro("Selecione um ativo no dropdown.");
      return;
    }

    if (!quantidadeNum || quantidadeNum <= 0) {
      setErro("Informe uma quantidade válida.");
      return;
    }

    if (saldoInsuficiente) {
      setErro("Saldo insuficiente para realizar esta compra.");
      return;
    }

    try {
      setLoading(true);
      if (tipoOperacao === "compra") {
        await postCompra(idConta, tickerSelecionado, quantidadeNum);
        setMensagem(
          `Compra de ${quantidadeNum}x ${tickerSelecionado} realizada com sucesso.`
        );
      } else {
        await postVenda(idConta, tickerSelecionado, quantidadeNum);
        setMensagem(
          `Venda de ${quantidadeNum}x ${tickerSelecionado} realizada com sucesso.`
        );
      }
      setQuantidade("");
      // Recarregar resumo da conta após a operação
      if (idConta) {
        try {
          const resumo = await getContaResumo(idConta);
          setContaResumo(resumo);
        } catch (_) {}
      }
    } catch (e) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // Helpers de formatação
  // =========================

  function formatCurrency(v) {
    if (v == null) return "-";
    return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function formatNumber(v, decimals = 2) {
    if (v == null) return "-";
    return v.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  // =========================
  // Render
  // =========================

  return (
    <div className="page">
      <h1>Compra / Venda de Ativos</h1>
      <p>Conta #{idConta}</p>

      {erro && <div className="alert alert-error">{erro}</div>}
      {mensagem && <div className="alert alert-success">{mensagem}</div>}

      {/* Bloco de saldo da conta */}
      {contaResumo && (
        <div className="cards" style={{ marginBottom: 16 }}>
          <div className="card">
            <div className="card-label">Saldo disponível</div>
            <div className="card-value">
              {formatCurrency(contaResumo.saldo_dinheiro)}
            </div>
          </div>
          <div className="card">
            <div className="card-label">Valor investido</div>
            <div className="card-value">
              {formatCurrency(contaResumo.valor_investido)}
            </div>
          </div>
          <div className="card">
            <div className="card-label">Patrimônio total</div>
            <div className="card-value destaque">
              {formatCurrency(contaResumo.patrimonio_total)}
            </div>
          </div>
        </div>
      )}

      {/* FILTROS */}
      <div className="form" style={{ marginBottom: 16 }}>
        {/* Tipo de Ativo */}
        <div className="form-row">
          <label>Tipo de Ativo</label>
          <select
            className="form-input"
            value={tipoAtivo}
            onChange={(e) => {
              setTipoAtivo(e.target.value);
              setSetorFiltro("");
              setTickerSelecionado("");
            }}
          >
            <option value="">Todos</option>
            <option value="ACAO">Ação</option>
            <option value="FII">Fundo Imobiliário (FII)</option>
            <option value="DEBENTURE">Debênture</option>
          </select>
        </div>

        {/* Setor de Ações */}
        {tipoAtivo === "ACAO" && (
          <div className="form-row">
            <label>Setor (Ações)</label>
            <select
              className="form-input"
              value={setorFiltro}
              onChange={(e) => {
                setSetorFiltro(e.target.value);
                setTickerSelecionado("");
              }}
            >
              <option value="">Todos</option>
              {setoresAcao.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Setor de FIIs */}
        {tipoAtivo === "FII" && (
          <div className="form-row">
            <label>Setor (FII)</label>
            <select
              className="form-input"
              value={setorFiltro}
              onChange={(e) => {
                setSetorFiltro(e.target.value);
                setTickerSelecionado("");
              }}
            >
              <option value="">Todos</option>
              {setoresFII.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* FORM PRINCIPAL */}
      <form className="form" onSubmit={handleSubmit}>
        {/* Dropdown de Ativos */}
        <div className="form-row">
          <label>Ativo</label>
          <select
            className="form-input"
            value={tickerSelecionado}
            onChange={(e) => setTickerSelecionado(e.target.value)}
          >
            <option value="">Selecione um ativo</option>
            {ativosFiltrados.map((a) => (
              <option key={a.ticker} value={a.ticker}>
                {a.ticker} – {a.nome} ({a.tipo}
                {a.setor ? ` | ${a.setor}` : ""})
              </option>
            ))}
          </select>
        </div>

        {/* Informações do ativo selecionado */}
        {tickerSelecionado && (
          <div className="form-row">
            <label>Preço atual do ativo</label>
            <div className="alert">
              {precoSelecionado != null
                ? formatCurrency(precoSelecionado)
                : "Preço não disponível."}
            </div>
          </div>
        )}

        {/* Quantidade */}
        <div className="form-row">
          <label>Quantidade</label>
          <input
            type="number"
            className="form-input"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            min="1"
          />
        </div>

        {/* Valor total da operação */}
        {valorTotal != null && (
          <div className="form-row">
            <label>Valor total da operação</label>
            <div className="alert">
              {formatCurrency(valorTotal)}{" "}
              {tipoOperacao === "compra" && saldoDisponivel != null && (
                <>
                  {" | "}
                  <span>
                    Saldo após operação:{" "}
                    {formatCurrency(saldoDisponivel - valorTotal)}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tipo de operação */}
        <div className="form-row">
          <label>Operação</label>
          <select
            className="form-input"
            value={tipoOperacao}
            onChange={(e) => setTipoOperacao(e.target.value)}
          >
            <option value="compra">Compra</option>
            <option value="venda">Venda</option>
          </select>
        </div>

        {/* Aviso de saldo insuficiente */}
        {saldoInsuficiente && (
          <div className="alert alert-error">
            Saldo insuficiente para realizar esta compra.
          </div>
        )}

        <button
          className="btn-primary"
          type="submit"
          disabled={loading || saldoInsuficiente}
        >
          {loading ? "Processando..." : "Enviar ordem"}
        </button>
      </form>
    </div>
  );
}
