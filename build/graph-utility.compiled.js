(() => {
// anp-09-graph-utility/lib/utils/markdownParser.js
function removeHtmlComments(content) {
  return content.replace(/<!--[\s\S]*?-->/g, "").trim();
}
function removeEmptyRowsAndColumns(table) {
  const rows = table.split("\n").filter((row) => row.trim().startsWith("|"));
  const filteredRows = rows.filter((row) => {
    const cells = row.split("|").slice(1, -1);
    const hasContent = cells.some((cell) => cell.trim() !== "");
    return hasContent;
  });
  if (filteredRows.length === 0) {
    return "";
  }
  const columnCount = filteredRows[0].split("|").length - 2;
  const nonEmptyColumns = Array.from(
    { length: columnCount },
    (_, colIndex) => filteredRows.some((row) => row.split("|")[colIndex + 1].trim() !== "")
  );
  const cleanedRows = filteredRows.map((row) => {
    const cells = row.split("|").slice(1, -1);
    const filteredCells = cells.filter((_, i) => nonEmptyColumns[i]);
    return `| ${filteredCells.join(" | ")} |`;
  });
  return cleanedRows.join("\n");
}
function extractTablesFromMarkdown(markdown) {
  const lines = markdown.split("\n");
  let tableCount = 0;
  let inTable = false;
  const tables = [];
  let currentTable = [];
  lines.forEach((line) => {
    if (line.trim().startsWith("|")) {
      if (!inTable) {
        tableCount++;
        if (tableCount > 1) {
          tables.push("---");
        }
        tables.push(`# Table ${tableCount}
`);
        inTable = true;
      }
      if (currentTable.length === 0 && line.split("|").every((cell) => cell.trim() === "")) {
      }
      currentTable.push(line);
    } else if (inTable) {
      inTable = false;
      const tableContent = currentTable.join("\n");
      tables.push(tableContent);
      tables.push("");
      currentTable = [];
    }
  });
  if (currentTable.length > 0) {
    const tableContent = currentTable.join("\n");
    tables.push(removeEmptyRowsAndColumns(tableContent));
  }
  const processedContent = tables.join("\n\n");
  return removeHtmlComments(processedContent);
}

// anp-09-graph-utility/lib/utils/tableTranspose.js
function transposeArray(array) {
  if (!array || array.length === 0) return [];
  return array[0].map((_, colIndex) => array.map((row) => row[colIndex]));
}
function transposeMarkdownTables(content) {
  const sections = content.split("---");
  const processedSections = sections.map((section) => {
    const lines = section.trim().split("\n");
    if (lines.length < 3) return section;
    const header = lines[0].trim();
    const transposedHeader = header + " (Transposed)";
    const tableRows = lines.slice(3).map((row) => row.split("|").slice(1, -1).map((cell) => cell.trim()));
    if (tableRows.length === 0 || tableRows[0].length === 0) {
      return section;
    }
    const restRows = tableRows.slice(2);
    const transposedRows = transposeArray(restRows);
    if (transposedRows.length === 0) return section;
    const columnCount = transposedRows[0].length;
    const firstRow = "| " + Array(columnCount).fill(" ").join(" | ") + " |";
    const separatorRow = "| " + Array(columnCount).fill("-").join(" | ") + " |";
    const transposedTable = [
      firstRow,
      separatorRow,
      ...transposedRows.map((row) => "| " + row.join(" | ") + " |")
    ].join("\n");
    return `${transposedHeader}


${transposedTable}`;
  });
  return processedSections.join("\n\n---\n\n");
}

// anp-09-graph-utility/lib/utils/csvConverter.js
function convertMarkdownToCSV(content) {
  const csvLines = content.split("\n").map((line) => {
    const cleanedLine = line.replace(/^#+\s*/, "");
    return cleanedLine;
  }).filter((line) => {
    return line.includes("|");
  }).map((line) => {
    const trimmedLine = line.trim().replace(/^\|/, "").replace(/\|$/, "").trim();
    return trimmedLine.split("|").map((cell) => `"${cell.trim()}"`).join(",");
  }).filter((line) => line !== "");
  return csvLines.join("\n");
}

// anp-09-graph-utility/lib/utils/dateTime.js
function getCurrentDateTime() {
  const now = /* @__PURE__ */ new Date();
  const YYMMDD = now.toLocaleDateString("en-GB").split("/").reverse().join("");
  const HHMMSS = now.toLocaleTimeString("en-GB", { hour12: false }).replace(/:/g, "");
  return { YYMMDD, HHMMSS };
}

// anp-09-graph-utility/lib/ui/downloadHelper.js
function downloadTextFile(resultText, filename, YYMMDD, HHMMSS, noteUUID) {
  let blob = new Blob([resultText], { type: "text/plain;charset=utf-8" });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${YYMMDD}_${HHMMSS}_${noteUUID}_${filename}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// anp-09-graph-utility/lib/ui/htmlTemplate.js
function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function escapeJS(str) {
  if (!str) return "";
  return String(str).replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
}
function buildChartHtml({ cleanedContent, transposeContent, noteName, noteTags, noteUUID }) {
  const safeName = escapeHTML(noteName);
  const safeTags = escapeHTML(noteTags);
  const safeUUID = escapeHTML(noteUUID);
  const safeCleaned = escapeJS(cleanedContent);
  const safeTransposed = escapeJS(transposeContent);
  return `
<!DOCTYPE html>
<html lang="en">
   <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Advanced Charts with Markdown Data</title>
      <!-- Include Chart.js -->
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <!-- Include chartjs-chart-box-plot -->
      <!-- <script src="https://cdn.jsdelivr.net/npm/chartjs-chart-box-plot@1.1.2/dist/chartjs-chart-box-plot.min.js"></script> -->
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
      <style>
         body {
         display: flex;
         justify-content: center;
         align-items: center;
         height: 100vh;
         margin: 0;
         font-family: Arial, sans-serif;
         }
         .container {
         display: flex;
         width: 90%;
         max-width: 1600px;
         height: 80%;
         font-size: 13px;
         background-color: rgb(245,245,245);
         }
         .chart-options {
         flex: 1;
         display: flex;
         flex-direction: column;
         align-items: flex-start;
         padding: 10px;
         box-shadow: 2px 0 5px rgba(0,0,0,0.1);
         }
         .chart-options label {
         margin-bottom: 10px;
         }
         .axis-select {
         display: flex;
         flex-direction: column;
         margin-top: 20px;
         }
         .chart-container {
         flex: 5;
         display: flex;
         justify-content: center;
         align-items: center;
         padding: 10px;
         }
         .chart-container canvas {
         width: 100%;
         height: 100%;
         }
         .axis-dropdowns {
         flex: 1;
         display: flex;
         flex-direction: column;
         align-items: flex-center;
         padding: 10px;
         box-shadow: 2px 2px 5px rgba(0,0,0,0.1);
         }
         .axis-dropdowns select {
         margin-bottom: 10px;
         }
         .info-button {
         font-size: 12px; /* Adjust the size as needed */
         padding: 0; /* Optional: remove default padding */
         border: none; /* Optional: remove default border */
         background: transparent; /* Optional: remove default background */
         }
         .tooltip {
         position: relative;
         display: inline-block;
         cursor: pointer;
         font-size: 12px; /* Adjust size of the info icon */
         }
         .tooltip .tooltiptext {
         visibility: hidden;
         width: 200px; /* Adjust width as needed */
         background-color: #555; /* Background color of the tooltip */
         color: #fff; /* Text color */
         text-align: center;
         border-radius: 5px;
         padding: 5px;
         position: absolute;
         z-index: 1;
         bottom: 125%; /* Position above the info icon */
         left: 50%;
         margin-left: -100px; /* Center the tooltip */
         opacity: 0;
         transition: opacity 0.3s;
         }
         .tooltip:hover .tooltiptext {
         visibility: visible;
         opacity: 1;
         }
		/* Footer styles */
		footer {
			position: fixed; /* Fixes the footer at the bottom */
			left: 0; /* Aligns the footer to the far left */
			bottom: 0; /* Aligns the footer to the bottom */
			width: 100%; /* Makes the footer span the full width of the page */
			padding: 10px; /* Adds some padding */
			text-align: left; /* Aligns text to the left */
			margin: 0; /* Removes default margins */
			background: none; /* Removes any background color */
			color: #000; /* Sets text color (adjust as needed) */
			font-size: 14px; /* Adjusts font size */
		}

		footer a {
			color: #ffeb3b; /* Adjust color if needed */
			text-decoration: none;
		}

		footer a:hover {
			text-decoration: underline;
		}
      </style>
   </head>
   <body>
      <div class="container">
         <div class="chart-options">
            <center>Simple Charts:</center>
            <br>
            <label>
            <input type="radio" name="chartType" value="line" checked> Line Chart
            <span class="tooltip">
            <i class="fa fa-info-circle" style="color:blue"></i>
            <span class="tooltiptext">A Line Chart shows trends over time or categories with lines connecting data points.<hr>Note: Select Dimensions in X-Axis & Measures in Y-Axis.</span>
            </span>
            </label>
            <label>
            <input type="radio" name="chartType" value="area" checked> Area Chart
            <span class="tooltip">
            <i class="fa fa-info-circle" style="color:blue"></i>
            <span class="tooltiptext">A Area Chart shows trends over time or categories with lines connecting data points, with space under the line filled.<hr>Note: Select Dimensions in X-Axis & Measures in Y-Axis.</span>
            </span>
            </label>
            <!--<label>
            <input type="radio" name="chartType" value="boxplot" checked> Box Plot Chart
            <span class="tooltip">
            <i class="fa fa-info-circle" style="color:blue"></i>
            <span class="tooltiptext">A Area Chart shows trends over time or categories with lines connecting data points, with space under the line filled.<hr>Note: Select Dimensions in X-Axis & Measures in Y-Axis.</span>
            </span>
            </label> -->
            <label>
            <input type="radio" name="chartType" value="bar"> Bar Chart
            <span class="tooltip">
            <i class="fa fa-info-circle" style="color:blue"></i>
            <span class="tooltiptext">A Bar Chart compares quantities across different categories with rectangular bars.<hr>Note: Select Dimensions/Measures in X-Axis & Measures in Y-Axis.</span>
            </span>
            </label>
			<label>
            <input type="radio" name="chartType" value="histogram"> Histogram
            <span class="tooltip">
            <i class="fa fa-info-circle" style="color:blue"></i>
            <span class="tooltiptext">A Histogram shows the distribution of a dataset with bars representing frequency of data ranges.<hr>Note: Select Dimensions/Measures in X-Axis & Measures in Y-Axis.</span>
            </span>
            </label>
            <label>
            <input type="radio" name="chartType" value="pie"> Pie Chart
            <span class="tooltip">
            <i class="fa fa-info-circle" style="color:blue"></i>
            <span class="tooltiptext">A Pie Chart displays proportions of a whole with slices of a circle.<hr>Note: Select Dimensions/Measures in X-Axis & Measures in Y-Axis.</span>
            </span>
            </label>
            </label>
            <label>
            <input type="radio" name="chartType" value="doughnut"> Doughnut Chart
            <span class="tooltip">
            <i class="fa fa-info-circle" style="color:blue"></i>
            <span class="tooltiptext">A Doughnut charts are used to show the proportions of categorical data, with the size of each piece representing the proportion of each category.<hr>Note: Select Dimensions/Measures in X-Axis & Measures in Y-Axis.</span>
            </span>
            </label>
            <label>
            <input type="radio" name="chartType" value="polarArea"> Polar Area Chart
            <span class="tooltip">
            <i class="fa fa-info-circle" style="color:blue"></i>
            <span class="tooltiptext">A Polar area charts are similar to pie charts, but each segment has the same angle - the radius of the segment differs depending on the value.<hr>Note: Select Dimensions/Measures in X-Axis & Measures in Y-Axis.</span>
            </span>
            </label>
            <label>
            <input type="radio" name="chartType" value="waterfall"> Waterfall Chart
            <span class="tooltip">
            <i class="fa fa-info-circle" style="color:blue"></i>
            <span class="tooltiptext">A Waterfall Chart displays cumulative values with bars showing the impact of incremental changes.<hr>Note: Select Dimensions/Measures in X-Axis & Measures in Y-Axis.</span>
            </span>
            </label>
            <br>
            <center>Advanced Charts:</center>
            <br>
            <label>
            <input type="radio" name="chartType" value="mixed"> Mixed Chart
            <span class="tooltip">
            <i class="fa fa-info-circle" style="color:blue"></i>
            <span class="tooltiptext">A Mixed Chart combines a bar chart with a line chart to show the relative importance of two different factors.<hr>Note: Select Dimensions/Measures in X-Axis (Line) & Measures in Y-Axis (Bars).</span>
            </span>
            </label>
            <label>
            <input type="radio" name="chartType" value="pareto"> Pareto Chart
            <span class="tooltip">
            <i class="fa fa-info-circle" style="color:blue"></i>
            <span class="tooltiptext">A Pareto Chart combines a bar chart with a line chart to show the relative importance of different factors.<hr>Note: Select Dimensions/Measures in X-Axis & Measures in Y-Axis.</span>
            </span>
            </label>
            <label>
            <input type="radio" name="chartType" value="scatter"> Scatter Plot
            <span class="tooltip">
            <i class="fa fa-info-circle" style="color:blue"></i>
            <span class="tooltiptext">A Scatter Plot shows the relationship between two numerical variables with points plotted on an X-Y axis.<hr>Note: Select Measures in X-Axis & Measures in Y-Axis.</span>
            </span>
            </label>
            <label>
            <input type="radio" name="chartType" value="bubble"> 3D Bubble Chart
            <span class="tooltip">
            <i class="fa fa-info-circle" style="color:blue"></i>
            <span class="tooltiptext">A 3D Bubble Chart represents three variables with bubbles of varying size, and points plotted on an X-Y axis.<hr>Note: Select Dimensions/Measures in X-Axis & Measures in Y-Axis & Measures in Z-Axis.</span>
            </span>
            </label>
            <label>
            <input type="radio" name="chartType" value="radar"> 3D Radar Chart
            <span class="tooltip">
            <i class="fa fa-info-circle" style="color:blue"></i>
            <span class="tooltiptext">A Radar chart displays multivariate data stacked at an axis with the same central point.<hr>Note: Select Dimensions/Measures in X-Axis & Measures in Y-Axis & Measures in Z-Axis.</span>
            </span>
            </label>

			</div>
         <div class="chart-container">
            <canvas id="myChart" width="400" height="200"></canvas>
         </div>
         <div class="axis-dropdowns">
            <div class="axis-select">
               <br><br>
               <label for="tableSelect"> Select Table:
               <span class="tooltip">
               <i class="fa fa-info-circle" style="color:blue"></i>
               <span class="tooltiptext">Lists all the Tables in the Current Note!<hr>If the data is in Row Format, then use (Transposed)</span>
               </span>
               </label>
               <select id="tableSelect" multiple></select>
               <br>
               <label for="xAxisSelect"> Select X-Axis:
               <span class="tooltip">
               <i class="fa fa-info-circle" style="color:blue"></i>
               <span class="tooltiptext">Horizontal Line / Axis!</span>
               </span>
               </label>
               <select id="xAxisSelect" multiple></select>
               <label for="yAxisSelect"> Select Y-Axis:
               <span class="tooltip">
               <i class="fa fa-info-circle" style="color:blue"></i>
               <span class="tooltiptext">Vertical Line / Axis!</span>
               </span>
               </label>
               <select id="yAxisSelect" multiple></select>
               <label for="zAxisSelect"> Select Z-Axis:
               <span class="tooltip">
               <i class="fa fa-info-circle" style="color:blue"></i>
               <span class="tooltiptext">Depth / Size!</span>
               </span>
               </label>
               <select id="zAxisSelect" multiple></select>
               <br>
			   <label> Note Name:
               <span class="tooltip">
               <i class="fa fa-info-circle" style="color:blue"></i>
               <span class="tooltiptext">${safeName}</span>
               </span>
			   </label>
			   <label> Note Tags:
               <span class="tooltip">
               <i class="fa fa-info-circle" style="color:blue"></i>
               <span class="tooltiptext">${safeTags}</span>
               </span>
			   </label>
			   <label> Note UUID:
               <span class="tooltip">
               <i class="fa fa-info-circle" style="color:blue"></i>
               <span class="tooltiptext">${safeUUID}</span>
               </span>
			   </label>
			   <br>
				<label for="easingSelect"> Select Easing Function:
					<span class="tooltip">
						<i class="fa fa-info-circle" style="color:blue"></i>
						<span class="tooltiptext">Choose how the animation progresses over time.</span>
					</span>
				</label>
				<select id="easingSelect">
					<option value="linear">Linear</option>
					<option value="easeInQuad">Ease In Quad</option>
					<option value="easeOutQuad">Ease Out Quad</option>
					<option value="easeInOutQuad">Ease In Out Quad</option>
					<option value="easeInCubic">Ease In Cubic</option>
					<option value="easeOutCubic">Ease Out Cubic</option>
					<option value="easeInOutCubic">Ease In Out Cubic</option>
					<option value="easeInQuart">Ease In Quart</option>
					<option value="easeOutQuart">Ease Out Quart</option>
					<option value="easeInOutQuart">Ease In Out Quart</option>
					<option value="easeInQuint">Ease In Quint</option>
					<option value="easeOutQuint">Ease Out Quint</option>
					<option value="easeInOutQuint">Ease In Out Quint</option>
					<option value="easeInBounce">Ease In Bounce</option>
					<option value="easeOutBounce">Ease Out Bounce</option>
					<option value="easeInOutBounce">Ease In Out Bounce</option>
					<option value="easeInElastic">Ease In Elastic</option>
					<option value="easeOutElastic">Ease Out Elastic</option>
					<option value="easeInOutElastic">Ease In Out Elastic</option>
					<option value="easeInBack">Ease In Back</option>
					<option value="easeOutBack">Ease Out Back</option>
					<option value="easeInOutBack">Ease In Out Back</option>
				</select>
            </div>
         </div>
      </div>
	<footer>
		<p>&copy; BKK 2024 | <a href="https://public.amplenote.com/sDBcbB/graph-utility" target="_blank" style="color: #ffeb3b; text-decoration: none;">Open Source</a></p>
	</footer>
      <script>
	  
        _loadLibrary("https://cdn.jsdelivr.net/npm/chart.js").then(() => {
			
         // Sample markdown data
         const markdownData = \`
${safeCleaned}

---

${safeTransposed}
\`;
         
         // Function to parse the markdown data
		function parseMarkdownTables(markdown) {
			// Split the markdown content into sections based on the '---' delimiter
			const sections = markdown.split(/\\n---\\n/).filter(section => section.trim());
			
			// Extract tables from each section
			return sections.map(section => {
				const lines = section.split('\\n').filter(line => line.trim());
				
				// Assuming the first line is the table title
				const title = lines[0].replace(/^#\\s*/, '');  // Remove '#' and any leading space
				
				// Get the table data (excluding title line)
				const tableData = lines.slice(1).join('\\n').trim();
				
				return { title, tableData };
			});
		}

		// Parse the markdown data
		const tablesz = parseMarkdownTables(markdownData);
		const tables = tablesz.map(table => table.tableData);

		// Get the select element
		const tableSelect = document.getElementById('tableSelect');

		// Populate the select element with table titles
		tablesz.forEach((table, index) => {
			const option = document.createElement('option');
			option.value = index;
			option.textContent = table.title;
			tableSelect.appendChild(option);
		});
         
         // console.log("tables:", tables);
         let markdownTable = tables[0];
         
         // Function to parse a markdown table
         function parseMarkdownTable(mdTable) {
             if (!mdTable) {
                 console.error("Markdown table is undefined or empty.");
                 return { headers: [], data: [] };
             }
         
             const rows = mdTable.trim().split('\\n');
             if (rows.length < 3) {
                 console.error("Insufficient rows in markdown table to parse headers and data.");
                 return { headers: [], data: [] };
             }
         
             const headers = rows[2]?.split('|').slice(1, -1).map(header => header.trim()) || [];
             const data = rows.slice(3).map(row => {
                 const cells = row.split('|').slice(1, -1).map(cell => cell.trim());
                 const rowObject = {};
                 headers.forEach((header, index) => {
                     rowObject[header] = isNaN(cells[index]) ? cells[index] : parseFloat(cells[index]);
                 });
                 return rowObject;
             });
         
             return {
                 headers,
                 data
             };
         }
         
         // Function to update axis selections and data
         function updateAxisSelectionsAndData(mdTable) {
             const { headers, data } = parseMarkdownTable(mdTable);
         
             if (!headers.length || !data.length) {
                 console.error("Failed to parse markdown table:", mdTable);
                 return { headers: [], data: [] };
             }
         
             // Preserve the current selections
             const currentXSelection = xAxisSelect.value;
             const currentYSelection = yAxisSelect.value;
             const currentZSelection = zAxisSelect.value;
         
             // Clear existing options
             xAxisSelect.innerHTML = '';
             yAxisSelect.innerHTML = '';
             zAxisSelect.innerHTML = '';
         
             headers.forEach(header => {
                 const optionX = document.createElement('option');
                 optionX.value = header;
                 optionX.text = header;
                 xAxisSelect.appendChild(optionX);
         
                 const optionY = document.createElement('option');
                 optionY.value = header;
                 optionY.text = header;
                 yAxisSelect.appendChild(optionY);
         
                 const optionZ = document.createElement('option');
                 optionZ.value = header;
                 optionZ.text = header;
                 zAxisSelect.appendChild(optionZ);
             });
         
             // Restore previous selections if they are still valid, otherwise set to default
             if (headers.includes(currentXSelection)) {
                 xAxisSelect.value = currentXSelection;
             } else if (headers.length > 0) {
                 xAxisSelect.value = headers[0];
             }
         
             if (headers.includes(currentYSelection)) {
                 yAxisSelect.value = currentYSelection;
             } else if (headers.length > 1) {
                 yAxisSelect.value = headers[1];
             }
         
             if (headers.includes(currentZSelection)) {
                 zAxisSelect.value = currentZSelection;
             } else if (headers.length > 2) {
                 zAxisSelect.value = headers[2];
             }
         
             return { headers, data };
         }
      		
         // Chart related variables
         let chartType = 'line';
         let myChart;
         const ctx = document.getElementById('myChart').getContext('2d');
		 const easingSelect = document.getElementById('easingSelect');
         		 
		// Function to create a chart
		function createChart(type, headers, data) {
			if (!data || !headers || !data.length) {
				return;
			}

			if (myChart) {
				myChart.destroy();
			}

			const xAxis = xAxisSelect.value;
			const yAxis = yAxisSelect.value;
			const zAxis = zAxisSelect.value;

			let datasets = getDatasets(type, data, xAxis, yAxis, zAxis);

			myChart = new Chart(ctx, {
				type: getChartType(type),
				data: {
					labels: type === 'boxplot' ? [] : data.map(item => item[xAxis]),
					datasets: datasets
				},
				options: {
					animation: {
						animateRotate: true,   // Enable rotation animation for 'pie' and 'doughnut'
						animateScale: true,    // Enable scaling animation for 'radar' and 'polarArea'
						duration: 500,        // Duration of the animation in milliseconds
						easing: easingSelect.value // Easing function for the animation
					},
					scales: type === 'pie' || type === 'doughnut' || type === 'radar' || type === 'polarArea' ? {} : {
						x: {
							beginAtZero: true,
							title: {
								display: true,
								text: xAxis
							}
						},
						y: {
							beginAtZero: true,
							title: {
								display: true,
								text: yAxis
							}
						}
					},
					plugins: {
						legend: {
							display: type !== 'piez' && type !== 'doughnutz',
						},
						tooltip: {
							callbacks: {
								label: (context) => {
									if (type === 'pie' || type === 'doughnut' || type === 'radar' || type === 'polarArea') {
										return \`\${context.label}: \${context.raw}\`;
									}
									return \`\${context.dataset.label}: \${context.raw}\`;
								}
							}
						}
					}
				}
			});
		}
        
         // Initial setup
         const initialData = updateAxisSelectionsAndData(markdownTable);
         if (initialData.data.length > 0) {
             createChart(chartType, initialData.headers, initialData.data);
         } else {
             console.error("No data to initialize chart");
         }
         
         // Update and render chart on table selection change
         tableSelect.addEventListener('change', () => {
             const selectedIndex = tableSelect.value;
             markdownTable = tables[selectedIndex];
         
             const { headers, data } = updateAxisSelectionsAndData(markdownTable);
             if (data.length > 0) {
                 createChart(chartType, headers, data);
             } else {
                 console.error("No data available after table selection");
             }
         });

		// Update chart animation on dropdown change
		easingSelect.addEventListener('change', () => {
			const selectedEasing = easingSelect.value;
			myChart.options.animation.easing = selectedEasing;
			createChart(chartType, initialData.headers, initialData.data);
		});
         
         // Event listeners for chart type change
         document.querySelectorAll('input[name="chartType"]').forEach(input => {
             input.addEventListener('change', (event) => {
                 chartType = event.target.value;
                 const { headers, data } = updateAxisSelectionsAndData(markdownTable);
                 createChart(chartType, headers, data);
             });
         });
         
                  // Documentation from https://www.chartjs.org/docs/latest/
                  function getDatasets(type, data, xAxis, yAxis, zAxis) {
                     switch (type) {
                         case 'line':
                             return [{
                  			label: \`\${yAxis} vs \${xAxis}\`,
                  			data: data.map(item => ({
                  				x: item[xAxis],
                  				y: item[yAxis]
                  			})),
                  				fill: false, // change to true for area plot & false for line chart
                  				backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  				borderColor: 'rgba(75, 192, 192, 1)',
                  				borderWidth: 1,
                             }];
                         case 'pie':
						 case 'doughnut':
                             return [{
                                 label: yAxis,
                                 data: data.map(item => item[yAxis]),
                                 backgroundColor: getRandomColors(data.length),
                                 borderColor: getRandomColors(data.length, false), // true to random color
                                 borderWidth: 1,
								 animation: {
									animateRotate: true,
									animateScale: true,
									duration: 800,
									easing: easingSelect.value
								}
                             }];
						case 'histogram':
							return [{
								label: yAxis,
								data: data.map(item => ({
									x: item[xAxis], // xAxis typically represents the bin range
									y: item[yAxis]
								})),
								backgroundColor: 'rgba(75, 192, 192, 0.5)', // More transparent color
								borderColor: 'rgba(75, 192, 192, 0.8)',
								borderWidth: 1,
								barPercentage: 1.0, // Full bar width
								categoryPercentage: 1.0,
								type: 'bar',
								// Additional histogram-specific settings
								// e.g., custom bins or scaling might be added here
							}];
                         case 'boxplot':
                             return [{
                                 label: yAxis,
                                 data: [
                                     {
                                         min: Math.min(...data.map(item => item[yAxis])),
                                         q1: calculateQuartile(data.map(item => item[yAxis]), 1),
                                         median: calculateMedian(data.map(item => item[yAxis])),
                                         q3: calculateQuartile(data.map(item => item[yAxis]), 3),
                                         max: Math.max(...data.map(item => item[yAxis])),
                                     }
                                 ],
                                 backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                 borderColor: 'rgba(75, 192, 192, 1)',
                                 borderWidth: 1,
                             }];
                         case 'area':
                             return [{
                                 label: \`\${yAxis} vs \${xAxis}\`,
                  			data: data.map(item => ({
                  				x: item[xAxis],
                  				y: item[yAxis]
                  			})),
                  			fill: 'origin',
                  			backgroundColor: 'rgba(75, 191, 191, 0.2)',
                  			borderColor: 'rgba(75, 191, 191, 1)',
                  			borderWidth: 1,
                             }];
                         case 'bubble':
                             return [{
                  			label: \`\${yAxis} vs \${xAxis} (Radius: \${zAxis})\`,
                  			data: data.map(item => ({
                  				x: item[xAxis],
                  				y: item[yAxis],
                  				r: type === 'bubble' ? (item[zAxis] || 5) : undefined
                  			})),
                  			backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  			borderColor: 'rgba(75, 192, 192, 1)',
                  			borderWidth: 1,
                             }];
                         case 'pareto':
                             return [{
                  			label: \`\${yAxis} (Bars)\`,
                  			type: 'bar',
                  			data: data.map(item => item[yAxis]),
                  			backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  			borderColor: 'rgba(75, 192, 192, 1)',
                  			borderWidth: 1,
                  		}, {
                  			label: 'Cumulative Percentage (Line)',
                  			type: 'line',
                  			data: data.map((item, index) => {
                  				const total = data.reduce((acc, curr) => acc + curr[yAxis], 0);
                  				const cumulative = data.slice(0, index + 1).reduce((acc, curr) => acc + curr[yAxis], 0);
                  				return (cumulative / total) * 100;
                  			}),
                  			borderColor: 'rgba(255, 99, 132, 1)',
                  			fill: false,
                  			borderWidth: 2,
                             }];
                         case 'mixed':
                             return [{
                  			label: \`\${yAxis} (Bars)\`,
                  			type: 'bar',
                  			data: data.map(item => item[yAxis]),
                  			backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  			borderColor: 'rgba(75, 192, 192, 1)',
                  			borderWidth: 1,
                  		}, {
                  			label: \`\${xAxis} (Line)\`,
                  			type: 'line',
                  			data: data.map(item => item[xAxis]),
							borderColor: 'rgba(255, 99, 132, 1)',
                  			borderWidth: 1,
                             }];
                         case 'waterfall':
                             return [{
                  			label: \`\${yAxis}\`,
                  			data: data.map(item => item[yAxis]),
                  			backgroundColor: (ctx) => {
                  				const index = ctx.dataIndex;
                  				return index % 2 === 0 ? 'rgba(75, 192, 192, 0.2)' : 'rgba(255, 99, 132,0.2)';
                  			},
                  			borderColor: (ctx) => {
                  				const index = ctx.dataIndex;
                  				return index % 2 === 0 ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)';
                  			},
                  			borderWidth: 1,
                             }];			
						case 'polarArea':
							return [{
								label: yAxis,
								data: data.map(item => item[yAxis]),
								backgroundColor: getRandomColors(data.length),
								borderColor: getRandomColors(data.length, false),
								borderWidth: 1,
								animation: {
									animateRotate: true,
									animateScale: true,
									duration: 800,
									easing: easingSelect.value
								}
							}];
						case 'radar':
							return [
								{
									label: \`\${xAxis}\`,
									data: data.map(item => item[xAxis]),
									backgroundColor: 'rgba(75, 192, 192, 0.2)',
									borderColor: 'rgba(75, 192, 192, 1)',
									borderWidth: 1,
									 animation: {
										animateRotate: true,
										animateScale: true,
										duration: 500,
										easing: easingSelect.value
									 }
								},
								{
									label: \`\${yAxis}\`,
									data: data.map(item => item[yAxis]),
									backgroundColor: 'rgba(153, 102, 255, 0.2)',
									borderColor: 'rgba(153, 102, 255, 1)',
									borderWidth: 1,
									 animation: {
										animateRotate: true,
										animateScale: true,
										duration: 600,
										easing: easingSelect.value
									 }
								},
								{
									label: \`\${zAxis}\`,
									data: data.map(item => item[zAxis]),
									backgroundColor: 'rgba(255, 159, 64, 0.2)',
									borderColor: 'rgba(255, 159, 64, 1)',
									borderWidth: 1,
									 animation: {
										animateRotate: true,
										animateScale: true,
										duration: 700,
										easing: easingSelect.value
									 }
								}
							];
						case 'scatter':
							return [{
								label: \`\${yAxis} vs \${xAxis}\`,
								data: data.map(item => ({ x: item[xAxis], y: item[yAxis] })),
								backgroundColor: 'rgba(75, 192, 192, 0.2)',
								borderColor: 'rgba(75, 192, 192, 1)',
								borderWidth: 1,
							}];
						 // Add cases for other chart types
                         default:
                             return [{
                                 label: \`\${yAxis} vs \${xAxis}\`,
                                 data: data.map(item => ({
                                     x: item[xAxis],
                                     y: item[yAxis],
                                     r: type === 'bubble' ? (item[zAxis] || 5) : undefined
                                 })),
                                 fill: type === 'area',
                                 backgroundColor: 'rgba(75, 192, 192, 0.2)',
                                 borderColor: 'rgba(75, 192, 192, 1)',
                                 borderWidth: 1,
                             }];
                     }
                  }
                  
					// Helper function to get Chart.js type
					function getChartType(type) {
						const customTypes = ['histogram', 'boxplot', 'pareto', 'waterfall'];
						if (customTypes.includes(type)) {
							return 'bar'; // Custom types are mapped to 'bar'
						}
						switch (type) {
							case 'line':
							case 'bar':
							case 'bubble':
							case 'doughnut':
							case 'pie':
							case 'polarArea':
							case 'radar':
							case 'scatter':
								return type;
							case 'area':
								return 'line'; // 'area' is implemented as a 'line' chart with filling
							default:
								return 'line';
						}
					}
                  
                  function getRandomColors(count, isBorder = false) {
                     const colors = [
                         'rgba(255, 99, 132, 0.2)',
                         'rgba(54, 162, 235, 0.2)',
                         'rgba(255, 206, 86, 0.2)',
                         'rgba(75, 192, 192, 0.2)',
                         'rgba(153, 102, 255, 0.2)'
                     ];
                     const borderColors = [
                         'rgba(255, 99, 132, 1)',
                         'rgba(54, 162, 235, 1)',
                         'rgba(255, 206, 86, 1)',
                         'rgba(75, 192, 192, 1)',
                         'rgba(153, 102, 255, 1)'
                     ];
                     return Array.from({ length: count }, (_, i) => isBorder ? borderColors[i % borderColors.length] : colors[i % colors.length]);
                  }
                  
                  function calculateQuartile(arr, quartile) {
                             arr.sort((a, b) => a - b);
                             const q = (quartile / 4) * (arr.length + 1);
                             return arr[Math.floor(q) - 1];
                         }
                  
                         function calculateMedian(arr) {
                             arr.sort((a, b) => a - b);
                             const mid = Math.floor(arr.length / 2);
                             return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
                         }
                  
                         function calculateCumulativePercentage(data, field) {
                             const total = data.reduce((sum, item) => sum + item[field], 0);
                             let cumulative = 0;
                             return data.map(item => {
                                 cumulative += item[field];
                                 return (cumulative / total) * 100;
                             });
                         }
                  
                         function calculateWaterfallData(data, field) {
                             let cumulative = 0;
                             return data.map(item => {
                                 cumulative += item[field];
                                 return { x: item.Date, y: cumulative };
                             });
                         }
                  
                  
                         // Event listeners for chart type change
                         document.querySelectorAll('input[name="chartType"]').forEach(input => {
                             input.addEventListener('change', (event) => {
                                 chartType = event.target.value;
                                 createChart(chartType);
                             });
                         });

         // Add event listeners for axis selections
         xAxisSelect.addEventListener('change', () => {
             // console.log("xAxis changed:", xAxisSelect.value);
             const { headers, data } = updateAxisSelectionsAndData(markdownTable);
             createChart(chartType, headers, data);
         });
         
         yAxisSelect.addEventListener('change', () => {
             // console.log("yAxis changed:", yAxisSelect.value);
             const { headers, data } = updateAxisSelectionsAndData(markdownTable);
             createChart(chartType, headers, data);
         });
         
         zAxisSelect.addEventListener('change', () => {
             // console.log("zAxis changed:", zAxisSelect.value);
             const { headers, data } = updateAxisSelectionsAndData(markdownTable);
             createChart(chartType, headers, data);
         });
                  // Initial chart rendering
                  // createChart(chartType);

        });

    function _loadLibrary(url) {
        return new Promise(function(resolve) {
            const script = document.createElement("script");
            script.setAttribute("type", "text/javascript");
            script.setAttribute("src", url);
            script.addEventListener("load", function() {
                resolve(true);
            });
            document.body.appendChild(script);
        });
    }         
               
      </script>
   </body>
</html>
`;
}

// anp-09-graph-utility/lib/features/download.js
async function handleDownload(app, noteUUID) {
  try {
    const result = await app.prompt(
      "Select any one of the Option Below!",
      {
        inputs: [
          {
            label: "Select the format that you want to download / copy in!",
            type: "radio",
            options: [
              { label: "Download - Interactive Charts (Recommended)", value: "1" },
              { label: "Download all Tables - MD", value: "2" },
              { label: "Download all Tables - CSV", value: "4" },
              { label: "Copy all Tables from this Note to a new Note", value: "3" }
            ]
          }
        ]
      }
    );
    if (!result) return;
    const markdown = await app.getNoteContent({ uuid: noteUUID });
    const cleanedContent = extractTablesFromMarkdown(markdown);
    const transposeContent = transposeMarkdownTables(cleanedContent);
    const note = await app.notes.find(noteUUID);
    const fullNoteContent = `
Note Name: ${note.name}
Note Tags: ${note.tags}
Note UUID: ${noteUUID}

---

${cleanedContent}

---

${transposeContent}

`;
    const { YYMMDD, HHMMSS } = getCurrentDateTime();
    switch (result) {
      case "1": {
        const htmlTemplate = buildChartHtml({
          cleanedContent,
          transposeContent,
          noteName: note.name,
          noteTags: note.tags,
          noteUUID
        });
        downloadTextFile(htmlTemplate, "InteractiveCharts.html", YYMMDD, HHMMSS, noteUUID);
        break;
      }
      case "2": {
        downloadTextFile(fullNoteContent, "Markdown_Tables.md", YYMMDD, HHMMSS, noteUUID);
        break;
      }
      case "3": {
        const newNoteName = `Tables Copy ${YYMMDD}_${HHMMSS}`;
        const newTagName = ["-reports/-tables-copy"];
        const newNoteUUID = await app.createNote(newNoteName, newTagName);
        await app.replaceNoteContent({ uuid: newNoteUUID }, fullNoteContent);
        await app.navigate(`https://www.amplenote.com/notes/${newNoteUUID}`);
        break;
      }
      case "4": {
        const csvContent = convertMarkdownToCSV(fullNoteContent);
        downloadTextFile(csvContent, "Markdown_Tables.csv", YYMMDD, HHMMSS, noteUUID);
        break;
      }
    }
  } catch (error) {
    console.error("Error in handleDownload:", error);
    app.alert(`An error occurred: ${error.message}`);
  }
}

// anp-09-graph-utility/lib/features/viewer.js
async function handleViewer(app, noteUUID) {
  try {
    await app.setSetting("Current_Note_UUID [Do not Edit!]", noteUUID);
    await app.insertNoteContent({ uuid: noteUUID }, `<object data="plugin://${app.context.pluginUUID}" data-aspect-ratio="2" />`);
  } catch (error) {
    console.error("Error in handleViewer:", error);
    app.alert(`An error occurred in Viewer: ${error.message}`);
  }
  return null;
}

// anp-09-graph-utility/lib/features/update.js
async function handleUpdate(app, noteUUID) {
  try {
    await app.setSetting("Current_Note_UUID [Do not Edit!]", noteUUID);
    app.alert("Current Note is updated for your Graph Utlity Viewer!");
  } catch (error) {
    console.error("Error in handleUpdate:", error);
    app.alert(`An error occurred while updating settings: ${error.message}`);
  }
  return null;
}

// anp-09-graph-utility/lib/features/renderEmbed.js
async function handleRenderEmbed(app, ...args) {
  try {
    const noteUUID = await app.settings["Current_Note_UUID [Do not Edit!]"];
    if (!noteUUID) {
      return "<h1>Please set a note UUID in settings using the 'Update!' option first.</h1>";
    }
    const markdown = await app.getNoteContent({ uuid: noteUUID });
    if (!markdown) {
      return "<h1>Note content is empty or note could not be found.</h1>";
    }
    const cleanedContent = extractTablesFromMarkdown(markdown);
    const transposeContent = transposeMarkdownTables(cleanedContent);
    const note = await app.notes.find(noteUUID);
    if (!note) {
      return "<h1>Could not find the target note.</h1>";
    }
    const htmlTemplate = buildChartHtml({
      cleanedContent,
      transposeContent,
      noteName: note.name,
      noteTags: note.tags,
      noteUUID
    });
    return htmlTemplate;
  } catch (error) {
    console.error("Error in handleRenderEmbed:", error);
    return `<h1>Error rendering embed: ${error.message}</h1>`;
  }
}

// anp-09-graph-utility/Graph Utility.js
var plugin = {
  noteOption: {
    "Download!": handleDownload,
    "Viewer!": handleViewer,
    "Update!": handleUpdate
  },
  /* ----------------------------------- */
  async renderEmbed(app, ...args) {
    return handleRenderEmbed(app, ...args);
  }
  /* ----------------------------------- */
};
var Graph_Utility_default = plugin;


return Graph_Utility_default;
})()