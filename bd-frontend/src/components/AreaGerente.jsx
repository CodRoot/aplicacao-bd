import { useState, useEffect } from 'react';
import { API_BASE } from '../api';

function AreaGerente({ cpf }) {
  const [equipe, setEquipe] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/gerente/${cpf}/equipe`)
      .then(res => res.json())
      .then(data => setEquipe(data))
      .catch(err => console.error("Erro:", err));
  }, [cpf]);

  // Estilos
  const styles = {
    container: {
      padding: '20px',
      backgroundColor: '#f3f4f6',
      minHeight: '100vh',
      color: '#333'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      maxWidth: '1000px',
      margin: '0 auto'
    },
    header: {
      backgroundColor: '#f3e8ff', // Roxo claro
      padding: '20px',
      borderBottom: '1px solid #ddd',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      color: '#6b21a8', // Roxo escuro
      margin: 0,
      fontSize: '24px'
    },
    tag: {
      backgroundColor: '#9333ea',
      color: 'white',
      padding: '5px 10px',
      borderRadius: '15px',
      fontSize: '14px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      textAlign: 'left',
      padding: '12px 15px',
      backgroundColor: '#f9fafb',
      borderBottom: '2px solid #e5e7eb',
      color: '#374151',
      fontWeight: 'bold'
    },
    td: {
      padding: '12px 15px',
      borderBottom: '1px solid #e5e7eb'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Painel do Gerente</h2>
            <small>Visão Geral da Equipe</small>
          </div>
          <span style={styles.tag}>CPF: {cpf}</span>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Assessor</th>
              <th style={styles.th}>CPF Assessor</th>
              <th style={styles.th}>Cliente Atendido</th>
              <th style={styles.th}>CPF Cliente</th>
            </tr>
          </thead>
          <tbody>
            {equipe.map((item, index) => (
              <tr key={index}>
                <td style={styles.td}><strong>{item.nome_assessor}</strong></td>
                <td style={styles.td}><small>{item.cpf_assessor}</small></td>
                <td style={styles.td}>{item.nome_cliente}</td>
                <td style={styles.td}><small>{item.cpf_cliente}</small></td>
              </tr>
            ))}
            {equipe.length === 0 && (
              <tr>
                <td colSpan="4" style={{...styles.td, textAlign: 'center', padding: '30px'}}>
                  Nenhuma equipe encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AreaGerente;