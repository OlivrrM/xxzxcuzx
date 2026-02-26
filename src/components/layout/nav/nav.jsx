import coolTitle from "../../../assets/title.gif";
import com from "../../../assets/xxzxcuzx_dot_com.png";
import { Link } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";

const Nav = () => {
  const { user, logout } = useAuth();
  const style = "text-[#ff0000] text-4xl font-bold";

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="relative p-2 m-4">
      {/* top-right buttons */}
      {user && (
        <div className="absolute top-0 right-0 m-4 flex gap-2">
          <Link
            to="/dashboard"
            className="bg-white text-black px-3 py-1 rounded"
          >
            Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="bg-white text-black px-3 py-1 rounded"
          >
            Log out
          </button>
        </div>
      )}

      <div className="flex items-end justify-center gap-8">
        <Link to="/software">
          <p className={style}>Software</p>
        </Link>
        <Link to="/games">
          <p className={style}>Games</p>
        </Link>

        <div className="flex items-end relative h-[80px]">
          <img src={coolTitle} alt="XXZCUZX" className="h-full" />
          <img src={com} alt=".com" className="h-[50%] mb-1" />
        </div>

        <Link to="/photography">
          <p className={style}>Photography</p>
        </Link>
        <Link to="/contact">
          <p className={style}>Contact</p>
        </Link>
      </div>
    </nav>
  );
};

export default Nav;
