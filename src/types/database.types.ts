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
                    image_url: string | null
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
                    image_url?: string | null
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
                    image_url?: string | null
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
            audit_logs: {
                Row: {
                    action: string
                    created_at: string
                    id: string
                    new_data: Json | null
                    old_data: Json | null
                    organization_id: string
                    table_name: string
                    user_id: string | null
                    record_id: string | null
                }
                Insert: {
                    action: string
                    created_at?: string
                    id?: string
                    new_data?: Json | null
                    old_data?: Json | null
                    organization_id: string
                    table_name: string
                    user_id?: string | null
                    record_id?: string | null
                }
                Update: {
                    action?: string
                    created_at?: string
                    id?: string
                    new_data?: Json | null
                    old_data?: Json | null
                    organization_id?: string
                    table_name?: string
                    user_id?: string | null
                    record_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "audit_logs_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "audit_logs_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            categories: {
                Row: {
                    color: string | null
                    created_at: string
                    description: string | null
                    id: string
                    name: string
                    organization_id: string
                    type: string
                }
                Insert: {
                    color?: string | null
                    created_at?: string
                    description?: string | null
                    id?: string
                    name: string
                    organization_id: string
                    type: string
                }
                Update: {
                    color?: string | null
                    created_at?: string
                    description?: string | null
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
                    name: string
                    organization_id: string
                    phone: string | null
                }
                Insert: {
                    address?: string | null
                    created_at?: string
                    id?: string
                    name: string
                    organization_id: string
                    phone?: string | null
                }
                Update: {
                    address?: string | null
                    created_at?: string
                    id?: string
                    name?: string
                    organization_id?: string
                    phone?: string | null
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
                    created_at: string
                    description: string | null
                    id: string
                    name: string
                    organization_id: string
                }
                Insert: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    name: string
                    organization_id: string
                }
                Update: {
                    created_at?: string
                    description?: string | null
                    id?: string
                    name?: string
                    organization_id?: string
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
                    file_path: string
                    file_type: string | null
                    id: string
                    name: string
                    organization_id: string
                    size: number | null
                }
                Insert: {
                    category?: string | null
                    created_at?: string
                    file_path: string
                    file_type?: string | null
                    id?: string
                    name: string
                    organization_id: string
                    size?: number | null
                }
                Update: {
                    category?: string | null
                    created_at?: string
                    file_path?: string
                    file_type?: string | null
                    id?: string
                    name?: string
                    organization_id?: string
                    size?: number | null
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
                    created_at: string | null
                    date: string
                    description: string | null
                    id: string
                    name: string
                    organization_id: string | null
                    type: string | null
                }
                Insert: {
                    created_at?: string | null
                    date: string
                    description?: string | null
                    id?: string
                    name: string
                    organization_id?: string | null
                    type?: string | null
                }
                Update: {
                    created_at?: string | null
                    date?: string
                    description?: string | null
                    id?: string
                    name?: string
                    organization_id?: string | null
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
                    created_at: string
                    id: string
                    name: string
                    organization_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    name: string
                    organization_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    name?: string
                    organization_id?: string
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
            installment_purchases: {
                Row: {
                    created_at: string | null
                    description: string
                    id: string
                    organization_id: string
                    total_amount: number
                    total_installments: number
                    category_id: string | null
                    payment_method_id: string | null
                    updated_at: string | null
                }
                Insert: {
                    created_at?: string | null
                    description: string
                    id?: string
                    organization_id: string
                    total_amount: number
                    total_installments: number
                    category_id?: string | null
                    payment_method_id?: string | null
                    updated_at?: string | null
                }
                Update: {
                    created_at?: string | null
                    description?: string
                    id?: string
                    organization_id?: string
                    total_amount?: number
                    total_installments?: number
                    category_id?: string | null
                    payment_method_id?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "installment_purchases_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                ]
            }
            installments: {
                Row: {
                    amount: number
                    created_at: string | null
                    due_date: string
                    id: string
                    installment_number: number
                    organization_id: string
                    paid_at: string | null
                    purchase_id: string
                    status: string
                    competence_date: string | null
                    payment_date: string | null
                    total_installments: number | null
                    updated_at: string | null
                    receipt_url: string | null
                }
                Insert: {
                    amount: number
                    created_at?: string | null
                    due_date: string
                    id?: string
                    installment_number: number
                    organization_id: string
                    paid_at?: string | null
                    purchase_id: string
                    status?: string
                    competence_date?: string | null
                    payment_date?: string | null
                    total_installments?: number | null
                    updated_at?: string | null
                    receipt_url?: string | null
                }
                Update: {
                    amount?: number
                    created_at?: string | null
                    due_date?: string
                    id?: string
                    installment_number?: number
                    organization_id?: string
                    paid_at?: string | null
                    purchase_id?: string
                    status?: string
                    competence_date?: string | null
                    payment_date?: string | null
                    total_installments?: number | null
                    updated_at?: string | null
                    receipt_url?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "installments_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "installments_purchase_id_fkey"
                        columns: ["purchase_id"]
                        isOneToOne: false
                        referencedRelation: "installment_purchases"
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
                    age_group: string | null
                    avatar_url: string | null
                    baptism_date: string | null
                    birth_date: string | null
                    congregation_id: string | null
                    conversion_date: string | null
                    created_at: string
                    department_id: string | null
                    document_cpf: string | null
                    email: string | null
                    father_name: string | null
                    full_name: string
                    gender: string | null
                    goes_to_sunday_school: boolean | null
                    id: string
                    is_baptized: boolean | null
                    is_from_other_church: boolean | null
                    mother_name: string | null
                    organization_id: string
                    phone: string | null
                    previous_church: string | null
                    role_in_church: string | null
                    status: string | null
                }
                Insert: {
                    address?: string | null
                    age_group?: string | null
                    avatar_url?: string | null
                    baptism_date?: string | null
                    birth_date?: string | null
                    congregation_id?: string | null
                    conversion_date?: string | null
                    created_at?: string
                    department_id?: string | null
                    document_cpf?: string | null
                    email?: string | null
                    father_name?: string | null
                    full_name: string
                    gender?: string | null
                    goes_to_sunday_school?: boolean | null
                    id?: string
                    is_baptized?: boolean | null
                    is_from_other_church?: boolean | null
                    mother_name?: string | null
                    organization_id: string
                    phone?: string | null
                    previous_church?: string | null
                    role_in_church?: string | null
                    status?: string | null
                }
                Update: {
                    address?: string | null
                    age_group?: string | null
                    avatar_url?: string | null
                    baptism_date?: string | null
                    birth_date?: string | null
                    congregation_id?: string | null
                    conversion_date?: string | null
                    created_at?: string
                    department_id?: string | null
                    document_cpf?: string | null
                    email?: string | null
                    father_name?: string | null
                    full_name?: string
                    gender?: string | null
                    goes_to_sunday_school?: boolean | null
                    id?: string
                    is_baptized?: boolean | null
                    is_from_other_church?: boolean | null
                    mother_name?: string | null
                    organization_id?: string
                    phone?: string | null
                    previous_church?: string | null
                    role_in_church?: string | null
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
                        foreignKeyName: "members_department_id_fkey"
                        columns: ["department_id"]
                        isOneToOne: false
                        referencedRelation: "departments"
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
                    closure_mode: string | null
                    cnpj: string | null
                    created_at: string
                    facebook: string | null
                    id: string
                    instagram: string | null
                    logo_url: string | null
                    name: string
                    pastor_name: string | null
                    phone: string | null
                    pix_key: string | null
                    pix_key_type: string | null
                    reminder_days: number | null
                    whatsapp: string | null
                    youtube: string | null
                }
                Insert: {
                    address?: string | null
                    bank_account?: string | null
                    bank_agency?: string | null
                    bank_name?: string | null
                    closure_mode?: string | null
                    cnpj?: string | null
                    created_at?: string
                    facebook?: string | null
                    id?: string
                    instagram?: string | null
                    logo_url?: string | null
                    name: string
                    pastor_name?: string | null
                    phone?: string | null
                    pix_key?: string | null
                    pix_key_type?: string | null
                    reminder_days?: number | null
                    whatsapp?: string | null
                    youtube?: string | null
                }
                Update: {
                    address?: string | null
                    bank_account?: string | null
                    bank_agency?: string | null
                    bank_name?: string | null
                    closure_mode?: string | null
                    cnpj?: string | null
                    created_at?: string
                    facebook?: string | null
                    id?: string
                    instagram?: string | null
                    logo_url?: string | null
                    name?: string
                    pastor_name?: string | null
                    phone?: string | null
                    pix_key?: string | null
                    pix_key_type?: string | null
                    reminder_days?: number | null
                    whatsapp?: string | null
                    youtube?: string | null
                }
                Relationships: []
            }
            partners: {
                Row: {
                    category: string | null
                    contact_person: string | null
                    created_at: string
                    description: string | null
                    email: string | null
                    id: string
                    name: string
                    organization_id: string
                    phone: string | null
                    status: string | null
                }
                Insert: {
                    category?: string | null
                    contact_person?: string | null
                    created_at?: string
                    description?: string | null
                    email?: string | null
                    id?: string
                    name: string
                    organization_id: string
                    phone?: string | null
                    status?: string | null
                }
                Update: {
                    category?: string | null
                    contact_person?: string | null
                    created_at?: string
                    description?: string | null
                    email?: string | null
                    id?: string
                    name?: string
                    organization_id?: string
                    phone?: string | null
                    status?: string | null
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
                    department_id: string | null
                    full_name: string | null
                    id: string
                    organization_id: string | null
                    role: Database["public"]["Enums"]["user_role"] | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string
                    department_id?: string | null
                    full_name?: string | null
                    id: string
                    organization_id?: string | null
                    role?: Database["public"]["Enums"]["user_role"] | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string
                    department_id?: string | null
                    full_name?: string | null
                    id?: string
                    organization_id?: string | null
                    role?: Database["public"]["Enums"]["user_role"] | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_department_id_fkey"
                        columns: ["department_id"]
                        isOneToOne: false
                        referencedRelation: "departments"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "profiles_organization_id_fkey"
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
                    description: string | null
                    event_id: string | null
                    id: string
                    organization_id: string
                    payment_method: string | null
                    receipt_url: string | null
                    status: string | null
                    type: string
                    installment_id: string | null
                    payment_method_id: string | null
                    occasion: string | null
                    competence_date: string | null
                    notes: string | null
                }
                Insert: {
                    amount: number
                    category_id?: string | null
                    created_at?: string
                    date: string
                    description?: string | null
                    event_id?: string | null
                    id?: string
                    organization_id: string
                    payment_method?: string | null
                    receipt_url?: string | null
                    status?: string | null
                    type: string
                    installment_id?: string | null
                    payment_method_id?: string | null
                    occasion?: string | null
                    competence_date?: string | null
                    notes?: string | null
                }
                Update: {
                    amount?: number
                    category_id?: string | null
                    created_at?: string
                    date?: string
                    description?: string | null
                    event_id?: string | null
                    id?: string
                    organization_id?: string
                    payment_method?: string | null
                    receipt_url?: string | null
                    status?: string | null
                    type?: string
                    installment_id?: string | null
                    payment_method_id?: string | null
                    occasion?: string | null
                    competence_date?: string | null
                    notes?: string | null
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
            user_role: "admin" | "treasurer" | "secretary" | "leader" | "viewer"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database["public"]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Omit<Database, "__InternalSupabase"> },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Omit<Database, "__InternalSupabase"> }
    ? keyof (Omit<Database, "__InternalSupabase">[PublicTableNameOrOptions["schema"]]["Tables"] &
        Omit<Database, "__InternalSupabase">[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Omit<Database, "__InternalSupabase"> }
    ? (Omit<Database, "__InternalSupabase">[PublicTableNameOrOptions["schema"]]["Tables"] &
        Omit<Database, "__InternalSupabase">[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Omit<Database, "__InternalSupabase"> },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Omit<Database, "__InternalSupabase"> }
    ? keyof Omit<Database, "__InternalSupabase">[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Omit<Database, "__InternalSupabase"> }
    ? Omit<Database, "__InternalSupabase">[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Omit<Database, "__InternalSupabase"> },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Omit<Database, "__InternalSupabase"> }
    ? keyof Omit<Database, "__InternalSupabase">[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Omit<Database, "__InternalSupabase"> }
    ? Omit<Database, "__InternalSupabase">[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Omit<Database, "__InternalSupabase"> },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Omit<Database, "__InternalSupabase"> }
    ? keyof Omit<Database, "__InternalSupabase">[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Omit<Database, "__InternalSupabase"> }
    ? Omit<Database, "__InternalSupabase">[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
