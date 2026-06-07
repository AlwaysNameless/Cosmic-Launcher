use std::process::Command;
use tauri_plugin_http::reqwest;

#[tauri::command]
fn launch_game(path: String) -> Result<(), String> {
    Command::new("cmd")
        .args(["/C", "start", "", &path])
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn search_game_covers(name: String) -> Result<Vec<serde_json::Value>, String> {
    let client = reqwest::Client::new();
    let key = "0812c6370f65d5aa635ae5906aa0ed46";

    let search_text = client
        .get(format!(
            "https://www.steamgriddb.com/api/v2/search/autocomplete/{}",
            name
        ))
        .header("Authorization", format!("Bearer {}", key))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())?;

    let search_res: serde_json::Value =
        serde_json::from_str(&search_text).map_err(|e| e.to_string())?;
    let game_id = search_res["data"][0]["id"]
        .as_u64()
        .ok_or("No game found")?;

    let cover_text = client
        .get(format!(
            "https://www.steamgriddb.com/api/v2/grids/game/{}?dimensions=600x900",
            game_id
        ))
        .header("Authorization", format!("Bearer {}", key))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .text()
        .await
        .map_err(|e| e.to_string())?;

    let cover_res: serde_json::Value =
        serde_json::from_str(&cover_text).map_err(|e| e.to_string())?;

    let covers = cover_res["data"]
        .as_array()
        .ok_or("No covers found")?
        .iter()
        .take(5)
        .map(|img| {
            serde_json::json!({
                "id": img["id"],
                "url": img["url"]
            })
        })
        .collect();

    Ok(covers)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![launch_game, search_game_covers])
        .run(tauri::generate_context!())
        .expect("error while running tauri application")
}
