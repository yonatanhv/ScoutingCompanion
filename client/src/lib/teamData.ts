// List of team numbers and names for FRC competition
export const teams: [string, string][] = [
  ["1574", "Miscar"],
  ["1577", "Steampunk"],
  ["1690", "Orbit"],
  ["1937", "RoboActive"],
  ["1942", "Elysium"],
  ["2096", "Cinderella"],
  ["2230", "General Angels"],
  ["2231", "OnyxTronix"],
  ["3065", "Jatt"],
  ["3075", "Ha-Dream Team"],
  ["3083", "Artemis"],
  ["3211", "The Y Team"],
  ["3316", "D-Bug"],
  ["3339", "BumbleB"],
  ["3388", "Flash"],
  ["4320", "The Joker"],
  ["4338", "Falcons"],
  ["4416", "Skynet"],
  ["4586", "PRIMO"],
  ["4590", "GreenBlitz"],
  ["4661", "Cypher"],
  ["4744", "Ninjas"],
  ["5135", "Black Unicorns"],
  ["5554", "The Poros Roborioles"],
  ["5635", "Terp Destroyers"],
  ["5715", "Robotic Geckos"],
  ["5928", "MetalBoost"],
  ["5951", "Makers Assemble"],
  ["5987", "Galaxia"],
  ["5990", "TRIGON"],
  ["6164", "Moonshot"],
  ["6168", "Alzette Rex"],
  ["6230", "Team Cruise Control"],
  ["6738", "ExcaliBot"],
  ["6740", "Purple Thunder"],
  ["7039", "Team Inexperienced"],
  ["7067", "Falcon Robotics"],
  ["7112", "STEAMpunk Dragons"],
  ["7177", "Titans"],
  ["8175", "MetalCow"],
  ["8223", "TheTrenchcoats"],
  ["9303", "Robolehazards"],
  ["9999", "Nautilus"]
];

// Match types
export const matchTypes = [
  { value: "qualifications", label: "Qualifications" },
  { value: "quarterfinals", label: "Quarterfinals" },
  { value: "semifinals", label: "Semifinals" },
  { value: "finals", label: "Finals" }
];

// Climbing types (for REEFSCAPE game - climbing CAGES on the BARGE)
export const climbingTypes = [
  { value: "noData", label: "(No Data)" },
  { value: "none", label: "None" },
  { value: "park", label: "Park" },
  { value: "shallow", label: "Shallow" },
  { value: "deep", label: "Deep" }
];

// Rating categories
export const ratingCategories = [
  { id: "defense", label: "Defense Performance" },
  { id: "avoidingDefense", label: "Avoiding Defense" },
  { id: "scoringAlgae", label: "Scoring Algae" },
  { id: "scoringCorals", label: "Scoring Corals" },
  { id: "autonomous", label: "Autonomous" },
  { id: "drivingSkill", label: "Driving Skill" }
];
