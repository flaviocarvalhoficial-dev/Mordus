import { useChurch } from "@/contexts/ChurchContext";

interface PermissionGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    requireAdmin?: boolean;
    requireWrite?: boolean;
    requireFinance?: boolean;
    requireSecretariat?: boolean;
    requireAccessSecretariat?: boolean;
}

/**
 * PermissionGuard
 * 
 * Componente que envolve partes da UI que exigem permissões específicas.
 * Útil para esconder botões de 'Novo', 'Editar' ou 'Excluir'.
 */
export function PermissionGuard({
    children,
    fallback = null,
    requireAdmin = false,
    requireWrite = false,
    requireFinance = false,
    requireSecretariat = false,
    requireAccessSecretariat = false
}: PermissionGuardProps) {
    const {
        isAdmin,
        canWrite,
        canManageFinances,
        canManageSecretariat,
        canAccessSecretariat
    } = useChurch();

    let hasPermission = true;

    if (requireAdmin && !isAdmin) hasPermission = false;
    if (requireWrite && !canWrite) hasPermission = false;
    if (requireFinance && !canManageFinances) hasPermission = false;
    if (requireSecretariat && !canManageSecretariat) hasPermission = false;
    if (requireAccessSecretariat && !canAccessSecretariat) hasPermission = false;

    if (!hasPermission) return <>{fallback}</>;

    return <>{children}</>;
}
