document.getElementById("start-btn").addEventListener("click", () => {
  const eventSource = new EventSource("/start-simulation-stream");
 const canvases = document.getElementsByTagName("canvas");
for (let canvas of canvases) {
  canvas.style.display = "block";
}

  eventSource.onmessage = function(event) {
    const agent = JSON.parse(event.data);
    addAgentToTable(agent);
    updateLiveCharts(agent);
  };

});

let agentsReceived = [];
let allPlugVectors = [];
let batteryChart, plugChart;


function addAgentToTable(agent) {
  const tbody = document.querySelector("#agent-table tbody");
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${agent.name}</td>
    <td>${agent.plug_in_time.toFixed(2)}</td>
    <td>${agent.plug_out_time.toFixed(2)}</td>
    <td>${(agent.plug_in_soc.toFixed(2)*100).toFixed(0)}%</td>
    <td>${sparklineCombo(agent.battery_vector, agent.plug_vector)}</td>
  `;
  tbody.appendChild(row);
}


function averagePercentile(arr, p, direction) {
  if (!arr.length) return 0;

  const sorted = arr.slice().sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  const threshold = (lower === upper)
    ? sorted[lower]
    : sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);

  const filtered = direction === 'upper'
    ? arr.filter(v => v >= threshold)
    : arr.filter(v => v <= threshold);

  if (!filtered.length) return 0;
  const sum = filtered.reduce((acc, val) => acc + val, 0);
  return sum / filtered.length;
}


function updateLiveCharts(agent) {
  agentsReceived.push(agent);
  allPlugVectors.push(agent.plug_vector);

  const hourlyBattery = new Array(24).fill(0);
  const plugCount = new Array(24).fill(0);

  agentsReceived.forEach(agent => {
    agent.battery_vector.forEach((val, hour) => {
      hourlyBattery[hour] += val;
    });
  });

  const avgBattery = hourlyBattery.map(val => val / agentsReceived.length);
  const avgPlugVector = computeMeanPlugVector();
  const hourlyValues = [...Array(24)].map((_, hour) =>
  agentsReceived.map(agent => agent.battery_vector[hour])
  );

const p95Upper = hourlyValues.map(hourVals => averagePercentile(hourVals, 95, 'upper'));
const p95Lower = hourlyValues.map(hourVals => averagePercentile(hourVals, 5, 'lower'));

agentsReceived.forEach(agent => {
  agent.plug_vector.forEach((val, hour) => {
    plugCount[hour] += val; // val is either 0 or 1
  });
});

const plugPercent = plugCount.map(count => (count / agentsReceived.length) * 100);

  updateCharts(avgBattery, plugPercent, avgPlugVector, p95Upper, p95Lower);
}


function computeMeanPlugVector() {
  const hourlySums = new Array(24).fill(0);

  agentsReceived.forEach(agent => {
    agent.plug_vector.forEach((val, hour) => {
      hourlySums[hour] += val;
    });
  });

  const mean = hourlySums.map(val => val / agentsReceived.length);
  return mean.map(val => Math.round(val));
}


function updateCharts(avgBattery, plugPercent, avgPlugVector, p95Upper, p95Lower) {
  if (!batteryChart) {
    const ctx1 = document.getElementById('batteryChart').getContext('2d');
    batteryChart = new Chart(ctx1, {
      type: 'line',
      data: {
        labels: [...Array(24).keys()].map(h => `${h}:00`),
        // labels: [...Array(24).keys()].map(h => `${(h + 15) % 24}:00`),

        datasets: [
          {
            label: "Avg SoC",
            data: avgBattery,
            borderColor: "#468B97",
            fill: false
          },
          {
            label: "Avg plugged-in window",
            backgroundColor: "rgba(255, 165, 0, 0.3)", // orange with 50% transparency
            fill: true,
            stepped: true,
            borderWidth: 0,
            pointRadius: 0,
            yAxisID: "y"
          },


        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 1,
            title: {
              display: true,
              text: "SoC / Plug Probability"
            }
          }
        }
      }
    });

    const ctx2 = document.getElementById('plugChart').getContext('2d');
    plugChart = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels: [...Array(24).keys()].map(h => `${h}:00`),
        datasets: [{
          label: "% Plugged In",
          data: plugPercent,
          backgroundColor: "#798E37",
          order: 2
        },
                  {
            label: "Avg Battery Charge",
            data: avgBattery,
            type: 'line',
            borderColor: "#468B97",
            backgroundColor: "rgba(70, 139, 151, 0.2)",
            fill: false,
            tension: 0.3,
            yAxisID: "y2",
            order: 1
          },
            {
  label: '95% Upper',
  data: p95Upper,
  type: 'line',
  fill: '-1',
  backgroundColor: 'rgba(70, 139, 151, 0.1)',
  borderWidth: 0,
  pointRadius: 0,
  yAxisID: 'y2',
  order: 1
},
{
  label: '95% Lower',
  data: p95Lower,
  type: 'line',
  fill: '-1',
  borderWidth: 0,
  pointRadius: 0,
  yAxisID: 'y2',
  order: 0
}
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          },

          y2: {
                  beginAtZero: true,
      max: 1,
      position: 'right',
      grid: {
        drawOnChartArea: false
      },
      title: {
        display: true,
        text: 'State of Charge'
      }
          }

        }
      }
    });
  } else {
    batteryChart.data.datasets[0].data = avgBattery;
    batteryChart.data.datasets[1].data = avgPlugVector;
    batteryChart.update();

    plugChart.data.datasets[0].data = plugPercent;
    plugChart.data.datasets[1].data = avgBattery;
    plugChart.data.datasets[2].data = p95Lower;
    plugChart.data.datasets[3].data = p95Upper;
    plugChart.update();
  }
}


function sparklineCombo(batteryVector, plugVector) {
  const id = `spark-${Math.random().toString(36).substr(2, 9)}`;

  setTimeout(() => {
    const canvas = document.getElementById(id);
    if (!canvas) return;

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: batteryVector.map((_, i) => i),
        datasets: [
          {
            data: plugVector,
            backgroundColor: 'rgba(121, 142, 55, 0.5)',
            borderColor: 'transparent',
            fill: true,
            stepped: true,
            pointRadius: 0,
            borderWidth: 0
          },
          {
            data: batteryVector,
            borderColor: '#468B97',
            backgroundColor: 'transparent',
            fill: false,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        scales: {
          x: { display: false },
          y: { display: false }
        },
        layout: { padding: 2 }
      }
    });
  }, 0);

  return `<canvas id="${id}" width="100" height="30"  style="background: transparent; padding:0px; border: none;"></canvas>`;
}


