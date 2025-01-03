
// src/components/stemextractor/constants.ts
export const MODEL_OPTIONS = [
    {
        value: "htdemucs",
        label: "HTDemucs",
        description: "High-quality separation with balanced performance",
    },
    {
        value: "htdemucs_6s",
        label: "HTDemucs 6s",
        description: "Faster processing with good quality",
    },
    {
        value: "mdx_extra",
        label: "MDX Extra",
        description: "Enhanced separation quality for complex tracks",
    },
    {
        value: "mdx_extra_q",
        label: "MDX Extra Q",
        description: "Maximum quality with longer processing time",
    },
] as const;

export const SPLIT_OPTIONS = [
    {
        value: "2stems",
        label: "2 Stems",
        description: "Vocals + Accompaniment",
    },
    {
        value: "4stems",
        label: "4 Stems",
        description: "Vocals + Drums + Bass + Other",
    },
    {
        value: "5stems",
        label: "5 Stems",
        description: "Vocals + Drums + Bass + Piano + Other",
    },
] as const;

export const FEATURES = [
    {
        icon: "Music",
        titleKey: "stemExtractor.features.quality.title",
        descriptionKey: "stemExtractor.features.quality.description",
    },
    {
        icon: "Waveform",
        titleKey: "stemExtractor.features.ai.title",
        descriptionKey: "stemExtractor.features.ai.description",
    },
    {
        icon: "FileAudio",
        titleKey: "stemExtractor.features.format.title",
        descriptionKey: "stemExtractor.features.format.description",
    },
] as const;