const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

/**
 * KernelQ Database Manager
 * Using SQLite with WAL mode for optimal performance on Lima/openSUSE
 */
class KernelQDatabase {
    constructor(dbPath = null) {
        // Default to Lima VM path, fallback to local
        this.dbPath = dbPath || this.getDefaultDBPath();
        this.db = null;
        this.isInitialized = false;
    }

    getDefaultDBPath() {
        // Try Lima VM path first, then local fallback
        const limaPath = '/home/zerohexer/kernelq-data/db/kernelq.db';
        const localPath = path.join(__dirname, 'kernelq.db');
        
        try {
            // Check if Lima path exists and is writable
            const limaDir = path.dirname(limaPath);
            fs.accessSync(limaDir, fs.constants.W_OK);
            return limaPath;
        } catch (error) {
            console.log('📍 Using local database path:', localPath);
            return localPath;
        }
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            // Ensure database directory exists
            const dbDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            // Create database connection with optimizations
            this.db = new Database(this.dbPath);
            
            // Apply Linux/SQLite performance optimizations
            this.db.pragma('journal_mode = WAL');
            this.db.pragma('synchronous = NORMAL');
            this.db.pragma('cache_size = 10000');
            this.db.pragma('temp_store = memory');
            this.db.pragma('mmap_size = 134217728'); // 128MB
            this.db.pragma('optimize');

            console.log('🚀 SQLite optimizations applied:');
            console.log('   - WAL mode: Enabled');
            console.log('   - Cache: 10,000 pages');
            console.log('   - Memory temp store: Enabled');
            console.log('   - Memory map: 128MB');

            // Create tables
            this.createTables();
            
            // Create prepared statements for performance
            this.createPreparedStatements();

            this.isInitialized = true;
            console.log('✅ KernelQ database initialized:', this.dbPath);

        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    createTables() {
        const sql = `
            -- Users table
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                member_status TEXT DEFAULT 'Standard Free User' CHECK (member_status IN (
                    'Creator',
                    'Monthly Subscription User', 
                    'Standard Free User',
                    'Permanent User'
                )),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                is_active BOOLEAN DEFAULT true
            );

            -- User progress table
            CREATE TABLE IF NOT EXISTS user_progress (
                user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                current_phase TEXT DEFAULT 'foundations',
                total_xp INTEGER DEFAULT 0,
                problems_solved INTEGER DEFAULT 0,
                phase_completions TEXT DEFAULT '{}', -- JSON: {"foundations": 5, "kernel_core": 2}
                streak INTEGER DEFAULT 0,
                mastery_points INTEGER DEFAULT 0,
                skills TEXT DEFAULT '{}', -- JSON: skill levels by phase
                preferences TEXT DEFAULT '{}', -- JSON: UI preferences
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Solved problems table
            CREATE TABLE IF NOT EXISTS solved_problems (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                problem_id TEXT NOT NULL, -- "foundations/001", "kernel_core/056" etc.
                phase TEXT NOT NULL,
                difficulty INTEGER NOT NULL,
                xp_earned INTEGER NOT NULL,
                skill_improvement REAL DEFAULT 0.0,
                code_submitted TEXT,
                test_results TEXT, -- JSON: detailed test results
                solved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                execution_time INTEGER DEFAULT 0 -- milliseconds
            );

            -- Performance indexes
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_solved_problems_user_id ON solved_problems(user_id);
            CREATE INDEX IF NOT EXISTS idx_solved_problems_problem_id ON solved_problems(problem_id);
            CREATE INDEX IF NOT EXISTS idx_solved_problems_phase ON solved_problems(phase);
            CREATE INDEX IF NOT EXISTS idx_solved_problems_solved_at ON solved_problems(solved_at);
        `;

        this.db.exec(sql);
        console.log('📊 Database tables and indexes created');
    }

    createPreparedStatements() {
        // User management
        this.statements = {
            // User operations
            createUser: this.db.prepare(`
                INSERT INTO users (username, email, password_hash, member_status)
                VALUES (?, ?, ?, ?)
            `),
            
            getUserByEmail: this.db.prepare(`
                SELECT * FROM users WHERE email = ? AND is_active = true
            `),
            
            getUserByUsername: this.db.prepare(`
                SELECT * FROM users WHERE username = ? AND is_active = true
            `),
            
            getUserById: this.db.prepare(`
                SELECT * FROM users WHERE id = ? AND is_active = true
            `),
            
            updateLastLogin: this.db.prepare(`
                UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
            `),

            // Progress operations
            createUserProgress: this.db.prepare(`
                INSERT INTO user_progress (user_id) VALUES (?)
            `),
            
            getUserProgress: this.db.prepare(`
                SELECT * FROM user_progress WHERE user_id = ?
            `),
            
            updateUserProgress: this.db.prepare(`
                UPDATE user_progress SET 
                    current_phase = ?,
                    total_xp = ?,
                    problems_solved = ?,
                    phase_completions = ?,
                    streak = ?,
                    mastery_points = ?,
                    skills = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            `),

            // Problem completion operations
            addSolvedProblem: this.db.prepare(`
                INSERT INTO solved_problems (
                    user_id, problem_id, phase, difficulty, xp_earned, 
                    skill_improvement, code_submitted, test_results, execution_time
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `),
            
            getSolvedProblems: this.db.prepare(`
                SELECT * FROM solved_problems WHERE user_id = ? ORDER BY solved_at DESC
            `),
            
            getSolvedProblemsByPhase: this.db.prepare(`
                SELECT * FROM solved_problems WHERE user_id = ? AND phase = ? ORDER BY solved_at DESC
            `),
            
            checkProblemSolved: this.db.prepare(`
                SELECT COUNT(*) as count FROM solved_problems WHERE user_id = ? AND problem_id = ?
            `),

            // Statistics
            getUserStats: this.db.prepare(`
                SELECT 
                    COUNT(*) as total_problems,
                    SUM(xp_earned) as total_xp,
                    AVG(execution_time) as avg_execution_time,
                    MAX(solved_at) as last_solved
                FROM solved_problems 
                WHERE user_id = ?
            `),

            getPhaseStats: this.db.prepare(`
                SELECT 
                    phase,
                    COUNT(*) as problems_count,
                    SUM(xp_earned) as phase_xp,
                    AVG(difficulty) as avg_difficulty
                FROM solved_problems 
                WHERE user_id = ? 
                GROUP BY phase
            `)
        };

        console.log('⚡ Prepared statements created for optimal performance');
    }

    // User Management Methods
    async createUser(username, email, passwordHash, memberStatus = 'Standard Free User') {
        try {
            const result = this.statements.createUser.run(username, email, passwordHash, memberStatus);
            const userId = result.lastInsertRowid;
            
            // Create user progress record
            this.statements.createUserProgress.run(userId);
            
            return { success: true, userId };
        } catch (error) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return { success: false, error: 'Username or email already exists' };
            }
            throw error;
        }
    }

    async authenticateUser(email, passwordHash) {
        const user = this.statements.getUserByEmail.get(email);
        if (!user || user.password_hash !== passwordHash) {
            return { success: false, error: 'Invalid credentials' };
        }
        
        // Update last login
        this.statements.updateLastLogin.run(user.id);
        
        return { success: true, user };
    }

    // Progress Management Methods
    async getUserProgress(userId) {
        return this.statements.getUserProgress.get(userId);
    }

    async updateUserProgress(userId, progressData) {
        const {
            currentPhase = 'foundations',
            totalXp = 0,
            problemsSolved = 0,
            phaseCompletions = '{}',
            streak = 0,
            masteryPoints = 0,
            skills = '{}'
        } = progressData;

        return this.statements.updateUserProgress.run(
            currentPhase,
            totalXp,
            problemsSolved,
            JSON.stringify(phaseCompletions),
            streak,
            masteryPoints,
            JSON.stringify(skills),
            userId
        );
    }

    // Problem Completion Methods
    async recordProblemSolution(userId, problemData) {
        const {
            problemId,
            phase,
            difficulty,
            xpEarned,
            skillImprovement = 0.0,
            codeSubmitted = '',
            testResults = {},
            executionTime = 0
        } = problemData;

        // Validate and sanitize parameters for SQLite
        const sanitizedParams = {
            userId: typeof userId === 'number' ? userId : parseInt(userId) || null,
            problemId: typeof problemId === 'string' ? problemId : String(problemId || ''),
            phase: typeof phase === 'string' ? phase : String(phase || ''),
            difficulty: typeof difficulty === 'number' ? difficulty : parseInt(difficulty) || 0,
            xpEarned: typeof xpEarned === 'number' ? xpEarned : parseInt(xpEarned) || 0,
            skillImprovement: typeof skillImprovement === 'number' ? skillImprovement : parseFloat(skillImprovement) || 0.0,
            codeSubmitted: typeof codeSubmitted === 'string' ? codeSubmitted : String(codeSubmitted || ''),
            testResults: typeof testResults === 'string' ? testResults : JSON.stringify(testResults || {}),
            executionTime: typeof executionTime === 'number' ? executionTime : parseInt(executionTime) || 0
        };

        // Validate required parameters
        if (!sanitizedParams.userId || !sanitizedParams.problemId || !sanitizedParams.phase) {
            return { success: false, error: 'Missing required parameters: userId, problemId, or phase' };
        }

        // Check if already solved
        const existing = this.statements.checkProblemSolved.get(sanitizedParams.userId, sanitizedParams.problemId);
        if (existing.count > 0) {
            return { success: false, error: 'Problem already solved' };
        }

        try {
            return this.statements.addSolvedProblem.run(
                sanitizedParams.userId,
                sanitizedParams.problemId,
                sanitizedParams.phase,
                sanitizedParams.difficulty,
                sanitizedParams.xpEarned,
                sanitizedParams.skillImprovement,
                sanitizedParams.codeSubmitted,
                sanitizedParams.testResults,
                sanitizedParams.executionTime
            );
        } catch (error) {
            console.error('❌ SQLite binding error in recordProblemSolution:', error);
            console.error('📊 Parameters:', sanitizedParams);
            return { success: false, error: `Database error: ${error.message}` };
        }
    }

    async getUserSolvedProblems(userId, phase = null) {
        if (phase) {
            return this.statements.getSolvedProblemsByPhase.all(userId, phase);
        }
        return this.statements.getSolvedProblems.all(userId);
    }

    // Statistics Methods
    async getUserStatistics(userId) {
        const stats = this.statements.getUserStats.get(userId);
        const phaseStats = this.statements.getPhaseStats.all(userId);
        
        return {
            ...stats,
            phaseBreakdown: phaseStats
        };
    }

    // Database Maintenance
    async backup() {
        const backupPath = this.dbPath.replace('.db', `_backup_${Date.now()}.db`);
        this.db.backup(backupPath);
        console.log('💾 Database backed up to:', backupPath);
        return backupPath;
    }

    async optimize() {
        this.db.pragma('optimize');
        this.db.pragma('wal_checkpoint(TRUNCATE)');
        console.log('🔧 Database optimized');
    }

    close() {
        if (this.db) {
            this.db.close();
            console.log('🔒 Database connection closed');
        }
    }
}

// Singleton instance
let dbInstance = null;

function getDatabase() {
    if (!dbInstance) {
        dbInstance = new KernelQDatabase();
    }
    return dbInstance;
}

async function initializeDatabase() {
    const db = getDatabase();
    await db.initialize();
    return db;
}

module.exports = {
    KernelQDatabase,
    getDatabase,
    initializeDatabase
};