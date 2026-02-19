import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import English translations
import commonEN from '../locales/en/common.json';
import navbarEN from '../locales/en/navbar.json';
import homeEN from '../locales/en/home.json';
import recipeEN from '../locales/en/recipe.json';
import ingredientEN from '../locales/en/ingredient.json';
import chatbotEN from '../locales/en/chatbot.json';
import profileEN from '../locales/en/profile.json';
import authEN from '../locales/en/auth.json';
import aboutEN from '../locales/en/about.json';
import favoriteEN from '../locales/en/favorite.json';
import filterEN from '../locales/en/filter.json';

// Import Thai translations
import commonTH from '../locales/th/common.json';
import navbarTH from '../locales/th/navbar.json';
import homeTH from '../locales/th/home.json';
import recipeTH from '../locales/th/recipe.json';
import ingredientTH from '../locales/th/ingredient.json';
import chatbotTH from '../locales/th/chatbot.json';
import profileTH from '../locales/th/profile.json';
import authTH from '../locales/th/auth.json';
import aboutTH from '../locales/th/about.json';
import favoriteTH from '../locales/th/favorite.json';
import filterTH from '../locales/th/filter.json';


const resources = {
  en: {
    common: commonEN,
    navbar: navbarEN,
    home: homeEN,
    recipe: recipeEN,
    ingredient: ingredientEN,
    chatbot: chatbotEN,
    profile: profileEN,
    auth: authEN,
    about: aboutEN,
    favorite: favoriteEN,
    filter: filterEN,
  },
  th: {
    common: commonTH,
    navbar: navbarTH,
    home: homeTH,
    recipe: recipeTH,
    ingredient: ingredientTH,
    chatbot: chatbotTH,
    profile: profileTH,
    auth: authTH,
    about: aboutTH,
    favorite: favoriteTH,
    filter: filterTH,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;