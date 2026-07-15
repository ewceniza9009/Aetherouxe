import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import api from "@/lib/api";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface CompanySettings {
  company: {
    legalName?: string;
    tradeName?: string;
    tin?: string;
    secRegistration?: string;
    address?: string;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
  };
  locale?: string;
  currency?: string;
  currencySymbol?: string;
  timezone?: string;
  dateFormat?: string;
  fiscalYearStartMonth?: number;
  branding?: { primaryColor?: string; accentColor?: string; theme?: string };
  features?: Record<string, boolean>;
}

const CURRENCIES = ["PHP", "USD", "EUR", "SGD", "AED", "JPY", "GBP"];
const LOCALES = ["en-PH", "en-US", "en-GB", "en-SG", "en-AE"];
const TIMEZONES = ["Asia/Manila", "Asia/Singapore", "Asia/Dubai", "UTC", "America/New_York", "Europe/London"];
const DATE_FORMATS = ["MMM DD, YYYY", "YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY", "DD MMM YYYY"];

export default function SettingsPage() {
  const { user, refetchUser } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get("/settings/company")
      .then((res) => active && setSettings(res.data?.data ?? res.data))
      .catch(() => active && setSettings(null))
      .finally(() => active && setLoadingSettings(false));
    return () => {
      active = false;
    };
  }, []);

  const setCompany = (patch: Partial<CompanySettings["company"]>) =>
    setSettings((s) => (s ? { ...s, company: { ...s.company, ...patch } } : s));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await api.patch("/auth/me", { firstName, lastName, phone, email });
      await refetchUser();
      setMsg({ type: "success", text: "Profile saved successfully" });
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.message ?? "Failed to save profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMsg(null);
    try {
      await api.patch("/settings/company", {
        legalName: settings.company.legalName,
        tradeName: settings.company.tradeName,
        tin: settings.company.tin,
        secRegistration: settings.company.secRegistration,
        address: settings.company.address,
        contactEmail: settings.company.contactEmail,
        contactPhone: settings.company.contactPhone,
        website: settings.company.website,
        currency: settings.currency,
        currencySymbol: settings.currencySymbol,
        locale: settings.locale,
        timezone: settings.timezone,
        dateFormat: settings.dateFormat,
        fiscalYearStartMonth: settings.fiscalYearStartMonth,
        primaryColor: settings.branding?.primaryColor,
        accentColor: settings.branding?.accentColor,
        theme: settings.branding?.theme,
      });
      setMsg({ type: "success", text: "Company settings saved successfully" });
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.message ?? "Failed to save company settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    setSaving(true);
    setMsg(null);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setMsg({ type: "success", text: "Password changed successfully" });
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.message ?? "Failed to change password" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your profile, company configuration, and security</p>
      </div>

      {msg && (
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${
          msg.type === "success"
            ? "bg-green-50 border-green-200 text-green-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {msg.type === "success" ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSaveProfile}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="mt-4">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Company & Application Settings</CardTitle>
          <CardDescription>Configure your organization, currency, locale, and fiscal calendar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingSettings ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading company settings…
            </div>
          ) : (
            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="legalName">Legal Name</Label>
                  <Input id="legalName" value={settings?.company.legalName ?? ""} onChange={(e) => setCompany({ legalName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tradeName">Trade Name</Label>
                  <Input id="tradeName" value={settings?.company.tradeName ?? ""} onChange={(e) => setCompany({ tradeName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tin">TIN</Label>
                  <Input id="tin" value={settings?.company.tin ?? ""} onChange={(e) => setCompany({ tin: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sec">SEC Registration</Label>
                  <Input id="sec" value={settings?.company.secRegistration ?? ""} onChange={(e) => setCompany({ secRegistration: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input id="contactEmail" type="email" value={settings?.company.contactEmail ?? ""} onChange={(e) => setCompany({ contactEmail: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input id="contactPhone" value={settings?.company.contactPhone ?? ""} onChange={(e) => setCompany({ contactPhone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Registered Address</Label>
                <Input id="address" value={settings?.company.address ?? ""} onChange={(e) => setCompany({ address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" value={settings?.company.website ?? ""} onChange={(e) => setCompany({ website: e.target.value })} />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={settings?.currency ?? "PHP"}
                    onChange={(e) => setSettings((s) => (s ? { ...s, currency: e.target.value } : s))}
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currencySymbol">Currency Symbol</Label>
                  <Input id="currencySymbol" value={settings?.currencySymbol ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, currencySymbol: e.target.value } : s))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locale">Locale</Label>
                  <select
                    id="locale"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={settings?.locale ?? "en-PH"}
                    onChange={(e) => setSettings((s) => (s ? { ...s, locale: e.target.value } : s))}
                  >
                    {LOCALES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={settings?.timezone ?? "Asia/Manila"}
                    onChange={(e) => setSettings((s) => (s ? { ...s, timezone: e.target.value } : s))}
                  >
                    {TIMEZONES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <select
                    id="dateFormat"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={settings?.dateFormat ?? "MMM DD, YYYY"}
                    onChange={(e) => setSettings((s) => (s ? { ...s, dateFormat: e.target.value } : s))}
                  >
                    {DATE_FORMATS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fiscalYear">Fiscal Year Start Month</Label>
                  <Input
                    id="fiscalYear"
                    type="number"
                    min={1}
                    max={12}
                    value={settings?.fiscalYearStartMonth ?? 1}
                    onChange={(e) => setSettings((s) => (s ? { ...s, fiscalYearStartMonth: Number(e.target.value) } : s))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Brand Primary Color</Label>
                  <Input id="primaryColor" value={settings?.branding?.primaryColor ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, branding: { ...s.branding, primaryColor: e.target.value } } : s))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Brand Accent Color</Label>
                  <Input id="accentColor" value={settings?.branding?.accentColor ?? ""} onChange={(e) => setSettings((s) => (s ? { ...s, branding: { ...s.branding, accentColor: e.target.value } } : s))} />
                </div>
              </div>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save Company Settings
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Change your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
            </div>
            <Button type="submit" disabled={saving || !currentPassword || !newPassword}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
