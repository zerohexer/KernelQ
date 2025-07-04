#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class ProblemExtractor {
    constructor() {
        this.problemsDir = path.join(__dirname, '../problems');
        this.frontendFile = path.join(__dirname, '../src/UltimateKernelAcademy.js');
        this.backendFile = path.join(__dirname, '../backend/leetcode-style-validator.js');
    }

    // Helper to convert frontend problem to JSON format
    convertToJSON(frontendProblem, backendValidation = null) {
        const problem = {
            id: frontendProblem.id,
            title: frontendProblem.title,
            phase: frontendProblem.phase,
            difficulty: frontendProblem.difficulty,
            xp: frontendProblem.xp,
            description: frontendProblem.description,
            starter: frontendProblem.starter,
            concepts: frontendProblem.concepts || [],
            skills: frontendProblem.skills || []
        };

        // Add multi-part info if present
        if (frontendProblem.problemId) {
            problem.problemId = frontendProblem.problemId;
        }
        
        if (frontendProblem.partNumber) {
            problem.multiPart = {
                partNumber: frontendProblem.partNumber,
                totalParts: frontendProblem.totalParts,
                nextPartId: frontendProblem.nextPartId || null,
                previousPartId: frontendProblem.previousPartId || null
            };
        }

        // Convert inputOutput to validation
        if (frontendProblem.inputOutput) {
            problem.validation = {
                exactRequirements: {
                    functionNames: this.extractFunctionNames(frontendProblem.inputOutput.requirements),
                    variables: this.extractVariables(frontendProblem.inputOutput.requirements),
                    outputMessages: frontendProblem.inputOutput.expectedOutput,
                    requiredIncludes: this.extractIncludes(frontendProblem.inputOutput.requirements),
                    mustContain: this.extractMustContain(frontendProblem.inputOutput.requirements),
                    moduleInfo: this.extractModuleInfo(frontendProblem.inputOutput.requirements)
                },
                testCases: [
                    {
                        id: 'output_validation',
                        name: 'Output Validation',
                        type: 'output_match',
                        critical: true,
                        expected: frontendProblem.inputOutput.expectedOutput.map(msg => ({
                            pattern: msg,
                            exact: true
                        }))
                    }
                ]
            };

            // Clean up empty arrays/objects
            Object.keys(problem.validation.exactRequirements).forEach(key => {
                const value = problem.validation.exactRequirements[key];
                if (Array.isArray(value) && value.length === 0) {
                    delete problem.validation.exactRequirements[key];
                } else if (typeof value === 'object' && Object.keys(value).length === 0) {
                    delete problem.validation.exactRequirements[key];
                }
            });
        }

        // Add frontend tests if present
        if (frontendProblem.tests) {
            problem.frontendTests = frontendProblem.tests.map(test => ({
                name: test.name,
                checkFunction: test.check.toString()
            }));
        }

        // Add legacy validation if present
        if (frontendProblem.validation || frontendProblem.leetCodeStyle) {
            problem.legacy = {};
            if (frontendProblem.validation) {
                problem.legacy.validation = frontendProblem.validation;
            }
            if (frontendProblem.leetCodeStyle) {
                problem.legacy.leetCodeStyle = frontendProblem.leetCodeStyle;
            }
        }

        return problem;
    }

    extractFunctionNames(requirements) {
        const functionNames = [];
        for (const req of requirements || []) {
            // Look for patterns like "Use required function names: func1, func2"
            const match = req.match(/(?:function names?|required functions?):\s*([^.]+)/i);
            if (match) {
                const names = match[1].split(/[,\s]+/).map(s => s.trim()).filter(s => s);
                functionNames.push(...names);
            }
        }
        return [...new Set(functionNames)]; // Remove duplicates
    }

    extractVariables(requirements) {
        const variables = [];
        for (const req of requirements || []) {
            // Look for patterns like "Use variable names: var1, var2"
            const match = req.match(/(?:variable names?|required variables?):\s*([^.]+)/i);
            if (match) {
                const names = match[1].split(/[,\s]+/).map(s => s.trim()).filter(s => s);
                names.forEach(name => {
                    variables.push({ name, type: "unknown" });
                });
            }
        }
        return variables;
    }

    extractIncludes(requirements) {
        const includes = [];
        for (const req of requirements || []) {
            // Look for patterns like "Must include: header1, header2"
            const match = req.match(/(?:must include|include):\s*([^.]+)/i);
            if (match) {
                const headers = match[1].split(/[,\s]+/).map(s => s.trim()).filter(s => s);
                includes.push(...headers);
            }
        }
        return [...new Set(includes)]; // Remove duplicates
    }

    extractMustContain(requirements) {
        const mustContain = [];
        for (const req of requirements || []) {
            // Look for patterns like "Code must contain: pattern1, pattern2"
            if (req.toLowerCase().includes('must contain') && !req.toLowerCase().includes('include')) {
                const match = req.match(/must contain:\s*([^.]+)/i);
                if (match) {
                    const patterns = match[1].split(/[,\s]+/).map(s => s.trim()).filter(s => s);
                    mustContain.push(...patterns);
                }
            }
        }
        return [...new Set(mustContain)]; // Remove duplicates
    }

    extractModuleInfo(requirements) {
        const moduleInfo = {};
        for (const req of requirements || []) {
            // Look for MODULE_LICENSE patterns
            const licenseMatch = req.match(/MODULE_LICENSE\s*\(\s*["']([^"']+)["']\s*\)/i);
            if (licenseMatch) {
                moduleInfo.license = licenseMatch[1];
            }
        }
        return Object.keys(moduleInfo).length > 0 ? moduleInfo : undefined;
    }

    saveProblemJSON(problem) {
        const paddedId = String(problem.id).padStart(3, '0');
        const slug = problem.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 50);
        const fileName = `${paddedId}-${slug}.json`;
        const filePath = path.join(this.problemsDir, problem.phase, fileName);
        
        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, JSON.stringify(problem, null, 2));
        console.log(`✅ Created: ${path.relative(process.cwd(), filePath)}`);
        
        return filePath;
    }

    // Utility to help with manual extraction
    generateTemplate(id, title, phase) {
        return {
            id: id,
            title: title,
            phase: phase,
            difficulty: 1,
            xp: 10,
            description: "TODO: Add description",
            starter: "// TODO: Add starter code",
            concepts: [],
            skills: [],
            validation: {
                exactRequirements: {
                    functionNames: [],
                    variables: [],
                    outputMessages: [],
                    requiredIncludes: [],
                    mustContain: []
                },
                testCases: [
                    {
                        id: "basic_validation",
                        name: "Basic Validation",
                        type: "output_match",
                        critical: true,
                        expected: []
                    }
                ]
            }
        };
    }

    // Generate example problems for testing
    generateExamples() {
        console.log('🚀 Generating example problem templates...\n');

        const examples = [
            { id: 1, title: "Hello Kernel World", phase: "foundations" },
            { id: 15, title: "Kernel Modules", phase: "foundations" },
            { id: 50, title: "Advanced Debugging", phase: "intermediate" },
            { id: 100, title: "Memory Management", phase: "advanced" }
        ];

        examples.forEach(({ id, title, phase }) => {
            const template = this.generateTemplate(id, title, phase);
            const filePath = this.saveProblemJSON(template);
            console.log(`Template created: ${filePath}`);
        });

        console.log('\n📝 Next steps:');
        console.log('1. Fill in the TODO fields in each template');
        console.log('2. Run: npm run problem:validate');
        console.log('3. Run: npm run problem:build');
    }

    // Show extraction instructions
    showInstructions() {
        console.log('📚 Problem Extraction Instructions\n');
        
        console.log('Manual extraction process:');
        console.log('1. Open src/UltimateKernelAcademy.js');
        console.log('2. Find the problemBank array (search for "const problemBank = [")');
        console.log('3. Copy individual problem objects');
        console.log('4. Use this.convertToJSON(problemObject) to convert');
        console.log('5. Save with this.saveProblemJSON(convertedProblem)');
        
        console.log('\nExample usage in Node.js:');
        console.log(`
const extractor = require('./scripts/extract-problems.js');
const problem = {
    id: 1,
    title: "Hello World",
    phase: "foundations",
    difficulty: 1,
    xp: 10,
    description: "Your first kernel module",
    starter: "#include <linux/module.h>...",
    inputOutput: {
        expectedOutput: ["Hello from kernel!"],
        requirements: ["Use function names: hello_init, hello_exit"]
    }
};

const converted = extractor.convertToJSON(problem);
extractor.saveProblemJSON(converted);
        `);

        console.log('\nFor batch processing:');
        console.log('1. Extract 10-20 problems at a time');
        console.log('2. Validate: npm run problem:validate');
        console.log('3. Test: npm run problem:build');
        console.log('4. Commit: git commit -m "Extract problems X-Y"');
    }

    async run() {
        const args = process.argv.slice(2);
        const command = args[0];

        switch (command) {
            case 'examples':
                this.generateExamples();
                break;
            case 'instructions':
                this.showInstructions();
                break;
            default:
                console.log('🛠️  Problem Extraction Tool\n');
                console.log('Commands:');
                console.log('  examples      - Generate example problem templates');
                console.log('  instructions  - Show manual extraction instructions');
                console.log('\nUsage:');
                console.log('  node scripts/extract-problems.js <command>');
                break;
        }
    }
}

// Run if called directly
if (require.main === module) {
    const extractor = new ProblemExtractor();
    extractor.run().catch(console.error);
}

module.exports = ProblemExtractor;