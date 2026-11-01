import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { EventFull } from '../../types';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useToast } from '../../components/ui/Toast';
import { EventSocialPreviewCard, SocialPlatformMode } from './EventSocialPreviewCard';
import {
  generateSocialShareUrls,
  getDefaultShareCaption,
  getEventPublicUrl,
  shareViaWebShareApi,
} from '../../lib/socialSharing';
import { formatDateDisplay } from '../../lib/formatters';
import {
  Share2,
  Copy,
  Check,
  Download,
  ExternalLink,
  MessageCircle,
  Twitter,
  Facebook,
  Linkedin,
  Sparkles,
  Globe,
  Edit3,
} from 'lucide-react';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventFull;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({ isOpen, onClose, event }) => {
  const { showToast } = useToast();
  const [activePlatform, setActivePlatform] = useState<SocialPlatformMode>('twitter');
  const [caption, setCaption] = useState<string>(() => getDefaultShareCaption(event));
  const [isCopied, setIsCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const publicUrl = getEventPublicUrl(event.details.id);
  const shareUrls = generateSocialShareUrls({ event, customMessage: caption });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setIsCopied(true);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#4B2A7B', '#FF7A6B', '#059669'],
      });
      showToast({
        type: 'success',
        title: 'Public Link Copied!',
        description: 'Shareable event URL is ready to paste anywhere.',
      });
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      showToast({ type: 'error', title: 'Failed to copy link' });
    }
  };

  const handleOpenPlatform = (url: string, platformName: string) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=650,height=550');
    showToast({
      type: 'info',
      title: `Opening ${platformName}`,
      description: 'Review your post and confirm to publish.',
    });
  };

  const handleNativeShare = async () => {
    const success = await shareViaWebShareApi(event, caption);
    if (success) {
      showToast({ type: 'success', title: 'Shared Successfully!' });
    }
  };

  // Canvas Image Exporter for saving card directly
  const handleDownloadCardImage = () => {
    setIsGeneratingImage(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Canvas not supported');

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, 1200, 630);
      grad.addColorStop(0, '#2D184C');
      grad.addColorStop(0.5, '#4B2A7B');
      grad.addColorStop(1, '#1A0E2E');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 630);

      // Subtle decorative pattern lines
      ctx.strokeStyle = 'rgba(255, 122, 107, 0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, 1140, 570);

      // Top Brand Badge
      ctx.fillStyle = '#FF7A6B';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.fillText('✦ EVENT AI VERIFIED PLAN', 60, 90);

      // Category Pill
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.roundRect(60, 120, 240, 40, 20);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.fillText(event.details.type.toUpperCase().replace('_', ' '), 80, 146);

      // Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 54px Georgia, serif';
      const words = event.details.title.split(' ');
      let line = '';
      let y = 230;
      for (const word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > 1050 && line.length > 0) {
          ctx.fillText(line, 60, y);
          line = word + ' ';
          y += 65;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 60, y);

      // Date & Venue Details
      ctx.fillStyle = '#E2D9F3';
      ctx.font = '28px system-ui, sans-serif';
      ctx.fillText(
        `🗓️  ${formatDateDisplay(event.details.date)}   ·   📍  ${event.details.city} ${
          event.details.venueName ? `(${event.details.venueName})` : ''
        }`,
        60,
        y + 80
      );

      // Eco Ribbon & Budget Info
      ctx.fillStyle = '#34D399';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(
        `🌿 Eco Sustainability Rating: ${event.details.ecoScore?.score || 84}/100   ·   ${event.details.estimatedGuestCount} Confirmed Target Guests`,
        60,
        y + 130
      );

      // Footer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '20px monospace';
      ctx.fillText(`View schedule & RSVP: ${publicUrl}`, 60, 560);

      // Trigger Download
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${event.details.title.replace(/\s+/g, '_')}_Social_Card.png`;
      link.href = dataUrl;
      link.click();

      showToast({
        type: 'success',
        title: 'Social Card Downloaded!',
        description: 'PNG image saved for posting to Instagram, Pinterest, or Twitter.',
      });
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', title: 'Could not generate image' });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Event & Social Preview Card"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Platform View Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#4B2A7B]/10 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#F3EEF8]/80 rounded-xl">
            {(
              [
                { id: 'twitter', label: 'Twitter / X Card', icon: <Twitter className="w-3.5 h-3.5 text-sky-500" /> },
                { id: 'facebook', label: 'Facebook Feed', icon: <Facebook className="w-3.5 h-3.5 text-blue-600" /> },
                { id: 'whatsapp', label: 'WhatsApp / Chat', icon: <MessageCircle className="w-3.5 h-3.5 text-emerald-600" /> },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActivePlatform(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  activePlatform === tab.id
                    ? 'bg-white text-[#4B2A7B] shadow-xs'
                    : 'text-[#5C5765] hover:text-[#1E1B24]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <span className="text-[11px] text-[#5C5765] hidden sm:inline">
            Live preview of what recipients see
          </span>
        </div>

        {/* Live Social Card Mockup */}
        <div className="p-4 rounded-2xl bg-[#FBF7F0] border border-[#4B2A7B]/10 flex flex-col items-center">
          <EventSocialPreviewCard
            event={event}
            mode={activePlatform}
            className="w-full max-w-lg"
          />
        </div>

        {/* Custom Caption Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-[#1E1B24] flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-[#4B2A7B]" />
              Personalize Share Caption:
            </label>
            <span className="text-[11px] text-[#5C5765] font-mono">
              {caption.length} characters
            </span>
          </div>
          <textarea
            rows={2}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full px-4 py-2.5 text-xs bg-white border border-[#4B2A7B]/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4B2A7B]/20 text-[#1E1B24]"
            placeholder="Write a message to accompany your link..."
          />
        </div>

        {/* Direct Social Platform Buttons */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5C5765] block">
            Direct 1-Click Publishing
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Twitter / X */}
            <button
              onClick={() => handleOpenPlatform(shareUrls.twitter, 'Twitter / X')}
              className="p-3 rounded-xl bg-black hover:bg-zinc-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Twitter className="w-4 h-4 fill-white" />
              <span>Share to X</span>
            </button>

            {/* Facebook */}
            <button
              onClick={() => handleOpenPlatform(shareUrls.facebook, 'Facebook')}
              className="p-3 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Facebook className="w-4 h-4 fill-white" />
              <span>Facebook</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => handleOpenPlatform(shareUrls.whatsapp, 'WhatsApp')}
              className="p-3 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            {/* LinkedIn */}
            <button
              onClick={() => handleOpenPlatform(shareUrls.linkedin, 'LinkedIn')}
              className="p-3 rounded-xl bg-[#0A66C2] hover:bg-[#095196] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Linkedin className="w-4 h-4 fill-white" />
              <span>LinkedIn</span>
            </button>
          </div>
        </div>

        {/* Public Link Copy & Download Graphic */}
        <div className="p-3.5 rounded-2xl bg-[#FFFDF9] border border-[#4B2A7B]/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#5C5765] min-w-0 w-full sm:w-auto">
            <Globe className="w-4 h-4 text-[#4B2A7B] shrink-0" />
            <span className="font-mono text-[#1E1B24] truncate max-w-xs">{publicUrl}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCardImage}
              disabled={isGeneratingImage}
              leftIcon={<Download className="w-3.5 h-3.5 text-[#FF7A6B]" />}
            >
              Download Card PNG
            </Button>

            <Button
              variant={isCopied ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleCopyLink}
              leftIcon={
                isCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )
              }
            >
              {isCopied ? 'Copied!' : 'Copy Link'}
            </Button>

            {hasNativeShare && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNativeShare}
                leftIcon={<Share2 className="w-3.5 h-3.5" />}
              >
                More...
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
