"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Plus,
  Trash2,
  Download,
  Check,
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  ExternalLink,
  BookOpen,
  Briefcase,
  FileText,
  Layout,
  Award,
  LogOut,
  Save,
  Grid,
  TrendingUp,
  Award as CertIcon,
  Languages,
  ArrowRight,
  Shield,
  Clock,
  Menu,
  ChevronRight,
  RotateCcw,
  Volume2
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  saveResume,
  getResumes,
  deleteResume,
  saveCoverLetter,
  getCoverLetters,
  deleteCoverLetter
} from "../lib/firestoreService";
import type { Resume, CoverLetter, Education, Experience, Project } from "../lib/types";
import { TemplateRender } from "../components/ResumeTemplates";

// Safe dynamic PDF renderer library loader
const exportPDF = async (elementId: string, filename: string) => {
  try {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    const element = document.getElementById(elementId);
    if (!element) return;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgWidth = 210; // A4 sizes
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error("Failed to generate PDF:", error);
  }
};

const DEFAULT_RESUME = (userId: string): Resume => ({
  id: "resume_" + Math.random().toString(36).substring(2, 9),
  userId,
  title: "My Standard Resume",
  templateId: "modern",
  personalInfo: {
    fullName: "",
    email: "",
    phone: "",
    address: "",
    linkedin: "",
    portfolio: "",
  },
  summary: "",
  education: [],
  skills: [],
  experience: [],
  projects: [],
  certifications: [],
  languages: [],
  atsScore: null,
  atsSuggestions: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isPremium: false,
});

export default function Home() {
  const { user, loading, signInWithGoogle, logout, dbConnected } = useAuth();
  const [activeTab, setActiveTab] = useState<"resumes" | "letters" | "premium">("resumes");

  // Database lists
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Resume builder state
  const [currentResume, setCurrentResume] = useState<Resume | null>(null);
  const [currentSection, setCurrentSection] = useState<"personal" | "summary" | "experience" | "projects" | "education" | "skills" | "extras">("personal");
  const [skillInput, setSkillInput] = useState("");
  const [certInput, setCertInput] = useState("");
  const [langInput, setLangInput] = useState("");

  // Sub-items forms
  const [eduForm, setEduForm] = useState<Education>({ school: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", description: "" });
  const [expForm, setExpForm] = useState<Experience>({ company: "", position: "", startDate: "", endDate: "", current: false, description: "" });
  const [projForm, setProjForm] = useState<Project>({ title: "", description: "", technologies: "" });

  // AI & ATS Loading state
  const [aiLoading, setAiLoading] = useState(false);
  const [optimizedAlert, setOptimizedAlert] = useState<string | null>(null);

  // Cover Letter form state
  const [clForm, setClForm] = useState({
    jobTitle: "",
    companyName: "",
    jobDescription: "",
  });
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [letterTitle, setLetterTitle] = useState("My AI Custom Cover Letter");

  // UI responsive states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPreviewPane, setShowPreviewPane] = useState(true);

  // Mock global premium flag
  const [userIsPremium, setUserIsPremium] = useState(false);

  // Load lists when authenticated
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    setLoadingItems(true);
    try {
      const fetchedResumes = await getResumes(user.uid);
      const fetchedLetters = await getCoverLetters(user.uid);
      setResumes(fetchedResumes);
      setLetters(fetchedLetters);

      // If resumes exist, select the top one
      if (fetchedResumes.length > 0) {
        setCurrentResume(fetchedResumes[0]);
      } else {
        // Build standard resume draft
        const initial = DEFAULT_RESUME(user.uid);
        setCurrentResume(initial);
        await saveResume(initial);
        setResumes([initial]);
      }
    } catch (e) {
      console.error("Error loading user lists:", e);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleCreateNewResume = async () => {
    if (!user) return;
    const fresh = DEFAULT_RESUME(user.uid);
    fresh.title = `Resume Draft #${resumes.length + 1}`;
    await saveResume(fresh);
    setResumes([fresh, ...resumes]);
    setCurrentResume(fresh);
    setActiveTab("resumes");
  };

  const handleUpdateResumeField = (section: string, field: string, value: any) => {
    if (!currentResume) return;

    let updated: Resume;
    if (section === "root") {
      updated = { ...currentResume, [field]: value, updatedAt: new Date().toISOString() };
    } else {
      updated = {
        ...currentResume,
        [section]: {
          ...(currentResume[section as keyof Resume] as any),
          [field]: value,
        },
        updatedAt: new Date().toISOString(),
      };
    }

    setCurrentResume(updated);
  };

  const handleDebouncedSave = async () => {
    if (!currentResume) return;
    try {
      await saveResume(currentResume);
      // Update in side menu list
      setResumes(resumes.map((r) => (r.id === currentResume.id ? currentResume : r)));
    } catch (error) {
      console.error("Auto save error:", error);
    }
  };

  // Quick auto save when resume structures shift
  useEffect(() => {
    if (currentResume) {
      const trigger = setTimeout(() => {
        handleDebouncedSave();
      }, 1000);
      return () => clearTimeout(trigger);
    }
  }, [currentResume]);

  // Section handling addition scripts
  const addEducation = () => {
    if (!currentResume || !eduForm.school || !eduForm.degree) return;
    const updated = {
      ...currentResume,
      education: [...currentResume.education, eduForm],
      updatedAt: new Date().toISOString(),
    };
    setCurrentResume(updated);
    setEduForm({ school: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", description: "" });
  };

  const removeEducation = (index: number) => {
    if (!currentResume) return;
    const updated = {
      ...currentResume,
      education: currentResume.education.filter((_, i) => i !== index),
      updatedAt: new Date().toISOString(),
    };
    setCurrentResume(updated);
  };

  const addExperience = () => {
    if (!currentResume || !expForm.company || !expForm.position) return;
    const updated = {
      ...currentResume,
      experience: [...currentResume.experience, expForm],
      updatedAt: new Date().toISOString(),
    };
    setCurrentResume(updated);
    setExpForm({ company: "", position: "", startDate: "", endDate: "", current: false, description: "" });
  };

  const removeExperience = (index: number) => {
    if (!currentResume) return;
    const updated = {
      ...currentResume,
      experience: currentResume.experience.filter((_, i) => i !== index),
      updatedAt: new Date().toISOString(),
    };
    setCurrentResume(updated);
  };

  const addProject = () => {
    if (!currentResume || !projForm.title) return;
    const updated = {
      ...currentResume,
      projects: [...currentResume.projects, projForm],
      updatedAt: new Date().toISOString(),
    };
    setCurrentResume(updated);
    setProjForm({ title: "", description: "", technologies: "" });
  };

  const removeProject = (index: number) => {
    if (!currentResume) return;
    const updated = {
      ...currentResume,
      projects: currentResume.projects.filter((_, i) => i !== index),
      updatedAt: new Date().toISOString(),
    };
    setCurrentResume(updated);
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentResume || !skillInput.trim()) return;
    if (currentResume.skills.includes(skillInput.trim())) return;
    setCurrentResume({
      ...currentResume,
      skills: [...currentResume.skills, skillInput.trim()],
    });
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    if (!currentResume) return;
    setCurrentResume({
      ...currentResume,
      skills: currentResume.skills.filter((s) => s !== skill),
    });
  };

  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentResume || !certInput.trim()) return;
    setCurrentResume({
      ...currentResume,
      certifications: [...currentResume.certifications, certInput.trim()],
    });
    setCertInput("");
  };

  const removeCert = (idx: number) => {
    if (!currentResume) return;
    setCurrentResume({
      ...currentResume,
      certifications: currentResume.certifications.filter((_, i) => i !== idx),
    });
  };

  const handleAddLang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentResume || !langInput.trim()) return;
    setCurrentResume({
      ...currentResume,
      languages: [...currentResume.languages, langInput.trim()],
    });
    setLangInput("");
  };

  const removeLang = (idx: number) => {
    if (!currentResume) return;
    setCurrentResume({
      ...currentResume,
      languages: currentResume.languages.filter((_, i) => i !== idx),
    });
  };

  // AI Integrations calls to next server
  const handleAISkillsAndSummary = async () => {
    if (!currentResume) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "suggestSkillsAndSummary",
          resumeData: currentResume,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Apply
      setCurrentResume({
        ...currentResume,
        summary: data.suggestedSummary || currentResume.summary,
        skills: [...new Set([...currentResume.skills, ...(data.suggestedSkills || [])])],
        updatedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      alert("AI Suggestion error: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIBulletOptimize = async (experienceIndex: number) => {
    if (!currentResume) return;
    const targetBullet = currentResume.experience[experienceIndex].description;
    if (!targetBullet.trim()) {
      alert("Please write basic details/points in the experience first!");
      return;
    }

    setAiLoading(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "improveBullet",
          bulletText: targetBullet,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const updatedHistory = [...currentResume.experience];
      updatedHistory[experienceIndex].description = data.improvedText;

      setCurrentResume({
        ...currentResume,
        experience: updatedHistory,
        updatedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      alert("AI Bullet optimization error: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleOptimizeATS = async (jobDesc: string) => {
    if (!currentResume) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "optimizeATS",
          resumeData: currentResume,
          jobDescription: jobDesc,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setCurrentResume({
        ...currentResume,
        atsScore: data.atsScore,
        atsSuggestions: data.atsSuggestions,
        summary: data.improvedSummary,
        updatedAt: new Date().toISOString(),
      });

      setOptimizedAlert("Perfect! Your profile was optimized, summary rewritten, and ATS suggestions formatted!");
      setTimeout(() => setOptimizedAlert(null), 6000);
    } catch (e: any) {
      alert("ATS optimization calculation error: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Cover Letter flow
  const handleGenerateCoverLetter = async () => {
    if (!currentResume) {
      alert("Please configure a resume profile first!");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generateCoverLetter",
          resumeData: currentResume,
          jobTitle: clForm.jobTitle,
          companyName: clForm.companyName,
          jobDescription: clForm.jobDescription,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setGeneratedLetter(data.coverLetter);
    } catch (e: any) {
      alert("Cover letter generation error: " + e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveCoverLetter = async () => {
    if (!user || !generatedLetter) return;
    const freshLetter: CoverLetter = {
      id: "letter_" + Math.random().toString(36).substring(2, 9),
      userId: user.uid,
      title: letterTitle,
      jobTitle: clForm.jobTitle,
      companyName: clForm.companyName,
      content: generatedLetter,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveCoverLetter(freshLetter);
      setLetters([freshLetter, ...letters]);
      alert("Cover letter successfully saved into cloud storage!");
    } catch (error) {
      console.error("Error saving letter:", error);
    }
  };

  const handleDeleteCoverLetter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this Cover Letter?")) return;
    try {
      await deleteCoverLetter(id);
      setLetters(letters.filter((l) => l.id !== id));
    } catch (error) {
      console.error("Error deleting letter:", error);
    }
  };

  const handleDeleteResume = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (resumes.length <= 1) {
      alert("You should keep at least one active resume draft!");
      return;
    }
    if (!confirm("Are you sure you want to delete this Resume Draft?")) return;
    try {
      await deleteResume(id);
      const remaining = resumes.filter((r) => r.id !== id);
      setResumes(remaining);
      if (currentResume?.id === id) {
        setCurrentResume(remaining[0]);
      }
    } catch (error) {
      console.error("Error deleting resume:", error);
    }
  };

  // Loader spinner view
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b19]">
        <div className="text-center">
          <div className="relative inline-block w-16 h-16 mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-indigo-400 animate-spin" />
            <Sparkles className="absolute inset-4 text-indigo-300 animate-pulse w-8 h-8" />
          </div>
          <p className="text-indigo-200/80 font-medium tracking-wide">Syncing cloud database session...</p>
        </div>
      </div>
    );
  }

  // Welcome / Authentic landing gate (User not logged in)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-between p-6 relative">
        {/* Glow blur background blobs */}
        <div className="absolute top-[20%] left-[25%] w-[400px] h-[400px] bg-indigo-500/10 blur-[130px] rounded-full -z-10 animate-pulse" />
        <div className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] bg-purple-500/10 blur-[130px] rounded-full -z-10" />

        {/* Header bar */}
        <header className="max-w-7xl w-full mx-auto flex justify-between items-center py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="relative p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-display">
              Resume<span className="text-indigo-400">AI</span>
            </span>
          </div>
          <button
            onClick={signInWithGoogle}
            className="frosted-glass border border-white/10 px-5 py-2 rounded-xl text-sm font-medium hover:bg-white/5 transition-all"
          >
            Sign In with Google
          </button>
        </header>

        {/* Hero Area */}
        <main className="max-w-5xl w-full mx-auto my-auto grid grid-cols-1 md:grid-cols-12 gap-12 items-center py-12">
          <div className="md:col-span-7 space-y-7 text-left">
            <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              <Sparkles className="w-3.5 h-3.5" /> Google AI Studio Integration
            </span>
            <h1 className="text-4.5xl md:text-5.5xl font-black tracking-tight text-white leading-none font-display">
              Build Perfect <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-300 via-indigo-400 to-purple-400">
                ATS-Optimized Resumes
              </span>{" "}
              In Minutes
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Generate elite, score-optimized resumes backed by Gemini 3.5 Flash. Instantly analyze your scores against real
              job descriptions and customize beautiful frosted glass template selections.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button
                onClick={signInWithGoogle}
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-semibold text-white bg-linear-to-r from-indigo-500 to-purple-500 hover:brightness-115 transition-all duration-300 shadow-[0_0_30px_rgba(99,102,241,0.3)] group cursor-pointer"
              >
                Get Started Free <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-semibold text-slate-300 hover:text-white frosted-glass border border-white/10 hover:border-white/20 transition-all text-sm"
              >
                Learn More
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/5">
              <div>
                <p className="text-2xl font-bold text-white font-display">100%</p>
                <p className="text-slate-400 text-xs mt-0.5">ATS Friendly Layouts</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white font-display">Gemini 3.5</p>
                <p className="text-slate-400 text-xs mt-0.5">Dynamic Suggestions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white font-display">Instant</p>
                <p className="text-slate-400 text-xs mt-0.5">PDF Web Exports</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 relative">
            <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl blur-[50px] -z-10" />
            <div className="frosted-glass-card rounded-3xl p-6 border border-white/15 relative overflow-hidden">
              {/* Fake visual editor preview inside card */}
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-rose-500" />
                    <div className="w-3.5 h-3.5 rounded-full bg-amber-500" />
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    ATS-SCORE: 94%
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="h-4 bg-white/10 rounded-md w-2/3" />
                  <div className="h-2.5 bg-white/5 rounded-md w-1/2" />
                  <div className="h-2 bg-white/5 rounded-md w-full" />
                  <div className="h-2 bg-white/5 rounded-md w-4/5" />
                </div>

                <div className="border-t border-white/5 pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-[11px] text-teal-300 bg-teal-500/5 px-2.5 py-1.5 rounded-lg border border-teal-500/10">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> High-impact active verbs inserted.
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-teal-300 bg-teal-500/5 px-2.5 py-1.5 rounded-lg border border-teal-500/10">
                    <Check className="w-3.5 h-3.5 stroke-[3]" /> Cloud technologies keywords matched.
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <span className="text-xs text-indigo-200/50 italic">Complete Firebase Storage Sync Enabled</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="max-w-7xl w-full mx-auto py-6 border-t border-white/5 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} ResumeAI. Handcrafted using Google Gemini SDK & Firebase with Frosted Glass styling.</p>
        </footer>
      </div>
    );
  }

  // Active Authenticated Workspace Module
  return (
    <div className="min-h-screen flex flex-col bg-[#070b19] relative text-slate-200">
      {/* Dynamic top header strip */}
      <header className="frosted-glass-card sticky top-0 z-45 border-b border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white hover:text-indigo-400 p-1"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white font-display">
              Resume<span className="text-indigo-400">AI</span>
            </span>
          </div>

          {/* Database status bubble */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs bg-slate-950/40 rounded-full px-3 py-1 text-slate-400 border border-white/5">
            <span className={`w-2 h-2 rounded-full ${dbConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
            {dbConnected ? "Cloud Synced (Firestore)" : "Database error"}
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {userIsPremium ? (
            <span className="bg-linear-to-r from-yellow-500 to-amber-500 text-slate-950 font-bold uppercase tracking-widest text-[10px] px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              👑 ELITE MEMBER
            </span>
          ) : (
            <button
              onClick={() => {
                setActiveTab("premium");
                setIsMobileMenuOpen(false);
              }}
              className="bg-indigo-500/15 border border-indigo-400/35 hover:bg-indigo-500/25 text-indigo-200 text-xs font-semibold rounded-lg px-3.5 py-1.5 transition-all cursor-pointer"
            >
              ⭐ Upgrade Elite
            </button>
          )}

          <div className="flex items-center gap-2 border-l border-white/10 pl-3">
            <img
              src={user.photoURL || "https://picsum.photos/seed/user/100/100"}
              alt={user.displayName || "User Avatar"}
              className="w-8 h-8 rounded-full border border-indigo-400/40"
              referrerPolicy="no-referrer"
            />
            <span className="hidden lg:inline text-xs font-medium text-slate-350">{user.displayName || user.email}</span>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-405 hover:bg-white/5 transition-all text-xs"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace structure layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Drawer navigation sidebar */}
        <aside
          className={`${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } fixed md:static top-0 left-0 bottom-0 z-40 w-64 md:w-68 frosted-glass border-r border-white/10 p-5 flex flex-col justify-between transition-transform duration-300 bg-[#070b19]/95 md:bg-transparent h-full`}
        >
          <div className="space-y-6">
            <div className="space-y-2 pt-16 md:pt-0">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-500">CORE BUILDER</p>
              <nav className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab("resumes");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between text-left text-sm font-medium rounded-xl p-3 transition-all ${
                    activeTab === "resumes"
                      ? "text-indigo-200 bg-indigo-500/10 border border-indigo-500/20 shadow-md"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Grid className="w-4 h-4 text-indigo-400" />
                    <span>Manage Resumes</span>
                  </div>
                  <span className="bg-indigo-300/15 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {resumes.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("letters");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between text-left text-sm font-medium rounded-xl p-3 transition-all ${
                    activeTab === "letters"
                      ? "text-indigo-200 bg-indigo-500/10 border border-indigo-500/20 shadow-md"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span>AI Cover Letters</span>
                  </div>
                  <span className="bg-indigo-300/15 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {letters.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("premium");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 text-left text-sm font-medium rounded-xl p-3 transition-all ${
                    activeTab === "premium"
                      ? "text-indigo-200 bg-indigo-500/10 border border-indigo-500/20"
                      : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <Award className="w-4 h-4 text-indigo-400" />
                  <span>Elite Styling</span>
                </button>
              </nav>
            </div>

            {/* Document drawer lists (quick select) */}
            {activeTab === "resumes" && resumes.length > 0 && (
              <div className="space-y-2 border-t border-white/5 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">ALL RESUMES</span>
                  <button
                    onClick={handleCreateNewResume}
                    className="p-1 rounded bg-white/5 hover:bg-indigo-500/20 text-indigo-400 transition-all cursor-pointer"
                    title="Create New Resume"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1 max-h-[35vh] overflow-y-auto pr-1">
                  {resumes.map((res) => (
                    <div
                      key={res.id}
                      onClick={() => setCurrentResume(res)}
                      className={`flex justify-between items-center text-xs p-2.5 rounded-lg border cursor-pointer transition-all ${
                        currentResume?.id === res.id
                          ? "bg-white/5 text-bold border-white/10 text-white"
                          : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]"
                      }`}
                    >
                      <span className="truncate max-w-[140px]">{res.title}</span>
                      <button
                        onClick={(e) => handleDeleteResume(res.id, e)}
                        className="text-slate-600 hover:text-rose-450 opacity-0 group-hover:opacity-100 hover:opacity-100 p-0.5 transition-all"
                        title="Delete resume draft"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            {/* Quick Actions Card */}
            <div className="frosted-glass rounded-xl p-3 border border-indigo-400/10 text-left bg-indigo-950/20">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Sparkles className="w-3.5 h-3.5" /> Core VM Verified
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                All resume templates validated for compliant layout outputs. Next.js 15+ routing live.
              </p>
            </div>

            {/* Platform footer indicator */}
            <div className="text-left">
              <p className="text-[10px] text-slate-500 uppercase font-mono tracking-tight">System Status: OK</p>
              <p className="text-[9px] text-slate-500">Run ID: 67143ffd</p>
            </div>
          </div>
        </aside>

        {/* Content Main Panel */}
        <main className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-950">
          <AnimatePresence mode="popLayout">
            {activeTab === "resumes" && currentResume && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full"
              >
                {/* Visual Editor Pane */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                  {optimizedAlert && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{optimizedAlert}</span>
                    </div>
                  )}

                  {/* Document Title header with Quick Save indicator */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={currentResume.title}
                        onChange={(e) => handleUpdateResumeField("root", "title", e.target.value)}
                        className="text-xl md:text-2xl font-black bg-transparent text-white border-b border-transparent hover:border-white/10 focus:border-indigo-400 focus:outline-none py-1 w-full font-display"
                        placeholder="Resume Title"
                      />
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-500" /> Last auto-saved:{" "}
                        {new Date(currentResume.updatedAt).toLocaleTimeString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto self-end sm:self-center">
                      <button
                        onClick={() => setShowPreviewPane(!showPreviewPane)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-305 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                      >
                        <Layout className="w-3.5 h-3.5" /> Preview Toggle
                      </button>

                      <button
                        onClick={handleAISkillsAndSummary}
                        disabled={aiLoading}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-linear-to-r from-blue-500 to-indigo-500 hover:brightness-110 shadow-sm transition-all border border-blue-400/10 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                        {aiLoading ? "Thinking..." : "AI AutoWrite"}
                      </button>
                    </div>
                  </div>

                  {/* ATS Scoring Widget */}
                  <div className="frosted-glass rounded-2xl p-5 border border-white/10 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2 font-display">
                          <TrendingUp className="w-4 h-4 text-indigo-400" /> ATS Analyzer & Keywords Optimizer
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Paste your target job details to analyze and optimize search visibility.
                        </p>
                      </div>

                      {currentResume.atsScore !== null && (
                        <div className="flex items-center gap-3 bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wide">
                            ATS Score
                          </span>
                          <span className={`text-xl font-black font-display px-2.5 py-1 rounded-lg ${
                            currentResume.atsScore >= 80 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {currentResume.atsScore}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-8">
                        <textarea
                          placeholder="Paste Target Job Description (Optional) to calculate real-time compatibility score against resume..."
                          className="w-full h-18 text-xs p-3 font-medium text-slate-200 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-indigo-451 focus:ring-1 focus:ring-indigo-451 focus:bg-white/10"
                          id="job_desc_field"
                        />
                      </div>
                      <div className="md:col-span-4 flex">
                        <button
                          onClick={() => {
                            const field = document.getElementById("job_desc_field") as HTMLTextAreaElement;
                            handleOptimizeATS(field ? field.value : "");
                          }}
                          disabled={aiLoading}
                          className="w-full flex flex-col justify-center items-center gap-1.5 p-4 rounded-xl text-xs font-bold text-white bg-linear-to-r from-indigo-500 to-indigo-600 hover:brightness-110 shadow-[0_10px_20px_rgba(99,102,241,0.2)] transition-all cursor-pointer"
                        >
                          <Sparkles className="w-5 h-5 text-indigo-200 animate-pulse" />
                          <span>{aiLoading ? "Analyzing..." : "Calculate ATS Score"}</span>
                        </button>
                      </div>
                    </div>

                    {currentResume.atsSuggestions && (
                      <div className="bg-slate-900/40 border border-white/10 rounded-xl p-4 text-left text-xs space-y-2 max-h-48 overflow-y-auto">
                        <h4 className="font-bold text-slate-300 uppercase">GOOGLE AI MATCHMAKER SUGGESTIONS:</h4>
                        <div className="text-slate-400 whitespace-pre-line leading-relaxed">
                          {currentResume.atsSuggestions}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Main section tab form selector */}
                  <div className="flex flex-wrap items-center gap-1.5 border-b border-white/5 pb-2">
                    {[
                      { id: "personal", label: "Contact Info", icon: User },
                      { id: "summary", label: "Summary", icon: FileText },
                      { id: "experience", label: "Employment", icon: Briefcase },
                      { id: "projects", label: "Projects", icon: Layout },
                      { id: "education", label: "Education", icon: BookOpen },
                      { id: "skills", label: "Skills", icon: Grid },
                      { id: "extras", label: "Credentials", icon: CertIcon },
                    ].map((sec) => (
                      <button
                        key={sec.id}
                        onClick={() => setCurrentSection(sec.id as any)}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all ${
                          currentSection === sec.id
                            ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                            : "text-slate-450 hover:text-slate-200 bg-transparent hover:bg-white/5"
                        }`}
                      >
                        <sec.icon className="w-3.5 h-3.5" />
                        <span>{sec.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Section Forms Content Router */}
                  <div className="frosted-glass-card rounded-2xl p-6 border border-white/10">
                    {currentSection === "personal" && (
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-white font-display uppercase tracking-wide">
                          Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5 text-left">
                            <label className="text-xs font-medium text-slate-400">Full Name</label>
                            <input
                              type="text"
                              value={currentResume.personalInfo.fullName}
                              onChange={(e) => handleUpdateResumeField("personalInfo", "fullName", e.target.value)}
                              className="w-full frosted-glass-input px-4 py-2.5 text-sm"
                              placeholder="Jane Doe"
                            />
                          </div>
                          <div className="space-y-1.5 text-left">
                            <label className="text-xs font-medium text-slate-400">Email Address</label>
                            <input
                              type="email"
                              value={currentResume.personalInfo.email}
                              onChange={(e) => handleUpdateResumeField("personalInfo", "email", e.target.value)}
                              className="w-full frosted-glass-input px-4 py-2.5 text-sm"
                              placeholder="jane.doe@example.com"
                            />
                          </div>
                          <div className="space-y-1.5 text-left">
                            <label className="text-xs font-medium text-slate-400">Phone Number</label>
                            <input
                              type="text"
                              value={currentResume.personalInfo.phone}
                              onChange={(e) => handleUpdateResumeField("personalInfo", "phone", e.target.value)}
                              className="w-full frosted-glass-input px-4 py-2.5 text-sm"
                              placeholder="+1 (555) 000-0000"
                            />
                          </div>
                          <div className="space-y-1.5 text-left">
                            <label className="text-xs font-medium text-slate-400">Physical Location</label>
                            <input
                              type="text"
                              value={currentResume.personalInfo.address}
                              onChange={(e) => handleUpdateResumeField("personalInfo", "address", e.target.value)}
                              className="w-full frosted-glass-input px-4 py-2.5 text-sm"
                              placeholder="San Francisco, CA"
                            />
                          </div>
                          <div className="space-y-1.5 text-left">
                            <label className="text-xs font-medium text-slate-400">LinkedIn Link</label>
                            <input
                              type="text"
                              value={currentResume.personalInfo.linkedin}
                              onChange={(e) => handleUpdateResumeField("personalInfo", "linkedin", e.target.value)}
                              className="w-full frosted-glass-input px-4 py-2.5 text-sm"
                              placeholder="linkedin.com/in/janedoe"
                            />
                          </div>
                          <div className="space-y-1.5 text-left">
                            <label className="text-xs font-medium text-slate-400">Portfolio Website</label>
                            <input
                              type="text"
                              value={currentResume.personalInfo.portfolio}
                              onChange={(e) => handleUpdateResumeField("personalInfo", "portfolio", e.target.value)}
                              className="w-full frosted-glass-input px-4 py-2.5 text-sm"
                              placeholder="janedoe.me"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {currentSection === "summary" && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-white font-display uppercase tracking-wide">
                            Professional Summary
                          </h3>
                        </div>
                        <div className="space-y-1.5 text-left">
                          <label className="text-xs font-medium text-slate-400">Write executive summary (or let AI generate one below!)</label>
                          <textarea
                            value={currentResume.summary}
                            onChange={(e) => handleUpdateResumeField("root", "summary", e.target.value)}
                            className="w-full h-36 frosted-glass-input p-4 text-sm"
                            placeholder="Detail your professional vision, years of technical experience, and core goals..."
                          />
                        </div>
                      </div>
                    )}

                    {currentSection === "experience" && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-white font-display uppercase tracking-wide">
                            Employment History
                          </h3>
                        </div>

                        {/* List items first */}
                        {currentResume.experience.length > 0 && (
                          <div className="space-y-3.5 border-b border-white/5 pb-4">
                            {currentResume.experience.map((exp, idx) => (
                              <div
                                key={idx}
                                className="bg-white/5 rounded-xl p-4 border border-white/10 flex justify-between items-start gap-3"
                              >
                                <div className="space-y-1 text-left">
                                  <h4 className="font-bold text-white text-sm">
                                    {exp.position} at {exp.company}
                                  </h4>
                                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wide">
                                    {exp.startDate} – {exp.current ? "Present" : exp.endDate}
                                  </p>
                                  <p className="text-slate-300 text-xs whitespace-pre-line mt-2 text-justify">
                                    {exp.description}
                                  </p>

                                  {/* Bullet point optimizer button */}
                                  <div className="pt-2">
                                    <button
                                      onClick={() => handleAIBulletOptimize(idx)}
                                      disabled={aiLoading}
                                      className="inline-flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-400/20 text-indigo-300 text-[10px] font-bold px-2 py-1 rounded"
                                    >
                                      <Sparkles className="w-3 h-3 animate-pulse" /> Optimize bullet with Gemini
                                    </button>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeExperience(idx)}
                                  className="text-slate-400 hover:text-rose-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* New Item Form */}
                        <div className="space-y-4 border border-indigo-500/20 bg-indigo-950/10 p-5 rounded-2xl">
                          <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wide text-left">Add New Employer Role</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="Employer / Company Name"
                              value={expForm.company}
                              onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
                              className="frosted-glass-input px-4 py-2.5 text-xs text-left"
                            />
                            <input
                              type="text"
                              placeholder="Job Title / Position"
                              value={expForm.position}
                              onChange={(e) => setExpForm({ ...expForm, position: e.target.value })}
                              className="frosted-glass-input px-4 py-2.5 text-xs text-left"
                            />
                            <input
                              type="text"
                              placeholder="Start Date (e.g., Oct 2021)"
                              value={expForm.startDate}
                              onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })}
                              className="frosted-glass-input px-4 py-2.5 text-xs text-left"
                            />
                            {!expForm.current && (
                              <input
                                type="text"
                                placeholder="End Date (or check Current)"
                                value={expForm.endDate}
                                onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })}
                                className="frosted-glass-input px-4 py-2.5 text-xs text-left"
                              />
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-left">
                            <input
                              type="checkbox"
                              id="exp_current"
                              checked={expForm.current}
                              onChange={(e) => setExpForm({ ...expForm, current: e.target.checked })}
                              className="w-4 h-4 rounded text-indigo-600 bg-white/5 border border-white/10"
                            />
                            <label htmlFor="exp_current" className="text-xs text-slate-300">I currently work here</label>
                          </div>

                          <textarea
                            placeholder="Role Responsibilities / Bullet points (write anything, then press Optimize above!)"
                            value={expForm.description}
                            onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                            className="w-full h-24 frosted-glass-input p-3 text-xs"
                          />

                          <button
                            onClick={addExperience}
                            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Save Experience
                          </button>
                        </div>
                      </div>
                    )}

                    {currentSection === "projects" && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-white font-display uppercase tracking-wide">
                            Key Projects
                          </h3>
                        </div>

                        {currentResume.projects.length > 0 && (
                          <div className="space-y-3.5 border-b border-white/5 pb-4">
                            {currentResume.projects.map((proj, idx) => (
                              <div
                                key={idx}
                                className="bg-white/5 rounded-xl p-4 border border-white/10 flex justify-between items-start gap-3"
                              >
                                <div className="space-y-1 text-left">
                                  <h4 className="font-bold text-white text-sm">{proj.title}</h4>
                                  <p className="text-indigo-300 text-xs font-semibold">[{proj.technologies}]</p>
                                  <p className="text-slate-350 text-xs mt-1.5 leading-relaxed">{proj.description}</p>
                                </div>
                                <button
                                  onClick={() => removeProject(idx)}
                                  className="text-slate-400 hover:text-rose-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* New Project Form */}
                        <div className="space-y-4 border border-indigo-500/20 bg-indigo-950/10 p-5 rounded-2xl">
                          <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wide text-left">Add Professional Project</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="Project Name / Title"
                              value={projForm.title}
                              onChange={(e) => setProjForm({ ...projForm, title: e.target.value })}
                              className="frosted-glass-input px-4 py-2.5 text-xs text-left"
                            />
                            <input
                              type="text"
                              placeholder="Technologies used (e.g., Python, Docker)"
                              value={projForm.technologies}
                              onChange={(e) => setProjForm({ ...projForm, technologies: e.target.value })}
                              className="frosted-glass-input px-4 py-2.5 text-xs text-left"
                            />
                          </div>
                          <textarea
                            placeholder="Short overview of features, scope, and results achieved"
                            value={projForm.description}
                            onChange={(e) => setProjForm({ ...projForm, description: e.target.value })}
                            className="w-full h-20 frosted-glass-input p-3 text-xs"
                          />
                          <button
                            onClick={addProject}
                            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Save Project
                          </button>
                        </div>
                      </div>
                    )}

                    {currentSection === "education" && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-bold text-white font-display uppercase tracking-wide">
                            Education Background
                          </h3>
                        </div>

                        {currentResume.education.length > 0 && (
                          <div className="space-y-3.5 border-b border-white/5 pb-4">
                            {currentResume.education.map((edu, idx) => (
                              <div
                                key={idx}
                                className="bg-white/5 rounded-xl p-4 border border-white/10 flex justify-between items-start gap-3"
                              >
                                <div className="space-y-1 text-left">
                                  <h4 className="font-bold text-white text-sm">{edu.school}</h4>
                                  <p className="text-slate-400 text-xs font-medium">
                                    {edu.degree} in {edu.fieldOfStudy} ({edu.startDate} – {edu.endDate})
                                  </p>
                                  {edu.description && <p className="text-slate-350 text-xs mt-1.5">{edu.description}</p>}
                                </div>
                                <button
                                  onClick={() => removeEducation(idx)}
                                  className="text-slate-400 hover:text-rose-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* New Education Form */}
                        <div className="space-y-4 border border-indigo-500/20 bg-indigo-950/10 p-5 rounded-2xl">
                          <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wide text-left">Add Academic Degree</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="School / College Name"
                              value={eduForm.school}
                              onChange={(e) => setEduForm({ ...eduForm, school: e.target.value })}
                              className="frosted-glass-input px-4 py-2.5 text-xs text-left"
                            />
                            <input
                              type="text"
                              placeholder="Degree Earned (e.g., Bachelor of Science)"
                              value={eduForm.degree}
                              onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                              className="frosted-glass-input px-4 py-2.5 text-xs text-left"
                            />
                            <input
                              type="text"
                              placeholder="Field of Study (e.g., Computer Science)"
                              value={eduForm.fieldOfStudy}
                              onChange={(e) => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })}
                              className="frosted-glass-input px-4 py-2.5 text-xs text-left"
                            />
                            <input
                              type="text"
                              placeholder="Start Date (e.g., Sep 2017)"
                              value={eduForm.startDate}
                              onChange={(e) => setEduForm({ ...eduForm, startDate: e.target.value })}
                              className="frosted-glass-input px-4 py-2.5 text-xs text-left"
                            />
                            <input
                              type="text"
                              placeholder="End Date (e.g., May 2021)"
                              value={eduForm.endDate}
                              onChange={(e) => setEduForm({ ...eduForm, endDate: e.target.value })}
                              className="frosted-glass-input px-4 py-2.5 text-xs text-left"
                            />
                            <input
                              type="text"
                              placeholder="CGPA / Grade (optional)"
                              value={eduForm.description}
                              onChange={(e) => setEduForm({ ...eduForm, description: e.target.value })}
                              className="frosted-glass-input px-4 py-2.5 text-xs text-left"
                            />
                          </div>
                          <button
                            onClick={addEducation}
                            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Save Education
                          </button>
                        </div>
                      </div>
                    )}

                    {currentSection === "skills" && (
                      <div className="space-y-4">
                        <h3 className="text-base font-bold text-white font-display uppercase tracking-wide">
                          Skills & Competencies
                        </h3>

                        <form onSubmit={handleAddSkill} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Add single skill (e.g., React, TypeScript, Product Management)..."
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            className="flex-1 frosted-glass-input px-4 py-2.5 text-xs text-left"
                          />
                          <button
                            type="submit"
                            className="bg-indigo-500 hover:bg-indigo-600 font-bold px-4 py-2.5 text-xs rounded-xl cursor-pointer"
                          >
                            Add chip
                          </button>
                        </form>

                        <div className="flex flex-wrap gap-2 pt-2">
                          {currentResume.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 bg-[#1e293b] border border-white/10 text-[#a5b4fc] text-xs font-semibold pl-3 pr-1.5 py-1 rounded-full group"
                            >
                              <span>{skill}</span>
                              <button
                                type="button"
                                onClick={() => removeSkill(skill)}
                                className="p-0.5 rounded-full hover:bg-white/10 text-slate-400 group-hover:text-rose-400 transition-all text-[10px]"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentSection === "extras" && (
                      <div className="space-y-6">
                        {/* Certifications row */}
                        <div className="space-y-3.5 text-left">
                          <h4 className="text-sm font-bold text-white uppercase tracking-wide">Credentials & Certifications</h4>
                          <form onSubmit={handleAddCert} className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Credential Name (e.g., AWS Certified Solutions Architect)"
                              value={certInput}
                              onChange={(e) => setCertInput(e.target.value)}
                              className="flex-1 frosted-glass-input px-4 py-2.5 text-xs text-left"
                            />
                            <button type="submit" className="bg-white/5 hover:bg-white/10 px-4 py-2 text-xs rounded-xl border border-white/10 cursor-pointer">
                              Add
                            </button>
                          </form>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {currentResume.certifications.map((cert, idx) => (
                              <span key={idx} className="bg-slate-900 border border-white/5 text-slate-350 text-xs px-2.5 py-1 rounded flex items-center gap-2">
                                <span>{cert}</span>
                                <button type="button" onClick={() => removeCert(idx)} className="text-slate-500 hover:text-rose-450 text-[10px]">✕</button>
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Languages row */}
                        <div className="space-y-3.5 text-left border-t border-white/5 pt-4">
                          <h4 className="text-sm font-bold text-white uppercase tracking-wide">Languages spoken</h4>
                          <form onSubmit={handleAddLang} className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Language (e.g., Spanish - Professional Native, English - Bilingual)"
                              value={langInput}
                              onChange={(e) => setLangInput(e.target.value)}
                              className="flex-1 frosted-glass-input px-4 py-2.5 text-xs text-left"
                            />
                            <button type="submit" className="bg-white/5 hover:bg-white/10 px-4 py-2 text-xs rounded-xl border border-white/10 cursor-pointer">
                              Add
                            </button>
                          </form>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {currentResume.languages.map((lang, idx) => (
                              <span key={idx} className="bg-slate-900 border border-white/5 text-slate-350 text-xs px-2.5 py-1 rounded flex items-center gap-2">
                                <span>{lang}</span>
                                <button type="button" onClick={() => removeLang(idx)} className="text-slate-500 hover:text-rose-450 text-[10px]">✕</button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right/Side interactive templates print output Preview Container */}
                {showPreviewPane && (
                  <div className="w-full lg:w-[480px] xl:w-[500px] border-t lg:border-t-0 lg:border-l border-white/10 bg-[#0c1226] overflow-y-auto p-4 sm:p-6 flex flex-col justify-between gap-6 relative">
                    <div className="space-y-6">
                      {/* Document Template Settings controller */}
                      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">Quick Panel Design</h4>
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-300 font-bold px-2 py-0.5 rounded-full">Template Engine</span>
                        </div>

                        {/* Theme selections */}
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "modern", label: "Modern Standard", desc: "Suits general corporate templates" },
                            { id: "minimal", label: "Minimal Mono", desc: "Suits developers & software profiles" },
                            { id: "creative", label: "Creative Sidebar", desc: "Suits styling & design profiles", premium: true },
                          ].map((theme) => {
                            const isLocked = theme.premium && !userIsPremium;
                            return (
                              <button
                                key={theme.id}
                                disabled={isLocked}
                                onClick={() => {
                                  if (isLocked) {
                                    alert("Premium template! Please unlock core premium options first.");
                                    return;
                                  }
                                  handleUpdateResumeField("root", "templateId", theme.id);
                                }}
                                className={`flex flex-col text-left p-2.5 rounded-xl border text-[11px] font-medium leading-tight relative transition-all cursor-pointer ${
                                  currentResume.templateId === theme.id
                                    ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                                    : isLocked
                                    ? "border-transparent bg-slate-950/20 text-slate-600 cursor-not-allowed"
                                    : "border-white/5 bg-white/[0.01] text-slate-400 hover:text-white hover:border-white/10"
                                }`}
                              >
                                <span>{theme.label}</span>
                                {isLocked && (
                                  <span className="absolute top-1 right-1 text-[8px] bg-amber-500/20 text-amber-500 px-1 py-0.2 rounded uppercase font-bold">
                                    Locked
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Scale responsive container displaying paper preview */}
                      <div className="relative border border-white/10 rounded-2xl p-2.5 bg-slate-950/40 shadow-inner">
                        <div className="absolute top-4 right-4 z-10 flex gap-2">
                          <button
                            onClick={() => exportPDF("resume-preview-document", `${currentResume.title.replace(/\s+/g, "_")}.pdf`)}
                            className="p-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg transition-all cursor-pointer"
                            title="Download PDF printout"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="overflow-x-auto rounded-lg">
                          <div
                            id="resume-preview-document"
                            className="origin-top w-[600px] text-justify scale-[0.7] sm:scale-[0.85] lg:scale-[0.8] xl:scale-[0.9] mx-auto min-h-[85vh]"
                            style={{ transformOrigin: "top center" }}
                          >
                            <TemplateRender resume={currentResume} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center text-[11px] text-slate-500 font-mono">
                      PDF generated automatically using html2canvas & jsPDF.
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* AI Cover Letters Module */}
            {activeTab === "letters" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
              >
                <div className="border-b border-white/5 pb-4">
                  <h2 className="text-xl md:text-2xl font-black text-white font-display uppercase tracking-wide">
                    AI cover letters engine
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Auto write tailored professional cover letters and sync them securely to the cloud.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Parameter Inputs */}
                  <div className="lg:col-span-5 frosted-glass-card rounded-2xl p-6 border border-white/10 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Writing Parameters</h3>

                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-medium text-slate-400">Target Role Title</label>
                      <input
                        type="text"
                        placeholder="e.g., Staff Cloud Engineer"
                        value={clForm.jobTitle}
                        onChange={(e) => setClForm({ ...clForm, jobTitle: e.target.value })}
                        className="w-full frosted-glass-input px-4 py-2.5 text-xs text-left"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-medium text-slate-400">Company Name</label>
                      <input
                        type="text"
                        placeholder="e.g., Google"
                        value={clForm.companyName}
                        onChange={(e) => setClForm({ ...clForm, companyName: e.target.value })}
                        className="w-full frosted-glass-input px-4 py-2.5 text-xs text-left"
                      />
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-medium text-slate-400">Target Job Description Details</label>
                      <textarea
                        placeholder="Paste target job descriptions and basic instructions inside..."
                        value={clForm.jobDescription}
                        onChange={(e) => setClForm({ ...clForm, jobDescription: e.target.value })}
                        className="w-full h-32 frosted-glass-input p-3.5 text-xs"
                      />
                    </div>

                    <button
                      onClick={handleGenerateCoverLetter}
                      disabled={aiLoading}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-linear-to-r from-indigo-500 to-purple-500 hover:brightness-110 shadow-md transition-all cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" />
                      {aiLoading ? "Generating letter..." : "Auto-Generate with Gemini"}
                    </button>
                  </div>

                  {/* Right generated letter output area */}
                  <div className="lg:col-span-7 space-y-6">
                    {generatedLetter ? (
                      <div className="frosted-glass rounded-2xl p-6 border border-indigo-400/20 text-left space-y-4 bg-slate-900/10">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                          <div>
                            <input
                              type="text"
                              value={letterTitle}
                              onChange={(e) => setLetterTitle(e.target.value)}
                              className="text-sm font-bold text-white bg-transparent border-b border-transparent hover:border-white/10 focus:outline-none"
                            />
                            <p className="text-[10px] text-slate-500 uppercase font-mono mt-0.5">GEMINI TAILORED DRAFT</p>
                          </div>
                          <button
                            onClick={handleSaveCoverLetter}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" /> Save to Cloud
                          </button>
                        </div>

                        <div className="bg-white/5 rounded-xl p-5 border border-white/5 text-xs text-slate-300 leading-relaxed max-h-[50vh] overflow-y-auto whitespace-pre-line text-justify select-text">
                          {generatedLetter}
                        </div>
                      </div>
                    ) : (
                      <div className="frosted-glass-card rounded-2xl p-12 text-center text-slate-500 border border-white/5">
                        <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">No letters active</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          Provide employment and company details on the side to generate custom professional applications drafts.
                        </p>
                      </div>
                    )}

                    {/* Historic Cover letters section */}
                    {letters.length > 0 && (
                      <div className="space-y-3.5 border-t border-white/5 pt-6">
                        <h4 className="text-xs font-bold text-slate-450 uppercase tracking-widest text-left">HISTORIC SAVED DRAFTS</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {letters.map((letObj) => (
                            <div
                              key={letObj.id}
                              onClick={() => {
                                setLetterTitle(letObj.title);
                                setClForm({
                                  jobTitle: letObj.jobTitle,
                                  companyName: letObj.companyName,
                                  jobDescription: "",
                                });
                                setGeneratedLetter(letObj.content);
                              }}
                              className="bg-white/[0.02] border border-white/5 p-4 rounded-xl flex justify-between items-start gap-3 cursor-pointer hover:bg-white/5 transition-all text-left"
                            >
                              <div className="space-y-1">
                                <h5 className="font-bold text-white text-xs">{letObj.title}</h5>
                                <p className="text-indigo-300 text-[10px] font-semibold">
                                  {letObj.jobTitle} at {letObj.companyName}
                                </p>
                                <p className="text-slate-500 text-[9px] font-medium font-mono">
                                  {new Date(letObj.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={(e) => handleDeleteCoverLetter(letObj.id, e)}
                                className="text-slate-500 hover:text-rose-455 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Premium billing Upgrade module */}
            {activeTab === "premium" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="max-w-4xl mx-auto overflow-y-auto p-4 sm:p-6 space-y-8"
              >
                <div className="text-center space-y-3 pt-6">
                  <span className="inline-block bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 font-bold uppercase tracking-widest text-[10px] px-3 py-1 rounded-full animate-pulse">
                    Premium Member Offer
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black text-white font-display leading-none">
                    Unlock Unlimited <br />
                    <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-300 via-indigo-400 to-purple-400">
                      Elite Styling Presets
                    </span>
                  </h2>
                  <p className="text-slate-400 text-sm max-w-lg mx-auto leading-relaxed">
                    Gain immediate access to premium layouts, advanced ATS word optimizations trackers, and multiple custom templates presets.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  <div className="frosted-glass-card rounded-3xl p-6 border border-white/10 text-left flex flex-col justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-white font-display uppercase tracking-wide">Free Tier</h4>
                      <p className="text-slate-500 text-xs mt-0.5">Basic builder capabilities</p>
                      <ul className="space-y-3 pt-6 text-xs text-slate-350 font-medium">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> Basic resume creator</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> standard layout templates</li>
                        <li className="flex items-center gap-2 text-slate-600"><Check className="w-4 h-4 text-slate-600 stroke-[3]" /> Advanced sidebar creative layout</li>
                      </ul>
                    </div>
                    <div className="pt-8">
                      <button className="w-full py-3 bg-white/5 border border-white/10 text-slate-400 text-xs font-bold rounded-2xl cursor-not-allowed">
                        CURRENT PLAN
                      </button>
                    </div>
                  </div>

                  <div className="frosted-glass-card rounded-3xl p-6 border border-amber-500/30 text-left flex flex-col justify-between relative bg-indigo-950/15">
                    <span className="absolute top-4 right-4 text-[9px] bg-amber-500/20 text-amber-500 font-bold uppercase tracking-wider px-2.5 py-1 rounded-full animate-bounce">
                      BEST VALUE
                    </span>

                    <div>
                      <h4 className="text-lg font-bold text-white font-display uppercase tracking-wide">Elite Plan</h4>
                      <p className="text-amber-500 text-xs font-semibold mt-0.5">Unlimited lifetime access</p>
                      <ul className="space-y-4 pt-6 text-xs text-slate-200 font-medium">
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500 stroke-[3]" /> Unlock &quot;Creative Sidebar&quot; template option</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500 stroke-[3]" /> Unlimited cover letters drafting</li>
                        <li className="flex items-center gap-2"><Check className="w-4 h-4 text-amber-500 stroke-[3]" /> Advanced Gemini keyword matchmaker</li>
                      </ul>
                    </div>
                    <div className="pt-8">
                      {userIsPremium ? (
                        <button className="w-full py-3.5 bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-black rounded-2xl uppercase font-mono">
                          ✓ Elite Premium Unlocked
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setUserIsPremium(true);
                            alert("Premium status unlocked on active preview session! Explore Creative visual themes.");
                          }}
                          className="w-full py-3.5 bg-linear-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 text-xs font-black rounded-2xl uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer"
                        >
                          Unlock Lifetime Elite Preset
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-center font-mono text-[10px] text-slate-500">
                  <p className="flex items-center justify-center gap-1.5 leading-none">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" /> Authorized payment portal secured by external SSL.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
