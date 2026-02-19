import { useNavigate } from "react-router-dom";
import Navbar from "../component/Navbar.tsx";
import { useTranslation } from 'react-i18next';

function SignupSuccess() {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');

  return (
    <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-[#FACE9B] via-[#FFBD9E] via-60% to-[#E6896D]">
        <div className="bg-white p-8 rounded-xl shadow text-center max-w-md">
            <h1 className="text-2xl font-bold text-[#ce441a] mb-4">
            {t('success.title')}
            </h1>

            <p className="text-gray-600">
            {t('success.message')}
            </p>

            <p className="text-sm text-gray-400 mt-4">
            {t('success.subtitle')}
            </p>

            <button
            onClick={() => navigate("/")}
            className="mt-6 w-full bg-[#e48f75] text-white py-2 rounded hover:bg-[#E6896D] transition"
            >
            {t('success.button')}
            </button>
        </div>
        </div>
    </>
  );
}

export default SignupSuccess;
