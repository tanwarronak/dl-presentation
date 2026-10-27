export interface LabeledPoint { id?: string; studentLabel?: string; studyHours: number; attendance: number; outcome: 'pass' | 'fail' }
export interface LogisticModel { weights: number[]; bias: number; mean: number[]; scale: number[]; iterations: number; lossHistory: number[] }
export interface LogisticMetrics { tp: number; tn: number; fp: number; fn: number; accuracy: number | null; precision: number | null; recall: number | null; f1: number | null }

export function sigmoid(value: number) { if (value >= 0) { const z = Math.exp(-value); return 1 / (1 + z); } const z = Math.exp(value); return z / (1 + z); }
export function binaryCrossEntropy(labels: number[], probabilities: number[]) { return labels.reduce((sum, label, index) => { const probability = Math.max(1e-15, Math.min(1 - 1e-15, probabilities[index])); return sum - (label * Math.log(probability) + (1 - label) * Math.log(1 - probability)); }, 0) / labels.length; }
export function validateLabeledPoint(studyHours: unknown, attendance: unknown, outcome: unknown) { const hours = Number(studyHours); const attendanceValue = Number(attendance); if (!Number.isFinite(hours) || !Number.isFinite(attendanceValue)) return { valid: false, error: 'Enter valid numeric values.' }; if (hours < 0 || hours > 12) return { valid: false, error: 'Study hours must be from 0 to 12.' }; if (attendanceValue < 0 || attendanceValue > 100) return { valid: false, error: 'Attendance must be from 0 to 100.' }; if (outcome !== 'pass' && outcome !== 'fail') return { valid: false, error: 'Choose Pass or Fail.' }; return { valid: true, value: { studyHours: hours, attendance: attendanceValue } }; }

export function trainLogistic(points: LabeledPoint[], learningRate = 0.08, iterations = 800): LogisticModel | null {
  if (!points.length) return null;
  const labels = points.map(point => point.outcome === 'pass' ? 1 : 0);
  if (!labels.includes(1) || !labels.includes(0)) return null;
  const raw = points.map(point => [point.studyHours, point.attendance / 100]);
  const mean = [0, 0].map((_, column) => raw.reduce((sum, row) => sum + row[column], 0) / raw.length);
  const scale = [0, 0].map((_, column) => { const variance = raw.reduce((sum, row) => sum + (row[column] - mean[column]) ** 2, 0) / raw.length; return Math.sqrt(variance) || 1; });
  const features = raw.map(row => row.map((value, column) => (value - mean[column]) / scale[column]));
  let weights = [0, 0]; let bias = 0; const lossHistory: number[] = [];
  for (let iteration = 0; iteration < iterations; iteration++) {
    const probabilities = features.map(row => sigmoid(bias + row[0] * weights[0] + row[1] * weights[1]));
    lossHistory.push(binaryCrossEntropy(labels, probabilities));
    const gradients = [0, 0]; let biasGradient = 0;
    for (let index = 0; index < features.length; index++) {
      const difference = probabilities[index] - labels[index]; biasGradient += difference;
      gradients[0] += difference * features[index][0]; gradients[1] += difference * features[index][1];
    }
    bias -= learningRate * biasGradient / features.length;
    weights[0] -= learningRate * gradients[0] / features.length;
    weights[1] -= learningRate * gradients[1] / features.length;
  }
  return { weights, bias, mean, scale, iterations, lossHistory };
}

export function predictLogistic(model: LogisticModel, studyHours: number, attendance: number, threshold = 0.5) { const raw = [studyHours, attendance / 100]; const scaled = raw.map((value, index) => (value - model.mean[index]) / model.scale[index]); const score = model.bias + scaled[0] * model.weights[0] + scaled[1] * model.weights[1]; const probability = sigmoid(score); return { probability, label: probability >= threshold ? 'pass' : 'fail', score }; }
export function confusionMatrix(points: LabeledPoint[], model: LogisticModel | null, threshold = 0.5): LogisticMetrics { const matrix = { tp: 0, tn: 0, fp: 0, fn: 0 }; if (!model) return { ...matrix, accuracy: null, precision: null, recall: null, f1: null }; for (const point of points) { const predicted = predictLogistic(model, point.studyHours, point.attendance, threshold).label; if (point.outcome === 'pass' && predicted === 'pass') matrix.tp++; else if (point.outcome === 'fail' && predicted === 'fail') matrix.tn++; else if (point.outcome === 'fail' && predicted === 'pass') matrix.fp++; else matrix.fn++; } const accuracyDenominator = matrix.tp + matrix.tn + matrix.fp + matrix.fn; const precisionDenominator = matrix.tp + matrix.fp; const recallDenominator = matrix.tp + matrix.fn; const accuracy = accuracyDenominator ? (matrix.tp + matrix.tn) / accuracyDenominator : null; const precision = precisionDenominator ? matrix.tp / precisionDenominator : null; const recall = recallDenominator ? matrix.tp / recallDenominator : null; const f1 = precision !== null && recall !== null && precision + recall ? 2 * precision * recall / (precision + recall) : null; return { ...matrix, accuracy, precision, recall, f1 }; }
