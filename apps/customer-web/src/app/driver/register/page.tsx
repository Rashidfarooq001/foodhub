
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bike, User, MapPin, CreditCard, CheckCircle2, ArrowRight, FileText, Navigation } from "lucide-react";
import { MediaUploader } from "../../../components/common/MediaUploader";
import { getApiBaseUrl } from "@foodhub/config";

const API_BASE = getApiBaseUrl();

export default function DriverRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    licenseNumber: "",
    vehicleType: "MOTORCYCLE",
    vehicleNumber: "",
    address: "",
    licenseUrl: "",
    rcUrl: "",
    idProofUrl: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    upiId: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const isPhoneVerified = true;
  const isVerifyingPhone = false;
  const setIsPhoneVerified = (v: any) => {};
  const setIsVerifyingPhone = (v: any) => {};



  const formatIdentifier = (raw: string) => {
    const cleaned = raw.replace(/D/g, "");
    return cleaned.length === 10 ? "91" + cleaned : cleaned;
  };

  const handleVerifyPhoneWithWidget = async () => {
    const cleanDigits = form.phone.replace(/D/g, "");
    if (cleanDigits.length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number");
      return;
    }
    setErrorMsg("");
    setIsVerifyingPhone(true);
    try {
      const widgetId = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || "3668626d5043313835303335";
      const tokenAuth = process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN || process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || "556022TLShucwZ86a6d8a7bP1";
      const identifier = formatIdentifier(form.phone);
      const configuration = {
        widgetId,
        tokenAuth,
        identifier,
        success: (data: any) => { setIsPhoneVerified(true); setIsVerifyingPhone(false); },
        failure: (error: any) => { setErrorMsg(error.message || "OTP Verification failed"); setIsVerifyingPhone(false); }
      };
      if ((window as any).initSendOTP) {
        (window as any).initSendOTP(configuration);
      } else {
        throw new Error("OTP service unavailable");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Connection error");
      setIsVerifyingPhone(false);
    }
  };

  const [isLocatingOwner, setIsLocatingOwner] = useState(false);
  const [locationStatusMsg, setLocationStatusMsg] = useState("");

  const handleGetOwnerLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatusMsg("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocatingOwner(true);
    setLocationStatusMsg("Acquiring GPS coordinates...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const geoRes = await fetch(API_BASE + "/geolocation/reverse-geocode?lat=" + lat + "&lng=" + lng);
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (typeof geoData !== "string") {
              const address = geoData.formattedAddress || geoData.address || geoData.displayName || geoData.street || "";
              const city = geoData.city || geoData.village || geoData.district || geoData.locality || "";
              const state = geoData.state || "";
              const pin = geoData.pincode || geoData.postalCode || "";
              const fullAddr = [address, city, state, pin].filter(Boolean).join(", ");
              setForm((prev) => ({ ...prev, address: fullAddr }));
            }
          }
        } catch {}
        setIsLocatingOwner(false);
        setLocationStatusMsg("GPS Location captured: " + lat.toFixed(4) + ", " + lng.toFixed(4));
      },
      (err) => {
        setIsLocatingOwner(false);
        setLocationStatusMsg("Location permission denied.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleChange = (e: any) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === "phone") {
      setIsPhoneVerified(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setErrorMsg("");

    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: "+91" + form.phone.replace(/D/g, ""),
        email: form.email.trim() || undefined,
        password: form.password,
        licenseNumber: form.licenseNumber.trim(),
        vehicleType: form.vehicleType,
        vehicleNumber: form.vehicleNumber.trim() || undefined,
        address: form.address.trim() || undefined,
        licenseUrl: form.licenseUrl || undefined,
        rcUrl: form.rcUrl || undefined,
        idProofUrl: form.idProofUrl || undefined,
        bankName: form.bankName.trim() || undefined,
        accountNumber: form.accountNumber.trim() || undefined,
        ifsc: form.ifsc.trim() || undefined,
        upiId: form.upiId.trim() || undefined,
      };

      const res = await fetch(API_BASE + "/drivers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setErrorMsg(data.message || "Registration failed. Please check form details.");
      }
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4 py-12">
        <div className="w-full max-w-lg text-center space-y-6 rounded-3xl bg-white p-8 sm:p-10 shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-gray-900">Application Submitted!</h1>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Your delivery partner application has been received and is under review.
            </p>
          </div>
          <Link href="/" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-gray-800">
            Return to ZaykaFood
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">BECOME A DELIVERY PARTNER</h1>
          <p className="text-xs font-bold text-gray-500">Join ZaykaFood and earn on your own schedule.</p>
        </div>

        {errorMsg && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-700 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xl space-y-6">
          
          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-2">
              <User className="h-4 w-4 text-orange-600" /> Personal Information
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input type="text" name="name" required value={form.name} onChange={handleChange} className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Mobile Number *</label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <input type="tel" name="phone" required value={form.phone} onChange={handleChange} readOnly={isPhoneVerified} className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none" />
                  {!isPhoneVerified && (
                    <button type="button" onClick={handleVerifyPhoneWithWidget} disabled={isVerifyingPhone || form.phone.length < 10} className="w-full sm:w-auto shrink-0 flex items-center justify-center rounded-2xl bg-orange-100 px-4 py-2 text-xs font-bold text-orange-700 hover:bg-orange-200 transition disabled:opacity-50">
                      {isVerifyingPhone ? "Sending..." : "Verify"}
                    </button>
                  )}
                  {isPhoneVerified && (
                    <div className="w-full sm:w-auto shrink-0 flex items-center justify-center rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Verified
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
                <input type="password" name="password" required value={form.password} onChange={handleChange} className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
              <h2 className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-wider">
                <MapPin className="h-4 w-4 text-orange-600" /> Location &amp; Address
              </h2>
              <button type="button" onClick={handleGetOwnerLocation} disabled={isLocatingOwner} className="flex items-center gap-1.5 rounded-2xl bg-orange-600 px-3 py-1.5 text-[10px] font-bold text-white shadow hover:bg-orange-700 disabled:opacity-50 transition">
                <Navigation className={"h-3 w-3 " + (isLocatingOwner ? "animate-spin" : "")} />
                <span>{isLocatingOwner ? "Locating..." : "Use Current Location"}</span>
              </button>
            </div>
            {locationStatusMsg && (
              <div className={"rounded-2xl p-2 text-[10px] font-bold border " + (locationStatusMsg.includes("captured") ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-900 border-amber-200")}>
                {locationStatusMsg}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Operating Address</label>
              <input type="text" name="address" required value={form.address} onChange={handleChange} className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none" />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-2">
              <Bike className="h-4 w-4 text-orange-600" /> Vehicle Information
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Driving License Number *</label>
                <input type="text" name="licenseNumber" required value={form.licenseNumber} onChange={handleChange} className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle Type *</label>
                <select name="vehicleType" required value={form.vehicleType} onChange={handleChange} className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none">
                  <option value="MOTORCYCLE">Motorcycle</option>
                  <option value="SCOOTER">Scooter</option>
                  <option value="EV_SCOOTER">EV Scooter</option>
                  <option value="BICYCLE">Bicycle</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Vehicle Registration Number</label>
                <input type="text" name="vehicleNumber" required={form.vehicleType !== "BICYCLE"} value={form.vehicleNumber} onChange={handleChange} className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-2">
              <FileText className="h-4 w-4 text-orange-600" /> Required Documents
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <MediaUploader label="Driving License *" acceptType="image" value={form.licenseUrl} onChange={(url) => setForm(p => ({ ...p, licenseUrl: url }))} />
              <MediaUploader label="Aadhaar / ID *" acceptType="image" value={form.idProofUrl} onChange={(url) => setForm(p => ({ ...p, idProofUrl: url }))} />
              <MediaUploader label="Vehicle RC" acceptType="image" value={form.rcUrl} onChange={(url) => setForm(p => ({ ...p, rcUrl: url }))} />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-2">
              <CreditCard className="h-4 w-4 text-orange-600" /> Payout / Bank Details
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Bank Name</label>
                <input type="text" name="bankName" value={form.bankName} onChange={handleChange} className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Account Number</label>
                <input type="text" name="accountNumber" value={form.accountNumber} onChange={handleChange} className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">IFSC Code</label>
                <input type="text" name="ifsc" value={form.ifsc} onChange={handleChange} className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">UPI ID</label>
                <input type="text" name="upiId" value={form.upiId} onChange={handleChange} className="w-full rounded-2xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-900 focus:border-orange-500 focus:outline-none" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 py-3 text-sm font-black text-white shadow-xl hover:bg-gray-800 disabled:opacity-50 transition">
            <span>{isSubmitting ? "Submitting Application..." : "Submit Delivery Partner Registration"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
