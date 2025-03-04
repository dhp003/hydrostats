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
    let allowedIds = [2, 7, 8];

    // Populate the dropdown menu
    let dropdown = d3.select("#id-select");
    dropdown.selectAll("option")
        .data(allowedIds)
        .enter()
        .append("option")
        .text(d => `ID ${d}`)
        .attr("value", d => d);

    // Function to update data when ID or time changes
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

        // Update temperature chart
        updateChart(filteredData);
    }

    // Function to update temperature line chart
    function updateChart(filteredData) {
        let svg = d3.select("#temperature-chart");
        svg.selectAll("*").remove(); // Clear previous chart

        // Define scales
        let xScale = d3.scaleLinear().domain([0, 9]).range([50, 550]);
        let yScale = d3.scaleLinear().domain([20, 40]).range([350, 50]);

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
            .call(d3.axisBottom(xScale).ticks(9));

        // Y-axis
        svg.append("g")
            .attr("transform", "translate(50, 0)")
            .call(d3.axisLeft(yScale));

        // Legend
        bodyParts.forEach((part, i) => {
            svg.append("text")
                .attr("x", 480)
                .attr("y", 50 + i * 20)
                .attr("fill", colors[i])
                .text(part.replace("temperature ", "").replace(" [degree C]", ""))
                .attr("transform", "translate(45, 50)");
        });
    }

    // Set default selection to ID 2 and time 0
    updateData(2, 0);

    // Add event listeners for dropdown and slider
    d3.select("#id-select").on("change", function() {
        let selectedId = +this.value;
        let timeIndex = +d3.select("#time-slider").property("value");
        updateData(selectedId, timeIndex);
    });


    d3.select("#time-slider").on("input", function() {
        let timeIndex = +this.value;
        let selectedId = +d3.select("#id-select").property("value");
        updateData(selectedId, timeIndex);
    });

}).catch(function(error) {
    console.error("Error loading the CSV file:", error);
});
