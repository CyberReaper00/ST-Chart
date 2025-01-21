// -------------------- Data Loading and UI Rendering --------------------
// if you see any lines with ==> // err(...) <== then it means that is a debug message, just remove the // before it and it will send debug messages to the console and you can see if the data is being parsed properly

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

function err(str, type='log') {
    console[type](str);
}

function round(val, precision) {
    return Number(val.toFixed(precision));
}

function all_changes() {
    const save = document.querySelector('.sbutton');

    save.addEventListener('click', function() {
	const set_root = document.documentElement.style;
	const point_rad = document.querySelector('.r_val').value;
	const xy_line = document.querySelector('.xy_val').value;
	const chart_line = document.querySelector('.ln_clr').value;

	set_root.setProperty('--r-size', point_rad);
	set_root.setProperty('--xy-color', xy_line);
	set_root.setProperty('--bgchart', chart_line);

    })
}

const file_info = prompt(`
    Please enter file name and initial value like this
    filename-value
    `)

let file_parts = file_info.split('-');
let file_name = file_parts[0];
let init_val = parseFloat(file_parts[1]);
const db_name = `${file_name}.csv`;

/* err(`
    file_info: ${file_info}
    file_parts: ${file_parts}
    file_name: ${file_name}
    init_val: ${init_val}
    db_name: ${db_name}
`);

*/

all_changes();

// Parse the date and time
const parseDate = d3.timeParse("%d-%m-%y | %H:%M");

// Load the data from the TSV file
d3.csv(db_name).then(datas => {

    // Checking if there is any data in the file
    if (!datas || datas.length === 0) {
	err(`No data loaded from file: ${db_name}`, 'error');
	return;
    }

    // Getting the first date and decrementing by 1
    const first_date = datas[0].date;
    // err(`first_date: ${first_date}`);
    fd_parts = first_date.split('-');
    // err(`fd_parts: ${fd_parts}`);
    fd_day = +fd_parts[0];
    // err(`fd_day: ${fd_day}`);
    new_day = fd_day - 1;
    // err(`new_day: ${new_day}`);

    // Creating new date ==> new_fd to use as the first value in the dataset
    new_fd = `${new_day}-${fd_parts.slice(1).join('-')}`;
    // err(`new_fd: ${new_fd}`);

    const first_val = {
	date: new_fd,
	value: init_val
    };
    // err(`first_val: ${JSON.stringify(first_val)}`);

    // Placing new data point at the beginning of the dataset
    const data = [first_val, ...datas];

    // err(`datas: ${JSON.stringify(datas)}`);
    // err(`data: ${JSON.stringify(data)}`);

    // Extract token data from end of file
    tkn_val = data[data.length - 2]
    ma_val = data[data.length - 1]

    asset_name = tkn_val.date;
    time_frame = tkn_val.value;

    user_val = ma_val.value;

    // Extracting data by month and its corresponding values
    let parsed_data = data.map(row => {
	let date_parts = row['date'].split(' ')[0].split('-');
	let value = row['value'];
	// err(`Date Parts: ${date_parts}`);
	// err(`Row: ${value}`);
	return {
	    day: parseInt(date_parts[0]),
	    month: parseInt(date_parts[1]),
	    year: parseInt(date_parts[2]),
	    value: parseFloat(value)
	};
    });
    // err(`Parsed Data: ${parsed_data}`);
    // Defining monthly arrays
    let monthly_data = {
	jan: [], feb: [], mar: [], apr: [], may: [], jun: [], jul: [], aug: [], sep: [], oct: [], nov: [], dec: []
    };

    // Defining month names to find the correct index in monthly data
    let month_names = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

    // Placing the extracted data into their respective variables
    parsed_data.forEach(entry => {
	let month_index = entry.month - 1; // Converting month (1-12) into index (0-11)
	let month_name = month_names[month_index];
	if (monthly_data[month_name]) {
	    monthly_data[month_name].push(entry.value);
	} else {
	    err(`Invalid month name: ${month_name} for entry ${entry}`, 'warn');
	}
    });

    // Function to get averages
    function get_avg(arr) {
	let sum = arr.reduce((a,b) => a+b, 0);
	return sum / arr.length;
    }

    // Function to get the standard deviation
    function get_sd(arr, avg) {
	let sq_diffs = arr.map(value => Math.pow(value - avg, 2));
	let avg_sq_diff = sq_diffs.reduce((a,b) => a+b, 0) / (arr.length - 1);
	return Math.sqrt(avg_sq_diff);
    }

    let results = {};
    let rfr = 0.02; // risk free rate

    for (let month in monthly_data) {
	let values = monthly_data[month];
	if (values.length > 0) {
	    let average = get_avg(values);
	    let st_dev = get_sd(values, average);
	    let pnl = values.reduce((a,b) => a+b, 0); // Sum of all values for PnL
	    let sh_ra = st_dev !== 0 ? (pnl - rfr) / st_dev : 0;

	    results[month] = {
		avg: round(average, 4),
		sd: round(st_dev, 4),
		pnl: round(pnl, 4),
		sr: round(sh_ra, 4)
	    };
	}
    }
    // err(`Results: ${results}`);

    new_rst = '';
    const months = Object.keys(results);

    for (let i=0; i < months.length; i++) {
	let month = months[i];
	let sd = results[month].sd;
	let sr = results[month].sr;

	if (i < months.length - 1) {
	    new_rst += `${month.toUpperCase()} [ Sd: ${sd} | Sr: ${sr} ] - `;
	} else {
	    new_rst += `${month.toUpperCase()} [ Sd: ${sd} | Sr: ${sr} ]`;
	}
    }

    // Place token data on screen
    document.querySelector('.main_head').innerHTML += `
	[${asset_name}] [${time_frame}]<br>
	${user_val}<br>
	${new_rst}
    `;

    // Format the data and calculate relative values
    let hVal = 0;
    data.forEach((d, i) => {
	d.date = parseDate(d.date);
	d.value = +d.value; // Ensure this is properly parsed as a number

	if (isNaN(d.value)) err(`Invalid value at index ${i}`, 'warn');

	if (i > 0) {
	    d.relativeValue = data[i - 1].relativeValue + (data[i - 1].relativeValue * (d.value / 100));
	} else {
	    d.relativeValue = d.value;
	}

	// Assign highest value in dataset to hVal
	if (hVal < d.relativeValue) hVal = d.relativeValue;

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
	dPoints.innerHTML = `Index: ${i + 1}<br>Date: ${d3.timeFormat("%d-%m-%y | %H:%M")(d.date)}<br>Value: ${d.value}<br>Chart Value: ${d.relativeValue.toFixed(2)}`;

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
