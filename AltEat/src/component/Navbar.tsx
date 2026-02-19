import { Link, useNavigate } from "react-router-dom";
import { Heart, User } from "lucide-react";
import { useProfile } from "../context/ProfileContext";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

import logo from "../assets/logo.png";

function Navbar() {
  const navigate = useNavigate();
  const { t } = useTranslation('navbar');
  const { profile } = useProfile();
  const isLoggedIn = !!profile;

  const handleUserClick = () => {
    if (isLoggedIn) {
      navigate("/profile");
    } else {
      navigate("/login");
    }
  };

  return (
    <nav className="sticky top-0 z-50">
      <div className="h-16 bg-[#FFF3DB] flex justify-between px-8">
        <div className="max-w-40 flex items-center">
          <Link to="/" className="cursor-pointer">
            <img src={logo} alt="Logo" />
          </Link>
        </div>
        
        <div className="flex items-center text-[20px] gap-10">
          <Link to="/aboutus" className="cursor-pointer hover:text-[#ce441a] transition-colors duration-200">
            {t('aboutUs')}
          </Link>
          <Link to="/recipesearch" className="cursor-pointer hover:text-[#ce441a] transition-colors duration-200">
            {t('recipes')}
          </Link>
          <Link to="/ingredientsearch" className="cursor-pointer hover:text-[#ce441a] transition-colors duration-200">
            {t('ingredients')}
          </Link>

          <div className="flex gap-5 items-center">
            <Link to="/chatbot">
              <button className="bg-[#FBB496] hover:bg-[#f99970] h-11 px-5 rounded-[10px] cursor-pointer flex items-center justify-center gap-2 transition-all duration-200">
                <span>{t('chatbot')}</span>
              </button>
            </Link>

            <Link to="/favorite">
              <Heart className="h-8 w-8 text-[#ce441a] fill-current cursor-pointer hover:scale-110 hover:brightness-110 transition-transform duration-200" />
            </Link>

            <button
              type="button"
              onClick={handleUserClick}
              className="cursor-pointer"
            >
              {isLoggedIn && profile?.avatar_url ? (
                <img
                  src={profile.avatar_url || "/placeholder.svg"}
                  alt="Profile"
                  className="h-9 w-9 lg:h-10 lg:w-10 rounded-full object-cover border-2 border-[#e48f75]"
                />
              ) : (
                <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-[#FBB496] flex items-center justify-center">
                  <User className="h-5 w-5 lg:h-6 lg:w-6 text-[#ce441a]" />
                </div>
              )}
            </button>

            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;