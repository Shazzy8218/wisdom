import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, Download, Image, FileText, FolderOpen, Grid3X3, List, Filter, X, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { loadUserAssets, deleteUserAsset, moveAssetToFolder, type UserAsset } from "@/lib/asset-storage";

type ViewMode = "grid" | "list";
type FilterType = "all" | "image" | "pdf" | "document" | "file";

const FILTER_OPTIONS: { value: FilterType; label: string; icon: string }[] = [
  { value: "all", label: "All", icon: "📁" },
  { value: "image", label: "Images", icon: "🖼️" },
  { value: "pdf", label: "PDFs", icon: "📄" },
  { value: "document", label: "Docs", icon: "📝" },
  { value: "file", label: "Other", icon: "📎" },
];

function getAssetIcon(type: string) {
  switch (type) {
    case "image": return "🖼️";
    case "pdf": return "📄";
    case "document": return "📝";
    case "spreadsheet": return "📊";
    case "text": return "📃";
    default: return "📎";
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function Assets() {
  const [assets, setAssets] = useState<UserAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedAsset, setSelectedAsset] = useState<UserAsset | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const data = await loadUserAssets({
      fileType: filter === "all" ? undefined : filter,
      search: search || undefined,
    });
    setAssets(data);
    setLoading(false);
  }, [filter, search]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const handleDelete = async (asset: UserAsset) => {
    setDeleting(asset.id);
    const ok = await deleteUserAsset(asset);
    if (ok) {
      setAssets(prev => prev.filter(a => a.id !== asset.id));
      if (selectedAsset?.id === asset.id) setSelectedAsset(null);
      toast({ title: "🗑️ Asset deleted" });
    } else {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
    setDeleting(null);
  };

  const handleDownload = (asset: UserAsset) => {
    const a = document.createElement("a");
    a.href = asset.public_url;
    a.download = asset.file_name;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const imageCount = assets.filter(a => a.file_type === "image").length;
  const fileCount = assets.filter(a => a.file_type !== "image").length;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <p className="section-label text-primary mb-2">Assets</p>
        <h1 className="font-display text-h1 text-foreground">Your Files</h1>
        <p className="text-caption text-muted-foreground mt-1">
          {assets.length} assets · {imageCount} images · {fileCount} files
        </p>
      </div>

      {/* Search + Filters */}
      <div className="px-5 mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search files, prompts..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 flex-1 overflow-x-auto no-scrollbar">
            {FILTER_OPTIONS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  filter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground hover:bg-accent"
                }`}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 ml-2">
            <button onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg ${viewMode === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <FolderOpen className="h-8 w-8 text-primary/50" />
          </div>
          <p className="text-body font-medium text-foreground mb-1">No assets yet</p>
          <p className="text-caption text-muted-foreground max-w-xs">
            Generate images in chat or upload files — they'll be permanently saved here.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="px-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <AnimatePresence>
            {assets.map(asset => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass-card overflow-hidden cursor-pointer group"
                onClick={() => setSelectedAsset(asset)}
              >
                {asset.file_type === "image" ? (
                  <div className="aspect-square bg-card">
                    <img
                      src={asset.public_url}
                      alt={asset.file_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-card flex items-center justify-center">
                    <span className="text-4xl">{getAssetIcon(asset.file_type)}</span>
                  </div>
                )}
                <div className="p-2.5">
                  <p className="text-xs font-medium text-foreground truncate">{asset.file_name}</p>
                  <p className="text-micro text-muted-foreground">
                    {formatSize(asset.file_size)} · {asset.source_module}
                  </p>
                </div>
                {/* Hover actions */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => { e.stopPropagation(); handleDownload(asset); }}
                    className="p-1.5 rounded-lg bg-background/80 backdrop-blur text-foreground hover:bg-background"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(asset); }}
                    className="p-1.5 rounded-lg bg-background/80 backdrop-blur text-destructive hover:bg-background"
                    disabled={deleting === asset.id}
                  >
                    {deleting === asset.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="px-5 space-y-2">
          {assets.map(asset => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-3 flex items-center gap-3 cursor-pointer hover:border-primary/20 transition-all"
              onClick={() => setSelectedAsset(asset)}
            >
              {asset.file_type === "image" ? (
                <img src={asset.public_url} alt="" className="h-12 w-12 rounded-lg object-cover" loading="lazy" />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-card flex items-center justify-center text-2xl">
                  {getAssetIcon(asset.file_type)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{asset.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(asset.file_size)} · {asset.source_module} · {new Date(asset.created_at).toLocaleDateString()}
                </p>
                {asset.original_prompt && (
                  <p className="text-micro text-muted-foreground/70 truncate mt-0.5">"{asset.original_prompt}"</p>
                )}
              </div>
              <div className="flex gap-1">
                <button onClick={e => { e.stopPropagation(); handleDownload(asset); }}
                  className="p-2 rounded-lg hover:bg-accent text-muted-foreground">
                  <Download className="h-4 w-4" />
                </button>
                <button onClick={e => { e.stopPropagation(); handleDelete(asset); }}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive/60"
                  disabled={deleting === asset.id}>
                  {deleting === asset.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Asset Detail Modal */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setSelectedAsset(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto border border-border"
              onClick={e => e.stopPropagation()}
            >
              {selectedAsset.file_type === "image" && (
                <img src={selectedAsset.public_url} alt={selectedAsset.file_name}
                  className="w-full rounded-t-2xl object-contain max-h-[50vh]" />
              )}
              <div className="p-5 space-y-3">
                <h3 className="font-display text-lg font-bold text-foreground">{selectedAsset.file_name}</h3>
                <div className="space-y-1.5 text-sm text-muted-foreground">
                  <p><span className="text-foreground/70">Type:</span> {selectedAsset.file_type}</p>
                  <p><span className="text-foreground/70">Size:</span> {formatSize(selectedAsset.file_size)}</p>
                  <p><span className="text-foreground/70">Source:</span> {selectedAsset.source_module}</p>
                  <p><span className="text-foreground/70">Created:</span> {new Date(selectedAsset.created_at).toLocaleString()}</p>
                  {selectedAsset.original_prompt && (
                    <p><span className="text-foreground/70">Prompt:</span> "{selectedAsset.original_prompt}"</p>
                  )}
                  {selectedAsset.style && (
                    <p><span className="text-foreground/70">Style:</span> {selectedAsset.style}</p>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => handleDownload(selectedAsset)}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" /> Download
                  </button>
                  <button onClick={() => handleDelete(selectedAsset)}
                    className="py-2.5 px-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium flex items-center justify-center gap-2"
                    disabled={deleting === selectedAsset.id}>
                    {deleting === selectedAsset.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                  <button onClick={() => setSelectedAsset(null)}
                    className="py-2.5 px-4 rounded-xl bg-accent text-foreground text-sm font-medium">
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
