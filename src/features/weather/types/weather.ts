export type City = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
};

export type TemperatureMode = "tmax" | "tmin";

export type ForecastModel =
  | "best_match"
  | "ecmwf_ifs025"
  | "gfs_seamless"
  | "icon_seamless"
  | "meteofrance_seamless";

export type DailyTemperature = {
  date: string;
  day: number;
  year: number;
  tmax: number | null;
  tmin: number | null;
  isForecast?: boolean;
};

export type WeatherYearDataset = {
  id: string;
  label: string;
  offsetYears: number;
  values: DailyTemperature[];
};

export type ClimateNormal = {
  day: number;
  value: number | null;
};

export type HeatwaveKind = "vague_de_chaleur" | "canicule";

export type HeatwavePeriod = {
  datasetId: string;
  datasetLabel: string;
  kind: HeatwaveKind;
  start: string;
  end: string;
  startDay: number;
  endDay: number;
  duration: number;
  averageMax: number;
  includesForecast: boolean;
  forecastStartDay: number | null;
};

export type ColdWaveKind = "vague_de_froid" | "grand_froid";

export type ExtremeKind = HeatwaveKind | ColdWaveKind;

export type ColdWavePeriod = {
  datasetId: string;
  datasetLabel: string;
  kind: ColdWaveKind;
  start: string;
  end: string;
  startDay: number;
  endDay: number;
  duration: number;
  averageMin: number;
  includesForecast: boolean;
  forecastStartDay: number | null;
};
