import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Eye, EyeOff } from "lucide-react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Colors from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";

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

const loadAccounts = async (): Promise<UserAccount[]> => {
  try {
    const stored = await AsyncStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (stored) {
      const accounts = JSON.parse(stored);
      console.log("Loaded accounts from storage:", accounts.length, "accounts");
      return accounts;
    }
    return [];
  } catch (error) {
    console.error("Failed to load accounts:", error);
    return [];
  }
};

const saveAccounts = async (accounts: UserAccount[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    console.log("Saved accounts to storage:", accounts.length, "accounts");
  } catch (error) {
    console.error("Failed to save accounts:", error);
  }
};

const validateEmail = (email: string): { valid: boolean; error?: string } => {
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    return { valid: false, error: "Email address is required" };
  }

  if (trimmedEmail.includes(" ")) {
    return { valid: false, error: "Email cannot contain spaces" };
  }

  const atCount = (trimmedEmail.match(/@/g) || []).length;
  if (atCount === 0) {
    return { valid: false, error: "Email must contain @ symbol" };
  }
  if (atCount > 1) {
    return { valid: false, error: "Email cannot contain multiple @ symbols" };
  }

  const [localPart, domain] = trimmedEmail.split("@");

  if (!localPart || localPart.length === 0) {
    return { valid: false, error: "Email address is incomplete (missing text before @)" };
  }

  if (!domain || domain.length === 0) {
    return { valid: false, error: "Email address is incomplete (missing domain after @)" };
  }

  if (!domain.includes(".")) {
    return { valid: false, error: "Email domain must contain a dot (e.g., @example.com)" };
  }

  const domainParts = domain.split(".");
  const lastPart = domainParts[domainParts.length - 1];
  
  if (lastPart.length < 2) {
    return { valid: false, error: "Email domain extension is too short (e.g., .com, .edu)" };
  }

  if (domain.startsWith(".") || domain.endsWith(".")) {
    return { valid: false, error: "Email domain cannot start or end with a dot" };
  }

  if (domain.includes("..")) {
    return { valid: false, error: "Email domain cannot contain consecutive dots" };
  }

  const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: "Please enter a valid email address (e.g., name@example.com)" };
  }

  return { valid: true };
};

const findUserByEmail = (accounts: UserAccount[], email: string): UserAccount | undefined => {
  return accounts.find((user) => user.email.toLowerCase().trim() === email.toLowerCase().trim());
};

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

export default function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [step, setStep] = useState<"credentials" | "review" | "interests">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const accountType = "volunteer" as const;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [error, setError] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useUser();

  useEffect(() => {
    loadAccountsData();
  }, []);

  const loadAccountsData = async () => {
    const loadedAccounts = await loadAccounts();
    setAccounts(loadedAccounts);
  };

  const checkEmailFormat = (text: string) => {
    if (!text || text.length === 0) {
      setEmailWarning("");
      return;
    }

    const validation = validateEmail(text);
    if (!validation.valid && validation.error) {
      setEmailWarning(validation.error);
    } else {
      setEmailWarning("");
    }
  };

  const handleSignIn = async () => {
    setError("");
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (!email.trim()) {
      setError("Please enter your email address");
      setIsLoading(false);
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error || "Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    const user = findUserByEmail(accounts, email);

    if (!user) {
      setError("Couldn't find your VOLUNTARY Account with this email. Try creating a new account.");
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError("Please enter your password");
      setIsLoading(false);
      return;
    }

    if (user.password !== password) {
      setError("Wrong password. Try again or click Forgot password to reset it.");
      setIsLoading(false);
      return;
    }

    await login({
      email: user.email,
      fullName: user.fullName,
      interests: user.interests,
      accountType: user.accountType,
      organizationName: user.organizationName,
      profileImage: user.profileImage,
      bio: user.bio,
    });

    console.log("Sign in successful!", { email, fullName: user.fullName });
    setIsLoading(false);
    router.replace("/(tabs)/profile");
  };

  const handleSignUp = async () => {
    setError("");
    setIsLoading(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    if (!fullName.trim()) {
      setError("Please enter your full name");
      setIsLoading(false);
      return;
    }

    if (fullName.trim().length < 2) {
      setError("Full name must be at least 2 characters");
      setIsLoading(false);
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address");
      setIsLoading(false);
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.error || "Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    const existingUser = findUserByEmail(accounts, email);
    if (existingUser) {
      setError("This email is already registered. Please sign in instead.");
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError("Please enter a password");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must contain both letters and numbers");
      setIsLoading(false);
      return;
    }

    console.log("Proceeding to review step:", { fullName, email });
    setIsLoading(false);
    setStep("review");
  };

  const switchMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setError("");
    setEmail("");
    setPassword("");
    setFullName("");
  };

  const handleCompleteSignup = async () => {
    if (selectedInterests.length === 0) {
      setError("Please add at least one volunteer interest");
      return;
    }

    setIsLoading(true);
    setError("");

    await new Promise(resolve => setTimeout(resolve, 800));

    const newUser: UserAccount = {
      email,
      password,
      fullName,
      interests: selectedInterests,
      accountType,
    };

    const updatedAccounts = [...accounts, newUser];
    setAccounts(updatedAccounts);
    await saveAccounts(updatedAccounts);

    await login({
      email: newUser.email,
      fullName: newUser.fullName,
      interests: newUser.interests,
      accountType: newUser.accountType,
      organizationName: newUser.organizationName,
    });

    console.log("Account created successfully!", {
      fullName,
      email,
      interests: selectedInterests,
    });
    console.log("Total users in database:", updatedAccounts.length);

    setIsLoading(false);
    router.replace("/(tabs)/profile");
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim();
    if (!trimmed) {
      setError("Please enter an interest");
      return;
    }
    if (selectedInterests.includes(trimmed)) {
      setError("You've already added this interest");
      return;
    }
    if (VOLUNTEER_TYPES.some(type => type.toLowerCase() === trimmed.toLowerCase())) {
      setError("This interest is already in the list below. Please select it instead.");
      return;
    }
    setSelectedInterests([...selectedInterests, trimmed]);
    setCustomInterest("");
    setError("");
  };

  const filteredTypes = VOLUNTEER_TYPES.filter((type) =>
    type.toLowerCase().includes(searchQuery.toLowerCase())
  );





  if (step === "review") {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/w74f15seyjkcc8ox04far" }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Review Your Information</Text>
            <Text style={styles.subtitle}>
              Please verify your details before creating your account
            </Text>

            <View style={styles.reviewSection}>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Full Name</Text>
                <Text style={styles.reviewValue}>{fullName}</Text>
              </View>

              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Email</Text>
                <Text style={styles.reviewValue}>{email}</Text>
              </View>

              <View style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewLabel}>Password</Text>
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.showPasswordButton}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={Colors.light.tint} />
                    ) : (
                      <Eye size={18} color={Colors.light.tint} />
                    )}
                    <Text style={styles.showPasswordText}>
                      {showPassword ? "Hide" : "Show"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.reviewValue}>
                  {showPassword ? password : '•'.repeat(password.length)} ({password.length} characters)
                </Text>
              </View>
            </View>

            <View style={styles.reminderBox}>
              <Text style={styles.reminderTitle}>📧 Important Reminder</Text>
              <Text style={styles.reminderText}>
                Make sure your email is correct - we&apos;ll use it to send you important updates and volunteer opportunities.
              </Text>
              <Text style={styles.reminderText}>
                Remember your password securely - you&apos;ll need it to sign in.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.authButton}
              onPress={() => setStep("interests")}
            >
              <Text style={styles.authButtonText}>Looks Good - Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.textButton}
              onPress={() => setStep("credentials")}
            >
              <Text style={styles.textButtonText}>Go Back and Edit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (step === "interests") {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/w74f15seyjkcc8ox04far" }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.title}>Choose Your Volunteer Interests</Text>
            <Text style={styles.subtitle}>
              Select from our list or add your own custom interests
            </Text>

            <View style={styles.selectedCountContainer}>
              <Text style={styles.selectedCountText}>
                {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
              </Text>
            </View>

            {selectedInterests.length > 0 && (
              <View style={styles.selectedChipsContainer}>
                {selectedInterests.map((interest) => (
                  <TouchableOpacity
                    key={interest}
                    style={styles.selectedChip}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Text style={styles.selectedChipText}>{interest}</Text>
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.customInterestSection}>
              <Text style={styles.customInterestLabel}>Add Your Own Interest</Text>
              <View style={styles.customInterestRow}>
                <TextInput
                  style={styles.customInterestInput}
                  placeholder="Type your custom interest..."
                  placeholderTextColor={Colors.light.textSecondary}
                  value={customInterest}
                  onChangeText={(text) => {
                    setCustomInterest(text);
                    setError("");
                  }}
                  onSubmitEditing={addCustomInterest}
                />
                <TouchableOpacity 
                  style={styles.addCustomButton}
                  onPress={addCustomInterest}
                >
                  <Text style={styles.addCustomButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.orDivider}>
              <View style={styles.orDividerLine} />
              <Text style={styles.orDividerText}>OR CHOOSE FROM LIST</Text>
              <View style={styles.orDividerLine} />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Search volunteer types..."
                placeholderTextColor={Colors.light.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <View style={styles.suggestionsContainer}>
              {filteredTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.suggestionItem,
                    selectedInterests.includes(type) && styles.suggestionItemSelected,
                  ]}
                  onPress={() => toggleInterest(type)}
                >
                  <Text
                    style={[
                      styles.suggestionText,
                      selectedInterests.includes(type) && styles.suggestionTextSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[
                styles.authButton,
                (selectedInterests.length === 0 || isLoading) && styles.authButtonDisabled,
              ]}
              onPress={handleCompleteSignup}
              disabled={selectedInterests.length === 0 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.authButtonText}>Complete Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image 
            source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/w74f15seyjkcc8ox04far" }}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.formContainer}>
          {mode === "signin" ? (
            <>
              <Text style={styles.title}>Sign in</Text>
              <Text style={styles.subtitle}>to continue to VOLUNTARY</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    emailWarning && email.length > 0 && styles.inputError,
                  ]}
                  placeholder="Email"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError("");
                    checkEmailFormat(text);
                  }}
                  onBlur={() => checkEmailFormat(email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {emailWarning && email.length > 0 ? (
                  <Text style={styles.warningText}>{emailWarning}</Text>
                ) : null}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError("");
                  }}
                  secureTextEntry
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity 
                style={[styles.authButton, isLoading && styles.authButtonDisabled]} 
                onPress={handleSignIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.authButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.textButton}>
                <Text style={styles.textButtonText}>Forgot password?</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <View style={styles.switchModeContainer}>
                <Text style={styles.switchModeText}>Don&apos;t have an account? </Text>
                <TouchableOpacity onPress={switchMode}>
                  <Text style={styles.switchModeLink}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>Create your VOLUNTARY Account</Text>
              <Text style={styles.subtitle}>Join students volunteering today</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={fullName}
                  onChangeText={(text) => {
                    setFullName(text);
                    setError("");
                  }}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    emailWarning && email.length > 0 && styles.inputError,
                  ]}
                  placeholder="Email"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError("");
                    checkEmailFormat(text);
                  }}
                  onBlur={() => checkEmailFormat(email)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {emailWarning && email.length > 0 ? (
                  <Text style={styles.warningText}>{emailWarning}</Text>
                ) : null}
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.light.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError("");
                  }}
                  secureTextEntry
                />
              </View>

              <Text style={styles.passwordHint}>
                Use 6 or more characters with a mix of letters and numbers
              </Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity 
                style={[styles.authButton, isLoading && styles.authButtonDisabled]} 
                onPress={handleSignUp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.authButtonText}>Next</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.termsText}>
                By creating an account, you agree to VOLUNTARY&apos;s Terms of Service and Privacy Policy
              </Text>

              <View style={styles.divider} />

              <View style={styles.switchModeContainer}>
                <Text style={styles.switchModeText}>Already have an account? </Text>
                <TouchableOpacity onPress={switchMode}>
                  <Text style={styles.switchModeLink}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoImage: {
    width: 180,
    height: 180,
  },
  formContainer: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    padding: 32,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  authButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  authButtonDisabled: {
    backgroundColor: Colors.light.textSecondary,
    opacity: 0.5,
  },
  authButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  textButton: {
    paddingVertical: 12,
    marginTop: 8,
  },
  textButtonText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  emailDisplay: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 24,
  },
  passwordHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  errorText: {
    fontSize: 13,
    color: "#D32F2F",
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: "#F57C00",
    marginTop: 6,
  },
  inputError: {
    borderColor: "#F57C00",
    borderWidth: 1.5,
  },
  termsText: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 16,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: 24,
  },
  switchModeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  switchModeText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  switchModeLink: {
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: "600" as const,
  },
  selectedCountContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  selectedCountText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.light.tint,
  },
  selectedChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  selectedChipText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "500" as const,
  },
  suggestionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  suggestionItem: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  suggestionItemSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  suggestionItemDisabled: {
    opacity: 0.3,
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: "500" as const,
  },
  suggestionTextSelected: {
    color: "#FFFFFF",
  },
  customInterestSection: {
    marginBottom: 24,
  },
  customInterestLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
  customInterestRow: {
    flexDirection: "row" as const,
    gap: 8,
  },
  customInterestInput: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  addCustomButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  addCustomButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600" as const,
  },
  orDivider: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 16,
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
  reviewSection: {
    marginTop: 24,
    marginBottom: 24,
  },
  reviewItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  reviewLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: "500" as const,
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  reviewValue: {
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: "500" as const,
  },
  reminderBox: {
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.light.tint,
    marginBottom: 12,
  },
  reminderText: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 6,
  },
  showPasswordButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  showPasswordText: {
    fontSize: 13,
    color: Colors.light.tint,
    fontWeight: "600" as const,
  },
  accountTypeContainer: {
    gap: 16,
    marginBottom: 24,
  },
  accountTypeCard: {
    backgroundColor: Colors.light.background,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: 12,
    padding: 20,
    alignItems: "center" as const,
  },
  accountTypeCardSelected: {
    borderColor: Colors.light.tint,
    backgroundColor: "#EEF2FF",
  },
  accountTypeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.cardBackground,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 12,
  },
  accountTypeIconSelected: {
    backgroundColor: Colors.light.tint,
  },
  accountTypeEmoji: {
    fontSize: 32,
  },
  accountTypeTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.light.text,
    marginBottom: 6,
  },
  accountTypeTextSelected: {
    color: Colors.light.tint,
  },
  accountTypeDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: "center" as const,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.light.text,
    marginBottom: 8,
  },
});
