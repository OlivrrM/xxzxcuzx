import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const TURNSTILE_SITEKEY = process.env.REACT_APP_TURNSTILE_SITEKEY || "";

const loadTurnstileScript = () => {
  if (window.turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-turnstile]");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Turnstile script")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.setAttribute("data-turnstile", "true");
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Turnstile script"));
    document.body.appendChild(script);
  });
};

const GuestBook = () => {

  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [turnstileError, setTurnstileError] = useState("");
  const [error, setError] = useState("");
  const [userIp, setUserIp] = useState("");

  // Check if user has already signed (by sessionStorage or IP)
  const hasSessionSigned = useMemo(() => {
    return sessionStorage.getItem("guestbook_signed") === "true";
  }, []);
  const canSubmit = Boolean(name.trim()) && Boolean(message.trim()) && Boolean(captchaToken) && !hasSessionSigned;
  const resetForm = () => {
    setName("");
    setMessage("");
    setCaptchaToken("");
    if (window.turnstile && window.turnstile.reset) {
      window.turnstile.reset();
    }
  };

  const loadEntries = async () => {
    setLoadingEntries(true);
    try {
      const q = query(collection(db, "guestbook"), orderBy("createdAt", "desc"), limit(50));
      const snap = await getDocs(q);
      const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setEntries(docs);
    } catch (err) {
      console.error("Failed to load guest book entries", err);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    loadTurnstileScript().catch(() => {
      console.warn("Unable to load Turnstile script");
    });
    loadEntries();
    // Fetch user IP address (do not display)
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => setUserIp(data.ip))
      .catch(() => setUserIp(""));
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");

    // Check sessionStorage first
    if (sessionStorage.getItem("guestbook_signed") === "true") {
      setError("You have already signed the guest book.");
      return;
    }

    try {
      // Check for existing entry with same IP
      const q = query(collection(db, "guestbook"),
        userIp ? orderBy("ip") : orderBy("createdAt", "desc"),
        userIp ? limit(100) : limit(1)
      );
      const snap = await getDocs(q);
      const alreadyExists = userIp && snap.docs.some(doc => doc.data().ip === userIp);
      if (alreadyExists) {
        sessionStorage.setItem("guestbook_signed", "true");
        setError("You have already signed the guest book.");
        return;
      }

      setStatus("Saving…");
      await addDoc(collection(db, "guestbook"), {
        name: name.trim(),
        message: message.trim(),
        createdAt: serverTimestamp(),
        turnstileToken: captchaToken,
        ip: userIp || null,
      });

      sessionStorage.setItem("guestbook_signed", "true");
      resetForm();
      setStatus("Thank you for signing the guest book");
    } catch (err) {
      console.error("Failed to save guest book entry", err);
      setStatus("Failed to save entry. Try again.");
    }
  };

  const onTurnstileSuccess = (token) => {
    setCaptchaToken(token);
  };


  const turnstileId = useMemo(() => `turnstile-${Math.random().toString(16).slice(2)}`, []);

  const turnstileRendered = useRef(false);
  // Always reset the rendered ref and clear the container on mount/refresh
  useEffect(() => {
    turnstileRendered.current = false;
    const el = document.getElementById(turnstileId);
    if (el) el.innerHTML = "";
  }, [turnstileId]);

  useEffect(() => {
    // Defensive: clear container before rendering
    const el = document.getElementById(turnstileId);
    if (el) el.innerHTML = "";
    if (!TURNSTILE_SITEKEY) return;

    // Wait for window.turnstile to be available (script may load async)
    let cancelled = false;
    function tryRender() {
      if (cancelled) return;
      if (window.turnstile) {
        window.turnstile.render(`#${turnstileId}`, {
          sitekey: TURNSTILE_SITEKEY,
          callback: onTurnstileSuccess,
        });
        turnstileRendered.current = true;
      } else {
        setTimeout(tryRender, 100);
      }
    }
    tryRender();
    return () => {
      cancelled = true;
    };
  }, [TURNSTILE_SITEKEY, turnstileId]);

  return (
    <div className="w-full max-w-[600px] mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Guest Book</h1>
      <form onSubmit={onSubmit} className="flex flex-col w-full mb-12 gap-4">
        <div className="w-full">
          <label className="block text-white w-full text-start mb-1" htmlFor="guest-name">
            Name
          </label>
          <input
            id="guest-name"
            maxLength={50}
            className="w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-white w-full text-start mb-1" htmlFor="guest-message">
            Message
          </label>
          <textarea
            id="guest-message"
            value={message}
            maxLength={500}
            placeholder="how was your stay?"
            className="w-full"
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <p className="text-right text-white/80">{message.length}/500</p>
        </div>

        <div id={turnstileId} className="flex justify-center" />

       {turnstileError && <p className="text-red-600 text-center">{turnstileError}</p>} 
      {turnstileError && <p className="text-red-600 text-center">{turnstileError}</p>}
      {error && <p className="text-xl mt-2 text-[#8B0000] font-bold text-center">{error}</p>}
      {status && <p className="text-sm mt-2 text-white/80">{status}</p>}

      {(
        (!canSubmit && (hasSessionSigned || error)) ||
        status === "Thanks you for signing the guest book!"
      ) ? (
        <div className="text-center text-lg text-[#8B0000] font-bold py-4">
          {status === "Thanks you for signing the guest book!"
            ? "Thank you for signing the guest book!"
            : "You have already signed the guest book."}
        </div>
      ) : (
        <div className="flex flex-row-reverse gap-4 justify-start">  
          <button
            type="submit"
            className="w-fit"
            disabled={!canSubmit}
          >
            Sign
          </button>

          <button
            type="button"
            className="w-fit"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
        </div>
      )}
      </form>

      <div className="mt-8 text-center">
        <a href="/visitors" className="text-blue-800 underline">View Guestbook</a>
      </div>
    </div>
  );
};

export default GuestBook;
