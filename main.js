// Creating the UI for settings and data viewing
const dtab = document.querySelector('#tabs td:nth-of-type(1) div');
const stab = document.querySelector('#tabs td:nth-of-type(2) div');
const inputs = document.querySelectorAll('#view input');
const tarea = document.querySelector('#view textarea');
const bgcolor = 'skyblue';

dtab.addEventListener('click', () => {
  stab.style.borderColor = 'gray';
  stab.style.borderBottomColor = bgcolor;
  inputs.forEach(input => {
    input.style.display = 'none';
  });
  if (tarea) {
    tarea.style.display = 'block';
  }
  dtab.style.borderColor = bgcolor;
});

stab.addEventListener('click', () => {
  dtab.style.borderColor = 'gray';
  dtab.style.borderBottomColor = bgcolor;
  inputs.forEach(input => {
    input.style.display = 'block';
  });
  if (tarea) {
    tarea.style.display = 'none';
  }
  stab.style.borderColor = bgcolor;
});

// -------------------- SVG Code --------------------

// Define dimensions and margins for the chart
const margin = { top: 20, right: 30, bottom: 50, left: 50 };
const width = window.innerWidth * 0.8 - margin.left - margin.right; // 80% of the viewport width
const height = window.innerHeight * 0.8 - margin.top - margin.bottom; // 80% of the viewport height

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
  .y(d => y(d.relativeValue)); // Use relative values for the line

// Load the data
d3.tsv("data.tsv").then(data => {
  // Format the data
  let hVal = 0;
  data.forEach((d, i) => {
    d.date = parseDate(d.date);
    d.value = +d.value;

    // Calculate the relative value
    if (i > 0) {
      d.relativeValue = data[i - 1].relativeValue + (data[i - 1].relativeValue * (d.value / 100));
    } else {
      d.relativeValue = d.value;
    }

    if (hVal < d.relativeValue) {
      hVal = d.relativeValue;
    }
  });

  // Update the y-axis domain
  const nHeight = hVal + (hVal * 0.3);
  y.domain([0, nHeight]);
  x.domain(d3.extent(data, d => d.date));

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

  function mouseoverFunc(event, d) {
    const [xPosition, yPosition] = d3.pointer(event, svg.node());

    // Create a group for the tooltips
    const tooltipGroup = svg.append("g").attr("class", "tooltip-group");

    // Tooltip for data value
    const valueText = `Data: ${d.value}`;
    const representedText = `Chart: ${d.relativeValue.toFixed(2)}`;
    
    // Calculate text dimensions
    const padding = 5;
	   
    const valueElement = tooltipGroup.append("text")
    .attr("class", "tooltip-value")
    .attr("x", xPosition)
    .attr("y", yPosition - 50)
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .text(valueText);
      
    const representedElement = tooltipGroup.append("text")
    .attr("class", "tooltip-represented")
    .attr("x", xPosition + 5)
    .attr("y", yPosition - 30)
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .text(representedText);
      
    // Add background rectangles
    const valueBBox = valueElement.node().getBBox();
    tooltipGroup.append("rect")
    .attr("class", "tooltip-bg")
    .attr("x", valueBBox.x - 5)
    .attr("y", valueBBox.y - 5)
    .attr("width", valueBBox.width + padding * 2)
    .attr("height", valueBBox.height + padding * 2)
    .attr("fill", "white")
    .attr("stroke", "gray")
    .lower();
      
    const representedBBox = representedElement.node().getBBox();
    tooltipGroup.append("rect")
    .attr("class", "tooltip-bg")
    .attr("x", representedBBox.x - 5)
    .attr("y", representedBBox.y - 5)
    .attr("width", representedBBox.width + padding * 2)
    .attr("height", representedBBox.height + padding * 2)
    .attr("fill", "white")
    .attr("stroke", "gray")
    .lower();
  }

  function mouseoutFunc(event, d) {
    svg.selectAll(".tooltip-group").remove();
  }
    
  // Add dots for each data point
  svg.selectAll(".dot")
  .data(data)
  .enter().append("circle")
  .attr("class", "dot_circ")
  .attr("cx", d => x(d.date))
  .attr("cy", d => y(d.relativeValue))
  .attr("r", 5)
  .attr("fill", "steelblue")
  .on("mouseover", mouseoverFunc)
  .on("mouseout", mouseoutFunc);

}).catch(error => {
  console.error("Error loading the data:", error);
});

