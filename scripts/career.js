/**
 * Rob the Runner - Career Mode System
 * Handles player progression, statistics, and career development
 */

// Player career data
window.playerStats = {
    age: 16,
    season: 'Spring 2023',
    year: 1,
    speed: 5,
    endurance: 3,
    technique: 4,
    strength: 3,
    experience: 0,
    level: 1,
    records: {
        sprint: { time: 12.5, position: 5 },
        mile: { time: 312.7, position: 8 },
        country: { time: 780.4, position: 6 }
    },
    seasonResults: [],
    careerHighlights: [],
    totalRaces: 0,
    wins: 0
};

// Race records
const recordTimes = {
    sprint: { 
        worldRecord: 9.58,
        highSchool: 10.3,
        college: 9.9,
        amateur: 10.1,
        professional: 9.7
    },
    mile: {
        worldRecord: 223.0, // 3:43.00
        highSchool: 241.0,  // 4:01.00
        college: 231.0,     // 3:51.00
        amateur: 236.0,     // 3:56.00
        professional: 227.0 // 3:47.00
    },
    country: {
        worldRecord: 480.0, // 8:00.00 (5k)
        highSchool: 550.0,  // 9:10.00
        college: 510.0,     // 8:30.00
        amateur: 530.0,     // 8:50.00
        professional: 495.0 // 8:15.00
    }
};

// Seasons and competition levels
const SEASONS = ['Winter', 'Spring', 'Summer', 'Fall'];
const COMPETITION_LEVELS = ['High School', 'College', 'Amateur', 'Professional', 'Olympic'];

// Meet types within a season (in order of progression)
const MEET_TYPES = ['Home', 'Rival', 'Districts', 'Conference', 'State'];

// Current career state
let currentCompetitionLevel = 0; // 0 = High School
let currentYearInLevel = 1;      // First year
let currentSeasonIndex = 1;      // Start in Spring
let currentMeetIndex = 0;        // Start with Home meet

// Initialize career system
document.addEventListener('DOMContentLoaded', () => {
    // Load career data if exists
    loadCareerData();
    
    // Update UI
    updateCareerUI();
});

// Load existing career data from localStorage
function loadCareerData() {
    const savedData = localStorage.getItem('robRunnerCareer');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            window.playerStats = parsedData;
            
            // Determine competition level and season based on saved data
            determineCompetitionLevel();
        } catch (e) {
            console.error('Error loading career data:', e);
        }
    }
}

// Save career data to localStorage
function saveCareerData() {
    try {
        localStorage.setItem('robRunnerCareer', JSON.stringify(window.playerStats));
    } catch (e) {
        console.error('Error saving career data:', e);
    }
}

// Determine competition level based on player age and stats
function determineCompetitionLevel() {
    const { age } = window.playerStats;
    
    if (age < 18) {
        currentCompetitionLevel = 0; // High School
    } else if (age < 22) {
        currentCompetitionLevel = 1; // College
    } else if (age < 25 || window.playerStats.experience < 5000) {
        currentCompetitionLevel = 2; // Amateur
    } else {
        currentCompetitionLevel = 3; // Professional
    }
    
    // Determine year within level
    if (currentCompetitionLevel === 0) { // High School
        currentYearInLevel = Math.min(4, Math.max(1, age - 14)); // 9th-12th grade
    } else if (currentCompetitionLevel === 1) { // College
        currentYearInLevel = Math.min(4, Math.max(1, age - 18)); // Freshman-Senior 
    } else {
        // For amateur and professional, use years since entering level
        currentYearInLevel = 1; // Default to 1, adjusted by career progress
    }
}

// Update career UI elements
function updateCareerUI() {
    const levelName = COMPETITION_LEVELS[currentCompetitionLevel];
    const yearText = currentYearInLevel === 1 ? '1st' : 
                    currentYearInLevel === 2 ? '2nd' :
                    currentYearInLevel === 3 ? '3rd' : '4th';
    
    // Calculate year (2023 + elapsed years)
    const year = 2023 + window.playerStats.year - 1;
    
    // Update season display
    window.playerStats.season = `${SEASONS[currentSeasonIndex]} ${year} (${yearText} Year ${levelName})`;
    
    // Update UI elements if they exist
    if (document.getElementById('player-age')) {
        document.getElementById('player-age').textContent = window.playerStats.age;
    }
    if (document.getElementById('current-season')) {
        document.getElementById('current-season').textContent = window.playerStats.season;
    }
    if (document.getElementById('player-speed')) {
        document.getElementById('player-speed').textContent = window.playerStats.speed;
    }
    if (document.getElementById('player-endurance')) {
        document.getElementById('player-endurance').textContent = window.playerStats.endurance;
    }
    
    // Update meet type display if it exists
    if (document.getElementById('current-meet')) {
        document.getElementById('current-meet').textContent = getCurrentMeetName();
    }
}

// Record results of a race
function recordRaceResult(raceType, time, position) {
    // Add race to season results
    window.playerStats.seasonResults.push({
        type: raceType,
        time,
        position,
        season: window.playerStats.season,
        meet: getCurrentMeetName()
    });
    
    // Update stats
    window.playerStats.totalRaces++;
    if (position === 1) window.playerStats.wins++;
    
    // Check if this is a personal record
    const currentRecord = window.playerStats.records[raceType];
    let isNewRecord = false;
    
    if (!currentRecord || time < currentRecord.time) {
        window.playerStats.records[raceType] = { 
            time, 
            position,
            meet: getCurrentMeetName()
        };
        isNewRecord = true;
        
        // Add to career highlights if significant improvement or first race
        if (!currentRecord || (currentRecord.time - time) > currentRecord.time * 0.05) {
            window.playerStats.careerHighlights.push({
                event: `New ${raceType} record: ${formatTime(time)} at ${getCurrentMeetName()}`,
                season: window.playerStats.season
            });
        }
    }
    
    // Add experience based on performance
    const experienceGained = calculateExperienceGained(raceType, position, time);
    window.playerStats.experience += experienceGained;
    
    // Level up if enough experience (100 exp per level)
    if (window.playerStats.experience >= window.playerStats.level * 100) {
        levelUp();
    }
    
    // Save career data
    saveCareerData();
    
    return {
        isNewRecord,
        experienceGained
    };
}

// Calculate experience gained from a race
function calculateExperienceGained(raceType, position, time) {
    // Base experience from completing a race
    let experience = 10;
    
    // Bonus for good positioning (more for higher positions)
    experience += Math.max(0, 11 - position) * 2;
    
    // Bonus for good time relative to level records
    const competitionLevel = COMPETITION_LEVELS[currentCompetitionLevel].toLowerCase();
    const levelRecord = recordTimes[raceType][competitionLevel];
    
    if (time <= levelRecord) {
        // Beating the level record is huge!
        experience += 50;
    } else {
        // Smaller bonus the closer you are to the record
        const timeRatio = levelRecord / time;
        experience += Math.floor((timeRatio * timeRatio) * 30);
    }
    
    // Bonus experience based on meet importance
    // More important meets (higher index) give more XP
    const meetImportanceBonus = currentMeetIndex * 5;
    experience += meetImportanceBonus;
    
    // Extra bonus for State/Nationals/Championship meets (last meet in season)
    if (currentMeetIndex === MEET_TYPES.length - 1) {
        experience += 15;
    }
    
    return experience;
}

// Player level up
function levelUp() {
    window.playerStats.level++;
    
    // Stat improvements
    const statImprovement = Math.floor(Math.random() * 2) + 1; // 1-2 points
    const statToImprove = ['speed', 'endurance', 'technique', 'strength'][Math.floor(Math.random() * 4)];
    
    window.playerStats[statToImprove] += statImprovement;
    
    // Cap stats at 10
    if (window.playerStats[statToImprove] > 10) window.playerStats[statToImprove] = 10;
    
    // Add career highlight
    window.playerStats.careerHighlights.push({
        event: `Level up to level ${window.playerStats.level}! Improved ${statToImprove} by ${statImprovement}.`,
        season: window.playerStats.season
    });
    
    // Update UI
    updateCareerUI();
}

// Progress to next season
function advanceToNextSeason() {
    currentSeasonIndex = (currentSeasonIndex + 1) % 4;
    
    // If we've completed all four seasons, advance the year
    if (currentSeasonIndex === 0) {
        window.playerStats.year++;
        window.playerStats.age = Math.floor(16 + (window.playerStats.year - 1) / 4);
        
        // Advance year in competition level
        currentYearInLevel++;
        
        // Check for graduation to next competition level
        if ((currentCompetitionLevel === 0 && currentYearInLevel > 4) || // High school is 4 years
            (currentCompetitionLevel === 1 && currentYearInLevel > 4)) { // College is 4 years
            currentCompetitionLevel++;
            currentYearInLevel = 1;
            
            // Add career highlight for advancement
            window.playerStats.careerHighlights.push({
                event: `Advanced to ${COMPETITION_LEVELS[currentCompetitionLevel]} level!`,
                season: `${SEASONS[currentSeasonIndex]} ${2023 + window.playerStats.year - 1}`
            });
        }
    }
    
    // Update the UI
    updateCareerUI();
    
    // Save career data
    saveCareerData();
}

// Advance to the next meet in the season
function advanceToNextMeet() {
    currentMeetIndex++;
    
    // If we've completed all meets in a season, advance to next season
    if (currentMeetIndex >= MEET_TYPES.length) {
        currentMeetIndex = 0;
        advanceToNextSeason();
        return true; // Indicates season changed
    }
    
    updateCareerUI();
    saveCareerData();
    return false; // Season did not change
}

// Get current meet name with competition level context
function getCurrentMeetName() {
    const meetName = MEET_TYPES[currentMeetIndex];
    
    // Adjust meet names for different competition levels
    if (currentCompetitionLevel === 0) { // High School
        return `${meetName} Meet`;
    } else if (currentCompetitionLevel === 1) { // College
        if (meetName === 'State') return 'Nationals';
        return `${meetName} Meet`;
    } else if (currentCompetitionLevel === 2) { // Amateur
        if (meetName === 'Home') return 'Local Meet';
        if (meetName === 'Rival') return 'Regional Meet';
        if (meetName === 'Districts') return 'Sectionals';
        if (meetName === 'Conference') return 'Nationals';
        if (meetName === 'State') return 'International Open';
    } else if (currentCompetitionLevel === 3) { // Professional
        if (meetName === 'Home') return 'Diamond League';
        if (meetName === 'Rival') return 'Grand Prix';
        if (meetName === 'Districts') return 'Continental Championship';
        if (meetName === 'Conference') return 'World Championship';
        if (meetName === 'State') return 'Olympic Trials';
    } else { // Olympic
        return 'Olympic Games';
    }
    
    return `${meetName} Meet`;
}

// Format time for display (seconds to MM:SS.ms or SS.ms)
function formatTime(timeInSeconds) {
    if (timeInSeconds < 60) {
        // For sprint times like 10.42 seconds
        return timeInSeconds.toFixed(2) + 's';
    } else {
        // For longer times like 3:45.22
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        const ms = Math.floor((timeInSeconds % 1) * 100);
        
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }
}

// Get competition details based on race type
function getCompetitionDetails(raceType) {
    // Determine difficulty based on competition level
    const levelKey = COMPETITION_LEVELS[currentCompetitionLevel].toLowerCase();
    
    // Get competitor skill levels - now adjusted by meet type as well
    const meetDifficultyFactor = currentMeetIndex / (MEET_TYPES.length - 1); // 0 to 1 based on meet progression
    const avgCompetitorSkill = 3 + currentCompetitionLevel * 1.5 + (meetDifficultyFactor * 2);
    const skillVariance = 1.5 - (currentCompetitionLevel * 0.2) - (meetDifficultyFactor * 0.2);
    
    // Number of competitors increases with meet importance
    const competitorCount = Math.min(8, 4 + currentMeetIndex);
    
    // Generate competitors
    const competitors = [];
    for (let i = 0; i < competitorCount - 1; i++) {
        const skillLevel = avgCompetitorSkill + (Math.random() * skillVariance * 2 - skillVariance);
        competitors.push({
            name: getRandomCompetitorName(),
            skill: skillLevel,
            // Time will be calculated during race
            time: 0
        });
    }
    
    // Target time is the record for this level
    const targetTime = recordTimes[raceType][levelKey];
    
    return {
        competitors,
        targetTime,
        raceTitle: `${getCurrentMeetName()} - ${SEASONS[currentSeasonIndex]} ${levelKey.charAt(0).toUpperCase() + levelKey.slice(1)}`
    };
}

// Generate random competitor names
function getRandomCompetitorName() {
    const firstNames = ['Alex', 'Jamie', 'Taylor', 'Jordan', 'Casey', 'Riley', 'Avery', 'Charlie', 'Quinn', 'Morgan'];
    const lastNames = ['Smith', 'Johnson', 'Lee', 'Garcia', 'Martinez', 'Brown', 'Davis', 'Wilson', 'Miller', 'Taylor'];
    
    return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

// Get current competition level (lowercase string)
function getCurrentCompetitionLevel() {
    return COMPETITION_LEVELS[currentCompetitionLevel].toLowerCase();
}

// Export functions to window for access from other scripts
window.careerSystem = {
    recordRaceResult,
    advanceToNextSeason,
    advanceToNextMeet,
    formatTime,
    getCompetitionDetails,
    getCurrentCompetitionLevel,
    getCurrentMeetName
}; 