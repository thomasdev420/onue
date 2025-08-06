'use client';

import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Music, Upload } from 'lucide-react';
import { getTrendingSongs, playAudioPreview } from '../../../services/musicService';

export default function MusicModal({ isOpen, onClose, onMusicSelect, selectedMusic }) {
  const [activeTab, setActiveTab] = useState('templates');
  const [playingSong, setPlayingSong] = useState(null);
  const [audioElement, setAudioElement] = useState(null);

  const allSongs = getTrendingSongs();

  // Cleanup audio when modal closes
  useEffect(() => {
    if (!isOpen) {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      setPlayingSong(null);
      setAudioElement(null);
    }
  }, [isOpen, audioElement]);

  const handleSongSelect = (song) => {
    onMusicSelect(song);
    onClose();
  };

  const handlePlayPreview = async (songId) => {
    if (playingSong === songId) {
      // Stop playing
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      setPlayingSong(null);
      setAudioElement(null);
    } else {
      // Start playing new song
      if (audioElement) {
        audioElement.pause();
      }
      setPlayingSong(songId);
      
      // Find the song and play its preview
      const song = allSongs.find(s => s.id === songId);
      if (song) {
        try {
          // Create a simple audio tone for demo
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(440 + (songId * 50), audioContext.currentTime);
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 2);
          
          // Auto-stop after 2 seconds
          setTimeout(() => {
            setPlayingSong(null);
          }, 2000);
        } catch (error) {
          console.error('Failed to play audio preview:', error);
        }
      }
    }
  };

  const getThumbnailForSong = (song) => {
    // Generate consistent thumbnails based on song data
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
    const color = colors[song.id % colors.length];
    
    // Special thumbnails for specific songs
    const specialThumbnails = {
      'bliss': 'bg-black',
      'breathe in the air': 'bg-gradient-to-br from-purple-600 to-pink-600',
      'champagne coast': 'bg-gradient-to-r from-gray-800 to-gray-600',
      'cool': 'bg-gradient-to-r from-yellow-400 to-orange-500',
      'divine failure': 'bg-gradient-to-r from-gray-400 to-gray-600',
      'end of beginning': 'bg-gradient-to-r from-blue-800 to-purple-800',
      'eyes without a face': 'bg-red-600',
      'hey jude': 'bg-red-500',
      'last christmas': 'bg-gradient-to-r from-gray-800 to-gray-900'
    };
    
    const bgClass = specialThumbnails[song.name.toLowerCase()] || `bg-[${color}]`;
    
    return (
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xs ${bgClass}`}>
        {song.name.split(' ').map(word => word[0]).join('').toUpperCase()}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-[800px] max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Choose background music</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-3 px-6 text-sm font-medium transition-colors ${
              activeTab === 'templates'
                ? 'bg-gray-100 text-gray-900 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('uploaded')}
            className={`flex-1 py-3 px-6 text-sm font-medium transition-colors ${
              activeTab === 'uploaded'
                ? 'bg-gray-100 text-gray-900 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Uploaded Sounds
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh]">
          {activeTab === 'templates' ? (
            <div className="p-4">
              {/* No Sound Option */}
              <div
                onClick={() => handleSongSelect(null)}
                className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedMusic === null ? 'bg-gray-100' : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <X className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">No Sound</h3>
                  <p className="text-sm text-gray-600">No background music</p>
                </div>
              </div>

              {/* Music Options */}
              {allSongs.map((song) => (
                <div
                  key={song.id}
                  onClick={() => handleSongSelect(song)}
                  className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedMusic?.id === song.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="relative">
                    {getThumbnailForSong(song)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayPreview(song.id);
                      }}
                      className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        playingSong === song.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
                      }`}
                    >
                      {playingSong === song.id ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3 ml-0.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">{song.name}</h3>
                    <p className="text-xs text-gray-600">{song.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Your Sounds</h3>
              <p className="text-gray-600 mb-4">Upload your own audio files to use as background music</p>
              <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                Upload Audio
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedMusic && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Music className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedMusic.name}</p>
                  <p className="text-sm text-gray-600">by {selectedMusic.artist}</p>
                </div>
              </div>
              <button
                onClick={() => handleSongSelect(null)}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 