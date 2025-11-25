import { useState } from 'react';

function Login({ onLogin }) {
  const [cpf, setCpf] = useState('');
  const [perfil, setPerfil] = useState('cliente'); // cliente, assessor, gerente

  const handleSubmit = (e) => {
    e.preventDefault();

    onLogin({ cpf, perfil });
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">InvestPro Login</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">CPF</label>
            <input
              type="text"
              value={cpf}
              onChange={e => setCpf(e.target.value)}
              placeholder="Digite seu CPF"
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo de Acesso</label>
            <select
              value={perfil}
              onChange={e => setPerfil(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            >
              <option value="cliente">Cliente</option>
              <option value="assessor">Assessor</option>
              <option value="gerente">Gerente</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
          >
            Entrar
          </button>

          <div className="text-xs text-gray-500 mt-2">
            <p>CPFs de Teste:</p>
            <ul className="list-disc pl-4">
              <li>Cliente: 11111111111</li>
              <li>Assessor: 22222222222</li>
              <li>Gerente: 44444444444</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;