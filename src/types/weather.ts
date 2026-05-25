export type City = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
};

export type TemperatureMode = "tmax" | "tmin";

export type DailyTemperature = {
  date: string;
  day: number;
  year: number;
  tmax: number | null;
  tmin: number | null;
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

export type HeatwavePeriod = {
  datasetId: string;
  datasetLabel: string;
  start: string;
  end: string;
  startDay: number;
  endDay: number;
  duration: number;
  averageMax: number;
};
