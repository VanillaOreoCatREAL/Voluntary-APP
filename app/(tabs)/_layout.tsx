import { Tabs } from "expo-router";
import { Home, Search, User, Building2 } from "lucide-react-native";
import React from "react";

import Colors from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";
import { useOrganizations } from "@/contexts/OrganizationContext";

export default function TabLayout() {
  const { user } = useUser();
  const { getUserOrganizations } = useOrganizations();
  const userOrganizations = user ? getUserOrganizations(user.email) : [];
  const hasOrganization = user?.accountType === "organization" && userOrganizations.length > 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.light.cardBackground,
          borderTopColor: Colors.light.border,
          borderTopWidth: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="opportunities"
        options={{
          title: "Opportunities",
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="organizations"
        options={{
          title: "Organizations",
          tabBarIcon: ({ color, size }) => (
            <Building2 size={size} color={color} />
          ),
          href: hasOrganization ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
