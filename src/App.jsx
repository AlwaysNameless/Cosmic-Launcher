import { useState, useEffect } from "react";
import { load } from "@tauri-apps/plugin-store";
import "./App.css";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

function App() {
  const [games, setGames] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newGame, setNewGame] = useState({ name: "", path: "", category: "" });
  const [coverResults, setCoverResults] = useState([]);
  const [selectedCover, setSelectedCover] = useState("");
  const [contextMenu, setContextMenu] = useState(null);
  const [store, setStore] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categories, setCategories] = useState([
    "All",
    "Action",
    "RPG",
    "Strategy",
    "Indie",
    "Other",
  ]);
  const [newCategory, setNewCategory] = useState("");
  const [recentGames, setRecentGames] = useState([]);
  const [currentView, setCurrentView] = useState("library");
  const [accentColor, setAccentColor] = useState("#6c47ff");
  const [gridSize, setGridSize] = useState("medium");

  useEffect(() => {
    async function initStore() {
      const s = await load("games.json", { autoSave: true });
      const saved = await s.get("games");
      if (saved) {
        setGames(saved);
        const recent = [...saved]
          .filter((g) => g.lastPlayed)
          .sort((a, b) => b.lastPlayed - a.lastPlayed)
          .slice(0, 5);
        setRecentGames(recent);
      }
      const savedAccent = await s.get("accentColor");
      if (savedAccent) setAccentColor(savedAccent);
      const savedGrid = await s.get("gridSize");
      if (savedGrid) setGridSize(savedGrid);
      const savedCategories = await s.get("categories");
      if (savedCategories) setCategories(savedCategories);
      setStore(s);
    }
    initStore();
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent", accentColor);
    if (store) store.set("accentColor", accentColor);
  }, [accentColor, store]);

  useEffect(() => {
    if (store) store.set("gridSize", gridSize);
  }, [gridSize, store]);

  useEffect(() => {
    if (store) store.set("categories", categories);
  }, [categories, store]);

  function addGame() {
    if (newGame.name === "" || newGame.path === "") return;
    const updated = [
      ...games,
      {
        id: Date.now(),
        name: newGame.name,
        path: newGame.path,
        cover: selectedCover,
        category: newGame.category || "Other",
      },
    ];
    setGames(updated);
    if (store) store.set("games", updated);
    setNewGame({ name: "", path: "", category: "" });
    setSelectedCover("");
    setCoverResults([]);
    setShowModal(false);
  }

  async function launchGame(game) {
    try {
      const seconds = await invoke("launch_game", { path: game.path });
      const updated = games.map((g) =>
        g.id === game.id
          ? {
              ...g,
              playtime: (g.playtime || 0) + seconds,
              lastPlayed: Date.now(),
            }
          : g,
      );
      setGames(updated);
      if (store) store.set("games", updated);
      const recent = [...updated]
        .filter((g) => g.lastPlayed)
        .sort((a, b) => b.lastPlayed - a.lastPlayed)
        .slice(0, 5);
      setRecentGames(recent);
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
    const updated = games.filter((g) => g.id !== gameId);
    setGames(updated);
    if (store) store.set("games", updated);
    setContextMenu(null);
  }

  function closeContextMenu() {
    setContextMenu(null);
  }

  function addCategory() {
    const trimmed = newCategory.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    setCategories([...categories, trimmed]);
    setNewCategory("");
  }
  function removeCategory(cat) {
    if (cat === "All" || cat === "Other") return;
    setCategories(categories.filter((c) => c !== cat));
  }

  return (
    <div className="app" onClick={closeContextMenu}>
      <div className="sidebar">
        <div className="logo">🌃 Cosmic</div>
        <nav>
          <button
            className={`nav-item ${currentView === "library" ? "active" : ""}`}
            onClick={() => setCurrentView("library")}
          >
            Library
          </button>
          <button
            className={`nav-item ${currentView === "settings" ? "active" : ""}`}
            onClick={() => setCurrentView("settings")}
          >
            Settings
          </button>
        </nav>
      </div>

      <div className="main">
        {currentView === "library" && (
          <>
            <div className="topbar">
              <h1>Library</h1>
              <button className="add-btn" onClick={() => setShowModal(true)}>
                + Add Game
              </button>
            </div>

            <div className="category-bar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-btn ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {recentGames.length > 0 && (
              <div className="recent-section">
                <h2 className="section-title">Recently Played</h2>
                <div className="recent-grid">
                  {recentGames.map((game) => (
                    <div
                      className="game-card"
                      key={game.id}
                      onClick={() => launchGame(game)}
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
                      <div className="game-playtime">
                        {game.playtime
                          ? `${Math.floor(game.playtime / 3600)}h ${Math.floor((game.playtime % 3600) / 60)}m`
                          : "Never played"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={`game-grid ${gridSize}`}>
              {games.length === 0 ? (
                <div className="empty-state">
                  <p>No games yet.</p>
                  <p>Click "+ Add Game" to get started.</p>
                </div>
              ) : (
                games
                  .filter(
                    (game) =>
                      selectedCategory === "All" ||
                      game.category === selectedCategory,
                  )
                  .map((game) => (
                    <div
                      className="game-card"
                      key={game.id}
                      onClick={() => launchGame(game)}
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
                      <div className="game-playtime">
                        {game.playtime
                          ? `${Math.floor(game.playtime / 3600)}h ${Math.floor((game.playtime % 3600) / 60)}m`
                          : "Never played"}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </>
        )}

        {currentView === "settings" && (
          <div className="settings-page">
            <h1>Settings</h1>

            <div className="settings-section">
              <h2 className="settings-label">Accent Color</h2>
              <div className="color-options">
                {[
                  "#6c47ff",
                  "#ff4757",
                  "#2ed573",
                  "#1e90ff",
                  "#ff6b81",
                  "#ffa502",
                ].map((color) => (
                  <div
                    key={color}
                    className={`color-swatch ${accentColor === color ? "selected" : ""}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setAccentColor(color)}
                  />
                ))}
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="color-picker"
                />
              </div>
            </div>

            <div className="settings-section">
              <h2 className="settings-label">Grid Size</h2>
              <div className="grid-size-options">
                {["small", "medium", "large"].map((size) => (
                  <button
                    key={size}
                    className={`grid-size-btn ${gridSize === size ? "active" : ""}`}
                    onClick={() => setGridSize(size)}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-section">
              <h2 className="settings-label">Categories</h2>
              <div className="category-tags">
                {categories
                  .filter((c) => c !== "All")
                  .map((cat) => (
                    <div key={cat} className="category-tag">
                      {cat}
                      {cat !== "Other" && (
                        <span
                          className="remove-cat"
                          onClick={() => removeCategory(cat)}
                        >
                          ×
                        </span>
                      )}
                    </div>
                  ))}
              </div>
              <div className="add-category-row">
                <input
                  className="modal-input"
                  placeholder="New category..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                />
                <button className="confirm-btn" onClick={addCategory}>
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
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
