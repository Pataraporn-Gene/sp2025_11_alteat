import { Link, useNavigate } from "react-router-dom";
import { Heart, User, Menu, X } from "lucide-react"; 
import { useProfile } from "../context/ProfileContext";
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { useState } from "react"; 
import logo from "../assets/logo.png";

function Navbar() {
  const navigate = useNavigate();
  const { t } = useTranslation('navbar');
  const { profile } = useProfile();
  const isLoggedIn = !!profile;
  const [menuOpen, setMenuOpen] = useState(false);

  const handleUserClick = () => {
    if (isLoggedIn) {
      navigate("/profile");
    } else {
      navigate("/login");
    }
  };

  return (
    <nav className="sticky top-0 z-50">
      {/* Main bar */}
      <div className="h-16 bg-[#FFF3DB] flex justify-between items-center px-4 sm:px-8">
        
        {/* Logo */}
        <div className="max-w-40 flex items-center">
          <Link to="/" className="cursor-pointer">
            <img src={logo} alt="Logo" />
          </Link>
        </div>

        {/* Desktop links — hidden on mobile */}
        <div className="hidden md:flex items-center text-[20px] gap-10">
          <Link to="/aboutus" className="hover:text-[#ce441a] transition-colors duration-200">
            {t('aboutUs')}
          </Link>
          <Link to="/recipesearch" className="hover:text-[#ce441a] transition-colors duration-200">
            {t('recipes')}
          </Link>
          <Link to="/ingredientsearch" className="hover:text-[#ce441a] transition-colors duration-200">
            {t('ingredients')}
          </Link>

          <div className="flex gap-5 items-center">
            <Link to="/chatbot">
              <button className="bg-[#FBB496] hover:bg-[#f99970] h-11 px-5 rounded-[10px] cursor-pointer flex items-center justify-center gap-2 transition-all duration-200">
                <span>{t('chatbot')}</span>
              </button>
            </Link>

            <Link to="/favorite">
              <Heart className="h-8 w-8 text-[#ce441a] fill-current cursor-pointer hover:scale-110 transition-transform duration-200" />
            </Link>

            <button type="button" onClick={handleUserClick} className="cursor-pointer">
              {isLoggedIn && profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
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

        {/* Mobile right side — icons + hamburger */}
        <div className="flex md:hidden items-center gap-4">
          <Link to="/favorite">
            <Heart className="h-6 w-6 text-[#ce441a] fill-current" />
          </Link>
          <button type="button" onClick={handleUserClick}>
            {isLoggedIn && profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover border-2 border-[#e48f75]"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-[#FBB496] flex items-center justify-center">
                <User className="h-5 w-5 text-[#ce441a]" />
              </div>
            )}
          </button>
          {/* Hamburger button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="cursor-pointer">
            {menuOpen
              ? <X className="h-6 w-6 text-[#ce441a]" />
              : <Menu className="h-6 w-6 text-[#ce441a]" />
            }
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#FFF3DB] border-t border-[#f0d9a0] flex flex-col px-6 py-4 gap-4 text-[18px]">
          <Link to="/aboutus" onClick={() => setMenuOpen(false)} className="hover:text-[#ce441a] transition-colors">
            {t('aboutUs')}
          </Link>
          <Link to="/recipesearch" onClick={() => setMenuOpen(false)} className="hover:text-[#ce441a] transition-colors">
            {t('recipes')}
          </Link>
          <Link to="/ingredientsearch" onClick={() => setMenuOpen(false)} className="hover:text-[#ce441a] transition-colors">
            {t('ingredients')}
          </Link>
          <Link to="/chatbot" onClick={() => setMenuOpen(false)}>
              {t('chatbot')}
          </Link>
          <div className="pt-1">
            <LanguageSwitcher />
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;