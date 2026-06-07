import { useState } from "react";
import "./App.css";

function App() {
  const [games, setGames] = useState([]);
  return (
    <div className="app">
      <div className="sidebar">
        <div className="logo">🚀 Cosmic</div>
        <nav>
          <button className="nav-item">Library</button>
          <button className="nav-item">Recent</button>
          <button className="nav-item">Settings</button>
        </nav>
      </div>

      <div className="main">
        <p>Main Content here</p>
      </div>
    </div>
  );
}

export default App;
