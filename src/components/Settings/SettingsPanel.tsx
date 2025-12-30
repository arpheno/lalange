import React from 'react';
import { useSettingsStore } from '../../core/store/settings';
import { clsx } from 'clsx';

interface SettingsPanelProps {
    onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
    const settings = useSettingsStore();

    return (
        <div className="w-full h-full flex items-center justify-center p-4 md:p-12 bg-basalt">
            <div className="bg-basalt w-full h-full max-w-5xl rounded-lg border border-magma-vent/30 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/20">
                    <div>
                        <h2 className="font-mono text-2xl font-bold text-dune-gold tracking-widest uppercase">COGNITIVE COCKPIT</h2>
                        <p className="text-xs text-gray-500 font-mono mt-1">SYSTEM CONFIGURATION // V1.0</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-magma-vent transition-colors p-2 hover:bg-white/5 rounded-full"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 font-mono">

                    {/* I. The Janitor’s Station */}
                    <section>
                        <h3 className="text-xl text-white font-bold mb-6 flex items-center gap-3">
                            <span className="text-magma-vent">I.</span> THE JANITOR’S STATION
                            <span className="text-xs text-gray-500 font-normal ml-auto">PREPROCESSING</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Toggle
                                label="License Annihilator"
                                description="Detects and hard-removes Project Gutenberg/Standard Ebooks legal headers."
                                checked={settings.licenseAnnihilator}
                                onChange={settings.toggleLicenseAnnihilator}
                            />
                            <Toggle
                                label="Structural Scrubber"
                                description="Strips out 'Chapter 1', page numbers, and Transcriber’s notes."
                                checked={settings.structuralScrubber}
                                onChange={settings.setStructuralScrubber}
                            />
                            <Toggle
                                label="Footnote Suppressor"
                                description="Hides [1] or (p. 42) references that trigger 'eye-glitch'."
                                checked={settings.footnoteSuppressor}
                                onChange={settings.setFootnoteSuppressor}
                            />
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm text-dune-gold mb-2">MANUAL OVERRIDE RULES</label>
                                <textarea
                                    className="w-full h-24 bg-black/30 border border-white/10 rounded p-3 text-sm text-gray-300 focus:border-dune-gold focus:outline-none transition-colors"
                                    placeholder="Global Find & Replace rules (e.g. Change 'Rand' to 'The Dragon')"
                                    value={settings.manualOverrideRules}
                                    onChange={(e) => settings.setManualOverrideRules(e.target.value)}
                                />
                            </div>
                        </div>
                    </section>

                    {/* II. The Word Processor */}
                    <section className="border-t border-white/5 pt-10">
                        <h3 className="text-xl text-white font-bold mb-6 flex items-center gap-3">
                            <span className="text-magma-vent">II.</span> THE WORD PROCESSOR
                            <span className="text-xs text-gray-500 font-normal ml-auto">TRANSFORMATION</span>
                        </h3>
                        <div className="space-y-8">
                            {/* Model Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <SelectCard
                                    title="Tiny"
                                    subtitle="Qwen-0.5B"
                                    description="Instant, low-power cleaning."
                                    selected={settings.llmModel === 'tiny'}
                                    onClick={() => settings.setLlmModel('tiny')}
                                />
                                <SelectCard
                                    title="Balanced"
                                    subtitle="Llama-3.2-3B"
                                    description="Nuanced editing and light styling."
                                    selected={settings.llmModel === 'balanced'}
                                    onClick={() => settings.setLlmModel('balanced')}
                                />
                                <SelectCard
                                    title="Pro"
                                    subtitle="Mistral-7B"
                                    description="Deep 'Jack Sparrow' style transformations."
                                    selected={settings.llmModel === 'pro'}
                                    onClick={() => settings.setLlmModel('pro')}
                                />
                            </div>

                            <Toggle
                                label="Auto-Upgrade Neural Engine"
                                description="Starts with Tiny model and swaps to Pro once buffer is ready."
                                checked={settings.autoUpgradeEngine}
                                onChange={settings.setAutoUpgradeEngine}
                            />

                            {/* Styling Cockpit */}
                            <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                                <h4 className="text-dune-gold mb-4 text-sm tracking-widest">STYLING COCKPIT</h4>
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-6">
                                    {['analyst', 'pirate', 'zoomer', 'stoic', 'victorian', 'custom'].map((preset) => (
                                        <button
                                            key={preset}
                                            onClick={() => settings.setStylingPreset(preset as any)}
                                            className={clsx(
                                                "px-3 py-2 rounded text-xs uppercase transition-all border",
                                                settings.stylingPreset === preset
                                                    ? "bg-dune-gold text-black border-dune-gold font-bold"
                                                    : "bg-black/20 text-gray-400 border-white/10 hover:border-white/30"
                                            )}
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                                {settings.stylingPreset === 'custom' && (
                                    <div className="mb-6">
                                        <input
                                            type="text"
                                            className="w-full bg-black/30 border border-white/10 rounded p-3 text-sm text-gray-300 focus:border-dune-gold focus:outline-none"
                                            placeholder="Rewrite as [_______]"
                                            value={settings.customStylingPrompt}
                                            onChange={(e) => settings.setCustomStylingPrompt(e.target.value)}
                                        />
                                    </div>
                                )}
                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                                        <span>INTENSITY</span>
                                        <span>{settings.stylingIntensity}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="100"
                                        value={settings.stylingIntensity}
                                        onChange={(e) => settings.setStylingIntensity(parseInt(e.target.value))}
                                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-dune-gold"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                                        <span>RAW</span>
                                        <span>HALLUCINATION</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* III. The Pacing Engine */}
                    <section className="border-t border-white/5 pt-10">
                        <h3 className="text-xl text-white font-bold mb-6 flex items-center gap-3">
                            <span className="text-magma-vent">III.</span> THE PACING ENGINE
                            <span className="text-xs text-gray-500 font-normal ml-auto">ANNOTATION</span>
                        </h3>

                        {/* Base Velocity */}
                        <div className="mb-8 bg-black/20 p-6 rounded border border-white/10">
                            <div className="flex justify-between text-xs text-gray-400 mb-2">
                                <span>BASE VELOCITY</span>
                                <span>{settings.wpm} WPM</span>
                            </div>
                            <input
                                type="range" aria-label="WPM" min="100"
                                max="1000"
                                step="50"
                                value={settings.wpm}
                                onChange={(e) => settings.setWpm(parseInt(e.target.value))}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-dune-gold"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm text-dune-gold mb-4">ANALYSIS GRANULARITY</label>
                                <div className="flex flex-col gap-2">
                                    {[
                                        { id: 'paragraph', label: 'Paragraph Level', desc: 'Fastest, smoothest flow.' },
                                        { id: 'sentence', label: 'Sentence Level', desc: 'Speed shifts with logic.' },
                                        { id: 'word', label: 'Word Level', desc: 'Highest jouissance/intensity.' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => settings.setPacingGranularity(opt.id as any)}
                                            className={clsx(
                                                "flex items-center p-3 rounded border text-left transition-all",
                                                settings.pacingGranularity === opt.id
                                                    ? "bg-white/10 border-dune-gold"
                                                    : "bg-transparent border-white/10 hover:bg-white/5"
                                            )}
                                        >
                                            <div className={clsx("w-4 h-4 rounded-full border mr-3 flex items-center justify-center", settings.pacingGranularity === opt.id ? "border-dune-gold" : "border-gray-500")}>
                                                {settings.pacingGranularity === opt.id && <div className="w-2 h-2 rounded-full bg-dune-gold" />}
                                            </div>
                                            <div>
                                                <div className={clsx("text-sm font-bold", settings.pacingGranularity === opt.id ? "text-white" : "text-gray-400")}>{opt.label}</div>
                                                <div className="text-xs text-gray-600">{opt.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-dune-gold mb-4">SENSITIVITY DIAL ("THE WALL")</label>
                                <div className="bg-black/20 p-6 rounded border border-white/10 h-full flex flex-col justify-center">
                                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                                        <span>DENSITY IMPACT</span>
                                        <span>{settings.pacingSensitivity}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="100"
                                        value={settings.pacingSensitivity}
                                        onChange={(e) => settings.setPacingSensitivity(parseInt(e.target.value))}
                                        className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-magma-vent"
                                    />
                                    <p className="text-xs text-gray-500 mt-4 italic">
                                        "How much should the speed drop when density is detected?"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* IV. The Librarian */}
                    <section className="border-t border-white/5 pt-10 pb-10">
                        <h3 className="text-xl text-white font-bold mb-6 flex items-center gap-3">
                            <span className="text-magma-vent">IV.</span> THE LIBRARIAN
                            <span className="text-xs text-gray-500 font-normal ml-auto">PRESCRIBER</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm text-dune-gold mb-2">LIBRARIAN MODEL</label>
                                <div className="flex gap-2">
                                    {['mistral', 'llama', 'other'].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => settings.setLibrarianModel(m as any)}
                                            className={clsx(
                                                "flex-1 py-2 rounded border text-xs uppercase",
                                                settings.librarianModel === m
                                                    ? "bg-dune-gold text-black border-dune-gold font-bold"
                                                    : "bg-transparent border-white/10 text-gray-500 hover:border-white/30"
                                            )}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-end justify-end">
                                <div className="text-[10px] text-gray-600 border border-white/10 px-3 py-1 rounded-full">
                                    Librarian logic is local. Amazon links support this project.
                                </div>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};

const Toggle = ({ label, description, checked, onChange }: { label: string, description: string, checked: boolean, onChange: (v: boolean) => void }) => (
    <div className="flex items-start justify-between group">
        <div>
            <div className="text-sm text-gray-200 font-bold group-hover:text-dune-gold transition-colors">{label}</div>
            <div className="text-xs text-gray-500 mt-1">{description}</div>
        </div>
        <button
            onClick={() => onChange(!checked)}
            className={clsx(
                "w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ml-4",
                checked ? "bg-dune-gold" : "bg-gray-700"
            )}
        >
            <div className={clsx(
                "absolute top-1 w-3 h-3 rounded-full bg-black transition-all",
                checked ? "left-6" : "left-1"
            )} />
        </button>
    </div>
);

const SelectCard = ({ title, subtitle, description, selected, onClick }: { title: string, subtitle: string, description: string, selected: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={clsx(
            "p-4 rounded border text-left transition-all hover:bg-white/5",
            selected ? "border-dune-gold bg-white/5" : "border-white/10"
        )}
    >
        <div className="flex justify-between items-baseline mb-1">
            <span className={clsx("font-bold", selected ? "text-dune-gold" : "text-white")}>{title}</span>
            <span className="text-[10px] text-gray-500 uppercase">{subtitle}</span>
        </div>
        <div className="text-xs text-gray-400 leading-relaxed">{description}</div>
    </button>
);
