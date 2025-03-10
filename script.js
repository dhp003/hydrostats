document.addEventListener("DOMContentLoaded", function () {
    const toggleOptions = document.querySelectorAll(".toggle-option");
    const toggleBackground = document.querySelector(".toggle-background");
    const dataBox = document.getElementById("data-box");
    const intervalSlider = document.getElementById("interval-slider");
    const intervalValueDisplay = document.getElementById("interval-value");
    const waveEl = document.querySelector(".wave");

    let globalData = [];
    let selectedParticipant = 2; // Default participant
    let selectedInterval = 0;    // Default running interval

    // Define weight mapping (adjust these based on your data)
    const minWeight = 70;  // Minimum expected weight (kg)
    const maxWeight = 90;  // Maximum expected weight (kg)

    // Color mapping for temperatures
    function getColor(temp) {
        if (temp < 30) return "#3d85c6";
        if (temp < 33) return "#9fc5e8";
        if (temp < 36) return "#e06666";
        return "#cc0000";
    }

    // Update the sliding background for the toggle
    function updateBackground() {
        const selectedButton = document.querySelector(".toggle-option.selected");
        if (!selectedButton) return;

        const buttonWidth = selectedButton.offsetWidth;
        const buttonLeft = selectedButton.offsetLeft;
        const extraPadding = 12;
        toggleBackground.style.width = `${buttonWidth + extraPadding}px`;
        toggleBackground.style.transform = `translateX(${buttonLeft - extraPadding / 2}px)`;
    }

    // Update the cup fill level (the .wave element) based on dynamic weight.
    // Here we map the weight to a percentage fill of the cup.
    function updateWaterCup(weight) {
        // Clamp weight to our expected range.
        const clampedWeight = Math.max(minWeight, Math.min(maxWeight, weight));
        // Calculate fill percentage: 0% at minWeight, 100% at maxWeight.
        const fillPercent = ((clampedWeight - minWeight) / (maxWeight - minWeight)) * 100;
        // Set the .wave element height accordingly.
        waveEl.style.height = `${fillPercent}%`;
    }

    // Update the SVG visualization, cup fill, and data box.
    function updateChart(participantId) {
        // Get the static row (running interval 0) for static info.
        const staticRow = globalData.find(d => +d.id === participantId && +d["running interval"] === 0);
        if (!staticRow) {
            console.warn("No static data found for participant", participantId);
            return;
        }
        
        // Get the dynamic row for the current interval (or fall back to staticRow).
        const dynamicRow = globalData.find(d => +d.id === participantId && +d["running interval"] === selectedInterval) || staticRow;

        // Update the data box (using static info for age and speed, dynamic weight).
        dataBox.innerHTML = `
            <p><strong>Age:</strong> ${staticRow["age [years]"]} years</p>
            <p><strong>Speed:</strong> ${staticRow["running speed [km/h]"]} km/h</p>
            <p><strong>Weight:</strong> ${dynamicRow["weight measured using Kern DE 150K2D [kg]"]} kg</p>
            <p><strong>Interval:</strong> ${selectedInterval}</p>
        `;

        // Update the cup fill based on dynamic weight.
        const dynamicWeight = +dynamicRow["weight measured using Kern DE 150K2D [kg]"];
        updateWaterCup(dynamicWeight);

        // Parse temperature values from dynamicRow.
        const earTemp   = +dynamicRow["temperature ear [degree C]"];
        const chestTemp = +dynamicRow["temperature chest [degree C]"];
        const backTemp  = +dynamicRow["temperature back [degree C]"];
        const leftHand  = +dynamicRow["temperature left hand [degree C]"];
        const rightHand = +dynamicRow["temperature right hand [degree C]"];
        const leftFoot  = +dynamicRow["temperature left foot [degree C]"];
        const rightFoot = +dynamicRow["temperature right foot [degree C]"];
        const upperArm  = +dynamicRow["temperature upper arm [degree C]"];
        const lowerArm  = +dynamicRow["temperature lower arm [degree C]"];
        const upperLeg  = +dynamicRow["temperature upper leg [degree C]"];
        const lowerLeg  = +dynamicRow["temperature lower leg [degree C]"];

        // Update human SVG colors based on temperature values.
        d3.select("#head").attr("fill", getColor(earTemp));
        const avgTorso = (chestTemp + backTemp) / 2;
        d3.select("#torso").attr("fill", getColor(avgTorso));
        d3.select("#leftArm").attr("fill", getColor(leftHand));
        d3.select("#rightArm").attr("fill", getColor(rightHand));
        const avgLeg = (upperLeg + lowerLeg) / 2;
        d3.select("#leftLeg").attr("fill", getColor(avgLeg));
        d3.select("#rightLeg").attr("fill", getColor(avgLeg));
        d3.select("#leftFoot").attr("fill", getColor(leftFoot));
        d3.select("#rightFoot").attr("fill", getColor(rightFoot));
    }

    // Load the CSV data once.
    d3.csv("data.csv").then(function (data) {
        globalData = data.map(d => ({
            id: +d.id, // convert to number
            "running interval": +d["running interval"],
            "temperature ear [degree C]": +d["temperature ear [degree C]"],
            "temperature chest [degree C]": +d["temperature chest [degree C]"],
            "temperature back [degree C]": +d["temperature back [degree C]"],
            "temperature left hand [degree C]": +d["temperature left hand [degree C]"],
            "temperature right hand [degree C]": +d["temperature right hand [degree C]"],
            "temperature left foot [degree C]": +d["temperature left foot [degree C]"],
            "temperature right foot [degree C]": +d["temperature right foot [degree C]"],
            "temperature upper arm [degree C]": +d["temperature upper arm [degree C]"],
            "temperature lower arm [degree C]": +d["temperature lower arm [degree C]"],
            "temperature upper leg [degree C]": +d["temperature upper leg [degree C]"],
            "temperature lower leg [degree C]": +d["temperature lower leg [degree C]"],
            "weight measured using Kern DE 150K2D [kg]": +d["weight measured using Kern DE 150K2D [kg]"],
            "age [years]": +d["age [years]"],
            "running speed [km/h]": +d["running speed [km/h]"]
        }));

        updateChart(selectedParticipant);

        // tooltip
        const tooltip = d3.select("#temperature-tooltip");

        // Listening to mouseovers on body parts 
        d3.selectAll("#human-svg rect, #human-svg circle, #human-svg ellipse")
            .on("mouseenter", function(event) {
                let partId = d3.select(this).attr("id");

                let partNameMapping = {
                    "head": "temperature ear [degree C]",
                    "torso": "temperature chest [degree C]",
                    "leftArm": "temperature left hand [degree C]",
                    "rightArm": "temperature right hand [degree C]",
                    "leftLeg": "temperature upper leg [degree C]",
                    "rightLeg": "temperature upper leg [degree C]",
                    "leftFoot": "temperature left foot [degree C]",
                    "rightFoot": "temperature right foot [degree C]"
                };

                let tempField = partNameMapping[partId];
                if (!tempField) return;

                // set tooltip position
                tooltip
                    .classed("hidden", false)
                    .classed("visible", true)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`);

                d3.select("#tooltip-title").text(`Temperature Trend: ${partId} (Interval ${selectedInterval})`);

                // Get the temperature data of the currently selected participant
                let temperatureData = globalData.filter(d => d.id === selectedParticipant)
                                                .map(d => ({ interval: d["running interval"], temp: d[tempField] }));

                // Call the function to draw the line chart.
                drawTooltipChart(temperatureData);
            })

            .on("mousemove", function(event) {
                tooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`);
            })
            .on("mouseleave", function() {
                tooltip.classed("hidden", true).classed("visible", false);
            });
            });

            // Update slider display and chart when the slider changes.
            intervalSlider.addEventListener("input", function () {
                selectedInterval = +this.value;
                intervalValueDisplay.textContent = this.value;
                updateChart(selectedParticipant);
            });

            // Update toggle background on window resize.
            window.addEventListener("resize", updateBackground);
            updateBackground();

            // Set up click handlers for participant toggle options.
            toggleOptions.forEach(option => {
                option.addEventListener("click", function () {
                    toggleOptions.forEach(btn => btn.classList.remove("selected"));
                    this.classList.add("selected");

                    selectedParticipant = parseInt(this.dataset.participant, 10);
                    updateBackground();
                    updateChart(selectedParticipant);
                });
            });
});

function drawTooltipChart(temperatureData) {
    let svg = d3.select("#tooltip-chart");
    svg.selectAll("*").remove();
    
    let width = 250, height = 150;
    let margin = { top: 20, right: 20, bottom: 30, left: 40 };
    
    let xScale = d3.scaleLinear()
        .domain([0, 8])
        .range([margin.left, width - margin.right]);
    
    let yScale = d3.scaleLinear()
        .domain([d3.min(temperatureData, d => d.temp) - 1, d3.max(temperatureData, d => d.temp) + 1])
        .range([height - margin.bottom, margin.top]);
    
    let line = d3.line()
        .x(d => xScale(d.interval))
        .y(d => yScale(d.temp));
    
    // X-axis
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).tickValues([0,1,2,3,4,5,6,7,8]));

    // Y-axis
    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale).ticks(5));
    
    // line
    svg.append("path")
        .datum(temperatureData)
        .attr("fill", "none")
        .attr("stroke", "#8a2be2")
        .attr("stroke-width", 2)
        .attr("d", line);
    
    // point
    svg.selectAll("circle")
        .data(temperatureData)
        .enter().append("circle")
        .attr("cx", d => xScale(d.interval))
        .attr("cy", d => yScale(d.temp))
        .attr("r", 4)
        .attr("fill", "#ff8c00");
    }
    