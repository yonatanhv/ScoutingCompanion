import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Alliance, TeamStatistics } from '@/lib/types';
import QRCode from 'qrcode';

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1a64d6',
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333333',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 5,
  },
  teamHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#555555',
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
    color: '#444444',
  },
  boldText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333333',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingVertical: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
  },
  tableCol1: {
    width: '40%',
    paddingHorizontal: 5,
  },
  tableCol2: {
    width: '30%',
    paddingHorizontal: 5,
  },
  tableCol3: {
    width: '30%',
    paddingHorizontal: 5,
  },
  tableCell: {
    fontSize: 10,
    color: '#333333',
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  teamInfo: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  statBlock: {
    marginBottom: 15,
  },
  teamStatsSection: {
    marginVertical: 5,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },
  footerSection: {
    marginTop: 20,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qrCodeContainer: {
    width: 100,
    height: 100,
    marginRight: 10,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  footerText: {
    fontSize: 10,
    color: '#666666',
  },
  row: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  col: {
    flexDirection: 'column',
  },
  statLabel: {
    width: '50%',
    fontSize: 10,
    color: '#666666',
  },
  statValue: {
    width: '50%',
    fontSize: 10,
    color: '#333333',
    fontWeight: 'bold',
  },
  synergyRating: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#1a64d6',
  },
  generatedText: {
    fontSize: 8,
    color: '#999999',
    marginTop: 10,
  },
  colorHighlight: {
    color: '#1a64d6',
  },
  teamTag: {
    backgroundColor: '#e6e6e6',
    borderRadius: 3,
    padding: 3,
    marginRight: 5,
    fontSize: 10,
  },
  teamTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 5,
  },
  climbStats: {
    fontSize: 10,
    marginTop: 5,
    marginBottom: 10,
  },
  // Rating bar styles
  ratingBar: {
    height: 8,
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 2,
    marginBottom: 8,
  },
  ratingFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#1a64d6',
  },
});

type AllianceReportPDFProps = {
  alliance: Alliance;
  teamDetails: TeamStatistics[];
  presetName?: string;
};

export const AllianceReportPDF: React.FC<AllianceReportPDFProps> = ({ alliance, teamDetails, presetName }) => {
  const [qrCodeData, setQrCodeData] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Generate QR code with alliance data
    const generateQRCode = async () => {
      try {
        // Create a simple data string with team numbers
        const qrData = `FRC Alliance: ${alliance.teams.join(', ')}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrData);
        setQrCodeData(qrCodeDataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQRCode();
  }, [alliance]);

  // Format the climbing success rate
  const formatClimbRate = (rate: number): string => {
    const percentage = (rate * 100).toFixed(0);
    return `${percentage}%`;
  };

  // Calculate rating fill width as percentage
  const getRatingWidth = (rating: number, max: number = 7): string => {
    const percentage = (rating / max) * 100;
    return `${percentage.toFixed(0)}%`;
  };

  // Format current date
  const formatDate = (): string => {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.section}>
          <Text style={styles.header}>Alliance Performance Report</Text>
          <Text style={[styles.text, { textAlign: 'center' }]}>
            {presetName || 'Custom Alliance'} - Generated on {formatDate()}
          </Text>
        </View>

        {/* Alliance Overview */}
        <View style={styles.section}>
          <Text style={styles.subHeader}>Alliance Overview</Text>
          
          <View style={styles.teamTags}>
            {alliance.teams.map((team, index) => (
              <Text key={index} style={styles.teamTag}>
                Team {team} 
                {teamDetails.find(t => t.teamNumber === team)?.teamName 
                  ? ` - ${teamDetails.find(t => t.teamNumber === team)?.teamName}`
                  : ''}
              </Text>
            ))}
          </View>

          <View style={styles.statBlock}>
            <Text style={styles.boldText}>Alliance Synergy Rating: {alliance.synergy.toFixed(1)}/10</Text>
            <View style={styles.row}>
              <Text style={styles.statLabel}>Match Data Points:</Text>
              <Text style={styles.statValue}>
                {teamDetails.reduce((sum, team) => sum + team.matchCount, 0)} matches
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.statLabel}>Climb Success Rate:</Text>
              <Text style={styles.statValue}>{formatClimbRate(alliance.climbSuccessRate)}</Text>
            </View>
          </View>

          {/* Performance Averages */}
          <Text style={[styles.boldText, { marginTop: 10 }]}>Combined Performance Averages:</Text>

          <View style={styles.row}>
            <Text style={styles.statLabel}>Overall Rating:</Text>
            <Text style={styles.statValue}>{alliance.combinedAverages.overall.toFixed(1)}/7</Text>
          </View>
          <View style={styles.ratingBar}>
            <View style={[styles.ratingFill, { width: getRatingWidth(alliance.combinedAverages.overall) }]} />
          </View>

          <View style={styles.row}>
            <Text style={styles.statLabel}>Scoring Corals:</Text>
            <Text style={styles.statValue}>{alliance.combinedAverages.scoringCorals.toFixed(1)}/7</Text>
          </View>
          <View style={styles.ratingBar}>
            <View style={[styles.ratingFill, { width: getRatingWidth(alliance.combinedAverages.scoringCorals) }]} />
          </View>

          <View style={styles.row}>
            <Text style={styles.statLabel}>Scoring Algae:</Text>
            <Text style={styles.statValue}>{alliance.combinedAverages.scoringAlgae.toFixed(1)}/7</Text>
          </View>
          <View style={styles.ratingBar}>
            <View style={[styles.ratingFill, { width: getRatingWidth(alliance.combinedAverages.scoringAlgae) }]} />
          </View>

          <View style={styles.row}>
            <Text style={styles.statLabel}>Defense:</Text>
            <Text style={styles.statValue}>{alliance.combinedAverages.defense.toFixed(1)}/7</Text>
          </View>
          <View style={styles.ratingBar}>
            <View style={[styles.ratingFill, { width: getRatingWidth(alliance.combinedAverages.defense) }]} />
          </View>

          <View style={styles.row}>
            <Text style={styles.statLabel}>Avoiding Defense:</Text>
            <Text style={styles.statValue}>{alliance.combinedAverages.avoidingDefense.toFixed(1)}/7</Text>
          </View>
          <View style={styles.ratingBar}>
            <View style={[styles.ratingFill, { width: getRatingWidth(alliance.combinedAverages.avoidingDefense) }]} />
          </View>

          <View style={styles.row}>
            <Text style={styles.statLabel}>Autonomous:</Text>
            <Text style={styles.statValue}>{alliance.combinedAverages.autonomous.toFixed(1)}/7</Text>
          </View>
          <View style={styles.ratingBar}>
            <View style={[styles.ratingFill, { width: getRatingWidth(alliance.combinedAverages.autonomous) }]} />
          </View>

          <View style={styles.row}>
            <Text style={styles.statLabel}>Driving Skill:</Text>
            <Text style={styles.statValue}>{alliance.combinedAverages.drivingSkill.toFixed(1)}/7</Text>
          </View>
          <View style={styles.ratingBar}>
            <View style={[styles.ratingFill, { width: getRatingWidth(alliance.combinedAverages.drivingSkill) }]} />
          </View>
        </View>

        {/* Individual Team Details */}
        <View style={styles.section}>
          <Text style={styles.subHeader}>Individual Team Details</Text>
          
          {teamDetails.map((team, index) => (
            <View key={index} style={styles.teamStatsSection}>
              <Text style={styles.teamHeader}>
                Team {team.teamNumber} - {team.teamName || 'Unknown'}
              </Text>
              
              <View style={styles.row}>
                <Text style={styles.statLabel}>Matches Scouted:</Text>
                <Text style={styles.statValue}>{team.matchCount}</Text>
              </View>
              
              <View style={styles.row}>
                <Text style={styles.statLabel}>Overall Rating:</Text>
                <Text style={styles.statValue}>{team.averages.overall.toFixed(1)}/7</Text>
              </View>
              
              <Text style={styles.climbStats}>
                Climbing: Deep: {team.climbingStats.deep}, 
                Shallow: {team.climbingStats.shallow}, 
                Park: {team.climbingStats.park}, 
                None: {team.climbingStats.none}
              </Text>
              
              <View style={styles.row}>
                <Text style={styles.statLabel}>Strengths:</Text>
                <View style={{ width: '50%' }}>
                  {/* Find top 2 strengths by finding highest 2 average ratings */}
                  {Object.entries(team.averages)
                    .filter(([key]) => key !== 'overall') // exclude overall
                    .sort(([, a], [, b]) => b - a) // sort descending
                    .slice(0, 2) // take top 2
                    .map(([key, value], idx) => (
                      <Text key={idx} style={styles.statValue}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}: {value.toFixed(1)}/7
                      </Text>
                    ))}
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Footer with QR Code */}
        <View style={styles.footerSection}>
          {qrCodeData && (
            <View style={styles.qrCodeContainer}>
              <Image src={qrCodeData} style={styles.qrImage} />
            </View>
          )}
          
          <View style={{ flex: 1 }}>
            <Text style={styles.footerText}>
              Scan the QR code to quickly identify this alliance during competition.
            </Text>
            <Text style={styles.footerText}>
              This report contains scouting data for the {presetName || 'alliance'} to assist with
              strategic planning and match preparation.
            </Text>
            <Text style={styles.generatedText}>
              Generated using FRC Scouting PWA - REEFSCAPE 2025 Season
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};