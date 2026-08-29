/**
 * UP NOAH Flood Hazard Return Periods for Metro Cebu
 * 5-Year (Advisory/Low), 25-Year (High Risk), 100-Year (Severe Hazard)
 */

export interface HazardFeatureProperties {
  hazard_level: '5_year' | '25_year' | '100_year';
  risk_tier: 'advisory' | 'high' | 'severe';
  return_period_years: number;
  barangay_name: string;
  depth_estimate_meters: string;
  fill_color: string;
  fill_opacity: number;
}

export const UP_NOAH_CEBU_HAZARD_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    // 100-Year Severe Hazard (Suba River / Mabolo Catchment)
    {
      type: 'Feature',
      properties: {
        hazard_level: '100_year',
        risk_tier: 'severe',
        return_period_years: 100,
        barangay_name: 'Mabolo (Suba Basin)',
        depth_estimate_meters: '> 1.5m',
        fill_color: '#ea3838',
        fill_opacity: 0.35,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [123.911, 10.321],
            [123.921, 10.323],
            [123.924, 10.329],
            [123.916, 10.331],
            [123.911, 10.321],
          ],
        ],
      },
    },
    // 100-Year Severe Hazard (Mambaling Lowland Basin)
    {
      type: 'Feature',
      properties: {
        hazard_level: '100_year',
        risk_tier: 'severe',
        return_period_years: 100,
        barangay_name: 'Mambaling Coastal Lowland',
        depth_estimate_meters: '> 1.5m',
        fill_color: '#ea3838',
        fill_opacity: 0.35,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [123.869, 10.288],
            [123.879, 10.289],
            [123.881, 10.296],
            [123.871, 10.297],
            [123.869, 10.288],
          ],
        ],
      },
    },
    // 25-Year High Risk (Kasambagan / Mahiga Creek Overflow)
    {
      type: 'Feature',
      properties: {
        hazard_level: '25_year',
        risk_tier: 'high',
        return_period_years: 25,
        barangay_name: 'Kasambagan (Mahiga Creek)',
        depth_estimate_meters: '0.5m - 1.5m',
        fill_color: '#f5820d',
        fill_opacity: 0.3,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [123.908, 10.328],
            [123.917, 10.331],
            [123.919, 10.337],
            [123.910, 10.336],
            [123.908, 10.328],
          ],
        ],
      },
    },
    // 25-Year High Risk (T. Padilla Tejero Basin)
    {
      type: 'Feature',
      properties: {
        hazard_level: '25_year',
        risk_tier: 'high',
        return_period_years: 25,
        barangay_name: 'T. Padilla & Tejero',
        depth_estimate_meters: '0.5m - 1.5m',
        fill_color: '#f5820d',
        fill_opacity: 0.3,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [123.901, 10.301],
            [123.909, 10.304],
            [123.911, 10.311],
            [123.903, 10.309],
            [123.901, 10.301],
          ],
        ],
      },
    },
    // 5-Year Advisory (Guadalupe River Upper Catchment)
    {
      type: 'Feature',
      properties: {
        hazard_level: '5_year',
        risk_tier: 'advisory',
        return_period_years: 5,
        barangay_name: 'Guadalupe River Margin',
        depth_estimate_meters: '< 0.5m',
        fill_color: '#facc15',
        fill_opacity: 0.25,
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [123.878, 10.321],
            [123.887, 10.324],
            [123.889, 10.332],
            [123.880, 10.331],
            [123.878, 10.321],
          ],
        ],
      },
    },
  ],
};
