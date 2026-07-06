import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Clock,
  Lock,
  Mail,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Worker, User } from "../types/models";
import { loginUser } from "../utils/api";

interface LoginFormProps {
  workers: Worker[];
  onLogin: (user: User) => void;
}

export function LoginForm({ workers, onLogin }: LoginFormProps) {
  const navigate = useNavigate();

  const [loginType, setLoginType] = useState<"worker" | "hod" | "admin">("worker");
  const [workerInput, setWorkerInput] = useState("");
  const [workerError, setWorkerError] = useState("");
  const [hodDepartment, setHodDepartment] = useState("Choir");
  const [hodPasscode, setHodPasscode] = useState("");
  const [hodError, setHodError] = useState("");
  const [adminUsername, setAdminUsername] = useState("admin@church.com");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [showDemoTip, setShowDemoTip] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      badge: "Scripture of the Day ✨",
      title: "Philippians 4:13",
      description:
        "“I can do all things through Christ who strengthens me.” A powerful reminder of faith, endurance, and purpose for all workers today.",
    },
    {
      badge: "Church Announcement 📢",
      title: "Sunday Glorious Service",
      description:
        "Join us this Sunday at 8:00 AM for our monthly Thanksgiving Celebration pageantry. Ensure you check in before 7:45 AM for grace time.",
    },
    {
      badge: "Scripture of the Day ✨",
      title: "Colossians 3:23",
      description:
        "“Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.” Dedicated service in God's vineyard.",
    },
    {
      badge: "Church Announcement 📢",
      title: "Midweek Interactive Study",
      description:
        "Thursday Midweek Bible Exposition starts at 6:30 PM. All HODs and workers are requested to arrive at 6:00 PM for special leadership prayer.",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const navigateToHome = (role: User["role"] | "hod") => {
    if (role === "superadmin") {
      navigate("/dashboard");
    } else if (role === "manager") {
      navigate("/workers");
    } else {
      navigate("/member");
    }
  };

  const handleWorkerLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWorkerError("");
    const input = workerInput.trim();

    if (!input) {
      setWorkerError("Please enter your Worker ID or full name.");
      return;
    }

    const matched = workers.find(
      (w) =>
        w.id.toUpperCase() === input.toUpperCase() ||
        w.name.toLowerCase().includes(input.toLowerCase()),
    );

    if (matched) {
      const user: User = {
        id: matched.id,
        name: matched.name,
        email: matched.email || "",
        role: "member",
        workerId: matched.id,
      };
      onLogin(user);
      navigateToHome("member");
    } else {
      setWorkerError("Worker ID or name not matching. Typical IDs are W001 to W008.");
    }
  };

  const handleHodLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHodError("");

    const code = hodPasscode.trim().toLowerCase();
    const deptLower = hodDepartment.toLowerCase();

    if (code === "hod" || code === "hod123" || code === `${deptLower}hod`) {
      const user: User = {
        id: `HOD-${hodDepartment}`,
        name: `${hodDepartment} Head of Dept (HOD)`,
        email: "",
        role: "manager",
      };
      onLogin(user);
      navigateToHome("manager");
    } else {
      setHodError('Invalid passcode. Use "hod" or "hod123" to authenticate immediately.');
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");

    try {
      const user = await loginUser(adminUsername, adminPassword);
      if (user.role !== "superadmin") {
        setAdminError("This account does not have system admin access.");
        return;
      }
      onLogin(user);
      navigateToHome("superadmin");
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Invalid admin credentials.");
    }
  };

  const handleQuickDemoFill = (worker: Worker) => {
    setLoginType("worker");
    setWorkerInput(worker.id);
    setWorkerError("");
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="hidden md:flex md:w-[45%] lg:w-[40%] xl:w-[35%] relative overflow-hidden bg-gradient-to-br from-[#060b1e] via-[#0b132b] to-[#1c2541] border-r border-slate-800/60 p-10 flex-col justify-between">
        <div className="absolute top-[-25%] left-[-20%] w-[120%] h-[80%] bg-pink-600/15 rounded-full blur-[110px] mix-blend-screen pointer-events-none animate-pulse duration-[6000ms]" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[100%] h-[70%] bg-[#3b82f6]/15 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute top-[30%] right-[-30%] w-[80%] h-[60%] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600/20 border border-indigo-500/40 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10">
            <div
              className="w-5 h-5 bg-indigo-500 rounded-md rotate-45 flex items-center justify-center text-white"
              style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
            >
              <span className="text-xs font-mono tracking-tighter text-indigo-50 select-none">T</span>
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider uppercase text-slate-100 font-mono">TTC/HR SYSTEM</h1>
            <p className="text-xs text-slate-400 font-medium">Secure Workforce Hub</p>
          </div>
        </div>

        <div className="relative z-10 my-auto py-12 space-y-4">
          <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-none text-white font-sans">
            Start your <br />
            <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
              journey with us.
            </span>
          </h2>
          <p className="text-md text-slate-300 leading-relaxed font-light max-w-sm">
            TTC Church system attendance. Easily enroll, verify Sunday & Thursday morning service proximity status, and audit member clock-ins under one synchronized system dashboard.
          </p>
        </div>

        <div className="relative z-10 mt-auto bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl flex flex-col justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.75rem] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              {slides[currentSlide].badge}
            </span>
            <h3 className="text-[1.25rem] font-semibold text-slate-100 tracking-tight block capitalize">
              {slides[currentSlide].title}
            </h3>
            <p className="text-[1rem] text-slate-400 leading-normal font-light">
              {slides[currentSlide].description}
            </p>
          </div>

          <div className="flex gap-2.5 mt-4">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentSlide(i)}
                className="group relative flex-1 h-1 rounded-full overflow-hidden bg-slate-800 transition-all cursor-pointer"
                title={`Go to slide ${i + 1}`}
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 bg-indigo-500 transition-all duration-300 ${
                    i === currentSlide ? "w-full" : "w-0"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center py-12 px-6 sm:px-12 lg:px-16 xl:px-24 bg-[#020617] relative overflow-hidden">
        <div className="absolute bottom-[-15%] left-[20%] w-[80%] h-[70%] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="md:hidden text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-mono font-extrabold text-lg tracking-wider shadow-lg">
              TTC
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">TTC/HR Attendance Control</h2>
              <p className="text-xs text-slate-400">Sunday & Thursday Service Workforce Portal</p>
            </div>
          </div>

          <div className="text-center md:text-left space-y-1">
            <h2 className="text-4xl font-bold tracking-tight text-white">Welcome Back to Digital</h2>
            <p className="text-md text-slate-400">
              Select your system profile to login and access your personalized parameters.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-[#0b0f19] p-1 rounded-xl border border-slate-800" id="role-switches">
            {(["worker", "hod", "admin"] as const).map((type) => {
              const label =
                type === "worker"
                  ? "Worker Roster"
                  : type === "hod"
                  ? "HOD Access"
                  : "System Admin";
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setLoginType(type);
                    setWorkerError("");
                    setHodError("");
                    setAdminError("");
                  }}
                  className={`py-2 text-md font-bold text-center rounded-lg transition-all ${
                    loginType === type
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="bg-[#090d16] border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl" id="active-panel-form">
            {loginType === "worker" && (
              <form onSubmit={handleWorkerLoginSubmit} className="space-y-4" id="worker-login-form">
                <div className="p-3 bg-[#0d1424] border border-indigo-500/20 rounded-lg text-xs text-slate-300 leading-relaxed font-light">
                  <span className="font-bold text-indigo-400 block mb-0.5">👤 Worker Self-Service:</span>
                  Enter your unique Worker identifier (IDs are W001 to W008) to sign in, complete Sunday & Thursday attendance, or modify roster phone updates.
                </div>

                <div className="space-y-1">
                  <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider">Worker ID or Name</label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
                      <Users size={14} className="text-slate-500" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. W001 or Alice Johnson"
                      value={workerInput}
                      onChange={(e) => setWorkerInput(e.target.value)}
                      className="w-full text-xs text-white bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3.5 outline-none placeholder-slate-600 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono"
                    />
                  </div>
                </div>

                {workerError && (
                  <p className="text-xs text-rose-500 font-semibold bg-rose-950/40 border border-rose-900/40 rounded-lg p-3 text-center">
                    ⚠️ {workerError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base uppercase tracking-wider rounded-lg shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  Access My Profile
                  <ArrowRight size={13} />
                </button>
              </form>
            )}

            {loginType === "hod" && (
              <form onSubmit={handleHodLoginSubmit} className="space-y-4" id="hod-login-form">
                <div className="p-3 bg-[#0d1424] border border-indigo-500/20 rounded-lg text-xs text-slate-300 leading-relaxed font-light">
                  <span className="font-bold text-indigo-400 block mb-0.5">🏢 HOD Manager Authentication:</span>
                  Unlock your specific department console. Passcode permits audit of volunteer lists, records, and Sunday services.
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider">Department Assignment</label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
                        <Building2 size={14} />
                      </span>
                      <select
                        value={hodDepartment}
                        onChange={(e) => setHodDepartment(e.target.value)}
                        className="w-full text-xs text-white bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3.5 outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none cursor-pointer"
                      >
                        <option value="Choir">Choir Team</option>
                        <option value="Music">Music Department</option>
                        <option value="Children">Children Ministry</option>
                        <option value="Maintenance">Maintenance Team</option>
                        <option value="Ushering">Ushering Department</option>
                        <option value="Youth">Youth Network</option>
                        <option value="Outreach">Outreach Department</option>
                      </select>
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 pointer-events-none text-xs font-bold font-mono">▼</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider">Passcode Key</label>
                      <span className="text-xs text-slate-400 font-medium font-mono">Use passcode "hod"</span>
                    </div>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
                        <Lock size={14} />
                      </span>
                      <input
                        type="password"
                        required
                        placeholder="Enter HOD passcode"
                        value={hodPasscode}
                        onChange={(e) => setHodPasscode(e.target.value)}
                        className="w-full text-xs text-white bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3.5 outline-none placeholder-slate-600 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {hodError && (
                  <p className="text-xs text-rose-500 font-semibold bg-rose-950/40 border border-rose-900/40 rounded-lg p-3 text-center">
                    ⚠️ {hodError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base uppercase tracking-wider rounded-lg shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  Unlock Department Console
                  <ArrowRight size={13} />
                </button>
              </form>
            )}

            {loginType === "admin" && (
              <form onSubmit={handleAdminLoginSubmit} className="space-y-4" id="admin-login-form">
                <div className="p-3 bg-[#111827] border border-slate-800 rounded-lg text-sm text-slate-300 leading-relaxed font-light">
                  <span className="font-bold text-slate-200 block mb-0.5">⚙️ Authorized System Admin:</span>
                  Log in with system credentials to adjust Sunday start timers, geofence variables, radius parameters, and sync database keys.
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider">Administrator Username</label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
                        <Mail size={14} />
                      </span>
                      <input
                        type="email"
                        required
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        className="w-full text-xs text-white bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3.5 outline-none placeholder-slate-600 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider">Passcode Key</label>
                      <span className="text-xs text-slate-400 font-medium font-mono">Use passcode "admin123"</span>
                    </div>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
                        <Lock size={14} />
                      </span>
                      <input
                        type="password"
                        placeholder="Enter admin passcode"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full text-xs text-white bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-3.5 outline-none placeholder-slate-600 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                {adminError && (
                  <p className="text-xs text-rose-500 font-semibold bg-rose-950/40 border border-rose-900/40 rounded-lg p-3 text-center">
                    ⚠️ {adminError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base uppercase tracking-wider rounded-lg shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  Log in directly
                  <ArrowRight size={13} />
                </button>
              </form>
            )}

            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono flex items-center gap-1">
                  <Clock size={10} /> v1.2.5 Secure SSL
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <Sparkles size={11} className="text-indigo-400" /> Geofence Ensured
                </span>
              </div>
            </div>
          </div>

          {showDemoTip && (
            <div className="bg-[#0b0f19] border border-slate-800/80 p-5 rounded-2xl relative shadow-xl" id="developer-shortcuts">
              <button
                onClick={() => setShowDemoTip(false)}
                className="absolute top-2 right-2 text-slate-500 hover:text-white text-xs font-bold font-mono px-1.5 hover:bg-slate-800/60 rounded"
                title="Dismiss"
              >
                ×
              </button>
              <h5 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                <Sparkles size={11} className="text-indigo-400 animate-spin" />
                Developer Showcase Sandbox Quick-Login Tags
              </h5>
              <p className="text-xs text-slate-400 mt-1 leading-normal">
                Click any volunteer below to fill credentials and test Worker Clock-In View:
              </p>

              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {workers.slice(0, 4).map((w) => (
                  <button
                    key={w.id}
                    onClick={() => handleQuickDemoFill(w)}
                    className="px-2.5 py-1 bg-[#121826] hover:bg-indigo-900/40 border border-slate-800 text-xs font-semibold font-mono text-slate-300 rounded-lg flex items-center gap-1 cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.98]"
                  >
                    <UserCheck size={8} className="text-indigo-400" />
                    {w.name} ({w.id})
                  </button>
                ))}
              </div>

              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                📢 Alternatively: <br />
                • Click <strong>HOD Access</strong>, select <strong>Choir</strong>, pass matches <strong>hod</strong> to test HOD access.<br />
                • Click <strong>System Admin</strong> and hit submit straight (blank pass authorized) to manage global systems.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
