import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { MatchEntry, TeamStatistics } from '@/lib/types';

interface StatisticalInsightsProps {
  teamStats: TeamStatistics;
  matches: MatchEntry[];
}

export function StatisticalInsights({ teamStats, matches }: StatisticalInsightsProps) {
  // Prepare data for the ratings bar chart
  const ratingData = [
    { name: 'Defense', value: teamStats.averages.defense },
    { name: 'Avoid Defense', value: teamStats.averages.avoidingDefense },
    { name: 'Scoring Algae', value: teamStats.averages.scoringAlgae },
    { name: 'Scoring Corals', value: teamStats.averages.scoringCorals },
    { name: 'Autonomous', value: teamStats.averages.autonomous },
    { name: 'Driving', value: teamStats.averages.drivingSkill },
    { name: 'Overall', value: teamStats.averages.overall },
  ];

  // Prepare data for the climbing pie chart
  const climbingData = [
    { name: 'None', value: teamStats.climbingStats.none, color: '#FF8042' },
    { name: 'Low', value: teamStats.climbingStats.low, color: '#00C49F' },
    { name: 'High', value: teamStats.climbingStats.high, color: '#0088FE' },
  ];

  // Prepare data for matchType distribution
  const matchTypeData = () => {
    const distribution: Record<string, number> = {};
    
    matches.forEach(match => {
      if (!distribution[match.matchType]) {
        distribution[match.matchType] = 0;
      }
      distribution[match.matchType]++;
    });
    
    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
      color: name === 'Qualification' ? '#8884d8' : 
             name === 'Practice' ? '#82ca9d' : 
             name === 'Playoff' ? '#ffc658' : '#d0d0d0'
    }));
  };

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Statistical Insights</CardTitle>
          <CardDescription>
            Performance analysis for Team {teamStats.teamNumber}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <p className="text-muted-foreground">No match data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistical Insights</CardTitle>
        <CardDescription>
          Performance analysis for Team {teamStats.teamNumber}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rating Averages Chart */}
          <div className="h-72">
            <h3 className="text-sm font-medium mb-2">Performance Ratings</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ratingData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" domain={[0, 7]} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value) => [`${value}/7`, 'Rating']} />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Rating Average" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Climbing Distribution */}
          <div className="h-72 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Climbing Pie Chart */}
            <div>
              <h3 className="text-sm font-medium mb-2">Climbing Distribution</h3>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={climbingData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {climbingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Match Type Distribution */}
            <div>
              <h3 className="text-sm font-medium mb-2">Match Types</h3>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={matchTypeData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {matchTypeData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StatisticalInsights;