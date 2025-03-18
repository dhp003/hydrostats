document.addEventListener("DOMContentLoaded", function () {
    const toggleOptions = document.querySelectorAll(".toggle-option");
    const toggleBackground = document.querySelector(".toggle-background");
    const dataBox = document.getElementById("data-box");
    const intervalSlider = document.getElementById("interval-slider");
    const intervalValueDisplay = document.getElementById("interval-value");
    intervalValueDisplay.textContent = '0 minutes of running';
    const waveEl = document.querySelector(".wave");

    let globalData = [];
    let selectedParticipant = 2; // Default participant
    let selectedInterval = 0;    // Default running interval
    let baselineWeight;          // Store the static (baseline) weight in kg

    // Set the maximum expected weight loss in ounces that represents a full cup.
    const maxOuncesLoss = 100;  // Adjust this value based on your scale
    const waterToWeightRatio = 0.70;

    // Color mapping for temperatures
    function getColor(temp) {
        if (temp < 28) return "#287bc5";
        if (temp < 30) return "#59a4e8";
        if (temp < 32) return "#9fc5e8";
        if (temp < 34) return "#FFA7B0";
        if (temp < 36) return "#FF7070";
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

    // Create y-axis for the water cup (if needed for your visualization)
    function makeAxis() {
        const svg = d3.select("#axis");
        svg.selectAll("*").remove();
        const yScale = d3.scaleLinear()
            .domain([0, maxOuncesLoss])
            .range([500, 0]);

        svg.append('g')
            .attr('class', 'gridlines')
            .attr('transform', `translate(50, 32)`)
            .call(d3.axisLeft().scale(yScale));
    }

    // Update the cup fill based on the lost weight (in ounces).
    // At baseline, lost weight is zero so the cup remains empty.
    function updateWaterCup(currentWeight) {
        const lostKg = baselineWeight - currentWeight;
        const lostOunces = lostKg * 35.274 * waterToWeightRatio;
        let fillPercent = (lostOunces / maxOuncesLoss) * 100;
        fillPercent = Math.max(0, Math.min(fillPercent, 100));
        waveEl.style.height = `${fillPercent}%`;
    }


    function updateChart(participantId) {
        // Get the static row (interval 0) for baseline weight.
        const staticRow = globalData.find(d => +d.id === participantId && +d["running interval"] === 0);
        if (!staticRow) {
            console.warn("No static data found for participant", participantId);
            return;
        }
        baselineWeight = staticRow["weight measured using Kern DE 150K2D [kg]"];
        makeAxis();
    
        // Get the dynamic row for the current interval (fall back to staticRow if not found).
        const dynamicRow = globalData.find(d => +d.id === participantId && +d["running interval"] === selectedInterval) || staticRow;
    
        // Calculate the current weight and lost ounces.
        const currentWeight = +dynamicRow["weight measured using Kern DE 150K2D [kg]"];
        const lostKg = baselineWeight - currentWeight;
        const lostOunces = lostKg * 35.274 * waterToWeightRatio;
    
        // Update the data box with additional stat for lost ounces.
        dataBox.innerHTML = `
            <p><strong>Age:</strong> ${staticRow["age [years]"]} years</p>
            <p><strong>Speed:</strong> ${staticRow["running speed [km/h]"]} km/h</p>
            <p><strong>Weight:</strong> ${currentWeight} kg</p>
            <p><strong>Water Lost Proxy:</strong> ${lostOunces.toFixed(2)} oz</p>
            <p><strong>Interval:</strong> ${selectedInterval}</p>
        `;
    
        // Update the cup fill based on the weight lost.
        updateWaterCup(currentWeight);
    
        // Update the human SVG colors based on temperature values.
        const earTemp = +dynamicRow["temperature ear [degree C]"];
        const chestTemp = +dynamicRow["temperature chest [degree C]"];
        const backTemp = +dynamicRow["temperature back [degree C]"];
        const leftHand = +dynamicRow["temperature left hand [degree C]"];
        const rightHand = +dynamicRow["temperature right hand [degree C]"];
        const leftFoot = +dynamicRow["temperature left foot [degree C]"];
        const rightFoot = +dynamicRow["temperature right foot [degree C]"];
        const upperArm = +dynamicRow["temperature upper arm [degree C]"];
        const lowerArm = +dynamicRow["temperature lower arm [degree C]"];
        const upperLeg = +dynamicRow["temperature upper leg [degree C]"];
        const lowerLeg = +dynamicRow["temperature lower leg [degree C]"];
    
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
    

    // Load the CSV data.
    d3.csv("data.csv").then(function (data) {
        globalData = data.map(d => ({
            id: +d.id,
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

        // Set the baseline weight for the default participant.
        const staticRow = globalData.find(d => d.id === selectedParticipant && d["running interval"] === 0);
        if (staticRow) {
            baselineWeight = staticRow["weight measured using Kern DE 150K2D [kg]"];
        }

        makeAxis();
        updateChart(selectedParticipant);

        // Tooltip setup for temperature trend visualization.
        const tooltip = d3.select("#temperature-tooltip");

        d3.selectAll("#human-svg rect, #human-svg circle, #human-svg ellipse")
            .on("mouseenter", function (event) {
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

                const partNames = {
                    head: "Ear",
                    torso: "Chest/Back",
                    leftArm: "Left Hand",
                    rightArm: "Right Hand",
                    leftLeg: "Left Leg",
                    rightLeg: "Right Leg",
                    leftFoot: "Left Foot",
                    rightFoot: "Right Foot"
                };

                let tempField = partNameMapping[partId];
                if (!tempField) return;

                tooltip
                    .classed("hidden", false)
                    .classed("visible", true)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY + 10}px`);

                d3.select("#tooltip-title").text(`Temperature Trend: ${partNames[partId] || partId}`);

                let temperatureData = globalData.filter(d => d.id === selectedParticipant)
                    .map(d => ({ interval: d["running interval"], temp: d[tempField] }));

                drawTooltipChart(temperatureData);
            })
            .on("mousemove", function (event) {
                const tooltipEl = tooltip.node();
                const tooltipWidth = tooltipEl.offsetWidth;
                const tooltipHeight = tooltipEl.offsetHeight;
                const offset = 10;
                let left = event.pageX + offset;
                let top = event.pageY + offset;
                if (left + tooltipWidth > window.innerWidth) {
                    left = event.pageX - tooltipWidth - offset;
                }
                if (top + tooltipHeight > window.innerHeight) {
                    top = event.pageY - tooltipHeight - offset;
                }
                tooltip.style("left", `${left}px`)
                    .style("top", `${top}px`);
            })
            .on("mouseleave", function () {
                tooltip.classed("hidden", true).classed("visible", false);
            });
    });

    // Update slider display and chart when the slider changes.
    intervalSlider.addEventListener("input", function () {
        selectedInterval = +this.value;
        intervalValueDisplay.textContent = this.value * 15 + ' minutes of running';
        updateChart(selectedParticipant);
    });

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
        .domain([20, 40])
        .range([height - margin.bottom, margin.top]);

    let line = d3.line()
        .x(d => xScale(d.interval))
        .y(d => yScale(d.temp));

    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).tickValues([0, 1, 2, 3, 4, 5, 6, 7, 8]));

    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale).ticks(5));

    svg.append("path")
        .datum(temperatureData)
        .attr("fill", "none")
        .attr("stroke", "#8a2be2")
        .attr("stroke-width", 2)
        .attr("d", line);

    svg.selectAll("circle")
        .data(temperatureData)
        .enter().append("circle")
        .attr("cx", d => xScale(d.interval))
        .attr("cy", d => yScale(d.temp))
        .attr("r", 4)
        .attr("fill", "#ff8c00");
}

function getColor(temp) {
    if (temp < 28) return "#287bc5";  // Very Cool
    if (temp < 30) return "#59a4e8";  // Cool
    if (temp < 32) return "#9fc5e8";  // Neutral
    if (temp < 34) return "#FFA7B0";  // Warm
    if (temp < 36) return "#FF7070";  // Hot
    return "#cc0000";  // Very Hot
}
