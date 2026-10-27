export interface KmeansPoint { id?: string; studentLabel?: string; studyHours: number; attendance: number }
export interface KmeansIteration { iteration: number; centroids: number[][]; assignments: number[]; wcss: number }
export interface KmeansResult { assignments: number[]; centroids: number[][]; iterations: KmeansIteration[]; wcss: number; converged: boolean; normalizedPoints: number[][] }

export function euclidean(a: number[], b: number[]) { return Math.sqrt(a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0)); }
export function scaleFeatures(points: KmeansPoint[]) { const means = [points.reduce((s,p)=>s+p.studyHours,0)/points.length, points.reduce((s,p)=>s+p.attendance/100,0)/points.length]; const scales = [0,1].map(index => { const variance = points.reduce((sum,p)=>{const value=index===0?p.studyHours:p.attendance/100;return sum+(value-means[index])**2},0)/points.length; return Math.sqrt(variance)||1; }); return { normalized: points.map(p=>[(p.studyHours-means[0])/scales[0],(p.attendance/100-means[1])/scales[1]]), means, scales }; }
export function nearestCentroid(point: number[], centroids: number[][]) { let best=0,bestDistance=Infinity; centroids.forEach((centroid,index)=>{const distance=euclidean(point,centroid);if(distance<bestDistance){best=index;bestDistance=distance}});return best; }
export function kMeans(points: KmeansPoint[], k: number, seed=42, maxIterations=100, tolerance=1e-6): KmeansResult | null {
  if (!points.length || k < 1 || k > points.length) return null;
  const scaled=scaleFeatures(points);let centroids=seededCentroids(scaled.normalized,k,seed);const iterations:KmeansIteration[]=[];let assignments:number[]=[];let converged=false;
  for(let iteration=1;iteration<=maxIterations;iteration++){
    assignments=scaled.normalized.map(point=>nearestCentroid(point,centroids));
    const next=centroids.map((_,cluster)=>meanOfAssignments(scaled.normalized,assignments,cluster));
    for(let cluster=0;cluster<k;cluster++)if(!Number.isFinite(next[cluster][0]))next[cluster]=centroids[cluster];
    const wcss=scaled.normalized.reduce((sum,point,index)=>sum+(euclidean(point,next[assignments[index]])**2),0);
    iterations.push({iteration,centroids:next.map(row=>[...row]),assignments:[...assignments],wcss});
    const shift=centroids.reduce((sum,centroid,index)=>sum+euclidean(centroid,next[index]),0)/k;
    centroids=next;if(shift<tolerance){converged=true;break}
  }
  const wcss=scaled.normalized.reduce((sum,point,index)=>sum+(euclidean(point,centroids[assignments[index]])**2),0);
  return {assignments,centroids,iterations,wcss,converged,normalizedPoints:scaled.normalized};
}
function seededCentroids(points:number[][],k:number,seed:number){let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};const centroids:number[][]=[];centroids.push([...points[Math.floor(random()*points.length)]]);while(centroids.length<k){let bestPoint=points[0],bestDistance=-1;for(const point of points){let distance=Infinity;for(const centroid of centroids)distance=Math.min(distance,euclidean(point,centroid));if(distance>bestDistance){bestDistance=distance;bestPoint=point}}centroids.push([...bestPoint])}return centroids}
function meanOfAssignments(points:number[][],assignments:number[],cluster:number){const members=points.filter((_,index)=>assignments[index]===cluster);if(!members.length)return [NaN,NaN];return [members.reduce((s,p)=>s+p[0],0)/members.length,members.reduce((s,p)=>s+p[1],0)/members.length]}
