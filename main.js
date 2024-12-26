// -------------------- UI Code --------------------

// Creating the UI for settings and data viewing
const dtab = document.querySelector('#tabs td:nth-of-type(1) div');
const stab = document.querySelector('#tabs td:nth-of-type(2) div');
const inputs = document.querySelectorAll('#view input');
const bgcolor = 'steelblue';

dtab.addEventListener('click', () => {
  stab.style.borderColor = 'gray';
  stab.style.borderBottomColor = bgcolor;
  stab.style.background = 'darkgray';
  inputs.forEach(input => {
    input.style.display = 'none';
  });
  const dView = document.querySelector('.data_view');
  if (dView) {
    dView.style.display = 'block';
  }
  dtab.style.borderColor = bgcolor;
  dtab.style.background = 'skyblue';
});

stab.addEventListener('click', () => {
  dtab.style.borderColor = 'gray';
  dtab.style.borderBottomColor = bgcolor;
  dtab.style.background = 'darkgray';
  inputs.forEach(input => {
    input.style.display = 'block';
  });
  const dView = document.querySelector('.data_view');
  if (dView) {
    dView.style.display = 'none';
  }
  stab.style.borderColor = bgcolor;
  stab.style.background = 'skyblue';
});

// -------------------- Data Loading and UI Rendering --------------------

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
  });

  // Create a container for the data entries
  const dataContainer = document.createElement('div');
  dataContainer.classList.add('data_view');
  document.querySelector('#view').appendChild(dataContainer);

  // Render each data point
  data.forEach((d, i) => {
    const dataDiv = document.createElement('div');
    dataDiv.classList.add('data-entry'); // Add a class for styling

    const dPoints = document.createElement('p');
    dPoints.innerHTML = `Index: ${i + 1}<br>Date: ${d3.timeFormat("%Y-%m-%d")(d.date)}<br>Value: ${d.value}<br>Chart Value: ${d.relativeValue.toFixed(2)}`;
    dataDiv.appendChild(dPoints);

    dataContainer.appendChild(dataDiv);
  });

  // -------------------- SVG Code --------------------
  
  const margin = { top: 20, right: 30, bottom: 50, left: 50 };
  const width = window.innerWidth * 0.8 - margin.left - margin.right;
  const height = window.innerHeight * 0.8 - margin.top - margin.bottom;

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
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  // Add the y-axis
  svg.append("g").call(d3.axisLeft(y));

  // Add the line path
  svg.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2)
    .attr("d", line);

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
  }

  function mouseoutFunc() {
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

