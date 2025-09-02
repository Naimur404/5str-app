import { fetchWeatherApi } from 'openmeteo';

export interface WeatherData {
  temperature: number;
  condition: 'sunny' | 'clear' | 'partly-cloudy' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  description: string;
  humidity: number;
  windSpeed: number;
  location: string;
  icon: string;
}

export class WeatherService {
  private cache: Map<string, { data: WeatherData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  private getCacheKey(lat: number, lng: number): string {
    return `${lat.toFixed(3)}_${lng.toFixed(3)}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  private getWeatherIcon(condition: WeatherData['condition'], isDay: boolean): string {
    switch (condition) {
      case 'sunny':
        return '☀️';
      case 'clear':
        return isDay ? '☀️' : '🌙';
      case 'partly-cloudy':
        return isDay ? '⛅' : '☁️';
      case 'cloudy':
        return '☁️';
      case 'rainy':
        return '🌧️';
      case 'stormy':
        return '⛈️';
      case 'snowy':
        return '❄️';
      default:
        return '⛅';
    }
  }

  private mapWeatherCode(weatherCode: number, isDay: boolean): { condition: WeatherData['condition']; description: string } {
    // Open-Meteo weather code mapping
    switch (weatherCode) {
      case 0:
        return { condition: isDay ? 'sunny' : 'clear', description: isDay ? 'Clear sky' : 'Clear night' };
      case 1:
        return { condition: isDay ? 'sunny' : 'clear', description: isDay ? 'Mainly clear' : 'Mainly clear night' };
      case 2:
        return { condition: 'partly-cloudy', description: 'Partly cloudy' };
      case 3:
        return { condition: 'cloudy', description: 'Overcast' };
      case 45:
      case 48:
        return { condition: 'cloudy', description: 'Foggy' };
      case 51:
      case 53:
      case 55:
        return { condition: 'rainy', description: 'Light drizzle' };
      case 56:
      case 57:
        return { condition: 'rainy', description: 'Freezing drizzle' };
      case 61:
        return { condition: 'rainy', description: 'Light rain' };
      case 63:
        return { condition: 'rainy', description: 'Moderate rain' };
      case 65:
        return { condition: 'rainy', description: 'Heavy rain' };
      case 66:
      case 67:
        return { condition: 'rainy', description: 'Freezing rain' };
      case 71:
        return { condition: 'snowy', description: 'Light snow' };
      case 73:
        return { condition: 'snowy', description: 'Moderate snow' };
      case 75:
        return { condition: 'snowy', description: 'Heavy snow' };
      case 77:
        return { condition: 'snowy', description: 'Snow grains' };
      case 80:
      case 81:
      case 82:
        return { condition: 'rainy', description: 'Rain showers' };
      case 85:
      case 86:
        return { condition: 'snowy', description: 'Snow showers' };
      case 95:
        return { condition: 'stormy', description: 'Thunderstorm' };
      case 96:
      case 99:
        return { condition: 'stormy', description: 'Thunderstorm with hail' };
      default:
        return { condition: 'partly-cloudy', description: 'Unknown weather' };
    }
  }

  async getCurrentWeather(lat: number, lng: number): Promise<WeatherData> {
    try {
      const cacheKey = this.getCacheKey(lat, lng);
      const cached = this.cache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.data;
      }

      // Fetch weather data from Open-Meteo API
      const params = {
        latitude: lat,
        longitude: lng,
        current: ['temperature_2m', 'relative_humidity_2m', 'weather_code', 'wind_speed_10m', 'is_day'],
        timezone: 'auto'
      };

      const url = "https://api.open-meteo.com/v1/forecast";
      const responses = await fetchWeatherApi(url, params);
      
      if (!responses || responses.length === 0) {
        throw new Error('No weather data received');
      }

      const response = responses[0];
      const current = response.current()!;

      // Extract current weather data
      const temperature = Math.round(current.variables(0)!.value());
      const humidity = Math.round(current.variables(1)!.value());
      const weatherCode = current.variables(2)!.value();
      const windSpeed = Math.round(current.variables(3)!.value() * 3.6); // Convert m/s to km/h
      const isDay = current.variables(4)!.value() === 1;

      // Map weather code to our condition system
      const { condition, description } = this.mapWeatherCode(weatherCode, isDay);

      const weatherData: WeatherData = {
        temperature,
        condition,
        description,
        humidity,
        windSpeed,
        location: `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
        icon: this.getWeatherIcon(condition, isDay)
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });

      return weatherData;
    } catch (error) {
      console.error('Error fetching weather from Open-Meteo:', error);
      
      // Return fallback data on error
      return this.getFallbackWeather(lat, lng);
    }
  }

  private getFallbackWeather(lat: number, lng: number): WeatherData {
    const now = new Date();
    const hour = now.getHours();
    const isDay = hour >= 6 && hour < 19;
    
    return {
      temperature: 28, // Fallback temperature
      condition: isDay ? 'sunny' : 'clear',
      description: isDay ? 'Clear sky' : 'Clear night',
      humidity: 65,
      windSpeed: 10,
      location: `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      icon: this.getWeatherIcon(isDay ? 'sunny' : 'clear', isDay)
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Force refresh weather data (useful for app startup)
  async forceRefresh(lat: number, lng: number): Promise<WeatherData> {
    const cacheKey = this.getCacheKey(lat, lng);
    this.cache.delete(cacheKey); // Clear cache for this location
    return this.getCurrentWeather(lat, lng);
  }
}

// Export singleton instance
export const weatherService = new WeatherService();
