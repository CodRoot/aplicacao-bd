// src/App.jsx
import { useState } from "react";
import Dashboard from "./components/Dashboard";
import Ordens from "./components/Ordens";
import Relatorio from "./components/Relatorio";
import DepositosRetiradas from "./components/DepositosRetiradas";

import "./App.css";

function App() {
  const [idConta, setIdConta] = useState(1);
  const [cpfCliente, setCpfCliente] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="app-root">
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">⧉</span>
          <span className="logo-text">InvestPro</span>
        </div>

        {/* Seleção Conta */}
        <div className="sidebar-section">
          <label className="sidebar-label">ID da Conta</label>
          <input
            type="number"
            className="sidebar-input"
            value={idConta}
            min={1}
            onChange={(e) => setIdConta(Number(e.target.value))}
          />
        </div>

        {/* Seleção CPF cliente */}
        <div className="sidebar-section">
          <label className="sidebar-label">CPF Cliente</label>
          <input
            type="text"
            className="sidebar-input"
            value={cpfCliente}
            onChange={(e) => setCpfCliente(e.target.value)}
            placeholder="Somente números"
          />
        </div>

        {/* Menu */}
        <nav className="nav">
          <button
            className={activeTab === "dashboard" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={activeTab === "mov" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("mov")}
          >
            Depósito / Retirada
          </button>

          <button
            className={activeTab === "ordens" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("ordens")}
          >
            Compra / Venda
          </button>

          <button
            className={activeTab === "relatorio" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("relatorio")}
          >
            Relatório
          </button>
        </nav>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="main">

        {activeTab === "dashboard" && <Dashboard idConta={idConta} />}

        {activeTab === "mov" && <DepositosRetiradas idConta={idConta} />}

        {activeTab === "ordens" && <Ordens idConta={idConta} />}

        {activeTab === "relatorio" && (
          <Relatorio cpfCliente={cpfCliente} />
        )}

      </main>
    </div>
  );
}

export default App;
