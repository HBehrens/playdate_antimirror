// adaptation of https://github.com/NielsLeenheer/CanvasDither/blob/master/src/canvas-dither.js


/**
 * Change the image to blank and white using a simple threshold
 *
 * @param  {object}   image         The imageData of a Canvas 2d context
 * @param  {number}   threshold     Threshold value (0-255)
 * @return {object}                 The resulting imageData
 *
 */
export function apply_threshold(image: ImageData, threshold: number) {
    for (let i = 0; i < image.data.length; i += 4) {
        const luminance = (image.data[i] * 0.299) + (image.data[i + 1] * 0.587) + (image.data[i + 2] * 0.114);

        const value = luminance < threshold ? 0 : 255;
        image.data.fill(value, i, i + 3);
    }

    return image;
}

/**
 * Change the image to blank and white using the Bayer algorithm
 *
 * @param  {object}   image         The imageData of a Canvas 2d context
 * @param  {number}   threshold     Threshold value (0-255)
 * @return {object}                 The resulting imageData
 *
 */
export function apply_bayer(image: ImageData, threshold: number): ImageData {
    const thresholdMap = [
        [15, 135, 45, 165],
        [195, 75, 225, 105],
        [60, 180, 30, 150],
        [240, 120, 210, 90],
    ];

    for (let i = 0; i < image.data.length; i += 4) {
        const luminance = (image.data[i] * 0.299) + (image.data[i + 1] * 0.587) + (image.data[i + 2] * 0.114);

        const x = i / 4 % image.width;
        const y = Math.floor(i / 4 / image.width);
        const map = Math.floor((luminance + thresholdMap[x % 4][y % 4]) / 2);
        const value = map < threshold ? 0 : 255;
        image.data.fill(value, i, i + 3);
    }

    return image;
}

/**
 * Change the image to blank and white using the Floyd-Steinberg algorithm
 *
 * @param  {object}   image         The imageData of a Canvas 2d context
 * @return {object}                 The resulting imageData
 *
 */
export function apply_floydsteinberg(image: ImageData): ImageData {
    const width = image.width;
    const luminance = new Uint8ClampedArray(image.width * image.height);

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
        luminance[l] = (image.data[i] * 0.299) + (image.data[i + 1] * 0.587) + (image.data[i + 2] * 0.114);
    }

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
        const value = luminance[l] < 129 ? 0 : 255;
        const error = Math.floor((luminance[l] - value) / 16);
        image.data.fill(value, i, i + 3);

        luminance[l + 1] += error * 7;
        luminance[l + width - 1] += error * 3;
        luminance[l + width] += error * 5;
        luminance[l + width + 1] += error * 1;
    }

    return image;
}

/**
 * Change the image to blank and white using the Atkinson algorithm
 *
 * @param  {object}   image         The imageData of a Canvas 2d context
 * @return {object}                 The resulting imageData
 *
 */
export function apply_atkinson(image: ImageData): ImageData {
    const width = image.width;
    const luminance = new Uint8ClampedArray(image.width * image.height);

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
        luminance[l] = (image.data[i] * 0.299) + (image.data[i + 1] * 0.587) + (image.data[i + 2] * 0.114);
    }

    for (let l = 0, i = 0; i < image.data.length; l++, i += 4) {
        const value = luminance[l] < 129 ? 0 : 255;
        const error = Math.floor((luminance[l] - value) / 8);
        image.data.fill(value, i, i + 3);

        luminance[l + 1] += error;
        luminance[l + 2] += error;
        luminance[l + width - 1] += error;
        luminance[l + width] += error;
        luminance[l + width + 1] += error;
        luminance[l + 2 * width] += error;
    }

    return image;
}

type QuantizationThreshold = {
    kind: 'threshold',
    threshold: number,
};

type QuantizationBayer = {
    kind: 'bayer',
    threshold: number,
}

type QuantizationFloydsteinberg = {
    kind: 'floydsteinberg',
};

type QuantizationAtkinson = {
    kind: 'atkinson',
}

export type QuantizationConfig = QuantizationThreshold | QuantizationBayer | QuantizationFloydsteinberg | QuantizationAtkinson;

export const DEFAULT_QUANTIZATION_CONFIG: QuantizationConfig = {
    kind: 'bayer',
    threshold: 128,
};

export function apply_quantization(config: QuantizationConfig, image: ImageData) {
    switch (config.kind) {
        case "floydsteinberg":
            return apply_floydsteinberg(image)
        case "threshold":
            return apply_threshold(image, config.threshold);
        case "bayer":
            return apply_bayer(image, config.threshold)
        case "atkinson":
            return apply_atkinson(image)
    }
}
