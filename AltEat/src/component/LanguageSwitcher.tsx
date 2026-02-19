import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => changeLanguage('th')}
        className={`cursor-pointer ${
          i18n.language === 'th' ? 'font-bold text-[#ce441a]' : ''
        }`}
      >
        TH
      </button>
      <p>/</p>
      <button
        onClick={() => changeLanguage('en')}
        className={`cursor-pointer ${
          i18n.language === 'en' ? 'font-bold text-[#ce441a]' : ''
        }`}
      >
        EN
      </button>
    </div>
  );
}