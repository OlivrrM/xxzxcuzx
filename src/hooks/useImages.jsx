import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { photographySchema, softwareSchema, gamesSchema, billboardSchema } from "../schemas";

// custom hook that retrieves a Firestore collection and optionally validates
// each item with a Zod schema. The `name` argument should match one of the
// collections in your database: "photography", "software", "games", etc.
export default function useImages(name = "photography") {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const formatSchemaError = (error) => {
    // Zod errors have `issues` array with path + message
    if (error?.issues && Array.isArray(error.issues)) {
      return error.issues
        .map((issue) => {
          const path = Array.isArray(issue.path) ? issue.path.join(".") : String(issue.path);
          return `${path || "(root)"}: ${issue.message}`;
        })
        .join("; ");
    }
    if (error?.message) return error.message;
    return String(error);
  };

  useEffect(() => {
    let cancelled = false;

    const schemaMap = {
      photography: photographySchema,
      software: softwareSchema,
      games: gamesSchema,
      billboard: billboardSchema,
    };

    async function load() {
      try {
        const colRef = collection(db, name);
        const snapshot = await getDocs(colRef);
        const items = snapshot.docs
          .map((doc) => {
            const raw = doc.data() || {};
            // remove any `id` field coming from user data so we don't overwrite
            const { id: _ignore, ...rest } = raw;
            return { id: doc.id, ...rest };
          })
          // occasionally a document may have no id (very unlikely) – drop it
          .filter((item) => {
            if (!item.id) {
              console.warn("useImages: skipping doc without id", item);
              return false;
            }
            return true;
          });

        const schema = schemaMap[name];
        if (schema) {
          // parse will throw if any document doesn't conform; schema doesn't
          // know about `id` so strip it before validating and then reattach.
          const parsed = items.map((item) => {
            const { id, ...rest } = item;
            const validated = schema.parse(rest);
            return { id, ...validated };
          });
          if (!cancelled) setData(parsed);
        } else {
          if (!cancelled) setData(items);
        }
      } catch (err) {
        console.error(`Failed to fetch ${name} collection`, err);
        if (!cancelled) setError(formatSchemaError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [name, reloadKey]);

  return { data, loading, error, reload: () => setReloadKey((k) => k + 1) };
}
