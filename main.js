// Set dimensions and margins of the chart
const margin = { top: 20, right: 30, bottom: 50, left: 50 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Append an SVG element to the body
const svg = d3.select("svg")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Define scales
const x = d3.scaleLinear()
  .domain([0, 10])  // Set the x-axis domain as needed for your data
  .range([0, width]);

const y = d3.scaleLinear()
  .domain([-200, 200])  // Set the y-axis domain to range from -200 to 200
  .range([height, 0]);   // Maps the y-values to the height of the chart

// Define the line generator
const line = d3.line()
  .x(d => x(d.date))  // Assuming date is used for x values
  .y(d => y(d.value)); // Use y scale for value

// Load the data (can be adjusted as needed)
d3.csv("data.csv").then(data => {
  data.forEach(d => {
    d.date = +d.date;
    d.value = +d.value;
  });

  // Set the x and y domains based on your data
  x.domain(d3.extent(data, d => d.date));
  y.domain([-200, 200]); // Manually set y-domain from -200 to 200

  // Add the x-axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

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

