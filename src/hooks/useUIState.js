import { useState } from 'react';

const useUIState = () => {
    const [activeTab, setActiveTab] = useState('problemBank');
    const [debugMode, setDebugMode] = useState(false);
    const [showHints, setShowHints] = useState(false);
    const [showLessons, setShowLessons] = useState(false);
    const [selectedConcept, setSelectedConcept] = useState(null);
    const [generationSeed, setGenerationSeed] = useState(Date.now());
    const [showPhaseSelector, setShowPhaseSelector] = useState(false);

    // Problem filtering state
    const [problemFilters, setProblemFilters] = useState({
        phase: 'all',
        difficulty: 'all',
        completed: 'all'
    });

    const resetHintsAndLessons = () => {
        setShowHints(false);
        setShowLessons(false);
    };

    const switchToTab = (tabId) => {
        setActiveTab(tabId);
        resetHintsAndLessons();
    };

    return {
        activeTab,
        setActiveTab,
        debugMode,
        setDebugMode,
        showHints,
        setShowHints,
        showLessons,
        setShowLessons,
        selectedConcept,
        setSelectedConcept,
        generationSeed,
        setGenerationSeed,
        showPhaseSelector,
        setShowPhaseSelector,
        problemFilters,
        setProblemFilters,
        resetHintsAndLessons,
        switchToTab
    };
};

export default useUIState;