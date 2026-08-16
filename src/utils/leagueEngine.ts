import { Team, Match } from '../types';

/**
 * Computes official Sunday League regular season standings, recalculates player stats
 * (goals, assists, cards, matchesPlayed) from match telemetry, and automatically updates
 * the Week 4 Finals fixture (FIX-007) with the top 2 teams in current standings.
 */
export function computeStandingsAndFinalsMatch(
  teamsList: Team[],
  matchesList: Match[]
): { updatedTeams: Team[]; updatedMatches: Match[] } {
  // Separate regular matches from finals
  const regularMatches = matchesList.filter(
    (m) => m.matchType !== 'Finals' && m.id !== 'FIX-007'
  );

  // Re-calculate stats for each team strictly from regular season matches & events
  const recalculatedTeams: Team[] = teamsList.map((team) => {
    let played = 0;
    let won = 0;
    let drawn = 0;
    let lost = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    const formList: ('W' | 'D' | 'L')[] = [];
    const playerGoalsCount: Record<string, number> = {};

    regularMatches.forEach((m) => {
      const isFinished = m.isFinished || m.status === 'ended' || m.homeScore > 0 || m.awayScore > 0 || (m.events && m.events.length > 0);
      if (!isFinished) return;

      const isHome = m.homeTeamId === team.id;
      const isAway = m.awayTeamId === team.id;

      if (!isHome && !isAway) return;

      played += 1;
      const teamScore = isHome ? m.homeScore : m.awayScore;
      const oppScore = isHome ? m.awayScore : m.homeScore;

      goalsFor += teamScore;
      goalsAgainst += oppScore;

      if (teamScore > oppScore) {
        won += 1;
        formList.push('W');
      } else if (teamScore === oppScore) {
        drawn += 1;
        formList.push('D');
      } else {
        lost += 1;
        formList.push('L');
      }
    });

    // Accumulate player telemetry stats across ALL matches
    const updatedRoster = (team.roster || []).map((player) => {
      let telemetryGoals = 0;
      let telemetryAssists = 0;
      let telemetryYellows = 0;
      let telemetryReds = 0;
      let telemetryMotm = 0;
      let playerGamesCount = 0;

      matchesList.forEach((m) => {
        const isMatchStarted = m.isFinished || m.status === 'ended' || m.isLive || m.homeScore > 0 || m.awayScore > 0 || (m.events && m.events.length > 0);
        const isTeamInMatch = m.homeTeamId === team.id || m.awayTeamId === team.id;
        
        if (isTeamInMatch && isMatchStarted) {
          const isHome = m.homeTeamId === team.id;
          const lineup = isHome ? m.homeStartingPlayerIds : m.awayStartingPlayerIds;
          const subs = isHome ? m.homeSubstitutePlayerIds : m.awaySubstitutePlayerIds;
          
          if (!lineup || lineup.length === 0 || lineup.includes(player.id) || (subs && subs.includes(player.id))) {
            playerGamesCount += 1;
          }
        }

        // Count MOTM Awards
        if (m.isFinished || m.status === 'ended' || m.homeScore > 0 || m.awayScore > 0) {
          if (m.motmPlayerId && m.motmPlayerId === player.id) {
            telemetryMotm += 1;
          } else if (m.motmPlayerName && m.motmPlayerName.toLowerCase().trim() === player.name.toLowerCase().trim()) {
            telemetryMotm += 1;
          }
        }

        // Count events in match
        (m.events || []).forEach((evt) => {
          const isGoal = evt.type === 'goal';
          const isYellow = evt.type === 'yellow_card';
          const isRed = evt.type === 'red_card';

          const isPlayerMatch =
            evt.player &&
            (evt.player === player.id || evt.player.toLowerCase().trim() === player.name.toLowerCase().trim());

          const isAssistMatch =
            evt.assistPlayer &&
            (evt.assistPlayer === player.id || evt.assistPlayer.toLowerCase().trim() === player.name.toLowerCase().trim());

          if (isGoal && isPlayerMatch) {
            telemetryGoals += 1;
          }
          if (isGoal && isAssistMatch) {
            telemetryAssists += 1;
          }
          if (isYellow && isPlayerMatch) {
            telemetryYellows += 1;
          }
          if (isRed && isPlayerMatch) {
            telemetryReds += 1;
          }
        });
      });

      if (telemetryGoals > 0) {
        playerGoalsCount[player.name] = telemetryGoals;
      }

      return {
        ...player,
        goals: telemetryGoals,
        assists: telemetryAssists,
        yellowCards: telemetryYellows,
        redCards: telemetryReds,
        motmAwards: telemetryMotm,
        matchesPlayed: playerGamesCount,
      };
    });

    const goalDifference = goalsFor - goalsAgainst;
    const points = won * 3 + drawn * 1;
    const form = formList.slice(-5);

    // Determine top scorer name
    let topScorer = 'N/A';
    let maxGoals = 0;
    Object.entries(playerGoalsCount).forEach(([pName, gCount]) => {
      if (gCount > maxGoals) {
        maxGoals = gCount;
        topScorer = `${pName} (${gCount} Goals)`;
      }
    });

    if (topScorer === 'N/A' && updatedRoster.length > 0) {
      const captain = updatedRoster.find((p) => p.isCaptain);
      if (captain) {
        topScorer = `${captain.name} (Captain)`;
      }
    }

    return {
      ...team,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
      points,
      form,
      topScorer,
      roster: updatedRoster,
    };
  });

  // Sort teams by Points -> Goal Difference -> Goals For -> Name
  const sortedTeams = [...recalculatedTeams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.name.localeCompare(b.name);
  });

  // Assign updated ranks (1, 2, 3...)
  const rankedTeams = sortedTeams.map((t, idx) => ({
    ...t,
    rank: idx + 1,
  }));

  // Identify Top 2 teams for the Grand Finals ONLY if games have been played
  const hasPlayedMatches = regularMatches.some(
    (m) => m.isFinished || m.status === 'ended' || m.homeScore > 0 || m.awayScore > 0
  );

  const top1Team = hasPlayedMatches ? (rankedTeams[0] || teamsList[0]) : null;
  const top2Team = hasPlayedMatches ? (rankedTeams[1] || teamsList[1]) : null;

  // Update Week 4 Finals Match (FIX-007) with dynamic top 2 teams or TBD placeholders
  const updatedMatches = matchesList.map((m) => {
    if (m.id === 'FIX-007' || m.matchType === 'Finals') {
      if (top1Team && top2Team) {
        return {
          ...m,
          homeTeamId: top1Team.id,
          awayTeamId: top2Team.id,
          venue: `De Anza Stadium (Finals: ${top1Team.name} vs ${top2Team.name})`,
        };
      }
      return {
        ...m,
        homeTeamId: '1st Place',
        awayTeamId: '2nd Place',
        venue: 'De Anza Stadium (Finals: 1st Place vs 2nd Place)',
      };
    }
    return m;
  });

  return {
    updatedTeams: rankedTeams,
    updatedMatches,
  };
}

/**
 * Executes a Season Rollover:
 * 1. Preserves all-time H2H match history and adds current season's winner to club achievements.
 * 2. Saves accumulated player goals/assists/matches to career totals.
 * 3. Resets current season standings to 0 for Season N+1.
 */
export function rolloverToNewSeason(
  currentSeasonNumber: number,
  teams: Team[],
  matches: Match[]
): { nextSeasonNumber: number; updatedTeams: Team[]; newMatches: Match[] } {
  const nextSeasonNumber = currentSeasonNumber + 1;

  // Find current season champion
  const sorted = [...teams].sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference);
  const champion = sorted[0];

  const updatedTeams = teams.map((team) => {
    const isChamp = champion && team.id === champion.id;
    const existingAchievements = team.achievements || [];
    const newAchievement = isChamp ? `Season ${currentSeasonNumber} League Champions 🏆` : null;

    const updatedRoster = (team.roster || []).map((player) => ({
      ...player,
      careerGoals: (player.careerGoals ?? 0) + (player.goals || 0),
      careerAssists: (player.careerAssists ?? 0) + (player.assists || 0),
      careerMatches: (player.careerMatches ?? 0) + (player.matchesPlayed || 0),
      // Reset current season stats
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      matchesPlayed: 0,
    }));

    return {
      ...team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
      topScorer: 'N/A',
      achievements: newAchievement ? [newAchievement, ...existingAchievements] : existingAchievements,
      roster: updatedRoster,
    };
  });

  // Generate Season N+1 Schedule with reset scores & match events preserved in archive
  const newMatches: Match[] = [
    {
      id: `FIX-S${nextSeasonNumber}-001`,
      homeTeamId: 'jhyap-warriors',
      awayTeamId: 'momo-strikers',
      homeScore: 0,
      awayScore: 0,
      minute: 0,
      isLive: false,
      isFinished: false,
      startTime: 'Sun, Sep 6 • 8:30 AM',
      venue: 'De Anza Stadium (Pitch 1)',
      possessionHome: 50,
      possessionAway: 50,
      shotsHome: 0,
      shotsAway: 0,
      shotsOnTargetHome: 0,
      shotsOnTargetAway: 0,
      foulsHome: 0,
      foulsAway: 0,
      events: [],
      weekNumber: 1,
      matchType: 'Regular Season',
      status: 'scheduled',
      seasonNumber: nextSeasonNumber,
    },
    {
      id: `FIX-S${nextSeasonNumber}-002`,
      homeTeamId: 'momo-strikers',
      awayTeamId: 'no-stamina',
      homeScore: 0,
      awayScore: 0,
      minute: 0,
      isLive: false,
      isFinished: false,
      startTime: 'Sun, Sep 13 • 8:30 AM',
      venue: 'De Anza Stadium (Pitch 1)',
      possessionHome: 50,
      possessionAway: 50,
      shotsHome: 0,
      shotsAway: 0,
      shotsOnTargetHome: 0,
      shotsOnTargetAway: 0,
      foulsHome: 0,
      foulsAway: 0,
      events: [],
      weekNumber: 2,
      matchType: 'Regular Season',
      status: 'scheduled',
      seasonNumber: nextSeasonNumber,
    },
    {
      id: `FIX-S${nextSeasonNumber}-003`,
      homeTeamId: 'no-stamina',
      awayTeamId: 'jhyap-warriors',
      homeScore: 0,
      awayScore: 0,
      minute: 0,
      isLive: false,
      isFinished: false,
      startTime: 'Sun, Sep 20 • 8:30 AM',
      venue: 'De Anza Stadium (Pitch 1)',
      possessionHome: 50,
      possessionAway: 50,
      shotsHome: 0,
      shotsAway: 0,
      shotsOnTargetHome: 0,
      shotsOnTargetAway: 0,
      foulsHome: 0,
      foulsAway: 0,
      events: [],
      weekNumber: 3,
      matchType: 'Regular Season',
      status: 'scheduled',
      seasonNumber: nextSeasonNumber,
    },
    {
      id: `FIX-S${nextSeasonNumber}-004`,
      homeTeamId: '1st Place',
      awayTeamId: '2nd Place',
      homeScore: 0,
      awayScore: 0,
      minute: 0,
      isLive: false,
      isFinished: false,
      startTime: 'Sun, Sep 27 • 9:00 AM',
      venue: 'De Anza Stadium (Grand Finals)',
      possessionHome: 50,
      possessionAway: 50,
      shotsHome: 0,
      shotsAway: 0,
      shotsOnTargetHome: 0,
      shotsOnTargetAway: 0,
      foulsHome: 0,
      foulsAway: 0,
      events: [],
      weekNumber: 4,
      matchType: 'Finals',
      status: 'scheduled',
      seasonNumber: nextSeasonNumber,
    },
  ];

  return {
    nextSeasonNumber,
    updatedTeams,
    newMatches,
  };
}

/**
 * Returns canonical Sunday League jersey colors per team:
 * - Jhyap Warriors: White icon
 * - MoMo Strikers: Blue icon
 * - No Stamina Hustlers (NSW): Red icon
 */
export function getTeamJerseyStyle(teamId?: string, isHomeFallback?: boolean) {
  const normId = (teamId || '').toLowerCase();

  if (normId.includes('jhyap')) {
    // Jhyap Warriors -> White Color Icon
    return {
      gradient: 'from-slate-100 via-white to-slate-200',
      border: 'border-slate-300',
      numberText: 'text-slate-950 font-black',
      ringBg: 'bg-white/40 border-white shadow-[0_0_15px_rgba(255,255,255,0.7)]',
      nameTagBorder: 'border-white/60 text-white bg-slate-900/90',
      collar: 'bg-slate-300',
    };
  }

  if (normId.includes('momo')) {
    // MoMo Strikers -> Blue Color Icon
    return {
      gradient: 'from-[#4B7CEC] to-[#2B54B8]',
      border: 'border-blue-300/70',
      numberText: 'text-white font-black',
      ringBg: 'bg-[#4B7CEC]/40 border-[#4B7CEC] shadow-[#4B7CEC]',
      nameTagBorder: 'border-[#4B7CEC]/50 text-white bg-black/85',
      collar: 'bg-white/80',
    };
  }

  if (normId.includes('no-stamina') || normId.includes('nsh') || normId.includes('hustler')) {
    // No Stamina Hustlers (NSW) -> Red Color Icon
    return {
      gradient: 'from-[#EF4444] to-[#991B1B]',
      border: 'border-rose-300/70',
      numberText: 'text-white font-black',
      ringBg: 'bg-rose-500/40 border-rose-500 shadow-rose-500',
      nameTagBorder: 'border-rose-500/50 text-white bg-black/85',
      collar: 'bg-white/80',
    };
  }

  // Fallback if generic team ID:
  if (isHomeFallback) {
    return {
      gradient: 'from-[#4B7CEC] to-[#2B54B8]',
      border: 'border-blue-300/70',
      numberText: 'text-white font-black',
      ringBg: 'bg-[#4B7CEC]/40 border-[#4B7CEC] shadow-[#4B7CEC]',
      nameTagBorder: 'border-[#4B7CEC]/50 text-white bg-black/85',
      collar: 'bg-white/80',
    };
  } else {
    return {
      gradient: 'from-[#EF4444] to-[#991B1B]',
      border: 'border-rose-300/70',
      numberText: 'text-white font-black',
      ringBg: 'bg-rose-500/40 border-rose-500 shadow-rose-500',
      nameTagBorder: 'border-rose-500/50 text-white bg-black/85',
      collar: 'bg-white/80',
    };
  }
}
