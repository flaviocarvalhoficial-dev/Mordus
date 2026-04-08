
/**
 * Google Drive API Service
 * Handles folder creation, listing, and organization.
 */

export interface GoogleDriveFolder {
    id: string;
    name: string;
    mimeType: string;
}

export class GoogleDriveService {
    private accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    private async fetchGoogleApi(endpoint: string, options: RequestInit = {}) {
        const response = await fetch(`https://www.googleapis.com/drive/v3${endpoint}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Erro na API do Google Drive');
        }

        return response.json();
    }

    /**
     * Lista pastas disponíveis no Drive
     */
    async listFolders(parentId?: string): Promise<GoogleDriveFolder[]> {
        const query = parentId
            ? `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
            : `mimeType = 'application/vnd.google-apps.folder' and trashed = false`;

        const data = await this.fetchGoogleApi(`/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType)`);
        return data.files;
    }

    /**
     * Cria uma nova pasta
     */
    async createFolder(name: string, parentId?: string): Promise<GoogleDriveFolder> {
        const body: any = {
            name,
            mimeType: 'application/vnd.google-apps.folder',
        };

        if (parentId) {
            body.parents = [parentId];
        }

        return this.fetchGoogleApi('/files', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    /**
     * Verifica se uma pasta existe
     */
    async getFolder(folderId: string): Promise<GoogleDriveFolder | null> {
        try {
            return await this.fetchGoogleApi(`/files/${folderId}?fields=id,name,mimeType`);
        } catch (e) {
            return null;
        }
    }

    /**
     * Organiza arquivos (move um arquivo para uma pasta)
     */
    async moveFile(fileId: string, folderId: string) {
        // Primeiro pegamos os pais atuais
        const file = await this.fetchGoogleApi(`/files/${fileId}?fields=parents`);
        const previousParents = file.parents.join(',');

        return this.fetchGoogleApi(`/files/${fileId}?addParents=${folderId}&removeParents=${previousParents}`, {
            method: 'PATCH',
        });
    }
}
