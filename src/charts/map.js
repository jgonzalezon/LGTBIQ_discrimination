export async function drawChoropleth(el, geojson, metrics) {
  // el = contenedor (div)
  const w = el.clientWidth, h = 400;
  const svg = d3.select(el).html('').append('svg')
                .attr('width', w).attr('height', h);

  const projection = d3.geoMercator()
        .center([13, 52])        // aproximación a Europa central
        .scale(450)
        .translate([w/2, h/2]);

  const path = d3.geoPath().projection(projection);

  // escala color verde→rojo
  const color = d3.scaleLinear()
        .domain([0, 1])
        .range(['#0f0', '#f00']);

  svg.append('g')
     .selectAll('path')
     .data(geojson.features)
     .join('path')
       .attr('d', path)
       .attr('fill', d => {
         const cc = d.properties.ISO_A3;          // código país iso3
         const v  = metrics[cc];                  // 0-1
         return v == null ? '#ccc' : color(v);
       })
       .attr('stroke', '#000')
       .on('click', (e,d) => {
          // al pinchar país → recalcular gráficos
          const cc = d.properties.ISO_A3;
          window.renderChartsForCountry(cc);      // función global
       });
}
