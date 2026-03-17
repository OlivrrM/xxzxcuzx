import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { Turnstile } from "@marsidev/react-turnstile";

const TURNSTILE_SITEKEY = process.env.REACT_APP_TURNSTILE_SITEKEY || "";

const GuestBook = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const [captchaToken, setCaptchaToken] = useState("");
  const [turnstileError, setTurnstileError] = useState("");

  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(true);

  const [userIp, setUserIp] = useState("");

  const hasSessionSigned = useMemo(() => {
    return sessionStorage.getItem("guestbook_signed") === "true";
  }, []);

  const canSubmit =
    name.trim().length > 0 &&
    message.trim().length > 0 &&
    captchaToken &&
    !hasSessionSigned;

  /* ---------------------------------- */
  /* LOAD DATA */
  /* ---------------------------------- */

  const loadEntries = async () => {
    setLoadingEntries(true);
    try {
      const q = query(
        collection(db, "guestbook"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const snap = await getDocs(q);

      const docs = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setEntries(docs);
    } catch (err) {
      console.error("Failed to load entries", err);
    } finally {
      setLoadingEntries(false);
    }
  };

  /* ---------------------------------- */
  /* INIT */
  /* ---------------------------------- */

  useEffect(() => {
    if (!TURNSTILE_SITEKEY) {
      setTurnstileError(
        "Missing Turnstile site key. Add REACT_APP_TURNSTILE_SITEKEY."
      );
    }

    loadEntries();

    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => setUserIp(data.ip))
      .catch(() => setUserIp(""));
  }, []);

  /* ---------------------------------- */
  /* FORM */
  /* ---------------------------------- */

  const resetForm = () => {
    setName("");
    setMessage("");
    setCaptchaToken("");

    if (window.turnstile?.reset) {
      window.turnstile.reset();
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setStatus("");

    if (hasSessionSigned) {
      setError("You have already signed the guest book.");
      return;
    }

    try {
      // Basic IP duplicate check (not secure, just UX)
      if (userIp) {
        const q = query(collection(db, "guestbook"), limit(100));
        const snap = await getDocs(q);

        const exists = snap.docs.some(
          (doc) => doc.data().ip === userIp
        );

        if (exists) {
          sessionStorage.setItem("guestbook_signed", "true");
          setError("You have already signed the guest book.");
          return;
        }
      }

      setStatus("Saving...");

      await addDoc(collection(db, "guestbook"), {
        name: name.trim(),
        message: message.trim(),
        createdAt: serverTimestamp(),
        ip: userIp || null,
        turnstileToken: captchaToken, // NOTE: should verify server-side in real app
      });

      sessionStorage.setItem("guestbook_signed", "true");

      resetForm();
      setStatus("Thank you for signing the guest book");

    } catch (err) {
      console.error(err);
      setError("Failed to save entry.");
    }
  };

  const onTurnstileSuccess = (token) => {
    setCaptchaToken(token);
  };

  /* ---------------------------------- */
  /* UI */
  /* ---------------------------------- */

  const showSignedMessage =
    hasSessionSigned || status === "Thank you for signing the guest book";

  return (
    <div className="w-full max-w-[600px] mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Guest Book</h1>

      <form onSubmit={onSubmit} className="flex flex-col gap-4 mb-12">

        {/* NAME */}
        <div>
          <label className="block text-white mb-1">Name</label>
          <input
            maxLength={50}
            className="w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* MESSAGE */}
        <div>
          <label className="block text-white mb-1">Message</label>
          <textarea
            value={message}
            maxLength={500}
            className="w-full"
            rows={4}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="text-right text-white/80">
            {message.length}/500
          </p>
        </div>

        {/* CAPTCHA */}
        <div className="flex justify-center">
          <Turnstile
            siteKey={TURNSTILE_SITEKEY}
            onSuccess={onTurnstileSuccess}
            onExpire={() => setCaptchaToken("")}
            onError={() =>
              setTurnstileError("Turnstile failed to load.")
            }
          />
        </div>

        {turnstileError && (
          <p className="text-red-600 text-center">{turnstileError}</p>
        )}

        {error && (
          <p className="text-red-700 font-bold text-center">{error}</p>
        )}

        {status && (
          <p className="text-white/80 text-center">{status}</p>
        )}

        {/* BUTTONS / STATE */}
        {showSignedMessage ? (
          <div className="text-center text-lg text-red-700 font-bold py-4">
            You have already signed the guest book.
          </div>
        ) : (
          <div className="flex gap-4 justify-end">
            <button type="submit" disabled={!canSubmit}>
              Sign
            </button>

            <button type="button" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        )}
      </form>

      {/* LINK */}
      <div className="text-center">
        <a href="/visitors" className="text-blue-800 underline">
          View Guestbook
        </a>
      </div>
    </div>
  );
};

export default GuestBook;