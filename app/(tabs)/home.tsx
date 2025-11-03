import { useState, useEffect, useMemo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  Linking,
  RefreshControl,
  Animated,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin, Clock, Users, CheckCircle, X, ExternalLink, Calendar, User, LogIn, Star, RefreshCw, Filter, Grid3x3, Briefcase } from "lucide-react-native";
import { useRouter } from "expo-router";

import Colors from "@/constants/colors";
import { generateText } from "@rork/toolkit-sdk";
import { opportunities, type VolunteerOpportunity } from "@/mocks/opportunities";
import { useOrganizations } from "@/contexts/OrganizationContext";
import { useUser } from "@/contexts/UserContext";

interface OpportunityCardProps {
  opportunity: VolunteerOpportunity;
  onPress: () => void;
  isUserOrganization?: boolean;
}

function OpportunityCard({ opportunity, onPress, isUserOrganization = false }: OpportunityCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: opportunity.organization.logo }}
          style={styles.orgLogo}
        />
        <View style={styles.cardHeaderText}>
          <View style={styles.orgNameContainer}>
            <Text style={styles.orgName}>
              {isUserOrganization ? "Your Organization" : opportunity.organization.name}
            </Text>
            {opportunity.organization.verified && (
              <CheckCircle size={14} color={Colors.light.tint} fill={Colors.light.tint} />
            )}
          </View>
          <Text style={styles.postedDate}>{opportunity.postedDate}</Text>
        </View>
      </View>

      <Text style={styles.title}>{opportunity.title}</Text>

      {opportunity.image && (
        <Image
          source={{ uri: opportunity.image }}
          style={styles.opportunityImage}
          resizeMode="cover"
        />
      )}

      <Text style={styles.description} numberOfLines={2}>
        {opportunity.description}
      </Text>

      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <MapPin size={14} color={Colors.light.textSecondary} />
          <Text style={styles.metaText}>{opportunity.location}</Text>
        </View>
        <View style={styles.metaItem}>
          <Clock size={14} color={Colors.light.textSecondary} />
          <Text style={styles.metaText}>{opportunity.duration}</Text>
        </View>
      </View>

      <View style={styles.tagContainer}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{opportunity.category}</Text>
        </View>
        <View style={styles.tag}>
          <Text style={styles.tagText}>
            {opportunity.type === "in-person" ? "In-Person" : opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.applicantsContainer}>
          <Users size={14} color={Colors.light.textSecondary} />
          <Text style={styles.applicantsText}>
            {opportunity.applicants} applicants
          </Text>
        </View>
        <View style={styles.applyButton}>
          <Text style={styles.applyButtonText}>View Details</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {

  const [selectedOpportunity, setSelectedOpportunity] = useState<VolunteerOpportunity | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "new" | "preferred" | "my-posts">("all");
  const slideAnim = useState(new Animated.Value(400))[0];
  const spinValue = useState(new Animated.Value(0))[0];
  const insets = useSafeAreaInsets();
  const { getAllPostings, isLoading: orgsLoading, reloadOrganizations } = useOrganizations();
  const { isAuthenticated, user } = useUser();
  const router = useRouter();

  const organizationPostings = useMemo(() => getAllPostings(), [getAllPostings]);

  const isUserPosting = useCallback((posting: VolunteerOpportunity) => {
    if (!user?.email) return false;
    const orgPosting = organizationPostings.find(p => p.id === posting.id);
    return orgPosting?.organization.ownerId === user.email;
  }, [organizationPostings, user?.email]);
  
  const allOpportunities = useMemo(() => {
    return [...organizationPostings.map((posting) => ({
      id: posting.id,
      title: posting.title,
      organization: {
        id: posting.organization.id,
        name: posting.organization.name,
        logo: posting.organization.logo || "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200",
        verified: false,
      },
      location: posting.location,
      type: posting.type,
      duration: posting.duration,
      category: posting.category,
      description: posting.description,
      requirements: [],
      postedDate: posting.postedDate,
      image: posting.images?.[0],
      applicants: 0,
      dates: posting.dates,
      startTime: posting.startTime,
      endTime: posting.endTime,
      website: posting.website,
      organizerName: posting.organizerName,
    } as VolunteerOpportunity)), ...opportunities];
  }, [organizationPostings]);

  const userInterests = user?.interests || [];
  const userInterestsStr = userInterests.join(',');
  
  const [matchedOpportunities, setMatchedOpportunities] = useState<{
    preferred: VolunteerOpportunity[];
    other: VolunteerOpportunity[];
  }>({ preferred: [], other: [] });
  const [isMatching, setIsMatching] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || userInterests.length === 0) {
      setMatchedOpportunities({ preferred: [], other: allOpportunities });
      return;
    }

    const matchOpportunities = async () => {
      setIsMatching(true);
      try {
        const interestsString = userInterests.join(", ");
        const prompt = `You are a volunteer opportunity matching assistant. Given a user's interests and a list of volunteer opportunities, determine which opportunities are a good match for the user.

User's volunteer interests:
${interestsString}

Volunteer opportunities:
${allOpportunities.map((opp, idx) => `${idx + 1}. ${opp.title} - ${opp.category} - ${opp.description.substring(0, 100)}`).join("\n")}

For each opportunity, determine if it's a GOOD MATCH for the user's interests. Be flexible - opportunities should match if they are similar or related to the user's interests, not just exact matches.

Respond with ONLY the numbers of opportunities that are good matches, separated by commas. For example: "1,3,5"

If no opportunities match, respond with: "none"`;

        const response = await generateText(prompt);
        console.log("AI Matching Response:", response);

        const matchedIndices = new Set<number>();
        if (response.toLowerCase().trim() !== "none") {
          const numbers = response.match(/\d+/g);
          if (numbers) {
            numbers.forEach(num => matchedIndices.add(parseInt(num) - 1));
          }
        }

        const preferred = allOpportunities.filter((_, idx) => matchedIndices.has(idx));
        const other = allOpportunities.filter((_, idx) => !matchedIndices.has(idx));

        setMatchedOpportunities({ preferred, other });
      } catch (error) {
        console.error("Failed to match opportunities:", error);
        setMatchedOpportunities({ preferred: [], other: allOpportunities });
      } finally {
        setIsMatching(false);
      }
    };

    matchOpportunities();
  }, [isAuthenticated, userInterestsStr, allOpportunities]);

  const preferredOpportunities = matchedOpportunities.preferred;
  const otherOpportunities = matchedOpportunities.other;

  const handleRefresh = useCallback(async () => {
    console.log("Refreshing posts...");
    setRefreshing(true);
    
    spinValue.setValue(0);
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
    
    try {
      await reloadOrganizations();
      console.log("Posts refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh posts:", error);
    } finally {
      setRefreshing(false);
      spinValue.stopAnimation();
      spinValue.setValue(0);
    }
  }, [reloadOrganizations, spinValue]);

  const newPosts = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return allOpportunities.filter(opp => {
      const postDate = new Date(opp.postedDate).getTime();
      return postDate > oneDayAgo;
    });
  }, [allOpportunities]);

  const myPosts = useMemo(() => {
    if (!user?.email) return [];
    return allOpportunities.filter(opp => isUserPosting(opp));
  }, [allOpportunities, user?.email, isUserPosting]);

  const filteredOpportunities = useMemo(() => {
    switch (selectedFilter) {
      case "new":
        return newPosts;
      case "preferred":
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        return preferredOpportunities.filter(opp => {
          const postDate = new Date(opp.postedDate).getTime();
          return postDate > oneDayAgo;
        });
      case "my-posts":
        return myPosts;
      case "all":
      default:
        return allOpportunities;
    }
  }, [selectedFilter, newPosts, preferredOpportunities, myPosts, allOpportunities]);

  useEffect(() => {
    if (filterVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [filterVisible, slideAnim]);

  const handleFilterSelect = (filter: "all" | "new" | "preferred" | "my-posts") => {
    setSelectedFilter(filter);
    setFilterVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/w74f15seyjkcc8ox04far" }}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.headerLogoText}>VOLUNTARY</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.filterButton} 
              onPress={() => setFilterVisible(true)}
              activeOpacity={0.7}
            >
              <Filter size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={handleRefresh}
              activeOpacity={0.7}
              disabled={refreshing}
            >
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: spinValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                }}
              >
                <RefreshCw size={20} color="#FFFFFF" />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {!isAuthenticated && (
          <View style={styles.loginPromptCard}>
            <View style={styles.loginPromptIconContainer}>
              <LogIn size={28} color={Colors.light.tint} strokeWidth={2.5} />
            </View>
            <Text style={styles.loginPromptTitle}>Sign In to Get Started</Text>
            <Text style={styles.loginPromptDescription}>
              Create an account to apply for opportunities, save favorites, and track your volunteer journey
            </Text>
            <TouchableOpacity 
              style={styles.loginPromptButton}
              onPress={() => router.push("/auth")}
              activeOpacity={0.8}
            >
              <Text style={styles.loginPromptButtonText}>Sign In or Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {allOpportunities.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No volunteer opportunities yet</Text>
            <Text style={styles.emptyStateSubtext}>Check back soon for new opportunities</Text>
          </View>
        ) : (
          <>
            {selectedFilter === "all" ? (
              <>
                {newPosts.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderContainer}>
                      <View style={styles.newPostsIconContainer}>
                        <Clock size={18} color="#FFFFFF" />
                      </View>
                      <Text style={styles.sectionHeaderText}>New Posts (Last 24h)</Text>
                    </View>
                    <Text style={styles.sectionSubtext}>
                      Fresh opportunities posted in the last 24 hours
                    </Text>
                    {newPosts.map((opportunity) => (
                      <OpportunityCard 
                        key={opportunity.id} 
                        opportunity={opportunity}
                        onPress={() => setSelectedOpportunity(opportunity)}
                        isUserOrganization={isUserPosting(opportunity)}
                      />
                    ))}
                  </View>
                )}

                {isAuthenticated && userInterests.length > 0 && preferredOpportunities.length > 0 && (
                  <View style={styles.dividerLine} />
                )}
                {isAuthenticated && userInterests.length > 0 && preferredOpportunities.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderContainer}>
                      <View style={styles.sectionIconContainer}>
                        <Star size={20} color={Colors.light.tint} fill={Colors.light.tint} />
                      </View>
                      <Text style={styles.sectionHeaderText}>Preferred For You</Text>
                    </View>
                    <Text style={styles.sectionSubtext}>
                      Based on your interests: {userInterests.slice(0, 3).join(", ")}
                      {userInterests.length > 3 ? ` and ${userInterests.length - 3} more` : ""}
                    </Text>
                    {preferredOpportunities.map((opportunity) => (
                      <OpportunityCard 
                        key={opportunity.id} 
                        opportunity={opportunity}
                        onPress={() => setSelectedOpportunity(opportunity)}
                        isUserOrganization={isUserPosting(opportunity)}
                      />
                    ))}
                  </View>
                )}

                {isAuthenticated && userInterests.length > 0 && otherOpportunities.length > 0 && (
                  <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeaderContainer}>
                      <Text style={styles.sectionHeaderText}>Other Opportunities</Text>
                    </View>
                    <Text style={styles.sectionSubtext}>
                      Explore more volunteer opportunities outside your selected interests
                    </Text>
                    {otherOpportunities.map((opportunity) => (
                      <OpportunityCard 
                        key={opportunity.id} 
                        opportunity={opportunity}
                        onPress={() => setSelectedOpportunity(opportunity)}
                        isUserOrganization={isUserPosting(opportunity)}
                      />
                    ))}
                  </View>
                )}

                {(!isAuthenticated || userInterests.length === 0) && (
                  allOpportunities.map((opportunity) => (
                    <OpportunityCard 
                      key={opportunity.id} 
                      opportunity={opportunity}
                      onPress={() => setSelectedOpportunity(opportunity)}
                      isUserOrganization={isUserPosting(opportunity)}
                    />
                  ))
                )}
              </>
            ) : (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderContainer}>
                  <Text style={styles.sectionHeaderText}>
                    {selectedFilter === "new" && "New Posts (Last 24h)"}
                    {selectedFilter === "preferred" && "Preferred For You"}
                    {selectedFilter === "my-posts" && "My Posts"}
                  </Text>
                </View>
                <Text style={styles.sectionSubtext}>
                  {selectedFilter === "new" && "Fresh opportunities posted in the last 24 hours"}
                  {selectedFilter === "preferred" && "New posts matching your interests from the last 24 hours"}
                  {selectedFilter === "my-posts" && "Posts from your organizations"}
                </Text>
                {filteredOpportunities.length === 0 ? (
                  <View style={styles.emptyFilterState}>
                    <Text style={styles.emptyFilterText}>No posts found in this category</Text>
                  </View>
                ) : (
                  filteredOpportunities.map((opportunity) => (
                    <OpportunityCard 
                      key={opportunity.id} 
                      opportunity={opportunity}
                      onPress={() => setSelectedOpportunity(opportunity)}
                      isUserOrganization={isUserPosting(opportunity)}
                    />
                  ))
                )}
              </View>
            )}
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

      <Modal visible={filterVisible} animationType="fade" transparent onRequestClose={() => setFilterVisible(false)}>
        <View style={styles.filterModalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setFilterVisible(false)} />
          <Animated.View style={[styles.filterPanel, { transform: [{ translateX: slideAnim }] }]}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>View Posts</Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <X size={24} color={Colors.light.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterOptions}>
              <TouchableOpacity 
                style={[styles.filterOption, selectedFilter === "all" && styles.filterOptionSelected]}
                onPress={() => handleFilterSelect("all")}
                activeOpacity={0.7}
              >
                <View style={styles.filterOptionIcon}>
                  <Grid3x3 size={20} color={selectedFilter === "all" ? "#FFFFFF" : Colors.light.tint} />
                </View>
                <View style={styles.filterOptionTextContainer}>
                  <Text style={[styles.filterOptionText, selectedFilter === "all" && styles.filterOptionTextSelected]}>
                    All Posts
                  </Text>
                  <Text style={[styles.filterOptionSubtext, selectedFilter === "all" && styles.filterOptionSubtextSelected]}>
                    View all volunteering opportunities
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.filterOption, selectedFilter === "new" && styles.filterOptionSelected]}
                onPress={() => handleFilterSelect("new")}
                activeOpacity={0.7}
              >
                <View style={styles.filterOptionIcon}>
                  <Clock size={20} color={selectedFilter === "new" ? "#FFFFFF" : Colors.light.accent} />
                </View>
                <View style={styles.filterOptionTextContainer}>
                  <Text style={[styles.filterOptionText, selectedFilter === "new" && styles.filterOptionTextSelected]}>
                    New Posts
                  </Text>
                  <Text style={[styles.filterOptionSubtext, selectedFilter === "new" && styles.filterOptionSubtextSelected]}>
                    Posts from the last 24 hours ({newPosts.length})
                  </Text>
                </View>
              </TouchableOpacity>

              {isAuthenticated && userInterests.length > 0 && (
                <TouchableOpacity 
                  style={[styles.filterOption, selectedFilter === "preferred" && styles.filterOptionSelected]}
                  onPress={() => handleFilterSelect("preferred")}
                  activeOpacity={0.7}
                >
                  <View style={styles.filterOptionIcon}>
                    <Star size={20} color={selectedFilter === "preferred" ? "#FFFFFF" : Colors.light.tint} fill={selectedFilter === "preferred" ? "#FFFFFF" : Colors.light.tint} />
                  </View>
                  <View style={styles.filterOptionTextContainer}>
                    <Text style={[styles.filterOptionText, selectedFilter === "preferred" && styles.filterOptionTextSelected]}>
                      Preferred Posts
                    </Text>
                    <Text style={[styles.filterOptionSubtext, selectedFilter === "preferred" && styles.filterOptionSubtextSelected]}>
                      New posts matching your interests
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {isAuthenticated && myPosts.length > 0 && (
                <TouchableOpacity 
                  style={[styles.filterOption, selectedFilter === "my-posts" && styles.filterOptionSelected]}
                  onPress={() => handleFilterSelect("my-posts")}
                  activeOpacity={0.7}
                >
                  <View style={styles.filterOptionIcon}>
                    <Briefcase size={20} color={selectedFilter === "my-posts" ? "#FFFFFF" : "#10B981"} />
                  </View>
                  <View style={styles.filterOptionTextContainer}>
                    <Text style={[styles.filterOptionText, selectedFilter === "my-posts" && styles.filterOptionTextSelected]}>
                      My Posts
                    </Text>
                    <Text style={[styles.filterOptionSubtext, selectedFilter === "my-posts" && styles.filterOptionSubtextSelected]}>
                      Posts from your organizations ({myPosts.length})
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

            </View>
          </Animated.View>
        </View>
      </Modal>
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
                  <Text style={styles.detailInfoValue}>
                    {opportunity.type === "in-person" ? "In-Person" : opportunity.type.charAt(0).toUpperCase() + opportunity.type.slice(1)}
                  </Text>
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
                    <Text style={styles.detailInfoLabel}>Time</Text>
                    <Text style={styles.detailInfoValue}>
                      {opportunity.startTime}{opportunity.endTime ? ` - ${opportunity.endTime}` : ""}
                    </Text>
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
  headerContent: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 12,
  },
  logoContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
  },
  headerLogo: {
    width: 80,
    height: 80,
  },
  headerLogoText: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  headerButtons: {
    flexDirection: "row" as const,
    gap: 8,
  },
  filterButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  orgLogo: {
    width: 48,
    height: 48,
    borderRadius: 4,
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  orgNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orgName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.light.text,
  },
  postedDate: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 12,
  },
  opportunityImage: {
    width: "100%",
    height: 180,
    borderRadius: 4,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  tagContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tagText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: "500" as const,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  applicantsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  applicantsText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  applyButton: {
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: Colors.light.deepRed,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600" as const,
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
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
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
  loginPromptCard: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.light.tint,
    shadowColor: Colors.light.darkBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  loginPromptIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.light.tint,
  },
  loginPromptTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: "center",
  },
  loginPromptDescription: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  loginPromptButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    shadowColor: Colors.light.darkBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  loginPromptButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600" as const,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionIconContainer: {
    marginRight: 8,
  },
  sectionHeaderText: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.light.text,
  },
  sectionSubtext: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 16,
    paddingHorizontal: 4,
    lineHeight: 18,
  },
  newPostsIconContainer: {
    backgroundColor: Colors.light.accent,
    borderRadius: 12,
    padding: 4,
    marginRight: 8,
  },
  dividerLine: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 8,
    marginHorizontal: 4,
  },
  emptyFilterState: {
    paddingVertical: 40,
    alignItems: "center" as const,
  },
  emptyFilterText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center" as const,
    alignItems: "flex-end" as const,
  },
  filterPanel: {
    backgroundColor: Colors.light.cardBackground,
    width: 320,
    height: "100%",
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.tint,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  filterHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  filterTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.light.text,
  },
  filterOptions: {
    padding: 16,
    gap: 12,
  },
  filterOption: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.background,
    borderWidth: 2,
    borderColor: Colors.light.border,
  },
  filterOptionSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  filterOptionIcon: {
    marginRight: 12,
  },
  filterOptionTextContainer: {
    flex: 1,
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 4,
  },
  filterOptionTextSelected: {
    color: "#FFFFFF",
  },
  filterOptionSubtext: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  filterOptionSubtextSelected: {
    color: "rgba(255, 255, 255, 0.8)",
  },
});
