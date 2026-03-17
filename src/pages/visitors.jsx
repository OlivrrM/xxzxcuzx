import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";

const Visitors = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEntries = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "guestbook"), orderBy("createdAt", "desc"), limit(200));
        const snap = await getDocs(q);
        const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setEntries(docs);
      } catch (err) {
        console.error("Failed to load guest book entries", err);
      } finally {
        setLoading(false);
      }
    };
    loadEntries();
  }, []);

  return (
    <div className="w-full max-w-[600px] mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Visitor Messages</h1>
      <Link to="/guestbook" className="text-blue-800 underline block mb-4 text-center">Sign the Guestbook</Link>
      <section>
        {loading ? (
          <p>Loading…</p>
        ) : entries.length === 0 ? (
          <p>No entries yet.</p>
        ) : (
          <ul className="space-y-4">
            {entries.map((entry) => {
              let dateStr = "";
              if (entry.createdAt && entry.createdAt.toDate) {
                const d = entry.createdAt.toDate();
                dateStr = d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
              }
              return (
                <li key={entry.id} className="border border-white/60 p-3 flex flex-col gap-3">
                  <p className="font-semibold text-white text-center">{entry.name}</p>
                  <p className="text-sm text-white/80">{entry.message}</p>
                {dateStr && (
                    <span className="block text-xs text-white/60 mt-1 text-center">{dateStr}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Visitors;
