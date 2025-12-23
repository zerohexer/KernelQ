/**
 * Concept Loader - Loads and parses markdown concept files
 *
 * Concepts are stored in src/components/ConceptLearner/Concepts/*.md
 */

// Import markdown files as URLs (CRA handles this)
import includeUrl from '../components/ConceptLearner/Concepts/include.md';
import functionUrl from '../components/ConceptLearner/Concepts/function.md';
import atomicOperationsUrl from '../components/ConceptLearner/Concepts/atomic_operations.md';
import pointersUrl from '../components/ConceptLearner/Concepts/pointers.md';

// Define the order of concepts (first = first displayed)
const CONCEPT_ORDER = [
    'include',
    'function',
    'pointers',
    'atomic_operations'
];

// Map of concept IDs to their URLs
const CONCEPT_URLS = {
    'include': includeUrl,
    'function': functionUrl,
    'atomic_operations': atomicOperationsUrl,
    'pointers': pointersUrl
};

// Cache for loaded concepts
const conceptCache = {};

/**
 * Parse YAML-like frontmatter from markdown
 */
function parseFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) return { metadata: {}, content };

    const frontmatter = match[1];
    const metadata = {};

    frontmatter.split('\n').forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();

            if (value.startsWith('[') && value.endsWith(']')) {
                try {
                    value = JSON.parse(value.replace(/'/g, '"'));
                } catch (e) {}
            } else if ((value.startsWith('"') && value.endsWith('"')) ||
                     (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            metadata[key] = value;
        }
    });

    const remainingContent = content.substring(match[0].length).trim();
    return { metadata, content: remainingContent };
}

/**
 * Extract sections from markdown content
 */
function extractSections(content) {
    const sections = {
        description: '',
        explanation: '',
        codeExample: '',
        exercises: []
    };

    const sectionRegex = /^# (.+)$/gm;
    const parts = content.split(sectionRegex);

    let currentSection = null;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (!part) continue;

        const lowerPart = part.toLowerCase();

        if (lowerPart === 'description') {
            currentSection = 'description';
        } else if (lowerPart === 'explanation') {
            currentSection = 'explanation';
        } else if (lowerPart === 'code' || lowerPart === 'code example') {
            currentSection = 'code';
        } else if (lowerPart === 'exercises' || lowerPart === 'practice') {
            currentSection = 'exercises';
        } else if (currentSection) {
            if (currentSection === 'description') {
                sections.description = part.trim();
            } else if (currentSection === 'explanation') {
                sections.explanation = part.trim();
            } else if (currentSection === 'code') {
                const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/;
                const codeMatch = part.match(codeBlockRegex);
                if (codeMatch) {
                    sections.codeExample = codeMatch[1].trim();
                } else {
                    sections.codeExample = part.trim();
                }
            } else if (currentSection === 'exercises') {
                const lines = part.split('\n');
                lines.forEach(line => {
                    const listMatch = line.match(/^[\d]+\.\s*(.+)$|^[-*]\s*(.+)$/);
                    if (listMatch) {
                        const exercise = (listMatch[1] || listMatch[2]).trim();
                        if (exercise) {
                            sections.exercises.push(exercise);
                        }
                    }
                });
            }
        }
    }

    return sections;
}

/**
 * Load a single concept from markdown file
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
        const { metadata, content } = parseFrontmatter(markdown);
        const sections = extractSections(content);

        const concept = {
            id: metadata.id || conceptId,
            title: metadata.title || conceptId,
            category: metadata.category || 'General',
            difficulty: metadata.difficulty || 'Beginner',
            relatedConcepts: metadata.relatedConcepts || [],
            description: sections.description,
            explanation: sections.explanation,
            codeExample: sections.codeExample,
            exercises: sections.exercises
        };

        conceptCache[conceptId] = concept;
        return concept;
    } catch (error) {
        console.error(`Error loading concept ${conceptId}:`, error);
        return null;
    }
}

/**
 * Load all concepts
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
