import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  Image,
  Alert,
} from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LogOut, Mail, User, Edit2, Camera, X, Plus, Briefcase, MapPin, Clock, Trash2, Building, AlertTriangle } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";


import Colors from "@/constants/colors";
import { useUser, type VolunteerPosting } from "@/contexts/UserContext";
import { useOrganizations } from "@/contexts/OrganizationContext";

type EditMode = "name" | "email" | "interests" | "bio" | "createPosting" | "createOrganization" | null;

const VOLUNTEER_TYPES = [
  "Animal Care",
  "Community Service",
  "Disaster Relief",
  "Education & Tutoring",
  "Environmental Conservation",
  "Food Bank & Hunger Relief",
  "Healthcare Support",
  "Homeless Shelter Support",
  "Hospice & Senior Care",
  "International Development",
  "Mental Health Support",
  "Nonprofit Administration",
  "Sports & Recreation",
  "Technology & Digital Literacy",
  "Veterans Support",
  "Youth Mentoring",
  "Arts & Culture",
  "Crisis Counseling",
  "Legal Aid",
  "Fundraising",
];

const OPPORTUNITY_TYPES = ["remote", "in-person", "hybrid"] as const;
const CATEGORIES = [
  "Healthcare",
  "Education",
  "Technology",
  "Environment",
  "Community Service",
  "Animal Welfare",
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, updateUser, isAuthenticated, addPosting, deletePosting, clearAllData: clearAllUserData } = useUser();
  const { createOrganization, clearAllData: clearAllOrgData } = useOrganizations();
  const [showSignOutModal, setShowSignOutModal] = React.useState(false);
  const [editMode, setEditMode] = React.useState<EditMode>(null);
  
  const [editName, setEditName] = React.useState("");
  const [editEmail, setEditEmail] = React.useState("");
  const [editInterests, setEditInterests] = React.useState<string[]>([]);
  const [editBio, setEditBio] = React.useState("");
  const [newInterest, setNewInterest] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);

  const [postingTitle, setPostingTitle] = React.useState("");
  const [postingDescription, setPostingDescription] = React.useState("");
  const [postingLocation, setPostingLocation] = React.useState("");
  const [postingType, setPostingType] = React.useState<"remote" | "in-person" | "hybrid">("in-person");
  const [postingCategory, setPostingCategory] = React.useState(CATEGORIES[0]);
  const [postingDuration, setPostingDuration] = React.useState("");
  const [postingRequirements, setPostingRequirements] = React.useState<string[]>([]);
  const [currentRequirement, setCurrentRequirement] = React.useState("");

  const [orgName, setOrgName] = React.useState("");
  const [orgWebsite, setOrgWebsite] = React.useState("");
  const [orgDescription, setOrgDescription] = React.useState("");
  const [orgLogo, setOrgLogo] = React.useState("");


  const openEditModal = (mode: EditMode) => {
    if (mode === "name" && user) {
      setEditName(user.fullName);
    } else if (mode === "email" && user) {
      setEditEmail(user.email);
    } else if (mode === "interests" && user) {
      setEditInterests([...user.interests]);
    } else if (mode === "bio" && user) {
      setEditBio(user.bio || "");
    }
    setEditMode(mode);
  };

  const closeEditModal = () => {
    setEditMode(null);
    setEditName("");
    setEditEmail("");
    setEditInterests([]);
    setEditBio("");
    setNewInterest("");
    setSearchQuery("");
    setPostingTitle("");
    setPostingDescription("");
    setPostingLocation("");
    setPostingType("in-person");
    setPostingCategory(CATEGORIES[0]);
    setPostingDuration("");
    setPostingRequirements([]);
    setCurrentRequirement("");
    setOrgName("");
    setOrgWebsite("");
    setOrgDescription("");
    setOrgLogo("");
  };

  const handleSave = async () => {
    if (!user || isSaving) return;
    
    try {
      setIsSaving(true);
      
      if (editMode === "name") {
        if (!editName.trim()) {
          Alert.alert("Error", "Name cannot be empty");
          return;
        }
        await updateUser({ fullName: editName.trim() });
      } else if (editMode === "email") {
        if (!editEmail.trim()) {
          Alert.alert("Error", "Email cannot be empty");
          return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(editEmail.trim())) {
          Alert.alert("Error", "Please enter a valid email address");
          return;
        }
        await updateUser({ email: editEmail.trim() });
      } else if (editMode === "interests") {
        if (editInterests.length === 0) {
          Alert.alert("Error", "Please add at least one volunteer interest");
          return;
        }
        await updateUser({ interests: editInterests });
      } else if (editMode === "bio") {
        await updateUser({ bio: editBio.trim() });
      } else if (editMode === "createPosting") {
        if (!postingTitle.trim()) {
          Alert.alert("Error", "Title is required");
          return;
        }
        if (!postingDescription.trim()) {
          Alert.alert("Error", "Description is required");
          return;
        }
        if (!postingLocation.trim()) {
          Alert.alert("Error", "Location is required");
          return;
        }
        if (!postingDuration.trim()) {
          Alert.alert("Error", "Duration is required");
          return;
        }
        await addPosting({
          title: postingTitle.trim(),
          description: postingDescription.trim(),
          location: postingLocation.trim(),
          type: postingType,
          category: postingCategory,
          duration: postingDuration.trim(),
          requirements: postingRequirements,
        });
      } else if (editMode === "createOrganization") {
        if (!orgName.trim()) {
          Alert.alert("Error", "Organization name is required");
          return;
        }
        if (!orgDescription.trim()) {
          Alert.alert("Error", "Organization description is required");
          return;
        }
        await createOrganization({
          name: orgName.trim(),
          logo: orgLogo || "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200",
          description: orgDescription.trim(),
          ownerId: user.email,
        });
        await updateUser({ 
          accountType: "organization",
          organizationName: orgName.trim(),
        });
      }
      
      closeEditModal();
    } catch (error) {
      console.error("Failed to save:", error);
      Alert.alert("Error", "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInterest = () => {
    if (!newInterest.trim()) return;
    
    const trimmed = newInterest.trim();
    
    if (editInterests.includes(trimmed)) {
      Alert.alert("Duplicate", "This interest is already added");
      return;
    }
    
    if (VOLUNTEER_TYPES.some(type => type.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert("Already Available", "This interest is already in the list below. Please select it instead.");
      return;
    }
    
    setEditInterests([...editInterests, trimmed]);
    setNewInterest("");
  };

  const toggleInterest = (interest: string) => {
    if (editInterests.includes(interest)) {
      setEditInterests(editInterests.filter((i) => i !== interest));
    } else {
      setEditInterests([...editInterests, interest]);
    }
  };

  const handleRemoveInterest = (index: number) => {
    setEditInterests(editInterests.filter((_, i) => i !== index));
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant access to your photos to change profile picture");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images" as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      await updateUser({ profileImage: result.assets[0].uri });
    }
  };



  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!isAuthenticated || !user ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No profile yet</Text>
            <Text style={styles.emptyStateSubtext}>Create your profile to get started</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => router.push("/auth")}
            >
              <Text style={styles.createButtonText}>Create Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.profileHeader}>
              <TouchableOpacity 
                style={styles.avatarContainer}
                onPress={handlePickImage}
              >
                {user.profileImage ? (
                  <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={48} color={Colors.light.tint} />
                  </View>
                )}
                <View style={styles.cameraIconContainer}>
                  <Camera size={18} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              
              <View style={styles.nameContainer}>
                <Text style={styles.name}>{user.fullName}</Text>
                <TouchableOpacity 
                  style={styles.editIconButton}
                  onPress={() => openEditModal("name")}
                >
                  <Edit2 size={16} color={Colors.light.tint} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.emailContainer}>
                <Mail size={14} color={Colors.light.textSecondary} />
                <Text style={styles.email}>{user.email}</Text>
                <TouchableOpacity 
                  style={styles.editIconButton}
                  onPress={() => openEditModal("email")}
                >
                  <Edit2 size={14} color={Colors.light.tint} />
                </TouchableOpacity>
              </View>
            </View>

            {user.accountType !== "organization" && (
              <View style={styles.organizationBanner}>
                <View style={styles.organizationBannerIcon}>
                  <Building size={28} color={Colors.light.tint} />
                </View>
                <View style={styles.organizationBannerContent}>
                  <Text style={styles.organizationBannerTitle}>Have a Volunteering Organization?</Text>
                  <Text style={styles.organizationBannerSubtitle}>Create an organization account to post volunteer opportunities and manage your team</Text>
                  <TouchableOpacity 
                    style={styles.organizationBannerButton}
                    onPress={() => openEditModal("createOrganization")}
                  >
                    <Building size={16} color="#FFFFFF" />
                    <Text style={styles.organizationBannerButtonText}>Create Organization</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}



            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>About</Text>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => openEditModal("bio")}
                >
                  <Edit2 size={16} color={Colors.light.tint} />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.sectionCard}>
                {user.bio ? (
                  <Text style={styles.bioText}>{user.bio}</Text>
                ) : (
                  <Text style={styles.bioPlaceholder}>Tell people about yourself...</Text>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Volunteer Interests</Text>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => openEditModal("interests")}
                >
                  <Edit2 size={16} color={Colors.light.tint} />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.sectionCard}>
                <View style={styles.chipContainer}>
                  {user.interests.map((interest, index) => (
                    <View key={index} style={styles.chip}>
                      <Text style={styles.chipText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={() => setShowSignOutModal(true)}
            >
              <LogOut size={18} color="#FFFFFF" />
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>

            <Modal
              visible={showSignOutModal}
              transparent
              animationType="fade"
              onRequestClose={() => setShowSignOutModal(false)}
            >
              <View style={styles.modalOverlay}>
                <TouchableOpacity 
                  style={StyleSheet.absoluteFill}
                  activeOpacity={1}
                  onPress={() => setShowSignOutModal(false)}
                />
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <View style={styles.modalIcon}>
                      <LogOut size={24} color="#D32F2F" />
                    </View>
                    <Text style={styles.modalTitle}>Sign Out?</Text>
                    <Text style={styles.modalMessage}>
                      Are you sure you want to sign out from Voltra?
                    </Text>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalCancelButton}
                      onPress={() => setShowSignOutModal(false)}
                    >
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalConfirmButton}
                      onPress={async () => {
                        setShowSignOutModal(false);
                        await logout();
                        router.replace("/");
                      }}
                    >
                      <Text style={styles.modalConfirmText}>Sign Out</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

            <Modal
              visible={editMode !== null}
              transparent
              animationType="fade"
              onRequestClose={closeEditModal}
            >
              <View style={styles.modalOverlay}>
                <TouchableOpacity 
                  style={StyleSheet.absoluteFill}
                  activeOpacity={1}
                  onPress={closeEditModal}
                />
                <View style={styles.editModalContentWrapper}>
                  <View style={styles.editModalContent}>
                    <View style={styles.editModalHeader}>
                      <Text style={styles.editModalTitle}>
                        {editMode === "name" && "Edit Name"}
                        {editMode === "email" && "Edit Email"}
                        {editMode === "interests" && "Edit Interests"}
                        {editMode === "bio" && "Edit About"}
                        {editMode === "createPosting" && "Create Posting"}
                        {editMode === "createOrganization" && "Create Organization"}
                      </Text>
                      <TouchableOpacity onPress={closeEditModal}>
                        <X size={24} color={Colors.light.text} />
                      </TouchableOpacity>
                    </View>

                  <ScrollView 
                    style={styles.editModalBody}
                    keyboardShouldPersistTaps="handled"
                  >
                    {editMode === "name" && (
                      <View>
                        <Text style={styles.inputLabel}>Full Name</Text>
                        <TextInput
                          style={styles.inputNameEmail}
                          value={editName}
                          onChangeText={setEditName}
                          placeholder="Enter your full name"
                          autoFocus
                        />
                      </View>
                    )}

                    {editMode === "email" && (
                      <View>
                        <Text style={styles.inputLabel}>Email Address</Text>
                        <TextInput
                          style={styles.inputNameEmail}
                          value={editEmail}
                          onChangeText={setEditEmail}
                          placeholder="Enter your email"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoFocus
                        />
                      </View>
                    )}

                    {editMode === "bio" && (
                      <View>
                        <Text style={styles.inputLabel}>About You</Text>
                        <TextInput
                          style={[styles.input, styles.bioInput]}
                          value={editBio}
                          onChangeText={setEditBio}
                          placeholder="Tell people about yourself, your passions, and why you love volunteering..."
                          multiline
                          numberOfLines={6}
                          textAlignVertical="top"
                          autoFocus
                        />
                        <Text style={styles.characterCount}>{editBio.length} characters</Text>
                      </View>
                    )}

                    {editMode === "interests" && (
                      <View>
                        <Text style={styles.inputLabel}>Your Interests ({editInterests.length})</Text>
                        {editInterests.length > 0 && (
                          <View style={styles.editChipContainer}>
                            {editInterests.map((interest, index) => (
                              <View key={index} style={styles.editChip}>
                                <Text style={styles.editChipText}>{interest}</Text>
                                <TouchableOpacity
                                  onPress={() => handleRemoveInterest(index)}
                                  style={styles.removeChipButton}
                                >
                                  <X size={14} color={Colors.light.text} />
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        )}

                        <Text style={[styles.inputLabel, { marginTop: 24 }]}>Add Custom Interest</Text>
                        <View style={styles.addInterestContainer}>
                          <TextInput
                            style={styles.addInterestInput}
                            value={newInterest}
                            onChangeText={setNewInterest}
                            placeholder="Type your custom interest..."
                            onSubmitEditing={handleAddInterest}
                          />
                          <TouchableOpacity 
                            style={styles.addButton}
                            onPress={handleAddInterest}
                          >
                            <Plus size={20} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.orDivider}>
                          <View style={styles.orDividerLine} />
                          <Text style={styles.orDividerText}>OR SELECT FROM LIST</Text>
                          <View style={styles.orDividerLine} />
                        </View>

                        <Text style={styles.inputLabel}>Search Interests</Text>
                        <TextInput
                          style={styles.input}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          placeholder="Search volunteer types..."
                          placeholderTextColor={Colors.light.textSecondary}
                        />

                        <View style={styles.wordBankContainer}>
                          {VOLUNTEER_TYPES.filter((type) =>
                            type.toLowerCase().includes(searchQuery.toLowerCase())
                          ).map((type) => (
                            <TouchableOpacity
                              key={type}
                              style={[
                                styles.wordBankChip,
                                editInterests.includes(type) && styles.wordBankChipSelected,
                              ]}
                              onPress={() => toggleInterest(type)}
                            >
                              <Text
                                style={[
                                  styles.wordBankChipText,
                                  editInterests.includes(type) && styles.wordBankChipTextSelected,
                                ]}
                              >
                                {type}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {editMode === "createOrganization" && (
                      <View>
                        <Text style={styles.inputLabel}>Organization Name *</Text>
                        <TextInput
                          style={styles.input}
                          value={orgName}
                          onChangeText={setOrgName}
                          placeholder="Enter organization name"
                          autoFocus
                        />

                        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Logo (Optional)</Text>
                        <TouchableOpacity 
                          style={styles.logoPickerButton}
                          onPress={async () => {
                            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                            if (status !== "granted") {
                              Alert.alert("Permission Required", "Please grant access to your photos to upload logo");
                              return;
                            }
                            const result = await ImagePicker.launchImageLibraryAsync({
                              mediaTypes: "images" as any,
                              allowsEditing: true,
                              aspect: [1, 1],
                              quality: 0.7,
                            });
                            if (!result.canceled && result.assets[0]) {
                              setOrgLogo(result.assets[0].uri);
                            }
                          }}
                        >
                          {orgLogo ? (
                            <Image source={{ uri: orgLogo }} style={styles.logoPreview} />
                          ) : (
                            <View style={styles.logoPlaceholder}>
                              <Camera size={32} color={Colors.light.textSecondary} />
                              <Text style={styles.logoPlaceholderText}>Upload Logo</Text>
                            </View>
                          )}
                        </TouchableOpacity>

                        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Website (Optional)</Text>
                        <TextInput
                          style={styles.input}
                          value={orgWebsite}
                          onChangeText={setOrgWebsite}
                          placeholder="https://your-organization.com"
                          autoCapitalize="none"
                          keyboardType="url"
                        />

                        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Description *</Text>
                        <TextInput
                          style={[styles.input, styles.bioInput]}
                          value={orgDescription}
                          onChangeText={setOrgDescription}
                          placeholder="Describe your organization's mission and activities..."
                          multiline
                          numberOfLines={6}
                          textAlignVertical="top"
                        />
                        <Text style={styles.characterCount}>{orgDescription.length} characters</Text>
                      </View>
                    )}

                    {editMode === "createPosting" && (
                      <View>
                        <Text style={styles.inputLabel}>Title</Text>
                        <TextInput
                          style={styles.input}
                          value={postingTitle}
                          onChangeText={setPostingTitle}
                          placeholder="Enter opportunity title"
                          autoFocus
                        />

                        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Description</Text>
                        <TextInput
                          style={[styles.input, styles.bioInput]}
                          value={postingDescription}
                          onChangeText={setPostingDescription}
                          placeholder="Describe the volunteer opportunity..."
                          multiline
                          numberOfLines={6}
                          textAlignVertical="top"
                        />

                        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Location</Text>
                        <TextInput
                          style={styles.input}
                          value={postingLocation}
                          onChangeText={setPostingLocation}
                          placeholder="City, State or 'Remote'"
                        />

                        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Type</Text>
                        <View style={styles.typeContainer}>
                          {["remote", "in-person", "hybrid"].map((type) => (
                            <TouchableOpacity
                              key={type}
                              style={[
                                styles.typeChip,
                                postingType === type && styles.typeChipSelected,
                              ]}
                              onPress={() => setPostingType(type as any)}
                            >
                              <Text
                                style={[
                                  styles.typeChipText,
                                  postingType === type && styles.typeChipTextSelected,
                                ]}
                              >
                                {type}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Category</Text>
                        <View style={styles.categoryContainer}>
                          {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                              key={cat}
                              style={[
                                styles.wordBankChip,
                                postingCategory === cat && styles.wordBankChipSelected,
                              ]}
                              onPress={() => setPostingCategory(cat)}
                            >
                              <Text
                                style={[
                                  styles.wordBankChipText,
                                  postingCategory === cat && styles.wordBankChipTextSelected,
                                ]}
                              >
                                {cat}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Duration</Text>
                        <TextInput
                          style={styles.input}
                          value={postingDuration}
                          onChangeText={setPostingDuration}
                          placeholder="e.g., 2 hours, Flexible, Ongoing"
                        />

                        <Text style={[styles.inputLabel, { marginTop: 16 }]}>Requirements</Text>
                        <View style={styles.addInterestContainer}>
                          <TextInput
                            style={styles.addInterestInput}
                            value={currentRequirement}
                            onChangeText={setCurrentRequirement}
                            placeholder="Add a requirement..."
                            onSubmitEditing={() => {
                              if (currentRequirement.trim()) {
                                setPostingRequirements([...postingRequirements, currentRequirement.trim()]);
                                setCurrentRequirement("");
                              }
                            }}
                          />
                          <TouchableOpacity 
                            style={styles.addButton}
                            onPress={() => {
                              if (currentRequirement.trim()) {
                                setPostingRequirements([...postingRequirements, currentRequirement.trim()]);
                                setCurrentRequirement("");
                              }
                            }}
                          >
                            <Plus size={20} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                        {postingRequirements.length > 0 && (
                          <View style={styles.editChipContainer}>
                            {postingRequirements.map((req, index) => (
                              <View key={index} style={styles.editChip}>
                                <Text style={styles.editChipText}>{req}</Text>
                                <TouchableOpacity
                                  onPress={() => setPostingRequirements(postingRequirements.filter((_, i) => i !== index))}
                                  style={styles.removeChipButton}
                                >
                                  <X size={14} color={Colors.light.text} />
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </ScrollView>

                  <View style={styles.editModalFooter}>
                    <TouchableOpacity
                      style={styles.editCancelButton}
                      onPress={closeEditModal}
                      disabled={isSaving}
                    >
                      <Text style={styles.editCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editSaveButton, isSaving && styles.editSaveButtonDisabled]}
                      onPress={handleSave}
                      disabled={isSaving}
                    >
                      <Text style={styles.editSaveText}>
                        {isSaving ? "Saving..." : "Save"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  </View>
                </View>
              </View>
            </Modal>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.light.headerBackground,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  profileHeader: {
    backgroundColor: Colors.light.cardBackground,
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.light.tint,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.light.tint,
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.light.cardBackground,
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  editIconButton: {
    padding: 4,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  email: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  editButtonText: {
    fontSize: 13,
    color: Colors.light.tint,
    fontWeight: "600" as const,
  },
  sectionCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  chipText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: "500" as const,
  },
  logoutButton: {
    marginHorizontal: 16,
    backgroundColor: "#D32F2F",
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  createButton: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  editModalContentWrapper: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  modalContent: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 24,
    width: "70%",
    maxWidth: 280,
    borderWidth: 3,
    borderColor: Colors.light.tint,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#D32F2F",
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  editModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    height: 600,
    width: "82%",
    maxWidth: 380,
    borderWidth: 3,
    borderColor: Colors.light.tint,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: "hidden" as const,
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: "#FFFFFF",
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  editModalBody: {
    padding: 20,
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
    minHeight: 80,
  },
  inputNameEmail: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 17,
    color: Colors.light.text,
    minHeight: 100,
  },
  addInterestContainer: {
    flexDirection: "row",
    gap: 8,
  },
  addInterestInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.light.text,
  },
  addButton: {
    backgroundColor: Colors.light.tint,
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  editChipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  editChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  editChipText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: "500" as const,
  },
  removeChipButton: {
    padding: 2,
  },
  editModalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: "#FFFFFF",
  },
  editCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
  },
  editCancelText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  editSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
  },
  editSaveButtonDisabled: {
    opacity: 0.6,
  },
  editSaveText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  orDividerText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: "600" as const,
    paddingHorizontal: 12,
    letterSpacing: 0.5,
  },
  wordBankContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  wordBankChip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  wordBankChipSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  wordBankChipText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: "500" as const,
  },
  wordBankChipTextSelected: {
    color: "#FFFFFF",
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
  },
  bioPlaceholder: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.textSecondary,
    fontStyle: "italic" as const,
  },
  bioInput: {
    minHeight: 200,
    paddingTop: 12,
  },
  characterCount: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: "right" as const,
  },
  postingCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  postingHeader: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    marginBottom: 8,
  },
  postingTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  postingMeta: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  postingMetaText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  postingMetaSep: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginHorizontal: 4,
  },
  deletePostingButton: {
    padding: 8,
  },
  postingDescription: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  postingTags: {
    flexDirection: "row" as const,
    gap: 6,
  },
  postingTag: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  postingTagText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600" as const,
    textTransform: "capitalize" as const,
  },
  typeContainer: {
    flexDirection: "row" as const,
    gap: 8,
    marginTop: 8,
  },
  typeChip: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center" as const,
  },
  typeChipSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  typeChipText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: "500" as const,
    textTransform: "capitalize" as const,
  },
  typeChipTextSelected: {
    color: "#FFFFFF",
  },
  categoryContainer: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
    marginTop: 8,
  },
  organizationBanner: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: Colors.light.accentLight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.light.tint,
    borderStyle: "dashed" as const,
  },
  organizationBannerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.cardBackground,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 16,
  },
  organizationBannerContent: {
    gap: 10,
  },
  organizationBannerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  organizationBannerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.light.textSecondary,
  },
  organizationBannerButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 6,
  },
  organizationBannerButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  logoPickerButton: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden" as const,
  },
  logoPlaceholder: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderStyle: "dashed" as const,
    borderColor: Colors.light.border,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
  },
  logoPlaceholderText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: "500" as const,
  },
  logoPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
});
