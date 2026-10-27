import { describe, expect, it } from 'vitest';
import { sigmoid, binaryCrossEntropy, trainLogistic, predictLogistic, confusionMatrix } from './logisticRegression';
import { euclidean, kMeans, nearestCentroid } from './kmeans';

describe('classification math',()=>{
 it('provides stable sigmoid outputs',()=>{expect(sigmoid(1000)).toBe(1);expect(sigmoid(-1000)).toBe(0);expect(sigmoid(0)).toBe(0.5)});
 it('calculates binary cross entropy',()=>{expect(binaryCrossEntropy([1],[0.9])).toBeGreaterThanOrEqual(0);expect(binaryCrossEntropy([0,1],[0.1,0.9])).toBeCloseTo(-((Math.log(0.9)+Math.log(0.9))/2))});
 it('trains labels and changes threshold predictions',()=>{const points=[{studyHours:1,attendance:30,outcome:'fail' as const},{studyHours:2,attendance:45,outcome:'fail' as const},{studyHours:7,attendance:80,outcome:'pass' as const},{studyHours:9,attendance:92,outcome:'pass' as const}];const model=trainLogistic(points)!;expect(model.weights).toHaveLength(2);const prediction=predictLogistic(model,8,85);expect(prediction.label).toBe('pass');expect(prediction.probability).toBeGreaterThan(0.5);expect(confusionMatrix(points,model,0.5).accuracy).not.toBeNull()});
 it('returns undefined metrics when degenerate',()=>{expect(confusionMatrix([],null,0.5).accuracy).toBeNull()})
});
describe('k-means math',()=>{
 it('calculates distance and nearest centroid',()=>{expect(euclidean([0,0],[3,4])).toBe(5);expect(nearestCentroid([1,1],[[0,0],[10,10]])).toBe(0)});
 it('runs converging deterministic clustering',()=>{const points=[{studyHours:1,attendance:20},{studyHours:2,attendance:25},{studyHours:8,attendance:80},{studyHours:9,attendance:85}];const first=kMeans(points,2,42)!;const second=kMeans(points,2,42)!;expect(first.wcss).toBeGreaterThanOrEqual(0);expect(first.assignments).toEqual(second.assignments);expect(first.centroids).toEqual(second.centroids);expect(first.iterations.length).toBeLessThanOrEqual(100)});
 it('handles duplicate and insufficient observations',()=>{const duplicate=[{studyHours:4,attendance:50},{studyHours:4,attendance:50},{studyHours:4,attendance:50}];expect(kMeans(duplicate,2,42)?.assignments).toBeDefined();expect(kMeans([{studyHours:1,attendance:20}],2,42)).toBeNull();expect(kMeans([],2,42)).toBeNull()});
});
