// src/components/converter/addconversion.tsx
import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, FileVideo, Folder, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// import {Tooltip} from "../ui/tooltip";
import {
  FORMAT_OPTIONS,
  VIDEO_CODECS,
  AUDIO_CODECS,
  QUALITY_PRESETS,
} from "../../constants/converter";
import { ConversionOptions} from "./types";
import { 
  openFileDialog, 
  getDocumentDir, 
  invokeCommand, 
  getMediaInfo,
} from '../../lib/webview';

interface AddConversionProps {
  isOpen: boolean;
  onClose: () => void;
  onAddConversion: (
    inputPath: string,
    format: string,
    options: ConversionOptions
  ) => Promise<void>;
}

interface FileInfo {
  width?: number;
  height?: number;
  duration?: number;
  bitrate?: string;
  codec?: string;
  size?: number;
}

const modalVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const contentVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function AddConversion({ isOpen, onClose, onAddConversion }: AddConversionProps) {
  const { t } = useTranslation();
  const [inputPath, setInputPath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [format, setFormat] = useState("");
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoCodec, setVideoCodec] = useState<string | undefined>();
  const [videoEngine, setVideoEngine] = useState<string | undefined>();
  const [audioCodec, setAudioCodec] = useState<string | undefined>();
  const [audioEngine, setAudioEngine] = useState<string | undefined>();
  const [quality, setQuality] = useState("high");
  const [customVideoBitrate, setCustomVideoBitrate] = useState<string | undefined>();
  const [customAudioBitrate, setCustomAudioBitrate] = useState<string | undefined>();
  const [resolution, setResolution] = useState<string | undefined>();
  const [framerate, setFramerate] = useState<string | undefined>();
  const [sampleRate, setSampleRate] = useState<string | undefined>("48000");
  const [channels, setChannels] = useState<string | undefined>("2");

  const resetForm = () => {
    setInputPath("");
    setOutputPath("");
    setFormat("");
    setFileInfo(null);
    setError("");
    setVideoCodec(undefined);
    setVideoEngine(undefined);
    setAudioCodec(undefined);
    setAudioEngine(undefined);
    setQuality("high");
    setCustomVideoBitrate(undefined);
    setCustomAudioBitrate(undefined);
    setResolution(undefined);
    setFramerate(undefined);
    setSampleRate("48000");
    setChannels("2");
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleFileSelect = useCallback(async () => {
    try {
      const result = await openFileDialog({
        title: t("converter.modal.selectFile"),
        multiple: false,
        filters: [
          {
            name: t("converter.modal.mediaFiles"),
            extensions: FORMAT_OPTIONS.reduce((acc: string[], format) => 
              [...acc, ...format.extensions], [])
          },
        ],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];
        setInputPath(selectedPath);
        setError("");

        const mediaInfo = await getMediaInfo(selectedPath);
        
        const fileInfo: FileInfo = {
          width: mediaInfo.streams?.video?.[0]?.width,
          height: mediaInfo.streams?.video?.[0]?.height,
          duration: mediaInfo.format.duration,
          bitrate: mediaInfo.format.bitRate?.toString(),
          codec: mediaInfo.streams?.video?.[0]?.codecName,
          size: mediaInfo.format.size,
        };

        setFileInfo(fileInfo);

        if (fileInfo.width && fileInfo.height) {
          setResolution(`${fileInfo.width}x${fileInfo.height}`);
        }
      }
    } catch (err) {
      setError(t("converter.errors.fileSelection"));
    }
  }, [t]);

  const handleOutputPathSelect = useCallback(async () => {
    try {
      const defaultPath = await getDocumentDir();
      const result = await openFileDialog({
        title: t("converter.modal.selectDestination"),
        defaultPath,
        directory: true,
      });

      if (!result.canceled && result.filePaths.length > 0) {
        setOutputPath(result.filePaths[0]);
        setError("");
      }
    } catch (err) {
      setError(t("converter.errors.destinationSelection"));
    }
  }, [t]);

  const handleFormatChange = (formatValue: string) => {
    const selectedFormat = FORMAT_OPTIONS.find((f) => f.value === formatValue);
    setFormat(formatValue);

    if (selectedFormat) {
      if (selectedFormat.type === "video") {
        setVideoCodec(VIDEO_CODECS[0].id);
        setVideoEngine(VIDEO_CODECS[0].engines[0].id);
      } else {
        setVideoCodec(undefined);
        setVideoEngine(undefined);
      }
      setAudioCodec(AUDIO_CODECS[0].id);
      setAudioEngine(AUDIO_CODECS[0].engines[0].id);
    }
  };

  const handleQualityChange = (qualityValue: string) => {
    setQuality(qualityValue);
    const preset = QUALITY_PRESETS[qualityValue as keyof typeof QUALITY_PRESETS];
    if (preset) {
      setCustomVideoBitrate(preset.videoBitrate);
      setCustomAudioBitrate(preset.audioBitrate);
      setResolution(preset.resolution);
      setSampleRate(preset.sampleRate);
    }
  };

  const validateInputs = () => {
    if (!inputPath) {
      setError(t("converter.errors.noFileSelected"));
      return false;
    }
    if (!format) {
      setError(t("converter.errors.noFormatSelected"));
      return false;
    }
    if (!outputPath) {
      setError(t("converter.errors.noDestination"));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateInputs()) return;

    try {
      setIsProcessing(true);

      const options: ConversionOptions = {
        quality,
        outputPath,
        videoCodec,
        videoEngine,
        audioCodec,
        audioEngine,
        videoBitrate: customVideoBitrate,
        audioBitrate: customAudioBitrate,
        resolution,
        framerate,
        sampleRate,
        channels,
      };

      await invokeCommand('start_conversion', {
        inputPath,
        format,
        options,
      });

      await onAddConversion(inputPath, format, options);
      onClose();
    } catch (err) {
      setError(t("converter.errors.conversionFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={modalVariants}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        variants={contentVariants}
        transition={{ duration: 0.2 }}
        className="bg-[#1a1a1a] rounded-lg w-[1024px] max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#2e2e2e] flex items-center justify-between">
          <h2 className="text-gray-200 text-sm font-medium">
            {t("converter.modal.title")}
          </h2>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <motion.form
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* File Selection Section */}
            <motion.div
              variants={sectionVariants}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-6"
            >
              {/* Input File */}
              <div className="space-y-2">
                <label className="text-sm text-gray-300 font-medium">
                  {t("converter.modal.input")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputPath}
                    readOnly
                    className="flex-1 bg-[#2a2a2a] text-gray-300 text-sm rounded-md px-3 py-2
                            border border-[#3a3a3a] focus:outline-none focus:border-green-500"
                    placeholder={t("converter.modal.selectFile")}
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleFileSelect}
                    className="bg-[#2a2a2a] text-gray-300 px-3 py-2 rounded-md
                           hover:bg-[#3a3a3a] transition-colors flex items-center gap-2"
                  >
                    <FileVideo className="w-4 h-4" />
                    {t("converter.modal.browse")}
                  </motion.button>
                </div>
              </div>

              {/* Output Location */}
              <div className="space-y-2">
                <label className="text-sm text-gray-300 font-medium">
                  {t("converter.modal.output")}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={outputPath}
                    readOnly
                    className="flex-1 bg-[#2a2a2a] text-gray-300 text-sm rounded-md px-3 py-2
                            border border-[#3a3a3a] focus:outline-none focus:border-green-500"
                    placeholder={t("converter.modal.selectDestination")}
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleOutputPathSelect}
                    className="bg-[#2a2a2a] text-gray-300 px-3 py-2 rounded-md
                           hover:bg-[#3a3a3a] transition-colors flex items-center gap-2"
                  >
                    <Folder className="w-4 h-4" />
                    {t("converter.modal.browse")}
                  </motion.button>
                </div>
              </div>
            </motion.div>
            {/* File Info */}
            <AnimatePresence>
              {fileInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-[#2a2a2a] rounded-md p-4 text-sm text-gray-300"
                >
                  <div className="grid grid-cols-4 gap-4">
                    {fileInfo.width && fileInfo.height && (
                      <div>
                        {t("converter.info.resolution")}: {fileInfo.width}x
                        {fileInfo.height}
                      </div>
                    )}
                    {fileInfo.duration && (
                      <div>
                        {t("converter.info.duration")}:{" "}
                        {Math.round(fileInfo.duration)}s
                      </div>
                    )}
                    {fileInfo.bitrate && (
                      <div>
                        {t("converter.info.bitrate")}: {fileInfo.bitrate}
                      </div>
                    )}
                    {fileInfo.codec && (
                      <div>
                        {t("converter.info.codec")}: {fileInfo.codec}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Conversion Settings */}
            <motion.div
              variants={sectionVariants}
              transition={{ delay: 0.2 }}
              className="bg-[#2a2a2a] rounded-lg p-4 space-y-4"
            >
              {/* Basic Settings */}
              <div className="grid grid-cols-3 gap-4">
                {/* Format Selection */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-300 font-medium">
                    {t("converter.modal.format")}
                  </label>
                  <select
                    value={format}
                    onChange={(e) => handleFormatChange(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-gray-300 text-sm rounded-md px-3 py-2
                            border border-[#3a3a3a] focus:outline-none focus:border-green-500"
                  >
                    <option value="">{t("converter.modal.selectFormat")}</option>
                    {FORMAT_OPTIONS.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.label} ({format.description})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quality Preset */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-300 font-medium">
                    {t("converter.modal.qualityTitle")}
                  </label>
                  <select
                    value={quality}
                    onChange={(e) => handleQualityChange(e.target.value)}
                    className="w-full bg-[#1a1a1a] text-gray-300 text-sm rounded-md px-3 py-2
                            border border-[#3a3a3a] focus:outline-none focus:border-green-500"
                  >
                    <option value="high">
                      {t("converter.modal.qualityHigh")}
                    </option>
                    <option value="medium">
                      {t("converter.modal.qualityMedium")}
                    </option>
                    <option value="low">
                      {t("converter.modal.qualityLow")}
                    </option>
                    <option value="custom">
                      {t("converter.modal.qualityCustom")}
                    </option>
                  </select>
                </div>
              </div>
              {/* Video Settings */}
              {format &&
                FORMAT_OPTIONS.find((f) => f.value === format)?.type ===
                "video" && (
                  <motion.div
                    variants={sectionVariants}
                    className="space-y-4"
                  >
                    <h3 className="text-sm font-medium text-gray-300">
                      {t("converter.modal.videoSettings")}
                    </h3>

                    {/* Video Codec & Engine */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-gray-300">
                          {t("converter.modal.videoCodec")}
                        </label>
                        <select
                          value={videoCodec}
                          onChange={(e) => {
                            setVideoCodec(e.target.value);
                            setVideoEngine(
                              VIDEO_CODECS.find((c) => c.id === e.target.value)
                                ?.engines[0].id || ""
                            );
                          }}
                          className="w-full bg-[#1a1a1a] text-gray-300 text-sm rounded-md px-3 py-2
                                  border border-[#3a3a3a] focus:outline-none focus:border-green-500"
                        >
                          {VIDEO_CODECS.map((codec) => (
                            <option key={codec.id} value={codec.id}>
                              {codec.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm text-gray-300">
                          {t("converter.modal.encodingEngine")}
                        </label>
                        <select
                          value={videoEngine}
                          onChange={(e) => setVideoEngine(e.target.value)}
                          className="w-full bg-[#1a1a1a] text-gray-300 text-sm rounded-md px-3 py-2
                                  border border-[#3a3a3a] focus:outline-none focus:border-green-500"
                        >
                          {VIDEO_CODECS.find((c) => c.id === videoCodec)
                            ?.engines.map((engine) => (
                              <option key={engine.id} value={engine.id}>
                                {engine.name} - {engine.description}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Video Quality Settings */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-300">
                            {t("converter.modal.resolution")}
                          </label>
                          {/* <Tooltip
                            content={t("converter.tooltips.resolutionInfo")}
                          >
                            <Info className="w-4 h-4 text-gray-400" />
                          </Tooltip> */}
                        </div>
                        <input
                          type="text"
                          value={resolution}
                          onChange={(e) => setResolution(e.target.value)}
                          placeholder="1920x1080"
                          className="w-full bg-[#1a1a1a] text-gray-300 text-sm rounded-md px-3 py-2
                                  border border-[#3a3a3a] focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm text-gray-300">
                            {t("converter.modal.videoBitrate")}
                          </label>
                          {/* <Tooltip
                            content={t("converter.tooltips.bitrateInfo")}
                          >
                            <Info className="w-4 h-4 text-gray-400" />
                          </Tooltip> */}
                        </div>
                        <input
                          type="text"
                          value={customVideoBitrate}
                          onChange={(e) => setCustomVideoBitrate(e.target.value)}
                          placeholder="5000k"
                          className="w-full bg-[#1a1a1a] text-gray-300 text-sm rounded-md px-3 py-2
                                  border border-[#3a3a3a] focus:outline-none focus:border-green-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-gray-300">
                          {t("converter.modal.framerate")}
                        </label>
                        <input
                          type="text"
                          value={framerate}
                          onChange={(e) => setFramerate(e.target.value)}
                          placeholder="60"
                          className="w-full bg-[#1a1a1a] text-gray-300 text-sm rounded-md px-3 py-2
                                  border border-[#3a3a3a] focus:outline-none focus:border-green-500"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              {/* Audio Settings */}
              <motion.div variants={sectionVariants} className="space-y-4">
                <h3 className="text-sm font-medium text-gray-300">
                  {t("converter.modal.audioSettings")}
                </h3>

                {/* Audio Codec & Engine */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">
                      {t("converter.modal.audioCodec")}
                    </label>
                    <select
                      value={audioCodec}
                      onChange={(e) => {
                        setAudioCodec(e.target.value);
                        setAudioEngine(
                          AUDIO_CODECS.find((c) => c.id === e.target.value)
                            ?.engines[0].id || ""
                        );
                      }}
                      className="w-full bg-[#1a1a1a] text-gray-300 text-sm rounded-md px-3 py-2
                              border border-[#3a3a3a] focus:outline-none focus:border-green-500"
                    >
                      {AUDIO_CODECS.map((codec) => (
                        <option key={codec.id} value={codec.id}>
                          {codec.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">
                      {t("converter.modal.audioEngine")}
                    </label>
                    <select
                      value={audioEngine}
                      onChange={(e) => setAudioEngine(e.target.value)}
                      className="w-full bg-[#1a1a1a] text-gray-300 text-sm rounded-md px-3 py-2
                              border border-[#3a3a3a] focus:outline-none focus:border-green-500"
                    >
                      {AUDIO_CODECS.find((c) => c.id === audioCodec)?.engines.map(
                        (engine) => (
                          <option key={engine.id} value={engine.id}>
                            {engine.name} - {engine.description}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* Audio Quality Settings */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">
                      {t("converter.modal.audioBitrate")}
                    </label>
                    <input
                      type="text"
                      value={customAudioBitrate}
                      onChange={(e) => setCustomAudioBitrate(e.target.value)}
                      placeholder="192k"
                      className="w-full bg-[#1a1a1a] text-gray-300 text-sm rounded-md px-3 py-2
                              border border-[#3a3a3a] focus:outline-none focus:border-green-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">
                      {t("converter.modal.sampleRate")}
                    </label>
                    <select
                      value={sampleRate}
                      onChange={(e) => setSampleRate(e.target.value)}
                      className="w-full bg-[#1a1a1a] text-gray-300 text-sm rounded-md px-3 py-2
                              border border-[#3a3a3a] focus:outline-none focus:border-green-500"
                    >
                      <option value="48000">48000 Hz</option>
                      <option value="44100">44100 Hz</option>
                      <option value="96000">96000 Hz</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-300">
                      {t("converter.modal.channels")}
                    </label>
                    <select
                      value={channels}
                      onChange={(e) => setChannels(e.target.value)}
                      className="w-full bg-[#1a1a1a] text-gray-300 text-sm rounded-md px-3 py-2
                              border border-[#3a3a3a] focus:outline-none focus:border-green-500"
                    >
                      <option value="2">{t("converter.channels.stereo")}</option>
                      <option value="6">
                        {t("converter.channels.surround51")}
                      </option>
                      <option value="8">
                        {t("converter.channels.surround71")}
                      </option>
                      <option value="1">{t("converter.channels.mono")}</option>
                    </select>
                  </div>
                </div>
              </motion.div>
              {/* Error Display */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-md"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.form>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-4 py-3 border-t border-[#2e2e2e]">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onClose}
            className="px-4 py-1 text-gray-300 text-sm hover:bg-[#2a2a2a] 
                   rounded-md transition-colors"
          >
            {t("converter.modal.cancel")}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isProcessing}
            onClick={handleSubmit}
            className="px-4 py-1 bg-green-500 text-white text-sm rounded-md
                   hover:bg-green-600 transition-colors disabled:opacity-50
                   disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent
                            rounded-full animate-spin" />
                {t("converter.modal.processing")}
              </>
            ) : (
              t("converter.modal.convert")
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
  ); // Replace with your actual JSX
}

export default AddConversion;