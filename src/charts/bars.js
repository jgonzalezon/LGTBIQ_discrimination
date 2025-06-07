export function drawBars(el, dataset) {
  const w = el.clientWidth, h = 220, margin = 40;
  const svg = d3.select(el).html('').append('svg')
      .attr('width', w).attr('height', h);

  const x = d3.scaleLinear()
      .domain([0, d3.max(dataset, d => d.value)])
      .range([margin, w - margin]);

  const y = d3.scaleBand()
      .domain(dataset.map(d => d.label))
      .range([margin, h - margin])
      .padding(0.1);

  svg.append('g')
     .selectAll('rect')
     .data(dataset)
     .join('rect')
       .attr('x', margin)
       .attr('y', d => y(d.label))
       .attr('height', y.bandwidth())
       .attr('width', d => x(d.value) - margin)
       .attr('fill', '#00cfe8');
}
