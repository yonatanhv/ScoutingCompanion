import { useState, useEffect } from 'react';
import { 
  getMatchesByTeam,
  getFilteredMatches,
  calculateTeamAverages
} from '@/lib/indexedDB';
import { 
  MatchData, 
  TeamAverages, 
  TeamDataFilter 
} from '@/lib/types';

export function useTeamData(teamNumber: string | null, filter: TeamDataFilter = {}) {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [teamAverages, setTeamAverages] = useState<TeamAverages | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!teamNumber) {
        setMatches([]);
        setTeamAverages(null);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Get filtered matches based on criteria
        const filteredMatches = await getFilteredMatches(teamNumber, filter);
        setMatches(filteredMatches);
        
        // Calculate team averages
        const averages = await calculateTeamAverages(teamNumber);
        setTeamAverages(averages);
      } catch (err) {
        console.error('Error fetching team data:', err);
        setError('Failed to load team data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [teamNumber, filter]);

  return { matches, teamAverages, isLoading, error };
}
