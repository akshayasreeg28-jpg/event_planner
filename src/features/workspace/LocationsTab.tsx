import React, { useState, useEffect } from 'react';
import { EventFull, VenueRecommendation } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { AiStatusBanner } from '../../components/ui/AiStatusBanner';
import { useToast } from '../../components/ui/Toast';
import { apiGetWeather, apiSearchVenues } from '../../services/api';
import { upsertEvent } from '../../lib/storage';
import {
  MapPin,
  CloudSun,
  ShieldAlert,
  CheckCircle2,
  Bookmark,
  Star,
  Search,
  ExternalLink,
  Car,
  Zap,
  Volume2,
  SlidersHorizontal,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const LocationsTab: React.FC<{ event: EventFull }> = ({ event }) => {
  const { showToast } = useToast();
  const [cityInput, setCityInput] = useState(event.details.city || 'Chennai');
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [venues, setVenues] = useState<any[]>(event.venues || []);
  const [venuesSource, setVenuesSource] = useState<'ai' | 'fallback'>('ai');
  const [weatherResponse, setWeatherResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  // Load weather and venues on mount
  useEffect(() => {
    fetchLocationData(cityInput);
  }, []);

  const fetchLocationData = async (targetCity: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch real grounded venues
      const venuesResult = await apiSearchVenues(targetCity, filterType);
      setVenues(venuesResult.venues);
      if (venuesResult.source) {
        setVenuesSource(venuesResult.source);
      }

      // 2. Fetch Open-Meteo weather / seasonal average
      const lat = venuesResult.venues[0]?.lat || 13.0827;
      const lng = venuesResult.venues[0]?.lng || 80.2707;
      const wRes = await apiGetWeather(lat, lng, event.details.date, targetCity);
      setWeatherResponse(wRes);
    } catch (err: any) {
      console.warn('Location data fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleShortlist = (venue: any) => {
    const updated = venues.map((v) =>
      v.id === venue.id ? { ...v, shortlisted: !v.shortlisted } : v
    );
    setVenues(updated);
    upsertEvent({ ...event, venues: updated as any });
    showToast({
      type: 'info',
      title: venue.shortlisted ? 'Removed from Shortlist' : 'Added to Shortlist',
      description: venue.name,
    });
  };

  const filteredVenues = venues.filter((v) => {
    if (filterType === 'all') return true;
    return v.indoorOutdoor === filterType;
  });

  const weatherData = weatherResponse?.weather;
  const isSeasonalAverage = weatherResponse?.isSeasonalAverage;
  const seasonalNote = weatherResponse?.note;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1E1B24]">
            Venues & Climatic Intelligence
          </h2>
          <p className="text-xs text-[#5C5765]">
            Grounded local venue recommendations and verified climate analysis for {cityInput}.
          </p>
        </div>

        {/* City Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <MapPin className="w-4 h-4 text-[#FF7A6B] absolute left-3 top-2.5" />
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Enter host city..."
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-[#4B2A7B]/20 rounded-xl text-[#1E1B24] focus:outline-none focus:ring-2 focus:ring-[#4B2A7B] w-40 sm:w-48"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => fetchLocationData(cityInput)}
            isLoading={isLoading}
          >
            Update
          </Button>
        </div>
      </div>

      {/* AI Grounding / Fallback Status Banner */}
      <AiStatusBanner
        source={venuesSource}
        fallbackReason={venuesSource === 'fallback' ? 'API_KEY_MISSING' : undefined}
        onRetry={() => fetchLocationData(cityInput)}
        isRetrying={isLoading}
        compact
      />

      {/* Weather Forecast / Seasonal Average Widget */}
      {weatherData && (
        <Card variant="highlight" padding="lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white text-[#4B2A7B] flex items-center justify-center shadow-sm shrink-0 mt-1">
                <CloudSun className="w-6 h-6 text-[#FF7A6B]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center flex-wrap gap-2">
                  <Badge variant={isSeasonalAverage ? 'coral' : 'purple'} size="sm">
                    {isSeasonalAverage ? 'Seasonal Historical Average' : 'Open-Meteo Verified Forecast'}
                  </Badge>
                  <span className="text-xs text-[#5C5765]">{weatherData.date}</span>
                </div>
                <h3 className="text-xl font-bold font-serif text-[#1E1B24]">
                  {weatherData.condition}
                </h3>
                <p className="text-xs text-[#5C5765]">
                  High: <strong>{weatherData.maxTempC}°C</strong> · Low:{' '}
                  <strong>{weatherData.minTempC}°C</strong> · Precipitation Chance:{' '}
                  <strong>{weatherData.precipitationProbability}%</strong>
                </p>
                {seasonalNote && (
                  <p className="text-[11px] text-amber-800 font-medium pt-0.5">
                    ℹ️ {seasonalNote}
                  </p>
                )}
              </div>
            </div>

            {/* Weather Contingency Banner */}
            <div className="bg-white/80 p-4 rounded-xl border border-[#4B2A7B]/15 max-w-md space-y-1 text-xs">
              <span className="font-bold text-[#4B2A7B] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#FF7A6B]" />
                Event Day Contingency Recommendation:
              </span>
              <p className="text-[#5C5765] leading-relaxed">{weatherData.contingency}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Interactive Venue Filter & Comparison CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#4B2A7B]/10 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#5C5765] mr-2">Environment:</span>
          {['all', 'indoor', 'outdoor', 'hybrid'].map((ft) => (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                filterType === ft ? 'bg-[#4B2A7B] text-white' : 'text-[#5C5765] hover:bg-[#F3EEF8]'
              }`}
            >
              {ft}
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCompareModalOpen(true)}
          leftIcon={<SlidersHorizontal className="w-4 h-4 text-[#4B2A7B]" />}
        >
          Compare Venues ({venues.filter((v) => v.shortlisted).length || venues.length})
        </Button>
      </div>

      {/* Venues Showcase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredVenues.map((venue) => {
          return (
            <Card
              key={venue.id}
              variant="default"
              padding="lg"
              className="space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3 border-b border-[#4B2A7B]/10 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#FF7A6B] uppercase">{venue.type}</span>
                      <span className="text-xs text-[#5C5765]">· {venue.priceLevel}</span>
                    </div>
                    <h3 className="text-lg font-bold font-serif text-[#1E1B24]">{venue.name}</h3>
                    <p className="text-xs text-[#5C5765] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#4B2A7B]" /> {venue.address}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 font-mono font-bold text-xs bg-[#F3EEF8] px-2 py-1 rounded-md text-[#4B2A7B]">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{venue.rating || 4.8}</span>
                  </div>
                </div>

                {/* Fit Explanation by AI */}
                <div className="p-3 bg-[#F3EEF8]/40 rounded-xl text-xs text-[#1E1B24] space-y-1">
                  <span className="font-semibold text-[#4B2A7B] block">Fit for Your Event:</span>
                  <p className="text-[#5C5765] leading-relaxed">{venue.fitExplanation}</p>
                </div>

                {/* Grounding Source Citations if Available */}
                {venue.groundingSources && venue.groundingSources.length > 0 && (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/50 rounded-xl text-xs space-y-1">
                    <span className="font-semibold text-emerald-900 flex items-center gap-1 text-[11px]">
                      <Sparkles className="w-3 h-3 text-emerald-600" /> Verified via Google Search Grounding:
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {venue.groundingSources.map((source: any, sIdx: number) => (
                        <a
                          key={sIdx}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-800 hover:text-emerald-950 underline font-medium"
                        >
                          {source.title || 'Citation'} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features & Checklist */}
                {venue.features && venue.features.length > 0 && (
                  <div className="space-y-1.5 pt-1 text-xs">
                    <span className="font-bold text-[#1E1B24] block">Key Highlights:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {venue.features.map((f: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-[#F3EEF8] text-[11px] text-[#4B2A7B]">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-[#4B2A7B]/10 flex items-center justify-between">
                <Button
                  variant={venue.shortlisted ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleToggleShortlist(venue)}
                  leftIcon={<Bookmark className="w-3.5 h-3.5" />}
                >
                  {venue.shortlisted ? 'Shortlisted' : 'Shortlist Venue'}
                </Button>

                <span className="text-[11px] text-[#5C5765]">
                  Capacity: ~{venue.capacity || 400} guests
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Compare Venues Modal */}
      <Modal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        title="Side-by-Side Venue Evaluation"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#5C5765]">
            Comparison matrix for venues in {cityInput} across capacity, environment, and pricing.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F3EEF8] text-[#5C5765] uppercase text-[10px] border-b border-[#4B2A7B]/10">
                <tr>
                  <th className="p-3">Venue Name</th>
                  <th className="p-3">Capacity</th>
                  <th className="p-3">Setting</th>
                  <th className="p-3">Price Level</th>
                  <th className="p-3">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#4B2A7B]/10">
                {venues.map((v) => (
                  <tr key={v.id} className="hover:bg-[#F3EEF8]/30">
                    <td className="p-3 font-semibold text-[#1E1B24]">{v.name}</td>
                    <td className="p-3 text-[#5C5765] font-mono">{v.capacity || 400}</td>
                    <td className="p-3 capitalize">{v.indoorOutdoor}</td>
                    <td className="p-3 font-bold text-[#4B2A7B]">{v.priceLevel}</td>
                    <td className="p-3 font-mono font-bold text-amber-600">★ {v.rating || 4.8}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
};
