import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MatchEntry, TeamStatistics } from '@/lib/types';

interface PerformanceTrendProps {
  matches: MatchEntry[];
  teamNumber: string;
}

export function PerformanceTrend({ matches, teamNumber }: PerformanceTrendProps) {
  // Sort matches by timestamp (from oldest to newest)
  const sortedMatches = [...matches].sort((a, b) => a.timestamp - b.timestamp);
  
  // Prepare data for the chart
  const chartData = sortedMatches.map((match) => ({
    name: `${match.matchType} ${match.matchNumber}`,
    defense: match.defense,
    avoidDefense: match.avoidingDefense,
    algae: match.scoringAlgae,
    corals: match.scoringCorals,
    autonomous: match.autonomous,
    driving: match.drivingSkill,
    overall: match.overall,
    climbing: match.climbing === 'none' ? 1 : match.climbing === 'low' ? 3 : 5, // Convert climbing to numeric value
  }));

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>
            Team {teamNumber} performance over time
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
        <CardTitle>Performance Trends</CardTitle>
        <CardDescription>
          Team {teamNumber} performance over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 5,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }} 
                height={60}
                interval={0}
                angle={-45}
                textAnchor="end"
              />
              <YAxis domain={[0, 7]} />
              <Tooltip 
                formatter={(value, name) => {
                  // Format the tooltip values
                  if (name === 'climbing') {
                    return [value === 1 ? 'None' : value === 3 ? 'Low' : 'High', 'Climbing'];
                  }
                  return [value, typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : name];
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="overall" stroke="#8884d8" activeDot={{ r: 8 }} name="Overall" strokeWidth={2} />
              <Line type="monotone" dataKey="autonomous" stroke="#82ca9d" name="Autonomous" />
              <Line type="monotone" dataKey="algae" stroke="#ffc658" name="Scoring Algae" />
              <Line type="monotone" dataKey="corals" stroke="#ff8042" name="Scoring Corals" />
              <Line type="monotone" dataKey="defense" stroke="#ff0000" name="Defense" />
              <Line type="monotone" dataKey="climbing" stroke="#0088FE" name="Climbing" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default PerformanceTrend;