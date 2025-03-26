import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { MatchEntry } from '@/lib/types';
import { Badge } from './ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDistanceToNow } from 'date-fns';

interface PerformanceTrendProps {
  matches: MatchEntry[];
  teamNumber: string;
}

export function PerformanceTrend({ matches, teamNumber }: PerformanceTrendProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [metricType, setMetricType] = useState<'all' | 'scoring' | 'driving'>('all');
  const isMobile = useIsMobile();
  
  // Sort matches by timestamp
  const sortedMatches = [...matches].sort((a, b) => a.timestamp - b.timestamp);
  
  // Format match data for charts
  const prepareChartData = () => {
    return sortedMatches.map((match, index) => {
      // Format match number for display
      const matchLabel = `${match.matchType.slice(0, 3)}${match.matchNumber}`;
      
      // Format date for tooltip
      const dateFormatted = formatDistanceToNow(new Date(match.timestamp), { addSuffix: true });
      
      return {
        name: matchLabel,
        date: dateFormatted,
        matchIndex: index + 1,
        defense: match.defense,
        avoidingDefense: match.avoidingDefense,
        scoringAlgae: match.scoringAlgae,
        scoringCorals: match.scoringCorals,
        autonomous: match.autonomous,
        drivingSkill: match.drivingSkill,
        overall: match.overall,
        alliance: match.alliance,
        climbing: match.climbing
      };
    });
  };
  
  const chartData = prepareChartData();
  
  // Get metrics to display based on selected filter
  const getMetricsForChart = () => {
    if (metricType === 'scoring') {
      return [
        { name: 'Scoring Algae', dataKey: 'scoringAlgae', color: '#10b981' }, // Green
        { name: 'Scoring Corals', dataKey: 'scoringCorals', color: '#f97316' }, // Orange
        { name: 'Autonomous', dataKey: 'autonomous', color: '#6366f1' }, // Indigo
      ];
    } else if (metricType === 'driving') {
      return [
        { name: 'Defense', dataKey: 'defense', color: '#ef4444' }, // Red
        { name: 'Avoiding Defense', dataKey: 'avoidingDefense', color: '#8b5cf6' }, // Purple
        { name: 'Driving Skill', dataKey: 'drivingSkill', color: '#0ea5e9' }, // Sky blue
      ];
    } else {
      return [
        { name: 'Overall', dataKey: 'overall', color: '#f59e0b' }, // Amber
        { name: 'Autonomous', dataKey: 'autonomous', color: '#6366f1' }, // Indigo
        { name: 'Driving Skill', dataKey: 'drivingSkill', color: '#0ea5e9' }, // Sky blue
      ];
    }
  };
  
  const metrics = getMetricsForChart();
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const matchData = payload[0].payload;
      return (
        <div className="bg-background border border-border p-3 rounded-md shadow-md text-sm">
          <p className="font-bold">{label} ({matchData.date})</p>
          <div className="mt-1">
            <Badge variant={matchData.alliance === 'Red' ? 'destructive' : 'default'}>
              {matchData.alliance} Alliance
            </Badge>
            <Badge variant="outline" className="ml-2">
              Climbing: {matchData.climbing}
            </Badge>
          </div>
          <hr className="my-2" />
          {payload.map((entry: any, index: number) => (
            <p key={`metric-${index}`} style={{ color: entry.color }}>
              {entry.name}: <span className="font-medium">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[300px]">
          <p className="text-muted-foreground">
            No match data available for team {teamNumber}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Tabs defaultValue="line" onValueChange={(value) => setChartType(value as 'line' | 'bar')}>
              <TabsList>
                <TabsTrigger value="line">Line Chart</TabsTrigger>
                <TabsTrigger value="bar">Bar Chart</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Tabs defaultValue="all" onValueChange={(value) => setMetricType(value as 'all' | 'scoring' | 'driving')}>
              <TabsList>
                <TabsTrigger value="all">Key Metrics</TabsTrigger>
                <TabsTrigger value="scoring">Scoring</TabsTrigger>
                <TabsTrigger value="driving">Driving</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end"
                    height={60} 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 7]} 
                    ticks={[1, 2, 3, 4, 5, 6, 7]} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  {metrics.map((metric) => (
                    <Line 
                      key={metric.dataKey}
                      type="monotone" 
                      dataKey={metric.dataKey} 
                      stroke={metric.color} 
                      name={metric.name}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 50, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 7]} 
                    ticks={[1, 2, 3, 4, 5, 6, 7]}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  {metrics.map((metric, index) => (
                    <Bar 
                      key={metric.dataKey}
                      dataKey={metric.dataKey} 
                      fill={metric.color} 
                      name={metric.name}
                      barSize={isMobile ? 15 : 25}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Showing {matches.length} matches for Team {teamNumber}.
              All metrics are on a scale of 1-7.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}