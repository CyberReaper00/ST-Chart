// =================== Data Loading and UI Rendering ===================

/* ====== DO NOT REMOVE STRICT MODE ====>> */ "use strict";

class fn {
    // This is used for placing debug logs or any other console command
    static err(str, type='log') {
	console[type](str);
	alert(`${type.toUpperCase()}: ${str}`);
    }

    // This is for rounding integers and floats to any decimal place
    static round(val, precision) {
	return Number(val.toFixed(precision));
    }

    static select(element, new_var = null, var_obj = vars) {
	var_obj[new_var] = document.querySelector(element);
	return var_obj[new_var];
    }

}

const vars = {};

function all_changes() {
    const set_root = document.documentElement.style;

    const inputs = [
	fn.select('.r_val', 'point_rad'),
	fn.select('.xy_val', 'xy_line'),
	fn.select('.ln_clr', 'chart_line'),
	fn.select('.init_val', 'init_val'),
	fn.select('.rfr_val', 'rfr_val')
    ];

    // Add the 'blur' event listener for each input
    inputs.forEach(input => {
	input.addEventListener('blur', function() {
	    vars.point_rad;
	    vars.xy_line;
	    vars.chart_line;
	    vars.init_val;

	    set_root.setProperty('--r-size', vars.point_rad.value);
	    set_root.setProperty('--xy-color', vars.xy_line.value);
	    set_root.setProperty('--bgchart', vars.chart_line.value);

	});
    });
}

all_changes();

function replace() {
    const selection = [
	fn.select('.main_svg', 'get_svg'),
	fn.select('.data_view', 'd_view'),
	fn.select('.calc_view', 'c_view')
    ]

    selection.forEach((i) => {
	i.innerHTML = '';
    });
}

replace();

const mappings = {
    'a': 0,
    's': 1,
    'd': 2
};

document.addEventListener('keydown', function(event) {
    const tabs = document.querySelectorAll("#view .tab");

    if (mappings.hasOwnProperty(event.key)) {
	const tab_index = mappings[event.key];
	if (tab_index >= 0 && tab_index < tabs.length) {
	    tabs.forEach(tab => tab.style.display = 'none');
	    tabs[tab_index].style.display = 'block';
	}
    }
});

function get_file_contents(file_input_id) {
    return new Promise((resolve, reject) => {
	fn.select(file_input_id, 'file_input');
	const file = vars.file_input.files[0];

	if (!file) {
	    reject('No file selected');
	    return;
	}

	const reader = new FileReader();
	reader.onload = function(e) {
	    resolve(e.target.result);
	};
	reader.onerror = function() {
	    reject('Error reading the file');
	};
	reader.readAsText(file);
    });
}

fn.select('.file_input').addEventListener('change', function() {
    get_file_contents('.file_input').then((file_contents) => {

	// Parse the date and time
	const parseDate = d3.timeParse("%d-%m-%y | %H:%M");

	// Load the data from the TSV file
	try {
	    const datas = d3.csvParse(file_contents);

	    // Checking if there is any data in the file
	    if (!datas || datas.length === 0) {
		fn.err(`No data loaded from file: ${db_name}`, 'error');
		return;
	    }

	    // ================ Placing initial value that has been given by user ================

	    // Getting the first date and decrementing by 1
	    const first_date = datas[0].date;
	    const fd_parts = first_date.split('-');
	    const fd_day = +fd_parts[0];
	    const new_day = fd_day - 1;

	    // Creating new date ==> new_fd to use as the first value in the dataset
	    const new_fd = `${new_day}-${fd_parts.slice(1).join('-')}`;

	    const first_val = {
		date: new_fd,
		value: vars.init_val.value
	    };

	    // Placing new data point at the beginning of the dataset
	    const data = [first_val, ...datas];

	    // ================ Placing initial value that has been given by user ================

	    // ================ Getting chart info from the dataset ================

	    let chart_val = [];

	    // Extract token data only from end of file
	    // Start from the last index
	    for (let i = data.length - 1; i >= data.length - 3; i--) {
		// Exit loop once a match is found
		JSON.stringify(data[i]).includes('#') ? chart_val.push(data[i]) : '';
	    }

	    const user_val = chart_val[0].value;
	    const asset_name = chart_val[1].date.slice(1);
	    const time_frame = chart_val[1].value;

	    // Place token data on screen
	    fn.select('.info').innerHTML = `
		[ ${asset_name} ] [ ${time_frame} ]<br>
		${user_val}
	    `;

	    data.splice(-2);
	    // ================ Getting chart info from the dataset ================

	    // ================ Getting data by month and doing all financial calculations ================

	    // Extracting data by month and its corresponding values
	    let parsed_data = data.map(row => {
		let date_parts = row['date'].split(' ')[0].split('-');
		let value = row['value'];
		return {
		    day: parseInt(date_parts[0]),
		    month: parseInt(date_parts[1]),
		    year: parseInt(date_parts[2]),
		    value: parseFloat(value)
		};
	    });

	    // Defining monthly arrays
	    let monthly_data = {
		jan: [], feb: [], mar: [], apr: [], may: [], jun: [], jul: [], aug: [], sep: [], oct: [], nov: [], dec: []
	    };

	    // Defining month names to find the correct index in monthly data
	    let month_names = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

	    // Placing the extracted data into their respective variables
	    parsed_data.slice(1).forEach(entry => {
		let month_index = entry.month - 1; // Converting month (1-12) into index (0-11)
		let month_name = month_names[month_index];
		if (monthly_data[month_name]) {
		    monthly_data[month_name].push(entry.value);
		} else {
		    fn.err(`Invalid month name: ${month_name} for entry ${entry}`, 'warn');
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
	    let rfr = vars.rfr_val.value; // risk free rate

	    for (let month in monthly_data) {
		let values = monthly_data[month];
		if (values.length > 0) {
		    let average = get_avg(values);
		    let st_dev = get_sd(values, average);
		    let pnl = values.reduce((a,b) => a+b, 0); // Sum of all values for PnL
		    let sh_ra = st_dev !== 0 ? (average - rfr) / st_dev : 0;

		    results[month] = {
			avg: fn.round(average, 4),
			sd: fn.round(st_dev, 4),
			pnl: fn.round(pnl, 4),
			sr: fn.round(sh_ra, 4)
		    };
		}
	    }

	    // ================ Automatically setting the size for the chart ===============

	    // Format the data and calculate relative values
	    let hVal = 0;
	    data.forEach((d, i) => {
		d.date = parseDate(d.date);
		d.value = +d.value; // Ensure this is properly parsed as a number

		if (isNaN(d.value)) fn.err(`Invalid value at index ${i}`, 'warn');

		if (i > 0) {
		    d.relative_value = data[i - 1].relative_value + (data[i - 1].relative_value * (d.value / 100));
		} else {
		    d.relative_value = d.value;
		}

		// Assign highest value in dataset to hVal
		if (hVal < d.relative_value) hVal = d.relative_value;

		// Assign unique ID for each data point
		d.id = i; 
	    });

	    // ================ Automatically setting the size for the chart ===============

	    fn.select('.data_view', 'dataContainer');

	    // Render each data point
	    data.forEach((d, i) => {
		const dataDiv = document.createElement('div');
		dataDiv.classList.add('data-entry');
		dataDiv.setAttribute('data-id', d.id); // Set a data-id attribute for easy reference

		const dPoints = document.createElement('p');
		dPoints.innerHTML = `
	    Index: ${i + 1}<br>
	    Date: ${d3.timeFormat("%d-%m-%y | %H:%M")(d.date)}<br>
	    Value: ${d.value}<br>
	    Chart Value: ${d.relative_value.toFixed(2)}
	`;

		dataDiv.appendChild(dPoints);
		vars.dataContainer.appendChild(dataDiv);
	    });

	    // ============== Get the container for the data entries ==============

	    // ============== Get the container for the calculations ==============

	    fn.select('.calc_view', 'container');

	    // Iterate over months in the results object
	    Object.keys(results).forEach((month, i) => {
		const result = results[month];

		// Create a div for the month
		const data_div = document.createElement('div');
		data_div.classList.add('data-entry');
		data_div.classList.add('data-id', `month-${i}`);

		// Add the points to the div
		const d_points = document.createElement('p');
		d_points.innerHTML = `
	    Month: ${month.toUpperCase()}<br>
	    PNL: ${result.pnl}<br>
	    AVG: ${result.avg}<br>
	    SD: ${result.sd}<br>
	    SR: ${result.sr}
	`;

		data_div.appendChild(d_points);
		vars.container.appendChild(data_div);
	    });

	    // ============== Get the container for the calculations ==============

	    // =================== SVG Code ===================

	    const margin = { top: 20, right: 30, bottom: 0, left: 50 };
	    const width = window.innerWidth * 0.8 - margin.left - margin.right;
	    const height = window.innerHeight * 0.75 - margin.top - margin.bottom;

	    const svg = d3.select("svg")
		.append("g")
		.attr("transform", `translate(${margin.left},${margin.top})`);

	    // Define scales
	    const x = d3.scaleTime().range([0, width]);
	    const y = d3.scaleLinear().range([height, 0]);

	    // Define the line generator
	    const line = d3.line()
		.x(d => x(d.date))
		.y(d => y(d.relative_value));

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
		.attr("cy", d => y(d.relative_value))
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
		    .text(`Chart: ${d.relative_value.toFixed(2)}`);

		// Highlight the corresponding div
		fn.select(`.data-entry[data-id='${d.id}']`, 'div');
		if (vars.div) vars.div.style.backgroundColor = '#00000066'; // Highlight the div
	    }

	    function mouseoutFunc(event, d) {
		svg.selectAll(".tooltip-group").remove();

		// Reset the corresponding div's background color
		fn.select(`.data-entry[data-id='${d.id}']`, 'rm_div');
		if (vars.rm_div) vars.rm_div.style.backgroundColor = ''; // Reset the div's background color
	    }

	    // Add event listeners to div elements
	    document.querySelectorAll('.data-entry').forEach(div => {
		div.addEventListener('mouseover', function () {
		    const pointId = this.getAttribute('data-id');
		    const dataPoint = data[pointId]; // Access the data for the corresponding point

		    // Set tooltip content
		    tooltip.html(`
		<strong>Value:</strong> ${dataPoint.value}<br>
		<strong>Chart:</strong> ${dataPoint.relative_value.toFixed(2)}
	    `);

		    // Show the tooltip at a fixed position (e.g., top-right corner)
		    tooltip
			.style('top', '100px') // Fixed Y position
			.style('left', '70px') // Fixed X position
			.style('visibility', 'visible');

		    // Highlight the corresponding dot
		    d3.select(`.dot_circ[data-id='${pointId}']`).style('fill', 'orange');
		});

		div.addEventListener('mouseout', function() {
		    tooltip.style('visibility', 'hidden'); // Hide the tooltip
		    const pointId = this.getAttribute('data-id');
		    d3.select(`.dot_circ[data-id='${pointId}']`).style('fill', '');
		});

	    });

	} catch (error) {
	    fn.err(`Error parsing the CSV data: ${error}`, 'error');
	}

    }).catch(error => {
	fn.err(`Error loading the data: ${error}`, 'error');
    });
});
