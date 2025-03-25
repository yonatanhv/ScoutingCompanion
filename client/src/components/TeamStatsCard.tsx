import { TeamAverages } from '@/lib/types';

interface TeamStatsCardProps {
  teamAverages: TeamAverages;
}

export default function TeamStatsCard({ teamAverages }: TeamStatsCardProps) {
  const {
    teamNumber,
    teamName,
    matchCount,
    defensePerformance,
    avoidingDefense,
    scoringAlgae,
    scoringCorals,
    autonomous,
    drivingSkill,
    overallImpression,
    climbingCounts
  } = teamAverages;

  // Helper to calculate percentage for progress bars
  const getPercentage = (value: number) => Math.round((value / 7) * 100);

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Team {teamNumber} - {teamName}</h3>
        <span className="bg-primary text-white px-3 py-1 rounded-full text-sm">{matchCount} Matches</span>
      </div>
      
      {/* Average Ratings */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-3 rounded shadow-sm">
          <p className="text-xs text-gray-500">Def. Performance</p>
          <p className="text-xl font-bold">{defensePerformance}</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full" 
              style={{ width: `${getPercentage(defensePerformance)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded shadow-sm">
          <p className="text-xs text-gray-500">Avoiding Defense</p>
          <p className="text-xl font-bold">{avoidingDefense}</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full" 
              style={{ width: `${getPercentage(avoidingDefense)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded shadow-sm">
          <p className="text-xs text-gray-500">Scoring Algae</p>
          <p className="text-xl font-bold">{scoringAlgae}</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full" 
              style={{ width: `${getPercentage(scoringAlgae)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded shadow-sm">
          <p className="text-xs text-gray-500">Scoring Corals</p>
          <p className="text-xl font-bold">{scoringCorals}</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full" 
              style={{ width: `${getPercentage(scoringCorals)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded shadow-sm">
          <p className="text-xs text-gray-500">Autonomous</p>
          <p className="text-xl font-bold">{autonomous}</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full" 
              style={{ width: `${getPercentage(autonomous)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded shadow-sm">
          <p className="text-xs text-gray-500">Driving Skill</p>
          <p className="text-xl font-bold">{drivingSkill}</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full" 
              style={{ width: `${getPercentage(drivingSkill)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded shadow-sm">
          <p className="text-xs text-gray-500">Overall</p>
          <p className="text-xl font-bold">{overallImpression}</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full" 
              style={{ width: `${getPercentage(overallImpression)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="bg-white p-3 rounded shadow-sm">
          <p className="text-xs text-gray-500">Climbing</p>
          <div className="flex mt-1 flex-wrap gap-1">
            <span className="bg-gray-200 px-2 py-1 rounded text-xs">None: {climbingCounts.None}</span>
            <span className="bg-blue-100 px-2 py-1 rounded text-xs">Low: {climbingCounts.Low}</span>
            <span className="bg-green-100 px-2 py-1 rounded text-xs">High: {climbingCounts.High}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
