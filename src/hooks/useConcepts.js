import { useState, useEffect } from 'react';
import { loadAllConcepts, loadConcept, getConceptIds } from '../data/ConceptLoader';

/**
 * Hook for loading and managing concepts from markdown files
 */
const useConcepts = () => {
    const [concepts, setConcepts] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load all concepts on mount
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const loadedConcepts = await loadAllConcepts();
                setConcepts(loadedConcepts);
                setError(null);
            } catch (err) {
                console.error('Failed to load concepts:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    // Function to get a single concept (returns from cache or loads)
    const getConcept = async (conceptId) => {
        if (concepts[conceptId]) {
            return concepts[conceptId];
        }
        const concept = await loadConcept(conceptId);
        if (concept) {
            setConcepts(prev => ({ ...prev, [conceptId]: concept }));
        }
        return concept;
    };

    return {
        concepts,
        loading,
        error,
        getConcept,
        conceptIds: getConceptIds()
    };
};

export default useConcepts;
