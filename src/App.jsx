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
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";

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
          <Route path="/contact" element={<Contact />} />
          <Route path="/software" element={<Software />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/*" element={<h1>Page Not Found</h1>} />
        </Routes>
      </div>

      <Footer />
    </div>
  );
}

export default App;
