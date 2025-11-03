import { useState, useMemo, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Modal,
  Linking,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin, Clock, Search, Heart, Users, GraduationCap, Laptop, Leaf, Building2, PawPrint, Palette, Baby, HeartPulse, AlertTriangle, Trophy, CheckCircle, X, ExternalLink, Calendar, User } from "lucide-react-native";

import Colors from "@/constants/colors";
import {
  opportunities,
  categories,
  type VolunteerOpportunity,
} from "@/mocks/opportunities";
import { useOrganizations } from "@/contexts/OrganizationContext";

interface CompactOpportunityCardProps {
  opportunity: VolunteerOpportunity;
  onPress: () => void;
}

function CompactOpportunityCard({ opportunity, onPress }: CompactOpportunityCardProps) {
  return (
    <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.7}>
      <Image
        source={{ uri: opportunity.organization.logo }}
        style={styles.compactLogo}
      />
      <View style={styles.compactContent}>
        <Text style={styles.compactTitle} numberOfLines={2}>
          {opportunity.title}
        </Text>
        <Text style={styles.compactOrg} numberOfLines={1}>{opportunity.organization.name}</Text>
        <View style={styles.compactMeta}>
          <View style={styles.compactMetaItem}>
            <MapPin size={12} color={Colors.light.textSecondary} />
            <Text style={styles.compactMetaText} numberOfLines={1}>{opportunity.location}</Text>
          </View>
          <View style={styles.compactMetaItem}>
            <Clock size={12} color={Colors.light.textSecondary} />
            <Text style={styles.compactMetaText}>{opportunity.type}</Text>
          </View>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{opportunity.category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const categoryIcons: Record<string, any> = {
  "All": Users,
  "Healthcare": Heart,
  "Education": GraduationCap,
  "Technology": Laptop,
  "Environment": Leaf,
  "Community Service": Building2,
  "Animal Welfare": PawPrint,
  "Arts & Culture": Palette,
  "Youth Programs": Baby,
  "Senior Care": HeartPulse,
  "Disaster Relief": AlertTriangle,
  "Sports & Fitness": Trophy,
};

interface CategoryCardProps {
  category: string;
  isActive: boolean;
  onPress: () => void;
}

function CategoryCard({ category, isActive, onPress }: CategoryCardProps) {
  const Icon = categoryIcons[category] || Users;
  
  return (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        isActive && styles.categoryCardActive,
      ]}
      onPress={onPress}
    >
      <View style={[styles.categoryIconContainer, isActive && styles.categoryIconContainerActive]}>
        <Icon size={20} color={isActive ? "#FFFFFF" : Colors.light.tint} />
      </View>
      <Text style={[styles.categoryCardText, isActive && styles.categoryCardTextActive]} numberOfLines={2}>
        {category}
      </Text>
    </TouchableOpacity>
  );
}

function calculateSimilarityScore(
  opportunity: VolunteerOpportunity,
  searchQuery: string
): number {
  if (!searchQuery) return 0;

  const query = searchQuery.toLowerCase();
  let score = 0;

  const titleMatch = opportunity.title.toLowerCase().includes(query);
  const orgMatch = opportunity.organization.name.toLowerCase().includes(query);
  const categoryMatch = opportunity.category.toLowerCase().includes(query);
  const locationMatch = opportunity.location.toLowerCase().includes(query);
  const typeMatch = opportunity.type.toLowerCase().includes(query);
  const descriptionMatch = opportunity.description.toLowerCase().includes(query);

  if (titleMatch) score += 10;
  if (orgMatch) score += 7;
  if (categoryMatch) score += 5;
  if (locationMatch) score += 3;
  if (typeMatch) score += 2;
  if (descriptionMatch) score += 4;

  const queryWords = query.split(/\s+/).filter(w => w.length > 2);
  queryWords.forEach((word) => {
    if (opportunity.title.toLowerCase().includes(word)) score += 3;
    if (opportunity.description.toLowerCase().includes(word)) score += 1;
    if (opportunity.organization.name.toLowerCase().includes(word)) score += 2;
  });

  return score;
}

export default function OpportunitiesScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<VolunteerOpportunity | null>(null);
  const insets = useSafeAreaInsets();
  const { getAllPostings } = useOrganizations();

  const allOpportunities = useMemo(() => {
    const postings = getAllPostings();
    const converted: VolunteerOpportunity[] = postings.map((posting) => ({
      id: posting.id,
      title: posting.title,
      organization: {
        id: posting.organizationId,
        name: posting.companyName,
        logo: posting.organization.logo || "https://via.placeholder.com/100",
        verified: false,
      },
      location: posting.location,
      type: posting.type as "online" | "in-person" | "remote" | "hybrid",
      duration: posting.duration,
      category: posting.category,
      description: posting.description,
      requirements: [],
      postedDate: posting.postedDate,
      image: posting.images?.[0],
      applicants: 0,
      dates: posting.dates,
      startTime: posting.startTime,
      website: posting.website,
      organizerName: posting.organizerName,
      companyName: posting.companyName,
    }));
    return [...opportunities, ...converted];
  }, [getAllPostings]);

  const filteredOpportunities = useMemo(() => {
    let filtered = allOpportunities.filter((opp) => {
      const matchesCategory = selectedCategory === "All" || opp.category === selectedCategory;
      return matchesCategory;
    });

    if (searchQuery.trim()) {
      const withScores = filtered.map((opp) => ({
        opportunity: opp,
        score: calculateSimilarityScore(opp, searchQuery.trim()),
      }));

      const sorted = withScores
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);

      filtered = sorted.map((item) => item.opportunity);
    }

    return filtered;
  }, [allOpportunities, selectedCategory, searchQuery]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>Explore Opportunities</Text>
        <Text style={styles.headerSubtitle}>
          {allOpportunities.length} volunteer positions available
        </Text>
        
        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.light.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search opportunities..."
            placeholderTextColor={Colors.light.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.categoriesContainer}>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <CategoryCard
              key={category}
              category={category}
              isActive={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
            />
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isSearching ? (
          <View style={styles.searchingState}>
            <ActivityIndicator size="large" color={Colors.light.tint} />
            <Text style={styles.searchingText}>Searching...</Text>
          </View>
        ) : filteredOpportunities.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={48} color={Colors.light.textSecondary} style={styles.emptyIcon} />
            <Text style={styles.emptyStateText}>
              {searchQuery.trim() ? "No results found" : "No opportunities found"}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery.trim() 
                ? `No opportunities match "${searchQuery}"` 
                : "Try selecting a different category"}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.resultsText}>
              {filteredOpportunities.length} {searchQuery.trim() ? "result" + (filteredOpportunities.length !== 1 ? "s" : "") : "opportunities"}
            </Text>
            {filteredOpportunities.map((opportunity) => (
              <CompactOpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onPress={() => setSelectedOpportunity(opportunity)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {selectedOpportunity && (
        <OpportunityDetailModal
          opportunity={selectedOpportunity}
          visible={selectedOpportunity !== null}
          onClose={() => setSelectedOpportunity(null)}
        />
      )}
    </View>
  );
}

interface OpportunityDetailModalProps {
  opportunity: VolunteerOpportunity;
  visible: boolean;
  onClose: () => void;
}

function OpportunityDetailModal({ opportunity, visible, onClose }: OpportunityDetailModalProps) {
  const handleOpenWebsite = () => {
    if (opportunity.website) {
      Linking.openURL(opportunity.website);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Opportunity Details</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.detailHeader}>
              <Image
                source={{ uri: opportunity.organization.logo }}
                style={styles.detailOrgLogo}
              />
              <View style={styles.detailHeaderText}>
                <View style={styles.orgNameContainer}>
                  <Text style={styles.detailOrgName}>{opportunity.organization.name}</Text>
                  {opportunity.organization.verified && (
                    <CheckCircle size={16} color={Colors.light.tint} fill={Colors.light.tint} />
                  )}
                </View>
                <Text style={styles.detailPostedDate}>{opportunity.postedDate}</Text>
              </View>
            </View>

            <Text style={styles.detailTitle}>{opportunity.title}</Text>

            {opportunity.image && (
              <Image
                source={{ uri: opportunity.image }}
                style={styles.detailImage}
                resizeMode="cover"
              />
            )}

            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.detailDescription}>{opportunity.description}</Text>
            </View>

            <View style={styles.detailInfoGrid}>
              <View style={styles.detailInfoItem}>
                <MapPin size={18} color={Colors.light.tint} />
                <View style={styles.detailInfoContent}>
                  <Text style={styles.detailInfoLabel}>Location</Text>
                  <Text style={styles.detailInfoValue}>{opportunity.location}</Text>
                </View>
              </View>

              <View style={styles.detailInfoItem}>
                <Clock size={18} color={Colors.light.tint} />
                <View style={styles.detailInfoContent}>
                  <Text style={styles.detailInfoLabel}>Type</Text>
                  <Text style={styles.detailInfoValue}>{opportunity.type}</Text>
                </View>
              </View>

              <View style={styles.detailInfoItem}>
                <Calendar size={18} color={Colors.light.tint} />
                <View style={styles.detailInfoContent}>
                  <Text style={styles.detailInfoLabel}>Duration</Text>
                  <Text style={styles.detailInfoValue}>{opportunity.duration}</Text>
                </View>
              </View>

              <View style={styles.detailInfoItem}>
                <View style={styles.detailCategoryIcon}>
                  <Text style={styles.detailCategoryIconText}>{opportunity.category[0]}</Text>
                </View>
                <View style={styles.detailInfoContent}>
                  <Text style={styles.detailInfoLabel}>Category</Text>
                  <Text style={styles.detailInfoValue}>{opportunity.category}</Text>
                </View>
              </View>

              {opportunity.dates && (
                <View style={styles.detailInfoItem}>
                  <Calendar size={18} color={Colors.light.tint} />
                  <View style={styles.detailInfoContent}>
                    <Text style={styles.detailInfoLabel}>Dates</Text>
                    <Text style={styles.detailInfoValue}>{opportunity.dates}</Text>
                  </View>
                </View>
              )}

              {opportunity.startTime && (
                <View style={styles.detailInfoItem}>
                  <Clock size={18} color={Colors.light.tint} />
                  <View style={styles.detailInfoContent}>
                    <Text style={styles.detailInfoLabel}>Start Time</Text>
                    <Text style={styles.detailInfoValue}>{opportunity.startTime}</Text>
                  </View>
                </View>
              )}

              {opportunity.organizerName && (
                <View style={styles.detailInfoItem}>
                  <User size={18} color={Colors.light.tint} />
                  <View style={styles.detailInfoContent}>
                    <Text style={styles.detailInfoLabel}>Organizer</Text>
                    <Text style={styles.detailInfoValue}>{opportunity.organizerName}</Text>
                  </View>
                </View>
              )}

              {opportunity.companyName && (
                <View style={styles.detailInfoItem}>
                  <Building2 size={18} color={Colors.light.tint} />
                  <View style={styles.detailInfoContent}>
                    <Text style={styles.detailInfoLabel}>Company</Text>
                    <Text style={styles.detailInfoValue}>{opportunity.companyName}</Text>
                  </View>
                </View>
              )}
            </View>

            {opportunity.website && (
              <TouchableOpacity style={styles.websiteButton} onPress={handleOpenWebsite}>
                <ExternalLink size={18} color={Colors.light.tint} />
                <Text style={styles.websiteButtonText}>Visit Website</Text>
              </TouchableOpacity>
            )}

            {opportunity.applicants !== undefined && (
              <View style={styles.applicantsInfo}>
                <Users size={18} color={Colors.light.textSecondary} />
                <Text style={styles.applicantsInfoText}>
                  {opportunity.applicants} people have applied
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.applyButtonLarge}>
              <Text style={styles.applyButtonLargeText}>Apply Now</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
  },
  categoriesContainer: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryCard: {
    width: "23%",
    aspectRatio: 1,
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryCardActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  categoryIconContainerActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  categoryCardText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.light.text,
    textAlign: "center",
  },
  categoryCardTextActive: {
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  compactCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    borderWidth: 2,
    borderColor: Colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  compactLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  compactContent: {
    flex: 1,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 3,
  },
  compactOrg: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 5,
  },
  compactMeta: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 5,
  },
  compactMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  compactMetaText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.light.background,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    fontWeight: "500" as const,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#FFFFFF",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.3,
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
    textAlign: "center",
    paddingHorizontal: 32,
  },
  searchingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 16,
  },
  searchingText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.tint,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    height: "85%",
    width: "85%",
    maxWidth: 420,
    borderWidth: 3,
    borderColor: Colors.light.tint,
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
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailOrgLogo: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
  },
  detailHeaderText: {
    flex: 1,
  },
  orgNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailOrgName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  detailPostedDate: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 16,
  },
  detailImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  detailDescription: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
  },
  detailInfoGrid: {
    gap: 16,
    marginBottom: 20,
  },
  detailInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailInfoContent: {
    flex: 1,
  },
  detailInfoLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  detailInfoValue: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: Colors.light.text,
  },
  detailCategoryIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: Colors.light.tint,
    alignItems: "center",
    justifyContent: "center",
  },
  detailCategoryIconText: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  websiteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    marginBottom: 16,
    gap: 8,
  },
  websiteButtonText: {
    color: Colors.light.tint,
    fontSize: 15,
    fontWeight: "600" as const,
  },
  applicantsInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  applicantsInfoText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  applyButtonLarge: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  applyButtonLargeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
