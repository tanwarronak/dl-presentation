export interface Point { id?: string; studentLabel?: string; studyHours: number; examMarks: number }
export interface RegressionRow extends Point { dx: number; dy: number; covarianceProduct: number; squaredDx: number; predicted: number | null; residual: number | null; squaredResidual: number | null }
export interface RegressionResult {
  count: number; meanX: number | null; meanY: number | null; slope: number | null; intercept: number | null;
  sxy: number; sxx: number; sse: number | null; mse: number | null; rmse: number | null; sst: number | null; rSquared: number | null;
  rows: RegressionRow[]; residualSum: number | null; covarianceResidualSum: number | null; passesThroughMean: boolean | null;
  message: string;
}

export function validateSubmission(studyHours: unknown, examMarks: unknown) {
  const x = typeof studyHours === 'number' ? studyHours : Number(studyHours);
  const y = typeof examMarks === 'number' ? examMarks : Number(examMarks);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { valid: false, error: 'Enter valid numeric values.' };
  if (x < 0 || x > 12) return { valid: false, error: 'Study hours must be from 0 to 12.' };
  if (y < 0 || y > 100) return { valid: false, error: 'Exam marks must be from 0 to 100.' };
  return { valid: true, value: { studyHours: x, examMarks: y } };
}

export function calculateRegression(input: Point[]): RegressionResult {
  const points = input.filter(p => Number.isFinite(p.studyHours) && Number.isFinite(p.examMarks));
  const count = points.length;
  if (!count) return emptyResult('No submissions yet. The regression model will appear after data is submitted.');
  const meanX = points.reduce((sum, p) => sum + p.studyHours, 0) / count;
  const meanY = points.reduce((sum, p) => sum + p.examMarks, 0) / count;
  if (count === 1) return { ...emptyResult('One observation is not enough to fit a unique least-squares line.'), count, meanX, meanY, rows: makeRows(points, meanX, meanY, null, null, null) };

  const baseRows = points.map(p => ({ ...p, dx: p.studyHours - meanX, dy: p.examMarks - meanY, covarianceProduct: (p.studyHours - meanX) * (p.examMarks - meanY), squaredDx: (p.studyHours - meanX) ** 2, predicted: null as number | null, residual: null as number | null, squaredResidual: null as number | null }));
  const sxy = baseRows.reduce((sum, row) => sum + row.covarianceProduct, 0);
  const sxx = baseRows.reduce((sum, row) => sum + row.squaredDx, 0);
  if (Math.abs(sxx) < 1e-12) return { ...emptyResult('Study hours are identical, so the ordinary least-squares slope is undefined.'), count, meanX, meanY, sxy, sxx, rows: makeRows(points, meanX, meanY, null, null, null) };

  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  const rows = makeRows(points, meanX, meanY, slope, intercept, sxx);
  const residuals = rows.map(row => row.residual ?? 0);
  const sse = residuals.reduce((sum, residual) => sum + residual ** 2, 0);
  const mse = sse / count;
  const rmse = Math.sqrt(mse);
  const sst = points.reduce((sum, p) => sum + (p.examMarks - meanY) ** 2, 0);
  const rSquared = Math.abs(sst) < 1e-12 ? null : 1 - sse / sst;
  const residualSum = residuals.reduce((sum, residual) => sum + residual, 0);
  const covarianceResidualSum = rows.reduce((sum, row) => sum + row.dx * (row.residual ?? 0), 0);
  const fittedMean = slope * meanX + intercept;
  return { count, meanX, meanY, slope, intercept, sxy, sxx, sse, mse, rmse, sst, rSquared, rows, residualSum, covarianceResidualSum, passesThroughMean: Math.abs(fittedMean - meanY) < 1e-9, message: 'A unique least-squares line is fitted.' };
}

function makeRows(points: Point[], meanX: number, meanY: number, slope: number | null, intercept: number | null, _sxx: number | null): RegressionRow[] {
  return points.map(p => {
    const dx = p.studyHours - meanX; const dy = p.examMarks - meanY;
    const predicted = slope !== null && intercept !== null ? slope * p.studyHours + intercept : null;
    const residual = predicted !== null ? p.examMarks - predicted : null;
    return { ...p, dx, dy, covarianceProduct: dx * dy, squaredDx: dx * dx, predicted, residual, squaredResidual: residual !== null ? residual ** 2 : null };
  });
}

function emptyResult(message: string): RegressionResult {
  return { count: 0, meanX: null, meanY: null, slope: null, intercept: null, sxy: 0, sxx: 0, sse: null, mse: null, rmse: null, sst: null, rSquared: null, rows: [], residualSum: null, covarianceResidualSum: null, passesThroughMean: null, message };
}

export function predictAt(model: RegressionResult, studyHours: number) {
  if (model.slope === null || model.intercept === null || !Number.isFinite(studyHours)) return null;
  return model.slope * studyHours + model.intercept;
}
