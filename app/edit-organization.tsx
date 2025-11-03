import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ImageIcon } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import Colors from "@/constants/colors";
import { useOrganizations } from "@/contexts/OrganizationContext";

const DEFAULT_LOGO = "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200";

export default function EditOrganizationScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { organizations, updateOrganization } = useOrganizations();
  
  const organization = organizations.find((org) => org.id === id);
  
  const [name, setName] = useState(organization?.name || "");
  const [logo, setLogo] = useState(organization?.logo || "");
  const [description, setDescription] = useState(organization?.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setLogo(organization.logo || "");
      setDescription(organization.description);
    }
  }, [organization]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setLogo(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (!id) {
      Alert.alert("Error", "Organization not found");
      return;
    }

    try {
      setIsSubmitting(true);
      await updateOrganization(id, { name, logo: logo || DEFAULT_LOGO, description });
      Alert.alert("Success", "Organization updated successfully");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Failed to update organization");
      console.error("Failed to update organization:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!organization) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: "Edit Organization",
            headerStyle: { backgroundColor: Colors.light.tint },
            headerTintColor: "#FFFFFF",
            headerTitleStyle: { fontWeight: "700" as const },
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Organization not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Edit Organization",
          headerStyle: { backgroundColor: Colors.light.tint },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontWeight: "700" as const },
        }}
      />
      
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.inputLabel}>Organization Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter organization name"
            placeholderTextColor={Colors.light.textSecondary}
          />

          <Text style={styles.inputLabel}>Logo</Text>
          <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
            {logo ? (
              <Image source={{ uri: logo }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <ImageIcon size={48} color={Colors.light.textSecondary} />
                <Text style={styles.imagePickerText}>Upload Logo</Text>
                <Text style={styles.imagePickerSubtext}>Tap to select an image</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your organization's mission and goals"
            placeholderTextColor={Colors.light.textSecondary}
            multiline
            numberOfLines={6}
          />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.textSecondary,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.light.text,
    marginBottom: 20,
    minHeight: 80,
  },
  textArea: {
    minHeight: 200,
    textAlignVertical: "top",
  },
  imagePickerButton: {
    marginBottom: 20,
  },
  imagePickerPlaceholder: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginTop: 12,
  },
  imagePickerSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 12,
    backgroundColor: Colors.light.cardBackground,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});
