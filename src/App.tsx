/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { 
  Users, 
  Globe, 
  Scale, 
  Zap, 
  Camera, 
  MapPin, 
  Calendar, 
  ChevronRight,
  Menu,
  X,
  Trophy,
  Star,
  CheckCircle2,
  CreditCard,
  ArrowRight,
  Upload,
  QrCode
} from "lucide-react";
import { useState, ChangeEvent } from "react";

// --- Types ---
interface RegistrationData {
  fullName: string;
  email: string;
  phone: string;
  institution: string;
  committee: string;
  experience: string;
  transactionId: string;
  screenshot: string;
}

// --- Client-side validation helpers ---
const isValidEmail = (value: string) => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value.trim());
const isValidPhone = (value: string) => /^(\+?\d{1,3})?[\s.-]?\d{10}$/.test(value.replace(/\s+/g, ""));
const isNonEmpty = (value: string) => value.trim().length > 0;
const isTxnIdLikely = (value: string) => /^[A-Za-z0-9]{8,}$/.test(value.trim());
const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024; // 2 MB

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxf9joQDR-ohJqXBqOWk6RxkVzz-mAsCZYrq2QkirxO4Hy3RxZNq2QseRlB8q4Gh5MybQ/exec";

// --- Razorpay Declaration ---
declare global {
  interface Window {
    Razorpay: any;
  }
}

const committees = [
  { 
    name: "UN Women", 
    topic: "Reviewing the Legal Status of Women associated with Non-State Armed Groups with a Special Emphasis on DDR Programs.", 
    icon: <Users className="w-6 h-6" />,
    eb: [
      { name: "Abuzar Shaikh", role: "Co-Chairperson" },
      { name: "Srujan Kutte", role: "Co-Chairperson" }
    ]
  },
  { 
    name: "JCC", 
    topic: "Discussing Coordinated International Responses to a Sudden and Unanticipated Global Development of System-Wide Consequence.", 
    icon: <Zap className="w-6 h-6" />,
    eb: [
      { name: "Aditya Kiran", role: "Chairperson" }
    ]
  },
  { 
    name: "UNSC", 
    topic: "The Situation in Libya. Freeze Date: 5th April 2019.", 
    icon: <Globe className="w-6 h-6" />,
    eb: [
      { name: "Darshan Kamat", role: "Chairperson" }
    ]
  },
  { 
    name: "FIA", 
    topic: "Addressing Competitive Inequality and Financial Sustainability in Formula One Across Generations. [SCHOOL COMMITTEE]", 
    icon: <Scale className="w-6 h-6" />,
    eb: [
      { name: "Tasya Sawant", role: "President" },
      { name: "Divit Jagatram", role: "Analyst" },
      { name: "Siddharth Dhawan", role: "Vice-President" }
    ]
  },
  { 
    name: "International Press", 
    topic: "Journalism & Photography.", 
    icon: <Camera className="w-6 h-6" />,
    eb: [
      { name: "Ishan Khare", role: "Head of Journalism" },
      { name: "Sujal Gaikwad", role: "Head of Photography" }
    ]
  },
];

const prizes = [
  { title: "Best Delegate", amount: "7k", rank: "1st" },
  { title: "High Commendation", amount: "5k", rank: "2nd" },
  { title: "Special Mention", amount: "3k", rank: "3rd", note: "*in kind" },
  { title: "Best Delegation", amount: "15k", rank: "Overall" },
];

const galleryImages = [
  "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&q=80&w=800",
];

// --- Registration Modal Component ---
const RegistrationModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RegistrationData>({
    fullName: "",
    email: "",
    phone: "",
    institution: "",
    committee: "",
    experience: "",
    transactionId: "",
    screenshot: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setUploadError("Please upload an image file (png/jpg).");
        return;
      }
      if (file.size > MAX_SCREENSHOT_BYTES) {
        setUploadError("Image too large (max 2MB). Compress and retry.");
        return;
      }
      setUploadError("");
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, screenshot: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    const step1Valid =
      isNonEmpty(formData.fullName) &&
      isValidEmail(formData.email) &&
      isValidPhone(formData.phone) &&
      isNonEmpty(formData.institution);
    const step2Valid = isNonEmpty(formData.committee);
    const step3Valid = step1Valid && step2Valid;
    const step4Valid = step3Valid && isTxnIdLikely(formData.transactionId) && !!formData.screenshot;

    if (!step4Valid) {
      alert("Please complete all required fields with valid details before submitting.");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // Required for Google Apps Script
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      // Since we use no-cors, we can't read the response, but we assume success if no error is thrown
      setIsSuccess(true);
    } catch (error) {
      console.error("Submission failed:", error);
      alert("Something went wrong. Please try again or contact support.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const step1Valid =
    isNonEmpty(formData.fullName) &&
    isValidEmail(formData.email) &&
    isValidPhone(formData.phone) &&
    isNonEmpty(formData.institution);
  const step2Valid = isNonEmpty(formData.committee);
  const step3Valid = step1Valid && step2Valid;
  const step4Valid = step3Valid && isTxnIdLikely(formData.transactionId) && !!formData.screenshot && !uploadError;

  const totalSteps = 4;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 md:p-6 overflow-y-auto"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 40 }}
          className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/5 rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.1)] flex flex-col lg:flex-row min-h-[600px]"
        >
          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 z-50 p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left Side: Immersive Visuals */}
          <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-[#d4af37]/10 via-black to-black p-16 flex-col justify-between relative overflow-hidden border-r border-white/5">
            {/* Celestial Decorations */}
            <div className="absolute top-[-10%] right-[-10%] w-80 h-80 bg-[#d4af37]/5 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-20%] left-[-20%] w-96 h-96 bg-[#d4af37]/5 rounded-full blur-[120px]" />
            
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-5xl font-display font-bold text-[#d4af37] mb-6 leading-[0.9] tracking-tighter">
                  Join the <br />
                  <span className="italic font-script font-normal text-white">Diplomatic</span> <br />
                  Circle.
                </h2>
                <div className="w-12 h-1 bg-[#d4af37] mb-8" />
                <p className="text-gray-400 font-light leading-relaxed text-lg max-w-xs">
                  Step into the shoes of world leaders and navigate the complexities of international relations.
                </p>
              </motion.div>
            </div>

                <div className="relative z-10 space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] group-hover:scale-110 transition-transform">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-1">Delegate Fee</p>
                    <p className="text-2xl font-bold font-display">₹1,500 <span className="text-xs font-light text-gray-500">INR</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-5 group">
                  <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-1">Event Dates</p>
                    <p className="text-lg font-medium text-gray-200">May 2nd - 3rd, 2026</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5">
                <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500 mb-4">Secure Payment via</p>
                <div className="flex items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
                  <QrCode className="w-5 h-5" />
                  <span className="text-sm font-bold tracking-widest uppercase">UPI QR Transfer</span>
                </div>
              </div>
            </div>

            {/* Decorative Celestial Image */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-[-15%] right-[-15%] opacity-10 pointer-events-none"
            >
              <img src="https://picsum.photos/seed/celestial/600/600" alt="" className="w-80 h-80 rounded-full grayscale invert" />
            </motion.div>
          </div>

          {/* Right Side: Form Content */}
          <div className="flex-1 p-10 md:p-16 halftone-bg flex flex-col">
            {isSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center space-y-8"
              >
                <div className="relative">
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl" 
                  />
                  <div className="relative w-24 h-24 rounded-full bg-green-500 flex items-center justify-center text-black">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-4xl font-display font-bold tracking-tight">Welcome Aboard!</h3>
                  <p className="text-gray-400 max-w-sm mx-auto leading-relaxed">
                    Your registration for <span className="text-[#d4af37] font-medium">{formData.committee}</span> is confirmed. 
                    Check your inbox at <span className="text-white">{formData.email}</span> for the delegate guide.
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="bg-[#d4af37] text-black px-12 py-5 rounded-full font-bold hover:bg-white transition-all shadow-xl shadow-[#d4af37]/20"
                >
                  Return to Galaxy
                </button>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col">
                {/* Progress Header */}
                <div className="mb-12">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.5em] text-[#d4af37] mb-1">Step 0{step}</p>
                      <h3 className="text-3xl font-display font-bold tracking-tight">
                        {step === 1 && "Personal Identity"}
                        {step === 2 && "Committee Choice"}
                        {step === 3 && "Review & Confirm"}
                        {step === 4 && "UPI Payment"}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">{step} / {totalSteps}</p>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(step / totalSteps) * 100}%` }}
                      className="h-full bg-[#d4af37]"
                    />
                  </div>
                </div>

                {/* Form Steps */}
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div 
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="grid grid-cols-1 gap-6">
                          <div className="group">
                            <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3 group-focus-within:text-[#d4af37] transition-colors">Full Name</label>
                            <div className="relative">
                              <Users className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 group-focus-within:text-[#d4af37] transition-colors" />
                              <input 
                                type="text" 
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                placeholder="Enter your full name"
                                className="w-full bg-white/5 border border-white/10 rounded-[24px] pl-16 pr-8 py-5 focus:border-[#d4af37]/50 focus:bg-white/[0.08] outline-none transition-all"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="group">
                              <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3 group-focus-within:text-[#d4af37] transition-colors">Email Address</label>
                              <input 
                                type="email" 
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="name@domain.com"
                                className="w-full bg-white/5 border border-white/10 rounded-[24px] px-8 py-5 focus:border-[#d4af37]/50 focus:bg-white/[0.08] outline-none transition-all"
                              />
                              {formData.email && !isValidEmail(formData.email) && (
                                <p className="text-xs text-red-400 mt-2">Enter a valid email.</p>
                              )}
                            </div>
                            <div className="group">
                              <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3 group-focus-within:text-[#d4af37] transition-colors">Phone Number</label>
                              <input 
                                type="tel" 
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="+91 00000 00000"
                                className="w-full bg-white/5 border border-white/10 rounded-[24px] px-8 py-5 focus:border-[#d4af37]/50 focus:bg-white/[0.08] outline-none transition-all"
                              />
                              {formData.phone && !isValidPhone(formData.phone) && (
                                <p className="text-xs text-red-400 mt-2">Enter a valid 10-digit number with country code if needed.</p>
                              )}
                            </div>
                          </div>
                          <div className="group">
                            <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3 group-focus-within:text-[#d4af37] transition-colors">Institution</label>
                            <input 
                              type="text" 
                              name="institution"
                              value={formData.institution}
                              onChange={handleInputChange}
                              placeholder="School or University name"
                              className="w-full bg-white/5 border border-white/10 rounded-[24px] px-8 py-5 focus:border-[#d4af37]/50 focus:bg-white/[0.08] outline-none transition-all"
                            />
                            {!formData.institution.trim() && (
                              <p className="text-xs text-red-400 mt-2">Institution is required.</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div 
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="space-y-6">
                          <div className="group">
                            <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3">Preferred Committee</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {committees.map(c => (
                                <button
                                  key={c.name}
                                  onClick={() => setFormData({ ...formData, committee: c.name })}
                                  className={`p-5 rounded-3xl border text-left transition-all flex items-center gap-4 ${
                                    formData.committee === c.name 
                                      ? 'bg-[#d4af37]/10 border-[#d4af37] text-[#d4af37]' 
                                      : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                  }`}
                                >
                                  <div className={`p-2 rounded-xl ${formData.committee === c.name ? 'bg-[#d4af37]/20' : 'bg-white/5'}`}>
                                    {c.icon}
                                  </div>
                                  <span className="font-medium">{c.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="group">
                            <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3">Previous MUN Experience</label>
                            <textarea 
                              name="experience"
                              value={formData.experience}
                              onChange={handleInputChange}
                              rows={4}
                              placeholder="Tell us about your previous MUNs, awards, or why you want to join this committee..."
                              className="w-full bg-white/5 border border-white/10 rounded-[24px] px-8 py-5 focus:border-[#d4af37]/50 focus:bg-white/[0.08] outline-none transition-all resize-none"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div 
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-8 space-y-6">
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Delegate</p>
                              <p className="font-medium">{formData.fullName}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Committee</p>
                              <p className="font-medium text-[#d4af37]">{formData.committee}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Contact</p>
                              <p className="font-medium">{formData.phone}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Institution</p>
                              <p className="font-medium">{formData.institution}</p>
                            </div>
                          </div>
                          <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                            <span className="text-gray-400">Total Amount</span>
                            <span className="text-2xl font-bold font-display text-[#d4af37]">₹1,500</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-[#d4af37]/5 rounded-2xl border border-[#d4af37]/10">
                          <Zap className="w-5 h-5 text-[#d4af37] shrink-0 mt-1" />
                          <p className="text-xs text-gray-400 leading-relaxed">
                            By proceeding, you agree to the conference terms and conditions. Registration fees are non-refundable.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {step === 4 && (
                      <motion.div 
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                        <div className="flex flex-col items-center text-center space-y-6">
                          <div className="p-4 bg-white rounded-[32px] shadow-2xl shadow-[#d4af37]/10">
                            {/* Placeholder for UPI QR Code - User should replace with their actual QR */}
                            <img 
                              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=shravanjare@okaxis%26pn=VICHAR%20MUN%202026%26am=1500%26cu=INR" 
                              alt="UPI QR Code" 
                              className="w-48 h-48"
                            />
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-[#d4af37]">Scan to pay ₹1,500</p>
                            <p className="text-xs text-gray-500">UPI ID: shravanjare@okaxis</p>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="group">
                            <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3">Transaction ID / Ref Number</label>
                            <input 
                              type="text" 
                              name="transactionId"
                              value={formData.transactionId}
                              onChange={handleInputChange}
                              placeholder="Enter 12-digit UPI Ref No."
                              className="w-full bg-white/5 border border-white/10 rounded-[24px] px-8 py-5 focus:border-[#d4af37]/50 focus:bg-white/[0.08] outline-none transition-all"
                            />
                            {formData.transactionId && !isTxnIdLikely(formData.transactionId) && (
                              <p className="text-xs text-red-400 mt-2">Add the UPI reference/transaction ID (min 8 characters).</p>
                            )}
                          </div>
                          
                          <div className="group">
                            <label className="block text-[10px] uppercase tracking-[0.3em] text-gray-500 mb-3">Payment Screenshot</label>
                            <div className="relative">
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="screenshot-upload"
                              />
                              <label 
                                htmlFor="screenshot-upload"
                                className="w-full bg-white/5 border border-dashed border-white/10 rounded-[24px] px-8 py-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-white/[0.08] hover:border-[#d4af37]/30 transition-all"
                              >
                                {formData.screenshot ? (
                                  <div className="flex items-center gap-3 text-green-500">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="text-sm font-medium">Screenshot Uploaded</span>
                                  </div>
                                ) : (
                                  <>
                                    <Upload className="w-6 h-6 text-gray-500" />
                                    <span className="text-sm text-gray-400">Click to upload screenshot</span>
                                  </>
                                )}
                              </label>
                              {uploadError && <p className="text-xs text-red-400 mt-2">{uploadError}</p>}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="mt-12 flex justify-between items-center">
                  {step > 1 ? (
                    <button 
                      onClick={() => setStep(step - 1)}
                      className="text-gray-500 hover:text-white transition-colors flex items-center gap-2 group"
                    >
                      <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30">
                        <ArrowRight className="w-4 h-4 rotate-180" />
                      </div>
                      <span className="text-xs uppercase tracking-widest">Back</span>
                    </button>
                  ) : (
                    <div />
                  )}
                  
                  <div className="flex gap-4">
                    {step < 4 ? (
                      <button 
                        onClick={() => setStep(step + 1)}
                        disabled={
                          (step === 1 && !step1Valid) ||
                          (step === 2 && !step2Valid)
                        }
                        className="bg-[#d4af37] text-black px-12 py-5 rounded-full font-bold flex items-center gap-3 disabled:opacity-30 disabled:grayscale transition-all hover:bg-white shadow-lg shadow-[#d4af37]/10"
                      >
                        {step === 3 ? "Proceed to Payment" : "Continue"} <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={handleSubmit}
                        disabled={isProcessing || !step4Valid}
                        className="bg-[#d4af37] text-black px-14 py-5 rounded-full font-bold flex items-center gap-3 disabled:opacity-50 transition-all hover:bg-white shadow-2xl shadow-[#d4af37]/20"
                      >
                        {isProcessing ? (
                          <>
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Zap className="w-5 h-5" />
                            </motion.div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            Submit Registration <CheckCircle2 className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};


export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0.8]);

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-[#d4af37] selection:text-black">
      {/* Registration Modal */}
      <RegistrationModal isOpen={isRegModalOpen} onClose={() => setIsRegModalOpen(false)} />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold tracking-tighter text-[#d4af37] font-display"
          >
            VICHAR MUN
          </motion.h2>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex gap-8 text-xs font-medium uppercase tracking-[0.3em]">
            {["About", "Committees", "Prizes", "Gallery", "Register"].map((item) => (
              <a 
                key={item} 
                href={item === "Register" ? "#register" : `#${item.toLowerCase()}`}
                onClick={(e) => {
                  if (item === "Register") {
                    e.preventDefault();
                    setIsRegModalOpen(true);
                  }
                }}
                className="hover:text-[#d4af37] transition-colors duration-300"
              >
                {item}
              </a>
            ))}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav Menu */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-black border-b border-white/10 px-6 py-8 flex flex-col gap-6"
          >
            {["About", "Committees", "Prizes", "Gallery", "Register"].map((item) => (
              <a 
                key={item} 
                href={item === "Register" ? "#register" : `#${item.toLowerCase()}`}
                onClick={(e) => {
                  if (item === "Register") {
                    e.preventDefault();
                    setIsRegModalOpen(true);
                    setIsMenuOpen(false);
                  } else {
                    setIsMenuOpen(false);
                  }
                }}
                className="text-lg font-medium hover:text-[#d4af37]"
              >
                {item}
              </a>
            ))}
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden halftone-bg">
        {/* Decorative Celestial Elements */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -right-20 w-[600px] h-[600px] opacity-10 pointer-events-none"
        >
          <img src="https://picsum.photos/seed/sun/800/800" alt="" className="w-full h-full rounded-full grayscale" referrerPolicy="no-referrer" />
        </motion.div>

        <div 
          className="absolute inset-0 z-0 opacity-40 grayscale"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1477281765962-ef34e8bb0967?auto=format&fit=crop&q=80&w=1920')",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          <div className="absolute inset-0 bg-black/80" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative z-10 text-center px-6"
        >
          <motion.h1 
            className="text-7xl md:text-9xl font-bold mb-6 tracking-tighter font-display text-glow"
          >
            VICHAR <span className="text-[#d4af37]">MUN</span>
          </motion.h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 font-light tracking-[0.2em] uppercase">
            Pune | 2nd - 3rd May 2026
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsRegModalOpen(true)}
            className="bg-[#d4af37] text-black px-12 py-5 rounded-full font-bold text-lg hover:bg-[#c49f27] transition-all shadow-2xl shadow-[#d4af37]/20"
          >
            Register Now
          </motion.button>
        </motion.div>

        <motion.div 
          style={{ opacity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-400"
        >
          <span className="text-[10px] uppercase tracking-[0.5em]">Scroll</span>
          <div className="w-px h-16 bg-gradient-to-b from-[#d4af37] to-transparent" />
        </motion.div>
      </section>

      {/* About Section */}
      <section id="about" className="py-40 px-6 max-w-5xl mx-auto text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-7xl font-script italic text-[#d4af37] mb-8">About Us</h2>
          <h3 className="text-3xl md:text-4xl font-bold mb-10 font-display tracking-tight">Fostering Global Dialogue</h3>
          <p className="text-xl text-gray-400 leading-relaxed font-light max-w-3xl mx-auto">
            Vichar Model United Nations is a student-led conference dedicated to fostering meaningful dialogue, 
            critical thinking, and informed debate among young leaders. Vichar MUN provides a dynamic platform 
            for delegates to engage with pressing international issues while developing negotiation, 
            public speaking, and leadership skills.
          </p>
        </motion.div>
      </section>

      {/* Committees Section */}
      <section id="committees" className="py-40 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-sm uppercase tracking-[0.8em] text-[#d4af37] mb-6">Committees</h2>
            <h3 className="text-5xl md:text-6xl font-bold font-display">The Arenas of Debate</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {committees.map((committee, index) => (
              <motion.div
                key={committee.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-10 bg-black/40 border border-white/5 rounded-3xl hover:border-[#d4af37]/30 hover:bg-black/60 transition-all duration-700 relative overflow-hidden"
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#d4af37]/5 rounded-full blur-3xl group-hover:bg-[#d4af37]/10 transition-colors" />
                
                <div className="flex items-start justify-between mb-8">
                  <div className="p-4 bg-[#d4af37]/10 rounded-2xl text-[#d4af37]">
                    {committee.icon}
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Committee 0{index + 1}</span>
                </div>

                <h4 className="text-3xl font-bold mb-4 font-display">{committee.name}</h4>
                <p className="text-gray-400 font-light mb-10 leading-relaxed">{committee.topic}</p>
                
                <div className="pt-8 border-t border-white/5">
                  <h5 className="text-[10px] uppercase tracking-[0.4em] text-[#d4af37] mb-6">Executive Board</h5>
                  <div className="flex flex-wrap gap-6">
                    {committee.eb.map((member) => (
                      <div key={member.name} className="flex flex-col">
                        <span className="text-sm font-medium">{member.name}</span>
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">{member.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Prizes Section */}
      <section id="prizes" className="py-40 px-6 halftone-bg">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-24">
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-7xl font-script italic text-[#d4af37] mb-6">Cash Prizes</h2>
              <p className="text-xl text-gray-400 font-light">Rewarding excellence in diplomacy, research, and public speaking.</p>
            </div>
            <div className="flex items-center gap-4 text-[#d4af37]">
              <Trophy className="w-10 h-10" />
              <span className="text-4xl font-bold font-display">15k Total</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {prizes.map((prize, i) => (
              <motion.div
                key={prize.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-black border border-white/10 rounded-2xl text-center relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-[#d4af37]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="inline-block text-[10px] uppercase tracking-[0.5em] text-[#d4af37] mb-4">{prize.rank}</span>
                <h4 className="text-xl font-bold mb-2">{prize.title}</h4>
                <div className="text-5xl font-bold font-display text-[#d4af37] mb-2">{prize.amount}</div>
                {prize.note && <span className="text-[10px] text-gray-500 italic">{prize.note}</span>}
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 p-8 border border-dashed border-[#d4af37]/30 rounded-2xl text-center">
            <p className="text-gray-400 font-light italic">Prizes in kind for school committees (FIA) and exciting surprises for all participants!</p>
          </div>
        </div>
      </section>

      {/* Venue Section */}
      <section className="py-40 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-20">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <div className="flex items-center gap-3 text-[#d4af37] mb-8">
              <MapPin className="w-6 h-6" />
              <span className="text-xs uppercase tracking-[0.4em]">The Venue</span>
            </div>
            <h3 className="text-5xl md:text-6xl font-bold mb-10 font-display leading-tight">Akshara International School</h3>
            <p className="text-xl text-gray-400 mb-10 font-light leading-relaxed">
              S. No. 109, Akshara Lane, Wakad, Pune, Maharashtra 411057.
            </p>
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4 text-gray-300">
                <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-lg">May 2nd & 3rd, 2026</span>
              </div>
              <div className="flex items-center gap-4 text-gray-300">
                <div className="w-10 h-10 rounded-full bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                  <Star className="w-5 h-5" />
                </div>
                <span className="text-lg">Pune, India</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 w-full aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl shadow-black/50 relative group"
          >
            <div className="absolute inset-0 bg-[#d4af37]/10 mix-blend-overlay group-hover:opacity-0 transition-opacity duration-700" />
            <img 
              src="https://images.unsplash.com/photo-1541339907198-e08756ebafe3?auto=format&fit=crop&q=80&w=1200" 
              alt="Venue"
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-40 bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-sm uppercase tracking-[0.8em] text-[#d4af37] mb-6">Gallery</h2>
            <h3 className="text-5xl md:text-6xl font-bold font-display">Past Highlights</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {galleryImages.map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="aspect-square rounded-[32px] overflow-hidden group relative"
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors duration-500 z-10" />
                <img 
                  src={img} 
                  alt={`Gallery ${i}`}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Register Section */}
      <section id="register" className="py-60 relative overflow-hidden halftone-bg">
        {/* Moon Decorative Element */}
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-40 -left-40 w-[800px] h-[800px] opacity-10 pointer-events-none"
        >
          <img src="https://picsum.photos/seed/moon/1000/1000" alt="" className="w-full h-full rounded-full grayscale invert" referrerPolicy="no-referrer" />
        </motion.div>

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-6xl md:text-8xl font-display font-bold mb-10 tracking-tighter">See you <span className="text-[#d4af37] font-script italic font-normal">soon!</span></h2>
            <p className="text-xl text-gray-400 mb-16 font-light max-w-2xl mx-auto leading-relaxed">
              Be part of Pune's most anticipated student conference. 
              Limited slots available for delegates.
            </p>
            <div className="flex justify-center">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsRegModalOpen(true)}
                className="bg-[#d4af37] text-black px-14 py-6 rounded-full font-bold text-lg shadow-2xl shadow-[#d4af37]/30"
              >
                Apply as Delegate
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 border-t border-white/5 bg-black relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tighter text-[#d4af37] mb-4 font-display">VICHAR MUN</h2>
            <p className="text-gray-500 text-sm tracking-widest uppercase">© 2026 VICHAR MUN. Pune, India.</p>
          </div>
          
          <div className="flex gap-10 text-gray-400 text-xs uppercase tracking-[0.3em]">
            <a href="#" className="hover:text-[#d4af37] transition-colors">Instagram</a>
            <a href="#" className="hover:text-[#d4af37] transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-[#d4af37] transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
