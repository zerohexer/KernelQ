#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Ajv = require('ajv');

class ProblemCLI {
    constructor() {
        this.ajv = new Ajv();
        this.schema = require('../problems/schema.json');
        this.validateProblem = this.ajv.compile(this.schema);
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async prompt(question) {
        return new Promise(resolve => {
            this.rl.question(question, resolve);
        });
    }

    getProblemPath(id, phase) {
        const paddedId = String(id).padStart(3, '0');
        return path.join(__dirname, `../problems/${phase}/${paddedId}-problem.json`);
    }

    getNextId() {
        const problemsDir = path.join(__dirname, '../problems');
        const phases = fs.readdirSync(problemsDir).filter(name => 
            fs.statSync(path.join(problemsDir, name)).isDirectory()
        );

        let maxId = 0;
        
        for (const phase of phases) {
            const phaseDir = path.join(problemsDir, phase);
            const files = fs.readdirSync(phaseDir).filter(f => f.endsWith('.json'));
            
            for (const file of files) {
                try {
                    const problem = JSON.parse(fs.readFileSync(path.join(phaseDir, file), 'utf8'));
                    if (problem.id > maxId) maxId = problem.id;
                } catch (e) {
                    // Skip invalid files
                }
            }
        }

        return maxId + 1;
    }

    async createProblem() {
        console.log('🚀 Creating new problem...\n');

        const phases = [
            'foundations', 'intermediate', 'advanced', 'expert', 'professional',
            'kernel_core', 'drivers', 'synchronization', 'filesystems', 
            'memory_mgmt', 'networking', 'performance', 'security'
        ];

        console.log('Available phases:');
        phases.forEach((phase, i) => console.log(`${i + 1}. ${phase}`));
        
        const phaseIndex = parseInt(await this.prompt('\nSelect phase (number): ')) - 1;
        if (phaseIndex < 0 || phaseIndex >= phases.length) {
            console.log('❌ Invalid phase selection');
            return;
        }

        const phase = phases[phaseIndex];
        const id = this.getNextId();
        
        const problem = {
            id,
            title: await this.prompt('Problem title: '),
            phase,
            difficulty: parseInt(await this.prompt('Difficulty (1-10): ')),
            xp: parseInt(await this.prompt('XP reward: ')),
            description: await this.prompt('Description: '),
            starter: await this.prompt('Starter code: '),
            concepts: (await this.prompt('Concepts (comma-separated): ')).split(',').map(s => s.trim()).filter(s => s),
            skills: (await this.prompt('Skills (comma-separated): ')).split(',').map(s => s.trim()).filter(s => s)
        };

        // Add comprehensive validation (recommended)
        console.log('\n🛡️ Setting up validation (anti-cheat protection recommended)...');
        const needsValidation = (await this.prompt('Add comprehensive validation? (y/n): ')).toLowerCase() === 'y';
        
        if (needsValidation) {
            console.log('\n📋 Basic Requirements:');
            const functionNames = (await this.prompt('Required function names (comma-separated): ')).split(',').map(s => s.trim()).filter(s => s);
            const outputMessages = (await this.prompt('Expected output messages (comma-separated): ')).split(',').map(s => s.trim()).filter(s => s);
            const requiredIncludes = (await this.prompt('Required includes (comma-separated, default: linux/module.h,linux/kernel.h,linux/init.h): ') || 'linux/module.h,linux/kernel.h,linux/init.h').split(',').map(s => s.trim()).filter(s => s);
            
            // Anti-cheat setup
            console.log('\n🛡️ Anti-Cheat Protection:');
            const addAntiCheat = (await this.prompt('Add anti-cheat tests to prevent template submissions? (recommended y/n): ')).toLowerCase() === 'y';
            
            const testCases = [];
            
            // Basic symbol check
            if (functionNames.length > 0) {
                testCases.push({
                    id: 'required_functions',
                    name: 'Required Function Names',
                    type: 'symbol_check',
                    critical: true,
                    expected: functionNames
                });
            }
            
            if (addAntiCheat) {
                // Anti-template test
                console.log('Enter specific implementation patterns students must use (prevents template submissions):');
                const expectedSymbols = (await this.prompt('Expected symbols/patterns (comma-separated): ')).split(',').map(s => s.trim()).filter(s => s);
                
                if (expectedSymbols.length > 0) {
                    testCases.push({
                        id: 'anti_template',
                        name: 'No Template Code', 
                        type: 'code_analysis',
                        critical: true,
                        expectedSymbols: expectedSymbols,
                        prohibitedSymbols: ['// TODO:', '/* TODO', 'your_implementation_here']
                    });
                }
                
                // Implementation check
                console.log('Enter required implementation patterns (what must be present in working solution):');
                const implementationPatterns = (await this.prompt('Implementation patterns (comma-separated): ')).split(',').map(s => s.trim()).filter(s => s);
                
                if (implementationPatterns.length > 0) {
                    testCases.push({
                        id: 'implementation_check',
                        name: 'Proper Implementation',
                        type: 'code_analysis',
                        critical: true,
                        expectedSymbols: implementationPatterns,
                        prohibitedSymbols: []
                    });
                }
            }
            
            // Output validation
            if (outputMessages.length > 0) {
                testCases.push({
                    id: 'output_validation',
                    name: 'Correct Output Messages',
                    type: 'output_match',
                    critical: true,
                    expected: outputMessages.map(msg => ({
                        pattern: msg,
                        exact: true
                    }))
                });
            }
            
            // Module structure check (non-critical)
            testCases.push({
                id: 'module_structure',
                name: 'Proper Module Structure',
                type: 'structure_check',
                critical: false,
                expected: ['module_init', 'module_exit', 'MODULE_LICENSE']
            });
            
            problem.validation = {
                exactRequirements: {
                    functionNames: functionNames,
                    variables: [],
                    outputMessages: outputMessages,
                    requiredIncludes: requiredIncludes,
                    mustContain: []
                },
                testCases: testCases
            };
            
            console.log(`\n✅ Created ${testCases.length} test cases (${testCases.filter(tc => tc.critical).length} critical)`);
        }

        // Validate the problem
        if (!this.validateProblem(problem)) {
            console.log('❌ Problem validation failed:', this.validateProblem.errors);
            return;
        }

        // Save the problem
        const problemPath = this.getProblemPath(id, phase);
        fs.writeFileSync(problemPath, JSON.stringify(problem, null, 2));
        
        console.log(`✅ Problem created: ${problemPath}`);
        console.log(`📝 Problem ID: ${id}`);
        console.log(`📝 Phase: ${phase}`);
        console.log('\n🔄 Run generators to update frontend/backend:');
        console.log('npm run problem:build');
    }

    async editProblem() {
        const id = parseInt(await this.prompt('Problem ID to edit: '));
        
        // Find the problem file
        let problemPath = null;
        let problem = null;
        
        const problemsDir = path.join(__dirname, '../problems');
        const phases = fs.readdirSync(problemsDir).filter(name => 
            fs.statSync(path.join(problemsDir, name)).isDirectory()
        );

        for (const phase of phases) {
            const phaseDir = path.join(problemsDir, phase);
            const files = fs.readdirSync(phaseDir).filter(f => f.endsWith('.json'));
            
            for (const file of files) {
                const filePath = path.join(phaseDir, file);
                try {
                    const p = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    if (p.id === id) {
                        problemPath = filePath;
                        problem = p;
                        break;
                    }
                } catch (e) {
                    // Skip invalid files
                }
            }
            if (problem) break;
        }

        if (!problem) {
            console.log(`❌ Problem with ID ${id} not found`);
            return;
        }

        console.log(`\n📝 Editing Problem ${id}: ${problem.title}\n`);
        console.log('Current values shown in [brackets]. Press Enter to keep current value.\n');

        // Edit basic fields
        const newTitle = await this.prompt(`Title [${problem.title}]: `);
        if (newTitle) problem.title = newTitle;

        const newDifficulty = await this.prompt(`Difficulty [${problem.difficulty}]: `);
        if (newDifficulty) problem.difficulty = parseInt(newDifficulty);

        const newXp = await this.prompt(`XP [${problem.xp}]: `);
        if (newXp) problem.xp = parseInt(newXp);

        const newDescription = await this.prompt(`Description [${problem.description.substring(0, 50)}...]: `);
        if (newDescription) problem.description = newDescription;

        // Save the updated problem
        if (!this.validateProblem(problem)) {
            console.log('❌ Problem validation failed:', this.validateProblem.errors);
            return;
        }

        fs.writeFileSync(problemPath, JSON.stringify(problem, null, 2));
        console.log(`✅ Problem updated: ${problemPath}`);
        console.log('\n🔄 Run generators to update frontend/backend:');
        console.log('npm run problem:build');
    }

    async listProblems() {
        const problemsDir = path.join(__dirname, '../problems');
        const phases = fs.readdirSync(problemsDir).filter(name => 
            fs.statSync(path.join(problemsDir, name)).isDirectory()
        );

        const problems = [];
        
        for (const phase of phases) {
            const phaseDir = path.join(problemsDir, phase);
            const files = fs.readdirSync(phaseDir).filter(f => f.endsWith('.json'));
            
            for (const file of files) {
                try {
                    const problem = JSON.parse(fs.readFileSync(path.join(phaseDir, file), 'utf8'));
                    problems.push({ ...problem, phase });
                } catch (e) {
                    // Skip invalid files
                }
            }
        }

        problems.sort((a, b) => a.id - b.id);

        console.log('\n📚 Available Problems:\n');
        console.log('ID   | Phase        | Difficulty | Title');
        console.log('-----|--------------|------------|---------------------------');
        
        problems.forEach(p => {
            const id = String(p.id).padStart(3);
            const phase = p.phase.padEnd(12);
            const diff = String(p.difficulty).padStart(2);
            const title = p.title.substring(0, 25);
            console.log(`${id}  | ${phase} | ${diff}         | ${title}`);
        });

        console.log(`\n📊 Total: ${problems.length} problems`);
    }

    async validateAll() {
        console.log('🔍 Validating all problems...\n');
        
        const problemsDir = path.join(__dirname, '../problems');
        const phases = fs.readdirSync(problemsDir).filter(name => 
            fs.statSync(path.join(problemsDir, name)).isDirectory()
        );

        let totalProblems = 0;
        let validProblems = 0;
        const errors = [];

        for (const phase of phases) {
            const phaseDir = path.join(problemsDir, phase);
            const files = fs.readdirSync(phaseDir).filter(f => f.endsWith('.json'));
            
            for (const file of files) {
                const filePath = path.join(phaseDir, file);
                totalProblems++;
                
                try {
                    const problem = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    
                    if (this.validateProblem(problem)) {
                        validProblems++;
                        console.log(`✅ ${phase}/${file} - Problem ${problem.id}: ${problem.title}`);
                    } else {
                        errors.push({
                            file: `${phase}/${file}`,
                            errors: this.validateProblem.errors
                        });
                        console.log(`❌ ${phase}/${file} - Validation failed`);
                    }
                } catch (error) {
                    errors.push({
                        file: `${phase}/${file}`,
                        errors: [{ message: `JSON parse error: ${error.message}` }]
                    });
                    console.log(`❌ ${phase}/${file} - Parse error`);
                }
            }
        }

        console.log(`\n📊 Validation Summary:`);
        console.log(`✅ Valid: ${validProblems}/${totalProblems}`);
        console.log(`❌ Invalid: ${totalProblems - validProblems}/${totalProblems}`);

        if (errors.length > 0) {
            console.log('\n❌ Errors found:');
            errors.forEach(({ file, errors }) => {
                console.log(`\n${file}:`);
                errors.forEach(err => console.log(`  - ${err.message || JSON.stringify(err)}`));
            });
        }
    }

    async testValidation() {
        const problemId = await this.prompt('Problem ID to test validation: ');
        
        if (!problemId) {
            console.log('❌ No problem ID provided');
            return;
        }

        console.log(`\n🧪 Testing validation for Problem ${problemId}...\n`);
        
        try {
            // Import and run our validation tester
            const testProblemValidation = require('../test-problem-validation.js');
            await testProblemValidation(parseInt(problemId));
        } catch (error) {
            console.log(`❌ Validation test failed: ${error.message}`);
            console.log('\n💡 Make sure backend is running:');
            console.log('   cd backend && npm start');
        }
    }

    async validateSingle() {
        const problemId = await this.prompt('Problem ID to validate: ');
        
        if (!problemId) {
            console.log('❌ No problem ID provided');
            return;
        }

        // Find the problem file
        let problemPath = null;
        let problem = null;
        
        const problemsDir = path.join(__dirname, '../problems');
        const phases = fs.readdirSync(problemsDir).filter(name => 
            fs.statSync(path.join(problemsDir, name)).isDirectory()
        );

        for (const phase of phases) {
            const phaseDir = path.join(problemsDir, phase);
            const files = fs.readdirSync(phaseDir).filter(f => f.endsWith('.json'));
            
            for (const file of files) {
                try {
                    const filePath = path.join(phaseDir, file);
                    const p = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    if (p.id === parseInt(problemId)) {
                        problemPath = filePath;
                        problem = p;
                        break;
                    }
                } catch (error) {
                    // Skip invalid files
                }
            }
            if (problem) break;
        }

        if (!problem) {
            console.log(`❌ Problem with ID ${problemId} not found`);
            return;
        }

        console.log(`\n🔍 Validating Problem ${problemId}: ${problem.title}\n`);

        // Schema validation
        if (this.validateProblem(problem)) {
            console.log('✅ Schema validation: PASSED');
        } else {
            console.log('❌ Schema validation: FAILED');
            console.log('Errors:', this.validateProblem.errors);
            return;
        }

        // Check validation completeness
        if (!problem.validation) {
            console.log('⚠️ No validation defined - problem will only use fallback validation');
            return;
        }

        const testCases = problem.validation.testCases || [];
        const codeAnalysisTests = testCases.filter(tc => tc.type === 'code_analysis');
        const criticalTests = testCases.filter(tc => tc.critical);

        console.log(`\n📊 Validation Analysis:`);
        console.log(`✅ Total test cases: ${testCases.length}`);
        console.log(`✅ Critical tests: ${criticalTests.length}`);
        console.log(`🛡️ Anti-cheat tests: ${codeAnalysisTests.length}`);

        if (codeAnalysisTests.length === 0) {
            console.log('⚠️ WARNING: No code_analysis tests - template code may be accepted');
            console.log('   Recommendation: Add code_analysis tests with expectedSymbols');
        }

        if (criticalTests.length < 2) {
            console.log('⚠️ WARNING: Very few critical tests - validation may be too lenient');
        }

        // Show test case details
        console.log(`\n📋 Test Cases:`);
        testCases.forEach((tc, i) => {
            const criticalFlag = tc.critical ? '🔴' : '🟡';
            console.log(`   ${i + 1}. ${criticalFlag} ${tc.name} (${tc.type})`);
        });

        console.log(`\n💡 To test actual validation effectiveness, run:`);
        console.log(`   npm run problem:test ${problemId}`);
    }

    async buildSingle() {
        const problemId = parseInt(await this.prompt('Problem ID to build: '));
        
        if (!problemId) {
            console.log('❌ No problem ID provided');
            return;
        }

        // Find the problem file
        let problemPath = null;
        let problem = null;
        let phase = null;
        
        const problemsDir = path.join(__dirname, '../problems');
        const phases = fs.readdirSync(problemsDir).filter(name => 
            fs.statSync(path.join(problemsDir, name)).isDirectory()
        );

        for (const phaseDir of phases) {
            const phasePath = path.join(problemsDir, phaseDir);
            const files = fs.readdirSync(phasePath).filter(f => f.endsWith('.json'));
            
            for (const file of files) {
                try {
                    const filePath = path.join(phasePath, file);
                    const p = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    if (p.id === problemId) {
                        problemPath = filePath;
                        problem = p;
                        phase = phaseDir;
                        break;
                    }
                } catch (error) {
                    // Skip invalid files
                }
            }
            if (problem) break;
        }

        if (!problem) {
            console.log(`❌ Problem with ID ${problemId} not found`);
            return;
        }

        console.log(`\n🏗️ Building Problem ${problemId}: ${problem.title}\n`);

        // Validate the problem first
        if (!this.validateProblem(problem)) {
            console.log('❌ Problem validation failed:', this.validateProblem.errors);
            return;
        }

        try {
            // Generate backend test definition
            console.log('🔨 Generating backend test definition...');
            const backendPath = path.join(__dirname, '../backend/generated-test-definitions.js');
            
            let backendContent = '';
            if (fs.existsSync(backendPath)) {
                backendContent = fs.readFileSync(backendPath, 'utf8');
            }

            // Create header if file doesn't exist
            if (!backendContent) {
                backendContent = `// Auto-generated from problems/ directory
// DO NOT EDIT THIS FILE DIRECTLY - Edit problems/*.json instead
// Generated at: ${new Date().toISOString()}

const generatedTestDefinitions = new Map();

`;
            }

            // Remove existing definition for this problem
            const problemDefRegex = new RegExp(`\\n\\n// Problem ${problemId}:.*?\\n\\}\\);`, 'gs');
            backendContent = backendContent.replace(problemDefRegex, '');

            // Add new definition
            const testDefinition = this.generateTestDefinition(problem);
            backendContent += `\n// Problem ${problemId}: ${problem.title}\n`;
            backendContent += `generatedTestDefinitions.set(${problemId}, ${JSON.stringify(testDefinition, null, 4)});\n`;

            // Ensure export line exists
            if (!backendContent.includes('module.exports = generatedTestDefinitions;')) {
                backendContent += '\nmodule.exports = generatedTestDefinitions;\n';
            }

            fs.writeFileSync(backendPath, backendContent);
            console.log('✅ Backend test definition generated');

            // Generate frontend problem definition
            console.log('🔨 Generating frontend problem definition...');
            const frontendPath = path.join(__dirname, '../src/generated-problems.js');
            
            let frontendContent = '';
            if (fs.existsSync(frontendPath)) {
                frontendContent = fs.readFileSync(frontendPath, 'utf8');
            }

            // Create header if file doesn't exist
            if (!frontendContent) {
                frontendContent = `// Auto-generated from problems/ directory
// DO NOT EDIT THIS FILE DIRECTLY - Edit problems/*.json instead
// Generated at: ${new Date().toISOString()}

export const generatedProblems = [
`;
            }

            // Remove existing definition for this problem
            const frontendProblemRegex = new RegExp(`    // Problem ${problemId}:.*?\\n    \\},`, 'gs');
            frontendContent = frontendContent.replace(frontendProblemRegex, '');

            // Find insertion point (before the closing bracket)
            const closingBracketIndex = frontendContent.lastIndexOf('];');
            if (closingBracketIndex !== -1) {
                const beforeClosing = frontendContent.substring(0, closingBracketIndex);
                const afterClosing = frontendContent.substring(closingBracketIndex);

                const frontendProblem = this.generateFrontendProblem(problem);
                const newDefinition = `    // Problem ${problemId}: ${problem.title}\n    ${JSON.stringify(frontendProblem, null, 4).replace(/^/gm, '    ')},\n`;
                
                frontendContent = beforeClosing + newDefinition + afterClosing;
            } else {
                // Add closing if it doesn't exist
                const frontendProblem = this.generateFrontendProblem(problem);
                frontendContent += `    // Problem ${problemId}: ${problem.title}\n    ${JSON.stringify(frontendProblem, null, 4).replace(/^/gm, '    ')},\n];\n`;
            }

            fs.writeFileSync(frontendPath, frontendContent);
            console.log('✅ Frontend problem definition generated');

            console.log(`\n🎉 Successfully built Problem ${problemId} for both frontend and backend!`);
            console.log(`📁 Files updated:`);
            console.log(`   - ${backendPath}`);
            console.log(`   - ${frontendPath}`);
            console.log(`\n🚀 You can now test this specific problem through the API`);

        } catch (error) {
            console.log(`❌ Build failed: ${error.message}`);
        }
    }

    generateTestDefinition(problem) {
        const testDefinition = {
            name: problem.title,
            category: problem.phase,
            description: problem.description
        };

        if (problem.validation) {
            if (problem.validation.exactRequirements) {
                testDefinition.exactRequirements = problem.validation.exactRequirements;
            }
            if (problem.validation.testCases) {
                testDefinition.testCases = problem.validation.testCases;
            }
        }

        return testDefinition;
    }

    generateFrontendProblem(problem) {
        return {
            id: problem.id,
            title: problem.title,
            phase: problem.phase,
            difficulty: problem.difficulty,
            xp: problem.xp,
            description: problem.description,
            starter: problem.starter,
            concepts: problem.concepts || [],
            skills: problem.skills || []
        };
    }

    async run() {
        const args = process.argv.slice(2);
        const command = args[0];

        switch (command) {
            case 'create':
                await this.createProblem();
                break;
            case 'edit':
                await this.editProblem();
                break;
            case 'list':
                await this.listProblems();
                break;
            case 'validate':
                await this.validateAll();
                break;
            case 'validate-single':
                await this.validateSingle();
                break;
            case 'test':
                await this.testValidation();
                break;
            case 'build-single':
                await this.buildSingle();
                break;
            default:
                console.log('🛠️  Problem Management CLI');
                console.log('\nCommands:');
                console.log('  create          - Create a new problem with anti-cheat validation');
                console.log('  edit            - Edit an existing problem');
                console.log('  list            - List all problems');
                console.log('  validate        - Validate all problems (schema only)');
                console.log('  validate-single - Validate a specific problem (detailed analysis)');
                console.log('  test            - Test validation effectiveness (requires backend)');
                console.log('  build-single    - Build a single problem for frontend and backend');
                console.log('\nUsage:');
                console.log('  node tools/problem-cli.js <command>');
                console.log('\nExamples:');
                console.log('  node tools/problem-cli.js create');
                console.log('  node tools/problem-cli.js test');
                console.log('  node tools/problem-cli.js build-single');
                break;
        }

        this.rl.close();
    }
}

// Run if called directly
if (require.main === module) {
    const cli = new ProblemCLI();
    cli.run().catch(console.error);
}

module.exports = ProblemCLI;