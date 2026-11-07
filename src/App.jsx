import { useEffect, useState } from "react";
import { ArrowDownToLine, AudioLines, Check, Clock3, Folder, Link2, Music2, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

function StatusBadge({ status }) {
  const variants = {
    completed: { label: "Terminé", className: "bg-[#e9f4ed] text-[#34704f]", Icon: Check },
    error: { label: "Échec", className: "bg-[#fbedeb] text-[#a4463c]", Icon: TriangleAlert },
    downloading: { label: "En cours", className: "bg-[#f4f0e4] text-[#8b6a25]", Icon: Clock3 },
  };
  const item = variants[status] || { label: "En attente", className: "bg-[#f0f1ed] text-[#70776f]", Icon: Clock3 };
  const { Icon } = item;

  return (
    <Badge variant="secondary" className={`h-auto shrink-0 gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${item.className}`}>
      <Icon aria-hidden="true" className="size-3.5" />{item.label}
    </Badge>
  );
}

function DownloadItem({ download }) {
  return (
    <li className="flex gap-3 border-b border-[#eff0ec] py-4 last:border-0 last:pb-0 first:pt-0">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f5f1] text-[#34704f]"><Music2 aria-hidden="true" className="size-[18px]" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="truncate pt-0.5 text-sm font-medium text-[#283129]">{download.filename || download.url}</p>
          <StatusBadge status={download.status} />
        </div>
        {download.folder && <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-[#858c84]"><Folder aria-hidden="true" className="size-3.5" />{download.folder}</p>}
        {download.status === "downloading" && <Progress value={download.progress || 0} aria-label="Progression du téléchargement" className="mt-3 h-1.5 gap-0 [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-[#edf0ec] [&_[data-slot=progress-indicator]]:bg-[#43836a]" />}
      </div>
    </li>
  );
}

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
    } catch {
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
    <div className="min-h-screen bg-[#f8f9f6] text-[#253028]">
      <header className="border-b border-[#e9ebe5] bg-white/80">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="#accueil" className="flex items-center gap-2.5 text-[#253b2e]" aria-label="Sonora, accueil">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#28664e] text-white"><AudioLines aria-hidden="true" className="size-[19px]" /></span>
            <span className="text-[17px] font-semibold tracking-[-0.04em]">sonora<span className="text-[#43836a]">.</span></span>
          </a>
          <span className="hidden items-center gap-2 text-xs font-medium text-[#737c73] sm:flex"><span className="size-2 rounded-full bg-[#73a98a]" /> Convertisseur audio</span>
        </div>
      </header>

      <main id="accueil" className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:px-8 sm:pt-[72px]">
        <div className="mx-auto max-w-[760px]">
          <div className="mb-8 text-center">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e4e9e2] bg-white px-3 py-1.5 text-xs font-medium text-[#5c7564]"><AudioLines aria-hidden="true" className="size-3.5" /> Vos vidéos, en audio</span>
            <h1 className="text-[34px] font-semibold tracking-[-0.055em] text-[#26332a] sm:text-[42px]">La musique, simplement.</h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#747d74] sm:text-[15px]">Collez un lien YouTube pour préparer votre fichier MP3.</p>
          </div>

          <Card className="gap-0 rounded-2xl border border-[#e8e9e4] bg-white p-5 shadow-[0_8px_30px_-24px_rgba(35,48,39,0.24)] sm:p-7">
            <div className="mb-2"><Label htmlFor="video-url" className="text-sm font-medium text-[#38443a]">Lien de la vidéo</Label></div>
            <div className="relative">
              <Link2 aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#929a91]" />
              <Input id="video-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="h-12 rounded-lg border-[#e3e5df] bg-white pl-11 text-sm focus-visible:border-[#43836a] focus-visible:ring-[#43836a]/15" />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <Label htmlFor="folder-name" className="mb-2 block text-sm font-medium text-[#38443a]">Dossier de destination <span className="font-normal text-[#929a91]">· facultatif</span></Label>
                <div className="relative"><Folder aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-[17px] -translate-y-1/2 text-[#929a91]" /><Input id="folder-name" type="text" value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="Ex. Ma sélection" className="h-12 rounded-lg border-[#e3e5df] bg-white pl-11 text-sm focus-visible:border-[#43836a] focus-visible:ring-[#43836a]/15" /></div>
              </div>
              <Button onClick={handleDownload} disabled={downloading || !url} className="h-12 w-full rounded-lg bg-[#28664e] px-5 text-sm font-semibold text-white hover:bg-[#20563f] sm:w-auto sm:min-w-[174px]">
                <ArrowDownToLine aria-hidden="true" className="size-[17px]" />{downloading ? "Préparation…" : "Convertir en MP3"}
              </Button>
            </div>
            <Label className="mt-5 w-fit cursor-pointer gap-2.5 text-sm font-normal text-[#687269]">
              <Checkbox checked={isPlaylist} onCheckedChange={(checked) => setIsPlaylist(checked === true)} />
              Télécharger la playlist complète
            </Label>
          </Card>

          <section className="mt-10" aria-labelledby="downloads-heading">
            <div className="mb-4 flex items-center justify-between">
              <div><h2 id="downloads-heading" className="text-base font-semibold tracking-[-0.02em] text-[#303b32]">Téléchargements</h2><p className="mt-1 text-xs text-[#899088]">Suivi des conversions récentes</p></div>
              <Badge variant="secondary" className="rounded-full bg-[#edf0eb] px-2.5 py-1 text-xs font-medium tabular-nums text-[#637064]">{downloads.length}</Badge>
            </div>
            <Card className="gap-0 rounded-2xl border border-[#e8e9e4] bg-white px-5 py-4 shadow-[0_8px_30px_-24px_rgba(35,48,39,0.24)] sm:px-6">
              {downloads.length > 0 ? <ul>{downloads.map((download) => <DownloadItem key={download.id} download={download} />)}</ul> : (
                <div className="flex flex-col items-center px-4 py-9 text-center">
                  <span className="mb-3 flex size-11 items-center justify-center rounded-full bg-[#f1f4ef] text-[#71907a]"><AudioLines aria-hidden="true" className="size-5" /></span>
                  <p className="text-sm font-medium text-[#515d53]">Rien ici pour le moment</p>
                  <p className="mt-1 text-xs text-[#929990]">Vos conversions apparaîtront dans cette liste.</p>
                </div>
              )}
            </Card>
          </section>
          <p className="mt-8 text-center text-xs text-[#9aa097]">Un outil simple pour retrouver votre audio au même endroit.</p>
        </div>
      </main>
    </div>
  );
}

export default App;
