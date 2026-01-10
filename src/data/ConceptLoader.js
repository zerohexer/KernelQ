/**
 * Concept Loader - Simplified loader for interactive concepts
 *
 * Concepts are stored in src/components/ConceptLearner/Concepts/*.md
 * with YAML frontmatter for metadata and <code_editor> tags for runnable examples.
 */

// Import markdown files as URLs (CRA handles this)
import includeUrl from '../components/ConceptLearner/Concepts/include.md';
import functionUrl from '../components/ConceptLearner/Concepts/function.md';
import pointersUrl from '../components/ConceptLearner/Concepts/pointers.md';

// Define the order of concepts (first = first displayed)
const CONCEPT_ORDER = [
    'include',
    'function',
    'pointers'
];

// Map of concept IDs to their URLs
const CONCEPT_URLS = {
    'include': includeUrl,
    'function': functionUrl,
    'pointers': pointersUrl
};

// Cache for loaded concept metadata
const conceptCache = {};

/**
 * Parse YAML frontmatter from markdown to extract metadata only
 */
function parseFrontmatterMetadata(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) return {};

    const frontmatter = match[1];
    const metadata = {};

    frontmatter.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();

            // Handle arrays
            if (value.startsWith('[') && value.endsWith(']')) {
                try {
                    value = JSON.parse(value.replace(/'/g, '"'));
                } catch (e) {
                    // Keep as string if parsing fails
                }
            }
            // Handle quoted strings
            else if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            metadata[key] = value;
        }
    });

    return metadata;
}

/**
 * Load concept metadata (without full content parsing)
 * The ConceptLearner component will fetch and parse the full content
 */
async function loadConcept(conceptId) {
    if (conceptCache[conceptId]) {
        return conceptCache[conceptId];
    }

    const url = CONCEPT_URLS[conceptId];
    if (!url) {
        console.error(`Unknown concept: ${conceptId}`);
        return null;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load concept: ${conceptId}`);
        }

        const markdown = await response.text();
        const metadata = parseFrontmatterMetadata(markdown);

        const concept = {
            id: metadata.id || conceptId,
            title: metadata.title || conceptId,
            category: metadata.category || 'General',
            difficulty: metadata.difficulty || 'Beginner',
            relatedConcepts: metadata.relatedConcepts || [],
            // Store the URL so ConceptLearner can fetch the full content
            url: url
        };

        conceptCache[conceptId] = concept;
        return concept;
    } catch (error) {
        console.error(`Error loading concept ${conceptId}:`, error);
        return null;
    }
}

/**
 * Load all concepts (metadata only)
 */
async function loadAllConcepts() {
    const concepts = {};

    await Promise.all(
        Object.keys(CONCEPT_URLS).map(async (id) => {
            const concept = await loadConcept(id);
            if (concept) {
                concepts[id] = concept;
            }
        })
    );

    return concepts;
}

/**
 * Get concept by ID (async)
 */
async function getConcept(conceptId) {
    return await loadConcept(conceptId.toLowerCase());
}

/**
 * Get all available concept IDs
 */
function getConceptIds() {
    return CONCEPT_ORDER;
}

export {
    loadConcept,
    loadAllConcepts,
    getConcept,
    getConceptIds,
    CONCEPT_URLS,
    CONCEPT_ORDER
};
