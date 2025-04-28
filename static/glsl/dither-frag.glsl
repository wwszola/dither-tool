varying vec2 vUv;

uniform sampler2D tDiffuse;

uniform int ditherSize;
uniform int quantize;
uniform int colorMode;

uniform sampler2D tCustomMatrix;
uniform vec2 customMatrixSize;

//const vec3 lumaFactor = vec3(0.2126, 0.7152, 0.0722);
const vec3 lumaFactor = vec3(0.299, 0.587, 0.114);
//const vec3 lumaFactor = vec3(0.3333, 0.3333, 0.3333);

const int ditherMatrix2x2[4] = int[](
    0,  3,  
    2,  1
);

const int ditherMatrix4x4[16] = int[](
    0,  8,  2, 10,
    12, 4, 14, 6,
    3, 11, 1,  9,
    15, 7, 13, 5
);

const int ditherMatrix8x8[64] = int[](
    0, 48, 12, 60, 3, 51, 15, 63,
    32, 16, 44, 28, 35, 19, 47, 31,
    8, 56, 4, 52, 11, 59, 7, 55,
    40, 24, 36, 20, 43, 27, 39, 23,
    2, 50, 14, 62, 1, 49, 13, 61,
    34, 18, 46, 30, 33, 17, 45, 29,
    10, 58, 6, 54, 9, 57, 5, 53,
    42, 26, 38, 22, 41, 25, 37, 21
);

int ditherIndex(float x, float y, float size){
    return int(mod(x, size)) + int(mod(y, size)) * int(size);
}

float customThresholdMap(vec2 coord){
    float width = float(1 << int(customMatrixSize.x));
    float height = float(1 << int(customMatrixSize.y));
    vec2 size = vec2(width, height);
    coord = mod(coord, size)/size;
    float threshold = texture2D(tCustomMatrix, coord).r;
    threshold = (threshold + 1.0) / (1.0 + width*height);
    return threshold;
}

float thresholdMap(vec2 coord, float size){
    int index = ditherIndex(coord.x, coord.y, size);
    int iSize = int(size);
    float threshold = 0.0;
    if(iSize == 2){
        threshold = float(ditherMatrix2x2[index]);
    }else if(iSize == 4){
        threshold = float(ditherMatrix4x4[index]);
    }else if(iSize == 8){
        threshold = float(ditherMatrix8x8[index]);
    }
    threshold = (threshold + 1.0) / (1.0 + size*size);
    return threshold;
}

vec3 ditherQuantize(vec2 coord, vec3 color, float size, float quantize){
    float threshold = 0.0;
    if(size < 0.0){
        threshold = customThresholdMap(coord);
    }else{
        threshold = thresholdMap(coord, size);
    }
    vec3 quantized = floor(color * (quantize - 1.0) + threshold);
    quantized = quantized / (quantize - 1.0);
    return quantized;
}

void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    float luma = 0.0;
    vec3 dither = vec3(0.0);

    if(colorMode == 0){
        luma = dot(color.rgb, lumaFactor);
        color.rgb = vec3(luma);
    }

    dither = ditherQuantize(
        gl_FragCoord.xy,
        color.rgb,
        float(ditherSize),
        float(quantize)
    );
    
    gl_FragColor = vec4(dither, 1.0);
}