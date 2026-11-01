import React from 'react';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface AiStatusBannerProps {
  source?: 'ai' | 'fallback';
  fallbackReason?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
  compact?: boolean;
}

export const AiStatusBanner: React.FC<AiStatusBannerProps> = ({
  source = 'ai',
  fallbackReason,
  onRetry,
  isRetrying = false,
  className = '',
  compact = false,
}) => {
  if (source === 'ai') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs ${className}`}
      >
        <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
        <span>AI-Generated Plan</span>
      </div>
    );
  }

  // Fallback / Offline degraded state
  const reasonText = getReasonDescription(fallbackReason);

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200 ${className}`}
      >
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Offline Template</span>
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            className="ml-1 inline-flex items-center gap-1 font-semibold text-amber-900 underline hover:text-amber-950 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Retry AI'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/80 text-amber-900 shadow-xs ${className}`}
    >
      <div className="flex items-start sm:items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-amber-100/80 text-amber-700 shrink-0">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div>
          <div className="text-xs sm:text-sm font-semibold text-amber-900">
            Offline Template Mode — {reasonText}
          </div>
          <p className="text-xs text-amber-700/90 mt-0.5">
            This section is using deterministic rule-based models. Tap retry to synthesize personalized copy using live Gemini AI.
          </p>
        </div>
      </div>

      {onRetry && (
        <div className="shrink-0 flex items-center justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            disabled={isRetrying}
            className="bg-white/80 border-amber-300 text-amber-900 hover:bg-amber-100/60"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />}
          >
            {isRetrying ? 'Synthesizing...' : 'Retry with Live AI'}
          </Button>
        </div>
      )}
    </div>
  );
};

function getReasonDescription(code?: string): string {
  switch (code) {
    case 'API_KEY_MISSING':
      return 'AI key offline';
    case 'TIMEOUT':
      return 'Connection timed out';
    case 'RATE_LIMITED':
      return 'Rate limit reached';
    case 'VALIDATION_FAILED':
      return 'Schema validation error';
    default:
      return 'Synthesizer offline';
  }
}
