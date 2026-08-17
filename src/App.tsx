import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_TEAMS, INITIAL_MATCHES, INITIAL_NOTIFICATIONS } from './data/mockData';
import { Team, Match, PushNotification, AppScrollState, MatchEvent, Player } from './types';
import {
  initializeFirestoreData,
  subscribeTeams,
  subscribeMatches,
  sanitizeMatchesData,
  subscribeNotifications,
  saveTeamToFirestore,
  saveTeamRosterToFirestore,
  saveMatchToFirestore,
  overwriteMatchInFirestore,
  saveNotificationToFirestore,
} from './lib/firestoreService';
import { ThreeSoccerCanvas } from './components/ThreeSoccerCanvas';
import { SlideOutMenu } from './components/SlideOutMenu';
import { State1Hero } from './components/State1Hero';
import { State2Stadium } from './components/State2Stadium';
import { State3Standings } from './components/State3Standings';
import { State4TopClubs } from './components/State4TopClubs';
import { State5LiveAction } from './components/State5LiveAction';
import { LiveMatchModal } from './components/LiveMatchModal';
import { TeamAdminModal } from './components/TeamAdminModal';
import { AdminPortalModal } from './components/AdminPortalModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { CinematicClubModal } from './components/CinematicClubModal';
import { PushNotificationToast } from './components/PushNotificationToast';
import { IPhoneFrame } from './components/IPhoneFrame';
import { computeStandingsAndFinalsMatch, rolloverToNewSeason } from './utils/leagueEngine';

const CURRENT_CACHE_VERSION = 'v2026_08_17_V6_EXACT_ASSISTS';

export default function App() {
  // Application Core State (with LocalStorage cache persistence & versioning)
  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const ver = localStorage.getItem('SUNDAY_LEAGUE_CACHE_VERSION');
      if (ver !== CURRENT_CACHE_VERSION) {
        localStorage.removeItem('SUNDAY_LEAGUE_MATCHES_CACHE');
        localStorage.removeItem('SUNDAY_LEAGUE_TEAMS_CACHE');
        localStorage.setItem('SUNDAY_LEAGUE_CACHE_VERSION', CURRENT_CACHE_VERSION);
        return INITIAL_TEAMS;
      }
      const cached = localStorage.getItem('SUNDAY_LEAGUE_TEAMS_CACHE');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_TEAMS;
  });

  const [matches, setMatches] = useState<Match[]>(() => {
    try {
      const ver = localStorage.getItem('SUNDAY_LEAGUE_CACHE_VERSION');
      if (ver === CURRENT_CACHE_VERSION) {
        const cached = localStorage.getItem('SUNDAY_LEAGUE_MATCHES_CACHE');
        if (cached) {
          const parsed = JSON.parse(cached);
          const finishedCount = Array.isArray(parsed) ? parsed.filter((m: any) => m.isFinished || m.status === 'ended').length : 0;
          const isStuck = Array.isArray(parsed) && parsed.some((m: any) => m.isLive && m.minute > 30);
          if (Array.isArray(parsed) && parsed.length >= 7 && finishedCount >= 4 && !isStuck) {
            return parsed;
          }
        }
      }
    } catch (e) {}
    return INITIAL_MATCHES;
  });

  const [notifications, setNotifications] = useState<PushNotification[]>([]);
  const [currentSeasonNumber, setCurrentSeasonNumber] = useState<number>(1);

  // Mirror teams & matches state changes to LocalStorage cache immediately on edit
  useEffect(() => {
    try {
      localStorage.setItem('SUNDAY_LEAGUE_TEAMS_CACHE', JSON.stringify(teams));
    } catch (e) {}
  }, [teams]);

  useEffect(() => {
    try {
      localStorage.setItem('SUNDAY_LEAGUE_MATCHES_CACHE', JSON.stringify(matches));
    } catch (e) {}
  }, [matches]);

  const handleRolloverSeason = () => {
    const { nextSeasonNumber, updatedTeams, newMatches } = rolloverToNewSeason(
      currentSeasonNumber,
      teams,
      matches
    );
    setCurrentSeasonNumber(nextSeasonNumber);
    setTeams(updatedTeams);
    setMatches(newMatches);
    updatedTeams.forEach((t) => saveTeamToFirestore(t.id, t));
    newMatches.forEach((m) => saveMatchToFirestore(m.id, m));
  };

  // Initialize and subscribe to Firestore real-time sync with local-override protection
  useEffect(() => {
    // Auto-seed Firestore on initial load if collections are empty
    initializeFirestoreData();

    // Subscribe to live updates from Firestore
    const unsubTeams = subscribeTeams((updatedTeams) => {
      setTeams(updatedTeams);
    });
    const unsubMatches = subscribeMatches((updatedMatches) => {
      const sanitizedRemote = sanitizeMatchesData(updatedMatches);
      setMatches((currentLocal) => {
        const localMatchesMap = new Map(currentLocal.map((m) => [m.id, m]));
        const merged = sanitizedRemote.map((remote) => {
          const local = localMatchesMap.get(remote.id);
          // If user locally finished or recorded events for a match, preserve local edits over stale remote live state
          if (local && (local.isFinished || local.status === 'ended' || (local.events && local.events.length > remote.events.length)) && remote.isLive && remote.minute > 30) {
            return local;
          }
          return remote;
        });
        return merged;
      });
    });
    const unsubNotifs = subscribeNotifications((updatedNotifs) => setNotifications(updatedNotifs));

    return () => {
      unsubTeams();
      unsubMatches();
      unsubNotifs();
    };
  }, []);

  // Automatically recalculate regular season standings & update Week 4 Finals (FIX-007) Top 2 Teams
  useEffect(() => {
    if (teams.length === 0 || matches.length === 0) return;

    const { updatedTeams, updatedMatches } = computeStandingsAndFinalsMatch(teams, matches);

    // Check if team stats, points, rankings, or player roster stats changed
    const teamsNeedUpdate = JSON.stringify(updatedTeams) !== JSON.stringify(teams);

    // Check if Finals fixture home/away team changed
    const oldFinals = matches.find((m) => m.id === 'FIX-007' || m.matchType === 'Finals');
    const newFinals = updatedMatches.find((m) => m.id === 'FIX-007' || m.matchType === 'Finals');
    const finalsNeedUpdate = oldFinals && newFinals && (
      oldFinals.homeTeamId !== newFinals.homeTeamId ||
      oldFinals.awayTeamId !== newFinals.awayTeamId
    );

    if (teamsNeedUpdate) {
      setTeams(updatedTeams);
    }

    if (finalsNeedUpdate && newFinals) {
      setMatches(updatedMatches);
      saveMatchToFirestore(newFinals.id, {
        homeTeamId: newFinals.homeTeamId,
        awayTeamId: newFinals.awayTeamId,
        venue: newFinals.venue,
      });
    }
  }, [matches]);

  // Scroll State & Navigation (1..5)
  const [scrollState, setScrollState] = useState<AppScrollState>(1);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Ref for hero background video optimization & mobile PWA autoplay guarantees
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  // State to track if video is actively playing (prevents iOS Low Power Mode play button overlay)
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);

  // Helper function to safely play video on mobile browsers
  const attemptPlayHeroVideo = () => {
    const video = heroVideoRef.current;
    if (!video) return;

    // Force muted & playsInline properties on the HTML DOM node for mobile Safari / PWA
    video.muted = true;
    video.playsInline = true;

    if (scrollState === 1) {
      const promise = video.play();
      if (promise !== undefined) {
        promise
          .then(() => setIsVideoPlaying(true))
          .catch(() => {
            setIsVideoPlaying(false);
          });
      }
    } else {
      video.pause();
      setIsVideoPlaying(false);
    }
  };

  useEffect(() => {
    attemptPlayHeroVideo();
  }, [scrollState]);

  // Comprehensive mobile autoplay & event listeners setup
  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;

    // Set properties explicitly on the DOM element for mobile Safari / PWA webview
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    attemptPlayHeroVideo();

    const handleInteraction = () => {
      attemptPlayHeroVideo();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        attemptPlayHeroVideo();
      }
    };

    video.addEventListener('canplay', attemptPlayHeroVideo);
    video.addEventListener('loadeddata', attemptPlayHeroVideo);
    window.addEventListener('touchstart', handleInteraction, { passive: true, once: true });
    window.addEventListener('pointerdown', handleInteraction, { passive: true, once: true });
    window.addEventListener('click', handleInteraction, { passive: true, once: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      video.removeEventListener('canplay', attemptPlayHeroVideo);
      video.removeEventListener('loadeddata', attemptPlayHeroVideo);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Navigation & Modals
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState<boolean>(false);
  const [activeAdminTeamId, setActiveAdminTeamId] = useState<string | null>(null);
  const [selectedMatchForModal, setSelectedMatchForModal] = useState<Match | null>(null);
  const [selectedTeamForAdminModal, setSelectedTeamTeamForAdminModal] = useState<Team | null>(null);

  // 3D Player Profile Modal Overlay state
  const [selectedPlayerForProfile, setSelectedPlayerForProfile] = useState<Player | null>(null);
  const [selectedTeamForPlayer, setSelectedTeamForPlayer] = useState<Team | null>(null);

  // Cinematic Club Showcase Modal & 3D Camera Sweep State
  const [selectedClubForCinematic, setSelectedClubForCinematic] = useState<Team | null>(null);
  const [cinematicTrigger, setCinematicTrigger] = useState<number>(0);

  const handleSelectClubCinematic = (team: Team) => {
    setSelectedClubForCinematic(team);
    setCinematicTrigger((prev) => prev + 1);
  };

  const handleSelectPlayer = (player: Player, team?: Team) => {
    setSelectedPlayerForProfile(player);
    const resolvedTeam = team || teams.find((t) => t.roster.some((p) => p.id === player.id)) || teams[0] || null;
    setSelectedTeamForPlayer(resolvedTeam);
  };

  // UI Settings
  const [isIPhoneFrame, setIsIPhoneFrame] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Robust Scroll Listener to drive 3D scene camera & UI transitions across window & container
  useEffect(() => {
    const updateScroll = () => {
      const el = containerRef.current;
      const scrollTop = el && el.scrollTop > 0 ? el.scrollTop : window.scrollY;
      const scrollHeight = el && el.scrollHeight > el.clientHeight
        ? (el.scrollHeight - el.clientHeight)
        : (document.documentElement.scrollHeight - window.innerHeight);

      const progress = Math.min(Math.max(scrollTop / (scrollHeight || 1), 0), 1);
      setScrollProgress(progress);

      // Sensitive threshold for State 1 -> State 2 transition
      if (progress < 0.08 && scrollTop < 80) {
        setScrollState(1);
      } else if (progress < 0.30) {
        setScrollState(2);
      } else if (progress < 0.55) {
        setScrollState(3);
      } else if (progress < 0.78) {
        setScrollState(4);
      } else {
        setScrollState(5);
      }
    };

    const el = containerRef.current;
    if (el) {
      el.addEventListener('scroll', updateScroll, { passive: true });
    }
    window.addEventListener('scroll', updateScroll, { passive: true });

    return () => {
      if (el) el.removeEventListener('scroll', updateScroll);
      window.removeEventListener('scroll', updateScroll);
    };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    const progress = Math.min(Math.max(scrollTop / (scrollHeight || 1), 0), 1);
    setScrollProgress(progress);

    if (progress < 0.08 && scrollTop < 80) {
      if (scrollState !== 1) setScrollState(1);
    } else if (progress < 0.30) {
      if (scrollState !== 2) setScrollState(2);
    } else if (progress < 0.55) {
      if (scrollState !== 3) setScrollState(3);
    } else if (progress < 0.78) {
      if (scrollState !== 4) setScrollState(4);
    } else {
      if (scrollState !== 5) setScrollState(5);
    }
  };

  // Jump to specific state
  const handleJumpToState = (state: AppScrollState) => {
    setScrollState(state);
    if (!containerRef.current) return;
    const height = containerRef.current.scrollHeight - containerRef.current.clientHeight;
    const stateRatios: Record<AppScrollState, number> = {
      1: 0,
      2: 0.25,
      3: 0.5,
      4: 0.75,
      5: 0.98,
    };
    containerRef.current.scrollTo({
      top: height * stateRatios[state],
      behavior: 'smooth',
    });
    window.scrollTo({
      top: (document.documentElement.scrollHeight - window.innerHeight) * stateRatios[state],
      behavior: 'smooth',
    });
  };

  // Add Real-Time Push Notification
  const handleSendPushNotification = (title: string, message: string, teamId?: string) => {
    const newNotif: PushNotification = {
      id: `notif-${Date.now()}`,
      title,
      message,
      timestamp: 'Just now',
      teamId,
      type: 'goal',
    };
    setNotifications((prev) => [newNotif, ...prev]);
    saveNotificationToFirestore(newNotif);
    playWhistleSound();
  };

  const handleDismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Update Match Score & Events
  const handleUpdateMatchScore = (
    matchId: string,
    homeScore: number,
    awayScore: number,
    newEvent?: MatchEvent
  ) => {
    const targetMatch = matches.find((m) => m.id === matchId);
    const updatedEvents = newEvent
      ? [...(targetMatch?.events || []), newEvent]
      : targetMatch?.events || [];

    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        return {
          ...m,
          homeScore,
          awayScore,
          events: updatedEvents,
        };
      })
    );

    // Save match changes to Firestore
    saveMatchToFirestore(matchId, {
      homeScore,
      awayScore,
      events: updatedEvents,
    });

    // Also update current open match modal if active
    if (selectedMatchForModal && selectedMatchForModal.id === matchId) {
      setSelectedMatchForModal((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          homeScore,
          awayScore,
          events: updatedEvents,
        };
      });
    }

    // Re-calculate standings automatically
    const { updatedTeams, updatedMatches } = computeStandingsAndFinalsMatch(teams, matches);
    setTeams(updatedTeams);
    updatedTeams.forEach((t) => saveTeamToFirestore(t.id, t));
  };

  // Update full match properties & automatically recalculate league standings + player telemetry stats
  const handleUpdateFullMatch = (matchId: string, updatedFields: Partial<Match>) => {
    let nextMatches: Match[] = [];

    setMatches((prev) => {
      nextMatches = prev.map((m) => (m.id === matchId ? { ...m, ...updatedFields } : m));

      // Recalculate standings and player stats across all matches
      const { updatedTeams, updatedMatches } = computeStandingsAndFinalsMatch(teams, nextMatches);
      
      // Sync recalculated teams state and Firestore
      setTeams(updatedTeams);
      updatedTeams.forEach((t) => saveTeamToFirestore(t.id, t));

      return updatedMatches;
    });

    // Save updated match fields to Firestore
    const targetMatch = nextMatches.find((m) => m.id === matchId);
    if (targetMatch) {
      overwriteMatchInFirestore(matchId, targetMatch);
    } else {
      saveMatchToFirestore(matchId, updatedFields);
    }

    // Also update current open match modal if active
    if (selectedMatchForModal && selectedMatchForModal.id === matchId) {
      setSelectedMatchForModal((prev) => (prev ? { ...prev, ...updatedFields } : null));
    }
  };


  // Update Roster Admin with automatic multi-component & Firestore lineup sync
  const handleUpdateRoster = (teamId: string, updatedRoster: Player[]) => {
    // 1. Update teams state
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, roster: updatedRoster, squadCount: updatedRoster.length } : t))
    );

    // 2. Save updated team roster to Firestore
    saveTeamRosterToFirestore(teamId, updatedRoster);

    // 3. Automatically clean up deleted player IDs from all matches involving this team
    const validPlayerIds = new Set(updatedRoster.map((p) => p.id));
    setMatches((prevMatches) => {
      let matchesChanged = false;
      const nextMatches = prevMatches.map((m) => {
        if (m.homeTeamId !== teamId && m.awayTeamId !== teamId) return m;

        const isHome = m.homeTeamId === teamId;
        const startingKey = isHome ? 'homeStartingPlayerIds' : 'awayStartingPlayerIds';
        const subKey = isHome ? 'homeSubstitutePlayerIds' : 'awaySubstitutePlayerIds';

        const currentStart = m[startingKey] || [];
        const currentSub = m[subKey] || [];

        const cleanStart = currentStart.filter((id) => validPlayerIds.has(id));
        const cleanSub = currentSub.filter((id) => validPlayerIds.has(id));

        if (cleanStart.length !== currentStart.length || cleanSub.length !== currentSub.length) {
          matchesChanged = true;
          const updatedMatch = {
            ...m,
            [startingKey]: cleanStart,
            [subKey]: cleanSub,
          };
          saveMatchToFirestore(m.id, {
            [startingKey]: cleanStart,
            [subKey]: cleanSub,
          });
          return updatedMatch;
        }

        return m;
      });

      return matchesChanged ? nextMatches : prevMatches;
    });

    // 4. Sync active player profile overlay if open
    if (selectedPlayerForProfile) {
      const updatedP = updatedRoster.find((p) => p.id === selectedPlayerForProfile.id);
      if (updatedP) {
        setSelectedPlayerForProfile(updatedP);
      }
    }

    if (selectedTeamForPlayer && selectedTeamForPlayer.id === teamId) {
      setSelectedTeamForPlayer((prev) => (prev ? { ...prev, roster: updatedRoster, squadCount: updatedRoster.length } : null));
    }

    // 5. Sync active open match modal if viewing live fixture
    if (selectedMatchForModal && (selectedMatchForModal.homeTeamId === teamId || selectedMatchForModal.awayTeamId === teamId)) {
      setSelectedMatchForModal((prev) => {
        if (!prev) return null;
        const isHome = prev.homeTeamId === teamId;
        const startingKey = isHome ? 'homeStartingPlayerIds' : 'awayStartingPlayerIds';
        const subKey = isHome ? 'homeSubstitutePlayerIds' : 'awaySubstitutePlayerIds';
        const currentStart = prev[startingKey] || [];
        const currentSub = prev[subKey] || [];

        return {
          ...prev,
          [startingKey]: currentStart.filter((id) => validPlayerIds.has(id)),
          [subKey]: currentSub.filter((id) => validPlayerIds.has(id)),
        };
      });
    }
  };

  // Update Club Details (motto, manager, head coach, bio, etc.)
  const handleUpdateTeamDetails = (teamId: string, details: Partial<Team>) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, ...details } : t))
    );
    saveTeamToFirestore(teamId, details);
  };

  // Web Audio Whistle / Crowd Sound Effect
  const playWhistleSound = () => {
    if (!isSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // High-pitched whistle oscillator
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio context fallback
    }
  };

  return (
    <IPhoneFrame enabled={isIPhoneFrame}>
      {/* 3D WebGL Background Canvas (renders soccer field for State 2 and beyond) */}
      <ThreeSoccerCanvas
        scrollState={scrollState}
        scrollProgress={scrollProgress}
        cinematicTrigger={cinematicTrigger}
      />

      {/* State 1 Hero Video Background Loop (fades out smoothly when scrolling to State 2+) */}
      <div
        className={`fixed inset-0 w-full h-full overflow-hidden bg-[#05080c] transition-all duration-700 ease-in-out pointer-events-none transform-gpu ${
          scrollState === 1 ? 'opacity-100 visible z-[1]' : 'opacity-0 invisible z-[-1]'
        }`}
      >
        {/* High-Tech Ambient Stadium Backdrop Fallback (shows when video is paused/blocked by iOS Low Power Mode) */}
        <div className="absolute inset-0 bg-[#05080c] bg-gradient-to-b from-[#09131d] via-[#05080c] to-[#08111a]">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[35rem] h-[35rem] bg-[#4C787E]/20 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[35rem] h-[35rem] bg-[#B7CEEC]/10 rounded-full blur-[140px] pointer-events-none" />
        </div>

        {/* Hero Loop Video (Only visible when actively playing, prevents iOS native play button overlay) */}
        <video
          ref={heroVideoRef}
          className={`absolute inset-0 w-full h-full object-cover min-w-full min-h-full will-change-transform transform-gpu pointer-events-none transition-opacity duration-700 ${
            isVideoPlaying ? 'opacity-100' : 'opacity-0'
          }`}
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          preload="auto"
          onPlay={() => setIsVideoPlaying(true)}
          onPause={() => setIsVideoPlaying(false)}
          onCanPlay={attemptPlayHeroVideo}
          onLoadedData={attemptPlayHeroVideo}
          src="https://res.cloudinary.com/s87ouqnz/video/upload/v1785915477/Change_the_player_s_jersey_to_jiveo0.mp4"
        />

        {/* Dark Contrast Overlay for hero text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#05080c]/65 via-[#05080c]/40 to-[#05080c]/80 backdrop-blur-[0.5px]" />
      </div>

      {/* Top Corner 3-Dot Hidden Navigation Menu & Slide-out Drawer */}
      <SlideOutMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onToggle={() => setIsMenuOpen((prev) => !prev)}
        scrollState={scrollState}
        onSelectState={handleJumpToState}
        teams={teams}
        activeAdminTeamId={activeAdminTeamId}
        onSelectAdminTeam={(teamId) => {
          setActiveAdminTeamId(teamId);
          const t = teams.find((x) => x.id === teamId);
          if (t) handleSelectClubCinematic(t);
        }}
        isIPhoneFrame={isIPhoneFrame}
        onToggleIPhoneFrame={() => setIsIPhoneFrame((prev) => !prev)}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={() => setIsSoundEnabled((prev) => !prev)}
        notificationCount={notifications.length}
        onOpenNotifications={() => setIsMenuOpen(true)}
        onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
      />



      {/* Scrollable Container with the 5 Sequential States */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto scroll-smooth snap-y snap-mandatory relative z-10 custom-scrollbar"
      >
        {/* State 1: Opening Screen */}
        <div className="snap-start min-h-full">
          <State1Hero onNext={() => handleJumpToState(2)} onJumpToState={handleJumpToState} />
        </div>

        {/* State 2: Live Action & Upcoming Fixtures */}
        <div className="snap-start min-h-full">
          <State5LiveAction
            matches={matches}
            teams={teams}
            onOpenMatchModal={(match) => setSelectedMatchForModal(match)}
            onSendPushNotification={handleSendPushNotification}
            onNext={() => handleJumpToState(3)}
            onSelectTeam={handleSelectClubCinematic}
          />
        </div>

        {/* State 3: Match Venue / Stadium */}
        <div className="snap-start min-h-full">
          <State2Stadium
            onNext={() => handleJumpToState(4)}
            isSoundEnabled={isSoundEnabled}
            onToggleSound={() => setIsSoundEnabled((prev) => !prev)}
          />
        </div>

        {/* State 4: Standings Table */}
        <div className="snap-start min-h-full">
          <State3Standings
            teams={teams}
            onNext={() => handleJumpToState(5)}
            onSelectTeam={(team) => {
              handleSelectClubCinematic(team);
              if (activeAdminTeamId === team.id) {
                setSelectedTeamTeamForAdminModal(team);
              }
            }}
            onSelectPlayer={handleSelectPlayer}
          />
        </div>

        {/* State 5: Participating Clubs */}
        <div className="snap-start min-h-full">
          <State4TopClubs
            teams={teams}
            onNext={() => handleJumpToState(1)}
            onOpenAdmin={(team) => {
              if (activeAdminTeamId !== team.id && activeAdminTeamId !== 'all' && activeAdminTeamId !== 'league_commish') {
                setActiveAdminTeamId('');
              }
              setSelectedTeamTeamForAdminModal(team);
            }}
            onSelectTeam={(team) => {
              handleSelectClubCinematic(team);
            }}
            onSelectPlayer={handleSelectPlayer}
          />
        </div>
      </div>

      {/* Modals */}
      <CinematicClubModal
        team={selectedClubForCinematic}
        allTeams={teams}
        onClose={() => setSelectedClubForCinematic(null)}
        onSelectPlayer={handleSelectPlayer}
        onOpenAdmin={(team) => {
          setActiveAdminTeamId(team.id);
          setSelectedTeamTeamForAdminModal(team);
        }}
        onTriggerCinematic3D={() => setCinematicTrigger((prev) => prev + 1)}
        isSoundEnabled={isSoundEnabled}
      />

      <LiveMatchModal
        match={selectedMatchForModal}
        onClose={() => setSelectedMatchForModal(null)}
        teams={teams}
        allMatches={matches}
        activeAdminTeamId={activeAdminTeamId}
        onUpdateMatchScore={handleUpdateMatchScore}
        onSendPushNotification={handleSendPushNotification}
        onSelectPlayer={handleSelectPlayer}
      />

      <TeamAdminModal
        team={selectedTeamForAdminModal}
        onClose={() => setSelectedTeamTeamForAdminModal(null)}
        onUpdateRoster={handleUpdateRoster}
        onUpdateTeamDetails={handleUpdateTeamDetails}
        onSelectPlayer={handleSelectPlayer}
        activeAdminTeamId={activeAdminTeamId}
        isCommish={activeAdminTeamId === 'all' || activeAdminTeamId === 'league_commish'}
        onSelectAdminTeam={(teamId) => setActiveAdminTeamId(teamId)}
      />

      <AdminPortalModal
        isOpen={isAdminPortalOpen}
        onClose={() => setIsAdminPortalOpen(false)}
        teams={teams}
        matches={matches}
        notifications={notifications}
        onUpdateRoster={handleUpdateRoster}
        onUpdateTeamDetails={handleUpdateTeamDetails}
        onUpdateMatchScore={handleUpdateMatchScore}
        onUpdateFullMatch={handleUpdateFullMatch}
        onSendPushNotification={handleSendPushNotification}
        activeAdminTeamId={activeAdminTeamId}
        onSelectAdminTeam={(teamId) => setActiveAdminTeamId(teamId)}
        onSelectPlayer={handleSelectPlayer}
        onRolloverSeason={handleRolloverSeason}
        currentSeasonNumber={currentSeasonNumber}
      />

      {/* 3D Player Profile Modal Overlay */}
      <PlayerProfileModal
        player={selectedPlayerForProfile}
        team={selectedTeamForPlayer}
        onClose={() => {
          setSelectedPlayerForProfile(null);
          setSelectedTeamForPlayer(null);
        }}
        isSoundEnabled={isSoundEnabled}
        activeAdminTeamId={activeAdminTeamId}
        isCommish={activeAdminTeamId === 'all' || activeAdminTeamId === 'league_commish'}
        onUpdateRoster={handleUpdateRoster}
        onSelectAdminTeam={(teamId) => setActiveAdminTeamId(teamId)}
      />
    </IPhoneFrame>
  );
}
