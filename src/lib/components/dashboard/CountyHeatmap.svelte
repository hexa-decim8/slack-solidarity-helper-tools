<script lang="ts">
	import michiganCountiesGeojsonRaw from '../../data/michigan-counties.geojson?raw';
	import type { CountySummary } from './chart-data.js';

	const michiganCountiesGeojson = JSON.parse(michiganCountiesGeojsonRaw) as any;

	type Props = {
		data: CountySummary[];
		accessibleName: string;
	};

	const WIDTH = 760;
	const HEIGHT = 600;
	const PADDING = 20;

	let { data, accessibleName }: Props = $props();

	const maxValue = $derived(Math.max(...data.map((entry) => entry.value), 0));

	function projectPoint([lon, lat]: [number, number]): [number, number] {
		const bounds = calculateBounds();
		const x =
			PADDING +
			((lon - bounds.minLon) / Math.max(bounds.maxLon - bounds.minLon, 1)) *
				(WIDTH - PADDING * 2);
		const y =
			PADDING +
			((bounds.maxLat - lat) / Math.max(bounds.maxLat - bounds.minLat, 1)) *
				(HEIGHT - PADDING * 2);
		return [x, y];
	}

	function calculateBounds() {
		let minLon = Infinity;
		let maxLon = -Infinity;
		let minLat = Infinity;
		let maxLat = -Infinity;

		for (const feature of (michiganCountiesGeojson as any).features ?? []) {
			for (const polygon of iterateCoordinates(feature.geometry)) {
				for (const point of polygon) {
					const [lon, lat] = point as [number, number];
					minLon = Math.min(minLon, lon);
					maxLon = Math.max(maxLon, lon);
					minLat = Math.min(minLat, lat);
					maxLat = Math.max(maxLat, lat);
				}
			}
		}

		return { minLon, maxLon, minLat, maxLat };
	}

	function iterateCoordinates(geometry: any): any[] {
		if (!geometry) return [];
		if (geometry.type === 'Polygon') return geometry.coordinates ?? [];
		if (geometry.type === 'MultiPolygon') return (geometry.coordinates ?? []).flat();
		return [];
	}

	function polygonToPath(coordinates: any[]): string {
		const rings = coordinates.map((ring) => {
			const points = ring.map((point: any) => {
				const [x, y] = projectPoint([point[0], point[1]] as [number, number]);
				return `${x.toFixed(2)},${y.toFixed(2)}`;
			});
			return `M ${points.join(' L ')} Z`;
		});
		return rings.join(' ');
	}

	function geometryToPath(geometry: any): string {
		if (!geometry) return '';
		if (geometry.type === 'Polygon') return polygonToPath(geometry.coordinates ?? []);
		if (geometry.type === 'MultiPolygon') {
			return (geometry.coordinates ?? [])
				.map((polygon: any[]) => polygonToPath(polygon ?? []))
				.join(' ');
		}
		return '';
	}

	const counties = $derived(
		((michiganCountiesGeojson as any).features ?? []).map((feature: any) => {
			const sourceCounty = String(
				feature.properties?.county ?? feature.properties?.NAME ?? '',
			).replace(/\s*County\s*$/i, '').trim();
			const entry = data.find(
				(item) => item.county.toLowerCase() === sourceCounty.toLowerCase(),
			);
			const value = entry?.value ?? 0;
			return {
				county: sourceCounty,
				value,
				d: geometryToPath(feature.geometry),
			};
		}),
	);

	function colorForValue(value: number): string {
		if (maxValue <= 0 || value <= 0) return '#f4f7fb';
		const mix = value / maxValue;
		const hue = 220 - mix * 150;
		const lightness = 95 - mix * 45;
		return `hsla(${hue}, 78%, ${lightness}%, 0.9)`;
	}
</script>

<div class="county-heatmap" role="img" aria-label={accessibleName}>
	<svg class="county-heatmap__svg" viewBox="0 0 760 600" preserveAspectRatio="xMidYMid meet">
		{#each counties as county (county.county)}
			<path
				d={county.d}
				fill={colorForValue(county.value)}
				stroke="rgba(15, 23, 42, 0.7)"
				stroke-width="0.7"
			/>
		{/each}
	</svg>
	<div class="county-heatmap__legend" aria-hidden="true">
		<span>Low</span>
		<div class="county-heatmap__legend-bar"></div>
		<span>High</span>
	</div>
</div>

<style>
	.county-heatmap {
		display: grid;
		gap: 0.75rem;
		width: 100%;
	}
	.county-heatmap__svg {
		display: block;
		width: 100%;
		height: 360px;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: linear-gradient(180deg, #f8fbff 0%, #edf4ff 100%);
	}
	.county-heatmap__legend {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--color-text-muted);
		font-size: var(--font-size-sm);
	}
	.county-heatmap__legend-bar {
		width: 120px;
		height: 10px;
		border-radius: 999px;
		background: linear-gradient(90deg, #f4f7fb 0%, #8ab7ff 50%, #0b4aa2 100%);
	}
</style>
