import { useState } from 'react';
import { MatchData } from '@/lib/types';

interface TeamMatchHistoryProps {
  matches: MatchData[];
}

export default function TeamMatchHistory({ matches }: TeamMatchHistoryProps) {
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  
  // Sort matches by timestamp (newest first)
  const sortedMatches = [...matches].sort((a, b) => {
    // If we have timestamps, use those
    if (a.timestamp && b.timestamp) {
      return b.timestamp - a.timestamp;
    }
    
    // Fallback to sorting by tournament stage and match number
    const stagePriority = { 'Finals': 4, 'Semifinals': 3, 'Quarterfinals': 2, 'Qualifications': 1 };
    const stageComparison = stagePriority[b.tournamentStage] - stagePriority[a.tournamentStage];
    
    if (stageComparison !== 0) {
      return stageComparison;
    }
    
    return b.matchNumber - a.matchNumber;
  });
  
  const toggleCommentExpansion = (matchId: number) => {
    setExpandedComments((prev) => ({
      ...prev,
      [matchId]: !prev[matchId],
    }));
  };
  
  const formatMatchName = (match: MatchData) => {
    let prefix = match.tournamentStage;
    if (match.tournamentStage === 'Quarterfinals') prefix = 'Quarterfinal';
    if (match.tournamentStage === 'Semifinals') prefix = 'Semifinal';
    if (match.tournamentStage === 'Finals') prefix = 'Final';
    return `${prefix} ${match.matchNumber}`;
  };
  
  if (matches.length === 0) {
    return (
      <div>
        <h3 className="font-bold text-md mb-2">Match History</h3>
        <div className="bg-white p-4 rounded shadow-sm text-center text-gray-500">
          No match data available for this team
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <h3 className="font-bold text-md mb-2">Match History</h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alliance</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Climbing</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedMatches.map((match) => (
              <tr key={match.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap">{formatMatchName(match)}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span className={`${match.allianceColor === 'Red' ? 'bg-red-600' : 'bg-blue-600'} text-white px-2 py-0.5 rounded text-xs`}>
                    {match.allianceColor}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">{match.climbing}</td>
                <td className="px-4 py-2 whitespace-nowrap">{match.overallImpression}/7</td>
                <td className="px-4 py-2">
                  {match.comments ? (
                    <div>
                      <p className={expandedComments[match.id || 0] ? '' : 'line-clamp-1'}>
                        {match.comments}
                      </p>
                      {match.comments.length > 50 && (
                        <button 
                          onClick={() => toggleCommentExpansion(match.id || 0)}
                          className="text-xs text-primary mt-1 hover:underline"
                        >
                          {expandedComments[match.id || 0] ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">No comments</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Comment History */}
      <div className="mt-6">
        <h3 className="font-bold text-md mb-2">All Comments</h3>
        <div className="space-y-3 max-h-60 overflow-y-auto p-2">
          {sortedMatches.filter(match => match.comments).length > 0 ? (
            sortedMatches
              .filter(match => match.comments)
              .map((match) => (
                <div key={`comment-${match.id}`} className="bg-white p-3 rounded shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{formatMatchName(match)}</span>
                    <span className="text-xs text-gray-500">{match.allianceColor} Alliance</span>
                  </div>
                  <p className="text-sm">{match.comments}</p>
                </div>
              ))
          ) : (
            <div className="bg-white p-3 rounded shadow-sm text-center text-gray-500">
              No comments available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
