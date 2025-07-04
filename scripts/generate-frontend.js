#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

class FrontendGenerator {
    constructor() {
        this.ajv = new Ajv();
        this.schema = require('../problems/schema.json');
        this.validateProblem = this.ajv.compile(this.schema);
    }

    loadAllProblems() {
        const problemsDir = path.join(__dirname, '../problems');
        const phases = fs.readdirSync(problemsDir).filter(name => 
            fs.statSync(path.join(problemsDir, name)).isDirectory()
        );

        const problems = [];
        
        for (const phase of phases) {
            const phaseDir = path.join(problemsDir, phase);
            const files = fs.readdirSync(phaseDir).filter(f => f.endsWith('.json'));
            
            for (const file of files) {
                const filePath = path.join(phaseDir, file);
                try {
                    const problemData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    
                    if (!this.validateProblem(problemData)) {
                        console.error(`❌ Invalid problem in ${filePath}:`, this.validateProblem.errors);
                        continue;
                    }
                    
                    problems.push(problemData);
                } catch (error) {
                    console.error(`❌ Error loading ${filePath}:`, error.message);
                }
            }
        }

        return problems.sort((a, b) => a.id - b.id);
    }

    generateInputOutput(problem) {
        const validation = problem.validation;
        if (!validation || !validation.exactRequirements) return null;

        const { exactRequirements } = validation;
        const inputOutput = {
            expectedOutput: exactRequirements.outputMessages || [],
            requirements: []
        };

        // Generate requirements from exactRequirements
        if (exactRequirements.functionNames && exactRequirements.functionNames.length > 0) {
            inputOutput.requirements.push(
                `Use required function names: ${exactRequirements.functionNames.join(', ')}`
            );
        }

        if (exactRequirements.variables && exactRequirements.variables.length > 0) {
            const varNames = exactRequirements.variables.map(v => v.name);
            inputOutput.requirements.push(
                `Use required variable names: ${varNames.join(', ')}`
            );
        }

        if (exactRequirements.outputMessages && exactRequirements.outputMessages.length > 0) {
            inputOutput.requirements.push(
                'Print exact message format for backend validation compatibility'
            );
        }

        if (exactRequirements.requiredIncludes && exactRequirements.requiredIncludes.length > 0) {
            inputOutput.requirements.push(
                `Must include: ${exactRequirements.requiredIncludes.join(', ')}`
            );
        }

        if (exactRequirements.mustContain && exactRequirements.mustContain.length > 0) {
            inputOutput.requirements.push(
                `Code must contain: ${exactRequirements.mustContain.join(', ')}`
            );
        }

        if (exactRequirements.moduleInfo && exactRequirements.moduleInfo.license) {
            inputOutput.requirements.push(
                `Must include MODULE_LICENSE("${exactRequirements.moduleInfo.license}")`
            );
        }

        return inputOutput;
    }

    generateFrontendTests(problem) {
        if (!problem.frontendTests) return null;

        return problem.frontendTests.map(test => ({
            name: test.name,
            check: eval(`(${test.checkFunction})`) // Convert string to function
        }));
    }

    generateProblemObject(problem) {
        const frontendProblem = {
            id: problem.id,
            title: problem.title,
            difficulty: problem.difficulty,
            xp: problem.xp,
            phase: problem.phase,
            description: problem.description,
            starter: problem.starter,
            concepts: problem.concepts || [],
            skills: problem.skills || []
        };

        // Add problemId for multi-part problems
        if (problem.problemId) {
            frontendProblem.problemId = problem.problemId;
        }

        // Add multi-part information
        if (problem.multiPart) {
            frontendProblem.partNumber = problem.multiPart.partNumber;
            frontendProblem.totalParts = problem.multiPart.totalParts;
            if (problem.multiPart.nextPartId) {
                frontendProblem.nextPartId = problem.multiPart.nextPartId;
            }
            if (problem.multiPart.previousPartId) {
                frontendProblem.previousPartId = problem.multiPart.previousPartId;
            }
        }

        // Use inputOutput from JSON if present, otherwise generate from validation
        if (problem.inputOutput) {
            frontendProblem.inputOutput = problem.inputOutput;
        } else {
            const inputOutput = this.generateInputOutput(problem);
            if (inputOutput) {
                frontendProblem.inputOutput = inputOutput;
            }
        }

        // Add frontend tests
        const tests = this.generateFrontendTests(problem);
        if (tests) {
            frontendProblem.tests = tests;
        }

        // Add legacy fields if present
        if (problem.legacy) {
            if (problem.legacy.validation) {
                frontendProblem.validation = problem.legacy.validation;
            }
            if (problem.legacy.leetCodeStyle) {
                frontendProblem.leetCodeStyle = problem.legacy.leetCodeStyle;
            }
        }

        return frontendProblem;
    }

    generateFrontendCode(problems) {
        const frontendProblems = problems.map(p => this.generateProblemObject(p));
        
        const template = `// Auto-generated from problems/ directory
// DO NOT EDIT THIS FILE DIRECTLY - Edit problems/*.json instead
// Generated at: ${new Date().toISOString()}

const problemBank = ${JSON.stringify(frontendProblems, null, 2)};

export default problemBank;
`;

        return template;
    }

    updateUltimateKernelAcademy(problems) {
        const frontendCode = this.generateFrontendCode(problems);
        const outputPath = path.join(__dirname, '../src/generated-problems.js');
        
        fs.writeFileSync(outputPath, frontendCode);
        console.log(`✅ Generated frontend problems: ${outputPath}`);
        console.log(`📊 Total problems: ${problems.length}`);
        
        // Generate update instructions
        console.log('\n📝 To use in UltimateKernelAcademy.js:');
        console.log('1. Import: import problemBank from "./generated-problems.js"');
        console.log('2. Replace the existing problemBank array with the imported one');
    }

    run() {
        console.log('🚀 Generating frontend problems...');
        
        const problems = this.loadAllProblems();
        if (problems.length === 0) {
            console.log('❌ No valid problems found');
            return;
        }

        this.updateUltimateKernelAcademy(problems);
        
        console.log('\n✅ Frontend generation complete!');
    }
}

// Run if called directly
if (require.main === module) {
    const generator = new FrontendGenerator();
    generator.run();
}

module.exports = FrontendGenerator;