// -------------------- Data Loading and UI Rendering --------------------

const dtab = document.querySelector('#tabs td:nth-of-type(1) div');
const stab = document.querySelector('#tabs td:nth-of-type(2) div');
const dview = document.querySelector('#tab1');
const sview = document.querySelector('#tab2');
const bgcolor = 'white';
const bgsb = '#36454F';

dtab.addEventListener('click', function () {
  dtab.style.background = bgcolor;
  dtab.style.borderColor = bgsb;
  dtab.style.color = 'black';
  stab.style.background = 'darkgray';
  stab.style.borderColor = 'gray';
  stab.style.borderBottomColor = bgsb;
  dview.style.display = 'block';
  sview.style.display = 'none';

});

stab.addEventListener('click', function () {
  stab.style.background = bgcolor;
  stab.style.borderColor = bgsb;
  dtab.style.background = 'darkgray';
  dtab.style.borderColor = 'gray';
  dtab.style.borderBottomColor = bgsb;
  dview.style.display = 'none';
  sview.style.display = 'block';

});

function all_changes() {
  const save = document.querySelector('.sbutton');

  save.addEventListener('click', function() {
    const xy_line = document.querySelector('.xy_value').value;
    const chart_line = document.querySelector('.line_color').value;
    const set_root = document.documentElement.style;

    set_root.setProperty('--xy-color', xy_line);
    set_root.setProperty('--bgchart', chart_line);
  })
}

all_changes();

// Parse the date and time
const parseDate = d3.timeParse("%Y-%m-%d");

// Load the data from the TSV file
d3.tsv("data.tsv").then(data => {
  // Format the data and calculate relative values
  let hVal = 0;
  data.forEach((d, i) => {
    d.date = parseDate(d.date);
    d.value = +d.value;

    if (i > 0) {
      d.relativeValue = data[i - 1].relativeValue + (data[i - 1].relativeValue * (d.value / 100));
    } else {
      d.relativeValue = d.value;
    }

    if (hVal < d.relativeValue) {
      hVal = d.relativeValue;
    }

    // Assign unique ID for each data point
    d.id = i; 
  });

  // Get the container for the data entries
  const dataContainer = document.querySelector('.data_view');

  // Render each data point
  data.forEach((d, i) => {
    const dataDiv = document.createElement('div');
    dataDiv.classList.add('data-entry');
    dataDiv.setAttribute('data-id', d.id); // Set a data-id attribute for easy reference

    const dPoints = document.createElement('p');
    dPoints.innerHTML = `Index: ${i + 1}<br>Date: ${d3.timeFormat("%Y-%m-%d")(d.date)}<br>Value: ${d.value}<br>Chart Value: ${d.relativeValue.toFixed(2)}`;
    dataDiv.appendChild(dPoints);

    dataContainer.appendChild(dataDiv);
  });

  // -------------------- SVG Code --------------------

  const margin = { top: 20, right: 30, bottom: 0, left: 50 };
  const width = window.innerWidth * 0.8 - margin.left - margin.right;
  const height = window.innerHeight * 0.7 - margin.top - margin.bottom;

  const svg = d3.select("svg")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Define scales
  const x = d3.scaleTime().range([0, width]);
  const y = d3.scaleLinear().range([height, 0]);

  // Define the line generator
  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.relativeValue));

  // Update the domains
  const nHeight = hVal + (hVal * 0.3);
  y.domain([0, nHeight]);
  x.domain(d3.extent(data, d => d.date));

  // Add the x-axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .attr("class", "xline")
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  // Add the y-axis
  svg.append("g")
    .attr("class", "yline")
    .call(d3.axisLeft(y));

  // Add the line path
  svg.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);


  // Add dots for each data point
  svg.selectAll(".dot")
    .data(data)
    .enter().append("circle")
    .attr("class", "dot_circ")
    .attr("data-id", (d) => d.id) // Set a data-id for each dot for easy reference
    .attr("cx", d => x(d.date))
    .attr("cy", d => y(d.relativeValue))
    .attr("r", 5)
    .attr("fill", "steelblue")
    .on("mouseover", mouseoverFunc)
    .on("mouseout", mouseoutFunc);

  const tooltip = d3.select('body')
  .append('div')
  .style('position', 'absolute')
  .style('visibility', 'hidden')
  .style('background-color', 'white')
  .style('border', '1px solid gray')
  .style('padding', '5px')
  .style('border-radius', '4px')
  .style('box-shadow', '0 2px 5px rgba(0,0,0,0.3)');
  
  // Tooltip functions
  function mouseoverFunc(event, d) {
    const [xPosition, yPosition] = d3.pointer(event, svg.node());
    const tooltipGroup = svg.append("g").attr("class", "tooltip-group");

    tooltipGroup.append("rect")
      .attr("class", "tooltip-bg")
      .attr("x", xPosition - 50)
      .attr("y", yPosition - 60)
      .attr("width", 100)
      .attr("height", 50)
      .attr("fill", "white")
      .attr("stroke", "gray");

    tooltipGroup.append("text")
      .attr("class", "tooltip-value")
      .attr("x", xPosition)
      .attr("y", yPosition - 40)
      .attr("text-anchor", "middle")
      .text(`Value: ${d.value}`);

    tooltipGroup.append("text")
      .attr("class", "tooltip-represented")
      .attr("x", xPosition)
      .attr("y", yPosition - 20)
      .attr("text-anchor", "middle")
      .text(`Chart: ${d.relativeValue.toFixed(2)}`);

    // Highlight the corresponding div
    const div = document.querySelector(`.data-entry[data-id='${d.id}']`);
    if (div) {
      div.style.backgroundColor = '#00000066'; // Highlight the div
    }
  }

  function mouseoutFunc(event, d) {
    svg.selectAll(".tooltip-group").remove();

    // Reset the corresponding div's background color
    const div = document.querySelector(`.data-entry[data-id='${d.id}']`);
    if (div) {
      div.style.backgroundColor = ''; // Reset the div's background color
    }
  }

  // Add event listeners to div elements
  document.querySelectorAll('.data-entry').forEach(div => {
    div.addEventListener('mouseover', function () {
      const pointId = this.getAttribute('data-id');
      const dataPoint = data[pointId]; // Access the data for the corresponding point
     
      // Set tooltip content
      tooltip.html(`
	<strong>Value:</strong> ${dataPoint.value}<br>
	<strong>Chart:</strong> ${dataPoint.relativeValue.toFixed(2)}
      `);
  
      // Show the tooltip at a fixed position (e.g., top-right corner)
      tooltip
	.style('top', '100px') // Fixed Y position
	.style('left', '70px') // Fixed X position
	.style('visibility', 'visible');
     
      // Highlight the corresponding dot
      d3.select(`.dot_circ[data-id='${pointId}']`).style('fill', 'orange');
    });
  
    div.addEventListener('mouseout', function () {
      tooltip.style('visibility', 'hidden'); // Hide the tooltip
      const pointId = this.getAttribute('data-id');
      d3.select(`.dot_circ[data-id='${pointId}']`).style('fill', '');
    });
  });


}).catch(error => {
  console.error("Error loading the data:", error);
});
