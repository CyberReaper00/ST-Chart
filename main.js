// Set dimensions and margins of the chart
const margin = { top: 20, right: 30, bottom: 50, left: 50 };
const width = window.innerWidth * 0.8 - margin.left - margin.right; // 90% of the viewport width
const height = window.innerHeight * 0.8 - margin.top - margin.bottom; // 90% of the viewport height

// Append an SVG element to the body
const svg = d3.select("svg")
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Parse the date and time
const parseDate = d3.timeParse("%Y-%m-%d");

// Define scales
const x = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear()
  .domain([0, 200])
  .range([height, 0]);

// Define the line generator
const line = d3.line()
  .x(d => x(d.date))
  .y(d => y(d.relativeValue));  // Use relative values for the line

// Load the data
d3.tsv("data.tsv").then(data => {
  // Format the data
  data.forEach((d, i) => {
    d.date = parseDate(d.date);
    d.value = +d.value;

    // Calculate the relative value based on the previous data point
    if (i > 0) {
      d.relativeValue = data[i - 1].relativeValue + d.value;  // Add value to the previous relative point
    } else {
      d.relativeValue = d.value;  // First point starts from the value itself
    }
  });

  // Set the domains for the axes
  x.domain(d3.extent(data, d => d.date));
  y.domain([0, 200]);

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

/* minY = document.getElementById('min-value').innerText
 maxY = document.getElementById('max-value').innerText
 function open_menu() {
	const odiv = document.getElementByClassNames('settings');
	odiv.addEventListener('mousedown', function() {
		div.style.display = 'block';
	});
}

function close_menu() {
	const cdiv = document.getElementByClassNames('menu_main');
	cdiv.addEventListener('mousedown', function() {
		div.style.display = 'none';
	});
}

open_menu();
close_menu();
*/
