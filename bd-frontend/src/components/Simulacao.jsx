import { useState } from 'react';
import { API_BASE } from '../api';

function Simulacao() {
  const [ticker, setTicker] = useState('');
  const [valorInicial, setValorInicial] = useState('');
  const [meses, setMeses] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');

  const handleSimular = async (e) => {
    e.preventDefault();
    setErro('');
    setResultado(null);

    try {
      const response = await fetch(`${API_BASE}/simulacao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: ticker.toUpperCase(),
          valor_inicial: parseFloat(valorInicial),
          meses: parseInt(meses)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro na simulação');
      }

      const data = await response.json();
      setResultado(data);
    } catch (err) {
      setErro(err.message);
    }
  };

  return (
    <div className="p-4 border rounded shadow-md bg-white mt-4">
      <h2 className="text-xl font-bold mb-4">Simulação de Rendimentos (FIIs)</h2>

      <form onSubmit={handleSimular} className="flex gap-2 items-end flex-wrap">
        <div>
          <label className="block text-sm font-medium">Ticker (Ex: FII01)</label>
          <input
            type="text"
            value={ticker}
            onChange={e => setTicker(e.target.value)}
            className="border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Valor Inicial (R$)</label>
          <input
            type="number"
            value={valorInicial}
            onChange={e => setValorInicial(e.target.value)}
            className="border p-2 rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Meses</label>
          <input
            type="number"
            value={meses}
            onChange={e => setMeses(e.target.value)}
            className="border p-2 rounded"
            required
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Simular
        </button>
      </form>

      {erro && <p className="text-red-500 mt-2">{erro}</p>}

      {resultado && (
        <div className="mt-4 p-3 bg-green-50 rounded">
          <p><strong>Resultado Estimado:</strong></p>
          <ul className="list-disc pl-5">
            <li>Valor Final: R$ {resultado.valor_final_estimado}</li>
            <li>Rentabilidade Total: {resultado.rentabilidade_total_percentual}%</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default Simulacao;