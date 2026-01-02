import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock child components to avoid complex setup
vi.mock('./components/Library/Archive', () => ({
    Archive: () => <div data-testid="archive">Archive</div>
}));
vi.mock('./components/Library/Librarian', () => ({
    Librarian: () => <div data-testid="librarian">Librarian</div>
}));
vi.mock('./components/Reader/Reader', () => ({
    Reader: () => <div data-testid="reader">Reader</div>
}));
vi.mock('./components/Settings/SettingsPanel', () => ({
    SettingsPanel: () => <div data-testid="settings">Settings</div>
}));
vi.mock('./components/Manifesto', () => ({
    Manifesto: () => <div data-testid="manifesto">Manifesto</div>
}));

// Mock stores
vi.mock('./core/store/settings', () => ({
    useSettingsStore: () => ({ theme: 'volcanic' })
}));
vi.mock('./core/store/ai', () => ({
    useAIStore: () => ({ activity: null })
}));

describe('App Component', () => {
    it('renders the correct header title', () => {
        render(<App />);
        expect(screen.getByText('XYZ')).toBeInTheDocument();
    });

    it('renders the correct footer text with styling', () => {
        render(<App />);
        // "Made by" is in the button text, but "Arphen" is in a span.
        // getByText with regex matches the whole text content of the button.
        expect(screen.getByText(/Made by/i)).toBeInTheDocument();

        const arphenText = screen.getByText('Arphen');
        expect(arphenText).toBeInTheDocument();
        expect(arphenText).toHaveClass('text-magma-vent');
        expect(arphenText).toHaveClass('font-bold');
    });
});
