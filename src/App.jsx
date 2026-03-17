import { Route, Routes } from "react-router";

import Nav from "./components/layout/nav/nav";
import Footer from "./components/layout/footer/footer";

import Home from "./pages/home";
import Games from "./pages/games";
import GameDetail from "./pages/gameDetail";
import Photography from "./pages/photography";
import Photo from "./pages/photo/photo";
import Contact from "./pages/contact";
import Software from "./pages/software";
import GuestBook from "./pages/guestBook";
import Visitors from "./pages/visitors";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";

import CursorGifHover from "./components/CursorGifHover";
import notFound from "./assets/notfound.gif";

function App() {
  return (
    <div className="page-container flex flex-col min-h-screen items-center">
      <Nav />

      <div className="page-content max-w-[1200px] w-full flex flex-col flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games" element={<Games />} />
          <Route path="/games/:gameName" element={<GameDetail />} />
          <Route path="/photography" element={<Photography />} />
          <Route path="/photography/:index" element={<Photo />} />
          <Route path="/guestbook" element={<GuestBook />} />
          <Route path="/visitors" element={<Visitors />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/software" element={<Software />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/*" element={<div className="flex-1 pt-12 justify-start items-center p-4 flex flex-col">
            <h3 className="text-2xl mb-4" style={{color: "#ff0000"}}>Page Not Found</h3>
            <img src={notFound} alt="Not found" className="w-[180px] h-auto max-w-md mt-4 pr-8" />
          </div>} />
        </Routes>
      </div>

      <Footer />
      <CursorGifHover />
    </div>
  );
}

export default App;
