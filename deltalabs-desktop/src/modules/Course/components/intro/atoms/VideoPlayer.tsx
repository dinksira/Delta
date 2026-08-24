import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [buffered, setBuffered] = useState(0);
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
  }, [isMuted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    } else if (newVolume === 0 && !isMuted) {
      setIsMuted(true);
      videoRef.current.muted = true;
    }
  }, [isMuted]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    
    if (videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered((bufferedEnd / videoRef.current.duration) * 100);
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    videoRef.current.currentTime = newTime;
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  const handleRateChange = (rate: number) => {
    if (!videoRef.current) return;
    setPlaybackRate(rate);
    videoRef.current.playbackRate = rate;
    setShowSettings(false);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const progressPercent = (currentTime / duration) * 100;

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-[16/10] bg-black rounded-2xl overflow-hidden group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
        loop
        muted={isMuted}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
          <div className="text-white text-lg mb-2">Failed to load video</div>
          <button 
            onClick={() => {
              setHasError(false);
              setIsLoading(true);
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Big Play Button Overlay */}
      {!isPlaying && !isLoading && !hasError && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer z-5"
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-110">
            <Play className="w-10 h-10 text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress Bar */}
        <div className="relative h-1.5 w-full bg-white/30 rounded-full mb-4 group/progress hover:h-3 transition-all cursor-pointer">
          {/* Buffered Progress */}
          <div 
            className="absolute h-full bg-white/40 rounded-full"
            style={{ width: `${buffered}%` }}
          />
          {/* Current Progress */}
          <div 
            className="absolute h-full bg-primary-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {/* Thumb */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary-500 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `calc(${progressPercent}% - 8px)` }}
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button 
              onClick={togglePlay}
              className="text-white hover:text-primary-400 transition-colors"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6" fill="currentColor" />}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleMute}
                className="text-white hover:text-primary-400 transition-colors"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-24 h-1.5 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>

            {/* Time */}
            <div className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Playback Speed */}
            <div className="relative">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="text-white hover:text-primary-400 transition-colors"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              {/* Settings Menu */}
              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl overflow-hidden z-20">
                  <div className="p-3 border-b border-white/10">
                    <div className="text-white text-sm font-semibold mb-2">Playback Speed</div>
                    <div className="grid grid-cols-3 gap-1">
                      {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(rate => (
                        <button
                          key={rate}
                          onClick={() => handleRateChange(rate)}
                          className={`px-2 py-1 text-sm rounded transition-colors ${
                            playbackRate === rate 
                              ? 'bg-primary-600 text-white' 
                              : 'text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {rate}×
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-white text-sm font-semibold mb-2">Quality</div>
                    <div className="space-y-1">
                      <button className="w-full text-left px-2 py-1 text-sm text-primary-400 rounded bg-primary-600/20">
                        Auto (Recommended)
                      </button>
                      <button className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-white/10 rounded">
                        1080p
                      </button>
                      <button className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-white/10 rounded">
                        720p
                      </button>
                      <button className="w-full text-left px-2 py-1 text-sm text-gray-300 hover:bg-white/10 rounded">
                        480p
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button 
              onClick={toggleFullscreen}
              className="text-white hover:text-primary-400 transition-colors"
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};