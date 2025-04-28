// adapted from Joel Yliluoma's code
// https://bisqwit.iki.fi/story/howto/dither/jy/#Appendix%202ThresholdMatrix
export function indexMatrix(M, L) {
  const xdim = 1 << M;
  const ydim = 1 << L;
  const mat = new Float32Array(xdim * ydim);
  for (let y = 0; y < ydim; ++y) {
    for (let x = 0; x < xdim; ++x) {
      let v = 0,
        offset = 0,
        xmask = M,
        ymask = L;
      if (M == 0 || (M > L && L != 0)) {
        let xc = x ^ ((y << M) >> L);
        let yc = y;
        for (let bit = 0; bit < M + L; ) {
          v |= ((yc >> --ymask) & 1) << bit++;
          for (offset += M; offset >= L; offset -= L)
            v |= ((xc >> --xmask) & 1) << bit++;
        }
      } else {
        let xc = x,
          yc = y ^ ((x << L) >> M);
        for (let bit = 0; bit < M + L; ) {
          v |= ((xc >> --xmask) & 1) << bit++;
          for (offset += L; offset >= M; offset -= M)
            v |= ((yc >> --ymask) & 1) << bit++;
        }
      }
      mat[y * xdim + x] = v;
    }
  }
  return mat;
}
