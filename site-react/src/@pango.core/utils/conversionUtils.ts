const G_TO_KG = 0.001;
const G_TO_P = 0.00220462;

const CCM_TO_CI = 0.0610237;
const CCM_TO_L = 0.001;

const CM_TO_IN = 0.393701;

export enum WeightUnit {
  KG = "kilograms",
  P = "pounds"
}

export enum VolumeUnit {
  CI = "cubic_inches",
  L = "liters"
}

export enum LengthUnit {
  IN = 'inches',
}

export const convertFromGrams = (value: number, toUnit: WeightUnit): number => {
  const weightConversionMap: { [key in WeightUnit]: number } = {
    [WeightUnit.KG]: G_TO_KG,
    [WeightUnit.P]: G_TO_P,
  };

  return value * weightConversionMap[toUnit];
};

export const convertFromCCMs = (value: number, toUnit: VolumeUnit): number => {
  const volumeConversionMap: { [key in VolumeUnit]: number } = {
    [VolumeUnit.CI]: CCM_TO_CI,
    [VolumeUnit.L]: CCM_TO_L,
  };

  return value * volumeConversionMap[toUnit];
};

export const convertFromCMs = (value: number, toUnit: LengthUnit): number => {
  const lengthConversionMap: { [key in LengthUnit]: number } = {
    [LengthUnit.IN]: CM_TO_IN,
  };

  return value * lengthConversionMap[toUnit];
};
