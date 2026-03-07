import welcome from "../assets/wlecome.gif";
import free from "../assets/free.gif";
import useImages from "../hooks/useImages";

const Home = () => {
    const { data: billboardItems, loading, error } = useImages("billboard");

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
                    This website was built to showcase the various works primarily from the websites owner Oliver Martin, including other works and contributions from friends and others.
                </p>
                <img src={free} alt="Free" className="w-40 h-auto mx-auto" />
            
                <p>
                  All content on here can be used and consumed for free! I do not sell any products, with exceptions being for in-game DLC's and advertisements within applications installed from the <a className="text-blue-700" href="https://apps.apple.com/gb/developer/oliver-martin/id1879587446" target="_blank">App Store</a> and <a className="text-blue-700" href="https://play.google.com/store/apps/developer?id=Olivr" target="_blank">Google Play</a>
                </p>
            
            </div>
            {loading && <p>Loading billboard...</p>}
            {error && <p className="text-red-600">Error loading billboard.</p>}
            {!loading && !error && billboardItems.length > 0 && (
                <div className="w-full max-w-4xl mt-8">
                    <h2 className="text-2xl font-bold mb-4 text-center">Featured</h2>
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