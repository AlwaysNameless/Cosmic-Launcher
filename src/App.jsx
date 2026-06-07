import { useState } from "react";
import "./App.css";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

function App() {
  const [games, setGames] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newGame, setNewGame] = useState({ name: "", path: "" });
  const [coverResults, setCoverResults] = useState([]);
  const [selectedCover, setSelectedCover] = useState("");
  const [contextMenu, setContextMenu] = useState(null);

  function addGame() {
    if (newGame.name === "" || newGame.path === "") return;
    setGames([
      ...games,
      {
        id: Date.now(),
        name: newGame.name,
        path: newGame.path,
        cover: selectedCover,
      },
    ]);
    setNewGame({ name: "", path: "" });
    setSelectedCover("");
    setCoverResults([]);
    setShowModal(false);
  }

  async function launchGame(path) {
    try {
      await invoke("launch_game", { path });
    } catch (e) {
      alert("Failed to launch:" + e);
    }
  }

  async function browsePath() {
    const selected = await open({
      filters: [{ name: "Executable", extensions: ["exe"] }],
    });
    if (selected) {
      setNewGame({ ...newGame, path: selected });
    }
  }

  async function handleNameChange(e) {
    const name = e.target.value;
    setNewGame({ ...newGame, name });
    if (name.length > 2) {
      try {
        const results = await invoke("search_game_covers", { name });
        setCoverResults(results);
      } catch (e) {
        console.error(e);
      }
    } else {
      setCoverResults([]);
    }
  }

  function handleRightClick(e, gameId) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, gameId });
  }

  function removeGame(gameId) {
    setGames(games.filter((g) => g.id !== gameId));
    setContextMenu(null);
  }

  function closeContextMenu() {
    setContextMenu(null);
  }

  return (
    <div className="app" onClick={closeContextMenu}>
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
                onChange={handleNameChange}
              />

              {coverResults.length > 0 && (
                <div className="cover-results">
                  {coverResults.map((result) => (
                    <img
                      key={result.id}
                      src={result.url}
                      alt="cover"
                      className={`cover-option ${selectedCover === result.url ? "selected" : ""}`}
                      onClick={() => setSelectedCover(result.url)}
                    />
                  ))}
                </div>
              )}

              <div className="path-row">
                <input
                  className="modal-input"
                  placeholder="Path to .exe"
                  value={newGame.path}
                  onChange={(e) =>
                    setNewGame({ ...newGame, path: e.target.value })
                  }
                />
                <button className="browse-btn" onClick={browsePath}>
                  Browse
                </button>
              </div>

              <div className="modal-buttons">
                <button
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button className="confirm-btn" onClick={addGame}>
                  Add Game
                </button>
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
          ) : (
            games.map((game) => (
              <div
                className="game-card"
                key={game.id}
                onClick={() => launchGame(game.path)}
                onContextMenu={(e) => handleRightClick(e, game.id)}
              >
                <div
                  className="game-cover"
                  style={
                    game.cover
                      ? {
                          backgroundImage: `url(${game.cover})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : {}
                  }
                ></div>
                <div className="game-name">{game.name}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={closeContextMenu}
        >
          <button
            className="context-item delete"
            onClick={() => removeGame(contextMenu.gameId)}
          >
            🗑 Remove Game
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
