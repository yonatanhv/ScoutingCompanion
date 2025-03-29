import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { TeamStatistics, MatchEntry } from '@/lib/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface StatisticalInsightsProps {
  teamStats: TeamStatistics;
  matches: MatchEntry[];
}

export function StatisticalInsights({ teamStats, matches }: StatisticalInsightsProps) {
  // Process climbing data for pie chart
  const climbingData = [
    { name: 'Deep', value: teamStats.climbingStats.deep || 0 },
    { name: 'Shallow', value: teamStats.climbingStats.shallow || 0 },
    { name: 'Park', value: teamStats.climbingStats.park || 0 },
    { name: 'None', value: teamStats.climbingStats.none || 0 },
  ].filter(item => item.value > 0);
  
  // Colors for the pie chart
  const COLORS = ['#22c55e', '#0ea5e9', '#3b82f6', '#f97316'];
  
  // Calculate win percentage if alliance data is available
  const calculateWinPercentage = () => {
    if (matches.length === 0) return { percent: 0, count: 0 };
    
    // This is a simple estimation based on overall score - in a real app you would track actual match results
    const highPerformanceMatches = matches.filter(match => {
      const overall = typeof match.overall === 'number' ? match.overall : 0;
      return overall >= 5;
    });
    return {
      percent: Math.round((highPerformanceMatches.length / matches.length) * 100),
      count: highPerformanceMatches.length
    };
  };
  
  const winStats = calculateWinPercentage();
  
  // Calculate trend (improving, declining, or stable)
  const calculateTrend = () => {
    if (matches.length < 3) return { status: 'neutral', label: 'Not enough data' };
    
    // Sort by timestamp (newest first)
    const sortedMatches = [...matches].sort((a, b) => {
      const timestampA = a.timestamp instanceof Date ? a.timestamp.getTime() : +a.timestamp;
      const timestampB = b.timestamp instanceof Date ? b.timestamp.getTime() : +b.timestamp;
      return timestampB - timestampA;
    });
    
    // Compare recent matches with earlier matches
    const recentMatches = sortedMatches.slice(0, Math.ceil(sortedMatches.length / 2));
    const olderMatches = sortedMatches.slice(Math.ceil(sortedMatches.length / 2));
    
    if (recentMatches.length === 0 || olderMatches.length === 0) {
      return { status: 'neutral', label: 'Not enough data' };
    }
    
    const recentAvg = recentMatches.reduce((sum, match) => sum + (typeof match.overall === 'number' ? match.overall : 0), 0) / recentMatches.length;
    const olderAvg = olderMatches.reduce((sum, match) => sum + (typeof match.overall === 'number' ? match.overall : 0), 0) / olderMatches.length;
    
    const diff = recentAvg - olderAvg;
    if (diff > 0.5) return { status: 'improving', label: 'Improving' };
    if (diff < -0.5) return { status: 'declining', label: 'Declining' };
    return { status: 'stable', label: 'Stable' };
  };
  
  const trend = calculateTrend();
  
  // Calculate match consistency (standard deviation of overall scores)
  const calculateConsistency = () => {
    if (matches.length < 2) return { level: 'unknown', value: 0, label: 'Not enough data' };
    
    const overallScores = matches.map(match => typeof match.overall === 'number' ? match.overall : 0);
    const mean = overallScores.reduce((sum, score) => sum + score, 0) / overallScores.length;
    
    const squaredDiffs = overallScores.map(score => Math.pow(score - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate consistency percentage (inverse of standard deviation, normalized)
    // Lower standard deviation means higher consistency
    const consistencyValue = Math.max(0, Math.min(100, 100 - (stdDev * 100 / 7)));
    
    let level, label;
    if (consistencyValue >= 80) {
      level = 'high';
      label = 'High';
    } else if (consistencyValue >= 60) {
      level = 'medium';
      label = 'Medium';
    } else {
      level = 'low';
      label = 'Low';
    }
    
    return { level, value: consistencyValue, label };
  };
  
  const consistency = calculateConsistency();
  
  // Find best and worst performances
  const findBestAndWorstPerformances = () => {
    if (matches.length === 0) return { best: null, worst: null };
    
    const sortedByOverall = [...matches].sort((a, b) => {
      const overallA = typeof a.overall === 'number' ? a.overall : 0;
      const overallB = typeof b.overall === 'number' ? b.overall : 0;
      return overallB - overallA;
    });
    return {
      best: sortedByOverall[0],
      worst: sortedByOverall[sortedByOverall.length - 1]
    };
  };
  
  const performances = findBestAndWorstPerformances();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Overall Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">Overall Performance</span>
                <span className="text-sm font-medium">{teamStats.averages.overall.toFixed(1)}/7</span>
              </div>
              <Progress value={(teamStats.averages.overall / 7) * 100} className="h-2" />
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Matches Scouted</p>
                <p className="text-2xl font-bold">{teamStats.matchCount}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Performance Trend</p>
                <p className={`text-lg font-semibold ${
                  trend.status === 'improving' ? 'text-green-500' : 
                  trend.status === 'declining' ? 'text-red-500' : 
                  'text-orange-500'
                }`}>
                  {trend.label}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Consistency</p>
                <p className={`text-lg font-semibold ${
                  consistency.level === 'high' ? 'text-green-500' : 
                  consistency.level === 'medium' ? 'text-orange-500' : 
                  'text-red-500'
                }`}>
                  {consistency.label}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-1">Strong Matches</p>
                <p className="text-lg font-semibold">
                  {winStats.count} <span className="text-sm text-muted-foreground">({winStats.percent}%)</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Strengths and Weaknesses */}
      <Card>
        <CardHeader>
          <CardTitle>Strengths and Weaknesses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Get sorted performance metrics to identify strengths and weaknesses */}
            {Object.entries(teamStats.averages)
              .filter(([key]) => key !== 'overall')
              .sort((a, b) => b[1] - a[1])
              .map(([key, value], index, array) => {
                // Determine if this is a strength or weakness
                const isStrength = index < 2; // Top 2 metrics
                const isWeakness = index >= array.length - 2; // Bottom 2 metrics
                
                // Format the metric name
                const metricName = key
                  .replace(/([A-Z])/g, ' $1') // Add space before capitals
                  .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
                
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium flex items-center">
                        {metricName}
                        {isStrength && <span className="ml-1 text-xs text-green-500">(Strength)</span>}
                        {isWeakness && <span className="ml-1 text-xs text-red-500">(Weakness)</span>}
                      </span>
                      <span className="text-sm font-medium">{value.toFixed(1)}/7</span>
                    </div>
                    <Progress 
                      value={(value / 7) * 100} 
                      className={`h-2 ${
                        isStrength ? 'bg-green-100' : 
                        isWeakness ? 'bg-red-100' : ''
                      }`} 
                    />
                  </div>
                );
              })
            }
          </div>
        </CardContent>
      </Card>
      
      {/* Climbing Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Climbing Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            {climbingData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={climbingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {climbingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} matches`, 'Count']} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground">No climbing data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Match Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Match Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performances.best ? (
              <div>
                <p className="text-sm font-medium mb-1">Best Performance</p>
                <div className="bg-green-50 dark:bg-green-950 p-3 rounded-md">
                  <div className="flex justify-between mb-1">
                    <p className="font-medium">
                      {performances.best.matchType} {performances.best.matchNumber}
                    </p>
                    <p className="font-bold text-green-600">
                      {performances.best.overall}/7
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {performances.best.climbing} climb • {performances.best.alliance} alliance
                  </p>
                  {performances.best.comments && (
                    <p className="mt-2 text-sm">{performances.best.comments}</p>
                  )}
                </div>
              </div>
            ) : null}
            
            {performances.worst ? (
              <div>
                <p className="text-sm font-medium mb-1">Needs Improvement</p>
                <div className="bg-red-50 dark:bg-red-950 p-3 rounded-md">
                  <div className="flex justify-between mb-1">
                    <p className="font-medium">
                      {performances.worst.matchType} {performances.worst.matchNumber}
                    </p>
                    <p className="font-bold text-red-600">
                      {performances.worst.overall}/7
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {performances.worst.climbing} climb • {performances.worst.alliance} alliance
                  </p>
                  {performances.worst.comments && (
                    <p className="mt-2 text-sm">{performances.worst.comments}</p>
                  )}
                </div>
              </div>
            ) : null}
            
            {(!performances.best && !performances.worst) && (
              <p className="text-center text-muted-foreground py-4">
                No match data available to show highlights
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}