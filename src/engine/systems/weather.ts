import { WeatherState, WeatherType, GameEvent } from '../../types'
import { SeededRandom } from '../utils/random'

const WEATHER_NAMES: Record<WeatherType, string> = {
  clear: '晴',
  rain: '雨',
  fog: '雾',
  wind: '风',
}

const WEATHER_DESCRIPTIONS: Record<WeatherType, string> = {
  clear: '天气晴朗，作战条件良好',
  rain: '大雨倾盆，弓箭威力降低，移速减缓',
  fog: '大雾弥漫，视野大幅缩减',
  wind: '狂风大作，远程攻击偏移，火攻增强',
}

export function createInitialWeather(rng: SeededRandom): WeatherState {
  return {
    type: 'clear',
    intensity: 0,
    windAngle: rng.float(0, Math.PI * 2),
    ticksRemaining: rng.int(200, 500),
  }
}

export function weatherSystem(
  weather: WeatherState,
  tick: number,
  rng: SeededRandom,
): { weather: WeatherState; events: GameEvent[] } {
  const events: GameEvent[] = []

  weather.ticksRemaining--
  if (weather.ticksRemaining <= 0) {
    // Transition to new weather
    const types: WeatherType[] = ['clear', 'clear', 'rain', 'fog', 'wind']
    let newType = rng.pick(types)
    // Avoid same weather twice in a row
    if (newType === weather.type && weather.type !== 'clear') newType = 'clear'

    const newWeather: WeatherState = {
      type: newType,
      intensity: newType === 'clear' ? 0 : rng.float(0.4, 0.9),
      windAngle: rng.float(0, Math.PI * 2),
      ticksRemaining: newType === 'clear' ? rng.int(300, 600) : rng.int(150, 400),
    }

    events.push({
      tick,
      type: 'weather_change',
      message: `天气变化：${WEATHER_NAMES[newType]} — ${WEATHER_DESCRIPTIONS[newType]}`,
    })

    return { weather: newWeather, events }
  }

  return { weather, events }
}

// Weather modifiers applied to combat
export function getWeatherModifiers(weather: WeatherState) {
  const i = weather.intensity
  switch (weather.type) {
    case 'rain':
      return {
        rangedAtkMult: 1 - 0.3 * i,   // rain weakens ranged
        speedMult: 1 - 0.15 * i,       // slows movement
        visionMult: 1 - 0.1 * i,       // slight vision reduction
        moraleDrain: 0.05 * i,          // rain drains morale slowly
        fireBonus: -0.5 * i,            // fire skills weakened
      }
    case 'fog':
      return {
        rangedAtkMult: 1 - 0.2 * i,
        speedMult: 1,
        visionMult: 1 - 0.5 * i,       // massive vision cut
        moraleDrain: 0.02 * i,
        fireBonus: 0,
      }
    case 'wind':
      return {
        rangedAtkMult: 1 - 0.15 * i,   // wind deflects arrows
        speedMult: 1,
        visionMult: 1,
        moraleDrain: 0.01 * i,
        fireBonus: 0.4 * i,            // wind fans flames
      }
    default: // clear
      return {
        rangedAtkMult: 1,
        speedMult: 1,
        visionMult: 1,
        moraleDrain: 0,
        fireBonus: 0,
      }
  }
}
