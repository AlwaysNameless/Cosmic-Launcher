import { useState } from "react";
import "./App.css";

function App() {
  const [games, setGames] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newGame, setNewGame] = useState({ name: "", path: "" });
  return (
    <div className="app">
      <div className="sidebar">
        <div className="logo">🌃 Cosmic</div>
        <nav>
          <button className="nav-item">Library</button>
          <button className="nav-item">Recent</button>
          <button className="nav-item">Settings</button>
        </nav>
      </div>

      <div className="main">
        <div className="topbar">
          <h1>Library</h1>
          <button className="add-btn" onClick={() => setShowModal(true)}>
            + Add Game
          </button>
        </div>
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Add Game</h2>
              <input
                className="modal-input"
                placeholder="Game name"
                value={newGame.name}
                onChange={(e) =>
                  setNewGame({ ...newGame, name: e.target.value })
                }
              />
              <input
                className="modal-input"
                placeholder="Path to .exe"
                value={newGame.path}
                onChange={(e) =>
                  setNewGame({ ...newGame, path: e.target.value })
                }
              />
              <div className="modal-buttons">
                <button
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button className="confirm-btn">Add Game</button>
              </div>
            </div>
          </div>
        )}
        <div className="game-grid">
          {games.length === 0 ? (
            <div className="empty-state">
              <p>No games yet.</p>
              <p>Click "+ Add Game" to get started.</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default App;
