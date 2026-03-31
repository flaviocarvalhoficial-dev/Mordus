export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.4"
    }
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
                Relationships: [
                    {
                        foreignKeyName: "assets_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
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
                Relationships: [
                    {
                        foreignKeyName: "categories_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
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
                Relationships: [
                    {
                        foreignKeyName: "congregations_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
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
                Relationships: [
                    {
                        foreignKeyName: "departments_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
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
                Relationships: [
                    {
                        foreignKeyName: "documents_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
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
                Relationships: [
                    {
                        foreignKeyName: "events_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
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
                Relationships: [
                    {
                        foreignKeyName: "families_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            leaders: {
                Row: {
                    appointment_date: string | null
                    created_at: string | null
                    id: string
                    name: string
                    organization_id: string | null
                    phone: string | null
                    role: string | null
                }
                Insert: {
                    appointment_date?: string | null
                    created_at?: string | null
                    id?: string
                    name: string
                    organization_id?: string | null
                    phone?: string | null
                    role?: string | null
                }
                Update: {
                    appointment_date?: string | null
                    created_at?: string | null
                    id?: string
                    name?: string
                    organization_id?: string | null
                    phone?: string | null
                    role?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "leaders_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            members: {
                Row: {
                    address: string | null
                    avatar_url: string | null
                    birth_date: string | null
                    congregation_id: string | null
                    created_at: string
                    email: string | null
                    father_name: string | null
                    full_name: string
                    gender: string | null
                    id: string
                    is_baptized: boolean | null
                    mother_name: string | null
                    organization_id: string
                    phone: string | null
                    previous_church: string | null
                    role: string | null
                    status: string | null
                }
                Insert: {
                    address?: string | null
                    avatar_url?: string | null
                    birth_date?: string | null
                    congregation_id?: string | null
                    created_at?: string
                    email?: string | null
                    father_name?: string | null
                    full_name: string
                    gender?: string | null
                    id?: string
                    is_baptized?: boolean | null
                    mother_name?: string | null
                    organization_id: string
                    phone?: string | null
                    previous_church?: string | null
                    role?: string | null
                    status?: string | null
                }
                Update: {
                    address?: string | null
                    avatar_url?: string | null
                    birth_date?: string | null
                    congregation_id?: string | null
                    created_at?: string
                    email?: string | null
                    father_name?: string | null
                    full_name?: string
                    gender?: string | null
                    id?: string
                    is_baptized?: boolean | null
                    mother_name?: string | null
                    organization_id?: string
                    phone?: string | null
                    previous_church?: string | null
                    role?: string | null
                    status?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "members_congregation_id_fkey"
                        columns: ["congregation_id"]
                        isOneToOne: false
                        referencedRelation: "congregations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "members_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
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
                Relationships: [
                    {
                        foreignKeyName: "monthly_closures_closed_by_fkey"
                        columns: ["closed_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "monthly_closures_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
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
                Relationships: []
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
                Relationships: [
                    {
                        foreignKeyName: "partners_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
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
                Relationships: [
                    {
                        foreignKeyName: "profiles_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
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
                Relationships: [
                    {
                        foreignKeyName: "social_assistance_family_id_fkey"
                        columns: ["family_id"]
                        isOneToOne: false
                        referencedRelation: "families"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "social_assistance_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            transactions: {
                Row: {
                    amount: number
                    category_id: string | null
                    created_at: string
                    date: string
                    description: string
                    event_id: string | null
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
                    event_id?: string | null
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
                    event_id?: string | null
                    id?: string
                    organization_id?: string
                    payment_method?: string | null
                    status?: string | null
                    type?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "transactions_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "categories"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "transactions_event_id_fkey"
                        columns: ["event_id"]
                        isOneToOne: false
                        referencedRelation: "events"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "transactions_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            user_role: "admin" | "treasurer" | "secretary"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database['public']

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema['CompositeTypes']
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
}
    ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
    ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never
