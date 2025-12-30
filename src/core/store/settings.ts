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

    // Advanced / Janitor
    licenseAnnihilator: boolean;
    toggleLicenseAnnihilator: () => void;
    structuralScrubber: boolean;
    setStructuralScrubber: (enabled: boolean) => void;
    footnoteSuppressor: boolean;
    setFootnoteSuppressor: (enabled: boolean) => void;
    manualOverrideRules: string;
    setManualOverrideRules: (rules: string) => void;

    // Transformation
    llmModel: 'tiny' | 'balanced' | 'pro';
    setLlmModel: (model: 'tiny' | 'balanced' | 'pro') => void;
    autoUpgradeEngine: boolean;
    setAutoUpgradeEngine: (enabled: boolean) => void;
    stylingPreset: 'analyst' | 'pirate' | 'zoomer' | 'stoic' | 'victorian' | 'custom';
    setStylingPreset: (preset: 'analyst' | 'pirate' | 'zoomer' | 'stoic' | 'victorian' | 'custom') => void;
    customStylingPrompt: string;
    setCustomStylingPrompt: (prompt: string) => void;
    stylingIntensity: number;
    setStylingIntensity: (intensity: number) => void;

    // Pacing
    pacingGranularity: 'paragraph' | 'sentence' | 'word';
    setPacingGranularity: (granularity: 'paragraph' | 'sentence' | 'word') => void;
    pacingSensitivity: number;
    setPacingSensitivity: (sensitivity: number) => void;

    // Librarian
    librarianModel: 'mistral' | 'llama' | 'other';
    setLibrarianModel: (model: 'mistral' | 'llama' | 'other') => void;

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
            structuralScrubber: true,
            setStructuralScrubber: (structuralScrubber) => set({ structuralScrubber }),
            footnoteSuppressor: true,
            setFootnoteSuppressor: (footnoteSuppressor) => set({ footnoteSuppressor }),
            manualOverrideRules: '',
            setManualOverrideRules: (manualOverrideRules) => set({ manualOverrideRules }),

            llmModel: 'tiny',
            setLlmModel: (llmModel) => set({ llmModel }),
            autoUpgradeEngine: true,
            setAutoUpgradeEngine: (autoUpgradeEngine) => set({ autoUpgradeEngine }),
            stylingPreset: 'analyst',
            setStylingPreset: (stylingPreset) => set({ stylingPreset }),
            customStylingPrompt: '',
            setCustomStylingPrompt: (customStylingPrompt) => set({ customStylingPrompt }),
            stylingIntensity: 0,
            setStylingIntensity: (stylingIntensity) => set({ stylingIntensity }),

            pacingGranularity: 'paragraph',
            setPacingGranularity: (pacingGranularity) => set({ pacingGranularity }),
            pacingSensitivity: 50,
            setPacingSensitivity: (pacingSensitivity) => set({ pacingSensitivity }),

            librarianModel: 'mistral',
            setLibrarianModel: (librarianModel) => set({ librarianModel }),

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
