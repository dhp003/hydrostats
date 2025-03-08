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
        globalData = data;
        updateChart(selectedParticipant);
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
