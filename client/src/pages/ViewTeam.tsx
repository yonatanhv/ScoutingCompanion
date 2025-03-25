import { useState } from 'react';
import { useTeamData } from '@/hooks/useTeamData';
import { TEAMS, type TeamDataFilter } from '@/lib/types';
import TeamStatsCard from '@/components/TeamStatsCard';
import PerformanceChart from '@/components/PerformanceChart';
import TeamMatchHistory from '@/components/TeamMatchHistory';

export default function ViewTeam() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [filter, setFilter] = useState<TeamDataFilter>({
    tournamentStage: 'All',
    climbing: 'All',
    minOverallScore: 1
  });
  
  const { matches, teamAverages, isLoading, error } = useTeamData(selectedTeam, filter);
  
  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeam(e.target.value || null);
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: name === 'minOverallScore' ? parseInt(value) : value
    }));
  };
  
  return (
    <section>
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-bold mb-4 text-primary">Team Data</h2>
        
        {/* Team Selection */}
        <div className="mb-6">
          <label htmlFor="teamSelect" className="block text-sm font-medium text-gray-700 mb-1">Select Team</label>
          <select 
            id="teamSelect" 
            value={selectedTeam || ''}
            onChange={handleTeamChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="" disabled>Select a team</option>
            {TEAMS.map((team) => (
              <option key={team.number} value={team.number}>
                {team.number} - {team.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Filter Options */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="tournamentStage" className="block text-sm font-medium text-gray-700 mb-1">Match Type</label>
            <select 
              id="tournamentStage" 
              name="tournamentStage"
              value={filter.tournamentStage || 'All'}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="All">All Matches</option>
              <option value="Qualifications">Qualifications</option>
              <option value="Quarterfinals">Quarterfinals</option>
              <option value="Semifinals">Semifinals</option>
              <option value="Finals">Finals</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="climbing" className="block text-sm font-medium text-gray-700 mb-1">Climbing</label>
            <select 
              id="climbing" 
              name="climbing"
              value={filter.climbing || 'All'}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="All">All Types</option>
              <option value="None">None</option>
              <option value="Low">Low</option>
              <option value="High">High</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="minOverallScore" className="block text-sm font-medium text-gray-700 mb-1">
              Min Overall Score: {filter.minOverallScore}
            </label>
            <input 
              type="range" 
              id="minOverallScore" 
              name="minOverallScore"
              min="1" 
              max="7" 
              value={filter.minOverallScore || 1}
              onChange={handleFilterChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1</span>
              <span>4</span>
              <span>7</span>
            </div>
          </div>
        </div>
        
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-primary rounded-full animate-spin"></div>
            <p className="ml-3 text-gray-700">Loading team data...</p>
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="material-icons text-red-500">error</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* No Team Selected */}
        {!selectedTeam && !isLoading && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="material-icons text-blue-500">info</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Select a team above to view their scouting data.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Team Data Display */}
        {selectedTeam && !isLoading && !error && (
          <>
            {teamAverages ? (
              <>
                {/* Team Stats Card */}
                <TeamStatsCard teamAverages={teamAverages} />
                
                {/* Performance Chart */}
                <PerformanceChart matches={matches} />
                
                {/* Match History */}
                <TeamMatchHistory matches={matches} />
              </>
            ) : (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="material-icons text-yellow-500">warning</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      No data available for this team. Scout some matches first.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
