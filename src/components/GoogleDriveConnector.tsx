
import { useState, useEffect } from "react";
import { useGoogleDrive } from "@/hooks/useGoogleDrive";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Folder, HardDrive, RefreshCw, Plus, Check, ExternalLink } from "lucide-react";
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

    useEffect(() => {
        if (service && isConnected) {
            loadFolders();
            if (currentFolderId) {
                service.getFolder(currentFolderId).then(f => {
                    setCurrentFolderName(f?.name || "Pasta não encontrada");
                    loadRootContents();
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

    const loadRootContents = async () => {
        if (!service || !currentFolderId) return;
        setIsListingContents(true);
        try {
            const list = await (service as any).fetchGoogleApi(`/files?q='${currentFolderId}' in parents and trashed = false&fields=files(id,name,mimeType)`);
            setContents(list.files || []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsListingContents(false);
        }
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
        if (!service || !newFolderName || !currentFolderId) return;
        try {
            await service.createFolder(newFolderName, currentFolderId);
            toast.success(`Subpasta "${newFolderName}" criada!`);
            setNewFolderName("");
            loadRootContents();
        } catch (error) {
            toast.error("Erro ao criar subpasta");
        }
    };

    if (isLoading) return <div>Carregando...</div>;

    if (!isConnected) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        Conectar Google Drive
                    </CardTitle>
                    <CardDescription>
                        Conecte seu Google Drive para organizar documentos e recibos automaticamente.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={connect} className="gap-2">
                        <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                        Conectar com Google
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-500" />
                        Google Drive Conectado
                    </CardTitle>
                    <CardDescription>
                        Configure a pasta raiz para organização do sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {currentFolderName && (
                        <div className="bg-muted p-3 rounded-lg flex items-center justify-between border">
                            <div className="flex items-center gap-2">
                                <Folder className="h-5 w-5 text-blue-500 fill-blue-500/20" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-1">Pasta Raiz Vinculada</span>
                                    <span className="font-medium text-sm">{currentFolderName}</span>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 text-xs font-bold" onClick={() => setCurrentFolderName(null)}>Desvincular</Button>
                        </div>
                    )}

                    {!currentFolderName && (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nome da nova pasta raiz..."
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                />
                                <Button onClick={handleCreateRootFolder} variant="secondary" className="gap-2 shrink-0">
                                    <Plus className="h-4 w-4" /> Criar Raiz
                                </Button>
                            </div>

                            <div className="border rounded-xl max-h-[250px] overflow-y-auto bg-background/50">
                                <div className="p-3 border-b bg-muted/30 flex justify-between items-center sticky top-0 backdrop-blur-sm z-10">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Selecionar Pasta Existente</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={loadFolders} disabled={isListing}>
                                        <RefreshCw className={`h-3 w-3 ${isListing ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                                {folders.length === 0 && !isListing && (
                                    <div className="p-8 text-center text-sm text-muted-foreground italic">
                                        Nenhuma pasta encontrada no seu Drive.
                                    </div>
                                )}
                                {folders.map((folder) => (
                                    <div
                                        key={folder.id}
                                        className="p-3 hover:bg-accent cursor-pointer flex items-center gap-3 transition-all border-b last:border-0"
                                        onClick={() => saveRootFolder(folder.id)}
                                    >
                                        <Folder className="h-4 w-4 text-blue-500 fill-blue-500/10" />
                                        <span className="text-sm font-medium">{folder.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {currentFolderName && (
                <Card className="border-t-4 border-t-blue-500">
                    <CardHeader className="py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Folder className="h-4 w-4 text-blue-500" /> Gerenciador de Arquivos
                            </CardTitle>
                            <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest gap-2" onClick={() => loadRootContents()}>
                                <RefreshCw className="h-3 w-3" /> Atualizar
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="px-6 py-4 border-y bg-secondary/10 flex gap-2">
                            <Input
                                placeholder="Nome da subpasta (ex: Recibos 2024)..."
                                className="h-9 text-xs bg-background"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                            />
                            <Button size="sm" className="h-9 gap-2 font-bold px-4" onClick={() => handleCreateSubfolder()}>
                                <Plus className="h-4 w-4" /> Nova Subpasta
                            </Button>
                        </div>

                        <div className="divide-y divide-border/50 max-h-[400px] overflow-y-auto">
                            {isListingContents ? (
                                <div className="p-12 text-center text-muted-foreground"><RefreshCw className="h-6 w-6 animate-spin mx-auto opacity-20" /></div>
                            ) : contents.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Folder className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                                    <p className="text-xs text-muted-foreground font-medium italic">Esta pasta está vazia.</p>
                                </div>
                            ) : contents.map((item) => (
                                <div key={item.id} className="p-4 hover:bg-accent/50 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        {item.mimeType === 'application/vnd.google-apps.folder' ? (
                                            <Folder className="h-4 w-4 text-blue-500 fill-blue-500/20" />
                                        ) : (
                                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" asChild>
                                        <a href={`https://drive.google.com/open?id=${item.id}`} target="_blank" rel="noreferrer">
                                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
                                        </a>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
