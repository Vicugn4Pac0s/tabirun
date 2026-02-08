export type Pace = `${number}:${number}`;

/**
 * 距離(km) と キロペース(mm:ss) から 総時間(hh:mm:ss) を計算
 */
export const calcTimeFromDistanceAndPace = (
  distanceKm: number,
  pace: Pace
): string => {
  const [paceMin, paceSec] = pace.split(":").map(Number);
  console.log(  {paceMin, paceSec});
  if(paceMin === undefined || paceSec === undefined) return "0:00";
  const paceInSeconds = paceMin * 60 + paceSec;
  const totalSeconds = Math.round(distanceKm * paceInSeconds);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = hours > 0 ? `${hours}:` : "00:";
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${hh}${mm}:${ss}`;
}

/**
 * メートル(m)をキロメートル(km)に変換
 */
export const metersToKilometers = (meters: number, fractionDigits = 2): number => {
  if (!Number.isFinite(meters)) return 0;
  const km = meters / 1000;
  return Number(km.toFixed(fractionDigits));
};

/**
 * 体重(kg)・距離(km)・ペース(mm:ss)から消費カロリー(kcal)を計算
 */
export const calcCaloriesFromRun = (
  weightKg: number,
  distanceKm: number,
  pace: Pace,
  fractionDigits = 0,
): number => {
  if (weightKg <= 0 || distanceKm <= 0) return 0;

  const [min, sec] = pace.split(":").map(Number);
  if (!Number.isFinite(min) || !Number.isFinite(sec)) return 0;
  if( min === undefined ||  sec === undefined) return 0;
  
  const paceSecPerKm = min * 60 + sec;

  // 基準ペース 6:00/km = 360秒
  const basePace = 360;

  // ペース補正（影響は緩やかに）
  const paceFactor = Math.min(
    1.1,
    Math.max(0.9, basePace / paceSecPerKm),
  );

  const calories = weightKg * distanceKm * paceFactor;

  return Number(calories.toFixed(fractionDigits));
};