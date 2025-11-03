import { useState, useEffect } from "react";
import { router } from "expo-router";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, Building2, X, MapPin, Trash2, Edit2 } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

import Colors from "@/constants/colors";
import { useOrganizations, type Organization, type OrganizationPosting } from "@/contexts/OrganizationContext";
import { useUser } from "@/contexts/UserContext";

const DEFAULT_LOGO = "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200";

export default function OrganizationsScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useUser();
  const { getUserOrganizations, addPosting, updatePosting, deletePosting, deleteOrganization } = useOrganizations();
  
  const [showCreatePostingModal, setShowCreatePostingModal] = useState(false);
  const [showEditPostingModal, setShowEditPostingModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [editingPosting, setEditingPosting] = useState<OrganizationPosting | null>(null);

  const userOrganizations = user ? getUserOrganizations(user.email) : [];

  const handleCreateOrganization = () => {
    router.push("/create-organization");
  };

  const handleSelectOrganization = (org: Organization) => {
    setSelectedOrg(org);
  };

  const handleCreatePosting = () => {
    if (!selectedOrg) {
      Alert.alert("Error", "Please select an organization first");
      return;
    }
    setShowCreatePostingModal(true);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>Organizations</Text>
        </View>
        <View style={styles.emptyState}>
          <Building2 size={48} color={Colors.light.textSecondary} />
          <Text style={styles.emptyStateText}>Please log in to create organizations</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>My Organizations</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateOrganization}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Create Organization</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {userOrganizations.length === 0 ? (
          <View style={styles.emptyState}>
            <Building2 size={48} color={Colors.light.textSecondary} />
            <Text style={styles.emptyStateText}>No organizations yet</Text>
            <Text style={styles.emptyStateSubtext}>Create your first organization to start posting volunteer opportunities</Text>
          </View>
        ) : (
          <>
            {userOrganizations.map((org) => (
              <OrganizationCard
                key={org.id}
                organization={org}
                isSelected={selectedOrg?.id === org.id}
                onSelect={() => handleSelectOrganization(org)}
                onEdit={() => router.push(`/edit-organization?id=${org.id}`)}
                onCreatePosting={handleCreatePosting}
                onEditPosting={(posting) => {
                  setEditingPosting(posting);
                  setShowEditPostingModal(true);
                }}
                onDeletePosting={(postingId) => deletePosting(org.id, postingId)}
                onDeleteOrganization={() => {
                  Alert.alert(
                    "Delete Organization",
                    `Are you sure you want to delete ${org.name}? All postings will be deleted as well.`,
                    [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: "Delete", 
                        style: "destructive", 
                        onPress: async () => {
                          await deleteOrganization(org.id);
                          if (userOrganizations.length === 1 && user) {
                            await updateUser({ accountType: "volunteer", organizationName: undefined });
                          }
                          setSelectedOrg(null);
                        }
                      },
                    ]
                  );
                }}
              />
            ))}
          </>
        )}
      </ScrollView>

      <CreatePostingModal
        visible={showCreatePostingModal}
        onClose={() => setShowCreatePostingModal(false)}
        onCreate={async (data) => {
          if (selectedOrg) {
            await addPosting(selectedOrg.id, data);
            setShowCreatePostingModal(false);
          }
        }}
      />

      <EditPostingModal
        visible={showEditPostingModal}
        posting={editingPosting}
        onClose={() => {
          setShowEditPostingModal(false);
          setEditingPosting(null);
        }}
        onSave={async (data) => {
          if (editingPosting) {
            await updatePosting(editingPosting.organizationId, editingPosting.id, data);
            setShowEditPostingModal(false);
            setEditingPosting(null);
          }
        }}
      />
    </View>
  );
}

interface OrganizationCardProps {
  organization: Organization;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onCreatePosting: () => void;
  onEditPosting: (posting: OrganizationPosting) => void;
  onDeletePosting: (postingId: string) => void;
  onDeleteOrganization: () => void;
}

function OrganizationCard({ organization, isSelected, onSelect, onEdit, onCreatePosting, onEditPosting, onDeletePosting, onDeleteOrganization }: OrganizationCardProps) {
  return (
    <View style={[styles.orgCard, isSelected && styles.orgCardSelected]}>
      <TouchableOpacity style={styles.orgHeader} onPress={onSelect}>
        <Image
          source={{ uri: organization.logo || DEFAULT_LOGO }}
          style={styles.orgLogo}
        />
        <View style={styles.orgInfo}>
          <Text style={styles.orgName}>{organization.name}</Text>
          <Text style={styles.orgDescription} numberOfLines={2}>
            {organization.description}
          </Text>
          <Text style={styles.orgPostingsCount}>
            {organization.postings.length} {organization.postings.length === 1 ? 'posting' : 'postings'}
          </Text>
        </View>
      </TouchableOpacity>

      {isSelected && (
        <>
          <TouchableOpacity style={styles.editOrgButton} onPress={onEdit}>
            <Edit2 size={16} color="#FFFFFF" />
            <Text style={styles.editOrgButtonText}>Edit Organization</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteOrgButton} onPress={onDeleteOrganization}>
            <Trash2 size={16} color="#FFFFFF" />
            <Text style={styles.deleteOrgButtonText}>Delete Organization</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.addPostingButton} onPress={onCreatePosting}>
            <Plus size={16} color={Colors.light.tint} />
            <Text style={styles.addPostingButtonText}>Create New Posting</Text>
          </TouchableOpacity>

          {organization.postings.length > 0 && (
            <View style={styles.postingsSection}>
              <Text style={styles.postingsSectionTitle}>Postings</Text>
              {organization.postings.map((posting) => (
                <PostingItem
                  key={posting.id}
                  posting={posting}
                  onEdit={() => onEditPosting(posting)}
                  onDelete={() => {
                    Alert.alert(
                      "Delete Posting",
                      "Are you sure you want to delete this posting?",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Delete", style: "destructive", onPress: () => onDeletePosting(posting.id) },
                      ]
                    );
                  }}
                />
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

interface PostingItemProps {
  posting: OrganizationPosting;
  onEdit: () => void;
  onDelete: () => void;
}

function PostingItem({ posting, onEdit, onDelete }: PostingItemProps) {
  return (
    <View style={styles.postingItem}>
      <View style={styles.postingItemContent}>
        <Text style={styles.postingTitle}>{posting.title}</Text>
        <Text style={styles.postingDescription} numberOfLines={2}>
          {posting.description}
        </Text>
        <View style={styles.postingMeta}>
          <View style={styles.postingMetaItem}>
            <MapPin size={12} color={Colors.light.textSecondary} />
            <Text style={styles.postingMetaText}>{posting.location}</Text>
          </View>
          <View style={styles.postingTag}>
            <Text style={styles.postingTagText}>{posting.type}</Text>
          </View>
        </View>
      </View>
      <View style={styles.postingActions}>
        <TouchableOpacity onPress={onEdit} style={styles.editButton}>
          <Edit2 size={16} color={Colors.light.tint} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <Trash2 size={16} color={Colors.light.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface CreatePostingModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: Omit<OrganizationPosting, "id" | "postedDate" | "organizationId">) => void;
}

function CreatePostingModal({ visible, onClose, onCreate }: CreatePostingModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<"online" | "in-person">("in-person");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [dates, setDates] = useState("");
  const [startTime, setStartTime] = useState("");
  const [website, setWebsite] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [organizerName, setOrganizerName] = useState("");
  const [companyName, setCompanyName] = useState("");

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !description.trim() || !location.trim() || !category.trim() || !duration.trim() || !organizerName.trim() || !companyName.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    onCreate({
      title,
      description,
      location,
      type,
      category,
      duration,
      dates: dates || undefined,
      startTime: startTime || undefined,
      website: website || undefined,
      images: images.length > 0 ? images : undefined,
      organizerName,
      companyName,
    });

    setTitle("");
    setDescription("");
    setLocation("");
    setType("in-person");
    setCategory("");
    setDuration("");
    setDates("");
    setStartTime("");
    setWebsite("");
    setImages([]);
    setOrganizerName("");
    setCompanyName("");
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContentWrapper}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Posting</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Volunteer opportunity title"
              placeholderTextColor={Colors.light.textSecondary}
            />

            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the volunteer opportunity"
              placeholderTextColor={Colors.light.textSecondary}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.inputLabel}>Location *</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="City, State or Remote"
              placeholderTextColor={Colors.light.textSecondary}
            />

            <Text style={styles.inputLabel}>Type *</Text>
            <View style={styles.typeButtons}>
              {(["online", "in-person"] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeButton, type === t && styles.typeButtonActive]}
                  onPress={() => setType(t)}
                >
                  <Text style={[styles.typeButtonText, type === t && styles.typeButtonTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Category *</Text>
            <TextInput
              style={styles.input}
              value={category}
              onChangeText={setCategory}
              placeholder="e.g., Healthcare, Education, Environment"
              placeholderTextColor={Colors.light.textSecondary}
            />

            <Text style={styles.inputLabel}>Duration *</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="e.g., 2-4 hours/week, One-time event"
              placeholderTextColor={Colors.light.textSecondary}
            />

            <Text style={styles.inputLabel}>Dates</Text>
            <TextInput
              style={styles.input}
              value={dates}
              onChangeText={setDates}
              placeholder="e.g., Starting Jan 15, 2025"
              placeholderTextColor={Colors.light.textSecondary}
            />

            <Text style={styles.inputLabel}>Start Time</Text>
            <TextInput
              style={styles.input}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="e.g., 9:00 AM"
              placeholderTextColor={Colors.light.textSecondary}
            />

            <Text style={styles.inputLabel}>Website</Text>
            <TextInput
              style={styles.input}
              value={website}
              onChangeText={setWebsite}
              placeholder="https://example.com"
              placeholderTextColor={Colors.light.textSecondary}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Images</Text>
            <TouchableOpacity style={styles.imageAddButton} onPress={handlePickImage}>
              <Plus size={20} color={Colors.light.tint} />
              <Text style={styles.imageAddButtonText}>Add Image</Text>
            </TouchableOpacity>
            {images.length > 0 && (
              <ScrollView horizontal style={styles.imagesPreview}>
                {images.map((img, idx) => (
                  <View key={idx} style={styles.imagePreviewWrapper}>
                    <Image source={{ uri: img }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => setImages(images.filter((_, i) => i !== idx))}
                    >
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            <Text style={styles.inputLabel}>Organizer Name *</Text>
            <TextInput
              style={styles.input}
              value={organizerName}
              onChangeText={setOrganizerName}
              placeholder="Your name"
              placeholderTextColor={Colors.light.textSecondary}
            />

            <Text style={styles.inputLabel}>Company Name *</Text>
            <TextInput
              style={styles.input}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="Organization name"
              placeholderTextColor={Colors.light.textSecondary}
            />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

interface EditPostingModalProps {
  visible: boolean;
  posting: OrganizationPosting | null;
  onClose: () => void;
  onSave: (data: Partial<OrganizationPosting>) => void;
}

function EditPostingModal({ visible, posting, onClose, onSave }: EditPostingModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<"online" | "in-person">("in-person");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("");
  const [dates, setDates] = useState("");
  const [startTime, setStartTime] = useState("");
  const [website, setWebsite] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [organizerName, setOrganizerName] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    if (posting) {
      setTitle(posting.title);
      setDescription(posting.description);
      setLocation(posting.location);
      setType(posting.type);
      setCategory(posting.category);
      setDuration(posting.duration);
      setDates(posting.dates || "");
      setStartTime(posting.startTime || "");
      setWebsite(posting.website || "");
      setImages(posting.images || []);
      setOrganizerName(posting.organizerName);
      setCompanyName(posting.companyName);
    }
  }, [posting]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !description.trim() || !location.trim() || !category.trim() || !duration.trim() || !organizerName.trim() || !companyName.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    onSave({
      title,
      description,
      location,
      type,
      category,
      duration,
      dates: dates || undefined,
      startTime: startTime || undefined,
      website: website || undefined,
      images: images.length > 0 ? images : undefined,
      organizerName,
      companyName,
    });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContentWrapper}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Posting</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Volunteer opportunity title"
                placeholderTextColor={Colors.light.textSecondary}
              />

              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the volunteer opportunity"
                placeholderTextColor={Colors.light.textSecondary}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>Location *</Text>
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="City, State or Remote"
                placeholderTextColor={Colors.light.textSecondary}
              />

              <Text style={styles.inputLabel}>Type *</Text>
              <View style={styles.typeButtons}>
                {(["online", "in-person"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeButton, type === t && styles.typeButtonActive]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.typeButtonText, type === t && styles.typeButtonTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Category *</Text>
              <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholder="e.g., Healthcare, Education, Environment"
                placeholderTextColor={Colors.light.textSecondary}
              />

              <Text style={styles.inputLabel}>Duration *</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                placeholder="e.g., 2-4 hours/week, One-time event"
                placeholderTextColor={Colors.light.textSecondary}
              />

              <Text style={styles.inputLabel}>Dates</Text>
              <TextInput
                style={styles.input}
                value={dates}
                onChangeText={setDates}
                placeholder="e.g., Starting Jan 15, 2025"
                placeholderTextColor={Colors.light.textSecondary}
              />

              <Text style={styles.inputLabel}>Start Time</Text>
              <TextInput
                style={styles.input}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="e.g., 9:00 AM"
                placeholderTextColor={Colors.light.textSecondary}
              />

              <Text style={styles.inputLabel}>Website</Text>
              <TextInput
                style={styles.input}
                value={website}
                onChangeText={setWebsite}
                placeholder="https://example.com"
                placeholderTextColor={Colors.light.textSecondary}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Images</Text>
              <TouchableOpacity style={styles.imageAddButton} onPress={handlePickImage}>
                <Plus size={20} color={Colors.light.tint} />
                <Text style={styles.imageAddButtonText}>Add Image</Text>
              </TouchableOpacity>
              {images.length > 0 && (
                <ScrollView horizontal style={styles.imagesPreview}>
                  {images.map((img, idx) => (
                    <View key={idx} style={styles.imagePreviewWrapper}>
                      <Image source={{ uri: img }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setImages(images.filter((_, i) => i !== idx))}
                      >
                        <X size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <Text style={styles.inputLabel}>Organizer Name *</Text>
              <TextInput
                style={styles.input}
                value={organizerName}
                onChangeText={setOrganizerName}
                placeholder="Your name"
                placeholderTextColor={Colors.light.textSecondary}
              />

              <Text style={styles.inputLabel}>Company Name *</Text>
              <TextInput
                style={styles.input}
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="Organization name"
                placeholderTextColor={Colors.light.textSecondary}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 0,
    shadowColor: Colors.light.darkBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#FFFFFF",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  createButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  createButtonText: {
    color: Colors.light.tint,
    fontSize: 15,
    fontWeight: "600" as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  orgCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  orgCardSelected: {
    borderColor: Colors.light.tint,
    borderWidth: 3,
  },
  orgHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  orgLogo: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  orgDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  orgPostingsCount: {
    fontSize: 13,
    color: Colors.light.tint,
    fontWeight: "600" as const,
  },
  editOrgButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
    marginTop: 16,
    gap: 8,
  },
  editOrgButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  deleteOrgButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#D32F2F",
    marginTop: 12,
    gap: 8,
  },
  deleteOrgButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  addPostingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    marginTop: 12,
    gap: 8,
  },
  addPostingButtonText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  postingsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  postingsSectionTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  postingItem: {
    flexDirection: "row",
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  postingItemContent: {
    flex: 1,
  },
  postingTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  postingDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  postingMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  postingMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  postingMetaText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  postingTag: {
    backgroundColor: Colors.light.cardBackground,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  postingTagText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    fontWeight: "500" as const,
  },
  postingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContentWrapper: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  modalContent: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    maxHeight: "90%",
    width: 320,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  modalScroll: {
    padding: 20,
    flexGrow: 1,
    flexShrink: 1,
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
    padding: 12,
    fontSize: 15,
    color: Colors.light.text,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  typeButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.light.text,
    textTransform: "capitalize",
  },
  typeButtonTextActive: {
    color: "#FFFFFF",
  },
  imageAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    marginBottom: 12,
    gap: 8,
  },
  imageAddButtonText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  imagesPreview: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  imagePreviewWrapper: {
    position: "relative",
    marginRight: 8,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
});
