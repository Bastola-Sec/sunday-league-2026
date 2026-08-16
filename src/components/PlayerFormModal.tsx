import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Save, Upload, Star, Shield, Award, Camera, Sparkles, Video, CheckCircle2, Loader2 } from 'lucide-react';
import { Player } from '../types';

interface PlayerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (player: Player) => void;
  playerToEdit: Player | null;
  teamName?: string;
}

export const PlayerFormModal: React.FC<PlayerFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  playerToEdit,
  teamName,
}) => {
  const [name, setName] = useState('');
  const [number, setNumber] = useState<number>(10);
  const [position, setPosition] = useState<'GK' | 'DEF' | 'MID' | 'FWD'>('MID');
  const [overallRating, setOverallRating] = useState<number>(82);
  const [goals, setGoals] = useState<number>(0);
  const [assists, setAssists] = useState<number>(0);
  const [yellowCards, setYellowCards] = useState<number>(0);
  const [redCards, setRedCards] = useState<number>(0);
  const [isCaptain, setIsCaptain] = useState<boolean>(false);
  const [signatureTrait, setSignatureTrait] = useState('');
  const [preferredFoot, setPreferredFoot] = useState('Right');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [bio, setBio] = useState('');

  // Video Upload Progress & Completion States
  const [isVideoUploading, setIsVideoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (playerToEdit) {
      setName(playerToEdit.name || '');
      setNumber(playerToEdit.number ?? 10);
      setPosition(playerToEdit.position || 'MID');
      setOverallRating(playerToEdit.overallRating ?? 82);
      setGoals(playerToEdit.goals ?? 0);
      setAssists(playerToEdit.assists ?? 0);
      setYellowCards(playerToEdit.yellowCards ?? 0);
      setRedCards(playerToEdit.redCards ?? 0);
      setIsCaptain(Boolean(playerToEdit.isCaptain));
      setSignatureTrait(playerToEdit.signatureTrait || '');
      setPreferredFoot(playerToEdit.preferredFoot || 'Right');
      setImageUrl(playerToEdit.imageUrl || '');
      setVideoUrl(playerToEdit.videoUrl || '');
      setBio(playerToEdit.bio || '');
      setUploadSuccess(Boolean(playerToEdit.videoUrl));
    } else {
      setName('');
      setNumber(10);
      setPosition('MID');
      setOverallRating(82);
      setGoals(0);
      setAssists(0);
      setYellowCards(0);
      setRedCards(0);
      setIsCaptain(false);
      setSignatureTrait('');
      setPreferredFoot('Right');
      setImageUrl('');
      setVideoUrl('');
      setBio('');
      setUploadSuccess(false);
    }
  }, [playerToEdit, isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsVideoUploading(true);
      setUploadProgress(10);
      setUploadSuccess(false);

      const reader = new FileReader();
      reader.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          setUploadProgress(pct);
        }
      };
      reader.onloadend = () => {
        setVideoUrl(reader.result as string);
        setUploadProgress(100);
        setIsVideoUploading(false);
        setUploadSuccess(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a player name.');
      return;
    }

    const updatedPlayer: Player = {
      id: playerToEdit?.id || `p-${Date.now()}`,
      name: name.trim(),
      number: Number(number) || 1,
      position,
      overallRating: Number(overallRating) || 80,
      goals: Number(goals) || 0,
      assists: Number(assists) || 0,
      yellowCards: Number(yellowCards) || 0,
      redCards: Number(redCards) || 0,
      isCaptain,
      signatureTrait: signatureTrait.trim() || undefined,
      preferredFoot: preferredFoot || 'Right',
      imageUrl: imageUrl.trim() || undefined,
      videoUrl: videoUrl.trim() || undefined,
      bio: bio.trim() || undefined,
      matchesPlayed: playerToEdit?.matchesPlayed ?? 0,
      lastMatchesStats: playerToEdit?.lastMatchesStats || [0, 1, 0, 1, 0],
    };

    onSave(updatedPlayer);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 24px))' }}
        className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-xl bg-[#0b1624] border border-[#B7CEEC]/40 rounded-3xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#102032] via-[#0f283d] to-[#0d1826] border-b border-[#4C787E]/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#348781]/20 border border-[#348781]/40 flex items-center justify-center text-teal-300 shadow-inner">
                {playerToEdit ? <Sparkles className="w-5 h-5 text-amber-300" /> : <User className="w-5 h-5 text-teal-300" />}
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-white uppercase tracking-wider f1-header">
                  {playerToEdit ? `Edit Profile: ${playerToEdit.name}` : 'Register New Player'}
                </h3>
                <p className="text-[11px] text-[#B7CEEC]/80 font-medium">
                  {teamName ? `Managing squad roster for ${teamName}` : 'Enter player attributes, photo & stats'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-[#16273a] text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
            {/* Main Info */}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 sm:col-span-6">
                <label className="text-[11px] font-bold text-[#B7CEEC] block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Biraj Thapa"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white font-semibold focus:outline-none focus:border-[#B7CEEC]"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label className="text-[11px] font-bold text-[#B7CEEC] block mb-1">Jersey Number</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={number}
                  onChange={(e) => setNumber(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white font-semibold focus:outline-none focus:border-[#B7CEEC]"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label className="text-[11px] font-bold text-[#B7CEEC] block mb-1">Position</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white font-semibold focus:outline-none focus:border-[#B7CEEC]"
                >
                  <option value="GK">Goalkeeper (GK)</option>
                  <option value="DEF">Defender (DEF)</option>
                  <option value="MID">Midfielder (MID)</option>
                  <option value="FWD">Forward (FWD)</option>
                </select>
              </div>
            </div>

            {/* Ratings, Captain, Preferred Foot */}
            <div className="grid grid-cols-12 gap-3 p-3 rounded-2xl bg-[#0d1c2b] border border-[#4C787E]/30">
              <div className="col-span-6 sm:col-span-4">
                <label className="text-[10px] font-bold text-amber-300 block mb-1 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Overall Rating (OVR)
                </label>
                <input
                  type="number"
                  min="40"
                  max="99"
                  value={overallRating}
                  onChange={(e) => setOverallRating(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-[#050b12] border border-amber-400/40 text-amber-300 font-bold text-center focus:outline-none focus:border-amber-300"
                />
              </div>

              <div className="col-span-6 sm:col-span-4">
                <label className="text-[10px] font-bold text-[#B7CEEC] block mb-1">Preferred Foot</label>
                <select
                  value={preferredFoot}
                  onChange={(e) => setPreferredFoot(e.target.value)}
                  className="w-full p-2 rounded-xl bg-[#050b12] border border-[#4C787E]/40 text-white font-semibold focus:outline-none focus:border-[#B7CEEC]"
                >
                  <option value="Right">Right</option>
                  <option value="Left">Left</option>
                  <option value="Both">Both (Dual Footed)</option>
                </select>
              </div>

              <div className="col-span-12 sm:col-span-4 flex items-center justify-start sm:justify-center pt-2 sm:pt-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCaptain}
                    onChange={(e) => setIsCaptain(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-400 accent-amber-400 focus:ring-0 cursor-pointer"
                  />
                  <span className="font-bold text-amber-300 text-xs flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    Team Captain
                  </span>
                </label>
              </div>
            </div>

            {/* Stats Row */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#B7CEEC] block">Career Match Statistics</label>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/30">
                  <label className="text-[9px] text-gray-400 block mb-0.5">Goals</label>
                  <input
                    type="number"
                    min="0"
                    value={goals}
                    onChange={(e) => setGoals(Number(e.target.value))}
                    className="w-full text-center bg-transparent font-black text-emerald-400 text-sm focus:outline-none"
                  />
                </div>
                <div className="p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/30">
                  <label className="text-[9px] text-gray-400 block mb-0.5">Assists</label>
                  <input
                    type="number"
                    min="0"
                    value={assists}
                    onChange={(e) => setAssists(Number(e.target.value))}
                    className="w-full text-center bg-transparent font-black text-teal-300 text-sm focus:outline-none"
                  />
                </div>
                <div className="p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/30">
                  <label className="text-[9px] text-gray-400 block mb-0.5">Yellow Cards</label>
                  <input
                    type="number"
                    min="0"
                    value={yellowCards}
                    onChange={(e) => setYellowCards(Number(e.target.value))}
                    className="w-full text-center bg-transparent font-black text-amber-300 text-sm focus:outline-none"
                  />
                </div>
                <div className="p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/30">
                  <label className="text-[9px] text-gray-400 block mb-0.5">Red Cards</label>
                  <input
                    type="number"
                    min="0"
                    value={redCards}
                    onChange={(e) => setRedCards(Number(e.target.value))}
                    className="w-full text-center bg-transparent font-black text-rose-400 text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Trait & Photo */}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 sm:col-span-6">
                <label className="text-[11px] font-bold text-[#B7CEEC] block mb-1">Signature Trait</label>
                <input
                  type="text"
                  placeholder="e.g. Free-Kick Maestro / Out of Breath"
                  value={signatureTrait}
                  onChange={(e) => setSignatureTrait(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white focus:outline-none focus:border-[#B7CEEC]"
                />
              </div>

              <div className="col-span-12 sm:col-span-6">
                <label className="text-[11px] font-bold text-[#B7CEEC] block mb-1">Player Photo</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Photo URL or upload"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 p-2 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white text-xs focus:outline-none focus:border-[#B7CEEC]"
                  />
                  <label className="px-3 py-2 rounded-xl bg-[#1a324a] hover:bg-[#254668] text-[#B7CEEC] font-bold text-xs flex items-center gap-1 cursor-pointer border border-[#4C787E]/40 shrink-0 transition-colors">
                    <Camera className="w-3.5 h-3.5 text-teal-300" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* Mini Action Video Intro Reel Upload */}
            <div className="p-3.5 rounded-2xl bg-[#07131e] border border-rose-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span>Player Intro Video Reel</span>
                </label>
                <span className="text-[9px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                  DIRECT VIDEO
                </span>
              </div>

              {/* Video URL Text Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={videoUrl || ''}
                  onChange={(e) => {
                    setVideoUrl(e.target.value);
                    if (e.target.value) setUploadSuccess(true);
                  }}
                  placeholder="Paste direct Video URL (.mp4, .mov) or upload below"
                  className="flex-1 p-2 rounded-xl bg-[#0a1420] border border-rose-500/30 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-rose-400 font-mono"
                />
              </div>

              {/* Dual Upload Options: From Photos/Files vs Live Camera */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* 1. Photos & Files Upload Button (Does NOT open camera directly) */}
                <label className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:brightness-110 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all">
                  <Upload className="w-4 h-4 text-white" />
                  <span>📂 Photos & Files</span>
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/mov,video/webm,video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </label>

                {/* 2. Live Camera Record Button */}
                <label className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-red-800 to-rose-900 hover:brightness-110 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all border border-rose-500/40">
                  <Video className="w-4 h-4 text-rose-200" />
                  <span>📹 Record Camera</span>
                  <input
                    type="file"
                    accept="video/*"
                    capture="user"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {videoUrl && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-rose-950/40 border border-rose-500/40">
                  <span className="text-[11px] text-rose-200 font-medium truncate max-w-[220px]">
                    ✓ Video attached
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoUrl('');
                      setUploadSuccess(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-900/80 hover:bg-rose-800 text-rose-200 text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Remove Video
                  </button>
                </div>
              )}

              {/* Progress Loading Bar */}
              {isVideoUploading && (
                <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/50 space-y-1.5 animate-pulse">
                  <div className="flex justify-between items-center text-xs font-extrabold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Reading Video File...</span>
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden p-0.5 border border-amber-500/30">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Upload Completed Success Box */}
              {!isVideoUploading && videoUrl && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-950/60 border-2 border-emerald-500/60 shadow-lg shadow-emerald-950/40">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-400 shrink-0 relative bg-black shadow-md">
                    <video src={videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                      <span>VIDEO UPLOAD COMPLETE!</span>
                    </div>
                    <span className="text-[10px] text-emerald-200/90 font-bold block mt-0.5">
                      Preview ready above! Click <span className="text-amber-300 font-extrabold">Save Changes</span> below to apply.
                    </span>
                  </div>
                </div>
              )}

              {!isVideoUploading && !videoUrl && (
                <p className="text-[10px] text-gray-400 font-medium">
                  If no video is uploaded, player card will default to team avatar photo.
                </p>
              )}
            </div>

            {/* Bio Notes */}
            <div>
              <label className="text-[11px] font-bold text-[#B7CEEC] block mb-1">Player Profile / Bio</label>
              <textarea
                rows={2}
                placeholder="Enter player background, club history, or notes..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0a1420] border border-[#4C787E]/40 text-white focus:outline-none focus:border-[#B7CEEC]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#4C787E]/30">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-[#122436] hover:bg-[#1a324a] text-gray-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs transition-all cursor-pointer flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Save className="w-4 h-4" />
                <span>{playerToEdit ? 'Save Changes' : 'Register Player'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
