import { useState } from 'react';
import './App.css';

// Componentes
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DepositosRetiradas from './components/DepositosRetiradas';
import Ordens from './components/Ordens';
import Relatorio from './components/Relatorio';
import Simulacao from './components/Simulacao';
import AreaAssessor from './components/AreaAssessor'; // Novo
import AreaGerente from './components/AreaGerente';   // Novo

function App() {
  // Estado do Usuário Logado
  const [usuario, setUsuario] = useState(null); // { cpf: '...', perfil: 'cliente' }

  // Estados da Visão do Cliente
  const [activeTab, setActiveTab] = useState("dashboard");
  const [idConta, setIdConta] = useState(1); // Fixo para teste, poderia vir do login

  // --- Lógica de Login/Logout ---
  const handleLogin = (dadosUsuario) => {
    setUsuario(dadosUsuario);
  };

  const handleLogout = () => {
    setUsuario(null);
    setActiveTab("dashboard");
  };

  // 1. Se não estiver logado, mostra Tela de Login
  if (!usuario) {
    return <Login onLogin={handleLogin} />;
  }

  // 2. Se for Assessor, mostra Área do Assessor
  if (usuario.perfil === 'assessor') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-700 text-white p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Portal do Assessor</h1>
          <button onClick={handleLogout} className="bg-red-500 px-4 py-1 rounded">Sair</button>
        </header>
        <AreaAssessor cpf={usuario.cpf} />
      </div>
    );
  }

  // 3. Se for Gerente, mostra Área do Gerente
  if (usuario.perfil === 'gerente') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-purple-700 text-white p-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Portal do Gerente</h1>
          <button onClick={handleLogout} className="bg-red-500 px-4 py-1 rounded">Sair</button>
        </header>
        <AreaGerente cpf={usuario.cpf} />
      </div>
    );
  }

  // 4. Se for Cliente, mostra a Aplicação Completa (Dashboard, etc)
  return (
    <div className="app-root">
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">⧉</span>
          <span className="logo-text">InvestPro</span>
        </div>

        <div className="p-4 bg-gray-800 text-white text-xs mb-4">
          <p>Olá, Cliente</p>
          <p>CPF: {usuario.cpf}</p>
          <button onClick={handleLogout} className="text-red-300 underline mt-2">Sair</button>
        </div>

        {/* Seleção Conta (Simulada) */}
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
          <button
            className={activeTab === "simulacao" ? "nav-btn active" : "nav-btn"}
            onClick={() => setActiveTab("simulacao")}
          >
            Simulação
          </button>
        </nav>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="main">
        {activeTab === "dashboard" && <Dashboard idConta={idConta} />}
        {activeTab === "mov" && <DepositosRetiradas idConta={idConta} />}
        {activeTab === "ordens" && <Ordens idConta={idConta} />}
        {activeTab === "relatorio" && <Relatorio cpfCliente={usuario.cpf} />}
        {activeTab === "simulacao" && <Simulacao />}
      </main>
    </div>
  );
}

export default App;