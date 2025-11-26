import { useState } from 'react';
import './App.css';
import { API_BASE } from './api'; // Importando a URL base

// Componentes
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DepositosRetiradas from './components/DepositosRetiradas';
import Ordens from './components/Ordens';
import Relatorio from './components/Relatorio';
import Simulacao from './components/Simulacao';
import AreaAssessor from './components/AreaAssessor';
import AreaGerente from './components/AreaGerente';

function App() {
  // Estado do Usuário Logado
  const [usuario, setUsuario] = useState(null); // { cpf: '...', perfil: 'cliente' }

  // Estados da Visão do Cliente
  const [activeTab, setActiveTab] = useState("dashboard");

  // AGORA INICIA COMO NULL (Vazio), pois não sabemos a conta ainda
  const [idConta, setIdConta] = useState(null);

  // --- Lógica de Login Inteligente ---
  const handleLogin = async (dadosUsuario) => {

    // 1. Se for Cliente, precisamos descobrir o ID da Conta dele no banco
    if (dadosUsuario.perfil === 'cliente') {
      try {
        // Faz a busca no Backend usando o endpoint que criamos
        const response = await fetch(`${API_BASE}/clientes/${dadosUsuario.cpf}/conta`);

        if (!response.ok) {
          alert("Erro: Cliente não encontrado ou sem conta ativa.");
          return; // Não loga se não tiver conta
        }

        const data = await response.json();

        // ATUALIZA O ID DA CONTA COM O VALOR REAL DO BANCO
        setIdConta(data.id_conta);

        // Só agora autoriza o login
        setUsuario(dadosUsuario);

      } catch (error) {
        console.error("Erro ao buscar conta:", error);
        alert("Erro de conexão com o servidor.");
      }
    }
    else {
      // 2. Se for Assessor ou Gerente, loga direto (não precisam de idConta)
      setUsuario(dadosUsuario);
    }
  };

  const handleLogout = () => {
    setUsuario(null);
    setIdConta(null); // Limpa a conta ao sair
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
          <button onClick={handleLogout} className="bg-red-500 px-4 py-1 rounded hover:bg-red-600 transition">Sair</button>
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
          <button onClick={handleLogout} className="bg-red-500 px-4 py-1 rounded hover:bg-red-600 transition">Sair</button>
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

        <div className="p-4 bg-gray-800 text-white text-xs mb-4 rounded mx-2">
          <p className="font-bold text-gray-400 mb-1">Olá, Cliente</p>
          <p className="font-mono">{usuario.cpf}</p>
          <button onClick={handleLogout} className="text-red-400 hover:text-red-300 underline mt-2 cursor-pointer">Sair da conta</button>
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

          {/* --- BOTÃO ESPECIAL: VIRAR DIA --- */}
          <div style={{ marginTop: '20px', borderTop: '1px solid #4b5563', paddingTop: '20px' }}>
            <button
              style={{
                width: '100%',
                backgroundColor: '#6366f1', // Indigo/Roxo
                color: 'white',
                fontWeight: 'bold',
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
              onClick={async () => {
                if (window.confirm("Deseja avançar um dia e aplicar rendimentos em todos os ativos?")) {
                  try {
                    await fetch(`${API_BASE}/admin/virar-dia`, { method: 'POST' });
                    //alert("🌞 Bom dia! Os rendimentos foram aplicados. Confira o Dashboard.");

                    // Truque para forçar a atualização do Dashboard se ele estiver aberto
                    if (activeTab === "dashboard") {
                       const currentId = idConta;
                       setIdConta(null); // "Desliga" a conta rapidinho
                       setTimeout(() => setIdConta(currentId), 50); // "Liga" de novo para recarregar os dados
                    }
                  } catch (error) {
                    console.error(error);
                    alert("Erro ao virar o dia.");
                  }
                }
              }}
            >
              🌙 Virar Dia
            </button>
          </div>

        </nav>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="main">
        {/* Passamos o idConta dinâmico para todos os componentes */}
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