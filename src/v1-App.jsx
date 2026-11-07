import { useState } from "react";

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleDownload = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:4000/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ Téléchargé : ${data.filename}`);
      } else {
        setMessage(`❌ Erreur : ${data.error}`);
      }
    } catch (err) {
      setMessage("❌ Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center">iDownloader Free for use</h1>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Stick your URL here"
          className="w-full p-2 mb-4 rounded bg-gray-700 text-white"
        />
        <button
          onClick={handleDownload}
          disabled={loading || !url}
          className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
        >
          {loading ? "Downloading..." : "Download  MP3"}
        </button>
        {message && <p className="mt-4 text-sm">{message}</p>}
      </div>
    </div>
  );
}

export default App;
