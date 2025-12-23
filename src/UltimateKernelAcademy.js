import React, { useState, useEffect } from 'react';
import { Code, Book, Target, Lightbulb } from 'lucide-react';
import generatedProblems from './data/generated-problems.js';

// Extracted Components
import { PremiumStyles, premiumStyles } from './styles/PremiumStyles.js';
import ProblemBankTab from './components/ProblemBank/ProblemBankTab.js';
import ChallengeView from './components/Challenge/ChallengeView.js';
import ConceptLearner from './components/ConceptLearner/ConceptLearner.js';
import PlaygroundTab from './components/Playground/PlaygroundTab.js';
import NavigationBar from './components/Navigation/NavigationBar.js';
import Sidebar from './components/Navigation/Sidebar.js';
import LoginScreen from './components/Auth/LoginScreen.js';
import RegisterScreen from './components/Auth/RegisterScreen.js';

// Extracted Data
import phaseSystem from './data/PhaseSystem.js';

// Custom Hooks
import useUserProfile from './hooks/useUserProfile.js';
import useCodeEditor from './hooks/useCodeEditor.js';
import useUIState from './hooks/useUIState.js';
import useAuth from './hooks/useAuth.js';
import useConcepts from './hooks/useConcepts.js';

// Utility function to create a proper deep copy of files
const deepCopyFiles = (files) => {
    if (!files) return [];
    return files.map(file => ({
        name: file.name,
        content: file.content,
        readOnly: file.readOnly,
        language: file.language
    }));
};


// Problem Bank Tab Component


const UnlimitedKernelAcademy = () => {
    // Backend API configuration - supports both localhost and cloudflared
    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '/api';
    console.log('🔧 Frontend loaded with BACKEND_URL:', BACKEND_URL);
    
    // Authentication hook
    const {
        user,
        userProgress,
        isAuthenticated,
        isLoading: authLoading,
        login,
        logout,
        recordProblemCompletion,
        getSolvedProblems,
        makeAuthenticatedRequest,
        updateProgress
    } = useAuth();

    // Authentication UI state
    const [showRegister, setShowRegister] = useState(false);
    
    // Debouncing state for challenge generation to prevent race conditions
    const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false);
    
    // Use custom hooks for state management
    const {
        userProfile,
        setUserProfile,
        userSkills,
        setUserSkills,
        completedChallenges,
        setCompletedChallenges,
        getCurrentPhase,
        resetAll: resetUserProfile
    } = useUserProfile();

    const {
        activeTab,
        setActiveTab,
        debugMode,
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
        switchToTab
    } = useUIState();

    const [currentChallenge, setCurrentChallenge] = useState(null);
    const [challengeHistory, setChallengeHistory] = useState([]);

    const {
        codeEditor,
        setCodeEditor,
        playground,
        setPlayground,
        resetAll: resetCodeEditor
    } = useCodeEditor(currentChallenge);

    // Load concepts from markdown files
    const { concepts: mdConcepts, loading: conceptsLoading } = useConcepts();

    // Problem bank and utility functions
    const problemBank = generatedProblems;

    const detectProblemCategory = (code) => {
        if (typeof code !== 'string') return 'multi-file';
        if (code.includes('MODULE_LICENSE')) return 'module_development';
        if (code.includes('kmalloc') || code.includes('kfree')) return 'memory_management';
        if (code.includes('device_create')) return 'device_drivers';
        return 'general';
    };

    const runBasicRuleValidation = (codeOrFiles, problemId) => {
        const tests = [];
        const code = Array.isArray(codeOrFiles) ? codeOrFiles.map(f => f.content).join('\n') : codeOrFiles;
        
        // Basic syntax checks
        const hasInit = /__init/.test(code) || /module_init/.test(code);
        const hasExit = /__exit/.test(code) || /module_exit/.test(code);
        const hasLicense = /MODULE_LICENSE/.test(code);
        const hasPrintk = /printk/.test(code);

        tests.push({
            name: 'Has Init Function',
            passed: hasInit,
            message: hasInit ? null : 'Missing __init function or module_init() call'
        });

        tests.push({
            name: 'Has Exit Function', 
            passed: hasExit,
            message: hasExit ? null : 'Missing __exit function or module_exit() call'
        });

        tests.push({
            name: 'Has Module License',
            passed: hasLicense,
            message: hasLicense ? null : 'Missing MODULE_LICENSE declaration'
        });

        tests.push({
            name: 'Uses Kernel Print',
            passed: hasPrintk,
            message: hasPrintk ? null : 'Missing printk() calls for output'
        });

        const allPassed = tests.every(t => t.passed);
        return { testResults: tests, allPassed };
    };

    // LeetCode-style validation function
    const runLeetCodeStyleValidation = async (codeOrFiles, problemId) => {
        const moduleName = String(problemId).replace(/[^a-z0-9]/g, '_') + '_' + Date.now();

        try {
            console.log('🚀 Making API call to:', `${BACKEND_URL}/validate-solution-comprehensive`);

            // Find the problem definition from the generated problem bank
            const numericProblemId = typeof problemId === 'string' ? parseInt(problemId) : problemId;
            const testDef = generatedProblems.find(p => p.id === numericProblemId || p.id === problemId);

            // Default frontend timeout (e.g., 30 seconds)
            let backendTimeout = 30000;
            console.log(`🔍 Frontend timeout lookup for problem: ${problemId}`);

            // If a test scenario with a specific timeout exists, use it
            if (testDef && testDef.validation?.testCases) {
                const projectTest = testDef.validation.testCases.find(tc => tc.type === 'kernel_project_test');
                if (projectTest && projectTest.testScenario?.timeout) {
                    const scenarioTimeout = projectTest.testScenario.timeout;
                    console.log(`📊 Problem ${problemId} backend requires ${scenarioTimeout}s. Setting frontend timeout with a buffer.`);
                    backendTimeout = (scenarioTimeout + 10) * 1000;
                }
            }

            console.log(`⏱️ Final frontend timeout set to: ${backendTimeout / 1000}s`);

            // Use AbortController for fetch timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.error(`❌ Frontend fetch timed out after ${backendTimeout / 1000}s`);
                controller.abort();
            }, backendTimeout);

            // Support both single-file and multi-file formats
            const requestBody = {
                moduleName: moduleName,
                problemId: problemId,
                problemCategory: Array.isArray(codeOrFiles) ? 
                    'multi-file' : 
                    detectProblemCategory(codeOrFiles)
            };

            if (Array.isArray(codeOrFiles)) {
                requestBody.files = codeOrFiles;
                console.log(`📁 Multi-file submission with ${codeOrFiles.length} files`);
            } else {
                requestBody.code = codeOrFiles;
                console.log(`📄 Single-file submission`);
            }

            const response = await fetch(`${BACKEND_URL}/validate-solution-comprehensive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok || response.status === 400) {
                const result = await response.json();
                console.log('✅ Backend response received:', { success: result.success, overallResult: result.overallResult, score: result.score });

                if (result.success && result.overallResult === 'ACCEPTED') {
                    return {
                        success: true,
                        overallResult: result.overallResult,
                        totalTests: result.testResults?.length || 0,
                        passedTests: result.testResults?.filter(t => t.status === 'PASSED').length || 0,
                        score: result.score,
                        testResults: result.testResults?.map(test => ({
                            testName: test.name || test.id,
                            status: test.status,
                            message: test.message || '',
                            visible: true,
                            executionTime: test.executionTime || 100
                        })) || [],
                        compilationResult: result.compilationResult,
                        testingResult: result.testingResult,
                        backendDetails: result,
                        realBackend: true,
                        feedback: result.feedback
                    };
                } else {
                    return {
                        success: false,
                        overallResult: result.overallResult || 'WRONG_ANSWER',
                        totalTests: result.testResults?.length || 1,
                        passedTests: result.testResults?.filter(t => t.status === 'PASSED').length || 0,
                        score: result.score || 0,
                        testResults: result.testResults?.map(test => ({
                            testName: test.name || test.id,
                            status: test.status,
                            message: test.message || '',
                            visible: true,
                            executionTime: test.executionTime || 100
                        })) || [{
                            testName: 'Validation',
                            status: 'WRONG_ANSWER',
                            message: result.error || 'Validation failed',
                            visible: true,
                            executionTime: 100
                        }],
                        compilationResult: result.compilationResult || { success: false, error: result.error },
                        realBackend: true,
                        backendDetails: result,
                        feedback: result.feedback
                    };
                }
            } else {
                throw new Error('Backend API call failed');
            }
        } catch (error) {
            console.error('LeetCode-style validation failed:', error);
            console.warn('⚠️ Using fallback validation - results may be limited');

            const fallbackValidation = runBasicRuleValidation(codeOrFiles, problemId);
            return {
                success: true,
                error: null,
                overallResult: fallbackValidation.allPassed ? 'ACCEPTED' : 'PARTIAL_CREDIT',
                totalTests: fallbackValidation.testResults.length,
                passedTests: fallbackValidation.testResults.filter(t => t.passed).length,
                score: fallbackValidation.allPassed ? 100 : 50,
                testResults: fallbackValidation.testResults.map(test => ({
                    testName: test.name,
                    status: test.passed ? 'PASSED' : 'FAILED',
                    message: test.message || '',
                    visible: true,
                    executionTime: 100
                })),
                compilationResult: { success: true, output: 'Fallback validation used' },
                realBackend: false,
                fallback: true
            };
        }
    };

    const formatLeetCodeResults = (results, debugMode = false) => {
        let output = '';
        
        // Handle compilation errors first
        if (results.overallResult === 'COMPILATION_ERROR' || results.overallResult === 'PRE_COMPILATION_ERROR') {
            output += `❌ Compilation Error\n\n`;
            
            // Add compilation error details from feedback
            const errorFeedback = results.feedback?.find(f => f.type === 'error');
            if (errorFeedback) {
                output += `${errorFeedback.message}:\n`;
                output += `\`\`\`\n`;
                output += `${errorFeedback.details}\n`;
                output += `\`\`\`\n\n`;
            }
            
            // Add compilation output if available
            if (results.compilationResult && results.compilationResult.output) {
                output += `Compilation Output:\n`;
                output += `\`\`\`\n`;
                const cleanOutput = results.compilationResult.output.replace(/\r/g, '');
                output += `${cleanOutput}\n`;
                output += `\`\`\`\n\n`;
            }
            
            // Ensure we have some output for compilation errors
            if (!output.trim()) {
                output = 'Compilation failed. Please check your syntax and try again.';
            }
        } else if (results.compilationResult && results.compilationResult.output) {
            output += `Compilation Output:\n`;
            output += `\`\`\`\n`;
            const cleanOutput = results.compilationResult.output
                .replace(/\r/g, '');
            
            output += `${cleanOutput}\n`;
            output += `\`\`\`\n\n`;
        }
        
        if (results.testResults && results.testResults.length > 0) {
            const failedOutputTest = results.testResults.find(test => 
                test.status === 'FAILED' && test.testName?.includes('Output Messages')
            );
            
            if (failedOutputTest && failedOutputTest.message?.includes('Missing outputs')) {
                const missing = failedOutputTest.message.match(/Missing outputs: (.+)/);
                if (missing) {
                    output += `Expected Output:\n`;
                    output += `${missing[1]}\n\n`;
                }
            }
        }
        
        // Display kernel coding style feedback
        if (results.feedback && results.feedback.length > 0) {
            const styleFeedback = results.feedback.find(f => f.type === 'style_guide');
            if (styleFeedback) {
                output += `\n📋 Maintainer's Review (Kernel Style Guide):\n`;
                
                if (styleFeedback.styleFeedback && styleFeedback.styleFeedback.length > 0) {
                    output += `\`\`\`diff\n`;
                    styleFeedback.styleFeedback.forEach(issue => {
                        if (issue.type === 'error') {
                            output += `- [ERROR] ${issue.message}\n`;
                        } else if (issue.type === 'warning') {
                            output += `! [WARNING] ${issue.message}\n`;
                        } else if (issue.type === 'check') {
                            output += `? [CHECK] ${issue.message}\n`;
                        }
                    });
                    output += `\`\`\`\n`;
                    output += `💡 *Style issues don't affect functionality but improve code maintainability*\n\n`;
                } else {
                    output += `✅ No style issues detected - code follows kernel coding standards!\n\n`;
                }
            }
        }
        
        return output;
    };

    const getFilteredProblems = () => {
        return problemBank.filter(problem => {
            const phaseMatch = problemFilters.phase === 'all' || problem.phase === problemFilters.phase;
            const difficultyMatch = problemFilters.difficulty === 'all' || problem.difficulty === parseInt(problemFilters.difficulty);
            const completedMatch = problemFilters.completed === 'all' || 
                (problemFilters.completed === 'completed' && completedChallenges.has(problem.id)) ||
                (problemFilters.completed === 'incomplete' && !completedChallenges.has(problem.id));
            
            return phaseMatch && difficultyMatch && completedMatch;
        });
    };

    const getNextAdaptiveChallenge = (currentPhase, userSkills) => {
        const phaseProblems = problemBank.filter(p => p.phase === currentPhase);
        if (phaseProblems.length === 0) return null;
        
        return phaseProblems[Math.floor(Math.random() * phaseProblems.length)];
    };

    const selectProblemFromBank = (problem) => {
        const problemCopy = {
            ...problem,
            files: problem.files ? deepCopyFiles(problem.files) : undefined
        };
        setCurrentChallenge(problemCopy);
        switchToTab('learning');
    };

    // Playground kernel module compilation
    const runPlaygroundCode = async () => {
        setPlayground(prev => ({
            ...prev,
            isRunning: true,
            output: '',
            compilationResult: null,
            testingResult: null
        }));

        let output = "=== Kernel Playground - Real Compilation ===\n";

        try {
            output += "Compiling Kernel\n";
            output += "May take 10-30 seconds\n\n";

            setPlayground(prev => ({ ...prev, output }));

            const response = await fetch(`${BACKEND_URL}/playground-compile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: playground.code,
                    moduleName: playground.moduleName
                })
            });

            const result = await response.json();

            if (result.success) {
                output += "Kernel module compilation successful\n\n";
                output += "=== Compilation Output ===\n";
                output += result.compilation.output + "\n";

                output += "\n=== QEMU Virtual Machine Testing ===\n";
                if (result.testing) {
                    output += "Start :\n\n";

                    if (result.testing.success) {
                        output += "QEMU Testing: Success\n\n";
                    } else {
                        output += "QEMU Testing: Failed\n\n";
                    }

                    output += "=== Complete QEMU Output ===\n";
                    const fullOutput = result.testing.output || result.testing.dmesg || "";
                    if (fullOutput) {
                        output += fullOutput + "\n";
                    } else {
                        output += "No QEMU output received\n";
                    }

                    if (result.testing.dmesg && result.testing.dmesg !== result.testing.output) {
                        output += "\n=== DMESG Output ===\n";
                        output += result.testing.dmesg + "\n";
                    }

                } else {
                    output += "No testing results received from backend\n";
                }

                setPlayground(prev => ({
                    ...prev,
                    compilationResult: result.compilation,
                    testingResult: result.testing
                }));

            } else {
                if (result.stage === 'security_check') {
                    output += "🚫 SECURITY CHECK FAILED\n";
                    output += `❌ ${result.error}\n\n`;
                    output += "📋 Security policies protect against malicious code.\n";
                    output += "💡 Focus on legitimate kernel module functionality.\n";
                } else if (result.stage === 'compilation') {
                    output += "❌ REAL COMPILATION FAILED\n\n";
                    output += "=== GCC Compiler Output ===\n";
                    output += result.output || result.error;
                    output += "\n\n💡 Fix the compilation errors and try again.\n";
                    output += "This is real GCC output with kernel headers!\n";
                } else {
                    // Playground compilation failed - show compilation output
                    output += "❌ Compilation failed\n\n";

                    // Get error from compilation.output or fallback to error field
                    const errorOutput = result.compilation?.output || result.output || result.error || "Unknown compilation error";
                    output += errorOutput;

                    if (!errorOutput.includes('make') && !errorOutput.includes('error:')) {
                        output += "\n\n💡 Fix the compilation errors and try again.";
                    }
                }
            }

        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                output += "🔌 BACKEND CONNECTION ERROR\n\n";
                output += "❌ Cannot connect to kernel compilation server.\n";
                output += "🔧 Backend URL: " + BACKEND_URL + "\n\n";
                output += "💡 Make sure the backend server is running:\n";
                output += "   cd backend && npm start\n\n";
                output += "⚠️ Using simplified local validation instead...\n\n";
            } else {
                output += "❌ UNEXPECTED ERROR\n\n";
                output += error.message + "\n\n";
                output += "💡 This might be a network or server issue.\n";
            }

            // Simple local validation as fallback
            if (playground.code.includes('printk')) {
                output += "✅ Local Check: printk() detected - good!\n";
            }
            if (playground.code.includes('MODULE_LICENSE')) {
                output += "✅ Local Check: MODULE_LICENSE found - good!\n";
            }
            if (!playground.code.includes('module_init') && !playground.code.includes('__init')) {
                output += "⚠️ Local Check: Missing module_init or __init function\n";
            }
        }

        setPlayground(prev => ({
            ...prev,
            isRunning: false,
            output
        }));
    };

    const runCode = async () => {
        if (!currentChallenge) return;

        setCodeEditor(prev => ({ ...prev, isRunning: true, output: '', testResults: [], overallResult: null, feedback: [] }));

        const codeOrFiles = codeEditor.files && codeEditor.files.length > 0 ? 
            codeEditor.files : 
            codeEditor.code;
        
        const problemId = currentChallenge.problemId || currentChallenge.id;

        try {
            const leetCodeResults = await runLeetCodeStyleValidation(codeOrFiles, problemId);
            
            const formattedOutput = formatLeetCodeResults(leetCodeResults, debugMode);
            
            setCodeEditor(prev => ({
                ...prev,
                isRunning: false,
                output: formattedOutput || 'No output available',
                testResults: leetCodeResults.testResults || [],
                overallResult: leetCodeResults.overallResult,
                feedback: leetCodeResults.feedback
            }));

            if (leetCodeResults.overallResult === 'ACCEPTED') {
                handleChallengeComplete(currentChallenge.id, true);
                if (currentChallenge.multiPart?.nextProblemId) {
                    setTimeout(() => {
                        generateNewChallenge(); // Or load next part
                    }, 2000);
                }
            }
        } catch (error) {
            setCodeEditor(prev => ({
                ...prev,
                isRunning: false,
                output: `❌ Validation Error: ${error.message}`,
                testResults: []
            }));
        }
    };


    // Enhanced progress tracking with unlimited depth
    const handleChallengeComplete = (challengeId, success) => {
        if (!success || completedChallenges.has(challengeId)) return;

        const newCompleted = new Set(completedChallenges);
        newCompleted.add(challengeId);
        setCompletedChallenges(newCompleted);

        if (currentChallenge) {
            // Calculate skill improvement with diminishing returns for balance
            const currentSkillLevel = userSkills[currentChallenge.phase]?.[currentChallenge.skill] || 0;
            const diminishingFactor = Math.max(0.1, 1 - currentSkillLevel);
            const baseImprovement = 0.03 + (currentChallenge.difficulty * 0.01);
            const skillImprovement = baseImprovement * diminishingFactor;

            // Update skills
            const newSkills = { ...userSkills };
            if (!newSkills[currentChallenge.phase]) {
                newSkills[currentChallenge.phase] = {};
            }
            newSkills[currentChallenge.phase][currentChallenge.skill] =
                Math.min(1.0, (newSkills[currentChallenge.phase][currentChallenge.skill] || 0) + skillImprovement);

            setUserSkills(newSkills);

            // Update profile with enhanced tracking (no level system)
            const newXP = userProfile.xp + currentChallenge.xp;
            const masteryBonus = Math.floor(skillImprovement * 1000); // Convert to mastery points

            const updatedProfile = {
                ...userProfile,
                xp: newXP,
                totalChallenges: userProfile.totalChallenges + 1,
                uniqueChallengesCompleted: userProfile.uniqueChallengesCompleted + 1,
                streak: userProfile.streak + 1,
                masteryPoints: userProfile.masteryPoints + masteryBonus
            };

            setUserProfile(updatedProfile);
            
            // Store updated progress in localStorage via useAuth
            updateProgress({
                currentPhase: currentChallenge.phase,
                totalXp: newXP,
                problemsSolved: userProfile.uniqueChallengesCompleted + 1,
                streak: userProfile.streak + 1,
                masteryPoints: userProfile.masteryPoints + masteryBonus,
                skills: newSkills
            });

            // Add to challenge history
            setChallengeHistory(prev => [...prev, {
                ...currentChallenge,
                completedAt: Date.now(),
                xpEarned: currentChallenge.xp,
                skillImprovement: skillImprovement
            }].slice(-50)); // Keep last 50 challenges

            // Record problem completion in database if authenticated
            if (isAuthenticated && user) {
                const problemData = {
                    problemId: challengeId,
                    phase: currentChallenge.phase,
                    difficulty: currentChallenge.difficulty,
                    xpEarned: currentChallenge.xp,
                    skillImprovement: skillImprovement,
                    codeSubmitted: codeEditor.files || codeEditor.code,
                    testResults: codeEditor.testResults || [],
                    executionTime: codeEditor.executionTime || 0
                };
                
                recordProblemCompletion(problemData).catch(error => {
                    console.warn('Failed to record problem completion:', error);
                });

                // Also sync updated progress to database
                const updatedProgress = {
                    currentPhase: currentChallenge.phase,
                    totalXp: newXP,
                    problemsSolved: userProfile.uniqueChallengesCompleted + 1,
                    streak: userProfile.streak + 1,
                    masteryPoints: userProfile.masteryPoints + masteryBonus,
                    skills: userSkills
                };

                makeAuthenticatedRequest(`/api/user/${user.id}/progress`, {
                    method: 'PUT',
                    body: JSON.stringify(updatedProgress)
                }).catch(error => {
                    console.warn('Failed to sync progress to database:', error);
                });
            }
        }
    };


    // Format validation results for display



    const getProblemStats = () => {
        const total = problemBank.length;
        const completed = problemBank.filter(p => completedChallenges.has(p.id)).length;
        const byPhase = {};
        const byDifficulty = {};
        
        problemBank.forEach(p => {
            // Count by phase
            if (!byPhase[p.phase]) byPhase[p.phase] = { total: 0, completed: 0 };
            byPhase[p.phase].total++;
            if (completedChallenges.has(p.id)) byPhase[p.phase].completed++;
            
            // Count by difficulty
            if (!byDifficulty[p.difficulty]) byDifficulty[p.difficulty] = { total: 0, completed: 0 };
            byDifficulty[p.difficulty].total++;
            if (completedChallenges.has(p.id)) byDifficulty[p.difficulty].completed++;
        });
        
        return { total, completed, byPhase, byDifficulty };
    };

    // Generate new challenge - now supports problemBank
    const generateNewChallenge = () => {
        // Prevent race conditions with debouncing
        if (isGeneratingChallenge) {
            console.log('🚫 Challenge generation already in progress, skipping...');
            return;
        }
        
        setIsGeneratingChallenge(true);
        
        try {
            const challenge = getNextAdaptiveChallenge();
            
            // Add null check to prevent race condition errors
            if (!challenge) {
                console.warn('⚠️  No challenge available for current phase:', userProfile.currentPhase);
                console.warn('📊 Problem bank has', problemBank.length, 'problems');
                
                // Set a fallback state instead of crashing
                setCurrentChallenge(null);
                setCodeEditor({
                    code: '// No challenges available for the current phase\n// Please check back later or contact support',
                    output: '',
                    isRunning: false,
                    testResults: []
                });
                return;
            }
            
            // Create a deep copy of the challenge to prevent mutation of the original
            const challengeCopy = {
                ...challenge,
                files: challenge.files ? deepCopyFiles(challenge.files) : undefined
            };
            
            console.log('Generated new challenge:', challenge.title, 'with', challenge.files?.length || 0, 'files');
            
            setCurrentChallenge(challengeCopy);
            setCodeEditor({
                code: challenge.starter || '// Challenge starter code not available',
                output: '',
                isRunning: false,
                testResults: []
            });
            setShowHints(false);
            setGenerationSeed(Date.now()); // Update seed for variety
        } finally {
            // Reset the debouncing flag after a short delay
            setTimeout(() => {
                setIsGeneratingChallenge(false);
            }, 500);
        }
    };

    // Initialize with phase selection or first challenge
    useEffect(() => {
        if (userProfile.currentPhase === null) {
            setShowPhaseSelector(true);
        } else if (!currentChallenge) {
            generateNewChallenge();
        }
    }, [userProfile.currentPhase]);

    // Load solved problems when user is authenticated (including on page reload)
    useEffect(() => {
        const loadSolvedProblems = async () => {
            console.log('🔍 useEffect triggered:', { isAuthenticated, userId: user?.id, authLoading });
            
            if (isAuthenticated && user && !authLoading) {
                try {
                    console.log('🔄 Loading solved problems from database for user:', user.id);
                    const solvedProblems = await getSolvedProblems();
                    console.log('📥 Raw solved problems from API:', solvedProblems);
                    
                    if (solvedProblems && solvedProblems.length > 0) {
                        // Convert string IDs to numbers to match the problem bank format
                        const solvedProblemIds = new Set(
                            solvedProblems.map(p => {
                                const numericId = parseInt(p.problem_id);
                                console.log(`🔄 Converting problem_id "${p.problem_id}" to ${numericId}`);
                                return numericId;
                            })
                        );
                        console.log('📊 Problem IDs to mark as completed:', Array.from(solvedProblemIds));
                        console.log(`📊 Loaded ${solvedProblemIds.size} completed challenges from database`);
                        setCompletedChallenges(solvedProblemIds);
                        console.log('✅ completedChallenges state updated');
                    } else {
                        console.log('📊 No solved problems found in database');
                        setCompletedChallenges(new Set());
                    }
                } catch (error) {
                    console.warn('❌ Failed to load solved problems from database:', error);
                }
            } else if (!isAuthenticated) {
                // Clear completed challenges when user is not authenticated
                console.log('👤 User not authenticated, clearing completed challenges');
                setCompletedChallenges(new Set());
            }
        };

        loadSolvedProblems();
    }, [isAuthenticated, user, authLoading]);

    // Sync userProgress from localStorage to userProfile on page load
    useEffect(() => {
        if (isAuthenticated && userProgress && !authLoading) {
            console.log('🔄 Syncing userProgress to userProfile on page load:', userProgress);
            setUserProfile(prev => ({
                ...prev,
                xp: userProgress.totalXp || prev.xp,
                uniqueChallengesCompleted: userProgress.problemsSolved || prev.uniqueChallengesCompleted,
                streak: userProgress.streak || prev.streak,
                masteryPoints: userProgress.masteryPoints || prev.masteryPoints,
                currentPhase: userProgress.currentPhase || prev.currentPhase
            }));
        }
    }, [isAuthenticated, userProgress, authLoading]);

    // Phase selection handler
    const selectPhase = (phaseKey) => {
        setUserProfile(prev => ({ ...prev, currentPhase: phaseKey }));
        setShowPhaseSelector(false);
        // Generate first challenge for the selected phase
        setTimeout(() => {
            generateNewChallenge();
        }, 100);
    };


    // Authentication handlers
    const handleLogin = async (userData, progressData, accessToken, refreshToken) => {
        console.log('🔗 handleLogin called with tokens:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken
        });
        login(userData, progressData, accessToken, refreshToken);
        setShowRegister(false);
        
        // Sync database progress with local state
        if (userData && progressData) {
            console.log('🔄 Syncing database progress with local state...');
            
            // Update local user profile with database values
            setUserProfile(prev => ({
                ...prev,
                xp: progressData.total_xp || prev.xp,
                uniqueChallengesCompleted: progressData.problems_solved || prev.uniqueChallengesCompleted,
                streak: progressData.streak || prev.streak,
                masteryPoints: progressData.mastery_points || prev.masteryPoints,
                currentPhase: progressData.current_phase || prev.currentPhase
            }));
            
            // Load solved problems from database and update completedChallenges set
            try {
                const response = await makeAuthenticatedRequest(`/api/user/${userData.id}/problems/solved`);
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.problems) {
                        // Convert string IDs to numbers to match the problem bank format
                        const solvedProblemIds = new Set(result.problems.map(p => parseInt(p.problem_id)));
                        console.log(`📊 Loaded ${solvedProblemIds.size} completed challenges from database`);
                        setCompletedChallenges(solvedProblemIds);
                    }
                }
            } catch (error) {
                console.warn('Failed to load solved problems from database:', error);
            }
        }
    };

    const handleLogout = () => {
        // Clear authentication state and localStorage
        logout();
        
        // Reset all user-related state using hook reset functions
        resetUserProfile(); // Resets userProfile, userSkills, completedChallenges
        resetCodeEditor();  // Resets codeEditor and playground
        
        // Clear remaining local state
        setCurrentChallenge(null);
        setChallengeHistory([]);
        setShowRegister(false);
    };

    const switchToRegister = () => {
        setShowRegister(true);
    };

    const switchToLogin = () => {
        setShowRegister(false);
    };

    // Show loading screen while checking authentication
    if (authLoading) {
        return (
            <div style={{
                ...premiumStyles.container,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    ...PremiumStyles.glass.medium,
                    padding: '2rem',
                    textAlign: 'center',
                    borderRadius: '20px',
                    border: `1px solid ${PremiumStyles.colors.border}`
                }}>
                    <h2 style={premiumStyles.headingLG}>Loading KernelQ...</h2>
                    <p style={premiumStyles.textSecondary}>Initializing your kernel development environment</p>
                </div>
            </div>
        );
    }

    // Show authentication screens if not authenticated
    if (!isAuthenticated) {
        if (showRegister) {
            return (
                <RegisterScreen 
                    onRegister={handleLogin}
                    onSwitchToLogin={switchToLogin}
                    premiumStyles={premiumStyles}
                />
            );
        }
        
        return (
            <LoginScreen 
                onLogin={handleLogin}
                onSwitchToRegister={switchToRegister}
                premiumStyles={premiumStyles}
            />
        );
    }

    // Return the main component JSX for authenticated users
    return (
        <div style={premiumStyles.container}>
            <NavigationBar
                getCurrentPhase={getCurrentPhase}
                phaseSystem={phaseSystem}
                premiumStyles={premiumStyles}
                user={user}
                onLogout={handleLogout}
            />

            <div style={premiumStyles.mainContent}>
                <Sidebar
                    userProfile={userProfile}
                    premiumStyles={premiumStyles}
                    user={user}
                    userProgress={userProgress}
                />

                {/* Main Content */}
                <div style={premiumStyles.contentArea}>
                    {/* Tab Navigation */}
                    <div style={premiumStyles.tabNav}>
                        {[
                            { id: 'learning', label: 'Current Challenge', icon: Target },
                            { id: 'problemBank', label: 'Problem Bank', icon: Book },
                            { id: 'playground', label: 'Code Playground', icon: Code },
                            { id: 'concepts', label: 'Concepts', icon: Lightbulb }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                style={{
                                    ...premiumStyles.tabItem,
                                    ...(activeTab === tab.id ? premiumStyles.tabItemActive : {}),
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    justifyContent: 'center'
                                }}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <tab.icon size={16} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'learning' && (
                        <ChallengeView
                            challenge={currentChallenge}
                            codeEditor={codeEditor}
                            onCodeChange={(codeOrFiles) => {
                                if (Array.isArray(codeOrFiles)) {
                                    // Validate that incoming files match current challenge to prevent stale data overwrite
                                    setCodeEditor(prev => {
                                        const incomingFileNames = codeOrFiles.map(f => f.name).sort().join(',');
                                        const challengeFileNames = currentChallenge?.files?.map(f => f.name).sort().join(',');

                                        // Only update if files match the current challenge
                                        if (incomingFileNames !== challengeFileNames) {
                                            console.warn('[KernelQ] Ignoring file update - files do not match current challenge');
                                            return prev;
                                        }

                                        return { ...prev, files: codeOrFiles };
                                    });
                                } else {
                                    setCodeEditor(prev => ({ ...prev, code: codeOrFiles }));
                                }
                            }}
                            onRun={runCode}
                            onReset={() => {
                                if (currentChallenge?.files && currentChallenge.files.length > 0) {
                                    setCodeEditor(prev => ({ 
                                        ...prev, 
                                        files: deepCopyFiles(currentChallenge.files) 
                                    }));
                                } else {
                                    setCodeEditor(prev => ({ ...prev, code: currentChallenge?.starter || '' }));
                                }
                            }}
                            onShowHints={() => setShowHints(!showHints)}
                            onShowConcepts={() => setShowLessons(!showLessons)}
                            setSelectedConcept={setSelectedConcept}
                            switchToTab={switchToTab}
                        />
                    )}

                    {activeTab === 'problemBank' && (
                        <ProblemBankTab
                            problems={getFilteredProblems()}
                            filters={problemFilters}
                            onFilterChange={(key, value) => {
                                if (key === 'reset') {
                                    setProblemFilters({ phase: 'all', difficulty: 'all', completed: 'all' });
                                } else {
                                    setProblemFilters(prev => ({ ...prev, [key]: value }));
                                }
                            }}
                            onSelectProblem={selectProblemFromBank}
                            completedChallenges={completedChallenges}
                            phaseSystem={phaseSystem}
                            getProblemStats={getProblemStats}
                        />
                    )}

                    {activeTab === 'concepts' && (
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            flex: 1,
                            minHeight: 0,
                            gap: '24px'
                        }}>
                            {/* Header */}
                            <div>
                                <h1 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 700,
                                    margin: 0,
                                    marginBottom: '8px',
                                    letterSpacing: '-0.02em',
                                    color: '#f5f5f7'
                                }}>
                                    Kernel Concepts
                                </h1>
                                <p style={{
                                    ...premiumStyles.textSecondary,
                                    margin: 0,
                                    fontSize: '0.9375rem'
                                }}>
                                    Master fundamental kernel programming concepts with interactive examples
                                </p>
                            </div>

                            {/* Concepts Grid */}
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                paddingRight: '8px',
                                marginRight: '-8px'
                            }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                    gap: '16px'
                                }}>
                                    {Object.entries(mdConcepts).map(([key, concept], index) => (
                                        <div
                                            key={key}
                                            style={{
                                                padding: '24px',
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                borderRadius: '20px',
                                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                animation: `fadeInUp 0.4s ease ${index * 0.05}s both`
                                            }}
                                            onClick={() => setSelectedConcept(concept)}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                                e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)';
                                                e.currentTarget.style.borderColor = 'rgba(191, 90, 242, 0.3)';
                                                e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4), 0 0 60px rgba(191, 90, 242, 0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            {/* Top accent line */}
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                height: '3px',
                                                background: 'linear-gradient(135deg, #bf5af2 0%, #0a84ff 100%)',
                                                opacity: 0.7
                                            }} />
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                marginBottom: '12px'
                                            }}>
                                                <Lightbulb size={16} color={PremiumStyles.colors.accentPurple} />
                                                <span style={{
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 600,
                                                    color: PremiumStyles.colors.accentPurple,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.08em'
                                                }}>
                                                    Concept
                                                </span>
                                            </div>
                                            <h3 style={{
                                                fontSize: '1.0625rem',
                                                fontWeight: 600,
                                                color: PremiumStyles.colors.text,
                                                margin: 0,
                                                marginBottom: '8px',
                                                letterSpacing: '-0.01em'
                                            }}>{concept.title}</h3>
                                            <p style={{
                                                fontSize: '0.8125rem',
                                                color: PremiumStyles.colors.textSecondary,
                                                lineHeight: 1.5,
                                                margin: 0,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}>{concept.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'playground' && (
                        <PlaygroundTab
                            playground={playground}
                            setPlayground={setPlayground}
                            runPlaygroundCode={runPlaygroundCode}
                            premiumStyles={premiumStyles}
                        />
                    )}
                </div>
            </div>

            {/* Concept Learning Modal */}
            {selectedConcept && (
                <ConceptLearner 
                    concept={selectedConcept} 
                    setSelectedConcept={setSelectedConcept} 
                />
            )}
        </div>
    );
};

export default UnlimitedKernelAcademy;
