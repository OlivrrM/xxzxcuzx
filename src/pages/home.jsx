import welcome from "../assets/wlecome.gif";

const Home = () => {

    return (
        <div className="flex-1 p-6 flex items-start justify-center">
            <img src={welcome} alt="Welcome" className="mt-4" />
        </div>
    );
}

export default Home;