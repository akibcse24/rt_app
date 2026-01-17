"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useFocusTimerLogic } from "@/hooks/useFocusTimerLogic";

// Infer the return type of the hook
type FocusContextType = ReturnType<typeof useFocusTimerLogic>;

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export const FocusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const focusLogic = useFocusTimerLogic();

    return (
        <FocusContext.Provider value={focusLogic}>
            {children}
        </FocusContext.Provider>
    );
};

export const useFocusContext = () => {
    const context = useContext(FocusContext);
    if (context === undefined) {
        throw new Error("useFocusContext must be used within a FocusProvider");
    }
    return context;
};

export default FocusContext;
