import React, { createContext, useContext, useState, ReactNode } from "react";

interface TransactionModalContextType {
    isOpen: boolean;
    editingTransaction: any;
    openNewTransaction: () => void;
    openEditTransaction: (transaction: any) => void;
    closeTransactionModal: () => void;
}

const TransactionModalContext = createContext<TransactionModalContextType | undefined>(undefined);

export function TransactionModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<any>(null);

    const openNewTransaction = () => {
        setEditingTransaction(null);
        setIsOpen(true);
    };

    const openEditTransaction = (transaction: any) => {
        setEditingTransaction(transaction);
        setIsOpen(true);
    };

    const closeTransactionModal = () => {
        setIsOpen(false);
        setEditingTransaction(null);
    };

    return (
        <TransactionModalContext.Provider
            value={{
                isOpen,
                editingTransaction,
                openNewTransaction,
                openEditTransaction,
                closeTransactionModal,
            }}
        >
            {children}
        </TransactionModalContext.Provider>
    );
}

export function useTransactionModal() {
    const context = useContext(TransactionModalContext);
    if (context === undefined) {
        throw new Error("useTransactionModal must be used within a TransactionModalProvider");
    }
    return context;
}
