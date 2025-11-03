import { useState, useEffect, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

export type OrganizationPosting = {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  location: string;
  type: "online" | "in-person";
  category: string;
  duration: string;
  dates?: string;
  startTime?: string;
  website?: string;
  images?: string[];
  organizerName: string;
  companyName: string;
  postedDate: string;
};

export type Organization = {
  id: string;
  name: string;
  logo?: string;
  description: string;
  ownerId: string;
  createdDate: string;
  postings: OrganizationPosting[];
};

const ORGANIZATIONS_STORAGE_KEY = "@voltra_organizations";

export const [OrganizationProvider, useOrganizations] = createContextHook(() => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const storedOrgs = await AsyncStorage.getItem(ORGANIZATIONS_STORAGE_KEY);
      if (storedOrgs) {
        setOrganizations(JSON.parse(storedOrgs));
      }
    } catch (error) {
      console.error("Failed to load organizations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveOrganizations = async (orgs: Organization[]) => {
    try {
      await AsyncStorage.setItem(ORGANIZATIONS_STORAGE_KEY, JSON.stringify(orgs));
    } catch (error) {
      console.error("Failed to save organizations:", error);
    }
  };

  const createOrganization = useCallback(
    async (data: { name: string; logo?: string; description: string; ownerId: string }) => {
      try {
        const newOrg: Organization = {
          id: Date.now().toString(),
          name: data.name,
          logo: data.logo,
          description: data.description,
          ownerId: data.ownerId,
          createdDate: new Date().toISOString(),
          postings: [],
        };

        const updatedOrgs = [...organizations, newOrg];
        setOrganizations(updatedOrgs);
        await saveOrganizations(updatedOrgs);
        console.log("Organization created:", newOrg);
        return newOrg;
      } catch (error) {
        console.error("Failed to create organization:", error);
        throw error;
      }
    },
    [organizations]
  );

  const updateOrganization = useCallback(
    async (orgId: string, updates: Partial<Organization>) => {
      try {
        const updatedOrgs = organizations.map((org) =>
          org.id === orgId ? { ...org, ...updates } : org
        );
        setOrganizations(updatedOrgs);
        await saveOrganizations(updatedOrgs);
        console.log("Organization updated:", orgId);
      } catch (error) {
        console.error("Failed to update organization:", error);
        throw error;
      }
    },
    [organizations]
  );

  const deleteOrganization = useCallback(
    async (orgId: string) => {
      try {
        const updatedOrgs = organizations.filter((org) => org.id !== orgId);
        setOrganizations(updatedOrgs);
        await saveOrganizations(updatedOrgs);
        console.log("Organization deleted:", orgId);
      } catch (error) {
        console.error("Failed to delete organization:", error);
        throw error;
      }
    },
    [organizations]
  );

  const addPosting = useCallback(
    async (
      organizationId: string,
      posting: Omit<OrganizationPosting, "id" | "postedDate" | "organizationId">
    ) => {
      try {
        const newPosting: OrganizationPosting = {
          ...posting,
          id: Date.now().toString(),
          organizationId,
          postedDate: new Date().toISOString(),
        };

        const updatedOrgs = organizations.map((org) => {
          if (org.id === organizationId) {
            return { ...org, postings: [...org.postings, newPosting] };
          }
          return org;
        });

        setOrganizations(updatedOrgs);
        await saveOrganizations(updatedOrgs);
        console.log("Posting added:", newPosting);
        return newPosting;
      } catch (error) {
        console.error("Failed to add posting:", error);
        throw error;
      }
    },
    [organizations]
  );

  const updatePosting = useCallback(
    async (
      organizationId: string,
      postingId: string,
      updates: Partial<OrganizationPosting>
    ) => {
      try {
        const updatedOrgs = organizations.map((org) => {
          if (org.id === organizationId) {
            return {
              ...org,
              postings: org.postings.map((p) =>
                p.id === postingId ? { ...p, ...updates } : p
              ),
            };
          }
          return org;
        });

        setOrganizations(updatedOrgs);
        await saveOrganizations(updatedOrgs);
        console.log("Posting updated:", postingId);
      } catch (error) {
        console.error("Failed to update posting:", error);
        throw error;
      }
    },
    [organizations]
  );

  const deletePosting = useCallback(
    async (organizationId: string, postingId: string) => {
      try {
        const updatedOrgs = organizations.map((org) => {
          if (org.id === organizationId) {
            return {
              ...org,
              postings: org.postings.filter((p) => p.id !== postingId),
            };
          }
          return org;
        });

        setOrganizations(updatedOrgs);
        await saveOrganizations(updatedOrgs);
        console.log("Posting deleted:", postingId);
      } catch (error) {
        console.error("Failed to delete posting:", error);
        throw error;
      }
    },
    [organizations]
  );

  const getUserOrganizations = useCallback(
    (userId: string) => {
      return organizations.filter((org) => org.ownerId === userId);
    },
    [organizations]
  );

  const getAllPostings = useCallback(() => {
    const allPostings: (OrganizationPosting & { organization: Organization })[] = [];
    organizations.forEach((org) => {
      org.postings.forEach((posting) => {
        allPostings.push({ ...posting, organization: org });
      });
    });
    return allPostings.sort(
      (a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
    );
  }, [organizations]);

  const clearAllData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ORGANIZATIONS_STORAGE_KEY);
      setOrganizations([]);
      console.log("All organizations and postings cleared");
    } catch (error) {
      console.error("Failed to clear organizations:", error);
      throw error;
    }
  }, []);

  const reloadOrganizations = useCallback(async () => {
    setIsLoading(true);
    await loadOrganizations();
  }, []);

  return useMemo(
    () => ({
      organizations,
      isLoading,
      createOrganization,
      updateOrganization,
      deleteOrganization,
      addPosting,
      updatePosting,
      deletePosting,
      getUserOrganizations,
      getAllPostings,
      clearAllData,
      reloadOrganizations,
    }),
    [
      organizations,
      isLoading,
      createOrganization,
      updateOrganization,
      deleteOrganization,
      addPosting,
      updatePosting,
      deletePosting,
      getUserOrganizations,
      getAllPostings,
      clearAllData,
      reloadOrganizations,
    ]
  );
});
