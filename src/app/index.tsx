import { useState } from "react";
import { useAuth, useSignIn, useSignUp } from "@clerk/expo";
import { useHostedAuth } from "@clerk/expo/hosted-auth";
import { Redirect } from "expo-router";
import { BrandLogo } from "../components/BrandLogo";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

const colors = {
  background: "#FFFFFF",
  ink: "#101B3B",
  muted: "#7787A8",
  border: "#E4EAF4",
  primary: "#554BFF",
  white: "#FFFFFF",
  error: "#C62828",
};

type AuthMode = "sign-up" | "sign-in" | "verify";

function clerkErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "errors" in error) {
    const messages = (error as { errors?: { longMessage?: string; message?: string }[] }).errors
      ?.map((item) => item.longMessage || item.message)
      .filter(Boolean);

    if (messages?.length) return messages.join("\n");
  }

  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

type FieldProps = {
  icon: "person" | "mail" | "lock";
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric";
  trailing?: React.ReactNode;
};

function FieldIcon({ kind }: { kind: FieldProps["icon"] }) {
  if (kind === "mail") {
    return (
      <View style={styles.mailIcon}>
        <View style={styles.mailFoldLeft} />
        <View style={styles.mailFoldRight} />
      </View>
    );
  }

  if (kind === "lock") {
    return (
      <View style={styles.lockIcon}>
        <View style={styles.lockShackle} />
        <View style={styles.lockBody} />
      </View>
    );
  }

  return (
    <View style={styles.personIcon}>
      <View style={styles.personHead} />
      <View style={styles.personShoulders} />
    </View>
  );
}

function PasswordEye({ visible }: { visible: boolean }) {
  return (
    <Svg width={22} height={20} viewBox="0 0 24 24">
      <Path
        d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"
        fill="none"
        stroke="#24365F"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.7}
      />
      <Circle cx={12} cy={12} r={3.2} fill="none" stroke="#24365F" strokeWidth={1.5} />
      {visible ? (
        <Path d="m4 20 16-16" fill="none" stroke="#24365F" strokeLinecap="round" strokeWidth={1.7} />
      ) : (
        <Circle cx={12} cy={12} r={1.1} fill="#24365F" />
      )}
    </Svg>
  );
}

function GoogleMark() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M24 12.276c0-.816-.073-1.6-.209-2.36H12v4.46h6.74a5.76 5.76 0 0 1-2.5 3.78v3.15h4.05c2.37-2.18 3.71-5.39 3.71-9.03Z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.95-2.92l-4.05-3.15c-1.08.72-2.46 1.15-3.9 1.15-3 0-5.55-2.02-6.46-4.74H1.36v3.25C3.33 21.4 7.33 24 12 24Z"
      />
      <Path
        fill="#FBBC05"
        d="M5.54 14.34A7.2 7.2 0 0 1 5.16 12c0-.81.14-1.59.38-2.34V6.41H1.36A12 12 0 0 0 0 12c0 1.94.46 3.77 1.36 5.59l4.18-3.25Z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.36.61 4.61 1.82l3.46-3.46C17.95 1.19 15.24 0 12 0 7.33 0 3.33 2.6 1.36 6.41l4.18 3.25C6.45 6.94 9 4.77 12 4.77Z"
      />
    </Svg>
  );
}

function AppleMark() {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24">
      <Path
        fill="#111827"
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.63-2.2.45-3.06-.35C2.76 15.72 3.41 8.44 8.9 8.16c1.33.07 2.26.73 3.05.78 1.18-.24 2.31-.92 3.57-.82 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.97.48 7.12-.57 1.49-1.31 2.97-2.36 4.05ZM11.9 8.1c-.15-2.21 1.65-4.03 3.72-4.21.29 2.55-2.32 4.47-3.72 4.21Z"
      />
    </Svg>
  );
}

function Field({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = "default",
  trailing,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldIcon}>
        <FieldIcon kind={icon} />
      </View>
      <TextInput
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
      />
      {trailing}
    </View>
  );
}

function SocialButton({
  provider,
  onPress,
  disabled,
}: {
  provider: "Google" | "Apple";
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.socialButton, disabled && styles.disabledButton]}
    >
      {provider === "Google" ? (
        <GoogleMark />
      ) : (
        <AppleMark />
      )}
      <Text style={styles.socialLabel}>Continue with {provider}</Text>
    </Pressable>
  );
}

export default function Index() {
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { startHostedAuth } = useHostedAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("sign-up");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const submitSignUp = async () => {
    if (!signUp) return;
    const [firstName, ...lastNameParts] = name.trim().split(/\s+/);

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      const { error } = await signUp.password({
        emailAddress: email.trim(),
        password,
        firstName,
        lastName: lastNameParts.join(" ") || undefined,
      });

      if (error) {
        setErrorMessage(clerkErrorMessage(error));
        return;
      }

      if (signUp.status === "complete") {
        const { error: finalizeError } = await signUp.finalize();
        if (finalizeError) setErrorMessage(clerkErrorMessage(finalizeError));
        return;
      }

      const { error: verificationError } = await signUp.verifications.sendEmailCode();
      if (verificationError) {
        setErrorMessage(clerkErrorMessage(verificationError));
        return;
      }

      setAuthMode("verify");
    } catch (error) {
      setErrorMessage(clerkErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitSignIn = async () => {
    if (!signIn) return;

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      const { error } = await signIn.password({ emailAddress: email.trim(), password });

      if (error) {
        setErrorMessage(clerkErrorMessage(error));
        return;
      }

      if (signIn.status === "complete") {
        const { error: finalizeError } = await signIn.finalize();
        if (finalizeError) setErrorMessage(clerkErrorMessage(finalizeError));
        return;
      }

      setErrorMessage("Your account needs another verification step. Continue with Clerk sign-in.");
    } catch (error) {
      setErrorMessage(clerkErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyEmail = async () => {
    if (!signUp) return;

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      const { error } = await signUp.verifications.verifyEmailCode({ code: verificationCode.trim() });

      if (error) {
        setErrorMessage(clerkErrorMessage(error));
        return;
      }

      const { error: finalizeError } = await signUp.finalize();
      if (finalizeError) setErrorMessage(clerkErrorMessage(finalizeError));
    } catch (error) {
      setErrorMessage(clerkErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openHostedAuth = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage("");
      await startHostedAuth({ mode: authMode === "sign-in" ? "sign-in" : "sign-up" });
    } catch (error) {
      setErrorMessage(clerkErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authLoaded) {
    return (
      <SafeAreaView edges={["top"]} style={styles.screen}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (isSignedIn) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardArea}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.topBar}>
              <Pressable
                accessibilityLabel="Back to create account"
                hitSlop={12}
                onPress={() => {
                  setErrorMessage("");
                  setAuthMode("sign-up");
                }}
                style={styles.backButton}
              >
                <Text style={styles.backChevron}>‹</Text>
              </Pressable>
            </View>

            <BrandLogo size={74} style={styles.brandMark} />

            <Text style={styles.title}>
              {authMode === "verify" ? "Verify your email" : authMode === "sign-in" ? "Sign in" : "Create account"}
            </Text>
            <Text style={styles.subtitle}>
              {authMode === "verify"
                ? `Enter the code sent to ${email}`
                : authMode === "sign-in"
                  ? "Welcome back to Codexgram"
                  : "Join Codexgram"}
            </Text>

            <View style={styles.fields}>
              {authMode === "verify" ? (
                <Field
                  icon="mail"
                  keyboardType="numeric"
                  placeholder="Verification code"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                />
              ) : (
                <>
                  {authMode === "sign-up" ? (
                    <Field icon="person" placeholder="Full name" value={name} onChangeText={setName} />
                  ) : null}
                  <Field
                    icon="mail"
                    keyboardType="email-address"
                    placeholder="Email address"
                    value={email}
                    onChangeText={setEmail}
                  />
                  <Field
                    icon="lock"
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    trailing={
                      <Pressable
                        accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                        accessibilityRole="button"
                        hitSlop={8}
                        onPress={() => setShowPassword((shown) => !shown)}
                        style={styles.eyeButton}
                      >
                        <PasswordEye visible={showPassword} />
                      </Pressable>
                    }
                  />
                </>
              )}
            </View>

            {errorMessage ? <Text style={styles.formMessage}>{errorMessage}</Text> : null}

            <Pressable
              accessibilityRole="button"
              disabled={isSubmitting}
              onPress={authMode === "verify" ? verifyEmail : authMode === "sign-in" ? submitSignIn : submitSignUp}
              style={[styles.primaryButton, isSubmitting && styles.disabledButton]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryLabel}>
                  {authMode === "verify" ? "Verify email" : authMode === "sign-in" ? "Sign in" : "Create account"}
                </Text>
              )}
            </Pressable>

            {authMode !== "verify" ? (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.orLabel}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <View style={styles.socialButtons}>
                  <SocialButton disabled={isSubmitting} onPress={openHostedAuth} provider="Google" />
                  <SocialButton disabled={isSubmitting} onPress={openHostedAuth} provider="Apple" />
                </View>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    {authMode === "sign-in" ? "Don't have an account? " : "Already have an account? "}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isSubmitting}
                    onPress={() => {
                      setErrorMessage("");
                      setAuthMode(authMode === "sign-in" ? "sign-up" : "sign-in");
                    }}
                  >
                    <Text style={styles.signInText}>{authMode === "sign-in" ? "Sign Up" : "Sign In"}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Pressable onPress={() => setAuthMode("sign-up")} style={styles.footer}>
                <Text style={styles.signInText}>Use a different email</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  signedInCard: {
    justifyContent: "center",
  },
  keyboardArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "stretch",
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  card: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 22,
    paddingTop: 0,
    paddingBottom: 12,
    borderRadius: 0,
    backgroundColor: colors.white,
  },
  topBar: {
    height: 24,
    justifyContent: "center",
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: "center",
  },
  backChevron: {
    marginTop: -2,
    color: colors.ink,
    fontSize: 26,
    lineHeight: 28,
  },
  brandMark: {
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 28,
    shadowColor: "#1684FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 9,
    elevation: 5,
  },
  title: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 4,
    color: "#52658A",
    fontSize: 14,
    lineHeight: 18,
    textAlign: "center",
  },
  fields: {
    gap: 14,
    marginTop: 27,
  },
  field: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.white,
  },
  fieldIcon: {
    width: 27,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  mailIcon: {
    width: 17,
    height: 12,
    borderWidth: 1,
    borderColor: "#24365F",
    borderRadius: 2,
  },
  mailFoldLeft: {
    position: "absolute",
    top: 3,
    left: 1,
    width: 8,
    height: 1,
    backgroundColor: "#24365F",
    transform: [{ rotate: "33deg" }],
  },
  mailFoldRight: {
    position: "absolute",
    top: 3,
    right: 1,
    width: 8,
    height: 1,
    backgroundColor: "#24365F",
    transform: [{ rotate: "-33deg" }],
  },
  personIcon: {
    width: 16,
    height: 18,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 1,
  },
  personHead: {
    width: 7,
    height: 7,
    borderWidth: 1.2,
    borderColor: "#24365F",
    borderRadius: 4,
  },
  personShoulders: {
    width: 14,
    height: 8,
    marginTop: 1,
    borderWidth: 1.2,
    borderColor: "#24365F",
    borderBottomWidth: 1.2,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  lockIcon: {
    width: 16,
    height: 18,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 1,
  },
  lockShackle: {
    position: "absolute",
    top: 1,
    width: 9,
    height: 9,
    borderWidth: 1.2,
    borderColor: "#24365F",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  lockBody: {
    width: 14,
    height: 10,
    borderWidth: 1.2,
    borderColor: "#24365F",
    borderRadius: 3,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    height: "100%",
    padding: 0,
    color: colors.ink,
    fontSize: 14,
  },
  eyeButton: {
    width: 26,
    height: 36,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  primaryButton: {
    height: 56,
    marginTop: 23,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.primary,
  },
  primaryLabel: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "700",
  },
  formMessage: {
    marginTop: 12,
    color: colors.error,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.65,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginTop: 26,
    marginBottom: 24,
  },
  dividerLine: {
    height: 1,
    flex: 1,
    backgroundColor: colors.border,
  },
  orLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  socialButtons: {
    gap: 14,
  },
  socialButton: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
  },
  socialLabel: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 44,
    paddingBottom: 0,
  },
  footerText: {
    color: colors.muted,
    fontSize: 12,
  },
  signInText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
  },
});
