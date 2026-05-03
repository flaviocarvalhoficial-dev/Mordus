import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
  reminderDays: number;
}

interface ChurchContextType {
  user: User | null;
  profile: Profile | null;
  organization: Organization | null;
  settings: ChurchSettings;
  updateSettings: (s: Partial<ChurchSettings>) => Promise<void>;
  updateSocialMedia: (s: Partial<ChurchSettings["socialMedia"]>) => Promise<void>;
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
  refreshOrganization: () => Promise<void>;
}

const defaultSettings: ChurchSettings = {
  churchName: "Mordus Igreja",
  displayName: "Mordus",
  cnpj: "",
  socialMedia: { instagram: "", facebook: "", youtube: "", whatsapp: "" },
  reminderDays: 3,
};

const ChurchContext = createContext<ChurchContextType | null>(null);

export function ChurchProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(() => {
    return localStorage.getItem("onboarding-done") === "true";
  });

  useEffect(() => {
    localStorage.setItem("onboarding-done", String(hasSeenOnboarding));
  }, [hasSeenOnboarding]);

  // Auth Sync
  useEffect(() => {
    // Attempt to restore session; if the refresh token is invalid, clear it silently
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Corrupt / expired session — wipe storage so Supabase stops retrying
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("sb-")) localStorage.removeItem(key);
        });
        setUser(null);
      } else {
        setUser(session?.user ?? null);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // TOKEN_REFRESHED failure surfaces as SIGNED_OUT with no session
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        queryClient.clear();
        // Clear any stale Supabase keys to prevent repeated 401/429 retries
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("sb-")) localStorage.removeItem(key);
        });
      } else {
        setUser(session.user);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  // Profile Query
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
  });

  // Organization Query
  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ["organization", profile?.organization_id],
    queryFn: async () => {
      if (!profile?.organization_id) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.organization_id)
        .single();
      if (error) throw error;
      return data as Organization;
    },
    enabled: !!profile?.organization_id,
    staleTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
  });

  const settings = useMemo(() => {
    if (!organization) return defaultSettings;
    return {
      churchName: organization.name,
      displayName: organization.name,
      cnpj: (organization as any).cnpj || "",
      socialMedia: {
        instagram: (organization as any).instagram || "",
        facebook: (organization as any).facebook || "",
        youtube: (organization as any).youtube || "",
        whatsapp: (organization as any).whatsapp || "",
      },
      reminderDays: (organization as any).reminder_days ?? 3,
    };
  }, [organization]);

  const updateSettings = async (partial: Partial<ChurchSettings>) => {
    if (organization?.id) {
      const { error } = await supabase.from("organizations").update({
        name: partial.churchName || settings.churchName,
        cnpj: partial.cnpj || settings.cnpj,
      }).eq("id", organization.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    }
  };

  const updateSocialMedia = async (partial: Partial<ChurchSettings["socialMedia"]>) => {
    const newSocial = { ...settings.socialMedia, ...partial };
    if (organization?.id) {
      const { error } = await supabase.from("organizations").update({
        instagram: newSocial.instagram,
        facebook: newSocial.facebook,
        youtube: newSocial.youtube,
        whatsapp: newSocial.whatsapp
      }).eq("id", organization.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  };

  const isAdmin = profile?.role === "admin";
  const isTreasurer = profile?.role === "treasurer";
  const isSecretary = profile?.role === "secretary";
  const isLeader = profile?.role === "leader";
  const isViewer = profile?.role === "viewer";

  // If profile hasn't loaded a role yet, default to full access (avoid blank sidebar)
  const hasRole = !!profile?.role;
  const canManageFinances = !hasRole || isAdmin || isTreasurer;
  const canManageSecretariat = !hasRole || isAdmin || isSecretary;
  const canAccessSecretariat = !hasRole || canManageSecretariat || isLeader;
  const canWrite = !isViewer;

  const loading = authLoading || (!!user && profileLoading);

  return (
    <ChurchContext.Provider value={{
      user, profile: profile || null, organization: organization || null, settings, updateSettings,
      updateSocialMedia, hasSeenOnboarding, setHasSeenOnboarding,
      loading, logout,
      isAdmin, isTreasurer, isSecretary, isLeader, isViewer,
      canManageFinances, canManageSecretariat, canAccessSecretariat, canWrite,
      refreshOrganization: async () => {
        await queryClient.invalidateQueries({ queryKey: ["profile"] });
        await queryClient.invalidateQueries({ queryKey: ["organization"] });
      }
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

