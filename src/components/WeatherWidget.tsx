import React, { useEffect, useState } from 'react';
import { Cloud, CloudRain, Sun, Wind, CloudLightning, Thermometer } from 'lucide-react';

interface WeatherData {
  temperature: number;
  windspeed: number;
  weathercode: number;
  condition: string;
  isDay: boolean;
}

export const WeatherWidget: React.FC<{ className?: string; compact?: boolean }> = ({ className = '', compact = false }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchWeather = async () => {
      try {
        // Coordinates for El Sobrante, CA (37.9771° N, -122.2989° W)
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=37.9771&longitude=-122.2989&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph'
        );
        if (!res.ok) throw new Error('Failed to fetch weather');
        const data = await res.json();
        if (data.current_weather && isMounted) {
          const code = data.current_weather.weathercode;
          let condition = 'Clear Sky';
          if (code >= 1 && code <= 3) condition = 'Partly Cloudy';
          else if (code >= 45 && code <= 48) condition = 'Foggy';
          else if (code >= 51 && code <= 67) condition = 'Rainy';
          else if (code >= 80 && code <= 82) condition = 'Rain Showers';
          else if (code >= 95) condition = 'Thunderstorm';

          setWeather({
            temperature: Math.round(data.current_weather.temperature),
            windspeed: Math.round(data.current_weather.windspeed),
            weathercode: code,
            condition,
            isDay: data.current_weather.is_day === 1,
          });
          setError(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWeather();
    // Refresh weather every 10 minutes
    const interval = setInterval(fetchWeather, 600000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const getWeatherIcon = (code: number, isDay: boolean) => {
    if (code === 0) return <Sun className="w-4 h-4 text-[#B7CEEC] animate-pulse" />;
    if (code >= 1 && code <= 3) return <Cloud className="w-4 h-4 text-[#B7CEEC]" />;
    if (code >= 51 && code <= 82) return <CloudRain className="w-4 h-4 text-blue-400" />;
    if (code >= 95) return <CloudLightning className="w-4 h-4 text-[#B7CEEC]" />;
    return isDay ? <Sun className="w-4 h-4 text-[#B7CEEC]" /> : <Cloud className="w-4 h-4 text-[#B7CEEC]" />;
  };

  if (loading) {
    return (
      <div className={`p-3 rounded-2xl bg-[#080d14] border border-[#B7CEEC]/20 text-[#B7CEEC] text-xs flex items-center justify-between ${className}`}>
        <span className="animate-pulse">Loading El Sobrante weather...</span>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className={`p-3 rounded-2xl bg-[#080d14] border border-[#B7CEEC]/20 text-[#B7CEEC] text-xs flex items-center gap-2 ${className}`}>
        <Thermometer className="w-4 h-4 text-[#4C787E]" />
        <div>
          <p className="font-extrabold text-white">72°F • El Sobrante, CA</p>
          <p className="text-[10px] text-[#B7CEEC]/70">Ideal Pitch Conditions</p>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#080d14] border border-[#B7CEEC]/30 text-xs font-bold text-white shadow-md ${className}`}>
        {getWeatherIcon(weather.weathercode, weather.isDay)}
        <span>{weather.temperature}°F</span>
        <span className="text-[10px] text-[#B7CEEC]/80 font-normal">El Sobrante, CA</span>
      </div>
    );
  }

  return (
    <div className={`p-3.5 rounded-2xl bg-[#080d14] border border-[#B7CEEC]/25 text-left text-xs ${className}`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-[#B7CEEC]/80 f1-sub-header text-[10px]">
          {getWeatherIcon(weather.weathercode, weather.isDay)}
          <span className="uppercase tracking-wider">El Sobrante Weather</span>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-[#4C787E]/20 text-[#B7CEEC] border border-[#4C787E]/40 font-semibold">
          LIVE
        </span>
      </div>

      <div className="flex items-baseline justify-between mt-1">
        <div>
          <span className="text-xl font-black text-white font-mono">{weather.temperature}°F</span>
          <span className="text-xs text-[#B7CEEC]/90 font-medium ml-2">{weather.condition}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#B7CEEC]/70">
          <Wind className="w-3 h-3 text-[#4C787E]" />
          <span>{weather.windspeed} mph</span>
        </div>
      </div>
    </div>
  );
};
