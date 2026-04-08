
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { GoogleDriveService } from '@/lib/googleDrive';
import { useChurch } from '@/contexts/ChurchContext';
import { toast } from 'sonner';

export function useGoogleDrive() {
    const { organization, refreshOrganization } = useChurch();
    const [service, setService] = useState<GoogleDriveService | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    useEffect(() => {
        async function init() {
            const { data: { session } } = await supabase.auth.getSession();

            // O provider_token só vem no login inicial via OAuth
            // Se não houver, o usuário precisa "Conectar" novamente
            const token = session?.provider_token;

            if (token) {
                setAccessToken(token);
                setService(new GoogleDriveService(token));
            }
            setIsLoading(false);
        }

        init();
    }, []);

    const connect = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
                scopes: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly',
                redirectTo: window.location.origin + '/configuracoes',
            },
        });

        if (error) {
            toast.error('Erro ao conectar com Google Drive: ' + error.message);
        }
    };

    const saveRootFolder = async (folderId: string) => {
        if (!organization?.id) return;

        const { error } = await supabase
            .from('organizations')
            .update({ google_drive_folder_id: folderId } as any)
            .eq('id', organization.id);

        if (error) {
            toast.error('Erro ao salvar configuração da pasta');
            throw error;
        }

        await refreshOrganization();
        toast.success('Pasta do Drive vinculada com sucesso!');
    };

    return {
        service,
        isLoading,
        isConnected: !!accessToken,
        connect,
        saveRootFolder,
        currentFolderId: (organization as any)?.google_drive_folder_id,
    };
}
