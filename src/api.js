const SGDB_KEY = "0812c6370f65d5aa635ae5906aa0ed46";

export async function searchGameCover(gameName) {
  const searchRes = await fetch(
    `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(gameName)}`,
    { headers: { Authorization: `Bearer ${SGDB_KEY}` } },
  );
  const searchData = await searchRes.json();
  if (!searchData.data || searchData.data.length === 0) return [];

  const gameId = searchData.data[0].id;

  const coverRes = await fetch(
    `https://www.steamgriddb.com/api/v2/grids/game/${gameId}?dimensions=600x900`,
    { headers: { Authorization: `Bearer ${SGDB_KEY}` } },
  );
  const coverData = await coverRes.json();

  if (!coverData.data || coverData.data.length === 0) return [];

  return coverData.data.slice(0, 5).map((img) => ({
    id: img.id,
    name: gameName,
    cover: img.url,
  }));
}
