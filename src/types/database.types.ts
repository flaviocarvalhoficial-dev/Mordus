export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            assets: {
                Row: {
                    acquisition_date: string | null
                    condition: string | null
                    created_at: string
                    description: string | null
                    id: string
                    location: string | null
                    name: string
                    organization_id: string
                    type: string | null
                    value: number | null
                }
                Insert: {
                    acquisition_date?: string | null
                    condition?: string | null
                    created_at?: string
                    description?: string | null
                    id?: string
                    location?: string | null
                    name: string
                    organization_id: string
                    type?: string | null
                    value?: number | null
                }
                Update: {
                    acquisition_date?: string | null
                    condition?: string | null
                    created_at?: string
                    description?: string | null
                    id?: string
                    location?: string | null
                    name?: string
                    organization_id?: string
                    type?: string | null
                    value?: number | null
                }
            }
            categories: {
                Row: {
                    color: string | null
                    created_at: string
                    id: string
                    name: string
                    organization_id: string
                    type: string
                }
                Insert: {
                    color?: string | null
                    created_at?: string
                    id?: string
                    name: string
                    organization_id: string
                    type: string
                }
                Update: {
                    color?: string | null
                    created_at?: string
                    id?: string
                    name?: string
                    organization_id?: string
                    type?: string
                }
            }
            congregations: {
                Row: {
                    address: string | null
                    created_at: string
                    id: string
                    leader_name: string | null
                    member_count: number | null
                    name: string
                    organization_id: string
                }
                Insert: {
                    address?: string | null
                    created_at?: string
                    id?: string
                    leader_name?: string | null
                    member_count?: number | null
                    name: string
                    organization_id: string
                }
                Update: {
                    address?: string | null
                    created_at?: string
                    id?: string
                    leader_name?: string | null
                    member_count?: number | null
                    name?: string
                    organization_id?: string
                }
            }
            departments: {
                Row: {
                    color: string | null
                    created_at: string
                    id: string
                    leader_name: string | null
                    member_count: number | null
                    name: string
                    organization_id: string
                    subgroups: Json | null
                }
                Insert: {
                    color?: string | null
                    created_at?: string
                    id?: string
                    leader_name?: string | null
                    member_count?: number | null
                    name: string
                    organization_id: string
                    subgroups?: Json | null
                }
                Update: {
                    color?: string | null
                    created_at?: string
                    id?: string
                    leader_name?: string | null
                    member_count?: number | null
                    name?: string
                    organization_id?: string
                    subgroups?: Json | null
                }
            }
            documents: {
                Row: {
                    category: string | null
                    created_at: string
                    date: string | null
                    id: string
                    link: string | null
                    name: string
                    organization_id: string | null
                    type: string | null
                }
                Insert: {
                    category?: string | null
                    created_at?: string
                    date?: string | null
                    id?: string
                    link?: string | null
                    name: string
                    organization_id?: string | null
                    type?: string | null
                }
                Update: {
                    category?: string | null
                    created_at?: string
                    date?: string | null
                    id?: string
                    link?: string | null
                    name?: string
                    organization_id?: string | null
                    type?: string | null
                }
            }
            events: {
                Row: {
                    created_at: string
                    date: string
                    description: string | null
                    id: string
                    name: string
                    organization_id: string
                    type: string | null
                }
                Insert: {
                    created_at?: string
                    date: string
                    description?: string | null
                    id?: string
                    name: string
                    organization_id: string
                    type?: string | null
                }
                Update: {
                    created_at?: string
                    date?: string
                    description?: string | null
                    id?: string
                    name?: string
                    organization_id?: string
                    type?: string | null
                }
            }
            families: {
                Row: {
                    address: string | null
                    created_at: string
                    id: string
                    members_count: number | null
                    name: string
                    needs: string | null
                    organization_id: string | null
                }
                Insert: {
                    address?: string | null
                    created_at?: string
                    id?: string
                    members_count?: number | null
                    name: string
                    needs?: string | null
                    organization_id?: string | null
                }
                Update: {
                    address?: string | null
                    created_at?: string
                    id?: string
                    members_count?: number | null
                    name?: string
                    needs?: string | null
                    organization_id?: string | null
                }
            }
            leaders: {
                Row: {
                    created_at: string
                    id: string
                    name: string
                    organization_id: string | null
                    phone: string | null
                    role: string | null
                }
                Insert: {
                    created_at?: string
                    id?: string
                    name: string
                    organization_id?: string | null
                    phone?: string | null
                    role?: string | null
                }
                Update: {
                    created_at?: string
                    id?: string
                    name?: string
                    organization_id?: string | null
                    phone?: string | null
                    role?: string | null
                }
            }
            members: {
                Row: {
                    avatar_url: string | null
                    birth_date: string | null
                    created_at: string
                    email: string | null
                    full_name: string
                    id: string
                    organization_id: string
                    phone: string | null
                    role: string | null
                    status: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    birth_date?: string | null
                    created_at?: string
                    email?: string | null
                    full_name: string
                    id?: string
                    organization_id: string
                    phone?: string | null
                    role?: string | null
                    status?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    birth_date?: string | null
                    created_at?: string
                    email?: string | null
                    full_name?: string
                    id?: string
                    organization_id?: string
                    phone?: string | null
                    role?: string | null
                    status?: string | null
                }
            }
            monthly_closures: {
                Row: {
                    closed_at: string | null
                    closed_by: string | null
                    created_at: string | null
                    end_date: string
                    final_balance: number | null
                    id: string
                    initial_balance: number | null
                    organization_id: string | null
                    start_date: string
                    status: string | null
                    total_expense: number | null
                    total_income: number | null
                }
                Insert: {
                    closed_at?: string | null
                    closed_by?: string | null
                    created_at?: string | null
                    end_date: string
                    final_balance?: number | null
                    id?: string
                    initial_balance?: number | null
                    organization_id?: string | null
                    start_date: string
                    status?: string | null
                    total_expense?: number | null
                    total_income?: number | null
                }
                Update: {
                    closed_at?: string | null
                    closed_by?: string | null
                    created_at?: string | null
                    end_date?: string
                    final_balance?: number | null
                    id?: string
                    initial_balance?: number | null
                    organization_id?: string | null
                    start_date?: string
                    status?: string | null
                    total_expense?: number | null
                    total_income?: number | null
                }
            }
            organizations: {
                Row: {
                    address: string | null
                    bank_account: string | null
                    bank_agency: string | null
                    bank_name: string | null
                    cnpj: string | null
                    config: Json | null
                    created_at: string
                    facebook: string | null
                    id: string
                    instagram: string | null
                    name: string
                    pastor_name: string | null
                    phone: string | null
                    pix_key: string | null
                    pix_key_type: string | null
                    whatsapp: string | null
                    youtube: string | null
                }
                Insert: {
                    address?: string | null
                    bank_account?: string | null
                    bank_agency?: string | null
                    bank_name?: string | null
                    cnpj?: string | null
                    config?: Json | null
                    created_at?: string
                    facebook?: string | null
                    id?: string
                    instagram?: string | null
                    name: string
                    pastor_name?: string | null
                    phone?: string | null
                    pix_key?: string | null
                    pix_key_type?: string | null
                    whatsapp?: string | null
                    youtube?: string | null
                }
                Update: {
                    address?: string | null
                    bank_account?: string | null
                    bank_agency?: string | null
                    bank_name?: string | null
                    cnpj?: string | null
                    config?: Json | null
                    created_at?: string
                    facebook?: string | null
                    id?: string
                    instagram?: string | null
                    name?: string
                    pastor_name?: string | null
                    phone?: string | null
                    pix_key?: string | null
                    pix_key_type?: string | null
                    whatsapp?: string | null
                    youtube?: string | null
                }
            }
            partners: {
                Row: {
                    created_at: string | null
                    field: string | null
                    id: string
                    name: string
                    organization_id: string | null
                    status: string | null
                    support: string | null
                }
                Insert: {
                    created_at?: string | null
                    field?: string | null
                    id?: string
                    name: string
                    organization_id?: string | null
                    status?: string | null
                    support?: string | null
                }
                Update: {
                    created_at?: string | null
                    field?: string | null
                    id?: string
                    name?: string
                    organization_id?: string | null
                    status?: string | null
                    support?: string | null
                }
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string
                    full_name: string | null
                    id: string
                    organization_id: string | null
                    phone: string | null
                    role: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string
                    full_name?: string | null
                    id: string
                    organization_id?: string | null
                    phone?: string | null
                    role?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string
                    full_name?: string | null
                    id?: string
                    organization_id?: string | null
                    phone?: string | null
                    role?: string | null
                }
            }
            social_assistance: {
                Row: {
                    assistance_type: string
                    created_at: string | null
                    delivery_date: string | null
                    family_id: string | null
                    id: string
                    items_count: number | null
                    organization_id: string | null
                    status: string | null
                }
                Insert: {
                    assistance_type: string
                    created_at?: string | null
                    delivery_date?: string | null
                    family_id?: string | null
                    id?: string
                    items_count?: number | null
                    organization_id?: string | null
                    status?: string | null
                }
                Update: {
                    assistance_type?: string
                    created_at?: string | null
                    delivery_date?: string | null
                    family_id?: string | null
                    id?: string
                    items_count?: number | null
                    organization_id?: string | null
                    status?: string | null
                }
            }
            transactions: {
                Row: {
                    amount: number
                    category_id: string | null
                    created_at: string
                    date: string
                    description: string
                    id: string
                    organization_id: string
                    payment_method: string | null
                    status: string | null
                    type: string
                }
                Insert: {
                    amount: number
                    category_id?: string | null
                    created_at?: string
                    date: string
                    description: string
                    id?: string
                    organization_id: string
                    payment_method?: string | null
                    status?: string | null
                    type: string
                }
                Update: {
                    amount?: number
                    category_id?: string | null
                    created_at?: string
                    date?: string
                    description?: string
                    id?: string
                    organization_id?: string
                    payment_method?: string | null
                    status?: string | null
                    type?: string
                }
            }
        }
    }
}
