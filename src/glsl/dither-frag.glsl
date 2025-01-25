varying vec2 vUv;

uniform sampler2D tDiffuse;

//const vec3 lumaFactor = vec3(0.2126, 0.7152, 0.0722);
//const vec3 lumaFactor = vec3(0.299, 0.587, 0.114);
const vec3 lumaFactor = vec3(0.3333, 0.3333, 0.3333);

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

float dither2x2(vec2 coord, float luma) {
    float threshold = thresholdMap(coord, 2.0);
    return luma < threshold ? 0.0 : 1.0;
}

float dither4x4(vec2 coord, float luma) {
    float threshold = thresholdMap(coord, 4.0);
    return luma < threshold ? 0.0 : 1.0;
}

float dither8x8(vec2 coord, float luma) {
    float threshold = thresholdMap(coord, 8.0);
    return luma < threshold ? 0.0 : 1.0;
}
void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    float luma = dot(color.rgb, lumaFactor);
    float dither = dither8x8(gl_FragCoord.xy, luma);

    vec4 outColor = vec4(
        color.r * dither,
        color.g * dither,
        color.b * dither,
        1.0
    );

    gl_FragColor = outColor;
    //gl_FragColor = vec4(vec3(dither), 1.0);
}