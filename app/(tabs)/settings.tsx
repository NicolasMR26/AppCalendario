import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ThemeMode } from "@domain/entities/UserSettings";
import { useSettingsStore } from "@presentation/store/settingsStore";
import { useAuthStore } from "@presentation/store/authStore";
import { useTheme } from "@presentation/theme/ThemeProvider";
import { isSupabaseConfigured, supabase } from "@data/remote/supabaseClient";

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "system", label: "Sistema" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
];

export default function SettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const [emailDraft, setEmailDraft] = useState(settings.alertEmail ?? "");

  const session = useAuthStore((s) => s.session);
  const authError = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signOut = useAuthStore((s) => s.signOut);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);

  const sendTestEmail = async () => {
    setTestEmailStatus("Enviando…");
    const { error } = await supabase.functions.invoke("send-alert-email", { body: { type: "test" } });
    if (!error) {
      setTestEmailStatus("Correo de prueba enviado ✓");
      return;
    }
    // supabase-js's error.message is a generic "non-2xx status code" string —
    // the actual reason is in the response body it attaches as `context`.
    let detail = error.message;
    const context = (error as { context?: Response }).context;
    if (context) {
      try {
        const body = await context.clone().json();
        detail = body?.error ?? detail;
      } catch {
        try {
          detail = (await context.clone().text()) || detail;
        } catch {
          // keep the generic message
        }
      }
    }
    setTestEmailStatus(`Error: ${detail}`);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
    >
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <Text style={[styles.title, { color: theme.colors.text }]}>Ajustes</Text>

      <Section title="Apariencia" theme={theme}>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => update({ themeMode: opt.value })}
              style={[
                styles.themePill,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: settings.themeMode === opt.value ? theme.colors.accent : "transparent",
                },
              ]}
            >
              <Text style={{ color: settings.themeMode === opt.value ? "#fff" : theme.colors.text, fontSize: 13 }}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Section>

      {isSupabaseConfigured && (
        <Section title="Cuenta" theme={theme}>
          {session ? (
            <>
              <Text style={{ color: theme.colors.text, fontSize: 14 }}>Conectado como {session.user.email}</Text>
              <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>
                Tus ramos y notas se sincronizan en la nube y las alertas por correo están activas.
              </Text>
              <Pressable onPress={signOut} style={[styles.secondaryButton, { borderColor: theme.colors.border }]}>
                <Text style={{ color: theme.colors.text, fontSize: 13 }}>Cerrar sesión</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>
                Inicia sesión para sincronizar en la nube y recibir alertas por correo. Sin cuenta, DayGrid funciona solo en este dispositivo.
              </Text>
              <TextInput
                value={authEmail}
                onChangeText={setAuthEmail}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={theme.colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.surface }]}
              />
              <TextInput
                value={authPassword}
                onChangeText={setAuthPassword}
                placeholder="Contraseña"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry
                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.surface }]}
              />
              {authError && <Text style={{ color: theme.colors.danger, fontSize: 12 }}>{authError}</Text>}
              <View style={styles.themeRow}>
                <Pressable
                  onPress={() => signIn(authEmail.trim(), authPassword)}
                  style={[styles.themePill, { borderColor: theme.colors.border, backgroundColor: theme.colors.accent }]}
                >
                  <Text style={{ color: "#fff", fontSize: 13 }}>Iniciar sesión</Text>
                </Pressable>
                <Pressable
                  onPress={() => signUp(authEmail.trim(), authPassword)}
                  style={[styles.themePill, { borderColor: theme.colors.border }]}
                >
                  <Text style={{ color: theme.colors.text, fontSize: 13 }}>Registrarse</Text>
                </Pressable>
              </View>
            </>
          )}
        </Section>
      )}

      <Section title="Alertas por correo" theme={theme}>
        <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>
          Correo donde recibirás avisos de exámenes, entregas y cambios de horario.
        </Text>
        <TextInput
          value={emailDraft}
          onChangeText={setEmailDraft}
          onEndEditing={() => update({ alertEmail: emailDraft.trim() || null })}
          placeholder="tu@correo.com"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[
            styles.input,
            { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.surface },
          ]}
        />

        <Text style={[styles.helperText, { color: theme.colors.textMuted, marginTop: 12 }]}>
          Avisar con {settings.reminderLeadDays} día(s) de anticipación.
        </Text>
        <View style={styles.leadDaysRow}>
          {[1, 2, 3, 5, 7].map((days) => (
            <Pressable
              key={days}
              onPress={() => update({ reminderLeadDays: days })}
              style={[
                styles.themePill,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: settings.reminderLeadDays === days ? theme.colors.accent : "transparent",
                },
              ]}
            >
              <Text style={{ color: settings.reminderLeadDays === days ? "#fff" : theme.colors.text, fontSize: 13 }}>
                {days}d
              </Text>
            </Pressable>
          ))}
        </View>

        {session && (
          <>
            <Pressable onPress={sendTestEmail} style={[styles.secondaryButton, { borderColor: theme.colors.border, marginTop: 8 }]}>
              <Text style={{ color: theme.colors.text, fontSize: 13 }}>Enviar correo de prueba</Text>
            </Pressable>
            {testEmailStatus && <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>{testEmailStatus}</Text>}
          </>
        )}
      </Section>
    </ScrollView>
  );
}

function Section({ title, theme, children }: { title: string; theme: ReturnType<typeof useTheme>; children: React.ReactNode }) {
  return (
    <View style={[styles.section, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 4 },
  section: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  themeRow: { flexDirection: "row", gap: 8 },
  themePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  helperText: { fontSize: 13 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  leadDaysRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  secondaryButton: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
});
