export function drawDonut(el, value) {
  const w = 220, h = 220, r = 80;
  const svg = d3.select(el).html('').append('svg')
      .attr('width', w).attr('height', h)
    .append('g')
      .attr('transform', `translate(${w/2},${h/2})`);

  const arc = d3.arc().innerRadius(r*0.6).outerRadius(r);
  svg.append('path')
     .attr('d', arc({ startAngle: 0, endAngle: 2*Math.PI*value }))
     .attr('fill', '#00cfe8');
  svg.append('path')
     .attr('d', arc({ startAngle: 2*Math.PI*value, endAngle: 2*Math.PI }))
     .attr('fill', '#222');
}
