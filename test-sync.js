// Simple test script to simulate a client syncing data to the server
// Using CommonJS syntax for simplicity
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Sample match data based on current schema
const sampleMatches = [
  {
    id: 1001, // This ID will be ignored by the server
    team: '1234',
    teamName: 'Test Team',
    matchType: 'qualification',
    matchNumber: 1,
    scoutedBy: 'Test Scout',
    timestamp: Date.now(),
    // Required fields from schema
    alliance: 'red',
    autonomous: 5,
    autonomousComment: 'Good auto path',
    teleop: 6,
    teleopComment: 'Consistent scoring',
    endgame: 7,
    endgameComment: 'Solid climb',
    defense: 6,
    defenseComment: 'Played good defense',
    avoidingDefense: 5,
    avoidingDefenseComment: 'Maneuvered well',
    scoringAlgae: 7,
    scoringAlgaeComment: 'Great aim',
    scoringCorals: 8,
    scoringCoralsComment: 'High REEF scoring',
    drivingSkill: 7,
    drivingSkillComment: 'Smooth control',
    overall: 8,
    overallComment: 'Strong performance',
    climbing: 'deep',
    notes: 'Test match entry for syncing',
    syncStatus: 'pending'
  },
  {
    id: 1002,
    team: '5678',
    teamName: 'Another Team',
    matchType: 'qualification',
    matchNumber: 2,
    scoutedBy: 'Test Scout',
    timestamp: Date.now() - 60000, // 1 minute ago
    // Required fields from schema
    alliance: 'blue',
    autonomous: 4,
    autonomousComment: 'Missed auto',
    teleop: 6,
    teleopComment: 'Good recovery',
    endgame: 8,
    endgameComment: 'Perfect climb',
    defense: 5,
    defenseComment: 'Some defense',
    avoidingDefense: 7,
    avoidingDefenseComment: 'Dodged well',
    scoringAlgae: 6,
    scoringAlgaeComment: 'Consistent',
    scoringCorals: 7,
    scoringCoralsComment: 'Good aim',
    drivingSkill: 8,
    drivingSkillComment: 'Excellent control',
    overall: 7,
    overallComment: 'Solid robot',
    climbing: 'shallow',
    notes: 'Another test match entry',
    syncStatus: 'pending'
  }
];

// Function to sync matches to server
async function syncMatches(matches, forceSync = false) {
  try {
    const response = await fetch('http://localhost:5000/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        matches,
        forceSync 
      }),
    });
    
    const data = await response.json();
    console.log('Sync Response:', data);
    
    // Check for successful sync
    if (data.success) {
      console.log(`Successfully synced ${data.syncedMatches} matches`);
      console.log(`Server now has ${data.serverMatches.length} total matches`);
    } else {
      console.error('Sync failed:', data.errors);
    }
    
    return data;
  } catch (error) {
    console.error('Error syncing matches:', error);
    return { success: false, error: error.message };
  }
}

// Function to get all server data
async function getAllServerData() {
  try {
    const response = await fetch('http://localhost:5000/api/sync/all');
    const data = await response.json();
    
    console.log('Server Data:');
    console.log(`- ${data.matches.length} matches`);
    console.log(`- ${data.teams.length} team statistics`);
    
    return data;
  } catch (error) {
    console.error('Error getting server data:', error);
    return { success: false, error: error.message };
  }
}

// Main function to run the test
async function runTest() {
  console.log('STEP 1: Getting initial server data...');
  await getAllServerData();
  
  console.log('\nSTEP 2: Syncing test matches to server...');
  await syncMatches(sampleMatches);
  
  console.log('\nSTEP 3: Getting updated server data...');
  await getAllServerData();
  
  console.log('\nSTEP 4: Testing force sync functionality...');
  // Modify one of the matches to simulate an update
  const updatedMatches = sampleMatches.map(match => ({
    ...match,
    notes: `${match.notes} - Updated with force sync`,
    timestamp: Date.now()
  }));
  
  await syncMatches(updatedMatches, true);
  
  console.log('\nSTEP 5: Final server data check...');
  await getAllServerData();
}

// Run the test
runTest().then(() => {
  console.log('Test completed!');
}).catch(error => {
  console.error('Test failed:', error);
});