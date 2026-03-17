import coolTitle from "../../../assets/title.gif";
import com from "../../../assets/xxzxcuzx_dot_com.png";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import skull from "../../../assets/skull.gif";
import coolFire from "../../../assets/fire.gif";
import { useState } from "react";
import "./nav.css";

const Nav = () => {
  const { user, logout } = useAuth();
  const style = "text-[#ff0000] text-4xl font-bold";
  const navigate = useNavigate();
  const [showFire, setShowFire] = useState(false);


  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="relative z-10 p-2 m-4">
      {/* top-right buttons */}
      {user && (
        <div className="fixed bottom-0 right-0 z-[1000] m-4 flex gap-6">
          <Link
            to="/dashboard"
            className="app-btn bg-black app-btn-secondary p-[3px_20px] text-white"
            style={{ boxShadow: "0px 0px 15px 1px rgba(255, 0, 0, 1)" }}
          >
            Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="app-btn app-btn-secondary"
          >
            Log out
          </button>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 min-[1201px]:flex-row min-[1201px]:items-end min-[1201px]:justify-center min-[1201px]:gap-8">

        {showFire && (
          <img src={coolFire} alt="fire" className="hidden min-[1201px]:flex h-full w-full absolute z-[-2] opacity-70" />        
        )}
        <div className="p-[10px] flex flex-col min-[1201px]:flex-row">
          <div className="grid gap-4 order-2 mt-2 pb-2 min-[600px]:flex min-[600px]:flex-wrap min-[600px]:justify-center min-[600px]:gap-8 min-[1201px]:hidden nav-mobile-single-col">
            <Link to="/software">
              <p className={style}>Software</p>
            </Link>
            <Link to="/games">
              <p className={style}>Games</p>
            </Link>
            <Link to="/photography">
              <p className={style}>Photography</p>
            </Link>
            <Link to="/contact">
              <p className={style}>Contact</p>
            </Link>
            <hr className="col-span-2 min-[600px]:hidden border-red-500 my-1" />
          </div>

          <div className="hidden min-[1201px]:flex items-end justify-center gap-8 flex-wrap order-2 min-[1201px]:order-1">
            <div className="relative group">
              <img
                src={skull}
                alt="Software preview"
                className="hidden min-[1201px]:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-[40px] h-[40px] object-contain opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity"
              />
              <Link to="/software">
                <p className={style}>Software</p>
              </Link>
            </div>
            <div className="relative group">
              <img
                src={skull}
                alt="Games preview"
                className="hidden min-[1201px]:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-[40px] h-[40px] object-contain opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity"
              />
              <Link to="/games">
                <p className={style}>Games</p>
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-end justify-center relative h-[60px] min-[768px]:h-[80px] bg-transparent p-0 shadow-none order-1 min-[1201px]:order-2 mr-4 ml-4"
            aria-label="Go to home"
            onMouseEnter={() => setShowFire(true)}
            onMouseLeave={() => setShowFire(false)}
          >
            <img src={coolTitle} alt="XXZCUZX" className="h-full flex-shrink-0" />
            <img src={com} alt=".com" className="h-[50%] mb-1 flex-shrink-0" />
          </button>

          <div className="hidden relative min-[1201px]:flex items-end justify-center gap-8 flex-wrap order-3 min-[1201px]:order-3">
                      
            <div className="relative group">
              <img
                src={skull}
                alt="Photography preview"
                className="hidden min-[1201px]:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-[40px] h-[40px] object-contain opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity"
              />
              <Link to="/photography">
                <p className={style}>Photography</p>
              </Link>
            </div>
            <div className="relative group">
              <img
                src={skull}
                alt="Contact preview"
                className="hidden min-[1201px]:block absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-[40px] h-[40px] object-contain opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity"
              />
              <Link to="/contact">
                <p className={style}>Contact</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
