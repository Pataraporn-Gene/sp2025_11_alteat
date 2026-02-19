import Navbar from "../component/Navbar.tsx";
import send from "../assets/send.png";
import circle from "../assets/circle.png";
import recipe from "../assets/recipe.png";
import context from "../assets/context.png";
import subs from "../assets/subs.png";
import RecipeCard from "../component/RecipeCard.tsx";
import { usePersonalizedRecommendations } from "../hooks/usePersonalizedRecommendations";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.tsx";
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';


function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation('home');
  
  const options = [
    {
      tool: t('tools.recipeSuggestion'),
      img: recipe,
      url: "/recipesearch",
    },
    {
      tool: t('tools.ingredientContext'),
      img: context,
      url: "/ingredientsearch",
    },
    {
      tool: t('tools.ingredientSubstitution'),
      img: subs,
      url: "/chatbot",
    },
  ];

  const { recipes: recommendedRecipes, loading: loadingRecipes } = usePersonalizedRecommendations(6);
  const [query, setQuery] = useState("");


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      navigate(`/chatbot?message=${encodeURIComponent(query.trim())}`);
    } else {
      navigate(`/login?redirect=/chatbot&message=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <>
      <div className="-z-10">
        <img
          src={circle}
          className="w-[750px] h-[750px] absolute -left-70 top-18"
        />
        <img
          src={circle}
          className="w-[350px] h-[350px] absolute -right-30 top-135"
        />
      </div>

      <div className="min-h-screen z-10 bg-linear-to-b from-[#FACE9B] via-[#FFBD9E] via-60% to-[#E6896D]">
        <div className="relative">
          <Navbar />

          <div className=" w-[60%] flex flex-col m-auto max-w-7xl">
            <div className="flex flex-col items-center my-18 gap-8">
              <h1 className="text-[64px]">{t('welcome')}</h1>
              <p className="text-[20px]">
                {t('subtitle')}
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col items-center gap-1">
                <input
                  type="text"
                  name="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="px-8 py-5 h-[50px] w-[820px] bg-white rounded-[20px] text-[16px] outline-[1.5px] shadow-[0_8px_4px_rgba(0,0,0,0.25)]"
                />{" "}
                <br />
                <button type="submit" className="cursor-pointer">
                  <div className="flex justify-center items-center h-[50px] w-[130px] gap-3 bg-[#FFE6DD] rounded-[30px] outline-[1.5px]">
                    <p className="text-[20px]">{t('send')}</p>
                    <img src={send} className="w-[26px]" />
                  </div>
                </button>
              </form>
            </div>

            <div className="flex flex-col items-center ">
              <h2 className="text-[32px] mb-14">{t('needSomethingElse')}</h2>
              <div className="w-full flex flex-col">
                <div className="grid grid-cols-3 gap-8">
                  {options.map((option) => (
                    <Link to={option.url} key={option.tool}>
                      <div className="bg-[#FFE6DD] rounded-2xl cursor-pointer flex flex-col">
                        <div className="mx-3.75 mt-3.75 text-center bg-white h-20 text-[20px] outline-[1.5px] outline-[#AA8484] rounded-[15px] flex justify-center items-center ">
                          <p>{option.tool}</p>
                        </div>
                        <div className="flex items-center justify-center">
                          <img
                            src={option.img}
                            alt={option.tool}
                            className="max-h-full max-w-full"
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <hr className="border-[#EDAE9B] border-t-4 mt-20 mb-16" />

            <div className="flex flex-col items-start">
              <h2 className="text-3xl mb-12">{t('recommendedRecipes')}</h2>
              {loadingRecipes ? (
                <p className="text-center text-gray-600">{t('common:loading')}</p>
              ) : (
                <RecipeCard recipes={recommendedRecipes} />
              )}
            </div>
            <hr className="border-[#EDAE9B] border-t-4 mt-20 mb-20" />
          </div>
        </div>
      </div>
    </>
  );
}

export default HomePage;