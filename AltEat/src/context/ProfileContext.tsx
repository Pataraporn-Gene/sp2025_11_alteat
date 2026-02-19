import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  languages: string[];
  cuisine_preferences: string[];
  skill_level: string;
  avoid_ingredients: string[];
}

interface ProfileContextType {
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);

  const refreshProfile = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setProfile(null);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, languages, cuisine_preferences, skill_level, avoid_ingredients")
      .eq("id", auth.user.id)
      .single();

    setProfile(data);
  };

  useEffect(() => {
    refreshProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      refreshProfile();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
};
