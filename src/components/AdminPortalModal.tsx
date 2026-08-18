import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldAlert,
  Users,
  Radio,
  Bell,
  Key,
  Save,
  CheckCircle2,
  Database,
  Lock,
  Building2,
  Smartphone,
  UserCheck,
  Play,
  Pause,
  Zap,
  LogIn,
  LogOut,
  Clock,
  PlusCircle,
  Trash2,
  Flag,
  Trophy,
  Target,
  AlertTriangle,
  RotateCcw,
  Activity,
  Check,
  Award,
  ChevronRight,
  Sparkles,
  MoreVertical,
  Unlock,
  Edit2,
  Plus,
  UserPlus,
  Star,
  Briefcase,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import { Team, Match, Player, PushNotification, AdminUser, BoardMember, MatchEvent } from '../types';
import { TeamLogo } from './TeamLogos';
import { Player3DAvatar } from './Player3DAvatar';
import { PlayerFormModal } from './PlayerFormModal';
import { AutoEventWizardModal } from './AutoEventWizardModal';
import { EditMatchEventModal } from './EditMatchEventModal';
import { MatchLineupBuilder } from './MatchLineupBuilder';
import { CompletedMatchAnalytics } from './CompletedMatchAnalytics';
import { LiveTelemetryConsole } from './LiveTelemetryConsole';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { resetFirestoreToDefaults, saveMatchToFirestore } from '../lib/firestoreService';
import { formatClockTime } from '../utils/formatClock';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Team[];
  matches: Match[];
  notifications: PushNotification[];
  onUpdateRoster: (teamId: string, updatedRoster: Player[]) => void;
  onUpdateTeamDetails?: (teamId: string, details: Partial<Team>) => void;
  onUpdateMatchScore: (matchId: string, homeScore: number, awayScore: number, newEvent?: MatchEvent) => void;
  onUpdateFullMatch?: (matchId: string, updatedMatch: Partial<Match>) => void;
  onSendPushNotification: (title: string, message: string, teamId?: string) => void;
  activeAdminTeamId: string | null;
  onSelectAdminTeam: (teamId: string | null) => void;
  onSelectPlayer?: (player: Player, team: Team) => void;
  onRolloverSeason?: () => void;
  currentSeasonNumber?: number;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  teams,
  matches,
  notifications,
  onUpdateRoster,
  onUpdateTeamDetails,
  onUpdateMatchScore,
  onUpdateFullMatch,
  onSendPushNotification,
  activeAdminTeamId,
  onSelectAdminTeam,
  onSelectPlayer,
  onRolloverSeason,
  currentSeasonNumber = 1,
}) => {
  // Login / Authentication State
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    if (activeAdminTeamId) {
      const matchTeam = teams.find((t) => t.id === activeAdminTeamId);
      if (matchTeam) {
        return {
          teamId: matchTeam.id,
          adminName: matchTeam.adminName || 'Team Admin',
          role: 'team_admin',
          teamName: matchTeam.name,
        };
      }
    }
    return null;
  });

  const [loginTeamId, setLoginTeamId] = useState<string>(teams[0]?.id || 'momo-strikers');
  const [loginPasscode, setLoginPasscode] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isFirebaseAuthLoading, setIsFirebaseAuthLoading] = useState<boolean>(false);
  const [isResyncingDb, setIsResyncingDb] = useState<boolean>(false);
  const [resyncSuccessMsg, setResyncSuccessMsg] = useState<string | null>(null);

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'matches' | 'rosters' | 'club' | 'broadcast' | 'database'>('matches');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Selected Fixture for Live Recording Popup Modal
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const editingMatch = matches.find((m) => m.id === editingMatchId);
  const [selectedMatchTab, setSelectedMatchTab] = useState<'analytics' | 'lineup' | 'events'>('analytics');

  // Live Controls Unlock window (5 minutes before scheduled kickoff)
  const [forceUnlockLiveControls, setForceUnlockLiveControls] = useState<boolean>(false);
  const [showLineupInLiveMode, setShowLineupInLiveMode] = useState<boolean>(false);
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Tick current time every second when match fixture modal is open
  useEffect(() => {
    if (!isOpen || !editingMatchId) return;
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, editingMatchId]);

  const handleSelectMatchFixture = (matchItem: Match) => {
    setEditingMatchId(matchItem.id);
    setForceUnlockLiveControls(false);
    setShowLineupInLiveMode(false);
    if (matchItem.isFinished || matchItem.status === 'ended') {
      setSelectedMatchTab('analytics');
    } else if (matchItem.status === 'scheduled' || (!matchItem.isLive && !matchItem.isFinished)) {
      setSelectedMatchTab('lineup');
    } else {
      setSelectedMatchTab('events');
    }
  };

  // Helper function to extract or parse Kickoff Date from Match
  const getMatchKickoffDate = (match: Match): Date | null => {
    if (match.kickoffTime) {
      const d = new Date(match.kickoffTime);
      if (!isNaN(d.getTime())) return d;
    }
    if (!match.startTime) return null;
    const directDate = new Date(match.startTime);
    if (!isNaN(directDate.getTime())) return directDate;

    // Handle human string format like "Today, 4:00 PM" or "Sun, Aug 9 • 3:30 PM"
    const timeMatch = match.startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3]?.toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      const targetDate = new Date();
      const monthMatch = match.startTime.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/i);
      if (monthMatch) {
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthIndex = monthNames.indexOf(monthMatch[1].toLowerCase());
        const day = parseInt(monthMatch[2], 10);
        if (monthIndex !== -1) {
          targetDate.setMonth(monthIndex, day);
        }
      }
      targetDate.setHours(hours, minutes, 0, 0);
      return targetDate;
    }
    return null;
  };

  const kickoffDate = editingMatch ? getMatchKickoffDate(editingMatch) : null;
  const timeDiffMs = kickoffDate ? kickoffDate.getTime() - nowTime : 0;
  const minutesUntilKickoff = timeDiffMs / (1000 * 60);

  // Live recording & clock controls unlock ONLY within the 5-minute window preceding scheduled kickoff (or if live/finished/force unlocked)
  const isLiveRecordingUnlocked = (() => {
    if (!editingMatch) return false;
    if (editingMatch.isLive || editingMatch.isFinished) return true;
    if (editingMatch.status === '1st_half' || editingMatch.status === 'halftime' || editingMatch.status === '2nd_half' || editingMatch.status === 'ended') return true;
    if (forceUnlockLiveControls) return true;
    if (!kickoffDate) return true;
    return minutesUntilKickoff <= 5;
  })();

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Selected Team for Roster & Club editing
  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    currentAdmin && currentAdmin.teamId !== 'all' ? currentAdmin.teamId : teams[0]?.id || 'momo-strikers'
  );

  // Sync selected team and current admin persona with activeAdminTeamId prop
  useEffect(() => {
    if (activeAdminTeamId === 'all' || activeAdminTeamId === 'league_commish') {
      setCurrentAdmin({
        teamId: 'all',
        adminName: 'Sunday League Commissioner',
        role: 'league_commish',
      });
      if (!selectedTeamId && teams.length > 0) {
        setSelectedTeamId(teams[0].id);
      }
    } else if (activeAdminTeamId) {
      const matchTeam = teams.find((t) => t.id === activeAdminTeamId);
      if (matchTeam) {
        setCurrentAdmin({
          teamId: matchTeam.id,
          adminName: matchTeam.adminName || 'Team Admin',
          role: 'team_admin',
          teamName: matchTeam.name,
        });
        setSelectedTeamId(matchTeam.id);
      }
    }
  }, [activeAdminTeamId, teams]);

  useEffect(() => {
    if (currentAdmin && currentAdmin.teamId !== 'all') {
      setSelectedTeamId(currentAdmin.teamId);
    } else if (currentAdmin && currentAdmin.teamId === 'all') {
      if (!selectedTeamId || !teams.some((t) => t.id === selectedTeamId)) {
        if (teams.length > 0) setSelectedTeamId(teams[0].id);
      }
    }
  }, [currentAdmin, teams]);

  // Live Match Recording Local Form State
  const [homeScoreInput, setHomeScoreInput] = useState<number>(editingMatch?.homeScore || 0);
  const [awayScoreInput, setAwayScoreInput] = useState<number>(editingMatch?.awayScore || 0);
  const [matchMinute, setMatchMinute] = useState<number>(editingMatch?.minute || 0);
  const [halfDuration, setHalfDuration] = useState<number>(editingMatch?.halfDurationMinutes || 20);
  const [addedTime1stHalf, setAddedTime1stHalf] = useState<number>(editingMatch?.addedTime1stHalf || 0);
  const [addedTime2ndHalf, setAddedTime2ndHalf] = useState<number>(editingMatch?.addedTime2ndHalf || 0);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  // Quick Event Generator State
  const [eventTeamId, setEventTeamId] = useState<string>(editingMatch?.homeTeamId || '');
  const [eventPlayerName, setEventPlayerName] = useState<string>('');
  const [eventAssistPlayer, setEventAssistPlayer] = useState<string>('');
  const [subOutPlayerName, setSubOutPlayerName] = useState<string>('');
  const [eventCategory, setEventCategory] = useState<'goal' | 'yellow_card' | 'red_card' | 'sub' | 'shot_on_target' | 'foul' | 'corner'>('goal');
  const [eventCustomNote, setEventCustomNote] = useState<string>('');

  // Auto Event Wizard Popup State
  const [isAutoWizardOpen, setIsAutoWizardOpen] = useState<boolean>(false);
  const [wizardEventType, setWizardEventType] = useState<'goal' | 'yellow_card' | 'red_card' | 'sub' | 'shot_on_target' | 'foul' | 'corner'>('goal');

  // Inline Quick Event Logger state (NO modal popups)
  const [inlineEventType, setInlineEventType] = useState<'goal' | 'yellow_card' | 'red_card' | 'sub' | 'shot_on_target' | 'foul' | 'corner'>('goal');
  const [inlineTeamId, setInlineTeamId] = useState<string>('');
  const [inlinePlayerName, setInlinePlayerName] = useState<string>('');
  const [inlineAssistPlayerName, setInlineAssistPlayerName] = useState<string>('');
  const [inlineSubOutPlayerName, setInlineSubOutPlayerName] = useState<string>('');
  const [inlineCustomNote, setInlineCustomNote] = useState<string>('');
  const [inlineSuccessToast, setInlineSuccessToast] = useState<string | null>(null);

  // Player of the Match (MOTM) Selection Modal State
  const [showMotmModal, setShowMotmModal] = useState<boolean>(false);
  const [selectedMotmPlayerId, setSelectedMotmPlayerId] = useState<string>('');
  const [selectedMotmPlayerName, setSelectedMotmPlayerName] = useState<string>('');

  // Fixture Schedule Editor Modal State (League Commissioner Exclusive)
  const [isFixtureEditModalOpen, setIsFixtureEditModalOpen] = useState<boolean>(false);
  const [fixtureToEdit, setFixtureToEdit] = useState<Match | null>(null);

  const [editFixtureHomeId, setEditFixtureHomeId] = useState<string>('');
  const [editFixtureAwayId, setEditFixtureAwayId] = useState<string>('');
  const [editFixtureStartTime, setEditFixtureStartTime] = useState<string>('');
  const [editFixtureVenue, setEditFixtureVenue] = useState<string>('');
  const [editFixtureWeekNumber, setEditFixtureWeekNumber] = useState<number>(1);
  const [editFixtureMatchType, setEditFixtureMatchType] = useState<string>('Regular');
  const [editFixtureMatchFormat, setEditFixtureMatchFormat] = useState<'7v7' | '8v8'>('7v7');
  const [editFixtureHalfDuration, setEditFixtureHalfDuration] = useState<number>(20);
  const [editFixtureStatus, setEditFixtureStatus] = useState<string>('scheduled');
  const [editFixtureHomeScore, setEditFixtureHomeScore] = useState<number>(0);
  const [editFixtureAwayScore, setEditFixtureAwayScore] = useState<number>(0);
  const [editFixtureMotmPlayerName, setEditFixtureMotmPlayerName] = useState<string>('');

  const handleOpenEditFixtureModal = (matchItem: Match) => {
    setFixtureToEdit(matchItem);
    setEditFixtureHomeId(matchItem.homeTeamId);
    setEditFixtureAwayId(matchItem.awayTeamId);
    setEditFixtureStartTime(matchItem.startTime || 'Sun, Aug 16 • 8:30 AM');
    setEditFixtureVenue(matchItem.venue || 'De Anza Stadium');
    setEditFixtureWeekNumber(matchItem.weekNumber || 1);
    setEditFixtureMatchType(matchItem.matchType || 'Regular');
    setEditFixtureMatchFormat(matchItem.matchFormat || '7v7');
    setEditFixtureHalfDuration(matchItem.halfDurationMinutes || 20);
    setEditFixtureStatus(matchItem.status || 'scheduled');
    setEditFixtureHomeScore(matchItem.homeScore || 0);
    setEditFixtureAwayScore(matchItem.awayScore || 0);
    setEditFixtureMotmPlayerName(matchItem.motmPlayerName || '');
    setIsFixtureEditModalOpen(true);
  };

  const handleOpenCreateFixtureModal = () => {
    const newId = `FIX-00${matches.length + 1}`;
    const defaultHome = teams[0]?.id || 'momo-strikers';
    const defaultAway = teams[1]?.id || 'jhyap-warriors';
    const draftMatch: Match = {
      id: newId,
      homeTeamId: defaultHome,
      awayTeamId: defaultAway,
      homeScore: 0,
      awayScore: 0,
      minute: 0,
      isLive: false,
      isFinished: false,
      startTime: 'Sun, Aug 30 • 8:30 AM',
      venue: 'De Anza Stadium',
      possessionHome: 50,
      possessionAway: 50,
      shotsHome: 0,
      shotsAway: 0,
      shotsOnTargetHome: 0,
      shotsOnTargetAway: 0,
      foulsHome: 0,
      foulsAway: 0,
      events: [],
      weekNumber: matches.length > 0 ? (matches[matches.length - 1].weekNumber || 1) : 1,
      matchType: 'Regular',
      status: 'scheduled',
      matchFormat: '7v7',
      halfDurationMinutes: 20,
    };
    setFixtureToEdit(draftMatch);
    setEditFixtureHomeId(draftMatch.homeTeamId);
    setEditFixtureAwayId(draftMatch.awayTeamId);
    setEditFixtureStartTime(draftMatch.startTime);
    setEditFixtureVenue(draftMatch.venue);
    setEditFixtureWeekNumber(draftMatch.weekNumber || 1);
    setEditFixtureMatchType(draftMatch.matchType || 'Regular');
    setEditFixtureMatchFormat(draftMatch.matchFormat || '7v7');
    setEditFixtureHalfDuration(draftMatch.halfDurationMinutes || 20);
    setEditFixtureStatus('scheduled');
    setEditFixtureHomeScore(0);
    setEditFixtureAwayScore(0);
    setEditFixtureMotmPlayerName('');
    setIsFixtureEditModalOpen(true);
  };

  const handleSaveFixtureModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixtureToEdit || !onUpdateFullMatch) return;

    const isEnded = editFixtureStatus === 'ended';
    const isLiveMatch = editFixtureStatus === '1st_half' || editFixtureStatus === '2nd_half' || editFixtureStatus === 'halftime';

    const updatedPayload: Partial<Match> = {
      homeTeamId: editFixtureHomeId,
      awayTeamId: editFixtureAwayId,
      startTime: editFixtureStartTime,
      venue: editFixtureVenue,
      weekNumber: Number(editFixtureWeekNumber) || 1,
      matchType: editFixtureMatchType,
      matchFormat: editFixtureMatchFormat,
      halfDurationMinutes: Number(editFixtureHalfDuration) || 20,
      status: editFixtureStatus as any,
      isFinished: isEnded,
      isLive: isLiveMatch,
      homeScore: Number(editFixtureHomeScore) || 0,
      awayScore: Number(editFixtureAwayScore) || 0,
      motmPlayerName: editFixtureMotmPlayerName.trim() || undefined,
    };

    onUpdateFullMatch(fixtureToEdit.id, updatedPayload);
    setIsFixtureEditModalOpen(false);
    setFixtureToEdit(null);
  };

  // Sync inlineTeamId when editingMatch changes
  useEffect(() => {
    if (editingMatch) {
      setInlineTeamId(editingMatch.homeTeamId);
      setInlinePlayerName('');
      setInlineAssistPlayerName('');
      setInlineSubOutPlayerName('');
      setInlineCustomNote('');
      setSelectedMotmPlayerId(editingMatch.motmPlayerId || '');
      setSelectedMotmPlayerName(editingMatch.motmPlayerName || '');
    }
  }, [editingMatch?.id, editingMatch?.motmPlayerName]);

  const handleConfirmMotmAward = () => {
    if (!editingMatch || !onUpdateFullMatch || !selectedMotmPlayerName) return;

    onUpdateFullMatch(editingMatch.id, {
      motmPlayerId: selectedMotmPlayerId || undefined,
      motmPlayerName: selectedMotmPlayerName,
    });

    setShowMotmModal(false);
  };

  const handleConfirmInlineEvent = () => {
    if (!editingMatch) return;

    const selectedTeamObj = teams.find((t) => t.id === inlineTeamId) || teams[0];
    const isHomeTeam = inlineTeamId === editingMatch.homeTeamId;

    if (!inlinePlayerName && inlineEventType !== 'corner') {
      alert('Please select a player from the team roster dropdown!');
      return;
    }

    if (inlineEventType === 'sub' && !inlineSubOutPlayerName) {
      alert('Please select the player subbed out!');
      return;
    }

    setSyncStatus('syncing');

    let updatedHomeScore = homeScoreInput;
    let updatedAwayScore = awayScoreInput;

    let desc = '';
    switch (inlineEventType) {
      case 'goal':
        if (isHomeTeam) updatedHomeScore += 1;
        else updatedAwayScore += 1;
        desc = `⚽ GOAL! ${inlinePlayerName || 'Striker'} scores for ${selectedTeamObj.name}!${
          inlineAssistPlayerName ? ` (Assist: ${inlineAssistPlayerName})` : ''
        }`;
        break;
      case 'yellow_card':
        desc = `🟨 YELLOW CARD issued to ${inlinePlayerName} (${selectedTeamObj.shortName}).`;
        break;
      case 'red_card':
        desc = `🟥 RED CARD! ${inlinePlayerName} (${selectedTeamObj.shortName}) sent off by match official!`;
        break;
      case 'sub':
        desc = `🔄 SUBSTITUTION (${selectedTeamObj.shortName}): ${inlinePlayerName} comes ON for ${inlineSubOutPlayerName}.`;
        break;
      case 'shot_on_target':
        desc = `🎯 SHOT ON TARGET by ${inlinePlayerName} (${selectedTeamObj.shortName}) saved by keeper!`;
        break;
      case 'foul':
        desc = `🛑 FOUL committed by ${inlinePlayerName} (${selectedTeamObj.shortName}).`;
        break;
      case 'corner':
        desc = `🚩 CORNER KICK awarded to ${selectedTeamObj.name}.`;
        break;
    }

    if (inlineCustomNote.trim()) {
      desc += ` - ${inlineCustomNote.trim()}`;
    }

    const currentPeriodStr =
      editingMatch.status === '1st_half'
        ? '1st_half'
        : editingMatch.status === '2nd_half'
        ? '2nd_half'
        : editingMatch.status === 'halftime'
        ? 'halftime'
        : 'fulltime';

    const newEvt: MatchEvent = {
      id: `evt-${Date.now()}`,
      minute: matchMinute,
      second: editingMatch.matchSeconds || matchMinute * 60,
      type: inlineEventType,
      teamId: inlineTeamId || editingMatch.homeTeamId,
      player: inlinePlayerName || selectedTeamObj.name || 'Player',
      description: desc,
      period: currentPeriodStr,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      assistPlayer: inlineAssistPlayerName || undefined,
      subOutPlayer: inlineSubOutPlayerName || undefined,
    };

    setHomeScoreInput(updatedHomeScore);
    setAwayScoreInput(updatedAwayScore);

    onUpdateMatchScore(editingMatch.id, updatedHomeScore, updatedAwayScore, newEvt);

    if (onUpdateFullMatch) {
      if (inlineEventType === 'shot_on_target') {
        if (isHomeTeam) {
          onUpdateFullMatch(editingMatch.id, { shotsOnTargetHome: (editingMatch.shotsOnTargetHome || 0) + 1 });
        } else {
          onUpdateFullMatch(editingMatch.id, { shotsOnTargetAway: (editingMatch.shotsOnTargetAway || 0) + 1 });
        }
      } else if (inlineEventType === 'foul') {
        if (isHomeTeam) {
          onUpdateFullMatch(editingMatch.id, { foulsHome: (editingMatch.foulsHome || 0) + 1 });
        } else {
          onUpdateFullMatch(editingMatch.id, { foulsAway: (editingMatch.foulsAway || 0) + 1 });
        }
      }
    }

    // Reset inline player selections
    setInlinePlayerName('');
    setInlineAssistPlayerName('');
    setInlineSubOutPlayerName('');
    setInlineCustomNote('');

    const timeFormatted = formatClockTime(matchMinute, editingMatch?.matchSeconds);
    setInlineSuccessToast(`✅ Logged ${inlineEventType.toUpperCase()} for ${selectedTeamObj.shortName} at ${timeFormatted}!`);
    setTimeout(() => {
      setInlineSuccessToast(null);
    }, 4000);

    setTimeout(() => {
      setSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 500);
  };

  // Manual Event Editor Modal State (For Past Match Corrections)
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState<boolean>(false);
  const [eventToEdit, setEventToEdit] = useState<MatchEvent | null>(null);

  const handleOpenEditEventModal = (evt: MatchEvent | null) => {
    setEventToEdit(evt);
    setIsEditEventModalOpen(true);
  };

  const handleSaveEditedEvents = (updatedEvents: MatchEvent[], newHomeScore: number, newAwayScore: number) => {
    if (!editingMatch || !onUpdateFullMatch) return;
    setSyncStatus('syncing');

    setHomeScoreInput(newHomeScore);
    setAwayScoreInput(newAwayScore);

    onUpdateFullMatch(editingMatch.id, {
      events: updatedEvents,
      homeScore: newHomeScore,
      awayScore: newAwayScore,
    });

    setTimeout(() => {
      setSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 500);
  };

  const openWizardWithCategory = (cat: 'goal' | 'yellow_card' | 'red_card' | 'sub' | 'shot_on_target' | 'foul' | 'corner') => {
    setWizardEventType(cat);
    setIsAutoWizardOpen(true);
  };

  const handleConfirmWizardEvent = (eventData: {
    type: 'goal' | 'yellow_card' | 'red_card' | 'sub' | 'shot_on_target' | 'foul' | 'corner';
    teamId: string;
    player: string;
    assistPlayer?: string;
    subOutPlayer?: string;
    minute: number;
    customNote?: string;
    description: string;
    isHomeScoreIncrement?: boolean;
    isAwayScoreIncrement?: boolean;
  }) => {
    if (!editingMatch) return;
    setSyncStatus('syncing');

    let updatedHomeScore = homeScoreInput;
    let updatedAwayScore = awayScoreInput;

    if (eventData.isHomeScoreIncrement) updatedHomeScore += 1;
    if (eventData.isAwayScoreIncrement) updatedAwayScore += 1;

    const currentPeriodStr =
      editingMatch.status === '1st_half'
        ? '1st_half'
        : editingMatch.status === '2nd_half'
          ? '2nd_half'
          : editingMatch.status === 'halftime'
            ? 'halftime'
            : 'fulltime';

    const newEventObj: MatchEvent = {
      id: `evt-${Date.now()}`,
      minute: eventData.minute,
      type: eventData.type,
      teamId: eventData.teamId,
      player: eventData.player,
      description: eventData.description,
      period: currentPeriodStr,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      assistPlayer: eventData.assistPlayer,
      subOutPlayer: eventData.subOutPlayer,
    };

    setHomeScoreInput(updatedHomeScore);
    setAwayScoreInput(updatedAwayScore);

    onUpdateMatchScore(editingMatch.id, updatedHomeScore, updatedAwayScore, newEventObj);

    // Update shots/fouls stats if applicable
    if (onUpdateFullMatch) {
      const isHome = eventData.teamId === editingMatch.homeTeamId;
      if (eventData.type === 'shot_on_target') {
        if (isHome) {
          onUpdateFullMatch(editingMatch.id, { shotsOnTargetHome: (editingMatch.shotsOnTargetHome || 0) + 1 });
        } else {
          onUpdateFullMatch(editingMatch.id, { shotsOnTargetAway: (editingMatch.shotsOnTargetAway || 0) + 1 });
        }
      } else if (eventData.type === 'foul') {
        if (isHome) {
          onUpdateFullMatch(editingMatch.id, { foulsHome: (editingMatch.foulsHome || 0) + 1 });
        } else {
          onUpdateFullMatch(editingMatch.id, { foulsAway: (editingMatch.foulsAway || 0) + 1 });
        }
      }
    }

    // Broadcast Push Notification for major events
    if (eventData.type === 'goal' || eventData.type === 'red_card') {
      const teamObj = teams.find((t) => t.id === eventData.teamId);
      onSendPushNotification(
        eventData.type === 'goal' ? `⚽ GOAL! ${teamObj?.name}` : `🟥 RED CARD! ${teamObj?.shortName}`,
        `${eventData.description} (${eventData.minute}')`,
        undefined
      );
    }

    setTimeout(() => {
      setSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 500);
  };

  // Live Clock Ticker State
  const [isLiveClockRunning, setIsLiveClockRunning] = useState<boolean>(false);

  // Auto Match Simulator State
  const [isSimulatorRunning, setIsSimulatorRunning] = useState<boolean>(false);

  // Broadcast Alert State
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifTeamTarget, setNotifTeamTarget] = useState<string>('all');

  // Club Details Edit Form State
  const activeSelectedTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];
  const [motto, setMotto] = useState(activeSelectedTeam?.motto || '');
  const [manager, setManager] = useState(activeSelectedTeam?.manager || activeSelectedTeam?.adminName || '');
  const [headCoach, setHeadCoach] = useState(activeSelectedTeam?.headCoach || '');
  const [homeStadium, setHomeStadium] = useState(activeSelectedTeam?.homeStadium || '');
  const [founded, setFounded] = useState(activeSelectedTeam?.founded || '2021');
  const [stadiumCapacity, setStadiumCapacity] = useState(activeSelectedTeam?.stadiumCapacity || '');
  const [nickname, setNickname] = useState(activeSelectedTeam?.nickname || '');
  const [bio, setBio] = useState(activeSelectedTeam?.bio || '');
  const [clubCulture, setClubCulture] = useState(activeSelectedTeam?.clubCulture || '');
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>(activeSelectedTeam?.boardMembers || []);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDesignation, setNewBoardDesignation] = useState('Board Member');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Dedicated Player Form Modal State
  const [isPlayerFormOpen, setIsPlayerFormOpen] = useState<boolean>(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);

  // Authorization checking
  const isCommish =
    currentAdmin?.role === 'league_commish' ||
    currentAdmin?.teamId === 'all' ||
    activeAdminTeamId === 'all' ||
    activeAdminTeamId === 'league_commish';
  const canEditActiveTeam = Boolean(
    isCommish || (currentAdmin && currentAdmin.teamId === activeSelectedTeam?.id)
  );

  const handleAddBoardMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    const newBM: BoardMember = {
      id: `bm-${Date.now()}`,
      name: newBoardName.trim(),
      designation: newBoardDesignation.trim() || 'Board Member',
    };

    setBoardMembers((prev) => [...prev, newBM]);
    setNewBoardName('');
  };

  const handleRemoveBoardMember = (id: string) => {
    setBoardMembers((prev) => prev.filter((bm) => bm.id !== id));
  };

  const handleRemovePlayerFromRoster = (playerId: string) => {
    const targetTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];
    if (!targetTeam) return;
    const updated = (targetTeam.roster || []).filter((p) => p.id !== playerId);
    onUpdateRoster(targetTeam.id, updated);
  };

  const handleToggleCaptainStatus = (playerId: string) => {
    const targetTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];
    if (!targetTeam) return;
    const updated = (targetTeam.roster || []).map((p) => ({
      ...p,
      isCaptain: p.id === playerId ? !p.isCaptain : false,
    }));
    onUpdateRoster(targetTeam.id, updated);
  };

  // Sync state when fixture selection or match status changes
  useEffect(() => {
    if (editingMatch) {
      setHomeScoreInput(editingMatch.homeScore);
      setAwayScoreInput(editingMatch.awayScore);
      setMatchMinute(editingMatch.minute || 0);
      setHalfDuration(editingMatch.halfDurationMinutes || 20);
      setAddedTime1stHalf(editingMatch.addedTime1stHalf || 0);
      setAddedTime2ndHalf(editingMatch.addedTime2ndHalf || 0);
      setEventTeamId(editingMatch.homeTeamId);

      // Auto start/stop live timer based on match status
      if (editingMatch.status === '1st_half' || editingMatch.status === '2nd_half' || editingMatch.isLive) {
        setIsLiveClockRunning(true);
      } else {
        setIsLiveClockRunning(false);
      }
    }
  }, [editingMatchId, editingMatch?.status, editingMatch?.isLive]);

  // Sync club form when team changes
  useEffect(() => {
    if (activeSelectedTeam) {
      setMotto(activeSelectedTeam.motto || '');
      setManager(activeSelectedTeam.manager || activeSelectedTeam.adminName || '');
      setHeadCoach(activeSelectedTeam.headCoach || '');
      setHomeStadium(activeSelectedTeam.homeStadium || '');
      setFounded(activeSelectedTeam.founded || '2021');
      setStadiumCapacity(activeSelectedTeam.stadiumCapacity || '');
      setNickname(activeSelectedTeam.nickname || '');
      setBio(activeSelectedTeam.bio || '');
      setClubCulture(activeSelectedTeam.clubCulture || '');
      setBoardMembers(activeSelectedTeam.boardMembers || []);
    }
  }, [selectedTeamId, activeSelectedTeam]);

  // Handle Passcode Login
  const handlePasscodeLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);

    const cleanCode = loginPasscode.trim().toUpperCase();

    if (!cleanCode) {
      setLoginError('Please enter a secret admin passcode.');
      return;
    }

    // Check League Commissioner Passcode
    if (
      cleanCode === 'COMMISH2026' ||
      cleanCode === 'SUPER2026' ||
      cleanCode === 'ADMIN2026' ||
      cleanCode === 'COMMISH' ||
      cleanCode === 'SL2026'
    ) {
      const commishUser: AdminUser = {
        teamId: 'all',
        adminName: 'Sunday League Commissioner',
        role: 'league_commish',
      };
      setCurrentAdmin(commishUser);
      if (teams.length > 0) setSelectedTeamId(teams[0].id);
      onSelectAdminTeam('all');
      setLoginPasscode('');
      setLoginError(null);
      return;
    }

    // Check Team Passcode if specific team selected
    if (loginTeamId && loginTeamId !== 'all') {
      const targetTeam = teams.find((t) => t.id === loginTeamId);
      if (targetTeam) {
        const matchesCode =
          (targetTeam.adminCode && targetTeam.adminCode.toUpperCase() === cleanCode) ||
          cleanCode === `${targetTeam.shortName.toUpperCase()}2026` ||
          cleanCode === targetTeam.shortName.toUpperCase() ||
          cleanCode === `${targetTeam.id.toUpperCase()}2026` ||
          cleanCode === targetTeam.name.toUpperCase();

        if (matchesCode) {
          const teamUser: AdminUser = {
            teamId: targetTeam.id,
            adminName: targetTeam.adminName || `${targetTeam.name} Admin`,
            role: 'team_admin',
            teamName: targetTeam.name,
          };
          setCurrentAdmin(teamUser);
          onSelectAdminTeam(targetTeam.id);
          setSelectedTeamId(targetTeam.id);
          setLoginPasscode('');
          setLoginError(null);
          return;
        }
      }
    }

    // Fallback check against any team's passcode
    const foundTeamByCode = teams.find(
      (t) =>
        (t.adminCode && t.adminCode.toUpperCase() === cleanCode) ||
        cleanCode === `${t.shortName.toUpperCase()}2026` ||
        cleanCode === t.shortName.toUpperCase() ||
        cleanCode === `${t.id.toUpperCase()}2026`
    );

    if (foundTeamByCode) {
      const teamUser: AdminUser = {
        teamId: foundTeamByCode.id,
        adminName: foundTeamByCode.adminName || `${foundTeamByCode.name} Admin`,
        role: 'team_admin',
        teamName: foundTeamByCode.name,
      };
      setCurrentAdmin(teamUser);
      onSelectAdminTeam(foundTeamByCode.id);
      setSelectedTeamId(foundTeamByCode.id);
      setLoginPasscode('');
      setLoginError(null);
      return;
    }

    setLoginError('Invalid passcode. Please verify your credentials and try again.');
  };

  // Quick Demo Login helper
  const handleQuickLogin = (teamId: string | 'all', passcode: string) => {
    setLoginTeamId(teamId === 'all' ? (teams[0]?.id || '') : teamId);
    setLoginPasscode(passcode);
    if (teamId === 'all') {
      setCurrentAdmin({
        teamId: 'all',
        adminName: 'Sunday League Commissioner',
        role: 'league_commish',
      });
      if (teams.length > 0) setSelectedTeamId(teams[0].id);
      onSelectAdminTeam('all');
    } else {
      const targetTeam = teams.find((t) => t.id === teamId);
      if (targetTeam) {
        setCurrentAdmin({
          teamId: targetTeam.id,
          adminName: targetTeam.adminName || `${targetTeam.name} Admin`,
          role: 'team_admin',
          teamName: targetTeam.name,
        });
        onSelectAdminTeam(targetTeam.id);
        setSelectedTeamId(targetTeam.id);
      }
    }
  };

  // Google Firebase Auth Sign In
  const handleGoogleAuthLogin = async () => {
    setIsFirebaseAuthLoading(true);
    setLoginError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      setCurrentAdmin({
        teamId: 'all',
        adminName: user.displayName || user.email || 'League Admin',
        email: user.email || undefined,
        role: 'league_commish',
      });
      onSelectAdminTeam(null);
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      setLoginError(err?.message || 'Failed to authenticate via Firebase Google Login.');
    } finally {
      setIsFirebaseAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentAdmin(null);
    onSelectAdminTeam(null);
    signOut(auth).catch(() => { });
  };

  // Ref to hold exact match seconds without re-triggering timer useEffect cleanup loop
  const timerSecondsRef = React.useRef<number>(0);

  useEffect(() => {
    if (editingMatch) {
      timerSecondsRef.current = editingMatch.matchSeconds ?? ((editingMatch.minute || 0) * 60);
    }
  }, [editingMatch?.id, editingMatch?.status]);

  // Live Timer Local State Interval (Updates local matchMinute ticker without 1-second Firestore snapshot round-trips)
  useEffect(() => {
    let interval: any;
    if (isLiveClockRunning && editingMatchId) {
      interval = setInterval(() => {
        timerSecondsRef.current += 1;
        const nextSec = timerSecondsRef.current;
        const nextMin = Math.floor(nextSec / 60);

        setMatchMinute(nextMin);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLiveClockRunning, editingMatchId]);

  // Auto Match Simulator Effect
  useEffect(() => {
    let interval: any;
    if (isSimulatorRunning && matches.length > 0) {
      interval = setInterval(() => {
        const liveMatch = matches.find((m) => m.id === editingMatchId) || matches[0];
        if (!liveMatch) return;

        const nextMinute = (liveMatch.minute || 0) + 1;
        if (nextMinute > 90) return;

        const homeTeamObj = teams.find((t) => t.id === liveMatch.homeTeamId);
        const awayTeamObj = teams.find((t) => t.id === liveMatch.awayTeamId);

        const isGoal = Math.random() < 0.15;
        let newHomeScore = liveMatch.homeScore;
        let newAwayScore = liveMatch.awayScore;
        let newEvt: MatchEvent | undefined;

        if (isGoal) {
          const isHomeGoal = Math.random() > 0.45;
          if (isHomeGoal) {
            newHomeScore += 1;
            const homeRoster = homeTeamObj?.roster || [];
            const scorer = homeRoster.length > 0 ? homeRoster[Math.floor(Math.random() * homeRoster.length)]?.name || 'Home Striker' : 'Home Striker';
            newEvt = {
              id: `evt-${Date.now()}`,
              minute: nextMinute,
              type: 'goal',
              teamId: liveMatch.homeTeamId,
              player: scorer,
              description: `⚽ GOAL! ${scorer} finishes a brilliant team play for ${homeTeamObj?.name}!`,
              period: nextMinute <= (halfDuration || 20) ? '1st_half' : '2nd_half',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            onSendPushNotification(
              `⚽ GOAL! ${homeTeamObj?.shortName}`,
              `${scorer} scores in ${nextMinute}'! ${homeTeamObj?.shortName} ${newHomeScore} - ${newAwayScore} ${awayTeamObj?.shortName}`,
              liveMatch.homeTeamId
            );
          } else {
            newAwayScore += 1;
            const awayRoster = awayTeamObj?.roster || [];
            const scorer = awayRoster.length > 0 ? awayRoster[Math.floor(Math.random() * awayRoster.length)]?.name || 'Away Striker' : 'Away Striker';
            newEvt = {
              id: `evt-${Date.now()}`,
              minute: nextMinute,
              type: 'goal',
              teamId: liveMatch.awayTeamId,
              player: scorer,
              description: `⚽ GOAL! ${scorer} scores for ${awayTeamObj?.name}!`,
              period: nextMinute <= (halfDuration || 20) ? '1st_half' : '2nd_half',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            onSendPushNotification(
              `⚽ GOAL! ${awayTeamObj?.shortName}`,
              `${scorer} scores in ${nextMinute}'! ${homeTeamObj?.shortName} ${newHomeScore} - ${newAwayScore} ${awayTeamObj?.shortName}`,
              liveMatch.awayTeamId
            );
          }
        }

        onUpdateMatchScore(liveMatch.id, newHomeScore, newAwayScore, newEvt);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isSimulatorRunning, matches, editingMatchId, teams, onSendPushNotification, onUpdateMatchScore]);

  // MATCH STATE MACHINE TRANSITIONS (User Story 3, 6, 9)
  const handleTriggerKickoff1stHalf = () => {
    if (!editingMatch || !onUpdateFullMatch) return;
    setSyncStatus('syncing');

    const kickoffEvent: MatchEvent = {
      id: `evt-kickoff-${Date.now()}`,
      minute: 1,
      second: 0,
      type: 'kickoff',
      teamId: editingMatch.homeTeamId,
      player: 'Match Official',
      description: '🚀 KICKOFF! The referee blows the whistle to start the first half!',
      period: '1st_half',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedEvents = [kickoffEvent, ...(editingMatch.events || [])];

    onUpdateFullMatch(editingMatch.id, {
      status: '1st_half',
      isLive: true,
      isFinished: false,
      minute: 1,
      matchSeconds: 0,
      kickoffTime: new Date().toISOString(),
      currentPeriod: '1st_half',
      events: updatedEvents,
    });

    setMatchMinute(1);
    timerSecondsRef.current = 0;
    setIsLiveClockRunning(true);
    onSendPushNotification(
      '🚀 MATCH KICKOFF!',
      `${teams.find((t) => t.id === editingMatch.homeTeamId)?.name} vs ${teams.find((t) => t.id === editingMatch.awayTeamId)?.name} has officially kicked off!`,
      undefined
    );

    setTimeout(() => {
      setSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 600);
  };

  const handleTriggerHalftime = () => {
    if (!editingMatch || !onUpdateFullMatch) return;
    setSyncStatus('syncing');

    const htSeconds = (halfDuration || 20) * 60;

    const halftimeEvent: MatchEvent = {
      id: `evt-ht-${Date.now()}`,
      minute: halfDuration,
      second: htSeconds,
      type: 'halftime',
      teamId: editingMatch.homeTeamId,
      player: 'Match Official',
      description: `⏸️ HALFTIME! The referee signals the end of the first half. (${homeScoreInput} - ${awayScoreInput})`,
      period: 'halftime',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedEvents = [halftimeEvent, ...(editingMatch.events || [])];

    onUpdateFullMatch(editingMatch.id, {
      status: 'halftime',
      isLive: false,
      isFinished: false,
      minute: halfDuration,
      matchSeconds: htSeconds,
      currentPeriod: 'halftime',
      events: updatedEvents,
    });

    timerSecondsRef.current = htSeconds;
    setIsLiveClockRunning(false);
    onSendPushNotification(
      '⏸️ HALFTIME SCORE UPDATE',
      `Halftime: ${teams.find((t) => t.id === editingMatch.homeTeamId)?.shortName} ${homeScoreInput} - ${awayScoreInput} ${teams.find((t) => t.id === editingMatch.awayTeamId)?.shortName}`,
      undefined
    );

    setTimeout(() => {
      setSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 600);
  };

  const handleTriggerKickoff2ndHalf = () => {
    if (!editingMatch || !onUpdateFullMatch) return;
    setSyncStatus('syncing');

    const start2ndHalfMinute = (halfDuration || 20);
    const start2ndHalfSeconds = (halfDuration || 20) * 60; // Start 2nd half clock from 20:00 (MM:SS)

    const kickoff2ndEvent: MatchEvent = {
      id: `evt-2ndhalf-${Date.now()}`,
      minute: start2ndHalfMinute + 1,
      second: start2ndHalfSeconds,
      type: 'kickoff',
      teamId: editingMatch.awayTeamId,
      player: 'Match Official',
      description: '▶️ SECOND HALF UNDERWAY! Players return to the pitch for the final half!',
      period: '2nd_half',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedEvents = [kickoff2ndEvent, ...(editingMatch.events || [])];

    onUpdateFullMatch(editingMatch.id, {
      status: '2nd_half',
      isLive: true,
      isFinished: false,
      minute: start2ndHalfMinute + 1,
      matchSeconds: start2ndHalfSeconds,
      currentPeriod: '2nd_half',
      events: updatedEvents,
    });

    setMatchMinute(start2ndHalfMinute + 1);
    timerSecondsRef.current = start2ndHalfSeconds;
    setIsLiveClockRunning(true);
    onSendPushNotification(
      '▶️ SECOND HALF KICKOFF',
      `The second half has commenced! Current Score: ${homeScoreInput} - ${awayScoreInput}`,
      undefined
    );

    setTimeout(() => {
      setSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 600);
  };

  const handleTriggerEndMatch = () => {
    if (!editingMatch || !onUpdateFullMatch) return;
    setSyncStatus('syncing');

    const fulltimeMinute = halfDuration * 2;

    const fulltimeEvent: MatchEvent = {
      id: `evt-ft-${Date.now()}`,
      minute: fulltimeMinute,
      type: 'fulltime',
      teamId: editingMatch.homeTeamId,
      player: 'Match Official',
      description: `🏁 FULL TIME! Match concludes. Final Score: ${homeScoreInput} - ${awayScoreInput}`,
      period: 'fulltime',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedEvents = [fulltimeEvent, ...(editingMatch.events || [])];

    onUpdateFullMatch(editingMatch.id, {
      status: 'ended',
      isLive: false,
      isFinished: true,
      minute: fulltimeMinute,
      currentPeriod: 'fulltime',
      events: updatedEvents,
    });

    setIsLiveClockRunning(false);
    setShowMotmModal(true);
    onSendPushNotification(
      '🏁 FULL TIME FINAL RESULT',
      `Final Score: ${teams.find((t) => t.id === editingMatch.homeTeamId)?.name} ${homeScoreInput} - ${awayScoreInput} ${teams.find((t) => t.id === editingMatch.awayTeamId)?.name}`,
      undefined
    );

    setTimeout(() => {
      setSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 600);
  };

  // Record Quick Event Manually (User Story 4 & 7)
  const handleRecordQuickEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;
    setSyncStatus('syncing');

    let updatedHomeScore = homeScoreInput;
    let updatedAwayScore = awayScoreInput;
    const isHomeTeam = eventTeamId === editingMatch.homeTeamId;
    const selectedTeamObj = teams.find((t) => t.id === eventTeamId);

    let desc = '';
    const currentPeriodStr =
      editingMatch.status === '1st_half'
        ? '1st_half'
        : editingMatch.status === '2nd_half'
          ? '2nd_half'
          : editingMatch.status === 'halftime'
            ? 'halftime'
            : 'fulltime';

    switch (eventCategory) {
      case 'goal':
        if (isHomeTeam) updatedHomeScore += 1;
        else updatedAwayScore += 1;
        desc = `⚽ GOAL! ${eventPlayerName || 'Player'} scores for ${selectedTeamObj?.name || 'Team'}!${eventAssistPlayer ? ` (Assist: ${eventAssistPlayer})` : ''
          }`;
        break;
      case 'yellow_card':
        desc = `🟨 YELLOW CARD issued to ${eventPlayerName || 'Player'} (${selectedTeamObj?.shortName}).`;
        break;
      case 'red_card':
        desc = `🟥 RED CARD! ${eventPlayerName || 'Player'} (${selectedTeamObj?.shortName}) is sent off!`;
        break;
      case 'sub':
        desc = `🔄 SUBSTITUTION for ${selectedTeamObj?.shortName}: ${eventPlayerName || 'Player In'} comes ON for ${subOutPlayerName || 'Player Out'
          }.`;
        break;
      case 'shot_on_target':
        desc = `🎯 SHOT ON TARGET by ${eventPlayerName || 'Player'} (${selectedTeamObj?.shortName}) saved by keeper!`;
        break;
      case 'foul':
        desc = `🛑 FOUL committed by ${eventPlayerName || 'Player'} (${selectedTeamObj?.shortName}).`;
        break;
      case 'corner':
        desc = `🚩 CORNER KICK awarded to ${selectedTeamObj?.name}.`;
        break;
    }

    if (eventCustomNote.trim()) {
      desc += ` - ${eventCustomNote.trim()}`;
    }

    const newEventObj: MatchEvent = {
      id: `evt-${Date.now()}`,
      minute: matchMinute,
      type: eventCategory,
      teamId: eventTeamId,
      player: eventPlayerName || selectedTeamObj?.name || 'Player',
      description: desc,
      period: currentPeriodStr,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      assistPlayer: eventAssistPlayer || undefined,
      subOutPlayer: subOutPlayerName || undefined,
    };

    setHomeScoreInput(updatedHomeScore);
    setAwayScoreInput(updatedAwayScore);

    onUpdateMatchScore(editingMatch.id, updatedHomeScore, updatedAwayScore, newEventObj);

    // Also update shots or fouls stats on match if applicable
    if (onUpdateFullMatch) {
      if (eventCategory === 'shot_on_target') {
        if (isHomeTeam) {
          onUpdateFullMatch(editingMatch.id, { shotsOnTargetHome: (editingMatch.shotsOnTargetHome || 0) + 1 });
        } else {
          onUpdateFullMatch(editingMatch.id, { shotsOnTargetAway: (editingMatch.shotsOnTargetAway || 0) + 1 });
        }
      } else if (eventCategory === 'foul') {
        if (isHomeTeam) {
          onUpdateFullMatch(editingMatch.id, { foulsHome: (editingMatch.foulsHome || 0) + 1 });
        } else {
          onUpdateFullMatch(editingMatch.id, { foulsAway: (editingMatch.foulsAway || 0) + 1 });
        }
      }
    }

    // Reset Form
    setEventPlayerName('');
    setEventAssistPlayer('');
    setSubOutPlayerName('');
    setEventCustomNote('');

    setTimeout(() => {
      setSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 500);
  };

  // Delete an event from event log (User Story 8)
  const handleDeleteEvent = (eventId: string) => {
    if (!editingMatch || !onUpdateFullMatch) return;
    setSyncStatus('syncing');

    const targetEvt = editingMatch.events.find((e) => e.id === eventId);
    const updatedEvents = editingMatch.events.filter((e) => e.id !== eventId);

    let newHomeScore = homeScoreInput;
    let newAwayScore = awayScoreInput;

    // If deleting a goal event, adjust score
    if (targetEvt && targetEvt.type === 'goal') {
      if (targetEvt.teamId === editingMatch.homeTeamId && newHomeScore > 0) {
        newHomeScore -= 1;
      } else if (targetEvt.teamId === editingMatch.awayTeamId && newAwayScore > 0) {
        newAwayScore -= 1;
      }
      setHomeScoreInput(newHomeScore);
      setAwayScoreInput(newAwayScore);
    }

    onUpdateFullMatch(editingMatch.id, {
      homeScore: newHomeScore,
      awayScore: newAwayScore,
      events: updatedEvents,
    });

    setTimeout(() => {
      setSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 500);
  };

  // Save Added Time Changes (User Story 5)
  const handleSaveAddedTime = (half: 1 | 2, addedMins: number) => {
    if (!editingMatch || !onUpdateFullMatch) return;
    setSyncStatus('syncing');

    if (half === 1) {
      setAddedTime1stHalf(addedMins);
      onUpdateFullMatch(editingMatch.id, { addedTime1stHalf: addedMins });
    } else {
      setAddedTime2ndHalf(addedMins);
      onUpdateFullMatch(editingMatch.id, { addedTime2ndHalf: addedMins });
    }

    setTimeout(() => {
      setSyncStatus('synced');
      setLastSyncTime(new Date().toLocaleTimeString());
    }, 500);
  };

  const handleBroadcastPush = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle || !notifMessage) return;
    onSendPushNotification(
      notifTitle,
      notifMessage,
      notifTeamTarget === 'all' ? undefined : notifTeamTarget
    );
    setNotifTitle('');
    setNotifMessage('');
  };

  const handleSaveClubDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSelectedTeam || !canEditActiveTeam || !onUpdateTeamDetails) return;

    onUpdateTeamDetails(activeSelectedTeam.id, {
      motto,
      manager,
      headCoach,
      homeStadium,
      founded,
      stadiumCapacity,
      nickname,
      bio,
      clubCulture,
      boardMembers,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Visible matches for active admin persona
  const rawVisibleMatches =
    currentAdmin && currentAdmin.teamId !== 'all'
      ? matches.filter((m) => m.homeTeamId === currentAdmin.teamId || m.awayTeamId === currentAdmin.teamId)
      : matches;

  // Helper to extract exact scheduled Kickoff Date for sorting
  const getMatchKickoffDateForSort = (m?: Match): Date | null => {
    if (!m) return null;
    if (m.kickoffTime) {
      const d = new Date(m.kickoffTime);
      if (!isNaN(d.getTime())) return d;
    }
    if (!m.startTime) return null;
    const directDate = new Date(m.startTime);
    if (!isNaN(directDate.getTime())) return directDate;

    const monthMatch = m.startTime.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/i);
    const timeMatch = m.startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

    if (monthMatch && timeMatch) {
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthIndex = monthNames.indexOf(monthMatch[1].toLowerCase());
      const day = parseInt(monthMatch[2], 10);

      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3]?.toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      const targetDate = new Date();
      if (monthIndex !== -1) {
        targetDate.setMonth(monthIndex, day);
      }
      targetDate.setHours(hours, minutes, 0, 0);

      if (targetDate.getTime() < Date.now() - 30 * 24 * 3600 * 1000) {
        targetDate.setFullYear(targetDate.getFullYear() + 1);
      }
      return targetDate;
    }
    return null;
  };

  const visibleMatches = [...rawVisibleMatches].sort((a, b) => {
    const dA = getMatchKickoffDateForSort(a);
    const dB = getMatchKickoffDateForSort(b);
    if (dA && dB) {
      const diff = dA.getTime() - dB.getTime();
      if (diff !== 0) return diff;
    }

    const wA = a.weekNumber || 99;
    const wB = b.weekNumber || 99;
    if (wA !== wB) return wA - wB;
    return a.id.localeCompare(b.id);
  });

  // Selected Team Roster list
  const activeTeamRoster = activeSelectedTeam?.roster || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="admin-portal-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 24px))' }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-5 bg-[#020408]/90 backdrop-blur-3xl overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 25 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-6xl bg-[#05080c]/95 border-2 border-[#B7CEEC]/30 rounded-3xl text-white shadow-[0_0_50px_rgba(76,120,126,0.2)] overflow-hidden flex flex-col h-[94vh] max-h-[94vh] min-h-0 backdrop-blur-2xl"
          >
            {/* Top Motorsport Telemetry Navigation Header */}
            <div className="p-4 sm:p-5 bg-[#060b12]/90 border-b border-[#B7CEEC]/20 flex items-center justify-between backdrop-blur-xl relative">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#4C787E] via-[#B7CEEC] via-[#2dd4bf] to-transparent" />
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#4C787E] to-[#0d2232] text-white font-black shadow-[0_0_20px_rgba(76,120,126,0.4)] border border-[#B7CEEC]/50">
                  <ShieldAlert className="w-6 h-6 text-teal-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base sm:text-lg uppercase tracking-widest text-white f1-header drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                      SUNDAY LEAGUE TELEMETRY & PORTAL
                    </h3>
                    <span className="px-2.5 py-1 rounded-full bg-[#4C787E]/20 text-[#B7CEEC] text-[10px] font-black uppercase tracking-wider border border-[#4C787E]/50 flex items-center gap-1.5 shadow-[0_0_12px_rgba(76,120,126,0.3)] font-mono">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400 shadow-[0_0_8px_#2dd4bf]"></span>
                      </span>
                      Live Telemetry Engine
                    </span>
                  </div>
                  <p className="text-xs text-[#B7CEEC]/80 font-medium tracking-wide">
                    {currentAdmin
                      ? currentAdmin.role === 'league_commish'
                        ? '👑 Sunday League Commissioner — Full Command Telemetry & Club Access'
                        : `🔒 Dedicated Admin Access: ${currentAdmin.teamName}`
                      : 'Authenticate with team passcode or Firebase Google login'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentAdmin && (
                  <button
                    onClick={handleLogout}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-wider border border-rose-500/40 flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_12px_rgba(244,63,94,0.2)] hover:shadow-[0_0_18px_rgba(244,63,94,0.4)]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-full bg-[#03060a] text-gray-400 hover:text-white hover:bg-[#09111c] transition-all cursor-pointer border border-[#B7CEEC]/30 shadow-md hover:border-[#B7CEEC]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* IF NOT LOGGED IN: DISPLAY AUTH GATEWAY */}
            {!currentAdmin ? (
              <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#05080c] backdrop-blur-xl">
                <div className="p-6 rounded-3xl bg-[#060b14]/90 border border-[#B7CEEC]/30 space-y-5 max-w-xl mx-auto shadow-[0_0_35px_rgba(76,120,126,0.15)] backdrop-blur-2xl">
                  <div className="text-center space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4C787E] to-[#08131e] text-white flex items-center justify-center mx-auto mb-2 shadow-[0_0_25px_rgba(76,120,126,0.4)] border border-[#B7CEEC]/40">
                      <Lock className="w-7 h-7 text-teal-300" />
                    </div>
                    <h4 className="font-black text-lg uppercase text-white f1-header tracking-widest drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                      ADMIN AUTHENTICATION GATEWAY
                    </h4>
                    <p className="text-xs text-[#B7CEEC]/80 font-medium">
                      Each club has a dedicated admin persona with exclusive rights to manage squad rosters & command live telemetry.
                    </p>
                  </div>

                  {loginError && (
                    <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold text-center shadow-[0_0_15px_rgba(244,63,94,0.2)] space-y-2">
                      <div className="flex items-center justify-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{loginError}</span>
                      </div>
                      <div className="text-[11px] text-rose-200/80 font-normal">
                        Tip: Select a club or click one of the quick passcode options below to autofill valid credentials.
                      </div>
                    </div>
                  )}

                  {/* Passcode Login Form */}
                  <form onSubmit={handlePasscodeLogin} className="space-y-4">
                    <div>
                      <label className="text-xs font-black uppercase tracking-wider text-[#B7CEEC] block mb-1.5">Select Your Club</label>
                      <select
                        value={loginTeamId}
                        onChange={(e) => {
                          setLoginTeamId(e.target.value);
                          setLoginError(null);
                        }}
                        className="w-full p-3 rounded-xl bg-[#03060a] border border-[#B7CEEC]/30 text-white text-xs font-semibold focus:outline-none focus:border-[#4C787E] focus:ring-1 focus:ring-[#4C787E] transition-all shadow-inner"
                      >
                        <option value="all">League Commissioner (Full Access)</option>
                        {teams.map((t, idx) => (
                          <option key={`commish-team-opt-${t.id}-${idx}`} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-black uppercase tracking-wider text-[#B7CEEC] block">Enter Secret Admin Passcode</label>
                        {loginPasscode && (
                          <button
                            type="button"
                            onClick={() => {
                              setLoginPasscode('');
                              setLoginError(null);
                            }}
                            className="text-[10px] text-teal-400 hover:underline cursor-pointer font-bold"
                          >
                            Clear Input
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Key className="w-4 h-4 text-teal-400 absolute left-3.5 top-3.5" />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter secret admin passcode"
                          value={loginPasscode}
                          onChange={(e) => {
                            setLoginPasscode(e.target.value);
                            setLoginError(null);
                          }}
                          className={`w-full pl-10 pr-10 py-3 rounded-xl bg-[#03060a] border text-white text-xs font-semibold focus:outline-none transition-all shadow-inner ${loginError ? 'border-rose-500/60 focus:border-rose-500' : 'border-[#B7CEEC]/30 focus:border-[#4C787E] focus:ring-1 focus:ring-[#4C787E]'
                            }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-3.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                          title={showPassword ? "Hide passcode" : "Show passcode"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>



                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#4C787E] via-[#2dd4bf] to-[#B7CEEC] text-slate-950 font-black text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(76,120,126,0.35)] cursor-pointer f1-sub-header tracking-widest uppercase border border-teal-200"
                    >
                      <LogIn className="w-4 h-4 text-slate-950" />
                      <span>AUTHENTICATE CLUB ADMIN</span>
                    </button>
                  </form>

                  {/* Encrypted Session Security Notice */}
                  <div className="pt-3 border-t border-[#B7CEEC]/15 text-center flex items-center justify-center gap-2 text-[11px] text-[#B7CEEC]/80 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    <span>End-to-End Encrypted Sunday League Access Control</span>
                  </div>
                </div>
              </div>
            ) : (
              /* LOGGED IN ADMIN PORTAL MAIN BODY */
              <>
                {/* Admin Persona & Sync Status Bar */}
                <div className="px-5 py-2.5 bg-[#060b12]/90 border-b border-[#B7CEEC]/20 flex flex-wrap items-center justify-between text-xs gap-2 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    {currentAdmin.teamId !== 'all' && <TeamLogo teamId={currentAdmin.teamId} size={20} />}
                    <span className="font-bold text-[#B7CEEC] flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                      Logged in: <strong className="text-white font-black tracking-wide">{currentAdmin.adminName}</strong>
                    </span>
                    {currentAdmin.teamId !== 'all' && (
                      <span className="px-2.5 py-0.5 rounded-md bg-[#03060a] text-teal-300 text-[10px] font-bold border border-[#4C787E]/50 font-mono shadow-sm">
                        🔒 Dedicated Admin: {currentAdmin.teamName}
                      </span>
                    )}
                  </div>

                  {/* Cloud Sync Status (User Story 7) */}
                  <div className="flex items-center gap-2 text-[11px]">

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#03060a] border border-[#B7CEEC]/30 shadow-inner">
                      <Database className="w-3.5 h-3.5 text-teal-400" />
                      <span className="text-gray-400 font-medium">Firestore:</span>
                      <span className={syncStatus === 'synced' ? 'text-teal-300 font-bold font-mono flex items-center gap-1' : 'text-amber-400 font-bold font-mono flex items-center gap-1'}>
                        {syncStatus === 'synced' ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                            Synced
                          </>
                        ) : (
                          '🔄 Syncing...'
                        )}
                      </span>
                      <span className="text-[9px] text-gray-500 font-mono">({lastSyncTime})</span>
                    </div>
                  </div>
                </div>

                {/* Navigation Tabs - Clean Primary Tabs & 3-Dots Dropdown */}
                <div className="flex items-center justify-between bg-[#060b12]/90 border-b border-[#B7CEEC]/20 p-2.5 text-xs font-bold relative z-50 backdrop-blur-md">
                  <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar">
                    <button
                      onClick={() => {
                        setActiveTab('matches');
                        setIsMoreMenuOpen(false);
                      }}
                      className={`px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === 'matches'
                        ? 'bg-gradient-to-r from-[#4C787E] to-[#122e3d] text-white shadow-[0_0_18px_rgba(76,120,126,0.4)] border border-[#B7CEEC]/50 font-black f1-sub-header tracking-widest uppercase'
                        : 'text-gray-400 hover:text-white hover:bg-[#03060a] border border-transparent'
                        }`}
                    >
                      <Radio className="w-4 h-4 text-teal-300" />
                      <span>LIVE MATCH</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('rosters');
                        setIsMoreMenuOpen(false);
                      }}
                      className={`px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === 'rosters'
                        ? 'bg-gradient-to-r from-[#4C787E] to-[#122e3d] text-white shadow-[0_0_18px_rgba(76,120,126,0.4)] border border-[#B7CEEC]/50 font-black f1-sub-header tracking-widest uppercase'
                        : 'text-gray-400 hover:text-white hover:bg-[#03060a] border border-transparent'
                        }`}
                    >
                      <Users className="w-4 h-4 text-teal-300" />
                      <span>Squad Rosters</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('club');
                        setIsMoreMenuOpen(false);
                      }}
                      className={`px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${activeTab === 'club'
                        ? 'bg-gradient-to-r from-[#4C787E] to-[#122e3d] text-white shadow-[0_0_18px_rgba(76,120,126,0.4)] border border-[#B7CEEC]/50 font-black f1-sub-header tracking-widest uppercase'
                        : 'text-gray-400 hover:text-white hover:bg-[#03060a] border border-transparent'
                        }`}
                    >
                      <Building2 className="w-4 h-4 text-teal-300" />
                      <span>Club Profile</span>
                    </button>
                  </div>

                  {/* 3-Dots Menu Button */}
                  <div className="relative">
                    <button
                      onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                      className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${isMoreMenuOpen || ['club', 'broadcast', 'database'].includes(activeTab)
                        ? 'bg-[#4C787E]/30 border-[#4C787E] text-white'
                        : 'bg-[#05080c] border-[#B7CEEC]/20 text-gray-400 hover:text-white hover:border-[#B7CEEC]/40'
                        }`}
                      title="More Options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* 3-Dots Dropdown Menu */}
                    <AnimatePresence>
                      {isMoreMenuOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsMoreMenuOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                            className="absolute right-0 mt-2 w-52 bg-[#05080c] border border-[#B7CEEC]/30 rounded-2xl shadow-2xl p-2 z-50 space-y-1 backdrop-blur-2xl"
                          >
                            <p className="text-[10px] font-mono text-gray-500 px-2 py-1 uppercase tracking-wider">Additional Controls</p>

                            <button
                              onClick={() => {
                                setActiveTab('club');
                                setIsMoreMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center gap-2.5 text-xs font-semibold cursor-pointer ${activeTab === 'club'
                                ? 'bg-[#4C787E] text-white font-bold'
                                : 'text-gray-300 hover:bg-[#080d14] hover:text-white'
                                }`}
                            >
                              <Building2 className="w-4 h-4 text-[#B7CEEC]" />
                              <span>Club Profile</span>
                            </button>

                            {currentAdmin.role === 'league_commish' && (
                              <>
                                <button
                                  onClick={() => {
                                    setActiveTab('broadcast');
                                    setIsMoreMenuOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center gap-2.5 text-xs font-semibold cursor-pointer ${activeTab === 'broadcast'
                                    ? 'bg-[#4C787E] text-white font-bold'
                                    : 'text-gray-300 hover:bg-[#080d14] hover:text-white'
                                    }`}
                                >
                                  <Bell className="w-4 h-4 text-[#B7CEEC]" />
                                  <span>Broadcast</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveTab('database');
                                    setIsMoreMenuOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center gap-2.5 text-xs font-semibold cursor-pointer ${activeTab === 'database'
                                    ? 'bg-[#4C787E] text-white font-bold'
                                    : 'text-gray-300 hover:bg-[#080d14] hover:text-white'
                                    }`}
                                >
                                  <Database className="w-4 h-4 text-[#B7CEEC]" />
                                  <span>Firestore Sync</span>
                                </button>

                                {onRolloverSeason && (
                                  <button
                                    onClick={() => {
                                      setIsMoreMenuOpen(false);
                                      if (window.confirm(`🏆 LAUNCH SEASON ${currentSeasonNumber + 1}?\n\nThis will:\n1. Reset League Table standings to 0-0-0 for Season ${currentSeasonNumber + 1}.\n2. Archive Season ${currentSeasonNumber} Champion to Club History.\n3. Preserve all player career stats and H2H match records.`)) {
                                        onRolloverSeason();
                                      }
                                    }}
                                    className="w-full text-left px-3 py-2 rounded-xl transition-all flex items-center gap-2.5 text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/30 cursor-pointer"
                                  >
                                    <Trophy className="w-4 h-4 text-amber-400" />
                                    <span>Reset & Launch Season {currentSeasonNumber + 1}</span>
                                  </button>
                                )}
                              </>
                            )}
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 min-h-0 custom-scrollbar">
                  {/* TAB 1: LIVE MATCH EVENT RECORDING PORTAL */}
                  {activeTab === 'matches' && (
                    <div className="space-y-6">
                      {/* SELECT FIXTURE FOR LIVE MATCH */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xs font-black uppercase tracking-widest text-[#B7CEEC] f1-sub-header flex items-center gap-2">
                            <span>1. SELECT FIXTURE FOR LIVE MATCH</span>
                            <span className="px-2 py-0.5 rounded-full bg-[#4C787E]/20 text-teal-300 text-[10px] font-mono border border-[#4C787E]/40">
                              {visibleMatches.length} Fixtures
                            </span>
                          </h4>
                          <div className="flex items-center gap-2">
                            {isCommish && (
                              <button
                                type="button"
                                onClick={handleOpenCreateFixtureModal}
                                className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#4C787E] to-teal-500 hover:from-[#3a5d62] hover:to-teal-400 text-white text-xs font-black flex items-center gap-1.5 shadow-lg transition-all cursor-pointer border border-teal-300/40"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Add Fixture</span>
                              </button>
                            )}
                            <span className="hidden sm:inline text-[11px] text-[#B7CEEC]/70 font-medium">
                              Click any match tile to launch live recorder console
                            </span>
                          </div>
                        </div>

                        {(() => {
                          const nextMatchObj = visibleMatches.find((m) => !m.isFinished && m.status !== 'ended');
                          const nextMatchId = nextMatchObj?.id;

                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              {visibleMatches.map((m, idx) => {
                                const isSelected = editingMatchId === m.id;
                                const hTeam = teams.find((t) => t.id === m.homeTeamId);
                                const aTeam = teams.find((t) => t.id === m.awayTeamId);
                                const isEnded = m.isFinished || m.status === 'ended';
                                const isLive = m.isLive || m.status === '1st_half' || m.status === '2nd_half' || m.status === 'halftime';
                                const isNext = !isEnded && !isLive && m.id === nextMatchId;

                                // Match Status Badge Styling
                                let badgeBg = 'bg-teal-500/20 text-teal-300 border-teal-500/40';
                                let badgeText = `⚪ UPCOMING (${m.startTime})`;

                                if (isEnded) {
                                  badgeBg = 'bg-slate-800/90 text-emerald-400 border-emerald-500/40 shadow-sm';
                                  badgeText = `🏁 FULL TIME`;
                                } else if (m.status === '1st_half' || m.status === '2nd_half') {
                                  badgeBg = 'bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.4)] animate-pulse';
                                  badgeText = `🔴 LIVE ${m.status === '1st_half' ? '1ST HALF' : '2ND HALF'} (${m.minute}')`;
                                } else if (m.status === 'halftime') {
                                  badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                                  badgeText = `⏸️ HALFTIME (${m.minute}')`;
                                } else if (isNext) {
                                  badgeBg = 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)] font-black animate-pulse';
                                  badgeText = `🔥 NEXT MATCH (${m.startTime})`;
                                }

                                // Goal Scorers Summary for Completed Matches
                                const goalEvents = (m.events || []).filter((e) => e.type === 'goal');
                                const homeScorers = goalEvents.filter((e) => e.teamId === m.homeTeamId).map((e) => `${e.player} ${e.minute}'`).join(', ');
                                const awayScorers = goalEvents.filter((e) => e.teamId === m.awayTeamId).map((e) => `${e.player} ${e.minute}'`).join(', ');

                                return (
                                  <button
                                    key={`vis-match-${m.id}-${idx}`}
                                    onClick={() => handleSelectMatchFixture(m)}
                                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer hover:scale-[1.01] relative overflow-hidden backdrop-blur-md flex flex-col justify-between ${
                                      isSelected
                                        ? 'bg-[#091422] border-[#B7CEEC] ring-2 ring-[#4C787E]/60 shadow-[0_0_25px_rgba(76,120,126,0.35)]'
                                        : isNext
                                        ? 'bg-gradient-to-br from-[#0e1d2c] via-[#08121c] to-[#040810] border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                        : 'bg-[#040810]/90 border-[#B7CEEC]/20 text-gray-300 hover:border-[#4C787E]/60 hover:shadow-[0_0_18px_rgba(76,120,126,0.2)]'
                                    }`}
                                  >
                                    {/* Status Badge & Venue */}
                                    <div className="flex items-center justify-between text-[11px] mb-2.5">
                                      <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 border ${badgeBg}`}>
                                        {isLive && (
                                          <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                          </span>
                                        )}
                                        {badgeText}
                                      </span>

                                      <div className="flex items-center gap-2">
                                        <span className="text-[#B7CEEC] font-bold text-[10px] uppercase tracking-wider">{m.venue}</span>
                                        {isCommish && (
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleOpenEditFixtureModal(m);
                                            }}
                                            className="px-2.5 py-0.5 rounded-lg bg-[#4C787E]/30 hover:bg-[#4C787E]/70 text-teal-200 border border-[#4C787E]/60 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-md"
                                            title="Edit Fixture Details & Schedule"
                                          >
                                            <Edit2 className="w-3 h-3 text-teal-300" />
                                            <span>Edit</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Scoreboard Row */}
                                    <div className="flex items-center justify-between my-1">
                                      <div className="flex items-center gap-2 flex-1">
                                        <TeamLogo teamId={m.homeTeamId} size={26} />
                                        <span className={`font-black text-xs sm:text-sm uppercase tracking-wider ${isEnded && m.homeScore > m.awayScore ? 'text-amber-300' : 'text-white'}`}>
                                          {hTeam?.shortName || hTeam?.name}
                                        </span>
                                      </div>

                                      <div className={`px-3.5 py-1 rounded-xl border font-black text-sm shadow-inner font-mono shrink-0 mx-2 ${
                                        isEnded
                                          ? 'bg-slate-900/90 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                                          : isLive
                                          ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                                          : 'bg-[#020509] border-[#B7CEEC]/30 text-white'
                                      }`}>
                                        {m.homeScore} - {m.awayScore}
                                      </div>

                                      <div className="flex items-center gap-2 flex-1 justify-end">
                                        <span className={`font-black text-xs sm:text-sm uppercase tracking-wider text-right ${isEnded && m.awayScore > m.homeScore ? 'text-amber-300' : 'text-white'}`}>
                                          {aTeam?.shortName || aTeam?.name}
                                        </span>
                                        <TeamLogo teamId={m.awayTeamId} size={26} />
                                      </div>
                                    </div>

                                    {/* Full Time Completed Stats & Scorers Summary */}
                                    {isEnded && (
                                      <div className="mt-3 pt-2 border-t border-[#B7CEEC]/15 flex flex-col gap-1 text-[10px] text-gray-300">
                                        {(homeScorers || awayScorers) ? (
                                          <div className="flex items-center justify-between gap-2 text-[10px]">
                                            <span className="text-emerald-300 font-semibold truncate max-w-[48%]">
                                              {homeScorers ? `⚽ ${homeScorers}` : ''}
                                            </span>
                                            <span className="text-emerald-300 font-semibold truncate max-w-[48%] text-right">
                                              {awayScorers ? `⚽ ${awayScorers}` : ''}
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono">
                                            <span>Possession: {m.possessionHome || 50}% - {m.possessionAway || 50}%</span>
                                            <span>Shots: {(m.shotsHome || 0) + (m.shotsAway || 0)}</span>
                                          </div>
                                        )}
                                        <div className="flex items-center justify-between pt-0.5 text-[9px]">
                                          <span className="text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                            <Activity className="w-3 h-3 text-teal-300" />
                                            <span>Full Match Statistics & Events</span>
                                          </span>
                                          <span className="text-gray-400 font-mono">Final Result</span>
                                        </div>
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>

                      {/* SELECTED FIXTURE RECORDING CONSOLE POPUP MODAL */}
                      {editingMatch && (
                        <div
                          style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 24px))' }}
                          className="fixed inset-0 bg-[#020408]/92 backdrop-blur-2xl z-[70] flex items-center justify-center p-2 sm:p-5 overflow-y-auto animate-fade-in"
                        >
                          <div className="bg-[#05080c]/98 border-2 border-[#4C787E] rounded-3xl max-w-5xl w-full p-4 sm:p-6 space-y-4 shadow-[0_0_50px_rgba(76,120,126,0.3)] relative text-white max-h-[94vh] flex flex-col min-h-0 overflow-y-auto custom-scrollbar backdrop-blur-2xl">
                            {/* Popup Header with Match Title & Close X Button */}
                            <div className="flex items-center justify-between border-b border-[#B7CEEC]/20 pb-4 relative">
                              <div className="flex items-center gap-3">
                                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider f1-header drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                                  {teams.find((t) => t.id === editingMatch.homeTeamId)?.name} vs{' '}
                                  {teams.find((t) => t.id === editingMatch.awayTeamId)?.name}
                                </h3>
                              </div>

                              <button
                                type="button"
                                onClick={() => setEditingMatchId(null)}
                                className="p-2 rounded-full bg-[#03060a] hover:bg-[#09111c] text-gray-400 hover:text-white transition-all cursor-pointer flex items-center justify-center border border-[#B7CEEC]/30 shadow-md hover:border-[#B7CEEC]"
                                title="Close Popup Console"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            {/* MATCH CONTENT CONDITIONAL: FULL TIME vs UPCOMING/LIVE */}
                            {editingMatch.isFinished || editingMatch.status === 'ended' ? (
                              <div className="space-y-6">
                                <CompletedMatchAnalytics
                                  match={editingMatch}
                                  homeTeam={teams.find((t) => t.id === editingMatch.homeTeamId)}
                                  awayTeam={teams.find((t) => t.id === editingMatch.awayTeamId)}
                                />

                                {/* EXCLUSIVE COMMISSIONER & ADMIN PAST MATCH EVENT & SCORE CORRECTION PORTAL */}
                                {currentAdmin && (
                                  <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0c1827] via-[#091320] to-[#050b14] border-2 border-amber-400/50 space-y-4 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-amber-400/30 pb-3 gap-2">
                                      <div>
                                        <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm uppercase tracking-wider">
                                          <ShieldCheck className="w-5 h-5 text-amber-400 animate-pulse" />
                                          <span>🛡️ COMMISSIONER EXCLUSIVE: PAST MATCH STAT CORRECTION</span>
                                        </div>
                                        <p className="text-[11px] text-[#B7CEEC]/80 mt-0.5">
                                          Fix wrongly recorded goals, scorers, assists, cards, or scores. Standings & player leaderboards auto-recalculate!
                                        </p>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditEventModal(null)}
                                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shrink-0"
                                      >
                                        <Plus className="w-4 h-4 text-slate-950" />
                                        <span>Add / Correct Past Event</span>
                                      </button>
                                    </div>

                                    {/* MOTM AWARD OVERRIDE BANNER */}
                                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-400/60 shadow-xl flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2.5">
                                        <Star className="w-5 h-5 text-amber-400 fill-amber-400 animate-spin" />
                                        <div>
                                          <span className="text-xs font-black uppercase text-amber-300 block">
                                            ⭐ Player of the Match (MOTM) Award
                                          </span>
                                          <span className="text-[11px] text-gray-300 font-extrabold">
                                            {editingMatch.motmPlayerName ? `Awarded to: ${editingMatch.motmPlayerName}` : 'Not awarded yet. Tap button to select MOTM!'}
                                          </span>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => setShowMotmModal(true)}
                                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider hover:brightness-110 shadow-lg cursor-pointer transition-all shrink-0"
                                      >
                                        {editingMatch.motmPlayerName ? 'Change MOTM' : '⭐ Select MOTM'}
                                      </button>
                                    </div>

                                    {/* Direct Score Override Row */}
                                    <div className="p-3.5 rounded-2xl bg-[#060e18] border border-[#4C787E]/30 space-y-2">
                                      <span className="text-xs font-black uppercase text-amber-300 block">
                                        Override Official Match Final Score
                                      </span>
                                      <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0c1b2b] border border-[#4C787E]/40">
                                          <span className="text-gray-300 font-extrabold truncate">
                                            {teams.find((t) => t.id === editingMatch.homeTeamId)?.name} Score:
                                          </span>
                                          <input
                                            type="number"
                                            min="0"
                                            max="99"
                                            value={homeScoreInput}
                                            onChange={(e) => setHomeScoreInput(Number(e.target.value))}
                                            className="w-16 p-1.5 rounded-lg bg-[#040810] border border-amber-400/50 text-amber-300 font-black text-center text-sm"
                                          />
                                        </div>

                                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#0c1b2b] border border-[#4C787E]/40">
                                          <span className="text-gray-300 font-extrabold truncate">
                                            {teams.find((t) => t.id === editingMatch.awayTeamId)?.name} Score:
                                          </span>
                                          <input
                                            type="number"
                                            min="0"
                                            max="99"
                                            value={awayScoreInput}
                                            onChange={(e) => setAwayScoreInput(Number(e.target.value))}
                                            className="w-16 p-1.5 rounded-lg bg-[#040810] border border-amber-400/50 text-amber-300 font-black text-center text-sm"
                                          />
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (onUpdateFullMatch) {
                                            onUpdateFullMatch(editingMatch.id, {
                                              homeScore: homeScoreInput,
                                              awayScore: awayScoreInput,
                                            });
                                            alert('Score updated & league standings recalculated!');
                                          }
                                        }}
                                        className="w-full py-2 rounded-xl bg-[#173048] hover:bg-[#204060] text-teal-300 border border-teal-500/40 text-xs font-bold transition-all cursor-pointer mt-1"
                                      >
                                        Save Scoreline Override to Standings
                                      </button>
                                    </div>

                                    {/* Past Recorded Events Log */}
                                    <div className="space-y-2">
                                      <span className="text-xs font-black uppercase text-gray-300 block">
                                        Recorded Past Events Timeline ({editingMatch.events?.length || 0})
                                      </span>
                                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                        {(!editingMatch.events || editingMatch.events.length === 0) ? (
                                          <p className="text-center text-xs text-gray-500 py-3">
                                            No events recorded yet for this completed match. Use the button above to add events!
                                          </p>
                                        ) : (
                                          editingMatch.events.map((evt, idx) => {
                                            const eventTeam = teams.find((t) => t.id === evt.teamId);
                                            return (
                                              <div
                                                key={`past-admin-evt-${evt.id}-${idx}`}
                                                className="p-3 rounded-xl bg-[#060e18] border border-[#4C787E]/30 flex items-center justify-between text-xs transition-all hover:border-[#B7CEEC]/40"
                                              >
                                                <div className="flex items-center gap-3">
                                                  <span className="px-2 py-1 rounded-lg bg-[#122436] font-black text-[#B7CEEC] text-[11px] border border-[#4C787E]/40">
                                                    {evt.minute}'
                                                  </span>
                                                  <div>
                                                    <div className="flex items-center gap-2">
                                                      {evt.teamId && <TeamLogo teamId={evt.teamId} size={16} />}
                                                      <span className="font-bold text-white">{evt.description}</span>
                                                    </div>
                                                    {evt.timestamp && (
                                                      <span className="text-[10px] text-gray-500">
                                                        Logged at {evt.timestamp} • Period: {evt.period || 'fulltime'}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                  <button
                                                    type="button"
                                                    onClick={() => handleOpenEditEventModal(evt)}
                                                    title="Edit past event details"
                                                    className="p-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/40 text-teal-300 transition-colors cursor-pointer"
                                                  >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleDeleteEvent(evt.id)}
                                                    title="Delete incorrect entry"
                                                    className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition-colors cursor-pointer"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
                                {/* PLAYING 8 REGISTRATION (OFFICIAL MATCH LINEUP & SQUAD SELECTION - HIDDEN IN LIVE 5-MIN PRE-KICKOFF MODE) */}
                                {(!isLiveRecordingUnlocked || showLineupInLiveMode) && (
                                  <MatchLineupBuilder
                                    match={editingMatch}
                                    teams={teams}
                                    currentAdmin={currentAdmin}
                                    onUpdateFullMatch={onUpdateFullMatch}
                                  />
                                )}

                                {/* LIVE EVENTS RECORDER & CLOCK (UNLOCKED WITHIN 5 MINS PRECEDING KICKOFF) */}
                                {isLiveRecordingUnlocked ? (
                                  <LiveTelemetryConsole
                                    match={editingMatch}
                                    teams={teams}
                                    onUpdateFullMatch={onUpdateFullMatch}
                                    onSendPushNotification={onSendPushNotification}
                                  />
                                ) : (
                                  <div className="p-6 rounded-2xl bg-[#060b14]/90 border border-[#B7CEEC]/30 text-center space-y-4 shadow-[0_0_25px_rgba(76,120,126,0.15)] backdrop-blur-xl">
                                    <div className="w-14 h-14 rounded-2xl bg-[#4C787E]/15 border border-[#B7CEEC]/30 text-teal-300 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(76,120,126,0.3)]">
                                      <Clock className="w-7 h-7 text-teal-300 animate-pulse" />
                                    </div>
                                    <div className="space-y-1.5">
                                      <h4 className="text-base font-black text-white uppercase tracking-widest f1-header">
                                        LIVE TELEMETRY & MATCH STATE FLOW LOCKED
                                      </h4>
                                    </div>

                                    {timeDiffMs > 0 && (
                                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#03060a] border border-[#4C787E]/50 text-teal-300 font-mono text-xs font-bold shadow-inner">
                                        <span>⏱️ 5-MIN KICKOFF UNLOCK COUNTDOWN:</span>
                                        <span className="text-white font-black text-sm tracking-wider">{formatCountdown(timeDiffMs - 5 * 60 * 1000 > 0 ? timeDiffMs - 5 * 60 * 1000 : timeDiffMs)}</span>
                                      </div>
                                    )}

                                    {isCommish && (
                                      <div className="pt-2">
                                        <button
                                          onClick={() => setForceUnlockLiveControls(true)}
                                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#4C787E]/20 via-[#2dd4bf]/20 to-[#B7CEEC]/20 hover:from-[#4C787E]/40 hover:to-[#B7CEEC]/40 text-teal-300 border border-[#B7CEEC]/40 text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto shadow-[0_0_15px_rgba(76,120,126,0.2)]"
                                        >
                                          <Unlock className="w-4 h-4 text-teal-300" />
                                          <span>COMMISSIONER OVERRIDE UNLOCK</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: EXCLUSIVE SQUAD ROSTER MANAGEMENT */}
                  {activeTab === 'rosters' && (
                    <div className="space-y-4">
                      {isCommish ? (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {teams.map((t, idx) => (
                            <button
                              key={`admin-roster-tab-${t.id}-${idx}`}
                              onClick={() => setSelectedTeamId(t.id)}
                              className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${selectedTeamId === t.id
                                ? 'bg-[#B7CEEC] text-slate-950 border-[#B7CEEC]'
                                : 'bg-[#101e2e] text-gray-300 border-[#4C787E]/30'
                                }`}
                            >
                              <TeamLogo teamId={t.id} size={20} />
                              <span className="truncate">{t.shortName}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-[#0e1e2d] border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-emerald-400" />
                            <span>
                              Exclusive Roster Lock: Managing <strong>{activeSelectedTeam?.name || 'Selected Club'}</strong>
                            </span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            Verified Club Admin
                          </span>
                        </div>
                      )}

                      {!canEditActiveTeam ? (
                        <div className="p-4 rounded-2xl bg-[#1d0e14] border border-rose-500/40 text-xs text-rose-300 space-y-2">
                          <div className="flex items-center gap-2 font-bold text-rose-200">
                            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                            <span>⛔ ACCESS RESTRICTED</span>
                          </div>
                          <p>
                            You are logged in as <strong>{currentAdmin?.teamName || 'Team Admin'}</strong>. Only the Commissioner or this team's assigned club admin can add or edit player profiles for <strong>{activeSelectedTeam?.name || 'Selected Club'}</strong>.
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-[#112132] border border-[#4C787E]/40 space-y-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <TeamLogo teamId={activeSelectedTeam?.id || ''} size={28} />
                              <div>
                                <h4 className="font-black text-sm text-white">{activeSelectedTeam?.name || 'Selected Club'} Roster</h4>
                                <p className="text-[11px] text-[#B7CEEC]/80">Admin: {activeSelectedTeam?.adminName || 'Club Admin'}</p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setPlayerToEdit(null);
                                setIsPlayerFormOpen(true);
                              }}
                              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs hover:brightness-110 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                            >
                              <UserPlus className="w-4 h-4" />
                              <span>+ Add Player (Popup Form)</span>
                            </button>
                          </div>

                          <div className="divide-y divide-[#4C787E]/20 max-h-80 overflow-y-auto pr-1">
                            {(activeSelectedTeam?.roster || []).map((p, idx) => (
                              <div
                                key={`admin-roster-p-${p.id}-${idx}`}
                                className="py-2.5 px-2 rounded-xl hover:bg-[#162a3d] transition-colors flex items-center justify-between text-xs gap-2 group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-9 h-9 rounded-full bg-[#16273a] border border-[#4C787E]/40 overflow-hidden flex items-center justify-center shrink-0">
                                    <Player3DAvatar player={p} teamId={activeSelectedTeam?.id || ''} size="sm" className="w-full h-full" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-white group-hover:text-[#B7CEEC] transition-colors truncate flex items-center gap-1">
                                      <span>#{p.number} {p.name}</span>
                                      {p.isCaptain && <span className="text-amber-400 text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-400/20 border border-amber-400/30">⭐ (C)</span>}
                                    </p>
                                    <p className="text-[10px] text-gray-400 truncate">
                                      <span className="font-bold text-teal-300">{p.position}</span> • OVR: <span className="text-amber-300 font-bold">{p.overallRating || 82}</span> • {p.goals || 0} G, {p.assists || 0} A
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCaptainStatus(p.id)}
                                    title={p.isCaptain ? 'Remove Captain' : 'Make Captain'}
                                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${p.isCaptain ? 'bg-amber-400/20 border-amber-400 text-amber-300' : 'bg-[#101d2a] border-[#4C787E]/30 text-gray-400 hover:text-amber-300'
                                      }`}
                                  >
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPlayerToEdit(p);
                                      setIsPlayerFormOpen(true);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-[#182a3c] hover:bg-[#B7CEEC] text-[#B7CEEC] hover:text-slate-950 font-bold text-[11px] border border-[#4C787E]/40 transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRemovePlayerFromRoster(p.id)}
                                    title="Remove Player"
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: CLUB DETAILS & HISTORY */}
                  {activeTab === 'club' && (
                    <div className="space-y-4">
                      {!canEditActiveTeam ? (
                        <div className="p-4 rounded-2xl bg-[#1d0e14] border border-rose-500/40 text-xs text-rose-300 space-y-2">
                          <div className="flex items-center gap-2 font-bold text-rose-200">
                            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                            <span>⛔ ACCESS RESTRICTED</span>
                          </div>
                          <p>
                            You are logged in as <strong>{currentAdmin?.teamName || 'Team Admin'}</strong>. Only the Commissioner or this team's assigned club admin can edit details, managers, and board members for <strong>{activeSelectedTeam?.name || 'Selected Club'}</strong>.
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleSaveClubDetails} className="space-y-4">
                          <div className="p-4 rounded-2xl bg-[#112132] border border-[#4C787E]/40 space-y-3">
                            <div className="flex items-center justify-between border-b border-[#4C787E]/30 pb-2">
                              <div className="flex items-center gap-2 text-amber-300">
                                <Building2 className="w-4 h-4" />
                                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                                  {activeSelectedTeam?.name || 'Selected Club'} - Club Details & Board Members
                                </h4>
                              </div>
                              {saveSuccess && (
                                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved to Database!
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Club Manager / Admin</label>
                                <input
                                  type="text"
                                  value={manager}
                                  onChange={(e) => setManager(e.target.value)}
                                  placeholder="e.g. Biraj Thapa"
                                  className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white focus:outline-none focus:border-[#B7CEEC]"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Head Coach</label>
                                <input
                                  type="text"
                                  value={headCoach}
                                  onChange={(e) => setHeadCoach(e.target.value)}
                                  placeholder="e.g. Pep Guardiola"
                                  className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white focus:outline-none focus:border-[#B7CEEC]"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Club Motto</label>
                                <input
                                  type="text"
                                  value={motto}
                                  onChange={(e) => setMotto(e.target.value)}
                                  placeholder="e.g. Steamed to perfection 🥟"
                                  className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white focus:outline-none focus:border-[#B7CEEC]"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Club Nickname</label>
                                <input
                                  type="text"
                                  value={nickname}
                                  onChange={(e) => setNickname(e.target.value)}
                                  placeholder="e.g. The Dumpling Kings"
                                  className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white focus:outline-none focus:border-[#B7CEEC]"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Home Stadium</label>
                                <input
                                  type="text"
                                  value={homeStadium}
                                  onChange={(e) => setHomeStadium(e.target.value)}
                                  placeholder="e.g. Steam Arena"
                                  className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white focus:outline-none focus:border-[#B7CEEC]"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-gray-400 block mb-1">Stadium Capacity</label>
                                <input
                                  type="text"
                                  value={stadiumCapacity}
                                  onChange={(e) => setStadiumCapacity(e.target.value)}
                                  placeholder="e.g. 12,500 (Steam Arena)"
                                  className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white focus:outline-none focus:border-[#B7CEEC]"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-gray-400 block mb-1">Club History / Origin Bio</label>
                              <textarea
                                rows={2}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Describe club history, origin story..."
                                className="w-full p-2.5 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white text-xs focus:outline-none focus:border-[#B7CEEC]"
                              />
                            </div>

                            {/* Board Members Section */}
                            <div className="pt-2 border-t border-[#4C787E]/30 space-y-2">
                              <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-amber-400" /> Club Board Members & Executives
                              </label>

                              {boardMembers.length > 0 && (
                                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                                  {boardMembers.map((bm, idx) => (
                                    <div
                                      key={`bm-${bm.id}-${idx}`}
                                      className="p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/30 flex items-center justify-between text-xs"
                                    >
                                      <div>
                                        <p className="font-bold text-white">{bm.name}</p>
                                        <p className="text-[10px] text-gray-400">{bm.designation}</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveBoardMember(bm.id)}
                                        className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Board Member Name"
                                  value={newBoardName}
                                  onChange={(e) => setNewBoardName(e.target.value)}
                                  className="flex-1 p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white text-xs focus:outline-none focus:border-[#B7CEEC]"
                                />
                                <input
                                  type="text"
                                  placeholder="Designation (e.g. Chairman)"
                                  value={newBoardDesignation}
                                  onChange={(e) => setNewBoardDesignation(e.target.value)}
                                  className="w-36 p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white text-xs focus:outline-none focus:border-[#B7CEEC]"
                                />
                                <button
                                  type="button"
                                  onClick={handleAddBoardMember}
                                  className="px-3 py-2 rounded-xl bg-[#1b344c] hover:bg-[#274a6b] text-teal-300 font-bold text-xs border border-[#4C787E]/40 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add</span>
                                </button>
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-2"
                            >
                              <Save className="w-4 h-4" />
                              <span>Save Club Details to Firestore</span>
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* TAB 4: BROADCAST PUSH NOTIFICATIONS */}
                  {activeTab === 'broadcast' && (
                    <form onSubmit={handleBroadcastPush} className="space-y-4">
                      <div className="p-4 rounded-2xl bg-[#112132] border border-[#4C787E]/40 space-y-3">
                        <div className="flex items-center gap-2 text-yellow-400">
                          <Bell className="w-4 h-4" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                            Send Real-Time Fan Push Alert Broadcast
                          </h4>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="text-gray-400 block mb-1">Target Audience</label>
                            <select
                              value={notifTeamTarget}
                              onChange={(e) => setNotifTeamTarget(e.target.value)}
                              className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white font-bold focus:outline-none"
                            >
                              <option value="all">📢 All League Supporters & Fans</option>
                              {teams.map((t, idx) => (
                                <option key={`broadcast-team-opt-${t.id}-${idx}`} value={t.id}>
                                  ⚽ Only {t.name} Supporters
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-gray-400 block mb-1">Notification Title</label>
                            <input
                              type="text"
                              value={notifTitle}
                              onChange={(e) => setNotifTitle(e.target.value)}
                              placeholder="e.g. ⚽ MASSIVE MATCH TODAY!"
                              className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white focus:outline-none focus:border-[#B7CEEC]"
                            />
                          </div>

                          <div>
                            <label className="text-gray-400 block mb-1">Alert Message</label>
                            <textarea
                              rows={2}
                              value={notifMessage}
                              onChange={(e) => setNotifMessage(e.target.value)}
                              placeholder="e.g. Momo Strikers kick off against No Stamina in 15 minutes at Steam Arena!"
                              className="w-full p-2.5 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white text-xs focus:outline-none focus:border-[#B7CEEC]"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#B7CEEC] to-[#4C787E] text-slate-950 font-black text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                        >
                          <Bell className="w-4 h-4" />
                          <span>Dispatch Real-Time Push Notification</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* TAB 5: FIRESTORE DB SYNC STATUS */}
                  {activeTab === 'database' && (
                    <div className="p-4 rounded-2xl bg-[#112132] border border-[#4C787E]/40 space-y-4 text-xs">
                      <div className="flex items-center gap-2 text-sky-300">
                        <Database className="w-5 h-5 text-sky-400" />
                        <div>
                          <h4 className="font-bold text-white text-sm">Firebase Firestore Security & Data Sync</h4>
                          <p className="text-[11px] text-[#B7CEEC]/80">Connected Database ID: ai-studio-sundayleague2026</p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#0a1420] border border-[#4C787E]/30 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Data Protocol:</span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> HTTPS / TLS 1.3 Encrypted
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Collections Synchronized:</span>
                          <span className="text-emerald-400 font-bold">3 (`teams`, `matches`, `notifications`)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Real-time Sync:</span>
                          <span className="text-emerald-400 font-bold">Active (`onSnapshot`)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Security Rules:</span>
                          <span className="text-emerald-400 font-bold">Deployed & Enforced</span>
                        </div>
                      </div>

                      {resyncSuccessMsg && (
                        <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{resyncSuccessMsg}</span>
                        </div>
                      )}

                      <button
                        onClick={async () => {
                          setIsResyncingDb(true);
                          setResyncSuccessMsg(null);
                          try {
                            await resetFirestoreToDefaults();
                            setResyncSuccessMsg('Successfully synced official Excel teams, rosters, and 7 fixtures to HTTPS Firestore!');
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setIsResyncingDb(false);
                          }
                        }}
                        disabled={isResyncingDb}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-[#4C787E] text-white font-bold text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                      >
                        <RotateCcw className={`w-4 h-4 ${isResyncingDb ? 'animate-spin' : ''}`} />
                        <span>{isResyncingDb ? 'Syncing to Firestore...' : 'Re-sync Official Excel Data to HTTPS Firestore'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* AUTO EVENT WIZARD POPUP MODAL */}
      {editingMatch && (
        <AutoEventWizardModal
          isOpen={isAutoWizardOpen}
          onClose={() => setIsAutoWizardOpen(false)}
          match={editingMatch}
          homeTeam={teams.find((t) => t.id === editingMatch.homeTeamId) || teams[0]}
          awayTeam={teams.find((t) => t.id === editingMatch.awayTeamId) || teams[1]}
          initialEventType={wizardEventType}
          currentMatchMinute={matchMinute}
          onConfirmEvent={handleConfirmWizardEvent}
        />
      )}

      {/* DEDICATED EVENT EDITOR / MANUAL EVENT CORRECTION MODAL */}
      {editingMatch && (
        <EditMatchEventModal
          isOpen={isEditEventModalOpen}
          onClose={() => setIsEditEventModalOpen(false)}
          match={editingMatch}
          teams={teams}
          eventToEdit={eventToEdit}
          onSaveEvent={handleSaveEditedEvents}
        />
      )}

      {/* DEDICATED PLAYER FORM POPUP MODAL */}
      <PlayerFormModal
        isOpen={isPlayerFormOpen}
        onClose={() => {
          setIsPlayerFormOpen(false);
          setPlayerToEdit(null);
        }}
        onSave={(savedPlayer) => {
          const targetTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];
          if (!targetTeam) return;

          const currentRoster = targetTeam.roster || [];
          const exists = currentRoster.some((p) => p.id === savedPlayer.id);
          let updatedRoster: Player[];
          if (exists) {
            updatedRoster = currentRoster.map((p) => (p.id === savedPlayer.id ? savedPlayer : p));
          } else {
            updatedRoster = [...currentRoster, savedPlayer];
          }
          onUpdateRoster(targetTeam.id, updatedRoster);
          setIsPlayerFormOpen(false);
          setPlayerToEdit(null);
        }}
        playerToEdit={playerToEdit}
        teamName={teams.find((t) => t.id === selectedTeamId)?.name}
      />

      {/* PLAYER OF THE MATCH (MOTM) SELECTION MODAL POPUP */}
      {editingMatch && showMotmModal && (
        <div
          style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 24px))' }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg p-5 sm:p-6 rounded-3xl bg-[#091522] border-2 border-amber-400/80 shadow-[0_0_50px_rgba(245,158,11,0.4)] text-white space-y-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-amber-400/30 pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
                <div>
                  <h3 className="text-lg font-black uppercase text-amber-300 tracking-wider">
                    ⭐ Select Player of the Match
                  </h3>
                  <p className="text-xs text-gray-300 font-medium">
                    Full Time Ended: {teams.find(t => t.id === editingMatch.homeTeamId)?.name} vs {teams.find(t => t.id === editingMatch.awayTeamId)?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMotmModal(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-amber-200/90 font-bold bg-amber-500/10 p-3 rounded-xl border border-amber-400/30">
              Choose 1 standout performer from either squad to award the official Sunday League ⭐ Player of the Match award. This will immediately update the Standings MOTM Leaderboard & Player Profile Telemetry!
            </p>

            {/* Team Filter Tabs / Grid */}
            <div className="space-y-4">
              {/* Home Team Squad */}
              <div>
                <h4 className="text-xs font-black uppercase text-[#B7CEEC] flex items-center gap-2 mb-2">
                  <TeamLogo teamId={editingMatch.homeTeamId} size={18} />
                  <span>{teams.find(t => t.id === editingMatch.homeTeamId)?.name} Roster</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(teams.find(t => t.id === editingMatch.homeTeamId)?.roster || []).map((p) => {
                    const isSelected = selectedMotmPlayerId === p.id || selectedMotmPlayerName === p.name;
                    return (
                      <button
                        key={`motm-h-${p.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedMotmPlayerId(p.id);
                          setSelectedMotmPlayerName(p.name);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between min-h-[44px] ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-amber-200 font-black shadow-lg ring-2 ring-amber-300 scale-[1.02]'
                            : 'bg-[#060e18] border-[#4C787E]/40 text-white hover:border-amber-400/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold opacity-80">#{p.number}</span>
                          <span className="text-xs font-extrabold">{p.name}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${isSelected ? 'bg-slate-950 text-amber-300' : 'bg-white/10 text-gray-300'}`}>
                          {p.position}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Away Team Squad */}
              <div>
                <h4 className="text-xs font-black uppercase text-[#B7CEEC] flex items-center gap-2 mb-2">
                  <TeamLogo teamId={editingMatch.awayTeamId} size={18} />
                  <span>{teams.find(t => t.id === editingMatch.awayTeamId)?.name} Roster</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(teams.find(t => t.id === editingMatch.awayTeamId)?.roster || []).map((p) => {
                    const isSelected = selectedMotmPlayerId === p.id || selectedMotmPlayerName === p.name;
                    return (
                      <button
                        key={`motm-a-${p.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedMotmPlayerId(p.id);
                          setSelectedMotmPlayerName(p.name);
                        }}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between min-h-[44px] ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-amber-200 font-black shadow-lg ring-2 ring-amber-300 scale-[1.02]'
                            : 'bg-[#060e18] border-[#4C787E]/40 text-white hover:border-amber-400/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold opacity-80">#{p.number}</span>
                          <span className="text-xs font-extrabold">{p.name}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${isSelected ? 'bg-slate-950 text-amber-300' : 'bg-white/10 text-gray-300'}`}>
                          {p.position}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Confirm Button */}
            <div className="pt-3 border-t border-white/10 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowMotmModal(false)}
                className="w-1/3 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-xs uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedMotmPlayerName}
                onClick={handleConfirmMotmAward}
                className={`w-2/3 py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl cursor-pointer transition-all min-h-[48px] ${
                  selectedMotmPlayerName
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950 hover:brightness-110 shadow-amber-500/30'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Star className="w-4 h-4 fill-slate-950" />
                <span>🏆 CONFIRM & AWARD MOTM</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* FIXTURE SCHEDULE EDITOR MODAL (COMMISSIONER EXCLUSIVE) */}
      {isFixtureEditModalOpen && fixtureToEdit && (
        <div
          style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 24px))' }}
          className="fixed inset-0 bg-[#020408]/92 backdrop-blur-2xl z-[80] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#05080c]/98 border-2 border-[#4C787E] rounded-3xl max-w-2xl w-full p-5 sm:p-7 space-y-5 shadow-[0_0_50px_rgba(76,120,126,0.35)] relative text-white max-h-[92vh] overflow-y-auto custom-scrollbar"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#B7CEEC]/20 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#4C787E]/20 text-teal-300 border border-[#4C787E]/40">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider f1-header">
                    EDIT FIXTURE SCHEDULE & DETAILS
                  </h3>
                  <p className="text-xs text-[#B7CEEC]/70 font-mono">
                    Fixture ID: <span className="text-teal-300 font-bold">{fixtureToEdit.id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFixtureEditModalOpen(false)}
                className="p-2 rounded-full bg-[#03060a] hover:bg-[#09111c] text-gray-400 hover:text-white transition-all cursor-pointer border border-[#B7CEEC]/30"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveFixtureModal} className="space-y-4">
              {/* Teams Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-teal-300 mb-1.5">
                    Home Team
                  </label>
                  <select
                    value={editFixtureHomeId}
                    onChange={(e) => setEditFixtureHomeId(e.target.value)}
                    className="w-full bg-[#080d14] border border-[#B7CEEC]/30 rounded-xl px-3.5 py-2.5 text-white text-xs font-bold focus:border-[#4C787E] focus:outline-none"
                  >
                    {teams.map((t) => (
                      <option key={`h-opt-${t.id}`} value={t.id}>
                        {t.name} ({t.shortName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-teal-300 mb-1.5">
                    Away Team
                  </label>
                  <select
                    value={editFixtureAwayId}
                    onChange={(e) => setEditFixtureAwayId(e.target.value)}
                    className="w-full bg-[#080d14] border border-[#B7CEEC]/30 rounded-xl px-3.5 py-2.5 text-white text-xs font-bold focus:border-[#4C787E] focus:outline-none"
                  >
                    {teams.map((t) => (
                      <option key={`a-opt-${t.id}`} value={t.id}>
                        {t.name} ({t.shortName})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Schedule Time & Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#B7CEEC] mb-1.5">
                    Schedule Kickoff Time & Date
                  </label>
                  <input
                    type="text"
                    value={editFixtureStartTime}
                    onChange={(e) => setEditFixtureStartTime(e.target.value)}
                    placeholder="e.g. Sun, Aug 16 • 8:30 AM"
                    className="w-full bg-[#080d14] border border-[#B7CEEC]/30 rounded-xl px-3.5 py-2.5 text-white text-xs font-mono focus:border-[#4C787E] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#B7CEEC] mb-1.5">
                    Stadium Venue
                  </label>
                  <input
                    type="text"
                    value={editFixtureVenue}
                    onChange={(e) => setEditFixtureVenue(e.target.value)}
                    placeholder="e.g. De Anza Stadium"
                    className="w-full bg-[#080d14] border border-[#B7CEEC]/30 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold focus:border-[#4C787E] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Match Settings (Week, Type, Format, Duration) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-300 mb-1">
                    Week #
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={editFixtureWeekNumber}
                    onChange={(e) => setEditFixtureWeekNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#080d14] border border-[#B7CEEC]/30 rounded-xl px-3 py-2 text-white text-xs font-mono focus:border-[#4C787E] focus:outline-none text-center"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-300 mb-1">
                    Match Type
                  </label>
                  <select
                    value={editFixtureMatchType}
                    onChange={(e) => setEditFixtureMatchType(e.target.value)}
                    className="w-full bg-[#080d14] border border-[#B7CEEC]/30 rounded-xl px-2 py-2 text-white text-xs font-semibold focus:border-[#4C787E] focus:outline-none"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Finals">Finals</option>
                    <option value="Playoffs">Playoffs</option>
                    <option value="Friendly">Friendly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-300 mb-1">
                    Format
                  </label>
                  <select
                    value={editFixtureMatchFormat}
                    onChange={(e) => setEditFixtureMatchFormat(e.target.value as any)}
                    className="w-full bg-[#080d14] border border-[#B7CEEC]/30 rounded-xl px-2 py-2 text-white text-xs font-semibold focus:border-[#4C787E] focus:outline-none"
                  >
                    <option value="7v7">7v7</option>
                    <option value="8v8">8v8</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-300 mb-1">
                    Half (mins)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={45}
                    value={editFixtureHalfDuration}
                    onChange={(e) => setEditFixtureHalfDuration(parseInt(e.target.value, 10) || 20)}
                    className="w-full bg-[#080d14] border border-[#B7CEEC]/30 rounded-xl px-3 py-2 text-white text-xs font-mono focus:border-[#4C787E] focus:outline-none text-center"
                  />
                </div>
              </div>

              {/* Status & Scores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#080d14] border border-[#B7CEEC]/20">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-amber-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editFixtureStatus}
                    onChange={(e) => setEditFixtureStatus(e.target.value)}
                    className="w-full bg-[#05080c] border border-[#B7CEEC]/30 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-[#4C787E] focus:outline-none"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="1st_half">Live 1st Half</option>
                    <option value="halftime">Halftime</option>
                    <option value="2nd_half">Live 2nd Half</option>
                    <option value="ended">Full Time (Ended)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 mb-1">
                    Home Score
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editFixtureHomeScore}
                    onChange={(e) => setEditFixtureHomeScore(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#05080c] border border-[#B7CEEC]/30 rounded-xl px-3 py-2 text-white text-xs font-mono font-bold focus:border-[#4C787E] focus:outline-none text-center"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 mb-1">
                    Away Score
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editFixtureAwayScore}
                    onChange={(e) => setEditFixtureAwayScore(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-[#05080c] border border-[#B7CEEC]/30 rounded-xl px-3 py-2 text-white text-xs font-mono font-bold focus:border-[#4C787E] focus:outline-none text-center"
                  />
                </div>
              </div>

              {/* Player of the Match Name */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Player of the Match (Optional)</span>
                </label>
                <input
                  type="text"
                  value={editFixtureMotmPlayerName}
                  onChange={(e) => setEditFixtureMotmPlayerName(e.target.value)}
                  placeholder="e.g. Roshan Basnet"
                  className="w-full bg-[#080d14] border border-[#B7CEEC]/30 rounded-xl px-3.5 py-2.5 text-white text-xs font-semibold focus:border-[#4C787E] focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#B7CEEC]/20">
                <button
                  type="button"
                  onClick={() => setIsFixtureEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#B7CEEC]/30 bg-[#080d14] text-gray-300 text-xs font-bold hover:bg-[#0e1622] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#4C787E] to-teal-500 hover:from-[#3a5d62] hover:to-teal-400 text-white text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-2 transition-all cursor-pointer border border-teal-300/40"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Fixture Changes</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
