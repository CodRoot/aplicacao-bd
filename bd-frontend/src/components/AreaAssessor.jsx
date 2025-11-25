import { useState, useEffect } from 'react';
import { API_BASE } from '../api';

function AreaAssessor({ cpf }) {
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/assessor/${cpf}/clientes`)
      .then(res => res.json())
      .then(data => setClientes(data))
      .catch(err => console.error("Erro:", err));
  }, [cpf]);

  // Estilos "inline" para garantir que funcione sem instalar nada extra
  const styles = {
    container: {
      padding: '20px',
      backgroundColor: '#f3f4f6', // Fundo cinza claro
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
      backgroundColor: '#e0f2fe', // Azul bem claro
      padding: '20px',
      borderBottom: '1px solid #ddd',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      color: '#075985', // Azul escuro
      margin: 0,
      fontSize: '24px'
    },
    tag: {
      backgroundColor: '#0ea5e9',
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
    },
    moneyGreen: { color: 'green', fontWeight: 'bold' },
    moneyBlue: { color: 'blue', fontWeight: 'bold' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Painel do Assessor</h2>
            <small>Gerenciamento de Carteira</small>
          </div>
          <span style={styles.tag}>CPF: {cpf}</span>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Cliente</th>
              <th style={styles.th}>CPF</th>
              <th style={styles.th}>Saldo</th>
              <th style={styles.th}>Investido</th>
              <th style={styles.th}>Patrimônio Total</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map((cli) => (
              <tr key={cli.cpf_cliente}>
                <td style={styles.td}>{cli.nome_cliente}</td>
                <td style={styles.td}>{cli.cpf_cliente}</td>
                <td style={styles.td}>
                  <span style={styles.moneyGreen}>
                    {Number(cli.saldo_disponivel).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </td>
                <td style={styles.td}>
                   <span style={styles.moneyBlue}>
                    {Number(cli.valor_investido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                   </span>
                </td>
                <td style={styles.td}>
                  <strong>
                    {Number(cli.patrimonio_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </strong>
                </td>
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan="5" style={{...styles.td, textAlign: 'center', padding: '30px'}}>
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AreaAssessor;