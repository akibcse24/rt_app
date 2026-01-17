"use client";

import React from "react";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/AuthContext";
import { TaskProvider } from "@/context/TaskContext";
import { UIProvider } from "@/context/UIContext";
import { GoalProvider } from "@/context/GoalContext";
import { AIProvider } from "@/context/AIContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { PWAProvider } from "@/context/PWAContext";
import { AnalyticsProvider } from "@/context/AnalyticsContext";
import { AchievementsProvider } from "@/context/AchievementsContext";
import { SyncProvider } from "@/context/SyncContext";
import { FocusProvider } from "@/context/FocusContext";

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <SyncProvider>
          <UIProvider>
            <GoalProvider>
              <TaskProvider>
                <AnalyticsProvider>
                  <AchievementsProvider>
                    <FocusProvider>
                      <NotificationProvider>
                        <AIProvider>
                          <PWAProvider>
                            {children}
                          </PWAProvider>
                        </AIProvider>
                      </NotificationProvider>
                    </FocusProvider>
                  </AchievementsProvider>
                </AnalyticsProvider>
              </TaskProvider>
            </GoalProvider>
          </UIProvider>
        </SyncProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};
