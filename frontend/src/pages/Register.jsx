import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card-brutal w-full max-w-md p-8">
      <h1 className="mb-1 text-2xl font-bold">Create account</h1>
      <p className="mb-6 text-sm text-gray-500">Join NeoStream today</p>

      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-semibold">Username</span>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="input-brutal" required />
      </label>

      <label className="mb-4 block">
        <span className="mb-1 block text-sm font-semibold">Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-brutal" required />
      </label>

      <label className="mb-6 block">
        <span className="mb-1 block text-sm font-semibold">Password</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-brutal" minLength={6} required />
      </label>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? 'Creating account...' : 'Register'}
      </button>

      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account? <Link to="/login" className="font-semibold underline">Sign in</Link>
      </p>
    </form>
  );
}
