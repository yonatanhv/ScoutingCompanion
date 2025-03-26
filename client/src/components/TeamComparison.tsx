import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { TeamStatistics } from '@/lib/types';

interface TeamComparisonProps {
  teamStats: TeamStatistics;
  comparisonStats: TeamStatistics;
}

export function TeamComparison({ teamStats, comparisonStats }: TeamComparisonProps) {
  // Prepare data for radar chart
  const radarData = [
    { 
      category: 'Defense', 
      [teamStats.teamNumber]: teamStats.averages.defense,
      [comparisonStats.teamNumber]: comparisonStats.averages.defense 
    },
    { 
      category: 'Avoid Defense', 
      [teamStats.teamNumber]: teamStats.averages.avoidingDefense,
      [comparisonStats.teamNumber]: comparisonStats.averages.avoidingDefense 
    },
    { 
      category: 'Scoring Algae', 
      [teamStats.teamNumber]: teamStats.averages.scoringAlgae,
      [comparisonStats.teamNumber]: comparisonStats.averages.scoringAlgae 
    },
    { 
      category: 'Scoring Corals', 
      [teamStats.teamNumber]: teamStats.averages.scoringCorals,
      [comparisonStats.teamNumber]: comparisonStats.averages.scoringCorals 
    },
    { 
      category: 'Autonomous', 
      [teamStats.teamNumber]: teamStats.averages.autonomous,
      [comparisonStats.teamNumber]: comparisonStats.averages.autonomous 
    },
    { 
      category: 'Driving', 
      [teamStats.teamNumber]: teamStats.averages.drivingSkill,
      [comparisonStats.teamNumber]: comparisonStats.averages.drivingSkill 
    },
    { 
      category: 'Overall', 
      [teamStats.teamNumber]: teamStats.averages.overall,
      [comparisonStats.teamNumber]: comparisonStats.averages.overall 
    },
  ];

  // Calculate climbing comparison
  const climbingComparison = {
    labels: ['None', 'Low', 'High'],
    datasets: [
      {
        label: teamStats.teamNumber,
        data: [
          teamStats.climbingStats.none / teamStats.matchCount * 100,
          teamStats.climbingStats.low / teamStats.matchCount * 100,
          teamStats.climbingStats.high / teamStats.matchCount * 100
        ]
      },
      {
        label: comparisonStats.teamNumber,
        data: [
          comparisonStats.climbingStats.none / comparisonStats.matchCount * 100,
          comparisonStats.climbingStats.low / comparisonStats.matchCount * 100,
          comparisonStats.climbingStats.high / comparisonStats.matchCount * 100
        ]
      }
    ]
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Comparison</CardTitle>
        <CardDescription>
          Comparing {teamStats.teamNumber} ({teamStats.teamName}) vs {comparisonStats.teamNumber} ({comparisonStats.teamName})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <PolarRadiusAxis angle={30} domain={[0, 7]} />
              <Radar 
                name={`Team ${teamStats.teamNumber}`} 
                dataKey={teamStats.teamNumber} 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3}
              />
              <Radar 
                name={`Team ${comparisonStats.teamNumber}`} 
                dataKey={comparisonStats.teamNumber} 
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={0.3}
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Climbing Comparison</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            {['None', 'Low', 'High'].map((level, index) => (
              <div key={level} className="rounded-lg bg-card p-4 border">
                <h4 className="font-medium">{level}</h4>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Team {teamStats.teamNumber}:</span>
                    <span className="font-medium">{climbingComparison.datasets[0].data[index].toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Team {comparisonStats.teamNumber}:</span>
                    <span className="font-medium">{climbingComparison.datasets[1].data[index].toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TeamComparison;