import welcome from "../assets/wlecome.gif";
import free from "../assets/free.gif";
import useImages from "../hooks/useImages";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, updateDoc, setDoc, increment } from "firebase/firestore";
import clickMe from "../assets/clickme.gif";

const Home = () => {
    const { data: billboardItems, loading, error } = useImages("billboard");
    const [clickCount, setClickCount] = useState(null);
    const [counterError, setCounterError] = useState("");
    const [incrementing, setIncrementing] = useState(false);

    const getSeededColor = (value) => {
        if (typeof value !== "number" || Number.isNaN(value)) return "#ffffff";
        const hue = (value * 137.508) % 360; // golden angle
        return `hsl(${hue}, 65%, 55%)`;
    };

    useEffect(() => {
        const counterDoc = doc(db, "counters", "homeClicks");

        const loadCount = async () => {
            try {
                const snap = await getDoc(counterDoc);
                if (!snap.exists()) {
                    await setDoc(counterDoc, { count: 0 });
                    setClickCount(0);
                } else {
                    setClickCount(snap.data()?.count ?? 0);
                }
            } catch (err) {
                console.error("Failed to load home click count", err);
                setCounterError("Failed to load counter");
            }
        };

        loadCount();
    }, []);

    const incrementClickCount = async () => {
        setIncrementing(true);
        setCounterError("");
        const counterDoc = doc(db, "counters", "homeClicks");

        try {
            await updateDoc(counterDoc, { count: increment(1) });
            setClickCount((prev) => (typeof prev === "number" ? prev + 1 : 1));
        } catch (err) {
            console.error("Failed to increment count", err);
            setCounterError("Failed to increment count");
        } finally {
            setIncrementing(false);
        }
    };

    return (
        <div className="flex-1 p-6 flex flex-col gap-6 items-center justify-start">
            <img src={welcome} alt="Welcome" className="mt-4" />
            <div className="max-w-[70%] flex flex-col justify-center gap-4 text-[#ff0000]">
                <p>
                    Welcome to xxzxcuzx.com
                </p>
                <p>
                    Please explore the website and look through the multitude of games, photography, software and more.
                </p>
                <p>
                    This website was created to showcase a variety of games, photography, software, and other projects, including contributions from friends and various collaborators.                </p>
                <img src={free} alt="Free" className="w-40 h-auto mx-auto" />
            
                <p>
                  All content on here can be used and consumed for free! I do not sell any products, with exceptions being for in-game DLC's and advertisements within applications installed from the <a className="text-blue-700" href="https://apps.apple.com/gb/developer/oliver-martin/id1879587446" target="_blank">App Store</a> and <a className="text-blue-700" href="https://play.google.com/store/apps/developer?id=Olivr" target="_blank">Google Play</a>
                </p>
            
            </div>
            {loading && <p>Loading billboard...</p>}
            {error && <p className="text-red-600">Error loading billboard.</p>}

            <div className="flex flex-col items-center gap-3">
            <img
              onClick={() => {
                if (!incrementing) {
                  incrementClickCount();
                }
              }}
              src={clickMe}
              alt="Click me"
              className="w-18 h-fit inline-block cursor-pointer"
              style={{ cursor: "pointer" }}
            />
              {typeof clickCount === "number" && (
                <p
                  className="text-lg font-bold"
                  style={{ color: getSeededColor(clickCount) }}
                >
                  {clickCount}
                </p>
              )}
              {counterError && <p className="text-red-600">{counterError}</p>}
            </div>

            {!loading && !error && billboardItems.length > 0 && (
                <div className="w-full max-w-4xl mt-8">
                    <div className="flex flex-col gap-6 items-center">
                        {billboardItems.map((item) => (
                            <div onClick={() => {if (item.url) window.open(item.url, '_blank')}} key={item.id} className="bg-transparent flex w-fit p-4 border border-gray-300 cursor-pointer">
                                {item.src && (
                                    <img src={item.src} alt={item.name} className="w-full h-48 object-cover mb-2" />
                                )}
                                <div className="flex flex-col gap-4 ml-4">
                                    <h3 className="text-xl underline font-semibold mb-2 text-[#ff0000]">{item.name}</h3>
                                    {item.blurb && <p className="text-sm text-[#ff0000]">{item.blurb}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;