import { useState, useEffect, useCallback, useRef } from "react";

const TOTAL_STEPS = 4;

const STORE_TYPES = [
  { id: "mens", label: "Men's Clothing", icon: "👔", desc: "Shirts, pants, jackets & more" },
  { id: "womens", label: "Women's Clothing", icon: "👗", desc: "Dresses, tops, skirts & more" },
  { id: "streetwear", label: "Streetwear", icon: "🧢", desc: "Urban drops & limited editions" },
  { id: "mixed", label: "Mixed Store", icon: "🛍️", desc: "All genders, all styles" },
];

const CHAT_MESSAGES = [
  { from: "customer", text: "3ndek had l hoodie f la taille M?" },
  { from: "bot", text: "Oui! La taille M kayna fi stock ✅ Perfect for 170–180cm. T7wess n rservilek had l hoodie?" },
  { from: "customer", text: "Ch7el ydir?" },
  { from: "bot", text: "Ydir 4500DA m3a 48h livraison 🚚 n9der nconfirmi la commande doka?" },
];

const FORM_FIELDS = [
  { key: "firstName", label: "First Name", placeholder: "Yacine", type: "text", half: true },
  { key: "familyName", label: "Family Name", placeholder: "Benali", type: "text", half: true },
  { key: "storeName", label: "Store Name", placeholder: "MyFashion Store", type: "text" },
  { key: "businessType", label: "Business Type", placeholder: "", type: "text", readOnly: true },
  { key: "email", label: "Email Address", placeholder: "you@example.com", type: "email" },
  { key: "phone", label: "Phone Number", placeholder: "+213 6XX XXX XXX", type: "tel" },
];

const VALIDATORS = {
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  phone: (v) => v === "" || /^[+\d\s\-()]{7,}$/.test(v),
  default: (v) => v.trim().length > 0,
};

function useStepTransition(initial = 0) {
  const [step, setStep] = useState(initial);
  const [phase, setPhase] = useState("in");

  const goTo = useCallback((next) => {
    setPhase("out");
    setTimeout(() => {
      setStep(next);
      setPhase("in");
    }, 280);
  }, []);

  return { step, phase, goTo };
}

function useTypingEffect(messages) {
  const [revealed, setRevealed] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (revealed >= messages.length) return;
    const delay = revealed === 0 ? 400 : 900;
    const t1 = setTimeout(() => {
      if (messages[revealed].from === "bot") {
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          setRevealed((r) => r + 1);
        }, 1100);
      } else {
        setRevealed((r) => r + 1);
      }
    }, delay);
    return () => clearTimeout(t1);
  }, [revealed, messages]);

  return { revealed, typing };
}

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60" />
      <div
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #3b82f6, #6366f1)" }}
      />
      <div
        className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, #0ea5e9, #3b82f6)" }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
        style={{ background: "radial-gradient(circle, #2563eb, transparent)" }}
      />
    </div>
  );
}

function StepDots({ current, total }) {
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center rounded-full font-bold text-xs transition-all duration-500 ${
                active
                  ? "w-8 h-8 bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110"
                  : done
                  ? "w-6 h-6 bg-blue-100 text-blue-600"
                  : "w-6 h-6 bg-slate-100 text-slate-300"
              }`}
            >
              {done ? (
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                n
              )}
            </div>
            {i < total - 1 && (
              <div className={`h-0.5 w-6 rounded-full transition-all duration-500 ${done ? "bg-blue-300" : "bg-slate-100"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PrimaryButton({ onClick, disabled, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative w-full py-4 rounded-2xl font-semibold text-sm transition-all duration-300 overflow-hidden ${
        disabled
          ? "bg-slate-100 text-slate-300 cursor-not-allowed"
          : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:shadow-xl"
      } ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">{children}</span>
      {!disabled && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </button>
  );
}

function FormField({ field, value, onChange, error }) {
  const [focused, setFocused] = useState(false);
  const hasError = error && value.length > 0;

  return (
    <div className={field.half ? "" : "col-span-2"}>
      <label
        htmlFor={field.key}
        className="block text-xs font-semibold text-slate-500 mb-1.5 tracking-widest uppercase"
      >
        {field.label}
      </label>
      <div className="relative">
        <input
          id={field.key}
          type={field.type}
          value={value}
          onChange={(e) => !field.readOnly && onChange(field.key, e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          readOnly={field.readOnly}
          placeholder={field.placeholder}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${field.key}-error` : undefined}
          className={`w-full px-4 py-3.5 rounded-xl border text-sm transition-all duration-200 outline-none ${
            field.readOnly
              ? "bg-blue-50/50 border-blue-100 text-blue-400 cursor-not-allowed font-medium"
              : hasError
              ? "bg-white border-red-300 text-slate-800 ring-2 ring-red-100"
              : focused
              ? "bg-white border-blue-400 text-slate-800 ring-2 ring-blue-100 shadow-sm"
              : "bg-slate-50/80 border-slate-200 text-slate-800 placeholder:text-slate-300 hover:border-slate-300 hover:bg-white"
          }`}
        />
        {!field.readOnly && value.length > 0 && !hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-3 h-3 text-emerald-500" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
      {hasError && (
        <p id={`${field.key}-error`} className="text-xs text-red-400 mt-1 ml-1">
          Please enter a valid {field.label.toLowerCase()}
        </p>
      )}
    </div>
  );
}

function EntryScreen({ onStart }) {
  const features = [
    { icon: "⚡", text: "Instant replies" },
    { icon: "📦", text: "Order tracking" },
    { icon: "📏", text: "Size guidance" },
  ];

  return (
    <div className="flex flex-col items-center text-center gap-8 py-8 px-2">
      <div className="relative">
        <div
          className="w-28 h-28 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl"
          style={{ background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)", boxShadow: "0 20px 60px rgba(37,99,235,0.35)" }}
        >
          🤖
        </div>
        <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex items-center justify-center rounded-full h-6 w-6 bg-emerald-500 text-[9px] text-white font-black tracking-tight">
            AI
          </span>
        </span>
      </div>

      <div className="space-y-4 max-w-sm">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold px-4 py-2 rounded-full tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Setup in under 2 minutes
        </div>
        <h1
          className="text-4xl sm:text-5xl font-black text-slate-900 leading-[1.1] tracking-tight"
          style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
        >
          Your store's AI{" "}
          <span
            className="relative"
            style={{ WebkitTextFillColor: "transparent", WebkitBackgroundClip: "text", backgroundImage: "linear-gradient(135deg, #2563eb, #4f46e5)" }}
          >
            assistant
          </span>
        </h1>
        <p className="text-slate-500 text-base leading-relaxed">
          Automate size questions, orders, and product inquiries — no coding needed.
        </p>
      </div>

      <PrimaryButton onClick={onStart}>
        Get Started Free
        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </PrimaryButton>

      <div className="flex items-center gap-5">
        {features.map(({ icon, text }) => (
          <div key={text} className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-lg border border-blue-100">
              {icon}
            </div>
            <span className="text-xs text-slate-500 font-medium">{text}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        Trusted by <span className="font-bold text-slate-600">1,200+</span> clothing stores across Algeria 🇩🇿
      </p>
    </div>
  );
}

function StepOne({ selected, onSelect, onNext }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold text-blue-500 tracking-widest uppercase mb-2">Step 1 — Store Type</p>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
          What do you sell?
        </h2>
        <p className="text-slate-400 text-sm mt-1">Choose the category that best describes your store.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {STORE_TYPES.map((type) => {
          const isActive = selected === type.label;
          return (
            <button
              key={type.id}
              onClick={() => onSelect(type.label)}
              aria-pressed={isActive}
              className={`relative flex flex-col items-start gap-2 p-5 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                isActive
                  ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
                  : "border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50/80"
              }`}
            >
              {isActive && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-black">✓</span>
              )}
              <span className="text-3xl">{type.icon}</span>
              <div>
                <p className={`text-sm font-bold ${isActive ? "text-blue-700" : "text-slate-800"}`}>{type.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{type.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <PrimaryButton onClick={onNext} disabled={!selected}>
        Continue
        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </PrimaryButton>
    </div>
  );
}

function StepTwo({ formData, onChange, onNext, canProceed }) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = useCallback(
    (key, value) => {
      const validator = VALIDATORS[key] || VALIDATORS.default;
      return !validator(value);
    },
    []
  );

  const handleChange = (key, value) => {
    onChange(key, value);
    if (touched[key]) {
      setErrors((prev) => ({ ...prev, [key]: validate(key, value) }));
    }
  };

  const handleBlur = (key) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: validate(key, formData[key] || "") }));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold text-blue-500 tracking-widest uppercase mb-2">Step 2 — Your Info</p>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
          Tell us about your store
        </h2>
        <p className="text-slate-400 text-sm mt-1">We'll personalize your chatbot with these details.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {FORM_FIELDS.map((field) => (
          <div
            key={field.key}
            className={field.half ? "" : "col-span-2"}
            onBlur={() => !field.readOnly && handleBlur(field.key)}
          >
            <FormField
              field={field}
              value={formData[field.key] || ""}
              onChange={handleChange}
              error={touched[field.key] && errors[field.key]}
            />
          </div>
        ))}
      </div>

      <PrimaryButton onClick={onNext} disabled={!canProceed}>
        Continue
        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </PrimaryButton>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 justify-start">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm shrink-0 shadow-md">
        🤖
      </div>
      <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
        <div className="flex items-center gap-1 h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-slate-300"
              style={{ animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ msg, visible }) {
  const isBot = msg.from === "bot";
  return (
    <div
      className={`flex items-end gap-2 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"} ${isBot ? "justify-start" : "justify-end"}`}
    >
      {isBot && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-sm shrink-0 shadow-md">
          🤖
        </div>
      )}
      <div
        className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isBot
            ? "bg-white text-slate-700 rounded-tl-sm border border-slate-100"
            : "bg-blue-600 text-white rounded-tr-sm shadow-blue-200"
        }`}
        style={!isBot ? { background: "linear-gradient(135deg, #2563eb, #4f46e5)" } : {}}
      >
        {msg.text}
      </div>
      {!isBot && (
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm shrink-0 border border-slate-200">
          🛒
        </div>
      )}
    </div>
  );
}

function StepThree({ onNext }) {
  const { revealed, typing } = useTypingEffect(CHAT_MESSAGES);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [revealed, typing]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold text-blue-500 tracking-widest uppercase mb-2">Step 3 — Live Preview</p>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
          See it in action 🔥
        </h2>
        <p className="text-slate-400 text-sm mt-1">Watch how your chatbot handles real customer conversations.</p>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-slate-50 overflow-hidden shadow-lg shadow-slate-100">
        <div className="flex items-center gap-3 px-4 py-3.5 bg-white border-b border-slate-100">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-base shadow-md">
            🤖
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Store Assistant</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-500 font-semibold">Online now</span>
            </div>
          </div>
          <div className="ml-auto flex gap-1.5">
            {["bg-red-300", "bg-amber-300", "bg-emerald-300"].map((c, i) => (
              <span key={i} className={`w-3 h-3 rounded-full ${c}`} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 px-4 py-5 min-h-[240px] overflow-y-auto">
          {CHAT_MESSAGES.slice(0, revealed).map((msg, i) => (
            <ChatMessage key={i} msg={msg} visible={true} />
          ))}
          {typing && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-4 py-3.5 bg-white border-t border-slate-100 flex items-center gap-2.5">
          <div className="flex-1 bg-slate-100 rounded-xl px-4 py-2.5 text-xs text-slate-400 select-none">
            Type a message…
          </div>
          <button
            aria-label="Send message"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md transition-transform hover:scale-105"
            style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>

      <PrimaryButton onClick={onNext}>
        Looks great! Continue
        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </PrimaryButton>
    </div>
  );
}

function StepFour({ formData }) {
  const perks = ["Instant setup", "No code needed", "Cancel anytime"];

  return (
    <div className="flex flex-col items-center text-center gap-8 py-6 px-2">
      <div
        className="w-28 h-28 rounded-[2rem] flex items-center justify-center text-5xl shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          boxShadow: "0 20px 60px rgba(16,185,129,0.35)",
          animation: "float 3s ease-in-out infinite",
        }}
      >
        🚀
      </div>

      <div className="space-y-3 max-w-sm">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold px-4 py-2 rounded-full tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Setup complete
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight" style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}>
          Your chatbot is ready!
        </h2>
        {formData.storeName && (
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-4 py-2 rounded-full">
            <span className="text-sm">🏪</span>
            <span className="text-blue-700 font-bold text-sm">{formData.storeName}</span>
          </div>
        )}
        <p className="text-slate-400 text-sm leading-relaxed">
          Start automating your customer messages instantly — zero technical skills required.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          className="w-full py-4 rounded-2xl font-bold text-white text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl"
          style={{ background: "linear-gradient(135deg, #2563eb, #4f46e5)", boxShadow: "0 8px 30px rgba(37,99,235,0.4)" }}
        >
          ✅ Activate My Chatbot
        </button>
        <button className="w-full py-4 rounded-2xl font-bold text-blue-600 text-sm bg-white border-2 border-blue-100 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
          🎁 Start Free Trial
        </button>
      </div>

      <div className="flex items-center gap-5 flex-wrap justify-center">
        {perks.map((t) => (
          <span key={t} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center text-[10px] font-bold">✓</span>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function GetStarted() {
  const { step, phase, goTo } = useStepTransition(0);
  const [selectedType, setSelectedType] = useState("");
  const [formData, setFormData] = useState({
    firstName: "", familyName: "", storeName: "",
    businessType: "", email: "", phone: "",
  });

  const handleTypeSelect = useCallback((type) => {
    setSelectedType(type);
    setFormData((prev) => ({ ...prev, businessType: type }));
  }, []);

  const handleFormChange = useCallback((key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const canProceedStep2 =
    formData.firstName.trim() &&
    formData.familyName.trim() &&
    formData.storeName.trim() &&
    VALIDATORS.email(formData.email);

  const transitionClass = phase === "in"
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-4 pointer-events-none";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes bounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
      `}</style>

      <AnimatedBackground />

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/80 border border-white/60 overflow-hidden">

            {step > 0 && step < 5 && (
              <div className="px-6 pt-6 pb-4 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => goTo(step - 1)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors group"
                    aria-label="Go back"
                  >
                    <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                  </button>
                  <StepDots current={step} total={TOTAL_STEPS} />
                </div>
              </div>
            )}

            <div className={`p-6 transition-all duration-300 ease-out ${transitionClass}`}>
              {step === 0 && <EntryScreen onStart={() => goTo(1)} />}
              {step === 1 && (
                <StepOne
                  selected={selectedType}
                  onSelect={handleTypeSelect}
                  onNext={() => goTo(2)}
                />
              )}
              {step === 2 && (
                <StepTwo
                  formData={formData}
                  onChange={handleFormChange}
                  onNext={() => goTo(3)}
                  canProceed={canProceedStep2}
                />
              )}
              {step === 3 && <StepThree onNext={() => goTo(4)} />}
              {step === 4 && <StepFour formData={formData} />}
            </div>
          </div>

          {step === 0 && (
            <div className="flex items-center justify-center gap-6 mt-5">
              {[
                { emoji: "🔒", text: "Secure & private" },
                { emoji: "⚡", text: "No credit card" },
                { emoji: "🇩🇿", text: "Made for DZ" },
              ].map(({ emoji, text }) => (
                <span key={text} className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <span>{emoji}</span> {text}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
