
import { useState, useEffect } from "react";
import { useGoogleDrive } from "@/hooks/useGoogleDrive";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Folder, HardDrive, RefreshCw, Plus, Check, ExternalLink, FileIcon } from "lucide-react";
import { toast } from "sonner";
import { GoogleDriveFolder } from "@/lib/googleDrive";

export function GoogleDriveConnector() {
    const { service, isConnected, connect, saveRootFolder, currentFolderId, isLoading } = useGoogleDrive();
    const [folders, setFolders] = useState<GoogleDriveFolder[]>([]);
    const [contents, setContents] = useState<GoogleDriveFolder[]>([]);
    const [newFolderName, setNewFolderName] = useState("");
    const [isListing, setIsListing] = useState(false);
    const [isListingContents, setIsListingContents] = useState(false);
    const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);
    const [path, setPath] = useState<{ id: string, name: string }[]>([]);

    useEffect(() => {
        if (service && isConnected) {
            loadFolders();
            if (currentFolderId) {
                service.getFolder(currentFolderId).then(f => {
                    if (f) {
                        setCurrentFolderName(f.name);
                        setPath([{ id: f.id, name: f.name }]);
                        loadContents(f.id);
                    }
                });
            }
        }
    }, [service, isConnected, currentFolderId]);

    const loadFolders = async () => {
        if (!service) return;
        setIsListing(true);
        try {
            const list = await service.listFolders();
            setFolders(list);
        } catch (error) {
            console.error(error);
        } finally {
            setIsListing(false);
        }
    };

    const loadContents = async (folderId: string) => {
        if (!service) return;
        setIsListingContents(true);
        try {
            // @ts-expect-error - Usando fetchGoogleApi interno para chamadas customizadas
            const list = await service.fetchGoogleApi(`/files?q='${folderId}' in parents and trashed = false&fields=files(id,name,mimeType)`);
            setContents(list.files || []);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar conteúdo");
        } finally {
            setIsListingContents(false);
        }
    };

    const navigateTo = (folder: { id: string, name: string }, isBack: boolean = false) => {
        if (isBack) {
            const index = path.findIndex(p => p.id === folder.id);
            const newPath = path.slice(0, index + 1);
            setPath(newPath);
        } else {
            setPath([...path, folder]);
        }
        loadContents(folder.id);
    };

    const handleCreateRootFolder = async () => {
        if (!service || !newFolderName) return;
        try {
            const folder = await service.createFolder(newFolderName);
            toast.success(`Pasta "${newFolderName}" criada!`);
            await saveRootFolder(folder.id);
            setNewFolderName("");
            loadFolders();
        } catch (error) {
            toast.error("Erro ao criar pasta");
        }
    };

    const handleCreateSubfolder = async () => {
        const activeFolderId = path[path.length - 1]?.id || currentFolderId;
        if (!service || !newFolderName || !activeFolderId) return;
        try {
            await service.createFolder(newFolderName, activeFolderId);
            toast.success(`Subpasta "${newFolderName}" criada!`);
            setNewFolderName("");
            loadContents(activeFolderId);
        } catch (error) {
            toast.error("Erro ao criar subpasta");
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center p-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-20" />
        </div>
    );

    if (!isConnected) {
        return (
            <Card className="bg-card border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <HardDrive className="h-5 w-5 text-primary" />
                        Conectar Armazenamento Cloud
                    </CardTitle>
                    <CardDescription>
                        Integre o Google Drive para gerenciar todos os documentos da organização em um só lugar.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={connect} className="gap-2 h-11 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                        <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                        Conectar com Google Drive
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const activeFolder = path[path.length - 1];

    return (
        <div className="space-y-6">
            <Card className="bg-card border-border shadow-sm overflow-hidden">
                <CardHeader className="pb-4 bg-secondary/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-md">
                                <Check className="h-4 w-4 text-success" />
                                Google Drive Conectado
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Sua conta do Google está vinculada e pronta para uso.
                            </CardDescription>
                        </div>
                        {currentFolderName && (
                            <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => setCurrentFolderName(null)}>Desvincular</Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {!currentFolderName && (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nome da nova pasta raiz..."
                                    className="h-10 text-sm bg-background/50 border-input"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                />
                                <Button onClick={handleCreateRootFolder} variant="secondary" className="gap-2 shrink-0 h-10 px-6 font-bold rounded-xl border border-border shadow-sm">
                                    <Plus className="h-4 w-4" /> Criar Pasta Raiz
                                </Button>
                            </div>

                            <div className="border border-border/50 rounded-2xl overflow-hidden bg-background/30 backdrop-blur-sm">
                                <div className="p-3 border-b border-border/50 bg-secondary/20 flex justify-between items-center sticky top-0 z-10">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 pl-2">Selecionar Pasta Existente</span>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-background/80" onClick={loadFolders} disabled={isListing}>
                                        <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isListing ? 'animate-spin text-primary' : ''}`} />
                                    </Button>
                                </div>
                                <div className="max-h-[250px] overflow-y-auto divide-y divide-border/30">
                                    {folders.length === 0 && !isListing && (
                                        <div className="p-10 text-center text-xs text-muted-foreground/60 italic font-medium">
                                            Nenhuma pasta encontrada no seu Drive.
                                        </div>
                                    )}
                                    {folders.map((folder) => (
                                        <div
                                            key={folder.id}
                                            className="p-4 hover:bg-primary/5 cursor-pointer flex items-center justify-between transition-all group"
                                            onClick={() => saveRootFolder(folder.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/10 group-hover:bg-blue-500/20 transition-all">
                                                    <Folder className="h-4 w-4 text-blue-500 fill-blue-500/20" />
                                                </div>
                                                <span className="text-sm font-semibold text-foreground/80 tracking-tight">{folder.name}</span>
                                            </div>
                                            <div className="h-6 w-6 rounded-full border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {currentFolderName && (
                        <div className="bg-primary/5 p-4 rounded-2xl flex items-center justify-between border border-primary/10 shadow-inner group transition-all hover:bg-primary/[0.08]">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/10 shadow-sm transition-transform group-hover:scale-110">
                                    <Folder className="h-6 w-6 text-primary fill-primary/20" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-black text-primary/60 leading-none mb-1.5 tracking-widest">Pasta Raiz Ativa</span>
                                    <span className="font-black text-sm text-foreground tracking-tight">{currentFolderName}</span>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-background/80 hover:text-primary" asChild>
                                <a href={`https://drive.google.com/open?id=${currentFolderId}`} target="_blank" rel="noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {currentFolderName && path.length > 0 && (
                <Card className="bg-card border-border shadow-md overflow-hidden rounded-2xl border-t-4 border-t-primary">
                    <CardHeader className="py-5 bg-background border-b border-border/50">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                    <CardTitle className="text-md font-black flex items-center gap-2 tracking-tight">
                                        Explorador de Arquivos
                                    </CardTitle>
                                    <CardDescription className="text-[11px] font-medium">Gerencie o conteúdo do seu Drive conectado.</CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-[10px] font-black uppercase tracking-widest gap-2 bg-background/50 backdrop-blur-sm border-border/50 hover:bg-primary/5 hover:text-primary transition-all rounded-lg"
                                    onClick={() => loadContents(activeFolder?.id || currentFolderId!)}
                                    disabled={isListingContents}
                                >
                                    <RefreshCw className={`h-3 w-3 ${isListingContents ? 'animate-spin' : ''}`} />
                                    Atualizar
                                </Button>
                            </div>

                            <div className="flex items-center gap-1.5 p-1.5 bg-secondary/30 rounded-xl border border-border/30 overflow-x-auto no-scrollbar">
                                {path.map((folder, index) => (
                                    <div key={folder.id} className="flex items-center gap-1.5 shrink-0">
                                        <button
                                            onClick={() => navigateTo(folder, true)}
                                            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 ${index === path.length - 1 ? 'bg-background text-primary shadow-sm border border-border/50' : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}`}
                                        >
                                            {index === 0 && <HardDrive className="h-3 w-3" />}
                                            {folder.name}
                                        </button>
                                        {index < path.length - 1 && <span className="text-muted-foreground/30 font-black">/</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 bg-background/50">
                        <div className="px-6 py-5 bg-secondary/5 border-b border-border/30 backdrop-blur-sm flex gap-2">
                            <div className="relative flex-1">
                                <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
                                <Input
                                    placeholder="Nome da subpasta (ex: Recibos 2024)..."
                                    className="h-10 text-xs bg-background pl-9 border-border/50 rounded-xl font-medium focus-visible:ring-primary/20"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSubfolder()}
                                />
                            </div>
                            <Button size="sm" className="h-10 gap-2 font-black px-6 text-[11px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-95" onClick={() => handleCreateSubfolder()}>
                                Nova Pasta
                            </Button>
                        </div>

                        <div className="min-h-[300px] max-h-[500px] overflow-y-auto divide-y divide-border/20 custom-scrollbar">
                            {isListingContents ? (
                                <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-4">
                                    <RefreshCw className="h-8 w-8 animate-spin text-primary opacity-20" />
                                    <p className="text-[11px] font-black uppercase tracking-widest opacity-40">Carregando arquivos...</p>
                                </div>
                            ) : contents.length === 0 ? (
                                <div className="p-20 text-center flex flex-col items-center gap-3">
                                    <div className="h-16 w-16 rounded-3xl bg-secondary/20 flex items-center justify-center mb-2">
                                        <Folder className="h-8 w-8 text-muted-foreground/20" />
                                    </div>
                                    <p className="text-xs text-muted-foreground font-black uppercase tracking-widest opacity-40">Esta pasta está vazia</p>
                                    <p className="text-[10px] text-muted-foreground/60 font-medium max-w-[200px] mx-auto">Use o campo acima para criar sua primeira subpasta.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 p-4 gap-3">
                                    {contents.map((item) => (
                                        <div
                                            key={item.id}
                                            className="group p-3 bg-background border border-border/50 rounded-2xl hover:border-primary/30 hover:shadow-md hover:bg-primary/[0.02] transition-all cursor-pointer flex items-center justify-between"
                                            onClick={() => item.mimeType === 'application/vnd.google-apps.folder' && navigateTo(item)}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border transition-all group-hover:scale-110 ${item.mimeType === 'application/vnd.google-apps.folder' ? 'bg-blue-500/10 border-blue-500/10' : 'bg-muted/30 border-border/50'}`}>
                                                    {item.mimeType === 'application/vnd.google-apps.folder' ? (
                                                        <Folder className="h-5 w-5 text-blue-500 fill-blue-500/20" />
                                                    ) : (
                                                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[13px] font-bold text-foreground/80 truncate pr-2 tracking-tight group-hover:text-foreground transition-colors">{item.name}</span>
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                                                        {item.mimeType === 'application/vnd.google-apps.folder' ? 'Pasta' : 'Arquivo'}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-secondary/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary" asChild onClick={(e) => e.stopPropagation()}>
                                                <a href={`https://drive.google.com/open?id=${item.id}`} target="_blank" rel="noreferrer">
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
