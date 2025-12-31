import { create } from 'zustand';

interface AIState {
    isReady: boolean;
    isLoading: boolean;
    loadingModel: string | null;
    activeModel: string | null;
    activity: string | null;
    progress: string;
    progressValue: number; // 0-1

    setLoading: (loading: boolean, model?: string) => void;
    setProgress: (text: string, value: number) => void;
    setReady: (ready: boolean) => void;
    setActivity: (activity: string | null, model?: string) => void;
}

export const useAIStore = create<AIState>((set) => ({
    isReady: false,
    isLoading: false,
    loadingModel: null,
    activeModel: null,
    activity: null,
    progress: '',
    progressValue: 0,

    setLoading: (isLoading, model) => set({ isLoading, loadingModel: model || null }),
    setProgress: (progress, progressValue) => set({ progress, progressValue }),
    setReady: (isReady) => set({ isReady }),
    setActivity: (activity, model) => set({ activity, activeModel: model || null }),
}));
