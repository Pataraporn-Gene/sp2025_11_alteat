import React from "react";

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../component/Navbar";
import { useProfile } from "../context/ProfileContext";
import {
  Camera,
  User,
  ArrowLeft,
  Check,
  X,
  Pencil,
  Settings,
  LogOut,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "th", name: "ไทย" },
];

const CUISINES = [
  "Thai",
  "Italian",
  "Chinese",
  "Japanese",
  "Mexican",
  "Indian",
  "French",
  "Korean",
  "Vietnamese",
];

const SKILL_LEVELS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

export default function ProfilePage() {
  const { t } = useTranslation("profile");
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { profile, refreshProfile } = useProfile();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [languagePreference, setLanguagePreference] = useState("en");
  const [cuisinePreferences, setCuisinePreferences] = useState<string[]>([]);
  const [skillLevel, setSkillLevel] = useState("beginner");
  const [avoidIngredients, setAvoidIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");

  const [editingUsername, setEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const loadAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate("/login");
        return;
      }
      setEmail(data.user.email ?? "");
      setLoading(false);
    };
    loadAuth();
  }, [navigate]);

  useEffect(() => {
    if (profile) {
      if (profile.username) setTempUsername(profile.username);
      if (profile.languages?.length)
        setLanguagePreference(profile.languages[0]);
      if (profile.cuisine_preferences)
        setCuisinePreferences(profile.cuisine_preferences);
      if (profile.skill_level) setSkillLevel(profile.skill_level);
      if (profile.avoid_ingredients)
        setAvoidIngredients(profile.avoid_ingredients);
    }
  }, [profile]);

  // Track unsaved changes
  useEffect(() => {
    if (!profile) return;

    const hasChanges =
      languagePreference !== (profile.languages?.[0] || "en") ||
      JSON.stringify(cuisinePreferences) !== JSON.stringify(profile.cuisine_preferences || []) ||
      skillLevel !== (profile.skill_level || "beginner") ||
      JSON.stringify(avoidIngredients) !== JSON.stringify(profile.avoid_ingredients || []);

    setHasUnsavedChanges(hasChanges);
  }, [profile, languagePreference, cuisinePreferences, skillLevel, avoidIngredients]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: t("messages.imageTooLarge") });
      return;
    }

    try {
      setSaving(true);

      const ext = file.name.split(".").pop();
      const path = `${profile.id}/avatar.${ext}`;

      const { data: files, error: listError } = await supabase.storage
        .from("avatars")
        .list(profile.id);

      if (listError) throw listError;

      if (files && files.length > 0) {
        const paths = files.map((file) => `${profile.id}/${file.name}`);

        const { error: removeError } = await supabase.storage
          .from("avatars")
          .remove(paths);

        if (removeError) throw removeError;
      }

      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);

      const freshUrl = `${data.publicUrl}?t=${Date.now()}`;

      await supabase
        .from("profiles")
        .update({ avatar_url: freshUrl })
        .eq("id", profile.id);

      await refreshProfile();
      setMessage({ type: "success", text: t("messages.imageUpdated") });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleUsernameSave = async () => {
    if (!profile || !tempUsername.trim()) return;

    try {
      setSaving(true);

      await supabase
        .from("profiles")
        .update({ username: tempUsername })
        .eq("id", profile.id);

      await refreshProfile();
      setEditingUsername(false);
      setMessage({ type: "success", text: t("messages.usernameUpdated") });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    if (!profile) return;

    try {
      setSaving(true);

      await supabase
        .from("profiles")
        .update({
          languages: [languagePreference],
          cuisine_preferences: cuisinePreferences,
          skill_level: skillLevel,
          avoid_ingredients: avoidIngredients,
        })
        .eq("id", profile.id);

      await refreshProfile();
      setMessage({ type: "success", text: t("messages.preferencesSaved") });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const resetPreferences = () => {
    if (!profile) return;
    setLanguagePreference(profile.languages?.[0] || "en");
    setCuisinePreferences(profile.cuisine_preferences || []);
    setSkillLevel(profile.skill_level || "beginner");
    setAvoidIngredients(profile.avoid_ingredients || []);
  };

  const toggleCuisine = (cuisine: string) => {
    setCuisinePreferences((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine],
    );
  };

  const addIngredient = () => {
    if (
      newIngredient.trim() &&
      !avoidIngredients.includes(newIngredient.trim())
    ) {
      setAvoidIngredients((prev) => [...prev, newIngredient.trim()]);
      setNewIngredient("");
    }
  };

  const removeIngredient = (ingredient: string) => {
    setAvoidIngredients((prev) => prev.filter((i) => i !== ingredient));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleDeleteAccount = () => {
    if (!profile) return;
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    if (!profile) return;
    try {
      setSaving(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("Not authenticated");

      const res = await fetch(
        "https://yrpoikxovgaplilgwfys.supabase.co/functions/v1/delete-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({}),
        },
      );

      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      setShowDeleteConfirm(false);
      setShowDeleteSuccess(true);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
      setShowDeleteConfirm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleFinalExit = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
    window.location.reload();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FACE9B] via-[#FFBD9E] via-60% to-[#E6896D]">
          <div className="text-lg">{t("messages.loading")}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <button
        type="button"
        onClick={() => navigate("/")}
        className="fixed top-20 left-4 md:left-6 z-40 flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-md hover:bg-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">{t("actions.back")}</span>
      </button>

      <div className="min-h-screen bg-gradient-to-b from-[#FACE9B] via-[#FFBD9E] via-60% to-[#E6896D] py-8 px-4">
        <div className="max-w-4xl mx-auto pt-8">
          {/* Message Toast */}
          {message && (
            <div
              className={`fixed top-20 right-4 left-4 sm:left-auto z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <Check className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
              <span>{message.text}</span>
              <button
                type="button"
                onClick={() => setMessage(null)}
                className="ml-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Column - Profile Info */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <div className="w-32 h-32 rounded-full bg-[#FFF3DB] flex items-center justify-center overflow-hidden border-4 border-[#e48f75]">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url || "/placeholder.svg"}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-16 w-16 text-[#ce441a]" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={saving}
                      className="absolute bottom-0 right-0 bg-[#e48f75] rounded-full p-2.5 hover:bg-[#E6896D] transition-colors shadow-md disabled:opacity-50"
                    >
                      <Camera className="h-5 w-5 text-white" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>

                  {/* Username */}
                  <div className="text-center w-full">
                    {editingUsername ? (
                      <div className="flex items-center gap-2 justify-center">
                        <input
                          type="text"
                          value={tempUsername}
                          onChange={(e) => setTempUsername(e.target.value)}
                          className="border border-border rounded px-2 py-1 text-center"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleUsernameSave}
                          disabled={saving}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingUsername(false)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 justify-center">
                        <h2 className="text-xl font-bold text-foreground">
                          {profile?.username || t("fields.noUsername")}
                        </h2>
                        <button
                          type="button"
                          onClick={() => {
                            setTempUsername(profile?.username || "");
                            setEditingUsername(true);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <p className="text-muted-foreground text-sm mt-1">
                      {email}
                    </p>
                  </div>
                </div>

                {/* Sign Out Button */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full mt-6 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  {t("actions.signOut")}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-gray-400">
                      {t("delete.dangerZone", "Danger Zone")}
                    </span>
                  </div>
                </div>

                {/* Delete Account Button */}
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
                >
                  <Trash2 className="h-4 w-4" />
                  {t("delete.button")}
                </button>
              </div>
            </div>

            {/* Right Column - Settings */}
            <div className="md:col-span-2 space-y-6">
              {/* Preferences Section */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-[#ce441a]" />
                    <h3 className="text-lg font-semibold">
                      {t("sections.preferences")}
                    </h3>
                    {hasUnsavedChanges && (
                      <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                        {t("preferences.unsavedChanges", "Unsaved changes")}
                      </span>
                    )}
                  </div>
                  {hasUnsavedChanges && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={savePreferences}
                        disabled={saving}
                        className="p-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        title={t("actions.save")}
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={resetPreferences}
                        disabled={saving}
                        className="p-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        title={t("actions.cancel", "Cancel")}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  {/* Language Preference */}
                  <div>
                    <label
                      htmlFor="language"
                      className="block text-sm font-medium mb-2"
                    >
                      {t("preferences.language")}
                    </label>
                    <select
                      id="language"
                      value={languagePreference}
                      onChange={(e) => setLanguagePreference(e.target.value)}
                      className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e48f75]"
                    >
                      {LANGUAGES.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cuisine Preferences */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("preferences.cuisine")}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CUISINES.map((cuisine) => (
                        <button
                          key={cuisine}
                          type="button"
                          onClick={() => toggleCuisine(cuisine)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                            cuisinePreferences.includes(cuisine)
                              ? "bg-[#e48f75] text-white"
                              : "bg-[#FFF3DB] text-foreground hover:bg-[#FBB496]"
                          }`}
                        >
                          {t(`cuisines.${cuisine.toLowerCase()}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Skill Level */}
                  <div>
                    <label
                      htmlFor="skill"
                      className="block text-sm font-medium mb-2"
                    >
                      {t("preferences.skillLevel")}
                    </label>
                    <select
                      id="skill"
                      value={skillLevel}
                      onChange={(e) => setSkillLevel(e.target.value)}
                      className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#e48f75]"
                    >
                      {SKILL_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>
                          {t(`skillLevels.${level.value}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Avoid Ingredients */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("preferences.avoidIngredients")}
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newIngredient}
                        onChange={(e) => setNewIngredient(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addIngredient()}
                        placeholder={t("preferences.addIngredient")}
                        className="flex-1 min-w-0 border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#e48f75]"
                      />
                      <button
                        type="button"
                        onClick={addIngredient}
                        className="bg-[#e48f75] text-white px-4 py-2 rounded-lg hover:bg-[#E6896D] transition-colors shrink-0"
                      >
                        {t("preferences.add")}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {avoidIngredients.map((ingredient) => (
                        <span
                          key={ingredient}
                          className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                        >
                          {ingredient}
                          <button
                            type="button"
                            onClick={() => removeIngredient(ingredient)}
                            className="hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all">
            <h3 className="text-lg font-semibold mb-4 border-b border-gray-200 pb-2">
              {t("delete.title")}
            </h3>
            <p className="text-gray-600 text-sm mb-6">{t("delete.message")}</p>
            <div className="flex justify-start gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 rounded-lg transition-colors"
              >
                {t("delete.cancel")}
              </button>
              <button
                onClick={confirmDeleteAccount}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                {t("delete.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showDeleteSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all text-center relative">
            <button
              onClick={handleFinalExit}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
             <h3 className="text-xl font-bold mb-2 text-gray-800">
              {t("delete.successTitle")}
            </h3>
            <p className="text-gray-600 mb-6">{t("delete.successMessage")}</p>
          </div>
        </div>
      )}
    </>
  );
}
