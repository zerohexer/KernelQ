import { useState } from 'react';

const useUserProfile = () => {
    const [userProfile, setUserProfile] = useState({
        xp: 0,
        streak: 0,
        totalChallenges: 0,
        currentPhase: null, // User will choose their starting phase
        masteryPoints: 0,
        challengesGenerated: 0,
        uniqueChallengesCompleted: 0
    });

    // Detailed skill tracking with sub-skills for unlimited depth
    const [userSkills, setUserSkills] = useState({
        foundations: {
            cBasics: 0.0,
            pointers: 0.0,
            structures: 0.0,
            memoryBasics: 0.0
        },
        kernelCore: {
            moduleSystem: 0.0,
            userKernelSpace: 0.0,
            systemCalls: 0.0,
            kernelAPI: 0.0
        },
        memoryMgmt: {
            allocation: 0.0,
            dmaBuffers: 0.0,
            memoryMapping: 0.0,
            pageManagement: 0.0
        },
        synchronization: {
            atomics: 0.0,
            spinlocks: 0.0,
            mutexes: 0.0,
            rcu: 0.0
        },
        drivers: {
            characterDev: 0.0,
            blockDev: 0.0,
            networkDev: 0.0,
            pciHandling: 0.0
        },
        advanced: {
            debugging: 0.0,
            performance: 0.0,
            security: 0.0,
            architecture: 0.0
        }
    });

    const [completedChallenges, setCompletedChallenges] = useState(new Set());

    const getCurrentPhase = () => {
        return userProfile.currentPhase || 'foundations';
    };

    const updateUserXP = (xpGain) => {
        setUserProfile(prev => ({
            ...prev,
            xp: prev.xp + xpGain,
            totalChallenges: prev.totalChallenges + 1
        }));
    };

    const updateSkill = (category, skill, improvement) => {
        setUserSkills(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                [skill]: Math.min(1.0, prev[category][skill] + improvement)
            }
        }));
    };

    const markChallengeCompleted = (challengeId) => {
        setCompletedChallenges(prev => new Set([...prev, challengeId]));
        updateUserXP(50); // Standard XP gain
    };

    return {
        userProfile,
        setUserProfile,
        userSkills,
        setUserSkills,
        completedChallenges,
        setCompletedChallenges,
        getCurrentPhase,
        updateUserXP,
        updateSkill,
        markChallengeCompleted
    };
};

export default useUserProfile;