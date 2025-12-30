import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'volcanic' | 'dunes' | 'ash';

interface SettingsState {
    // Appearance
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;

    // Reading
    wpm: number;
    setWpm: (wpm: number) => void;
    fontScale: number;
    setFontScale: (scale: number) => void;

    // Features
    bionicEnabled: boolean;
    setBionicEnabled: (enabled: boolean) => void;
    riverEnabled: boolean;
    setRiverEnabled: (enabled: boolean) => void;

    // UI
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;

    // Advanced
    licenseAnnihilator: boolean;
    toggleLicenseAnnihilator: () => void;

    // AI / Summarization
    summaryChunkSize: number;
    setSummaryChunkSize: (size: number) => void;
    summaryPrompt: string;
    setSummaryPrompt: (prompt: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            theme: 'volcanic',
            setTheme: (theme) => set({ theme }),

            wpm: 300,
            setWpm: (wpm) => set({ wpm }),

            fontScale: 1,
            setFontScale: (fontScale) => set({ fontScale }),

            bionicEnabled: true,
            setBionicEnabled: (bionicEnabled) => set({ bionicEnabled }),

            riverEnabled: true,
            setRiverEnabled: (riverEnabled) => set({ riverEnabled }),

            sidebarOpen: true,
            setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

            licenseAnnihilator: true,
            toggleLicenseAnnihilator: () => set((state) => ({ licenseAnnihilator: !state.licenseAnnihilator })),

            summaryChunkSize: 2500,
            setSummaryChunkSize: (summaryChunkSize) => set({ summaryChunkSize }),

            summaryPrompt: "Summarize the following text in 5 sentences. Focus on the plot and key events.",
            setSummaryPrompt: (summaryPrompt) => set({ summaryPrompt }),
        }),
        {
            name: 'lalange-settings',
        }
    )
);
