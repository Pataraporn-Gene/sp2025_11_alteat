import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../component/Navbar.tsx";
import { useTranslation } from 'react-i18next';

export default function SignUp() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (data) {
      setError("Username already taken");
      return;
    }


    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: "http://localhost:5173/profile",
        data: { username },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      navigate("/signupsuccess");
    }
  };

  return (
    <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-[#FACE9B] via-[#FFBD9E] via-60% to-[#E6896D]">
            <div className="bg-white p-8 rounded-xl w-full max-w-md shadow">
                <h1 className="text-2xl font-bold text-center mb-6">{t('signup.title')}</h1>

                <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    placeholder={t('signup.username')}
                    className="w-full border px-4 py-2 rounded"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />

                <input
                    placeholder={t('signup.email')}
                    type="email"
                    className="w-full border px-4 py-2 rounded"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    placeholder={t('signup.password')}
                    type="password"
                    className="w-full border px-4 py-2 rounded"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                    disabled={loading}
                    className="w-full bg-[#e48f75] text-white py-2 rounded hover:bg-[#E6896D]"
                >
                    {loading ? t('signup.signingUp') : t('signup.button')}
                </button>
                </form>

                {/*Login */}
                <p className="text-center text-sm mt-4">
                {t('signup.hasAccount')}{" "}
                <Link to="/login" className="text-[#ce441a] font-medium">
                    {t('signup.loginLink')}
                </Link>
                </p>
            </div>
        </div>
    </>
    
  );
}
