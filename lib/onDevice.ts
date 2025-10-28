// lib/onDevice.ts

/**
 * Detecta capacidades do dispositivo para ML local
 */
export interface DeviceCapabilities {
  webgl: boolean;
  webgpu: boolean;
  webnn: boolean;
  workers: boolean;
  memory: number; // em GB
}

/**
 * Resultado da análise de imagem
 */
export interface AnalysisResult {
  width: number;
  height: number;
  dominantColors: string[];
  brightness: number;
  contrast: number;
  sharpness: number;
  faces?: number;
  objects?: Array<{ label: string; confidence: number }>;
}

/**
 * Detecta as capacidades do dispositivo
 */
export function detectCapabilities(): DeviceCapabilities {
  if (typeof window === "undefined") {
    return {
      webgl: false,
      webgpu: false,
      webnn: false,
      workers: false,
      memory: 0,
    };
  }

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

  return {
    webgl: !!gl,
    webgpu: "gpu" in navigator,
    webnn: "ml" in navigator,
    workers: typeof Worker !== "undefined",
    memory: (navigator as any).deviceMemory || 4, // padrão 4GB se não detectar
  };
}

/**
 * Verifica se a análise local está disponível
 */
export function isOnDeviceAvailable(): boolean {
  if (typeof window === "undefined") return false;

  const caps = detectCapabilities();

  // Requer pelo menos WebGL e 2GB de RAM
  return caps.webgl && caps.memory >= 2;
}

/**
 * Analisa cores dominantes da imagem
 */
async function analyzeDominantColors(imageUrl: string): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(["#000000"]);
        return;
      }

      // Redimensiona para análise mais rápida
      const scale = 50;
      canvas.width = scale;
      canvas.height = scale;

      ctx.drawImage(img, 0, 0, scale, scale);
      const imageData = ctx.getImageData(0, 0, scale, scale);
      const data = imageData.data;

      // Conta frequência de cores (agrupadas)
      const colorMap = new Map<string, number>();

      for (let i = 0; i < data.length; i += 4) {
        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i + 1] / 32) * 32;
        const b = Math.round(data[i + 2] / 32) * 32;
        const color = `#${((1 << 24) + (r << 16) + (g << 8) + b)
          .toString(16)
          .slice(1)}`;

        colorMap.set(color, (colorMap.get(color) || 0) + 1);
      }

      // Pega as 5 cores mais frequentes
      const sorted = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([color]) => color);

      resolve(sorted);
    };

    img.onerror = () => resolve(["#000000"]);
  });
}

/**
 * Calcula brilho médio da imagem
 */
async function analyzeBrightness(imageUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(0.5);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let totalBrightness = 0;
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Fórmula de luminância percebida
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        totalBrightness += brightness;
      }

      resolve(totalBrightness / pixelCount);
    };

    img.onerror = () => resolve(0.5);
  });
}

/**
 * Calcula contraste da imagem
 */
async function analyzeContrast(imageUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(0.5);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const brightnesses: number[] = [];

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        brightnesses.push(brightness);
      }

      // Calcula desvio padrão como medida de contraste
      const mean =
        brightnesses.reduce((a, b) => a + b, 0) / brightnesses.length;
      const variance =
        brightnesses.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        brightnesses.length;
      const stdDev = Math.sqrt(variance);

      resolve(Math.min(stdDev * 4, 1)); // Normaliza para 0-1
    };

    img.onerror = () => resolve(0.5);
  });
}

/**
 * Estima nitidez usando detecção de bordas (Laplaciano)
 */
async function analyzeSharpness(imageUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(0.5);
        return;
      }

      // Reduz para análise mais rápida
      const scale = 200;
      canvas.width = scale;
      canvas.height = scale;
      ctx.drawImage(img, 0, 0, scale, scale);

      const imageData = ctx.getImageData(0, 0, scale, scale);
      const data = imageData.data;
      const width = scale;

      // Kernel Laplaciano simplificado
      let edgeSum = 0;
      let pixelCount = 0;

      for (let y = 1; y < scale - 1; y++) {
        for (let x = 1; x < scale - 1; x++) {
          const idx = (y * width + x) * 4;
          const center = data[idx];

          const top = data[((y - 1) * width + x) * 4];
          const bottom = data[((y + 1) * width + x) * 4];
          const left = data[(y * width + (x - 1)) * 4];
          const right = data[(y * width + (x + 1)) * 4];

          const laplacian = Math.abs(4 * center - top - bottom - left - right);
          edgeSum += laplacian;
          pixelCount++;
        }
      }

      const sharpness = Math.min(edgeSum / pixelCount / 128, 1);
      resolve(sharpness);
    };

    img.onerror = () => resolve(0.5);
  });
}

/**
 * Análise completa com progresso real
 */
export async function analyzeImage(
  imageUrl: string,
  onProgress?: (progress: number) => void
): Promise<AnalysisResult> {
  const steps = 5;
  let currentStep = 0;

  const updateProgress = () => {
    currentStep++;
    onProgress?.(Math.round((currentStep / steps) * 100));
  };

  // Carrega a imagem
  const img = await loadImage(imageUrl);
  updateProgress(); // 20%

  // Analisa em paralelo
  const [colors, brightness, contrast, sharpness] = await Promise.all([
    analyzeDominantColors(imageUrl).then((r) => {
      updateProgress();
      return r;
    }), // 40%
    analyzeBrightness(imageUrl).then((r) => {
      updateProgress();
      return r;
    }), // 60%
    analyzeContrast(imageUrl).then((r) => {
      updateProgress();
      return r;
    }), // 80%
    analyzeSharpness(imageUrl).then((r) => {
      updateProgress();
      return r;
    }), // 100%
  ]);

  return {
    width: img.width,
    height: img.height,
    dominantColors: colors,
    brightness,
    contrast,
    sharpness,
  };
}

/**
 * Helper para carregar imagem
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
/**
 * Simula análise com progresso fake (para testes)
 * @deprecated Use analyzeImage para análise real
 */
export async function fakeAnalyze(
  onProgress: (progress: number) => void,
  duration: number = 2000
): Promise<void> {
  return new Promise((resolve) => {
    const steps = 20;
    const interval = duration / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += 100 / steps;
      if (current >= 100) {
        onProgress(100);
        clearInterval(timer);
        resolve();
      } else {
        onProgress(Math.round(current));
      }
    }, interval);
  });
}
