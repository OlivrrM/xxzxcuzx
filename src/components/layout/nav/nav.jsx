import coolTitle from "../../../assets/title.gif";
import com from "../../../assets/xxzxcuzx_dot_com.png";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";

const Nav = () => {
  const { user, logout } = useAuth();
  const style = "text-[#ff0000] text-4xl font-bold";
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="relative z-10 p-2 m-4">
      {/* top-right buttons */}
      {user && (
        <div className="fixed bottom-0 right-0 m-4 flex gap-6">
          <button>
            <Link
              to="/dashboard"
            >
              Dashboard
            </Link>
          </button>
          <button
            onClick={handleLogout}
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

        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-end relative h-[80px] bg-transparent p-0 shadow-none"
          aria-label="Go to home"
        >
          <img src={coolTitle} alt="XXZCUZX" className="h-full" />
          <img src={com} alt=".com" className="h-[50%] mb-1" />
        </button>

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
