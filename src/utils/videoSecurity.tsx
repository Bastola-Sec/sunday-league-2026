import React from 'react';

export interface ProcessedVideoSource {
  type: 'embed' | 'direct' | 'invalid';
  src: string;
  provider?: 'youtube' | 'vimeo' | 'gdrive' | 'streamable' | 'direct';
}

/**
 * Validates, sanitizes, and parses raw video URLs into secure video sources.
 * Prevents XSS script execution (e.g. javascript: URIs) and converts platform URLs (YouTube, Vimeo, Drive)
 * into safe, sandboxed iframe embeds or secure HTTPS video streams.
 */
export function parseAndSecureVideoUrl(rawUrl?: string): ProcessedVideoSource {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { type: 'invalid', src: '' };
  }

  const url = rawUrl.trim();
  if (!url) return { type: 'invalid', src: '' };

  // 1. Block dangerous JavaScript, VBScript, or Data HTML injection protocols
  const lowerUrl = url.toLowerCase();
  if (
    lowerUrl.startsWith('javascript:') ||
    lowerUrl.startsWith('vbscript:') ||
    lowerUrl.startsWith('data:text/html') ||
    lowerUrl.startsWith('file:')
  ) {
    return { type: 'invalid', src: '' };
  }

  // Allow safe inline Base64 video data URLs
  if (lowerUrl.startsWith('data:video/')) {
    return { type: 'direct', src: url, provider: 'direct' };
  }

  // Ensure protocol starts with http:// or https://
  let cleanUrl = url;
  if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
    cleanUrl = `https://${url}`;
  }

  try {
    const parsed = new URL(cleanUrl);

    // 2. YouTube & YouTube Shorts
    if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
      let videoId = '';
      if (parsed.hostname.includes('youtu.be')) {
        videoId = parsed.pathname.substring(1);
      } else if (parsed.pathname.includes('/shorts/')) {
        videoId = parsed.pathname.split('/shorts/')[1];
      } else {
        videoId = parsed.searchParams.get('v') || '';
      }

      if (videoId) {
        videoId = videoId.split('&')[0].split('?')[0];
        const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0`;
        return { type: 'embed', src: embedUrl, provider: 'youtube' };
      }
    }

    // 3. Vimeo
    if (parsed.hostname.includes('vimeo.com')) {
      const parts = parsed.pathname.split('/');
      const videoId = parts[parts.length - 1];
      if (videoId && !isNaN(Number(videoId))) {
        const embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&background=1`;
        return { type: 'embed', src: embedUrl, provider: 'vimeo' };
      }
    }

    // 4. Google Drive Video Files
    if (parsed.hostname.includes('drive.google.com')) {
      const match = parsed.pathname.match(/\/file\/d\/([^\/]+)/);
      if (match && match[1]) {
        const embedUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
        return { type: 'embed', src: embedUrl, provider: 'gdrive' };
      }
    }

    // 5. Streamable
    if (parsed.hostname.includes('streamable.com')) {
      const videoId = parsed.pathname.substring(1).split('/')[0];
      if (videoId) {
        const embedUrl = `https://streamable.com/e/${videoId}?autoplay=1&nocontrols=1`;
        return { type: 'embed', src: embedUrl, provider: 'streamable' };
      }
    }

    // 6. Direct MP4 / MOV / WEBM or standard HTTPS URL
    return { type: 'direct', src: cleanUrl, provider: 'direct' };
  } catch (err) {
    return { type: 'invalid', src: '' };
  }
}

/**
 * Component to securely render sandboxed video streams & embeds with security flags
 */
export const SecurePlayerVideo: React.FC<{
  videoUrl: string;
  className?: string;
}> = ({ videoUrl, className = 'w-full h-full object-cover rounded-2xl pointer-events-none' }) => {
  const processed = parseAndSecureVideoUrl(videoUrl);

  if (processed.type === 'invalid') {
    return null;
  }

  if (processed.type === 'embed') {
    return (
      <iframe
        src={processed.src}
        title="Player Intro Video"
        className={className}
        allow="autoplay; encrypted-media; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-presentation"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <video
      src={processed.src}
      autoPlay
      loop
      muted
      playsInline
      controls={false}
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      onCanPlay={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
      className={className}
    />
  );
};
