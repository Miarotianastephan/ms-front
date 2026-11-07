import { useEffect, useState } from "react";

function App() {
  const [url, setUrl] = useState("");
  const [isPlaylist, setIsPlaylist] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloads, setDownloads] = useState([]);

  const handleDownload = async () => {
    if (!url) return;
    setDownloading(true);

    try {
      await fetch("http://localhost:4000/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, isPlaylist, folderName }),
      });
      setUrl("");
    } catch (err) {
      alert("Erreur lors du téléchargement.");
    } finally {
      setDownloading(false);
    }
  };

  const fetchDownloads = async () => {
    const res = await fetch("http://localhost:4000/downloads");
    const data = await res.json();
    setDownloads(data.downloads || []);
  };

  useEffect(() => {
    fetchDownloads();
    const interval = setInterval(fetchDownloads, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">iDownloader Free for use</h1>

        <div className="bg-gray-800 p-6 rounded-xl shadow-xl mb-8">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Stick your URL here"
            className="w-full p-2 mb-4 rounded bg-gray-700 text-white"
          />
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Nom du dossier (optionnel)"
            className="w-full p-2 mb-4 rounded bg-gray-700 text-white"
          />
          <label className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={isPlaylist}
              onChange={(e) => setIsPlaylist(e.target.checked)}
              className="mr-2"
            />
            Télécharger la playlist complète
          </label>
          <button
            onClick={handleDownload}
            disabled={downloading || !url}
            className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
          >
            {downloading ? "Downloading..." : "Download MP3"}
          </button>
        </div>

        <div className="bg-gray-800 p-4 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4">📦 Téléchargements ({downloads.length})</h2>
          <ul className="space-y-2">
            {downloads.map((d) => (
              <li
                key={d.id}
                className="p-2 rounded bg-gray-700"
              >
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="truncate max-w-[70%]">
                    {d.filename || d.url}
                  </span>
                  <span className={
                    d.status === "completed"
                      ? "text-green-400"
                      : d.status === "error"
                      ? "text-red-400"
                      : "text-yellow-300"
                  }>
                    {d.status}
                  </span>
                </div>
                {d.folder && <div className="text-xs text-gray-400">📁 {d.folder}</div>}
                {d.status === "downloading" && (
                  <div className="w-full bg-gray-600 rounded h-2 overflow-hidden">
                    <div
                      className="bg-blue-400 h-full transition-all duration-200"
                      style={{ width: `${d.progress}%` }}
                    ></div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
