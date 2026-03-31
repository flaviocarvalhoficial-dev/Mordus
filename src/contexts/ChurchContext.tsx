import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Organization = Database["public"]["Tables"]["organizations"]["Row"];

interface ChurchSettings {
  churchName: string;
  displayName: string;
  cnpj: string;
  socialMedia: {
    instagram: string;
    facebook: string;
    youtube: string;
    whatsapp: string;
  };
}

interface ChurchContextType {
  user: User | null;
  profile: Profile | null;
  organization: Organization | null;
  settings: ChurchSettings;
  updateSettings: (s: Partial<ChurchSettings>) => void;
  updateSocialMedia: (s: Partial<ChurchSettings["socialMedia"]>) => void;
  hasSeenOnboarding: boolean;
  setHasSeenOnboarding: (v: boolean) => void;
  loading: boolean;
  logout: () => Promise<void>;
  // Role helpers
  isAdmin: boolean;
  isTreasurer: boolean;
  isSecretary: boolean;
  isLeader: boolean;
  isViewer: boolean;
  canManageFinances: boolean;
  canManageSecretariat: boolean;
  canAccessSecretariat: boolean;
  canWrite: boolean;
}

const defaultSettings: ChurchSettings = {
  churchName: "Mordus Igreja",
  displayName: "Mordus",
  cnpj: "",
  socialMedia: { instagram: "", facebook: "", youtube: "", whatsapp: "" },
};

const ChurchContext = createContext<ChurchContextType | null>(null);

export function ChurchProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<ChurchSettings>(defaultSettings);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    return localStorage.getItem("onboarding-done") === "true";
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setOrganization(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      if (profileData.organization_id) {
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", profileData.organization_id)
          .single();

        if (orgError) throw orgError;
        setOrganization(orgData);

        // Map database columns to context settings
        setSettings({
          churchName: orgData.name,
          displayName: orgData.name,
          cnpj: (orgData as any).cnpj || "",
          socialMedia: {
            instagram: (orgData as any).instagram || "",
            facebook: (orgData as any).facebook || "",
            youtube: (orgData as any).youtube || "",
            whatsapp: (orgData as any).whatsapp || "",
          },
        });
      }
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem("onboarding-done", String(hasSeenOnboarding));
  }, [hasSeenOnboarding]);

  const updateSettings = async (partial: Partial<ChurchSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
    if (organization?.id) {
      await supabase.from("organizations").update({
        name: partial.churchName || settings.churchName,
        cnpj: partial.cnpj || settings.cnpj,
      }).eq("id", organization.id);
    }
  };

  const updateSocialMedia = async (partial: Partial<ChurchSettings["socialMedia"]>) => {
    const newSocial = { ...settings.socialMedia, ...partial };
    setSettings((prev) => ({ ...prev, socialMedia: newSocial }));
    if (organization?.id) {
      await supabase.from("organizations").update({
        instagram: newSocial.instagram,
        facebook: newSocial.facebook,
        youtube: newSocial.youtube,
        whatsapp: newSocial.whatsapp
      }).eq("id", organization.id);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = profile?.role === "admin";
  const isTreasurer = profile?.role === "treasurer";
  const isSecretary = profile?.role === "secretary";
  const isLeader = profile?.role === "leader";
  const isViewer = profile?.role === "viewer";

  const canManageFinances = isAdmin || isTreasurer;
  const canManageSecretariat = isAdmin || isSecretary;
  const canAccessSecretariat = canManageSecretariat || isLeader;
  const canWrite = !isViewer;

  return (
    <ChurchContext.Provider value={{
      user, profile, organization, settings, updateSettings,
      updateSocialMedia, hasSeenOnboarding, setHasSeenOnboarding,
      loading, logout,
      isAdmin, isTreasurer, isSecretary, isLeader, isViewer,
      canManageFinances, canManageSecretariat, canAccessSecretariat, canWrite
    }}>
      {children}
    </ChurchContext.Provider>
  );
}

export function useChurch() {
  const ctx = useContext(ChurchContext);
  if (!ctx) throw new Error("useChurch must be used within ChurchProvider");
  return ctx;
}
