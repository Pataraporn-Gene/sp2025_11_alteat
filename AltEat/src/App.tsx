// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import RecipeDetailPage from "./pages/RecipeDetailPage";
import FavoritePage from "./pages/FavoritePage";
import ChatbotPage from "./pages/ChatbotPage";
import RecipeSearchPage from "./pages/RecipeSearchPage";
import IngredientSearchpage from "./pages/IngredientSearchPage";
import AboutUspage from "./pages/AboutUsPage";
import ScrollToTop from "./component/ScrollToTop";
import SignUpPage from "./pages/SignUpPage";
import SignupSuccess from "./pages/SignUpSuccessPage";
import Profile from "./pages/ProfilePage";
import Login from "./pages/LoginPage";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/recipe/:id" element={<RecipeDetailPage />} />
        <Route path="/favorite" element={<FavoritePage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/recipesearch" element={<RecipeSearchPage />} />
        <Route path="/ingredientsearch" element={<IngredientSearchpage />} />
        <Route path="/aboutus" element={<AboutUspage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/signupsuccess" element={<SignupSuccess />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
