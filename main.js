// Set dimensions and margins of the chart
const margin = { top: 20, right: 30, bottom: 50, left: 50 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Append an SVG element to the body
const svg = d3.select("svg")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Parse the date and time
const parseDate = d3.timeParse("%Y-%m-%d");

// Define scales
const x = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

// Define the line generator
const line = d3.line()
  .x(d => x(d.date))
  .y(d => y(d.value));

// Load the data
d3.csv("data.csv").then(data => {
  // Format the data
  data.forEach(d => {
    d.date = parseDate(d.date);
    d.value = +d.value;
  });

  // Set the domains for the axes
  x.domain(d3.extent(data, d => d.date));
  y.domain([0, d3.max(data, d => d.value)]);

  // Add the x-axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  // Add the y-axis
  svg.append("g")
    .call(d3.axisLeft(y));

  // Add the line path
  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);
}).catch(error => {
  console.error("Error loading the data:", error);
});

