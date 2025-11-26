import { useState } from 'react';

function Login({ onLogin }) {
  const [cpf, setCpf] = useState('');
  const [perfil, setPerfil] = useState('cliente');
  const [erro, setErro] = useState('');
  const [hoverButton, setHoverButton] = useState(false);

  const validarCPF = (cpf) => {
    const numeros = cpf.replace(/\D/g, '');
    if (numeros.length !== 11) return false;
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro('');

    if (!validarCPF(cpf)) {
      setErro('CPF inválido. Digite 11 números.');
      return;
    }

    onLogin({ cpf: cpf.replace(/\D/g, ''), perfil });
  };

  // --- ESTILOS VISUAIS (CSS IN JS) ---
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f172a', // Azul bem escuro (Fundo da página)
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    card: {
      backgroundColor: '#ffffff', // Cartão Branco
      padding: '2.5rem',
      borderRadius: '12px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      width: '100%',
      maxWidth: '400px',
    },
    header: {
      marginBottom: '2rem',
      textAlign: 'center',
    },
    logoIcon: {
      fontSize: '3rem',
      color: '#2563eb',
      marginBottom: '0.5rem',
      display: 'block'
    },
    title: {
      fontSize: '1.875rem',
      fontWeight: 'bold',
      color: '#1e293b', // Cinza escuro
      margin: 0,
    },
    subtitle: {
      color: '#64748b',
      fontSize: '0.875rem',
      marginTop: '0.5rem'
    },
    formGroup: {
      marginBottom: '1.25rem',
    },
    label: {
      display: 'block',
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#334155',
      marginBottom: '0.5rem',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      border: '1px solid #cbd5e1',
      fontSize: '1rem',
      color: '#0f172a',
      outline: 'none',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box', // Garante que o padding não estoure a largura
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '0.5rem',
      border: '1px solid #cbd5e1',
      fontSize: '1rem',
      color: '#0f172a',
      backgroundColor: 'white',
      cursor: 'pointer',
      boxSizing: 'border-box',
    },
    button: {
      width: '100%',
      padding: '0.75rem',
      backgroundColor: hoverButton ? '#1d4ed8' : '#2563eb', // Azul vibrante
      color: 'white',
      border: 'none',
      borderRadius: '0.5rem',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      marginTop: '1rem',
    },
    error: {
      color: '#ef4444',
      fontSize: '0.875rem',
      marginTop: '0.5rem',
    },
    infoBox: {
      marginTop: '2rem',
      padding: '1rem',
      backgroundColor: '#f8fafc',
      borderRadius: '0.5rem',
      border: '1px solid #e2e8f0',
      fontSize: '0.75rem',
      color: '#64748b',
    },
    infoTitle: {
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      color: '#475569',
    },
    list: {
      paddingLeft: '1.2rem',
      margin: 0,
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        <div style={styles.header}>
          <span style={styles.logoIcon}>⧉</span>
          <h1 style={styles.title}>InvestPro</h1>
          <p style={styles.subtitle}>Acesse sua carteira de investimentos</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>CPF</label>
            <input
              type="text"
              value={cpf}
              onChange={e => setCpf(e.target.value)}
              placeholder="Digite apenas números"
              style={{...styles.input, borderColor: erro ? '#ef4444' : '#cbd5e1'}}
              required
            />
            {erro && <p style={styles.error}>{erro}</p>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Tipo de Acesso</label>
            <select
              value={perfil}
              onChange={e => setPerfil(e.target.value)}
              style={styles.select}
            >
              <option value="cliente">Cliente</option>
              <option value="assessor">Assessor</option>
              <option value="gerente">Gerente</option>
            </select>
          </div>

          <button
            type="submit"
            style={styles.button}
            onMouseEnter={() => setHoverButton(true)}
            onMouseLeave={() => setHoverButton(false)}
          >
            Entrar na Plataforma
          </button>
        </form>

        <div style={styles.infoBox}>
          <p style={styles.infoTitle}>Credenciais de Teste:</p>
          <ul style={styles.list}>
            <li><strong>Cliente:</strong> 11111111111</li>
            <li><strong>Assessor:</strong> 22222222222</li>
            <li><strong>Gerente:</strong> 44444444444</li>
          </ul>
        </div>

      </div>
    </div>
  );
}

export default Login;