/**
 * screens/AdminRecoveryRequestsScreen.js
 *
 * Admin-only screen to review, approve, or reject account recovery requests.
 * Add a navigation entry point from your existing AdminScreen.
 */

import { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, RefreshControl, Modal,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTheme }   from "../context/ThemeContext";
import { useNetwork } from "../context/NetworkContext";
import useSpinner     from "../hooks/useSpinner";
import HushCircleSpinner from "../components/HushCircleSpinner";
import api             from "../api/api";

function formatDate(dateStr) {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_COLORS = {
  pending:  "#F0B429",
  approved: "#34D399",
  rejected: "#D4607A",
};

function StatusBadge({ status, C }) {
  const color = STATUS_COLORS[status] || C.textMuted;
  return (
    <View style={{ backgroundColor: color + "22", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: color + "44" }}>
      <Text style={{ color, fontFamily: "Nunito_700Bold", fontSize: 11, textTransform: "uppercase" }}>{status}</Text>
    </View>
  );
}

function MatchRow({ label, submitted, actual, C }) {
  const matches = submitted?.toLowerCase().trim() === actual?.toLowerCase().trim();
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ color: C.textMuted, fontFamily: "Nunito_700Bold", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 10 }}>Submitted</Text>
          <Text style={{ color: C.text, fontFamily: "Nunito_600SemiBold", fontSize: 13 }}>{submitted || "—"}</Text>
        </View>
        <Text style={{ fontSize: 16, color: matches ? "#34D399" : "#D4607A", alignSelf: "center" }}>
          {matches ? "✓" : "✕"}
        </Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 10 }}>Actual account</Text>
          <Text style={{ color: C.text, fontFamily: "Nunito_600SemiBold", fontSize: 13 }}>{actual || "Not found"}</Text>
        </View>
      </View>
    </View>
  );
}

function RequestDetailModal({ visible, onClose, requestId, onActioned, C, spinner }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminNote, setAdminNote] = useState("");

  useFocusEffect(useCallback(() => {
    if (!visible || !requestId) return;
    setLoading(true);
    api.get(`/recovery/admin/requests/${requestId}`)
      .then((res) => setDetail(res.data))
      .catch(() => Alert.alert("Error", "Could not load request details."))
      .finally(() => setLoading(false));
  }, [visible, requestId]));

  const handleApprove = () => {
    Alert.alert(
      "Approve this request?",
      "This will disable two-step verification on the account so the user can sign in with just their password.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            await spinner.withSpinner(async () => {
              try {
                await api.post(`/recovery/admin/requests/${requestId}/approve`, { adminNote });
                Alert.alert("Approved 💜", "Two-step has been disabled and the user has been notified.");
                onActioned();
                onClose();
              } catch (err) {
                Alert.alert("Error", err.response?.data?.message || "Could not approve request.");
              }
            }, "Approving request...");
          },
        },
      ]
    );
  };

  const handleReject = () => {
    Alert.alert(
      "Reject this request?",
      "The user will be notified that their request could not be verified.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            await spinner.withSpinner(async () => {
              try {
                await api.post(`/recovery/admin/requests/${requestId}/reject`, { adminNote });
                Alert.alert("Rejected", "The user has been notified.");
                onActioned();
                onClose();
              } catch (err) {
                Alert.alert("Error", err.response?.data?.message || "Could not reject request.");
              }
            }, "Rejecting request...");
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "88%" }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {loading ? (
              <ActivityIndicator color={C.accent} style={{ marginVertical: 40 }} />
            ) : detail ? (
              <>
                <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 20, marginBottom: 16 }}>
                  Recovery request
                </Text>

                <StatusBadge status={detail.request.status} C={C} />

                <View style={{ height: 16 }} />

                <MatchRow label="Pseudonym" submitted={detail.request.submittedPseudonym} actual={detail.liveAccount?.pseudonym} C={C} />
                <MatchRow label="Email" submitted={detail.request.submittedEmail} actual={detail.liveAccount?.email} C={C} />

                {detail.request.submittedAccountAge ? (
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ color: C.textMuted, fontFamily: "Nunito_700Bold", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>
                      Claimed account age
                    </Text>
                    <Text style={{ color: C.text, fontFamily: "Nunito_400Regular", fontSize: 13 }}>{detail.request.submittedAccountAge}</Text>
                    {detail.liveAccount?.createdAt ? (
                      <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11, marginTop: 2 }}>
                        Actual account created: {formatDate(detail.liveAccount.createdAt)}
                      </Text>
                    ) : null}
                  </View>
                ) : null}

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: C.textMuted, fontFamily: "Nunito_700Bold", fontSize: 11, textTransform: "uppercase", marginBottom: 4 }}>
                    Reason given
                  </Text>
                  <View style={{ backgroundColor: C.bg, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.border }}>
                    <Text style={{ color: C.text, fontFamily: "Nunito_400Regular", fontSize: 13, lineHeight: 19 }}>
                      {detail.request.reason}
                    </Text>
                  </View>
                </View>

                {detail.liveAccount ? (
                  <View style={{ backgroundColor: C.accent + "12", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.accent + "30", marginBottom: 16 }}>
                    <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12, marginBottom: 6 }}>Account security status</Text>
                    <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 18 }}>
                      Two-step: {detail.liveAccount.twoStepEnabled ? "Enabled" : "Disabled"}{"\n"}
                      Passkey: {detail.liveAccount.passkeyEnabled ? "Enabled" : "Disabled"}{"\n"}
                      Banned: {detail.liveAccount.isBanned ? "Yes" : "No"}
                    </Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: "#D4607A18", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#D4607A44", marginBottom: 16 }}>
                    <Text style={{ color: "#D4607A", fontFamily: "Nunito_700Bold", fontSize: 12 }}>
                      No matching account found for this email.
                    </Text>
                  </View>
                )}

                {detail.request.status === "pending" ? (
                  <>
                    <Text style={{ color: C.accentSoft, fontFamily: "Nunito_700Bold", fontSize: 12, marginBottom: 6 }}>
                      Admin note (optional)
                    </Text>
                    <TextInput
                      style={{ backgroundColor: C.bg, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12, color: C.text, fontFamily: "Nunito_400Regular", fontSize: 13, minHeight: 60, textAlignVertical: "top", marginBottom: 20 }}
                      value={adminNote} onChangeText={setAdminNote}
                      placeholder="Internal note about this decision..."
                      placeholderTextColor={C.textMuted} multiline
                    />

                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <TouchableOpacity
                        style={{ flex: 1, backgroundColor: "#D4607A", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
                        onPress={handleReject}
                      >
                        <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 }}>Reject</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ flex: 1, backgroundColor: C.accent, borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
                        onPress={handleApprove}
                      >
                        <Text style={{ color: "#fff", fontFamily: "Nunito_700Bold", fontSize: 14 }}>Approve 💜</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <View style={{ backgroundColor: C.bg, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: C.border }}>
                    <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, lineHeight: 18 }}>
                      Reviewed by {detail.request.reviewedBy?.pseudonym || "admin"} on {formatDate(detail.request.reviewedAt)}
                      {detail.request.adminNote ? `\n\nNote: ${detail.request.adminNote}` : ""}
                    </Text>
                  </View>
                )}

                <TouchableOpacity style={{ marginTop: 16, alignItems: "center" }} onPress={onClose}>
                  <Text style={{ color: C.textMuted, fontFamily: "Nunito_600SemiBold", fontSize: 14 }}>Close</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function AdminRecoveryRequestsScreen() {
  const navigation = useNavigation();
  const { colors: C } = useTheme();
  const { isConnected } = useNetwork();
  const spinner = useSpinner();

  const [requests,  setRequests]  = useState([]);
  const [filter,    setFilter]    = useState("pending");
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [selectedId,setSelectedId]= useState(null);

  const load = useCallback(async () => {
    if (!isConnected) return;
    try {
      const params = filter === "all" ? {} : { status: filter };
      const res = await api.get("/recovery/admin/requests", { params });
      setRequests(res.data.requests || []);
    } catch (e) {
      console.log("Load recovery requests error:", e.message);
    }
  }, [isConnected, filter]);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]));

  const FILTERS = [
    { value: "pending",  label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "all",      label: "All" },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.card,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, justifyContent: "center" }}>
          <Text style={{ color: C.accent, fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <Text style={{ color: C.text, fontFamily: "DMSerifDisplay_400Regular", fontSize: 20 }}>Recovery Requests</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              backgroundColor: filter === f.value ? C.accent : C.card,
              borderWidth: 1, borderColor: filter === f.value ? C.accent : C.border,
            }}
            onPress={() => setFilter(f.value)}
          >
            <Text style={{ color: filter === f.value ? "#fff" : C.textMuted, fontFamily: "Nunito_700Bold", fontSize: 12 }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor={C.accent} />
          }
        >
          {requests.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
              <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 14 }}>
                No {filter !== "all" ? filter : ""} requests
              </Text>
            </View>
          ) : (
            requests.map((req) => (
              <TouchableOpacity
                key={req._id}
                style={{ backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 }}
                onPress={() => setSelectedId(req._id)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text style={{ color: C.text, fontFamily: "Nunito_700Bold", fontSize: 15 }}>{req.submittedPseudonym}</Text>
                  <StatusBadge status={req.status} C={C} />
                </View>
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 12, marginBottom: 4 }}>{req.submittedEmail}</Text>
                <Text style={{ color: C.textMuted, fontFamily: "Nunito_400Regular", fontSize: 11 }}>
                  Submitted {formatDate(req.createdAt)}{!req.user ? "  ·  No matching account" : ""}
                </Text>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <RequestDetailModal
        visible={!!selectedId}
        requestId={selectedId}
        onClose={() => setSelectedId(null)}
        onActioned={load}
        C={C}
        spinner={spinner}
      />
      <HushCircleSpinner visible={spinner.visible} message={spinner.message} />
    </View>
  );
}