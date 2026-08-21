"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "../context/theme";

type Beneficiary = {
  id: string;
  name: string;
  currency: string;
  account_number: string;
  account_name: string;
  bank_name: string;
  bank_code: string;
  status: "pending_review" | "approved" | "rejected";
};

type Withdrawal = {
  id: string;
  amount_naira: number;
  status: "pending" | "completed" | "failed";
  failure_reason: string | null;
  created_at: string;
};

// Common Nigerian bank codes -- a starting set for the picker. Bachs
// exposes a real List Banks endpoint (GET /v1/reference/banks per their
// docs index) that would replace this with the live, authoritative list
// -- left as a manual list here since that endpoint's exact response
// shape hasn't been confirmed against Bachs' real docs yet, and this
// avoids guessing field names for a money-moving flow. Swap this out
// once List Banks is verified.


export default function DepositWithdraw() {
  const { theme, t, isLoggedIn, getValidToken, refreshPortfolio, cashNaira } = useTheme();
  const router = useRouter();

  const [tab, setTab] = useState<"deposit" | "withdraw">("deposit");

  // ---- deposit ----
  const [depositAmount, setDepositAmount] = useState(1000);
  const [depositStatus, setDepositStatus] = useState<{ loading: boolean; message: string | null }>({ loading: false, message: null });

  const handleDeposit = async () => {
    if (!depositAmount || depositAmount <= 0) {
      setDepositStatus({ loading: false, message: "Enter an amount first." });
      return;
    }
    setDepositStatus({ loading: true, message: null });
    try {
      const token = await getValidToken();
      if (!token) {
        setDepositStatus({ loading: false, message: "Please sign in first." });
        return;
      }
      const res = await fetch("https://sireai.uk/pm-api/me/deposit/init", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ naira: depositAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDepositStatus({ loading: false, message: data.detail || "Couldn't start the deposit — try again." });
        return;
      }
      window.location.href = data.checkout_url;
    } catch {
      setDepositStatus({ loading: false, message: "Network error — try again." });
    }
  };

  // ---- withdraw: beneficiaries ----
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [beneficiariesLoading, setBeneficiariesLoading] = useState(true);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string | null>(null);

  const [showAddBeneficiary, setShowAddBeneficiary] = useState(false);
  const [newBankCode, setNewBankCode] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolvedBankName, setResolvedBankName] = useState<string | null>(null);
  const [addStatus, setAddStatus] = useState<{ loading: boolean; error: string | null }>({ loading: false, error: null });

  const fetchBeneficiaries = async () => {
    setBeneficiariesLoading(true);
    try {
      const token = await getValidToken();
      if (!token) return;
      const res = await fetch("https://sireai.uk/pm-api/me/beneficiaries", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data: Beneficiary[] = await res.json();
      setBeneficiaries(data);
      if (data.length > 0 && !selectedBeneficiaryId) {
        const firstApproved = data.find((b) => b.status === "approved");
        if (firstApproved) setSelectedBeneficiaryId(firstApproved.id);
      }
    } catch {
      // list just won't show -- non-critical
    } finally {
      setBeneficiariesLoading(false);
    }
  };


  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);

useEffect(() => {
  const loadBanks = async () => {
    try {
      const token = await getValidToken();
      if (!token) return;
      const res = await fetch("https://sireai.uk/pm-api/me/banks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data: { name: string; code: string }[] = await res.json();
      setBanks(data);
    } catch {
      // bank dropdown just stays empty -- user sees no options rather than a crash
    }
  };
  if (isLoggedIn) loadBanks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);
  useEffect(() => {
    if (isLoggedIn) fetchBeneficiaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const handleResolveAccount = async () => {
    if (!newBankCode || newAccountNumber.length < 10) {
      setAddStatus({ loading: false, error: "Select a bank and enter a valid account number." });
      return;
    }
    setAddStatus({ loading: true, error: null });
    setResolvedName(null);
    setResolvedBankName(null);
    try {
      const token = await getValidToken();
      if (!token) return;
      const res = await fetch("https://sireai.uk/pm-api/me/beneficiaries/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bank_code: newBankCode, account_number: newAccountNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddStatus({ loading: false, error: data.detail || "Couldn't verify that account." });
        return;
      }
      setResolvedName(data.account_name);
      setResolvedBankName(data.bank_name);
      setAddStatus({ loading: false, error: null });
    } catch {
      setAddStatus({ loading: false, error: "Network error — try again." });
    }
  };

  const handleSaveBeneficiary = async () => {
    setAddStatus({ loading: true, error: null });
    try {
      const token = await getValidToken();
      if (!token) return;
      const res = await fetch("https://sireai.uk/pm-api/me/beneficiaries", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newLabel || resolvedName || "My account",
          bank_code: newBankCode,
          account_number: newAccountNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddStatus({ loading: false, error: data.detail || "Couldn't save that account." });
        return;
      }
      setAddStatus({ loading: false, error: null });
      setShowAddBeneficiary(false);
      setNewBankCode("");
      setNewAccountNumber("");
      setNewLabel("");
      setResolvedName(null);
      setResolvedBankName(null);
      await fetchBeneficiaries();
    } catch {
      setAddStatus({ loading: false, error: "Network error — try again." });
    }
  };

  const handleDeleteBeneficiary = async (id: string) => {
    try {
      const token = await getValidToken();
      if (!token) return;
      await fetch(`https://sireai.uk/pm-api/me/beneficiaries/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (selectedBeneficiaryId === id) setSelectedBeneficiaryId(null);
      await fetchBeneficiaries();
    } catch {
      // fine to just leave it in the list if this fails -- user can retry
    }
  };

  // ---- withdraw: amount + submit ----
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [withdrawStatus, setWithdrawStatus] = useState<{ loading: boolean; error: string | null; success: string | null }>({ loading: false, error: null, success: null });

  const handleWithdraw = async () => {
    if (!selectedBeneficiaryId) {
      setWithdrawStatus({ loading: false, error: "Select an account to withdraw to first.", success: null });
      return;
    }
    if (!withdrawAmount || withdrawAmount <= 0) {
      setWithdrawStatus({ loading: false, error: "Enter an amount first.", success: null });
      return;
    }
    if (cashNaira != null && withdrawAmount > cashNaira) {
      setWithdrawStatus({ loading: false, error: "That's more than your available cash.", success: null });
      return;
    }
    setWithdrawStatus({ loading: true, error: null, success: null });
    try {
      const token = await getValidToken();
      if (!token) return;
      const res = await fetch("https://sireai.uk/pm-api/me/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ beneficiary_id: selectedBeneficiaryId, naira: withdrawAmount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWithdrawStatus({ loading: false, error: data.detail || "Withdrawal failed", success: null });
        return;
      }
      setWithdrawStatus({ loading: false, error: null, success: `Withdrawal of ₦${withdrawAmount.toLocaleString()} started — it'll land shortly.` });
      setWithdrawAmount(0);
      await refreshPortfolio();
    } catch {
      setWithdrawStatus({ loading: false, error: "Network error — try again", success: null });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} flex items-center justify-center px-6`}>
        <div className="text-center">
          <p className={`text-sm ${t.textMuted} mb-4`}>Sign in to deposit or withdraw.</p>
          <button
            onClick={() => router.push("/?auth=1")}
            className="text-sm px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-semibold border-none cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${t.pageBg} ${t.textPrimary} font-sans pb-20`}>
      <nav className={`sticky top-0 z-10 ${t.navBg} border-b ${t.border} shadow-sm`}>
        <div className="flex items-center gap-3 px-3 md:px-6 h-12">
          <button onClick={() => router.push("/more")} className={`${t.textMuted} bg-transparent border-none cursor-pointer p-1`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className={`text-sm font-bold ${t.textPrimary}`}>Deposit & Withdraw</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-5">
        <div className={`flex rounded-xl overflow-hidden border ${t.border} mb-6`}>
          <button
            onClick={() => setTab("deposit")}
            className={`flex-1 text-sm font-semibold py-3 border-none cursor-pointer transition-colors ${
              tab === "deposit" ? "bg-blue-500 text-white" : `${t.inputBg} ${t.textMuted}`
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setTab("withdraw")}
            className={`flex-1 text-sm font-semibold py-3 border-none cursor-pointer transition-colors ${
              tab === "withdraw" ? "bg-blue-500 text-white" : `${t.inputBg} ${t.textMuted}`
            }`}
          >
            Withdraw
          </button>
        </div>

        {tab === "deposit" && (
          <div className={`${t.cardBg} border ${t.border} rounded-2xl p-5`}>
            <p className={`text-xs ${t.textMuted} mb-1.5`}>Amount (₦)</p>
            <input
              type="number"
              min={100}
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none mb-4`}
            />
            {depositStatus.message && <p className="text-xs text-red-500 mb-3 text-center">{depositStatus.message}</p>}
            <button
              onClick={handleDeposit}
              disabled={depositStatus.loading}
              className={`w-full py-3 rounded-xl font-semibold text-sm border-none cursor-pointer disabled:opacity-50 ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
            >
              {depositStatus.loading ? "…" : `Pay ₦${depositAmount.toLocaleString()} with Bachs`}
            </button>
            <p className={`text-[10px] ${t.textMuted} text-center mt-3`}>
              Your balance updates automatically once payment is confirmed.
            </p>
          </div>
        )}

        {tab === "withdraw" && (
          <div className="flex flex-col gap-4">
            <div className={`${t.cardBg} border ${t.border} rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-xs font-semibold ${t.textMuted} uppercase tracking-wide`}>Withdraw to</p>
                <button
                  onClick={() => setShowAddBeneficiary((v) => !v)}
                  className="text-xs font-semibold text-blue-500 bg-transparent border-none cursor-pointer"
                >
                  {showAddBeneficiary ? "Cancel" : "+ Add account"}
                </button>
              </div>

              {showAddBeneficiary && (
                <div className={`rounded-xl border ${t.border} p-4 mb-4 flex flex-col gap-3`}>
                  <select
                    value={newBankCode}
                    onChange={(e) => { setNewBankCode(e.target.value); setResolvedName(null); }}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`}
                  >
                    <option value="">Select bank</option>
                    {banks.map((b) => (
                      <option key={b.code} value={b.code}>{b.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Account number"
                    value={newAccountNumber}
                    onChange={(e) => { setNewAccountNumber(e.target.value.replace(/\D/g, "")); setResolvedName(null); }}
                    maxLength={10}
                    className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`}
                  />

                  {!resolvedName ? (
                    <button
                      onClick={handleResolveAccount}
                      disabled={addStatus.loading}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold border ${t.border} ${t.textPrimary} bg-transparent cursor-pointer disabled:opacity-50`}
                    >
                      {addStatus.loading ? "Checking…" : "Verify account"}
                    </button>
                  ) : (
                    <>
                      <div className={`rounded-lg px-3 py-2 ${theme === "dark" ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
                        <p className="text-sm font-semibold text-emerald-500">{resolvedName}</p>
                        <p className={`text-xs ${t.textMuted}`}>{resolvedBankName}</p>
                      </div>
                      <input
                        type="text"
                        placeholder="Label (optional, e.g. My Savings)"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none`}
                      />
                      <button
                        onClick={handleSaveBeneficiary}
                        disabled={addStatus.loading}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer disabled:opacity-50 bg-blue-500 hover:bg-blue-400 text-white"
                      >
                        {addStatus.loading ? "Saving…" : "Save account"}
                      </button>
                    </>
                  )}
                  {addStatus.error && <p className="text-xs text-red-500 text-center">{addStatus.error}</p>}
                </div>
              )}

              {beneficiariesLoading && <p className={`text-sm ${t.textMuted}`}>Loading your accounts…</p>}
              {!beneficiariesLoading && beneficiaries.length === 0 && (
                <p className={`text-sm ${t.textMuted}`}>No accounts saved yet — add one above.</p>
              )}
              <div className="flex flex-col gap-2">
                {beneficiaries.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => b.status === "approved" && setSelectedBeneficiaryId(b.id)}
                    className={`flex items-center justify-between px-3 py-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedBeneficiaryId === b.id ? "border-blue-500 bg-blue-500/5" : `${t.border} ${b.status !== "approved" ? "opacity-50" : ""}`
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-medium ${t.textPrimary}`}>{b.name}</p>
                      <p className={`text-xs ${t.textMuted}`}>{b.bank_name} · ****{b.account_number?.slice(-4)}</p>
                      {b.status !== "approved" && (
                        <span className="text-[10px] text-amber-500 font-medium">
                          {b.status === "pending_review" ? "Pending review" : "Rejected"}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteBeneficiary(b.id); }}
                      className={`p-1.5 rounded-lg ${t.textMuted} bg-transparent border-none cursor-pointer`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${t.cardBg} border ${t.border} rounded-2xl p-5`}>
              <p className={`text-xs ${t.textMuted} mb-1.5`}>Amount (₦)</p>
              <input
                type="number"
                min={1}
                value={withdrawAmount || ""}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                placeholder="0"
                className={`w-full px-3 py-2.5 rounded-xl text-sm border ${t.border} ${t.inputBg} ${t.textPrimary} outline-none mb-1`}
              />
              <p className={`text-xs ${t.textMuted} mb-4`}>
                Available: ₦{cashNaira != null ? cashNaira.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "…"}
              </p>

              {withdrawStatus.error && <p className="text-xs text-red-500 mb-3 text-center">{withdrawStatus.error}</p>}
              {withdrawStatus.success && <p className="text-xs text-emerald-500 mb-3 text-center">{withdrawStatus.success}</p>}

              <button
                onClick={handleWithdraw}
                disabled={withdrawStatus.loading || !selectedBeneficiaryId}
                className={`w-full py-3 rounded-xl font-semibold text-sm border-none cursor-pointer disabled:opacity-50 ${theme === "dark" ? "bg-white text-black" : "bg-black text-white"}`}
              >
                {withdrawStatus.loading ? "…" : "Withdraw"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}