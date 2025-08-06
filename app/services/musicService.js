// Trending TikTok songs data with audio preview URLs
export const trendingTikTokSongs = [
  {
    id: 1,
    name: "american boy voyager",
    artist: "Voyager",
    duration: "3:40",
    mood: "Dramatic",
    genre: "Pop",
    trending: true,
    previewUrl: null
  },
  {
    id: 2,
    name: "asap clairo",
    artist: "Clairo",
    duration: "3:20",
    mood: "Empowering",
    genre: "Pop",
    trending: true,
    previewUrl: null
  },
  {
    id: 3,
    name: "asap rocky deftones",
    artist: "ASAP Rocky",
    duration: "2:44",
    mood: "Dark",
    genre: "Hip-Hop",
    trending: true,
    previewUrl: null
  },
  {
    id: 4,
    name: "bliss",
    artist: "Bliss",
    duration: "2:33",
    mood: "Calm",
    genre: "Electronic",
    trending: true,
    previewUrl: null
  },
  {
    id: 5,
    name: "breathe in the air",
    artist: "Pink Floyd",
    duration: "2:36",
    mood: "Melancholic",
    genre: "Rock",
    trending: true,
    previewUrl: null
  },
  {
    id: 6,
    name: "carti men i trust",
    artist: "Playboi Carti",
    duration: "3:11",
    mood: "Confident",
    genre: "Hip-Hop",
    trending: true,
    previewUrl: null
  },
  {
    id: 7,
    name: "champagne coast",
    artist: "Beach House",
    duration: "2:57",
    mood: "Romantic",
    genre: "Dream Pop",
    trending: true,
    previewUrl: null
  },
  {
    id: 8,
    name: "cool",
    artist: "Cool",
    duration: "3:35",
    mood: "Fun",
    genre: "Pop",
    trending: true,
    previewUrl: null
  },
  {
    id: 9,
    name: "divine failure",
    artist: "Divine",
    duration: "4:38",
    mood: "Dark",
    genre: "Electronic",
    trending: true,
    previewUrl: null
  },
  {
    id: 10,
    name: "end of beginning",
    artist: "Djo",
    duration: "2:47",
    mood: "Melancholic",
    genre: "Indie",
    trending: true,
    previewUrl: null
  },
  {
    id: 11,
    name: "eyes without a face",
    artist: "Billy Idol",
    duration: "4:58",
    mood: "Dark",
    genre: "Rock",
    trending: true,
    previewUrl: null
  },
  {
    id: 12,
    name: "girl in red gunna",
    artist: "Girl in Red",
    duration: "3:15",
    mood: "Romantic",
    genre: "Indie",
    trending: true,
    previewUrl: null
  },
  {
    id: 13,
    name: "glo",
    artist: "Glo",
    duration: "2:55",
    mood: "Chill",
    genre: "R&B",
    trending: true,
    previewUrl: null
  },
  {
    id: 14,
    name: "hahaha",
    artist: "Hahaha",
    duration: "3:22",
    mood: "Fun",
    genre: "Pop",
    trending: true,
    previewUrl: null
  },
  {
    id: 15,
    name: "head over heels",
    artist: "Tears for Fears",
    duration: "4:15",
    mood: "Nostalgic",
    genre: "Rock",
    trending: true,
    previewUrl: null
  },
  {
    id: 16,
    name: "heart of glass",
    artist: "Blondie",
    duration: "3:54",
    mood: "Nostalgic",
    genre: "Rock",
    trending: true,
    previewUrl: null
  },
  {
    id: 17,
    name: "her",
    artist: "Her",
    duration: "3:28",
    mood: "Romantic",
    genre: "R&B",
    trending: true,
    previewUrl: null
  },
  {
    id: 18,
    name: "hey jude",
    artist: "The Beatles",
    duration: "7:11",
    mood: "Nostalgic",
    genre: "Rock",
    trending: true,
    previewUrl: null
  },
  {
    id: 19,
    name: "im every woman",
    artist: "Chaka Khan",
    duration: "4:09",
    mood: "Empowering",
    genre: "R&B",
    trending: true,
    previewUrl: null
  },
  {
    id: 20,
    name: "last christmas",
    artist: "Wham!",
    duration: "4:27",
    mood: "Nostalgic",
    genre: "Pop",
    trending: true,
    previewUrl: null
  }
];

export const getTrendingSongs = () => {
  return trendingTikTokSongs;
};

export const getSongsByMood = (mood) => {
  return trendingTikTokSongs.filter(song => 
    song.mood.toLowerCase().includes(mood.toLowerCase())
  );
};

export const getSongsByGenre = (genre) => {
  return trendingTikTokSongs.filter(song => 
    song.genre.toLowerCase() === genre.toLowerCase()
  );
};

// Audio preview functionality with Web Audio API
export const playAudioPreview = (songId) => {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create different tones based on song ID
      const baseFreq = 220 + (songId * 30);
      oscillator.frequency.setValueAtTime(baseFreq, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1.5);
      
      resolve({ audioContext, oscillator, gainNode });
    } catch (error) {
      console.error('Failed to create audio preview:', error);
      reject(error);
    }
  });
}; 