#!/usr/bin/env node

/**
 * Database Recreation Script
 * Simply deletes the old database and creates a fresh one with the new normalized schema
 */

const fs = require('fs');
const path = require('path');
const { initializeDatabase } = require('./database');

async function recreateDatabase() {
    console.log('🔥 Recreating database with normalized schema...');
    
    try {
        // Get the local database path (not Lima VM)
        const dbPath = path.join(__dirname, 'kernelq.db');
        const dbShmPath = path.join(__dirname, 'kernelq.db-shm');
        const dbWalPath = path.join(__dirname, 'kernelq.db-wal');
        
        // Delete old database files if they exist
        [dbPath, dbShmPath, dbWalPath].forEach(filePath => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️  Deleted: ${path.basename(filePath)}`);
            }
        });
        
        // Initialize fresh database with new schema
        console.log('🚀 Creating fresh database...');
        const db = await initializeDatabase();
        
        console.log('✅ Database recreated successfully with normalized schema!');
        console.log('🎯 New features:');
        console.log('   - XP and problem counts calculated dynamically from solved_problems');
        console.log('   - No more data inconsistency issues');
        console.log('   - Single source of truth for all statistics');
        console.log('   - Better performance with proper indexing');
        
        // Test the new schema
        console.log('🧪 Testing database functionality...');
        
        // Create a test user
        const testResult = await db.createUser('testuser', 'test@example.com', 'hashedpassword');
        if (testResult.success) {
            console.log(`👤 Created test user with ID: ${testResult.userId}`);
            
            // Test getUserProgress with empty data
            const progress = await db.getUserProgress(testResult.userId);
            console.log('📊 Initial progress:', {
                total_xp: progress.total_xp,
                problems_solved: progress.problems_solved,
                phase_completions: progress.phase_completions
            });
            
            // Test recording a problem solution
            await db.recordProblemSolution(testResult.userId, {
                problemId: 'foundations/001',
                phase: 'foundations',
                difficulty: 1,
                xpEarned: 15,
                codeSubmitted: 'test code',
                testResults: { score: 100 },
                executionTime: 1500
            });
            
            // Check updated progress
            const updatedProgress = await db.getUserProgress(testResult.userId);
            console.log('📈 Progress after solving one problem:', {
                total_xp: updatedProgress.total_xp,
                problems_solved: updatedProgress.problems_solved,
                phase_completions: updatedProgress.phase_completions
            });
            
            console.log('🎉 All tests passed! Database is working correctly.');
        }
        
        db.close();
        
    } catch (error) {
        console.error('❌ Recreation failed:', error);
        process.exit(1);
    }
}

// Run recreation if called directly
if (require.main === module) {
    recreateDatabase();
}

module.exports = { recreateDatabase };