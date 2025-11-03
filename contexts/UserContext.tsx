import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

type UserAccount = {
  email: string;
  password: string;
  fullName: string;
  interests: string[];
  accountType: "volunteer" | "organization";
  organizationName?: string;
  profileImage?: string;
  bio?: string;
};

const ACCOUNTS_STORAGE_KEY = "@voltra_accounts";

export type VolunteerPosting = {
  id: string;
  title: string;
  description: string;
  location: string;
  type: "remote" | "in-person" | "hybrid";
  category: string;
  requirements: string[];
  duration: string;
  postedDate: string;
};

export type User = {
  email: string;
  fullName: string;
  interests: string[];
  profileImage?: string;
  bio?: string;
  accountType: "volunteer" | "organization";
  organizationName?: string;
  postings?: VolunteerPosting[];
};

const USER_STORAGE_KEY = "@voltra_user";

const updateAccountInStorage = async (email: string, updates: Partial<User>) => {
  try {
    const stored = await AsyncStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (stored) {
      const accounts: UserAccount[] = JSON.parse(stored);
      const accountIndex = accounts.findIndex(acc => acc.email.toLowerCase() === email.toLowerCase());
      if (accountIndex !== -1) {
        accounts[accountIndex] = {
          ...accounts[accountIndex],
          ...updates,
          email: accounts[accountIndex].email,
          password: accounts[accountIndex].password,
        };
        await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
        console.log("Account updated in storage for:", email);
      }
    }
  } catch (error) {
    console.error("Failed to update account in storage:", error);
  }
};

export const [UserProvider, useUser] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (userData: User) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      console.log("User logged in:", userData);
    } catch (error) {
      console.error("Failed to save user:", error);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setUser(null);
      console.log("User logged out");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    try {
      setUser((currentUser) => {
        if (!currentUser) return currentUser;
        const updatedUser = { ...currentUser, ...updates } as User;
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        updateAccountInStorage(currentUser.email, updates);
        console.log("User updated:", updatedUser);
        return updatedUser;
      });
    } catch (error) {
      console.error("Failed to update user:", error);
      throw error;
    }
  }, []);

  const addPosting = useCallback(async (posting: Omit<VolunteerPosting, "id" | "postedDate">) => {
    try {
      const newPosting: VolunteerPosting = {
        ...posting,
        id: Date.now().toString(),
        postedDate: new Date().toISOString(),
      };
      setUser((currentUser) => {
        if (!currentUser) return currentUser;
        const postings = currentUser.postings || [];
        const updatedUser = { ...currentUser, postings: [...postings, newPosting] };
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        return updatedUser;
      });
      return newPosting;
    } catch (error) {
      console.error("Failed to add posting:", error);
      throw error;
    }
  }, []);

  const deletePosting = useCallback(async (postingId: string) => {
    try {
      setUser((currentUser) => {
        if (!currentUser) return currentUser;
        const postings = currentUser.postings || [];
        const updatedUser = { ...currentUser, postings: postings.filter((p) => p.id !== postingId) };
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        return updatedUser;
      });
    } catch (error) {
      console.error("Failed to delete posting:", error);
      throw error;
    }
  }, []);

  const updateInterests = useCallback(async (interests: string[]) => {
    await updateUser({ interests });
  }, [updateUser]);

  const clearAllData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ACCOUNTS_STORAGE_KEY);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
      setUser(null);
      console.log("All accounts and user data cleared");
    } catch (error) {
      console.error("Failed to clear accounts:", error);
      throw error;
    }
  }, []);

  return useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    updateUser,
    updateInterests,
    addPosting,
    deletePosting,
    clearAllData,
    isAuthenticated: user !== null,
  }), [user, isLoading, login, logout, updateUser, updateInterests, addPosting, deletePosting, clearAllData]);
});
