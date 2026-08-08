export interface Player {
  id: string;
  name: string;
  number: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  isCaptain?: boolean;
  imageUrl?: string;
  videoUrl?: string;
  matchesPlayed?: number;
  bio?: string;
  signatureTrait?: string;
  hypeVotes?: number;
  overallRating?: number;
  preferredFoot?: string;
  lastMatchesStats?: number[];
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
  careerGoals?: number;
  careerAssists?: number;
  careerMatches?: number;
}

export interface BoardMember {
  id: string;
  name: string;
  designation: string;
}

export interface AdminUser {
  teamId: string | 'all';
  adminName: string;
  email?: string;
  role: 'team_admin' | 'league_commish';
  teamName?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  motto: string;
  colorPrimary: string;
  colorSecondary: string;
  textColor: string;
  rank: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
  topScorer: string;
  squadCount: number;
  roster: Player[];
  adminName: string;
  adminCode?: string;
  adminEmail?: string;
  homeStadium?: string;
  manager?: string;
  founded?: string;
  stadiumCapacity?: string;
  nickname?: string;
  headCoach?: string;
  bio?: string;
  clubCulture?: string;
  achievements?: string[];
  boardMembers?: BoardMember[];
}

export interface MatchEvent {
  id: string;
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'sub' | 'shot_on_target' | 'foul' | 'corner' | 'kickoff' | 'halftime' | 'fulltime' | 'added_time';
  teamId: string;
  player: string;
  description: string;
  period?: '1st_half' | 'halftime' | '2nd_half' | 'fulltime';
  timestamp?: string;
  assistPlayer?: string;
  subInPlayer?: string;
  subOutPlayer?: string;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  isLive: boolean;
  isFinished: boolean;
  startTime: string;
  venue: string;
  possessionHome: number; // e.g. 52
  possessionAway: number; // e.g. 48
  shotsHome: number;
  shotsAway: number;
  shotsOnTargetHome: number;
  shotsOnTargetAway: number;
  foulsHome: number;
  foulsAway: number;
  events: MatchEvent[];
  weekNumber?: number;
  matchType?: string;
  status?: 'scheduled' | '1st_half' | 'halftime' | '2nd_half' | 'ended';
  halfDurationMinutes?: number; // e.g. 20, 25, 30, 45
  addedTime1stHalf?: number;
  addedTime2ndHalf?: number;
  kickoffTime?: string;
  currentPeriod?: '1st_half' | 'halftime' | '2nd_half' | 'fulltime';
  homeStartingPlayerIds?: string[];
  homeSubstitutePlayerIds?: string[];
  awayStartingPlayerIds?: string[];
  awaySubstitutePlayerIds?: string[];
  homeFormation?: string;
  awayFormation?: string;
  matchFormat?: '7v7' | '8v8';
  seasonNumber?: number;
  homeLineupSubmitted?: boolean;
  awayLineupSubmitted?: boolean;
}

export interface PushNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  teamId?: string;
  type: 'goal' | 'card' | 'match' | 'system';
}

export type AppScrollState = 1 | 2 | 3 | 4 | 5;
