import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Plus, UserPlus, Trash2, Star, Info, Save, CheckCircle2, Building2, Briefcase, Award, Camera, Edit2, Upload } from 'lucide-react';
import { Team, Player, BoardMember } from '../types';
import { TeamLogo } from './TeamLogos';
import { Player3DAvatar } from './Player3DAvatar';
import { PlayerFormModal } from './PlayerFormModal';

interface TeamAdminModalProps {
  team: Team | null;
  onClose: () => void;
  onUpdateRoster: (teamId: string, updatedRoster: Player[]) => void;
  onUpdateTeamDetails?: (teamId: string, details: Partial<Team>) => void;
  onSelectPlayer?: (player: Player, team: Team) => void;
  activeAdminTeamId?: string | null;
  isCommish?: boolean;
  onSelectAdminTeam?: (teamId: string | null) => void;
}

export const TeamAdminModal: React.FC<TeamAdminModalProps> = ({
  team,
  onClose,
  onUpdateRoster,
  onUpdateTeamDetails,
  onSelectPlayer,
  activeAdminTeamId,
  isCommish = false,
  onSelectAdminTeam,
}) => {
  const [activeTab, setActiveTab] = useState<'roster' | 'details'>('roster');

  // Permission & Passcode State
  const [unlockedByPasscode, setUnlockedByPasscode] = useState(false);
  const [passcodeAttempt, setPasscodeAttempt] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  const canEdit = Boolean(
    isCommish ||
    (activeAdminTeamId && team && activeAdminTeamId === team.id) ||
    unlockedByPasscode
  );

  const handlePasscodeUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;

    const clean = passcodeAttempt.trim().toUpperCase();
    const isTeamValid = team.adminCode ? clean === team.adminCode.toUpperCase() : clean === `${team.id.toUpperCase()}2026`;
    const isCommishValid = clean === 'COMMISH2026' || clean === 'COMMISH' || clean === 'SL2026';

    if (isTeamValid || isCommishValid) {
      setUnlockedByPasscode(true);
      setPasscodeError(null);
      if (onSelectAdminTeam) {
        onSelectAdminTeam(isCommishValid ? 'all' : team.id);
      }
    } else {
      setPasscodeError('Invalid passcode. Please verify your credentials and try again.');
    }
  };

  // Dedicated Popup Form state
  const [isPlayerFormOpen, setIsPlayerFormOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);

  // Roster State
  const [roster, setRoster] = useState<Player[]>(team?.roster || []);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState<number>(10);
  const [newPlayerPosition, setNewPlayerPosition] = useState<'GK' | 'DEF' | 'MID' | 'FWD'>('MID');
  const [newPlayerImageUrl, setNewPlayerImageUrl] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Club Details Form State
  const [motto, setMotto] = useState(team?.motto || '');
  const [manager, setManager] = useState(team?.manager || team?.adminName || '');
  const [headCoach, setHeadCoach] = useState(team?.headCoach || '');
  const [homeStadium, setHomeStadium] = useState(team?.homeStadium || '');
  const [founded, setFounded] = useState(team?.founded || '2022');
  const [stadiumCapacity, setStadiumCapacity] = useState(team?.stadiumCapacity || '');
  const [nickname, setNickname] = useState(team?.nickname || '');
  const [bio, setBio] = useState(team?.bio || '');
  const [clubCulture, setClubCulture] = useState(team?.clubCulture || '');
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>(team?.boardMembers || []);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDesignation, setNewBoardDesignation] = useState('Board Member');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (team) {
      setRoster(team.roster || []);
      setMotto(team.motto || '');
      setManager(team.manager || team.adminName || '');
      setHeadCoach(team.headCoach || '');
      setHomeStadium(team.homeStadium || '');
      setFounded(team.founded || '2022');
      setStadiumCapacity(team.stadiumCapacity || '');
      setNickname(team.nickname || '');
      setBio(team.bio || '');
      setClubCulture(team.clubCulture || '');
      setBoardMembers(team.boardMembers || []);
    }
  }, [team]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (isEdit && editingPlayer) {
          setEditingPlayer({ ...editingPlayer, imageUrl: result });
        } else {
          setNewPlayerImageUrl(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddBoardMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !newBoardName.trim()) return;

    const newBM: BoardMember = {
      id: `bm-${Date.now()}`,
      name: newBoardName.trim(),
      designation: newBoardDesignation.trim() || 'Board Member',
    };

    const updated = [...boardMembers, newBM];
    setBoardMembers(updated);
    setNewBoardName('');
  };

  const handleRemoveBoardMember = (id: string) => {
    if (!canEdit) return;
    setBoardMembers(boardMembers.filter((bm) => bm.id !== id));
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !newPlayerName.trim()) return;

    const newP: Player = {
      id: `p-${Date.now()}`,
      name: newPlayerName.trim(),
      number: newPlayerNumber,
      position: newPlayerPosition,
      goals: 0,
      assists: 0,
      matchesPlayed: 0,
      yellowCards: 0,
      redCards: 0,
      imageUrl: newPlayerImageUrl || undefined,
      lastMatchesStats: [0, 1, 0, 1, 0],
    };

    const updated = [...roster, newP];
    setRoster(updated);
    if (team) onUpdateRoster(team.id, updated);

    setNewPlayerName('');
    setNewPlayerNumber(newPlayerNumber + 1);
    setNewPlayerImageUrl('');
  };

  const handleSavePlayerEdit = () => {
    if (!canEdit || !editingPlayer || !team) return;
    const updated = roster.map((p) => (p.id === editingPlayer.id ? editingPlayer : p));
    setRoster(updated);
    onUpdateRoster(team.id, updated);
    setEditingPlayer(null);
  };

  const handleRemovePlayer = (id: string) => {
    if (!canEdit || !team) return;
    const updated = roster.filter((p) => p.id !== id);
    setRoster(updated);
    onUpdateRoster(team.id, updated);
  };

  const handleToggleCaptain = (id: string) => {
    if (!canEdit || !team) return;
    const updated = roster.map((p) => ({
      ...p,
      isCaptain: p.id === id ? !p.isCaptain : false,
    }));
    setRoster(updated);
    onUpdateRoster(team.id, updated);
  };

  const handleSaveClubDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !team || !onUpdateTeamDetails) return;

    onUpdateTeamDetails(team.id, {
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

  return (
    <AnimatePresence>
      {team && (
        <motion.div
          key={`team-admin-modal-${team.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 24px))' }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 25 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="w-full max-w-lg bg-[#0b1624] border border-[#B7CEEC]/40 rounded-3xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-[#102032] to-[#0d1826] border-b border-[#4C787E]/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TeamLogo teamId={team.id} size={32} />
              <div>
                <h3 className="font-black text-base uppercase text-white leading-tight">
                  {team.name} Admin
                </h3>
                <p className="text-[10px] text-[#B7CEEC]/80">Edit Squad Roster & Club Information</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#122428] p-0.5 rounded-xl border border-[#348781]/40">
                <button
                  type="button"
                  onClick={() => setActiveTab('roster')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    activeTab === 'roster'
                      ? 'bg-[#348781] text-white shadow-sm'
                      : 'text-[#B7CEEC]/70 hover:text-white'
                  }`}
                >
                  Roster
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    activeTab === 'details'
                      ? 'bg-[#348781] text-white shadow-sm'
                      : 'text-[#B7CEEC]/70 hover:text-white'
                  }`}
                >
                  Club Details
                </button>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-full bg-[#16273a] text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto space-y-5 flex-1">
            {!canEdit && (
              <div className="p-4 rounded-2xl bg-[#122234] border border-amber-400/40 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Restricted Access: Admin Passcode Required</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Only the <strong>League Commissioner</strong> and <strong>{team.name} Club Admins</strong> can edit player profiles, squad rosters, and club board members for {team.name}.
                </p>

                <form onSubmit={handlePasscodeUnlock} className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      placeholder="Enter secret passcode"
                      value={passcodeAttempt}
                      onChange={(e) => {
                        setPasscodeAttempt(e.target.value);
                        setPasscodeError(null);
                      }}
                      className="flex-1 p-2 rounded-xl bg-[#091420] border border-amber-400/30 text-amber-300 font-bold text-xs focus:outline-none focus:border-amber-300 placeholder:text-gray-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs hover:bg-amber-300 transition-colors shadow-md cursor-pointer shrink-0"
                    >
                      Unlock
                    </button>
                  </div>

                </form>

                {passcodeError && (
                  <p className="text-[11px] text-rose-400 font-bold">{passcodeError}</p>
                )}
              </div>
            )}

            {/* TAB 1: SQUAD ROSTER */}
            {activeTab === 'roster' && (
              <>
                {/* Add Player Form */}
                <div className="p-4 rounded-2xl bg-[#122234] border border-[#4C787E]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#B7CEEC]">
                      <UserPlus className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider">Register New Player</h4>
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => {
                          setPlayerToEdit(null);
                          setIsPlayerFormOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs hover:brightness-110 transition-all flex items-center gap-1 cursor-pointer shadow"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Popup Form</span>
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleAddPlayer} className="space-y-3">
                    <div className="grid grid-cols-12 gap-2 text-xs">
                      <div className="col-span-6">
                        <label className="text-[10px] text-gray-400 block mb-1">Player Full Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Sunil Chhetri"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white text-xs font-semibold placeholder:text-gray-500 focus:outline-none focus:border-[#B7CEEC]"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="text-[10px] text-gray-400 block mb-1">Jersey #</label>
                        <input
                          type="number"
                          value={newPlayerNumber}
                          onChange={(e) => setNewPlayerNumber(Number(e.target.value))}
                          className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white text-xs font-semibold focus:outline-none focus:border-[#B7CEEC]"
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="text-[10px] text-gray-400 block mb-1">Position</label>
                        <select
                          value={newPlayerPosition}
                          onChange={(e) => setNewPlayerPosition(e.target.value as any)}
                          className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white text-xs font-semibold focus:outline-none focus:border-[#B7CEEC]"
                        >
                          <option value="GK">GK</option>
                          <option value="DEF">DEF</option>
                          <option value="MID">MID</option>
                          <option value="FWD">FWD</option>
                        </select>
                      </div>
                    </div>

                    {/* Photo Upload Row */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 block">Player Photo (Image File or Image URL)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="https://example.com/photo.jpg or upload below"
                          value={newPlayerImageUrl}
                          onChange={(e) => setNewPlayerImageUrl(e.target.value)}
                          className="flex-1 p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white text-xs font-semibold placeholder:text-gray-500 focus:outline-none focus:border-[#B7CEEC]"
                        />
                        <label className="px-3 py-2 rounded-xl bg-[#1a324a] hover:bg-[#254668] text-[#B7CEEC] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors border border-[#4C787E]/40">
                          <Camera className="w-3.5 h-3.5 text-[#B7CEEC]" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, false)}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {newPlayerImageUrl && (
                        <div className="flex items-center gap-2 mt-1">
                          <img src={newPlayerImageUrl} alt="Preview" className="w-8 h-8 rounded-full object-cover border border-[#B7CEEC]" />
                          <span className="text-[10px] text-emerald-400 font-bold">Photo Attached!</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#B7CEEC] to-[#4C787E] text-slate-950 font-bold text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#4C787E]/30"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Player to Roster</span>
                    </button>
                  </form>
                </div>

                {/* Player Editing Overlay Modal/Card if editing */}
                {editingPlayer && (
                  <div className="p-4 rounded-2xl bg-[#0f2236] border border-amber-400/50 space-y-3 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-[#4C787E]/40 pb-2">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                        <Edit2 className="w-4 h-4" /> Edit Player: {editingPlayer.name}
                      </div>
                      <button
                        onClick={() => setEditingPlayer(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Goals</label>
                        <input
                          type="number"
                          value={editingPlayer.goals}
                          onChange={(e) =>
                            setEditingPlayer({ ...editingPlayer, goals: Number(e.target.value) })
                          }
                          className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Assists</label>
                        <input
                          type="number"
                          value={editingPlayer.assists}
                          onChange={(e) =>
                            setEditingPlayer({ ...editingPlayer, assists: Number(e.target.value) })
                          }
                          className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Matches Played</label>
                        <input
                          type="number"
                          value={editingPlayer.matchesPlayed ?? 0}
                          onChange={(e) =>
                            setEditingPlayer({ ...editingPlayer, matchesPlayed: Number(e.target.value) })
                          }
                          className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Position</label>
                        <select
                          value={editingPlayer.position}
                          onChange={(e) =>
                            setEditingPlayer({ ...editingPlayer, position: e.target.value as any })
                          }
                          className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white"
                        >
                          <option value="GK">GK</option>
                          <option value="DEF">DEF</option>
                          <option value="MID">MID</option>
                          <option value="FWD">FWD</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 block">Player Photo URL / Upload</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingPlayer.imageUrl || ''}
                          onChange={(e) =>
                            setEditingPlayer({ ...editingPlayer, imageUrl: e.target.value })
                          }
                          placeholder="Photo URL"
                          className="flex-1 p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white text-xs"
                        />
                        <label className="px-3 py-2 rounded-xl bg-[#1a324a] hover:bg-[#254668] text-[#B7CEEC] font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-[#4C787E]/40">
                          <Upload className="w-3.5 h-3.5 text-[#B7CEEC]" />
                          <span>Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, true)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={handleSavePlayerEdit}
                        className="flex-1 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Save className="w-4 h-4" /> Save Player Details
                      </button>
                      <button
                        onClick={() => setEditingPlayer(null)}
                        className="py-2 px-3 rounded-xl bg-[#122434] text-gray-300 font-bold text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Existing Roster List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black uppercase text-[#B7CEEC]">Active Roster ({roster.length})</h4>
                    <span className="text-[10px] text-gray-400">Click star to assign Captain</span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {roster.map((player, idx) => (
                      <div
                        key={`team-admin-roster-${player.id}-${idx}`}
                        className="p-3 rounded-xl bg-[#101e2e] border border-[#4C787E]/30 text-xs flex items-center justify-between hover:border-[#B7CEEC]/50 transition-all group"
                      >
                        <div
                          onClick={() => onSelectPlayer && onSelectPlayer(player, team)}
                          className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                        >
                          <Player3DAvatar player={player} teamId={team?.id || ''} size="sm" className="w-8 h-8 rounded-lg shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-white text-xs group-hover:text-[#B7CEEC] transition-colors truncate">
                                {player.name}
                              </p>
                              {player.isCaptain && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[9px] font-bold border border-amber-400/30 shrink-0">
                                  CAPTAIN
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#B7CEEC]/70 truncate block">
                              #{player.number} {player.position} • {player.goals} Goals • {player.assists} Assists
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setPlayerToEdit(player);
                              setIsPlayerFormOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#B7CEEC] hover:bg-[#348781]/30 transition-colors cursor-pointer"
                            title="Edit Player Details & Photo (Popup Form)"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleCaptain(player.id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              player.isCaptain ? 'text-amber-400 bg-amber-400/10' : 'text-gray-500 hover:text-amber-300'
                            }`}
                            title="Toggle Captain"
                          >
                            <Star className="w-4 h-4 fill-current" />
                          </button>

                          <button
                            onClick={() => handleRemovePlayer(player.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/20 transition-colors"
                            title="Remove Player"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: CLUB DETAILS EDITOR */}
            {activeTab === 'details' && (
              <form onSubmit={handleSaveClubDetails} className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#122234] border border-[#4C787E]/40 space-y-3">
                  <div className="flex items-center justify-between border-b border-[#4C787E]/30 pb-2">
                    <div className="flex items-center gap-2 text-amber-300">
                      <Building2 className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                        Edit Club Info & History
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

                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Founded Year</label>
                      <input
                        type="text"
                        value={founded}
                        onChange={(e) => setFounded(e.target.value)}
                        placeholder="e.g. 2021"
                        className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white focus:outline-none focus:border-[#B7CEEC]"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 block mb-1">Head Coach</label>
                      <input
                        type="text"
                        value={headCoach}
                        onChange={(e) => setHeadCoach(e.target.value)}
                        placeholder="e.g. Sujjan Maharjan"
                        className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white focus:outline-none focus:border-[#B7CEEC]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Club History / Bio</label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Describe club history, origin story..."
                      className="w-full p-2.5 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white text-xs focus:outline-none focus:border-[#B7CEEC]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Club Culture & Philosophy</label>
                    <input
                      type="text"
                      value={clubCulture}
                      onChange={(e) => setClubCulture(e.target.value)}
                      placeholder="e.g. High energy pressing and post-game dumplings"
                      className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white text-xs focus:outline-none focus:border-[#B7CEEC]"
                    />
                  </div>

                  {/* Board Members Section */}
                  <div className="pt-3 border-t border-[#4C787E]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-amber-300">
                        <Briefcase className="w-4 h-4" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                          Board Members & Leadership ({boardMembers.length})
                        </h4>
                      </div>
                    </div>

                    {/* Add Board Member Row */}
                    <div className="grid grid-cols-12 gap-2 text-xs">
                      <div className="col-span-6">
                        <input
                          type="text"
                          placeholder="Member Name (e.g. Sujjan Maharjan)"
                          value={newBoardName}
                          onChange={(e) => setNewBoardName(e.target.value)}
                          className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white placeholder-gray-500 focus:outline-none focus:border-[#B7CEEC]"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          placeholder="Designation (e.g. President)"
                          value={newBoardDesignation}
                          onChange={(e) => setNewBoardDesignation(e.target.value)}
                          className="w-full p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white placeholder-gray-500 focus:outline-none focus:border-[#B7CEEC]"
                        />
                      </div>
                      <div className="col-span-2">
                        <button
                          type="button"
                          onClick={handleAddBoardMember}
                          className="w-full h-full py-2 rounded-xl bg-[#348781] hover:bg-[#4C787E] text-white font-bold flex items-center justify-center transition-colors"
                          title="Add Board Member"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Board Members List */}
                    {boardMembers.length > 0 ? (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {boardMembers.map((bm, idx) => (
                          <div
                            key={`team-admin-bm-${bm.id}-${idx}`}
                            className="p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/30 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                              <span className="font-bold text-white truncate">{bm.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#122428] border border-[#348781]/40 text-[#B7CEEC] font-semibold shrink-0">
                                {bm.designation}
                              </span>
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
                    ) : (
                      <p className="text-[11px] text-gray-400 italic p-2 bg-[#0a1420] rounded-xl text-center">
                        No board members added yet. Add executive leadership details above.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Club Information to Database</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    )}

      {/* DEDICATED POPUP FORM FOR PLAYER EDITING */}
      <PlayerFormModal
        isOpen={isPlayerFormOpen}
        onClose={() => {
          setIsPlayerFormOpen(false);
          setPlayerToEdit(null);
        }}
        onSave={(savedPlayer) => {
          if (!team) return;
          const exists = roster.some((p) => p.id === savedPlayer.id);
          let updated: Player[];
          if (exists) {
            updated = roster.map((p) => (p.id === savedPlayer.id ? savedPlayer : p));
          } else {
            updated = [...roster, savedPlayer];
          }
          setRoster(updated);
          onUpdateRoster(team.id, updated);
        }}
        playerToEdit={playerToEdit}
        teamName={team?.name}
      />
  </AnimatePresence>
);
};
