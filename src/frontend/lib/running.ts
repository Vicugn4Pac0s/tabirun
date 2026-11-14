import type { Pace } from "../types/pace";

/**
 * 距離とキロペースから秒単位に丸めた総時間をhh:mm:ssで返す。
 * ペースの分・秒のいずれかが欠ける場合は"0:00"を返す。
 */
export const calcTimeFromDistanceAndPace = (
  distanceKm: number,
  pace: Pace,
): string => {
  const [paceMin, paceSec] = pace.split(":").map(Number);
  if (paceMin === undefined || paceSec === undefined) return "0:00";
  const paceInSeconds = paceMin * 60 + paceSec;
  const totalSeconds = Math.round(distanceKm * paceInSeconds);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hh = hours > 0 ? `${hours}:` : "00:";
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");

  return `${hh}${mm}:${ss}`;
};

/**
 * メートルをキロメートルに換算し、指定桁数で丸める。非有限値は0を返す。
 */
export const metersToKilometers = (
  meters: number,
  fractionDigits = 2,
): number => {
  if (!Number.isFinite(meters)) return 0;
  const km = meters / 1000;
  return Number(km.toFixed(fractionDigits));
};

/**
 * 体重・距離から、ペース補正を基準の0.9〜1.1倍に抑えた消費カロリーを見積もる。
 * 体重・距離が0以下、またはペースの分・秒を数値として扱えない場合は0を返す。
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
  if (min === undefined || sec === undefined) return 0;

  const paceSecPerKm = min * 60 + sec;

  // 基準ペース 6:00/km = 360秒
  const basePace = 360;

  // ペース補正（影響は緩やかに）
  const paceFactor = Math.min(1.1, Math.max(0.9, basePace / paceSecPerKm));

  const calories = weightKg * distanceKm * paceFactor;

  return Number(calories.toFixed(fractionDigits));
};
