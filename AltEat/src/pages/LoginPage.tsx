import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../component/Navbar.tsx";
import { MessageCircle, Lock } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { t } = useTranslation('auth');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirect = searchParams.get("redirect");
  const message = searchParams.get("message");
  const fromChatbot = redirect === "/chatbot" || message;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      // Redirect to the intended page with message if available
      if (redirect && message) {
        navigate(`${redirect}?message=${encodeURIComponent(message)}`);
      } else if (redirect) {
        navigate(redirect);
      } else {
        navigate("/profile");
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-[#FACE9B] via-[#FFBD9E] via-60% to-[#E6896D] px-4">
        <div className="bg-white p-8 rounded-xl shadow w-full max-w-md">
          {/* Chatbot Redirect Notice */}
          {fromChatbot && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    {t('chatbotNotice.title')}
                  </h3>
                  <p className="text-xs text-blue-700">
                    {t('chatbotNotice.message')}
                  </p>
                  {message && (
                    <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">{t('chatbotNotice.yourMessage')}</p>
                      <p className="text-xs text-gray-800 italic">"{message}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <h1 className="text-2xl font-bold text-center mb-6">{t('login.title')}</h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder={t('login.email')}
              className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder={t('login.password')}
              className="w-full border px-4 py-2 rounded focus:outline-none focus:ring-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#e48f75] text-white py-2 rounded hover:bg-[#E6896D] transition disabled:opacity-50"
            >
              {loading ? t('login.loggingIn') : fromChatbot ? t('login.loginAndContinue') : t('login.button')}
            </button>
          </form>

          {/*Sign Up */}
          <p className="text-center text-sm mt-4">
            {t('login.noAccount')}{" "}
            <Link 
              to={redirect && message ? `/signup?redirect=${redirect}&message=${encodeURIComponent(message)}` : "/signup"} 
              className="text-[#ce441a] font-medium"
            >
              {t('login.signupLink')}
            </Link>
          </p>

          {/* Feature Notice */}
          {fromChatbot && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Lock className="w-4 h-4" />
                <span>{t('chatbotNotice.privacy')}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}