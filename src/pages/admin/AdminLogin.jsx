import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";
import ErrorMessage from "../../components/shared/ErrorMessage";
import logoMark from "../../assets/logo-mark.png";

const AdminLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await loginAdmin(form);
      login(token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50 font-sans flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <img src={logoMark} alt="Orange International Spa" className="w-14 h-14 rounded-full object-cover border border-gold-500 mb-3" />
          <p className="font-display uppercase tracking-wide text-ink-900 text-sm">Orange International Spa</p>
          <p className="text-[10px] uppercase tracking-widest text-ink-600/60 mt-0.5">Admin</p>
        </div>

        <div className="bg-white border border-sand-200 rounded-2xl px-6 py-7 shadow-[0_10px_26px_rgba(60,40,20,0.08)]">
          <h1 className="font-display font-semibold text-xl text-ink-900 mb-5 text-center">Admin Login</h1>
          <ErrorMessage message={error} />
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border border-sand-200 rounded-lg px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-600/40 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border border-sand-200 rounded-lg px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-600/40 focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-espresso-950 text-gold-300 font-semibold py-2.5 rounded-lg disabled:opacity-50 hover:bg-espresso-800 transition-colors"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;