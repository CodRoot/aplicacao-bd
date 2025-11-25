// src/api.js
export const API_BASE = "http://127.0.0.1:8000";

export async function getContaResumo(idConta) {
  const res = await fetch(`${API_BASE}/contas/${idConta}/resumo`);
  if (!res.ok) throw new Error("Erro ao buscar resumo da conta");
  return res.json();
}

export async function getCarteira(idConta) {
  const res = await fetch(`${API_BASE}/contas/${idConta}/carteira`);
  if (!res.ok) throw new Error("Erro ao buscar carteira");
  return res.json();
}

export async function postDeposito(idConta, valor) {
  const res = await fetch(`${API_BASE}/contas/${idConta}/deposito`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ valor }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erro ao realizar depósito");
  }
  return res.json();
}

export async function postRetirada(idConta, valor) {
  const res = await fetch(`${API_BASE}/contas/${idConta}/retirada`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ valor }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erro ao realizar retirada");
  }
  return res.json();
}

export async function postCompra(idConta, ticker, quantidade) {
  const res = await fetch(`${API_BASE}/ordens/compra`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_conta: idConta, ticker, quantidade }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erro ao realizar compra");
  }
  return res.json();
}

export async function postVenda(idConta, ticker, quantidade) {
  const res = await fetch(`${API_BASE}/ordens/venda`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_conta: idConta, ticker, quantidade }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erro ao realizar venda");
  }
  return res.json();
}

export async function getRelatorio(cpfCliente, inicio, fim) {
  const url = new URL(`${API_BASE}/relatorio/${cpfCliente}`);
  url.searchParams.set("inicio", inicio);
  url.searchParams.set("fim", fim);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Erro ao buscar relatório");
  return res.json();
}

export async function listarAtivos() {
  const res = await fetch(API_BASE + "/ativos");
  if (!res.ok) throw new Error("Erro ao listar ativos");
  return res.json();
}


export async function filtrarAtivos(tipo, setor) {
  const url = new URL(API_BASE + "/ativos/filtro");
  if (tipo) url.searchParams.set("tipo", tipo);
  if (setor) url.searchParams.set("setor", setor);
  const res = await fetch(url.toString());
  return res.json();
}

export async function listarSetoresFII() {
  const res = await fetch(API_BASE + "/ativos/fii/setores");
  return res.json();
}

export async function listarSetoresAcao() {
  const res = await fetch(API_BASE + "/ativos/acao/setores");
  return res.json();
}

export async function getHistoricoConta(idConta) {
  const res = await fetch(`${API_BASE}/contas/${idConta}/historico`);
  if (!res.ok) throw new Error("Erro ao buscar histórico");
  return res.json();
}
