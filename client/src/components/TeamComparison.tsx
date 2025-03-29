import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TeamStatistics } from '@/lib/types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface TeamComparisonProps {
  teamStats: TeamStatistics;
  comparisonStats: TeamStatistics;
}

export function TeamComparison({ teamStats, comparisonStats }: TeamComparisonProps) {
  // Prepare data for comparison charts
  const prepareComparisonData = () => {
    return [
      {
        category: 'Autonomous',
        [teamStats.teamNumber]: teamStats.averages.autonomous,
        [`${teamStats.teamNumber}Color`]: '#3b82f6', // Blue
        [comparisonStats.teamNumber]: comparisonStats.averages.autonomous,
        [`${comparisonStats.teamNumber}Color`]: '#ef4444', // Red
      },
      {
        category: 'Scoring Algae',
        [teamStats.teamNumber]: teamStats.averages.scoringAlgae,
        [`${teamStats.teamNumber}Color`]: '#3b82f6',
        [comparisonStats.teamNumber]: comparisonStats.averages.scoringAlgae,
        [`${comparisonStats.teamNumber}Color`]: '#ef4444',
      },
      {
        category: 'Scoring Corals',
        [teamStats.teamNumber]: teamStats.averages.scoringCorals,
        [`${teamStats.teamNumber}Color`]: '#3b82f6',
        [comparisonStats.teamNumber]: comparisonStats.averages.scoringCorals,
        [`${comparisonStats.teamNumber}Color`]: '#ef4444',
      },
      {
        category: 'Defense',
        [teamStats.teamNumber]: teamStats.averages.defense,
        [`${teamStats.teamNumber}Color`]: '#3b82f6',
        [comparisonStats.teamNumber]: comparisonStats.averages.defense,
        [`${comparisonStats.teamNumber}Color`]: '#ef4444',
      },
      {
        category: 'Avoiding Defense',
        [teamStats.teamNumber]: teamStats.averages.avoidingDefense,
        [`${teamStats.teamNumber}Color`]: '#3b82f6',
        [comparisonStats.teamNumber]: comparisonStats.averages.avoidingDefense,
        [`${comparisonStats.teamNumber}Color`]: '#ef4444',
      },
      {
        category: 'Driving Skill',
        [teamStats.teamNumber]: teamStats.averages.drivingSkill,
        [`${teamStats.teamNumber}Color`]: '#3b82f6',
        [comparisonStats.teamNumber]: comparisonStats.averages.drivingSkill,
        [`${comparisonStats.teamNumber}Color`]: '#ef4444',
      },
      {
        category: 'Overall',
        [teamStats.teamNumber]: teamStats.averages.overall,
        [`${teamStats.teamNumber}Color`]: '#3b82f6',
        [comparisonStats.teamNumber]: comparisonStats.averages.overall,
        [`${comparisonStats.teamNumber}Color`]: '#ef4444',
      },
    ];
  };
  
  // Prepare data for radar chart
  const prepareRadarData = () => {
    // Only include the core metrics (without Overall) for the radar chart
    return [
      {
        subject: 'Autonomous',
        [teamStats.teamNumber]: teamStats.averages.autonomous,
        [comparisonStats.teamNumber]: comparisonStats.averages.autonomous,
        fullMark: 7,
      },
      {
        subject: 'Scoring Algae',
        [teamStats.teamNumber]: teamStats.averages.scoringAlgae,
        [comparisonStats.teamNumber]: comparisonStats.averages.scoringAlgae,
        fullMark: 7,
      },
      {
        subject: 'Scoring Corals',
        [teamStats.teamNumber]: teamStats.averages.scoringCorals,
        [comparisonStats.teamNumber]: comparisonStats.averages.scoringCorals,
        fullMark: 7,
      },
      {
        subject: 'Defense',
        [teamStats.teamNumber]: teamStats.averages.defense,
        [comparisonStats.teamNumber]: comparisonStats.averages.defense,
        fullMark: 7,
      },
      {
        subject: 'Avoiding Defense',
        [teamStats.teamNumber]: teamStats.averages.avoidingDefense,
        [comparisonStats.teamNumber]: comparisonStats.averages.avoidingDefense,
        fullMark: 7,
      },
      {
        subject: 'Driving Skill',
        [teamStats.teamNumber]: teamStats.averages.drivingSkill,
        [comparisonStats.teamNumber]: comparisonStats.averages.drivingSkill,
        fullMark: 7,
      },
    ];
  };

  // Prepare climbing comparison data
  const prepareClimbingData = () => {
    return [
      {
        category: 'Deep',
        [teamStats.teamNumber]: teamStats.climbingStats.deep,
        [`${teamStats.teamNumber}Color`]: '#3b82f6',
        [comparisonStats.teamNumber]: comparisonStats.climbingStats.deep,
        [`${comparisonStats.teamNumber}Color`]: '#ef4444',
      },
      {
        category: 'Shallow',
        [teamStats.teamNumber]: teamStats.climbingStats.shallow,
        [`${teamStats.teamNumber}Color`]: '#3b82f6',
        [comparisonStats.teamNumber]: comparisonStats.climbingStats.shallow,
        [`${comparisonStats.teamNumber}Color`]: '#ef4444',
      },
      {
        category: 'Park',
        [teamStats.teamNumber]: teamStats.climbingStats.park,
        [`${teamStats.teamNumber}Color`]: '#3b82f6',
        [comparisonStats.teamNumber]: comparisonStats.climbingStats.park,
        [`${comparisonStats.teamNumber}Color`]: '#ef4444',
      },
      {
        category: 'None',
        [teamStats.teamNumber]: teamStats.climbingStats.none,
        [`${teamStats.teamNumber}Color`]: '#3b82f6',
        [comparisonStats.teamNumber]: comparisonStats.climbingStats.none,
        [`${comparisonStats.teamNumber}Color`]: '#ef4444',
      },
    ];
  };
  
  const comparisonData = prepareComparisonData();
  const radarData = prepareRadarData();
  const climbingData = prepareClimbingData();
  
  // Calculate head-to-head stats (which team is better in each category)
  const headToHeadStats = {
    totalCategories: comparisonData.length,
    team1Wins: comparisonData.filter(item => item[teamStats.teamNumber] > item[comparisonStats.teamNumber]).length,
    team2Wins: comparisonData.filter(item => item[comparisonStats.teamNumber] > item[teamStats.teamNumber]).length,
    ties: comparisonData.filter(item => item[teamStats.teamNumber] === item[comparisonStats.teamNumber]).length,
  };
  
  const getWinnerText = () => {
    if (headToHeadStats.team1Wins > headToHeadStats.team2Wins) {
      return `Team ${teamStats.teamNumber} leads in ${headToHeadStats.team1Wins} categories`;
    } else if (headToHeadStats.team2Wins > headToHeadStats.team1Wins) {
      return `Team ${comparisonStats.teamNumber} leads in ${headToHeadStats.team2Wins} categories`;
    } else {
      return 'Teams are evenly matched';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
            <span className="font-medium">Team {teamStats.teamNumber}</span>
            <p className="text-xs text-muted-foreground">{teamStats.teamName}</p>
          </div>
          <div className="text-lg font-bold">vs</div>
          <div className="text-center">
            <div className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></div>
            <span className="font-medium">Team {comparisonStats.teamNumber}</span>
            <p className="text-xs text-muted-foreground">{comparisonStats.teamName}</p>
          </div>
        </div>
        
        <div className="text-center md:text-right">
          <p className="text-sm font-medium">{getWinnerText()}</p>
          <p className="text-xs text-muted-foreground">
            {headToHeadStats.ties > 0 ? `${headToHeadStats.ties} categories tied` : ''}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Comparison Chart */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-4">Performance Comparison</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparisonData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 7]} ticks={[0, 1, 2, 3, 4, 5, 6, 7]} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip 
                    formatter={(value) => [value, 'Rating']}
                    labelFormatter={(value) => `Category: ${value}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey={teamStats.teamNumber} 
                    name={`Team ${teamStats.teamNumber}`} 
                    fill="#3b82f6" 
                    barSize={20} 
                  />
                  <Bar 
                    dataKey={comparisonStats.teamNumber} 
                    name={`Team ${comparisonStats.teamNumber}`} 
                    fill="#ef4444" 
                    barSize={20} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Radar Chart */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-4">Skill Profile</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 7]} />
                  <Radar
                    name={`Team ${teamStats.teamNumber}`}
                    dataKey={teamStats.teamNumber}
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name={`Team ${comparisonStats.teamNumber}`}
                    dataKey={comparisonStats.teamNumber}
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.3}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Climbing Comparison */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-4">Climbing Comparison</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={climbingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} matches`, 'Count']} />
                  <Legend />
                  <Bar 
                    dataKey={teamStats.teamNumber} 
                    name={`Team ${teamStats.teamNumber}`} 
                    fill="#3b82f6" 
                  />
                  <Bar 
                    dataKey={comparisonStats.teamNumber} 
                    name={`Team ${comparisonStats.teamNumber}`} 
                    fill="#ef4444" 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Head-to-Head */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-4">Key Comparisons</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Overall Rating</span>
                  <div className="flex gap-2">
                    <span className="text-sm text-blue-500 font-medium">{teamStats.averages.overall.toFixed(1)}</span>
                    <span className="text-sm">vs</span>
                    <span className="text-sm text-red-500 font-medium">{comparisonStats.averages.overall.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-gray-200">
                  <div 
                    className="bg-blue-500" 
                    style={{ width: `${(teamStats.averages.overall / (teamStats.averages.overall + comparisonStats.averages.overall)) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-red-500" 
                    style={{ width: `${(comparisonStats.averages.overall / (teamStats.averages.overall + comparisonStats.averages.overall)) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Matches Scouted</span>
                  <div className="flex gap-2">
                    <span className="text-sm text-blue-500 font-medium">{teamStats.matchCount}</span>
                    <span className="text-sm">vs</span>
                    <span className="text-sm text-red-500 font-medium">{comparisonStats.matchCount}</span>
                  </div>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-gray-200">
                  <div 
                    className="bg-blue-500" 
                    style={{ width: `${(teamStats.matchCount / (teamStats.matchCount + comparisonStats.matchCount)) * 100}%` }}
                  ></div>
                  <div 
                    className="bg-red-500" 
                    style={{ width: `${(comparisonStats.matchCount / (teamStats.matchCount + comparisonStats.matchCount)) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Deep Climbs</span>
                  <div className="flex gap-2">
                    <span className="text-sm text-blue-500 font-medium">{teamStats.climbingStats.deep}</span>
                    <span className="text-sm">vs</span>
                    <span className="text-sm text-red-500 font-medium">{comparisonStats.climbingStats.deep}</span>
                  </div>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-gray-200">
                  {teamStats.climbingStats.deep + comparisonStats.climbingStats.deep > 0 ? (
                    <>
                      <div 
                        className="bg-blue-500" 
                        style={{ width: `${(teamStats.climbingStats.deep / (teamStats.climbingStats.deep + comparisonStats.climbingStats.deep)) * 100}%` }}
                      ></div>
                      <div 
                        className="bg-red-500" 
                        style={{ width: `${(comparisonStats.climbingStats.deep / (teamStats.climbingStats.deep + comparisonStats.climbingStats.deep)) * 100}%` }}
                      ></div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-gray-300"></div>
                  )}
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Best Category Advantage</span>
                </div>
                {comparisonData
                  .sort((a, b) => 
                    Math.abs(Number(b[teamStats.teamNumber]) - Number(b[comparisonStats.teamNumber])) - 
                    Math.abs(Number(a[teamStats.teamNumber]) - Number(a[comparisonStats.teamNumber]))
                  )
                  .slice(0, 1)
                  .map((item, index) => {
                    const diff = Number(item[teamStats.teamNumber]) - Number(item[comparisonStats.teamNumber]);
                    const advantageTeam = diff > 0 ? teamStats.teamNumber : comparisonStats.teamNumber;
                    const advantageColor = diff > 0 ? 'bg-blue-500' : 'bg-red-500';
                    const disadvantageWidth = 25; // Baseline width for the disadvantage side
                    
                    return (
                      <div key={index} className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{item.category}</span>
                          <span className={diff > 0 ? 'text-blue-500' : 'text-red-500'}>
                            Team {advantageTeam} by {Math.abs(diff).toFixed(1)} points
                          </span>
                        </div>
                        <div className="flex h-2 overflow-hidden rounded-full bg-gray-200">
                          <div 
                            className={advantageColor}
                            style={{ width: `${100 - disadvantageWidth}%` }}
                          ></div>
                          <div 
                            className="bg-gray-300"
                            style={{ width: `${disadvantageWidth}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}