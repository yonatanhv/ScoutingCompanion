import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import RatingInput from '@/components/RatingInput';
import { TEAMS, type MatchData, type PerformanceRatings, type ClimbingType, type TournamentStage } from '@/lib/types';
import { saveMatch } from '@/lib/indexedDB';

export default function ScoutMatch() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<MatchData, 'id' | 'timestamp'>>({
    teamNumber: '',
    teamName: '',
    tournamentStage: 'Qualifications',
    matchNumber: 1,
    allianceColor: 'Red',
    performanceRatings: {
      defensePerformance: { score: 4 },
      avoidingDefense: { score: 4 },
      scoringAlgae: { score: 4 },
      scoringCorals: { score: 4 },
      autonomous: { score: 4 },
      drivingSkill: { score: 4 },
    },
    climbing: 'None',
    overallImpression: 4,
    comments: '',
  });

  // Handle form changes
  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const teamNumber = e.target.value;
    const team = TEAMS.find(t => t.number === teamNumber);
    setFormData({
      ...formData,
      teamNumber,
      teamName: team?.name || '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleRatingChange = (field: keyof PerformanceRatings, value: { score: number; notes?: string }) => {
    setFormData({
      ...formData,
      performanceRatings: {
        ...formData.performanceRatings,
        [field]: value,
      },
    });
  };

  const handleClimbingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      climbing: e.target.value as ClimbingType,
    });
  };

  const handleOverallChange = (value: { score: number }) => {
    setFormData({
      ...formData,
      overallImpression: value.score,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.teamNumber) {
      toast({
        title: 'Error',
        description: 'Please select a team.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Save to IndexedDB
      await saveMatch(formData);
      
      toast({
        title: 'Success',
        description: 'Match data saved successfully!',
      });
      
      // Reset form or keep team selection based on user preference
      // For this implementation, we'll just reset the performance data
      setFormData({
        ...formData,
        performanceRatings: {
          defensePerformance: { score: 4 },
          avoidingDefense: { score: 4 },
          scoringAlgae: { score: 4 },
          scoringCorals: { score: 4 },
          autonomous: { score: 4 },
          drivingSkill: { score: 4 },
        },
        climbing: 'None',
        overallImpression: 4,
        comments: '',
      });
      
    } catch (error) {
      console.error('Error saving match data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save match data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Match Information Section */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-bold mb-4 text-primary">Match Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Team Select */}
            <div>
              <label htmlFor="teamNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Team<span className="text-red-500 ml-1">*</span>
              </label>
              <select
                id="teamNumber"
                name="teamNumber"
                value={formData.teamNumber}
                onChange={handleTeamChange}
                required
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

            {/* Tournament Stage */}
            <div>
              <label htmlFor="tournamentStage" className="block text-sm font-medium text-gray-700 mb-1">
                Tournament Stage<span className="text-red-500 ml-1">*</span>
              </label>
              <select
                id="tournamentStage"
                name="tournamentStage"
                value={formData.tournamentStage}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="Qualifications">Qualifications</option>
                <option value="Quarterfinals">Quarterfinals</option>
                <option value="Semifinals">Semifinals</option>
                <option value="Finals">Finals</option>
              </select>
            </div>

            {/* Match Number */}
            <div>
              <label htmlFor="matchNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Match Number<span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="number"
                id="matchNumber"
                name="matchNumber"
                min="1"
                value={formData.matchNumber}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Alliance Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alliance Color<span className="text-red-500 ml-1">*</span>
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="allianceColor"
                    value="Red"
                    checked={formData.allianceColor === 'Red'}
                    onChange={handleInputChange}
                    className="form-radio text-red-600"
                  />
                  <span className="ml-2 bg-red-600 text-white px-3 py-1 rounded">Red</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="allianceColor"
                    value="Blue"
                    checked={formData.allianceColor === 'Blue'}
                    onChange={handleInputChange}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2 bg-blue-600 text-white px-3 py-1 rounded">Blue</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Ratings Section */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-lg font-bold mb-4 text-primary">Performance Ratings</h2>
          
          {/* Rating Fields */}
          <RatingInput
            name="defensePerformance"
            label="Defense Performance"
            value={formData.performanceRatings.defensePerformance.score}
            notes={formData.performanceRatings.defensePerformance.notes}
            onChange={(value) => handleRatingChange('defensePerformance', value)}
            required
          />
          
          <RatingInput
            name="avoidingDefense"
            label="Avoiding Defense"
            value={formData.performanceRatings.avoidingDefense.score}
            notes={formData.performanceRatings.avoidingDefense.notes}
            onChange={(value) => handleRatingChange('avoidingDefense', value)}
            required
          />
          
          <RatingInput
            name="scoringAlgae"
            label="Scoring Algae"
            value={formData.performanceRatings.scoringAlgae.score}
            notes={formData.performanceRatings.scoringAlgae.notes}
            onChange={(value) => handleRatingChange('scoringAlgae', value)}
            required
          />
          
          <RatingInput
            name="scoringCorals"
            label="Scoring Corals"
            value={formData.performanceRatings.scoringCorals.score}
            notes={formData.performanceRatings.scoringCorals.notes}
            onChange={(value) => handleRatingChange('scoringCorals', value)}
            required
          />
          
          <RatingInput
            name="autonomous"
            label="Autonomous"
            value={formData.performanceRatings.autonomous.score}
            notes={formData.performanceRatings.autonomous.notes}
            onChange={(value) => handleRatingChange('autonomous', value)}
            required
          />
          
          <RatingInput
            name="drivingSkill"
            label="Driving Skill"
            value={formData.performanceRatings.drivingSkill.score}
            notes={formData.performanceRatings.drivingSkill.notes}
            onChange={(value) => handleRatingChange('drivingSkill', value)}
            required
          />

          {/* Climbing Dropdown */}
          <div className="mb-4">
            <label htmlFor="climbing" className="block text-sm font-medium text-gray-700 mb-1">
              Climbing<span className="text-red-500 ml-1">*</span>
            </label>
            <select
              id="climbing"
              name="climbing"
              value={formData.climbing}
              onChange={handleClimbingChange}
              required
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="None">None</option>
              <option value="Low">Low</option>
              <option value="High">High</option>
            </select>
            <input
              type="text"
              placeholder="Optional notes"
              className="w-full p-2 border border-gray-300 rounded mt-1"
            />
          </div>

          {/* Overall Impression */}
          <RatingInput
            name="overallImpression"
            label="Overall Impression"
            value={formData.overallImpression}
            onChange={handleOverallChange}
            required
          />

          {/* Comments */}
          <div className="mb-4">
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Comments
            </label>
            <textarea
              id="comments"
              name="comments"
              rows={3}
              value={formData.comments}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="Enter any additional observations here..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-md transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Match Data'}
          </button>
        </div>
      </form>
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-gray-700">Saving match data...</p>
          </div>
        </div>
      )}
    </section>
  );
}
