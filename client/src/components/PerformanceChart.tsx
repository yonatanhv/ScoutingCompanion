import { useEffect, useRef } from 'react';
import { MatchData } from '@/lib/types';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface PerformanceChartProps {
  matches: MatchData[];
}

export default function PerformanceChart({ matches }: PerformanceChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  
  useEffect(() => {
    if (!chartRef.current || matches.length === 0) return;
    
    // Sort matches by timestamp (oldest first)
    const sortedMatches = [...matches].sort((a, b) => 
      (a.timestamp || 0) - (b.timestamp || 0)
    );
    
    // Prepare data
    const labels = sortedMatches.map(match => {
      let label = match.tournamentStage.substring(0, 1);
      if (match.tournamentStage === 'Qualifications') {
        label = 'Q';
      } else if (match.tournamentStage === 'Quarterfinals') {
        label = 'QF';
      } else if (match.tournamentStage === 'Semifinals') {
        label = 'SF';
      } else if (match.tournamentStage === 'Finals') {
        label = 'F';
      }
      return `${label}${match.matchNumber}`;
    });
    
    const overallScores = sortedMatches.map(match => match.overallImpression);
    const autonomous = sortedMatches.map(match => match.performanceRatings.autonomous.score);
    const drivingSkill = sortedMatches.map(match => match.performanceRatings.drivingSkill.score);
    const scoringAlgae = sortedMatches.map(match => match.performanceRatings.scoringAlgae.score);
    const scoringCorals = sortedMatches.map(match => match.performanceRatings.scoringCorals.score);
    
    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Create new chart
    const ctx = chartRef.current.getContext('2d');
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Overall',
              data: overallScores,
              borderColor: '#0078d4',
              backgroundColor: 'rgba(0, 120, 212, 0.1)',
              tension: 0.1,
              borderWidth: 3,
              fill: false,
            },
            {
              label: 'Autonomous',
              data: autonomous,
              borderColor: '#107c41',
              backgroundColor: 'rgba(16, 124, 65, 0.1)',
              tension: 0.1,
              borderWidth: 2,
              fill: false,
              hidden: true,
            },
            {
              label: 'Driving',
              data: drivingSkill,
              borderColor: '#d83b01',
              backgroundColor: 'rgba(216, 59, 1, 0.1)',
              tension: 0.1,
              borderWidth: 2,
              fill: false,
              hidden: true,
            },
            {
              label: 'Algae',
              data: scoringAlgae,
              borderColor: '#5c2d91',
              backgroundColor: 'rgba(92, 45, 145, 0.1)',
              tension: 0.1,
              borderWidth: 2,
              fill: false,
              hidden: true,
            },
            {
              label: 'Corals',
              data: scoringCorals,
              borderColor: '#008272',
              backgroundColor: 'rgba(0, 130, 114, 0.1)',
              tension: 0.1,
              borderWidth: 2,
              fill: false,
              hidden: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              min: 1,
              max: 7,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)',
              },
              ticks: {
                stepSize: 1,
              },
            },
            x: {
              grid: {
                display: false,
              },
            },
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                boxWidth: 12,
                padding: 10,
              },
            },
            tooltip: {
              mode: 'index',
              intersect: false,
            },
          },
        },
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [matches]);
  
  if (matches.length === 0) {
    return (
      <div className="mb-6">
        <h4 className="font-medium text-sm text-gray-700 mb-2">Performance Over Time</h4>
        <div className="chart-container bg-white p-3 rounded shadow-sm flex items-center justify-center text-gray-500 h-48">
          No match data available
        </div>
      </div>
    );
  }
  
  return (
    <div className="mb-6">
      <h4 className="font-medium text-sm text-gray-700 mb-2">Performance Over Time</h4>
      <div className="chart-container bg-white p-3 rounded shadow-sm">
        <canvas ref={chartRef} height="200"></canvas>
      </div>
    </div>
  );
}
