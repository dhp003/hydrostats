// Load CSV data once
d3.csv("dehydration_estimation.csv").then(function(data) {
    console.log("Full Data:", data); // Debugging

    // Convert 'id' to numbers
    data.forEach(d => {
        d.id = +d.id;
        d["weight measured using Kern DE 150K2D [kg]"] = +d["weight measured using Kern DE 150K2D [kg]"];
        d["temperature ear [degree C]"] = +d["temperature ear [degree C]"];
        d["temperature left hand [degree C]"] = +d["temperature left hand [degree C]"];
        d["temperature right hand [degree C]"] = +d["temperature right hand [degree C]"];
        d["temperature left foot [degree C]"] = +d["temperature left foot [degree C]"];
        d["temperature right foot [degree C]"] = +d["temperature right foot [degree C]"];
        d["temperature chest [degree C]"] = +d["temperature chest [degree C]"];
    });

    // Restrict dropdown to only IDs 2, 7, and 8
    let allowedIds = [2, 7, 8, 5];

    // Populate the dropdown menu
    let dropdown = d3.select("#id-select");
    dropdown.selectAll("option")
        .data(allowedIds)
        .enter()
        .append("option")
        .text(d => `ID ${d}`)
        .attr("value", d => d);

function updateData(selectedId, timeIndex) {
    let filteredData = data.filter(d => d.id === selectedId);
    console.log("Filtered Data:", filteredData);

    // Get subject details
    let subjectDetails = filteredData[0];

    // Update bullet point description
    d3.select("#id-display").text(subjectDetails.id);
    d3.select("#age-display").text(subjectDetails["age [years]"]);
    d3.select("#height-display").text(subjectDetails["height [cm]"]);
    d3.select("#speed-display").text(subjectDetails["running speed [km/h]"]);

    // Update dehydration level (weight)
    let weightValue = filteredData[timeIndex]["weight measured using Kern DE 150K2D [kg]"];
    d3.select("#weight-display").text(weightValue.toFixed(2));

    // Update time display
    d3.select("#time-display").text(`Time: ${timeIndex}`);

    // Update temperature chart (pass timeIndex to move dotted line)
    updateChart(filteredData, timeIndex);

    // === Water Bottle Animation Fix === //

    let minHydration = 75;  // Lowest hydration value
    let maxHydration = 90;  // Highest hydration value
    let maxWaterHeight = 160;  // Maximum height of water inside the bottle
    let bottleBottomY = 180; // Y position of bottle bottom

    // Ensure a minimum water height so it never disappears
    let waterHeight = ((weightValue - minHydration) / (maxHydration - minHydration)) * maxWaterHeight;
    waterHeight = Math.max(10, Math.min(maxWaterHeight, waterHeight)); // At least 10px high

    // The fix: Ensure `y` position places the water at the bottom!
    let newWaterY = bottleBottomY - waterHeight;

    // Animate water level
    d3.select("#water-level")
        .transition()
        .duration(300)
        .attr("y", newWaterY) // Moves the water up correctly
        .attr("height", waterHeight); // Adjusts water fill smoothly
}



    // Function to update temperature line chart with dotted indicator
    function updateChart(filteredData, timeIndex) {
        let svg = d3.select("#temperature-chart");
        svg.selectAll("*").remove(); // Clear previous chart

        // Define scales
        let xScale = d3.scaleLinear().domain([0, 8]).range([50, 550]);  // Time intervals (0 to 8)
        let yScale = d3.scaleLinear().domain([20, 40]).range([350, 50]); // Temperature range (20 to 40°C)

        let bodyParts = [
            "temperature ear [degree C]",
            "temperature left hand [degree C]",
            "temperature right hand [degree C]",
            "temperature left foot [degree C]",
            "temperature right foot [degree C]",
            "temperature chest [degree C]"
        ];

        let colors = d3.schemeCategory10; // Assign different colors

        // Draw lines for each body part
        bodyParts.forEach((part, i) => {
            let line = d3.line()
                .x((d, idx) => xScale(idx))
                .y(d => yScale(d[part]));

            svg.append("path")
                .datum(filteredData)
                .attr("fill", "none")
                .attr("stroke", colors[i])
                .attr("stroke-width", 2)
                .attr("d", line);
        });

        // X-axis
        svg.append("g")
            .attr("transform", "translate(0, 350)")
            .call(d3.axisBottom(xScale).ticks(9))
            .append("text")
            .attr("x", 300)
            .attr("y", 40)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .text("Time Interval");

        // Y-axis
        svg.append("g")
            .attr("transform", "translate(50, 0)")
            .call(d3.axisLeft(yScale))
            .append("text")
            .attr("x", -200)
            .attr("y", -40)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .text("Temperature (°C)");

        // Move legend outside the chart
        let legend = svg.append("g")
            .attr("transform", "translate(500 , 50)"); // Move legend fully to the right

        bodyParts.forEach((part, i) => {
            legend.append("rect")
                .attr("x", 0)
                .attr("y", i * 20)
                .attr("width", 12)
                .attr("height", 12)
                .attr("fill", colors[i]);

            legend.append("text")
                .attr("x", 20)
                .attr("y", i * 20 + 10)
                .attr("fill", "black")
                .style("font-size", "12px")
                .text(part.replace("temperature ", "").replace(" [degree C]", ""));
        });

        // Dotted line indicator (initial position)
        let indicatorLine = svg.append("line")
            .attr("x1", xScale(timeIndex))
            .attr("x2", xScale(timeIndex))
            .attr("y1", 50)
            .attr("y2", 350)
            .attr("stroke", "black")
            .attr("stroke-dasharray", "5,5") // Makes the line dotted
            .attr("stroke-width", 2);

        // Store indicator line globally so it updates properly
        d3.select("#time-slider").on("input", function() {
            let newTime = +this.value;
            let selectedId = +d3.select("#id-select").property("value");

            // Move the indicator line
            indicatorLine
                .transition().duration(100)
                .attr("x1", xScale(newTime))
                .attr("x2", xScale(newTime));

            // Update weight value & chart
            updateData(selectedId, newTime);
        });
    }

    // Set default selection to ID 2 and time 0
    updateData(2, 0);

    // Add event listeners for dropdown
    d3.select("#id-select").on("change", function() {
        let selectedId = +this.value;
        let timeIndex = +d3.select("#time-slider").property("value");
        updateData(selectedId, timeIndex);
    });

}).catch(function(error) {
    console.error("Error loading the CSV file:", error);
});

