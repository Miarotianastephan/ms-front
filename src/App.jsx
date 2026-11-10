import { useEffect, useState } from "react";
import { ArrowDownToLine, AudioLines, Check, ChevronDown, ClipboardPaste, Clock3, Folder, Link2, LoaderCircle, Moon, Music2, Sun, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

function getYoutubeUrlError(value) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return "";

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmedValue);
  } catch {
    return "Ce lien ne semble pas être une URL valide. Vérifiez qu’il est complet.";
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return "Le lien doit commencer par https:// ou http://.";
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const isYoutubeHost = hostname === "youtube.com" || hostname.endsWith(".youtube.com");
  const isShortHost = hostname === "youtu.be";
  if (!isYoutubeHost && !isShortHost) {
    return "Ce lien ne vient pas de YouTube. Collez un lien youtube.com ou youtu.be.";
  }

  const videoIdPattern = /^[\w-]{11}$/;
  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
  const videoId = isShortHost
    ? pathParts[0]
    : ["shorts", "embed", "live"].includes(pathParts[0])
      ? pathParts[1]
      : parsedUrl.searchParams.get("v");
  const isPlaylistLink = pathParts[0] === "playlist" && Boolean(parsedUrl.searchParams.get("list"));

  if (!isPlaylistLink && !videoIdPattern.test(videoId || "")) {
    return "Le lien YouTube semble incomplet. Utilisez une vidéo ou une playlist YouTube valide.";
  }

  return "";
}

function StatusBadge({ status }) {
  const variants = {
    completed: { label: "Terminé", className: "bg-[#e9f4ed] text-[#34704f] dark:bg-[#203a2c] dark:text-[#a9d4b7]", Icon: Check },
    error: { label: "Échec", className: "bg-[#fbedeb] text-[#a4463c] dark:bg-[#472b29] dark:text-[#efaaa3]", Icon: TriangleAlert },
    downloading: { label: "En cours", className: "bg-[#f4f0e4] text-[#8b6a25] dark:bg-[#3d3828] dark:text-[#e5cc8e]", Icon: Clock3 },
    processing: { label: "Conversion", className: "bg-[#e9f0f5] text-[#496c86] dark:bg-[#283744] dark:text-[#a9cde5]", Icon: LoaderCircle },
    queued: { label: "En attente", className: "bg-[#f0f1ed] text-[#70776f] dark:bg-[#303832] dark:text-[#bdc5bd]", Icon: Clock3 },
    completed_with_errors: { label: "Partiel", className: "bg-[#f4f0e4] text-[#8b6a25] dark:bg-[#3d3828] dark:text-[#e5cc8e]", Icon: TriangleAlert },
  };
  const item = variants[status] || { label: "En attente", className: "bg-[#f0f1ed] text-[#70776f] dark:bg-[#303832] dark:text-[#bdc5bd]", Icon: Clock3 };
  const { Icon } = item;

  return (
    <Badge variant="secondary" className={`h-auto shrink-0 gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${item.className}`}>
      <Icon aria-hidden="true" className={`size-3.5 ${status === "processing" ? "animate-spin" : ""}`} />{item.label}
    </Badge>
  );
}

function formatBytes(value) {
  if (!Number.isFinite(value) || value <= 0) return null;
  const units = ["o", "Ko", "Mo", "Go"];
  let amount = value;
  let unitIndex = 0;
  while (amount >= 1024 && unitIndex < units.length - 1) {
    amount /= 1024;
    unitIndex += 1;
  }
  return `${amount.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatEta(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  if (seconds < 60) return `${Math.round(seconds)} s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return remainingSeconds ? `${minutes} min ${remainingSeconds} s` : `${minutes} min`;
}

function DownloadTrack({ item, folder }) {
  const progress = Number.isFinite(item.progress) ? Math.max(0, Math.min(100, item.progress)) : null;
  const downloaded = formatBytes(item.downloadedBytes);
  const total = formatBytes(item.totalBytes);
  const speed = formatBytes(item.speed);
  const eta = formatEta(item.eta);

  return (
    <div className="flex gap-3 border-b border-[#eff0ec] py-4 last:border-0 last:pb-0 first:pt-0 dark:border-[#2a332d]">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f5f1] text-[#34704f] dark:bg-[#26382d] dark:text-[#a9d4b7]"><Music2 aria-hidden="true" className="size-[18px]" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate pt-0.5 text-sm font-medium text-[#283129] dark:text-[#e4ebe5]">{item.title || item.filename || item.url || "Préparation du titre…"}</p>
            {(item.index || folder) && <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-[#858c84] dark:text-[#a3ada5]">
              {item.index && <span>{item.index}{item.total ? ` / ${item.total}` : ""}</span>}
              {item.index && folder && <span>·</span>}
              {folder && <><Folder aria-hidden="true" className="size-3.5" />{folder}</>}
            </p>}
          </div>
          <StatusBadge status={item.status} />
        </div>
        {(item.status === "downloading" || item.status === "processing") && <>
          <Progress value={item.status === "processing" ? 100 : progress ?? undefined} aria-label={`Progression de ${item.title || "ce titre"}`} className="mt-3 h-1.5 gap-0 [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-[#edf0ec] [&_[data-slot=progress-indicator]]:bg-[#43836a] dark:[&_[data-slot=progress-track]]:bg-[#303832]" />
          <p className="mt-1.5 flex flex-wrap gap-x-2 text-[11px] text-[#858c84] dark:text-[#a3ada5]">
            <span>{item.status === "processing" ? item.stage || "Conversion audio" : progress === null ? "Téléchargement en cours" : `${Math.round(progress)} %`}</span>
            {item.status === "downloading" && downloaded && <span>{downloaded}{total ? ` / ${total}` : ""}</span>}
            {item.status === "downloading" && speed && <span>{speed}/s</span>}
            {item.status === "downloading" && eta && <span>Environ {eta}</span>}
          </p>
        </>}
        {item.status === "error" && item.error && <p className="mt-1.5 text-xs text-[#ad493f] dark:text-[#efaaa3]">{item.error}</p>}
      </div>
    </div>
  );
}

function DownloadItem({ download, expanded, onToggle }) {
  const items = download.items || [];
  if (!download.isPlaylist && items.length <= 1) {
    return <li><DownloadTrack item={items[0] || download} folder={download.folder} /></li>;
  }

  const total = download.playlistTotal || items.length;
  return (
    <li className="border-b border-[#eff0ec] py-4 last:border-0 last:pb-0 first:pt-0 dark:border-[#2a332d]">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onToggle} aria-expanded={expanded} className="group min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#43836a] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1a211c]">
          <span className="flex items-center gap-2">
            <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-[#778278] transition-transform duration-200 dark:text-[#a3ada5] ${expanded ? "rotate-0" : "-rotate-90"}`} />
            <span className="truncate text-sm font-semibold text-[#283129] group-hover:text-[#28664e] dark:text-[#e4ebe5] dark:group-hover:text-[#a9d4b7]">{download.playlistTitle || "Playlist YouTube"}</span>
          </span>
          <span className="mt-1 block truncate pl-6 text-xs text-[#858c84] dark:text-[#a3ada5]">{download.url}</span>
        </button>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={download.status} />
          <p className="text-[11px] tabular-nums text-[#858c84] dark:text-[#a3ada5]">
            {download.completedCount || 0} / {total || "…"} terminés
            {download.status === "downloading" && download.playlistTotal && ` · ${download.progress || 0} %`}
          </p>
        </div>
      </div>
      {expanded && <div className="mt-2 h-72 overflow-y-auto overscroll-contain pr-2 sm:h-80">
        {items.length > 0 ? <ul>{items.map((item) => <li key={item.id}><DownloadTrack item={item} folder={download.folder} /></li>)}</ul> : <p className="py-5 text-center text-xs text-[#858c84] dark:text-[#a3ada5]">Récupération des informations de la playlist…</p>}
      </div>}
    </li>
  );
}

function App() {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("sonora-theme");
    return savedTheme ? savedTheme === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [pasteMessage, setPasteMessage] = useState("");
  const [isPlaylist, setIsPlaylist] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloads, setDownloads] = useState([]);
  const [expandedDownloads, setExpandedDownloads] = useState({});

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("sonora-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const handleDownload = async () => {
    const validationError = getYoutubeUrlError(url);
    if (validationError) {
      setUrlError(validationError);
      return;
    }
    if (!url.trim()) return;
    setDownloading(true);

    try {
      await fetch("http://localhost:4000/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, isPlaylist, folderName }),
      });
      setUrl("");
      setUrlError("");
      setPasteMessage("");
    } catch {
      alert("Erreur lors du téléchargement.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePaste = async () => {
    setPasteMessage("");
    try {
      if (!navigator.clipboard?.readText) {
        setPasteMessage("Le collage automatique n’est pas disponible. Collez le lien avec Ctrl+V ou ⌘V.");
        return;
      }

      const pastedText = (await navigator.clipboard.readText()).trim();
      if (!pastedText) {
        setPasteMessage("Le presse-papiers est vide. Copiez d’abord un lien YouTube.");
        return;
      }

      setUrl(pastedText);
      setUrlError(getYoutubeUrlError(pastedText));
      setPasteMessage(getYoutubeUrlError(pastedText) ? "Le contenu collé ne ressemble pas à un lien YouTube valide." : "Lien collé depuis le presse-papiers.");
    } catch {
      setPasteMessage("Accès au presse-papiers refusé. Collez le lien avec Ctrl+V ou ⌘V.");
    }
  };

  const fetchDownloads = async () => {
    const res = await fetch("http://localhost:4000/downloads");
    const data = await res.json();
    setDownloads(data.downloads || []);
  };

  useEffect(() => {
    if (typeof EventSource === "undefined") {
      fetchDownloads();
      const interval = setInterval(fetchDownloads, 2000);
      return () => clearInterval(interval);
    }

    // EventSource reconnects automatically; each reconnect receives a fresh server snapshot.
    const events = new EventSource("http://localhost:4000/downloads/events");
    events.addEventListener("snapshot", (event) => {
      setDownloads(JSON.parse(event.data).downloads || []);
    });
    events.addEventListener("created", (event) => {
      const { download } = JSON.parse(event.data);
      setDownloads((current) => current.some((item) => item.id === download.id) ? current : [download, ...current]);
      if (download.isPlaylist) setExpandedDownloads((current) => ({ ...current, [download.id]: true }));
    });
    events.addEventListener("update", (event) => {
      const { download } = JSON.parse(event.data);
      setDownloads((current) => {
        const exists = current.some((item) => item.id === download.id);
        return exists ? current.map((item) => item.id === download.id ? download : item) : [download, ...current];
      });
    });

    return () => events.close();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9f6] text-[#253028] transition-colors duration-300 dark:bg-[#111713] dark:text-[#e4ebe5]">
      <header className="border-b border-[#e9ebe5] bg-white/80 transition-colors duration-300 dark:border-[#2a332d] dark:bg-[#171e19]/90">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="#accueil" className="flex items-center gap-2.5 text-[#253b2e] dark:text-[#e4ebe5]" aria-label="Sonora, accueil">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#28664e] text-white"><AudioLines aria-hidden="true" className="size-[19px]" /></span>
            <span className="text-[17px] font-semibold tracking-[-0.04em]">sonora<span className="text-[#43836a]">.</span></span>
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 text-xs font-medium text-[#737c73] dark:text-[#a3ada5] sm:flex"><span className="size-2 rounded-full bg-[#73a98a]" /> Convertisseur audio</span>
            <Button
              variant="outline"
              size="icon"
              className="size-9 rounded-full border-[#e3e5df] bg-white text-[#536157] hover:bg-[#f0f5f1] dark:border-[#38443b] dark:bg-[#202922] dark:text-[#d5dfd7] dark:hover:bg-[#2a362e]"
              onClick={() => setIsDark((current) => !current)}
              aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
              aria-pressed={isDark}
              title={isDark ? "Mode clair" : "Mode sombre"}
            >
              {isDark ? <Sun key="sun" aria-hidden="true" className="theme-icon size-4" /> : <Moon key="moon" aria-hidden="true" className="theme-icon size-4" />}
            </Button>
          </div>
        </div>
      </header>

      <main id="accueil" className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:px-8 sm:pt-[72px]">
        <div className="mx-auto max-w-[760px]">
          <div className="mb-8 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e4e9e2] bg-white px-3 py-1.5 text-xs font-medium text-[#5c7564] dark:border-[#344138] dark:bg-[#1a231d] dark:text-[#b4cbbb]"><AudioLines aria-hidden="true" className="size-3.5" /> Vos vidéos, en audio</span>
            <h1 className="text-[34px] font-semibold tracking-[-0.055em] text-[#26332a] dark:text-[#e5ece6] sm:text-[42px]">La musique, simplement.</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#747d74] dark:text-[#a3ada5] sm:text-[15px]">Collez un lien YouTube pour préparer votre fichier MP3.</p>
          </div>

          <Card className="gap-0 rounded-2xl border border-[#e8e9e4] bg-white p-5 shadow-[0_8px_30px_-24px_rgba(35,48,39,0.24)] transition-colors duration-300 dark:border-[#2c362f] dark:bg-[#1a211c] sm:p-7">
            <div className="mb-2"><Label htmlFor="video-url" className="text-sm font-medium text-[#38443a] dark:text-[#d2dcd4]">Lien de la vidéo</Label></div>
            <div className="relative">
              <Link2 aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#929a91] dark:text-[#98a59b]" />
              <Input id="video-url" type="url" value={url} onChange={(e) => {
                const nextUrl = e.target.value;
                setUrl(nextUrl);
                setUrlError(getYoutubeUrlError(nextUrl));
                setPasteMessage("");
              }} placeholder="https://www.youtube.com/watch?v=..." aria-invalid={Boolean(urlError)} aria-describedby={urlError ? "video-url-error" : pasteMessage ? "video-url-feedback" : undefined} className="h-12 rounded-lg border-[#e3e5df] bg-white pl-11 pr-24 text-sm focus-visible:border-[#43836a] focus-visible:ring-[#43836a]/15 aria-invalid:border-[#c75d51] aria-invalid:focus-visible:ring-[#c75d51]/20 dark:border-[#39443c] dark:bg-[#151b17] dark:text-[#e1e8e2] dark:placeholder:text-[#758078]" />
              <Button type="button" variant="outline" size="sm" onClick={handlePaste} className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 gap-1.5 rounded-md border-[#e3e5df] bg-white px-2.5 text-xs text-[#536157] hover:bg-[#f0f5f1] dark:border-[#39443c] dark:bg-[#202922] dark:text-[#d5dfd7] dark:hover:bg-[#2a362e]">
                <ClipboardPaste aria-hidden="true" className="size-3.5" />Coller
              </Button>
            </div>
            {urlError && <p id="video-url-error" role="alert" className="mt-2 text-xs text-[#ad493f] dark:text-[#efaaa3]">{urlError}</p>}
            {!urlError && pasteMessage && <p id="video-url-feedback" role="status" className="mt-2 text-xs text-[#43836a] dark:text-[#a9d4b7]">{pasteMessage}</p>}
            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <Label htmlFor="folder-name" className="mb-2 block text-sm font-medium text-[#38443a] dark:text-[#d2dcd4]">Dossier de destination <span className="font-normal text-[#929a91] dark:text-[#98a59b]">· facultatif</span></Label>
                <div className="relative"><Folder aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-[17px] -translate-y-1/2 text-[#929a91] dark:text-[#98a59b]" /><Input id="folder-name" type="text" value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Ex. Ma sélection" className="h-12 rounded-lg border-[#e3e5df] bg-white pl-11 text-sm focus-visible:border-[#43836a] focus-visible:ring-[#43836a]/15 dark:border-[#39443c] dark:bg-[#151b17] dark:text-[#e1e8e2] dark:placeholder:text-[#758078]" /></div>
              </div>
              <Button onClick={handleDownload} disabled={downloading || !url.trim() || Boolean(urlError)} className="h-12 w-full rounded-lg bg-[#28664e] px-5 text-sm font-semibold text-white hover:bg-[#20563f] sm:w-auto sm:min-w-[174px]">
                <ArrowDownToLine aria-hidden="true" className="size-[17px]" />{downloading ? "Préparation…" : "Convertir en MP3"}
              </Button>
            </div>
            <Label className="mt-5 w-fit cursor-pointer gap-2.5 text-sm font-normal text-[#687269] dark:text-[#b2bdb4]">
              <Checkbox checked={isPlaylist} onCheckedChange={(checked) => setIsPlaylist(checked === true)} />
              Télécharger la playlist complète
            </Label>
          </Card>

          <section className="mt-10" aria-labelledby="downloads-heading">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 id="downloads-heading" className="text-base font-semibold tracking-[-0.02em] text-[#303b32] dark:text-[#dce5de]">Téléchargements</h2><p className="mt-1 text-xs text-[#899088] dark:text-[#99a49b]">Suivi des conversions récentes</p></div>
              <Badge variant="secondary" className="rounded-full bg-[#edf0eb] px-2.5 py-1 text-xs font-medium tabular-nums text-[#637064] dark:bg-[#29332c] dark:text-[#c1ccc3]">{downloads.length}</Badge>
            </div>
            <Card className="gap-0 rounded-2xl border border-[#e8e9e4] bg-white px-5 py-4 shadow-[0_8px_30px_-24px_rgba(35,48,39,0.24)] transition-colors duration-300 dark:border-[#2c362f] dark:bg-[#1a211c] sm:px-6">
              {downloads.length > 0 ? <ul>{downloads.map((download) => <DownloadItem
                key={download.id}
                download={download}
                expanded={expandedDownloads[download.id] ?? download.status === "downloading"}
                onToggle={() => setExpandedDownloads((current) => ({ ...current, [download.id]: !(current[download.id] ?? download.status === "downloading") }))}
              />)}</ul> : (
                <div className="flex flex-col items-center px-4 py-9 text-center">
                  <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-[#f1f4ef] text-[#71907a] dark:bg-[#27342b] dark:text-[#a9c4af]"><AudioLines aria-hidden="true" className="size-5" /></span>
                  <p className="text-sm font-medium text-[#515d53] dark:text-[#c6d1c8]">Rien ici pour le moment</p>
                  <p className="mt-1 text-xs text-[#929990] dark:text-[#98a39a]">Vos conversions apparaîtront dans cette liste.</p>
                </div>
              )}
            </Card>
          </section>
          <p className="mt-8 text-center text-xs text-[#9aa097] dark:text-[#7f8b82]">Un outil simple pour retrouver votre audio au même endroit.</p>
        </div>
      </main>
    </div>
  );
}

export default App;
